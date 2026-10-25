// Server-only module: Lovable AI Gateway access, chat auth, and persistence.
// Plain JavaScript implementation for backend Node.js server.

const AI_GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev/v1";
const CAREER_AGENT_MODEL = "openai/gpt-6-astra";
const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayRunIdFetch(initialRunId) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      const response = await fetch(input, { ...init, headers });
      runId = runId || response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
  };
}

export function getLovableAiGatewayRunId(request) {
  return request.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
}

export function withLovableAiGatewayRunIdHeader(response, runIdFetch) {
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

const SAMPLE_JOB_CATALOG = `
- Senior Frontend Engineer at TCS — Bangalore, India (Hybrid), 1-2 yrs, ₹12–16 LPA, skills: React, TypeScript, Tailwind CSS, REST APIs
- Data Scientist at Amazon — Hyderabad, India (On-site), 3-5 yrs, ₹28–38 LPA, skills: Python, Machine Learning, Deep Learning, SQL, AWS
- Cloud DevOps Engineer at Microsoft — Bengaluru, India (Hybrid), 3-5 yrs, ₹24–32 LPA, skills: Kubernetes, Docker, Azure, Terraform, CI/CD
- Senior Software Engineer at Google — Mountain View, CA (Hybrid), 5+ yrs, ₹55–75 LPA, skills: System Design, Java, Distributed Systems, GCP
- Business Data Analyst at Accenture — Mumbai, India (Remote), Fresher, ₹6–9 LPA, skills: SQL, Excel, Tableau, Power BI, Python
`;

const ASSISTANT_INSTRUCTIONS = `You are Nexa, the JobNex career assistant. You help job seekers with two things:
1. Suggesting roles from the current JobNex listings (below). Suggest at most 3, with a one-line reason each.
2. Answering career questions: resumes, interviews, skill gaps, salary talks, career switches.

Tone: professional, calm, no hype, no exclamation marks. Keep answers short and practical.
If asked about something unrelated to careers or jobs, politely steer back.

Current JobNex listings:
${SAMPLE_JOB_CATALOG}`;

function jsonError(status, message) {
  return Response.json({ error: message }, { status });
}

export async function handleCareerAgent(request) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    // Graceful offline mock reply when API key is not present
    return Response.json({
      role: "assistant",
      content: "Hello! I am Nexa, your career assistant. Based on current trends, sharpening your React and Cloud fundamentals will give you a competitive edge across top tech listings."
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request body.");
  }

  const { messages } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonError(400, "Messages are required.");
  }

  try {
    const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
    const response = await runIdFetch.fetch(`${AI_GATEWAY_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: CAREER_AGENT_MODEL,
        messages: [
          { role: "system", content: ASSISTANT_INSTRUCTIONS },
          ...messages
        ]
      })
    });

    const data = await response.json();
    return Response.json(data);
  } catch (err) {
    return jsonError(500, err.message || "Failed to generate AI response.");
  }
}
