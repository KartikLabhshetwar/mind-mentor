import express from "express";
import { validateAgentAuth } from "../middleware/agentAuth.js";
import ChatHistory from "../models/chatHistory.js";

const router = express.Router();
router.use(validateAgentAuth);

router.get("/:userId", async (req, res) => {
  try {
    const history = await ChatHistory.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, messages } = req.body;
    let existing = await ChatHistory.findOne({ userId }).sort({ createdAt: -1 });

    if (existing && (Date.now() - existing.createdAt.getTime()) < 30 * 60 * 1000) {
      existing.messages.push(...messages);
      await existing.save();
      return res.json(existing);
    }

    const chatHistory = new ChatHistory({ userId, messages });
    await chatHistory.save();
    res.json(chatHistory);
  } catch (error) {
    res.status(500).json({ error: "Failed to save chat history" });
  }
});

export default router;
