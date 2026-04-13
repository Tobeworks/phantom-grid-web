import nodemailer from 'nodemailer';

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: process.env.SMTP_SECURE === 'true',
  ...(smtpUser && smtpPass ? { auth: { user: smtpUser, pass: smtpPass } } : {}),
});

const FROM = `PHANTOM GRID <${process.env.SMTP_FROM ?? 'newsletter@phantom-grid.de'}>`;

const baseHtml = (content: string) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0E0E0E;font-family:'Courier New',monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0E0E0E;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;border:1px solid rgba(220,220,220,0.08);">
        <tr>
          <td style="padding:28px 32px;border-bottom:1px solid rgba(220,220,220,0.08);">
            <div style="color:#D6524C;font-size:11px;letter-spacing:0.4em;text-transform:uppercase;margin-bottom:12px;">
              // PHANTOM GRID
            </div>
          </td>
        </tr>
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(220,220,220,0.08);">
            <p style="margin:0;color:rgba(220,220,220,0.2);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;">
              PHANTOM GRID &mdash; TRANSMITTING FROM CYBERSPACE
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

export async function sendConfirmationEmail(to: string, name: string, token: string, siteUrl: string) {
  const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${token}`;
  const greeting = name ? `${name},` : 'Hey,';

  const html = baseHtml(`
    <h1 style="margin:0 0 16px;color:#DCDCDC;font-size:22px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">
      Confirm Subscription
    </h1>
    <p style="margin:0 0 24px;color:rgba(220,220,220,0.6);font-size:13px;letter-spacing:0.08em;line-height:1.8;">
      ${greeting} you requested to join the Phantom Grid newsletter transmission.
      Click below to confirm your address and get in.
    </p>
    <a href="${confirmUrl}" style="display:inline-block;background:#D6524C;color:#7A1A17;font-size:12px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;padding:13px 28px;text-decoration:none;">
      CONFIRM SUBSCRIPTION
    </a>
    <p style="margin:28px 0 0;color:rgba(220,220,220,0.25);font-size:11px;letter-spacing:0.08em;line-height:1.7;">
      Link expires in 24&nbsp;hours. If you did not sign up, ignore this email.
    </p>
  `);

  const text = `${greeting}\n\nConfirm your Phantom Grid newsletter subscription:\n${confirmUrl}\n\nLink expires in 24 hours.`;

  await transporter.sendMail({ from: FROM, to, subject: 'Confirm your subscription — PHANTOM GRID', html, text });
}

export async function sendWelcomeEmail(to: string, name: string, unsubscribeToken: string, siteUrl: string) {
  const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;
  const greeting = name ? `${name},` : 'Hey,';

  const html = baseHtml(`
    <h1 style="margin:0 0 16px;color:#DCDCDC;font-size:22px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">
      You're in.
    </h1>
    <p style="margin:0 0 24px;color:rgba(220,220,220,0.6);font-size:13px;letter-spacing:0.08em;line-height:1.8;">
      ${greeting} subscription confirmed. You'll receive transmissions when new releases drop
      &mdash; no noise, no filler.
    </p>
    <p style="margin:0;color:rgba(220,220,220,0.25);font-size:11px;letter-spacing:0.08em;line-height:1.7;">
      To unsubscribe at any time:
      <a href="${unsubscribeUrl}" style="color:rgba(214,82,76,0.7);text-decoration:underline;">click here</a>
    </p>
  `);

  const text = `${greeting}\n\nSubscription confirmed. You'll hear from Phantom Grid when new releases drop.\n\nUnsubscribe: ${unsubscribeUrl}`;

  await transporter.sendMail({ from: FROM, to, subject: 'You\'re in — PHANTOM GRID Newsletter', html, text });
}

export async function sendAlreadySubscribedEmail(to: string, name: string, unsubscribeToken: string, siteUrl: string) {
  const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;
  const greeting = name ? `${name},` : 'Hey,';

  const html = baseHtml(`
    <h1 style="margin:0 0 16px;color:#DCDCDC;font-size:22px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">
      Already subscribed
    </h1>
    <p style="margin:0 0 24px;color:rgba(220,220,220,0.6);font-size:13px;letter-spacing:0.08em;line-height:1.8;">
      ${greeting} this address is already on the list. No action needed.
    </p>
    <p style="margin:0;color:rgba(220,220,220,0.25);font-size:11px;letter-spacing:0.08em;line-height:1.7;">
      To unsubscribe:
      <a href="${unsubscribeUrl}" style="color:rgba(214,82,76,0.7);text-decoration:underline;">click here</a>
    </p>
  `);

  const text = `${greeting}\n\nThis address is already subscribed to the Phantom Grid newsletter.\n\nUnsubscribe: ${unsubscribeUrl}`;

  await transporter.sendMail({ from: FROM, to, subject: 'Already subscribed — PHANTOM GRID', html, text });
}
