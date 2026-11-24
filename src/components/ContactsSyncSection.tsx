/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Booking,
  ExpeditionEvent,
  GoogleContactCandidate,
  TrustedContact,
} from '../types';
import {
  getGoogleAccessToken,
  refreshGoogleContactsAccessToken,
  refreshWorkspaceAccessToken,
  fetchGoogleContacts,
} from '../firebase';
import { sendGmailMessage } from '../utils/gmailService';
import { sanitizeImageUrl } from '../utils/urlSecurity';
import {
  Users,
  RefreshCw,
  Search,
  Plus,
  Check,
  ShieldAlert,
  Compass,
  Send,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Share2,
  LogIn,
} from 'lucide-react';

interface ContactsSyncSectionProps {
  authUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  isAuthLoading?: boolean;
  onSignInGoogle?: () => void;
  trustedContacts: TrustedContact[];
  bookings: Booking[];
  events: ExpeditionEvent[];
  onSaveContact: (
    contact: Omit<TrustedContact, 'id' | 'userId' | 'createdAtMs'>
  ) => Promise<void>;
  onUpdateContact: (contact: TrustedContact) => Promise<void>;
  onDeleteContact: (contactId: string) => Promise<void>;
}

export const ContactsSyncSection: React.FC<ContactsSyncSectionProps> = ({
  authUser,
  isAuthLoading = false,
  onSignInGoogle,
  trustedContacts,
  bookings,
  events,
  onSaveContact,
  onUpdateContact,
  onDeleteContact,
}) => {
  const [googleCandidates, setGoogleCandidates] = useState<GoogleContactCandidate[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactsLoadedOnce, setContactsLoadedOnce] = useState(false);
  const [needsReauth, setNeedsReauth] = useState<boolean>(!getGoogleAccessToken());
  const [searchQuery, setSearchQuery] = useState('');
  const [savingResourceName, setSavingResourceName] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedPlanKey, setSelectedPlanKey] = useState<string>(() => {
    if (bookings[0]) return `booking:${bookings[0].id}`;
    if (events[0]) return `event:${events[0].id}`;
    return '';
  });
  const [pendingGmailShare, setPendingGmailShare] = useState<{
    contact: TrustedContact;
    subject: string;
    body: string;
    mode: 'PLAN' | 'SAFETY';
  } | null>(null);
  const [isSendingGmail, setIsSendingGmail] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warn'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'warn', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleImportGoogleContacts = async (forceRefreshToken = false) => {
    setIsLoadingContacts(true);
    setFeedback(null);

    try {
      let token = forceRefreshToken ? null : getGoogleAccessToken();
      if (!token) {
        token = await refreshGoogleContactsAccessToken();
        setNeedsReauth(false);
      }

      const list = await fetchGoogleContacts(token);
      setGoogleCandidates(list);
      setContactsLoadedOnce(true);
      setNeedsReauth(false);

      showFeedback(
        'success',
        list.length > 0
          ? `${list.length} contact(s) Google chargé(s) en mémoire. Sélectionnez vos proches à synchroniser.`
          : 'Connexion Google Contacts réussie, mais aucun contact trouvé dans votre carnet.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'TOKEN_EXPIRED_OR_DENIED') {
        setNeedsReauth(true);
        showFeedback(
          'warn',
          "L'autorisation Google Contacts a expiré. Cliquez à nouveau pour renouveler le consentement OAuth."
        );
      } else {
        showFeedback('warn', msg || 'Impossible de charger Google Contacts.');
      }
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const syncedResourceNames = useMemo(
    () => new Set(trustedContacts.map((c) => c.resourceName)),
    [trustedContacts]
  );

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return googleCandidates.filter((c) => {
      if (!q) return true;
      return (
        c.displayName.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phoneNumber || '').toLowerCase().includes(q)
      );
    });
  }, [googleCandidates, searchQuery]);

  const handleAddCandidateToFirestore = async (candidate: GoogleContactCandidate) => {
    setSavingResourceName(candidate.resourceName);
    try {
      await onSaveContact({
        resourceName: candidate.resourceName,
        displayName: candidate.displayName,
        phoneNumber: candidate.phoneNumber,
        email: candidate.email,
        photoUrl: candidate.photoUrl,
        relationTag: candidate.organization || 'Proche confiance',
        shareSafetyAlerts: true,
        shareExpeditionPlans: true,
      });
      showFeedback('success', `${candidate.displayName} ajouté aux proches synchronisés sur Firestore.`);
    } catch (err: unknown) {
      showFeedback(
        'warn',
        err instanceof Error ? err.message : 'Erreur lors de la synchronisation du contact.'
      );
    } finally {
      setSavingResourceName(null);
    }
  };

  const buildSelectedExpeditionSummary = (): { subject: string; body: string } => {
    const traveler = authUser?.displayName || 'Un explorateur MANGOREMA';
    if (selectedPlanKey.startsWith('booking:')) {
      const bkId = selectedPlanKey.replace('booking:', '');
      const bk = bookings.find((b) => b.id === bkId);
      if (bk) {
        return {
          subject: `Plan d'expédition MANGOREMA : ${bk.eventTitle}`,
          body: `Bonjour, je partage mon plan d'expédition MANGOREMA avec vous :\n• Sortie : ${bk.eventTitle}\n• Date : ${bk.eventDate}\n• Lieu : ${bk.location}\n• Référence Pass : ${bk.refNumber}\n• Logistique : ${
            bk.shuttleIncluded ? bk.shuttleDetail || 'Navette incluse' : 'Accès autonome'
          }${bk.guideIncluded ? ' · Écoguide ANPN inclus' : ''}\n— ${traveler}`,
        };
      }
    }

    if (selectedPlanKey.startsWith('event:')) {
      const evtId = selectedPlanKey.replace('event:', '');
      const evt = events.find((e) => e.id === evtId);
      if (evt) {
        return {
          subject: `Plan d'expédition MANGOREMA : ${evt.title}`,
          body: `Bonjour, voici le programme de ma prochaine sortie MANGOREMA au Gabon :\n• Expédition : ${evt.title}\n• Parc : ${evt.parkName} (${evt.location})\n• Date : ${evt.date} · Durée : ${evt.duration}\n• Difficulté : ${evt.difficulty} (${evt.distance})\n— ${traveler}`,
        };
      }
    }

    return {
      subject: "Plan d'expédition MANGOREMA Gabon",
      body: `Bonjour, je pars en expédition nature avec MANGOREMA Gabon. Je vous tiendrai informé(e) à mon retour. — ${traveler}`,
    };
  };

  const deliverMessageToContact = async (
    contact: TrustedContact,
    subject: string,
    body: string,
    mode: 'PLAN' | 'SAFETY'
  ) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: subject,
          text: body,
        });
        showFeedback(
          'success',
          `${mode === 'SAFETY' ? 'Alerte sécurité' : 'Plan d’expédition'} partagé avec ${contact.displayName}.`
        );
        return;
      } catch {
        // User dismissed or Web Share blocked in iframe; fallback to clipboard/mailto/sms
      }
    }

    try {
      await navigator.clipboard.writeText(body);
    } catch {
      // ignore clipboard errors
    }

    if (contact.phoneNumber) {
      const cleanTel = contact.phoneNumber.replace(/[^+\d]/g, '');
      window.location.href = `sms:${cleanTel}?body=${encodeURIComponent(body)}`;
      showFeedback(
        'success',
        `Message préparé pour ${contact.displayName} (SMS + copié dans le presse-papier).`
      );
      return;
    }

    if (contact.email) {
      window.location.href = `mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      showFeedback(
        'success',
        `E-mail préparé pour ${contact.displayName} (et texte copié dans le presse-papier).`
      );
      return;
    }

    showFeedback(
      'success',
      `Message copié dans le presse-papier pour ${contact.displayName}.`
    );
  };

  const handleShareExpeditionPlan = async (contact: TrustedContact) => {
    const { subject, body } = buildSelectedExpeditionSummary();
    await deliverMessageToContact(contact, subject, body, 'PLAN');
  };

  const handleShareSafetyAlert = async (contact: TrustedContact) => {
    const traveler = authUser?.displayName || 'Explorateur MANGOREMA';
    const sendWithCoords = async (lat: number, lng: number, gpsAccurate: boolean) => {
      const subject = `ALERTE SÉCURITÉ MANGOREMA — Position de ${traveler}`;
      const body = `ALERTE SÉCURITÉ MANGOREMA GABON\nDe : ${traveler}\nPosition GPS${
        gpsAccurate ? ' (capteur actif)' : ' (dernière zone connue Libreville/Gabon)'
      } : ${lat.toFixed(5)}, ${lng.toFixed(5)}\nCarte : https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}\nUrgence écogardes ANPN : 1404.`;
      await deliverMessageToContact(contact, subject, body, 'SAFETY');
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendWithCoords(pos.coords.latitude, pos.coords.longitude, true);
        },
        () => {
          sendWithCoords(0.5833, 9.35, false);
        },
        { enableHighAccuracy: true, timeout: 4500 }
      );
    } else {
      await sendWithCoords(0.5833, 9.35, false);
    }
  };

  const handleRequestGmailShare = (contact: TrustedContact, mode: 'PLAN' | 'SAFETY') => {
    if (!contact.email) return;

    if (mode === 'PLAN') {
      const { subject, body } = buildSelectedExpeditionSummary();
      setPendingGmailShare({ contact, subject, body, mode: 'PLAN' });
      return;
    }

    const traveler = authUser?.displayName || 'Explorateur MANGOREMA';
    const openSafetyConfirm = (lat: number, lng: number, gpsAccurate: boolean) => {
      const subject = `ALERTE SÉCURITÉ MANGOREMA — Position de ${traveler}`;
      const body = `ALERTE SÉCURITÉ MANGOREMA GABON\nDe : ${traveler}\nPosition GPS${
        gpsAccurate ? ' (capteur actif)' : ' (zone estimée Libreville/Gabon)'
      } : ${lat.toFixed(5)}, ${lng.toFixed(5)}\nCarte : https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}\nUrgence écogardes ANPN : 1404.`;
      setPendingGmailShare({ contact, subject, body, mode: 'SAFETY' });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => openSafetyConfirm(pos.coords.latitude, pos.coords.longitude, true),
        () => openSafetyConfirm(0.5833, 9.35, false),
        { enableHighAccuracy: true, timeout: 4000 }
      );
    } else {
      openSafetyConfirm(0.5833, 9.35, false);
    }
  };

  const handleConfirmGmailSend = async () => {
    if (!pendingGmailShare?.contact.email) return;
    setIsSendingGmail(true);
    try {
      let token = getGoogleAccessToken();
      if (!token) {
        token = await refreshWorkspaceAccessToken();
        setNeedsReauth(false);
      }
      await sendGmailMessage(token, {
        to: pendingGmailShare.contact.email,
        subject: pendingGmailShare.subject,
        body: pendingGmailShare.body,
      });
      showFeedback(
        'success',
        `${pendingGmailShare.mode === 'SAFETY' ? 'Alerte sécurité' : 'Plan d’expédition'} envoyé par Gmail à ${pendingGmailShare.contact.displayName}.`
      );
      setPendingGmailShare(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'TOKEN_EXPIRED_OR_DENIED') {
        setNeedsReauth(true);
        showFeedback('warn', 'Session Google expirée. Réessayez pour autoriser l’envoi via Gmail.');
      } else {
        showFeedback('warn', msg || 'Échec de l’envoi Gmail.');
      }
    } finally {
      setIsSendingGmail(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-amber-500/35 rounded-3xl p-4 space-y-3.5 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white">
                Contacts Google &amp; Proches ({trustedContacts.length})
              </h3>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Importez vos contacts Google pour partager plans d&apos;expédition et alertes sécurité
            </p>
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

      {!authUser ? (
        <div className="bg-stone-50 dark:bg-slate-950/75 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Connectez votre compte Google pour importer vos contacts et sauvegarder vos proches sur Firestore.
          </p>
          {onSignInGoogle && (
            <button
              type="button"
              onClick={onSignInGoogle}
              disabled={isAuthLoading}
              className="min-h-[44px] px-3 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow shrink-0 active:scale-95 transition disabled:opacity-60"
            >
              {isAuthLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
              <span>Connexion Google</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Google Contacts OAuth Import Button */}
          <div className="bg-stone-50 dark:bg-slate-950/75 border border-stone-200 dark:border-white/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Synchronisation API Google Contacts
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block">
                {needsReauth
                  ? 'Autorisez l’accès lecture seule/contacts en mémoire pour importer vos proches.'
                  : 'Accès Google People API prêt pour importer vos contacts.'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleImportGoogleContacts(needsReauth)}
              disabled={isLoadingContacts}
              className="min-h-[44px] px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-300 dark:border-white/20 text-slate-900 dark:text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm active:scale-95 transition shrink-0 disabled:opacity-60"
            >
              {isLoadingContacts ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
              ) : (
                <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
              <span>
                {contactsLoadedOnce
                  ? 'Actualiser mes Contacts Google'
                  : 'Importer depuis Google Contacts'}
              </span>
            </button>
          </div>

          {/* Fetched Google Contacts Picker */}
          {contactsLoadedOnce && (
            <div className="bg-stone-50 dark:bg-slate-950/80 border border-amber-500/30 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Carnet Google ({filteredCandidates.length})
                </span>
                <button
                  type="button"
                  onClick={() => setContactsLoadedOnce(false)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Masquer
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrer par nom, téléphone ou e-mail..."
                  className="w-full min-h-[44px] bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="max-h-56 overflow-y-auto no-scrollbar space-y-1.5 pr-0.5">
                {filteredCandidates.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-3">
                    Aucun contact Google correspondant.
                  </p>
                ) : (
                  filteredCandidates.map((cand) => {
                    const alreadySynced = syncedResourceNames.has(cand.resourceName);
                    const isSavingThis = savingResourceName === cand.resourceName;

                    return (
                      <div
                        key={cand.resourceName}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {sanitizeImageUrl(cand.photoUrl) ? (
                            <img
                              src={sanitizeImageUrl(cand.photoUrl)}
                              alt={cand.displayName}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full object-cover shrink-0 border border-stone-200 dark:border-white/15"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {cand.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                              {cand.displayName}
                            </span>
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate">
                              {[cand.phoneNumber, cand.email].filter(Boolean).join(' · ') || 'Contact Google'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={alreadySynced || isSavingThis}
                          onClick={() => handleAddCandidateToFirestore(cand)}
                          className={`min-h-[44px] px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 transition ${
                            alreadySynced
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                              : 'copper-gradient text-slate-950 shadow-sm active:scale-95'
                          }`}
                        >
                          {isSavingThis ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : alreadySynced ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Synchronisé</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Ajouter</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Plan Selector for Quick Expedition Sharing */}
          {trustedContacts.length > 0 && (bookings.length > 0 || events.length > 0) && (
            <div className="bg-stone-50 dark:bg-slate-950/65 border border-stone-200 dark:border-white/10 rounded-2xl p-3 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Plan d&apos;expédition prêt à partager avec vos proches :</span>
              </label>
              <select
                value={selectedPlanKey}
                onChange={(e) => setSelectedPlanKey(e.target.value)}
                className="w-full min-h-[44px] bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={`booking:${b.id}`}>
                    🎫 Billet : {b.eventTitle} ({b.eventDate})
                  </option>
                ))}
                {events.map((evt) => (
                  <option key={evt.id} value={`event:${evt.id}`}>
                    🧭 Itinéraire : {evt.title} ({evt.date})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Synced Trusted Contacts List */}
          {trustedContacts.length === 0 ? (
            <div className="bg-stone-50 dark:bg-slate-950/60 border border-dashed border-stone-300 dark:border-white/15 rounded-2xl p-4 text-center space-y-1.5">
              <Users className="w-6 h-6 text-amber-600/70 dark:text-amber-400/70 mx-auto" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Aucun proche synchronisé pour le moment
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                Importez vos contacts Google ci-dessus pour envoyer en un geste votre itinéraire ou votre position GPS SOS.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {trustedContacts.map((contact) => {
                const isConfirmingDelete = confirmDeleteId === contact.id;

                return (
                  <div
                    key={contact.id}
                    className="bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {sanitizeImageUrl(contact.photoUrl) ? (
                          <img
                            src={sanitizeImageUrl(contact.photoUrl)}
                            alt={contact.displayName}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-amber-500/40"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                            {contact.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {contact.displayName}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                            {contact.phoneNumber && (
                              <span className="flex items-center gap-0.5 font-mono">
                                <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                {contact.phoneNumber}
                              </span>
                            )}
                            {contact.email && (
                              <span className="flex items-center gap-0.5 truncate">
                                <Mail className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                {contact.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDeleteId(isConfirmingDelete ? null : contact.id)
                        }
                        className="min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition shrink-0"
                        title="Retirer ce proche"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Preferences */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateContact({
                            ...contact,
                            shareExpeditionPlans: !contact.shareExpeditionPlans,
                          })
                        }
                        className={`min-h-[44px] px-2.5 py-1 rounded-xl border font-semibold flex items-center gap-1 transition ${
                          contact.shareExpeditionPlans
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                            : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-500'
                        }`}
                      >
                        <Compass className="w-3 h-3" />
                        <span>Plans expédition</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onUpdateContact({
                            ...contact,
                            shareSafetyAlerts: !contact.shareSafetyAlerts,
                          })
                        }
                        className={`min-h-[44px] px-2.5 py-1 rounded-xl border font-semibold flex items-center gap-1 transition ${
                          contact.shareSafetyAlerts
                            ? 'bg-red-50 dark:bg-red-950/50 border-red-500/40 text-red-700 dark:text-red-300'
                            : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-500'
                        }`}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>Alertes sécurité</span>
                      </button>
                    </div>

                    {/* Direct Sharing Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-stone-200 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => handleShareExpeditionPlan(contact)}
                        className="min-h-[44px] px-3 py-1.5 copper-gradient text-slate-950 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Partager le plan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareSafetyAlert(contact)}
                        className="min-h-[44px] px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Alerte GPS SOS</span>
                      </button>
                    </div>

                    {contact.email && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleRequestGmailShare(contact, 'PLAN')}
                          className="min-h-[40px] px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-stone-100 dark:hover:bg-slate-800 border border-amber-500/35 text-amber-800 dark:text-amber-300 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition"
                        >
                          <Mail className="w-3 h-3 shrink-0" />
                          <span>Plan par Gmail</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestGmailShare(contact, 'SAFETY')}
                          className="min-h-[40px] px-2.5 py-1.5 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-400/50 text-red-700 dark:text-red-300 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition"
                        >
                          <Mail className="w-3 h-3 shrink-0" />
                          <span>SOS par Gmail</span>
                        </button>
                      </div>
                    )}

                    {isConfirmingDelete && (
                      <div className="pt-2 border-t border-red-300 dark:border-red-900/50 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] font-semibold text-red-700 dark:text-red-300">
                          Retirer {contact.displayName} ?
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[44px] px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteContact(contact.id);
                              setConfirmDeleteId(null);
                            }}
                            className="min-h-[44px] px-3 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold"
                          >
                            Confirmer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Explicit Confirmation Modal Before Sending Email via Gmail API */}
      {pendingGmailShare && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#111714] border border-amber-500/40 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  pendingGmailShare.mode === 'SAFETY'
                    ? 'bg-red-600 text-white'
                    : 'copper-gradient text-slate-950'
                }`}
              >
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif-display font-bold text-base text-slate-900 dark:text-white">
                  Confirmer l’envoi via Gmail ?
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Cet e-mail sera envoyé depuis votre boîte Gmail à {pendingGmailShare.contact.displayName}.
                </p>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-slate-950/90 border border-stone-200 dark:border-white/10 rounded-2xl p-3 space-y-1.5 text-xs">
              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 block truncate">
                À : {pendingGmailShare.contact.email}
              </span>
              <p className="font-bold text-slate-900 dark:text-white truncate">
                {pendingGmailShare.subject}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-4 whitespace-pre-wrap">
                {pendingGmailShare.body}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isSendingGmail}
                onClick={() => setPendingGmailShare(null)}
                className="min-h-[44px] px-3 py-2 bg-stone-100 dark:bg-slate-900 border border-stone-300 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSendingGmail}
                onClick={handleConfirmGmailSend}
                className={`min-h-[44px] px-3 py-2 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow ${
                  pendingGmailShare.mode === 'SAFETY'
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'copper-gradient text-slate-950'
                }`}
              >
                {isSendingGmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Envoyer par Gmail</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
