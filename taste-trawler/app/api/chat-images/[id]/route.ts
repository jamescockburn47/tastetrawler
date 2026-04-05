import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { chatImages } from '@/lib/db/schema';
import { isApiKeyAuthenticated } from '@/lib/api-auth';

/**
 * PATCH /api/chat-images/:id
 *
 * Used by the bot to accrete conversation onto a stored image. Every time
 * the bot answers a question that touches a past image, it calls this with
 * { append: "bot reply text" } so MG has a log of what was said about each
 * photo over time.
 *
 * Body:
 *   append?: string       — text to append to the discussion field
 *   respondedAt?: number  — ms epoch, set first time bot responds
 *   tags?: string[]       — additional tags to union onto the existing set
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isApiKeyAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: CORS });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const { append, respondedAt, tags: newTags } = body ?? {};

    const [existing] = await db.select().from(chatImages).where(eq(chatImages.id, id));
    if (!existing) {
      return NextResponse.json({ error: 'not found' }, { status: 404, headers: CORS });
    }

    const discussion = append
      ? [existing.discussion, `[${new Date().toISOString()}] ${append}`]
          .filter((s) => s && s.length)
          .join('\n')
      : existing.discussion;

    const tags = Array.isArray(newTags)
      ? Array.from(new Set([...(existing.tags ?? []), ...newTags]))
      : existing.tags;

    const [updated] = await db
      .update(chatImages)
      .set({
        discussion,
        tags,
        respondedAt: respondedAt ? new Date(respondedAt) : existing.respondedAt,
      })
      .where(eq(chatImages.id, id))
      .returning();

    return NextResponse.json(updated, { headers: CORS });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500, headers: CORS });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isApiKeyAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: CORS });
  }
  const { id } = await params;
  const [row] = await db.select().from(chatImages).where(eq(chatImages.id, id));
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404, headers: CORS });
  return NextResponse.json(row, { headers: CORS });
}
