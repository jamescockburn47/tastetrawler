import 'dotenv/config';

export default {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  minimaxApiKey: process.env.MINIMAX_API_KEY,
  ttApiUrl: process.env.TT_API_URL || 'https://tastetrawler.com',
  ttApiKey: process.env.TT_API_KEY,
  port: parseInt(process.env.PORT || '3000'),
  // 1:1 DM whitelist (phone numbers, no +)
  allowedNumbers: (process.env.ALLOWED_NUMBERS || '').split(',').map(s => s.trim()).filter(Boolean),
  // Group-chat whitelist (full JIDs ending in @g.us)
  allowedGroups: (process.env.ALLOWED_GROUPS || '').split(',').map(s => s.trim()).filter(Boolean),
  // Trigger prefix in groups — messages must start with this + space to wake the bot
  triggerPrefix: (process.env.TRIGGER_PREFIX || 'tt').toLowerCase(),
};
