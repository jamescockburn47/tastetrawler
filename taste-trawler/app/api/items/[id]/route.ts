import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [item] = await db.select().from(items).where(eq(items.id, id));

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(items)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(items.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(items).where(eq(items.id, id));
  return NextResponse.json({ ok: true });
}
