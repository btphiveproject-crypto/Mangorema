import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Booking,
  ExpeditionPhoto,
  EcoChallengeCompletion,
  EcoChallengeDefinition,
  EcoLogEntry,
  TrustedContact,
  ExpeditionEvent,
  AppLanguage,
  MarketplaceOrder,
  SiteContribution,
  SiteContributionType,
  PublicExplorerProfile,
  ProfessionalProfile,
  DirectChat,
  DirectChatMessage,
} from '../../types';
import { Award, QrCode, Smartphone, Backpack, HelpCircle, CheckCircle2, ChevronRight, Bus, Tent, UserCheck, Heart, Camera, Eye, Plus, Star, Sparkles, MapPin, Check, X, ArrowRight, ImagePlus, Calendar, CalendarPlus, CalendarCheck, Download, ExternalLink, Map, HardDrive, Bell, BellRing, Clock, LogIn, LogOut, Cloud, Loader2, Moon, Sun, Share2, Globe, Briefcase, ShoppingBag, RotateCcw, Store, MessageSquare, Pencil, User, Settings, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LANGUAGE_OPTIONS } from '../../i18n/translations';
import { generateBookingICS, generateAllBookingsICS, downloadICS, getGoogleCalendarUrl } from '../../utils/calendar';
import { getDownloadedMapIds, getTotalStorageUsedMB } from '../../utils/offlineMapStorage';
import { sanitizeImageUrl } from '../../utils/urlSecurity';
import { mergeUnifiedPasses } from '../../utils/unifiedReservations';
import { SpendingPieChart } from '../SpendingPieChart';
import { EcoChallengesSection } from '../EcoChallengesSection';
import { WeeklyEcoChallengesSection } from '../WeeklyEcoChallengesSection';
import { BadgesGalleryModal } from '../BadgesGalleryModal';
import { EcoLogSection } from '../EcoLogSection';
import { ContactsSyncSection } from '../ContactsSyncSection';
import { GmailExpeditionSection } from '../GmailExpeditionSection';
import { BookingDetailModal } from '../BookingDetailModal';
import { ExpeditionShareModal } from '../ExpeditionShareModal';
import { AdventureLogbookSection } from '../AdventureLogbookSection';
import { SiteContributionsSection, SiteContributionDraftInput } from '../SiteContributionsSection';
import { PrivateChatSection, ChatRecipientTarget } from '../PrivateChatSection';
import { MediaCaptureBox } from '../MediaCaptureBox';
import { GABON_SITES_CATALOG } from '../../data/gabonSites';
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

export type ProfileSubTab = 'apercu' | 'contributions' | 'chat' | 'billets' | 'parametres';

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
  onLanguageChanged?: (lang: AppLanguage) => void;
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
  events?: ExpeditionEvent[];
  ecoLogs?: EcoLogEntry[];
  onAddEcoLog?: (entry: Omit<EcoLogEntry, 'id' | 'userId' | 'createdAtMs'>) => Promise<void>;
  onUpdateEcoLog?: (entry: EcoLogEntry) => Promise<void>;
  onDeleteEcoLog?: (logId: string) => Promise<void>;
  trustedContacts?: TrustedContact[];
  onSaveTrustedContact?: (contact: Omit<TrustedContact, 'id' | 'userId' | 'createdAtMs'>) => Promise<void>;
  onUpdateTrustedContact?: (contact: TrustedContact) => Promise<void>;
  onDeleteTrustedContact?: (contactId: string) => Promise<void>;
  marketplaceOrders?: MarketplaceOrder[];
  onOpenVendorPortal?: () => void;
  onSwitchWorkspaceMode?: (mode: 'professional' | 'store') => void;
  onConfirmPendingOrder?: (order: MarketplaceOrder) => Promise<void>;
  onRefundOrder?: (order: MarketplaceOrder, reason: string) => Promise<void>;
  offlineQueueCount?: number;
  activeSubTab?: ProfileSubTab;
  onSubTabChange?: (tab: ProfileSubTab) => void;
  onUpdateProfileDetails?: (patch: {
    name: string;
    role: string;
    phone: string;
    bio?: string;
    homeCity?: string;
    favoritePark?: string;
    publicDiscoverable?: boolean;
    avatarBlob?: Blob | null;
    onAvatarProgress?: (pct: number) => void;
  }) => Promise<void>;
  siteContributions?: SiteContribution[];
  onPublishSiteContribution?: (input: SiteContributionDraftInput) => Promise<void>;
  onDeleteSiteContribution?: (item: SiteContribution) => Promise<void>;
  publicProfiles?: PublicExplorerProfile[];
  proProfiles?: ProfessionalProfile[];
  directChats?: DirectChat[];
  initialChatRecipient?: ChatRecipientTarget | null;
  onClearInitialChatRecipient?: () => void;
  onSendDirectChatMessage?: (params: {
    recipientUid: string;
    recipientName: string;
    recipientAvatar?: string;
    text: string;
    photoBlob?: Blob | null;
    onUploadProgress?: (pct: number) => void;
  }) => Promise<string>;
  onDeleteDirectChatMessage?: (chatId: string, msg: DirectChatMessage) => Promise<void>;
  onChangeSubscription?: (sub: UserProfile['subscription']) => void;
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
  onLanguageChanged,
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
  events = [],
  ecoLogs = [],
  onAddEcoLog,
  onUpdateEcoLog,
  onDeleteEcoLog,
  trustedContacts = [],
  onSaveTrustedContact,
  onUpdateTrustedContact,
  onDeleteTrustedContact,
  marketplaceOrders = [],
  onOpenVendorPortal,
  onSwitchWorkspaceMode,
  onConfirmPendingOrder,
  onRefundOrder,
  offlineQueueCount = 0,
  activeSubTab,
  onSubTabChange,
  onUpdateProfileDetails,
  siteContributions = [],
  onPublishSiteContribution,
  onDeleteSiteContribution,
  onChangeSubscription,
  publicProfiles = [],
  proProfiles = [],
  directChats = [],
  initialChatRecipient = null,
  onClearInitialChatRecipient,
  onSendDirectChatMessage,
  onDeleteDirectChatMessage,
}) => {
  const { lang, setLang, isRTL, t } = useLanguage();
  const numberLocale = lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar-EG' : 'fr-FR';
  const nextAutoSwitch = getNextAutoSwitchInfo(themeSchedule);
  const [localSubTab, setLocalSubTab] = useState<ProfileSubTab>('apercu');
  const currentSubTab = activeSubTab ?? localSubTab;
  const setCurrentSubTab = (tab: ProfileSubTab) => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setLocalSubTab(tab);
    }
  };

  const [contribScope, setContribScope] = useState<'all' | 'mine'>('all');
  const [localChatRecipient, setLocalChatRecipient] = useState<ChatRecipientTarget | null>(null);

  // Profile Editor modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editRole, setEditRole] = useState(user.role);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editBio, setEditBio] = useState(user.bio || '');
  const [editCity, setEditCity] = useState(user.homeCity || 'Libreville, Gabon');
  const [editFavoritePark, setEditFavoritePark] = useState(
    user.favoritePark || GABON_SITES_CATALOG[0]?.name || 'Parc National de la Mondah'
  );
  const [editDiscoverable, setEditDiscoverable] = useState(user.publicDiscoverable !== false);
  const [editAvatarBlob, setEditAvatarBlob] = useState<Blob | null>(null);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState<number | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  const openProfileEditor = () => {
    setEditName(user.name);
    setEditRole(user.role);
    setEditPhone(user.phone);
    setEditBio(user.bio || '');
    setEditCity(user.homeCity || 'Libreville, Gabon');
    setEditFavoritePark(user.favoritePark || GABON_SITES_CATALOG[0]?.name || '');
    setEditDiscoverable(user.publicDiscoverable !== false);
    setEditAvatarBlob(null);
    setAvatarUploadProgress(null);
    setProfileSaveError(null);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfileForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfileDetails) return;
    if (editName.trim().length < 2) {
      setProfileSaveError(t.profile.nameMinError);
      return;
    }
    setIsSavingProfile(true);
    setProfileSaveError(null);
    try {
      await onUpdateProfileDetails({
        name: editName.trim(),
        role: editRole.trim() || 'Écotouriste Gabon',
        phone: editPhone.trim(),
        bio: editBio.trim(),
        homeCity: editCity.trim(),
        favoritePark: editFavoritePark.trim(),
        publicDiscoverable: editDiscoverable,
        avatarBlob: editAvatarBlob,
        onAvatarProgress: (pct) => setAvatarUploadProgress(pct),
      });
      setIsEditProfileOpen(false);
      setEditAvatarBlob(null);
      setAvatarUploadProgress(null);
    } catch (err) {
      setProfileSaveError(err instanceof Error ? err.message : t.profile.savingError);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState<ExpeditionPhoto | null>(null);
  const [isBadgesGalleryOpen, setIsBadgesGalleryOpen] = useState(false);
  const [focusedBadgeId, setFocusedBadgeId] = useState<string | null>(null);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);
  const [bookingToShare, setBookingToShare] = useState<Booking | null>(null);

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

  const unifiedPasses = mergeUnifiedPasses(bookings, marketplaceOrders, events);
  const allPassBookings = unifiedPasses.map((p) => p.booking);

  const handleDownloadAllICS = () => {
    if (allPassBookings.length === 0) return;
    const ics = generateAllBookingsICS(allPassBookings);
    downloadICS('MANGOREMA_Toutes_Expeditions.ics', ics);
    setSyncedBookingIds(allPassBookings.map((b) => b.id));
    setCalendarFeedback(`${allPassBookings.length} pass exporté(s) en .ics pour vos agendas Google & Apple.`);
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

  const ownContributionsCount = authUser
    ? siteContributions.filter((c) => c.userId === authUser.uid).length
    : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-24 lg:pb-12">
      {/* HERO PROFIL EXPLORATEUR & NAVIGATION PAR ONGLETS */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-5 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Identité & Bio */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
            <div className="relative inline-block self-start sm:self-center shrink-0">
              <img
                src={sanitizeImageUrl(user.avatar, {
                  fallback: '/assets/aistudio/Gemini_Generated_Image_vn51dfvn51dfvn51__1__8a19ee16.jpeg',
                })}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-amber-500 object-cover shadow-lg"
              />
              {onUpdateProfileDetails && (
                <button
                  type="button"
                  onClick={openProfileEditor}
                  className="absolute -bottom-1 -end-1 w-8 h-8 rounded-full copper-gradient text-white border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md hover:brightness-110 transition"
                  aria-label={t.profile.editProfileBtn}
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif-display text-xl sm:text-2xl text-slate-900 dark:text-white font-extrabold tracking-tight truncate">
                  {user.name}
                </h2>
                {onUpdateProfileDetails && (
                  <button
                    type="button"
                    onClick={openProfileEditor}
                    className="px-2.5 py-1 rounded-xl glass-surface hover:border-amber-500/50 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition whitespace-nowrap"
                  >
                    <Pencil className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{t.profile.editProfileBtn}</span>
                  </button>
                )}
              </div>

              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {user.role}
                {user.homeCity ? ` · ${user.homeCity}` : ''}
                {user.favoritePark ? ` · ${user.favoritePark}` : ''}
              </p>

              {user.bio ? (
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed max-w-2xl">
                  {user.bio}
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  {t.profile.emptyBioHint}
                </p>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                {authUser?.email ? `${authUser.email} · ` : ''}
                {user.phone}
                {` · ${ownContributionsCount} ${ownContributionsCount > 1 ? t.profile.contributionPlural : t.profile.contributionSingular}`}
              </p>
            </div>
          </div>

          {/* Metrics & Google Sync Compact */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <div className="grid grid-cols-3 divide-x divide-stone-200 dark:divide-white/10 glass-surface rounded-2xl px-3 py-2.5 text-center">
              <div className="px-3">
                <span className="text-sm sm:text-base font-black text-amber-700 dark:text-amber-400 block font-mono tabular-nums">
                  {user.totalKm}
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block">{t.profile.metricKm}</span>
              </div>
              <div className="px-3">
                <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400 block font-mono tabular-nums">
                  +{user.totalAscent}m
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block">{t.profile.metricAscent}</span>
              </div>
              <div className="px-3">
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block font-mono tabular-nums">
                  {user.stepsCount.toLocaleString(numberLocale)}
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block">{t.profile.metricSteps}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              {authUser ? (
                <>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 glass-surface px-3 py-1.5 rounded-xl">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{t.profile.cloudActive}</span>
                  </span>
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="px-3 py-1.5 glass-surface hover:border-amber-500/40 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition whitespace-nowrap"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.common.signOut}</span>
                    </button>
                  )}
                </>
              ) : (
                onSignInGoogle && (
                  <button
                    type="button"
                    onClick={onSignInGoogle}
                    disabled={isAuthLoading}
                    className="px-3.5 py-2 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                  >
                    {isAuthLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogIn className="w-3.5 h-3.5" />
                    )}
                    <span>{t.common.connectGoogle}</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Profile Sub-Tab Navigation */}
        <div className="pt-3 border-t border-slate-200/50 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'apercu', label: t.profile.tabApercu, icon: User },
              {
                id: 'contributions',
                label: t.profile.tabContributions,
                count: siteContributions.length,
                icon: Camera,
              },
              {
                id: 'chat',
                label: t.profile.tabChat,
                count: directChats.length,
                icon: MessageSquare,
              },
              {
                id: 'billets',
                label: t.profile.tabBillets,
                count: unifiedPasses.length + marketplaceOrders.length,
                icon: QrCode,
              },
              { id: 'parametres', label: t.profile.tabParametres, icon: Settings },
            ] as Array<{
              id: ProfileSubTab;
              label: string;
              count?: number;
              icon: React.ComponentType<{ className?: string }>;
            }>
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = currentSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentSubTab(tab.id)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap min-h-[42px] border ${
                  isActive
                    ? 'copper-gradient text-slate-950 border-amber-400 shadow-md'
                    : 'glass-surface text-slate-700 dark:text-slate-200 border-white/25 hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className="font-mono text-[11px] opacity-80 tabular-nums">
                    · {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ONGLET 1 : APERÇU & AVENTURES */}
      {currentSubTab === 'apercu' && (
        <div className="space-y-6">
      {/* SECTION 1 : IDENTITÉ & TOP 3 EXPÉDITIONS (GRILLE 12 COLONNES DESKTOP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-5">
      {/* SECTION TOP 3 PHOTOS FAVORITES D'EXPÉDITIONS RÉALISÉES */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-4">
        {/* Section Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white tracking-tight">
                  {t.profile.top3Title}
                </h3>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold font-mono tabular-nums">
                  · {filledCount}/3 {t.profile.top3ChosenSuffix}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">{t.profile.top3Subtitle}</p>
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
                <span>{t.profile.doneBtn}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.profile.chooseBtn}</span>
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
                  src={sanitizeImageUrl(photo.url, { allowDataImage: true })}
                  alt={photo.title}
                  referrerPolicy="no-referrer"
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
                <div className="w-8 h-8 rounded-full glass-surface group-hover:border-amber-500/50 flex items-center justify-center mb-1 text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white block">
                  Photo #{slotIdx + 1}
                </span>
                <span className="text-[8px] text-amber-700 dark:text-amber-400/90 font-medium">{t.profile.chooseBtn}</span>
              </button>
            );
          })}
        </div>

        {/* INLINE EXPEDITION PHOTO SELECTOR (DIRECTEMENT DANS PROFILEVIEW) */}
        {isInlineSelecting && (
          <div className="mt-3 pt-3 border-t border-white/40 dark:border-white/10 space-y-3 glass-surface -mx-4 -mb-4 p-4 rounded-b-3xl animate-in fade-in">
            {/* Slot Selector Tabs */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{t.profile.targetSlotLabel}</span>
                </span>
                {topThreePhotos[activeSlotIndex] && (
                  <button
                    onClick={() => handleClearSlot(activeSlotIndex)}
                    className="text-[10px] text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-semibold flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" />
                    <span>{t.profile.clearSlot} #{activeSlotIndex + 1}</span>
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
                      className={`p-2 rounded-xl text-start border transition text-xs flex flex-col justify-between ${
                        isActive
                          ? 'border-amber-500 bg-amber-100/80 dark:bg-amber-950/40 text-slate-900 dark:text-white font-bold ring-1 ring-amber-400'
                          : 'glass-surface text-slate-700 dark:text-slate-300 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-amber-700 dark:text-amber-400">
                          {t.profile.slotLabel} #{idx + 1}
                        </span>
                        {assigned && <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />}
                      </div>
                      <span className="text-[10px] truncate block mt-0.5 font-medium">
                        {assigned ? assigned.title : t.profile.emptySlot}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Chips by Gabon Park */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: t.profile.allExpeditionsFilter },
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
                      : 'glass-surface text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
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
                      src={sanitizeImageUrl(photo.url, { allowDataImage: true })}
                      alt={photo.title}
                      referrerPolicy="no-referrer"
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
                  <span>{t.profile.importDevicePhoto}</span>
                </button>
              )}

              <button
                onClick={() => setIsInlineSelecting(false)}
                className="px-3 py-1.5 copper-gradient text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow ms-auto"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t.profile.doneBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Helper note when not selecting */}
        {!isInlineSelecting && (
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-stone-200 dark:border-white/5">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {t.profile.anpnCertified}
            </span>
            <button
              type="button"
              onClick={() => setIsInlineSelecting(true)}
              className="text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-semibold"
            >
              {t.profile.editSelection}
            </button>
          </div>
        )}
      </div>

      {/* MON CARNET D'AVENTURES : HISTORIQUE CHRONOLOGIQUE, BADGES & PHOTOS */}
      <AdventureLogbookSection
        user={user}
        bookings={bookings}
        events={events}
        photos={photos}
        ecoChallenges={ecoChallenges}
        marketplaceOrders={marketplaceOrders}
        onSelectPhoto={(photo) => setSelectedPreviewPhoto(photo)}
        onSelectBadge={(badgeId) => {
          setFocusedBadgeId(badgeId);
          setIsBadgesGalleryOpen(true);
        }}
      />
        </div>

        <div className="lg:col-span-5 space-y-5">
      {/* ESPACES PROFESSIONNEL & MAGASIN */}
      {(onSwitchWorkspaceMode || onOpenVendorPortal) && (
        <div className="glass-card border-amber-500/35 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white">
                {t.profile.proStoreTitle}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {t.profile.proStoreSubtitle}
              </p>
            </div>
            {onOpenVendorPortal && (
              <button
                type="button"
                onClick={onOpenVendorPortal}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
              >
                {t.profile.quickPortal}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {onSwitchWorkspaceMode && (
              <button
                type="button"
                onClick={() => onSwitchWorkspaceMode('professional')}
                className="min-h-[56px] p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-500/35 text-start flex items-center gap-3 hover:border-emerald-500 transition active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <strong className="text-xs font-black text-emerald-900 dark:text-emerald-200 block truncate">
                    {t.profile.proVersionTitle}
                  </strong>
                  <span className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80 block leading-snug">
                    {t.profile.proVersionDesc}
                  </span>
                </div>
              </button>
            )}

            {onSwitchWorkspaceMode && (
              <button
                type="button"
                onClick={() => onSwitchWorkspaceMode('store')}
                className="min-h-[56px] p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/35 text-start flex items-center gap-3 hover:border-amber-500 transition active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl copper-gradient text-slate-950 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <strong className="text-xs font-black text-amber-950 dark:text-amber-200 block truncate">
                    {t.profile.storeVersionTitle}
                  </strong>
                  <span className="text-[10px] text-amber-900/80 dark:text-amber-300/80 block leading-snug">
                    {t.profile.storeVersionDesc}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Accès rapide Contributions & Chat depuis Aperçu */}
      <div className="glass-card rounded-3xl p-4 space-y-2.5">
        <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white">
          {t.profile.communityHubTitle}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => setCurrentSubTab('contributions')}
            className="p-3 rounded-2xl glass-surface hover:border-emerald-500/50 text-start flex items-center justify-between gap-3 transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <strong className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  {t.profile.contribCardTitle}
                </strong>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate">
                  {siteContributions.length} {t.profile.contribCardDescSuffix}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 rtl:rotate-180" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentSubTab('chat')}
            className="p-3 rounded-2xl glass-surface hover:border-amber-500/50 text-start flex items-center justify-between gap-3 transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <strong className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  {t.profile.chatCardTitle}
                </strong>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate">
                  {directChats.length} {t.profile.chatCardDescSuffix}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {offlineQueueCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-500/40 rounded-2xl px-3.5 py-2.5 text-start text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
          <span>{offlineQueueCount} {t.profile.offlinePendingSuffix}</span>
          <span className="text-[10px] font-mono">{t.profile.autoSyncLabel}</span>
        </div>
      )}
        </div>
      </div>

      {/* SECTION 2 : DÉFIS ÉCOLOGIQUES DANS APERÇU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {onOpenEcoChallengeModal && (
          <WeeklyEcoChallengesSection
            completions={ecoChallenges}
            onOpenChallengeModal={onOpenEcoChallengeModal}
            onNotifyBanner={onTriggerTestNotification}
            onSyncNotificationsCount={onRefreshNotificationCount}
          />
        )}

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
      </div>
        </div>
      )}

      {/* ONGLET 2 : CONTRIBUTIONS & PHOTOS SITES */}
      {currentSubTab === 'contributions' && (
        <div className="space-y-6">
          {authUser && (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setContribScope('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  contribScope === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'glass-surface text-slate-700 dark:text-slate-200'
                }`}
              >
                {t.profile.allExplorers} ({siteContributions.length})
              </button>
              <button
                type="button"
                onClick={() => setContribScope('mine')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  contribScope === 'mine'
                    ? 'bg-emerald-600 text-white'
                    : 'glass-surface text-slate-700 dark:text-slate-200'
                }`}
              >
                {t.profile.myContributions} ({ownContributionsCount})
              </button>
            </div>
          )}

          {onPublishSiteContribution && onDeleteSiteContribution && (
            <SiteContributionsSection
              contributions={siteContributions}
              authUser={authUser ?? null}
              userProfile={user}
              filterOnlyOwnUserId={contribScope === 'mine' && authUser ? authUser.uid : undefined}
              onSignInGoogle={() => onSignInGoogle?.()}
              onPublishContribution={onPublishSiteContribution}
              onDeleteContribution={onDeleteSiteContribution}
              onStartPrivateChat={(target) => {
                setLocalChatRecipient(target);
                setCurrentSubTab('chat');
              }}
            />
          )}

          {/* Mes Photos Favorites d'Expéditions */}
          <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-amber-600 dark:text-amber-500 fill-current" />
                  <span>{t.profile.favPhotosTitle} ({favoritePhotos.length})</span>
                </h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">{t.profile.favPhotosSubtitle}</p>
              </div>
              <button
                onClick={onOpenFavoritePhotos}
                className="px-3 py-1.5 copper-gradient text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow active:scale-95 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{t.profile.chooseBtn}</span>
              </button>
            </div>

            {favoritePhotos.length === 0 ? (
              <div
                onClick={onOpenFavoritePhotos}
                className="border-2 border-dashed border-stone-300/80 dark:border-white/15 hover:border-amber-500/40 rounded-2xl p-6 text-center cursor-pointer space-y-2 transition glass-surface"
              >
                <Camera className="w-8 h-8 text-amber-600/70 dark:text-amber-500/70 mx-auto" />
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{t.profile.noFavPhotos}</p>
                <p className="text-[10px] text-slate-500">{t.profile.noFavPhotosHint}</p>
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
                      src={sanitizeImageUrl(photo.url, { allowDataImage: true })}
                      alt={photo.title}
                      referrerPolicy="no-referrer"
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
        </div>
      )}

      {/* ONGLET 3 : CHAT PRIVÉ 1-À-1 */}
      {currentSubTab === 'chat' && onSendDirectChatMessage && onDeleteDirectChatMessage && (
        <PrivateChatSection
          authUser={authUser ?? null}
          userProfile={user}
          publicProfiles={publicProfiles}
          proProfiles={proProfiles}
          directChats={directChats}
          initialRecipient={initialChatRecipient || localChatRecipient}
          onClearInitialRecipient={() => {
            setLocalChatRecipient(null);
            onClearInitialChatRecipient?.();
          }}
          onSignInGoogle={() => onSignInGoogle?.()}
          onSendMessage={onSendDirectChatMessage}
          onDeleteMessage={onDeleteDirectChatMessage}
        />
      )}

      {/* ONGLET 4 : BILLETS, COMMANDES & BUDGET */}
      {currentSubTab === 'billets' && (
        <div className="space-y-6">
          <SpendingPieChart bookings={allPassBookings} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {onSaveTrustedContact && onUpdateTrustedContact && onDeleteTrustedContact && (
              <ContactsSyncSection
                authUser={authUser ?? null}
                isAuthLoading={isAuthLoading}
                onSignInGoogle={onSignInGoogle}
                trustedContacts={trustedContacts}
                bookings={allPassBookings}
                events={events}
                onSaveContact={onSaveTrustedContact}
                onUpdateContact={onUpdateTrustedContact}
                onDeleteContact={onDeleteTrustedContact}
              />
            )}

            <GmailExpeditionSection
              authUser={authUser ?? null}
              isAuthLoading={isAuthLoading}
              onSignInGoogle={onSignInGoogle}
              trustedContacts={trustedContacts}
              bookings={allPassBookings}
              events={events}
            />
          </div>
        </div>
      )}

      {/* ONGLET 5 : PARAMÈTRES, LANGUE, THÈME, ÉCO-LOG & OUTILS */}
      {currentSubTab === 'parametres' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      {/* SECTION LANGUE : FRANÇAIS / ANGLAIS / ARABE (RTL) */}
      <div className="glass-card rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white truncate">
                {t.language.sectionTitle}
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                {t.language.sectionSubtitle}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
            {isRTL ? t.language.rtlBadge : t.language.ltrBadge}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 glass-surface rounded-2xl text-xs">
          {LANGUAGE_OPTIONS.map((opt) => {
            const isSelected = lang === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setLang(opt.code);
                  onLanguageChanged?.(opt.code);
                }}
                className={`min-h-[42px] px-2 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                  isSelected
                    ? 'copper-gradient text-slate-950 shadow'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">{opt.shortCode}</span>
                <span>{opt.nativeName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION APPARENCE : MODE SOMBRE MANUEL & BASCULE AUTOMATIQUE SELON L'HEURE */}
      <div className="glass-card rounded-3xl p-4 space-y-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
              {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white truncate">
                  {t.profile.appearanceTitle}
                </h3>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 shrink-0">
                  · {themeMode === 'auto' ? t.profile.modeAuto : isDarkMode ? t.profile.modeDark : t.profile.modeLight}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                {themeMode === 'auto'
                  ? `${t.profile.modeAutoTimeLabel} (${formatHourLabel(themeSchedule.dayStartHour)} – ${formatHourLabel(themeSchedule.nightStartHour)})`
                  : isDarkMode
                  ? t.profile.modeDark
                  : t.profile.modeLight}
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
              <span>{isDarkMode ? t.profile.switchToLight : t.profile.switchToDark}</span>
            </button>
          )}
        </div>

        {/* 3-Way Theme Selector (Sombre / Clair / Auto selon l'heure) */}
        {onSetThemeMode && (
          <div className="grid grid-cols-3 gap-1.5 p-1 glass-surface rounded-2xl text-xs">
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
              <span>{t.profile.modeLight}</span>
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
              <span>{t.profile.modeDark}</span>
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
              <span>{t.profile.modeAutoTimeLabel}</span>
            </button>
          </div>
        )}

        {/* Automatic Time-of-Day Schedule Configuration */}
        {onUpdateThemeSchedule && (
          <div className="glass-surface rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{t.profile.themeScheduleTitle}</span>
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
                >
                  <span className="w-4 h-4 rounded-full bg-white dark:bg-slate-950 shadow" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">
                  {t.profile.lightFrom}
                </label>
                <select
                  value={themeSchedule.dayStartHour}
                  onChange={(e) =>
                    onUpdateThemeSchedule({
                      ...themeSchedule,
                      dayStartHour: Number(e.target.value),
                    })
                  }
                  className="w-full glass-surface rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  {[5, 6, 7, 8, 9].map((h) => (
                    <option key={h} value={h} className="bg-white dark:bg-slate-900">
                      {formatHourLabel(h)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">
                  {t.profile.darkFrom}
                </label>
                <select
                  value={themeSchedule.nightStartHour}
                  onChange={(e) =>
                    onUpdateThemeSchedule({
                      ...themeSchedule,
                      nightStartHour: Number(e.target.value),
                    })
                  }
                  className="w-full glass-surface rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  {[17, 18, 19, 20, 21, 22].map((h) => (
                    <option key={h} value={h} className="bg-white dark:bg-slate-900">
                      {formatHourLabel(h)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 pt-1 border-t border-stone-200 dark:border-white/5">
              <span>
                {themeMode === 'auto'
                  ? `${t.profile.nextSwitch} ${nextAutoSwitch.nextModeLabel} · ${nextAutoSwitch.nextHourLabel}`
                  : t.profile.manualActive}
              </span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                {isDarkMode ? t.profile.nightBadge : t.profile.dayBadge}
              </span>
            </div>
          </div>
        )}
      </div>
          </div>

      {/* Carnet Éco-Log : Observations Faune & Flore (Synchronisé Firestore) */}
      {onAddEcoLog && onUpdateEcoLog && onDeleteEcoLog && (
        <EcoLogSection
          entries={ecoLogs}
          authUser={authUser ?? null}
          isAuthLoading={isAuthLoading}
          onSignInGoogle={onSignInGoogle}
          onAddEntry={onAddEcoLog}
          onUpdateEntry={onUpdateEcoLog}
          onDeleteEntry={onDeleteEcoLog}
        />
      )}
        </div>
      )}

      {currentSubTab === 'billets' && (
        <div className="space-y-6">

      {/* COMMANDES UNIFIÉES MARKETPLACE (Activités + Boutique + Locations) */}
      {marketplaceOrders.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span>{t.profile.unifiedOrdersTitle} ({marketplaceOrders.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {marketplaceOrders.map((ord) => (
              <div
                key={ord.id}
                className="glass-card rounded-2xl p-4 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400 block">
                      {ord.refNumber} · {ord.payerLabel}
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {ord.items.map((i) => `${i.quantity}x ${i.title}`).join(' · ') || 'MANGOREMA'}
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {ord.timestamp} · {t.profile.logisticsLabel} <strong>{ord.fulfillmentStatus}</strong>
                    </span>
                  </div>
                  <div className="text-end shrink-0 tabular-nums">
                    <strong className="font-mono text-amber-700 dark:text-amber-400 block">
                      {ord.grandTotalCharged.toLocaleString(numberLocale)} F
                    </strong>
                    <span
                      className={`text-[10px] font-bold inline-block mt-0.5 ${
                        ord.paymentStatus === 'CONFIRMED'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : ord.paymentStatus === 'PENDING'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                  {t.profile.receiptLabel} {ord.receiptHash}
                  {ord.depositTotal > 0 ? ` · ${t.profile.depositShort} ${ord.depositTotal.toLocaleString(numberLocale)} F` : ''}
                </div>

                {ord.paymentStatus !== 'REFUNDED' && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-200 dark:border-white/5">
                    {ord.paymentStatus === 'PENDING' && onConfirmPendingOrder && (
                      <button
                        type="button"
                        onClick={() => onConfirmPendingOrder(ord)}
                        className="flex-1 py-1.5 px-2.5 copper-gradient text-slate-950 font-black rounded-xl text-[11px] flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.profile.confirmUssd}</span>
                      </button>
                    )}
                    {onRefundOrder && (
                      <button
                        type="button"
                        onClick={() => onRefundOrder(ord, 'Annulation client depuis Profil')}
                        className="py-1.5 px-2.5 glass-surface text-red-700 dark:text-red-400 font-bold rounded-xl text-[11px] flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{t.profile.requestRefund}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booked Passes / Tickets Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            {t.profile.passesTitle} ({unifiedPasses.length})
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                document.getElementById('gmail-reservations-section')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }}
              className="px-2.5 py-1 glass-card hover:border-amber-500/40 text-slate-700 dark:text-slate-200 font-semibold text-[11px] rounded-xl flex items-center gap-1.5 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{t.profile.gmailEmails}</span>
            </button>
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="px-2.5 py-1 bg-amber-500/15 dark:bg-amber-500/10 hover:bg-amber-500/25 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-500/40 dark:border-amber-500/30 font-semibold text-[11px] rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{t.profile.h1Alerts}</span>
              </button>
            )}
            {unifiedPasses.length > 0 && (
              <button
                onClick={handleDownloadAllICS}
                className="px-2.5 py-1 glass-card hover:border-amber-500/40 text-slate-700 dark:text-slate-200 font-semibold text-[11px] rounded-xl flex items-center gap-1.5 transition active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{t.profile.syncAllIcs}</span>
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

        {unifiedPasses.length === 0 ? (
          <div className="glass-card rounded-2xl p-4 text-center text-xs text-slate-600 dark:text-slate-400">
            {t.profile.noPasses}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {unifiedPasses.map((pass) => {
              const b = pass.booking;
              const isSynced = syncedBookingIds.includes(b.id);
              const timestamps = calculateExpeditionTimestamps(b);
              const notif = scheduledNotifs.find((n) => n.bookingId === b.id);
              const isNotifActive = notif ? notif.enabled : true;

              return (
                <div
                  key={pass.id}
                  className="glass-card border-amber-600/35 dark:border-amber-600/30 rounded-2xl p-3.5 space-y-2.5 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] text-amber-700 dark:text-amber-400 font-mono font-bold">
                          REF: {b.refNumber}
                        </span>
                        {pass.source === 'marketplace_order' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            Panier Unifié
                          </span>
                        )}
                      </div>
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
                      {b.totalAmount.toLocaleString(numberLocale)} F ({b.paymentMethod})
                    </strong>
                  </div>

                  {/* Detailed View & Share Actions */}
                  <div className="pt-2 border-t border-stone-200 dark:border-white/5 grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedBookingForDetail(b)}
                      className="min-h-[40px] px-2.5 py-1.5 glass-surface hover:border-amber-500/40 text-slate-800 dark:text-slate-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{t.profile.passDetails}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingToShare(b)}
                      className="min-h-[40px] px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{t.profile.shareExpedition}</span>
                    </button>
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
                      >
                        {isSynced ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{t.profile.icsDownloaded}</span>
                          </>
                        ) : (
                          <>
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>{t.profile.addToCalendar}</span>
                          </>
                        )}
                      </button>

                      <a
                        href={getGoogleCalendarUrl(b)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 glass-surface hover:border-amber-500/40 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl text-[11px] font-semibold flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>{t.profile.googleCalendar}</span>
                      </a>
                    </div>

                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-mono">
                      {t.profile.icsFormatNote}
                    </span>
                  </div>

                  {/* H-1 Local Notification (Web Notification API) */}
                  <div className="pt-2.5 border-t border-amber-500/20 bg-gradient-to-r from-amber-50/45 via-amber-100/40 to-amber-50/45 dark:from-slate-950/65 dark:via-amber-950/20 dark:to-slate-950/65 -mx-3.5 -mb-3.5 px-3.5 py-2.5 rounded-b-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-slate-900 dark:text-white text-[11px]">{t.profile.h1ReminderTitle}</strong>
                          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/35 px-1.5 py-0.2 rounded font-mono font-bold">
                            ⏰ {timestamps.alertFormatted}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-600 dark:text-slate-400 block truncate">
                          {t.profile.h1ReminderDesc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleTriggerTicketNotification(b)}
                        className="px-2 py-1 glass-surface hover:border-amber-500/40 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition active:scale-95"
                      >
                        <BellRing className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>{t.profile.testH1}</span>
                      </button>

                      <button
                        onClick={() => handleToggleTicketNotification(b)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                          isNotifActive
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                            : 'bg-stone-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-stone-300 dark:border-white/10'
                        }`}
                      >
                        {isNotifActive ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{t.profile.active}</span>
                          </>
                        ) : (
                          <span>{t.profile.inactive}</span>
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
        </div>
      )}

      {currentSubTab === 'apercu' && (
        <div className="space-y-6">

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
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                  <span className="truncate">{t.profile.badgesTitle} ({mergedBadges.length})</span>
                </h3>
                {(user.ecoPoints ?? 0) > 0 && (
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums block mt-0.5">
                    {user.ecoPoints} {t.profile.ecoPointsCumulative}
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
                <span>{t.profile.badgesGalleryBtn}</span>
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
                  className="min-h-[44px] p-2.5 rounded-xl glass-surface hover:border-amber-500/50 text-start flex items-start gap-2 transition active:scale-95"
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
        </div>
      )}

      {currentSubTab === 'parametres' && (
        <div className="space-y-6">

      {/* Club, Offline Maps & Action Links Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      {/* Club Subscription */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">{t.profile.clubTitle}</h3>
          <span
            className={`text-[11px] font-bold ${
              user.subscription === 'Gratuit (0 F)'
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {user.subscription === 'Gratuit (0 F)'
              ? `${user.subscription} · ${t.profile.clubWithAds}`
              : `${user.subscription} · ${t.profile.clubNoAds}`}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          {(
            [
              {
                id: 'Gratuit (0 F)' as const,
                name: t.profile.clubFreeName,
                price: '0 F',
                perk: t.profile.clubWithAds,
              },
              {
                id: 'Starter (500 F)' as const,
                name: t.profile.clubStarterName,
                price: '500 F',
                perk: t.profile.clubNoAds,
              },
              {
                id: 'Club Medium (1 000 F)' as const,
                name: t.profile.clubMediumName,
                price: '1 000 F',
                perk: t.profile.clubNoAds,
              },
              {
                id: 'Pro Expé (2 000 F)' as const,
                name: t.profile.clubProName,
                price: '2 000 F',
                perk: t.profile.clubNoAds,
              },
            ]
          ).map((plan) => {
            const isSelected = user.subscription === plan.id;
            const isFreePlan = plan.id === 'Gratuit (0 F)';
            return (
              <button
                key={plan.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChangeSubscription?.(plan.id)}
                className={`p-2.5 rounded-xl border text-center transition active:scale-95 flex flex-col justify-between gap-1 ${
                  isSelected
                    ? isFreePlan
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 shadow-sm'
                      : 'bg-emerald-50/90 dark:bg-emerald-950/35 border-emerald-500 shadow-sm'
                    : 'glass-surface border-white/55 dark:border-white/10 hover:border-amber-500/45'
                }`}
              >
                <div>
                  <span
                    className={`font-bold block truncate ${
                      isSelected
                        ? isFreePlan
                          ? 'text-amber-800 dark:text-amber-300'
                          : 'text-emerald-800 dark:text-emerald-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {plan.name}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-black mt-0.5 block font-mono tabular-nums">
                    {plan.price}
                    {!isFreePlan && (
                      <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">
                        {' '}
                        {t.profile.perMonth}
                      </span>
                    )}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-semibold block leading-tight ${
                    isSelected
                      ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isSelected ? `${t.profile.clubActive} · ${plan.perk}` : plan.perk}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION FONDS DE CARTE HORS-LIGNE (OPENSTREETMAP DANS LE NAVIGATEUR) */}
      <div className="glass-card rounded-3xl p-4 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
              <Map className="w-4 h-4 fill-current" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white truncate">
                {t.profile.offlineMapsTitle}
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">{t.profile.offlineMapsSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenOfflineMaps}
            className="min-h-[38px] px-3 py-1.5 copper-gradient text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.profile.manageBtn}</span>
          </button>
        </div>

        <div className="glass-surface rounded-2xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block">{t.profile.browserStorageLabel}</span>
              <strong className="text-slate-900 dark:text-white font-mono text-xs tabular-nums">{getTotalStorageUsedMB().toFixed(1)} MB / 150 MB</strong>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
            {getDownloadedMapIds().length} {t.profile.packsReadySuffix}
          </span>
        </div>
      </div>
      </div>

      {/* Action Links */}
      <div className="space-y-2">
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="w-full p-3.5 glass-card hover:border-amber-500/60 border-amber-500/35 dark:border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-semibold transition"
          >
            <div className="flex items-center gap-2.5">
              <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t.profile.actionH1Title}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-bold">
              <span>{t.profile.configure}</span>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 rtl:rotate-180" />
            </div>
          </button>
        )}

        <button
          onClick={onOpenOfflineMaps}
          className="w-full p-3.5 glass-card hover:border-amber-500/60 border-amber-500/35 dark:border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-semibold transition"
        >
          <div className="flex items-center gap-2.5">
            <Map className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{t.profile.actionOfflineTitle}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-bold">
            <span>{t.profile.download}</span>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 rtl:rotate-180" />
          </div>
        </button>

        <button
          onClick={onOpenChecklist}
          className="w-full p-3.5 glass-card hover:border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-semibold transition"
        >
          <div className="flex items-center gap-2.5">
            <Backpack className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t.profile.actionChecklist}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 rtl:rotate-180" />
        </button>

        <button
          onClick={onOpenCapacitorGuide}
          className="w-full p-3.5 glass-card hover:border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-semibold transition"
        >
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <span>{t.profile.actionMobileGuide}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 rtl:rotate-180" />
        </button>

        <button
          onClick={onReplayOnboarding}
          className="w-full p-3.5 glass-card hover:border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-semibold transition"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>{t.profile.actionReplayIntro}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 rtl:rotate-180" />
        </button>
      </div>
        </div>
      )}

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
              src={sanitizeImageUrl(selectedPreviewPhoto.url, { allowDataImage: true })}
              alt={selectedPreviewPhoto.title}
              referrerPolicy="no-referrer"
              className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="glass-modal rounded-2xl p-4 max-w-md mx-auto w-full text-center space-y-2.5">
            <p className="text-xs text-slate-300 leading-relaxed">{selectedPreviewPhoto.caption}</p>
            {selectedPreviewPhoto.expeditionName && (
              <span className="inline-block text-[11px] text-amber-400 font-bold">
                🌿 {t.profile.expeditionPrefix} {selectedPreviewPhoto.expeditionName}
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
                <span>{t.profile.editTop3}</span>
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
                <span>{t.profile.allPhotos}</span>
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

      {/* Vue Détaillée de la Réservation */}
      <BookingDetailModal
        booking={selectedBookingForDetail}
        ecoChallenges={ecoChallenges}
        events={events}
        isOpen={Boolean(selectedBookingForDetail)}
        onClose={() => setSelectedBookingForDetail(null)}
        onDownloadICS={handleDownloadSingleICS}
        onShareExpedition={(targetBooking) => {
          setSelectedBookingForDetail(null);
          setBookingToShare(targetBooking);
        }}
      />

      {/* Modal Génération & Partage Carte d'Expédition */}
      <ExpeditionShareModal
        booking={bookingToShare}
        user={user}
        ecoChallenges={ecoChallenges}
        events={events}
        isOpen={Boolean(bookingToShare)}
        onClose={() => setBookingToShare(null)}
      />

      {/* Modal Édition Complète du Profil & Avatar */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[120] glass-scrim flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="glass-modal w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[92dvh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {t.profile.editModalTitle}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {t.profile.editModalSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-2 rounded-xl glass-surface text-slate-700 dark:text-slate-200"
                aria-label={t.common.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileForm} className="space-y-3.5">
              <MediaCaptureBox
                label={t.profile.avatarLabel}
                helperText={t.profile.avatarHelper}
                compact
                selectedBlob={editAvatarBlob}
                onBlobChange={setEditAvatarBlob}
                uploadProgress={avatarUploadProgress}
                disabled={isSavingProfile}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    {t.profile.displayNameLabel}
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-surface text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    {t.profile.roleLabel}
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    placeholder={t.profile.rolePlaceholder}
                    className="w-full px-3 py-2 rounded-xl glass-surface text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    {t.profile.cityLabel}
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder={t.profile.cityPlaceholder}
                    className="w-full px-3 py-2 rounded-xl glass-surface text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    {t.profile.favoriteParkLabel}
                  </label>
                  <select
                    value={editFavoritePark}
                    onChange={(e) => setEditFavoritePark(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-surface text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    {GABON_SITES_CATALOG.map((s) => (
                      <option key={s.id} value={s.name} className="bg-white dark:bg-slate-900">
                        {s.shortName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {t.profile.phonePrivateLabel}
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-surface text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {t.profile.bioLabel}
                </label>
                <textarea
                  rows={3}
                  maxLength={400}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder={t.profile.bioPlaceholder}
                  className="w-full px-3 py-2 rounded-xl glass-surface text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>

              <label className="flex items-center justify-between gap-3 p-3 rounded-2xl glass-surface cursor-pointer">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {t.profile.discoverableTitle}
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block">
                    {t.profile.discoverableDesc}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editDiscoverable}
                  onChange={(e) => setEditDiscoverable(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 shrink-0"
                />
              </label>

              {profileSaveError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileSaveError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSavingProfile}
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-surface text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 rounded-xl copper-gradient text-slate-950 text-xs sm:text-sm font-black shadow-md flex items-center gap-2 whitespace-nowrap"
                >
                  {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{t.profile.saveProfileBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
