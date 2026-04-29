/**
 * Pure tool definitions — NO IMPORTS.
 *
 * Kept dependency-free so scripts/regen-bot-docs.mjs can load it without
 * pulling in the rest of the bot's runtime (dotenv, SQLite, pino, etc).
 *
 * tools.js imports this and wires each definition to a handler.
 */

export const toolDefinitions = [
  {
    name: 'tt_evaluate_item',
    description:
      'Analyse photos of an item for resale. Returns brand, category, condition, pricing intelligence. Use when a photo is sent.',
    input_schema: {
      type: 'object',
      properties: {
        photoUrls: { type: 'array', items: { type: 'string' }, description: 'Photo URLs' },
      },
      required: ['photoUrls'],
    },
  },
  {
    name: 'tt_quick_list',
    description:
      'Generate a listing from photos and save as draft. Use when user says "list this" or wants to save an item.',
    input_schema: {
      type: 'object',
      properties: {
        photoUrls: { type: 'array', items: { type: 'string' }, description: 'Photo URLs' },
        buyPrice: { type: 'number', description: 'Buy price in pence (optional)' },
      },
      required: ['photoUrls'],
    },
  },
  {
    name: 'tt_stats',
    description: 'Get P&L stats. Use when user asks how they are doing or about profits.',
    input_schema: {
      type: 'object',
      properties: { days: { type: 'number', description: 'Lookback days (default 30)' } },
    },
  },
  {
    name: 'tt_stale_items',
    description: 'Get items listed 14+ days without selling. Use when user asks what needs attention.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'tt_search_comps',
    description: 'Search eBay for comparable items. Use when user asks what something is worth.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search query' } },
      required: ['query'],
    },
  },
  {
    name: 'tt_add_buy_price',
    description: 'Record buy price for an existing inventory item.',
    input_schema: {
      type: 'object',
      properties: {
        itemTitle: { type: 'string', description: 'Title or partial match' },
        buyPrice: { type: 'number', description: 'Price in pence' },
      },
      required: ['itemTitle', 'buyPrice'],
    },
  },
  {
    name: 'tt_start_sale_log',
    description:
      'Start a guided sale log for something MG sold. Use when she says an item sold or sends sales information. Create a draft first, then ask for the missing fields listed in the response.',
    input_schema: {
      type: 'object',
      properties: {
        itemTitle: { type: 'string', description: 'Title or partial title to match an existing inventory item' },
        itemId: { type: 'string', description: 'Exact Taste Trawler item id if known' },
        chatImageIds: { type: 'array', items: { type: 'string' }, description: 'Related chat image ids' },
        salePrice: { type: 'number', description: 'Sale price in pence' },
        buyPriceAtSale: { type: 'number', description: 'Buy price in pence, if known' },
        platform: { type: 'string', enum: ['vinted', 'ebay', 'depop', 'in_person', 'other'] },
        soldAt: { type: 'string', description: 'ISO date or natural date already resolved by the model' },
        fees: { type: 'number', description: 'Fees in pence' },
        postage: { type: 'number', description: 'Postage paid by MG in pence' },
        discount: { type: 'number', description: 'Discount in pence' },
        notes: { type: 'string', description: 'Short source note from the WhatsApp message' },
        sourceJid: { type: 'string', description: 'WhatsApp chat id if known' },
        sourceMessage: { type: 'string', description: 'Original user wording' },
      },
    },
  },
  {
    name: 'tt_answer_sale_question',
    description:
      'Add one or more answers to an existing guided sale draft. Use after tt_start_sale_log when MG answers the bot’s follow-up questions.',
    input_schema: {
      type: 'object',
      properties: {
        saleId: { type: 'string', description: 'Sale draft id' },
        itemTitle: { type: 'string', description: 'Title or partial title if item still needs matching' },
        itemId: { type: 'string', description: 'Exact item id if known' },
        salePrice: { type: 'number', description: 'Sale price in pence' },
        buyPriceAtSale: { type: 'number', description: 'Buy price in pence' },
        platform: { type: 'string', enum: ['vinted', 'ebay', 'depop', 'in_person', 'other'] },
        soldAt: { type: 'string', description: 'ISO date or natural date already resolved by the model' },
        fees: { type: 'number', description: 'Fees in pence' },
        postage: { type: 'number', description: 'Postage paid by MG in pence' },
        discount: { type: 'number', description: 'Discount in pence' },
        notes: { type: 'string' },
      },
      required: ['saleId'],
    },
  },
  {
    name: 'tt_confirm_sale_log',
    description:
      'Confirm a guided sale draft after MG has approved the summary. This marks the sale confirmed and syncs the linked inventory item to sold.',
    input_schema: {
      type: 'object',
      properties: {
        saleId: { type: 'string', description: 'Sale draft id' },
      },
      required: ['saleId'],
    },
  },
  {
    name: 'tt_tidy_inventory',
    description:
      'Tidy the whole inventory: backfill missing descriptions/categories/dates from Vinted, enrich items with AI vision (colours, style tags, era), and sync sales/views/likes from Vinted. Use when the user says "tidy", "sort out my stuff", "fix things", "update everything", "refresh", or any general request to clean up or update their inventory. This can take several minutes and no progress messages will be sent — just tell the user it is running and the bot will report when done.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'tt_backfill_descriptions',
    description:
      'Only the Vinted backfill step — populate missing descriptions, categories, brands, sizes, and listing dates from Vinted. Use when the user specifically asks to fill in missing descriptions or Vinted data (not for general tidy-up).',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'tt_enrich_photos',
    description:
      'Only the Gemini vision enrichment step — analyse photos to add colours, style tags, era, and material to items that lack them. Use when the user specifically asks to analyse photos or fill in taste/style data.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'tt_vinted_sync',
    description:
      'Only the Vinted sync step — check what has sold since last time and update view/like counts. Use when the user asks "what sold", "check Vinted", "any sales", or similar.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'tt_recall_images',
    description:
      'Search the archive of every photo MG or James has sent in WhatsApp — each image is stored with its VLM description, caption, speaker, timestamp, and any later discussion. Use when someone refers back to a past photo ("that bowl from yesterday", "the jumper you saw last week", "what did I show you about the green dress"). Returns a short list of matching images with id, blob URL, description, and when it was sent.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Free text, matched against VLM description, caption, and discussion. Optional — omit to list recent images.',
        },
        since: {
          type: 'string',
          description: 'ISO date or ms epoch lower bound. Optional.',
        },
        limit: { type: 'number', description: 'Max rows (default 10, cap 50)' },
      },
    },
  },
];
