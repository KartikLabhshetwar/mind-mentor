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
}

export function detectPatterns(sessions: StudySession[]): PatternResult {
  if (sessions.length === 0) {
    return { optimalStudyTime: "unknown", avgSessionDuration: 0, fatigueThreshold: 60, learningVelocity: {} };
  }

  const hourCounts: Record<number, number> = {};
  let totalDuration = 0;

  for (const session of sessions) {
    hourCounts[session.startHour] = (hourCounts[session.startHour] || 0) + 1;
    totalDuration += session.duration;
  }

  const peakHour = Number(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0]);
  const optimalStudyTime = `${peakHour}:00-${peakHour + 1}:00`;
  const avgSessionDuration = Math.round(totalDuration / sessions.length);

  const sorted = [...sessions].sort((a, b) => a.duration - b.duration);
  const fatigueThreshold = sorted[Math.floor(sorted.length / 2)].duration;

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

  return { optimalStudyTime, avgSessionDuration, fatigueThreshold, learningVelocity };
}
