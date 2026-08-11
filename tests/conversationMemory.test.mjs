import assert from "assert";
// Provide test env vars so src/lib/supabase.js doesn't throw during tests
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://localhost";
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_test_key";

const conv = await import("../src/ai/conversationMemory.js");
const supabaseModule = await import("../src/lib/supabase.js");

async function run() {
  // Monkey-patch supabase.from to simulate insert/select
  const calls = [];

  supabaseModule.supabase.from = (table) => {
    return {
      insert: (payload) => ({
        select: () => ({
          single: async () => ({ data: { id: "fake-uuid", ...payload }, error: null }),
        }),
      }),
      select: () => ({
        eq: () => ({ order: () => ({ limit: (n) => ({ data: [{ id: "fake-1" }], error: null }) }) }),
      }),
    };
  };

  const saved = await conv.saveConversation({ userId: "u1", message: "hi", response: "hello", intent: "GREET" });
  assert.ok(saved && saved.id, "saveConversation should return saved record with id");

  const recent = await conv.getRecentConversations("u1", 5);
  assert.ok(Array.isArray(recent), "getRecentConversations should return array");

  console.log("conversationMemory tests passed");
}

await run();
