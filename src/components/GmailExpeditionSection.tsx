/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Booking,
  ExpeditionEvent,
  TrustedContact,
} from '../types';
import {
  getGoogleAccessToken,
  refreshWorkspaceAccessToken,
} from '../firebase';
import {
  GmailMessageSummary,
  MANGOREMA_BOOKING_GMAIL_QUERY,
  ALL_BOOKINGS_GMAIL_QUERY,
  fetchGmailMessages,
  sendGmailMessage,
  createGmailDraft,
  markGmailMessageRead,
  trashGmailMessage,
} from '../utils/gmailService';
import {
  Mail,
  Send,
  Inbox,
  Search,
  RefreshCw,
  FileEdit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Compass,
  Ticket,
  Eye,
  X,
  Check,
  AlertTriangle,
  Reply,
  Clock,
  MapPin,
  CreditCard,
} from 'lucide-react';

interface GmailExpeditionSectionProps {
  authUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  isAuthLoading?: boolean;
  onSignInGoogle?: () => void;
  trustedContacts: TrustedContact[];
  bookings: Booking[];
  events: ExpeditionEvent[];
}

type PendingGmailMutation =
  | {
      kind: 'SEND';
      to: string;
      subject: string;
      body: string;
      refreshAfterSend?: boolean;
    }
  | {
      kind: 'DRAFT';
      to: string;
      subject: string;
      body: string;
    }
  | {
      kind: 'TRASH';
      message: GmailMessageSummary;
    };

const GoogleSignInButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}> = ({ onClick, disabled, label = 'Se connecter avec Google' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="min-h-[44px] px-4 py-2 bg-white hover:bg-stone-50 text-[#1f1f1f] border border-[#747775] rounded-full font-medium text-xs inline-flex items-center justify-center gap-2.5 shadow-sm hover:shadow active:scale-[0.98] transition disabled:opacity-60"
  >
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="w-[18px] h-[18px] shrink-0 block"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
    <span className="tracking-[0.01em]">{label}</span>
  </button>
);

export const GmailExpeditionSection: React.FC<GmailExpeditionSectionProps> = ({
  authUser,
  isAuthLoading = false,
  onSignInGoogle,
  trustedContacts,
  bookings,
  events,
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  const [needsAuth, setNeedsAuth] = useState<boolean>(() => !authUser || !getGoogleAccessToken());
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Inbox & Booking Sync state
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasLoadedInboxOnce, setHasLoadedInboxOnce] = useState(false);
  const [lastSyncedAtLabel, setLastSyncedAtLabel] = useState<string | null>(null);
  const [filterPreset, setFilterPreset] = useState<'mangorema_bookings' | 'all_bookings' | 'recent_inbox'>('mangorema_bookings');
  const [searchInput, setSearchInput] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);
  const hasAutoSyncedRef = useRef(false);

  // Compose state
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Mutation confirmation modal & feedback
  const [pendingMutation, setPendingMutation] = useState<PendingGmailMutation | null>(null);
  const [isExecutingMutation, setIsExecutingMutation] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warn'; text: string } | null>(null);

  const contactsWithEmail = useMemo(
    () => trustedContacts.filter((c) => Boolean(c.email && c.email.trim())),
    [trustedContacts]
  );

  const bookingRefsSet = useMemo(
    () => new Set(bookings.map((b) => b.refNumber.toUpperCase())),
    [bookings]
  );

  // Pre-fill initial compose template with user's first booking or expedition
  useEffect(() => {
    if (!subject && !body) {
      const traveler = authUser?.displayName || 'Explorateur MANGOREMA';
      if (bookings[0]) {
        const bk = bookings[0];
        setSubject(`Confirmation Expédition MANGOREMA — Pass ${bk.refNumber} (${bk.eventTitle})`);
        const paymentLabel =
          bk.paymentMethod === 'AIRTEL'
            ? 'Airtel Money'
            : bk.paymentMethod === 'GHETTOPAY'
            ? 'GhettoPay (ghettopay.com)'
            : 'Moov Money';
        setBody(
          `Bonjour,\n\nVoici le récapitulatif de ma réservation d'expédition MANGOREMA au Gabon :\n• Sortie : ${bk.eventTitle}\n• Date : ${bk.eventDate}\n• Lieu : ${bk.location}\n• Référence Pass : ${bk.refNumber}\n• Paiement : ${bk.totalAmount.toLocaleString('fr-FR')} FCFA (${paymentLabel})\n• Logistique : ${
            bk.shuttleIncluded ? bk.shuttleDetail || 'Navette incluse' : 'Accès autonome'
          }${bk.guideIncluded ? ' · Écoguide ANPN inclus' : ''}\n\nBien cordialement,\n${traveler}`
        );
      } else if (events[0]) {
        const evt = events[0];
        setSubject(`Itinéraire MANGOREMA : ${evt.title}`);
        setBody(
          `Bonjour,\n\nVoici les détails de mon itinéraire nature au Gabon :\n• Parc : ${evt.parkName} (${evt.location})\n• Date : ${evt.date} · Durée : ${evt.duration}\n• Difficulté : ${evt.difficulty} (${evt.distance})\n\nBien cordialement,\n${traveler}`
        );
      }
    }
  }, [bookings, events, authUser?.displayName, subject, body]);

  const showFeedback = (type: 'success' | 'warn', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const buildQueryString = (
    preset: 'mangorema_bookings' | 'all_bookings' | 'recent_inbox',
    customQuery: string
  ): string => {
    const trimmed = customQuery.trim();
    if (trimmed) return trimmed;
    if (preset === 'mangorema_bookings') {
      return MANGOREMA_BOOKING_GMAIL_QUERY;
    }
    if (preset === 'all_bookings') {
      return ALL_BOOKINGS_GMAIL_QUERY;
    }
    return 'in:inbox';
  };

  const ensureToken = useCallback(async (forceRefresh = false): Promise<string> => {
    const existing = forceRefresh ? null : getGoogleAccessToken();
    if (existing) {
      setNeedsAuth(false);
      return existing;
    }
    const fresh = await refreshWorkspaceAccessToken();
    setNeedsAuth(false);
    return fresh;
  }, []);

  const loadInboxMessages = useCallback(
    async (
      providedToken?: string,
      presetOverride: 'mangorema_bookings' | 'all_bookings' | 'recent_inbox' = filterPreset,
      queryOverride = searchInput
    ) => {
      setIsLoadingMessages(true);
      setFeedback(null);
      try {
        const token = providedToken || (await ensureToken());
        const q = buildQueryString(presetOverride, queryOverride);
        const list = await fetchGmailMessages(token, q, 12);
        setMessages(list);
        setHasLoadedInboxOnce(true);
        setLastSyncedAtLabel(
          new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        );
        setSelectedMessage((prev) =>
          prev ? list.find((m) => m.id === prev.id) || null : null
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === 'TOKEN_EXPIRED_OR_DENIED') {
          setNeedsAuth(true);
          showFeedback(
            'warn',
            'La session Gmail a expiré. Cliquez sur « Sign in with Google » pour synchroniser vos e-mails.'
          );
        } else {
          showFeedback('warn', msg || 'Impossible de synchroniser vos e-mails Gmail.');
        }
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [ensureToken, filterPreset, searchInput]
  );

  // Sync auth state & auto-load reservation emails when an in-memory Google token is available
  useEffect(() => {
    const token = getGoogleAccessToken();
    const authNeeded = !authUser || !token;
    setNeedsAuth(authNeeded);

    if (!authUser) {
      hasAutoSyncedRef.current = false;
      setMessages([]);
      setHasLoadedInboxOnce(false);
      setLastSyncedAtLabel(null);
      setSelectedMessage(null);
      return;
    }

    if (token && !hasAutoSyncedRef.current) {
      hasAutoSyncedRef.current = true;
      loadInboxMessages(token, 'mangorema_bookings', '');
    }
  }, [authUser, loadInboxMessages]);

  const handleAuthorizeGmail = async () => {
    setIsAuthorizing(true);
    setFeedback(null);
    try {
      const token = await refreshWorkspaceAccessToken();
      setNeedsAuth(false);
      hasAutoSyncedRef.current = true;
      await loadInboxMessages(token, filterPreset, searchInput);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('popup-closed')) {
        showFeedback('warn', msg || 'Autorisation Gmail annulée ou refusée.');
      }
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleRequestSelfBookingTestEmail = () => {
    if (!authUser?.email || !bookings[0]) return;
    const bk = bookings[0];
    const traveler = authUser.displayName || 'Explorateur MANGOREMA';
    const paymentLabel =
      bk.paymentMethod === 'AIRTEL'
        ? 'Airtel Money'
        : bk.paymentMethod === 'GHETTOPAY'
        ? 'GhettoPay (ghettopay.com)'
        : 'Moov Money';
    setPendingMutation({
      kind: 'SEND',
      to: authUser.email,
      subject: `Confirmation Réservation MANGOREMA — ${bk.eventTitle} (${bk.refNumber})`,
      body: `Bonjour ${traveler},\n\nVotre réservation d'expédition MANGOREMA est confirmée :\n• Expédition : ${bk.eventTitle}\n• Parc / Lieu : ${bk.location}\n• Date : ${bk.eventDate}\n• Pass QR Référence : ${bk.refNumber}\n• Montant payé : ${bk.totalAmount.toLocaleString('fr-FR')} FCFA via ${paymentLabel}\n• Navette : ${bk.shuttleIncluded ? bk.shuttleDetail || 'Incluse' : 'Non incluse'}\n\nBon trek au Gabon avec l'ANPN & MANGOREMA !`,
      refreshAfterSend: true,
    });
  };

  const applyTemplate = (kind: 'booking' | 'event' | 'safety', itemId?: string) => {
    const traveler = authUser?.displayName || 'Explorateur MANGOREMA';
    if (kind === 'booking') {
      const bk = bookings.find((b) => b.id === itemId) || bookings[0];
      if (!bk) return;
      setSubject(`Confirmation Expédition MANGOREMA — Pass ${bk.refNumber}`);
      setBody(
        `Bonjour,\n\nVoici mon billet et itinéraire MANGOREMA :\n• Sortie : ${bk.eventTitle}\n• Date : ${bk.eventDate}\n• Lieu : ${bk.location}\n• Référence Pass : ${bk.refNumber}\n• Logistique : ${
          bk.shuttleIncluded ? bk.shuttleDetail || 'Navette incluse' : 'Accès autonome'
        }${bk.guideIncluded ? ' · Écoguide ANPN inclus' : ''}\n\n— ${traveler}`
      );
      return;
    }

    if (kind === 'event') {
      const evt = events.find((e) => e.id === itemId) || events[0];
      if (!evt) return;
      setSubject(`Itinéraire MANGOREMA : ${evt.title}`);
      setBody(
        `Bonjour,\n\nJe prévois l'expédition suivante au Gabon :\n• Expédition : ${evt.title}\n• Parc : ${evt.parkName} (${evt.location})\n• Date : ${evt.date} · Durée : ${evt.duration}\n• Difficulté : ${evt.difficulty} (${evt.distance})\n\n— ${traveler}`
      );
      return;
    }

    const fillSafety = (lat: number, lng: number, accurate: boolean) => {
      setSubject(`ALERTE SÉCURITÉ MANGOREMA — Position GPS de ${traveler}`);
      setBody(
        `ALERTE SÉCURITÉ MANGOREMA GABON\n\nExplorateur : ${traveler}\nPosition GPS${
          accurate ? ' (capteur actif)' : ' (zone estimée Libreville/Mondah)'
        } : ${lat.toFixed(5)}, ${lng.toFixed(5)}\nLien carte : https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}\n\nEn cas d'absence de nouvelles, contacter les écogardes ANPN au 1404.`
      );
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fillSafety(pos.coords.latitude, pos.coords.longitude, true),
        () => fillSafety(0.5833, 9.35, false),
        { enableHighAccuracy: true, timeout: 4000 }
      );
    } else {
      fillSafety(0.5833, 9.35, false);
    }
  };

  const handleOpenReply = (msg: GmailMessageSummary) => {
    const emailMatch = msg.from.match(/<([^>]+)>/) || msg.from.match(/([^\s<>]+@[^\s<>]+)/);
    const replyAddr = emailMatch ? emailMatch[1] : '';
    setRecipientEmail(replyAddr);
    setSubject(msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`);
    setBody(`\n\n--- Message d'origine (${msg.from}) ---\n${msg.snippet}`);
    setSelectedMessage(null);
    setActiveTab('compose');
  };

  const handleMarkAsRead = async (msg: GmailMessageSummary) => {
    try {
      const token = await ensureToken();
      await markGmailMessageRead(token, msg.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isUnread: false } : m))
      );
      setSelectedMessage((prev) => (prev && prev.id === msg.id ? { ...prev, isUnread: false } : prev));
      showFeedback('success', 'E-mail marqué comme lu dans Gmail.');
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : String(err);
      if (text === 'TOKEN_EXPIRED_OR_DENIED') {
        setNeedsAuth(true);
        showFeedback('warn', 'Autorisation Gmail expirée. Reconnectez-vous avec Google.');
      } else {
        showFeedback('warn', text);
      }
    }
  };

  const requestSendOrDraft = (kind: 'SEND' | 'DRAFT') => {
    const cleanTo = recipientEmail.trim();
    const cleanSubject = subject.trim();
    const cleanBody = body.trim();

    if (kind === 'SEND' && (!cleanTo || !cleanTo.includes('@'))) {
      showFeedback('warn', 'Veuillez saisir une adresse e-mail destinataire valide avant l’envoi.');
      return;
    }
    if (!cleanSubject && !cleanBody) {
      showFeedback('warn', 'Veuillez renseigner un objet ou un message.');
      return;
    }

    setPendingMutation({
      kind,
      to: cleanTo || (authUser?.email || ''),
      subject: cleanSubject || 'Plan d’expédition MANGOREMA Gabon',
      body: cleanBody,
    });
  };

  const executePendingMutation = async () => {
    if (!pendingMutation) return;
    setIsExecutingMutation(true);
    try {
      const token = await ensureToken();

      if (pendingMutation.kind === 'SEND') {
        await sendGmailMessage(token, {
          to: pendingMutation.to,
          subject: pendingMutation.subject,
          body: pendingMutation.body,
        });
        showFeedback('success', `E-mail envoyé via Gmail à ${pendingMutation.to} !`);
        if (pendingMutation.refreshAfterSend) {
          setTimeout(() => {
            loadInboxMessages(token, filterPreset, searchInput);
          }, 1200);
        }
      } else if (pendingMutation.kind === 'DRAFT') {
        await createGmailDraft(token, {
          to: pendingMutation.to,
          subject: pendingMutation.subject,
          body: pendingMutation.body,
        });
        showFeedback('success', `Brouillon enregistré dans votre boîte Gmail (${pendingMutation.subject}).`);
      } else if (pendingMutation.kind === 'TRASH') {
        await trashGmailMessage(token, pendingMutation.message.id);
        setMessages((prev) => prev.filter((m) => m.id !== pendingMutation.message.id));
        if (selectedMessage?.id === pendingMutation.message.id) {
          setSelectedMessage(null);
        }
        showFeedback('success', `Message « ${pendingMutation.message.subject} » déplacé dans la corbeille Gmail.`);
      }

      setPendingMutation(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'TOKEN_EXPIRED_OR_DENIED') {
        setNeedsAuth(true);
        setPendingMutation(null);
        showFeedback('warn', 'Session Gmail expirée. Reconnectez-vous avec Google pour confirmer l’action.');
      } else {
        showFeedback('warn', msg || 'Erreur lors de l’opération Gmail.');
      }
    } finally {
      setIsExecutingMutation(false);
    }
  };

  const unreadCount = useMemo(() => messages.filter((m) => m.isUnread).length, [messages]);

  return (
    <div
      id="gmail-reservations-section"
      className="bg-white dark:bg-slate-900/90 border border-amber-500/35 rounded-3xl p-4 space-y-3.5 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white">
                Emails de Réservations MANGOREMA (Gmail)
              </h3>
              {hasLoadedInboxOnce && (
                <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 font-bold px-2 py-0.5 rounded-full font-mono">
                  {messages.length} reçu(s){unreadCount > 0 ? ` · ${unreadCount} non lu(s)` : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Synchronisez et consultez vos derniers e-mails liés à vos réservations d&apos;expéditions via Gmail
            </p>
            {lastSyncedAtLabel && (
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                Dernière synchronisation Gmail à {lastSyncedAtLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-2.5 rounded-2xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/75 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/75 border-amber-500/40 text-amber-900 dark:text-amber-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <span className="text-[11px] font-medium">{feedback.text}</span>
        </div>
      )}

      {/* Auth Gate: Official Sign in with Google button whenever unauthenticated or token unavailable */}
      {!authUser || needsAuth ? (
        <div className="bg-stone-50 dark:bg-slate-950/75 border border-stone-200 dark:border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              {!authUser
                ? 'Connectez votre compte Google pour synchroniser Gmail'
                : 'Autorisez Gmail pour afficher vos e-mails de réservation'}
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {!authUser
                ? 'Retrouvez automatiquement vos confirmations d’expéditions, billets ANPN et navettes reçus par e-mail.'
                : 'Le jeton d’accès Gmail est stocké uniquement en mémoire vive (jamais en cache navigateur). Cliquez pour synchroniser.'}
            </p>
          </div>

          <div className="shrink-0">
            <GoogleSignInButton
              onClick={!authUser && onSignInGoogle ? onSignInGoogle : handleAuthorizeGmail}
              disabled={isAuthLoading || isAuthorizing}
              label={
                isAuthLoading || isAuthorizing
                  ? 'Synchronisation...'
                  : 'Sign in with Google'
              }
            />
          </div>
        </div>
      ) : (
        <>
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 rounded-2xl text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className={`min-h-[44px] py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'inbox'
                  ? 'copper-gradient text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Réservations reçues ({messages.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('compose')}
              className={`min-h-[44px] py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'compose'
                  ? 'copper-gradient text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer / Partager</span>
            </button>
          </div>

          {activeTab === 'inbox' ? (
            <div className="space-y-3">
              {/* Filter Presets + Sync Button */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'mangorema_bookings', label: '🎫 Réservations MANGOREMA' },
                    { id: 'all_bookings', label: '🧾 Tous billets & reçus' },
                    { id: 'recent_inbox', label: '📥 Derniers emails reçus' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        const nextPreset = tab.id as
                          | 'mangorema_bookings'
                          | 'all_bookings'
                          | 'recent_inbox';
                        setFilterPreset(nextPreset);
                        loadInboxMessages(undefined, nextPreset, searchInput);
                      }}
                      className={`min-h-[36px] px-2.5 py-1 rounded-xl text-[11px] font-semibold transition ${
                        filterPreset === tab.id
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => loadInboxMessages()}
                  disabled={isLoadingMessages}
                  className="min-h-[44px] px-3.5 py-1.5 copper-gradient text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition shrink-0 disabled:opacity-60"
                >
                  {isLoadingMessages ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>{isLoadingMessages ? 'Synchro...' : 'Synchroniser Gmail'}</span>
                </button>
              </div>

              {/* Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadInboxMessages();
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Rechercher par réf. (MANG-...), parc ou mot-clé Gmail..."
                    className="w-full min-h-[44px] bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoadingMessages}
                  className="min-h-[44px] px-3.5 py-2 bg-stone-100 dark:bg-slate-950 hover:bg-stone-200 dark:hover:bg-slate-800 border border-stone-300 dark:border-white/15 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl shrink-0"
                >
                  Filtrer
                </button>
              </form>

              {/* Selected Email Detailed Viewer */}
              {selectedMessage && (
                <div className="bg-stone-50 dark:bg-slate-950/90 border border-amber-500/45 rounded-2xl p-3.5 space-y-2.5 shadow-inner">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 block truncate">
                        De : {selectedMessage.from} · {selectedMessage.date}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                        {selectedMessage.subject}
                      </h4>
                      {(selectedMessage.detectedBookingRef ||
                        selectedMessage.detectedPark ||
                        selectedMessage.detectedPaymentMethod) && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {selectedMessage.detectedBookingRef && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 flex items-center gap-1">
                              <Ticket className="w-3 h-3" />
                              {bookingRefsSet.has(selectedMessage.detectedBookingRef)
                                ? `Pass lié : ${selectedMessage.detectedBookingRef}`
                                : `Réf : ${selectedMessage.detectedBookingRef}`}
                            </span>
                          )}
                          {selectedMessage.detectedPark && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {selectedMessage.detectedPark}
                            </span>
                          )}
                          {selectedMessage.detectedPaymentMethod && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {selectedMessage.detectedPaymentMethod}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMessage(null)}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center shrink-0"
                      aria-label="Fermer l'e-mail"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                    {selectedMessage.bodyText || selectedMessage.snippet || '(Contenu vide)'}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenReply(selectedMessage)}
                        className="min-h-[44px] px-3 py-1.5 copper-gradient text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>Répondre</span>
                      </button>

                      {selectedMessage.isUnread && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(selectedMessage)}
                          className="min-h-[44px] px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Marquer lu</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setPendingMutation({ kind: 'TRASH', message: selectedMessage })}
                      className="min-h-[44px] px-3 py-1.5 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800/60 text-red-700 dark:text-red-300 font-bold text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Corbeille</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Messages List / Empty States */}
              {isLoadingMessages && !hasLoadedInboxOnce ? (
                <div className="bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-white/10 rounded-2xl p-5 text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Synchronisation de vos réservations Gmail en cours...
                  </p>
                </div>
              ) : !hasLoadedInboxOnce ? (
                <div className="bg-stone-50 dark:bg-slate-950/60 border border-dashed border-stone-300 dark:border-white/15 rounded-2xl p-4 text-center space-y-2">
                  <Mail className="w-6 h-6 text-amber-600/80 dark:text-amber-400/80 mx-auto" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Prêt à synchroniser vos réservations MANGOREMA
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Cliquez sur « Synchroniser Gmail » pour afficher vos derniers e-mails liés aux expéditions.
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="bg-stone-50 dark:bg-slate-950/60 border border-dashed border-stone-300 dark:border-white/15 rounded-2xl p-4 text-center space-y-2.5">
                  <Ticket className="w-6 h-6 text-amber-600/80 dark:text-amber-400/80 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Aucun e-mail de réservation MANGOREMA trouvé pour ce filtre
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                      Votre boîte Gmail ne contient pas encore de confirmation MANGOREMA correspondante.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {filterPreset !== 'recent_inbox' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterPreset('recent_inbox');
                          setSearchInput('');
                          loadInboxMessages(undefined, 'recent_inbox', '');
                        }}
                        className="min-h-[40px] px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/15 rounded-xl text-[11px] font-bold text-slate-800 dark:text-slate-200"
                      >
                        Voir mes derniers e-mails reçus
                      </button>
                    )}
                    {authUser?.email && bookings[0] && (
                      <button
                        type="button"
                        onClick={handleRequestSelfBookingTestEmail}
                        className="min-h-[40px] px-3 py-1.5 copper-gradient text-slate-950 rounded-xl text-[11px] font-black shadow-sm"
                      >
                        M’envoyer un reçu Pass ({bookings[0].refNumber})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar pr-0.5">
                  {messages.map((msg) => {
                    const isMatchedActiveBooking = Boolean(
                      msg.detectedBookingRef && bookingRefsSet.has(msg.detectedBookingRef)
                    );

                    return (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => setSelectedMessage(msg)}
                        className={`w-full text-left p-3 rounded-2xl border transition flex items-start justify-between gap-2 ${
                          selectedMessage?.id === msg.id
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500'
                            : 'bg-stone-50 dark:bg-slate-950/75 border-stone-200 dark:border-white/10 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5">
                            {msg.isUnread && (
                              <span
                                className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                                title="Non lu"
                              />
                            )}
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 truncate">
                              {msg.from}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono ml-auto shrink-0">
                              {msg.date}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {msg.subject}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                            {msg.snippet}
                          </p>
                          {(msg.detectedBookingRef || msg.detectedPark || msg.detectedPaymentMethod) && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {msg.detectedBookingRef && (
                                <span
                                  className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                    isMatchedActiveBooking
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                                      : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                                  }`}
                                >
                                  {isMatchedActiveBooking
                                    ? `✓ Pass actif : ${msg.detectedBookingRef}`
                                    : `🎫 ${msg.detectedBookingRef}`}
                                </span>
                              )}
                              {msg.detectedPark && (
                                <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-stone-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  📍 {msg.detectedPark}
                                </span>
                              )}
                              {msg.detectedPaymentMethod && (
                                <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-stone-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {msg.detectedPaymentMethod}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Compose / Send Tab */
            <div className="space-y-3">
              {/* Quick Expedition / Safety Templates */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                  Modèles rapides MANGOREMA :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {bookings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => applyTemplate('booking', bookings[0].id)}
                      className="min-h-[36px] px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/35 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Ticket className="w-3 h-3" />
                      <span>Mon Pass ({bookings[0].refNumber})</span>
                    </button>
                  )}
                  {events.length > 0 && (
                    <button
                      type="button"
                      onClick={() => applyTemplate('event', events[0].id)}
                      className="min-h-[36px] px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/35 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Compass className="w-3 h-3" />
                      <span>Itinéraire Gabon</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => applyTemplate('safety')}
                    className="min-h-[36px] px-2.5 py-1 rounded-xl bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/35 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>Alerte GPS SOS</span>
                  </button>
                </div>
              </div>

              {/* Trusted Google Contacts Email Chips */}
              {contactsWithEmail.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                    Proches Google synchronisés :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {contactsWithEmail.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setRecipientEmail(c.email || '')}
                        className={`min-h-[36px] px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition ${
                          recipientEmail === c.email
                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                            : 'bg-stone-50 dark:bg-slate-950 border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {c.displayName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Destinataire (ex: proche@gmail.com)"
                  className="w-full min-h-[44px] bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />

                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Objet de l'e-mail..."
                  className="w-full min-h-[44px] bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />

                <textarea
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Rédigez votre plan d'expédition ou message d'alerte..."
                  className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => requestSendOrDraft('DRAFT')}
                  className="min-h-[44px] px-3 py-2 bg-stone-100 dark:bg-slate-950 hover:bg-stone-200 dark:hover:bg-slate-800 border border-stone-300 dark:border-white/15 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <FileEdit className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Brouillon Gmail</span>
                </button>

                <button
                  type="button"
                  onClick={() => requestSendOrDraft('SEND')}
                  className="min-h-[44px] px-3 py-2 copper-gradient text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer via Gmail</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MANDATORY Explicit Confirmation Dialog Before Sending, Drafting, or Trashing */}
      {pendingMutation && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#111714] border border-amber-500/40 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  pendingMutation.kind === 'TRASH'
                    ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
                    : 'copper-gradient text-slate-950'
                }`}
              >
                {pendingMutation.kind === 'TRASH' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="font-serif-display font-bold text-base text-slate-900 dark:text-white">
                  {pendingMutation.kind === 'SEND'
                    ? 'Confirmer l’envoi via Gmail ?'
                    : pendingMutation.kind === 'DRAFT'
                    ? 'Enregistrer ce brouillon Gmail ?'
                    : 'Déplacer cet e-mail dans la corbeille ?'}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {pendingMutation.kind === 'SEND'
                    ? 'L’e-mail sera expédié immédiatement depuis votre compte Gmail.'
                    : pendingMutation.kind === 'DRAFT'
                    ? 'Un nouveau brouillon sera ajouté à votre boîte Gmail.'
                    : 'Le message sera déplacé vers la corbeille de votre compte Gmail.'}
                </p>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-slate-950/90 border border-stone-200 dark:border-white/10 rounded-2xl p-3 space-y-1.5 text-xs">
              {pendingMutation.kind === 'TRASH' ? (
                <>
                  <span className="text-[10px] font-bold text-slate-500 block">
                    De : {pendingMutation.message.from}
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {pendingMutation.message.subject}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                    {pendingMutation.message.snippet}
                  </p>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 block truncate">
                    À : {pendingMutation.to || '(Aucun destinataire)'}
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    Objet : {pendingMutation.subject}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-3 whitespace-pre-wrap">
                    {pendingMutation.body}
                  </p>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isExecutingMutation}
                onClick={() => setPendingMutation(null)}
                className="min-h-[44px] px-3 py-2 bg-stone-100 dark:bg-slate-900 border border-stone-300 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={isExecutingMutation}
                onClick={executePendingMutation}
                className={`min-h-[44px] px-3 py-2 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow active:scale-95 transition disabled:opacity-60 ${
                  pendingMutation.kind === 'TRASH'
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'copper-gradient text-slate-950'
                }`}
              >
                {isExecutingMutation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>
                  {pendingMutation.kind === 'SEND'
                    ? 'Confirmer l’envoi'
                    : pendingMutation.kind === 'DRAFT'
                    ? 'Créer brouillon'
                    : 'Mettre en corbeille'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
