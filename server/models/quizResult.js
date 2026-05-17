import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  topic: { type: String, required: true },
  subject: { type: String, default: "" },
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    userAnswer: { type: Number, default: null },
    isCorrect: { type: Boolean, default: null },
  }],
  score: { type: Number, default: null },
  totalQuestions: { type: Number, required: true },
  correctCount: { type: Number, default: 0 },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

quizResultSchema.index({ userId: 1, topic: 1 });
quizResultSchema.index({ completedAt: 1 }, { expireAfterSeconds: 86400, partialFilterExpression: { completedAt: null } });

export default mongoose.models.QuizResult || mongoose.model("QuizResult", quizResultSchema);
