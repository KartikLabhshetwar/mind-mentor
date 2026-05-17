import { Resend } from "resend";
import { Env } from "../types/index.js";

export function createResendClient(env: Env) {
  return new Resend(env.RESEND_API_KEY);
}

export async function sendEmail(resend: Resend, to: string, subject: string, html: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: "Mind Mentor <reminders@mind-mentor.ink>",
      to: [to],
      subject,
      html,
    });
    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}
