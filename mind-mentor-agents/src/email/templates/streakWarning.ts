export function streakWarningHtml(data: { name: string; streak: number; hoursLeft: number }) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <h2 style="color:#f59e0b;">Your ${data.streak}-Day Streak is at Risk!</h2>
    <p>${data.name}, you have <strong>${data.hoursLeft} hours</strong> left to study today.</p>
    <p>Even a 10-minute session counts!</p>
    <a href="https://mind-mentor.ink/timer" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:white;text-decoration:none;border-radius:8px;margin-top:16px;">Quick Study Session</a>
    <p style="color:#666;margin-top:24px;font-size:12px;">— Mind Mentor AI</p>
  </div>`;
}
