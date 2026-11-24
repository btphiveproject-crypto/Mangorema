/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clearGoogleAccessToken } from '../firebase';

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to?: string;
  date: string;
  internalDateMs: number;
  snippet: string;
  bodyText: string;
  isUnread: boolean;
  labelIds: string[];
  detectedBookingRef?: string;
  detectedPark?: string;
  detectedPaymentMethod?: 'Airtel Money' | 'Moov Money' | 'GhettoPay';
}

export const MANGOREMA_BOOKING_GMAIL_QUERY =
  'in:inbox (MANGOREMA OR "MANG-" OR ((expédition OR expedition OR billet OR réservation OR reservation OR pass) AND (Mondah OR Pongara OR Ivindo OR Cristal OR Nyonié OR Loango OR Akanda OR ANPN OR Gabon OR navette)))';

export const ALL_BOOKINGS_GMAIL_QUERY =
  'in:inbox (réservation OR reservation OR billet OR confirmation OR pass OR navette OR ticket OR expédition OR expedition OR MANGOREMA)';

interface GmailHeader {
  name?: string;
  value?: string;
}

interface GmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
}

interface GmailMessageResponse {
  id: string;
  threadId?: string;
  internalDate?: string;
  snippet?: string;
  labelIds?: string[];
  payload?: {
    mimeType?: string;
    headers?: GmailHeader[];
    body?: { data?: string };
    parts?: GmailPart[];
  };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function extractBookingInsights(subject: string, body: string): {
  detectedBookingRef?: string;
  detectedPark?: string;
  detectedPaymentMethod?: 'Airtel Money' | 'Moov Money' | 'GhettoPay';
} {
  const combined = `${subject}\n${body}`;
  const refMatch = combined.match(/\bMANG-[A-Z0-9-]{4,24}\b/i);
  const parkMatch = combined.match(
    /\b(Mondah|Pongara|Nyonié|Ivindo|Monts de Cristal|Loango|Akanda|Lopé|ANPN)\b/i
  );
  const hasAirtel = /\bairtel\b/i.test(combined);
  const hasMoov = /\bmoov\b/i.test(combined);
  const hasGhettoPay = /\bghettopay\b/i.test(combined);

  return {
    detectedBookingRef: refMatch ? refMatch[0].toUpperCase() : undefined,
    detectedPark: parkMatch ? parkMatch[1] : undefined,
    detectedPaymentMethod: hasGhettoPay
      ? 'GhettoPay'
      : hasAirtel
      ? 'Airtel Money'
      : hasMoov
      ? 'Moov Money'
      : undefined,
  };
}

function encodeBase64UrlUtf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const STRICT_SINGLE_EMAIL_RE =
  /^[^\s@<>()[\]\\,;:"'\u0000-\u001F\u007F]+@[^\s@<>()[\]\\,;:"'\u0000-\u001F\u007F]+\.[^\s@<>()[\]\\,;:"'\u0000-\u001F\u007F]{2,}$/;

function assertValidRecipientEmail(rawTo: string): string {
  const clean = rawTo.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!clean || clean.length > 254 || !STRICT_SINGLE_EMAIL_RE.test(clean)) {
    throw new Error('Veuillez indiquer une adresse e-mail destinataire valide.');
  }
  return clean;
}

function encodeMimeHeaderUtf8(text: string): string {
  const sanitized = text.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim();
  // Encode non-ASCII subjects cleanly using RFC 2047 UTF-8 Base64 if needed
  if (/^[\x20-\x7E]*$/.test(sanitized)) {
    return sanitized;
  }
  const bytes = new TextEncoder().encode(sanitized);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

function decodeBase64UrlUtf8(data?: string): string {
  if (!data) return '';
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return '';
  }
}

function extractBodyText(payload?: GmailMessageResponse['payload']): string {
  if (!payload) return '';

  const walkParts = (parts?: GmailPart[], targetMime?: string): string => {
    if (!parts) return '';
    for (const part of parts) {
      if (part.mimeType === targetMime && part.body?.data) {
        return decodeBase64UrlUtf8(part.body.data);
      }
      if (part.parts) {
        const nested = walkParts(part.parts, targetMime);
        if (nested) return nested;
      }
    }
    return '';
  };

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64UrlUtf8(payload.body.data);
  }

  const plainFromParts = walkParts(payload.parts, 'text/plain');
  if (plainFromParts) return plainFromParts;

  if (payload.body?.data) {
    return decodeHtmlEntities(
      decodeBase64UrlUtf8(payload.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    );
  }

  const htmlFromParts = walkParts(payload.parts, 'text/html');
  if (htmlFromParts) {
    return decodeHtmlEntities(
      htmlFromParts.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    );
  }

  return '';
}

function getHeader(headers: GmailHeader[] | undefined, name: string): string {
  if (!headers) return '';
  const match = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return match?.value?.trim() || '';
}

function formatShortDate(rawDate: string, fallbackMs?: number): string {
  const parsed = rawDate ? new Date(rawDate) : fallbackMs ? new Date(fallbackMs) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return rawDate.slice(0, 22);
  return parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function gmailFetch(url: string, accessToken: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    clearGoogleAccessToken();
    throw new Error('TOKEN_EXPIRED_OR_DENIED');
  }

  return res;
}

export async function fetchGmailMessages(
  accessToken: string,
  query = '',
  maxResults = 10
): Promise<GmailMessageSummary[]> {
  const params = new URLSearchParams({
    maxResults: String(maxResults),
  });
  if (query.trim()) {
    params.set('q', query.trim());
  }

  const listRes = await gmailFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
    accessToken
  );

  if (!listRes.ok) {
    const errText = await listRes.text();
    throw new Error(`Erreur API Gmail (${listRes.status}): ${errText.slice(0, 160)}`);
  }

  const listData = (await listRes.json()) as { messages?: Array<{ id: string; threadId: string }> };
  const stubs = listData.messages || [];
  if (stubs.length === 0) return [];

  const details = await Promise.all(
    stubs.slice(0, maxResults).map(async (stub): Promise<GmailMessageSummary | null> => {
      const msgRes = await gmailFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(stub.id)}?format=full`,
        accessToken
      );
      if (!msgRes.ok) return null;
      const data = (await msgRes.json()) as GmailMessageResponse;
      const headers = data.payload?.headers;
      const labelIds = data.labelIds || [];
      const subject = getHeader(headers, 'Subject') || '(Sans objet)';
      const snippet = decodeHtmlEntities((data.snippet || '').trim());
      const bodyText = (extractBodyText(data.payload) || snippet).trim();
      const internalDateMs = Number(data.internalDate || 0) || Date.now();
      const insights = extractBookingInsights(subject, bodyText);

      return {
        id: data.id,
        threadId: data.threadId || stub.threadId,
        subject,
        from: getHeader(headers, 'From') || 'Expéditeur inconnu',
        to: getHeader(headers, 'To') || undefined,
        date: formatShortDate(getHeader(headers, 'Date'), internalDateMs),
        internalDateMs,
        snippet,
        bodyText,
        isUnread: labelIds.includes('UNREAD'),
        labelIds,
        ...insights,
      };
    })
  );

  return details
    .filter((m): m is GmailMessageSummary => m !== null)
    .sort((a, b) => b.internalDateMs - a.internalDateMs);
}

function buildRawMimeMessage(params: { to: string; subject: string; body: string }): string {
  const cleanTo = assertValidRecipientEmail(params.to);
  const safeSubject = params.subject.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim() || 'Message MANGOREMA Gabon';
  const safeBody = params.body.replace(/\u0000/g, '').replace(/\r?\n/g, '\r\n');
  const mime = [
    `To: ${cleanTo}`,
    `Subject: ${encodeMimeHeaderUtf8(safeSubject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    safeBody,
  ].join('\r\n');

  return encodeBase64UrlUtf8(mime);
}

export async function sendGmailMessage(
  accessToken: string,
  params: { to: string; subject: string; body: string }
): Promise<{ id: string; threadId?: string }> {
  const raw = buildRawMimeMessage(params);
  const res = await gmailFetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Échec d'envoi Gmail (${res.status}): ${errText.slice(0, 160)}`);
  }

  return (await res.json()) as { id: string; threadId?: string };
}

export async function createGmailDraft(
  accessToken: string,
  params: { to: string; subject: string; body: string }
): Promise<{ id: string }> {
  const raw = buildRawMimeMessage(params);
  const res = await gmailFetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: { raw },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Échec de création du brouillon Gmail (${res.status}): ${errText.slice(0, 160)}`);
  }

  return (await res.json()) as { id: string };
}

export async function markGmailMessageRead(accessToken: string, messageId: string): Promise<void> {
  const res = await gmailFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}/modify`,
    accessToken,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        removeLabelIds: ['UNREAD'],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Impossible de marquer comme lu (${res.status}): ${errText.slice(0, 140)}`);
  }
}

export async function trashGmailMessage(accessToken: string, messageId: string): Promise<void> {
  const res = await gmailFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}/trash`,
    accessToken,
    {
      method: 'POST',
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Impossible de déplacer en corbeille (${res.status}): ${errText.slice(0, 140)}`);
  }
}
