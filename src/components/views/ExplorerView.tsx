import React, { useState, useEffect, useCallback } from 'react';
import {
  ExpeditionEvent,
  ExpertGuide,
  ExpeditionPhoto,
  ExpeditionReview,
  OfflineParkMapData,
  SiteContribution,
  TabType,
  UserProfile,
} from '../../types';
import { SponsoredAdCard } from '../SponsoredAdCard';
import { ExplorerMap } from '../ExplorerMap';
import { MapsGroundingPanel } from '../GroundingPanels';
import {
  Compass,
  Navigation,
  TreePine,
  Eye,
  Star,
  Calendar,
  CheckCircle2,
  WifiOff,
  Download,
  HardDrive,
  MapPin,
  Camera,
} from 'lucide-react';
import { CategoryIcon } from '../CategoryIcon';
import { ExpeditionCalendar } from '../ExpeditionCalendar';
import { ExpeditionReviewsSection } from '../ExpeditionReviewsSection';
import { SiteContributionsSection, SiteContributionDraftInput } from '../SiteContributionsSection';
import { ChatRecipientTarget } from '../PrivateChatSection';
import { OfflineMapsModal } from '../OfflineMapsModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { sanitizeImageUrl } from '../../utils/urlSecurity';
import {
  OFFLINE_MAP_PACKAGES,
  getStoredOfflineMaps,
  getExplorerOfflineMode,
  setExplorerOfflineMode,
  downloadMapPackage,
  getLocalStorageMapKB,
} from '../../utils/offlineMapStorage';

interface ExplorerViewProps {
  events: ExpeditionEvent[];
  experts?: ExpertGuide[];
  photos?: ExpeditionPhoto[];
  reviews?: ExpeditionReview[];
  showActivityLocations?: boolean;
  onToggleActivityLocations?: () => void;
  userGpsCoords?: [number, number] | null;
  isLocatingUser?: boolean;
  onActivateUserLocation?: () => void;
  focusedEventId?: string | null;
  onClearFocusedEvent?: () => void;
  authUser?: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  onSelectEvent: (event: ExpeditionEvent) => void;
  onOpenGPSTracker: () => void;
  onBookExpert?: (expert: ExpertGuide) => void;
  onSignInGoogle?: () => void;
  onAddReview?: (payload: {
    eventId: string;
    rating: number;
    comment: string;
    photoUrl?: string;
  }) => Promise<void>;
  onDeleteReview?: (reviewId: string) => Promise<void>;
  userProfile?: UserProfile;
  siteContributions?: SiteContribution[];
  onPublishSiteContribution?: (input: SiteContributionDraftInput) => Promise<void>;
  onDeleteSiteContribution?: (item: SiteContribution) => Promise<void>;
  onStartPrivateChat?: (target: ChatRecipientTarget) => void;
  onOpenGallery?: () => void;
  isFreeTier?: boolean;
  dismissedAdIds?: string[];
  onDismissAd?: (adId: string) => void;
  onUpgradeAdFree?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  events,
  experts = [],
  photos = [],
  reviews = [],
  showActivityLocations = true,
  onToggleActivityLocations,
  userGpsCoords = null,
  focusedEventId = null,
  onClearFocusedEvent,
  authUser,
  onSelectEvent,
  onOpenGPSTracker,
  onBookExpert,
  onSignInGoogle,
  onAddReview,
  onDeleteReview,
  userProfile,
  siteContributions = [],
  onPublishSiteContribution,
  onDeleteSiteContribution,
  onStartPrivateChat,
  onOpenGallery,
  isFreeTier = true,
  dismissedAdIds = [],
  onDismissAd,
  onUpgradeAdFree,
  onNavigateTab,
}) => {
  const { t } = useLanguage();
  const [selectedPark, setSelectedPark] = useState<string>('all');
  const [selectedExpertDomain, setSelectedExpertDomain] = useState<string>('all');

  const [offlineMode, setOfflineMode] = useState<boolean>(() => getExplorerOfflineMode());
  const [offlineMaps, setOfflineMaps] = useState<Record<string, OfflineParkMapData>>(() =>
    getStoredOfflineMaps()
  );
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [isDownloadingPark, setIsDownloadingPark] = useState<boolean>(false);
  const [offlineFeedback, setOfflineFeedback] = useState<string | null>(null);
  const [localStorageKB, setLocalStorageKB] = useState<number>(() => getLocalStorageMapKB());
  const [brokenExpertPhotos, setBrokenExpertPhotos] = useState<Record<string, boolean>>({});

  const refreshOfflineState = useCallback(() => {
    setOfflineMaps(getStoredOfflineMaps());
    setLocalStorageKB(getLocalStorageMapKB());
  }, []);

  useEffect(() => {
    refreshOfflineState();
  }, [refreshOfflineState]);

  const handleToggleOfflineMode = () => {
    const next = !offlineMode;
    setOfflineMode(next);
    setExplorerOfflineMode(next);
    refreshOfflineState();
  };

  const handleQuickDownloadPark = async (parkId: string) => {
    const pkg =
      OFFLINE_MAP_PACKAGES.find((p) => p.parkId === parkId) || OFFLINE_MAP_PACKAGES[0];
    if (!pkg) return;

    setIsDownloadingPark(true);
    try {
      await downloadMapPackage(pkg);
      refreshOfflineState();
      setOfflineFeedback(`✓ ${pkg.name} enregistré dans LocalStorage.`);
      setTimeout(() => setOfflineFeedback(null), 3500);
    } finally {
      setIsDownloadingPark(false);
    }
  };

  const downloadedCount = Object.keys(offlineMaps).length;

  const parksFilter = [
    { id: 'all', label: t.explorer.filterAll },
    { id: 'mondah', label: t.explorer.filterMondah },
    { id: 'ivindo', label: t.explorer.filterIvindo },
    { id: 'denis', label: t.explorer.filterDenis },
    { id: 'cristal', label: t.explorer.filterCristal },
    { id: 'loango', label: t.explorer.filterLoango },
    { id: 'lope', label: t.explorer.filterLope },
  ];

  const expertDomains = [
    { id: 'all', label: 'Tous les experts' },
    { id: 'Guide', label: '🧭 Guides ANPN' },
    { id: 'Ornithologie', label: '🦅 Ornithologie' },
    { id: 'Botanique', label: '🌿 Botanique' },
    { id: 'Pistage', label: '🐘 Pistage' },
    { id: 'Photo', label: '📷 Safari Photo' },
  ];

  const filteredExperts = experts.filter((exp) => {
    if (selectedExpertDomain === 'all') return true;
    const q = selectedExpertDomain.toLowerCase();
    return (
      exp.title.toLowerCase().includes(q) ||
      exp.expertiseTags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const protectedSites = [
    {
      title: 'Parc National de la Mondah',
      region: 'Estuaire · Cap Estérias',
      desc: 'Forêt littorale ancienne abritant des okoumés centenaires, essences rares (Ozigo, Bilinga) et sentier botanique équipé de balises ANPN.',
      fauna: 'Pangolin géant, cercopithèques, calaos à casque jaune',
      parkId: 'mondah',
    },
    {
      title: "Parc National de l'Ivindo",
      region: 'Ogooué-Ivindo · Makokou',
      desc: "Joyau du patrimoine mondial de l'UNESCO avec les chutes de Kongou et Djidji. Forêt primaire équatoriale vierge traversée par des baïs sauvages.",
      fauna: "Éléphants de forêt d'Afrique, gorilles des plaines de l'Ouest, chimpanzés",
      parkId: 'ivindo',
    },
    {
      title: 'Parc National de Pongara & Nyonié',
      region: 'Komo-Océan · Rive Sud',
      desc: 'Plages sauvages atlantiques, mangroves côtières et savanes herbeuses où les éléphants viennent se promener sur le sable fin.',
      fauna: 'Tortues luth géantes en nidification, buffles de forêt, dauphins à bosse',
      parkId: 'denis',
    },
  ];

  const downloadedList = Object.values(offlineMaps);

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-24 lg:pb-12">
      {/* Header + Mode Hors-Ligne & Tracker Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-serif-display text-2xl sm:text-3xl text-slate-900 dark:text-white font-bold flex items-center gap-2.5 tracking-tight">
            <Compass className="w-6 h-6 text-amber-600 dark:text-amber-500 shrink-0" />
            <span className="truncate">{t.explorer.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t.explorer.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onToggleActivityLocations && (
            <button
              type="button"
              onClick={onToggleActivityLocations}
              aria-pressed={showActivityLocations}
              className={`min-h-[44px] px-3.5 py-2 font-bold text-xs rounded-xl flex items-center gap-2 border active:scale-95 transition whitespace-nowrap ${
                showActivityLocations
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/50 shadow-sm'
                  : 'glass-card text-slate-800 dark:text-slate-200 border-white/60 dark:border-white/12 hover:border-amber-500/45'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>
                {showActivityLocations
                  ? `Localisations activités (${events.filter((e) => e.locationEnabled !== false).length})`
                  : 'Activer localisations'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleOfflineMode}
            aria-pressed={offlineMode}
            className={`min-h-[44px] px-3.5 py-2 font-bold text-xs rounded-xl flex items-center gap-2 border active:scale-95 transition whitespace-nowrap ${
              offlineMode
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'glass-card text-slate-800 dark:text-slate-100 border-white/60 dark:border-white/12 hover:border-emerald-500/50'
            }`}
          >
            <WifiOff className="w-4 h-4" />
            <span>{offlineMode ? t.explorer.offlineModeActive : t.explorer.offlineModeBtn}</span>
            <span
              className={`font-mono tabular-nums text-[11px] ${
                offlineMode ? 'text-emerald-100' : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              ({downloadedCount}/{OFFLINE_MAP_PACKAGES.length})
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenGPSTracker}
            className="min-h-[44px] px-4 py-2 copper-gradient text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition whitespace-nowrap"
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>{t.explorer.trackerBtn}</span>
          </button>
        </div>
      </div>

      {/* Offline Park Maps Quick Control & LocalStorage Consultation Bar */}
      <div
        className={`rounded-2xl p-4 border transition space-y-3 glass-card ${
          offlineMode
            ? 'border-emerald-500/50'
            : 'border-white/60 dark:border-white/12'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                offlineMode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
              }`}
            >
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t.explorer.offlineBarTitle}
                </h3>
                <span className="text-[11px] font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                  · {downloadedCount} {t.explorer.offlineSavedCount} · {localStorageKB} Ko
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t.explorer.offlineBarHint}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOfflineModalOpen(true)}
            className="min-h-[44px] px-3.5 py-2 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{t.explorer.offlineManageBtn}</span>
          </button>
        </div>

        {offlineFeedback && (
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3.5 py-2">
            {offlineFeedback}
          </div>
        )}

        {/* Quick Offline Consult Chips for Cached Parks */}
        {downloadedList.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-0.5">
            {downloadedList.map((parkMap) => (
              <button
                key={parkMap.packageId}
                type="button"
                onClick={() => {
                  setSelectedPark(parkMap.parkId);
                  if (!offlineMode) {
                    setOfflineMode(true);
                    setExplorerOfflineMode(true);
                  }
                }}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold border whitespace-nowrap flex items-center gap-1.5 transition shrink-0 ${
                  selectedPark === parkMap.parkId && offlineMode
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'glass-surface border-white/55 dark:border-white/12 text-slate-800 dark:text-slate-200 hover:border-emerald-500/40'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>
                  {t.explorer.offlineConsultBtn} : {parkMap.name.replace('Parc National ', '').replace('de la ', '').replace("de l'", '')}
                </span>
                <span className="font-mono tabular-nums text-[10px] opacity-80">
                  ({parkMap.trails.length} GPS)
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Responsive Map & Planning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
          {/* Park Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {parksFilter.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedPark(f.id)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedPark === f.id
                    ? 'bg-amber-600 text-slate-950 font-bold shadow-sm'
                    : 'glass-card border border-white/60 dark:border-white/12 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Interactive Leaflet Map (supports Live OSM & LocalStorage Offline Topo Mode) */}
          <ExplorerMap
            events={events}
            selectedPark={selectedPark}
            onSelectEvent={onSelectEvent}
            showActivityLocations={showActivityLocations}
            onToggleActivityLocations={onToggleActivityLocations}
            userGpsCoords={userGpsCoords}
            focusedEventId={focusedEventId}
            onClearFocusedEvent={onClearFocusedEvent}
            offlineMode={offlineMode}
            onToggleOfflineMode={handleToggleOfflineMode}
            offlineMaps={offlineMaps}
            onDownloadParkOffline={handleQuickDownloadPark}
            isDownloadingPark={isDownloadingPark}
          />

          {/* Google Maps Grounding Assistant */}
          <MapsGroundingPanel selectedPark={selectedPark} />
        </div>

        <div className="lg:col-span-4 space-y-4">
          {/* Live GPS Trail Tracking Card */}
          <div className="glass-card border border-white/60 dark:border-white/12 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  Chronomètre & Ordinateur Sentier
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                  Mesure distance, dénivelé et allure en forêt
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenGPSTracker}
              className="min-h-[44px] px-3.5 py-2 glass-surface hover:bg-white/75 dark:hover:bg-white/12 text-amber-700 dark:text-amber-400 font-bold text-xs rounded-xl border border-amber-500/40 transition active:scale-95 shrink-0"
            >
              Ouvrir
            </button>
          </div>

          {/* Monthly Interactive Expedition Availability Calendar */}
          <ExpeditionCalendar
            events={events}
            selectedPark={selectedPark}
            onSelectEvent={onSelectEvent}
          />
        </div>
      </div>

      {/* SECTION 3.5 : ANNUAIRE DES EXPERTS & ÉCOGUIDES VÉRIFIÉS ANPN */}
      <div className="space-y-4 pt-2 border-t border-stone-200 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <CategoryIcon category="guides" size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif-display font-bold text-lg text-slate-900 dark:text-white truncate">
                  Experts & Guides Naturalistes ANPN ({filteredExperts.length})
                </h3>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                  ✓ 100% Agréés ANPN
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pisteurs d'élite, ornithologues, botanistes et photographes animaliers pour expéditions privées
              </p>
            </div>
          </div>
        </div>

        {/* Domain filter tags */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {expertDomains.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedExpertDomain(d.id)}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedExpertDomain === d.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'glass-card border border-white/60 dark:border-white/12 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Experts Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExperts.map((expert) => (
            <div
              key={expert.id}
              className="glass-card border border-white/60 dark:border-white/12 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {(() => {
                        const safePhoto = expert.photo ? sanitizeImageUrl(expert.photo) : '';
                        if (safePhoto && !brokenExpertPhotos[expert.id]) {
                          return (
                            <img
                              src={safePhoto}
                              alt={expert.name}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setBrokenExpertPhotos((prev) => ({ ...prev, [expert.id]: true }))
                              }
                              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/60 shadow-sm"
                            />
                          );
                        }
                        return (
                          <div className="w-16 h-16 rounded-2xl copper-gradient text-slate-950 font-serif-display font-black text-lg flex items-center justify-center border-2 border-amber-500/60 shadow-sm">
                            {expert.name.slice(0, 2).toUpperCase()}
                          </div>
                        );
                      })()}
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 text-slate-950 flex items-center justify-center text-[10px] font-black shadow">
                        ✓
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{expert.name}</h4>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                          · {expert.anpnLicense}
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">{expert.title}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-current" /> {expert.rating}
                        </span>
                        <span className="tabular-nums">({expert.reviewsCount} avis)</span>
                        <span>·</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {expert.languages.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-amber-700 dark:text-amber-400 font-mono tabular-nums block">
                      {expert.dayRate.toLocaleString('fr-FR')} F
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">/ jour</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {expert.bio}
                </p>

                <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                  {expert.expertiseTags.join(' · ')}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold">{expert.availabilityNote}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onBookExpert && onBookExpert(expert)}
                  className="min-h-[44px] px-4 py-2 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition shrink-0"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Réserver ce Guide</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Avis & Photos par Expédition (Firestore) */}
      {onAddReview && onDeleteReview && (
        <ExpeditionReviewsSection
          events={events}
          photos={photos}
          reviews={reviews}
          selectedPark={selectedPark}
          authUser={authUser}
          onSignInGoogle={onSignInGoogle}
          onAddReview={onAddReview}
          onDeleteReview={onDeleteReview}
        />
      )}

      {/* Contributions Terrain & Galerie Photo des Sites du Gabon */}
      {userProfile && onPublishSiteContribution && onDeleteSiteContribution && (
        <SiteContributionsSection
          contributions={siteContributions}
          authUser={authUser ?? null}
          userProfile={userProfile}
          activeParkFilter={selectedPark === 'denis' ? 'pongara' : selectedPark}
          onParkFilterChange={(nextSiteId) =>
            setSelectedPark(nextSiteId === 'pongara' ? 'denis' : nextSiteId)
          }
          onSignInGoogle={() => onSignInGoogle?.()}
          onPublishContribution={onPublishSiteContribution}
          onDeleteContribution={onDeleteSiteContribution}
          onStartPrivateChat={onStartPrivateChat}
        />
      )}

      {/* Native Free-Tier Partner Ad */}
      <SponsoredAdCard
        placement="explorer"
        isFreeTier={isFreeTier}
        isDismissed={dismissedAdIds.includes('ad-explorer-setrag')}
        onDismiss={onDismissAd}
        onNavigateTab={onNavigateTab}
        onUpgradeAdFree={onUpgradeAdFree}
      />

      {/* Protected Sites Guide */}
      <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <TreePine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Fiches Biodiversité & Réglementation ANPN
          </h3>
          {onOpenGallery && (
            <button
              type="button"
              onClick={onOpenGallery}
              className="min-h-[38px] px-3.5 py-1.5 glass-surface border border-white/60 dark:border-white/12 hover:border-amber-500/50 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t.home.galleryCta}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {protectedSites.map((site, index) => (
            <div
              key={index}
              className="glass-card border border-white/60 dark:border-white/12 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-amber-500/50 transition"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider block">
                      {site.region}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                      {site.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPark(site.parkId)}
                    className="min-h-[36px] text-xs text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-semibold flex items-center gap-1 shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" /> Carte
                  </button>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {site.desc}
                </p>
              </div>

              <div className="pt-2.5 border-t border-stone-200 dark:border-white/5 text-[11px] text-slate-600 dark:text-slate-400">
                <span>
                  🐘 <strong>Faune :</strong> {site.fauna}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Offline Maps Download & Consultation Modal directly inside ExplorerView */}
      <OfflineMapsModal
        isOpen={isOfflineModalOpen}
        onClose={() => {
          setIsOfflineModalOpen(false);
          refreshOfflineState();
        }}
        onMapsUpdated={refreshOfflineState}
        onViewOfflineMap={(parkId) => {
          setSelectedPark(parkId);
          setOfflineMode(true);
          setExplorerOfflineMode(true);
          refreshOfflineState();
        }}
      />
    </div>
  );
};
