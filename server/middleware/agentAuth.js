export function validateAgentAuth(req, res, next) {
  const secret = req.headers["x-agent-secret"];
  if (secret !== process.env.AGENT_SERVICE_SECRET) {
    return res.status(401).json({ error: "Unauthorized agent call" });
  }
  next();
}
