/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  Grid3X3,
  Maximize2,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  X,
  AlertCircle,
  Loader2,
  LogIn,
} from 'lucide-react';
import {
  ExpeditionPhoto,
  ExpeditionReview,
  SiteContribution,
  TabType,
  UserProfile,
} from '../../types';
import {
  GABON_LANDSCAPES,
  GabonLandscapeId,
  LandscapePreference,
} from '../../data/gabonLandscapes';
import {
  GABON_SITES_CATALOG,
  resolveGabonSiteByParkNameOrId,
} from '../../data/gabonSites';
import { SiteContributionDraftInput } from '../SiteContributionsSection';
import { ChatRecipientTarget } from '../PrivateChatSection';
import { MediaCaptureBox } from '../MediaCaptureBox';
import { SponsoredAdCard } from '../SponsoredAdCard';
import { useLanguage } from '../../contexts/LanguageContext';
import { sanitizeImageUrl } from '../../utils/urlSecurity';

type GalleryCollectionFilter = 'all' | 'landscapes' | 'expeditions' | 'community' | 'favorites';
type GalleryLayoutMode = 'editorial' | 'compact';
type GalleryItemSource = 'landscape' | 'expedition' | 'community' | 'review';

interface UnifiedGalleryPhoto {
  id: string;
  source: GalleryItemSource;
  url: string;
  title: string;
  caption: string;
  parkId: string;
  parkName: string;
  date: string;
  authorName?: string;
  authorId?: string;
  authorAvatar?: string;
  expeditionId?: string;
  expeditionPhotoId?: string;
  landscapeId?: GabonLandscapeId;
  isFavorite?: boolean;
}

interface AuthUserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface PhotoGalleryViewProps {
  photos: ExpeditionPhoto[];
  favoritePhotoIds: string[];
  siteContributions: SiteContribution[];
  reviews: ExpeditionReview[];
  authUser: AuthUserSummary | null;
  userProfile: UserProfile;
  landscapePref: LandscapePreference;
  onChangeLandscape: (pref: LandscapePreference) => void;
  onToggleFavoritePhoto: (photoId: string) => void;
  onAddPersonalPhoto: (photo: ExpeditionPhoto) => void;
  onPublishSiteContribution?: (input: SiteContributionDraftInput) => Promise<void>;
  onStartPrivateChat?: (target: ChatRecipientTarget) => void;
  onSignInGoogle?: () => void;
  onNotifyToast?: (title: string, desc: string) => void;
  isFreeTier?: boolean;
  dismissedAdIds?: string[];
  onDismissAd?: (adId: string) => void;
  onUpgradeAdFree?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

export const PhotoGalleryView: React.FC<PhotoGalleryViewProps> = ({
  photos,
  favoritePhotoIds,
  siteContributions,
  reviews,
  authUser,
  userProfile,
  landscapePref,
  onChangeLandscape,
  onToggleFavoritePhoto,
  onAddPersonalPhoto,
  onPublishSiteContribution,
  onStartPrivateChat,
  onSignInGoogle,
  onNotifyToast,
  isFreeTier = true,
  dismissedAdIds = [],
  onDismissAd,
  onUpgradeAdFree,
  onNavigateTab,
}) => {
  const { lang, isRTL, t } = useLanguage();
  const numberLocale = lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar-EG' : 'fr-FR';

  const [collection, setCollection] = useState<GalleryCollectionFilter>('all');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<GalleryLayoutMode>('editorial');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadDestination, setUploadDestination] = useState<'site' | 'personal'>(
    authUser && onPublishSiteContribution ? 'site' : 'personal'
  );
  const [draftSiteId, setDraftSiteId] = useState<string>(GABON_SITES_CATALOG[0]?.id || 'mondah');
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftCaption, setDraftCaption] = useState<string>('');
  const [draftBlob, setDraftBlob] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const allItems = useMemo<UnifiedGalleryPhoto[]>(() => {
    const items: UnifiedGalleryPhoto[] = [];

    // 1. Community Site Contributions with photos
    for (const c of siteContributions) {
      const safeUrl = sanitizeImageUrl(c.photoUrl, { allowDataImage: true });
      if (!safeUrl) continue;
      const site = resolveGabonSiteByParkNameOrId(c.parkId || c.parkName);
      items.push({
        id: `contrib-${c.id}`,
        source: 'community',
        url: safeUrl,
        title: c.title,
        caption: c.description,
        parkId: site.id,
        parkName: c.parkName || site.shortName,
        date: c.createdAtMs
          ? new Date(c.createdAtMs).toLocaleDateString(numberLocale, {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : c.createdAtLabel,
        authorName: c.authorName,
        authorId: c.userId,
        authorAvatar: c.authorAvatar,
      });
    }

    // 2. Expedition Photos (local + added)
    for (const p of photos) {
      const safeUrl = sanitizeImageUrl(p.url, { allowDataImage: true });
      if (!safeUrl) continue;
      const site = resolveGabonSiteByParkNameOrId(p.parkName);
      items.push({
        id: `exp-${p.id}`,
        source: 'expedition',
        url: safeUrl,
        title: p.title,
        caption: p.caption,
        parkId: site.id,
        parkName: p.parkName || site.shortName,
        date: p.date,
        authorName: p.expeditionName || userProfile.name,
        expeditionPhotoId: p.id,
        isFavorite: favoritePhotoIds.includes(p.id) || p.isFavorite,
      });
    }

    // 3. Official Gabon Landscapes
    for (const l of GABON_LANDSCAPES) {
      const safeUrl = sanitizeImageUrl(l.image, { allowDataImage: true });
      if (!safeUrl) continue;
      const site = resolveGabonSiteByParkNameOrId(l.id);
      items.push({
        id: `landscape-${l.id}`,
        source: 'landscape',
        url: safeUrl,
        title: l.name,
        caption: l.alt,
        parkId: site.id,
        parkName: l.province,
        date: 'Gabon · ANPN',
        landscapeId: l.id,
      });
    }

    // 4. Reviews containing photos
    for (const r of reviews) {
      const safeUrl = sanitizeImageUrl(r.photoUrl, { allowDataImage: true });
      if (!safeUrl) continue;
      const site = resolveGabonSiteByParkNameOrId(r.eventId);
      items.push({
        id: `review-${r.id}`,
        source: 'review',
        url: safeUrl,
        title: r.authorName,
        caption: r.comment,
        parkId: site.id,
        parkName: site.shortName,
        date: r.createdAtMs
          ? new Date(r.createdAtMs).toLocaleDateString(numberLocale, {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : r.createdAtLabel,
        authorName: r.authorName,
        authorId: r.userId,
        authorAvatar: r.authorAvatar,
      });
    }

    return items;
  }, [siteContributions, photos, reviews, favoritePhotoIds, userProfile.name, numberLocale]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allItems.filter((item) => {
      if (collection === 'landscapes' && item.source !== 'landscape') return false;
      if (collection === 'expeditions' && item.source !== 'expedition') return false;
      if (collection === 'community' && item.source !== 'community' && item.source !== 'review') {
        return false;
      }
      if (collection === 'favorites' && !item.isFavorite) return false;

      if (selectedSiteId !== 'all' && item.parkId !== selectedSiteId) {
        return false;
      }

      if (q) {
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.caption.toLowerCase().includes(q) ||
          item.parkName.toLowerCase().includes(q) ||
          (item.authorName || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [allItems, collection, selectedSiteId, searchQuery]);

  const stats = useMemo(() => {
    const distinctParks = new Set(allItems.map((i) => i.parkId));
    return {
      total: allItems.length,
      parks: distinctParks.size,
      favorites: allItems.filter((i) => i.isFavorite).length,
    };
  }, [allItems]);

  const featuredItem = filteredItems[0] || null;
  const gridItems = layoutMode === 'editorial' && filteredItems.length > 3 ? filteredItems.slice(1) : filteredItems;

  const activeLightboxItem =
    lightboxIndex !== null && lightboxIndex >= 0 && lightboxIndex < filteredItems.length
      ? filteredItems[lightboxIndex]
      : null;

  const handleOpenLightboxById = (itemId: string) => {
    const idx = filteredItems.findIndex((it) => it.id === itemId);
    if (idx >= 0) {
      setLightboxIndex(idx);
    }
  };

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => {
          if (prev === null) return null;
          return isRTL
            ? (prev - 1 + filteredItems.length) % filteredItems.length
            : (prev + 1) % filteredItems.length;
        });
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => {
          if (prev === null) return null;
          return isRTL
            ? (prev + 1) % filteredItems.length
            : (prev - 1 + filteredItems.length) % filteredItems.length;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, filteredItems.length, isRTL]);

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });

  const handlePublishPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!draftBlob) {
      setUploadError(t.gallery.errMissingImage);
      return;
    }
    if (!draftTitle.trim()) {
      setUploadError(t.gallery.errMissingTitle);
      return;
    }

    const site = resolveGabonSiteByParkNameOrId(draftSiteId);

    if (uploadDestination === 'site') {
      if (!authUser || !onPublishSiteContribution) {
        setUploadError(t.gallery.errSignInSite);
        return;
      }
      setIsSubmitting(true);
      setUploadProgress(5);
      try {
        await onPublishSiteContribution({
          parkId: site.id,
          parkName: site.name,
          contributionType: 'PHOTO',
          title: draftTitle.trim(),
          description: draftCaption.trim() || site.highlights,
          photoBlob: draftBlob,
          onUploadProgress: (pct) => setUploadProgress(pct),
        });
        setDraftTitle('');
        setDraftCaption('');
        setDraftBlob(null);
        setUploadProgress(null);
        setIsUploadOpen(false);
        setCollection('community');
      } catch (err: any) {
        setUploadError(err?.message || t.gallery.errMissingImage);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Save to personal expedition album
    setIsSubmitting(true);
    try {
      const dataUrl = await blobToDataUrl(draftBlob);
      const safeDataUrl = sanitizeImageUrl(dataUrl, { allowDataImage: true });
      if (!safeDataUrl) {
        setUploadError(t.gallery.errMissingImage);
        setIsSubmitting(false);
        return;
      }
      const newPhoto: ExpeditionPhoto = {
        id: `photo-gallery-${Date.now()}`,
        title: draftTitle.trim().slice(0, 120),
        parkName: site.name,
        expeditionName: userProfile.name,
        url: safeDataUrl,
        date: new Date().toLocaleDateString(numberLocale, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        caption: draftCaption.trim() || site.highlights,
        isFavorite: true,
      };
      onAddPersonalPhoto(newPhoto);
      onNotifyToast?.(t.gallery.toastPersonalTitle, t.gallery.toastPersonalDesc);
      setDraftTitle('');
      setDraftCaption('');
      setDraftBlob(null);
      setIsUploadOpen(false);
      setCollection('expeditions');
    } catch {
      setUploadError(t.gallery.errMissingImage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourceLabel = (source: GalleryItemSource): string => {
    switch (source) {
      case 'landscape':
        return t.gallery.sourceLandscape;
      case 'expedition':
        return t.gallery.sourceExpedition;
      case 'community':
        return t.gallery.sourceCommunity;
      case 'review':
        return t.gallery.sourceReview;
    }
  };

  const collectionTabs: Array<{ id: GalleryCollectionFilter; label: string; count: number }> = [
    { id: 'all', label: t.gallery.filterAll, count: allItems.length },
    {
      id: 'landscapes',
      label: t.gallery.filterLandscapes,
      count: allItems.filter((i) => i.source === 'landscape').length,
    },
    {
      id: 'expeditions',
      label: t.gallery.filterExpeditions,
      count: allItems.filter((i) => i.source === 'expedition').length,
    },
    {
      id: 'community',
      label: t.gallery.filterCommunity,
      count: allItems.filter((i) => i.source === 'community' || i.source === 'review').length,
    },
    {
      id: 'favorites',
      label: t.gallery.filterFavorites,
      count: stats.favorites,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-3.5 py-4 sm:p-6 pb-24 lg:pb-12">
      {/* Editorial Gallery Header */}
      <section className="glass-card border border-white/60 dark:border-white/12 rounded-3xl p-4 sm:p-7 space-y-3.5 sm:space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0 max-w-2xl">
            <p className="text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400">
              {t.gallery.kicker}
            </p>
            <h1 className="font-serif-display text-xl sm:text-3xl font-normal text-slate-900 dark:text-white tracking-tight text-balance">
              {t.gallery.title}
            </h1>
            <p className="hidden sm:block text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {t.gallery.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <div className="flex items-center gap-5 text-start">
              <div>
                <span className="font-mono font-bold text-lg text-slate-900 dark:text-white block tabular-nums">
                  {stats.total.toLocaleString(numberLocale)}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  {t.gallery.totalPhotosLabel}
                </span>
              </div>
              <div>
                <span className="font-mono font-bold text-lg text-emerald-700 dark:text-emerald-400 block tabular-nums">
                  {stats.parks}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  {t.gallery.parksCoveredLabel}
                </span>
              </div>
              <div>
                <span className="font-mono font-bold text-lg text-amber-700 dark:text-amber-400 block tabular-nums">
                  {stats.favorites}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  {t.gallery.favoritesLabel}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                setIsUploadOpen(true);
              }}
              className="min-h-[44px] px-4 py-2.5 copper-gradient text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-sm active:scale-95 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>{t.gallery.addPhotoBtn}</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="pt-3 sm:pt-4 border-t border-slate-900/10 dark:border-white/10 space-y-2.5 sm:space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Segmented Collection Filter */}
            <div className="flex items-center gap-1 p-1 glass-surface border border-white/60 dark:border-white/10 rounded-xl overflow-x-auto no-scrollbar">
              {collectionTabs.map((tab) => {
                const isActive = collection === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCollection(tab.id)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="font-mono text-[11px] opacity-75 tabular-nums">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search + Layout Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.gallery.searchPlaceholder}
                  className="w-full min-h-[40px] ps-10 pe-4 py-2 glass-surface border border-white/60 dark:border-white/12 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-amber-500 text-start"
                />
              </div>

              <div className="flex items-center gap-1 p-1 glass-surface border border-white/60 dark:border-white/10 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setLayoutMode('editorial')}
                  aria-label={t.gallery.viewGridAria}
                  title={t.gallery.viewGridAria}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    layoutMode === 'editorial'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('compact')}
                  aria-label={t.gallery.viewCompactAria}
                  title={t.gallery.viewCompactAria}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    layoutMode === 'compact'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Gabon Parks / Sites Filter Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedSiteId('all')}
              className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                selectedSiteId === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'glass-surface border border-white/50 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-500/45'
              }`}
            >
              {t.gallery.allSitesOption}
            </button>
            {GABON_SITES_CATALOG.map((site) => {
              const isSelected = selectedSiteId === site.id;
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => setSelectedSiteId(site.id)}
                  className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'glass-surface border border-white/50 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-500/45'
                  }`}
                >
                  {site.shortName}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="glass-card border border-white/60 dark:border-white/12 rounded-3xl p-10 text-center space-y-3">
          <ImageIcon className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto opacity-80" />
          <h2 className="font-serif-display text-lg font-bold text-slate-900 dark:text-white">
            {t.gallery.emptyTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {t.gallery.emptySubtitle}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCollection('all');
                setSelectedSiteId('all');
                setSearchQuery('');
              }}
              className="min-h-[40px] px-4 py-2 glass-surface border border-white/60 dark:border-white/12 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
            >
              {t.gallery.resetFilters}
            </button>
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="min-h-[40px] px-4 py-2 copper-gradient text-slate-950 font-black rounded-xl text-xs"
            >
              {t.gallery.addPhotoBtn}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Editorial Spotlight Hero Card */}
          {layoutMode === 'editorial' && featuredItem && filteredItems.length > 3 && (
            <article className="group relative rounded-3xl overflow-hidden border border-white/60 dark:border-white/15 bg-slate-950 shadow-sm aspect-[16/10] sm:aspect-[21/9]">
              {!brokenImages[featuredItem.id] ? (
                <img
                  src={featuredItem.url}
                  alt={featuredItem.title}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setBrokenImages((prev) => ({ ...prev, [featuredItem.id]: true }))
                  }
                  onClick={() => handleOpenLightboxById(featuredItem.id)}
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400">
                  <ImageIcon className="w-10 h-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15 pointer-events-none" />

              {/* Top Right Actions */}
              <div className="absolute top-4 end-4 flex items-center gap-2">
                {featuredItem.expeditionPhotoId && (
                  <button
                    type="button"
                    onClick={() => onToggleFavoritePhoto(featuredItem.expeditionPhotoId!)}
                    aria-label={
                      featuredItem.isFavorite
                        ? t.gallery.favoriteRemove
                        : t.gallery.favoriteAdd
                    }
                    className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition active:scale-90 ${
                      featuredItem.isFavorite
                        ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg'
                        : 'bg-black/45 border-white/25 text-white hover:bg-black/65'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${featuredItem.isFavorite ? 'fill-current' : ''}`}
                    />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenLightboxById(featuredItem.id)}
                  aria-label={t.gallery.openLightboxAria}
                  className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-white/25 text-white hover:bg-black/65 flex items-center justify-center transition"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Unboxed Editorial Info */}
              <div
                onClick={() => handleOpenLightboxById(featuredItem.id)}
                className="absolute bottom-0 inset-x-0 p-5 sm:p-7 cursor-pointer flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-start"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <p className="text-xs font-semibold text-amber-300">
                    {t.gallery.featuredTag} <span aria-hidden="true">·</span>{' '}
                    {getSourceLabel(featuredItem.source)} <span aria-hidden="true">·</span>{' '}
                    {featuredItem.parkName}
                  </p>
                  <h2 className="font-serif-display text-xl sm:text-2xl font-normal text-white text-balance">
                    {featuredItem.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-200 line-clamp-2 leading-relaxed">
                    {featuredItem.caption}
                  </p>
                </div>

                {featuredItem.landscapeId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeLandscape(featuredItem.landscapeId!);
                      onNotifyToast?.(
                        t.gallery.toastBackdropTitle,
                        `${t.gallery.toastBackdropDesc} ${featuredItem.title}`
                      );
                    }}
                    className="min-h-[40px] px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      {landscapePref === featuredItem.landscapeId
                        ? t.gallery.backdropApplied
                        : t.gallery.applyBackdrop}
                    </span>
                  </button>
                )}
              </div>
            </article>
          )}

          {/* Photo Grid */}
          <div
            className={
              layoutMode === 'editorial'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
            }
          >
            {gridItems.map((item) => {
              const isLandscapeActive =
                item.landscapeId !== undefined && landscapePref === item.landscapeId;

              return (
                <article
                  key={item.id}
                  className="group glass-card border border-white/60 dark:border-white/12 hover:border-amber-500/50 rounded-2xl overflow-hidden flex flex-col transition"
                >
                  <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                    {!brokenImages[item.id] ? (
                      <img
                        src={item.url}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [item.id]: true }))
                        }
                        onClick={() => handleOpenLightboxById(item.id)}
                        className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/15 pointer-events-none" />

                    {/* Top corner interactive controls */}
                    <div className="absolute top-2.5 end-2.5 flex items-center gap-1.5">
                      {item.expeditionPhotoId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavoritePhoto(item.expeditionPhotoId!);
                          }}
                          aria-label={
                            item.isFavorite
                              ? t.gallery.favoriteRemove
                              : t.gallery.favoriteAdd
                          }
                          className={`w-8 h-8 rounded-full backdrop-blur-md border flex items-center justify-center transition active:scale-90 ${
                            item.isFavorite
                              ? 'bg-amber-500 border-amber-400 text-slate-950 shadow'
                              : 'bg-black/45 border-white/25 text-white hover:bg-black/70'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`}
                          />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenLightboxById(item.id)}
                        aria-label={t.gallery.openLightboxAria}
                        className="w-8 h-8 rounded-full bg-black/45 backdrop-blur-md border border-white/25 text-white hover:bg-black/70 flex items-center justify-center transition"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Clean Metadata Body */}
                  <div
                    onClick={() => handleOpenLightboxById(item.id)}
                    className={`cursor-pointer flex-1 flex flex-col justify-between gap-2 text-start ${
                      layoutMode === 'compact' ? 'p-3' : 'p-4'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 truncate">
                        {item.parkName} <span aria-hidden="true">·</span> {item.date}
                      </p>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {item.title}
                      </h3>
                      {layoutMode === 'editorial' && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {item.caption}
                        </p>
                      )}
                    </div>

                    {layoutMode === 'editorial' && (
                      <div className="pt-2.5 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="truncate">
                          {getSourceLabel(item.source)}
                          {item.authorName ? ` · ${item.authorName}` : ''}
                        </span>

                        {item.landscapeId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChangeLandscape(item.landscapeId!);
                              onNotifyToast?.(
                                t.gallery.toastBackdropTitle,
                                `${t.gallery.toastBackdropDesc} ${item.title}`
                              );
                            }}
                            className={`font-bold whitespace-nowrap shrink-0 transition ${
                              isLandscapeActive
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400 hover:underline'
                            }`}
                          >
                            {isLandscapeActive ? t.gallery.backdropApplied : t.gallery.applyBackdrop}
                          </button>
                        )}

                        {item.authorId &&
                          authUser &&
                          item.authorId !== authUser.uid &&
                          onStartPrivateChat && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartPrivateChat({
                                  uid: item.authorId!,
                                  displayName: item.authorName || 'Explorateur',
                                  avatarUrl: item.authorAvatar,
                                  subtitle: item.parkName,
                                });
                              }}
                              className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{t.gallery.contactAuthor}</span>
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Native Free-Tier Partner Ad */}
      <SponsoredAdCard
        placement="galerie"
        compact
        isFreeTier={isFreeTier}
        isDismissed={dismissedAdIds.includes('ad-galerie-optique')}
        onDismiss={onDismissAd}
        onNavigateTab={onNavigateTab}
        onUpgradeAdFree={onUpgradeAdFree}
      />

      {/* Fullscreen Photo Lightbox with Prev/Next Navigation */}
      {activeLightboxItem && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))] px-safe animate-in fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between gap-3 text-white max-w-6xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0 text-start">
              <p className="text-xs font-semibold text-amber-400 truncate">
                {getSourceLabel(activeLightboxItem.source)} <span aria-hidden="true">·</span>{' '}
                {activeLightboxItem.parkName} <span aria-hidden="true">·</span>{' '}
                {activeLightboxItem.date}
              </p>
              <h3 className="font-serif-display text-lg sm:text-xl text-white truncate">
                {activeLightboxItem.title}
              </h3>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="font-mono text-xs text-stone-300 tabular-nums">
                {lightboxIndex + 1} / {filteredItems.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label={t.common.close}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Photo & Prev/Next Controls */}
          <div className="relative flex-1 flex items-center justify-center py-4 max-w-6xl w-full mx-auto">
            {filteredItems.length > 1 && (
              <button
                type="button"
                aria-label={t.gallery.prevPhotoAria}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(
                    (lightboxIndex - 1 + filteredItems.length) % filteredItems.length
                  );
                }}
                className="absolute start-1 sm:start-3 z-10 w-11 h-11 rounded-full bg-black/55 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition"
              >
                <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
              </button>
            )}

            <img
              src={activeLightboxItem.url}
              alt={activeLightboxItem.title}
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[68vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />

            {filteredItems.length > 1 && (
              <button
                type="button"
                aria-label={t.gallery.nextPhotoAria}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
                }}
                className="absolute end-1 sm:end-3 z-10 w-11 h-11 rounded-full bg-black/55 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition"
              >
                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            )}
          </div>

          {/* Bottom Caption & Actions */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-modal border border-white/15 rounded-2xl p-4 max-w-2xl mx-auto w-full space-y-3 text-center"
          >
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {activeLightboxItem.caption}
            </p>
            {activeLightboxItem.authorName && (
              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                {activeLightboxItem.authorName}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {activeLightboxItem.expeditionPhotoId && (
                <button
                  type="button"
                  onClick={() => onToggleFavoritePhoto(activeLightboxItem.expeditionPhotoId!)}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition ${
                    activeLightboxItem.isFavorite
                      ? 'copper-gradient text-slate-950 shadow'
                      : 'glass-surface border border-white/30 text-slate-900 dark:text-white'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${activeLightboxItem.isFavorite ? 'fill-current' : ''}`}
                  />
                  <span>
                    {activeLightboxItem.isFavorite
                      ? t.gallery.favoriteRemove
                      : t.gallery.favoriteAdd}
                  </span>
                </button>
              )}

              {activeLightboxItem.landscapeId && (
                <button
                  type="button"
                  onClick={() => {
                    onChangeLandscape(activeLightboxItem.landscapeId!);
                    onNotifyToast?.(
                      t.gallery.toastBackdropTitle,
                      `${t.gallery.toastBackdropDesc} ${activeLightboxItem.title}`
                    );
                  }}
                  className="min-h-[40px] px-4 py-2 copper-gradient text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {landscapePref === activeLightboxItem.landscapeId
                      ? t.gallery.backdropApplied
                      : t.gallery.applyBackdrop}
                  </span>
                </button>
              )}

              {activeLightboxItem.authorId &&
                authUser &&
                activeLightboxItem.authorId !== authUser.uid &&
                onStartPrivateChat && (
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxIndex(null);
                      onStartPrivateChat({
                        uid: activeLightboxItem.authorId!,
                        displayName: activeLightboxItem.authorName || 'Explorateur',
                        avatarUrl: activeLightboxItem.authorAvatar,
                        subtitle: activeLightboxItem.parkName,
                      });
                    }}
                    className="min-h-[40px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t.gallery.contactAuthor}</span>
                  </button>
                )}

              <a
                href={activeLightboxItem.url}
                download={`${activeLightboxItem.parkId || 'gabon'}-mangorema.jpg`}
                className="min-h-[40px] px-4 py-2 glass-surface border border-white/30 text-slate-900 dark:text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.gallery.downloadPhoto}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Upload / Add Photo Modal */}
      {isUploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => !isSubmitting && setIsUploadOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-modal border border-white/60 dark:border-white/15 w-full max-w-lg rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl text-start"
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-900/10 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-display font-bold text-lg text-slate-900 dark:text-white">
                    {t.gallery.uploadModalTitle}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t.gallery.uploadModalSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsUploadOpen(false)}
                aria-label={t.common.close}
                className="w-8 h-8 rounded-full glass-surface border border-white/50 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishPhoto} className="space-y-4">
              {/* Destination selector */}
              <div className="grid grid-cols-2 gap-2 p-1 glass-surface border border-white/50 dark:border-white/10 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUploadDestination('site')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition ${
                    uploadDestination === 'site'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t.gallery.uploadDestSite}
                </button>
                <button
                  type="button"
                  onClick={() => setUploadDestination('personal')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition ${
                    uploadDestination === 'personal'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t.gallery.uploadDestPersonal}
                </button>
              </div>

              {uploadDestination === 'site' && !authUser && onSignInGoogle && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/35 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    {t.gallery.errSignInSite}
                  </p>
                  <button
                    type="button"
                    onClick={onSignInGoogle}
                    className="min-h-[36px] px-3 py-1.5 copper-gradient text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t.common.connectGoogle}</span>
                  </button>
                </div>
              )}

              <MediaCaptureBox
                selectedBlob={draftBlob}
                onBlobChange={(blob) => setDraftBlob(blob)}
                uploadProgress={uploadProgress}
                disabled={isSubmitting}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.gallery.titleLabel}
                  </label>
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder={t.gallery.titlePlaceholder}
                    className="w-full min-h-[40px] px-3 py-2 glass-surface border border-white/60 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 text-start"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.gallery.parkLabel}
                  </label>
                  <select
                    value={draftSiteId}
                    onChange={(e) => setDraftSiteId(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 glass-surface border border-white/60 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 text-start"
                  >
                    {GABON_SITES_CATALOG.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t.gallery.captionLabel}
                </label>
                <textarea
                  rows={2}
                  value={draftCaption}
                  onChange={(e) => setDraftCaption(e.target.value)}
                  placeholder={t.gallery.captionPlaceholder}
                  className="w-full px-3 py-2 glass-surface border border-white/60 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 text-start"
                />
              </div>

              {uploadError && (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-slate-900/10 dark:border-white/10">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsUploadOpen(false)}
                  className="flex-1 min-h-[44px] py-2.5 glass-surface border border-white/60 dark:border-white/15 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 min-h-[44px] py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{t.gallery.submitBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
