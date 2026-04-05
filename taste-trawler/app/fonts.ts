import { DM_Serif_Display, Archivo_Narrow } from 'next/font/google';

/**
 * Malibu display font — high-contrast editorial serif.
 *
 * Phase 1 placeholder: DM Serif Display (Google Fonts, SIL OFL). Serves
 * the Valentino Pink PP / Blumarine register. Phase 2 may upgrade to a
 * paid foundry face once MG confirms direction.
 *
 * NOTE: Written plan named Pangram Pangram fonts. Switched to Google
 * Fonts because Pangram Pangram's free-to-try flow requires a full
 * e-commerce checkout that isn't automatable. Deviation approved by
 * James on 2026-04-05.
 */
export const malibuDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display-malibu',
});

/**
 * Leopard display font — condensed display sans, editorial fashion-mag
 * register, Dolce/Cavalli adjacent. Phase 1 placeholder: Archivo Narrow
 * Bold (Google Fonts, SIL OFL).
 */
export const leopardDisplay = Archivo_Narrow({
  subsets: ['latin'],
  weight: '700',
  display: 'swap',
  variable: '--font-display-leopard',
});
