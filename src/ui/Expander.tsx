"use client";

import { useState } from "react";
import type { ReactNode } from "react";

interface ExpanderProps {
  title: string;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A collapsible <details>/<summary> pair with `open` tracked in real React
 * state and fed back via onToggle. React treats `open` like a controlled
 * form attribute — it rewrites the DOM property from the prop on every
 * render of this element, not just when the value changes — so a plain
 * `open={defaultOpen}` literal gets snapped back to its default by the next
 * unrelated re-render (see Sidebar's Section, which hit exactly this).
 */
export function Expander({ title, defaultOpen = true, className = "", children }: ExpanderProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} className={className}>
      <summary className="cursor-pointer select-none px-3.5 py-3 text-sm font-bold">{title}</summary>
      <div className="px-3.5 pb-4">{children}</div>
    </details>
  );
}
