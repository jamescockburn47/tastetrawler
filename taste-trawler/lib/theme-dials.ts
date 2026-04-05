/**
 * Shared dial schema for the Malibu and Leopard themes.
 *
 * This file is imported by:
 *   - the web app (taste-trawler) to read/write dial state
 *   - the VPS bot (/opt/taste-trawler-agent) via a copied source in phase 4
 *
 * DO NOT import Node-only modules here — it must compile to plain JS
 * when copied onto the bot VPS.
 */
import { z } from 'zod';

export const themeNameSchema = z.enum(['malibu', 'leopard']);
export type ThemeName = z.infer<typeof themeNameSchema>;

export const radiusSchema = z.enum(['tight', 'soft', 'pillow']);
export const shadowSchema = z.enum(['none', 'subtle', 'bloom']);
export const motifIntensitySchema = z.enum(['off', 'whisper', 'present', 'full']);
export const saleCelebrationSchema = z.enum(['off', 'subtle', 'full']);

export const malibuMotifSchema = z.enum(['heart', 'bow', 'butterfly', 'sparkle']);
export const leopardMotifSchema = z.enum(['spots', 'gold-spots', 'leopard-frame']);

export const malibuDisplayFontSchema = z.enum([
  'editorial-new',
  'recoleta',    // reserved for licence upgrade
  'saol-display', // reserved for licence upgrade
]);

export const leopardDisplayFontSchema = z.enum([
  'migra',
  'canela-deck', // reserved for licence upgrade
  'pp-neue-machina', // reserved for licence upgrade
]);

/** Dials shared by both themes. */
const commonDialsShape = {
  hueShift: z.number().min(-30).max(30).default(0),
  saturation: z.number().min(0.5).max(1.5).default(1),
  brightness: z.number().min(0.9).max(1.1).default(1),
  radius: radiusSchema.default('soft'),
  shadow: shadowSchema.default('subtle'),
  headingScale: z.number().min(0.85).max(1.3).default(1),
  motifIntensity: motifIntensitySchema.default('present'),
  sparkleCursor: z.boolean().default(true),
  saleCelebration: saleCelebrationSchema.default('full'),
};

export const malibuDialsSchema = z.object({
  ...commonDialsShape,
  displayFont: malibuDisplayFontSchema.default('editorial-new'),
  motifVariant: malibuMotifSchema.default('sparkle'),
  radius: radiusSchema.default('pillow'),
});

export const leopardDialsSchema = z.object({
  ...commonDialsShape,
  displayFont: leopardDisplayFontSchema.default('migra'),
  motifVariant: leopardMotifSchema.default('spots'),
  radius: radiusSchema.default('tight'),
});

export type MalibuDials = z.infer<typeof malibuDialsSchema>;
export type LeopardDials = z.infer<typeof leopardDialsSchema>;
export type ThemeDials = MalibuDials | LeopardDials;

export const defaultMalibuDials: MalibuDials = malibuDialsSchema.parse({});
export const defaultLeopardDials: LeopardDials = leopardDialsSchema.parse({});

/** Partial schemas for safe bot-driven diffs. */
export const malibuDialsPatchSchema = malibuDialsSchema.partial();
export const leopardDialsPatchSchema = leopardDialsSchema.partial();
export type MalibuDialsPatch = z.infer<typeof malibuDialsPatchSchema>;
export type LeopardDialsPatch = z.infer<typeof leopardDialsPatchSchema>;

/** Pick the right schema for a theme name. */
export function getDialsSchema(theme: ThemeName) {
  return theme === 'malibu' ? malibuDialsSchema : leopardDialsSchema;
}
export function getDialsPatchSchema(theme: ThemeName) {
  return theme === 'malibu' ? malibuDialsPatchSchema : leopardDialsPatchSchema;
}
export function getDefaultDials(theme: ThemeName): ThemeDials {
  return theme === 'malibu' ? defaultMalibuDials : defaultLeopardDials;
}
