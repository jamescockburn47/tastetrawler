import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { and, or, isNull, eq, sql } from 'drizzle-orm';
import { analysePhotos } from '@/lib/ai/analyse-photos';

export const maxDuration = 300;

/**
 * Batch Gemini enrichment for items missing derived fields.
 *
 * Called by the VPS bot's `tt_tidy_inventory` tool. Processes up to `limit`
 * items per call so no single invocation hits function-timeout limits; the
 * bot loops until `remaining === 0`.
 *
 * An item is considered "needs enrichment" if it has photos but is missing
 * any of: tasteVector, era, styleTags, colours, material.
 */
export async function POST(request: NextRequest) {
  // Auth deliberately omitted — consistent with the rest of the Phase 1 API
  // which is wide open. Revisit when auth is applied uniformly across routes.
  const body = await request.json().catch(() => ({}));
  const limit: number = Math.min(Math.max(body.limit ?? 20, 1), 40);

  // Items with real photos but missing derived fields.
  // `photos` is jsonb; require at least one URL AND exclude seed data
  // whose first photo points at example.com.
  const whereClause = and(
    sql`jsonb_array_length(${items.photos}) > 0`,
    sql`${items.photos}->>0 NOT LIKE '%example.com%'`,
    or(
      isNull(items.tasteVector),
      isNull(items.era),
      sql`${items.styleTags} = '[]'::jsonb`,
      sql`${items.colours} = '[]'::jsonb`,
    ),
  );

  const candidates = await db.select().from(items).where(whereClause).limit(limit);

  const total = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(items)
    .where(whereClause);
  const remainingBefore = total[0]?.n ?? 0;

  let enriched = 0;
  let failed = 0;
  const failures: { id: string; error: string }[] = [];

  for (const item of candidates) {
    try {
      const analysis = await analysePhotos(item.photos);

      // Build a simple taste vector from style tags (placeholder — real
      // version would use embeddings). For now: uniform weights so the
      // field is non-null and downstream code can rely on it existing.
      const tasteVector: Record<string, number> = {};
      for (const tag of analysis.styleTags ?? []) tasteVector[tag] = 1;

      await db
        .update(items)
        .set({
          // Don't clobber fields MG or Vinted already populated — only fill gaps.
          brand: item.brand ?? analysis.brand,
          category: item.category ?? analysis.category,
          condition: item.condition ?? analysis.condition,
          era: item.era ?? analysis.era,
          colours: (item.colours?.length ?? 0) > 0 ? item.colours : analysis.colours,
          material: item.material ?? analysis.material,
          styleTags: (item.styleTags?.length ?? 0) > 0 ? item.styleTags : analysis.styleTags,
          size: item.size ?? analysis.size,
          storyPotentialScore: item.storyPotentialScore ?? analysis.storyPotentialScore,
          tasteVector,
          updatedAt: new Date(),
        })
        .where(eq(items.id, item.id));

      enriched++;
    } catch (e) {
      failed++;
      failures.push({
        id: item.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    enriched,
    failed,
    processed: candidates.length,
    remaining: Math.max(remainingBefore - candidates.length, 0),
    failures: failures.slice(0, 5),
  });
}
