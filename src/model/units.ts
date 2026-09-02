import type { Units } from "./types";

const MM_PER_INCH = 25.4;

/** Format an integer-inch length for display. Never mutates the stored value. */
export function formatLength(inches: number, units: Units): string {
  if (units === "mm") {
    return `${Math.round(inches * MM_PER_INCH)} mm`;
  }
  // Decompose the magnitude and prefix the sign, rather than letting
  // Math.floor push the sign onto just the feet part (e.g. -20'-3" for
  // -237in, which parses back as -(20*12+3) = -243, not -237). A clean
  // "-19'-9"" keeps parseLength's negate-the-magnitude approach exact.
  const sign = inches < 0 ? "-" : "";
  const abs = Math.abs(inches);
  const whole = Math.floor(abs / 12);
  const remainder = Math.round(abs - whole * 12);
  if (remainder === 12) return `${sign}${whole + 1}'-0"`;
  return `${sign}${whole}'-${remainder}"`;
}

/** Short form for inline dimension labels, e.g. clearance callouts. */
export function formatShort(inches: number, units: Units): string {
  return formatLength(inches, units);
}

/**
 * Parse user input back into integer inches. Accepts:
 *  - feet-inches: 8'6", 8' 6", 8-6, 8ft 6in
 *  - bare feet: 8.5 (interpreted as feet when units === 'ft')
 *  - millimetres: 2600 (when units === 'mm'), or explicit "2600mm"
 *  - a leading "-" on any of the above, for deltas and off-wall positions
 * Returns null if the string cannot be parsed.
 */
export function parseLength(input: string, units: Units): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1).trim() : trimmed;
  const magnitude = parseUnsignedLength(unsigned, units);
  if (magnitude === null) return null;
  return negative ? -magnitude : magnitude;
}

function parseUnsignedLength(trimmed: string, units: Units): number | null {
  if (!trimmed) return null;

  const mmMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*mm$/);
  if (mmMatch) return Math.round(Number(mmMatch[1]) / MM_PER_INCH);

  if (units === "mm") {
    const bare = Number(trimmed);
    return Number.isFinite(bare) ? Math.round(bare / MM_PER_INCH) : null;
  }

  // Explicit feet marker, with an optional inches part: 8', 8'6", 8ft 6in
  const explicitFeet = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft)\s*-?\s*(\d+(?:\.\d+)?)?\s*(?:"|in)?$/);
  if (explicitFeet) {
    const feet = Number(explicitFeet[1]);
    const inches = Number(explicitFeet[2] ?? 0);
    return Math.round(feet * 12 + inches);
  }

  // Inches only: 6", 6in
  const inchesOnly = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:"|in)$/);
  if (inchesOnly) return Math.round(Number(inchesOnly[1]));

  // Dash-separated feet-inches: 8-6
  const dashed = trimmed.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (dashed) return Math.round(Number(dashed[1]) * 12 + Number(dashed[2]));

  // Bare number: interpreted as feet (may be fractional).
  const bare = Number(trimmed);
  if (Number.isFinite(bare)) return Math.round(bare * 12);
  return null;
}

export function inchesToFeet(inches: number): number {
  return inches / 12;
}

export function feetToInches(feet: number): number {
  return Math.round(feet * 12);
}
