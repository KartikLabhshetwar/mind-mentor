import { MemoryClient } from "mem0ai";
import { Env } from "../types/index.js";

export function createMem0Client(env: Env) {
  return new MemoryClient({ apiKey: env.MEM0_API_KEY });
}

export async function getUserMemories(client: MemoryClient, userId: string, query: string) {
  try {
    const response = await client.search(query, { user_id: userId });
    return (response as any).results || response || [];
  } catch (error) {
    console.error("mem0 search error:", error);
    return [];
  }
}

export async function addUserMemory(client: MemoryClient, userId: string, content: string, category: string) {
  try {
    await client.add(
      [{ role: "user" as const, content }],
      { user_id: userId, metadata: { category } }
    );
  } catch (error) {
    console.error("mem0 add error:", error);
  }
}
