"use client";

import { useState } from "react";

import type { Units } from "@/src/model/types";
import { formatLength, parseLength } from "@/src/model/units";

interface LengthFieldProps {
  label: string;
  value: number;
  units: Units;
  disabled?: boolean;
  onCommit: (inches: number) => void;
}

export function LengthField({ label, value, units, disabled, onCommit }: LengthFieldProps) {
  const [text, setText] = useState(() => formatLength(value, units));

  // Reset the edit buffer when the underlying value/units change from
  // outside (e.g. a drag, or switching units) — done during render, per
  // React's "adjusting state when a prop changes" pattern, rather than in a
  // useEffect that would cause an extra render pass.
  const [prevKey, setPrevKey] = useState(`${value}-${units}`);
  const key = `${value}-${units}`;
  if (key !== prevKey) {
    setPrevKey(key);
    setText(formatLength(value, units));
  }

  function commit() {
    const parsed = parseLength(text, units);
    if (parsed !== null) onCommit(parsed);
    else setText(formatLength(value, units));
  }

  return (
    <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted">
      {label}
      <input
        className="rounded-lg border border-line px-2 py-1.5 text-sm text-ink disabled:bg-page disabled:text-muted"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
      />
    </label>
  );
}
