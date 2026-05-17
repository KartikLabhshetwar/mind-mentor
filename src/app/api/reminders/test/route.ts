import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const { email, name } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <h2 style="color:#538B81;">Hey ${name || "there"}! Your reminders are working.</h2>
    <p>This is a test email from <strong>Mind Mentor</strong> to confirm your reminder setup.</p>
    <p style="margin-top:16px;">You'll receive study reminders, streak warnings, and weekly digests at your configured times.</p>
    <div style="margin-top:24px;padding:16px;background:#f5f1ea;border-radius:8px;">
      <p style="margin:0;color:#27445D;font-size:14px;">If you received this, your email notifications are all set!</p>
    </div>
    <p style="color:#666;margin-top:24px;font-size:12px;">— Mind Mentor AI</p>
  </div>`;

  try {
    const { error } = await resend.emails.send({
      from: "Mind Mentor <reminders@mind-mentor.ink>",
      to: [email],
      subject: "Mind Mentor — Test Reminder",
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send" },
      { status: 500 }
    );
  }
}
