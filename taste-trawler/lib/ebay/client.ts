import type { EbaySearchResponse, CompResult } from './types';

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
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

  const data: EbaySearchResponse = await res.json();

  return (data.itemSummaries ?? []).map((item) => ({
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
