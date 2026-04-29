import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { saleEvents, sales } from '@/lib/db/schema';
import { isApiKeyOrClerkAuthenticated } from '@/lib/api-auth';
import { buildSaleValues, saleNeedsMoreInfo } from '@/lib/sales/ledger';
import type { SaleStatus } from '@/lib/sales/ledger-utils';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: NextRequest) {
  if (!(await isApiKeyOrClerkAuthenticated(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: CORS });
  }

  const status = request.nextUrl.searchParams.get('status') as SaleStatus | null;
  const query = db.select().from(sales).orderBy(desc(sales.createdAt));
  const rows = status ? await query.where(eq(sales.status, status)) : await query;
  return NextResponse.json(rows, { headers: CORS });
}

export async function POST(request: NextRequest) {
  if (!(await isApiKeyOrClerkAuthenticated(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: CORS });
  }

  try {
    const body = await request.json();
    const input = body ?? {};
    const values = buildSaleValues(input);
    const missing = saleNeedsMoreInfo(input);
    const [sale] = await db.insert(sales).values(values).returning();

    await db.insert(saleEvents).values({
      saleId: sale.id,
      type: 'created',
      actor: body?.actor ?? 'bot',
      message: 'Sale draft created from guided intake.',
      payload: {
        missing,
        source: body?.source ?? 'whatsapp',
      },
    });

    return NextResponse.json(
      { sale, missing },
      { status: 201, headers: CORS },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500, headers: CORS });
  }
}
