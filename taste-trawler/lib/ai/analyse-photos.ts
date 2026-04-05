import { generateText } from 'ai';

export interface PhotoAnalysis {
  brand: string | null;
  category: string;
  condition: string;
  era: string | null;
  colours: string[];
  material: string | null;
  styleTags: string[];
  size: string | null;
  storyPotentialScore: number;
  summary: string;
}

export async function analysePhotos(photoUrls: string[]): Promise<PhotoAnalysis> {
  const { text } = await generateText({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are a fashion resale expert. Analyse these photos of an item for sale on Vinted.

Return a JSON object with exactly these fields:
- brand: string or null (detected brand name, null if unknown)
- category: string (e.g. "Bags", "Coats", "Shoes", "Accessories", "Tops", "Dresses", "Ceramics")
- condition: string ("New", "Like New", "Good", "Fair")
- era: string or null (e.g. "1990s", "2000s", "1970s", null if modern/unknown)
- colours: string[] (dominant colours, max 3)
- material: string or null (e.g. "leather", "wool", "silk", "cotton", "ceramic")
- styleTags: string[] (max 5 aesthetic tags, e.g. "vintage", "minimalist", "bohemian", "designer", "cottagecore")
- size: string or null (if visible on labels)
- storyPotentialScore: number 1-10 (how compelling would this be as a Vinted listing — provenance, photogenic quality, nostalgia factor, rarity)
- summary: string (one sentence describing the item for internal use)

Return ONLY valid JSON, no markdown wrapping.`,
          },
          ...photoUrls.map((url) => ({
            type: 'image' as const,
            image: url,
          })),
        ],
      },
    ],
  });

  // Gemini occasionally wraps JSON in markdown fences despite the prompt
  // saying not to. Strip them before parsing.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  return JSON.parse(cleaned) as PhotoAnalysis;
}
