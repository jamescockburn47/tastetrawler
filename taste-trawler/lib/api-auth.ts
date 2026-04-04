import { NextRequest } from 'next/server';

export function isApiKeyAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.TASTE_TRAWLER_API_KEY;
  if (!expectedKey) return false;
  return authHeader === `Bearer ${expectedKey}`;
}
