/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const MAX_PHOTO_DIMENSION = 1280;
const JPEG_COMPRESSION_QUALITY = 0.82;

export async function compressImageBlobToJpeg(
  source: Blob | File,
  maxDimension = MAX_PHOTO_DIMENSION,
  quality = JPEG_COMPRESSION_QUALITY
): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return source;
  }

  const objectUrl = URL.createObjectURL(source);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image illisible pour la compression.'));
      el.src = objectUrl;
    });

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) return source;

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return source;

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const compressed = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    );
    return compressed && compressed.size > 0 ? compressed : source;
  } catch {
    return source;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function formatPhotoSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
