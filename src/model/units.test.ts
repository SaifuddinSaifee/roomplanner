import { describe, expect, it } from "vitest";
import { formatLength, parseLength } from "./units";

describe("units", () => {
  it("formats feet-inches", () => {
    expect(formatLength(0, "ft")).toBe("0'-0\"");
    expect(formatLength(30, "ft")).toBe("2'-6\"");
    expect(formatLength(12, "ft")).toBe("1'-0\"");
  });

  it("formats millimetres", () => {
    expect(formatLength(12, "mm")).toBe("305 mm");
  });

  it("round-trips parse(format(n)) for ft-in across a range of inch values", () => {
    for (let inches = 0; inches < 240; inches += 1) {
      const formatted = formatLength(inches, "ft");
      expect(parseLength(formatted, "ft")).toBe(inches);
    }
  });

  it("round-trips parse(format(n)) for mm, within mm rounding", () => {
    for (let inches = 0; inches < 240; inches += 7) {
      const formatted = formatLength(inches, "mm");
      const parsed = parseLength(formatted, "mm");
      expect(parsed).not.toBeNull();
      expect(Math.abs((parsed as number) - inches)).toBeLessThanOrEqual(1);
    }
  });

  it("parses bare feet and feet-inches", () => {
    expect(parseLength("9", "ft")).toBe(108);
    expect(parseLength("8'6\"", "ft")).toBe(102);
    expect(parseLength("8-6", "ft")).toBe(102);
  });

  it("keeps part totals summing to the whole — the old feetLabel() bug", () => {
    // Regression for trap #3: displaying two 45in halves of a 90in run must
    // sum back to the same total, not silently round to 44+45=89 etc.
    const total = 91; // 7'-7", an inch count that stresses rounding
    const half = Math.round(total / 2);
    const a = formatLength(half, "ft");
    const b = formatLength(total - half, "ft");
    expect(parseLength(a, "ft")! + parseLength(b, "ft")!).toBe(total);
  });

  it("rejects unparseable input", () => {
    expect(parseLength("", "ft")).toBeNull();
    expect(parseLength("abc", "ft")).toBeNull();
  });

  it("parses negative lengths, needed for move-by deltas and off-wall positions", () => {
    expect(parseLength("-6\"", "ft")).toBe(-6);
    expect(parseLength("-1'-6\"", "ft")).toBe(-18);
    expect(parseLength("-0.5", "ft")).toBe(-6);
    expect(parseLength("-8-6", "ft")).toBe(-102);
    expect(parseLength("-100", "mm")).toBe(-4);
  });

  it("round-trips negative ft-in values", () => {
    for (let inches = -240; inches < 0; inches += 3) {
      const formatted = formatLength(inches, "ft");
      expect(parseLength(formatted, "ft")).toBe(inches);
    }
  });
});
