import type { EbaySearchResponse, CompResult } from './types';

/**
 * eBay Browse API client.
 *
 * HARD RULE: every failure must surface. The bot's tt_search_comps was
 * returning empty arrays for months because the original code did
 * `data.itemSummaries ?? []` and swallowed 401s, expired tokens, disabled
 * keysets, and eBay-side warnings. Silent empty results are worse than
 * errors because they look like "no comps for this item" to MG and
 * James — indistinguishable from a truly empty search.
 *
 * Contract: searchEbay resolves with results OR throws EbayClientError
 * with enough detail to diagnose the cause. The route layer decides how
 * to present the error to callers.
 */

export class EbayClientError extends Error {
  readonly stage: 'env' | 'token' | 'search';
  readonly status?: number;
  readonly body?: unknown;

  constructor(
    stage: 'env' | 'token' | 'search',
    message: string,
    opts: { status?: number; body?: unknown } = {},
  ) {
    super(message);
    this.name = 'EbayClientError';
    this.stage = stage;
    this.status = opts.status;
    this.body = opts.body;
  }
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new EbayClientError(
      'env',
      'EBAY_CLIENT_ID or EBAY_CLIENT_SECRET is not set in the Vercel environment',
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });

  const rawText = await res.text();
  let data: { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new EbayClientError('token', 'eBay token endpoint returned non-JSON', {
      status: res.status,
      body: rawText.slice(0, 500),
    });
  }

  if (!res.ok || !data.access_token) {
    throw new EbayClientError(
      'token',
      `eBay token fetch failed: ${data.error ?? 'unknown'} ${data.error_description ?? ''}`.trim(),
      { status: res.status, body: data },
    );
  }

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + ((data.expires_in ?? 7200) - 60) * 1000,
  };
  return data.access_token;
}

export async function searchEbay(query: string, limit = 10): Promise<CompResult[]> {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    filter: 'deliveryCountry:GB',
    sort: 'price',
  });

  const res = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
      },
    }
  );

  const rawText = await res.text();
  let data: EbaySearchResponse & { errors?: unknown[]; warnings?: unknown[] };
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new EbayClientError('search', 'eBay search returned non-JSON', {
      status: res.status,
      body: rawText.slice(0, 500),
    });
  }

  if (!res.ok) {
    // On auth failure, invalidate the cached token so the next call retries.
    if (res.status === 401 || res.status === 403) {
      tokenCache = null;
    }
    throw new EbayClientError(
      'search',
      `eBay search HTTP ${res.status}`,
      { status: res.status, body: data },
    );
  }

  // eBay returns 200 + warnings when the keyset is limited or the filter
  // rejected — log these so we can see them even when there are items.
  if (data.warnings && Array.isArray(data.warnings) && data.warnings.length > 0) {
    console.warn('[ebay] warnings for query', JSON.stringify(query), data.warnings);
  }

  const items = data.itemSummaries ?? [];
  return items.map((item) => ({
    platform: 'ebay' as const,
    title: item.title,
    price: Math.round(parseFloat(item.price.value) * 100),
    url: item.itemWebUrl,
    imageUrl: item.image.imageUrl,
    condition: item.condition,
    seller: item.seller.username,
  }));
}

export async function searchCharityStores(query: string): Promise<CompResult[]> {
  const charitySellerIds = [
    'britishheartfoundationshop',
    'oxaboroughmarket',
    'sueryderpreloved',
  ];

  const results: CompResult[] = [];

  for (const seller of charitySellerIds) {
    const sellerResults = await searchEbay(`${query} seller:${seller}`, 5);
    results.push(...sellerResults);
  }

  return results;
}
