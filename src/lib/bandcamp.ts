import { randomBytes } from 'crypto';
import {
  createPromo,
  getPromoByEmailAndSlug,
  recordBandcampSale,
  bandcampSaleProcessed,
} from './pocketbase';
import { sendBandcampPromoEmail } from './mailer';
import releasesData from '../../phantom-grid-os/data/releases.json';

const SITE_URL = process.env.SITE_URL ?? 'https://phantom-grid.de';

/**
 * Map from Bandcamp album/item ID (string) to release_slug (catalog lowercase).
 * Set BANDCAMP_RELEASE_MAP as JSON, e.g.: {"12345678":"pg-001"}
 * Falls back to fuzzy title matching against releases.json.
 */
function getReleaseSlug(bandcampItemId?: string, itemTitle?: string): string | null {
  const raw = process.env.BANDCAMP_RELEASE_MAP;
  if (raw && bandcampItemId) {
    try {
      const map: Record<string, string> = JSON.parse(raw);
      if (map[bandcampItemId]) return map[bandcampItemId];
    } catch { /* ignore malformed env */ }
  }

  // Fuzzy match by title
  if (itemTitle) {
    const needle = itemTitle.toLowerCase();
    const hit = releasesData.releases.find(
      (r) => r.title.toLowerCase() === needle || r.catalog.toLowerCase() === needle,
    );
    if (hit) return hit.catalog.toLowerCase();
  }

  // If there is only one release, default to it
  if (releasesData.releases.length === 1) {
    return releasesData.releases[0].catalog.toLowerCase();
  }

  return null;
}

export interface SaleEvent {
  saleId: string;
  buyerEmail: string;
  buyerName: string;
  bandcampItemId?: string;
  itemTitle?: string;
}

export interface ProcessResult {
  status: 'created' | 'duplicate' | 'already_processed' | 'no_release' | 'error';
  error?: string;
}

/** Core logic: given a confirmed sale, create a promo token and email the buyer. */
export async function processBandcampSale(sale: SaleEvent): Promise<ProcessResult> {
  try {
    if (await bandcampSaleProcessed(sale.saleId)) {
      return { status: 'already_processed' };
    }

    const releaseSlug = getReleaseSlug(sale.bandcampItemId, sale.itemTitle);
    if (!releaseSlug) return { status: 'no_release' };

    const release = releasesData.releases.find(
      (r) => r.catalog.toLowerCase() === releaseSlug,
    );
    const releaseTitle = release ? `${release.artist} — ${release.title}` : releaseSlug;

    // Dedup: same email + release gets the same token resent
    let promo = await getPromoByEmailAndSlug(sale.buyerEmail, releaseSlug);
    let isNew = false;

    if (!promo) {
      const token = randomBytes(24).toString('hex');
      promo = await createPromo({
        token,
        release_slug: releaseSlug,
        recipient_name: sale.buyerName,
        recipient_email: sale.buyerEmail,
        notes: `Auto-created from Bandcamp sale ${sale.saleId}`,
      });
      isNew = true;
    }

    const promoUrl = `${SITE_URL}/promo/${releaseSlug}?t=${promo.token}`;
    await sendBandcampPromoEmail(sale.buyerEmail, sale.buyerName, promoUrl, releaseTitle);
    await recordBandcampSale(sale.saleId);

    return { status: isNew ? 'created' : 'duplicate' };
  } catch (e: any) {
    return { status: 'error', error: e?.message ?? String(e) };
  }
}
