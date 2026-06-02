export const prerender = false;

import type { APIContext } from 'astro';
import { getCampaigns, getConfirmedSubscribers, createCampaign } from '../../../../lib/pocketbase';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

export const GET = async () => {
  const [campaigns, subscribers] = await Promise.all([
    getCampaigns(),
    getConfirmedSubscribers(),
  ]);
  return json({ campaigns, subscriberCount: subscribers.length });
};

export const POST = async ({ request }: APIContext) => {
  let body: Record<string, string> = {};
  try { body = await request.json(); } catch {
    return json({ error: 'Invalid body' }, 400);
  }
  const { subject, body_html, body_text } = body;
  if (!subject) return json({ error: 'Subject required' }, 422);
  try {
    const campaign = await createCampaign(subject, body_html ?? '', body_text ?? '');
    return json(campaign, 201);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
};
