export interface Env {
  GROQ_API_KEY: string;
  MEM0_API_KEY: string;
  RESEND_API_KEY: string;
  AGENT_SERVICE_SECRET: string;
  NEXTAUTH_SECRET: string;
  EXPRESS_BACKEND_URL: string;
}

export interface Variables {
  userId: string;
}

export interface UserContext {
  userId: string;
  preferences?: string[];
  weakTopics?: string[];
  strongTopics?: string[];
  studyPatterns?: string[];
}

export interface TopicNode {
  id: string;
  topic: string;
  subject: string;
  mastery: number;
}

export interface TopicEdge {
  source: string;
  target: string;
  type: "prerequisite" | "related";
}

export interface SM2Data {
  topic: string;
  repetitions: number;
  easiness: number;
  interval: number;
  nextReview: Date;
}

export interface AnalysisResult {
  patterns: {
    optimalStudyTime: string;
    avgSessionDuration: number;
    learningVelocity: Record<string, number>;
    fatigueThreshold: number;
    currentStreak: number;
  };
  knowledgeGraph: {
    nodes: TopicNode[];
    edges: TopicEdge[];
  };
  spacedRepetition: SM2Data[];
  recommendations: string[];
}

export interface ReminderPreferences {
  userId: string;
  timezone: string;
  dailyReminder: { enabled: boolean; time: string };
  streakWarning: { enabled: boolean; hoursBeforeMidnight: number };
  weeklyDigest: { enabled: boolean; day: string };
  spacedRepetition: { enabled: boolean; intensity: "aggressive" | "balanced" | "relaxed" };
  email: string;
  maxEmailsPerDay: number;
}
