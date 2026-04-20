export const prerender = false;

import type { APIContext } from 'astro';
import { getConfirmedSubscribers } from '../../../../../lib/pocketbase';

export const GET = async () => {
  const subscribers = await getConfirmedSubscribers();
  return new Response(JSON.stringify({ count: subscribers.length }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
