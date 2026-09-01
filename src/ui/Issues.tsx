"use client";

import type { Issue } from "@/src/validate/rules";
import { useStore } from "@/src/store/useStore";

interface IssuesProps {
  issues: Issue[];
}

export function Issues({ issues }: IssuesProps) {
  const selectItem = useStore((s) => s.selectItem);

  if (issues.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-good/10 px-2.5 py-2 text-sm font-semibold text-good">
        Layout fits.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {issues.map((issue) => (
        <li key={issue.id}>
          <button
            className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs ${
              issue.severity === "error"
                ? "border-danger/40 bg-danger/10 text-danger"
                : "border-warn/40 bg-warn/10 text-warn"
            }`}
            onClick={() => issue.itemIds[0] && selectItem(issue.itemIds[0])}
          >
            {issue.message}
          </button>
        </li>
      ))}
    </ul>
  );
}
