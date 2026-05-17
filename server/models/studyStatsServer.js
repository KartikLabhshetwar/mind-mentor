import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema({
  duration: Number,
  startTime: Date,
  endTime: Date,
  mode: String,
});

const dailySessionSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 },
  sessions: [studySessionSchema],
});

const studyStatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  totalStudyHours: { type: Number, default: 0 },
  completedSessions: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  lastStudyDate: Date,
  dailySessions: { type: Map, of: dailySessionSchema, default: new Map() },
}, { timestamps: true });

export default mongoose.models.StudyStats || mongoose.model("StudyStats", studyStatsSchema);
