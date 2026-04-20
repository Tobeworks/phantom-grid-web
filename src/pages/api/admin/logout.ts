export const prerender = false;

import type { APIContext } from 'astro';

export const POST = async ({ cookies }: APIContext) => {
  cookies.delete('admin_token', { path: '/' });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
