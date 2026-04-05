const PB_URL = process.env.POCKETBASE_URL ?? import.meta.env.POCKETBASE_URL ?? 'http://pocketbase:8090';

export interface PromoRecord {
  id: string;
  token: string;
  release_slug: string;
  recipient_name: string;
  recipient_email?: string;
  notes?: string;
  expires_at?: string;
}

/** Finds a promo record by token. Returns null if not found. */
export async function getPromoByToken(token: string): Promise<PromoRecord | null> {
  const filter = encodeURIComponent(`token='${token}'`);
  try {
    const res = await fetch(
      `${PB_URL}/api/collections/promos/records?filter=${filter}&perPage=1`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.items?.[0] as PromoRecord) ?? null;
  } catch {
    return null;
  }
}

export interface FeedbackRecord {
  id: string;
  name: string;
  comment: string;
  created: string;
}

/** Loads all feedback for a given release slug (via promo relation). */
export async function getFeedbackForRelease(releaseSlug: string): Promise<FeedbackRecord[]> {
  const filter = encodeURIComponent(`release_slug='${releaseSlug}'`);
  try {
    const authHeader = {};

    const promosRes = await fetch(
      `${PB_URL}/api/collections/promos/records?filter=${filter}&perPage=100&fields=id`,
      { headers: { 'Content-Type': 'application/json', ...authHeader } }
    );
    const promosData = await promosRes.json();
    const promoIds: string[] = (promosData.items ?? []).map((p: { id: string }) => p.id);
    if (promoIds.length === 0) return [];

    const feedbackRes = await fetch(
      `${PB_URL}/api/collections/feedback/records?perPage=100`,
      { headers: { 'Content-Type': 'application/json', ...authHeader } }
    );
    const feedbackData = await feedbackRes.json();
    const promoIdSet = new Set(promoIds);
    return (feedbackData.items ?? [])
      .filter((item: any) => promoIdSet.has(item.promo))
      .map((item: any) => ({ id: item.id, name: item.name, comment: item.comment, created: item.created ?? '' }));
  } catch {
    return [];
  }
}

/** Creates a feedback record. */
export async function createFeedback(payload: {
  promo: string;
  name: string;
  email: string;
  comment: string;
  user_agent: string;
  ip: string;
}): Promise<{ id: string }> {
  const res = await fetch(`${PB_URL}/api/collections/feedback/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PocketBase feedback create failed: ${res.status} ${err}`);
  }
  return res.json();
}

/** Logs a download event. Fire-and-forget — swallows errors. */
export async function logDownload(payload: {
  promo: string;
  quality: '128' | '320';
  user_agent: string;
  ip: string;
}): Promise<void> {
  await fetch(`${PB_URL}/api/collections/download_events/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
