"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface DropdownProps {
  label: ReactNode;
  title?: string;
  /** Panel content; receives a `close` callback so entries can dismiss the dropdown after acting. */
  children: (close: () => void) => ReactNode;
}

/** A toolbar button that toggles an anchored popover panel — click outside or Escape to close. */
export function Dropdown({ label, title, children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title={title}
        className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-accent-soft"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        <svg width="9" height="9" viewBox="0 0 9 9" className="opacity-60" aria-hidden="true">
          <path d="M1 3 L4.5 6.5 L8 3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+4px)] z-20 min-w-[190px] overflow-hidden rounded-lg border border-line bg-white py-1 shadow-lg"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export interface ToolbarMenuItem {
  key: string;
  label: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}

export interface ToolbarMenuSection {
  heading?: string;
  items: ToolbarMenuItem[];
}

interface ToolbarMenuProps {
  label: ReactNode;
  sections: ToolbarMenuSection[];
  title?: string;
}

/** A `Dropdown` specialized for a flat list of one-shot actions, grouped into optional labeled sections. */
export function ToolbarMenu({ label, sections, title }: ToolbarMenuProps) {
  return (
    <Dropdown label={label} title={title}>
      {(close) =>
        sections.map((section, i) => (
          <div key={i} className={i > 0 ? "mt-1 border-t border-line pt-1" : undefined}>
            {section.heading && (
              <div className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-muted">{section.heading}</div>
            )}
            {section.items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className="block w-full px-3 py-1.5 text-left text-xs font-medium text-ink hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => {
                  close();
                  item.onSelect();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))
      }
    </Dropdown>
  );
}
