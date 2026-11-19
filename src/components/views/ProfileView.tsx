import React, { useState, useEffect } from 'react';
import { UserProfile, Booking, ExpeditionPhoto, EcoChallengeCompletion, EcoChallengeDefinition } from '../../types';
import { Award, QrCode, Smartphone, Backpack, HelpCircle, CheckCircle2, ChevronRight, Bus, Tent, UserCheck, Heart, Camera, Eye, Plus, Star, Sparkles, MapPin, Check, X, ArrowRight, ImagePlus, Calendar, CalendarPlus, CalendarCheck, Download, ExternalLink, Map, HardDrive, Bell, BellRing, Clock, LogIn, LogOut, Cloud, Loader2, Moon, Sun } from 'lucide-react';
import { generateBookingICS, generateAllBookingsICS, downloadICS, getGoogleCalendarUrl } from '../../utils/calendar';
import { getDownloadedMapIds, getTotalStorageUsedMB } from '../../utils/offlineMapStorage';
import { SpendingPieChart } from '../SpendingPieChart';
import { EcoChallengesSection } from '../EcoChallengesSection';
import { WeeklyEcoChallengesSection } from '../WeeklyEcoChallengesSection';
import { BadgesGalleryModal } from '../BadgesGalleryModal';
import { ALL_VIRTUAL_ECO_BADGES } from '../../data/ecoChallenges';
import {
  ThemeMode,
  ThemeSchedule,
  formatHourLabel,
  getNextAutoSwitchInfo,
} from '../../utils/themeService';
import {
  calculateExpeditionTimestamps,
  getStoredNotifications,
  scheduleBookingNotification,
  toggleNotificationEnabled,
  simulateImmediateH1Alert,
  getNotificationPermission,
} from '../../utils/notificationService';

interface ProfileViewProps {
  user: UserProfile;
  bookings: Booking[];
  photos: ExpeditionPhoto[];
  onOpenChecklist: () => void;
  onOpenCapacitorGuide: () => void;
  onReplayOnboarding: () => void;
  onOpenFavoritePhotos: () => void;
  onOpenTopThreeModal?: () => void;
  onUpdateTopThree?: (newTopThreeIds: string[]) => void;
  onOpenOfflineMaps: () => void;
  onOpenNotifications?: () => void;
  onTriggerTestNotification?: (title: string, body: string) => void;
  authUser?: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  isAuthLoading?: boolean;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
  themeMode?: ThemeMode;
  isDarkMode?: boolean;
  themeSchedule?: ThemeSchedule;
  onToggleDarkMode?: () => void;
  onSetThemeMode?: (mode: ThemeMode) => void;
  onUpdateThemeSchedule?: (schedule: ThemeSchedule) => void;
  ecoChallenges?: EcoChallengeCompletion[];
  onOpenEcoChallengeModal?: (challenge: EcoChallengeDefinition) => void;
  onRefreshNotificationCount?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  bookings,
  photos,
  onOpenChecklist,
  onOpenCapacitorGuide,
  onReplayOnboarding,
  onOpenFavoritePhotos,
  onOpenTopThreeModal,
  onUpdateTopThree,
  onOpenOfflineMaps,
  onOpenNotifications,
  onTriggerTestNotification,
  authUser,
  isAuthLoading = false,
  onSignInGoogle,
  onSignOut,
  themeMode = 'auto',
  isDarkMode = true,
  themeSchedule = { dayStartHour: 6, nightStartHour: 19 },
  onToggleDarkMode,
  onSetThemeMode,
  onUpdateThemeSchedule,
  ecoChallenges = [],
  onOpenEcoChallengeModal,
  onRefreshNotificationCount,
}) => {
  const nextAutoSwitch = getNextAutoSwitchInfo(themeSchedule);
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState<ExpeditionPhoto | null>(null);
  const [isBadgesGalleryOpen, setIsBadgesGalleryOpen] = useState(false);
  const [focusedBadgeId, setFocusedBadgeId] = useState<string | null>(null);
  
  // Interactive inline selection state within ProfileView
  const [isInlineSelecting, setIsInlineSelecting] = useState<boolean>(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [selectedParkFilter, setSelectedParkFilter] = useState<string>('all');

  // Calendar Sync State
  const [syncedBookingIds, setSyncedBookingIds] = useState<string[]>([]);
  const [calendarFeedback, setCalendarFeedback] = useState<string | null>(null);

  // Local Notification State (Web Notification API)
  const [scheduledNotifs, setScheduledNotifs] = useState(getStoredNotifications());
  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(null);

  useEffect(() => {
    setScheduledNotifs(getStoredNotifications());
  }, []);

  const handleToggleTicketNotification = (booking: Booking) => {
    const existing = scheduledNotifs.find((n) => n.bookingId === booking.id);
    if (existing) {
      const updated = toggleNotificationEnabled(existing.id);
      setScheduledNotifs(updated);
      setNotificationFeedback(
        existing.enabled
          ? `Rappel H-1 désactivé pour "${booking.eventTitle}".`
          : `Rappel H-1 activé pour "${booking.eventTitle}" ! Déclenchement 1h avant.`
      );
    } else {
      const newNotif = scheduleBookingNotification(booking);
      setScheduledNotifs(getStoredNotifications());
      setNotificationFeedback(`Rappel H-1 programmé pour "${booking.eventTitle}" (${newNotif.alertTimeFormatted}).`);
    }
    setTimeout(() => setNotificationFeedback(null), 4000);
  };

  const handleTriggerTicketNotification = (booking: Booking) => {
    const timestamps = calculateExpeditionTimestamps(booking);
    const title = `🌿 [H-1] Départ dans 1h !`;
    const body = `Votre expédition "${booking.eventTitle}" débute dans 1 heure à ${booking.location}. ${
      booking.shuttleIncluded ? `Navette prévue : ${booking.shuttleDetail || 'Oui'}.` : ''
    } Contrôlez votre Pass QR !`;

    simulateImmediateH1Alert(title, body);
    if (onTriggerTestNotification) {
      onTriggerTestNotification(title, body);
    }
    setNotificationFeedback(`Alerte locale H-1 envoyée pour "${booking.eventTitle}".`);
    setTimeout(() => setNotificationFeedback(null), 4000);
  };

  const handleDownloadSingleICS = (booking: Booking) => {
    const ics = generateBookingICS(booking);
    downloadICS(`MANGOREMA_${booking.refNumber}.ics`, ics);
    setSyncedBookingIds((prev) => Array.from(new Set([...prev, booking.id])));
    setCalendarFeedback(`Fichier .ics téléchargé pour "${booking.eventTitle}". Compatible Apple & Google Calendar.`);
    setTimeout(() => setCalendarFeedback(null), 4000);
  };

  const handleDownloadAllICS = () => {
    if (bookings.length === 0) return;
    const ics = generateAllBookingsICS(bookings);
    downloadICS('MANGOREMA_Toutes_Expeditions.ics', ics);
    setSyncedBookingIds(bookings.map((b) => b.id));
    setCalendarFeedback(`${bookings.length} expédition(s) exportée(s) en .ics pour vos agendas Google & Apple.`);
    setTimeout(() => setCalendarFeedback(null), 4000);
  };

  // Filter user's chosen favorite photos
  const favoritePhotos = photos.filter((p) =>
    user.favoritePhotoIds ? user.favoritePhotoIds.includes(p.id) : p.isFavorite
  );

  // Retrieve user's Top 3 favorite photos from completed expeditions
  const topThreePhotos: (ExpeditionPhoto | undefined)[] = [0, 1, 2].map((idx) => {
    const id = user.topThreePhotoIds?.[idx];
    return id ? photos.find((p) => p.id === id) : undefined;
  });

  const filledCount = topThreePhotos.filter(Boolean).length;

  // Direct selection action inside ProfileView
  const handleAssignPhotoToSlot = (photoId: string, slotIndex: number) => {
    const current = [...(user.topThreePhotoIds || [])];
    // Check if photo is already in another slot and swap or clear
    const existingIndex = current.indexOf(photoId);
    if (existingIndex !== -1 && existingIndex !== slotIndex) {
      current[existingIndex] = '';
    }
    current[slotIndex] = photoId;
    const cleaned = current.slice(0, 3);
    
    if (onUpdateTopThree) {
      onUpdateTopThree(cleaned);
    }

    // Auto-advance to next empty slot if available
    const nextEmptySlot = [0, 1, 2].find((idx) => !cleaned[idx] && idx !== slotIndex);
    if (nextEmptySlot !== undefined) {
      setActiveSlotIndex(nextEmptySlot);
    }
  };

  const handleClearSlot = (slotIndex: number) => {
    const current = [...(user.topThreePhotoIds || [])];
    current[slotIndex] = '';
    const cleaned = current.slice(0, 3);
    if (onUpdateTopThree) {
      onUpdateTopThree(cleaned);
    }
  };

  // Filtered expedition photos for inline selection
  const filteredExpeditionPhotos = photos.filter((p) => {
    if (selectedParkFilter === 'all') return true;
    return p.parkName.toLowerCase().includes(selectedParkFilter.toLowerCase());
  });

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* SECTION TOP 3 PHOTOS FAVORITES D'EXPÉDITIONS RÉALISÉES (EN HAUT DE L'ESPACE PERSONNEL) */}
      <div className="bg-gradient-to-b from-white via-stone-50 to-white dark:from-[#161c18] dark:via-slate-900/95 dark:to-slate-900/90 border border-amber-500/40 dark:border-amber-500/35 rounded-3xl p-4 space-y-3.5 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Section Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-black shadow-md">
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white tracking-wide">
                  Top 3 Expéditions Réalisées
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/35 font-bold px-1.5 py-0.2 rounded-full font-mono">
                  {filledCount}/3 choisis
                </span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">Vos plus beaux clichés mis en valeur en tête de profil</p>
            </div>
          </div>

          <button
            onClick={() => setIsInlineSelecting(!isInlineSelecting)}
            className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1 shadow-md transition shrink-0 active:scale-95 ${
              isInlineSelecting
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'copper-gradient text-slate-950 hover:brightness-110'
            }`}
          >
            {isInlineSelecting ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Terminer</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Choisir</span>
              </>
            )}
          </button>
        </div>

        {/* 3 Featured Photo Slots */}
        <div className="grid grid-cols-3 gap-2 relative z-10">
          {[0, 1, 2].map((slotIdx) => {
            const photo = topThreePhotos[slotIdx];
            const rankLabel = slotIdx === 0 ? '#1 Favori' : `#${slotIdx + 1}`;
            const isCurrentlyTargeted = isInlineSelecting && activeSlotIndex === slotIdx;

            return photo ? (
              <div
                key={photo.id || slotIdx}
                onClick={() => {
                  if (isInlineSelecting) {
                    setActiveSlotIndex(slotIdx);
                  } else {
                    setSelectedPreviewPhoto(photo);
                  }
                }}
                className={`group relative rounded-2xl overflow-hidden aspect-[3/4] border cursor-pointer shadow-lg bg-slate-950 transition-all ${
                  isCurrentlyTargeted
                    ? 'border-amber-400 ring-2 ring-amber-400/70 scale-102'
                    : 'border-amber-500/40 hover:border-amber-400'
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />

                {/* Rank Badge */}
                <div className="absolute top-1.5 left-1.5 z-10">
                  <span
                    className={`px-1.5 py-0.5 rounded-md font-black text-[9px] shadow-md flex items-center gap-0.5 ${
                      slotIdx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : slotIdx === 1
                        ? 'bg-amber-500/90 text-slate-950'
                        : 'bg-amber-600/90 text-slate-950'
                    }`}
                  >
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>{rankLabel}</span>
                  </span>
                </div>

                {/* Status Indicator / Zoom */}
                <div className="absolute top-1.5 right-1.5 z-10">
                  {isInlineSelecting ? (
                    isCurrentlyTargeted ? (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[10px] shadow">
                        ✓
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-black/70 text-amber-400 border border-amber-500/40 flex items-center justify-center text-[9px] font-bold">
                        #{slotIdx + 1}
                      </span>
                    )
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-black/60 text-white/80 flex items-center justify-center opacity-80 group-hover:opacity-100 transition">
                      <Eye className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Bottom Info Overlay */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 text-left pointer-events-none">
                  <span className="text-[7.5px] font-bold text-emerald-400 uppercase tracking-wider block truncate">
                    ✓ {photo.expeditionName || photo.parkName}
                  </span>
                  <p className="text-[10px] font-bold text-white line-clamp-1 leading-tight drop-shadow">
                    {photo.title}
                  </p>
                </div>
              </div>
            ) : (
              <button
                key={slotIdx}
                onClick={() => {
                  setActiveSlotIndex(slotIdx);
                  setIsInlineSelecting(true);
                }}
                className={`rounded-2xl border-2 border-dashed aspect-[3/4] flex flex-col items-center justify-center p-2 text-center transition group cursor-pointer ${
                  isCurrentlyTargeted
                    ? 'border-amber-400 bg-amber-100/70 dark:bg-amber-950/30 ring-2 ring-amber-400/50'
                    : 'border-stone-300 dark:border-white/20 hover:border-amber-500/50 bg-stone-100 dark:bg-slate-950/50 hover:bg-stone-200/70 dark:hover:bg-slate-950/80'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 group-hover:border-amber-500/50 flex items-center justify-center mb-1 text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white block">
                  Photo #{slotIdx + 1}
                </span>
                <span className="text-[8px] text-amber-700 dark:text-amber-400/90 font-medium">Choisir</span>
              </button>
            );
          })}
        </div>

        {/* INLINE EXPEDITION PHOTO SELECTOR (DIRECTEMENT DANS PROFILEVIEW) */}
        {isInlineSelecting && (
          <div className="mt-3 pt-3 border-t border-stone-200 dark:border-white/10 space-y-3 bg-stone-50 dark:bg-[#0e1310]/95 -mx-4 -mb-4 p-4 rounded-b-3xl animate-in fade-in">
            {/* Slot Selector Tabs */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Emplacement cible :</span>
                </span>
                {topThreePhotos[activeSlotIndex] && (
                  <button
                    onClick={() => handleClearSlot(activeSlotIndex)}
                    className="text-[10px] text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-semibold flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" />
                    <span>Vider le Slot #{activeSlotIndex + 1}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((idx) => {
                  const assigned = topThreePhotos[idx];
                  const isActive = activeSlotIndex === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveSlotIndex(idx)}
                      className={`p-2 rounded-xl text-left border transition text-xs flex flex-col justify-between ${
                        isActive
                          ? 'border-amber-500 bg-amber-100/80 dark:bg-amber-950/40 text-slate-900 dark:text-white font-bold ring-1 ring-amber-400'
                          : 'border-stone-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-amber-700 dark:text-amber-400">
                          Slot #{idx + 1}
                        </span>
                        {assigned && <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />}
                      </div>
                      <span className="text-[10px] truncate block mt-0.5 font-medium">
                        {assigned ? assigned.title : 'Emplacement vide'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Chips by Gabon Park */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: 'Toutes les expéditions' },
                { id: 'mondah', label: '🌿 Mondah' },
                { id: 'ivindo', label: '🌊 Ivindo' },
                { id: 'pongara', label: '🏖️ Nyonié' },
                { id: 'cristal', label: '⛰️ Monts de Cristal' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedParkFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition ${
                    selectedParkFilter === tab.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Photo Picker Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto no-scrollbar pr-0.5">
              {filteredExpeditionPhotos.map((photo) => {
                const isSelectedInActiveSlot = user.topThreePhotoIds?.[activeSlotIndex] === photo.id;
                const slotIndexIfAny = user.topThreePhotoIds?.indexOf(photo.id);
                const isInAnotherSlot =
                  slotIndexIfAny !== undefined && slotIndexIfAny !== -1 && slotIndexIfAny !== activeSlotIndex;

                return (
                  <div
                    key={photo.id}
                    onClick={() => handleAssignPhotoToSlot(photo.id, activeSlotIndex)}
                    className={`group relative rounded-xl overflow-hidden aspect-[4/3] border cursor-pointer transition-all ${
                      isSelectedInActiveSlot
                        ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-lg'
                        : isInAnotherSlot
                        ? 'border-emerald-500/60 opacity-80'
                        : 'border-white/10 hover:border-amber-400/50'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    {/* Badge Indicator */}
                    <div className="absolute top-1.5 right-1.5">
                      {isSelectedInActiveSlot ? (
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow">
                          ✓
                        </span>
                      ) : isInAnotherSlot ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-900/90 text-emerald-300 border border-emerald-500/40 text-[9px] font-black">
                          #{slotIndexIfAny + 1}
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center text-[10px] group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                          +
                        </span>
                      )}
                    </div>

                    {/* Expedition details */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 text-left pointer-events-none">
                      <span className="text-[7.5px] font-bold text-amber-400 uppercase tracking-wider block truncate">
                        {photo.expeditionName || photo.parkName}
                      </span>
                      <h5 className="text-[11px] font-bold text-white truncate drop-shadow">
                        {photo.title}
                      </h5>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Bar inside Selection */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-white/10 text-xs">
              {onOpenTopThreeModal && (
                <button
                  onClick={onOpenTopThreeModal}
                  className="text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px]"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Importer un cliché de l'appareil</span>
                </button>
              )}

              <button
                onClick={() => setIsInlineSelecting(false)}
                className="px-3 py-1.5 copper-gradient text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow ml-auto"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Terminé</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Helper note when not selecting */}
        {!isInlineSelecting && (
          <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 pt-0.5 border-t border-stone-200 dark:border-white/5">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Certifié expéditions Gabon (ANPN)
            </span>
            <button
              onClick={() => setIsInlineSelecting(true)}
              className="text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-semibold"
            >
              Modifier la sélection →
            </button>
          </div>
        )}
      </div>

      {/* User Identity Card */}
      <div className="bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-white/10 rounded-3xl p-5 text-center space-y-3 relative overflow-hidden shadow-xl">
        <div className="relative inline-block">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-full border-2 border-amber-500 mx-auto object-cover shadow-xl"
          />
          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs">
            🌿
          </span>
        </div>

        <div>
          <h2 className="font-serif-display text-xl text-slate-900 dark:text-white font-bold">{user.name}</h2>
          <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">{user.role}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {authUser?.email ? `${authUser.email} · ` : ''}
            {user.phone}
          </p>
        </div>

        {/* Google Sign-In & Cloud Firestore Sync */}
        <div className="bg-stone-50 dark:bg-slate-950/75 border border-stone-200 dark:border-white/10 rounded-2xl p-3 text-left flex items-center justify-between gap-2">
          {authUser ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block truncate">
                    ✓ Compte Google & Firestore actif
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate">
                    Billets, favoris & stats sauvegardés dans le cloud
                  </span>
                </div>
              </div>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl text-[10px] font-semibold flex items-center gap-1 shrink-0 transition"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Déconnexion</span>
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white block truncate">
                    Sauvegarde Cloud (Firebase)
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate">
                    Connectez votre compte Google pour persister vos billets
                  </span>
                </div>
              </div>
              {onSignInGoogle && (
                <button
                  onClick={onSignInGoogle}
                  disabled={isAuthLoading}
                  className="px-3 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-[11px] flex items-center gap-1.5 shadow shrink-0 active:scale-95 transition disabled:opacity-60"
                >
                  {isAuthLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogIn className="w-3.5 h-3.5" />
                  )}
                  <span>Connexion Google</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* 3 Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-200 dark:border-white/5 text-center">
          <div className="bg-stone-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-stone-200 dark:border-white/5">
            <span className="text-sm font-black text-amber-700 dark:text-amber-400 block font-mono">{user.totalKm}</span>
            <span className="text-[9px] text-slate-600 dark:text-slate-400 block">Kilomètres</span>
          </div>
          <div className="bg-stone-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-stone-200 dark:border-white/5">
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 block font-mono">+{user.totalAscent}m</span>
            <span className="text-[9px] text-slate-600 dark:text-slate-400 block">Dénivelé</span>
          </div>
          <div className="bg-stone-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-stone-200 dark:border-white/5">
            <span className="text-sm font-black text-slate-900 dark:text-white block font-mono">{user.stepsCount.toLocaleString('fr-FR')}</span>
            <span className="text-[9px] text-slate-600 dark:text-slate-400 block">Pas Forêt</span>
          </div>
        </div>
      </div>

      {/* SECTION APPARENCE : MODE SOMBRE MANUEL & BASCULE AUTOMATIQUE SELON L'HEURE */}
      <div className="bg-white dark:bg-slate-900/90 border border-amber-500/35 rounded-3xl p-4 space-y-3.5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white truncate">
                  Apparence &amp; Mode Sombre
                </h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shrink-0">
                  {themeMode === 'auto' ? 'Auto' : isDarkMode ? 'Sombre' : 'Clair'}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                {themeMode === 'auto'
                  ? `Automatique selon l'heure (${formatHourLabel(themeSchedule.dayStartHour)} – ${formatHourLabel(themeSchedule.nightStartHour)})`
                  : isDarkMode
                  ? 'Mode sombre activé manuellement'
                  : 'Mode clair activé manuellement'}
              </p>
            </div>
          </div>

          {onToggleDarkMode && (
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-pressed={isDarkMode}
              className="px-3 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow active:scale-95 transition shrink-0"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDarkMode ? 'Mode Clair' : 'Mode Sombre'}</span>
            </button>
          )}
        </div>

        {/* 3-Way Theme Selector (Sombre / Clair / Auto selon l'heure) */}
        {onSetThemeMode && (
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 rounded-2xl text-xs">
            <button
              type="button"
              onClick={() => onSetThemeMode('light')}
              className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                themeMode === 'light'
                  ? 'copper-gradient text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Clair</span>
            </button>

            <button
              type="button"
              onClick={() => onSetThemeMode('dark')}
              className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                themeMode === 'dark'
                  ? 'copper-gradient text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Sombre</span>
            </button>

            <button
              type="button"
              onClick={() => onSetThemeMode('auto')}
              className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                themeMode === 'auto'
                  ? 'copper-gradient text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Auto (Heure)</span>
            </button>
          </div>
        )}

        {/* Automatic Time-of-Day Schedule Configuration */}
        {onUpdateThemeSchedule && (
          <div className="bg-stone-50 dark:bg-slate-950/65 border border-stone-200 dark:border-white/5 rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Plage horaire automatique (heure locale)</span>
              </div>
              {onSetThemeMode && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={themeMode === 'auto'}
                  onClick={() => onSetThemeMode(themeMode === 'auto' ? (isDarkMode ? 'dark' : 'light') : 'auto')}
                  className={`w-9 h-5 rounded-full transition p-0.5 flex items-center shrink-0 ${
                    themeMode === 'auto' ? 'bg-amber-500 justify-end' : 'bg-stone-300 dark:bg-slate-700 justify-start'
                  }`}
                  title={themeMode === 'auto' ? 'Désactiver la bascule automatique' : 'Activer la bascule automatique'}
                >
                  <span className="w-4 h-4 rounded-full bg-white dark:bg-slate-950 shadow" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">
                  ☀️ Mode Clair dès :
                </label>
                <select
                  value={themeSchedule.dayStartHour}
                  onChange={(e) =>
                    onUpdateThemeSchedule({
                      ...themeSchedule,
                      dayStartHour: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  {[5, 6, 7, 8, 9].map((h) => (
                    <option key={h} value={h}>
                      {formatHourLabel(h)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">
                  🌙 Mode Sombre dès :
                </label>
                <select
                  value={themeSchedule.nightStartHour}
                  onChange={(e) =>
                    onUpdateThemeSchedule({
                      ...themeSchedule,
                      nightStartHour: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  {[17, 18, 19, 20, 21, 22].map((h) => (
                    <option key={h} value={h}>
                      {formatHourLabel(h)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 pt-1 border-t border-stone-200 dark:border-white/5">
              <span>
                {themeMode === 'auto'
                  ? `Prochaine bascule : ${nextAutoSwitch.nextModeLabel} à ${nextAutoSwitch.nextHourLabel}`
                  : 'Mode manuel actif (prioritaire sur les horaires)'}
              </span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                {isDarkMode ? '🌙 Nuit' : '☀️ Jour'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Défis Écologiques Temporaires (Renouvellement Hebdomadaire & Compte à Rebours) */}
      {onOpenEcoChallengeModal && (
        <WeeklyEcoChallengesSection
          completions={ecoChallenges}
          onOpenChallengeModal={onOpenEcoChallengeModal}
          onNotifyBanner={onTriggerTestNotification}
          onSyncNotificationsCount={onRefreshNotificationCount}
        />
      )}

      {/* Défis Écologiques Zéro Déchet & Badges Virtuels Firebase */}
      {onOpenEcoChallengeModal && (
        <EcoChallengesSection
          completions={ecoChallenges}
          authUser={authUser ?? null}
          isAuthLoading={isAuthLoading}
          onSignInGoogle={onSignInGoogle}
          onOpenChallengeModal={onOpenEcoChallengeModal}
          unlockedBadgeIds={user.unlockedBadgeIds}
          ecoPoints={user.ecoPoints}
          onOpenBadgesGallery={(badgeId) => {
            setFocusedBadgeId(badgeId ?? null);
            setIsBadgesGalleryOpen(true);
          }}
        />
      )}

      {/* Répartition des dépenses par catégorie (D3.js) */}
      <SpendingPieChart bookings={bookings} />

      {/* Mes Photos Favorites d'Expéditions */}
      <div className="bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-white/10 rounded-3xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-amber-600 dark:text-amber-500 fill-current" />
              <span>Mes Photos Préférées ({favoritePhotos.length})</span>
            </h3>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">Vos plus beaux souvenirs en forêt gabonaise</p>
          </div>
          <button
            onClick={onOpenFavoritePhotos}
            className="px-3 py-1.5 copper-gradient text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow active:scale-95 transition"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Choisir</span>
          </button>
        </div>

        {favoritePhotos.length === 0 ? (
          <div
            onClick={onOpenFavoritePhotos}
            className="border-2 border-dashed border-stone-300 dark:border-white/10 hover:border-amber-500/40 rounded-2xl p-6 text-center cursor-pointer space-y-2 transition bg-stone-50 dark:bg-slate-950/40"
          >
            <Camera className="w-8 h-8 text-amber-600/70 dark:text-amber-500/70 mx-auto" />
            <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Aucune photo préférée sélectionnée</p>
            <p className="text-[10px] text-slate-500">Touchez ici pour choisir jusqu'à 6 photos de vos randonnées ou en importer de nouvelles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {favoritePhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPreviewPhoto(photo)}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] border border-stone-200 dark:border-white/10 hover:border-amber-500/50 cursor-pointer shadow-md bg-slate-950 transition"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow">
                  <Heart className="w-3 h-3 fill-current" />
                </span>
                <div className="absolute bottom-2 left-2 right-2 text-left">
                  <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider block truncate">
                    {photo.parkName}
                  </span>
                  <span className="text-[11px] font-bold text-white block truncate leading-tight drop-shadow">
                    {photo.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booked Passes / Tickets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            Mes Billets & Pass Électroniques ({bookings.length})
          </h3>
          <div className="flex items-center gap-1.5">
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="px-2.5 py-1 bg-amber-500/15 dark:bg-amber-500/10 hover:bg-amber-500/25 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-500/40 dark:border-amber-500/30 font-semibold text-[11px] rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                title="Gérer les rappels et alertes locales H-1"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Alertes H-1</span>
              </button>
            )}
            {bookings.length > 0 && (
              <button
                onClick={handleDownloadAllICS}
                className="px-2.5 py-1 bg-white dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-stone-200 dark:border-white/10 font-semibold text-[11px] rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                title="Exporter tous mes billets en fichier .ics (Google & Apple Calendars)"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Tout synchroniser (.ics)</span>
              </button>
            )}
          </div>
        </div>

        {/* Calendar Sync Feedback Notification */}
        {calendarFeedback && (
          <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-2.5 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="flex-1 text-[11px] font-medium">{calendarFeedback}</span>
          </div>
        )}

        {/* Local Notification Feedback Notification */}
        {notificationFeedback && (
          <div className="bg-amber-50 dark:bg-amber-950/80 border border-amber-500/50 rounded-2xl p-2.5 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
            <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="flex-1 text-[11px] font-medium">{notificationFeedback}</span>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/60 border border-stone-200 dark:border-white/5 rounded-2xl p-4 text-center text-xs text-slate-600 dark:text-slate-400">
            Aucun billet actif pour le moment. Réservez une expédition pour obtenir votre pass QR Code sécurisé.
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const isSynced = syncedBookingIds.includes(b.id);
              const timestamps = calculateExpeditionTimestamps(b);
              const notif = scheduledNotifs.find((n) => n.bookingId === b.id);
              const isNotifActive = notif ? notif.enabled : true;

              return (
                <div
                  key={b.id}
                  className="bg-white dark:bg-slate-900/90 border border-amber-600/35 dark:border-amber-600/30 rounded-2xl p-3.5 space-y-2.5 shadow-md relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-amber-700 dark:text-amber-400 font-mono font-bold block">
                        REF: {b.refNumber}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{b.eventTitle}</h4>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 block">{b.eventDate} · {b.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <img
                        src="/assets/aistudio/Gemini_Generated_Image_vn51dfvn51dfvn51__1__8a19ee16.jpeg"
                        alt="Logo MANGOREMA Pangolin"
                        className="w-8 h-8 rounded-full border border-amber-500/50 p-0.5 bg-[#080B09] shadow-sm object-cover"
                      />
                      <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-white/10 flex items-center justify-center text-amber-700 dark:text-amber-400">
                        <QrCode className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Included Services & Amount */}
                  <div className="pt-2 border-t border-stone-200 dark:border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[10px] text-slate-700 dark:text-slate-300">
                      {b.shuttleIncluded && (
                        <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                          <Bus className="w-3 h-3" /> Navette A/R
                        </span>
                      )}
                      {b.tentIncluded && (
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <Tent className="w-3 h-3" /> Tente
                        </span>
                      )}
                      {b.guideIncluded && (
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <UserCheck className="w-3 h-3" /> Écoguide
                        </span>
                      )}
                    </div>
                    <strong className="text-amber-700 dark:text-amber-400 font-mono">
                      {b.totalAmount.toLocaleString('fr-FR')} F ({b.paymentMethod})
                    </strong>
                  </div>

                  {/* Calendar Sync Actions */}
                  <div className="pt-2 border-t border-stone-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDownloadSingleICS(b)}
                        className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition shadow-sm ${
                          isSynced
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                            : 'copper-gradient text-slate-950 hover:brightness-110 active:scale-95'
                        }`}
                        title="Télécharger le fichier .ics pour Apple Calendar, Google Calendar et Outlook"
                      >
                        {isSynced ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Fichier .ics téléchargé</span>
                          </>
                        ) : (
                          <>
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>Ajouter à l'agenda (.ics)</span>
                          </>
                        )}
                      </button>

                      <a
                        href={getGoogleCalendarUrl(b)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl text-[11px] font-semibold flex items-center gap-1 transition"
                        title="Ouvrir directement dans Google Agenda"
                      >
                        <ExternalLink className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>Google Agenda</span>
                      </a>
                    </div>

                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-mono">
                      Format .ics (Apple & Google)
                    </span>
                  </div>

                  {/* H-1 Local Notification (Web Notification API) */}
                  <div className="pt-2.5 border-t border-amber-500/20 bg-gradient-to-r from-stone-50 via-amber-50/60 to-stone-50 dark:from-slate-950/80 dark:via-amber-950/15 dark:to-slate-950/80 -mx-3.5 -mb-3.5 px-3.5 py-2.5 rounded-b-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-slate-900 dark:text-white text-[11px]">Rappel H-1 avant départ</strong>
                          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/35 px-1.5 py-0.2 rounded font-mono font-bold">
                            ⏰ {timestamps.alertFormatted}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-600 dark:text-slate-400 block truncate">
                          Notification locale 1h avant la navette / expédition (API Web)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleTriggerTicketNotification(b)}
                        className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition active:scale-95 shadow-sm"
                        title="Simuler l'alerte sonore et la notification Web sur cet appareil"
                      >
                        <BellRing className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>Tester H-1</span>
                      </button>

                      <button
                        onClick={() => handleToggleTicketNotification(b)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                          isNotifActive
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                            : 'bg-stone-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-stone-300 dark:border-white/10'
                        }`}
                        title={isNotifActive ? 'Désactiver le rappel' : 'Activer le rappel'}
                      >
                        {isNotifActive ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Actif</span>
                          </>
                        ) : (
                          <span>Inactif</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Badges Section */}
      {(() => {
        const unlockedIds = new Set<string>([
          ...(user.unlockedBadgeIds || []),
          ...ecoChallenges.map((c) => c.badgeId),
        ]);
        const unlockedVirtualEcoBadges = ALL_VIRTUAL_ECO_BADGES.filter((vb) =>
          unlockedIds.has(vb.id)
        );
        const existingBadgeIds = new Set(user.badges.map((b) => b.id));
        const mergedById: Record<string, { id: string; name: string; icon: string; desc: string }> = {};
        for (const b of user.badges) mergedById[b.id] = b;
        for (const vb of unlockedVirtualEcoBadges) {
          if (!existingBadgeIds.has(vb.id)) mergedById[vb.id] = vb;
        }
        for (const comp of ecoChallenges) {
          if (!mergedById[comp.badgeId]) {
            mergedById[comp.badgeId] = {
              id: comp.badgeId,
              name: comp.badgeName,
              icon: comp.badgeIcon,
              desc: `${comp.parkName} · ${comp.completedAtLabel}`,
            };
          }
        }
        const mergedBadges = Object.values(mergedById);

        return (
          <div className="bg-white dark:bg-slate-900/80 border border-stone-200 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                  <span className="truncate">Badges Écotourisme Débloqués ({mergedBadges.length})</span>
                </h3>
                {(user.ecoPoints ?? 0) > 0 && (
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums block mt-0.5">
                    {user.ecoPoints} pts éco cumulés
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setFocusedBadgeId(null);
                  setIsBadgesGalleryOpen(true);
                }}
                className="min-h-[44px] px-3 py-1.5 copper-gradient text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow active:scale-95 transition shrink-0"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Galerie de Badges</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {mergedBadges.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setFocusedBadgeId(b.id);
                    setIsBadgesGalleryOpen(true);
                  }}
                  className="min-h-[44px] p-2.5 rounded-xl bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/5 hover:border-amber-500/50 text-left flex items-start gap-2 transition active:scale-95"
                >
                  <span className="text-xl shrink-0">{b.icon}</span>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-200 block truncate">{b.name}</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 block line-clamp-1">{b.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Club Subscription */}
      <div className="bg-white dark:bg-slate-900/80 border border-stone-200 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">Abonnements MANGOREMA Club</h3>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
            Medium Actif
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/5">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Starter</span>
            <span className="text-amber-600 dark:text-amber-500 font-black mt-1 block">500 F</span>
            <span className="text-[8px] text-slate-500 block">/mois</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500">
            <span className="font-bold text-amber-800 dark:text-amber-400 block">Medium</span>
            <span className="text-amber-700 dark:text-amber-500 font-black mt-1 block">1 000 F</span>
            <span className="text-[8px] text-emerald-700 dark:text-emerald-400 font-bold block">✓ Actif</span>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/5">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Pro Expé</span>
            <span className="text-amber-600 dark:text-amber-500 font-black mt-1 block">2 000 F</span>
            <span className="text-[8px] text-slate-500 block">/mois</span>
          </div>
        </div>
      </div>

      {/* SECTION FONDS DE CARTE HORS-LIGNE (OPENSTREETMAP DANS LE NAVIGATEUR) */}
      <div className="bg-white dark:bg-slate-900/90 border border-amber-500/35 dark:border-amber-500/30 rounded-3xl p-4 space-y-3 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-black shadow-md">
              <Map className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Fonds de Carte Hors-Ligne (OpenStreetMap)</span>
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">Stockage local des tuiles pour naviguer sans réseau 4G</p>
            </div>
          </div>
          <button
            onClick={onOpenOfflineMaps}
            className="px-3 py-1.5 copper-gradient text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow active:scale-95 transition shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Gérer</span>
          </button>
        </div>

        <div className="bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/5 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block">Stockage local navigateur :</span>
              <strong className="text-slate-900 dark:text-white font-mono text-xs">{getTotalStorageUsedMB().toFixed(1)} Mo / 150 Mo</strong>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/35 px-2.5 py-0.5 rounded-full">
            {getDownloadedMapIds().length} pack(s) prêt(s)
          </span>
        </div>
      </div>

      {/* Action Links */}
      <div className="space-y-2">
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="w-full p-3.5 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 border border-amber-500/35 dark:border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-semibold transition shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Alertes Locales de Départ H-1 (Web Notification)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-bold">
              <span>Configurer</span>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
          </button>
        )}

        <button
          onClick={onOpenOfflineMaps}
          className="w-full p-3.5 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 border border-amber-500/35 dark:border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-semibold transition shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <Map className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Fonds de Carte Hors-Ligne (Tuiles OpenStreetMap)</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-bold">
            <span>Télécharger</span>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
        </button>

        <button
          onClick={onOpenChecklist}
          className="w-full p-3.5 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 border border-stone-200 dark:border-white/10 rounded-2xl flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-semibold transition shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <Backpack className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Ma Checklist Bivouac Équatorial</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>

        <button
          onClick={onOpenCapacitorGuide}
          className="w-full p-3.5 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 border border-stone-200 dark:border-white/10 rounded-2xl flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-semibold transition shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <span>Guide Mobile App (Capacitor / PWA / Android)</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>

        <button
          onClick={onReplayOnboarding}
          className="w-full p-3.5 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 border border-stone-200 dark:border-white/10 rounded-2xl flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-semibold transition shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Revoir la Présentation MANGOREMA</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>
      </div>

      {/* Fullscreen Photo Lightbox */}
      {selectedPreviewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 animate-in fade-in"
          onClick={() => setSelectedPreviewPhoto(null)}
        >
          <div className="flex justify-between items-center text-white">
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                {selectedPreviewPhoto.parkName} · {selectedPreviewPhoto.date}
              </span>
              <h3 className="font-bold text-base text-white">{selectedPreviewPhoto.title}</h3>
            </div>
            <button
              onClick={() => setSelectedPreviewPhoto(null)}
              className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center py-4">
            <img
              src={selectedPreviewPhoto.url}
              alt={selectedPreviewPhoto.title}
              className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="bg-[#121614]/90 border border-white/10 rounded-2xl p-4 max-w-md mx-auto w-full text-center space-y-2.5">
            <p className="text-xs text-slate-300 leading-relaxed">{selectedPreviewPhoto.caption}</p>
            {selectedPreviewPhoto.expeditionName && (
              <span className="inline-block text-[10px] text-amber-400 font-bold bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                🌿 Expédition : {selectedPreviewPhoto.expeditionName}
              </span>
            )}
            <div className="flex gap-2 justify-center pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPreviewPhoto(null);
                  if (onOpenTopThreeModal) {
                    onOpenTopThreeModal();
                  } else {
                    setIsInlineSelecting(true);
                  }
                }}
                className="px-3.5 py-2 copper-gradient text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Modifier mon Top 3</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPreviewPhoto(null);
                  onOpenFavoritePhotos();
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Toutes les photos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Galerie Détaillée de Badges (Modal Animé) */}
      <BadgesGalleryModal
        isOpen={isBadgesGalleryOpen}
        onClose={() => setIsBadgesGalleryOpen(false)}
        user={user}
        ecoChallenges={ecoChallenges}
        initialBadgeId={focusedBadgeId}
        isAuthenticated={Boolean(authUser)}
        onOpenEcoChallengeModal={onOpenEcoChallengeModal}
      />

    </div>
  );
};
