import express from "express";
import ChatHistory from "../models/chatHistory.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const history = await ChatHistory.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(history);
  } catch {
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

router.get("/:conversationId", async (req, res) => {
  try {
    const conv = await ChatHistory.findOne({
      _id: req.params.conversationId,
      userId: req.userId,
    });
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    res.json(conv);
  } catch {
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { conversationId, messages } = req.body;

    if (conversationId) {
      const existing = await ChatHistory.findOne({ _id: conversationId, userId: req.userId });
      if (existing) {
        existing.messages.push(...messages);
        await existing.save();
        return res.json(existing);
      }
    }

    const chatHistory = new ChatHistory({ userId: req.userId, messages });
    await chatHistory.save();
    res.json(chatHistory);
  } catch {
    res.status(500).json({ error: "Failed to save chat history" });
  }
});

export default router;
