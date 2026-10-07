/**
 * Sends email through Resend's HTTP API (no SDK needed).
 * Without RESEND_API_KEY the message is printed to the server log, so local development works
 * and the reset link can be copied from the terminal.
 */
export async function sendMail(opts: { to: string; subject: string; text: string; html: string }) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn(`[mail] RESEND_API_KEY is not set. Would have sent to ${opts.to}:\n${opts.subject}\n${opts.text}\n`)
    return { sent: false as const }
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "UnitCMS <onboarding@resend.dev>",
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    }),
  })
  if (!res.ok) {
    console.error("[mail] Resend rejected the message", res.status, await res.text().catch(() => ""))
    return { sent: false as const }
  }
  return { sent: true as const }
}

export function resetEmail(link: string) {
  const text = `Someone asked to reset the password for your UnitCMS account.\n\nSet a new password (the link works once and expires in 1 hour):\n${link}\n\nIf this wasn't you, you can ignore this email. Your password won't change.`
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#101010">
  <h2 style="font-weight:600">Reset your password</h2>
  <p>Someone asked to reset the password for your UnitCMS account.</p>
  <p><a href="${link}" style="display:inline-block;background:#1a56ff;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px">Set a new password</a></p>
  <p style="color:#666;font-size:13px">The link works once and expires in 1 hour. If this wasn't you, ignore this email. Your password won't change.</p>
</div>`
  return { subject: "Reset your UnitCMS password", text, html }
}
