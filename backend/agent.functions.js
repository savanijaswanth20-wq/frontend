// Server functions for the AI agent side panel: thread list, create, delete,
// and per-thread message history. All require a signed-in user; RLS scopes
// every query to the caller.

export async function listThreads(supabase) {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createThread(supabase, userId) {
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ user_id: userId, title: "New chat" })
    .select("id, title, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteThread(supabase, threadId) {
  if (!threadId) throw new Error("threadId is required");
  const { error } = await supabase.from("chat_threads").delete().eq("id", threadId);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getThreadMessages(supabase, threadId) {
  if (!threadId) throw new Error("threadId is required");
  const { data: rows, error } = await supabase
    .from("chat_messages")
    .select("id, role, parts")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return rows ?? [];
}
