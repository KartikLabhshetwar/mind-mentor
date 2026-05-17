export function dailyReminderHtml(data: { name: string; subject: string; topic: string; suggestedDuration: string }) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <h2 style="color:#6366f1;">Time to Study, ${data.name}!</h2>
    <p>Today's focus: <strong>${data.topic}</strong> in ${data.subject}</p>
    <p>Suggested duration: ${data.suggestedDuration}</p>
    <a href="https://mind-mentor.ink/home" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;margin-top:16px;">Start Studying</a>
    <p style="color:#666;margin-top:24px;font-size:12px;">— Mind Mentor AI</p>
  </div>`;
}
