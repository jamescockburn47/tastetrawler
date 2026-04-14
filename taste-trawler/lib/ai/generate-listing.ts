import { generateText } from 'ai';
import type { PhotoAnalysis } from './analyse-photos';
import type { CompResult } from '../ebay/types';

export interface GeneratedListing {
  title: string;
  description: string;
  suggestedPrice: number;   // pence — market midpoint (recommended)
  priceLow: number;         // pence — quick sale floor
  priceHigh: number;        // pence — patient seller ceiling
  priceConfidence: 'high' | 'medium' | 'low';
  priceReasoning: string;
  category: string;
}

function buildCompSummary(comps: CompResult[]): string {
  if (comps.length === 0) return 'No comparable sales found.';

  const ebayActive = comps.filter((c) => c.platform === 'ebay' && !c.isSold);
  const vintedSold = comps.filter((c) => c.platform === 'vinted' && c.isSold);
  const vintedActive = comps.filter((c) => c.platform === 'vinted' && !c.isSold);

  const sections: string[] = [];

  if (vintedSold.length > 0) {
    sections.push(
      'Vinted SOLD items (actual sale prices — most reliable signal):',
      ...vintedSold.map((c) => `  ${c.title}: £${(c.price / 100).toFixed(2)} (${c.condition})`),
    );
  }
  if (vintedActive.length > 0) {
    sections.push(
      'Vinted active listings (asking prices):',
      ...vintedActive.map((c) => `  ${c.title}: £${(c.price / 100).toFixed(2)} (${c.condition})`),
    );
  }
  if (ebayActive.length > 0) {
    sections.push(
      'eBay active listings (asking prices, different marketplace):',
      ...ebayActive.map((c) => `  ${c.title}: £${(c.price / 100).toFixed(2)} (${c.condition})`),
    );
  }

  return sections.join('\n');
}

export async function generateListing(
  analysis: PhotoAnalysis,
  comps: CompResult[]
): Promise<GeneratedListing> {
  const compSummary = buildCompSummary(comps);

  const soldComps = comps.filter((c) => c.isSold);
  const allPrices = comps.map((c) => c.price);
  const soldPrices = soldComps.map((c) => c.price);

  const avgPrice = allPrices.length > 0
    ? Math.round(allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length)
    : null;
  const avgSoldPrice = soldPrices.length > 0
    ? Math.round(soldPrices.reduce((sum, p) => sum + p, 0) / soldPrices.length)
    : null;

  const { text } = await generateText({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'user',
        content: `You are writing a Vinted listing for a UK seller. She writes warm, concise listings with personality. Not corporate, not overly casual. She uses emoji sparingly if at all.

Item analysis:
${JSON.stringify(analysis, null, 2)}

Comparable items from eBay and Vinted:
${compSummary}

${avgSoldPrice ? `Average SOLD price: £${(avgSoldPrice / 100).toFixed(2)}` : ''}
${avgPrice ? `Average asking price (all sources): £${(avgPrice / 100).toFixed(2)}` : ''}
Total comps found: ${comps.length} (${soldComps.length} sold, ${comps.length - soldComps.length} active)

PRICING INSTRUCTIONS:
- Weight sold prices MORE heavily than active listing prices — sold prices reflect what buyers actually paid
- Recommend the MARKET MIDPOINT — not above, not below. She wants fair prices with reasonable sell-through
- If only active listings are available (no sold data), price at or slightly below asking prices
- Do NOT undercut the market — price AT market value

Generate a JSON object with:
- title: string (max 80 chars, include brand if known, era if vintage, key descriptor)
- description: string (3-4 short paragraphs. Lead with the compelling detail. Mention condition honestly. End with a hook. No hashtags.)
- suggestedPrice: number in pence (market midpoint — the recommended price)
- priceLow: number in pence (quick sale floor — what it would sell at within a day or two)
- priceHigh: number in pence (patient ceiling — top end if she's happy to wait)
- priceConfidence: "high" | "medium" | "low" (high = 5+ comps with tight price spread; medium = 2-4 comps; low = 0-1 comps or very wide spread)
- priceReasoning: string (one sentence explaining why this price, referencing comp data)
- category: string (Vinted category, e.g. "Women's Bags", "Men's Coats")

Return ONLY valid JSON, no markdown wrapping.`,
      },
    ],
  });

  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  return JSON.parse(cleaned) as GeneratedListing;
}
