/**
 * POST /api/bandcamp-poll
 *
 * Polls the Bandcamp API v1 sales report for recent purchases and processes
 * any new sales. Intended to be called by a cron job (e.g., every 5 minutes).
 *
 * Required env vars:
 *   BANDCAMP_BAND_ID      — your Bandcamp band/account numeric ID
 *   BANDCAMP_CLIENT_ID    — API client ID from Bandcamp developer portal
 *   BANDCAMP_ACCESS_TOKEN — OAuth access token with sales read permission
 *   BANDCAMP_POLL_SECRET  — shared secret for this endpoint (sent as X-Poll-Secret header)
 *
 * Optional:
 *   BANDCAMP_POLL_LOOKBACK_HOURS — how many hours back to look (default: 1)
 */
export const prerender = false;

import type { APIContext } from 'astro';
import { processBandcampSale } from '../../lib/bandcamp';

const POLL_SECRET = process.env.BANDCAMP_POLL_SECRET ?? '';
const BAND_ID = process.env.BANDCAMP_BAND_ID ?? '';
const CLIENT_ID = process.env.BANDCAMP_CLIENT_ID ?? '';
const ACCESS_TOKEN = process.env.BANDCAMP_ACCESS_TOKEN ?? '';
const LOOKBACK_HOURS = Number(process.env.BANDCAMP_POLL_LOOKBACK_HOURS ?? 1);

export const POST = async ({ request }: APIContext) => {
  if (!POLL_SECRET) {
    return new Response(JSON.stringify({ error: 'BANDCAMP_POLL_SECRET not configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const incoming = request.headers.get('x-poll-secret') ?? '';
  if (incoming !== POLL_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!BAND_ID || !CLIENT_ID || !ACCESS_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'Bandcamp API credentials not configured' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }

  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - LOOKBACK_HOURS * 3600;

  const url = new URL('https://bandcamp.com/api/sales/1/sales_report');
  url.searchParams.set('band_id', BAND_ID);
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('access_token', ACCESS_TOKEN);
  url.searchParams.set('start_time', String(startTime));
  url.searchParams.set('end_time', String(endTime));
  url.searchParams.set('format', 'json');

  let sales: any[];
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = await res.text();
      return new Response(
        JSON.stringify({ error: `Bandcamp API error ${res.status}`, detail: body }),
        { status: 502, headers: { 'content-type': 'application/json' } },
      );
    }
    const data = await res.json();
    // Bandcamp returns { sale_items: [...] } or a flat array
    sales = data?.sale_items ?? data?.items ?? (Array.isArray(data) ? data : []);
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch Bandcamp sales', detail: e?.message }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  const results: Array<{ saleId: string; status: string; error?: string }> = [];

  for (const sale of sales) {
    const saleId = String(sale?.sale_id ?? sale?.id ?? '');
    const buyerEmail = sale?.buyer_email ?? sale?.email ?? '';
    const buyerName = sale?.buyer_name ?? sale?.name ?? '';
    // album/track field varies by API version
    const bandcampItemId = sale?.album_id ? String(sale.album_id) : sale?.item_id ? String(sale.item_id) : undefined;
    const itemTitle = sale?.album_title ?? sale?.item_title ?? sale?.title;

    if (!saleId || !buyerEmail) continue;

    const result = await processBandcampSale({
      saleId,
      buyerEmail,
      buyerName,
      bandcampItemId,
      itemTitle,
    });

    results.push({ saleId, ...result });
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
};
