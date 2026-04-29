import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { desc, ilike, or, gte, and, sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { chatImages } from '@/lib/db/schema';
import { isApiKeyAuthenticated } from '@/lib/api-auth';

/**
 * /api/chat-images
 *
 * POST — the WhatsApp bot calls this whenever MG or James sends a photo,
 *        whether or not the bot is being addressed. The bot downloads the
 *        image bytes, runs the VLM locally (it holds the MiniMax key), and
 *        then hands off both the base64 bytes and the description here.
 *        We persist the bytes to Vercel Blob and store an indexed row.
 *
 *        Body: {
 *          imageBase64: string,         // raw base64, no data: prefix
 *          mime?: string,               // defaults to image/jpeg
 *          vlmDescription: string,      // full VLM text
 *          caption?: string,            // any text that came with the image
 *          jid: string,                 // WhatsApp JID (group or DM)
 *          speakerName?: string,        // pushName from Baileys
 *          speakerId?: string,          // participant JID / LID
 *          isGroup?: boolean,
 *          tags?: string[],             // free-form keywords for cheap recall
 *          respondedAt?: number,        // ms epoch if bot replied
 *        }
 *
 * GET  — search/recall. Query params:
 *          q        — free text, ILIKE against vlm_description + caption + discussion
 *          since    — ISO date or ms epoch; only rows observed since then
 *          jid      — scope to one chat
 *          limit    — default 20, max 100
 *
 * Auth: Bearer TT_API_KEY (bot-only). GET is auth-gated too so photos don't
 *       leak via a public endpoint.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: NextRequest) {
  if (!isApiKeyAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: CORS });
  }
  try {
    const body = await request.json();
    const {
      imageBase64,
      mime = 'image/jpeg',
      vlmDescription = '',
      caption,
      jid,
      speakerName,
      speakerId,
      isGroup = false,
      tags = [],
      vlmAnalysis,
      respondedAt,
    } = body ?? {};

    if (!imageBase64 || !jid) {
      return NextResponse.json(
        { error: 'imageBase64 and jid are required' },
        { status: 400, headers: CORS },
      );
    }

    const buffer = Buffer.from(imageBase64, 'base64');
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const key = `chat-images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const blob = await put(key, buffer, {
      access: 'public',
      contentType: mime,
    });

    const [row] = await db
      .insert(chatImages)
      .values({
        blobUrl: blob.url,
        vlmDescription,
        caption: caption ?? null,
        jid,
        speakerName: speakerName ?? null,
        speakerId: speakerId ?? null,
        isGroup: isGroup ? 'true' : 'false',
        vlmAnalysis: vlmAnalysis ?? null,
        tags,
        respondedAt: respondedAt ? new Date(respondedAt) : null,
      })
      .returning();

    return NextResponse.json(row, { status: 201, headers: CORS });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500, headers: CORS });
  }
}

export async function GET(request: NextRequest) {
  if (!isApiKeyAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: CORS });
  }
  try {
    const params = request.nextUrl.searchParams;
    const q = params.get('q')?.trim();
    const since = params.get('since');
    const jid = params.get('jid');
    const limit = Math.min(parseInt(params.get('limit') || '20', 10) || 20, 100);

    const conditions: SQL[] = [];
    if (q) {
      const like = `%${q}%`;
      const searchCondition = or(
        ilike(chatImages.vlmDescription, like),
        ilike(chatImages.caption, like),
        ilike(chatImages.discussion, like),
      );
      if (searchCondition) conditions.push(searchCondition);
    }
    if (since) {
      const d = /^\d+$/.test(since) ? new Date(parseInt(since, 10)) : new Date(since);
      if (!isNaN(d.getTime())) conditions.push(gte(chatImages.observedAt, d));
    }
    if (jid) {
      conditions.push(sql`${chatImages.jid} = ${jid}`);
    }

    const base = db.select().from(chatImages).orderBy(desc(chatImages.observedAt)).limit(limit);
    const rows = conditions.length ? await base.where(and(...conditions)) : await base;
    return NextResponse.json(rows, { headers: CORS });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500, headers: CORS });
  }
}
