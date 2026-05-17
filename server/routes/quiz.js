import express from "express";
import QuizResult from "../models/quizResult.js";
import TopicMastery from "../models/topicMastery.js";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const { userId, topic, difficulty = "medium", questionCount = 5 } = req.body;
    if (!userId || !topic) return res.status(400).json({ error: "userId and topic required" });

    const quiz = new QuizResult({
      userId,
      topic,
      difficulty,
      totalQuestions: questionCount,
      questions: [],
    });
    await quiz.save();
    res.json({ quizId: quiz._id, topic, difficulty, questionCount });
  } catch (error) {
    console.error("Quiz generate error:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

router.post("/submit", async (req, res) => {
  try {
    const { quizId, answers, questions } = req.body;
    if (!quizId) return res.status(400).json({ error: "quizId required" });

    const quiz = await QuizResult.findById(quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    let correctCount = 0;
    const gradedQuestions = questions.map((q, i) => {
      const userAnswer = answers[i]?.answer ?? null;
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      return { ...q, userAnswer, isCorrect };
    });

    quiz.questions = gradedQuestions;
    quiz.correctCount = correctCount;
    quiz.score = Math.round((correctCount / quiz.totalQuestions) * 100);
    quiz.completedAt = new Date();
    await quiz.save();

    const mastery = await TopicMastery.findOne({ userId: quiz.userId, topic: quiz.topic });
    if (mastery) {
      mastery.quizCount = (mastery.quizCount || 0) + 1;
      mastery.lastQuizDate = new Date();
      const prevAvg = mastery.averageScore ?? quiz.score;
      mastery.averageScore = Math.round((prevAvg * (mastery.quizCount - 1) + quiz.score) / mastery.quizCount);

      const quality = Math.round((quiz.score / 100) * 5);
      mastery.sm2.repetitions += 1;
      mastery.sm2.easiness = Math.max(1.3, mastery.sm2.easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (quality < 3) {
        mastery.sm2.repetitions = 0;
        mastery.sm2.interval = 1;
      } else if (mastery.sm2.repetitions === 1) {
        mastery.sm2.interval = 1;
      } else if (mastery.sm2.repetitions === 2) {
        mastery.sm2.interval = 6;
      } else {
        mastery.sm2.interval = Math.round(mastery.sm2.interval * mastery.sm2.easiness);
      }
      mastery.sm2.nextReview = new Date(Date.now() + mastery.sm2.interval * 86400000);
      mastery.lastReviewed = new Date();
      mastery.reviewHistory.push({ date: new Date(), quality });
      await mastery.save();
    }

    res.json({ score: quiz.score, correctCount, totalQuestions: quiz.totalQuestions, results: gradedQuestions });
  } catch (error) {
    console.error("Quiz submit error:", error);
    res.status(500).json({ error: "Failed to submit quiz" });
  }
});

router.get("/history/:userId", async (req, res) => {
  try {
    const { topic } = req.query;
    const filter = { userId: req.params.userId, completedAt: { $ne: null } };
    if (topic) filter.topic = topic;

    const quizzes = await QuizResult.find(filter).sort({ createdAt: -1 }).limit(20);
    const stats = await QuizResult.aggregate([
      { $match: { ...filter } },
      { $group: { _id: null, average: { $avg: "$score" }, totalTaken: { $sum: 1 } } },
    ]);

    res.json({ quizzes, stats: stats[0] || { average: 0, totalTaken: 0 } });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quiz history" });
  }
});

export default router;
