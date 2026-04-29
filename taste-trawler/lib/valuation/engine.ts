import type { PhotoAnalysis } from '@/lib/ai/analyse-photos';
import type { CompResult } from '@/lib/ebay/types';

export interface ScoredComp extends CompResult {
  score: number;
  reasons: string[];
}

export interface ValuationResult {
  targetPrice: number | null;
  quickSalePrice: number | null;
  patientPrice: number | null;
  maxBuyPrice: number | null;
  expectedMargin: number | null;
  confidence: 'high' | 'medium' | 'low';
  topComps: ScoredComp[];
  ignoredComps: ScoredComp[];
  risks: string[];
  reasoning: string;
  query: string;
}

export function buildValuationQuery(analysis: Partial<PhotoAnalysis>): string {
  return [
    analysis.brand,
    analysis.material,
    analysis.category,
    analysis.size,
    analysis.era,
    analysis.condition,
  ].filter(Boolean).join(' ');
}

export function scoreComp(comp: CompResult, analysis: Partial<PhotoAnalysis>): ScoredComp {
  const title = comp.title.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  if (comp.isSold) {
    score += 35;
    reasons.push('sold result');
  } else {
    score += 12;
    reasons.push('active listing');
  }

  if (comp.platform === 'vinted') {
    score += comp.isSold ? 25 : 15;
    reasons.push('same marketplace');
  } else {
    score += 8;
  }

  for (const [label, value, points] of [
    ['brand', analysis.brand, 18],
    ['category', analysis.category, 14],
    ['size', analysis.size, 10],
    ['era', analysis.era, 8],
    ['material', analysis.material, 8],
  ] as const) {
    if (value && title.includes(String(value).toLowerCase())) {
      score += points;
      reasons.push(`${label} match`);
    }
  }

  if (analysis.condition && comp.condition?.toLowerCase().includes(analysis.condition.toLowerCase())) {
    score += 8;
    reasons.push('condition match');
  }

  if (comp.price <= 0) score -= 50;
  if (title.includes('bundle') || title.includes('job lot')) {
    score -= 20;
    reasons.push('bundle risk');
  }

  return { ...comp, score: Math.max(0, Math.min(100, score)), reasons };
}

function weightedAverage(comps: ScoredComp[]): number | null {
  const usable = comps.filter((comp) => comp.price > 0 && comp.score > 0);
  if (!usable.length) return null;
  const totalWeight = usable.reduce((sum, comp) => sum + comp.score, 0);
  const total = usable.reduce((sum, comp) => sum + comp.price * comp.score, 0);
  return Math.round(total / totalWeight);
}

function percentile(values: number[], pct: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * pct)));
  return sorted[index];
}

function valuationConfidence(soldCount: number, compCount: number): ValuationResult['confidence'] {
  if (soldCount >= 4 && compCount >= 6) return 'high';
  if (soldCount >= 1 && compCount >= 3) return 'medium';
  return 'low';
}

export function buildValuation(
  analysis: Partial<PhotoAnalysis>,
  comps: CompResult[],
  buyPrice?: number | null,
): ValuationResult {
  const scored = comps.map((comp) => scoreComp(comp, analysis)).sort((a, b) => b.score - a.score);
  const credible = scored.filter((comp) => comp.score >= 35 && comp.price > 0);
  const prices = credible.map((comp) => comp.price);
  const median = percentile(prices, 0.5);
  const lowFence = median == null ? 0 : median * 0.35;
  const highFence = median == null ? Infinity : median * 2.5;
  const filtered = credible.filter((comp) => comp.price >= lowFence && comp.price <= highFence);
  const ignoredComps = scored.filter((comp) => !filtered.includes(comp));

  const soldCount = filtered.filter((comp) => comp.isSold).length;
  const weighted = weightedAverage(filtered);
  const quickSalePrice = percentile(filtered.map((comp) => comp.price), 0.25);
  const patientPrice = percentile(filtered.map((comp) => comp.price), 0.8);
  const targetPrice = weighted ?? median;
  const maxBuyPrice = targetPrice == null ? null : Math.max(0, Math.round(targetPrice * 0.35));
  const expectedMargin = targetPrice != null && buyPrice != null ? targetPrice - buyPrice : null;

  const risks: string[] = [];
  if (comps.length === 0) risks.push('No comps found, so this valuation is only a starting point.');
  if (soldCount === 0 && filtered.length > 0) risks.push('Only active listings found; asking prices can be optimistic little liars.');
  if (filtered.length < 3) risks.push('Thin comp set. Useful, but not courtroom evidence.');
  if (ignoredComps.length > 0) risks.push(`${ignoredComps.length} weak or weird comps ignored.`);

  const confidence = valuationConfidence(soldCount, filtered.length);

  const reasoning = targetPrice == null
    ? 'No credible comps found. The system needs more market evidence before pretending to be clever.'
    : `${confidence} confidence from ${filtered.length} credible comps (${soldCount} sold). Target ${formatPence(targetPrice)}, quick sale ${formatPence(quickSalePrice)}, patient ceiling ${formatPence(patientPrice)}.`;

  return {
    targetPrice,
    quickSalePrice,
    patientPrice,
    maxBuyPrice,
    expectedMargin,
    confidence,
    topComps: filtered.slice(0, 8),
    ignoredComps: ignoredComps.slice(0, 8),
    risks,
    reasoning,
    query: buildValuationQuery(analysis),
  };
}

function formatPence(pence: number | null): string {
  if (pence == null) return 'unknown';
  return `£${(pence / 100).toFixed(2)}`;
}
