import express from "express";
import mongoose from "mongoose";
import { validateAgentAuth } from "../middleware/agentAuth.js";
import "../models/studyStatsServer.js";
import TopicMastery from "../models/topicMastery.js";

const router = express.Router();
router.use(validateAgentAuth);

router.get("/sessions/:userId", async (req, res) => {
  try {
    const StudyStats = mongoose.model("StudyStats");
    const stats = await StudyStats.findOne({ userId: req.params.userId });
    if (!stats) return res.json({ sessions: [], currentStreak: 0, weeklyHours: 0, weeklyCount: 0, todayCount: 0, topTopics: [] });

    const today = new Date().toISOString().split("T")[0];
    const todaySession = stats.dailySessions?.get(today);

    const sessions = [];
    if (stats.dailySessions) {
      for (const [date, data] of stats.dailySessions.entries()) {
        sessions.push({
          date,
          startHour: data.sessions?.[0]?.startTime ? new Date(data.sessions[0].startTime).getHours() : 19,
          duration: data.totalDuration || 0,
        });
      }
    }

    res.json({
      sessions,
      currentStreak: stats.currentStreak || 0,
      bestStreak: stats.bestStreak || 0,
      weeklyHours: Math.round((stats.totalStudyHours || 0) * 10) / 10,
      weeklyCount: stats.completedSessions || 0,
      todayCount: todaySession?.count || 0,
      topTopics: [],
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

router.get("/topics/:userId", async (req, res) => {
  try {
    const topics = await TopicMastery.find({ userId: req.params.userId });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch topics" });
  }
});

export default router;
