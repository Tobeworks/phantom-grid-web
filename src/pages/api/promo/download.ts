export const prerender = false;

import type { APIContext } from 'astro';
import { getPromoByToken, logDownload } from '../../../lib/pocketbase';
import releasesData from '../../../../phantom-grid-os/data/releases.json';
import { zipSync } from 'fflate';

export const GET = async ({ request, url }: APIContext) => {
  const token    = url.searchParams.get('t');
  const quality  = url.searchParams.get('q');
  const trackParam = url.searchParams.get('track'); // null = all tracks, number = single

  if (!token || (quality !== '128' && quality !== '320')) {
    return new Response('Bad request', { status: 400 });
  }

  const promo = await getPromoByToken(token);
  if (!promo) return new Response('Forbidden', { status: 403 });
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return new Response('Gone — promo link expired', { status: 410 });
  }

  const release = releasesData.releases.find(
    (r) => r.catalog.toLowerCase() === promo.release_slug
  );
  if (!release) return new Response('Release not found', { status: 404 });

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const user_agent = request.headers.get('user-agent') ?? 'unknown';

  // ── Single track redirect ──────────────────────────────────────────────────
  if (trackParam !== null) {
    const trackNum = Number(trackParam);
    const track = release.tracks.find((t) => t.number === trackNum);
    if (!track) return new Response('Track not found', { status: 404 });

    const cdnUrl = quality === '320' ? track.url_320 : track.url;
    if (!cdnUrl) return new Response('Audio file not available', { status: 404 });

    logDownload({ promo: promo.id, quality, ip, user_agent });

    return new Response(null, {
      status: 302,
      headers: { Location: cdnUrl },
    });
  }

  // ── ZIP: all tracks ────────────────────────────────────────────────────────
  const zipLabel = quality === '320' ? '320k' : '128k';
  const zipFilename = `${release.catalog.toLowerCase()}_${release.artist.toLowerCase().replace(/\s+/g, '_')}_${zipLabel}.zip`;

  // Fetch all tracks in parallel
  const fetched = await Promise.all(
    release.tracks.map(async (track) => {
      const cdnUrl = quality === '320' ? track.url_320 : track.url;
      if (!cdnUrl) return null;
      const res = await fetch(cdnUrl);
      if (!res.ok) return null;
      const buf = await res.arrayBuffer();
      // Build filename: 01_trackname.mp3
      const trackLabel = track.title.replace(/^.*?\s{2,}/, '').trim() || track.title;
      const filename = `${String(track.number).padStart(2, '0')}_${trackLabel.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase()}.mp3`;
      return { filename, data: new Uint8Array(buf) };
    })
  );

  const validTracks = fetched.filter(Boolean) as { filename: string; data: Uint8Array }[];
  if (validTracks.length === 0) return new Response('No audio files available', { status: 404 });

  // Build ZIP synchronously (fflate)
  const zipInput: Record<string, Uint8Array> = {};
  for (const t of validTracks) {
    zipInput[t.filename] = t.data;
  }
  const zipped = zipSync(zipInput, { level: 0 }); // level 0 = store, MP3s don't compress

  // Log one download event per quality for the whole batch
  logDownload({ promo: promo.id, quality, ip, user_agent });

  return new Response(zipped, {
    status: 200,
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${zipFilename}"`,
      'content-length': String(zipped.byteLength),
    },
  });
};
