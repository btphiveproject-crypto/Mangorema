/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/;

/**
 * Validates external clickable navigation URLs (anchor href, etc.).
 * Allows strictly http: or https: URLs without control characters.
 */
export function sanitizeSafeHttpUrl(rawUrl?: string | null): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 2048 || CONTROL_CHARS_RE.test(trimmed)) return undefined;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export interface SanitizeImageOptions {
  allowDataImage?: boolean;
  allowBlob?: boolean;
  fallback?: string;
}

const SAFE_RASTER_DATA_URI_RE =
  /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i;

function isSafeLocalAssetPath(trimmed: string): boolean {
  if (!trimmed.startsWith('/assets/') && !trimmed.startsWith('/src/assets/')) return false;
  if (trimmed.startsWith('//') || trimmed.includes('..') || trimmed.includes('\\')) return false;
  return /^\/(src\/)?assets\/[a-zA-Z0-9_./-]+$/.test(trimmed);
}

/**
 * Sanitizes image URLs before assigning to <img src> or canvas Image().src.
 * Blocks javascript:, vbscript:, data:text/html, data:image/svg+xml, etc.
 */
export function sanitizeImageUrl(
  rawUrl?: string | null,
  options: SanitizeImageOptions = {},
): string {
  const fallback = options.fallback ?? '';
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed || CONTROL_CHARS_RE.test(trimmed)) return fallback;

  if (isSafeLocalAssetPath(trimmed)) {
    return trimmed;
  }

  if (options.allowBlob && trimmed.startsWith('blob:')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'blob:') {
        return trimmed;
      }
    } catch {
      return fallback;
    }
  }

  if (options.allowDataImage && trimmed.toLowerCase().startsWith('data:')) {
    if (trimmed.length <= 8_000_000 && SAFE_RASTER_DATA_URI_RE.test(trimmed)) {
      return trimmed;
    }
    return fallback;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return parsed.toString();
    }
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      return parsed.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Strict media URL validator for Firestore persistence & WebSocket broadcasts.
 * Allows only HTTPS URLs, localhost HTTP dev URLs, or verified /assets/... paths.
 * Rejects data: and blob: URIs so oversized or active payloads are never stored.
 */
export function sanitizeStoredMediaUrl(rawUrl?: string | null): string | undefined {
  const clean = sanitizeImageUrl(rawUrl, {
    allowDataImage: false,
    allowBlob: false,
    fallback: '',
  });
  return clean || undefined;
}
