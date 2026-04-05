@AGENTS.md

# Taste Trawler — operational reference

This file is the durable project context. Read it before you do anything. If you discover something here is wrong, fix it in the same edit that fixes the underlying issue — do not let this file drift.

## What Taste Trawler is

AI-powered Vinted resale assistant for **MG** (James's wife). She flips charity-shop finds on Vinted. Currently ~£300/month profit. Goal: automate the operational grind (descriptions, pricing, tracking, sourcing) while keeping the creative curation human.

**MG is non-technical and gets frustrated quickly.** Fire-and-forget UX: she types intent, the bot does the thing, reports. No clarifying questions, no modal flows, no "are you sure".

## Topology

```
                    ┌──────────────────────────┐
 MG's phone  ──────▶│ WhatsApp bot (VPS2)      │──┐
 (07459856889)      │ /opt/taste-trawler-agent │  │  HTTPS + Bearer
                    │ Baileys + Claude + tools │  │
                    └──────────────────────────┘  ▼
                                        ┌──────────────────────┐
                                        │ tastetrawler.com     │
                                        │ Next.js 16 on Vercel │
                                        │ Neon PG + Blob +     │
                                        │ Clerk auth           │
                                        └──────────────────────┘
```

The bot does not talk to Vinted, eBay, Gemini, or Neon directly. Everything goes through TT's API routes with a bearer token. Keep it that way — centralises auth, logging, and rate limiting.

## Web app (this repo)

- **Path:** `C:\Users\James\Desktop\Mgvinted\taste-trawler`
- **Framework:** Next.js 16, App Router, **Turbopack**, React Server Components default
- **Middleware file is `proxy.ts`** (Next 16 rename), at repo root
- **DB:** Neon Postgres via Drizzle ORM (`lib/db/schema.ts`)
- **Storage:** Vercel Blob for photos
- **Auth:** Clerk (Marketplace integration)
- **AI:** Gemini Flash via Vercel AI Gateway (OIDC — no manual API keys)
- **Deploy:** Vercel, project `prj_30Gt1fiJfcp7jQFm9ldRwdSJl5OW`, team `team_zsq3KBYG6T0epAFVHqxMQyyO`
- **Production branch:** `feat/phase1-mvp` — NOT `main` or `master`. Auto-deploys on push via Vercel's git integration.
- **Domain:** tastetrawler.com (apex on Vercel)
- **GitHub:** https://github.com/jamescockburn47/tastetrawler
- **TT_API_KEY (bot auth):** stored in Vercel env + on VPS in `/opt/taste-trawler-agent/.env`. Do not paste in chat or commit.

### API routes
- `POST /api/items` — create (supports CORS, wraps in try/catch so errors carry CORS headers)
- `GET  /api/items[?status=...]` — list
- `PATCH /api/items/:id` — partial update (used by bot's `tt_add_buy_price`)
- `POST /api/analyse` — Gemini vision over photo URLs → brand/category/condition/era/colours/style/material
- `POST /api/comps` — eBay comps (stub until eBay dev key lands)
- `POST /api/generate-listing` — Gemini → title + description + suggested price
- `GET  /api/stats?days=N` — P&L
- `POST /api/upload` — Blob upload
- `GET  /api/taste-profile` — taste vector aggregate

### Schema highlights (`lib/db/schema.ts`)
- **Prices are integers in pence.** `buyPrice`, `listPrice`, `soldPrice`.
- `timestamp` columns (`listedAt`, `soldAt`, `createdAt`, `updatedAt`) want **`Date` objects**, not ISO strings, when inserting via Drizzle. `app/api/items/route.ts` coerces on POST — do the same in any new route.
- `status` enum: `draft | listed | sold | stale | archived`
- `source` enum: `charity_shop | vinted_flip | ebay | sale | other`
- `photos`, `colours`, `styleTags` are `jsonb` arrays
- `tasteVector` is `jsonb` `Record<string, number>`
- `vintedListingId` is the dedup key for imports

## Git layout — important

There used to be TWO overlapping git repos in this tree (outer at `/Mgvinted/.git`, inner orphan at `/Mgvinted/taste-trawler/.git`). The inner one was deleted. **There is now only one repo**, rooted at `C:\Users\James\Desktop\Mgvinted\`. It tracks the Next.js app under the `taste-trawler/` prefix.

**Do not `git init` inside `taste-trawler/`.** If you see a `.git` there, it's the orphan coming back — delete it.

Everyday commands:
```bash
cd /c/Users/James/Desktop/Mgvinted
git status
git add taste-trawler/path/to/file
git commit -m "..."
git push origin feat/phase1-mvp   # triggers Vercel build
```

## VPS2 — WhatsApp bot (Hostinger)

- **Host:** `187.124.112.238` (hostname `srv1473982`)
- **User:** `root`
- **SSH:** key-based, already trusted. Just `ssh root@187.124.112.238` — no password, no extra flags.
- **Key:** `~/.ssh/id_ed25519` (the same one used for the Pi and EVO)
- **Specs:** 16GB RAM, 4 CPU
- **Node:** v20.20.2 via nvm at `/root/.nvm/versions/node/v20.20.2/`. `node` is NOT on root's PATH non-interactively — the systemd unit sources nvm. If you need to run node ad-hoc: `source /root/.nvm/nvm.sh && node ...`

### Paths
- Bot code: `/opt/taste-trawler-agent/`
  - `index.js` — WhatsApp entry, Baileys socket, Claude loop
  - `claude.js` — Anthropic SDK wrapper
  - `tools.js` — tool registry (names prefixed `tt_`)
  - `tt-api.js` — HTTP client to tastetrawler.com (bearer auth)
  - `formatter.js` — WhatsApp-safe output formatting (`*bold*`, not markdown)
  - `config.js` — env var loader
  - `.env` — secrets (ANTHROPIC_API_KEY, TT_API_URL, TT_API_KEY, ALLOWED_NUMBERS, VINTED_*)
  - `auth/` — Baileys session (creds.json + ~800 key files). **Paired to MG's number 07459856889.** Do not delete unless re-pairing.
- QR PNG (emitted on each QR rotation while unpaired): `/tmp/tt-qr.png`

### systemd
- **Unit:** `taste-trawler.service` (not `taste-trawler-agent` — the name diverges from the path)
- **Enabled** at boot, auto-restart
- Commands:
  ```bash
  systemctl status  taste-trawler
  systemctl restart taste-trawler
  journalctl -u taste-trawler -n 50 --no-pager
  journalctl -u taste-trawler -f
  ```
- ExecStart sources nvm then runs `node index.js`.

### Re-pairing (if creds ever get invalidated)
```bash
ssh root@187.124.112.238
systemctl stop taste-trawler
rm -rf /opt/taste-trawler-agent/auth
systemctl start taste-trawler
# QR writes to /tmp/tt-qr.png every ~20s
```
Pull the PNG down to the workstation with `scp` and open it — MG scans from WhatsApp → Linked Devices → Link a Device. `auth/creds.json` appears when pairing completes; expect one immediate reason-515 disconnect followed by auto-reconnect ("connected to WhatsApp" in the journal).

### Bot tools (current — extend here, not in the web app)
| Tool | Purpose |
|---|---|
| `tt_evaluate_item` | Photos → brand/category/condition + comps |
| `tt_quick_list` | Photos → full draft listing saved to TT |
| `tt_stats` | P&L over N days |
| `tt_stale_items` | Listed 14+ days without selling |
| `tt_search_comps` | eBay comps by query |
| `tt_add_buy_price` | Record cost on existing item (fuzzy title match) |

Planned admin tools (not yet built — see conversation for roadmap): `tt_enrich_inventory`, `tt_backfill_descriptions`, `tt_vinted_sync`, `tt_find`, `tt_health_check`, `tt_briefing`, `tt_edit_item`, `tt_bulk_reprice`.

## Vinted

- **Username:** `mgmc80`
- **User ID:** `119518667`
- **Correct per-user endpoint:** `/api/v2/wardrobe/{user_id}/items?per_page=96&page=N`
  - Do NOT use `/api/v2/catalog/items?user_id=X` — that treats user_id as a hint and returns the general catalog (got 479 items for a 127-item wardrobe).
  - Always client-side filter `String(item.user?.id) === USER_ID_STR` as a safety belt.
  - Always abort if the result is 0 or suspiciously large (>200 for MG).
- Session cookie lives in VPS `.env` as `VINTED_SESSION_COOKIE`. Expires periodically; refresh from a logged-in Chrome (DevTools → Application → Cookies → vinted.co.uk).
- 127 items currently imported (Apr 2026) with hollow fields — need description/category/listedAt backfill and Gemini enrichment.

## Deployment rules

- **Never deploy from a dirty working tree.** Commit first, then push. The bot's CORS handling was almost lost this way.
- **Never push to `main` or `master`.** Production is `feat/phase1-mvp`. Pushing to any other branch creates a Preview, not a Production, deployment.
- **Vercel CLI is not installed locally.** Deploys happen via `git push`. Vercel's GitHub integration builds and promotes automatically on pushes to `feat/phase1-mvp`.
- If you need to check a deploy, use the Vercel MCP tools (`list_deployments`, `get_deployment`, `get_deployment_build_logs`) with project ID above.

## Testing from the command line

```bash
# CORS preflight
curl -X OPTIONS https://tastetrawler.com/api/items -I

# List all items (unauthenticated GET is fine in Phase 1)
curl https://tastetrawler.com/api/items | jq 'length'

# Count by status
curl https://tastetrawler.com/api/items | jq 'group_by(.status) | map({status: .[0].status, n: length})'
```

## Things to never do

- Never commit or paste `TT_API_KEY`, `ANTHROPIC_API_KEY`, or any Vinted cookie/password.
- Never `rm -rf /opt/taste-trawler-agent/auth` without the user's explicit go-ahead — it forces a re-pair.
- Never run `git reset --hard` or `git checkout --` on the repo without checking `git status` first. The nested-repo incident happened because of an uninspected checkout.
- Never assume `node` is on root's PATH on VPS2. Either use the systemd service or `source /root/.nvm/nvm.sh` first.
- Never add tools to the web app that belong on the bot. The bot is MG's interface; the web app is the system of record.
