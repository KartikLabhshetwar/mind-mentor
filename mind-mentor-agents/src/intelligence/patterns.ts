export interface StudySession {
  date: string;
  startHour: number;
  duration: number;
  subject?: string;
}

export interface PatternResult {
  optimalStudyTime: string;
  avgSessionDuration: number;
  fatigueThreshold: number;
  learningVelocity: Record<string, number>;
  currentStreak: number;
}

export function detectPatterns(sessions: StudySession[], currentStreak = 0): PatternResult {
  if (sessions.length === 0) {
    return { optimalStudyTime: "unknown", avgSessionDuration: 0, fatigueThreshold: 0, learningVelocity: {}, currentStreak };
  }

  const hourCounts: Record<number, number> = {};
  let totalDuration = 0;

  for (const session of sessions) {
    hourCounts[session.startHour] = (hourCounts[session.startHour] || 0) + 1;
    totalDuration += session.duration;
  }

  const peakHour = Number(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0]);
  const optimalStudyTime = `${peakHour}:00-${peakHour + 1}:00`;
  const avgSessionDuration = Math.round(totalDuration / sessions.length / 60);

  const sorted = [...sessions].sort((a, b) => a.duration - b.duration);
  const fatigueThreshold = Math.round(sorted[Math.floor(sorted.length / 2)].duration / 60);

  const subjectDays: Record<string, Set<string>> = {};
  for (const session of sessions) {
    if (session.subject) {
      if (!subjectDays[session.subject]) subjectDays[session.subject] = new Set();
      subjectDays[session.subject].add(session.date);
    }
  }

  const learningVelocity: Record<string, number> = {};
  for (const [subject, days] of Object.entries(subjectDays)) {
    learningVelocity[subject] = Math.round((days.size / 7) * 10) / 10;
  }

  return { optimalStudyTime, avgSessionDuration, fatigueThreshold, learningVelocity, currentStreak };
}
