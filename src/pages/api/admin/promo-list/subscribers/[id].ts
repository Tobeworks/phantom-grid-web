export const prerender = false;

import type { APIContext } from 'astro';
import { deletePromoSubscriber } from '../../../../lib/pocketbase';

export const DELETE = async ({ params }: APIContext) => {
  await deletePromoSubscriber(params.id!);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
