/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TabType, ExpeditionEvent, ShuttleService, SafetyIncident, Booking, UserProfile, ExpeditionPhoto, ExpertGuide, RentalItem, ExpeditionReview, EcoChallengeDefinition, EcoChallengeCompletion } from './types';
import { INITIAL_EVENTS, INITIAL_SHUTTLES, INITIAL_INCIDENTS, INITIAL_USER, INITIAL_EXPEDITION_PHOTOS, INITIAL_EXPERTS, INITIAL_RENTALS, INITIAL_EXPEDITION_REVIEWS } from './data/mockData';
import { ECO_CHALLENGES_CATALOG, computeEcoProgress, getEcoChallengeByEventId } from './data/ecoChallenges';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomeView } from './components/views/HomeView';
import { ExplorerView } from './components/views/ExplorerView';
import { SortiesView } from './components/views/SortiesView';
import { TransportsView } from './components/views/TransportsView';
import { SafetyView } from './components/views/SafetyView';
import { ProfileView } from './components/views/ProfileView';
import { MultiServiceCartModal } from './components/MultiServiceCartModal';
import { ShuttleBookingModal } from './components/ShuttleBookingModal';
import { SOSModal } from './components/SOSModal';
import { GPSTrackerModal } from './components/GPSTrackerModal';
import { CapacitorGuideModal } from './components/CapacitorGuideModal';
import { ChecklistModal } from './components/ChecklistModal';
import { FavoritePhotosModal } from './components/FavoritePhotosModal';
import { TopThreePhotosModal } from './components/TopThreePhotosModal';
import { ExpertBookingModal } from './components/ExpertBookingModal';
import { RentalModal } from './components/RentalModal';
import { OfflineMapsModal } from './components/OfflineMapsModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { EcoChallengeValidationModal } from './components/EcoChallengesSection';
import { SplashScreen } from './components/SplashScreen';
import { WifiOff, CheckCircle2, BellRing, X, ArrowRight } from 'lucide-react';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { getStoredNotifications, checkDueNotifications } from './utils/notificationService';
import {
  ThemeMode,
  ThemeSchedule,
  getStoredThemeMode,
  saveThemeMode,
  getStoredThemeSchedule,
  saveThemeSchedule,
  resolveIsDarkTheme,
  applyThemeToDocument,
  formatHourLabel,
} from './utils/themeService';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  logoutUser,
  loadOrCreateUserProfile,
  updateUserProfileFields,
  saveBookingToFirestore,
  subscribeUserBookings,
  saveIncidentToFirestore,
  subscribeUserIncidents,
  saveExpeditionReviewToFirestore,
  deleteExpeditionReviewFromFirestore,
  subscribeExpeditionReviews,
  saveEcoChallengeAndSyncProfile,
  deleteEcoChallengeAndSyncProfile,
  subscribeUserEcoChallenges,
} from './firebase';

export default function App() {
  const isOnline = useOnlineStatus();

  // Theme & Time-of-Day Automatic Mode State
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredThemeMode());
  const [themeSchedule, setThemeSchedule] = useState<ThemeSchedule>(() => getStoredThemeSchedule());
  const [clockTick, setClockTick] = useState<Date>(() => new Date());
  const isDarkMode = resolveIsDarkTheme(themeMode, themeSchedule, clockTick);

  useEffect(() => {
    applyThemeToDocument(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (themeMode !== 'auto') return;

    const refreshClock = () => setClockTick(new Date());
    refreshClock();

    const interval = setInterval(refreshClock, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshClock();
      }
    };
    window.addEventListener('focus', refreshClock);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshClock);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [themeMode, themeSchedule]);

  // Core Data States
  const [events] = useState<ExpeditionEvent[]>(INITIAL_EVENTS);
  const [shuttles, setShuttles] = useState<ShuttleService[]>(INITIAL_SHUTTLES);
  const [incidents, setIncidents] = useState<SafetyIncident[]>(INITIAL_INCIDENTS);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'bk-default-1',
      refNumber: 'MANG-AIRTEL-782194',
      eventId: 'evt-1',
      eventTitle: 'Bivouac & Canopée Mondah',
      eventDate: 'Samedi 14 Nov 2026',
      location: 'Parc Nat. Mondah',
      shuttleIncluded: true,
      shuttleDetail: 'Navette Charbonnages 06h30',
      tentIncluded: true,
      guideIncluded: true,
      totalAmount: 22500,
      paymentMethod: 'AIRTEL',
      payerPhone: '+241 74 12 34 56',
      timestamp: '07 Nov 2026, 14:32',
      status: 'CONFIRMED',
      qrCodeSeed: 'MANGOREMA-PASS:MANG-AIRTEL-782194:22500:GABON',
    },
  ]);

  // Photos, Reviews & Ecological Zero-Waste Challenges State
  const [photos, setPhotos] = useState<ExpeditionPhoto[]>(INITIAL_EXPEDITION_PHOTOS);
  const [reviews, setReviews] = useState<ExpeditionReview[]>(INITIAL_EXPEDITION_REVIEWS);
  const [ecoChallenges, setEcoChallenges] = useState<EcoChallengeCompletion[]>([]);
  const [selectedEcoChallengeForModal, setSelectedEcoChallengeForModal] = useState<EcoChallengeDefinition | null>(null);
  const [isFavoritePhotosModalOpen, setIsFavoritePhotosModalOpen] = useState(false);
  const [isTopThreeModalOpen, setIsTopThreeModalOpen] = useState(false);

  // Experts & Rentals State
  const [experts] = useState<ExpertGuide[]>(INITIAL_EXPERTS);
  const [rentals] = useState<RentalItem[]>(INITIAL_RENTALS);
  const [selectedExpertForBooking, setSelectedExpertForBooking] = useState<ExpertGuide | null>(null);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [isOfflineMapsModalOpen, setIsOfflineMapsModalOpen] = useState(false);

  // Local Notifications (API Web Notification) State
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [activeAlertBanner, setActiveAlertBanner] = useState<{ title: string; body: string } | null>(null);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(1);

  // Background check for due notifications (every 20s & on focus)
  useEffect(() => {
    const refreshCount = () => {
      const notifs = getStoredNotifications();
      setActiveAlertsCount(notifs.filter((n) => n.enabled).length);
    };

    const runNotificationCheck = () => {
      const updated = checkDueNotifications((triggered) => {
        setActiveAlertBanner({
          title: triggered.title,
          body: triggered.body,
        });
      });
      setActiveAlertsCount(updated.filter((n) => n.enabled).length);
    };

    refreshCount();
    runNotificationCheck();

    const interval = setInterval(runNotificationCheck, 20000);
    window.addEventListener('focus', runNotificationCheck);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', runNotificationCheck);
    };
  }, [bookings, shuttles]);

  // Firebase Auth & Cloud Firestore Sync State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    let unsubBookings: (() => void) | null = null;
    let unsubIncidents: (() => void) | null = null;
    let unsubReviews: (() => void) | null = null;
    let unsubEcoChallenges: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (unsubBookings) {
        unsubBookings();
        unsubBookings = null;
      }
      if (unsubIncidents) {
        unsubIncidents();
        unsubIncidents = null;
      }
      if (unsubReviews) {
        unsubReviews();
        unsubReviews = null;
      }
      if (unsubEcoChallenges) {
        unsubEcoChallenges();
        unsubEcoChallenges = null;
      }

      setFirebaseUser(fbUser);
      setAuthReady(true);

      if (fbUser && fbUser.emailVerified) {
        try {
          const syncedProfile = await loadOrCreateUserProfile(fbUser, INITIAL_USER);
          setUser(syncedProfile);

          unsubBookings = subscribeUserBookings(
            fbUser.uid,
            (cloudBookings) => {
              setBookings((prev) => {
                const cloudIds = new Set(cloudBookings.map((b) => b.id));
                const defaultOnly = prev.filter((b) => b.id === 'bk-default-1' && !cloudIds.has(b.id));
                return [...cloudBookings, ...defaultOnly];
              });
            },
            (err) => console.error('Firestore bookings sync error:', err)
          );

          unsubIncidents = subscribeUserIncidents(
            fbUser.uid,
            (cloudIncidents) => {
              const cloudIds = new Set(cloudIncidents.map((i) => i.id));
              const initialRemaining = INITIAL_INCIDENTS.filter((i) => !cloudIds.has(i.id));
              setIncidents([...cloudIncidents, ...initialRemaining]);
            },
            (err) => console.error('Firestore incidents sync error:', err)
          );

          unsubReviews = subscribeExpeditionReviews(
            (cloudReviews) => {
              const cloudIds = new Set(cloudReviews.map((r) => r.id));
              const seedRemaining = INITIAL_EXPEDITION_REVIEWS.filter((r) => !cloudIds.has(r.id));
              setReviews([...cloudReviews, ...seedRemaining]);
            },
            (err) => console.error('Firestore reviews sync error:', err)
          );

          unsubEcoChallenges = subscribeUserEcoChallenges(
            fbUser.uid,
            (cloudChallenges) => {
              setEcoChallenges(cloudChallenges);
              const progress = computeEcoProgress(cloudChallenges);
              setUser((prev) => ({
                ...prev,
                ecoPoints: progress.ecoPoints,
                zeroWasteExpeditionsCount: progress.zeroWasteExpeditionsCount,
                unlockedBadgeIds: progress.unlockedBadgeIds,
              }));
            },
            (err) => console.error('Firestore eco challenges sync error:', err)
          );
        } catch (err) {
          console.error('Erreur chargement profil Firestore:', err);
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubBookings) unsubBookings();
      if (unsubIncidents) unsubIncidents();
      if (unsubReviews) unsubReviews();
      if (unsubEcoChallenges) unsubEcoChallenges();
    };
  }, []);

  const handleSignInGoogle = async () => {
    setIsAuthLoading(true);
    try {
      const signedIn = await signInWithGoogle();
      showToast('Connexion Google Réussie', `Bienvenue ${signedIn.displayName || signedIn.email} ! Données synchronisées.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connexion annulée.';
      showToast('Connexion Google', msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setUser(INITIAL_USER);
      setIncidents(INITIAL_INCIDENTS);
      setReviews(INITIAL_EXPEDITION_REVIEWS);
      setEcoChallenges([]);
      showToast('Déconnecté', 'Session Google fermée. Vos données restent sauvegardées sur Firestore.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la déconnexion.';
      showToast('Erreur Déconnexion', msg);
    }
  };

  const handleAddExpeditionReview = async (payload: {
    eventId: string;
    rating: number;
    comment: string;
    photoUrl?: string;
  }) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Veuillez vous connecter avec Google pour publier un avis sur Firestore.');
    }
    const reviewId = `rev-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const createdAtLabel = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    await saveExpeditionReviewToFirestore(firebaseUser.uid, {
      id: reviewId,
      eventId: payload.eventId,
      authorName: firebaseUser.displayName || user.name,
      authorAvatar: firebaseUser.photoURL || user.avatar,
      rating: payload.rating,
      comment: payload.comment,
      photoUrl: payload.photoUrl,
      createdAtLabel,
    });

    showToast('Avis Publié !', 'Votre note et votre commentaire ont été synchronisés avec Firestore.');
  };

  const handleDeleteExpeditionReview = async (reviewId: string) => {
    await deleteExpeditionReviewFromFirestore(reviewId);
    showToast('Avis Supprimé', 'Votre commentaire a été retiré de Firestore.');
  };

  const handleCompleteEcoChallenge = async (payload: {
    challenge: EcoChallengeDefinition;
    wasteNote?: string;
  }) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Veuillez vous connecter avec Google pour valider ce défi sur Firestore.');
    }

    const completedAtLabel = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newCompletion: EcoChallengeCompletion = {
      id: payload.challenge.challengeId,
      userId: firebaseUser.uid,
      eventId: payload.challenge.eventId,
      eventTitle: payload.challenge.eventTitle,
      parkName: payload.challenge.parkName,
      badgeId: payload.challenge.badge.id,
      badgeName: payload.challenge.badge.name,
      badgeIcon: payload.challenge.badge.icon,
      wasteBagReturned: true,
      leaveNoTracePledge: true,
      wasteNote: payload.wasteNote,
      ecoPoints: payload.challenge.ecoPoints,
      completedAtLabel,
    };

    const nextList = [
      newCompletion,
      ...ecoChallenges.filter((c) => c.id !== newCompletion.id),
    ];

    await saveEcoChallengeAndSyncProfile(firebaseUser.uid, newCompletion, nextList);
    const progress = computeEcoProgress(nextList);
    setEcoChallenges(nextList);
    setUser((prev) => ({
      ...prev,
      ecoPoints: progress.ecoPoints,
      zeroWasteExpeditionsCount: progress.zeroWasteExpeditionsCount,
      unlockedBadgeIds: progress.unlockedBadgeIds,
    }));
    showToast(
      `Badge Débloqué : ${payload.challenge.badge.name}`,
      `+${payload.challenge.ecoPoints} pts éco synchronisés avec votre profil Firebase.`
    );
  };

  const handleRemoveEcoChallenge = async (challengeId: string) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Veuillez vous connecter avec Google pour modifier vos défis.');
    }

    const remaining = ecoChallenges.filter((c) => c.id !== challengeId);
    await deleteEcoChallengeAndSyncProfile(firebaseUser.uid, challengeId, remaining);
    const progress = computeEcoProgress(remaining);
    setEcoChallenges(remaining);
    setUser((prev) => ({
      ...prev,
      ecoPoints: progress.ecoPoints,
      zeroWasteExpeditionsCount: progress.zeroWasteExpeditionsCount,
      unlockedBadgeIds: progress.unlockedBadgeIds,
    }));
    showToast('Défi Retiré', 'Validation Zéro Déchet supprimée de votre profil Firestore.');
  };

  // Tab & Modals Navigation
  const [activeTab, setActiveTab] = useState<TabType>('accueil');
  const [selectedEventForCart, setSelectedEventForCart] = useState<ExpeditionEvent | null>(null);
  const [isShuttleModalOpen, setIsShuttleModalOpen] = useState(false);
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [isGPSTrackerOpen, setIsGPSTrackerOpen] = useState(false);
  const [isCapacitorGuideOpen, setIsCapacitorGuideOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // Displays official logo screen when app opens

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<{ title: string; desc: string } | null>(null);

  const showToast = (title: string, desc: string) => {
    setToastMsg({ title, desc });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleToggleDarkMode = () => {
    const nextMode: ThemeMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(nextMode);
    saveThemeMode(nextMode);
    showToast(
      nextMode === 'dark' ? 'Mode Sombre Activé' : 'Mode Clair Activé',
      nextMode === 'dark'
        ? 'Affichage sombre activé manuellement pour la lecture nocturne.'
        : 'Affichage clair activé manuellement pour une lisibilité optimale en plein jour.'
    );
  };

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemeMode(mode);
    setClockTick(new Date());
    if (mode === 'auto') {
      showToast(
        'Bascule Automatique Activée',
        `Mode Clair dès ${formatHourLabel(themeSchedule.dayStartHour)} · Mode Sombre dès ${formatHourLabel(themeSchedule.nightStartHour)}.`
      );
    } else {
      showToast(
        mode === 'dark' ? 'Mode Sombre Manuel' : 'Mode Clair Manuel',
        'Votre préférence d’affichage a été enregistrée.'
      );
    }
  };

  const handleUpdateThemeSchedule = (nextSchedule: ThemeSchedule) => {
    const saved = saveThemeSchedule(nextSchedule);
    setThemeSchedule(saved);
    setThemeMode('auto');
    saveThemeMode('auto');
    setClockTick(new Date());
    showToast(
      'Horaires Automatiques Enregistrés',
      `Clair à ${formatHourLabel(saved.dayStartHour)} · Sombre à ${formatHourLabel(saved.nightStartHour)}.`
    );
  };

  const handleBookingConfirmed = (newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
    if (firebaseUser && authReady) {
      saveBookingToFirestore(firebaseUser.uid, newBooking).catch((err) =>
        console.error('Erreur sauvegarde billet Firestore:', err)
      );
    }
    showToast('Réservation Validée !', `Pass ${newBooking.refNumber} généré.`);
  };

  const handleBookShuttle = (shuttle: ShuttleService) => {
    setShuttles((prev) =>
      prev.map((s) =>
        s.id === shuttle.id ? { ...s, bookedSeats: Math.min(s.totalSeats, s.bookedSeats + 1) } : s
      )
    );

    const ref = `MANG-NAV-${Math.floor(100000 + Math.random() * 900000)}`;
    const shuttleBooking: Booking = {
      id: `bk-shut-${Date.now()}`,
      refNumber: ref,
      eventId: shuttle.id,
      eventTitle: `Navette ${shuttle.type} → ${shuttle.destination}`,
      eventDate: `Départ ${shuttle.departureTime}`,
      location: shuttle.departurePoint,
      shuttleIncluded: true,
      shuttleDetail: `${shuttle.model} (${shuttle.departureTime})`,
      tentIncluded: false,
      guideIncluded: false,
      totalAmount: shuttle.price,
      paymentMethod: 'AIRTEL',
      payerPhone: user.phone,
      timestamp: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'CONFIRMED',
      qrCodeSeed: `MANGOREMA-SHUTTLE:${ref}:${shuttle.id}:${shuttle.price}`,
    };

    setBookings((prev) => [shuttleBooking, ...prev]);
    if (firebaseUser && authReady) {
      saveBookingToFirestore(firebaseUser.uid, shuttleBooking).catch((err) =>
        console.error('Erreur sauvegarde billet navette Firestore:', err)
      );
    }

    showToast('Navette Confirmée', `Place réservée (${shuttle.departurePoint}) · Pass ${ref} ajouté.`);
  };

  const handleAddIncident = (newInc: Omit<SafetyIncident, 'id' | 'reportedAt'>) => {
    const created: SafetyIncident = {
      ...newInc,
      id: `inc-${Date.now()}`,
      reportedAt: "À l'instant",
    };
    setIncidents((prev) => [created, ...prev]);
    if (firebaseUser && authReady) {
      saveIncidentToFirestore(firebaseUser.uid, created).catch((err) =>
        console.error('Erreur sauvegarde incident Firestore:', err)
      );
    }
    showToast('Signalement Transmis', 'Alerte sentier partagée avec les écogardes ANPN.');
  };

  const handleFinishGPSActivity = (stats: { km: number; ascent: number; durationSeconds: number }) => {
    setUser((prev) => {
      const updated: UserProfile = {
        ...prev,
        totalKm: Number((prev.totalKm + stats.km).toFixed(1)),
        totalAscent: prev.totalAscent + stats.ascent,
        stepsCount: prev.stepsCount + Math.floor(stats.km * 1400),
      };
      if (firebaseUser && authReady) {
        updateUserProfileFields(firebaseUser.uid, updated).catch((err) =>
          console.error('Erreur mise à jour stats Firestore:', err)
        );
      }
      return updated;
    });
    showToast('Sortie Enregistrée', `+${stats.km} km ajoutés à vos statistiques.`);
  };

  const handleSaveFavoritePhotos = (newFavoriteIds: string[], updatedPhotos: ExpeditionPhoto[]) => {
    setPhotos(updatedPhotos);
    setUser((prev) => {
      const updated = {
        ...prev,
        favoritePhotoIds: newFavoriteIds,
      };
      if (firebaseUser && authReady) {
        updateUserProfileFields(firebaseUser.uid, updated).catch((err) =>
          console.error('Erreur sauvegarde favoris Firestore:', err)
        );
      }
      return updated;
    });
    showToast('Photos Coup de Cœur Mises à Jour', `${newFavoriteIds.length} photo(s) affichée(s) sur votre profil.`);
  };

  const handleSaveTopThreePhotos = (newTopThreeIds: string[], updatedPhotos?: ExpeditionPhoto[]) => {
    if (updatedPhotos) {
      setPhotos(updatedPhotos);
    }
    setUser((prev) => {
      const updated = {
        ...prev,
        topThreePhotoIds: newTopThreeIds,
      };
      if (firebaseUser && authReady) {
        updateUserProfileFields(firebaseUser.uid, updated).catch((err) =>
          console.error('Erreur sauvegarde Top 3 Firestore:', err)
        );
      }
      return updated;
    });
    showToast('Top 3 Mis à Jour', 'Vos 3 photos d\'expéditions favorites sont affichées en tête de profil.');
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-[#080B09] text-slate-900 dark:text-slate-100 flex justify-center transition-colors duration-200">
      <div className="w-full max-w-md bg-[#FAFAF7] dark:bg-[#0c100e] min-h-screen flex flex-col relative border-x border-stone-200 dark:border-white/5 shadow-2xl transition-colors duration-200">
        
        {/* Animated Onboarding Splash (when user requests it) */}
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

        {/* Global Toast Notification */}
        {toastMsg && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm bg-white/95 dark:bg-[#121614]/95 border border-amber-500/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs">
              <strong className="text-slate-900 dark:text-white block font-bold">{toastMsg.title}</strong>
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">{toastMsg.desc}</span>
            </div>
          </div>
        )}

        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-amber-600/90 text-slate-950 font-bold text-[11px] px-3 py-1 text-center flex items-center justify-center gap-1.5 z-40">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Mode Hors-ligne : les cartes et billets sont chargés depuis le cache local.</span>
          </div>
        )}

        {/* Top Header */}
        <Header
          user={user}
          onOpenSOS={() => setIsSOSModalOpen(true)}
          onOpenCapacitorGuide={() => setIsCapacitorGuideOpen(true)}
          onOpenProfile={() => setActiveTab('profil')}
          onOpenNotifications={() => setIsNotificationCenterOpen(true)}
          activeAlertsCount={activeAlertsCount}
          isAuthenticated={Boolean(firebaseUser)}
        />

        {/* Urgent H-1 Departure Notification Banner (Local Web Notification Fallback & Visual Alert) */}
        {activeAlertBanner && (
          <div className="mx-4 mt-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-amber-950/95 dark:via-slate-900 dark:to-amber-950/90 border-2 border-amber-500 shadow-2xl animate-in slide-in-from-top-3 flex items-start justify-between gap-3 z-40">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-md">
                <BellRing className="w-4 h-4 fill-current animate-bounce" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider inline-block">
                  Alerte H-1 Départ Imminent
                </span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate mt-0.5">{activeAlertBanner.title}</h4>
                <p className="text-[11px] text-slate-700 dark:text-slate-200 mt-0.5 leading-snug line-clamp-2">{activeAlertBanner.body}</p>
                <button
                  onClick={() => {
                    setActiveAlertBanner(null);
                    setActiveTab('profil');
                  }}
                  className="mt-1.5 text-[10px] text-amber-700 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Consulter mon Pass & billet</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setActiveAlertBanner(null)}
              className="w-7 h-7 rounded-lg bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition shrink-0"
              title="Fermer l'alerte"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar">
          {activeTab === 'accueil' && (
            <HomeView
              events={events}
              shuttles={shuttles}
              ecoChallenges={ecoChallenges}
              ecoPoints={user.ecoPoints ?? 0}
              onSelectEvent={(evt) => setSelectedEventForCart(evt)}
              onOpenShuttles={() => setIsShuttleModalOpen(true)}
              onOpenGPSTracker={() => setIsGPSTrackerOpen(true)}
              onOpenChecklist={() => setIsChecklistOpen(true)}
              onOpenSOS={() => setIsSOSModalOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenRental={() => setIsRentalModalOpen(true)}
              onOpenNextEcoChallenge={() => {
                const completedEventIds = new Set(ecoChallenges.map((c) => c.eventId));
                const next =
                  ECO_CHALLENGES_CATALOG.find((c) => !completedEventIds.has(c.eventId)) ||
                  ECO_CHALLENGES_CATALOG[0];
                setSelectedEcoChallengeForModal(next);
              }}
              onOpenChallengeModal={(challenge) => setSelectedEcoChallengeForModal(challenge)}
              onNotifyBanner={(title, body) => setActiveAlertBanner({ title, body })}
              onSyncNotificationsCount={() => {
                const notifs = getStoredNotifications();
                setActiveAlertsCount(notifs.filter((n) => n.enabled).length);
              }}
            />
          )}

          {activeTab === 'explorer' && (
            <ExplorerView
              events={events}
              experts={experts}
              photos={photos}
              reviews={reviews}
              authUser={
                firebaseUser
                  ? {
                      uid: firebaseUser.uid,
                      email: firebaseUser.email,
                      displayName: firebaseUser.displayName,
                      photoURL: firebaseUser.photoURL,
                    }
                  : null
              }
              onSelectEvent={(evt) => setSelectedEventForCart(evt)}
              onOpenGPSTracker={() => setIsGPSTrackerOpen(true)}
              onBookExpert={(exp) => setSelectedExpertForBooking(exp)}
              onSignInGoogle={handleSignInGoogle}
              onAddReview={handleAddExpeditionReview}
              onDeleteReview={handleDeleteExpeditionReview}
            />
          )}

          {activeTab === 'sorties' && (
            <SortiesView
              events={events}
              ecoChallenges={ecoChallenges}
              onSelectEvent={(evt) => setSelectedEventForCart(evt)}
              onOpenEcoChallenge={(evt) => {
                const challenge = getEcoChallengeByEventId(evt.id);
                if (challenge) setSelectedEcoChallengeForModal(challenge);
              }}
            />
          )}

          {activeTab === 'transports' && (
            <TransportsView
              shuttles={shuttles}
              onOpenBookingModal={(shuttle) => setIsShuttleModalOpen(true)}
              onOpenRental={() => setIsRentalModalOpen(true)}
              onAlertScheduled={(msg) => showToast('Alerte H-1 Programmée', msg)}
            />
          )}

          {activeTab === 'safety' && (
            <SafetyView
              incidents={incidents}
              onOpenSOS={() => setIsSOSModalOpen(true)}
              onAddIncident={handleAddIncident}
            />
          )}

          {activeTab === 'profil' && (
            <ProfileView
              user={user}
              bookings={bookings}
              photos={photos}
              ecoChallenges={ecoChallenges}
              onOpenEcoChallengeModal={(challenge) => setSelectedEcoChallengeForModal(challenge)}
              onOpenChecklist={() => setIsChecklistOpen(true)}
              onOpenCapacitorGuide={() => setIsCapacitorGuideOpen(true)}
              onReplayOnboarding={() => setShowSplash(true)}
              onOpenFavoritePhotos={() => setIsFavoritePhotosModalOpen(true)}
              onOpenTopThreeModal={() => setIsTopThreeModalOpen(true)}
              onUpdateTopThree={handleSaveTopThreePhotos}
              onOpenOfflineMaps={() => setIsOfflineMapsModalOpen(true)}
              onOpenNotifications={() => setIsNotificationCenterOpen(true)}
              onTriggerTestNotification={(title, body) => setActiveAlertBanner({ title, body })}
              onRefreshNotificationCount={() => {
                const notifs = getStoredNotifications();
                setActiveAlertsCount(notifs.filter((n) => n.enabled).length);
              }}
              authUser={
                firebaseUser
                  ? {
                      uid: firebaseUser.uid,
                      email: firebaseUser.email,
                      displayName: firebaseUser.displayName,
                      photoURL: firebaseUser.photoURL,
                    }
                  : null
              }
              isAuthLoading={isAuthLoading}
              onSignInGoogle={handleSignInGoogle}
              onSignOut={handleSignOut}
              themeMode={themeMode}
              isDarkMode={isDarkMode}
              themeSchedule={themeSchedule}
              onToggleDarkMode={handleToggleDarkMode}
              onSetThemeMode={handleSetThemeMode}
              onUpdateThemeSchedule={handleUpdateThemeSchedule}
            />
          )}
        </main>

        {/* Bottom Tab Bar */}
        <Navigation
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          incidentCount={incidents.filter((i) => i.severity === 'high').length}
        />

        {/* Modals & Bottom Sheets */}
        <MultiServiceCartModal
          event={selectedEventForCart}
          onClose={() => setSelectedEventForCart(null)}
          onBookingConfirmed={handleBookingConfirmed}
        />

        <ShuttleBookingModal
          shuttles={shuttles}
          isOpen={isShuttleModalOpen}
          onClose={() => setIsShuttleModalOpen(false)}
          onBookShuttle={handleBookShuttle}
        />

        <SOSModal
          isOpen={isSOSModalOpen}
          onClose={() => setIsSOSModalOpen(false)}
        />

        <GPSTrackerModal
          isOpen={isGPSTrackerOpen}
          onClose={() => setIsGPSTrackerOpen(false)}
          onFinishActivity={handleFinishGPSActivity}
        />

        <CapacitorGuideModal
          isOpen={isCapacitorGuideOpen}
          onClose={() => setIsCapacitorGuideOpen(false)}
        />

        <ChecklistModal
          isOpen={isChecklistOpen}
          onClose={() => setIsChecklistOpen(false)}
        />

        <FavoritePhotosModal
          photos={photos}
          favoriteIds={user.favoritePhotoIds || []}
          isOpen={isFavoritePhotosModalOpen}
          onClose={() => setIsFavoritePhotosModalOpen(false)}
          onSaveFavorites={handleSaveFavoritePhotos}
        />

        <TopThreePhotosModal
          photos={photos}
          topThreeIds={user.topThreePhotoIds || []}
          isOpen={isTopThreeModalOpen}
          onClose={() => setIsTopThreeModalOpen(false)}
          onSaveTopThree={handleSaveTopThreePhotos}
        />

        <ExpertBookingModal
          expert={selectedExpertForBooking}
          isOpen={Boolean(selectedExpertForBooking)}
          onClose={() => setSelectedExpertForBooking(null)}
          onBookingConfirmed={handleBookingConfirmed}
        />

        <RentalModal
          rentals={rentals}
          isOpen={isRentalModalOpen}
          onClose={() => setIsRentalModalOpen(false)}
          onRentalConfirmed={handleBookingConfirmed}
        />

        <OfflineMapsModal
          isOpen={isOfflineMapsModalOpen}
          onClose={() => setIsOfflineMapsModalOpen(false)}
          onMapsUpdated={() => showToast('Stockage Mis à Jour', 'Cartes hors-ligne actualisées en mémoire locale.')}
        />

        <NotificationCenterModal
          isOpen={isNotificationCenterOpen}
          onClose={() => {
            setIsNotificationCenterOpen(false);
            const notifs = getStoredNotifications();
            setActiveAlertsCount(notifs.filter((n) => n.enabled).length);
          }}
          bookings={bookings}
          onTriggerTestBanner={(title, body) => {
            setActiveAlertBanner({ title, body });
          }}
        />

        <EcoChallengeValidationModal
          challenge={selectedEcoChallengeForModal}
          existingCompletion={
            selectedEcoChallengeForModal
              ? ecoChallenges.find((c) => c.id === selectedEcoChallengeForModal.challengeId)
              : undefined
          }
          isOpen={Boolean(selectedEcoChallengeForModal)}
          onClose={() => setSelectedEcoChallengeForModal(null)}
          authUser={
            firebaseUser
              ? {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                }
              : null
          }
          isAuthLoading={isAuthLoading}
          onSignInGoogle={handleSignInGoogle}
          onConfirmCompletion={handleCompleteEcoChallenge}
          onRemoveCompletion={handleRemoveEcoChallenge}
        />

      </div>
    </div>
  );
}
