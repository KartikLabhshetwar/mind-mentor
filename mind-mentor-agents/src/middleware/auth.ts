import { Context, Next } from "hono";
import { jwtVerify } from "jose";
import { Env, Variables } from "../types/index.js";

export async function verifyUserAuth(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing authorization token" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(c.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;
    if (!userId) {
      return c.json({ error: "Invalid token: missing user ID" }, 401);
    }
    c.set("userId", userId);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}
