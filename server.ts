/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import {
  computeMarketplaceDeliveryFee,
  resolveDeliveryZone,
} from './src/data/gabonZones.ts';
import type {
  FulfillmentStatus,
  MarketplaceVendorSplit,
  VendorOrderFulfillment,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const ADMIN_EMAIL = 'stephaneakagah@gmail.com';
const VALID_ID_RE = /^[a-zA-Z0-9_-]{3,128}$/;
const SHORT_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/g;

const PAYMENT_HMAC_SECRET =
  process.env.PAYMENT_HMAC_SECRET || crypto.randomBytes(32).toString('hex');
const PAYMENT_WEBHOOK_SECRET = (process.env.PAYMENT_WEBHOOK_SECRET || '').trim();
const MARKETPLACE_STORE_DIR = path.resolve(__dirname, 'data');
const MARKETPLACE_STORE_FILE = path.resolve(
  MARKETPLACE_STORE_DIR,
  'marketplace-store.json'
);

let FIREBASE_PROJECT_ID = '';
try {
  const cfgRaw = fs.readFileSync(
    path.resolve(__dirname, 'firebase-applet-config.json'),
    'utf8',
  );
  const parsedCfg = JSON.parse(cfgRaw) as { projectId?: string };
  FIREBASE_PROJECT_ID = typeof parsedCfg.projectId === 'string' ? parsedCfg.projectId.trim() : '';
} catch {
  FIREBASE_PROJECT_ID = '';
}

const VALID_ROOMS = new Set(['general', 'mondah', 'ivindo', 'pongara', 'cristal']);

interface ClientMeta {
  clientId: string;
  userId?: string;
  displayName: string;
  roomId: string;
  isAlive: boolean;
  windowStartMs: number;
  frameCount: number;
}

interface VerifiedFirebaseUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
}

type AuthCheckResult =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'ok'; user: VerifiedFirebaseUser };

const FIREBASE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let cachedFirebaseCerts: Record<string, string> = {};
let firebaseCertsExpiresAt = 0;

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now < firebaseCertsExpiresAt && Object.keys(cachedFirebaseCerts).length > 0) {
    return cachedFirebaseCerts;
  }
  const resp = await fetch(FIREBASE_CERTS_URL);
  if (!resp.ok) {
    if (Object.keys(cachedFirebaseCerts).length > 0) {
      return cachedFirebaseCerts;
    }
    throw new Error('Impossible de récupérer les certificats publics Firebase.');
  }
  const certs = (await resp.json()) as Record<string, string>;
  const cacheControl = resp.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? Math.min(86400, Math.max(60, Number(maxAgeMatch[1]))) : 3600;
  cachedFirebaseCerts = certs;
  firebaseCertsExpiresAt = now + maxAgeSec * 1000;
  return certs;
}

function decodeBase64UrlJson<T>(segment: string): T | null {
  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(padLen);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

async function verifyFirebaseIdToken(token: string): Promise<VerifiedFirebaseUser | null> {
  if (!FIREBASE_PROJECT_ID || !token || token.length > 8192) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;

  const header = decodeBase64UrlJson<{ alg?: string; kid?: string }>(headerB64);
  const payload = decodeBase64UrlJson<{
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    auth_time?: number;
    email?: string;
    email_verified?: boolean;
  }>(payloadB64);

  if (!header || !payload || header.alg !== 'RS256' || !header.kid) {
    return null;
  }

  let certs = await getFirebasePublicCerts();
  let certPem = certs[header.kid];
  if (!certPem) {
    firebaseCertsExpiresAt = 0;
    certs = await getFirebasePublicCerts();
    certPem = certs[header.kid];
    if (!certPem) return null;
  }

  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    const sigNormalized = sigB64.replace(/-/g, '+').replace(/_/g, '/');
    const sigPad = sigNormalized + '='.repeat((4 - (sigNormalized.length % 4)) % 4);
    const signatureValid = verifier.verify(certPem, Buffer.from(sigPad, 'base64'));
    if (!signatureValid) return null;
  } catch {
    return null;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
  if (
    payload.aud !== FIREBASE_PROJECT_ID ||
    payload.iss !== expectedIssuer ||
    typeof payload.exp !== 'number' ||
    payload.exp <= nowSec ||
    typeof payload.iat !== 'number' ||
    payload.iat > nowSec + 300 ||
    typeof payload.auth_time !== 'number' ||
    payload.auth_time > nowSec + 300 ||
    typeof payload.sub !== 'string' ||
    !SHORT_ID_RE.test(payload.sub)
  ) {
    return null;
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    emailVerified: payload.email_verified === true,
  };
}

async function verifyRequestAuth(req: Request): Promise<AuthCheckResult> {
  const authHeader = req.headers.authorization;
  if (!authHeader) return { status: 'missing' };
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]) return { status: 'invalid' };
  try {
    const user = await verifyFirebaseIdToken(match[1].trim());
    if (!user) return { status: 'invalid' };
    return { status: 'ok', user };
  } catch {
    return { status: 'invalid' };
  }
}

function isAdminUser(user?: VerifiedFirebaseUser | null): boolean {
  return Boolean(user && user.emailVerified && user.email === ADMIN_EMAIL);
}

function sanitizePlainText(value: unknown, maxLen: number, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const clean = value.replace(CONTROL_CHARS_RE, '').trim();
  return clean ? clean.slice(0, maxLen) : fallback;
}

function isSafeHttpUrl(rawUrl: unknown): rawUrl is string {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 2048 || CONTROL_CHARS_RE.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isSafeStoredMediaUrl(rawUrl: unknown): string | undefined {
  if (typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 500 || CONTROL_CHARS_RE.test(trimmed)) return undefined;
  if (
    trimmed.startsWith('/assets/') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes('..') &&
    !trimmed.includes('\\') &&
    /^\/assets\/[a-zA-Z0-9_./-]+$/.test(trimmed)
  ) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') return parsed.toString();
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      return parsed.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function signReceiptHash(
  orderId: string,
  refNumber: string,
  grandTotalCharged: number,
  idemKey: string,
): string {
  const mac = crypto
    .createHmac('sha256', PAYMENT_HMAC_SECRET)
    .update(`${orderId}:${refNumber}:${grandTotalCharged}:${idemKey}`)
    .digest('hex')
    .slice(0, 24)
    .toUpperCase();
  return `SHA256-${mac}`;
}

function computeGuestOrderControlToken(orderId: string): string {
  return crypto
    .createHmac('sha256', PAYMENT_HMAC_SECRET)
    .update(`guest-order:${orderId}`)
    .digest('hex');
}

function verifyGuestOrderControlToken(orderId: string, supplied?: unknown): boolean {
  if (typeof supplied !== 'string' || !supplied) return false;
  const expected = computeGuestOrderControlToken(orderId);
  const a = Buffer.from(supplied, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('MISSING_GEMINI_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function createIpRateLimiter(maxRequests: number, windowMs: number) {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    if (buckets.size > 5000) {
      for (const [key, entry] of buckets.entries()) {
        if (entry.resetAt <= now) buckets.delete(key);
      }
    }
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const current = buckets.get(ip);
    if (!current || current.resetAt <= now) {
      buckets.set(ip, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (current.count >= maxRequests) {
      res.status(429).json({
        error: 'Trop de requêtes effectuées. Veuillez patienter quelques instants avant de réessayer.',
      });
      return;
    }
    current.count += 1;
    next();
  };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  app.use(express.json({ limit: '256kb' }));
  app.use('/api', createIpRateLimiter(90, 60_000));
  app.use('/api/grounding', createIpRateLimiter(18, 60_000));

  // =========================================================================
  // API ROUTE 1: Google Maps Grounding (gemini-4-hydrogen + googleMaps tool)
  // =========================================================================
  app.post('/api/grounding/maps', async (req: Request, res: Response) => {
    try {
      const { query, latitude, longitude, zoneName } = req.body as {
        query?: unknown;
        latitude?: unknown;
        longitude?: unknown;
        zoneName?: unknown;
      };

      const cleanQuery = sanitizePlainText(query, 500);
      if (!cleanQuery) {
        res.status(400).json({ error: 'Veuillez saisir une recherche géographique valide (max 500 caractères).' });
        return;
      }

      if (latitude !== undefined && (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
        res.status(400).json({ error: 'Latitude invalide.' });
        return;
      }
      if (longitude !== undefined && (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
        res.status(400).json({ error: 'Longitude invalide.' });
        return;
      }

      const lat = typeof latitude === 'number' ? latitude : 0.5833;
      const lng = typeof longitude === 'number' ? longitude : 9.35;
      const cleanZone = sanitizePlainText(zoneName, 120);

      const ai = getGeminiClient();

      const contextZone = cleanZone ? ` dans ou autour de la zone "${cleanZone}" au Gabon` : ' au Gabon';
      const prompt = `Tu es un assistant logistique et guide de terrain MANGOREMA au Gabon. Réponds en français de façon claire, structurée et pratique${contextZone}.\nQuestion de l'utilisateur : ${cleanQuery}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: lat,
                longitude: lng,
              },
            },
          },
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const places: Array<{
        title: string;
        uri: string;
        placeId?: string;
        reviewSnippets: string[];
      }> = [];

      for (const chunk of chunks as Array<{
        maps?: {
          title?: string;
          uri?: string;
          placeId?: string;
          placeAnswerSources?: {
            reviewSnippets?: Array<{ content?: string } | string>;
          };
        };
      }>) {
        if (chunk.maps && isSafeHttpUrl(chunk.maps.uri)) {
          const snippetsRaw = chunk.maps.placeAnswerSources?.reviewSnippets || [];
          const reviewSnippets = snippetsRaw
            .map((s) => sanitizePlainText(typeof s === 'string' ? s : s?.content || '', 300))
            .filter(Boolean);

          places.push({
            title: sanitizePlainText(chunk.maps.title, 160, 'Lieu Google Maps'),
            uri: chunk.maps.uri,
            placeId: typeof chunk.maps.placeId === 'string' ? chunk.maps.placeId.slice(0, 128) : undefined,
            reviewSnippets,
          });
        }
      }

      res.json({
        text: response.text || 'Aucun résultat trouvé sur Google Maps.',
        places,
        coordsUsed: { latitude: lat, longitude: lng },
      });
    } catch (err: unknown) {
      console.error('[/api/grounding/maps] Error:', err);
      const isMissingKey = err instanceof Error && err.message === 'MISSING_GEMINI_API_KEY';
      res.status(500).json({
        error: isMissingKey
          ? 'Service de cartographie temporairement indisponible (configuration serveur requise).'
          : 'Erreur lors de la requête Google Maps Grounding.',
      });
    }
  });

  // =========================================================================
  // API ROUTE 2: Google Search Grounding (gemini-4-hydrogen + googleSearch tool)
  // =========================================================================
  app.post('/api/grounding/search', async (req: Request, res: Response) => {
    try {
      const { query, context } = req.body as {
        query?: unknown;
        context?: unknown;
      };

      const cleanQuery = sanitizePlainText(query, 500);
      if (!cleanQuery) {
        res.status(400).json({ error: 'Veuillez saisir une question de recherche valide (max 500 caractères).' });
        return;
      }

      const cleanContext = sanitizePlainText(context, 400);
      const ai = getGeminiClient();

      const prompt = `Tu es un conseiller écotourisme et sécurité terrain pour MANGOREMA au Gabon (Parcs Nationaux ANPN, Libreville, Estuaire, Ivindo, Pongara, Monts de Cristal). Utilise la recherche Google pour fournir des informations fiables, à jour et vérifiables en français.\n${cleanContext ? `Contexte : ${cleanContext}\n` : ''}Requête : ${cleanQuery}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: Array<{ title: string; uri: string }> = [];
      const seenUris = new Set<string>();

      for (const chunk of chunks as Array<{
        web?: { title?: string; uri?: string };
      }>) {
        if (isSafeHttpUrl(chunk.web?.uri) && !seenUris.has(chunk.web.uri)) {
          seenUris.add(chunk.web.uri);
          sources.push({
            title: sanitizePlainText(chunk.web.title, 180, chunk.web.uri),
            uri: chunk.web.uri,
          });
        }
      }

      res.json({
        text: response.text || 'Aucune information actualisée trouvée.',
        sources,
      });
    } catch (err: unknown) {
      console.error('[/api/grounding/search] Error:', err);
      const isMissingKey = err instanceof Error && err.message === 'MISSING_GEMINI_API_KEY';
      res.status(500).json({
        error: isMissingKey
          ? 'Service de recherche terrain temporairement indisponible (configuration serveur requise).'
          : 'Erreur lors de la requête Google Search Grounding.',
      });
    }
  });

  // =========================================================================
  // API ROUTE 3: Durable Catalog, Real-Time Stock, Payment & Vendor Routing
  // =========================================================================
  interface ServerCatalogEntry {
    id: string;
    kind: 'activity' | 'rental' | 'product' | 'shuttle';
    unitPrice: number;
    depositUnitAmount?: number;
    title: string;
    maxQty: number;
    ownerUserId?: string;
    ownerName?: string;
    storeId?: string;
    storeName?: string;
    deliveryAvailable?: boolean;
    storeDeliveryFee?: number;
  }

  const SEEDED_ENTRIES: ServerCatalogEntry[] = [
    // Activities
    { id: 'evt-1', kind: 'activity', unitPrice: 12000, title: 'Bivouac & Canopée Mondah', maxQty: 20, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Officiel' },
    { id: 'evt-2', kind: 'activity', unitPrice: 35000, title: 'Expédition Chutes de Djidji', maxQty: 20, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Officiel' },
    { id: 'evt-3', kind: 'activity', unitPrice: 22000, title: 'Safari Côtier & Bivouac Nyonié', maxQty: 20, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Officiel' },
    { id: 'evt-4', kind: 'activity', unitPrice: 0, title: 'Restauration Mangrove & Lagune Wonga', maxQty: 30, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Officiel' },
    { id: 'evt-5', kind: 'activity', unitPrice: 18000, title: 'Trek des Crêtes & Kinguélé', maxQty: 20, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Officiel' },
    // Shuttles
    { id: 'shut-1', kind: 'shuttle', unitPrice: 5000, title: 'Navette Minibus 15 Places Mondah', maxQty: 15, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Transports' },
    { id: 'shut-2', kind: 'shuttle', unitPrice: 10000, title: '4x4 Tout-Terrain Cap Estérias', maxQty: 6, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Transports' },
    { id: 'shut-3', kind: 'shuttle', unitPrice: 18000, title: 'Pirogue Rapide Pongara', maxQty: 14, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Transports' },
    { id: 'shut-4', kind: 'shuttle', unitPrice: 7500, title: 'Navette Express Owendo', maxQty: 14, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Transports' },
    // Rentals (per day + deposit)
    { id: 'rent-1', kind: 'rental', unitPrice: 6500, depositUnitAmount: 30000, title: 'Tente Dôme Bivouac Équatorial 3P', maxQty: 10, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Location' },
    { id: 'rent-2', kind: 'rental', unitPrice: 4500, depositUnitAmount: 20000, title: 'Sac à Dos Trekking Forêt Profonde 65L+10L', maxQty: 10, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Location' },
    { id: 'rent-3', kind: 'rental', unitPrice: 14000, depositUnitAmount: 75000, title: 'VTT Tout-Terrain Randonnée Forestière 29"', maxQty: 10, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Location' },
    { id: 'rent-4', kind: 'rental', unitPrice: 10000, depositUnitAmount: 80000, title: 'Balise de Détresse Satellite SOS & GPS', maxQty: 10, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Location' },
    { id: 'rent-5', kind: 'rental', unitPrice: 4000, depositUnitAmount: 18000, title: 'Kit Couchage Tropical (Sac + Matelas)', maxQty: 10, ownerUserId: 'mangorema_official', ownerName: 'EquipOutdoor Gabon' },
    { id: 'rent-6', kind: 'rental', unitPrice: 9500, depositUnitAmount: 60000, title: 'Kit Photo & Caméra Action 4K Étanche', maxQty: 10, ownerUserId: 'mangorema_official', ownerName: 'Gabon Lens Outdoor' },
    // Store Products
    { id: 'prod-1', kind: 'product', unitPrice: 58000, title: 'Chaussures Trekking Latérite & Forêt', maxQty: 20, ownerUserId: 'mangorema_official', ownerName: 'Boutique MANGOREMA' },
    { id: 'prod-2', kind: 'product', unitPrice: 29500, title: 'Lampe Frontale Étanche 800 Lumens', maxQty: 20, ownerUserId: 'mangorema_official', ownerName: 'Boutique MANGOREMA' },
    { id: 'prod-3', kind: 'product', unitPrice: 42000, title: 'Veste Imperméable Respirante 15 000mm', maxQty: 20, ownerUserId: 'mangorema_official', ownerName: 'Boutique MANGOREMA' },
    { id: 'prod-4', kind: 'product', unitPrice: 34000, title: 'Réchaud Bivouac Pliable + Popote Titane', maxQty: 20, ownerUserId: 'mangorema_official', ownerName: 'Boutique MANGOREMA' },
    { id: 'prod-5', kind: 'product', unitPrice: 89000, title: 'Jumelles Observation Faune 10x42 HD', maxQty: 20, ownerUserId: 'mangorema_official', ownerName: 'Boutique MANGOREMA' },
    { id: 'prod-6', kind: 'product', unitPrice: 26500, title: 'Powerbank Solaire 20 000 mAh IP67', maxQty: 20, ownerUserId: 'mangorema_official', ownerName: 'Boutique MANGOREMA' },
    { id: 'prod-7', kind: 'product', unitPrice: 12500, title: 'Gourde Isotherme Gravée MANGOREMA 1L', maxQty: 30, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Officiel' },
    { id: 'prod-8', kind: 'product', unitPrice: 15000, title: 'T-Shirt Technique Éco-Fibre MANGOREMA', maxQty: 30, ownerUserId: 'mangorema_official', ownerName: 'MANGOREMA Officiel' },
    { id: 'prod-9', kind: 'product', unitPrice: 38500, title: 'Bâtons de Randonnée Carbone Télescopiques', maxQty: 20, ownerUserId: 'mangorema_official', ownerName: 'Boutique MANGOREMA' },
  ];

  const AUTHORITATIVE_CATALOG = new Map<string, ServerCatalogEntry>(
    SEEDED_ENTRIES.map((e) => [e.id, e]),
  );
  const SEEDED_CATALOG_IDS = new Set(SEEDED_ENTRIES.map((e) => e.id));

  interface ServerPaymentRecord {
    orderId: string;
    refNumber: string;
    idempotencyKey: string;
    userId: string;
    itemsSubtotal: number;
    deliveryFee: number;
    depositTotal: number;
    platformCommission: number;
    vendorNetAmount: number;
    grandTotalCharged: number;
    paymentMethod: 'AIRTEL' | 'MOOV' | 'GHETTOPAY' | 'CARD';
    paymentStatus: 'CONFIRMED' | 'PENDING' | 'FAILED' | 'REFUNDED';
    fulfillmentStatus: FulfillmentStatus;
    payerLabel: string;
    deliveryZoneId?: string;
    deliveryZoneLabel?: string;
    deliveryAddress?: string;
    ussdPushRef?: string;
    ussdDialCode?: string;
    vendorSplits?: MarketplaceVendorSplit[];
    receiptHash: string;
    timestamp: string;
    refundReason?: string;
    refundedAtLabel?: string;
  }

  interface PersistedMarketplaceDisk {
    vendorCatalog: ServerCatalogEntry[];
    stockRemaining: Record<string, number>;
    idempotency: Array<[string, ServerPaymentRecord]>;
    ledger: Array<[string, ServerPaymentRecord]>;
    vendorFulfillments: VendorOrderFulfillment[];
  }

  const stockRemaining = new Map<string, number>();
  const idempotencyCache = new Map<string, ServerPaymentRecord>();
  const ledgerByOrderId = new Map<string, ServerPaymentRecord>();
  const vendorFulfillments: VendorOrderFulfillment[] = [];

  function loadPersistedMarketplace(): void {
    try {
      if (!fs.existsSync(MARKETPLACE_STORE_FILE)) return;
      const raw = fs.readFileSync(MARKETPLACE_STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<PersistedMarketplaceDisk>;

      if (Array.isArray(parsed.vendorCatalog)) {
        for (const entry of parsed.vendorCatalog) {
          if (entry && typeof entry.id === 'string' && !SEEDED_CATALOG_IDS.has(entry.id)) {
            AUTHORITATIVE_CATALOG.set(entry.id, entry);
          }
        }
      }
      if (parsed.stockRemaining && typeof parsed.stockRemaining === 'object') {
        for (const [k, v] of Object.entries(parsed.stockRemaining)) {
          if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
            stockRemaining.set(k, Math.floor(v));
          }
        }
      }
      if (Array.isArray(parsed.idempotency)) {
        for (const [k, v] of parsed.idempotency.slice(-2000)) {
          if (typeof k === 'string' && v && typeof v.orderId === 'string') {
            idempotencyCache.set(k, v);
          }
        }
      }
      if (Array.isArray(parsed.ledger)) {
        for (const [k, v] of parsed.ledger.slice(-2000)) {
          if (typeof k === 'string' && v && typeof v.orderId === 'string') {
            ledgerByOrderId.set(k, v);
          }
        }
      }
      if (Array.isArray(parsed.vendorFulfillments)) {
        for (const vf of parsed.vendorFulfillments.slice(-2000)) {
          if (vf && typeof vf.orderId === 'string' && typeof vf.vendorUserId === 'string') {
            vendorFulfillments.push(vf);
          }
        }
      }
    } catch (err) {
      console.warn('[marketplace-store] Impossible de relire le stockage local, réinitialisation propre:', err);
    }
  }

  function persistMarketplaceToDisk(): void {
    try {
      fs.mkdirSync(MARKETPLACE_STORE_DIR, { recursive: true });
      const vendorCatalogEntries = Array.from(AUTHORITATIVE_CATALOG.values()).filter(
        (entry) => !SEEDED_CATALOG_IDS.has(entry.id),
      );
      const snapshot: PersistedMarketplaceDisk = {
        vendorCatalog: vendorCatalogEntries.slice(-1500),
        stockRemaining: Object.fromEntries(stockRemaining.entries()),
        idempotency: Array.from(idempotencyCache.entries()).slice(-2000),
        ledger: Array.from(ledgerByOrderId.entries()).slice(-2000),
        vendorFulfillments: vendorFulfillments.slice(-2000),
      };
      const tmpFile = path.resolve(MARKETPLACE_STORE_DIR, 'marketplace-store.tmp.json');
      fs.writeFileSync(tmpFile, JSON.stringify(snapshot), 'utf8');
      fs.renameSync(tmpFile, MARKETPLACE_STORE_FILE);
    } catch (err) {
      console.error('[marketplace-store] Erreur de sauvegarde disque:', err);
    }
  }

  loadPersistedMarketplace();

  function getAvailableStock(entry: ServerCatalogEntry): number {
    if (stockRemaining.has(entry.id)) {
      return Math.max(0, stockRemaining.get(entry.id)!);
    }
    return entry.maxQty;
  }

  function decrementStockForItems(items: CheckoutItemPayload[]): void {
    for (const item of items) {
      const entry = AUTHORITATIVE_CATALOG.get(item.refId);
      if (!entry) continue;
      const cur = getAvailableStock(entry);
      const qty = Math.max(1, Math.floor(Number(item.quantity)));
      stockRemaining.set(entry.id, Math.max(0, cur - qty));
    }
  }

  function restoreStockForItems(items: CheckoutItemPayload[]): void {
    for (const item of items) {
      const entry = AUTHORITATIVE_CATALOG.get(item.refId);
      if (!entry) continue;
      const cur = getAvailableStock(entry);
      const qty = Math.max(1, Math.floor(Number(item.quantity)));
      stockRemaining.set(entry.id, Math.min(entry.maxQty, cur + qty));
    }
  }

  interface CheckoutItemPayload {
    refId: string;
    kind: 'activity' | 'rental' | 'product' | 'shuttle';
    quantity: number;
    rentalDays?: number;
    fulfillmentMode?: 'IN_PERSON' | 'PICKUP' | 'DELIVERY';
    meta?: {
      shuttleIncluded?: boolean;
      tentIncluded?: boolean;
      guideIncluded?: boolean;
      mealPackIncluded?: boolean;
    };
  }

  interface ComputedLineSplit {
    entry: ServerCatalogEntry;
    item: CheckoutItemPayload;
    qty: number;
    lineSubtotal: number;
    lineDeposit: number;
  }

  function calculateAuthoritativeTotals(
    items: CheckoutItemPayload[],
    enforceStock = true,
  ):
    | {
        ok: true;
        itemsSubtotal: number;
        depositTotal: number;
        requiresDelivery: boolean;
        storeDeliveryFees: number[];
        lines: ComputedLineSplit[];
        vendorSplits: MarketplaceVendorSplit[];
      }
    | {
        ok: false;
        error: string;
      } {
    let itemsSubtotal = 0;
    let depositTotal = 0;
    let requiresDelivery = false;
    const storeDeliveryFees: number[] = [];
    const lines: ComputedLineSplit[] = [];

    for (const item of items) {
      if (!item || typeof item.refId !== 'string') {
        return { ok: false, error: 'Article invalide dans le panier.' };
      }
      const catalogEntry = AUTHORITATIVE_CATALOG.get(item.refId);
      if (!catalogEntry) {
        return {
          ok: false,
          error: `Article introuvable dans le catalogue vérifié (${sanitizePlainText(item.refId, 64)}). Veuillez actualiser votre panier.`,
        };
      }

      const qty = Math.floor(Number(item.quantity));
      const remaining = getAvailableStock(catalogEntry);
      if (!Number.isFinite(qty) || qty < 1 || qty > catalogEntry.maxQty) {
        return {
          ok: false,
          error: `Quantité demandée invalide pour "${catalogEntry.title}".`,
        };
      }
      if (enforceStock && qty > remaining) {
        return {
          ok: false,
          error:
            remaining === 0
              ? `Stock épuisé pour "${catalogEntry.title}".`
              : `Plus que ${remaining} unité(s) disponible(s) pour "${catalogEntry.title}".`,
        };
      }

      if (item.fulfillmentMode === 'DELIVERY') {
        requiresDelivery = true;
        if (
          typeof catalogEntry.storeDeliveryFee === 'number' &&
          Number.isFinite(catalogEntry.storeDeliveryFee)
        ) {
          storeDeliveryFees.push(catalogEntry.storeDeliveryFee);
        }
      }

      let lineSubtotal = 0;
      let lineDeposit = 0;

      if (catalogEntry.kind === 'rental') {
        const days = Math.min(30, Math.max(1, Math.floor(Number(item.rentalDays || 1))));
        lineSubtotal = catalogEntry.unitPrice * days * qty;
        lineDeposit = (catalogEntry.depositUnitAmount || 0) * qty;
      } else if (catalogEntry.kind === 'activity') {
        let addons = 0;
        if (item.meta?.shuttleIncluded) addons += 5000;
        if (item.meta?.tentIncluded) addons += 3000;
        if (item.meta?.guideIncluded) addons += 2500;
        if (item.meta?.mealPackIncluded) addons += 4000;
        lineSubtotal = (catalogEntry.unitPrice + addons) * qty;
      } else {
        lineSubtotal = catalogEntry.unitPrice * qty;
      }

      itemsSubtotal += lineSubtotal;
      depositTotal += lineDeposit;
      lines.push({ entry: catalogEntry, item, qty, lineSubtotal, lineDeposit });
    }

    // Group revenue splits cleanly per vendor/owner
    const splitMap = new Map<string, MarketplaceVendorSplit>();
    for (const line of lines) {
      const vId = line.entry.ownerUserId || 'mangorema_official';
      const vName = line.entry.storeName || line.entry.ownerName || 'MANGOREMA Partenaire';
      const existing = splitMap.get(vId);
      const commission = Math.round(line.lineSubtotal * 0.1);
      const net = Math.max(0, line.lineSubtotal - commission);
      if (existing) {
        existing.grossSubtotal += line.lineSubtotal;
        existing.commissionAmount += commission;
        existing.netAmount += net;
        existing.depositHeld += line.lineDeposit;
        if (!existing.itemTitles.includes(line.entry.title)) {
          existing.itemTitles.push(line.entry.title);
        }
      } else {
        splitMap.set(vId, {
          vendorUserId: vId,
          vendorName: vName,
          grossSubtotal: line.lineSubtotal,
          commissionAmount: commission,
          netAmount: net,
          depositHeld: line.lineDeposit,
          itemTitles: [line.entry.title],
        });
      }
    }

    return {
      ok: true,
      itemsSubtotal,
      depositTotal,
      requiresDelivery,
      storeDeliveryFees,
      lines,
      vendorSplits: Array.from(splitMap.values()),
    };
  }

  function initiatePaymentGatewayAdapter(params: {
    method: 'AIRTEL' | 'MOOV' | 'GHETTOPAY' | 'CARD';
    payerPhone?: string;
    ussdPin?: string;
    paymentFlow?: string;
    simulateMode?: string;
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
  }):
    | {
        ok: true;
        payerLabel: string;
        outcome: 'CONFIRMED' | 'PENDING';
        ussdPushRef?: string;
        ussdDialCode?: string;
      }
    | { ok: false; statusCode: number; error: string } {
    const { method } = params;

    if (method === 'AIRTEL' || method === 'MOOV' || method === 'GHETTOPAY') {
      const cleanWalletId = (params.payerPhone || '').trim().replace(/\s+/g, '');
      const cleanPin = (params.ussdPin || '').trim();
      const isUssdPush = params.paymentFlow === 'USSD_PUSH' || cleanPin.length === 0;

      if (method === 'GHETTOPAY') {
        if (cleanWalletId.length < 4 || cleanWalletId.length > 32) {
          return {
            ok: false,
            statusCode: 400,
            error: 'Numéro mobile ou identifiant GhettoPay invalide (ex: +241 74 12 34 56 ou @nom).',
          };
        }
      } else if (cleanWalletId.length < 8 || cleanWalletId.length > 16) {
        return {
          ok: false,
          statusCode: 400,
          error: 'Numéro Mobile Money gabonais invalide (ex: 074 12 34 56).',
        };
      }

      if (!isUssdPush && !/^\d{4}$/.test(cleanPin)) {
        return {
          ok: false,
          statusCode: 400,
          error: `Code secret ${method} à 4 chiffres invalide.`,
        };
      }

      const masked =
        cleanWalletId.length > 5
          ? `${cleanWalletId.slice(0, 3)}•••${cleanWalletId.slice(-2)}`
          : cleanWalletId;
      const payerLabel = method === 'GHETTOPAY' ? `GhettoPay ${masked}` : `${method} ${masked}`;
      const ussdDialCode =
        method === 'AIRTEL' ? '*150#' : method === 'MOOV' ? '*555#' : 'ghettopay.com';
      const ussdPushRef = `PUSH-${method}-${crypto.randomInt(100000, 999999)}`;

      if (cleanPin === '0000' || params.simulateMode === 'FAILED') {
        return {
          ok: false,
          statusCode: 402,
          error: `Débit ${method} refusé par l’opérateur (solde insuffisant ou annulation push).`,
        };
      }

      if (cleanPin === '1111' || params.simulateMode === 'PENDING_USSD') {
        return {
          ok: true,
          payerLabel,
          outcome: 'PENDING',
          ussdPushRef,
          ussdDialCode,
        };
      }

      return {
        ok: true,
        payerLabel,
        outcome: 'CONFIRMED',
        ussdPushRef,
        ussdDialCode,
      };
    }

    // Card gateway branch
    const digits = (params.cardNumber || '').replace(/\D/g, '');
    const expiry = (params.cardExpiry || '').trim();
    const cvv = (params.cardCvv || '').trim();
    if (digits.length < 13 || digits.length > 19) {
      return { ok: false, statusCode: 400, error: 'Numéro de carte bancaire invalide (13 à 19 chiffres requis).' };
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return { ok: false, statusCode: 400, error: 'Date d’expiration invalide (format MM/AA requis).' };
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      return { ok: false, statusCode: 400, error: 'Code CVV de sécurité invalide.' };
    }
    const last4 = digits.slice(-4);
    if (last4 === '0002') {
      return {
        ok: false,
        statusCode: 402,
        error: 'Paiement par carte refusé par la banque émettrice (carte test 0002).',
      };
    }
    return {
      ok: true,
      payerLabel: `CB •••• ${last4}`,
      outcome: 'CONFIRMED',
    };
  }

  // Public real-time stock feed (zero PII)
  app.get('/api/marketplace/stock', (_req: Request, res: Response) => {
    const stock: Record<string, number> = {};
    for (const entry of AUTHORITATIVE_CATALOG.values()) {
      stock[entry.id] = getAvailableStock(entry);
    }
    res.json({ stock, updatedAt: Date.now() });
  });

  // Sync vendor-published listing price safely on durable server registry (authenticated & owner-checked)
  app.post('/api/payments/register-listing', async (req: Request, res: Response) => {
    const authResult = await verifyRequestAuth(req);
    if (authResult.status !== 'ok') {
      res.status(401).json({ error: 'Authentification requise pour enregistrer une offre prestataire.' });
      return;
    }
    if (!authResult.user.emailVerified) {
      res.status(403).json({ error: 'Adresse e-mail vérifiée requise pour publier une offre.' });
      return;
    }

    const body = req.body as {
      id?: unknown;
      listingKind?: unknown;
      title?: unknown;
      price?: unknown;
      depositAmount?: unknown;
      stockOrCapacity?: unknown;
      ownerName?: unknown;
      storeId?: unknown;
      storeName?: unknown;
      deliveryAvailable?: unknown;
      storeDeliveryFee?: unknown;
    };

    const listingId = typeof body?.id === 'string' ? body.id.trim() : '';
    if (
      !VALID_ID_RE.test(listingId) ||
      typeof body.price !== 'number' ||
      !Number.isFinite(body.price) ||
      body.price < 0 ||
      body.price > 10000000
    ) {
      res.status(400).json({ error: 'Paramètres de fiche prestataire invalides.' });
      return;
    }

    if (SEEDED_CATALOG_IDS.has(listingId)) {
      res.status(403).json({ error: 'Modification des tarifs officiels du catalogue interdite.' });
      return;
    }

    const existingEntry = AUTHORITATIVE_CATALOG.get(listingId);
    if (
      existingEntry?.ownerUserId &&
      existingEntry.ownerUserId !== authResult.user.uid &&
      !isAdminUser(authResult.user)
    ) {
      res.status(403).json({ error: 'Vous n’êtes pas autorisé à modifier cette offre partenaire.' });
      return;
    }

    const kind =
      body.listingKind === 'rental'
        ? 'rental'
        : body.listingKind === 'activity'
        ? 'activity'
        : 'product';

    const maxQty = Math.min(200, Math.max(0, Math.round(Number(body.stockOrCapacity ?? 10))));
    const storeFee =
      typeof body.storeDeliveryFee === 'number' &&
      Number.isFinite(body.storeDeliveryFee) &&
      body.storeDeliveryFee >= 0 &&
      body.storeDeliveryFee <= 100000
        ? Math.round(body.storeDeliveryFee)
        : existingEntry?.storeDeliveryFee;

    const updatedEntry: ServerCatalogEntry = {
      id: listingId,
      kind,
      unitPrice: Math.round(body.price),
      depositUnitAmount:
        kind === 'rental' &&
        typeof body.depositAmount === 'number' &&
        Number.isFinite(body.depositAmount) &&
        body.depositAmount > 0
          ? Math.min(5000000, Math.round(body.depositAmount))
          : 0,
      title: sanitizePlainText(body.title, 160, 'Article Partenaire'),
      maxQty: Math.max(1, maxQty),
      ownerUserId: existingEntry?.ownerUserId || authResult.user.uid,
      ownerName: sanitizePlainText(body.ownerName, 80, existingEntry?.ownerName || 'Partenaire MANGOREMA'),
      storeId:
        typeof body.storeId === 'string' && SHORT_ID_RE.test(body.storeId.trim())
          ? body.storeId.trim()
          : existingEntry?.storeId,
      storeName: sanitizePlainText(body.storeName, 100, existingEntry?.storeName || ''),
      deliveryAvailable:
        typeof body.deliveryAvailable === 'boolean'
          ? body.deliveryAvailable
          : existingEntry?.deliveryAvailable ?? true,
      storeDeliveryFee: storeFee,
    };

    AUTHORITATIVE_CATALOG.set(listingId, updatedEntry);
    stockRemaining.set(listingId, maxQty);
    persistMarketplaceToDisk();

    res.json({ ok: true, id: listingId, remainingStock: maxQty });
  });

  app.post('/api/payments/checkout', async (req: Request, res: Response) => {
    try {
      const authResult = await verifyRequestAuth(req);
      if (authResult.status === 'invalid') {
        res.status(401).json({ error: 'Jeton d’authentification invalide ou expiré.' });
        return;
      }
      if (authResult.status === 'ok' && !authResult.user.emailVerified) {
        res.status(403).json({ error: 'Adresse e-mail vérifiée requise pour valider ce paiement.' });
        return;
      }

      const effectiveUserId = authResult.status === 'ok' ? authResult.user.uid : 'guest';

      const body = req.body as {
        idempotencyKey?: string;
        paymentMethod?: 'AIRTEL' | 'MOOV' | 'GHETTOPAY' | 'CARD';
        paymentFlow?: string;
        simulateMode?: string;
        payerPhone?: string;
        ussdPin?: string;
        cardNumber?: string;
        cardExpiry?: string;
        cardCvv?: string;
        deliveryZoneId?: string;
        deliveryAddress?: string;
        items?: CheckoutItemPayload[];
      };

      const idemKey = typeof body?.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '';
      if (!idemKey || idemKey.length < 8 || idemKey.length > 128) {
        res.status(400).json({ error: 'Clé d’idempotence transactionnelle manquante.' });
        return;
      }

      const scopedIdemKey = `${effectiveUserId}:${idemKey}`;
      const existingRecord = idempotencyCache.get(scopedIdemKey);
      if (existingRecord) {
        res.json({
          deduplicated: true,
          record: existingRecord,
          stock: Object.fromEntries(
            Array.from(AUTHORITATIVE_CATALOG.values()).map((e) => [e.id, getAvailableStock(e)]),
          ),
          ...(effectiveUserId === 'guest'
            ? { orderControlToken: computeGuestOrderControlToken(existingRecord.orderId) }
            : {}),
        });
        return;
      }

      if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 30) {
        res.status(400).json({ error: 'Le panier unifié est vide ou dépasse la limite autorisée.' });
        return;
      }

      const method = body.paymentMethod;
      if (method !== 'AIRTEL' && method !== 'MOOV' && method !== 'GHETTOPAY' && method !== 'CARD') {
        res.status(400).json({ error: 'Mode de paiement non supporté.' });
        return;
      }

      const totalsResult = calculateAuthoritativeTotals(body.items, true);
      if (totalsResult.ok === false) {
        res.status(400).json({ error: totalsResult.error });
        return;
      }

      const {
        itemsSubtotal,
        depositTotal,
        requiresDelivery,
        storeDeliveryFees,
        lines,
        vendorSplits,
      } = totalsResult;

      const selectedZone = resolveDeliveryZone(
        typeof body.deliveryZoneId === 'string' ? body.deliveryZoneId : undefined,
      );
      const deliveryFee = computeMarketplaceDeliveryFee({
        requiresDelivery,
        deliveryZoneId: selectedZone.id,
        storeDeliveryFees,
      });

      const cleanDeliveryAddr = sanitizePlainText(body.deliveryAddress, 200);
      if (requiresDelivery && cleanDeliveryAddr.length < 4) {
        res.status(400).json({
          error: 'Veuillez indiquer votre quartier / point de repère pour la livraison.',
        });
        return;
      }

      const gatewayResult = initiatePaymentGatewayAdapter({
        method,
        payerPhone: body.payerPhone,
        ussdPin: body.ussdPin,
        paymentFlow: body.paymentFlow,
        simulateMode: body.simulateMode,
        cardNumber: body.cardNumber,
        cardExpiry: body.cardExpiry,
        cardCvv: body.cardCvv,
      });

      if (gatewayResult.ok === false) {
        res.status(gatewayResult.statusCode).json({
          error: gatewayResult.error,
          paymentStatus: 'FAILED',
        });
        return;
      }

      const grandTotalCharged = itemsSubtotal + deliveryFee;
      const platformCommission = Math.round(itemsSubtotal * 0.1);
      const vendorNetAmount = Math.max(0, itemsSubtotal - platformCommission);

      const now = Date.now();
      const orderId = `ord-${now}-${crypto.randomInt(100, 1000)}`;
      const refNumber = `MANG-${method}-${crypto.randomInt(100000, 1000000)}`;
      const receiptHash = signReceiptHash(orderId, refNumber, grandTotalCharged, idemKey);
      const timestamp = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const record: ServerPaymentRecord = {
        orderId,
        refNumber,
        idempotencyKey: idemKey,
        userId: effectiveUserId,
        itemsSubtotal,
        deliveryFee,
        depositTotal,
        platformCommission,
        vendorNetAmount,
        grandTotalCharged,
        paymentMethod: method,
        paymentStatus: gatewayResult.outcome,
        fulfillmentStatus: gatewayResult.outcome === 'PENDING' ? 'PENDING_VENDOR' : 'CONFIRMED',
        payerLabel: gatewayResult.payerLabel,
        deliveryZoneId: requiresDelivery ? selectedZone.id : undefined,
        deliveryZoneLabel: requiresDelivery ? selectedZone.shortLabel : undefined,
        deliveryAddress: requiresDelivery ? cleanDeliveryAddr : undefined,
        ussdPushRef: gatewayResult.ussdPushRef,
        ussdDialCode: gatewayResult.ussdDialCode,
        vendorSplits,
        receiptHash,
        timestamp,
      };

      // Reserve/decrement stock atomically upon validated payment initiation
      decrementStockForItems(body.items);

      idempotencyCache.set(scopedIdemKey, record);
      ledgerByOrderId.set(orderId, record);

      // Route non-PII vendor fulfillment splits to each partner's queue
      for (const split of vendorSplits) {
        const vendorLines = lines.filter(
          (l) => (l.entry.ownerUserId || 'mangorema_official') === split.vendorUserId,
        );
        vendorFulfillments.unshift({
          orderId,
          refNumber,
          vendorUserId: split.vendorUserId,
          vendorName: split.vendorName,
          buyerDisplayLabel: gatewayResult.payerLabel,
          deliveryZoneLabel: requiresDelivery ? selectedZone.shortLabel : undefined,
          deliveryAddress: requiresDelivery ? cleanDeliveryAddr : undefined,
          items: vendorLines.map((vl) => ({
            refId: vl.entry.id,
            kind: vl.entry.kind,
            title: vl.entry.title,
            quantity: vl.qty,
            rentalDays: vl.item.rentalDays,
            fulfillmentMode: vl.item.fulfillmentMode || 'IN_PERSON',
            lineTotal: vl.lineSubtotal,
            depositHeld: vl.lineDeposit,
          })),
          grossSubtotal: split.grossSubtotal,
          commissionAmount: split.commissionAmount,
          netAmount: split.netAmount,
          depositHeld: split.depositHeld,
          paymentMethod: method,
          paymentStatus: record.paymentStatus,
          fulfillmentStatus: record.fulfillmentStatus,
          timestamp,
          receiptHash,
        });
      }

      persistMarketplaceToDisk();

      const updatedStock: Record<string, number> = {};
      for (const entry of AUTHORITATIVE_CATALOG.values()) {
        updatedStock[entry.id] = getAvailableStock(entry);
      }

      res.json({
        deduplicated: false,
        record,
        stock: updatedStock,
        ...(effectiveUserId === 'guest'
          ? { orderControlToken: computeGuestOrderControlToken(orderId) }
          : {}),
      });
    } catch (err: unknown) {
      console.error('[/api/payments/checkout] Error:', err);
      res.status(500).json({ error: 'Erreur serveur lors de la vérification du paiement.' });
    }
  });

  app.post('/api/payments/confirm-pending', async (req: Request, res: Response) => {
    const authResult = await verifyRequestAuth(req);
    if (authResult.status === 'invalid') {
      res.status(401).json({ error: 'Jeton d’authentification invalide ou expiré.' });
      return;
    }

    const { orderId, orderControlToken } = req.body as {
      orderId?: unknown;
      orderControlToken?: unknown;
    };
    const cleanOrderId = typeof orderId === 'string' ? orderId.trim() : '';
    if (!VALID_ID_RE.test(cleanOrderId) || !ledgerByOrderId.has(cleanOrderId)) {
      res.status(404).json({ error: 'Transaction en attente introuvable.' });
      return;
    }
    const record = ledgerByOrderId.get(cleanOrderId)!;

    if (record.userId === 'guest') {
      const adminAuthorized = authResult.status === 'ok' && isAdminUser(authResult.user);
      const tokenAuthorized = verifyGuestOrderControlToken(cleanOrderId, orderControlToken);
      if (!adminAuthorized && !tokenAuthorized) {
        res.status(403).json({ error: 'Jeton de contrôle requis pour confirmer cette commande.' });
        return;
      }
    } else {
      if (authResult.status !== 'ok') {
        res.status(401).json({ error: 'Authentification requise pour confirmer cette transaction.' });
        return;
      }
      if (
        !authResult.user.emailVerified ||
        (record.userId !== authResult.user.uid && !isAdminUser(authResult.user))
      ) {
        res.status(403).json({ error: 'Vous n’êtes pas autorisé à confirmer cette commande.' });
        return;
      }
    }

    if (record.paymentStatus === 'REFUNDED') {
      res.status(409).json({ error: 'Cette commande a déjà été remboursée.' });
      return;
    }
    record.paymentStatus = 'CONFIRMED';
    record.fulfillmentStatus = 'CONFIRMED';

    for (const vf of vendorFulfillments) {
      if (vf.orderId === cleanOrderId) {
        vf.paymentStatus = 'CONFIRMED';
        vf.fulfillmentStatus = 'CONFIRMED';
      }
    }
    persistMarketplaceToDisk();
    res.json({ ok: true, record });
  });

  // HMAC-verified Mobile Money / GhettoPay provider webhook callback endpoint
  app.post('/api/payments/webhook/:provider', (req: Request, res: Response) => {
    if (!PAYMENT_WEBHOOK_SECRET) {
      res.status(503).json({
        error: 'Webhook paiement non activé (PAYMENT_WEBHOOK_SECRET absent côté serveur).',
      });
      return;
    }
    const sigHeader = req.headers['x-mangorema-signature'];
    const signature = typeof sigHeader === 'string' ? sigHeader.trim() : '';
    const rawPayload = JSON.stringify(req.body || {});
    const expectedSig = crypto
      .createHmac('sha256', PAYMENT_WEBHOOK_SECRET)
      .update(rawPayload)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      res.status(401).json({ error: 'Signature webhook invalide.' });
      return;
    }

    const { orderId, status } = req.body as { orderId?: unknown; status?: unknown };
    const cleanOrderId = typeof orderId === 'string' ? orderId.trim() : '';
    if (!VALID_ID_RE.test(cleanOrderId) || !ledgerByOrderId.has(cleanOrderId)) {
      res.status(404).json({ error: 'Commande webhook introuvable.' });
      return;
    }
    const record = ledgerByOrderId.get(cleanOrderId)!;
    if (status === 'CONFIRMED') {
      record.paymentStatus = 'CONFIRMED';
      if (record.fulfillmentStatus === 'PENDING_VENDOR') {
        record.fulfillmentStatus = 'CONFIRMED';
      }
    } else if (status === 'FAILED' || status === 'REFUNDED') {
      record.paymentStatus = status;
      record.fulfillmentStatus = status === 'REFUNDED' ? 'REFUNDED' : 'CANCELLED';
    } else {
      res.status(400).json({ error: 'Statut webhook non reconnu.' });
      return;
    }

    for (const vf of vendorFulfillments) {
      if (vf.orderId === cleanOrderId) {
        vf.paymentStatus = record.paymentStatus;
        vf.fulfillmentStatus = record.fulfillmentStatus;
      }
    }
    persistMarketplaceToDisk();
    res.json({ ok: true, orderId: cleanOrderId, paymentStatus: record.paymentStatus });
  });

  app.post('/api/payments/refund', async (req: Request, res: Response) => {
    const authResult = await verifyRequestAuth(req);
    if (authResult.status === 'invalid') {
      res.status(401).json({ error: 'Jeton d’authentification invalide ou expiré.' });
      return;
    }

    const { orderId, reason, orderControlToken, items } = req.body as {
      orderId?: unknown;
      reason?: unknown;
      orderControlToken?: unknown;
      items?: CheckoutItemPayload[];
    };
    const cleanOrderId = typeof orderId === 'string' ? orderId.trim() : '';
    if (!VALID_ID_RE.test(cleanOrderId)) {
      res.status(400).json({ error: 'Identifiant de commande invalide pour le remboursement.' });
      return;
    }

    const existing = ledgerByOrderId.get(cleanOrderId);
    if (existing && existing.paymentStatus === 'REFUNDED') {
      res.status(409).json({ error: 'Remboursement déjà effectué pour cette commande.' });
      return;
    }

    const cleanReason = sanitizePlainText(reason, 200, 'Annulation / retour matériel validé');
    const refundedAtLabel = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (existing) {
      const vendorAuthorized =
        authResult.status === 'ok' &&
        authResult.user.emailVerified &&
        vendorFulfillments.some(
          (vf) => vf.orderId === cleanOrderId && vf.vendorUserId === authResult.user.uid,
        );

      if (existing.userId === 'guest') {
        const adminAuthorized = authResult.status === 'ok' && isAdminUser(authResult.user);
        const tokenAuthorized = verifyGuestOrderControlToken(cleanOrderId, orderControlToken);
        if (!adminAuthorized && !vendorAuthorized && !tokenAuthorized) {
          res.status(403).json({ error: 'Jeton de contrôle requis pour rembourser cette commande.' });
          return;
        }
      } else {
        if (authResult.status !== 'ok') {
          res.status(401).json({ error: 'Authentification requise pour effectuer un remboursement.' });
          return;
        }
        if (
          !authResult.user.emailVerified ||
          (existing.userId !== authResult.user.uid &&
            !vendorAuthorized &&
            !isAdminUser(authResult.user))
        ) {
          res.status(403).json({ error: 'Vous n’êtes pas autorisé à rembourser cette commande.' });
          return;
        }
      }

      existing.paymentStatus = 'REFUNDED';
      existing.fulfillmentStatus = 'REFUNDED';
      existing.refundReason = cleanReason;
      existing.refundedAtLabel = refundedAtLabel;

      for (const vf of vendorFulfillments) {
        if (vf.orderId === cleanOrderId) {
          vf.paymentStatus = 'REFUNDED';
          vf.fulfillmentStatus = 'REFUNDED';
          vf.refundReason = cleanReason;
          vf.refundedAtLabel = refundedAtLabel;
          restoreStockForItems(
            vf.items.map((it) => ({
              refId: it.refId,
              kind: it.kind,
              quantity: it.quantity,
            })),
          );
        }
      }
      if (Array.isArray(items) && items.length > 0 && !vendorFulfillments.some((vf) => vf.orderId === cleanOrderId)) {
        restoreStockForItems(items);
      }

      persistMarketplaceToDisk();

      res.json({
        ok: true,
        orderId: cleanOrderId,
        paymentStatus: 'REFUNDED',
        fulfillmentStatus: 'REFUNDED',
        refundRef: `RMB-${crypto.randomInt(100000, 1000000)}`,
        refundedAmount: existing.grandTotalCharged,
        refundedDeposit: existing.depositTotal,
        refundedAtLabel,
      });
      return;
    }

    if (authResult.status !== 'ok') {
      res.status(401).json({ error: 'Authentification requise pour rembourser une commande archivée.' });
      return;
    }
    if (!authResult.user.emailVerified) {
      res.status(403).json({ error: 'Adresse e-mail vérifiée requise.' });
      return;
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
      res.status(404).json({ error: 'Commande introuvable ou détails articles requis pour vérification.' });
      return;
    }

    const totalsResult = calculateAuthoritativeTotals(items, false);
    if (totalsResult.ok === false) {
      res.status(400).json({ error: totalsResult.error });
      return;
    }

    const archivedDeliveryFee = computeMarketplaceDeliveryFee({
      requiresDelivery: totalsResult.requiresDelivery,
      storeDeliveryFees: totalsResult.storeDeliveryFees,
    });
    const recomputedGrandTotal = totalsResult.itemsSubtotal + archivedDeliveryFee;
    const refundRef = `RMB-${crypto.randomInt(100000, 1000000)}`;

    ledgerByOrderId.set(cleanOrderId, {
      orderId: cleanOrderId,
      refNumber: cleanOrderId,
      idempotencyKey: `refund-${cleanOrderId}`,
      userId: authResult.user.uid,
      itemsSubtotal: totalsResult.itemsSubtotal,
      deliveryFee: archivedDeliveryFee,
      depositTotal: totalsResult.depositTotal,
      platformCommission: Math.round(totalsResult.itemsSubtotal * 0.1),
      vendorNetAmount: Math.max(0, totalsResult.itemsSubtotal - Math.round(totalsResult.itemsSubtotal * 0.1)),
      grandTotalCharged: recomputedGrandTotal,
      paymentMethod: 'AIRTEL',
      paymentStatus: 'REFUNDED',
      fulfillmentStatus: 'REFUNDED',
      payerLabel: 'Vérifié',
      receiptHash: signReceiptHash(cleanOrderId, cleanOrderId, recomputedGrandTotal, `refund-${cleanOrderId}`),
      timestamp: refundedAtLabel,
      refundReason: cleanReason,
      refundedAtLabel,
    });
    persistMarketplaceToDisk();

    res.json({
      ok: true,
      orderId: cleanOrderId,
      paymentStatus: 'REFUNDED',
      fulfillmentStatus: 'REFUNDED',
      refundRef,
      refundedAmount: recomputedGrandTotal,
      refundedDeposit: totalsResult.depositTotal,
      refundedAtLabel,
    });
  });

  // Cross-User Authenticated Vendor Fulfillment Queue (Scoped strictly by vendor ownership)
  app.get('/api/vendor/orders', async (req: Request, res: Response) => {
    const authResult = await verifyRequestAuth(req);
    if (authResult.status !== 'ok') {
      res.status(401).json({ error: 'Authentification requise pour consulter les commandes partenaire.' });
      return;
    }
    if (!authResult.user.emailVerified) {
      res.status(403).json({ error: 'Adresse e-mail vérifiée requise.' });
      return;
    }
    const admin = isAdminUser(authResult.user);
    const uid = authResult.user.uid;
    const scopedOrders = vendorFulfillments.filter(
      (vf) => vf.vendorUserId === uid || (admin && vf.vendorUserId === 'mangorema_official'),
    );
    res.json({ orders: scopedOrders });
  });

  const ALLOWED_VENDOR_STATUSES = new Set<FulfillmentStatus>([
    'CONFIRMED',
    'PREPARING',
    'READY_PICKUP',
    'IN_DELIVERY',
    'COMPLETED',
  ]);

  app.post('/api/vendor/orders/:orderId/status', async (req: Request, res: Response) => {
    const authResult = await verifyRequestAuth(req);
    if (authResult.status !== 'ok') {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }
    if (!authResult.user.emailVerified) {
      res.status(403).json({ error: 'Adresse e-mail vérifiée requise.' });
      return;
    }

    const cleanOrderId = typeof req.params.orderId === 'string' ? req.params.orderId.trim() : '';
    const nextStatusRaw = (req.body as { fulfillmentStatus?: unknown })?.fulfillmentStatus;
    if (
      !VALID_ID_RE.test(cleanOrderId) ||
      typeof nextStatusRaw !== 'string' ||
      !ALLOWED_VENDOR_STATUSES.has(nextStatusRaw as FulfillmentStatus)
    ) {
      res.status(400).json({ error: 'Identifiant commande ou statut logistique invalide.' });
      return;
    }
    const nextStatus = nextStatusRaw as FulfillmentStatus;
    const admin = isAdminUser(authResult.user);
    const uid = authResult.user.uid;

    const matchingSplits = vendorFulfillments.filter(
      (vf) =>
        vf.orderId === cleanOrderId &&
        (vf.vendorUserId === uid || (admin && vf.vendorUserId === 'mangorema_official')),
    );
    if (matchingSplits.length === 0) {
      res.status(404).json({ error: 'Commande partenaire introuvable pour ce compte.' });
      return;
    }

    for (const vf of matchingSplits) {
      if (vf.paymentStatus === 'REFUNDED') {
        res.status(409).json({ error: 'Impossible de modifier une commande déjà remboursée.' });
        return;
      }
      vf.fulfillmentStatus = nextStatus;
    }

    const parentOrder = ledgerByOrderId.get(cleanOrderId);
    if (parentOrder && parentOrder.paymentStatus !== 'REFUNDED') {
      parentOrder.fulfillmentStatus = nextStatus;
    }

    persistMarketplaceToDisk();
    res.json({ ok: true, splits: matchingSplits });
  });

  // =========================================================================
  // HTTP Server + Vite Middleware (Dev) or Static Assets (Prod)
  // =========================================================================
  const httpServer = http.createServer(app);

  const isHmrDisabled = process.env.DISABLE_HMR === 'true';

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
        ...(isHmrDisabled ? { ws: false } : {}),
      },
      appType: 'spa',
    });

    if (isHmrDisabled) {
      app.get('/@vite/client', (_req: Request, res: Response) => {
        res.type('application/javascript');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(`
const sheetsMap = new Map();
const linkSheetsMap = new Map();
if (typeof document !== 'undefined') {
  document.querySelectorAll('style[data-vite-dev-id]').forEach((el) => {
    sheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
}
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id="' + CSS.escape(id) + '"]').forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (!url || (url[0] !== '.' && url[0] !== '/')) return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return pathname + '?' + queryToInject + (search ? '&' + search.slice(1) : '') + (hash || '');
}
export class ErrorOverlay extends (typeof HTMLElement !== 'undefined' ? HTMLElement : class {}) {}
`);
      });
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // =========================================================================
  // Real-Time Community WebSocket Server (/ws/community on same port 3000)
  // =========================================================================
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 16 * 1024,
  });

  httpServer.on('upgrade', (req, socket, head) => {
    try {
      const parsed = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      if (parsed.pathname === '/ws/community') {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      } else if (isHmrDisabled) {
        socket.destroy();
      }
    } catch {
      socket.destroy();
    }
  });
  const clients = new Map<WebSocket, ClientMeta>();

  const broadcastPresence = (roomId: string) => {
    const activeNames: string[] = [];
    const seenIds = new Set<string>();

    for (const meta of clients.values()) {
      if (meta.roomId === roomId) {
        const key = meta.userId || meta.clientId;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          activeNames.push(meta.displayName);
        }
      }
    }

    const payload = JSON.stringify({
      type: 'PRESENCE',
      roomId,
      onlineCount: seenIds.size,
      users: activeNames.slice(0, 12),
    });

    for (const [sock, meta] of clients.entries()) {
      if (sock.readyState === WebSocket.OPEN && meta.roomId === roomId) {
        sock.send(payload);
      }
    }
  };

  wss.on('connection', (ws) => {
    const meta: ClientMeta = {
      clientId: `ws-${Date.now()}-${crypto.randomInt(1000, 10000)}`,
      displayName: 'Explorateur',
      roomId: 'general',
      isAlive: true,
      windowStartMs: Date.now(),
      frameCount: 0,
    };
    clients.set(ws, meta);
    broadcastPresence('general');

    ws.on('pong', () => {
      meta.isAlive = true;
    });

    ws.on('message', (raw) => {
      try {
        const now = Date.now();
        if (now - meta.windowStartMs > 10_000) {
          meta.windowStartMs = now;
          meta.frameCount = 0;
        }
        meta.frameCount += 1;
        if (meta.frameCount > 25) {
          return;
        }

        const parsed = JSON.parse(raw.toString()) as {
          type?: unknown;
          roomId?: unknown;
          userId?: unknown;
          displayName?: unknown;
          message?: {
            id?: unknown;
            roomId?: unknown;
            userId?: unknown;
            authorName?: unknown;
            authorAvatar?: unknown;
            text?: unknown;
            createdAtLabel?: unknown;
            createdAtMs?: unknown;
          };
          activityTitle?: unknown;
        };

        if (parsed.type === 'JOIN_ROOM') {
          const prevRoom = meta.roomId;
          const nextRoom =
            typeof parsed.roomId === 'string' && VALID_ROOMS.has(parsed.roomId)
              ? parsed.roomId
              : 'general';
          meta.roomId = nextRoom;
          if (typeof parsed.userId === 'string' && SHORT_ID_RE.test(parsed.userId.trim())) {
            meta.userId = parsed.userId.trim();
          }
          const cleanName = sanitizePlainText(parsed.displayName, 80);
          if (cleanName) {
            meta.displayName = cleanName;
          }
          if (prevRoom !== nextRoom) {
            broadcastPresence(prevRoom);
          }
          broadcastPresence(nextRoom);
          return;
        }

        if (parsed.type === 'CHAT_MESSAGE' && parsed.message && typeof parsed.message === 'object') {
          const msg = parsed.message;
          const msgId = typeof msg.id === 'string' ? msg.id.trim() : '';
          const cleanText = sanitizePlainText(msg.text, 500);
          if (!SHORT_ID_RE.test(msgId) || !cleanText) return;

          const targetRoom =
            typeof msg.roomId === 'string' && VALID_ROOMS.has(msg.roomId)
              ? msg.roomId
              : meta.roomId;

          const safeUserId =
            meta.userId ||
            (typeof msg.userId === 'string' && SHORT_ID_RE.test(msg.userId.trim())
              ? msg.userId.trim()
              : meta.clientId);
          const safeAuthorName = sanitizePlainText(msg.authorName, 80, meta.displayName);
          const safeAvatar = isSafeStoredMediaUrl(msg.authorAvatar);
          const safeCreatedAtLabel = sanitizePlainText(msg.createdAtLabel, 64, "À l'instant");

          const sanitizedMessage: {
            id: string;
            roomId: string;
            userId: string;
            authorName: string;
            authorAvatar?: string;
            text: string;
            createdAtLabel: string;
            createdAtMs: number;
          } = {
            id: msgId,
            roomId: targetRoom,
            userId: safeUserId,
            authorName: safeAuthorName,
            text: cleanText,
            createdAtLabel: safeCreatedAtLabel,
            createdAtMs:
              typeof msg.createdAtMs === 'number' && Number.isFinite(msg.createdAtMs)
                ? msg.createdAtMs
                : Date.now(),
          };
          if (safeAvatar) {
            sanitizedMessage.authorAvatar = safeAvatar;
          }

          const outbound = JSON.stringify({
            type: 'CHAT_MESSAGE',
            message: sanitizedMessage,
          });

          for (const [sock, sockMeta] of clients.entries()) {
            if (sock !== ws && sock.readyState === WebSocket.OPEN && sockMeta.roomId === targetRoom) {
              sock.send(outbound);
            }
          }
          return;
        }

        if (parsed.type === 'ACTIVITY_EVENT') {
          const cleanTitle = sanitizePlainText(parsed.activityTitle, 120);
          const outbound = JSON.stringify({
            type: 'ACTIVITY_EVENT',
            activityTitle: cleanTitle,
          });
          for (const [sock] of clients.entries()) {
            if (sock !== ws && sock.readyState === WebSocket.OPEN) {
              sock.send(outbound);
            }
          }
          return;
        }

        if (parsed.type === 'PING' && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PONG' }));
        }
      } catch {
        // Ignore malformed client frames
      }
    });

    ws.on('close', () => {
      const room = meta.roomId;
      clients.delete(ws);
      broadcastPresence(room);
    });
  });

  const heartbeatInterval = setInterval(() => {
    for (const [ws, meta] of clients.entries()) {
      if (!meta.isAlive) {
        const room = meta.roomId;
        clients.delete(ws);
        ws.terminate();
        broadcastPresence(room);
        continue;
      }
      meta.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`MANGOREMA full-stack server + WS running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
