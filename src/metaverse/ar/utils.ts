// ────────────────────────────────────────────────────────────
// src/metaverse/ar/utils.ts
// Shared utilities for all AR components
// ────────────────────────────────────────────────────────────

export type Landmark = { x: number; y: number; z: number };

// ── MediaPipe Script Loader ──────────────────────────────────
// Injects a <script> tag once, resolves when loaded.
// Subsequent calls with the same URL resolve immediately.
export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`AR: failed to load ${src}`));
    document.head.appendChild(s);
  });
}

// ── Face Oval Landmark Indices ───────────────────────────────
// MediaPipe FaceMesh indices that trace the face oval contour.
export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];

// Lip contour landmarks (outer ring)
export const LIPS_OUTER = [
  61, 185, 40, 39, 37, 0, 267, 269, 270, 409,
  291, 375, 321, 405, 314, 17, 84, 181, 91, 146,
];

// Eye contours
export const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
export const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];

// ── Coordinate helpers ───────────────────────────────────────
/**
 * Convert a normalized [0,1] landmark to canvas pixel coordinates.
 * If mirrored (front camera selfie mode) the X axis is flipped.
 */
export function lmToXY(
  lm: Landmark,
  w: number,
  h: number,
  mirrored: boolean,
): { x: number; y: number } {
  return {
    x: (mirrored ? 1 - lm.x : lm.x) * w,
    y: lm.y * h,
  };
}

/**
 * Build a Canvas2D closed path from a list of landmark indices.
 */
export function buildPath(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  indices: number[],
  w: number,
  h: number,
  mirrored: boolean,
) {
  ctx.beginPath();
  indices.forEach((idx, i) => {
    const { x, y } = lmToXY(landmarks[idx], w, h, mirrored);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

/**
 * Get the axis-aligned bounding box of a set of landmark indices.
 */
export function getBBox(
  landmarks: Landmark[],
  indices: number[],
  w: number,
  h: number,
  mirrored: boolean,
): { x: number; y: number; w: number; h: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  indices.forEach((idx) => {
    const { x, y } = lmToXY(landmarks[idx], w, h, mirrored);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// ── Image pre-loader ─────────────────────────────────────────
/**
 * Load an image from a URL with CORS support.
 * Returns the HTMLImageElement once loaded, or null on error.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!url) { reject(new Error('No URL')); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// ── Camera helpers ───────────────────────────────────────────
export async function startCamera(
  videoEl: HTMLVideoElement,
  facingMode: 'user' | 'environment',
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: 720 },
      height: { ideal: 1280 },
    },
    audio: false,
  });
  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

// ── Canvas capture → shareable image ────────────────────────
export async function shareCanvas(
  canvas: HTMLCanvasElement,
  title: string,
): Promise<void> {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `FanFest_AR_${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return;
    }
  } catch {
    // Fall through to download fallback
  }
  // Fallback: direct download
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/jpeg', 0.92);
  a.download = `FanFest_AR_${Date.now()}.jpg`;
  a.click();
}
