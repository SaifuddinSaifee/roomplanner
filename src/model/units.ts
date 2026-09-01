import type { Units } from "./types";

const MM_PER_INCH = 25.4;

/** Format an integer-inch length for display. Never mutates the stored value. */
export function formatLength(inches: number, units: Units): string {
  if (units === "mm") {
    return `${Math.round(inches * MM_PER_INCH)} mm`;
  }
  const whole = Math.floor(inches / 12);
  const remainder = Math.round(inches - whole * 12);
  if (remainder === 12) return `${whole + 1}'-0"`;
  return `${whole}'-${remainder}"`;
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
 * Returns null if the string cannot be parsed.
 */
export function parseLength(input: string, units: Units): number | null {
  const trimmed = input.trim().toLowerCase();
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
