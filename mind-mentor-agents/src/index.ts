import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "./types/index.js";
import { tutorRoutes } from "./agents/tutor.js";
import { schedulerRoutes, runSchedulerCron } from "./agents/scheduler.js";
import { analystRoutes } from "./agents/analyst.js";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: [
    "https://mind-mentor-pearl.vercel.app",
    "https://mind-mentor.kartiklabhshetwar.me",
    "https://www.mind-mentor.ink",
    "https://mind-mentor.ink",
    "http://localhost:3000",
  ],
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "OPTIONS"],
  credentials: true,
}));

app.get("/health", (c) => c.json({ status: "ok", agents: ["tutor", "scheduler", "analyst"] }));

app.route("/agents/tutor", tutorRoutes);
app.route("/agents/scheduler", schedulerRoutes);
app.route("/agents/analyst", analystRoutes);

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runSchedulerCron(env));
  },
};
