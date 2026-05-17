import express from "express";
import { validateAgentAuth } from "../middleware/agentAuth.js";
import TopicMastery from "../models/topicMastery.js";

const router = express.Router();
router.use(validateAgentAuth);

router.get("/:userId", async (req, res) => {
  try {
    const topics = await TopicMastery.find({ userId: req.params.userId });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch mastery" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, topic, subject, sm2, mastery, prerequisites, lastReviewed, quality } = req.body;
    const update = { userId, topic, subject, mastery, sm2, prerequisites, lastReviewed };
    if (quality != null) {
      const result = await TopicMastery.findOneAndUpdate(
        { userId, topic },
        { ...update, $push: { reviewHistory: { date: new Date(), quality } } },
        { upsert: true, new: true }
      );
      return res.json(result);
    }
    const result = await TopicMastery.findOneAndUpdate(
      { userId, topic },
      update,
      { upsert: true, new: true }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to update mastery" });
  }
});

export default router;
