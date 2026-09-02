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

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load SVG as image"));
    img.src = url;
  });
}

/** Rasterizes SVG markup onto an offscreen canvas at `scale`x its native `width`/`height`, on a white background. */
async function renderSvgToCanvas(svgMarkup: string, width: number, height: number, scale: number): Promise<HTMLCanvasElement | null> {
  const canvasWidth = Math.max(1, Math.round(width * scale));
  const canvasHeight = Math.max(1, Math.round(height * scale));

  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Rasterizes SVG markup to a PNG blob at `scale`x its native size, on a white background. */
export async function svgMarkupToPngBlob(svgMarkup: string, width: number, height: number, scale = 1): Promise<Blob | null> {
  const canvas = await renderSvgToCanvas(svgMarkup, width, height, scale);
  if (!canvas) return null;
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Rasterizes SVG markup to a JPEG blob at `scale`x its native size, on a white background. */
export async function svgMarkupToJpgBlob(
  svgMarkup: string,
  width: number,
  height: number,
  scale = 1,
  quality = 0.92
): Promise<Blob | null> {
  const canvas = await renderSvgToCanvas(svgMarkup, width, height, scale);
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

/** Copies an image blob to the clipboard under `mime`. Returns whether it succeeded. */
export async function copyImageBlobToClipboard(blob: Blob | null, mime: string): Promise<boolean> {
  if (!blob || typeof ClipboardItem === "undefined") return false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ [mime]: blob })]);
    return true;
  } catch {
    return false;
  }
}
