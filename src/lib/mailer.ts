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
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Courier New',monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;border:1px solid rgba(214,82,76,0.15);">
        <tr>
          <td style="padding:28px 32px;border-bottom:1px solid rgba(214,82,76,0.15);">
            <div style="color:#D6524C;font-size:11px;letter-spacing:0.4em;text-transform:uppercase;margin-bottom:12px;">
              // PHANTOM GRID
            </div>
          </td>
        </tr>
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(214,82,76,0.15);">
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
    <h1 style="margin:0 0 16px;color:#E8E4D8;font-size:22px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">
      Confirm Subscription
    </h1>
    <p style="margin:0 0 24px;color:rgba(220,220,220,0.6);font-size:13px;letter-spacing:0.08em;line-height:1.8;">
      ${greeting} you requested to join the Phantom Grid newsletter.
      Click below to confirm your address and get in.
    </p>
    <a href="${confirmUrl}" style="display:inline-block;background:#D6524C;color:#fff;font-size:12px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;padding:13px 28px;text-decoration:none;">
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
    <h1 style="margin:0 0 16px;color:#E8E4D8;font-size:22px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">
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

export async function sendCampaignEmail(
  to: string,
  name: string,
  subject: string,
  bodyHtml: string,
  bodyText: string,
  unsubscribeToken: string,
  siteUrl: string,
) {
  const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;
  const greeting = name ? `<p style="margin:0 0 20px;color:rgba(220,220,220,0.6);font-size:13px;letter-spacing:0.08em;">${name},</p>` : '';

  const styledHtml = bodyHtml
    .replace(/<h1>/g, '<h1 style="margin:0 0 16px;color:#E8E4D8;font-size:20px;letter-spacing:0.1em;font-weight:700;">')
    .replace(/<h2>/g, '<h2 style="margin:24px 0 12px;color:#E8E4D8;font-size:16px;letter-spacing:0.08em;font-weight:700;">')
    .replace(/<h3>/g, '<h3 style="margin:20px 0 8px;color:rgba(232,228,216,0.8);font-size:13px;letter-spacing:0.08em;font-weight:600;">')
    .replace(/<p>/g, '<p style="margin:0 0 16px;color:rgba(220,220,220,0.75);font-size:13px;letter-spacing:0.05em;line-height:1.9;">')
    .replace(/<a /g, '<a style="color:#D6524C;text-decoration:underline;" ')
    .replace(/<strong>/g, '<strong style="color:#E8E4D8;font-weight:700;">')
    .replace(/<ul>/g, '<ul style="margin:0 0 16px;padding-left:20px;color:rgba(220,220,220,0.75);font-size:13px;line-height:1.9;">')
    .replace(/<ol>/g, '<ol style="margin:0 0 16px;padding-left:20px;color:rgba(220,220,220,0.75);font-size:13px;line-height:1.9;">')
    .replace(/<hr>/g, '<hr style="border:none;border-top:1px solid rgba(214,82,76,0.15);margin:24px 0;">');

  const html = baseHtml(`
    ${greeting}
    <div>${styledHtml}</div>
    <p style="margin:32px 0 0;color:rgba(220,220,220,0.2);font-size:10px;letter-spacing:0.15em;">
      <a href="${unsubscribeUrl}" style="color:rgba(214,82,76,0.5);text-decoration:underline;">Unsubscribe</a>
    </p>
  `);

  const plainText = `${name ? `${name},\n\n` : ''}${bodyText || bodyHtml.replace(/<[^>]+>/g, '').trim()}\n\nUnsubscribe: ${unsubscribeUrl}`;

  await transporter.sendMail({ from: FROM, to, subject, html, text: plainText });
}

export async function sendAlreadySubscribedEmail(to: string, name: string, unsubscribeToken: string, siteUrl: string) {
  const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;
  const greeting = name ? `${name},` : 'Hey,';

  const html = baseHtml(`
    <h1 style="margin:0 0 16px;color:#E8E4D8;font-size:22px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">
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

export async function sendPromoWelcomeEmail(
  to: string,
  name: string,
  unsubscribeToken: string,
  siteUrl: string,
): Promise<void> {
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const unsubscribeUrl = `${siteUrl}/api/promo-list/unsubscribe?token=${unsubscribeToken}`;

  const html = baseHtml(`
    <p style="margin:0 0 1.5rem;color:rgba(220,220,220,0.85);font-size:14px;letter-spacing:0.04em;line-height:1.8;">${greeting}</p>
    <p style="margin:0 0 1.5rem;color:rgba(220,220,220,0.85);font-size:14px;letter-spacing:0.04em;line-height:1.8;">
      You are now on the <strong style="color:#E8E4D8;">Phantom Grid Promo List</strong>.<br>
      We'll send you new releases and promo materials as they come.
    </p>
    <p style="margin:2rem 0 0;color:rgba(220,220,220,0.25);font-size:11px;letter-spacing:0.08em;line-height:1.7;">
      To unsubscribe from the promo list:
      <a href="${unsubscribeUrl}" style="color:rgba(214,82,76,0.7);text-decoration:underline;">click here</a>
    </p>
  `);

  const text = `${greeting}\n\nYou are now on the Phantom Grid Promo List.\nWe'll send you new releases and promo materials as they come.\n\nUnsubscribe: ${unsubscribeUrl}`;

  await transporter.sendMail({ from: FROM, to, subject: 'Welcome to the Promo List — PHANTOM GRID', html, text });
}

export async function sendBandcampPromoEmail(
  to: string,
  name: string,
  promoUrl: string,
  releaseTitle: string,
): Promise<void> {
  const greeting = name ? `${name},` : 'Hey,';

  const html = baseHtml(`
    <h1 style="margin:0 0 16px;color:#E8E4D8;font-size:22px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">
      Your Download Is Ready
    </h1>
    <p style="margin:0 0 8px;color:rgba(220,220,220,0.6);font-size:13px;letter-spacing:0.08em;line-height:1.8;">
      ${greeting} thank you for purchasing <strong style="color:#E8E4D8;">${releaseTitle}</strong>.
    </p>
    <p style="margin:0 0 24px;color:rgba(220,220,220,0.6);font-size:13px;letter-spacing:0.08em;line-height:1.8;">
      Your personal download link is below. Use it to access lossless files, stream the release,
      and leave feedback. This link is unique to your purchase &mdash; do not share it.
    </p>
    <a href="${promoUrl}" style="display:inline-block;background:#D6524C;color:#fff;font-size:12px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;padding:13px 28px;text-decoration:none;">
      ACCESS DOWNLOAD
    </a>
    <p style="margin:28px 0 0;color:rgba(220,220,220,0.25);font-size:11px;letter-spacing:0.08em;line-height:1.7;">
      Link: <a href="${promoUrl}" style="color:rgba(214,82,76,0.5);">${promoUrl}</a>
    </p>
  `);

  const text = `${greeting}\n\nThank you for purchasing ${releaseTitle}.\n\nYour personal download link:\n${promoUrl}\n\nThis link is unique to your purchase — do not share it.`;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Your download: ${releaseTitle} — PHANTOM GRID`,
    html,
    text,
  });
}
