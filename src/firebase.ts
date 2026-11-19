/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile, Booking, SafetyIncident, ExpeditionReview, EcoChallengeCompletion } from './types';
import { computeEcoProgress } from './data/ecoChallenges';

// Initialize Firebase SDK with provisioned applet configuration
const app = initializeApp(firebaseConfig);
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(
    app,
    { experimentalForceLongPolling: true },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}
export const db = dbInstance;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
// Google Auth Helpers
// =========================================================================
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// =========================================================================
// Defensive Payload Sanitizers (Synchronized with firebase-blueprint.json)
// =========================================================================
const VALID_SUBSCRIPTIONS = [
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
      return {
        ...fallbackProfile,
        name: typeof data.name === 'string' ? data.name : fallbackProfile.name,
        role: typeof data.role === 'string' ? data.role : fallbackProfile.role,
        phone: typeof data.phone === 'string' ? data.phone : fallbackProfile.phone,
        avatar: typeof data.avatar === 'string' && data.avatar ? data.avatar : (firebaseUser.photoURL || fallbackProfile.avatar),
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
    }

    const newProfilePayload = {
      uid,
      name: sanitizeStr(firebaseUser.displayName || fallbackProfile.name, 100, 'Explorateur MANGOREMA'),
      role: sanitizeStr(fallbackProfile.role, 80, 'Écotouriste Gabon'),
      phone: sanitizeStr(fallbackProfile.phone, 40, '+241 74 12 34 56'),
      email: sanitizeStr(firebaseUser.email || '', 160),
      avatar: sanitizeStr(firebaseUser.photoURL || fallbackProfile.avatar, 500),
      totalKm: Math.max(0, Number(fallbackProfile.totalKm) || 0),
      totalAscent: Math.max(0, Number(fallbackProfile.totalAscent) || 0),
      stepsCount: Math.max(0, Math.floor(Number(fallbackProfile.stepsCount) || 0)),
      subscription: VALID_SUBSCRIPTIONS.includes(fallbackProfile.subscription)
        ? fallbackProfile.subscription
        : 'Club Medium (1 000 F)',
      favoritePhotoIds: (fallbackProfile.favoritePhotoIds || []).slice(0, 20).map((id) => sanitizeStr(id, 128)),
      topThreePhotoIds: (fallbackProfile.topThreePhotoIds || []).filter(Boolean).slice(0, 3).map((id) => sanitizeStr(id, 128)),
      ecoPoints: 0,
      zeroWasteExpeditionsCount: 0,
      unlockedBadgeIds: [] as string[],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, newProfilePayload);
    return {
      ...fallbackProfile,
      name: newProfilePayload.name,
      avatar: newProfilePayload.avatar,
      ecoPoints: 0,
      zeroWasteExpeditionsCount: 0,
      unlockedBadgeIds: [],
    };
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
    await updateDoc(userRef, {
      name: sanitizeStr(profile.name, 100, 'Explorateur'),
      role: sanitizeStr(profile.role, 80, 'Écotouriste'),
      phone: sanitizeStr(profile.phone, 40),
      avatar: sanitizeStr(profile.avatar, 500),
      totalKm: Math.max(0, Number(profile.totalKm) || 0),
      totalAscent: Math.max(0, Number(profile.totalAscent) || 0),
      stepsCount: Math.max(0, Math.floor(Number(profile.stepsCount) || 0)),
      subscription: VALID_SUBSCRIPTIONS.includes(profile.subscription)
        ? profile.subscription
        : 'Club Medium (1 000 F)',
      favoritePhotoIds: (profile.favoritePhotoIds || []).slice(0, 20).map((id) => sanitizeStr(id, 128)),
      topThreePhotoIds: (profile.topThreePhotoIds || []).filter(Boolean).slice(0, 3).map((id) => sanitizeStr(id, 128)),
      ecoPoints: Math.max(0, Math.round(Number(profile.ecoPoints) || 0)),
      zeroWasteExpeditionsCount: Math.max(0, Math.floor(Number(profile.zeroWasteExpeditionsCount) || 0)),
      unlockedBadgeIds: (profile.unlockedBadgeIds || []).slice(0, 30).map((id) => sanitizeStr(id, 64)),
      updatedAt: serverTimestamp(),
    });
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
      paymentMethod: booking.paymentMethod === 'MOOV' ? 'MOOV' : 'AIRTEL',
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
          paymentMethod: data.paymentMethod === 'MOOV' ? 'MOOV' : 'AIRTEL',
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

    const cleanAvatar = sanitizeStr(review.authorAvatar, 500);
    if (cleanAvatar) {
      payload.authorAvatar = cleanAvatar;
    }

    const cleanPhoto = sanitizeStr(review.photoUrl, 500);
    if (cleanPhoto) {
      payload.photoUrl = cleanPhoto;
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
          authorAvatar: typeof data.authorAvatar === 'string' ? data.authorAvatar : undefined,
          rating: Math.min(5, Math.max(1, Number(data.rating || 5))),
          comment: data.comment || '',
          photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : undefined,
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
// Ecological Zero-Waste Challenges & Virtual Badges Sync (Atomic Batch)
// =========================================================================
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
  remainingCompletions: EcoChallengeCompletion[]
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


