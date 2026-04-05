#!/usr/bin/env node
/**
 * Regenerate the <!-- TOOLS:START --> ... <!-- TOOLS:END --> block in
 * vps-files/CLAUDE.md from the current tool definitions in tools.js.
 *
 * Usage: node scripts/regen-bot-docs.mjs
 *
 * Idempotent. Only rewrites the marked section. Fails loudly if markers are
 * missing (don't want to silently corrupt the doc).
 */

import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const TOOLS_FILE = join(ROOT, 'tool-definitions.js');
const DOCS_FILE = join(ROOT, 'CLAUDE.md');
const START = '<!-- TOOLS:START -->';
const END = '<!-- TOOLS:END -->';

async function main() {
  // Dynamic import of tools.js to get the live toolDefinitions array.
  const mod = await import(`file://${TOOLS_FILE}`);
  const tools = mod.toolDefinitions;
  if (!Array.isArray(tools)) throw new Error('tools.js did not export toolDefinitions array');

  const lines = [START, '<!-- Auto-generated from tools.js. Do not edit by hand. -->', ''];
  for (const t of tools) {
    lines.push(`### \`${t.name}\``);
    lines.push('');
    lines.push(t.description.trim());
    const props = t.input_schema?.properties || {};
    const required = new Set(t.input_schema?.required || []);
    const propNames = Object.keys(props);
    if (propNames.length) {
      lines.push('');
      lines.push('**Inputs:**');
      for (const name of propNames) {
        const p = props[name];
        const req = required.has(name) ? ' *(required)*' : '';
        lines.push(`- \`${name}\` (${p.type})${req} — ${p.description || ''}`);
      }
    }
    lines.push('');
  }
  lines.push(END);
  const generated = lines.join('\n');

  const current = await readFile(DOCS_FILE, 'utf-8');
  const startIdx = current.indexOf(START);
  const endIdx = current.indexOf(END);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Markers ${START} / ${END} not found in CLAUDE.md`);
  }
  const before = current.slice(0, startIdx);
  const after = current.slice(endIdx + END.length);
  const next = before + generated + after;
  if (next === current) {
    console.log('CLAUDE.md unchanged.');
    return;
  }
  await writeFile(DOCS_FILE, next);
  console.log(`CLAUDE.md regenerated (${tools.length} tools).`);
}

main().catch((e) => {
  console.error('regen-bot-docs failed:', e.message);
  process.exit(1);
});
