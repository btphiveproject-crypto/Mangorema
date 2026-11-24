/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import {
  UserProfile,
  Booking,
  SafetyIncident,
  ExpeditionReview,
  EcoChallengeCompletion,
  EcoLogEntry,
  EcoLogCategory,
  TrustedContact,
  GoogleContactCandidate,
  CommunityActivity,
  CommunityActivityType,
  CommunityActivityComment,
  CommunityChatMessage,
  ChatRoomId,
  MarketplaceOrder,
  VendorListing,
  VendorListingKind,
  PaymentMethodType,
  PaymentStatus,
  FulfillmentStatus,
  UnifiedCartItem,
  ProfessionalProfile,
  ProfessionalSpecialty,
  StoreProfile,
  StoreCategory,
  BusinessSettlementSettings,
  StoreProductCategory,
  RentalItem,
  PublicExplorerProfile,
  SiteContribution,
  SiteContributionType,
  SubmittedSite,
  SubmittedSiteType,
  SubmittedSiteDifficulty,
  DirectChat,
  DirectChatMessage,
} from './types';
import { computeEcoProgress } from './data/ecoChallenges';
import { sanitizeStoredMediaUrl } from './utils/urlSecurity';

export const WORKSPACE_CONTACTS_SCOPES = [
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.other.readonly',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/directory.readonly',
  'https://www.googleapis.com/auth/user.addresses.read',
  'https://www.googleapis.com/auth/user.birthday.read',
  'https://www.googleapis.com/auth/user.emails.read',
  'https://www.googleapis.com/auth/user.gender.read',
  'https://www.googleapis.com/auth/user.organization.read',
  'https://www.googleapis.com/auth/user.phonenumbers.read',
] as const;

export const WORKSPACE_GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
] as const;

export const WORKSPACE_SCOPES = [
  ...WORKSPACE_CONTACTS_SCOPES,
  ...WORKSPACE_GMAIL_SCOPES,
] as const;

const firestoreDbId =
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
  'ai-studio-mangoremasuperap-ea0501d1-5a71-451e-8bd8-6fb5ecff7f26';

// Initialize Firebase SDK with provisioned applet configuration
const app = initializeApp(firebaseConfig);
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(
    app,
    { experimentalForceLongPolling: true },
    firestoreDbId
  );
} catch {
  dbInstance = getFirestore(app, firestoreDbId);
}
export const db = dbInstance;
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Strict in-memory OAuth access token storage (never localStorage / sessionStorage)
let cachedGoogleAccessToken: string | null = null;

export function getGoogleAccessToken(): string | null {
  return cachedGoogleAccessToken;
}

export function clearGoogleAccessToken(): void {
  cachedGoogleAccessToken = null;
}

// =========================================================================
// Connection Validation (Required by firebase-integration-rpc)
// =========================================================================
export async function testConnection(): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: client is offline.');
    }
  }
}

testConnection();

// =========================================================================
// Structured Firestore Error Handler
// =========================================================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// =========================================================================
// Google Auth & Google Contacts OAuth Helpers
// =========================================================================
export type GoogleAuthDiagnosticCode =
  | 'auth/webview-disallowed'
  | 'auth/popup-blocked'
  | 'auth/unauthorized-domain'
  | 'auth/popup-closed-by-user'
  | 'auth/cancelled-popup-request'
  | 'auth/network-request-failed'
  | 'auth/web-storage-unsupported'
  | 'auth/operation-not-supported-in-this-environment'
  | 'auth/unknown';

export interface GoogleAuthIssueInfo {
  code: GoogleAuthDiagnosticCode;
  message: string;
  hostname: string;
  canRetryRedirect: boolean;
  isWebViewBlocked: boolean;
  isUnauthorizedDomain: boolean;
}

export class GoogleAuthDiagnosticError extends Error {
  readonly info: GoogleAuthIssueInfo;

  constructor(info: GoogleAuthIssueInfo) {
    super(info.message);
    this.name = 'GoogleAuthDiagnosticError';
    this.info = info;
  }
}

export function isCapacitorNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  try {
    return Boolean(cap?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export function isEmbeddedWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (isCapacitorNativePlatform()) return true;
  const ua = navigator.userAgent || '';
  const isAndroidWv = /; wv\)/i.test(ua) && /Android/i.test(ua);
  const isInAppSocialBrowser = /(FBAN|FBAV|Instagram|Line\/|MicroMessenger|WhatsApp|TikTok)/i.test(ua);
  return isAndroidWv || isInAppSocialBrowser;
}

export function isCrossOriginIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function mapFirebaseAuthError(err: unknown): GoogleAuthDiagnosticError {
  if (err instanceof GoogleAuthDiagnosticError) return err;

  const rawCode =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code || '')
      : '';
  const rawMessage = err instanceof Error ? err.message : String(err || '');
  const hostname = typeof window !== 'undefined' ? window.location.hostname || window.location.origin : '';
  const inIframe = isCrossOriginIframe();
  const inWebView = isEmbeddedWebView();

  if (
    rawCode === 'auth/webview-disallowed' ||
    /disallowed_useragent/i.test(rawMessage) ||
    inWebView
  ) {
    return new GoogleAuthDiagnosticError({
      code: 'auth/webview-disallowed',
      message:
        "Google bloque la connexion OAuth dans les WebViews intégrées (APK Android ou navigateur intégré). Ouvrez MANGOREMA dans Chrome ou Safari pour valider votre compte Google.",
      hostname,
      canRetryRedirect: false,
      isWebViewBlocked: true,
      isUnauthorizedDomain: false,
    });
  }

  if (rawCode === 'auth/unauthorized-domain') {
    return new GoogleAuthDiagnosticError({
      code: 'auth/unauthorized-domain',
      message: `Ce domaine (${hostname || 'inconnu'}) n'est pas encore autorisé dans Firebase Authentication -> Domaines autorisés.`,
      hostname,
      canRetryRedirect: false,
      isWebViewBlocked: false,
      isUnauthorizedDomain: true,
    });
  }

  if (
    rawCode === 'auth/popup-blocked' ||
    rawCode === 'auth/operation-not-supported-in-this-environment'
  ) {
    return new GoogleAuthDiagnosticError({
      code: rawCode as GoogleAuthDiagnosticCode,
      message: inIframe
        ? "La fenêtre pop-up Google a été bloquée par votre navigateur. Autorisez les pop-ups pour ce site ou ouvrez l'application dans un onglet Chrome/Safari."
        : 'Le pop-up Google a été bloqué sur cet appareil. Utilisez la redirection Google directe ci-dessous.',
      hostname,
      canRetryRedirect: !inIframe && !inWebView,
      isWebViewBlocked: false,
      isUnauthorizedDomain: false,
    });
  }

  if (rawCode === 'auth/popup-closed-by-user' || rawCode === 'auth/cancelled-popup-request') {
    return new GoogleAuthDiagnosticError({
      code: rawCode as GoogleAuthDiagnosticCode,
      message: 'Fenêtre de connexion Google fermée avant la fin de la validation.',
      hostname,
      canRetryRedirect: !inIframe && !inWebView,
      isWebViewBlocked: false,
      isUnauthorizedDomain: false,
    });
  }

  if (rawCode === 'auth/network-request-failed') {
    return new GoogleAuthDiagnosticError({
      code: 'auth/network-request-failed',
      message: 'Connexion réseau instable ou hors-ligne : impossible de joindre les serveurs Google.',
      hostname,
      canRetryRedirect: false,
      isWebViewBlocked: false,
      isUnauthorizedDomain: false,
    });
  }

  if (rawCode === 'auth/web-storage-unsupported') {
    return new GoogleAuthDiagnosticError({
      code: 'auth/web-storage-unsupported',
      message:
        'Le stockage local ou les cookies tiers sont désactivés dans votre navigateur. Activez les cookies pour vous connecter avec Google.',
      hostname,
      canRetryRedirect: false,
      isWebViewBlocked: false,
      isUnauthorizedDomain: false,
    });
  }

  return new GoogleAuthDiagnosticError({
    code: 'auth/unknown',
    message: rawMessage || 'Impossible de finaliser la connexion Google.',
    hostname,
    canRetryRedirect: !inIframe && !inWebView,
    isWebViewBlocked: false,
    isUnauthorizedDomain: false,
  });
}

export async function signInWithGoogle(): Promise<User | null> {
  if (isEmbeddedWebView()) {
    throw mapFirebaseAuthError({ code: 'auth/webview-disallowed' });
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedGoogleAccessToken = credential.accessToken;
    }
    return result.user;
  } catch (err) {
    const mapped = mapFirebaseAuthError(err);
    if (
      (mapped.info.code === 'auth/popup-blocked' ||
        mapped.info.code === 'auth/operation-not-supported-in-this-environment') &&
      mapped.info.canRetryRedirect
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw mapped;
  }
}

export async function signInWithGoogleRedirect(): Promise<void> {
  if (isEmbeddedWebView()) {
    throw mapFirebaseAuthError({ code: 'auth/webview-disallowed' });
  }
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (err) {
    throw mapFirebaseAuthError(err);
  }
}

export async function consumeGoogleRedirectResult(): Promise<{
  user: User | null;
  error: GoogleAuthDiagnosticError | null;
}> {
  try {
    const result = await getRedirectResult(auth);
    if (!result) {
      return { user: null, error: null };
    }
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedGoogleAccessToken = credential.accessToken;
    }
    return { user: result.user, error: null };
  } catch (err) {
    return { user: null, error: mapFirebaseAuthError(err) };
  }
}

export async function refreshWorkspaceAccessToken(): Promise<string> {
  if (isEmbeddedWebView()) {
    throw mapFirebaseAuthError({ code: 'auth/webview-disallowed' });
  }
  const workspaceProvider = new GoogleAuthProvider();
  WORKSPACE_SCOPES.forEach((scope) => {
    workspaceProvider.addScope(scope);
  });
  workspaceProvider.setCustomParameters({
    prompt: 'consent',
    include_granted_scopes: 'true',
  });
  try {
    const result = await signInWithPopup(auth, workspaceProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Impossible d'obtenir le jeton d'accès Google Workspace.");
    }
    cachedGoogleAccessToken = credential.accessToken;
    return credential.accessToken;
  } catch (err) {
    throw mapFirebaseAuthError(err);
  }
}

export const refreshGoogleContactsAccessToken = refreshWorkspaceAccessToken;

export async function logoutUser(): Promise<void> {
  clearGoogleAccessToken();
  await signOut(auth);
}

export async function getCurrentIdToken(): Promise<string | null> {
  const current = auth.currentUser;
  if (!current || !current.emailVerified) return null;
  try {
    return await current.getIdToken();
  } catch {
    return null;
  }
}

// =========================================================================
// Google People / Contacts API Client
// =========================================================================
interface PeopleApiConnection {
  resourceName?: string;
  names?: Array<{ displayName?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  phoneNumbers?: Array<{ value?: string; canonicalForm?: string }>;
  photos?: Array<{ url?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
}

function mapPeopleConnections(items: PeopleApiConnection[]): GoogleContactCandidate[] {
  const mapped: GoogleContactCandidate[] = [];
  for (const person of items) {
    const resourceName = person.resourceName || '';
    const displayName =
      person.names?.[0]?.displayName?.trim() ||
      person.emailAddresses?.[0]?.value?.trim() ||
      person.phoneNumbers?.[0]?.value?.trim() ||
      '';
    if (!resourceName || !displayName) continue;

    const phone =
      person.phoneNumbers?.[0]?.canonicalForm?.trim() ||
      person.phoneNumbers?.[0]?.value?.trim();
    const email = person.emailAddresses?.[0]?.value?.trim();
    const photoUrl = sanitizeStoredMediaUrl(person.photos?.[0]?.url);
    const organization = person.organizations?.[0]?.name?.trim();

    mapped.push({
      resourceName,
      displayName: displayName.slice(0, 100),
      phoneNumber: phone ? phone.slice(0, 40) : undefined,
      email: email ? email.slice(0, 160) : undefined,
      photoUrl: photoUrl ? photoUrl.slice(0, 500) : undefined,
      organization: organization ? organization.slice(0, 60) : undefined,
    });
  }
  return mapped;
}

export async function fetchGoogleContacts(accessToken: string): Promise<GoogleContactCandidate[]> {
  const connectionsUrl =
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos,organizations&pageSize=80&sortOrder=FIRST_NAME_ASCENDING';

  const res = await fetch(connectionsUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    clearGoogleAccessToken();
    throw new Error('TOKEN_EXPIRED_OR_DENIED');
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Erreur API Google Contacts (${res.status}): ${txt.slice(0, 160)}`);
  }

  const data = (await res.json()) as { connections?: PeopleApiConnection[] };
  const primaryList = mapPeopleConnections(data.connections || []);

  // Attempt best-effort merge with "Other contacts" when permitted
  try {
    const otherRes = await fetch(
      'https://people.googleapis.com/v1/otherContacts?readMask=names,emailAddresses,phoneNumbers,photos&pageSize=40',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (otherRes.ok) {
      const otherData = (await otherRes.json()) as { otherContacts?: PeopleApiConnection[] };
      const otherMapped = mapPeopleConnections(otherData.otherContacts || []);
      const seen = new Set(primaryList.map((c) => c.resourceName));
      for (const c of otherMapped) {
        if (!seen.has(c.resourceName)) {
          seen.add(c.resourceName);
          primaryList.push(c);
        }
      }
    }
  } catch {
    // Non-blocking fallback if otherContacts is empty or unavailable
  }

  return primaryList;
}

// =========================================================================
// Defensive Payload Sanitizers (Synchronized with firebase-blueprint.json)
// =========================================================================
const VALID_SUBSCRIPTIONS = [
  'Gratuit (0 F)',
  'Starter (500 F)',
  'Club Medium (1 000 F)',
  'Pro Expé (2 000 F)',
] as const;

function sanitizeStr(val: string | undefined, maxLen: number, fallback = ''): string {
  const s = (val ?? fallback).toString().trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function sanitizeId(val: string): string {
  const cleaned = val.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return cleaned || `id-${Date.now()}`;
}

// =========================================================================
// Firestore Persistence Helpers
// =========================================================================
export async function loadOrCreateUserProfile(
  firebaseUser: User,
  fallbackProfile: UserProfile
): Promise<UserProfile> {
  const uid = sanitizeId(firebaseUser.uid);
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const loadedProfile: UserProfile = {
        ...fallbackProfile,
        name: typeof data.name === 'string' ? data.name : fallbackProfile.name,
        role: typeof data.role === 'string' ? data.role : fallbackProfile.role,
        phone: typeof data.phone === 'string' ? data.phone : fallbackProfile.phone,
        avatar:
          sanitizeStoredMediaUrl(typeof data.avatar === 'string' ? data.avatar : undefined) ||
          sanitizeStoredMediaUrl(firebaseUser.photoURL) ||
          fallbackProfile.avatar,
        bio: typeof data.bio === 'string' ? data.bio : fallbackProfile.bio,
        homeCity: typeof data.homeCity === 'string' ? data.homeCity : fallbackProfile.homeCity,
        favoritePark: typeof data.favoritePark === 'string' ? data.favoritePark : fallbackProfile.favoritePark,
        publicDiscoverable:
          typeof data.publicDiscoverable === 'boolean' ? data.publicDiscoverable : true,
        totalKm: typeof data.totalKm === 'number' ? data.totalKm : fallbackProfile.totalKm,
        totalAscent: typeof data.totalAscent === 'number' ? data.totalAscent : fallbackProfile.totalAscent,
        stepsCount: typeof data.stepsCount === 'number' ? data.stepsCount : fallbackProfile.stepsCount,
        subscription: VALID_SUBSCRIPTIONS.includes(data.subscription)
          ? data.subscription
          : fallbackProfile.subscription,
        favoritePhotoIds: Array.isArray(data.favoritePhotoIds)
          ? data.favoritePhotoIds.slice(0, 20)
          : fallbackProfile.favoritePhotoIds,
        topThreePhotoIds: Array.isArray(data.topThreePhotoIds)
          ? data.topThreePhotoIds.slice(0, 3)
          : fallbackProfile.topThreePhotoIds,
        ecoPoints:
          typeof data.ecoPoints === 'number'
            ? data.ecoPoints
            : (fallbackProfile.ecoPoints ?? 0),
        zeroWasteExpeditionsCount:
          typeof data.zeroWasteExpeditionsCount === 'number'
            ? data.zeroWasteExpeditionsCount
            : (fallbackProfile.zeroWasteExpeditionsCount ?? 0),
        unlockedBadgeIds: Array.isArray(data.unlockedBadgeIds)
          ? data.unlockedBadgeIds.filter((x): x is string => typeof x === 'string').slice(0, 30)
          : (fallbackProfile.unlockedBadgeIds ?? []),
      };
      void syncPublicExplorerProfile(uid, loadedProfile).catch(() => undefined);
      return loadedProfile;
    }

    const safeAvatar =
      sanitizeStoredMediaUrl(firebaseUser.photoURL) ||
      sanitizeStoredMediaUrl(fallbackProfile.avatar) ||
      '';

    const newProfilePayload: Record<string, unknown> = {
      uid,
      name: sanitizeStr(firebaseUser.displayName || fallbackProfile.name, 100, 'Explorateur MANGOREMA'),
      role: sanitizeStr(fallbackProfile.role, 80, 'Écotouriste Gabon'),
      phone: sanitizeStr(fallbackProfile.phone, 40, '+241 74 12 34 56'),
      email: sanitizeStr(firebaseUser.email || '', 160),
      bio: sanitizeStr(fallbackProfile.bio, 400),
      homeCity: sanitizeStr(fallbackProfile.homeCity, 80, 'Libreville, Gabon'),
      favoritePark: sanitizeStr(fallbackProfile.favoritePark, 100, 'Parc National de la Mondah'),
      publicDiscoverable: fallbackProfile.publicDiscoverable !== false,
      totalKm: Math.max(0, Number(fallbackProfile.totalKm) || 0),
      totalAscent: Math.max(0, Number(fallbackProfile.totalAscent) || 0),
      stepsCount: Math.max(0, Math.floor(Number(fallbackProfile.stepsCount) || 0)),
      subscription: VALID_SUBSCRIPTIONS.includes(fallbackProfile.subscription)
        ? fallbackProfile.subscription
        : 'Gratuit (0 F)',
      favoritePhotoIds: (fallbackProfile.favoritePhotoIds || []).slice(0, 20).map((id) => sanitizeStr(id, 128)),
      topThreePhotoIds: (fallbackProfile.topThreePhotoIds || []).filter(Boolean).slice(0, 3).map((id) => sanitizeStr(id, 128)),
      ecoPoints: 0,
      zeroWasteExpeditionsCount: 0,
      unlockedBadgeIds: [] as string[],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (safeAvatar) {
      newProfilePayload.avatar = safeAvatar.slice(0, 1000);
    }

    await setDoc(userRef, newProfilePayload);
    const createdProfile: UserProfile = {
      ...fallbackProfile,
      name: String(newProfilePayload.name),
      avatar: safeAvatar || fallbackProfile.avatar,
      homeCity: String(newProfilePayload.homeCity),
      favoritePark: String(newProfilePayload.favoritePark),
      publicDiscoverable: true,
      ecoPoints: 0,
      zeroWasteExpeditionsCount: 0,
      unlockedBadgeIds: [],
    };
    void syncPublicExplorerProfile(uid, createdProfile).catch(() => undefined);
    return createdProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function updateUserProfileFields(
  uid: string,
  profile: UserProfile
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const userPath = `users/${safeUid}`;
  const userRef = doc(db, 'users', safeUid);

  try {
    const safeAvatar = sanitizeStoredMediaUrl(profile.avatar);
    const updatePayload: Record<string, unknown> = {
      name: sanitizeStr(profile.name, 100, 'Explorateur'),
      role: sanitizeStr(profile.role, 80, 'Écotouriste'),
      phone: sanitizeStr(profile.phone, 40),
      bio: sanitizeStr(profile.bio, 400),
      homeCity: sanitizeStr(profile.homeCity, 80, 'Libreville, Gabon'),
      favoritePark: sanitizeStr(profile.favoritePark, 100),
      publicDiscoverable: profile.publicDiscoverable !== false,
      totalKm: Math.max(0, Number(profile.totalKm) || 0),
      totalAscent: Math.max(0, Number(profile.totalAscent) || 0),
      stepsCount: Math.max(0, Math.floor(Number(profile.stepsCount) || 0)),
      subscription: VALID_SUBSCRIPTIONS.includes(profile.subscription)
        ? profile.subscription
        : 'Gratuit (0 F)',
      favoritePhotoIds: (profile.favoritePhotoIds || []).slice(0, 20).map((id) => sanitizeStr(id, 128)),
      topThreePhotoIds: (profile.topThreePhotoIds || []).filter(Boolean).slice(0, 3).map((id) => sanitizeStr(id, 128)),
      ecoPoints: Math.max(0, Math.round(Number(profile.ecoPoints) || 0)),
      zeroWasteExpeditionsCount: Math.max(0, Math.floor(Number(profile.zeroWasteExpeditionsCount) || 0)),
      unlockedBadgeIds: (profile.unlockedBadgeIds || []).slice(0, 30).map((id) => sanitizeStr(id, 64)),
      updatedAt: serverTimestamp(),
    };
    if (safeAvatar) {
      updatePayload.avatar = safeAvatar.slice(0, 1000);
    }
    await updateDoc(userRef, updatePayload);
    void syncPublicExplorerProfile(safeUid, profile).catch(() => undefined);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function saveBookingToFirestore(uid: string, booking: Booking): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeBookingId = sanitizeId(booking.id);
  const path = `users/${safeUid}/bookings/${safeBookingId}`;

  try {
    const payload: Record<string, unknown> = {
      id: safeBookingId,
      userId: safeUid,
      refNumber: sanitizeStr(booking.refNumber, 64, `MANG-${Date.now()}`),
      eventTitle: sanitizeStr(booking.eventTitle, 160, 'Expédition MANGOREMA'),
      eventDate: sanitizeStr(booking.eventDate, 64, 'À confirmer'),
      location: sanitizeStr(booking.location, 160, 'Gabon'),
      shuttleIncluded: Boolean(booking.shuttleIncluded),
      tentIncluded: Boolean(booking.tentIncluded),
      guideIncluded: Boolean(booking.guideIncluded),
      totalAmount: Math.max(0, Number(booking.totalAmount) || 0),
      paymentMethod:
        booking.paymentMethod === 'MOOV' || booking.paymentMethod === 'GHETTOPAY'
          ? booking.paymentMethod
          : 'AIRTEL',
      payerPhone: sanitizeStr(booking.payerPhone, 40, '+241'),
      timestamp: sanitizeStr(booking.timestamp, 64),
      status: 'CONFIRMED',
      qrCodeSeed: sanitizeStr(booking.qrCodeSeed, 200),
      createdAt: serverTimestamp(),
    };

    if (booking.eventId) {
      payload.eventId = sanitizeStr(booking.eventId, 128);
    }
    if (booking.shuttleDetail) {
      payload.shuttleDetail = sanitizeStr(booking.shuttleDetail, 200);
    }

    await setDoc(doc(db, 'users', safeUid, 'bookings', safeBookingId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserBookings(
  uid: string,
  onData: (bookings: Booking[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeUid = sanitizeId(uid);
  const path = `users/${safeUid}/bookings`;
  const q = query(collection(db, 'users', safeUid, 'bookings'), where('userId', '==', safeUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Booking[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          refNumber: data.refNumber,
          eventId: data.eventId,
          eventTitle: data.eventTitle,
          eventDate: data.eventDate,
          location: data.location,
          shuttleIncluded: Boolean(data.shuttleIncluded),
          shuttleDetail: data.shuttleDetail,
          tentIncluded: Boolean(data.tentIncluded),
          guideIncluded: Boolean(data.guideIncluded),
          totalAmount: Number(data.totalAmount || 0),
          paymentMethod:
            data.paymentMethod === 'MOOV' || data.paymentMethod === 'GHETTOPAY'
              ? data.paymentMethod
              : 'AIRTEL',
          payerPhone: data.payerPhone || '',
          timestamp: data.timestamp || '',
          status: data.status === 'USED' ? 'USED' : 'CONFIRMED',
          qrCodeSeed: data.qrCodeSeed || '',
        };
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function saveIncidentToFirestore(
  uid: string,
  incident: SafetyIncident
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeIncidentId = sanitizeId(incident.id);
  const path = `users/${safeUid}/incidents/${safeIncidentId}`;

  try {
    await setDoc(doc(db, 'users', safeUid, 'incidents', safeIncidentId), {
      id: safeIncidentId,
      userId: safeUid,
      type: incident.type,
      title: sanitizeStr(incident.title, 120, 'Signalement terrain'),
      description: sanitizeStr(incident.description, 500, 'Incident signalé'),
      lat: Number(incident.coords[0]) || 0,
      lng: Number(incident.coords[1]) || 0,
      severity: incident.severity,
      reportedAt: sanitizeStr(incident.reportedAt, 64, "À l'instant"),
      verifiedByANPN: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserIncidents(
  uid: string,
  onData: (incidents: SafetyIncident[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeUid = sanitizeId(uid);
  const path = `users/${safeUid}/incidents`;
  const q = query(collection(db, 'users', safeUid, 'incidents'), where('userId', '==', safeUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: SafetyIncident[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          type: data.type,
          title: data.title,
          description: data.description,
          coords: [Number(data.lat || 0), Number(data.lng || 0)],
          severity: data.severity,
          reportedAt: data.reportedAt || 'Enregistré',
          verifiedByANPN: Boolean(data.verifiedByANPN),
        };
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// =========================================================================
// Expedition Reviews Persistence & Real-Time Subscription
// =========================================================================
export async function saveExpeditionReviewToFirestore(
  uid: string,
  review: Omit<ExpeditionReview, 'userId' | 'isSynced'>
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeReviewId = sanitizeId(review.id);
  const safeEventId = sanitizeId(review.eventId);
  const path = `expedition_reviews/${safeReviewId}`;

  const cleanComment = sanitizeStr(review.comment, 400);
  if (cleanComment.length < 3) {
    throw new Error('Le commentaire doit contenir au moins 3 caractères.');
  }

  const boundedRating = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 5)));

  try {
    const payload: Record<string, unknown> = {
      id: safeReviewId,
      eventId: safeEventId,
      userId: safeUid,
      authorName: sanitizeStr(review.authorName, 80, 'Explorateur MANGOREMA'),
      rating: boundedRating,
      comment: cleanComment,
      visibility: 'PUBLIC',
      createdAtLabel: sanitizeStr(review.createdAtLabel, 64, "Aujourd'hui"),
      createdAt: serverTimestamp(),
    };

    const cleanAvatar = sanitizeStoredMediaUrl(review.authorAvatar);
    if (cleanAvatar) {
      payload.authorAvatar = cleanAvatar.slice(0, 500);
    }

    const cleanPhoto = sanitizeStoredMediaUrl(review.photoUrl);
    if (cleanPhoto) {
      payload.photoUrl = cleanPhoto.slice(0, 500);
    }

    await setDoc(doc(db, 'expedition_reviews', safeReviewId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteExpeditionReviewFromFirestore(reviewId: string): Promise<void> {
  const safeReviewId = sanitizeId(reviewId);
  const path = `expedition_reviews/${safeReviewId}`;
  try {
    await deleteDoc(doc(db, 'expedition_reviews', safeReviewId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeExpeditionReviews(
  onData: (reviews: ExpeditionReview[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'expedition_reviews';
  const q = query(collection(db, 'expedition_reviews'), where('visibility', '==', 'PUBLIC'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ExpeditionReview[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: data.id || d.id,
          eventId: data.eventId || '',
          userId: data.userId || '',
          authorName: data.authorName || 'Explorateur MANGOREMA',
          authorAvatar: sanitizeStoredMediaUrl(typeof data.authorAvatar === 'string' ? data.authorAvatar : undefined),
          rating: Math.min(5, Math.max(1, Number(data.rating || 5))),
          comment: data.comment || '',
          photoUrl: sanitizeStoredMediaUrl(typeof data.photoUrl === 'string' ? data.photoUrl : undefined),
          createdAtLabel: data.createdAtLabel || 'Récent',
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
          isSynced: true,
        };
      });
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// =========================================================================
// Ecological Zero-Waste Challenges & Virtual Badges Sync (Firebase Storage + Batch)
// =========================================================================
const MAX_PROOF_PHOTO_BYTES = 6 * 1024 * 1024; // 6 MB compressed photo ceiling

export async function uploadEcoChallengeProofPhoto(
  uid: string,
  challengeId: string,
  photoBlob: Blob,
  onProgress?: (percent: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  const safeUid = sanitizeId(uid);
  const safeChallengeId = sanitizeId(challengeId);

  if (!photoBlob || photoBlob.size === 0) {
    throw new Error('La photo capturée est vide. Veuillez reprendre une photo.');
  }
  if (photoBlob.size > MAX_PROOF_PHOTO_BYTES) {
    throw new Error('La photo dépasse la limite maximale de 6 Mo.');
  }

  const storagePath = `eco-challenge-proofs/${safeUid}/${safeChallengeId}-${Date.now()}.jpg`;
  const fileRef = storageRef(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, photoBlob, {
      contentType: photoBlob.type && photoBlob.type.startsWith('image/') ? photoBlob.type : 'image/jpeg',
      customMetadata: {
        uid: safeUid,
        challengeId: safeChallengeId,
      },
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.min(100, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          onProgress(pct);
        }
      },
      (err) => {
        const code = (err as { code?: string }).code || '';
        if (code === 'storage/unauthorized') {
          reject(
            new Error(
              'Accès Firebase Storage refusé (storage/unauthorized). Vérifiez les règles Storage du projet Firebase.'
            )
          );
          return;
        }
        if (code === 'storage/canceled') {
          reject(new Error('Téléversement de la photo annulé.'));
          return;
        }
        if (code === 'storage/quota-exceeded') {
          reject(new Error('Quota Firebase Storage atteint pour ce projet.'));
          return;
        }
        reject(
          new Error(
            `Impossible d'envoyer la photo vers Firebase Storage (${err.message || 'erreur réseau'}).`
          )
        );
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const safeUrl = sanitizeStoredMediaUrl(downloadUrl);
          if (!safeUrl) {
            reject(new Error('URL de photo retournée invalide.'));
            return;
          }
          resolve({
            downloadUrl: safeUrl.slice(0, 1000),
            storagePath: sanitizeStr(storagePath, 300),
          });
        } catch (urlErr) {
          reject(
            new Error(
              urlErr instanceof Error
                ? `Photo envoyée, mais URL inaccessible : ${urlErr.message}`
                : 'Impossible de récupérer le lien de téléchargement Firebase Storage.'
            )
          );
        }
      }
    );
  });
}

const SAFE_ECO_STORAGE_PATH_RE = /^eco-challenge-proofs\/([a-zA-Z0-9_-]+)\/[a-zA-Z0-9_.-]+$/;

export async function deleteEcoChallengeProofPhoto(storagePath?: string): Promise<void> {
  if (!storagePath || typeof storagePath !== 'string') return;
  const trimmed = storagePath.trim();
  const match = trimmed.match(SAFE_ECO_STORAGE_PATH_RE);
  if (!match || trimmed.includes('..')) return;
  const currentUid = auth.currentUser?.uid ? sanitizeId(auth.currentUser.uid) : null;
  if (currentUid && match[1] !== currentUid) return;
  try {
    await deleteObject(storageRef(storage, trimmed));
  } catch {
    // Non-blocking cleanup if object was already deleted or inaccessible
  }
}

export async function saveEcoChallengeAndSyncProfile(
  uid: string,
  completion: Omit<EcoChallengeCompletion, 'userId' | 'createdAtMs'>,
  allCompletionsAfter: EcoChallengeCompletion[]
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeChallengeId = sanitizeId(completion.id);
  const safeEventId = sanitizeId(completion.eventId);
  const safeBadgeId = sanitizeId(completion.badgeId);
  const path = `users/${safeUid}/eco_challenges/${safeChallengeId}`;

  if (completion.wasteBagReturned !== true || completion.leaveNoTracePledge !== true) {
    throw new Error('Les deux engagements Zéro Déchet doivent être confirmés.');
  }

  const boundedEcoPoints = Math.min(500, Math.max(50, Math.round(Number(completion.ecoPoints) || 100)));
  const progress = computeEcoProgress(allCompletionsAfter);

  try {
    const challengePayload: Record<string, unknown> = {
      id: safeChallengeId,
      userId: safeUid,
      eventId: safeEventId,
      eventTitle: sanitizeStr(completion.eventTitle, 160, 'Expédition MANGOREMA'),
      parkName: sanitizeStr(completion.parkName, 120, 'Parc National Gabon'),
      badgeId: safeBadgeId,
      badgeName: sanitizeStr(completion.badgeName, 100, 'Badge Écologique'),
      badgeIcon: sanitizeStr(completion.badgeIcon, 16, '🌿'),
      wasteBagReturned: true,
      leaveNoTracePledge: true,
      ecoPoints: boundedEcoPoints,
      completedAtLabel: sanitizeStr(completion.completedAtLabel, 64, "Aujourd'hui"),
      createdAt: serverTimestamp(),
    };

    const cleanNote = sanitizeStr(completion.wasteNote, 300);
    if (cleanNote) {
      challengePayload.wasteNote = cleanNote;
    }

    const cleanProofUrl = sanitizeStoredMediaUrl(completion.proofPhotoUrl);
    if (cleanProofUrl) {
      challengePayload.proofPhotoUrl = cleanProofUrl.slice(0, 1000);
    }

    const rawProofPath = sanitizeStr(completion.proofStoragePath, 300);
    const pathMatch = rawProofPath.match(SAFE_ECO_STORAGE_PATH_RE);
    if (rawProofPath && pathMatch && pathMatch[1] === safeUid && !rawProofPath.includes('..')) {
      challengePayload.proofStoragePath = rawProofPath;
    }

    const batch = writeBatch(db);
    batch.set(doc(db, 'users', safeUid, 'eco_challenges', safeChallengeId), challengePayload);
    batch.update(doc(db, 'users', safeUid), {
      ecoPoints: Math.max(0, Math.round(progress.ecoPoints)),
      zeroWasteExpeditionsCount: Math.max(0, Math.floor(progress.zeroWasteExpeditionsCount)),
      unlockedBadgeIds: progress.unlockedBadgeIds.slice(0, 30).map((id) => sanitizeStr(id, 64)),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEcoChallengeAndSyncProfile(
  uid: string,
  challengeId: string,
  remainingCompletions: EcoChallengeCompletion[],
  proofStoragePath?: string
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeChallengeId = sanitizeId(challengeId);
  const path = `users/${safeUid}/eco_challenges/${safeChallengeId}`;
  const progress = computeEcoProgress(remainingCompletions);

  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', safeUid, 'eco_challenges', safeChallengeId));
    batch.update(doc(db, 'users', safeUid), {
      ecoPoints: Math.max(0, Math.round(progress.ecoPoints)),
      zeroWasteExpeditionsCount: Math.max(0, Math.floor(progress.zeroWasteExpeditionsCount)),
      unlockedBadgeIds: progress.unlockedBadgeIds.slice(0, 30).map((id) => sanitizeStr(id, 64)),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    if (proofStoragePath) {
      await deleteEcoChallengeProofPhoto(proofStoragePath);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserEcoChallenges(
  uid: string,
  onData: (challenges: EcoChallengeCompletion[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeUid = sanitizeId(uid);
  const path = `users/${safeUid}/eco_challenges`;
  const q = query(collection(db, 'users', safeUid, 'eco_challenges'), where('userId', '==', safeUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: EcoChallengeCompletion[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: data.id || d.id,
          userId: data.userId || safeUid,
          eventId: data.eventId || '',
          eventTitle: data.eventTitle || '',
          parkName: data.parkName || '',
          badgeId: data.badgeId || '',
          badgeName: data.badgeName || '',
          badgeIcon: data.badgeIcon || '🌿',
          wasteBagReturned: Boolean(data.wasteBagReturned),
          leaveNoTracePledge: Boolean(data.leaveNoTracePledge),
          wasteNote: typeof data.wasteNote === 'string' ? data.wasteNote : undefined,
          proofPhotoUrl: sanitizeStoredMediaUrl(typeof data.proofPhotoUrl === 'string' ? data.proofPhotoUrl : undefined),
          proofStoragePath: typeof data.proofStoragePath === 'string' ? data.proofStoragePath : undefined,
          ecoPoints: Number(data.ecoPoints || 0),
          completedAtLabel: data.completedAtLabel || 'Validé',
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// =========================================================================
// Carnet Éco-Log Persistence & Subscription (Faune & Flore Gabon)
// =========================================================================
const VALID_ECOLOG_CATEGORIES: EcoLogCategory[] = ['FAUNE', 'FLORE', 'MARINE', 'OISEAUX'];

export async function saveEcoLogToFirestore(
  uid: string,
  entry: Omit<EcoLogEntry, 'userId' | 'createdAtMs'>
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeLogId = sanitizeId(entry.id);
  const path = `users/${safeUid}/eco_logs/${safeLogId}`;

  const cleanSpecies = sanitizeStr(entry.speciesName, 120);
  const cleanPark = sanitizeStr(entry.parkName, 120, 'Parc National Gabon');
  const cleanNotes = sanitizeStr(entry.notes, 800);
  const cleanObservedAt = sanitizeStr(entry.observedAt, 32, new Date().toISOString().slice(0, 10));
  const safeCategory: EcoLogCategory = VALID_ECOLOG_CATEGORIES.includes(entry.category)
    ? entry.category
    : 'FAUNE';

  if (cleanSpecies.length < 2) {
    throw new Error("Le nom de l'espèce observée doit contenir au moins 2 caractères.");
  }
  if (cleanNotes.length < 3) {
    throw new Error('La note d’observation doit contenir au moins 3 caractères.');
  }

  try {
    const payload: Record<string, unknown> = {
      id: safeLogId,
      userId: safeUid,
      speciesName: cleanSpecies,
      category: safeCategory,
      parkName: cleanPark.length >= 2 ? cleanPark : 'Gabon',
      observedAt: cleanObservedAt.length >= 4 ? cleanObservedAt : '2026-11-19',
      notes: cleanNotes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const cleanContext = sanitizeStr(entry.weatherOrContext, 160);
    if (cleanContext) {
      payload.weatherOrContext = cleanContext;
    }

    await setDoc(doc(db, 'users', safeUid, 'eco_logs', safeLogId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateEcoLogInFirestore(
  uid: string,
  entry: EcoLogEntry
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeLogId = sanitizeId(entry.id);
  const path = `users/${safeUid}/eco_logs/${safeLogId}`;

  const cleanSpecies = sanitizeStr(entry.speciesName, 120);
  const cleanPark = sanitizeStr(entry.parkName, 120, 'Parc National Gabon');
  const cleanNotes = sanitizeStr(entry.notes, 800);
  const cleanObservedAt = sanitizeStr(entry.observedAt, 32, new Date().toISOString().slice(0, 10));
  const safeCategory: EcoLogCategory = VALID_ECOLOG_CATEGORIES.includes(entry.category)
    ? entry.category
    : 'FAUNE';

  if (cleanSpecies.length < 2 || cleanNotes.length < 3) {
    throw new Error("Veuillez vérifier le nom de l'espèce et la note d'observation.");
  }

  try {
    const payload: Record<string, unknown> = {
      speciesName: cleanSpecies,
      category: safeCategory,
      parkName: cleanPark.length >= 2 ? cleanPark : 'Gabon',
      observedAt: cleanObservedAt,
      notes: cleanNotes,
      updatedAt: serverTimestamp(),
    };

    const cleanContext = sanitizeStr(entry.weatherOrContext, 160);
    if (cleanContext) {
      payload.weatherOrContext = cleanContext;
    }

    await updateDoc(doc(db, 'users', safeUid, 'eco_logs', safeLogId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteEcoLogFromFirestore(uid: string, logId: string): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeLogId = sanitizeId(logId);
  const path = `users/${safeUid}/eco_logs/${safeLogId}`;
  try {
    await deleteDoc(doc(db, 'users', safeUid, 'eco_logs', safeLogId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserEcoLogs(
  uid: string,
  onData: (logs: EcoLogEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeUid = sanitizeId(uid);
  const path = `users/${safeUid}/eco_logs`;
  const q = query(collection(db, 'users', safeUid, 'eco_logs'), where('userId', '==', safeUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: EcoLogEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: data.id || d.id,
          userId: data.userId || safeUid,
          speciesName: data.speciesName || '',
          category: VALID_ECOLOG_CATEGORIES.includes(data.category) ? data.category : 'FAUNE',
          parkName: data.parkName || 'Gabon',
          observedAt: data.observedAt || '',
          notes: data.notes || '',
          weatherOrContext: typeof data.weatherOrContext === 'string' ? data.weatherOrContext : undefined,
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => {
        if (b.observedAt !== a.observedAt) return b.observedAt.localeCompare(a.observedAt);
        return (b.createdAtMs || 0) - (a.createdAtMs || 0);
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// =========================================================================
// Trusted Google Contacts Sync (Proches Expédition & Sécurité)
// =========================================================================
export function buildTrustedContactId(resourceName: string): string {
  return sanitizeId(resourceName.replace(/^people\//, 'gc-'));
}

export async function saveTrustedContactToFirestore(
  uid: string,
  contact: Omit<TrustedContact, 'id' | 'userId' | 'createdAtMs'> & { id?: string }
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeContactId = contact.id
    ? sanitizeId(contact.id)
    : buildTrustedContactId(contact.resourceName);
  const path = `users/${safeUid}/trusted_contacts/${safeContactId}`;

  const cleanName = sanitizeStr(contact.displayName, 100, 'Proche MANGOREMA');
  const cleanResource = sanitizeStr(contact.resourceName, 160, `people/${safeContactId}`);

  try {
    const payload: Record<string, unknown> = {
      id: safeContactId,
      userId: safeUid,
      resourceName: cleanResource,
      displayName: cleanName,
      shareSafetyAlerts: Boolean(contact.shareSafetyAlerts),
      shareExpeditionPlans: Boolean(contact.shareExpeditionPlans),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const cleanPhone = sanitizeStr(contact.phoneNumber, 40);
    if (cleanPhone) payload.phoneNumber = cleanPhone;

    const cleanEmail = sanitizeStr(contact.email, 160);
    if (cleanEmail) payload.email = cleanEmail;

    const cleanPhoto = sanitizeStoredMediaUrl(contact.photoUrl);
    if (cleanPhoto) payload.photoUrl = cleanPhoto.slice(0, 500);

    const cleanRelation = sanitizeStr(contact.relationTag, 60);
    if (cleanRelation) payload.relationTag = cleanRelation;

    await setDoc(doc(db, 'users', safeUid, 'trusted_contacts', safeContactId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTrustedContactPreferences(
  uid: string,
  contact: TrustedContact
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeContactId = sanitizeId(contact.id);
  const path = `users/${safeUid}/trusted_contacts/${safeContactId}`;

  try {
    const payload: Record<string, unknown> = {
      displayName: sanitizeStr(contact.displayName, 100, 'Proche MANGOREMA'),
      shareSafetyAlerts: Boolean(contact.shareSafetyAlerts),
      shareExpeditionPlans: Boolean(contact.shareExpeditionPlans),
      updatedAt: serverTimestamp(),
    };

    if (contact.phoneNumber) payload.phoneNumber = sanitizeStr(contact.phoneNumber, 40);
    if (contact.email) payload.email = sanitizeStr(contact.email, 160);
    const cleanPhoto = sanitizeStoredMediaUrl(contact.photoUrl);
    if (cleanPhoto) payload.photoUrl = cleanPhoto.slice(0, 500);
    if (contact.relationTag !== undefined) {
      payload.relationTag = sanitizeStr(contact.relationTag, 60);
    }

    await updateDoc(doc(db, 'users', safeUid, 'trusted_contacts', safeContactId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTrustedContactFromFirestore(
  uid: string,
  contactId: string
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeContactId = sanitizeId(contactId);
  const path = `users/${safeUid}/trusted_contacts/${safeContactId}`;
  try {
    await deleteDoc(doc(db, 'users', safeUid, 'trusted_contacts', safeContactId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeTrustedContacts(
  uid: string,
  onData: (contacts: TrustedContact[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeUid = sanitizeId(uid);
  const path = `users/${safeUid}/trusted_contacts`;
  const q = query(collection(db, 'users', safeUid, 'trusted_contacts'), where('userId', '==', safeUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: TrustedContact[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: data.id || d.id,
          userId: data.userId || safeUid,
          resourceName: data.resourceName || `people/${d.id}`,
          displayName: data.displayName || 'Proche',
          phoneNumber: typeof data.phoneNumber === 'string' ? data.phoneNumber : undefined,
          email: typeof data.email === 'string' ? data.email : undefined,
          photoUrl: sanitizeStoredMediaUrl(typeof data.photoUrl === 'string' ? data.photoUrl : undefined),
          relationTag: typeof data.relationTag === 'string' ? data.relationTag : undefined,
          shareSafetyAlerts: Boolean(data.shareSafetyAlerts),
          shareExpeditionPlans: Boolean(data.shareExpeditionPlans),
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// =========================================================================
// Community Activities Feed, Comments, Likes & Real-Time Chat
// =========================================================================
const VALID_COMMUNITY_ACTIVITY_TYPES: CommunityActivityType[] = [
  'RANDONNEE',
  'FAUNE',
  'BIVOUAC',
  'ECO_ACTION',
];
const VALID_CHAT_ROOMS: ChatRoomId[] = ['general', 'mondah', 'ivindo', 'pongara', 'cristal'];

export async function publishCommunityActivity(
  uid: string,
  activity: Omit<CommunityActivity, 'userId' | 'isSynced' | 'createdAtMs'>
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeActivityId = sanitizeId(activity.id);
  const path = `community_activities/${safeActivityId}`;

  const cleanTitle = sanitizeStr(activity.title, 120);
  const cleanDesc = sanitizeStr(activity.description, 600);
  const cleanPark = sanitizeStr(activity.parkName, 120, 'Parc National Gabon');

  if (cleanTitle.length < 3) {
    throw new Error("Le titre de l'activité doit contenir au moins 3 caractères.");
  }
  if (cleanDesc.length < 3) {
    throw new Error('La description doit contenir au moins 3 caractères.');
  }

  const safeType: CommunityActivityType = VALID_COMMUNITY_ACTIVITY_TYPES.includes(activity.activityType)
    ? activity.activityType
    : 'RANDONNEE';

  try {
    const payload: Record<string, unknown> = {
      id: safeActivityId,
      userId: safeUid,
      authorName: sanitizeStr(activity.authorName, 80, 'Explorateur MANGOREMA'),
      parkName: cleanPark.length >= 2 ? cleanPark : 'Gabon',
      activityType: safeType,
      title: cleanTitle,
      description: cleanDesc,
      visibility: 'PUBLIC',
      createdAtLabel: sanitizeStr(activity.createdAtLabel, 64, "À l'instant"),
      createdAt: serverTimestamp(),
    };

    const cleanAvatar = sanitizeStoredMediaUrl(activity.authorAvatar);
    if (cleanAvatar) payload.authorAvatar = cleanAvatar.slice(0, 500);

    const cleanPhoto = sanitizeStoredMediaUrl(activity.photoUrl);
    if (cleanPhoto) payload.photoUrl = cleanPhoto.slice(0, 1000);

    if (typeof activity.distanceKm === 'number' && !Number.isNaN(activity.distanceKm) && activity.distanceKm > 0) {
      payload.distanceKm = Math.min(500, Math.max(0, Number(activity.distanceKm.toFixed(1))));
    }
    if (typeof activity.elevationM === 'number' && !Number.isNaN(activity.elevationM) && activity.elevationM > 0) {
      payload.elevationM = Math.min(10000, Math.max(0, Math.round(activity.elevationM)));
    }

    await setDoc(doc(db, 'community_activities', safeActivityId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCommunityActivity(activityId: string): Promise<void> {
  const safeId = sanitizeId(activityId);
  const path = `community_activities/${safeId}`;
  try {
    await deleteDoc(doc(db, 'community_activities', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeCommunityActivities(
  onData: (activities: CommunityActivity[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'community_activities';
  const q = query(collection(db, 'community_activities'), where('visibility', '==', 'PUBLIC'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CommunityActivity[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: data.id || d.id,
          userId: data.userId || '',
          authorName: data.authorName || 'Explorateur MANGOREMA',
          authorAvatar: sanitizeStoredMediaUrl(typeof data.authorAvatar === 'string' ? data.authorAvatar : undefined),
          parkName: data.parkName || 'Gabon',
          activityType: VALID_COMMUNITY_ACTIVITY_TYPES.includes(data.activityType)
            ? data.activityType
            : 'RANDONNEE',
          title: data.title || '',
          description: data.description || '',
          photoUrl: sanitizeStoredMediaUrl(typeof data.photoUrl === 'string' ? data.photoUrl : undefined),
          distanceKm: typeof data.distanceKm === 'number' ? data.distanceKm : undefined,
          elevationM: typeof data.elevationM === 'number' ? data.elevationM : undefined,
          createdAtLabel: data.createdAtLabel || 'Récent',
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
          isSynced: true,
        };
      });
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function addActivityComment(
  uid: string,
  comment: Omit<CommunityActivityComment, 'userId' | 'createdAtMs'>
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeActivityId = sanitizeId(comment.activityId);
  const safeCommentId = sanitizeId(comment.id);
  const path = `community_activities/${safeActivityId}/comments/${safeCommentId}`;

  const cleanText = sanitizeStr(comment.text, 400);
  if (cleanText.length < 2) {
    throw new Error('Le commentaire doit contenir au moins 2 caractères.');
  }

  try {
    const payload: Record<string, unknown> = {
      id: safeCommentId,
      activityId: safeActivityId,
      userId: safeUid,
      authorName: sanitizeStr(comment.authorName, 80, 'Explorateur MANGOREMA'),
      text: cleanText,
      visibility: 'PUBLIC',
      createdAtLabel: sanitizeStr(comment.createdAtLabel, 64, "À l'instant"),
      createdAt: serverTimestamp(),
    };

    const cleanAvatar = sanitizeStoredMediaUrl(comment.authorAvatar);
    if (cleanAvatar) payload.authorAvatar = cleanAvatar.slice(0, 500);

    await setDoc(doc(db, 'community_activities', safeActivityId, 'comments', safeCommentId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteActivityComment(activityId: string, commentId: string): Promise<void> {
  const safeActivityId = sanitizeId(activityId);
  const safeCommentId = sanitizeId(commentId);
  const path = `community_activities/${safeActivityId}/comments/${safeCommentId}`;
  try {
    await deleteDoc(doc(db, 'community_activities', safeActivityId, 'comments', safeCommentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeActivityComments(
  activityId: string,
  onData: (comments: CommunityActivityComment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeActivityId = sanitizeId(activityId);
  const path = `community_activities/${safeActivityId}/comments`;
  const q = query(
    collection(db, 'community_activities', safeActivityId, 'comments'),
    where('visibility', '==', 'PUBLIC')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CommunityActivityComment[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: data.id || d.id,
          activityId: data.activityId || safeActivityId,
          userId: data.userId || '',
          authorName: data.authorName || 'Explorateur',
          authorAvatar: sanitizeStoredMediaUrl(typeof data.authorAvatar === 'string' ? data.authorAvatar : undefined),
          text: data.text || '',
          createdAtLabel: data.createdAtLabel || 'Récent',
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function toggleActivityLike(
  uid: string,
  activityId: string,
  currentlyLiked: boolean
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeActivityId = sanitizeId(activityId);
  const path = `community_activities/${safeActivityId}/likes/${safeUid}`;
  const likeRef = doc(db, 'community_activities', safeActivityId, 'likes', safeUid);

  try {
    if (currentlyLiked) {
      await deleteDoc(likeRef);
    } else {
      await setDoc(likeRef, {
        activityId: safeActivityId,
        userId: safeUid,
        visibility: 'PUBLIC',
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, currentlyLiked ? OperationType.DELETE : OperationType.CREATE, path);
  }
}

export function subscribeActivityLikes(
  activityId: string,
  onData: (likeUserIds: string[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeActivityId = sanitizeId(activityId);
  const path = `community_activities/${safeActivityId}/likes`;
  const q = query(
    collection(db, 'community_activities', safeActivityId, 'likes'),
    where('visibility', '==', 'PUBLIC')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const ids = snapshot.docs.map((d) => String(d.data().userId || d.id));
      onData(ids);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function sendCommunityChatMessage(
  uid: string,
  message: Omit<CommunityChatMessage, 'userId' | 'createdAtMs'>
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeMsgId = sanitizeId(message.id);
  const path = `community_chat_messages/${safeMsgId}`;

  const cleanText = sanitizeStr(message.text, 500);
  if (!cleanText) {
    throw new Error('Veuillez saisir un message avant envoi.');
  }
  const safeRoom: ChatRoomId = VALID_CHAT_ROOMS.includes(message.roomId) ? message.roomId : 'general';

  try {
    const payload: Record<string, unknown> = {
      id: safeMsgId,
      roomId: safeRoom,
      userId: safeUid,
      authorName: sanitizeStr(message.authorName, 80, 'Explorateur MANGOREMA'),
      text: cleanText,
      visibility: 'PUBLIC',
      createdAtLabel: sanitizeStr(message.createdAtLabel, 64, "À l'instant"),
      createdAt: serverTimestamp(),
    };

    const cleanAvatar = sanitizeStoredMediaUrl(message.authorAvatar);
    if (cleanAvatar) payload.authorAvatar = cleanAvatar.slice(0, 500);

    await setDoc(doc(db, 'community_chat_messages', safeMsgId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCommunityChatMessage(messageId: string): Promise<void> {
  const safeMsgId = sanitizeId(messageId);
  const path = `community_chat_messages/${safeMsgId}`;
  try {
    await deleteDoc(doc(db, 'community_chat_messages', safeMsgId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeCommunityChatMessages(
  onData: (messages: CommunityChatMessage[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'community_chat_messages';
  const q = query(collection(db, 'community_chat_messages'), where('visibility', '==', 'PUBLIC'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CommunityChatMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: data.id || d.id,
          roomId: VALID_CHAT_ROOMS.includes(data.roomId) ? data.roomId : 'general',
          userId: data.userId || '',
          authorName: data.authorName || 'Explorateur MANGOREMA',
          authorAvatar: sanitizeStoredMediaUrl(typeof data.authorAvatar === 'string' ? data.authorAvatar : undefined),
          text: data.text || '',
          createdAtLabel: data.createdAtLabel || 'Récent',
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// =========================================================================
// Unified Marketplace Orders & Vendor/Provider Listings (Firestore Sync)
// =========================================================================
const VALID_ORDER_PAYMENT_METHODS: PaymentMethodType[] = ['AIRTEL', 'MOOV', 'GHETTOPAY', 'CARD'];
const VALID_ORDER_PAYMENT_STATUSES: PaymentStatus[] = ['CONFIRMED', 'PENDING', 'FAILED', 'REFUNDED'];
const VALID_ORDER_FULFILLMENT_STATUSES: FulfillmentStatus[] = [
  'PENDING_VENDOR',
  'CONFIRMED',
  'PREPARING',
  'READY_PICKUP',
  'IN_DELIVERY',
  'COMPLETED',
  'REFUNDED',
  'CANCELLED',
];

export async function saveMarketplaceOrderToFirestore(
  uid: string,
  order: Omit<MarketplaceOrder, 'userId' | 'createdAtMs'>
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeOrderId = sanitizeId(order.id);
  const path = `users/${safeUid}/orders/${safeOrderId}`;

  const summary = sanitizeStr(
    order.items.map((i) => `${i.quantity}x ${i.title}`).join(' · '),
    500,
    'Commande MANGOREMA'
  );
  const itemsJson = JSON.stringify(order.items).slice(0, 12000);

  try {
    const payload: Record<string, unknown> = {
      id: safeOrderId,
      userId: safeUid,
      refNumber: sanitizeStr(order.refNumber, 64, `MANG-${Date.now()}`),
      idempotencyKey: sanitizeStr(order.idempotencyKey, 128, `idem-${Date.now()}`),
      itemsSummary: summary.length >= 2 ? summary : 'Commande MANGOREMA',
      itemsJson: itemsJson.length >= 2 ? itemsJson : '[]',
      itemsSubtotal: Math.max(0, Math.round(Number(order.itemsSubtotal || 0))),
      deliveryFee: Math.max(0, Math.round(Number(order.deliveryFee || 0))),
      depositTotal: Math.max(0, Math.round(Number(order.depositTotal || 0))),
      platformCommission: Math.max(0, Math.round(Number(order.platformCommission || 0))),
      vendorNetAmount: Math.max(0, Math.round(Number(order.vendorNetAmount || 0))),
      grandTotalCharged: Math.max(0, Math.round(Number(order.grandTotalCharged || 0))),
      paymentMethod: VALID_ORDER_PAYMENT_METHODS.includes(order.paymentMethod)
        ? order.paymentMethod
        : 'AIRTEL',
      paymentStatus: order.paymentStatus === 'PENDING' ? 'PENDING' : 'CONFIRMED',
      fulfillmentStatus: VALID_ORDER_FULFILLMENT_STATUSES.includes(order.fulfillmentStatus)
        ? order.fulfillmentStatus
        : 'CONFIRMED',
      payerLabel: sanitizeStr(order.payerLabel, 64, 'Airtel Money'),
      timestamp: sanitizeStr(order.timestamp, 64, "Aujourd'hui"),
      receiptHash: sanitizeStr(order.receiptHash, 128, `HASH-${Date.now()}`),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const cleanAddr = sanitizeStr(order.deliveryAddress, 200);
    if (cleanAddr) {
      payload.deliveryAddress = cleanAddr;
    }

    await setDoc(doc(db, 'users', safeUid, 'orders', safeOrderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateMarketplaceOrderStatusInFirestore(
  uid: string,
  orderId: string,
  updates: {
    paymentStatus: PaymentStatus;
    fulfillmentStatus: FulfillmentStatus;
    refundReason?: string;
    refundedAtLabel?: string;
  }
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeOrderId = sanitizeId(orderId);
  const path = `users/${safeUid}/orders/${safeOrderId}`;

  try {
    const payload: Record<string, unknown> = {
      paymentStatus: VALID_ORDER_PAYMENT_STATUSES.includes(updates.paymentStatus)
        ? updates.paymentStatus
        : 'CONFIRMED',
      fulfillmentStatus: VALID_ORDER_FULFILLMENT_STATUSES.includes(updates.fulfillmentStatus)
        ? updates.fulfillmentStatus
        : 'CONFIRMED',
      updatedAt: serverTimestamp(),
    };
    if (updates.refundReason) {
      payload.refundReason = sanitizeStr(updates.refundReason, 200);
    }
    if (updates.refundedAtLabel) {
      payload.refundedAtLabel = sanitizeStr(updates.refundedAtLabel, 64);
    }

    await updateDoc(doc(db, 'users', safeUid, 'orders', safeOrderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeUserMarketplaceOrders(
  uid: string,
  onData: (orders: MarketplaceOrder[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeUid = sanitizeId(uid);
  const path = `users/${safeUid}/orders`;
  const q = query(collection(db, 'users', safeUid, 'orders'), where('userId', '==', safeUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: MarketplaceOrder[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        let parsedItems: UnifiedCartItem[] = [];
        if (typeof data.itemsJson === 'string') {
          try {
            const raw = JSON.parse(data.itemsJson);
            if (Array.isArray(raw)) parsedItems = raw as UnifiedCartItem[];
          } catch {
            parsedItems = [];
          }
        }
        return {
          id: data.id || d.id,
          userId: data.userId || safeUid,
          refNumber: data.refNumber || '',
          idempotencyKey: data.idempotencyKey || '',
          items: parsedItems,
          itemsSubtotal: Number(data.itemsSubtotal || 0),
          deliveryFee: Number(data.deliveryFee || 0),
          depositTotal: Number(data.depositTotal || 0),
          platformCommission: Number(data.platformCommission || 0),
          vendorNetAmount: Number(data.vendorNetAmount || 0),
          grandTotalCharged: Number(data.grandTotalCharged || 0),
          paymentMethod: VALID_ORDER_PAYMENT_METHODS.includes(data.paymentMethod)
            ? data.paymentMethod
            : 'AIRTEL',
          paymentStatus: VALID_ORDER_PAYMENT_STATUSES.includes(data.paymentStatus)
            ? data.paymentStatus
            : 'CONFIRMED',
          fulfillmentStatus: VALID_ORDER_FULFILLMENT_STATUSES.includes(data.fulfillmentStatus)
            ? data.fulfillmentStatus
            : 'CONFIRMED',
          payerLabel: data.payerLabel || '',
          deliveryAddress: typeof data.deliveryAddress === 'string' ? data.deliveryAddress : undefined,
          timestamp: data.timestamp || '',
          receiptHash: data.receiptHash || '',
          refundReason: typeof data.refundReason === 'string' ? data.refundReason : undefined,
          refundedAtLabel: typeof data.refundedAtLabel === 'string' ? data.refundedAtLabel : undefined,
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

const VALID_LISTING_KINDS: VendorListingKind[] = ['activity', 'product', 'rental'];
const VALID_PRODUCT_CATEGORIES: StoreProductCategory[] = [
  'randonnee',
  'camping',
  'chaussures_vetements',
  'optique_photo',
  'eclairage_gadgets',
  'lifestyle_mangorema',
];
const VALID_RENTAL_CATEGORIES: RentalItem['category'][] = [
  'tente',
  'sac_a_dos',
  'vtt',
  'balise_gps',
  'bivouac',
];

export async function saveVendorListingToFirestore(
  uid: string,
  listing: Omit<VendorListing, 'ownerUserId' | 'createdAtMs'>
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeId = sanitizeId(listing.id);
  const path = `vendor_listings/${safeId}`;

  const cleanTitle = sanitizeStr(listing.title, 120);
  const cleanDesc = sanitizeStr(listing.description, 600);
  if (cleanTitle.length < 3 || cleanDesc.length < 5) {
    throw new Error('Titre (>= 3 car.) et description (>= 5 car.) requis.');
  }

  try {
    const payload: Record<string, unknown> = {
      id: safeId,
      ownerUserId: safeUid,
      ownerName: sanitizeStr(listing.ownerName, 80, 'Prestataire MANGOREMA'),
      listingKind: VALID_LISTING_KINDS.includes(listing.listingKind) ? listing.listingKind : 'product',
      title: cleanTitle,
      category: sanitizeStr(listing.category, 60, 'Outdoor'),
      location: sanitizeStr(listing.location, 120, 'Libreville, Gabon'),
      price: Math.min(10000000, Math.max(0, Math.round(Number(listing.price || 0)))),
      stockOrCapacity: Math.min(1000, Math.max(0, Math.floor(Number(listing.stockOrCapacity || 1)))),
      description: cleanDesc,
      status: listing.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE',
      visibility: 'PUBLIC',
      createdAtLabel: sanitizeStr(listing.createdAtLabel, 64, "Aujourd'hui"),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (listing.ownerRole === 'pro' || listing.ownerRole === 'store') {
      payload.ownerRole = listing.ownerRole;
    }
    if (listing.productCategory && VALID_PRODUCT_CATEGORIES.includes(listing.productCategory)) {
      payload.productCategory = listing.productCategory;
    }
    if (listing.rentalCategory && VALID_RENTAL_CATEGORIES.includes(listing.rentalCategory)) {
      payload.rentalCategory = listing.rentalCategory;
    }
    if (listing.storeId) {
      payload.storeId = sanitizeId(listing.storeId);
    }
    if (listing.storeName) {
      payload.storeName = sanitizeStr(listing.storeName, 100);
    }
    if (listing.specialtyTag) {
      payload.specialtyTag = sanitizeStr(listing.specialtyTag, 60);
    }
    if (typeof listing.deliveryAvailable === 'boolean') {
      payload.deliveryAvailable = listing.deliveryAvailable;
    }
    if (typeof listing.depositAmount === 'number' && listing.depositAmount > 0) {
      payload.depositAmount = Math.min(5000000, Math.round(listing.depositAmount));
    }
    if (typeof listing.locationEnabled === 'boolean') {
      payload.locationEnabled = listing.locationEnabled;
    }
    if (typeof listing.lat === 'number' && Number.isFinite(listing.lat) && listing.lat >= -90 && listing.lat <= 90) {
      payload.lat = Number(listing.lat.toFixed(6));
    }
    if (typeof listing.lng === 'number' && Number.isFinite(listing.lng) && listing.lng >= -180 && listing.lng <= 180) {
      payload.lng = Number(listing.lng.toFixed(6));
    }

    await setDoc(doc(db, 'vendor_listings', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateVendorListingInFirestore(listing: VendorListing): Promise<void> {
  const safeId = sanitizeId(listing.id);
  const path = `vendor_listings/${safeId}`;
  try {
    const payload: Record<string, unknown> = {
      title: sanitizeStr(listing.title, 120),
      category: sanitizeStr(listing.category, 60, 'Outdoor'),
      location: sanitizeStr(listing.location, 120, 'Libreville, Gabon'),
      price: Math.min(10000000, Math.max(0, Math.round(Number(listing.price || 0)))),
      stockOrCapacity: Math.min(1000, Math.max(0, Math.floor(Number(listing.stockOrCapacity || 0)))),
      description: sanitizeStr(listing.description, 600),
      status: listing.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE',
      updatedAt: serverTimestamp(),
    };
    if (listing.productCategory && VALID_PRODUCT_CATEGORIES.includes(listing.productCategory)) {
      payload.productCategory = listing.productCategory;
    }
    if (listing.rentalCategory && VALID_RENTAL_CATEGORIES.includes(listing.rentalCategory)) {
      payload.rentalCategory = listing.rentalCategory;
    }
    if (listing.storeId) {
      payload.storeId = sanitizeId(listing.storeId);
    }
    if (listing.storeName) {
      payload.storeName = sanitizeStr(listing.storeName, 100);
    }
    if (listing.specialtyTag) {
      payload.specialtyTag = sanitizeStr(listing.specialtyTag, 60);
    }
    if (typeof listing.deliveryAvailable === 'boolean') {
      payload.deliveryAvailable = listing.deliveryAvailable;
    }
    if (typeof listing.depositAmount === 'number' && listing.depositAmount >= 0) {
      payload.depositAmount = Math.min(5000000, Math.round(listing.depositAmount));
    }
    if (typeof listing.locationEnabled === 'boolean') {
      payload.locationEnabled = listing.locationEnabled;
    }
    if (typeof listing.lat === 'number' && Number.isFinite(listing.lat) && listing.lat >= -90 && listing.lat <= 90) {
      payload.lat = Number(listing.lat.toFixed(6));
    }
    if (typeof listing.lng === 'number' && Number.isFinite(listing.lng) && listing.lng >= -180 && listing.lng <= 180) {
      payload.lng = Number(listing.lng.toFixed(6));
    }
    await updateDoc(doc(db, 'vendor_listings', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteVendorListingFromFirestore(listingId: string): Promise<void> {
  const safeId = sanitizeId(listingId);
  const path = `vendor_listings/${safeId}`;
  try {
    await deleteDoc(doc(db, 'vendor_listings', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeVendorListings(
  onData: (listings: VendorListing[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'vendor_listings';
  const q = query(collection(db, 'vendor_listings'), where('visibility', '==', 'PUBLIC'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: VendorListing[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: data.id || d.id,
          ownerUserId: data.ownerUserId || '',
          ownerName: data.ownerName || 'Partenaire MANGOREMA',
          ownerRole: data.ownerRole === 'pro' || data.ownerRole === 'store' ? data.ownerRole : undefined,
          listingKind: VALID_LISTING_KINDS.includes(data.listingKind) ? data.listingKind : 'product',
          title: data.title || '',
          category: data.category || 'Outdoor',
          productCategory: VALID_PRODUCT_CATEGORIES.includes(data.productCategory) ? data.productCategory : undefined,
          rentalCategory: VALID_RENTAL_CATEGORIES.includes(data.rentalCategory) ? data.rentalCategory : undefined,
          storeId: typeof data.storeId === 'string' ? data.storeId : undefined,
          storeName: typeof data.storeName === 'string' ? data.storeName : undefined,
          specialtyTag: typeof data.specialtyTag === 'string' ? data.specialtyTag : undefined,
          deliveryAvailable: typeof data.deliveryAvailable === 'boolean' ? data.deliveryAvailable : undefined,
          location: data.location || 'Gabon',
          locationEnabled: typeof data.locationEnabled === 'boolean' ? data.locationEnabled : undefined,
          lat: typeof data.lat === 'number' && Number.isFinite(data.lat) ? data.lat : undefined,
          lng: typeof data.lng === 'number' && Number.isFinite(data.lng) ? data.lng : undefined,
          price: Number(data.price || 0),
          depositAmount: typeof data.depositAmount === 'number' ? data.depositAmount : undefined,
          stockOrCapacity: Number(data.stockOrCapacity || 0),
          description: data.description || '',
          status: data.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE',
          createdAtLabel: data.createdAtLabel || 'Récent',
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// =========================================================================
// PROFESSIONAL PROFILES (GUIDES, ORNITHOLOGUES, BOTANISTES, PISTEURS, ETC.)
// =========================================================================

const VALID_PRO_SPECIALTIES: ProfessionalSpecialty[] = [
  'guide_anpn',
  'ornithologue',
  'botaniste',
  'pisteur',
  'photographe',
  'ecoguide',
  'operateur',
  'autre',
];

function sanitizeStringArray(arr: unknown, maxItems: number, maxItemLen: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((v) => sanitizeStr(v, maxItemLen))
    .filter((s) => s.length > 0)
    .slice(0, maxItems);
}

export async function saveProProfileToFirestore(
  uid: string,
  profile: Omit<ProfessionalProfile, 'ownerUserId' | 'createdAtMs'>
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeId = sanitizeId(profile.id || `pro_${safeUid}`);
  const path = `pro_profiles/${safeId}`;

  const displayName = sanitizeStr(profile.displayName, 80);
  const title = sanitizeStr(profile.title, 100);
  const bio = sanitizeStr(profile.bio, 600);
  if (displayName.length < 2 || title.length < 2 || bio.length < 10) {
    throw new Error('Nom (>= 2 car.), titre (>= 2 car.) et bio (>= 10 car.) requis.');
  }

  const safePhoto = profile.photoUrl ? sanitizeStoredMediaUrl(profile.photoUrl) : '';
  const payload: Record<string, unknown> = {
    id: safeId,
    ownerUserId: safeUid,
    displayName,
    specialty: VALID_PRO_SPECIALTIES.includes(profile.specialty) ? profile.specialty : 'guide_anpn',
    title,
    certifications: sanitizeStringArray(profile.certifications, 8, 64),
    parks: sanitizeStringArray(profile.parks, 10, 64),
    languages: sanitizeStringArray(profile.languages, 8, 40),
    expertiseTags: sanitizeStringArray(profile.expertiseTags, 10, 60),
    dayRate: Math.min(5000000, Math.max(0, Math.round(Number(profile.dayRate || 0)))),
    availability:
      profile.availability === 'SUR_DEMANDE_24H' || profile.availability === 'COMPLET'
        ? profile.availability
        : 'DISPONIBLE',
    bio,
    status: profile.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE',
    visibility: 'PUBLIC',
    createdAtLabel: sanitizeStr(profile.createdAtLabel, 64, "Aujourd'hui"),
  };

  if (profile.customSpecialty) {
    payload.customSpecialty = sanitizeStr(profile.customSpecialty, 60);
  }
  if (profile.anpnLicense) {
    payload.anpnLicense = sanitizeStr(profile.anpnLicense, 60);
  }
  if (profile.availabilityNote) {
    payload.availabilityNote = sanitizeStr(profile.availabilityNote, 160);
  }
  if (safePhoto) {
    payload.photoUrl = safePhoto;
  }

  try {
    const docRef = doc(db, 'pro_profiles', safeId);
    const existingSnap = await getDoc(docRef);
    if (existingSnap.exists()) {
      const updatePayload: Record<string, unknown> = {
        displayName: payload.displayName,
        specialty: payload.specialty,
        customSpecialty: payload.customSpecialty || '',
        title: payload.title,
        anpnLicense: payload.anpnLicense || '',
        certifications: payload.certifications,
        parks: payload.parks,
        languages: payload.languages,
        expertiseTags: payload.expertiseTags,
        dayRate: payload.dayRate,
        availability: payload.availability,
        availabilityNote: payload.availabilityNote || '',
        bio: payload.bio,
        photoUrl: safePhoto || '',
        status: payload.status,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(docRef, updatePayload);
    } else {
      await setDoc(docRef, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeProProfiles(
  onData: (profiles: ProfessionalProfile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'pro_profiles';
  const q = query(collection(db, 'pro_profiles'), where('visibility', '==', 'PUBLIC'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ProfessionalProfile[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: data.id || d.id,
          ownerUserId: data.ownerUserId || '',
          displayName: data.displayName || 'Professionnel MANGOREMA',
          specialty: VALID_PRO_SPECIALTIES.includes(data.specialty) ? data.specialty : 'guide_anpn',
          customSpecialty: typeof data.customSpecialty === 'string' && data.customSpecialty ? data.customSpecialty : undefined,
          title: data.title || 'Guide Naturaliste',
          anpnLicense: typeof data.anpnLicense === 'string' && data.anpnLicense ? data.anpnLicense : undefined,
          certifications: Array.isArray(data.certifications) ? data.certifications : [],
          parks: Array.isArray(data.parks) ? data.parks : [],
          languages: Array.isArray(data.languages) ? data.languages : ['Français'],
          expertiseTags: Array.isArray(data.expertiseTags) ? data.expertiseTags : [],
          dayRate: Number(data.dayRate || 25000),
          availability:
            data.availability === 'SUR_DEMANDE_24H' || data.availability === 'COMPLET'
              ? data.availability
              : 'DISPONIBLE',
          availabilityNote: typeof data.availabilityNote === 'string' && data.availabilityNote ? data.availabilityNote : undefined,
          bio: data.bio || '',
          photoUrl: typeof data.photoUrl === 'string' && data.photoUrl ? sanitizeStoredMediaUrl(data.photoUrl) : undefined,
          status: data.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE',
          createdAtLabel: data.createdAtLabel || 'Récent',
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// =========================================================================
// STORE PROFILES (MAGASINS OUTDOOR & AGENCES DE LOCATION)
// =========================================================================

const VALID_STORE_TYPES: StoreCategory[] = [
  'outdoor_shop',
  'rental_agency',
  'optique_photo',
  'marine_nautique',
  'multi_sport',
];

export async function saveStoreProfileToFirestore(
  uid: string,
  store: Omit<StoreProfile, 'ownerUserId' | 'createdAtMs'>
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeId = sanitizeId(store.id || `store_${safeUid}`);
  const path = `store_profiles/${safeId}`;

  const storeName = sanitizeStr(store.storeName, 100);
  const cityZone = sanitizeStr(store.cityZone, 80);
  const pickupAddress = sanitizeStr(store.pickupAddress, 160);
  const openingHours = sanitizeStr(store.openingHours, 100);
  const description = sanitizeStr(store.description, 600);
  if (storeName.length < 2 || pickupAddress.length < 3 || description.length < 5) {
    throw new Error('Nom du magasin (>= 2 car.), adresse (>= 3 car.) et description (>= 5 car.) requis.');
  }

  const safeLogo = store.logoUrl ? sanitizeStoredMediaUrl(store.logoUrl) : '';
  const payload: Record<string, unknown> = {
    id: safeId,
    ownerUserId: safeUid,
    storeName,
    storeType: VALID_STORE_TYPES.includes(store.storeType) ? store.storeType : 'outdoor_shop',
    cityZone: cityZone.length >= 2 ? cityZone : 'Libreville, Gabon',
    pickupAddress,
    openingHours: openingHours.length >= 3 ? openingHours : 'Lun–Sam 08h30–18h30',
    deliveryAvailable: Boolean(store.deliveryAvailable),
    deliveryFee: Math.min(100000, Math.max(0, Math.round(Number(store.deliveryFee || 0)))),
    description,
    status: store.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE',
    visibility: 'PUBLIC',
    createdAtLabel: sanitizeStr(store.createdAtLabel, 64, "Aujourd'hui"),
  };

  if (store.deliveryZones) {
    payload.deliveryZones = sanitizeStr(store.deliveryZones, 160);
  }
  if (safeLogo) {
    payload.logoUrl = safeLogo;
  }

  try {
    const docRef = doc(db, 'store_profiles', safeId);
    const existingSnap = await getDoc(docRef);
    if (existingSnap.exists()) {
      await updateDoc(docRef, {
        storeName: payload.storeName,
        storeType: payload.storeType,
        cityZone: payload.cityZone,
        pickupAddress: payload.pickupAddress,
        openingHours: payload.openingHours,
        deliveryAvailable: payload.deliveryAvailable,
        deliveryFee: payload.deliveryFee,
        deliveryZones: payload.deliveryZones || '',
        description: payload.description,
        logoUrl: safeLogo || '',
        status: payload.status,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeStoreProfiles(
  onData: (stores: StoreProfile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'store_profiles';
  const q = query(collection(db, 'store_profiles'), where('visibility', '==', 'PUBLIC'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: StoreProfile[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: data.id || d.id,
          ownerUserId: data.ownerUserId || '',
          storeName: data.storeName || 'Magasin Partenaire',
          storeType: VALID_STORE_TYPES.includes(data.storeType) ? data.storeType : 'outdoor_shop',
          cityZone: data.cityZone || 'Libreville',
          pickupAddress: data.pickupAddress || '',
          openingHours: data.openingHours || 'Lun–Sam 08h30–18h30',
          deliveryAvailable: Boolean(data.deliveryAvailable),
          deliveryFee: Number(data.deliveryFee || 0),
          deliveryZones: typeof data.deliveryZones === 'string' && data.deliveryZones ? data.deliveryZones : undefined,
          description: data.description || '',
          logoUrl: typeof data.logoUrl === 'string' && data.logoUrl ? sanitizeStoredMediaUrl(data.logoUrl) : undefined,
          status: data.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE',
          createdAtLabel: data.createdAtLabel || 'Récent',
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// =========================================================================
// PRIVATE BUSINESS SETTLEMENT SETTINGS (/users/{uid}/business_settings)
// =========================================================================

export async function saveBusinessSettingsToFirestore(
  uid: string,
  settings: Omit<BusinessSettlementSettings, 'userId'>
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeId = settings.id === 'store' ? 'store' : 'professional';
  const path = `users/${safeUid}/business_settings/${safeId}`;

  const docRef = doc(db, 'users', safeUid, 'business_settings', safeId);
  const payload = {
    id: safeId,
    userId: safeUid,
    payoutOperator:
      settings.payoutOperator === 'MOOV' ||
      settings.payoutOperator === 'GHETTOPAY' ||
      settings.payoutOperator === 'BANK'
        ? settings.payoutOperator
        : 'AIRTEL',
    payoutAccountPhone: sanitizeStr(settings.payoutAccountPhone, 40),
    businessRegNumber: sanitizeStr(settings.businessRegNumber, 64),
    emergencyContact: sanitizeStr(settings.emergencyContact, 80),
    autoAcceptBookings: Boolean(settings.autoAcceptBookings),
    updatedAtLabel: sanitizeStr(settings.updatedAtLabel, 64, "Aujourd'hui"),
  };

  try {
    const existingSnap = await getDoc(docRef);
    if (existingSnap.exists()) {
      await updateDoc(docRef, {
        payoutOperator: payload.payoutOperator,
        payoutAccountPhone: payload.payoutAccountPhone,
        businessRegNumber: payload.businessRegNumber,
        emergencyContact: payload.emergencyContact,
        autoAcceptBookings: payload.autoAcceptBookings,
        updatedAtLabel: payload.updatedAtLabel,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeBusinessSettings(
  uid: string,
  onData: (settings: Partial<Record<'professional' | 'store', BusinessSettlementSettings>>) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeUid = sanitizeId(uid);
  const path = `users/${safeUid}/business_settings`;
  const q = query(collection(db, 'users', safeUid, 'business_settings'), where('userId', '==', safeUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const result: Partial<Record<'professional' | 'store', BusinessSettlementSettings>> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        const key = data.id === 'store' ? 'store' : 'professional';
        result[key] = {
          id: key,
          userId: data.userId || safeUid,
          payoutOperator:
            data.payoutOperator === 'MOOV' ||
            data.payoutOperator === 'GHETTOPAY' ||
            data.payoutOperator === 'BANK'
              ? data.payoutOperator
              : 'AIRTEL',
          payoutAccountPhone: data.payoutAccountPhone || '',
          businessRegNumber: typeof data.businessRegNumber === 'string' ? data.businessRegNumber : '',
          emergencyContact: typeof data.emergencyContact === 'string' ? data.emergencyContact : '',
          autoAcceptBookings: Boolean(data.autoAcceptBookings),
          updatedAtLabel: typeof data.updatedAtLabel === 'string' ? data.updatedAtLabel : undefined,
        };
      });
      onData(result);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// =========================================================================
// PUBLIC EXPLORER DIRECTORY (/public_profiles) & PROFILE AVATAR STORAGE
// =========================================================================

async function uploadBlobToStoragePath(
  storagePath: string,
  photoBlob: Blob,
  metadata: Record<string, string>,
  onProgress?: (percent: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  if (!photoBlob || photoBlob.size === 0) {
    throw new Error('La photo sélectionnée est vide. Veuillez réessayer.');
  }
  if (photoBlob.size > MAX_PROOF_PHOTO_BYTES) {
    throw new Error('La photo dépasse la limite maximale de 6 Mo.');
  }

  const fileRef = storageRef(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, photoBlob, {
      contentType: photoBlob.type && photoBlob.type.startsWith('image/') ? photoBlob.type : 'image/jpeg',
      customMetadata: metadata,
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.min(100, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          onProgress(pct);
        }
      },
      (err) => {
        const code = (err as { code?: string }).code || '';
        if (code === 'storage/unauthorized') {
          reject(
            new Error(
              'Accès Firebase Storage refusé (storage/unauthorized). Vérifiez vos permissions Storage.'
            )
          );
          return;
        }
        if (code === 'storage/canceled') {
          reject(new Error('Téléversement de la photo annulé.'));
          return;
        }
        reject(
          new Error(
            `Impossible d'envoyer la photo vers Firebase Storage (${err.message || 'erreur réseau'}).`
          )
        );
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const safeUrl = sanitizeStoredMediaUrl(downloadUrl);
          if (!safeUrl) {
            reject(new Error('URL de photo retournée invalide.'));
            return;
          }
          resolve({
            downloadUrl: safeUrl.slice(0, 1000),
            storagePath: sanitizeStr(storagePath, 300),
          });
        } catch (urlErr) {
          reject(
            new Error(
              urlErr instanceof Error
                ? `Photo envoyée, mais URL inaccessible : ${urlErr.message}`
                : 'Impossible de récupérer le lien Firebase Storage.'
            )
          );
        }
      }
    );
  });
}

const SAFE_MEDIA_CLEANUP_RE =
  /^(eco-challenge-proofs|site-contributions|profile-avatars|direct-chat-media)\/[a-zA-Z0-9_.\-/]+$/;

export async function deleteStoredMediaPath(storagePath?: string): Promise<void> {
  if (!storagePath || typeof storagePath !== 'string') return;
  if (!SAFE_MEDIA_CLEANUP_RE.test(storagePath) || storagePath.includes('..')) return;
  try {
    await deleteObject(storageRef(storage, storagePath));
  } catch {
    // Non-blocking cleanup if already deleted
  }
}

export async function uploadProfileAvatarPhoto(
  uid: string,
  photoBlob: Blob,
  onProgress?: (percent: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  const safeUid = sanitizeId(uid);
  const path = `profile-avatars/${safeUid}/avatar-${Date.now()}.jpg`;
  return uploadBlobToStoragePath(path, photoBlob, { uid: safeUid }, onProgress);
}

export async function syncPublicExplorerProfile(
  uid: string,
  profile: UserProfile,
  contributionsCountOverride?: number
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const path = `public_profiles/${safeUid}`;
  const docRef = doc(db, 'public_profiles', safeUid);

  const safeAvatar = sanitizeStoredMediaUrl(profile.avatar);
  const displayName = sanitizeStr(profile.name, 100, 'Explorateur MANGOREMA');
  const role = sanitizeStr(profile.role, 80, 'Écotouriste Gabon');
  const bio = sanitizeStr(profile.bio, 400);
  const homeCity = sanitizeStr(profile.homeCity, 80, 'Libreville, Gabon');
  const favoritePark = sanitizeStr(profile.favoritePark, 100);
  const ecoPoints = Math.max(0, Math.round(Number(profile.ecoPoints) || 0));
  const isDiscoverable = profile.publicDiscoverable !== false;

  try {
    const snap = await getDoc(docRef);
    const existingCount =
      snap.exists() && typeof snap.data()?.contributionsCount === 'number'
        ? Math.max(0, Math.floor(Number(snap.data().contributionsCount)))
        : 0;
    const contributionsCount =
      typeof contributionsCountOverride === 'number'
        ? Math.max(0, Math.floor(contributionsCountOverride))
        : existingCount;

    if (snap.exists()) {
      await updateDoc(docRef, {
        displayName,
        role,
        bio,
        homeCity,
        favoritePark,
        avatarUrl: safeAvatar ? safeAvatar.slice(0, 1000) : '',
        ecoPoints,
        contributionsCount,
        isDiscoverable,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        uid: safeUid,
        displayName,
        role,
        bio,
        homeCity,
        favoritePark,
        avatarUrl: safeAvatar ? safeAvatar.slice(0, 1000) : '',
        ecoPoints,
        contributionsCount,
        isDiscoverable,
        visibility: 'PUBLIC',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribePublicProfiles(
  onData: (profiles: PublicExplorerProfile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'public_profiles';
  const q = query(collection(db, 'public_profiles'), where('visibility', '==', 'PUBLIC'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: PublicExplorerProfile[] = snapshot.docs.map((d) => {
        const data = d.data();
        const updatedVal = data.updatedAt as { toMillis?: () => number } | undefined;
        const createdVal = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          uid: data.uid || d.id,
          displayName: data.displayName || 'Explorateur MANGOREMA',
          role: typeof data.role === 'string' && data.role ? data.role : undefined,
          bio: typeof data.bio === 'string' && data.bio ? data.bio : undefined,
          homeCity: typeof data.homeCity === 'string' && data.homeCity ? data.homeCity : undefined,
          favoritePark: typeof data.favoritePark === 'string' && data.favoritePark ? data.favoritePark : undefined,
          avatarUrl: sanitizeStoredMediaUrl(typeof data.avatarUrl === 'string' ? data.avatarUrl : undefined),
          ecoPoints: Math.max(0, Number(data.ecoPoints || 0)),
          contributionsCount: Math.max(0, Math.floor(Number(data.contributionsCount || 0))),
          isDiscoverable: data.isDiscoverable !== false,
          createdAtMs: typeof createdVal?.toMillis === 'function' ? createdVal.toMillis() : undefined,
          updatedAtMs: typeof updatedVal?.toMillis === 'function' ? updatedVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// =========================================================================
// GABON SITE CONTRIBUTIONS & PHOTO GALLERIES (/site_contributions)
// =========================================================================
const VALID_CONTRIBUTION_TYPES: SiteContributionType[] = [
  'PHOTO',
  'OBSERVATION',
  'TRAIL_TIP',
  'CAMP_INFO',
];

export async function uploadSiteContributionPhoto(
  uid: string,
  contributionId: string,
  photoBlob: Blob,
  onProgress?: (percent: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  const safeUid = sanitizeId(uid);
  const safeId = sanitizeId(contributionId);
  const path = `site-contributions/${safeUid}/${safeId}-${Date.now()}.jpg`;
  return uploadBlobToStoragePath(
    path,
    photoBlob,
    { uid: safeUid, contributionId: safeId },
    onProgress
  );
}

export async function saveSiteContributionToFirestore(
  uid: string,
  contribution: Omit<SiteContribution, 'userId' | 'createdAtMs'>
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeId = sanitizeId(contribution.id);
  const path = `site_contributions/${safeId}`;

  const title = sanitizeStr(contribution.title, 120);
  const description = sanitizeStr(contribution.description, 800);
  if (title.length < 2 || description.length < 2) {
    throw new Error('Veuillez saisir un titre (>= 2 car.) et une description (>= 2 car.).');
  }

  const safeType: SiteContributionType = VALID_CONTRIBUTION_TYPES.includes(contribution.contributionType)
    ? contribution.contributionType
    : 'PHOTO';

  const payload: Record<string, unknown> = {
    id: safeId,
    userId: safeUid,
    authorName: sanitizeStr(contribution.authorName, 80, 'Explorateur MANGOREMA'),
    parkId: sanitizeId(contribution.parkId || 'mondah'),
    parkName: sanitizeStr(contribution.parkName, 120, 'Parc National du Gabon'),
    contributionType: safeType,
    title,
    description,
    visibility: 'PUBLIC',
    createdAtLabel: sanitizeStr(contribution.createdAtLabel, 64, "Aujourd'hui"),
    createdAt: serverTimestamp(),
  };

  const cleanAvatar = sanitizeStoredMediaUrl(contribution.authorAvatar);
  if (cleanAvatar) payload.authorAvatar = cleanAvatar.slice(0, 1000);
  if (contribution.zoneLabel) payload.zoneLabel = sanitizeStr(contribution.zoneLabel, 120);

  const safePhoto = sanitizeStoredMediaUrl(contribution.photoUrl);
  if (safePhoto) payload.photoUrl = safePhoto.slice(0, 1000);
  if (
    contribution.storagePath &&
    contribution.storagePath.startsWith(`site-contributions/${safeUid}/`) &&
    !contribution.storagePath.includes('..')
  ) {
    payload.storagePath = sanitizeStr(contribution.storagePath, 300);
  }

  try {
    await setDoc(doc(db, 'site_contributions', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteSiteContributionFromFirestore(
  contributionId: string,
  storagePath?: string
): Promise<void> {
  const safeId = sanitizeId(contributionId);
  const path = `site_contributions/${safeId}`;
  try {
    await deleteDoc(doc(db, 'site_contributions', safeId));
    if (storagePath) {
      await deleteStoredMediaPath(storagePath);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeSiteContributions(
  onData: (items: SiteContribution[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'site_contributions';
  const q = query(collection(db, 'site_contributions'), where('visibility', '==', 'PUBLIC'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: SiteContribution[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: data.id || d.id,
          userId: data.userId || '',
          authorName: data.authorName || 'Explorateur MANGOREMA',
          authorAvatar: sanitizeStoredMediaUrl(typeof data.authorAvatar === 'string' ? data.authorAvatar : undefined),
          parkId: data.parkId || 'mondah',
          parkName: data.parkName || 'Parc National du Gabon',
          zoneLabel: typeof data.zoneLabel === 'string' && data.zoneLabel ? data.zoneLabel : undefined,
          contributionType: VALID_CONTRIBUTION_TYPES.includes(data.contributionType)
            ? data.contributionType
            : 'PHOTO',
          title: data.title || 'Contribution terrain',
          description: data.description || '',
          photoUrl: sanitizeStoredMediaUrl(typeof data.photoUrl === 'string' ? data.photoUrl : undefined),
          storagePath: typeof data.storagePath === 'string' ? data.storagePath : undefined,
          createdAtLabel: data.createdAtLabel || 'Récent',
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// =========================================================================
// USER-SUBMITTED GABON SITES & SITE TYPES (/submitted_sites)
// =========================================================================
const VALID_SUBMITTED_SITE_TYPES: SubmittedSiteType[] = [
  'PARC_NATIONAL',
  'RESERVE_NATURELLE',
  'CASCADE_CHUTE',
  'PLAGE_LAGUNE',
  'MONTAGNE_SOMMET',
  'SENTIER_FORET',
  'MANGROVE_ZONE_HUMIDE',
  'ECOLODGE_CAMP',
  'SITE_CULTUREL',
];

const VALID_SUBMITTED_DIFFICULTIES: SubmittedSiteDifficulty[] = [
  'Facile',
  'Modéré',
  'Difficile',
];

export async function uploadSubmittedSitePhoto(
  uid: string,
  siteId: string,
  photoBlob: Blob,
  onProgress?: (percent: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  const safeUid = sanitizeId(uid);
  const safeId = sanitizeId(siteId);
  const path = `site-contributions/${safeUid}/site-${safeId}-${Date.now()}.jpg`;
  return uploadBlobToStoragePath(
    path,
    photoBlob,
    { uid: safeUid, siteId: safeId },
    onProgress
  );
}

export async function saveSubmittedSiteToFirestore(
  uid: string,
  site: Omit<SubmittedSite, 'userId' | 'createdAtMs'>
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safeId = sanitizeId(site.id);
  const path = `submitted_sites/${safeId}`;

  const siteName = sanitizeStr(site.siteName, 120);
  const province = sanitizeStr(site.province, 80);
  const description = sanitizeStr(site.description, 800);
  if (siteName.length < 2) {
    throw new Error('Veuillez indiquer le nom du site (minimum 2 caractères).');
  }
  if (province.length < 2) {
    throw new Error('Veuillez sélectionner la province du site.');
  }
  if (description.length < 5) {
    throw new Error('Veuillez décrire le site en au moins 5 caractères.');
  }

  const safeSiteType: SubmittedSiteType = VALID_SUBMITTED_SITE_TYPES.includes(site.siteType)
    ? site.siteType
    : 'PARC_NATIONAL';
  const safeDifficulty: SubmittedSiteDifficulty = VALID_SUBMITTED_DIFFICULTIES.includes(site.difficulty)
    ? site.difficulty
    : 'Modéré';

  const payload: Record<string, unknown> = {
    id: safeId,
    userId: safeUid,
    authorName: sanitizeStr(site.authorName, 80, 'Explorateur MANGOREMA'),
    siteName,
    siteType: safeSiteType,
    province,
    difficulty: safeDifficulty,
    description,
    status: site.status === 'PUBLISHED' ? 'PUBLISHED' : 'PENDING_REVIEW',
    visibility: 'PUBLIC',
    createdAtLabel: sanitizeStr(site.createdAtLabel, 64, "Aujourd'hui"),
    createdAt: serverTimestamp(),
  };

  const cleanAvatar = sanitizeStoredMediaUrl(site.authorAvatar);
  if (cleanAvatar) payload.authorAvatar = cleanAvatar.slice(0, 1000);
  if (site.locationLabel) payload.locationLabel = sanitizeStr(site.locationLabel, 120);

  const safePhoto = sanitizeStoredMediaUrl(site.photoUrl);
  if (safePhoto) payload.photoUrl = safePhoto.slice(0, 1000);
  if (
    site.storagePath &&
    site.storagePath.startsWith(`site-contributions/${safeUid}/`) &&
    !site.storagePath.includes('..')
  ) {
    payload.storagePath = sanitizeStr(site.storagePath, 300);
  }

  try {
    await setDoc(doc(db, 'submitted_sites', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteSubmittedSiteFromFirestore(
  siteId: string,
  storagePath?: string
): Promise<void> {
  const safeId = sanitizeId(siteId);
  const path = `submitted_sites/${safeId}`;
  try {
    await deleteDoc(doc(db, 'submitted_sites', safeId));
    if (storagePath) {
      await deleteStoredMediaPath(storagePath);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeSubmittedSites(
  onData: (sites: SubmittedSite[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'submitted_sites';
  const q = query(collection(db, 'submitted_sites'), where('visibility', '==', 'PUBLIC'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: SubmittedSite[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: data.id || d.id,
          userId: data.userId || '',
          authorName: data.authorName || 'Explorateur MANGOREMA',
          authorAvatar: sanitizeStoredMediaUrl(typeof data.authorAvatar === 'string' ? data.authorAvatar : undefined),
          siteName: data.siteName || 'Site naturel du Gabon',
          siteType: VALID_SUBMITTED_SITE_TYPES.includes(data.siteType)
            ? data.siteType
            : 'PARC_NATIONAL',
          province: data.province || 'Estuaire',
          locationLabel: typeof data.locationLabel === 'string' && data.locationLabel ? data.locationLabel : undefined,
          difficulty: VALID_SUBMITTED_DIFFICULTIES.includes(data.difficulty)
            ? data.difficulty
            : 'Modéré',
          description: data.description || '',
          photoUrl: sanitizeStoredMediaUrl(typeof data.photoUrl === 'string' ? data.photoUrl : undefined),
          storagePath: typeof data.storagePath === 'string' ? data.storagePath : undefined,
          status: data.status === 'PUBLISHED' ? 'PUBLISHED' : 'PENDING_REVIEW',
          createdAtLabel: data.createdAtLabel || 'Récent',
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// =========================================================================
// REAL-TIME 1-TO-1 PRIVATE CHAT (/direct_chats/{chatId}/messages/{messageId})
// =========================================================================

export function buildDirectChatId(uid1: string, uid2: string): string {
  const a = sanitizeId(uid1);
  const b = sanitizeId(uid2);
  const [first, second] = a < b ? [a, b] : [b, a];
  return `dm_${first}__${second}`.slice(0, 128);
}

export async function uploadDirectChatPhoto(
  chatId: string,
  uid: string,
  photoBlob: Blob,
  onProgress?: (percent: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  const safeChatId = sanitizeId(chatId);
  const safeUid = sanitizeId(uid);
  const path = `direct-chat-media/${safeChatId}/${safeUid}/img-${Date.now()}.jpg`;
  return uploadBlobToStoragePath(
    path,
    photoBlob,
    { chatId: safeChatId, uid: safeUid },
    onProgress
  );
}

export interface SendDirectChatParams {
  senderUid: string;
  senderName: string;
  senderAvatar?: string;
  recipientUid: string;
  recipientName: string;
  recipientAvatar?: string;
  text: string;
  photoUrl?: string;
  storagePath?: string;
  createdAtLabel: string;
}

export async function sendDirectChatMessage(params: SendDirectChatParams): Promise<string> {
  const senderId = sanitizeId(params.senderUid);
  const recipientId = sanitizeId(params.recipientUid);
  if (!senderId || !recipientId || senderId === recipientId) {
    throw new Error('Destinataire invalide pour une conversation privée.');
  }

  const cleanText = sanitizeStr(params.text, 1000);
  const safePhoto = sanitizeStoredMediaUrl(params.photoUrl);
  if (!cleanText && !safePhoto) {
    throw new Error('Veuillez saisir un message ou joindre une photo.');
  }

  const [uidA, uidB] = senderId < recipientId ? [senderId, recipientId] : [recipientId, senderId];
  const chatId = buildDirectChatId(uidA, uidB);
  const msgId = sanitizeId(`dmsg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

  const senderIsA = senderId === uidA;
  const participantAName = sanitizeStr(senderIsA ? params.senderName : params.recipientName, 100, 'Explorateur');
  const participantBName = sanitizeStr(senderIsA ? params.recipientName : params.senderName, 100, 'Explorateur');
  const participantAAvatar = sanitizeStoredMediaUrl(senderIsA ? params.senderAvatar : params.recipientAvatar) || '';
  const participantBAvatar = sanitizeStoredMediaUrl(senderIsA ? params.recipientAvatar : params.senderAvatar) || '';

  const previewText = sanitizeStr(cleanText || 'Photo partagée', 500, 'Message privé');
  const timeLabel = sanitizeStr(params.createdAtLabel, 64, "À l'instant");

  const chatRef = doc(db, 'direct_chats', chatId);
  const msgRef = doc(db, 'direct_chats', chatId, 'messages', msgId);

  try {
    const chatSnap = await getDoc(chatRef);
    const batch = writeBatch(db);

    if (chatSnap.exists()) {
      batch.update(chatRef, {
        participantAName,
        participantBName,
        participantAAvatar: participantAAvatar.slice(0, 1000),
        participantBAvatar: participantBAvatar.slice(0, 1000),
        lastMessageText: previewText,
        lastMessageSenderId: senderId,
        lastMessageAtLabel: timeLabel,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(chatRef, {
        id: chatId,
        participantUids: [uidA, uidB],
        participantAId: uidA,
        participantBId: uidB,
        participantAName,
        participantBName,
        participantAAvatar: participantAAvatar.slice(0, 1000),
        participantBAvatar: participantBAvatar.slice(0, 1000),
        lastMessageText: previewText,
        lastMessageSenderId: senderId,
        lastMessageAtLabel: timeLabel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const msgPayload: Record<string, unknown> = {
      id: msgId,
      chatId,
      senderId,
      senderName: sanitizeStr(params.senderName, 80, 'Explorateur'),
      participantUids: [uidA, uidB],
      text: cleanText,
      createdAtLabel: timeLabel,
      createdAt: serverTimestamp(),
    };

    const cleanSenderAvatar = sanitizeStoredMediaUrl(params.senderAvatar);
    if (cleanSenderAvatar) msgPayload.senderAvatar = cleanSenderAvatar.slice(0, 1000);
    if (safePhoto) msgPayload.photoUrl = safePhoto.slice(0, 1000);
    if (
      params.storagePath &&
      params.storagePath.startsWith(`direct-chat-media/${chatId}/${senderId}/`) &&
      !params.storagePath.includes('..')
    ) {
      msgPayload.storagePath = sanitizeStr(params.storagePath, 300);
    }

    batch.set(msgRef, msgPayload);
    await batch.commit();
    return chatId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `direct_chats/${chatId}/messages/${msgId}`);
  }
}

export async function deleteDirectChatMessage(
  chatId: string,
  messageId: string,
  storagePath?: string
): Promise<void> {
  const safeChatId = sanitizeId(chatId);
  const safeMsgId = sanitizeId(messageId);
  const path = `direct_chats/${safeChatId}/messages/${safeMsgId}`;
  try {
    await deleteDoc(doc(db, 'direct_chats', safeChatId, 'messages', safeMsgId));
    if (storagePath) {
      await deleteStoredMediaPath(storagePath);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserDirectChats(
  uid: string,
  onData: (chats: DirectChat[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeUid = sanitizeId(uid);
  const path = 'direct_chats';
  const q = query(collection(db, 'direct_chats'), where('participantUids', 'array-contains', safeUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: DirectChat[] = snapshot.docs.map((d) => {
        const data = d.data();
        const updatedAtVal = data.updatedAt as { toMillis?: () => number } | undefined;
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        const pUids: [string, string] =
          Array.isArray(data.participantUids) && data.participantUids.length === 2
            ? [String(data.participantUids[0]), String(data.participantUids[1])]
            : [String(data.participantAId || ''), String(data.participantBId || '')];
        return {
          id: data.id || d.id,
          participantUids: pUids,
          participantAId: String(data.participantAId || pUids[0]),
          participantBId: String(data.participantBId || pUids[1]),
          participantAName: data.participantAName || 'Explorateur',
          participantBName: data.participantBName || 'Explorateur',
          participantAAvatar: sanitizeStoredMediaUrl(typeof data.participantAAvatar === 'string' ? data.participantAAvatar : undefined),
          participantBAvatar: sanitizeStoredMediaUrl(typeof data.participantBAvatar === 'string' ? data.participantBAvatar : undefined),
          lastMessageText: data.lastMessageText || '',
          lastMessageSenderId: data.lastMessageSenderId || '',
          lastMessageAtLabel: data.lastMessageAtLabel || 'Récent',
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : undefined,
          updatedAtMs: typeof updatedAtVal?.toMillis === 'function' ? updatedAtVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export function subscribeDirectChatMessages(
  chatId: string,
  viewerUid: string,
  onData: (messages: DirectChatMessage[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeChatId = sanitizeId(chatId);
  const safeUid = sanitizeId(viewerUid);
  const path = `direct_chats/${safeChatId}/messages`;
  const q = query(
    collection(db, 'direct_chats', safeChatId, 'messages'),
    where('participantUids', 'array-contains', safeUid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: DirectChatMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtVal = data.createdAt as { toMillis?: () => number } | undefined;
        const pUids: [string, string] =
          Array.isArray(data.participantUids) && data.participantUids.length === 2
            ? [String(data.participantUids[0]), String(data.participantUids[1])]
            : [safeUid, ''];
        return {
          id: data.id || d.id,
          chatId: data.chatId || safeChatId,
          senderId: data.senderId || '',
          senderName: data.senderName || 'Explorateur',
          senderAvatar: sanitizeStoredMediaUrl(typeof data.senderAvatar === 'string' ? data.senderAvatar : undefined),
          participantUids: pUids,
          text: typeof data.text === 'string' ? data.text : '',
          photoUrl: sanitizeStoredMediaUrl(typeof data.photoUrl === 'string' ? data.photoUrl : undefined),
          storagePath: typeof data.storagePath === 'string' ? data.storagePath : undefined,
          createdAtLabel: data.createdAtLabel || 'Récent',
          createdAtMs: typeof createdAtVal?.toMillis === 'function' ? createdAtVal.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}
