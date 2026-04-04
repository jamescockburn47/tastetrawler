import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status');

  const query = db.select().from(items).orderBy(desc(items.createdAt));

  const result = status
    ? await query.where(eq(items.status, status as any))
    : await query;

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const [item] = await db.insert(items).values({
    ...body,
    buyPrice: body.buyPrice ? Math.round(body.buyPrice) : null,
    listPrice: body.listPrice ? Math.round(body.listPrice) : null,
  }).returning();

  return NextResponse.json(item, { status: 201 });
}
