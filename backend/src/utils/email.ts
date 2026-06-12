import { getRedirectBase } from './authCookies.js';

function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY;
}

function getEmailFrom(): string {
  return process.env.EMAIL_FROM || 'onboarding@resend.dev';
}

export function isEmailConfigured(): boolean {
  return Boolean(getResendApiKey());
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping send to', options.to);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Email send failed (${res.status}): ${body}`);
  }
}

export async function sendPasswordResetEmail(
  req: { headers: Record<string, string | string[] | undefined> },
  email: string,
  token: string
): Promise<void> {
  const base = getRedirectBase(req as Parameters<typeof getRedirectBase>[0]);
  const url = `${base}/auth/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: 'Reset your Mr Brij password',
    html: `<p>You requested a password reset.</p><p><a href="${url}">Reset your password</a></p><p>This link expires in 1 hour.</p>`,
    text: `Reset your password: ${url}\n\nThis link expires in 1 hour.`,
  });
}

export async function sendEmailChangeConfirmation(
  req: { headers: Record<string, string | string[] | undefined> },
  newEmail: string,
  token: string
): Promise<void> {
  const base = getRedirectBase(req as Parameters<typeof getRedirectBase>[0]);
  const url = `${base}/api/profile/email/confirm/${encodeURIComponent(token)}`;
  await sendEmail({
    to: newEmail,
    subject: 'Confirm your new email — Mr Brij',
    html: `<p>Confirm your new email address.</p><p><a href="${url}">Confirm email change</a></p><p>This link expires in 24 hours.</p>`,
    text: `Confirm your email change: ${url}\n\nThis link expires in 24 hours.`,
  });
}
