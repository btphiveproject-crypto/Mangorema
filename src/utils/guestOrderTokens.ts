/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Keeps preview-mode guest order control HMAC tokens strictly in JS memory
 * (never in localStorage, sessionStorage, or Firestore).
 */
const guestOrderControlTokens = new Map<string, string>();

export function setGuestOrderControlToken(orderId: string, token?: string): void {
  if (!orderId || !token) return;
  guestOrderControlTokens.set(orderId, token);
}

export function getGuestOrderControlToken(orderId: string): string | undefined {
  if (!orderId) return undefined;
  return guestOrderControlTokens.get(orderId);
}
