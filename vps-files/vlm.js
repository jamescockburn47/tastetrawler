/**
 * MiniMax Vision Language Model client.
 *
 * Thin wrapper around POST https://api.minimax.io/v1/coding_plan/vlm — the same
 * endpoint the `minimax-coding-plan-mcp` Python package wraps. We skip MCP and
 * hit the HTTP endpoint directly: fewer moving parts, no subprocess, no uv/Python.
 *
 * Requires MINIMAX_API_KEY (the sk-cp- coding-plan key) in the environment.
 * Supported image formats: JPEG, PNG, WebP. Local file path in, text out.
 */

import { readFile } from 'fs/promises';
import { extname } from 'path';
import pino from 'pino';

const log = pino({ name: 'vlm' });

const ENDPOINT = 'https://api.minimax.io/v1/coding_plan/vlm';

// Default prompt: factual, resale-oriented item description.
// The LLM turns this into advice; the VLM just extracts what's visibly there.
const DEFAULT_PROMPT = `Describe this clothing or accessory item in detail for a Vinted resale listing. Include, where visible:
- Category (e.g. parka, midi dress, sneakers)
- Brand (read any logos or labels)
- Colour and pattern
- Material / fabric if identifiable
- Size label if visible
- Condition indicators (wear, stains, pilling, damage)
- Notable features or flaws

Be concrete and factual. Do not invent details that are not visible.`;

function mimeFromPath(filepath) {
  const ext = extname(filepath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg'; // .jpg/.jpeg and fallback
}

export async function analyseImage(filepath, prompt = DEFAULT_PROMPT) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error('MINIMAX_API_KEY not set');

  const buf = await readFile(filepath);
  const dataUrl = `data:${mimeFromPath(filepath)};base64,${buf.toString('base64')}`;

  const started = Date.now();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, image_url: dataUrl }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`VLM HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.content || '';
  if (!content) throw new Error(`VLM returned empty content: ${JSON.stringify(data).slice(0, 200)}`);

  log.info({ ms: Date.now() - started, chars: content.length }, 'VLM ok');
  return content;
}
