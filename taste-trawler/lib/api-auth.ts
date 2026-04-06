import { NextRequest } from 'next/server';

/**
 * Checks `Authorization: Bearer <key>` against any configured API key.
 *
 * We accept multiple env var names because the bot and the web app were
 * bootstrapped at different times under different names (TT_API_KEY on
 * the VPS, TASTE_TRAWLER_API_KEY in the original code). Either works.
 */
export function isApiKeyAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const presented = authHeader.slice('Bearer '.length);

  const candidates = [
    process.env.TASTE_TRAWLER_API_KEY,
    process.env.TT_API_KEY,
  ].filter((v): v is string => typeof v === 'string' && v.length > 0)
   .map((v) => v.trim());

  return candidates.some((k) => k === presented);
}
