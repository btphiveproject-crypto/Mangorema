/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Booking, ShuttleService, ScheduledNotification, NotificationPermissionStatus } from '../types';
import { parseEventDate } from './calendar';

const NOTIFICATIONS_STORAGE_KEY = 'mangorema_scheduled_notifications_v1';
const PANGOLIN_LOGO_URL = '/assets/aistudio/Gemini_Generated_Image_vn51dfvn51dfvn51__1__8a19ee16.jpeg';

/**
 * Checks if the Web Notification API is supported in current environment
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current permission status ('granted', 'denied', 'default', or 'unsupported')
 */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Requests permission from the browser/user to display Web Notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch (err) {
    console.warn('Erreur lors de la demande de permission de notification:', err);
    return 'denied';
  }
}

/**
 * Plays an organic gentle equatorial notification chime using Web Audio API
 * (Synthesized locally, 100% offline, zero network dependency)
 */
export function playForestAlertChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    
    // First harmonious tone (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Second harmonious tone (A5 - 880 Hz) - 120ms later
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.8);
  } catch (e) {
    // AudioContext might be blocked until user gesture, safely ignore
  }
}

/**
 * Sends a native Web Notification if permissions allow
 */
export function sendWebNotification(
  title: string,
  options?: {
    body?: string;
    tag?: string;
    data?: unknown;
    requireInteraction?: boolean;
  }
): boolean {
  playForestAlertChime();

  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: options?.body,
        icon: PANGOLIN_LOGO_URL,
        badge: PANGOLIN_LOGO_URL,
        tag: options?.tag || `mangorema-alert-${Date.now()}`,
        requireInteraction: options?.requireInteraction ?? false,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      return true;
    } catch (err) {
      console.warn('Impossible de créer la notification native Web Notification:', err);
      return false;
    }
  }

  return false;
}

/**
 * Extracts departure time (hours & minutes) from shuttle details or defaults to 06:30
 */
function extractTimeFromText(text: string, defaultHour = 6, defaultMinute = 30): { hours: number; minutes: number } {
  // Matches "06h30", "6h30", "07:00", "14h"
  const match = text.match(/(\d{1,2})[h:](\d{2})?/i);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    return { hours, minutes };
  }
  return { hours: defaultHour, minutes: defaultMinute };
}

/**
 * Calculates departure timestamp and exact H-1 (60 minutes prior) timestamp
 */
export function calculateExpeditionTimestamps(booking: Booking): {
  departureTimestamp: number;
  scheduledTimestamp: number;
  departureFormatted: string;
  alertFormatted: string;
} {
  const { start } = parseEventDate(booking.eventDate);
  const timeInfo = extractTimeFromText(booking.shuttleDetail || '', 6, 30);
  
  start.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
  const departureTimestamp = start.getTime();
  
  // Exactly 1 hour before departure (60 minutes = 3600000 ms)
  const scheduledTimestamp = departureTimestamp - 60 * 60 * 1000;

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  };

  const departureFormatted = new Intl.DateTimeFormat('fr-FR', dateOptions).format(new Date(departureTimestamp));
  const alertFormatted = new Intl.DateTimeFormat('fr-FR', dateOptions).format(new Date(scheduledTimestamp));

  return {
    departureTimestamp,
    scheduledTimestamp,
    departureFormatted,
    alertFormatted,
  };
}

/**
 * Calculates departure timestamp and H-1 timestamp for a shuttle service
 */
export function calculateShuttleTimestamps(shuttle: ShuttleService, travelDate?: Date): {
  departureTimestamp: number;
  scheduledTimestamp: number;
  departureFormatted: string;
  alertFormatted: string;
} {
  const baseDate = travelDate || new Date();
  // If travel date is today and time has passed, set for next day or upcoming Saturday
  const timeInfo = extractTimeFromText(shuttle.departureTime, 6, 30);

  const departureDate = new Date(baseDate);
  departureDate.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);

  // If time is in the past for today, set to tomorrow
  if (departureDate.getTime() < Date.now()) {
    departureDate.setDate(departureDate.getDate() + 1);
  }

  const departureTimestamp = departureDate.getTime();
  const scheduledTimestamp = departureTimestamp - 60 * 60 * 1000;

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  };

  const departureFormatted = new Intl.DateTimeFormat('fr-FR', dateOptions).format(new Date(departureTimestamp));
  const alertFormatted = new Intl.DateTimeFormat('fr-FR', dateOptions).format(new Date(scheduledTimestamp));

  return {
    departureTimestamp,
    scheduledTimestamp,
    departureFormatted,
    alertFormatted,
  };
}

/**
 * Retrieves all scheduled notifications from localStorage
 */
export function getStoredNotifications(): ScheduledNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      // Seed default notification for the default booking if nothing stored yet
      const defaultNotif: ScheduledNotification = {
        id: 'notif-default-bk1',
        bookingId: 'bk-default-1',
        targetType: 'EXPEDITION',
        title: '🌿 MANGOREMA : Départ dans 1h !',
        body: 'Votre navette pour Bivouac & Canopée Mondah part à 06h30 au Rond-Point Charbonnages. Contrôlez votre sac et votre Pass QR !',
        eventTitle: 'Bivouac & Canopée Mondah',
        location: 'Rond-Point Charbonnages (Navette 06h30)',
        departureTimeFormatted: 'Samedi 14 Nov 2026 à 06h30',
        alertTimeFormatted: 'Samedi 14 Nov 2026 à 05h30',
        scheduledTimestamp: new Date(2026, 10, 14, 5, 30, 0).getTime(),
        departureTimestamp: new Date(2026, 10, 14, 6, 30, 0).getTime(),
        enabled: true,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      saveStoredNotifications([defaultNotif]);
      return [defaultNotif];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erreur lecture notifications:', e);
    return [];
  }
}

/**
 * Saves notifications list to localStorage
 */
export function saveStoredNotifications(notifs: ScheduledNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
  } catch (e) {
    console.error('Erreur sauvegarde notifications:', e);
  }
}

/**
 * Creates or updates an H-1 notification schedule for a booking
 */
export function scheduleBookingNotification(booking: Booking): ScheduledNotification {
  const timestamps = calculateExpeditionTimestamps(booking);
  const notifs = getStoredNotifications();
  
  const existingIndex = notifs.findIndex((n) => n.bookingId === booking.id);
  
  const notif: ScheduledNotification = {
    id: existingIndex !== -1 ? notifs[existingIndex].id : `notif-bk-${booking.id}`,
    bookingId: booking.id,
    targetType: 'EXPEDITION',
    title: '🌿 MANGOREMA : Départ dans 1h !',
    body: `Votre expédition "${booking.eventTitle}" débute dans 1 heure. Lieu de ralliement : ${booking.location}. ${
      booking.shuttleIncluded ? `Navette prévue : ${booking.shuttleDetail || 'Oui'}.` : ''
    } Munissez-vous de votre Pass QR.`,
    eventTitle: booking.eventTitle,
    location: booking.location,
    departureTimeFormatted: timestamps.departureFormatted,
    alertTimeFormatted: timestamps.alertFormatted,
    scheduledTimestamp: timestamps.scheduledTimestamp,
    departureTimestamp: timestamps.departureTimestamp,
    enabled: true,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  if (existingIndex !== -1) {
    notifs[existingIndex] = notif;
  } else {
    notifs.unshift(notif);
  }

  saveStoredNotifications(notifs);
  return notif;
}

/**
 * Creates or updates an H-1 notification schedule for a shuttle
 */
export function scheduleShuttleNotification(shuttle: ShuttleService): ScheduledNotification {
  const timestamps = calculateShuttleTimestamps(shuttle);
  const notifs = getStoredNotifications();
  
  const notif: ScheduledNotification = {
    id: `notif-shut-${shuttle.id}-${Date.now()}`,
    shuttleId: shuttle.id,
    targetType: 'SHUTTLE',
    title: '🚌 MANGOREMA : Navette dans 1 heure !',
    body: `Votre navette ${shuttle.type} part à ${shuttle.departureTime} depuis ${shuttle.departurePoint}. Chauffeur : ${shuttle.driverName} (${shuttle.driverPhone}).`,
    eventTitle: `Navette ${shuttle.type} (${shuttle.destination})`,
    location: shuttle.departurePoint,
    departureTimeFormatted: timestamps.departureFormatted,
    alertTimeFormatted: timestamps.alertFormatted,
    scheduledTimestamp: timestamps.scheduledTimestamp,
    departureTimestamp: timestamps.departureTimestamp,
    enabled: true,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  notifs.unshift(notif);
  saveStoredNotifications(notifs);
  return notif;
}

/**
 * Toggles an alert on or off
 */
export function toggleNotificationEnabled(id: string): ScheduledNotification[] {
  const notifs = getStoredNotifications().map((n) => {
    if (n.id === id) {
      return { ...n, enabled: !n.enabled };
    }
    return n;
  });
  saveStoredNotifications(notifs);
  return notifs;
}

/**
 * Removes a scheduled notification
 */
export function deleteNotification(id: string): ScheduledNotification[] {
  const notifs = getStoredNotifications().filter((n) => n.id !== id);
  saveStoredNotifications(notifs);
  return notifs;
}

/**
 * Checks for any due notifications and fires them
 */
export function checkDueNotifications(
  onTrigger?: (notif: ScheduledNotification) => void
): ScheduledNotification[] {
  const notifs = getStoredNotifications();
  const now = Date.now();
  let hasChanges = false;

  const updated = notifs.map((n) => {
    // If pending, enabled, and the scheduled alert time (H-1) has arrived
    if (n.enabled && n.status === 'PENDING' && now >= n.scheduledTimestamp) {
      hasChanges = true;
      // Trigger Web Notification
      sendWebNotification(n.title, {
        body: n.body,
        tag: n.id,
        requireInteraction: true,
      });

      if (onTrigger) {
        onTrigger(n);
      }

      return {
        ...n,
        status: 'TRIGGERED' as const,
      };
    }
    return n;
  });

  if (hasChanges) {
    saveStoredNotifications(updated);
  }

  return updated;
}

/**
 * Triggers an immediate simulation test of an H-1 alert for a booking or shuttle
 */
export function simulateImmediateH1Alert(
  title: string,
  body: string
): { nativeSent: boolean; message: string } {
  const nativeSent = sendWebNotification(title, {
    body,
    requireInteraction: true,
  });

  return {
    nativeSent,
    message: nativeSent
      ? 'Notification locale envoyée avec succès sur votre appareil via l\'API Web Notification.'
      : 'Alerte locale simulée (Notification Web en attente d\'autorisation du navigateur).',
  };
}

// =========================================================================
// Weekly Temporary Ecological Challenges Push Notifications
// =========================================================================
const WEEKLY_ECO_PUSH_STORAGE_KEY = 'mangorema_weekly_eco_push_enabled_v1';
const WEEKLY_ECO_LAST_NOTIFIED_KEY = 'mangorema_weekly_eco_notified_week_v1';

export function isWeeklyEcoPushEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(WEEKLY_ECO_PUSH_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setWeeklyEcoPushEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WEEKLY_ECO_PUSH_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Erreur sauvegarde préférence push défis hebdo:', e);
  }
}

export function syncWeeklyChallengeNotifications(params: {
  weekKey: string;
  weekLabel: string;
  endsAtMs: number;
  pendingCount: number;
  enabled: boolean;
}): { newWeekAlert?: { title: string; body: string } } {
  const { weekKey, weekLabel, endsAtMs, pendingCount, enabled } = params;
  const notifs = getStoredNotifications();

  // Keep non-weekly-eco notifications + current week eco alert if any
  const notifId = `notif-eco-weekly-${weekKey}`;
  const filtered = notifs.filter(
    (n) => !n.id.startsWith('notif-eco-weekly-') || n.id === notifId
  );

  // Schedule reminder 24h before end of weekly window
  const alertTimestamp = Math.max(Date.now() + 60 * 1000, endsAtMs - 24 * 60 * 60 * 1000);
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  };

  const existingIdx = filtered.findIndex((n) => n.id === notifId);
  const reminder: ScheduledNotification = {
    id: notifId,
    ecoChallengeId: weekKey,
    targetType: 'ECO_CHALLENGE',
    title: '🌿 Défis Écologiques Temporaires : Dernières 24h !',
    body: `Il reste ${pendingCount} défi(s) hebdomadaire(s) Zéro Déchet à valider avant le renouvellement (${weekLabel}).`,
    eventTitle: `Défis Éco Hebdomadaires (${weekLabel})`,
    location: 'Parcs Nationaux du Gabon',
    departureTimeFormatted: new Intl.DateTimeFormat('fr-FR', dateOptions).format(new Date(endsAtMs)),
    alertTimeFormatted: new Intl.DateTimeFormat('fr-FR', dateOptions).format(new Date(alertTimestamp)),
    scheduledTimestamp: alertTimestamp,
    departureTimestamp: endsAtMs,
    enabled: enabled && pendingCount > 0,
    status: existingIdx !== -1 ? filtered[existingIdx].status : 'PENDING',
    createdAt: existingIdx !== -1 ? filtered[existingIdx].createdAt : new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    filtered[existingIdx] = reminder;
  } else {
    filtered.unshift(reminder);
  }
  saveStoredNotifications(filtered);

  // Check if user has notifications enabled for a freshly started week
  if (enabled && pendingCount > 0 && typeof window !== 'undefined') {
    try {
      const lastWeekNotified = localStorage.getItem(WEEKLY_ECO_LAST_NOTIFIED_KEY);
      if (lastWeekNotified !== weekKey) {
        localStorage.setItem(WEEKLY_ECO_LAST_NOTIFIED_KEY, weekKey);
        const title = `🌱 Nouveaux Défis Écologiques (${weekLabel})`;
        const body = `${pendingCount} défis temporaires Zéro Déchet viennent d'être renouvelés. Validez-les avant dimanche soir !`;
        sendWebNotification(title, {
          body,
          tag: `mangorema-weekly-renewal-${weekKey}`,
        });
        return { newWeekAlert: { title, body } };
      }
    } catch {
      // ignore storage errors
    }
  }

  return {};
}

export function triggerWeeklyChallengePushTest(weekLabel: string, pendingCount: number): {
  nativeSent: boolean;
  title: string;
  body: string;
} {
  const title = '🌿 Défis Écologiques Temporaires actifs';
  const body =
    pendingCount > 0
      ? `${pendingCount} défi(s) Zéro Déchet à valider cette semaine (${weekLabel}) avant le compte à rebours final.`
      : `Tous vos défis temporaires (${weekLabel}) sont validés ! Rendez-vous lundi prochain pour de nouveaux badges.`;

  const nativeSent = sendWebNotification(title, {
    body,
    tag: `mangorema-weekly-push-${Date.now()}`,
  });

  return { nativeSent, title, body };
}

// =========================================================================
// Seasonal Wildlife & Flora Alerts Notifications (Gabon Biodiversity)
// =========================================================================
const WILDLIFE_ALERTS_SUB_KEY = 'mangorema_wildlife_alerts_sub_v1';

export function getSubscribedWildlifeAlertIds(): string[] {
  if (typeof window === 'undefined') return ['wl-tortues-luth'];
  try {
    const raw = localStorage.getItem(WILDLIFE_ALERTS_SUB_KEY);
    if (!raw) {
      return ['wl-tortues-luth', 'wl-elephants-foret'];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return ['wl-tortues-luth'];
  }
}

export function toggleWildlifeAlertSubscription(params: {
  alertId: string;
  title: string;
  parkOrZone: string;
  seasonLabel: string;
  icon: string;
}): { subscribedIds: string[]; added: boolean } {
  const current = getSubscribedWildlifeAlertIds();
  const exists = current.includes(params.alertId);
  const next = exists
    ? current.filter((id) => id !== params.alertId)
    : [params.alertId, ...current];

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(WILDLIFE_ALERTS_SUB_KEY, JSON.stringify(next));
    }
  } catch (err) {
    console.error('Erreur sauvegarde alertes faune/flore:', err);
  }

  const notifs = getStoredNotifications();
  const notifId = `notif-wildlife-${params.alertId}`;
  const filtered = notifs.filter((n) => n.id !== notifId);

  if (!exists) {
    const scheduleNotif: ScheduledNotification = {
      id: notifId,
      wildlifeAlertId: params.alertId,
      targetType: 'WILDLIFE_ALERT',
      title: `${params.icon} Alerte Saison Nature : ${params.title}`,
      body: `Observation active (${params.seasonLabel}) · Zone : ${params.parkOrZone}. Consultez les consignes d'approche ANPN.`,
      eventTitle: params.title,
      location: params.parkOrZone,
      departureTimeFormatted: params.seasonLabel,
      alertTimeFormatted: 'Veille saisonnière active',
      scheduledTimestamp: Date.now() + 24 * 60 * 60 * 1000,
      departureTimestamp: Date.now() + 24 * 60 * 60 * 1000,
      enabled: true,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    filtered.unshift(scheduleNotif);
    sendWebNotification(scheduleNotif.title, {
      body: scheduleNotif.body,
      tag: `mangorema-wl-${params.alertId}`,
    });
  }

  saveStoredNotifications(filtered);
  return { subscribedIds: next, added: !exists };
}


