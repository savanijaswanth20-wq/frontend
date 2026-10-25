// Server functions for the AI agent side panel: thread list, create, delete,
// and per-thread message history. All require a signed-in user; RLS scopes
// every query to the caller.

import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export interface AgentThread {
  id: string;
  title: string;
  updated_at: string;
}

export interface AgentStoredMessage {
  id: string;
  role: string;
  parts: Json;
}

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AgentThread[]> => {
    const { data, error } = await context.supabase
      .from("chat_threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AgentThread> => {
    const { data, error } = await context.supabase
      .from("chat_threads")
      .insert({ user_id: context.userId, title: "New chat" })
      .select("id, title, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { threadId?: string }) => {
    if (!data?.threadId) throw new Error("threadId is required");
    return { threadId: data.threadId };
  })
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("chat_threads").delete().eq("id", data.threadId);
    if (error) throw new Error(error.message);
  });

export const getThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { threadId?: string }) => {
    if (!data?.threadId) throw new Error("threadId is required");
    return { threadId: data.threadId };
  })
  .handler(async ({ context, data }): Promise<AgentStoredMessage[]> => {
    const { data: rows, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, parts")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
