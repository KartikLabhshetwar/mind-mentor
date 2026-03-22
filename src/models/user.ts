import mongoose from "mongoose";

// Define interfaces for type safety
interface IStudyPlan {
  subject: string;
  duration: string;
  examDate: Date;
  weeklyPlans: Array<{
    week: string;
    goals: string[];
    dailyTasks: Array<{
      day: string;
      tasks: string[];
      duration: string;
    }>;
  }>;
  recommendations: string[];
  createdAt: Date;
}

interface IResource {
  title: string;
  description?: string;
  type?: string;
  link?: string;
  addedAt: Date;
}

// Define the Resource schema
const resourceSchema = new mongoose.Schema<IResource>({
  title: {
    type: String,
    required: true,
  },
  description: String,
  type: String,
  link: String,
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Define the StudyPlan schema
const studyPlanSchema = new mongoose.Schema<IStudyPlan>({
  subject: {
    type: String,
    required: true,
  },
  duration: String,
  examDate: Date,
  weeklyPlans: [{
    week: String,
    goals: [String],
    dailyTasks: [{
      day: String,
      tasks: [String],
      duration: String,
    }],
  }],
  recommendations: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Define interface for User document
interface IUser {
  name: string;
  email: string;
  password: string;
  subjects: string[];
  savedPlans: IStudyPlan[];
  savedResources: IResource[];
  profile: {
    preferences: {
      emailNotifications: boolean;
      studyReminders: boolean;
    };
  };
  preferredModel: string;
  stats: mongoose.Types.ObjectId;
}

// Enhanced User schema
const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  subjects: [{
    type: String,
    trim: true,
  }],
  savedPlans: [studyPlanSchema],
  savedResources: [resourceSchema],
  profile: {
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      studyReminders: {
        type: Boolean,
        default: true,
      },
    },
  },
  preferredModel: {
    type: String,
    default: 'groq',
    enum: ['groq', 'anthropic', 'openai'],
  },
  stats: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyStats'
  },
}, {
  timestamps: true,
});

// Index for performance
userSchema.index({ subjects: 1 });

// Methods
userSchema.methods.addStudyPlan = function(plan: IStudyPlan) {
  this.savedPlans.push(plan);
  return this.save();
};

userSchema.methods.addResource = function(resource: IResource) {
  this.savedResources.push(resource);
  return this.save();
};

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
export type { IUser, IStudyPlan, IResource }; 