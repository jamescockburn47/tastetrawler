import type { NewSale } from '@/lib/db/schema';

export type SaleStatus = 'draft' | 'needs_review' | 'confirmed' | 'void';
export type SalePlatform = 'vinted' | 'ebay' | 'depop' | 'in_person' | 'other';

export interface SaleDraftInput {
  itemId?: string | null;
  chatImageIds?: string[];
  salePrice?: number | null;
  buyPriceAtSale?: number | null;
  fees?: number | null;
  postage?: number | null;
  discount?: number | null;
  platform?: SalePlatform | null;
  soldAt?: string | Date | null;
  notes?: string | null;
  sourceJid?: string | null;
  sourceMessage?: string | null;
  confidence?: number | null;
  status?: SaleStatus | null;
}

export function computeNetProceeds(input: {
  salePrice?: number | null;
  fees?: number | null;
  postage?: number | null;
  discount?: number | null;
}): number | null {
  if (input.salePrice == null) return null;
  return input.salePrice - (input.fees ?? 0) - (input.postage ?? 0) - (input.discount ?? 0);
}

export function inferSaleStatus(input: SaleDraftInput): SaleStatus {
  if (input.status) return input.status;
  if (!input.itemId || input.salePrice == null || !input.soldAt) return 'needs_review';
  return 'draft';
}

export function saleNeedsMoreInfo(input: SaleDraftInput): string[] {
  const missing: string[] = [];
  if (!input.itemId) missing.push('which item sold');
  if (input.salePrice == null) missing.push('sale price');
  if (!input.soldAt) missing.push('sold date');
  if (input.buyPriceAtSale == null) missing.push('buy price');
  return missing;
}

export function buildSaleValues(input: SaleDraftInput): NewSale {
  const salePrice = input.salePrice ?? null;
  const fees = input.fees ?? 0;
  const postage = input.postage ?? 0;
  const discount = input.discount ?? 0;

  return {
    itemId: input.itemId ?? null,
    chatImageIds: input.chatImageIds ?? [],
    salePrice,
    buyPriceAtSale: input.buyPriceAtSale ?? null,
    fees,
    postage,
    discount,
    netProceeds: computeNetProceeds({ salePrice, fees, postage, discount }),
    platform: input.platform ?? 'vinted',
    soldAt: input.soldAt ? new Date(input.soldAt) : null,
    notes: input.notes ?? null,
    sourceJid: input.sourceJid ?? null,
    sourceMessage: input.sourceMessage ?? null,
    confidence: input.confidence ?? 0,
    status: inferSaleStatus(input),
  };
}
