/**
 * Pure function: given a theme name and current dials, produce the CSS
 * variable overrides to inject into a <style> block in the root layout.
 *
 * Phase 1 implements the minimum set of mappings needed to prove the
 * pipeline. Additional dials (hue shift, saturation, motif intensity)
 * gain CSS impact in phase 2/3 as the token sets fill out.
 */
import type { ThemeName, ThemeDials } from './theme-dials';

const radiusToRem: Record<'tight' | 'soft' | 'pillow', string> = {
  tight: '0.5rem',
  soft: '1rem',
  pillow: '1.5rem',
};

export function dialsToCssBlock(theme: ThemeName, dials: ThemeDials): string {
  const radius = radiusToRem[dials.radius];
  const headingScale = dials.headingScale.toFixed(3);
  return `.${theme}{--radius:${radius};--heading-scale:${headingScale};}`;
}

export function allThemeCssBlocks(
  entries: Array<{ theme: ThemeName; dials: ThemeDials }>,
): string {
  return entries.map(({ theme, dials }) => dialsToCssBlock(theme, dials)).join('');
}
