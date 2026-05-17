export function milestoneHtml(data: { name: string; achievement: string; nextGoal: string }) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <h2 style="color:#8b5cf6;">Achievement Unlocked!</h2>
    <p>Congratulations ${data.name}!</p>
    <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;text-align:center;">
      <p style="font-size:18px;font-weight:bold;">${data.achievement}</p>
    </div>
    <p>Next goal: <strong>${data.nextGoal}</strong></p>
    <a href="https://mind-mentor.ink/insights" style="display:inline-block;padding:12px 24px;background:#8b5cf6;color:white;text-decoration:none;border-radius:8px;margin-top:16px;">View Progress</a>
  </div>`;
}
