// Server-only module: Lovable AI Gateway access, chat auth, and persistence.
// Never import this from client code — it reads server secrets.

import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";

import { INITIAL_JOBS } from "./mockData";

const AI_GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev/v1";
const CAREER_AGENT_MODEL = "openai/gpt-6-astra";
const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

// Reuses the gateway-issued run id across follow-up calls in the same request.
export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER))
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
  };
}

export function getLovableAiGatewayRunId(request: Request): string | undefined {
  return request.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
}

export function withLovableAiGatewayRunIdHeader(
  response: Response,
  runIdFetch: { getRunId: () => string | undefined },
): Response {
  const runId = runIdFetch.getRunId();
  if (!runId) return response;
  const headers = new Headers(response.headers);
  headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function buildJobCatalog(): string {
  return INITIAL_JOBS.map(
    (j) =>
      `- ${j.title} at ${j.company} — ${j.location} (${j.workplaceType}), ${j.experienceLevel}, ` +
      `₹${Math.round(j.salaryMin / 100000)}–${Math.round(j.salaryMax / 100000)} LPA, skills: ${j.skills.join(", ")}`,
  ).join("\n");
}

const ASSISTANT_INSTRUCTIONS = `You are Nexa, the JobNex career assistant. You help job seekers with two things:
1. Suggesting roles from the current JobNex listings (below). Suggest at most 3, with a one-line reason each.
2. Answering career questions: resumes, interviews, skill gaps, salary talks, career switches.

Tone: professional, calm, no hype, no exclamation marks. Keep answers short and practical.
If asked about something unrelated to careers or jobs, politely steer back.

Current JobNex listings:
${buildJobCatalog()}`;

function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

// User-scoped Supabase client: the caller's bearer token + the publishable key.
// New sb_* keys are opaque, so strip them from Authorization and send apikey.
function createUserClient(supabaseUrl: string, publishableKey: string, accessToken: string) {
  const keyedFetch: typeof fetch = (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (headers.get("Authorization") === `Bearer ${publishableKey}`)
      headers.delete("Authorization");
    headers.set("apikey", publishableKey);
    headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(input, { ...init, headers });
  };
  return createClient(supabaseUrl, publishableKey, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: keyedFetch },
  });
}

export async function handleCareerAgent(request: Request): Promise<Response> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const supabaseUrl = process.env["SUPABASE_URL"];
  const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!apiKey) return jsonError(500, "AI is not configured.");
  if (!supabaseUrl || !publishableKey) return jsonError(500, "Backend is not configured.");

  const accessToken = request.headers
    .get("Authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  if (!accessToken) return jsonError(401, "Sign in to chat with the assistant.");

  const supabase = createUserClient(supabaseUrl, publishableKey, accessToken);
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) return jsonError(401, "Sign in to chat with the assistant.");
  const userId = userData.user.id;

  let body: { messages?: UIMessage[]; threadId?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request body.");
  }
  const { messages, threadId } = body;
  if (!Array.isArray(messages) || messages.length === 0)
    return jsonError(400, "Messages are required.");
  if (!threadId) return jsonError(400, "A chat thread is required.");

  // RLS scopes this to the caller; no row means the thread is not theirs.
  const { data: thread, error: threadError } = await supabase
    .from("chat_threads")
    .select("id, title")
    .eq("id", threadId)
    .maybeSingle();
  if (threadError) return jsonError(500, "Could not load the chat thread.");
  if (!thread) return jsonError(403, "This chat thread does not belong to you.");

  // Persist the new user message (the last one in the list).
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user") {
    const { error: insertError } = await supabase.from("chat_messages").insert({
      thread_id: threadId,
      user_id: userId,
      role: "user",
      parts: lastMessage.parts ?? [],
    });
    if (insertError) return jsonError(500, "Could not save your message.");

    // Name the thread after its first user message.
    if (thread.title === "New chat") {
      const firstText =
        lastMessage.parts?.find((p) => p.type === "text" && "text" in p)?.text ?? "New chat";
      await supabase
        .from("chat_threads")
        .update({ title: firstText.slice(0, 60), updated_at: new Date().toISOString() })
        .eq("id", threadId);
    }
  }

  const modelMessages = await convertToModelMessages(messages);
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: AI_GATEWAY_BASE_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(CAREER_AGENT_MODEL),
    system: ASSISTANT_INSTRUCTIONS,
    messages: modelMessages,
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return withLovableAiGatewayRunIdHeader(
    result.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: true,
      onFinish: async ({ responseMessage }) => {
        const { error: saveError } = await supabase.from("chat_messages").insert({
          thread_id: threadId,
          user_id: userId,
          role: "assistant",
          parts: responseMessage.parts ?? [],
        });
        if (saveError)
          console.error("[agent] failed to save assistant message:", saveError.message);
        await supabase
          .from("chat_threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", threadId);
      },
    }),
    runIdFetch,
  );
}
