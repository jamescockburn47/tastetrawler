#!/usr/bin/env node
/**
 * PostToolUse hook — keeps the VPS bot source tree healthy while Claude edits.
 *
 * Fires on every Edit/Write. When the target is under `vps-files/`:
 *   1. Run `node --check` on the file (catches syntax errors at edit time)
 *   2. If the target is tool-definitions.js, regenerate CLAUDE.md's tool
 *      inventory section via scripts/regen-bot-docs.mjs
 *
 * The hook reads Claude Code's standard JSON payload from stdin and writes
 * any issues to stderr so they show up inline in the conversation.
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, relative, sep, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

function readStdin() {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

function log(msg) {
  process.stderr.write(`[post-vps-edit] ${msg}\n`);
}

const raw = readStdin();
if (!raw) process.exit(0);

let payload;
try {
  payload = JSON.parse(raw);
} catch (e) {
  log(`could not parse hook input: ${e.message}`);
  process.exit(0);
}

const filePath = payload?.tool_input?.file_path;
if (!filePath) process.exit(0);

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const VPS = resolve(REPO, 'vps-files');
const abs = resolve(filePath);
const rel = relative(VPS, abs);
if (rel.startsWith('..') || rel.includes(`..${sep}`)) process.exit(0);

// 1. Syntax-check JS/MJS files
if (['.js', '.mjs'].includes(extname(abs))) {
  try {
    execSync(`node --check "${abs}"`, { stdio: 'pipe' });
  } catch (e) {
    log(`SYNTAX ERROR in ${rel}:\n${e.stderr?.toString() || e.message}`);
    process.exit(0);
  }
}

// 2. If tool-definitions changed, regen CLAUDE.md
if (rel === 'tool-definitions.js') {
  try {
    const out = execSync(`node scripts/regen-bot-docs.mjs`, {
      cwd: VPS,
      stdio: 'pipe',
    });
    log(`regen-bot-docs: ${out.toString().trim()}`);
  } catch (e) {
    log(`regen-bot-docs failed: ${e.stderr?.toString() || e.message}`);
  }
}

process.exit(0);
