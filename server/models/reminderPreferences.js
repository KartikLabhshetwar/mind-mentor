import mongoose from "mongoose";

const reminderPreferencesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  timezone: { type: String, default: "Asia/Kolkata" },
  dailyReminder: { enabled: { type: Boolean, default: true }, time: { type: String, default: "19:00" } },
  streakWarning: { enabled: { type: Boolean, default: true }, hoursBeforeMidnight: { type: Number, default: 3 } },
  weeklyDigest: { enabled: { type: Boolean, default: true }, day: { type: String, default: "sunday" } },
  spacedRepetition: { enabled: { type: Boolean, default: true }, intensity: { type: String, enum: ["aggressive", "balanced", "relaxed"], default: "balanced" } },
  email: { type: String, required: true },
  maxEmailsPerDay: { type: Number, default: 2 },
  consecutiveIgnored: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.ReminderPreferences || mongoose.model("ReminderPreferences", reminderPreferencesSchema);
