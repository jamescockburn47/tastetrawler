import { generateText } from 'ai';
import type { PhotoAnalysis } from './analyse-photos';
import type { CompResult } from '../ebay/types';

export interface GeneratedListing {
  title: string;
  description: string;
  suggestedPrice: number;   // pence
  priceReasoning: string;
  category: string;
}

export async function generateListing(
  analysis: PhotoAnalysis,
  comps: CompResult[]
): Promise<GeneratedListing> {
  const compSummary = comps.length > 0
    ? comps.map((c) => `${c.title}: £${(c.price / 100).toFixed(2)} (${c.condition})`).join('\n')
    : 'No comparable sales found.';

  const avgCompPrice = comps.length > 0
    ? Math.round(comps.reduce((sum, c) => sum + c.price, 0) / comps.length)
    : null;

  const { text } = await generateText({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'user',
        content: `You are writing a Vinted listing for a UK seller. She writes warm, concise listings with personality. Not corporate, not overly casual. She uses emoji sparingly if at all.

Item analysis:
${JSON.stringify(analysis, null, 2)}

Comparable sales on eBay:
${compSummary}

Average comp price: ${avgCompPrice ? `£${(avgCompPrice / 100).toFixed(2)}` : 'unknown'}

Generate a JSON object with:
- title: string (max 80 chars, include brand if known, era if vintage, key descriptor)
- description: string (3-4 short paragraphs. Lead with the compelling detail. Mention condition honestly. End with a hook. No hashtags.)
- suggestedPrice: number in pence (slightly below or at average comp price — she wants fast sales)
- priceReasoning: string (one sentence explaining why this price)
- category: string (Vinted category, e.g. "Women's Bags", "Men's Coats")

Return ONLY valid JSON, no markdown wrapping.`,
      },
    ],
  });

  return JSON.parse(text) as GeneratedListing;
}
