import qrcode from 'qrcode-terminal';
import QRCode from 'qrcode';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage, fetchLatestBaileysVersion, Browsers } from 'baileys';
import { Boom } from '@hapi/boom';
import express from 'express';
import pino from 'pino';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import config from './config.js';
import { chat } from './claude.js';
import { analyseImage } from './vlm.js';
import { appendMessage, getHistory, openDb } from './db.js';
import { startScheduler } from './scheduler.js';

const log = pino({ name: 'taste-trawler' });
// Open the DB eagerly so a boot-time failure surfaces here, not on first message.
openDb();

async function downloadImage(msg, sock) {
  const buffer = await downloadMediaMessage(msg, 'buffer', {});
  const dir = '/tmp/tt-images';
  await mkdir(dir, { recursive: true });
  const filename = `${Date.now()}.jpg`;
  const filepath = join(dir, filename);
  await writeFile(filepath, buffer);
  // For now, return local path — in production, upload to Vercel Blob
  // and return the URL. For MVP, we'll base64 encode and send to Claude directly.
  return { buffer, filepath };
}

function isGroupJid(jid) {
  return jid.endsWith('@g.us');
}

function isAllowedDm(jid) {
  if (config.allowedNumbers.length === 0) return false; // fail closed
  const number = jid.split('@')[0];
  return config.allowedNumbers.some(n => number.includes(n));
}

function isAllowedGroup(jid) {
  return config.allowedGroups.includes(jid);
}

// Returns { allowed: boolean, stripped: string|null }
// In group chats, the message must start with the trigger prefix (e.g. "tt ") to wake the bot.
// Returns the text with the prefix stripped so the rest of the pipeline sees clean content.
function checkTrigger(rawText, isGroup) {
  if (!isGroup) return { allowed: true, stripped: rawText };
  const trimmed = (rawText || '').trim();
  const prefix = config.triggerPrefix;
  const re = new RegExp(`^${prefix}(\\s+|$)`, 'i');
  if (!re.test(trimmed)) return { allowed: false, stripped: null };
  return { allowed: true, stripped: trimmed.replace(re, '').trim() };
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  const { version } = await fetchLatestBaileysVersion();
  log.info({ version }, 'using WA version');
  const sock = makeWASocket({
    version,
    auth: state,
    browser: Browsers.ubuntu('Chrome'),
    logger: pino({ level: 'warn' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) { qrcode.generate(qr, { small: true }); await QRCode.toFile('/tmp/tt-qr.png', qr, { width: 400 }); log.info('QR saved to /tmp/tt-qr.png'); }
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      log.info({ reason }, 'connection closed');
      if (reason !== DisconnectReason.loggedOut) {
        log.info('reconnecting...');
        startBot();
      }
    } else if (connection === 'open') {
      log.info('connected to WhatsApp');
      // Start cron jobs once the socket is ready — they need to be able to
      // sendMessage(). startScheduler is idempotent per-process; we only ever
      // open one socket, and on reconnects Baileys reuses sock, so the
      // existing cron schedules keep working without being re-registered.
      if (!sock.__ttSchedulerStarted) {
        startScheduler(sock);
        sock.__ttSchedulerStarted = true;
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages: msgs, type }) => {
    if (type !== 'notify') return;

    for (const msg of msgs) {
      const jid = msg.key.remoteJid;
      if (!jid || jid === 'status@broadcast') continue;

      const isGroup = isGroupJid(jid);
      const participant = msg.key.participant || null;
      const rawPreview = (msg.message?.conversation
        || msg.message?.extendedTextMessage?.text
        || msg.message?.imageMessage?.caption
        || '(no text)').slice(0, 80);
      log.info({ jid, isGroup, fromMe: msg.key.fromMe, participant, rawPreview }, 'incoming');

      // Access control:
      // The bot has its own dedicated WhatsApp number, so fromMe is always the bot
      // itself — skip unconditionally in both DMs and groups (prevents self-reply loops).
      //  - 1:1 DMs: sender JID must match an ALLOWED_NUMBERS entry
      //  - Groups:  group JID must be in ALLOWED_GROUPS
      if (msg.key.fromMe) continue;
      if (isGroup) {
        if (!isAllowedGroup(jid)) {
          // Log unknown groups exactly once so we can discover the JID to whitelist
          log.info({ jid }, 'group not in ALLOWED_GROUPS — add this JID to enable');
          continue;
        }
      } else {
        if (!isAllowedDm(jid)) continue;
      }

      const text = msg.message?.conversation
        || msg.message?.extendedTextMessage?.text
        || '';
      const hasImage = !!msg.message?.imageMessage;
      const imageCaption = msg.message?.imageMessage?.caption || '';
      const rawText = text || imageCaption || '';

      // In groups, require the trigger prefix ("tt ...") to wake the bot,
      // so it doesn't chime in on every message between you and MG.
      const trig = checkTrigger(rawText, isGroup);
      if (!trig.allowed) {
        log.info({ jid, participant, rawPreview }, 'group msg dropped — missing tt prefix');
        continue;
      }
      const bodyText = trig.stripped;

      log.info({ jid, isGroup, text: bodyText, hasImage }, 'message received');

      // Load conversation history from SQLite (survives restart). Last 20
      // messages, oldest first — matches the previous in-memory cap.
      const history = getHistory(jid, 20);

      // Handle image messages — pre-analyse via MiniMax VLM HTTP endpoint,
      // then inject the analysis into the chat context as text. The LLM never
      // sees raw pixels (MiniMax chat completions don't accept images).
      // Hard-fail if VLM is down — no silent fallback.
      let imageAnalysis = null;
      if (hasImage) {
        try {
          const { filepath } = await downloadImage(msg, sock);
          log.info({ filepath }, 'analysing image via VLM');
          imageAnalysis = await analyseImage(filepath);
          log.info({ chars: imageAnalysis.length }, 'VLM analysis done');
        } catch (err) {
          log.error({ err: err.message }, 'VLM failed');
          await sock.sendMessage(jid, { text: 'Image analysis is temporarily unavailable. Try again in a moment.' });
          continue;
        }
      }

      let userText = bodyText || (hasImage ? 'What do you think of this?' : '');
      if (imageAnalysis) {
        userText = `[Image analysis from vision model:\n${imageAnalysis}\n]\n\nUser message: ${userText}`;
      }
      if (!userText && !hasImage) continue;

      history.push({ role: 'user', content: userText });
      appendMessage(jid, 'user', userText);

      try {
        await sock.sendPresenceUpdate('composing', jid);
        const reply = await chat(history, []);
        appendMessage(jid, 'assistant', reply);
        await sock.sendMessage(jid, { text: reply });
      } catch (err) {
        log.error({ err: err.message, jid }, 'chat error');
        await sock.sendMessage(jid, { text: 'Something went wrong. Try again in a moment.' });
      }
    }
  });

  return sock;
}

// Express health API
const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.listen(config.port, () => log.info({ port: config.port }, 'health API listening'));

// Start bot
startBot().catch(err => {
  log.error({ err: err.message }, 'failed to start bot');
  process.exit(1);
});
