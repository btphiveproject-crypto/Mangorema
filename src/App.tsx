/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  TabType,
  ExpeditionEvent,
  ShuttleService,
  SafetyIncident,
  Booking,
  UserProfile,
  ExpeditionPhoto,
  ExpertGuide,
  RentalItem,
  ExpeditionReview,
  EcoChallengeDefinition,
  EcoChallengeCompletion,
  EcoLogEntry,
  TrustedContact,
  CommunityActivity,
  CommunityActivityType,
  CommunityChatMessage,
  ChatRoomId,
  AppLanguage,
  MarketplaceOrder,
  VendorListing,
  VendorListingKind,
  FulfillmentStatus,
  StoreProduct,
  StoreProductCategory,
  AppWorkspaceMode,
  ProTabType,
  StoreTabType,
  ProfessionalProfile,
  StoreProfile,
  BusinessSettlementSettings,
  VendorOrderFulfillment,
  PublicExplorerProfile,
  SiteContribution,
  DirectChat,
  DirectChatMessage,
} from './types';
import type { ProfileSubTab } from './components/views/ProfileView';
import type { SiteContributionDraftInput } from './components/SiteContributionsSection';
import type { ChatRecipientTarget } from './components/PrivateChatSection';
import { useLanguage } from './contexts/LanguageContext';
import { useCart } from './contexts/CartContext';
import { TRANSLATIONS } from './i18n/translations';
import { INITIAL_EVENTS, INITIAL_SHUTTLES, INITIAL_INCIDENTS, INITIAL_USER, INITIAL_EXPEDITION_PHOTOS, INITIAL_EXPERTS, INITIAL_RENTALS, INITIAL_EXPEDITION_REVIEWS } from './data/mockData';
import { ECO_CHALLENGES_CATALOG, computeEcoProgress, getEcoChallengeByEventId } from './data/ecoChallenges';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomeView } from './components/views/HomeView';
import { MultiServiceCartModal } from './components/MultiServiceCartModal';
import { UnifiedCartModal } from './components/UnifiedCartModal';
import { ActivityDetailModal } from './components/ActivityDetailModal';
import { ShuttleBookingModal } from './components/ShuttleBookingModal';
import { SOSModal } from './components/SOSModal';
import { GPSTrackerModal } from './components/GPSTrackerModal';
import { CapacitorGuideModal } from './components/CapacitorGuideModal';
import { ChecklistModal } from './components/ChecklistModal';
import { FavoritePhotosModal } from './components/FavoritePhotosModal';
import { TopThreePhotosModal } from './components/TopThreePhotosModal';
import { ExpertBookingModal } from './components/ExpertBookingModal';
import { RentalModal } from './components/RentalModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { EcoChallengeValidationModal } from './components/EcoChallengesSection';
import { ExpeditionShareModal } from './components/ExpeditionShareModal';
import { SplashScreen } from './components/SplashScreen';
import { WorkspaceModeBar } from './components/WorkspaceModeBar';
import { proProfileToExpertGuide } from './data/partnerSpecialties';
import {
  GABON_LANDSCAPES,
  LandscapePreference,
  getStoredLandscapePreference,
  saveLandscapePreference,
  resolveLandscapeForContext,
} from './data/gabonLandscapes';

const ExplorerView = React.lazy(() =>
  import('./components/views/ExplorerView').then((m) => ({ default: m.ExplorerView }))
);
const SortiesView = React.lazy(() =>
  import('./components/views/SortiesView').then((m) => ({ default: m.SortiesView }))
);
const EquipementView = React.lazy(() =>
  import('./components/views/EquipementView').then((m) => ({ default: m.EquipementView }))
);
const TransportsView = React.lazy(() =>
  import('./components/views/TransportsView').then((m) => ({ default: m.TransportsView }))
);
const SafetyView = React.lazy(() =>
  import('./components/views/SafetyView').then((m) => ({ default: m.SafetyView }))
);
const PhotoGalleryView = React.lazy(() =>
  import('./components/views/PhotoGalleryView').then((m) => ({ default: m.PhotoGalleryView }))
);
const ProfileView = React.lazy(() =>
  import('./components/views/ProfileView').then((m) => ({ default: m.ProfileView }))
);
const ProfessionalWorkspace = React.lazy(() =>
  import('./components/pro/ProfessionalWorkspace').then((m) => ({ default: m.ProfessionalWorkspace }))
);
const StoreWorkspace = React.lazy(() =>
  import('./components/store/StoreWorkspace').then((m) => ({ default: m.StoreWorkspace }))
);
const OfflineMapsModal = React.lazy(() =>
  import('./components/OfflineMapsModal').then((m) => ({ default: m.OfflineMapsModal }))
);
const CommunityHubModal = React.lazy(() =>
  import('./components/CommunityHubModal').then((m) => ({ default: m.CommunityHubModal }))
);
const VendorPortalModal = React.lazy(() =>
  import('./components/VendorPortalModal').then((m) => ({ default: m.VendorPortalModal }))
);
import { WifiOff, CheckCircle2, BellRing, X, ArrowRight } from 'lucide-react';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { getStoredNotifications, checkDueNotifications } from './utils/notificationService';
import { setExplorerOfflineMode } from './utils/offlineMapStorage';
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
  saveEcoLogToFirestore,
  updateEcoLogInFirestore,
  deleteEcoLogFromFirestore,
  subscribeUserEcoLogs,
  saveTrustedContactToFirestore,
  updateTrustedContactPreferences,
  deleteTrustedContactFromFirestore,
  subscribeTrustedContacts,
  publishCommunityActivity,
  deleteCommunityActivity,
  subscribeCommunityActivities,
  sendCommunityChatMessage,
  deleteCommunityChatMessage,
  subscribeCommunityChatMessages,
  clearGoogleAccessToken,
  saveMarketplaceOrderToFirestore,
  updateMarketplaceOrderStatusInFirestore,
  subscribeUserMarketplaceOrders,
  saveVendorListingToFirestore,
  updateVendorListingInFirestore,
  deleteVendorListingFromFirestore,
  subscribeVendorListings,
  saveProProfileToFirestore,
  subscribeProProfiles,
  saveStoreProfileToFirestore,
  subscribeStoreProfiles,
  saveBusinessSettingsToFirestore,
  subscribeBusinessSettings,
  getCurrentIdToken,
  uploadProfileAvatarPhoto,
  syncPublicExplorerProfile,
  subscribePublicProfiles,
  uploadSiteContributionPhoto,
  saveSiteContributionToFirestore,
  deleteSiteContributionFromFirestore,
  subscribeSiteContributions,
  buildDirectChatId,
  uploadDirectChatPhoto,
  sendDirectChatMessage,
  deleteDirectChatMessage,
  subscribeUserDirectChats,
} from './firebase';
import { getGuestOrderControlToken } from './utils/guestOrderTokens';
import {
  getStoredActivityLocationsEnabled,
  saveStoredActivityLocationsEnabled,
  getStoredUserGpsCoords,
  saveStoredUserGpsCoords,
  resolveParkCoords,
  isValidCoords,
} from './utils/activityLocation';
import {
  enqueueOfflineAction,
  getOfflineQueue,
  removeOfflineQueueItem,
} from './utils/offlineSyncQueue';

export default function App() {
  const isOnline = useOnlineStatus();
  const { lang, t } = useLanguage();
  const { addEventToCart, setIsCartOpen } = useCart();

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
  const [ecoLogs, setEcoLogs] = useState<EcoLogEntry[]>([]);
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
  const [communityActivities, setCommunityActivities] = useState<CommunityActivity[]>([]);
  const [communityChatMessages, setCommunityChatMessages] = useState<CommunityChatMessage[]>([]);
  const [siteContributions, setSiteContributions] = useState<SiteContribution[]>([]);
  const [publicProfiles, setPublicProfiles] = useState<PublicExplorerProfile[]>([]);
  const [directChats, setDirectChats] = useState<DirectChat[]>([]);
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>('apercu');
  const [initialChatRecipient, setInitialChatRecipient] = useState<ChatRecipientTarget | null>(null);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [communityModalTab, setCommunityModalTab] = useState<'activities' | 'chat'>('activities');
  const [selectedEcoChallengeForModal, setSelectedEcoChallengeForModal] = useState<EcoChallengeDefinition | null>(null);
  const [bookingToShareFromCheckout, setBookingToShareFromCheckout] = useState<Booking | null>(null);
  const [isFavoritePhotosModalOpen, setIsFavoritePhotosModalOpen] = useState(false);
  const [isTopThreeModalOpen, setIsTopThreeModalOpen] = useState(false);
  const [dismissedAdIds, setDismissedAdIds] = useState<string[]>([]);

  // Experts, Rentals & Marketplace State
  const [experts] = useState<ExpertGuide[]>(INITIAL_EXPERTS);
  const [rentals] = useState<RentalItem[]>(INITIAL_RENTALS);
  const [selectedExpertForBooking, setSelectedExpertForBooking] = useState<ExpertGuide | null>(null);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [isOfflineMapsModalOpen, setIsOfflineMapsModalOpen] = useState(false);
  const [marketplaceOrders, setMarketplaceOrders] = useState<MarketplaceOrder[]>([]);
  const [vendorListings, setVendorListings] = useState<VendorListing[]>([]);
  const [liveStockMap, setLiveStockMap] = useState<Record<string, number>>({});
  const [vendorOrders, setVendorOrders] = useState<VendorOrderFulfillment[]>([]);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => getOfflineQueue().length);
  const [proProfiles, setProProfiles] = useState<ProfessionalProfile[]>(() => {
    try {
      const raw = localStorage.getItem('mangorema_preview_pro_profile_v1');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ProfessionalProfile;
      return parsed?.id ? [parsed] : [];
    } catch {
      return [];
    }
  });
  const [storeProfiles, setStoreProfiles] = useState<StoreProfile[]>(() => {
    try {
      const raw = localStorage.getItem('mangorema_preview_store_profile_v1');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StoreProfile;
      return parsed?.id ? [parsed] : [];
    } catch {
      return [];
    }
  });
  const [businessSettings, setBusinessSettings] = useState<
    Partial<Record<'professional' | 'store', BusinessSettlementSettings>>
  >({});
  const [workspaceMode, setWorkspaceMode] = useState<AppWorkspaceMode>(() => {
    try {
      const saved = localStorage.getItem('mangorema_workspace_mode_v1');
      if (saved === 'professional' || saved === 'store') return saved;
      return 'explorer';
    } catch {
      return 'explorer';
    }
  });
  const [activeProTab, setActiveProTab] = useState<ProTabType>('pro_dashboard');
  const [activeStoreTab, setActiveStoreTab] = useState<StoreTabType>('store_dashboard');
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<ExpeditionEvent | null>(null);
  const [isVendorPortalOpen, setIsVendorPortalOpen] = useState(false);
  const [showActivityLocations, setShowActivityLocations] = useState<boolean>(() =>
    getStoredActivityLocationsEnabled()
  );
  const [userGpsCoords, setUserGpsCoords] = useState<[number, number] | null>(() =>
    getStoredUserGpsCoords()
  );
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [focusedMapEventId, setFocusedMapEventId] = useState<string | null>(null);
  const [favoriteEventIds, setFavoriteEventIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('mangorema_favorite_events_v1');
      if (!raw) return ['evt-1'];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : ['evt-1'];
    } catch {
      return ['evt-1'];
    }
  });

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
    let unsubEcoLogs: (() => void) | null = null;
    let unsubTrustedContacts: (() => void) | null = null;
    let unsubCommunityActivities: (() => void) | null = null;
    let unsubCommunityChat: (() => void) | null = null;
    let unsubOrders: (() => void) | null = null;
    let unsubVendorListings: (() => void) | null = null;
    let unsubProProfiles: (() => void) | null = null;
    let unsubStoreProfiles: (() => void) | null = null;
    let unsubBusinessSettings: (() => void) | null = null;
    let unsubPublicProfiles: (() => void) | null = null;
    let unsubSiteContributions: (() => void) | null = null;
    let unsubDirectChats: (() => void) | null = null;

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
      if (unsubEcoLogs) {
        unsubEcoLogs();
        unsubEcoLogs = null;
      }
      if (unsubTrustedContacts) {
        unsubTrustedContacts();
        unsubTrustedContacts = null;
      }
      if (unsubCommunityActivities) {
        unsubCommunityActivities();
        unsubCommunityActivities = null;
      }
      if (unsubCommunityChat) {
        unsubCommunityChat();
        unsubCommunityChat = null;
      }
      if (unsubOrders) {
        unsubOrders();
        unsubOrders = null;
      }
      if (unsubVendorListings) {
        unsubVendorListings();
        unsubVendorListings = null;
      }
      if (unsubProProfiles) {
        unsubProProfiles();
        unsubProProfiles = null;
      }
      if (unsubStoreProfiles) {
        unsubStoreProfiles();
        unsubStoreProfiles = null;
      }
      if (unsubBusinessSettings) {
        unsubBusinessSettings();
        unsubBusinessSettings = null;
      }
      if (unsubPublicProfiles) {
        unsubPublicProfiles();
        unsubPublicProfiles = null;
      }
      if (unsubSiteContributions) {
        unsubSiteContributions();
        unsubSiteContributions = null;
      }
      if (unsubDirectChats) {
        unsubDirectChats();
        unsubDirectChats = null;
      }

      if (!fbUser) {
        clearGoogleAccessToken();
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

          unsubEcoLogs = subscribeUserEcoLogs(
            fbUser.uid,
            (cloudLogs) => {
              setEcoLogs(cloudLogs);
            },
            (err) => console.error('Firestore eco logs sync error:', err)
          );

          unsubTrustedContacts = subscribeTrustedContacts(
            fbUser.uid,
            (cloudContacts) => {
              setTrustedContacts(cloudContacts);
            },
            (err) => console.error('Firestore trusted contacts sync error:', err)
          );

          unsubCommunityActivities = subscribeCommunityActivities(
            (cloudActivities) => {
              setCommunityActivities(cloudActivities);
            },
            (err) => console.error('Firestore community activities sync error:', err)
          );

          unsubCommunityChat = subscribeCommunityChatMessages(
            (cloudMessages) => {
              setCommunityChatMessages(cloudMessages);
            },
            (err) => console.error('Firestore community chat sync error:', err)
          );

          unsubOrders = subscribeUserMarketplaceOrders(
            fbUser.uid,
            (cloudOrders) => {
              setMarketplaceOrders(cloudOrders);
            },
            (err) => console.error('Firestore orders sync error:', err)
          );

          unsubVendorListings = subscribeVendorListings(
            (cloudListings) => {
              setVendorListings(cloudListings);
              // Synchronize vendor-published items owned by the verified user into authoritative checkout catalog
              if (fbUser.emailVerified) {
                void getCurrentIdToken().then((idToken) => {
                  if (!idToken) return;
                  cloudListings.forEach((l) => {
                    if (
                      l.status === 'ACTIVE' &&
                      (l.ownerUserId === fbUser.uid || fbUser.email === 'stephaneakagah@gmail.com')
                    ) {
                      fetch('/api/payments/register-listing', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({
                          id: l.id,
                          listingKind: l.listingKind,
                          title: l.title,
                          price: l.price,
                          depositAmount: l.depositAmount,
                          stockOrCapacity: l.stockOrCapacity,
                          ownerName: l.ownerName,
                          storeId: l.storeId,
                          storeName: l.storeName,
                          deliveryAvailable: l.deliveryAvailable,
                        }),
                      }).catch(() => {});
                    }
                  });
                });
              }
            },
            (err) => console.error('Firestore vendor listings sync error:', err)
          );

          unsubProProfiles = subscribeProProfiles(
            (cloudPros) => {
              setProProfiles(cloudPros);
            },
            (err) => console.error('Firestore pro profiles sync error:', err)
          );

          unsubStoreProfiles = subscribeStoreProfiles(
            (cloudStores) => {
              setStoreProfiles(cloudStores);
            },
            (err) => console.error('Firestore store profiles sync error:', err)
          );

          unsubBusinessSettings = subscribeBusinessSettings(
            fbUser.uid,
            (cloudSettings) => {
              setBusinessSettings(cloudSettings);
            },
            (err) => console.error('Firestore business settings sync error:', err)
          );

          unsubPublicProfiles = subscribePublicProfiles(
            (cloudProfiles) => {
              setPublicProfiles(cloudProfiles);
            },
            (err) => console.error('Firestore public profiles sync error:', err)
          );

          unsubSiteContributions = subscribeSiteContributions(
            (cloudContribs) => {
              setSiteContributions(cloudContribs);
            },
            (err) => console.error('Firestore site contributions sync error:', err)
          );

          unsubDirectChats = subscribeUserDirectChats(
            fbUser.uid,
            (cloudChats) => {
              setDirectChats(cloudChats);
            },
            (err) => console.error('Firestore direct chats sync error:', err)
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
      if (unsubEcoLogs) unsubEcoLogs();
      if (unsubTrustedContacts) unsubTrustedContacts();
      if (unsubCommunityActivities) unsubCommunityActivities();
      if (unsubCommunityChat) unsubCommunityChat();
      if (unsubOrders) unsubOrders();
      if (unsubVendorListings) unsubVendorListings();
      if (unsubProProfiles) unsubProProfiles();
      if (unsubStoreProfiles) unsubStoreProfiles();
      if (unsubBusinessSettings) unsubBusinessSettings();
      if (unsubPublicProfiles) unsubPublicProfiles();
      if (unsubSiteContributions) unsubSiteContributions();
      if (unsubDirectChats) unsubDirectChats();
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
      setEcoLogs([]);
      setTrustedContacts([]);
      setCommunityActivities([]);
      setCommunityChatMessages([]);
      setMarketplaceOrders([]);
      setVendorListings([]);
      setVendorOrders([]);
      setPublicProfiles([]);
      setSiteContributions([]);
      setDirectChats([]);
      setInitialChatRecipient(null);
      showToast('Déconnecté', 'Session Google fermée. Vos données restent sauvegardées sur Firestore.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la déconnexion.';
      showToast('Erreur Déconnexion', msg);
    }
  };

  const handleOpenCommunity = (tab: 'activities' | 'chat' = 'activities') => {
    setCommunityModalTab(tab);
    setIsCommunityModalOpen(true);
  };

  const handlePublishCommunityActivity = async (payload: {
    parkName: string;
    activityType: CommunityActivityType;
    title: string;
    description: string;
    photoUrl?: string;
    distanceKm?: number;
    elevationM?: number;
  }) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Veuillez vous connecter avec Google pour publier une activité.');
    }
    const activityId = `act-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const createdAtLabel = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    await publishCommunityActivity(firebaseUser.uid, {
      id: activityId,
      authorName: firebaseUser.displayName || user.name,
      authorAvatar: firebaseUser.photoURL || user.avatar,
      parkName: payload.parkName,
      activityType: payload.activityType,
      title: payload.title,
      description: payload.description,
      photoUrl: payload.photoUrl,
      distanceKm: payload.distanceKm,
      elevationM: payload.elevationM,
      createdAtLabel,
    });
    showToast('Activité Publiée !', 'Votre sortie est désormais visible et ouverte aux commentaires.');
  };

  const handleDeleteCommunityActivity = async (activityId: string) => {
    await deleteCommunityActivity(activityId);
    showToast('Activité Supprimée', 'Votre publication a été retirée du fil communautaire.');
  };

  const handleSendCommunityChatMessage = async (payload: {
    roomId: ChatRoomId;
    text: string;
  }): Promise<CommunityChatMessage> => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Veuillez vous connecter avec Google pour envoyer un message.');
    }
    const messageId = `msg-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const createdAtLabel = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const outgoing: CommunityChatMessage = {
      id: messageId,
      roomId: payload.roomId,
      userId: firebaseUser.uid,
      authorName: firebaseUser.displayName || user.name,
      authorAvatar: firebaseUser.photoURL || user.avatar,
      text: payload.text,
      createdAtLabel,
      createdAtMs: Date.now(),
    };

    await sendCommunityChatMessage(firebaseUser.uid, outgoing);
    return outgoing;
  };

  const handleDeleteCommunityChatMessage = async (messageId: string) => {
    await deleteCommunityChatMessage(messageId);
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
    proofPhotoUrl?: string;
    proofStoragePath?: string;
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
      proofPhotoUrl: payload.proofPhotoUrl,
      proofStoragePath: payload.proofStoragePath,
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
      payload.proofPhotoUrl
        ? `+${payload.challenge.ecoPoints} pts éco + preuve photo synchronisés sur Firebase.`
        : `+${payload.challenge.ecoPoints} pts éco synchronisés avec votre profil Firebase.`
    );
  };

  const handleRemoveEcoChallenge = async (challengeId: string) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Veuillez vous connecter avec Google pour modifier vos défis.');
    }

    const target = ecoChallenges.find((c) => c.id === challengeId);
    const remaining = ecoChallenges.filter((c) => c.id !== challengeId);
    await deleteEcoChallengeAndSyncProfile(
      firebaseUser.uid,
      challengeId,
      remaining,
      target?.proofStoragePath
    );
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

  const handleAddEcoLog = async (
    entry: Omit<EcoLogEntry, 'id' | 'userId' | 'createdAtMs'>
  ) => {
    if (!isOnline) {
      const offlineId = `ecolog-offline-${Date.now()}`;
      setEcoLogs((prev) => [
        {
          ...entry,
          id: offlineId,
          userId: firebaseUser?.uid || 'offline_local',
          createdAtMs: Date.now(),
        },
        ...prev,
      ]);
      enqueueOfflineAction({
        kind: 'ECOLOG',
        payload: {
          speciesName: entry.speciesName,
          category: entry.category,
          parkName: entry.parkName,
          observedAt: entry.observedAt,
          notes: entry.notes,
          weatherOrContext: entry.weatherOrContext,
        },
      });
      setOfflineQueueCount(getOfflineQueue().length);
      showToast('Observation Hors-Ligne', `"${entry.speciesName}" sera synchronisée dès le retour du réseau.`);
      return;
    }
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Veuillez vous connecter avec Google pour enregistrer une observation.');
    }
    const logId = `ecolog-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    await saveEcoLogToFirestore(firebaseUser.uid, {
      ...entry,
      id: logId,
    });
    showToast('Observation Enregistrée', `"${entry.speciesName}" ajoutée à votre Carnet Éco-Log.`);
  };

  const handleUpdateEcoLog = async (entry: EcoLogEntry) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Veuillez vous connecter avec Google pour modifier cette observation.');
    }
    await updateEcoLogInFirestore(firebaseUser.uid, entry);
    showToast('Carnet Mis à Jour', `"${entry.speciesName}" actualisée sur Firestore.`);
  };

  const handleDeleteEcoLog = async (logId: string) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Veuillez vous connecter avec Google pour supprimer cette observation.');
    }
    await deleteEcoLogFromFirestore(firebaseUser.uid, logId);
    showToast('Observation Supprimée', 'Entrée retirée de votre Carnet Éco-Log.');
  };

  const handleSaveTrustedContact = async (
    contact: Omit<TrustedContact, 'id' | 'userId' | 'createdAtMs'>
  ) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Veuillez vous connecter avec Google pour synchroniser ce contact.');
    }
    await saveTrustedContactToFirestore(firebaseUser.uid, contact);
    showToast('Proche Synchronisé', `${contact.displayName} enregistré(e) dans vos contacts de confiance.`);
  };

  const handleUpdateTrustedContact = async (contact: TrustedContact) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Veuillez vous connecter avec Google pour modifier ce contact.');
    }
    await updateTrustedContactPreferences(firebaseUser.uid, contact);
  };

  const handleDeleteTrustedContact = async (contactId: string) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Veuillez vous connecter avec Google pour retirer ce contact.');
    }
    await deleteTrustedContactFromFirestore(firebaseUser.uid, contactId);
    showToast('Proche Retiré', 'Contact supprimé de votre liste Firestore.');
  };

  // Tab, Landscape & Modals Navigation
  const [activeTab, setActiveTab] = useState<TabType>('accueil');
  const [landscapePref, setLandscapePref] = useState<LandscapePreference>(() =>
    getStoredLandscapePreference()
  );
  const resolvedLandscape = useMemo(
    () => resolveLandscapeForContext(landscapePref, workspaceMode, activeTab),
    [landscapePref, workspaceMode, activeTab]
  );
  const handleChangeLandscape = (pref: LandscapePreference) => {
    setLandscapePref(pref);
    saveLandscapePreference(pref);
    const chosen =
      pref === 'auto'
        ? resolveLandscapeForContext('auto', workspaceMode, activeTab)
        : GABON_LANDSCAPES.find((l) => l.id === pref) || resolvedLandscape;
    showToast(
      pref === 'auto' ? 'Ambiance Gabon Dynamique' : `Paysage : ${chosen.name}`,
      pref === 'auto'
        ? 'Le décor naturel s’adapte automatiquement à chaque espace.'
        : `${chosen.province} affiché en toile de fond.`
    );
  };
  const [selectedEventForCart, setSelectedEventForCart] = useState<ExpeditionEvent | null>(null);
  const [isShuttleModalOpen, setIsShuttleModalOpen] = useState(false);
  const [focusedShuttleId, setFocusedShuttleId] = useState<string | null>(null);
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
      reportedAt: isOnline ? "À l'instant" : 'En attente de réseau',
    };
    setIncidents((prev) => [created, ...prev]);
    if (!isOnline) {
      enqueueOfflineAction({ kind: 'INCIDENT', payload: newInc });
      setOfflineQueueCount(getOfflineQueue().length);
      showToast('Signalement Hors-Ligne', 'Enregistré localement, synchronisation auto dès retour réseau.');
      return;
    }
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

  const handleToggleFavoriteSinglePhoto = (photoId: string) => {
    setUser((prev) => {
      const exists = prev.favoritePhotoIds.includes(photoId);
      const nextFavIds = exists
        ? prev.favoritePhotoIds.filter((id) => id !== photoId)
        : [...prev.favoritePhotoIds, photoId];
      const updated = {
        ...prev,
        favoritePhotoIds: nextFavIds,
      };
      if (firebaseUser && authReady) {
        updateUserProfileFields(firebaseUser.uid, updated).catch((err) =>
          console.error('Erreur sauvegarde favori Firestore:', err)
        );
      }
      return updated;
    });
  };

  const handleAddPersonalPhoto = (newPhoto: ExpeditionPhoto) => {
    setPhotos((prev) => [newPhoto, ...prev]);
    setUser((prev) => {
      const nextFavIds = prev.favoritePhotoIds.includes(newPhoto.id)
        ? prev.favoritePhotoIds
        : [newPhoto.id, ...prev.favoritePhotoIds];
      const updated = {
        ...prev,
        favoritePhotoIds: nextFavIds,
      };
      if (firebaseUser && authReady) {
        updateUserProfileFields(firebaseUser.uid, updated).catch((err) =>
          console.error('Erreur sauvegarde photo Firestore:', err)
        );
      }
      return updated;
    });
  };

  const handleOpenPrivateChat = (target?: ChatRecipientTarget) => {
    handleChangeWorkspaceMode('explorer');
    if (target) {
      setInitialChatRecipient(target);
    }
    setProfileSubTab('chat');
    setActiveTab('profil');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateProfileDetails = async (patch: {
    name: string;
    role: string;
    phone: string;
    bio?: string;
    homeCity?: string;
    favoritePark?: string;
    publicDiscoverable?: boolean;
    avatarBlob?: Blob | null;
    onAvatarProgress?: (pct: number) => void;
  }) => {
    let nextAvatar = user.avatar;
    if (patch.avatarBlob) {
      if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
        throw new Error('Connectez-vous avec Google pour téléverser une nouvelle photo de profil.');
      }
      const uploaded = await uploadProfileAvatarPhoto(
        firebaseUser.uid,
        patch.avatarBlob,
        patch.onAvatarProgress
      );
      nextAvatar = uploaded.downloadUrl;
    }

    const updatedProfile: UserProfile = {
      ...user,
      name: patch.name,
      role: patch.role,
      phone: patch.phone,
      bio: patch.bio,
      homeCity: patch.homeCity,
      favoritePark: patch.favoritePark,
      publicDiscoverable: patch.publicDiscoverable,
      avatar: nextAvatar,
    };

    setUser(updatedProfile);
    if (firebaseUser && firebaseUser.emailVerified && authReady) {
      await updateUserProfileFields(firebaseUser.uid, updatedProfile);
    }
    showToast('Profil Mis à Jour', 'Vos informations et votre fiche publique sont enregistrées.');
  };

  const isFreeTier = user.subscription === 'Gratuit (0 F)';

  const handleDismissAd = (adId: string) => {
    setDismissedAdIds((prev) => (prev.includes(adId) ? prev : [...prev, adId]));
  };

  const handleUpgradeAdFree = () => {
    handleChangeWorkspaceMode('explorer');
    setProfileSubTab('parametres');
    setActiveTab('profil');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeSubscription = (nextSub: UserProfile['subscription']) => {
    if (nextSub === user.subscription) return;
    const updatedProfile: UserProfile = {
      ...user,
      subscription: nextSub,
    };
    setUser(updatedProfile);
    if (firebaseUser && firebaseUser.emailVerified && authReady) {
      void updateUserProfileFields(firebaseUser.uid, updatedProfile).catch((err) =>
        console.error('Erreur mise à jour formule Firestore:', err)
      );
    }
    const adsCopy = TRANSLATIONS[lang].ads;
    showToast(
      adsCopy.planUpdatedToastTitle,
      nextSub === 'Gratuit (0 F)' ? adsCopy.planFreeToastDesc : adsCopy.planPaidToastDesc
    );
  };

  const handlePublishSiteContribution = async (input: SiteContributionDraftInput) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Connectez-vous avec Google pour publier sur les sites du Gabon.');
    }
    const contributionId = `sc-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    let photoUrl: string | undefined;
    let storagePath: string | undefined;

    if (input.photoBlob) {
      const uploaded = await uploadSiteContributionPhoto(
        firebaseUser.uid,
        contributionId,
        input.photoBlob,
        input.onUploadProgress
      );
      photoUrl = uploaded.downloadUrl;
      storagePath = uploaded.storagePath;
    }

    const createdAtLabel = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    await saveSiteContributionToFirestore(firebaseUser.uid, {
      id: contributionId,
      authorName: user.name || firebaseUser.displayName || 'Explorateur MANGOREMA',
      authorAvatar: user.avatar || firebaseUser.photoURL || undefined,
      parkId: input.parkId,
      parkName: input.parkName,
      zoneLabel: input.zoneLabel,
      contributionType: input.contributionType,
      title: input.title,
      description: input.description,
      photoUrl,
      storagePath,
      createdAtLabel,
    });

    const newOwnCount =
      siteContributions.filter((c) => c.userId === firebaseUser.uid).length + 1;
    void syncPublicExplorerProfile(firebaseUser.uid, user, newOwnCount).catch(() => undefined);

    showToast('Contribution Publiée', `Partagée sur ${input.parkName}.`);
  };

  const handleDeleteSiteContribution = async (item: SiteContribution) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) return;
    await deleteSiteContributionFromFirestore(item.id, item.storagePath);
    const nextOwnCount = Math.max(
      0,
      siteContributions.filter((c) => c.userId === firebaseUser.uid && c.id !== item.id).length
    );
    void syncPublicExplorerProfile(firebaseUser.uid, user, nextOwnCount).catch(() => undefined);
    showToast('Contribution Supprimée', `"${item.title}" retirée du site.`);
  };

  const handleSendDirectChatMessage = async (params: {
    recipientUid: string;
    recipientName: string;
    recipientAvatar?: string;
    text: string;
    photoBlob?: Blob | null;
    onUploadProgress?: (pct: number) => void;
  }): Promise<string> => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Connectez-vous avec Google pour envoyer un message privé.');
    }

    const chatId = buildDirectChatId(firebaseUser.uid, params.recipientUid);
    let photoUrl: string | undefined;
    let storagePath: string | undefined;

    if (params.photoBlob) {
      const uploaded = await uploadDirectChatPhoto(
        chatId,
        firebaseUser.uid,
        params.photoBlob,
        params.onUploadProgress
      );
      photoUrl = uploaded.downloadUrl;
      storagePath = uploaded.storagePath;
    }

    const createdAtLabel = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return sendDirectChatMessage({
      senderUid: firebaseUser.uid,
      senderName: user.name || firebaseUser.displayName || 'Explorateur MANGOREMA',
      senderAvatar: user.avatar || firebaseUser.photoURL || undefined,
      recipientUid: params.recipientUid,
      recipientName: params.recipientName,
      recipientAvatar: params.recipientAvatar,
      text: params.text,
      photoUrl,
      storagePath,
      createdAtLabel,
    });
  };

  const handleDeleteDirectChatMessage = async (chatId: string, msg: DirectChatMessage) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) return;
    await deleteDirectChatMessage(chatId, msg.id, msg.storagePath);
  };

  // Marketplace & Favorites Handlers
  const handleToggleFavoriteEvent = (eventId: string) => {
    setFavoriteEventIds((prev) => {
      const next = prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [eventId, ...prev];
      try {
        localStorage.setItem('mangorema_favorite_events_v1', JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleMarketplaceOrderCompleted = async (order: MarketplaceOrder) => {
    setMarketplaceOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
    if (firebaseUser && firebaseUser.emailVerified && authReady) {
      try {
        await saveMarketplaceOrderToFirestore(firebaseUser.uid, order);
      } catch (err) {
        console.error('Erreur sauvegarde commande unifiée Firestore:', err);
      }
    }
    showToast(
      order.paymentStatus === 'PENDING' ? 'Transaction en attente' : 'Paiement Vérifié !',
      `Commande ${order.refNumber} enregistrée (${order.grandTotalCharged.toLocaleString('fr-FR')} F).`
    );
  };

  const handleConfirmPendingOrder = async (order: MarketplaceOrder) => {
    const idToken = await getCurrentIdToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) headers.Authorization = `Bearer ${idToken}`;

    const res = await fetch('/api/payments/confirm-pending', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId: order.id,
        orderControlToken: getGuestOrderControlToken(order.id),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('Validation USSD', data.error || 'Transaction introuvable.');
      return;
    }
    const updated: MarketplaceOrder = {
      ...order,
      paymentStatus: 'CONFIRMED',
      fulfillmentStatus: 'CONFIRMED',
    };
    setMarketplaceOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    if (firebaseUser && firebaseUser.emailVerified && authReady) {
      await updateMarketplaceOrderStatusInFirestore(firebaseUser.uid, order.id, {
        paymentStatus: 'CONFIRMED',
        fulfillmentStatus: 'CONFIRMED',
      });
    }
    showToast('Paiement Confirmé', `Commande ${order.refNumber} validée.`);
  };

  const handleUpdateOrderFulfillment = async (order: MarketplaceOrder, nextStatus: FulfillmentStatus) => {
    const updated: MarketplaceOrder = { ...order, fulfillmentStatus: nextStatus };
    setMarketplaceOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    if (firebaseUser && firebaseUser.emailVerified && authReady) {
      await updateMarketplaceOrderStatusInFirestore(firebaseUser.uid, order.id, {
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: nextStatus,
      });
    }
    showToast('Statut Logistique Mis à Jour', `${order.refNumber} → ${nextStatus}`);
  };

  const handleRefundOrder = async (order: MarketplaceOrder, reason: string) => {
    const idToken = await getCurrentIdToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) headers.Authorization = `Bearer ${idToken}`;

    const res = await fetch('/api/payments/refund', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId: order.id,
        reason,
        orderControlToken: getGuestOrderControlToken(order.id),
        items: order.items.map((item) => ({
          refId: item.refId,
          kind: item.kind,
          quantity: item.quantity,
          rentalDays: item.rentalDays,
          fulfillmentMode: item.fulfillmentMode,
          meta: item.meta,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('Remboursement', data.error || 'Impossible de traiter le remboursement.');
      return;
    }
    const updated: MarketplaceOrder = {
      ...order,
      paymentStatus: 'REFUNDED',
      fulfillmentStatus: 'REFUNDED',
      refundReason: reason,
      refundedAtLabel: data.refundedAtLabel,
    };
    setMarketplaceOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    if (firebaseUser && firebaseUser.emailVerified && authReady) {
      await updateMarketplaceOrderStatusInFirestore(firebaseUser.uid, order.id, {
        paymentStatus: 'REFUNDED',
        fulfillmentStatus: 'REFUNDED',
        refundReason: reason,
        refundedAtLabel: data.refundedAtLabel,
      });
    }
    void refreshLiveStock();
    showToast('Remboursement Effectué', `${(data.refundedAmount ?? order.grandTotalCharged).toLocaleString('fr-FR')} F recrédités.`);
  };

  const refreshLiveStock = async () => {
    try {
      const res = await fetch('/api/marketplace/stock');
      if (!res.ok) return;
      const data = await res.json();
      if (data?.stock && typeof data.stock === 'object') {
        setLiveStockMap(data.stock);
      }
    } catch {
      // Ignore network errors while offline
    }
  };

  const refreshVendorOrders = async () => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      setVendorOrders([]);
      return;
    }
    try {
      const idToken = await getCurrentIdToken();
      if (!idToken) return;
      const res = await fetch('/api/vendor/orders', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.orders)) {
        setVendorOrders(data.orders);
      }
    } catch {
      // Ignore network errors while offline
    }
  };

  const handleUpdateVendorOrderStatus = async (orderId: string, nextStatus: FulfillmentStatus) => {
    const idToken = await getCurrentIdToken();
    if (!idToken) {
      showToast('Session requise', 'Reconnectez Google pour mettre à jour ce statut.');
      return;
    }
    const res = await fetch(`/api/vendor/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ fulfillmentStatus: nextStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('Mise à jour commande', data.error || 'Action non autorisée.');
      return;
    }
    setVendorOrders((prev) =>
      prev.map((vo) => (vo.orderId === orderId ? { ...vo, fulfillmentStatus: nextStatus } : vo))
    );
    setMarketplaceOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, fulfillmentStatus: nextStatus } : o))
    );
    showToast('Statut Commande Mis à Jour', `Statut → ${nextStatus}`);
  };

  useEffect(() => {
    void refreshLiveStock();
  }, []);

  useEffect(() => {
    if (
      firebaseUser?.emailVerified &&
      authReady &&
      (workspaceMode === 'professional' || workspaceMode === 'store' || isVendorPortalOpen)
    ) {
      void refreshVendorOrders();
    } else if (!firebaseUser) {
      setVendorOrders([]);
    }
  }, [firebaseUser, authReady, workspaceMode, isVendorPortalOpen, vendorListings.length]);

  useEffect(() => {
    if (!isOnline || !firebaseUser || !firebaseUser.emailVerified || !authReady) return;
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    let cancelled = false;
    (async () => {
      let syncedCount = 0;
      for (const item of queue) {
        if (cancelled) break;
        try {
          if (item.kind === 'INCIDENT') {
            await saveIncidentToFirestore(firebaseUser.uid, {
              ...item.payload,
              id: `inc-sync-${item.createdAtMs}`,
              reportedAt: 'Synchronisé (hors-ligne)',
            });
            removeOfflineQueueItem(item.id);
            syncedCount += 1;
          } else if (item.kind === 'ECOLOG') {
            await saveEcoLogToFirestore(firebaseUser.uid, {
              ...item.payload,
              id: `ecolog-sync-${item.createdAtMs}`,
            });
            removeOfflineQueueItem(item.id);
            syncedCount += 1;
          }
        } catch {
          // Retry on next reconnect
        }
      }
      if (!cancelled) {
        setOfflineQueueCount(getOfflineQueue().length);
        if (syncedCount > 0) {
          showToast(
            'Synchronisation Terrain Réussie',
            `${syncedCount} donnée(s) hors-ligne transmise(s) au cloud.`
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOnline, firebaseUser, authReady]);

  const handleChangeWorkspaceMode = (nextMode: AppWorkspaceMode) => {
    setWorkspaceMode(nextMode);
    try {
      localStorage.setItem('mangorema_workspace_mode_v1', nextMode);
    } catch {
      // Ignore storage quota errors
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProProfile = async (
    profile: Omit<ProfessionalProfile, 'ownerUserId' | 'createdAtMs'>
  ) => {
    if (firebaseUser && firebaseUser.emailVerified && authReady) {
      await saveProProfileToFirestore(firebaseUser.uid, profile);
      showToast('Profil Pro Publié', `"${profile.displayName}" est visible dans Explorer.`);
      return;
    }
    const localProfile: ProfessionalProfile = {
      ...profile,
      ownerUserId: 'local_preview',
      createdAtMs: Date.now(),
    };
    setProProfiles([localProfile]);
    try {
      localStorage.setItem('mangorema_preview_pro_profile_v1', JSON.stringify(localProfile));
    } catch {
      // Ignore storage errors
    }
    showToast('Brouillon Pro Sauvegardé', 'Connectez Google pour synchroniser sur Firestore.');
  };

  const handleSaveStoreProfile = async (
    store: Omit<StoreProfile, 'ownerUserId' | 'createdAtMs'>
  ) => {
    if (firebaseUser && firebaseUser.emailVerified && authReady) {
      await saveStoreProfileToFirestore(firebaseUser.uid, store);
      showToast('Vitrine Magasin Publiée', `"${store.storeName}" est visible dans Équipement.`);
      return;
    }
    const localStore: StoreProfile = {
      ...store,
      ownerUserId: 'local_preview',
      createdAtMs: Date.now(),
    };
    setStoreProfiles([localStore]);
    try {
      localStorage.setItem('mangorema_preview_store_profile_v1', JSON.stringify(localStore));
    } catch {
      // Ignore storage errors
    }
    showToast('Brouillon Magasin Sauvegardé', 'Connectez Google pour synchroniser sur Firestore.');
  };

  const handleSaveBusinessSettings = async (
    settings: Omit<BusinessSettlementSettings, 'userId'>
  ) => {
    const key = settings.id;
    const updated: BusinessSettlementSettings = {
      ...settings,
      userId: firebaseUser?.uid || 'local_preview',
    };
    setBusinessSettings((prev) => ({ ...prev, [key]: updated }));
    if (firebaseUser && firebaseUser.emailVerified && authReady) {
      await saveBusinessSettingsToFirestore(firebaseUser.uid, settings);
    }
  };

  const handleCreateVendorListing = async (payload: {
    listingKind: VendorListingKind;
    ownerRole?: 'pro' | 'store';
    productCategory?: StoreProductCategory;
    rentalCategory?: RentalItem['category'];
    storeId?: string;
    storeName?: string;
    specialtyTag?: string;
    deliveryAvailable?: boolean;
    title: string;
    category: string;
    location: string;
    locationEnabled?: boolean;
    lat?: number;
    lng?: number;
    price: number;
    depositAmount?: number;
    stockOrCapacity: number;
    description: string;
  }) => {
    if (!firebaseUser || !firebaseUser.emailVerified || !authReady) {
      throw new Error('Veuillez vous connecter avec Google pour publier une offre.');
    }
    const id = `vnd-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const createdAtLabel = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const [fallbackLat, fallbackLng] = resolveParkCoords(payload.location);
    const newListing: VendorListing = {
      id,
      ownerUserId: firebaseUser.uid,
      ownerName: payload.storeName || firebaseUser.displayName || user.name,
      ownerRole: payload.ownerRole,
      listingKind: payload.listingKind,
      title: payload.title,
      category: payload.category,
      productCategory: payload.productCategory,
      rentalCategory: payload.rentalCategory,
      storeId: payload.storeId,
      storeName: payload.storeName,
      specialtyTag: payload.specialtyTag,
      deliveryAvailable: payload.deliveryAvailable,
      location: payload.location,
      locationEnabled:
        payload.listingKind === 'activity' ? payload.locationEnabled ?? true : payload.locationEnabled,
      lat:
        payload.listingKind === 'activity'
          ? typeof payload.lat === 'number'
            ? payload.lat
            : fallbackLat
          : payload.lat,
      lng:
        payload.listingKind === 'activity'
          ? typeof payload.lng === 'number'
            ? payload.lng
            : fallbackLng
          : payload.lng,
      price: payload.price,
      depositAmount: payload.depositAmount,
      stockOrCapacity: payload.stockOrCapacity,
      description: payload.description,
      status: 'ACTIVE',
      createdAtLabel,
    };

    await saveVendorListingToFirestore(firebaseUser.uid, newListing);
    const idToken = await getCurrentIdToken();
    const matchedStore = storeProfiles.find(
      (s) => s.id === newListing.storeId || s.ownerUserId === firebaseUser.uid
    );
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) headers.Authorization = `Bearer ${idToken}`;
    await fetch('/api/payments/register-listing', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...newListing,
        storeDeliveryFee: matchedStore?.deliveryFee,
      }),
    }).catch(() => {});
    void refreshLiveStock();
    showToast('Offre Publiée !', `"${payload.title}" est maintenant disponible dans MANGOREMA.`);
  };

  const handleUpdateVendorListing = async (listing: VendorListing) => {
    await updateVendorListingInFirestore(listing);
    const idToken = await getCurrentIdToken();
    const matchedStore = storeProfiles.find(
      (s) => s.id === listing.storeId || s.ownerUserId === listing.ownerUserId
    );
    if (idToken && listing.status === 'ACTIVE') {
      await fetch('/api/payments/register-listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...listing,
          storeDeliveryFee: matchedStore?.deliveryFee,
        }),
      }).catch(() => {});
    }
    void refreshLiveStock();
    showToast('Offre Mise à Jour', `"${listing.title}" actualisée.`);
  };

  const handleDeleteVendorListing = async (listingId: string) => {
    await deleteVendorListingFromFirestore(listingId);
    showToast('Offre Supprimée', 'L’annonce a été retirée du catalogue.');
  };

  const myProProfile = useMemo(() => {
    const uid = firebaseUser?.uid;
    return (
      proProfiles.find((p) => (uid ? p.ownerUserId === uid : p.ownerUserId === 'local_preview')) ||
      null
    );
  }, [proProfiles, firebaseUser]);

  const myStoreProfile = useMemo(() => {
    const uid = firebaseUser?.uid;
    return (
      storeProfiles.find((s) => (uid ? s.ownerUserId === uid : s.ownerUserId === 'local_preview')) ||
      null
    );
  }, [storeProfiles, firebaseUser]);

  const myListings = useMemo(() => {
    const uid = firebaseUser?.uid;
    if (!uid) return [];
    const isAdminAccount = firebaseUser?.email === 'stephaneakagah@gmail.com';
    return vendorListings.filter((l) => isAdminAccount || l.ownerUserId === uid);
  }, [vendorListings, firebaseUser]);

  const dynamicExperts: ExpertGuide[] = useMemo(() => {
    const published = proProfiles
      .filter((p) => p.status === 'ACTIVE')
      .map(proProfileToExpertGuide);
    return [...published, ...experts];
  }, [proProfiles, experts]);

  const activePartnerStores: StoreProfile[] = useMemo(
    () => storeProfiles.filter((s) => s.status === 'ACTIVE'),
    [storeProfiles]
  );

  const handleToggleActivityLocations = () => {
    const next = !showActivityLocations;
    setShowActivityLocations(next);
    saveStoredActivityLocationsEnabled(next);
    showToast(
      next ? 'Localisations activées' : 'Localisations masquées',
      next
        ? 'Les repères GPS et distances des activités sont désormais affichés.'
        : 'Les repères GPS des activités sont temporairement masqués.'
    );
  };

  const handleActivateUserLocation = () => {
    if (!navigator.geolocation) {
      showToast('GPS Indisponible', 'La géolocalisation n’est pas supportée sur cet appareil.');
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserGpsCoords(coords);
        saveStoredUserGpsCoords(coords);
        if (!showActivityLocations) {
          setShowActivityLocations(true);
          saveStoredActivityLocationsEnabled(true);
        }
        showToast(
          'Position GPS Activée',
          `Distances calculées en direct (${coords[0].toFixed(3)}, ${coords[1].toFixed(3)}).`
        );
      },
      () => {
        setIsLocatingUser(false);
        showToast(
          'Accès GPS refusé',
          'Autorisez la géolocalisation dans votre navigateur pour calculer les distances.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleFocusActivityOnMap = (evt: ExpeditionEvent) => {
    if (evt.locationEnabled === false) {
      showToast(
        'Localisation restreinte',
        'L’organisateur communique le point GPS exact après confirmation.'
      );
      return;
    }
    if (!showActivityLocations) {
      setShowActivityLocations(true);
      saveStoredActivityLocationsEnabled(true);
    }
    setFocusedMapEventId(evt.id);
    if (workspaceMode !== 'explorer') {
      handleChangeWorkspaceMode('explorer');
    }
    setActiveTab('explorer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic Vendor Catalog Projections
  const dynamicEvents: ExpeditionEvent[] = [
    ...vendorListings
      .filter((l) => l.status === 'ACTIVE' && l.listingKind === 'activity')
      .map((l) => {
        const hasCustomCoords =
          typeof l.lat === 'number' &&
          typeof l.lng === 'number' &&
          isValidCoords([l.lat, l.lng]);
        const resolvedCoords: [number, number] = hasCustomCoords
          ? [l.lat as number, l.lng as number]
          : resolveParkCoords(l.location);

        return {
          id: l.id,
          title: l.title,
          category: 'PRIVATE' as const,
          discipline: 'AVENTURE' as const,
          date: 'Dates flexibles · Gabon',
          location: l.location,
          parkName: l.location,
          coords: resolvedCoords,
          locationEnabled: l.locationEnabled ?? true,
          organizer: l.ownerName,
          basePrice: l.price,
          description: l.description,
          duration: '1 Jour',
          difficulty: 'Modéré' as const,
          image: '/assets/aistudio/Gemini_Generated_Image_vn51dfvn51dfvn51__1__8a19ee16.jpeg',
          elevation: '+210m',
          distance: '8 km',
          maxParticipants: l.stockOrCapacity,
          spotsLeft: l.stockOrCapacity,
          providerVerified: true,
          featuredCollection: l.specialtyTag || l.category,
        };
      }),
    ...events,
  ];

  const dynamicExtraProducts: StoreProduct[] = vendorListings
    .filter((l) => l.status === 'ACTIVE' && l.listingKind === 'product')
    .map((l) => ({
      id: l.id,
      name: l.title,
      brand: l.storeName || l.ownerName,
      category: l.productCategory || 'randonnee',
      price: l.price,
      stock: l.stockOrCapacity,
      soldCount: 0,
      description: l.description,
      specs: [
        `Retrait : ${l.location}`,
        l.deliveryAvailable === false ? 'Retrait magasin uniquement' : 'Retrait ou livraison locale',
      ],
      deliveryOptions: l.deliveryAvailable === false ? ['RETRAIT'] : ['RETRAIT', 'LIVRAISON'],
      pickupLocation: l.location,
      weightOrSize: l.category,
      gradientTheme: 'from-amber-600/30 via-slate-900 to-emerald-950',
      iconName: 'package',
      rating: 4.9,
    }));

  const dynamicExtraRentals: RentalItem[] = vendorListings
    .filter((l) => l.status === 'ACTIVE' && l.listingKind === 'rental')
    .map((l) => ({
      id: l.id,
      category: l.rentalCategory || 'bivouac',
      name: l.title,
      model: l.category,
      partnerName: l.storeName || l.ownerName,
      pickupLocation: l.location,
      pricePerDay: l.price,
      depositAmount: l.depositAmount || 15000,
      depositMethod: 'MOBILE_MONEY',
      availableQuantity: l.stockOrCapacity,
      totalQuantity: l.stockOrCapacity,
      image: '',
      specs: [l.description, `Retrait : ${l.location}`],
      conditionChecklist: ['État général vérifié au retrait', 'Complet avec accessoires'],
    }));

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Fixed Full-Bleed Gabonese Landscape Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#e8ebe6] dark:bg-[#070b09]"
      >
        {GABON_LANDSCAPES.map((landscape) => {
          const isCurrent = landscape.id === resolvedLandscape.id;
          return (
            <img
              key={landscape.id}
              src={landscape.image}
              alt=""
              loading={isCurrent ? 'eager' : 'lazy'}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-out transform-gpu scale-[1.03] ${
                isCurrent ? 'opacity-100' : 'opacity-0'
              }`}
            />
          );
        })}
        {/* Calibrated atmospheric daylight / nocturnal veil preserving clarity & AA contrast */}
        <div className="absolute inset-0 glass-scrim transition-colors duration-300" />
      </div>

      {/* Animated Onboarding Splash (when user requests it) */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Global Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm glass-modal border border-amber-500/65 rounded-2xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-xs">
            <strong className="text-slate-900 dark:text-white block font-bold">{toastMsg.title}</strong>
            <span className="text-slate-700 dark:text-slate-300 text-[11px]">{toastMsg.desc}</span>
          </div>
        </div>
      )}

      {/* Offline Banner */}
      {!isOnline && (
        <div className="relative z-40 bg-amber-500/85 backdrop-blur-md text-slate-950 font-bold text-xs px-4 py-1.5 text-center flex items-center justify-center gap-1.5">
          <WifiOff className="w-3.5 h-3.5" />
          <span>{t.common.offlineBanner}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        user={user}
        workspaceMode={workspaceMode}
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        activeProTab={activeProTab}
        onChangeProTab={(tab) => setActiveProTab(tab)}
        activeStoreTab={activeStoreTab}
        onChangeStoreTab={(tab) => setActiveStoreTab(tab)}
        onOpenSOS={() => setIsSOSModalOpen(true)}
        onOpenCapacitorGuide={() => setIsCapacitorGuideOpen(true)}
        onOpenProfile={() => {
          handleChangeWorkspaceMode('explorer');
          setActiveTab('profil');
        }}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        onOpenGallery={() => {
          handleChangeWorkspaceMode('explorer');
          setActiveTab('galerie');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCommunity={() => handleOpenCommunity('activities')}
        onOpenPrivateChat={() => handleOpenPrivateChat()}
        onLanguageChanged={(nextLang: AppLanguage) => {
          const nextT = TRANSLATIONS[nextLang];
          showToast(nextT.language.toastTitle, nextT.language.toastDesc);
        }}
        communityCount={communityActivities.length}
        directChatsCount={directChats.length}
        activeAlertsCount={activeAlertsCount}
        isAuthenticated={Boolean(firebaseUser)}
      />

      {/* Workspace Version Switcher + Gabonese Scenery Switcher */}
      <WorkspaceModeBar
        mode={workspaceMode}
        onChangeMode={handleChangeWorkspaceMode}
        hasProProfile={Boolean(myProProfile)}
        hasStoreProfile={Boolean(myStoreProfile)}
        landscapePref={landscapePref}
        activeLandscape={resolvedLandscape}
        onChangeLandscape={handleChangeLandscape}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto bg-transparent flex-1 flex flex-col lg:border-x border-white/45 dark:border-white/10 transition-colors duration-200">

        {/* Urgent H-1 Departure Notification Banner (Local Web Notification Fallback & Visual Alert) */}
        {activeAlertBanner && (
          <div className="mx-4 mt-2 p-3.5 rounded-2xl glass-modal border-2 border-amber-500/75 animate-in slide-in-from-top-3 flex items-start justify-between gap-3 z-40">
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
              className="w-7 h-7 rounded-lg glass-surface hover:bg-white/75 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white flex items-center justify-center transition shrink-0"
              title="Fermer l'alerte"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar">
          <Suspense
            fallback={
              <div className="m-6 p-8 rounded-3xl glass-card border border-white/60 dark:border-white/15 text-center text-xs font-medium text-slate-700 dark:text-slate-300">
                Chargement de l'espace MANGOREMA...
              </div>
            }
          >
          {workspaceMode === 'professional' ? (
            <ProfessionalWorkspace
              activeTab={activeProTab}
              onChangeTab={setActiveProTab}
              onSwitchToExplorer={() => {
                handleChangeWorkspaceMode('explorer');
                setActiveTab('explorer');
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
              onSignInGoogle={handleSignInGoogle}
              proProfile={myProProfile}
              settlementSettings={businessSettings.professional || null}
              myListings={myListings}
              orders={marketplaceOrders}
              bookings={bookings}
              vendorOrders={vendorOrders}
              onUpdateVendorOrderStatus={handleUpdateVendorOrderStatus}
              onSaveProProfile={handleSaveProProfile}
              onSaveSettlementSettings={handleSaveBusinessSettings}
              onCreateListing={handleCreateVendorListing}
              onUpdateListing={handleUpdateVendorListing}
              onDeleteListing={handleDeleteVendorListing}
            />
          ) : workspaceMode === 'store' ? (
            <StoreWorkspace
              activeTab={activeStoreTab}
              onChangeTab={setActiveStoreTab}
              onSwitchToEquipement={() => {
                handleChangeWorkspaceMode('explorer');
                setActiveTab('equipement');
              }}
              authUser={
                firebaseUser
                  ? {
                      uid: firebaseUser.uid,
                      email: firebaseUser.email,
                      displayName: firebaseUser.displayName,
                    }
                  : null
              }
              onSignInGoogle={handleSignInGoogle}
              storeProfile={myStoreProfile}
              settlementSettings={businessSettings.store || null}
              myListings={myListings}
              orders={marketplaceOrders}
              vendorOrders={vendorOrders}
              onUpdateVendorOrderStatus={handleUpdateVendorOrderStatus}
              onSaveStoreProfile={handleSaveStoreProfile}
              onSaveSettlementSettings={handleSaveBusinessSettings}
              onCreateListing={handleCreateVendorListing}
              onUpdateListing={handleUpdateVendorListing}
              onDeleteListing={handleDeleteVendorListing}
              onUpdateOrderFulfillment={handleUpdateOrderFulfillment}
              onRefundOrder={handleRefundOrder}
            />
          ) : (
            <>
              {activeTab === 'accueil' && (
                <HomeView
                  events={events}
                  shuttles={shuttles}
                  photos={photos}
                  ecoChallenges={ecoChallenges}
                  ecoPoints={user.ecoPoints ?? 0}
                  communityActivitiesCount={communityActivities.length}
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
                  onOpenCommunity={(tab) => handleOpenCommunity(tab)}
                  onNotifyBanner={(title, body) => setActiveAlertBanner({ title, body })}
                  onSyncNotificationsCount={() => {
                    const notifs = getStoredNotifications();
                    setActiveAlertsCount(notifs.filter((n) => n.enabled).length);
                  }}
                  isFreeTier={isFreeTier}
                  dismissedAdIds={dismissedAdIds}
                  onDismissAd={handleDismissAd}
                  onUpgradeAdFree={handleUpgradeAdFree}
                />
              )}

              {activeTab === 'explorer' && (
                <ExplorerView
                  events={dynamicEvents}
                  experts={dynamicExperts}
                  photos={photos}
                  reviews={reviews}
                  showActivityLocations={showActivityLocations}
                  onToggleActivityLocations={handleToggleActivityLocations}
                  userGpsCoords={userGpsCoords}
                  isLocatingUser={isLocatingUser}
                  onActivateUserLocation={handleActivateUserLocation}
                  focusedEventId={focusedMapEventId}
                  onClearFocusedEvent={() => setFocusedMapEventId(null)}
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
                  userProfile={user}
                  siteContributions={siteContributions}
                  onPublishSiteContribution={handlePublishSiteContribution}
                  onDeleteSiteContribution={handleDeleteSiteContribution}
                  onStartPrivateChat={(target) => handleOpenPrivateChat(target)}
                  onOpenGallery={() => {
                    setActiveTab('galerie');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  isFreeTier={isFreeTier}
                  dismissedAdIds={dismissedAdIds}
                  onDismissAd={handleDismissAd}
                  onUpgradeAdFree={handleUpgradeAdFree}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'sorties' && (
                <SortiesView
                  events={dynamicEvents}
                  liveStockMap={liveStockMap}
                  ecoChallenges={ecoChallenges}
                  favoriteEventIds={favoriteEventIds}
                  showActivityLocations={showActivityLocations}
                  onToggleActivityLocations={handleToggleActivityLocations}
                  userGpsCoords={userGpsCoords}
                  isLocatingUser={isLocatingUser}
                  onActivateUserLocation={handleActivateUserLocation}
                  onLocateOnMap={handleFocusActivityOnMap}
                  onToggleFavorite={handleToggleFavoriteEvent}
                  onOpenDetail={(evt) => setSelectedEventForDetail(evt)}
                  onSelectEvent={(evt) => setSelectedEventForCart(evt)}
                  onQuickAddToCart={(evt) => {
                    addEventToCart(evt, { participants: 1, guideIncluded: true });
                    showToast('Ajouté au Panier Unifié', `"${evt.title}" ajouté (1 place + écoguide).`);
                  }}
                  onOpenEcoChallenge={(evt) => {
                    const challenge = getEcoChallengeByEventId(evt.id);
                    if (challenge) setSelectedEcoChallengeForModal(challenge);
                  }}
                  onOpenCommunity={(tab) => handleOpenCommunity(tab)}
                  onNavigateShuttles={() => setActiveTab('transports')}
                  isFreeTier={isFreeTier}
                  dismissedAdIds={dismissedAdIds}
                  onDismissAd={handleDismissAd}
                  onUpgradeAdFree={handleUpgradeAdFree}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'equipement' && (
                <EquipementView
                  rentals={rentals}
                  extraProducts={dynamicExtraProducts}
                  extraRentals={dynamicExtraRentals}
                  partnerStores={activePartnerStores}
                  liveStockMap={liveStockMap}
                  onOpenRentalChecklistModal={() => setIsRentalModalOpen(true)}
                  isFreeTier={isFreeTier}
                  dismissedAdIds={dismissedAdIds}
                  onDismissAd={handleDismissAd}
                  onUpgradeAdFree={handleUpgradeAdFree}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'transports' && (
                <TransportsView
                  shuttles={shuttles}
                  onOpenBookingModal={(shuttle) => {
                    setFocusedShuttleId(shuttle?.id || null);
                    setIsShuttleModalOpen(true);
                  }}
                  onOpenRental={() => setIsRentalModalOpen(true)}
                  onAlertScheduled={(msg) => showToast('Alerte H-1 Programmée', msg)}
                  onShuttleAddedToCart={(shuttle) =>
                    showToast(
                      'Navette ajoutée au Panier',
                      `${shuttle.type} (${shuttle.departureTime}) ajoutée au Panier Unifié.`
                    )
                  }
                />
              )}

              {activeTab === 'safety' && (
                <SafetyView
                  incidents={incidents}
                  onOpenSOS={() => setIsSOSModalOpen(true)}
                  onAddIncident={handleAddIncident}
                  onNotifyBanner={(title, body) => setActiveAlertBanner({ title, body })}
                  onSyncNotificationsCount={() => {
                    const notifs = getStoredNotifications();
                    setActiveAlertsCount(notifs.filter((n) => n.enabled).length);
                  }}
                />
              )}

              {activeTab === 'galerie' && (
                <PhotoGalleryView
                  photos={photos}
                  favoritePhotoIds={user.favoritePhotoIds}
                  siteContributions={siteContributions}
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
                  userProfile={user}
                  landscapePref={landscapePref}
                  onChangeLandscape={handleChangeLandscape}
                  onToggleFavoritePhoto={handleToggleFavoriteSinglePhoto}
                  onAddPersonalPhoto={handleAddPersonalPhoto}
                  onPublishSiteContribution={handlePublishSiteContribution}
                  onStartPrivateChat={(target) => handleOpenPrivateChat(target)}
                  onSignInGoogle={handleSignInGoogle}
                  onNotifyToast={showToast}
                  isFreeTier={isFreeTier}
                  dismissedAdIds={dismissedAdIds}
                  onDismissAd={handleDismissAd}
                  onUpgradeAdFree={handleUpgradeAdFree}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'profil' && (
                <ProfileView
                  user={user}
                  bookings={bookings}
                  photos={photos}
                  events={dynamicEvents}
                  ecoChallenges={ecoChallenges}
                  ecoLogs={ecoLogs}
                  onAddEcoLog={handleAddEcoLog}
                  onUpdateEcoLog={handleUpdateEcoLog}
                  onDeleteEcoLog={handleDeleteEcoLog}
                  trustedContacts={trustedContacts}
                  onSaveTrustedContact={handleSaveTrustedContact}
                  onUpdateTrustedContact={handleUpdateTrustedContact}
                  onDeleteTrustedContact={handleDeleteTrustedContact}
                  marketplaceOrders={marketplaceOrders}
                  onOpenVendorPortal={() => setIsVendorPortalOpen(true)}
                  onSwitchWorkspaceMode={(mode) => handleChangeWorkspaceMode(mode)}
                  onConfirmPendingOrder={handleConfirmPendingOrder}
                  onRefundOrder={handleRefundOrder}
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
                  onLanguageChanged={(nextLang: AppLanguage) => {
                    const nextT = TRANSLATIONS[nextLang];
                    showToast(nextT.language.toastTitle, nextT.language.toastDesc);
                  }}
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
                  offlineQueueCount={offlineQueueCount}
                  activeSubTab={profileSubTab}
                  onSubTabChange={setProfileSubTab}
                  onUpdateProfileDetails={handleUpdateProfileDetails}
                  siteContributions={siteContributions}
                  onPublishSiteContribution={handlePublishSiteContribution}
                  onDeleteSiteContribution={handleDeleteSiteContribution}
                  publicProfiles={publicProfiles}
                  proProfiles={proProfiles}
                  directChats={directChats}
                  initialChatRecipient={initialChatRecipient}
                  onClearInitialChatRecipient={() => setInitialChatRecipient(null)}
                  onSendDirectChatMessage={handleSendDirectChatMessage}
                  onDeleteDirectChatMessage={handleDeleteDirectChatMessage}
                  onChangeSubscription={handleChangeSubscription}
                />
              )}
            </>
          )}
          </Suspense>
        </main>

        {/* Bottom Tab Bar */}
        <Navigation
          workspaceMode={workspaceMode}
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          activeProTab={activeProTab}
          onChangeProTab={(tab) => {
            setActiveProTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          activeStoreTab={activeStoreTab}
          onChangeStoreTab={(tab) => {
            setActiveStoreTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          incidentCount={incidents.filter((i) => i.severity === 'high').length}
          proBookingsCount={
            bookings.filter((b) => b.guideIncluded).length +
            vendorOrders.filter(
              (vo) =>
                vo.paymentStatus !== 'REFUNDED' &&
                vo.items.some((it) => it.kind === 'activity') &&
                ['PENDING_VENDOR', 'CONFIRMED'].includes(vo.fulfillmentStatus)
            ).length
          }
          storeOrdersCount={
            marketplaceOrders.filter(
              (o) =>
                o.paymentStatus !== 'REFUNDED' &&
                ['PENDING_VENDOR', 'CONFIRMED', 'PREPARING'].includes(o.fulfillmentStatus)
            ).length +
            vendorOrders.filter(
              (vo) =>
                vo.paymentStatus !== 'REFUNDED' &&
                vo.items.some((it) => it.kind === 'product' || it.kind === 'rental') &&
                ['PENDING_VENDOR', 'CONFIRMED', 'PREPARING'].includes(vo.fulfillmentStatus)
            ).length
          }
        />

        {/* Modals & Bottom Sheets */}
        <MultiServiceCartModal
          event={selectedEventForCart}
          onClose={() => setSelectedEventForCart(null)}
          onBookingConfirmed={handleBookingConfirmed}
          onShareExpedition={(booked) => {
            setSelectedEventForCart(null);
            setBookingToShareFromCheckout(booked);
          }}
        />

        <ShuttleBookingModal
          shuttles={shuttles}
          isOpen={isShuttleModalOpen}
          focusedShuttleId={focusedShuttleId}
          onClose={() => {
            setIsShuttleModalOpen(false);
            setFocusedShuttleId(null);
          }}
          onBookShuttle={handleBookShuttle}
        />

        <SOSModal
          isOpen={isSOSModalOpen}
          onClose={() => setIsSOSModalOpen(false)}
          trustedContacts={trustedContacts}
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

        <Suspense fallback={null}>
          {isOfflineMapsModalOpen && (
            <OfflineMapsModal
              isOpen={isOfflineMapsModalOpen}
              onClose={() => setIsOfflineMapsModalOpen(false)}
              onMapsUpdated={() => showToast('Stockage Mis à Jour', 'Cartes hors-ligne actualisées en mémoire locale.')}
              onViewOfflineMap={() => {
                setExplorerOfflineMode(true);
                setActiveTab('explorer');
              }}
            />
          )}
        </Suspense>

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

        <ExpeditionShareModal
          booking={bookingToShareFromCheckout}
          user={user}
          ecoChallenges={ecoChallenges}
          events={events}
          isOpen={Boolean(bookingToShareFromCheckout)}
          onClose={() => setBookingToShareFromCheckout(null)}
        />

        <Suspense fallback={null}>
          {isCommunityModalOpen && (
            <CommunityHubModal
              isOpen={isCommunityModalOpen}
              initialTab={communityModalTab}
              onClose={() => setIsCommunityModalOpen(false)}
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
              onSignInGoogle={handleSignInGoogle}
              activities={communityActivities}
              chatMessages={communityChatMessages}
              onPublishActivity={handlePublishCommunityActivity}
              onDeleteActivity={handleDeleteCommunityActivity}
              onSendChatMessage={handleSendCommunityChatMessage}
              onDeleteChatMessage={handleDeleteCommunityChatMessage}
            />
          )}
        </Suspense>

        <ActivityDetailModal
          event={selectedEventForDetail}
          reviews={reviews}
          isFavorite={selectedEventForDetail ? favoriteEventIds.includes(selectedEventForDetail.id) : false}
          userGpsCoords={userGpsCoords}
          isLocatingUser={isLocatingUser}
          onActivateUserLocation={handleActivateUserLocation}
          onLocateOnMap={(evt) => {
            setSelectedEventForDetail(null);
            handleFocusActivityOnMap(evt);
          }}
          onToggleFavorite={handleToggleFavoriteEvent}
          onClose={() => setSelectedEventForDetail(null)}
          onAddToUnifiedCart={(evt, opts) => {
            addEventToCart(evt, opts);
            setSelectedEventForDetail(null);
            setIsCartOpen(true);
            showToast('Ajouté au Panier Unifié', `"${evt.title}" (${opts.participants} pers.) ajouté.`);
          }}
          onQuickCheckout={(evt) => {
            setSelectedEventForDetail(null);
            setSelectedEventForCart(evt);
          }}
        />

        <UnifiedCartModal
          userId={firebaseUser?.uid || null}
          userPhone={user.phone}
          onOrderCompleted={(order) => {
            void handleMarketplaceOrderCompleted(order);
            void refreshVendorOrders();
          }}
          onStockUpdated={(nextStock) => setLiveStockMap(nextStock)}
          onOrderStatusUpdated={(updated) => {
            setMarketplaceOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            void refreshLiveStock();
            void refreshVendorOrders();
            if (firebaseUser && firebaseUser.emailVerified && authReady) {
              return updateMarketplaceOrderStatusInFirestore(firebaseUser.uid, updated.id, {
                paymentStatus: updated.paymentStatus,
                fulfillmentStatus: updated.fulfillmentStatus,
              });
            }
          }}
          onExploreCatalog={() => setActiveTab('equipement')}
        />

        <Suspense fallback={null}>
          {isVendorPortalOpen && (
            <VendorPortalModal
              isOpen={isVendorPortalOpen}
              onClose={() => setIsVendorPortalOpen(false)}
              authUser={
                firebaseUser
                  ? {
                      uid: firebaseUser.uid,
                      email: firebaseUser.email,
                      displayName: firebaseUser.displayName,
                    }
                  : null
              }
              onSignInGoogle={handleSignInGoogle}
              vendorListings={vendorListings}
              orders={marketplaceOrders}
              onCreateListing={handleCreateVendorListing}
              onUpdateListing={handleUpdateVendorListing}
              onDeleteListing={handleDeleteVendorListing}
              onUpdateOrderFulfillment={handleUpdateOrderFulfillment}
              onRefundOrder={handleRefundOrder}
            />
          )}
        </Suspense>

      </div>
    </div>
  );
}
