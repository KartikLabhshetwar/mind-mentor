export function spacedRepetitionHtml(data: { name: string; topic: string; daysSince: number; subject: string }) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <h2 style="color:#10b981;">Time to Review: ${data.topic}</h2>
    <p>${data.name}, it's been <strong>${data.daysSince} days</strong> since you last reviewed this topic in ${data.subject}.</p>
    <p>Reviewing now maximizes long-term retention.</p>
    <a href="https://mind-mentor.ink/chat" style="display:inline-block;padding:12px 24px;background:#10b981;color:white;text-decoration:none;border-radius:8px;margin-top:16px;">Review with AI Tutor</a>
    <p style="color:#666;margin-top:24px;font-size:12px;">— Mind Mentor AI</p>
  </div>`;
}
