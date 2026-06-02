/**
 * POST /api/bandcamp-webhook
 *
 * Receives Bandcamp merchant webhook events. Bandcamp posts JSON with sale
 * data when a purchase is made. Configure the webhook URL in your Bandcamp
 * account settings and set BANDCAMP_WEBHOOK_SECRET to the secret Bandcamp
 * provides (used to verify the X-Bandcamp-Webhook-Token header).
 *
 * If Bandcamp does not supply a token header, set BANDCAMP_WEBHOOK_SECRET=""
 * and verification is skipped (not recommended for production).
 *
 * Expected payload (Bandcamp merchant webhook format):
 * {
 *   "hook_id": "...",
 *   "event": "sale",
 *   "data": {
 *     "sale_id": "...",
 *     "buyer_name": "...",
 *     "buyer_email": "...",
 *     "packages": [{ "item_id": "...", "title": "..." }]
 *   }
 * }
 */
export const prerender = false;

import type { APIContext } from 'astro';
import { processBandcampSale } from '../../lib/bandcamp';

const WEBHOOK_SECRET = process.env.BANDCAMP_WEBHOOK_SECRET ?? '';

export const POST = async ({ request }: APIContext) => {
  // Verify shared secret when configured
  if (WEBHOOK_SECRET) {
    const incoming =
      request.headers.get('x-bandcamp-webhook-token') ??
      request.headers.get('x-webhook-token') ??
      '';
    if (incoming !== WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Accept both wrapped {"event":"sale","data":{...}} and flat sale objects
  const event = body?.event ?? 'sale';
  if (event !== 'sale') {
    // Not a sale event — acknowledge and ignore
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const data = body?.data ?? body;
  const saleId: string = String(data?.sale_id ?? data?.id ?? '');
  const buyerEmail: string = data?.buyer_email ?? data?.email ?? '';
  const buyerName: string = data?.buyer_name ?? data?.name ?? '';
  const packages: any[] = data?.packages ?? [];
  const firstPkg = packages[0] ?? {};
  const bandcampItemId: string | undefined = firstPkg?.item_id ? String(firstPkg.item_id) : undefined;
  const itemTitle: string | undefined = firstPkg?.title ?? data?.item_title;

  if (!saleId || !buyerEmail) {
    return new Response(JSON.stringify({ error: 'Missing sale_id or buyer_email' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    });
  }

  const result = await processBandcampSale({
    saleId,
    buyerEmail,
    buyerName,
    bandcampItemId,
    itemTitle,
  });

  const status = result.status === 'error' ? 500 : 200;
  return new Response(JSON.stringify(result), {
    status,
    headers: { 'content-type': 'application/json' },
  });
};
