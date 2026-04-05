import qrcode from 'qrcode-terminal';
import QRCode from 'qrcode';
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} from 'baileys';
import { Boom } from '@hapi/boom';
import express from 'express';
import pino from 'pino';
import config from './config.js';
import { chat } from './claude.js';
import { appendMessage, getHistory, openDb } from './db.js';
import { startScheduler } from './scheduler.js';
import { captureImage } from './capture.js';
import { appendChatImageDiscussion } from './tt-api.js';

const log = pino({ name: 'taste-trawler' });
// Open the DB eagerly so a boot-time failure surfaces here, not on first message.
openDb();

// How many past messages to feed the LLM on each turn. Includes both sides of
// any group chatter that was logged passively, so the bot sees the full
// conversation and can refer back to images/comments from earlier.
const HISTORY_LIMIT = parseInt(process.env.BOT_HISTORY_LIMIT || '40', 10);

function isGroupJid(jid) {
  return jid.endsWith('@g.us');
}

function isAllowedDm(jid) {
  if (config.allowedNumbers.length === 0) return false; // fail closed
  const number = jid.split('@')[0];
  return config.allowedNumbers.some((n) => number.includes(n));
}

function isAllowedGroup(jid) {
  return config.allowedGroups.includes(jid);
}

// Returns { allowed, stripped }. In groups the message must start with the
// trigger prefix (e.g. "tt ") to wake the bot. In DMs every message triggers.
function checkTrigger(rawText, isGroup) {
  if (!isGroup) return { allowed: true, stripped: rawText };
  const trimmed = (rawText || '').trim();
  const prefix = config.triggerPrefix;
  const re = new RegExp(`^${prefix}(\\s+|$)`, 'i');
  if (!re.test(trimmed)) return { allowed: false, stripped: null };
  return { allowed: true, stripped: trimmed.replace(re, '').trim() };
}

/**
 * Build the transcript line that gets logged to SQLite for this message.
 *
 * Group chats carry multiple humans, so we prefix the speaker's display name.
 * When there's an image, we inline the VLM description plus the stored row id
 * so a later LLM turn can (a) reason about what was depicted and (b) ask the
 * recall tool for more detail by id if needed.
 */
function buildLoggedContent({ speakerName, text, image }) {
  const who = speakerName ? `[${speakerName}]` : '[unknown]';
  const parts = [];
  if (image) {
    const idTag = image.id ? ` id=${image.id}` : '';
    const urlTag = image.blobUrl ? ` url=${image.blobUrl}` : '';
    parts.push(`${who} sent a photo${idTag}${urlTag}`);
    if (image.caption) parts.push(`Caption: ${image.caption}`);
    if (image.description) parts.push(`Image analysis: ${image.description}`);
  }
  if (text) {
    if (image) parts.push(`${who} text: ${text}`);
    else parts.push(`${who} ${text}`);
  }
  return parts.join('\n');
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
    if (qr) {
      qrcode.generate(qr, { small: true });
      await QRCode.toFile('/tmp/tt-qr.png', qr, { width: 400 });
      log.info('QR saved to /tmp/tt-qr.png');
    }
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      log.info({ reason }, 'connection closed');
      if (reason !== DisconnectReason.loggedOut) {
        log.info('reconnecting...');
        startBot();
      }
    } else if (connection === 'open') {
      log.info('connected to WhatsApp');
      // Start cron jobs once the socket is ready.
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
      if (msg.key.fromMe) continue;

      const isGroup = isGroupJid(jid);

      // Access control first — if the chat isn't whitelisted we don't even log.
      if (isGroup) {
        if (!isAllowedGroup(jid)) {
          log.info({ jid }, 'group not in ALLOWED_GROUPS — skipping entirely');
          continue;
        }
      } else {
        if (!isAllowedDm(jid)) continue;
      }

      const speakerId = msg.key.participant || jid;
      const speakerName = msg.pushName || 'unknown';

      const text =
        msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      const hasImage = !!msg.message?.imageMessage;
      const imageCaption = msg.message?.imageMessage?.caption || '';
      const rawText = text || imageCaption || '';

      const rawPreview = (rawText || '(no text)').slice(0, 80);
      log.info(
        { jid, isGroup, speakerName, speakerId, hasImage, rawPreview },
        'incoming',
      );

      // ─── Image capture (runs regardless of trigger) ────────────────────
      // Every photo gets VLM-analysed and uploaded to the web app's chat_images
      // gallery. MG gets a permanent record of what she's shown the bot even
      // if she didn't address it — and future turns can recall the description.
      let captured = null;
      if (hasImage) {
        try {
          captured = await captureImage(msg, {
            jid,
            speakerName,
            speakerId,
            isGroup,
            caption: imageCaption,
          });
        } catch (err) {
          log.error({ err: err.message }, 'captureImage threw');
          captured = {
            id: null,
            blobUrl: null,
            description: `(image capture failed: ${err.message})`,
            caption: imageCaption || null,
          };
        }
      }

      // ─── Passive logging (every message, triggered or not) ─────────────
      // Group chatter between MG and James is persisted so the bot has real
      // conversational context when it IS addressed. Each line is prefixed
      // with the speaker's display name so the model can tell who said what.
      const loggedContent = buildLoggedContent({
        speakerName,
        text: rawText, // keep the prefix visible too; the LLM can see who asked it
        image: captured,
      });
      if (loggedContent) appendMessage(jid, 'user', loggedContent);

      // ─── Should the bot reply? ─────────────────────────────────────────
      // DMs: yes. Groups: only if the trigger prefix is present. No trigger →
      // we're done for this message: it's been logged and (if an image) captured.
      const trig = checkTrigger(rawText, isGroup);
      if (!trig.allowed) {
        log.info({ jid, speakerName }, 'logged without reply (no trigger)');
        continue;
      }

      log.info({ jid, isGroup, hasImage, captured: !!captured }, 'addressed — replying');

      const history = getHistory(jid, HISTORY_LIMIT);

      try {
        await sock.sendPresenceUpdate('composing', jid);
        const reply = await chat(history, []);
        appendMessage(jid, 'assistant', reply);
        await sock.sendMessage(jid, { text: reply });

        // If this very message carried an image, append the bot's reply to
        // that image's discussion field so MG has a log of what was said
        // about each photo over time.
        if (captured?.id) {
          appendChatImageDiscussion(captured.id, `${speakerName}: ${rawText || '(photo)'}\nTT: ${reply}`, {
            respondedAt: Date.now(),
          }).catch((e) =>
            log.warn({ err: e.message, id: captured.id }, 'append chat-image discussion failed'),
          );
        }
      } catch (err) {
        log.error({ err: err.message, jid }, 'chat error');
        await sock.sendMessage(jid, {
          text: 'Something went wrong. Try again in a moment.',
        });
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
startBot().catch((err) => {
  log.error({ err: err.message }, 'failed to start bot');
  process.exit(1);
});
