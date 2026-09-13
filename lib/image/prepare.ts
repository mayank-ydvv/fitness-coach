"use client";

/**
 * Client-side meal-photo prep before upload: resize to <=1024px on the long
 * edge, encode WebP q0.8 targeting <300KB, strip EXIF (which happens for
 * free by re-encoding through canvas — the important part is NOT losing
 * orientation in the process, which is what createImageBitmap's
 * imageOrientation option is for).
 */

const MAX_LONG_EDGE = 1024;
const TARGET_BYTES = 300 * 1024;
const WEBP_QUALITY_START = 0.8;

export type PreparedImage = { blob: Blob; contentType: "image/webp" | "image/jpeg"; width: number; height: number };

export async function prepareMealPhoto(file: File | Blob): Promise<PreparedImage> {
  // imageOrientation: 'from-image' bakes the EXIF orientation into the pixel
  // data before we draw it — otherwise a portrait phone photo comes out
  // sideways once EXIF is stripped by the re-encode below.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  const scale = Math.min(1, MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't prepare that photo — canvas 2D context unavailable.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Binary-search WebP quality down to hit the size target.
  let quality = WEBP_QUALITY_START;
  let blob = await canvasToBlob(canvas, "image/webp", quality);
  let attempts = 0;
  while (blob && blob.size > TARGET_BYTES && quality > 0.4 && attempts < 5) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, "image/webp", quality);
    attempts += 1;
  }

  // iOS Safari < 16.4 silently falls back to PNG from toBlob(..., 'image/webp')
  // rather than throwing — always check blob.type and take the JPEG path
  // when it isn't actually WebP, or a "webp" PNG blows the size target 5x.
  if (!blob || blob.type !== "image/webp") {
    let jpegQuality = WEBP_QUALITY_START;
    blob = await canvasToBlob(canvas, "image/jpeg", jpegQuality);
    attempts = 0;
    while (blob && blob.size > TARGET_BYTES && jpegQuality > 0.4 && attempts < 5) {
      jpegQuality -= 0.1;
      blob = await canvasToBlob(canvas, "image/jpeg", jpegQuality);
      attempts += 1;
    }
    if (!blob) throw new Error("Couldn't encode that photo. Try a different one.");
    return { blob, contentType: "image/jpeg", width, height };
  }

  return { blob, contentType: "image/webp", width, height };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
