import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mind-mentor";

// Inline schemas to avoid ESM import issues with the server models
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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  totalStudyHours: { type: Number, default: 0 },
  completedSessions: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  lastStudyDate: Date,
  dailySessions: { type: Map, of: dailySessionSchema, default: new Map() },
}, { timestamps: true });

const topicMasterySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
}, { timestamps: true });
topicMasterySchema.index({ userId: 1, topic: 1 }, { unique: true });

const reminderPreferencesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  timezone: { type: String, default: "Asia/Kolkata" },
  dailyReminder: { enabled: { type: Boolean, default: true }, time: { type: String, default: "09:00" } },
  streakWarning: { enabled: { type: Boolean, default: true }, hoursBeforeDeadline: { type: Number, default: 4 } },
  weeklyDigest: { enabled: { type: Boolean, default: true }, dayOfWeek: { type: Number, default: 0 } },
  spacedRepetition: { enabled: { type: Boolean, default: true }, maxPerDay: { type: Number, default: 5 } },
  milestones: { enabled: { type: Boolean, default: true } },
  quietHoursStart: { type: String, default: "22:00" },
  quietHoursEnd: { type: String, default: "07:00" },
  emailsSentToday: { type: Number, default: 0 },
  lastEmailDate: Date,
  consecutiveIgnored: { type: Number, default: 0 },
  paused: { type: Boolean, default: false },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  subjects: [String],
  savedPlans: [],
  savedResources: [],
  profile: { preferences: { emailNotifications: Boolean, studyReminders: Boolean } },
  stats: { type: mongoose.Schema.Types.ObjectId, ref: "StudyStats" },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const StudyStats = mongoose.model("StudyStats", studyStatsSchema);
const TopicMastery = mongoose.model("TopicMastery", topicMasterySchema);
const ReminderPreferences = mongoose.model("ReminderPreferences", reminderPreferencesSchema);

const DEMO_USER = {
  name: "Demo Student",
  email: "demo@mindmentor.local",
  password: "demo123",
  subjects: ["Data Structures", "Machine Learning", "Database Systems"],
};

const TOPICS = [
  { topic: "Binary Trees", subject: "Data Structures", prerequisites: ["Arrays", "Recursion"] },
  { topic: "Graph Algorithms", subject: "Data Structures", prerequisites: ["Binary Trees", "Queues"] },
  { topic: "Hash Tables", subject: "Data Structures", prerequisites: ["Arrays"] },
  { topic: "Dynamic Programming", subject: "Data Structures", prerequisites: ["Recursion", "Arrays"] },
  { topic: "Arrays", subject: "Data Structures", prerequisites: [] },
  { topic: "Recursion", subject: "Data Structures", prerequisites: [] },
  { topic: "Queues", subject: "Data Structures", prerequisites: ["Arrays"] },
  { topic: "Linear Regression", subject: "Machine Learning", prerequisites: ["Statistics Basics"] },
  { topic: "Neural Networks", subject: "Machine Learning", prerequisites: ["Linear Regression", "Gradient Descent"] },
  { topic: "Gradient Descent", subject: "Machine Learning", prerequisites: ["Statistics Basics"] },
  { topic: "Statistics Basics", subject: "Machine Learning", prerequisites: [] },
  { topic: "Decision Trees", subject: "Machine Learning", prerequisites: ["Statistics Basics"] },
  { topic: "Normalization", subject: "Database Systems", prerequisites: [] },
  { topic: "SQL Joins", subject: "Database Systems", prerequisites: ["Normalization"] },
  { topic: "Indexing", subject: "Database Systems", prerequisites: ["SQL Joins"] },
  { topic: "Transactions", subject: "Database Systems", prerequisites: ["SQL Joins"] },
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateStudySessions(days) {
  const now = new Date();
  const dailySessions = new Map();
  let totalHours = 0;
  let totalSessions = 0;
  let streak = 0;
  let bestStreak = 0;
  let currentStreak = 0;

  for (let d = days; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateKey = date.toISOString().split("T")[0];

    // 80% chance of studying on any given day
    if (Math.random() < 0.8) {
      const sessionCount = randomBetween(1, 3);
      const sessions = [];

      for (let s = 0; s < sessionCount; s++) {
        const hour = randomBetween(8, 21);
        const duration = randomBetween(25, 90);
        const startTime = new Date(date);
        startTime.setHours(hour, randomBetween(0, 59), 0);
        const endTime = new Date(startTime.getTime() + duration * 60000);

        sessions.push({
          duration,
          startTime,
          endTime,
          mode: ["focus", "pomodoro", "free"][randomBetween(0, 2)],
        });
        totalHours += duration / 60;
        totalSessions++;
      }

      dailySessions.set(dateKey, {
        count: sessionCount,
        totalDuration: sessions.reduce((sum, s) => sum + s.duration, 0),
        sessions,
      });

      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return { dailySessions, totalHours: Math.round(totalHours * 10) / 10, totalSessions, currentStreak, bestStreak };
}

function generateTopicMastery(userId) {
  const now = new Date();
  return TOPICS.map((t) => {
    const repetitions = randomBetween(0, 8);
    const easiness = Math.max(1.3, 2.5 + (Math.random() - 0.5));
    const interval = repetitions === 0 ? 0 : Math.pow(2, Math.min(repetitions, 6));
    const nextReview = new Date(now.getTime() + interval * 86400000);
    const mastery = Math.min(100, Math.round((repetitions / 8) * 70 + (easiness - 1.3) * 25));
    const reviewHistory = [];
    for (let r = 0; r < repetitions; r++) {
      const reviewDate = new Date(now);
      reviewDate.setDate(reviewDate.getDate() - (repetitions - r) * 3);
      reviewHistory.push({ date: reviewDate, quality: randomBetween(2, 5) });
    }

    return {
      userId,
      topic: t.topic,
      subject: t.subject,
      mastery,
      sm2: { repetitions, easiness: Math.round(easiness * 100) / 100, interval, nextReview },
      prerequisites: t.prerequisites,
      lastReviewed: repetitions > 0 ? reviewHistory[reviewHistory.length - 1].date : null,
      reviewHistory,
    };
  });
}

async function seed() {
  console.log("Connecting to MongoDB:", MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log("Connected.");

  // Clean existing demo data
  const existingUser = await User.findOne({ email: DEMO_USER.email });
  if (existingUser) {
    await StudyStats.deleteMany({ userId: existingUser._id });
    await TopicMastery.deleteMany({ userId: existingUser._id });
    await ReminderPreferences.deleteMany({ userId: existingUser._id });
    await User.deleteOne({ _id: existingUser._id });
    console.log("Cleaned previous demo data.");
  }

  // Create demo user
  const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);
  const user = await User.create({
    ...DEMO_USER,
    password: hashedPassword,
    profile: { preferences: { emailNotifications: true, studyReminders: true } },
  });
  console.log(`Created user: ${user.email} (password: ${DEMO_USER.password})`);

  // Seed study stats (30 days)
  const { dailySessions, totalHours, totalSessions, currentStreak, bestStreak } = generateStudySessions(30);
  const stats = await StudyStats.create({
    userId: user._id,
    totalStudyHours: totalHours,
    completedSessions: totalSessions,
    currentStreak,
    bestStreak,
    lastStudyDate: new Date(),
    dailySessions,
  });
  await User.updateOne({ _id: user._id }, { stats: stats._id });
  console.log(`Seeded study stats: ${totalSessions} sessions, ${totalHours}h total, streak ${currentStreak}/${bestStreak}`);

  // Seed topic mastery
  const topics = generateTopicMastery(user._id);
  await TopicMastery.insertMany(topics);
  console.log(`Seeded ${topics.length} topic mastery records across 3 subjects.`);

  // Seed reminder preferences
  await ReminderPreferences.create({
    userId: user._id,
    timezone: "Asia/Kolkata",
    dailyReminder: { enabled: true, time: "09:00" },
    streakWarning: { enabled: true, hoursBeforeDeadline: 4 },
    weeklyDigest: { enabled: true, dayOfWeek: 0 },
    spacedRepetition: { enabled: true, maxPerDay: 5 },
    milestones: { enabled: true },
  });
  console.log("Seeded reminder preferences.");

  console.log("\n--- Demo data seeded successfully ---");
  console.log(`Login: ${DEMO_USER.email} / ${DEMO_USER.password}`);
  console.log("---");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
