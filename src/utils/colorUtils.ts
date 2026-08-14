/**
 * Utility functions for color manipulation and contrast calculations
 */

/**
 * Normalizes a hex string to 6 characters (without #)
 */
function normalizeHex(hex: string): string {
  if (!hex || typeof hex !== 'string') return 'ffffff';
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return 'ffffff';
  return clean;
}

/**
 * Calculates perceived brightness (0-255) of a hex color.
 * Standard formula: (r * 299 + g * 587 + b * 114) / 1000
 */
export function getBrightness(hex: string): number {
  const cleanHex = normalizeHex(hex);
  const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
  const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
  const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Returns true if the hex color is considered dark (brightness < 128)
 */
export function isDarkColor(hex: string): boolean {
  return getBrightness(hex) < 128;
}
