import { NextRequest, NextResponse } from 'next/server';
import { searchWeb, TavilyClientError } from '@/lib/tavily/client';

/**
 * Web search via Tavily. Called by the bot's tt_web_search tool through
 * tt-api.js. Returns normalised results plus an optional AI-generated
 * answer summary. Errors surface with structured stage/status/message
 * rather than silent empty arrays (see lib/tavily/client.ts for the
 * error discipline rationale).
 */
export async function POST(request: NextRequest) {
  const { query, maxResults } = await request.json();

  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'query required' }, { status: 400 });
  }

  try {
    const { results, answer } = await searchWeb(query, {
      maxResults: typeof maxResults === 'number' ? maxResults : 5,
    });
    return NextResponse.json({ results, answer });
  } catch (err) {
    if (err instanceof TavilyClientError) {
      console.error('[api/web-search] TavilyClientError', {
        stage: err.stage,
        status: err.status,
        message: err.message,
        body: err.body,
      });
      return NextResponse.json(
        {
          results: [],
          error: {
            source: 'tavily',
            stage: err.stage,
            status: err.status,
            message: err.message,
          },
        },
        { status: 502 },
      );
    }
    console.error('[api/web-search] unexpected error', err);
    return NextResponse.json(
      {
        results: [],
        error: {
          source: 'server',
          message: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 500 },
    );
  }
}
