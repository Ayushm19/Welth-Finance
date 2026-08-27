"use server";

import { Resend } from "resend";

export async function sendEmail({ to, subject, react }) {
  const resend = new Resend(process.env.RESEND_API_KEY || "");

  try {
    const result = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "Finance App <onboarding@resend.dev>",
      to,
      subject,
      react,
    });

    if (result.error) {
      console.error("Failed to send email:", result.error);
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}
