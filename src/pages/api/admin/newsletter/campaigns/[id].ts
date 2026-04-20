export const prerender = false;

import type { APIContext } from 'astro';
import { getCampaign, updateCampaign, deleteCampaign } from '../../../../lib/pocketbase';

export const GET = async ({ params }: APIContext) => {
  const campaign = await getCampaign(params.id!);
  if (!campaign) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
  }
  return new Response(JSON.stringify(campaign), { status: 200, headers: { 'content-type': 'application/json' } });
};

export const PATCH = async ({ request, params }: APIContext) => {
  let body: Record<string, any> = {};
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  const updated = await updateCampaign(params.id!, body);
  return new Response(JSON.stringify(updated), { status: 200, headers: { 'content-type': 'application/json' } });
};

export const DELETE = async ({ params }: APIContext) => {
  await deleteCampaign(params.id!);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
};
