export const prerender = false;

import type { APIContext } from 'astro';
import { getCampaigns } from '../../../../lib/pocketbase';
import { getConfirmedSubscribers } from '../../../../lib/pocketbase';

export const GET = async () => {
  const [campaigns, subscribers] = await Promise.all([
    getCampaigns(),
    getConfirmedSubscribers(),
  ]);

  return new Response(JSON.stringify({ campaigns, subscriberCount: subscribers.length }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
