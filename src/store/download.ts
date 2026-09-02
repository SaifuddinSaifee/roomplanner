export function downloadBlob(contents: string, type: string, filename: string): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function serializePlanSvg(): string | null {
  const svg = document.getElementById("plan-svg");
  if (!svg) return null;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const rect = svg.getBoundingClientRect();
  clone.setAttribute("width", String(Math.round(rect.width)));
  clone.setAttribute("height", String(Math.round(rect.height)));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load SVG as image"));
    img.src = url;
  });
}

/** Rasterizes the current plan SVG to a PNG blob at `scale`x the on-screen size, on a white background. */
export async function planSvgToPngBlob(scale = 2): Promise<Blob | null> {
  const svgEl = document.getElementById("plan-svg");
  const svgString = serializePlanSvg();
  if (!svgEl || !svgString) return null;

  const rect = svgEl.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * scale));
  const height = Math.max(1, Math.round(rect.height * scale));

  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Copies the plan as SVG markup (text) to the clipboard. Returns whether it succeeded. */
export async function copyPlanSvgToClipboard(): Promise<boolean> {
  const svg = serializePlanSvg();
  if (!svg) return false;
  try {
    await navigator.clipboard.writeText(svg);
    return true;
  } catch {
    return false;
  }
}

/** Copies the plan as a rasterized PNG image to the clipboard. Returns whether it succeeded. */
export async function copyPlanPngToClipboard(): Promise<boolean> {
  if (typeof ClipboardItem === "undefined") return false;
  try {
    const blob = await planSvgToPngBlob();
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}
