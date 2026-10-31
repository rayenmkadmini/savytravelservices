import "server-only";

/**
 * Transactional e-mail via Resend (https://resend.com), optional.
 * Without RESEND_API_KEY the app still works: customers get on-screen and
 * in-app notifications, and staff see new items in the admin dashboard.
 */
type Mail = { to: string | string[]; subject: string; text: string; replyTo?: string };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(mail: Mail): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        reply_to: mail.replyTo,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[email] send failed", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[email] send error", err);
    return false;
  }
}

/** Alert the agency inbox (AGENCY_NOTIFICATION_EMAIL) about new activity. */
export async function notifyAgency(subject: string, text: string): Promise<void> {
  const to = process.env.AGENCY_NOTIFICATION_EMAIL;
  if (!to) return;
  await sendEmail({ to, subject, text });
}
