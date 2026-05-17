import express from "express";
import TopicMastery from "../models/topicMastery.js";
import QuizResult from "../models/quizResult.js";

const router = express.Router();

router.get("/summary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const topics = await TopicMastery.find({ userId }).sort({ mastery: 1 });

    const overallScore = topics.length > 0
      ? Math.round(topics.reduce((sum, t) => sum + (t.mastery || 0), 0) / topics.length)
      : 0;

    const now = new Date();
    const weakTopics = topics
      .filter(t => t.mastery < 60 || (t.sm2.nextReview && t.sm2.nextReview < now))
      .map(t => ({
        topic: t.topic,
        subject: t.subject,
        mastery: t.mastery,
        daysSinceReview: t.lastReviewed ? Math.floor((now - t.lastReviewed) / 86400000) : null,
        reviewOverdue: t.sm2.nextReview ? t.sm2.nextReview < now : false,
      }))
      .sort((a, b) => a.mastery - b.mastery);

    const nextReviews = topics
      .filter(t => t.sm2.nextReview)
      .map(t => ({ topic: t.topic, nextReview: t.sm2.nextReview }))
      .sort((a, b) => a.nextReview - b.nextReview)
      .slice(0, 5);

    const recentQuizzes = await QuizResult.find({ userId, completedAt: { $ne: null } })
      .sort({ completedAt: -1 }).limit(100);
    let streak = 0;
    if (recentQuizzes.length > 0) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let checkDate = new Date(today);
      const quizDates = new Set(recentQuizzes.map(q => {
        const d = new Date(q.completedAt); d.setHours(0, 0, 0, 0);
        return d.getTime();
      }));
      while (quizDates.has(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayQuestions = await QuizResult.countDocuments({
      userId, completedAt: { $gte: todayStart },
    });

    res.json({ overallScore, topics, weakTopics, nextReviews, streak, todayQuestions });
  } catch (error) {
    console.error("Performance summary error:", error);
    res.status(500).json({ error: "Failed to fetch performance summary" });
  }
});

export default router;
