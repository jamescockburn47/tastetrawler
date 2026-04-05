/**
 * Tavily web search client.
 *
 * Same discipline as lib/ebay/client.ts: every failure throws with enough
 * detail to diagnose. No silent empty arrays.
 *
 * Docs: https://docs.tavily.com/documentation/api-reference/endpoint/search
 */

export class TavilyClientError extends Error {
  readonly stage: 'env' | 'search';
  readonly status?: number;
  readonly body?: unknown;

  constructor(
    stage: 'env' | 'search',
    message: string,
    opts: { status?: number; body?: unknown } = {},
  ) {
    super(message);
    this.name = 'TavilyClientError';
    this.stage = stage;
    this.status = opts.status;
    this.body = opts.body;
  }
}

export interface TavilyResult {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

interface TavilyRawResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  query: string;
  results: TavilyRawResult[];
  answer?: string;
  response_time?: number;
}

/**
 * Search the open web via Tavily. Returns a normalised list. Throws on any
 * failure — callers must catch TavilyClientError and decide how to present
 * it (the /api/web-search route returns a 502 with structured error info).
 */
export async function searchWeb(
  query: string,
  opts: { maxResults?: number; includeAnswer?: boolean } = {},
): Promise<{ results: TavilyResult[]; answer?: string }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new TavilyClientError(
      'env',
      'TAVILY_API_KEY is not set in the Vercel environment',
    );
  }

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      max_results: opts.maxResults ?? 5,
      include_answer: opts.includeAnswer ?? true,
      search_depth: 'basic',
    }),
  });

  const rawText = await res.text();
  let data: TavilyResponse & { error?: string; detail?: unknown };
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new TavilyClientError('search', 'Tavily returned non-JSON', {
      status: res.status,
      body: rawText.slice(0, 500),
    });
  }

  if (!res.ok) {
    throw new TavilyClientError(
      'search',
      `Tavily search HTTP ${res.status}: ${data.error ?? 'unknown error'}`,
      { status: res.status, body: data },
    );
  }

  const results: TavilyResult[] = (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
    score: r.score,
  }));

  return { results, answer: data.answer };
}
