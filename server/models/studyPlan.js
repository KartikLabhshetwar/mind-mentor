import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const dailyTaskSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
  },
  tasks: [taskSchema],
  duration: {
    type: String,
    required: true,
  },
});

const weeklyPlanSchema = new mongoose.Schema({
  week: {
    type: String,
    required: true,
  },
  goals: [String],
  dailyTasks: [dailyTaskSchema],
});

const overviewSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  examDate: {
    type: String,
    required: true,
  },
});

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    overview: {
      type: overviewSchema,
      required: true,
    },
    weeklyPlans: [weeklyPlanSchema],
    recommendations: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

studyPlanSchema.index({ userId: 1, isActive: 1 });
studyPlanSchema.index({ userId: 1, "overview.subject": 1 });

export default mongoose.model("StudyPlan", studyPlanSchema);
