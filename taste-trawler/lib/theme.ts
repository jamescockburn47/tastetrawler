import { unstable_cache, revalidateTag } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { themeSettings } from './db/schema';
import {
  type ThemeName,
  type ThemeDials,
  getDialsSchema,
  getDefaultDials,
} from './theme-dials';

const THEME_CACHE_TAG = 'theme-settings';

/**
 * Read current dials for a theme. Falls back to hard-coded defaults if
 * no row exists (first-boot safety). Cached per theme name with a
 * shared tag so `revalidateTag('theme-settings')` invalidates all
 * themes in one call.
 */
export async function readThemeDials(theme: ThemeName): Promise<ThemeDials> {
  return readCached(theme);
}

const readCached = unstable_cache(
  async (theme: ThemeName): Promise<ThemeDials> => {
    // Fail-safe: if DATABASE_URL is unset, Neon is unreachable, or the
    // table does not exist in this environment, fall back to defaults
    // rather than throwing. The root layout runs on every request and
    // the site must not 500 on theme-infrastructure issues.
    try {
      const rows = await db
        .select()
        .from(themeSettings)
        .where(eq(themeSettings.themeName, theme))
        .limit(1);

      if (rows.length === 0) {
        return getDefaultDials(theme);
      }

      // Validate DB blob against the current schema. If the schema has
      // evolved and the DB row is stale, safeParse falls back to defaults
      // rather than throwing — the layout must not break on bad data.
      const schema = getDialsSchema(theme);
      const parsed = schema.safeParse(rows[0].dials);
      return parsed.success ? parsed.data : getDefaultDials(theme);
    } catch (err) {
      // Log for observability but do not escalate.
      console.error('[theme] readThemeDials fell back to defaults:', err);
      return getDefaultDials(theme);
    }
  },
  ['theme-settings-v1'],
  { tags: [THEME_CACHE_TAG] },
);

export async function readAllThemes(): Promise<
  Array<{ theme: ThemeName; dials: ThemeDials }>
> {
  const themes: ThemeName[] = ['malibu', 'leopard'];
  return Promise.all(
    themes.map(async (theme) => ({ theme, dials: await readThemeDials(theme) })),
  );
}

export function invalidateThemeCache() {
  revalidateTag(THEME_CACHE_TAG, {});
}
