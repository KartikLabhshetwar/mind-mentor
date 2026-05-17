import mongoose from "mongoose";

const topicMasterySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  topic: { type: String, required: true },
  subject: { type: String, required: true },
  mastery: { type: Number, default: 0 },
  sm2: {
    repetitions: { type: Number, default: 0 },
    easiness: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 },
    nextReview: Date,
  },
  prerequisites: [String],
  lastReviewed: Date,
  reviewHistory: [{ date: Date, quality: Number }],
  quizCount: { type: Number, default: 0 },
  lastQuizDate: { type: Date, default: null },
  averageScore: { type: Number, default: null },
}, { timestamps: true });

topicMasterySchema.index({ userId: 1, topic: 1 }, { unique: true });

export default mongoose.models.TopicMastery || mongoose.model("TopicMastery", topicMasterySchema);
