export function weeklyDigestHtml(data: { name: string; totalHours: number; sessionsCount: number; streak: number; topTopics: string[]; recommendations: string[] }) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <h2 style="color:#6366f1;">Weekly Progress Report</h2>
    <p>Hey ${data.name}, here's your week in review:</p>
    <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
      <p><strong>${data.totalHours}h</strong> studied across <strong>${data.sessionsCount}</strong> sessions</p>
      <p>Current streak: <strong>${data.streak} days</strong></p>
      <p>Top topics: ${data.topTopics.join(", ") || "None yet"}</p>
    </div>
    <h3>Recommendations for next week:</h3>
    <ul>${data.recommendations.map(r => `<li>${r}</li>`).join("")}</ul>
    <a href="https://mind-mentor.ink/insights" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;margin-top:16px;">View Full Insights</a>
  </div>`;
}
