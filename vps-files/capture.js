/**
 * Image capture pipeline for the WhatsApp bot.
 *
 * Every photo the bot sees — triggered or not, DM or group — flows through
 * captureImage(). It:
 *   1. writes the bytes to /tmp for VLM input
 *   2. runs the MiniMax VLM to extract a resale-oriented description
 *   3. uploads the bytes to Vercel Blob (via the web app) and inserts a
 *      `chat_images` row with the description, speaker metadata, timestamp
 *   4. returns { id, blobUrl, description } so the caller can (a) drop the
 *      description into the conversation history and (b) reference the row
 *      id if the bot later responds and we want to append to its discussion.
 *
 * If the VLM or the upload fails, capture degrades: the caller still gets
 * a description (or an error-stub string) and the conversation continues.
 * We never crash the bot over a photo.
 */

import { downloadMediaMessage } from 'baileys';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import pino from 'pino';
import { analyseImage } from './vlm.js';
import { createChatImage } from './tt-api.js';

const log = pino({ name: 'capture' });

const TMP_DIR = '/tmp/tt-images';

/**
 * Pull an image off a WhatsApp message, run VLM, persist to the web app.
 *
 * @param {object} msg     Baileys message object with an imageMessage
 * @param {object} meta    { jid, speakerName, speakerId, isGroup, caption }
 * @returns {Promise<{ id: string|null, blobUrl: string|null, description: string, caption: string|null }>}
 */
export async function captureImage(msg, meta) {
  const started = Date.now();
  await mkdir(TMP_DIR, { recursive: true });

  // 1. Download bytes
  let buffer;
  try {
    buffer = await downloadMediaMessage(msg, 'buffer', {});
  } catch (e) {
    log.error({ err: e.message }, 'image download failed');
    return { id: null, blobUrl: null, description: `(image download failed: ${e.message})`, caption: meta.caption || null };
  }

  const filepath = join(TMP_DIR, `${Date.now()}.jpg`);
  await writeFile(filepath, buffer);

  // 2. VLM analysis — hard fail is fine here, the caller will tell the user.
  // But we still try to persist the bytes + an error stub so the image isn't lost.
  let description = '';
  let vlmError = null;
  try {
    description = await analyseImage(filepath);
  } catch (e) {
    vlmError = e.message;
    description = `(VLM error: ${e.message})`;
    log.error({ err: e.message }, 'VLM failed during capture');
  }

  // 3. Persist to web app. If this fails, we still return the description to
  //    the caller — the conversation shouldn't stall over a storage hiccup.
  let row = null;
  try {
    const imageBase64 = buffer.toString('base64');
    row = await createChatImage({
      imageBase64,
      mime: 'image/jpeg',
      vlmDescription: description,
      caption: meta.caption || null,
      jid: meta.jid,
      speakerName: meta.speakerName || null,
      speakerId: meta.speakerId || null,
      isGroup: !!meta.isGroup,
      tags: extractTags(description),
    });
  } catch (e) {
    log.error({ err: e.message }, 'chat-image persist failed');
  }

  log.info(
    {
      ms: Date.now() - started,
      chars: description.length,
      persisted: !!row,
      vlmError,
    },
    'capture done',
  );

  return {
    id: row?.id ?? null,
    blobUrl: row?.blobUrl ?? null,
    description,
    caption: meta.caption || null,
  };
}

/**
 * Cheap tag extraction from a VLM description. The VLM output is unstructured
 * prose, but resale descriptions almost always lead with a category + brand +
 * colour, so we scrape a few lowercase keywords for simple ILIKE-free lookups
 * later. Good enough for recall — we're not doing real NLP.
 */
function extractTags(description) {
  if (!description) return [];
  const words = description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && w.length <= 24);
  // dedupe, cap at 20
  return Array.from(new Set(words)).slice(0, 20);
}

/**
 * Re-export: a caller may want the raw file bytes for other flows (e.g.
 * one-off testing). Kept here so capture.js is the single module that knows
 * where tt-images live.
 */
export async function readCapturedBytes(filepath) {
  return readFile(filepath);
}
