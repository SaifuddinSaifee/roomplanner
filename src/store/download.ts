export function downloadBlob(contents: string, type: string, filename: string): void {
  downloadFileBlob(new Blob([contents], { type }), filename);
}

export function downloadFileBlob(blob: Blob, filename: string): void {
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

/** Rasterizes the current plan SVG onto an offscreen canvas at `scale`x the on-screen size, on a white background. */
async function renderPlanToCanvas(scale: number): Promise<HTMLCanvasElement | null> {
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
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Rasterizes the current plan SVG to a PNG blob at `scale`x the on-screen size, on a white background. */
export async function planSvgToPngBlob(scale = 2): Promise<Blob | null> {
  const canvas = await renderPlanToCanvas(scale);
  if (!canvas) return null;
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Rasterizes the current plan SVG to a JPEG blob at `scale`x the on-screen size, on a white background. */
export async function planSvgToJpgBlob(scale = 2, quality = 0.92): Promise<Blob | null> {
  const canvas = await renderPlanToCanvas(scale);
  if (!canvas) return null;
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/** Copies arbitrary text to the clipboard. Returns whether it succeeded. */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Copies the plan as SVG markup (text) to the clipboard. Returns whether it succeeded. */
export async function copyPlanSvgToClipboard(): Promise<boolean> {
  const svg = serializePlanSvg();
  if (!svg) return false;
  return copyTextToClipboard(svg);
}

async function copyImageBlobToClipboard(blob: Blob | null, mime: string): Promise<boolean> {
  if (!blob || typeof ClipboardItem === "undefined") return false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ [mime]: blob })]);
    return true;
  } catch {
    return false;
  }
}

/** Copies the plan as a rasterized PNG image to the clipboard. Returns whether it succeeded. */
export async function copyPlanPngToClipboard(): Promise<boolean> {
  return copyImageBlobToClipboard(await planSvgToPngBlob(), "image/png");
}

/** Copies the plan as a rasterized JPEG image to the clipboard. Returns whether it succeeded. */
export async function copyPlanJpgToClipboard(): Promise<boolean> {
  return copyImageBlobToClipboard(await planSvgToJpgBlob(), "image/jpeg");
}
