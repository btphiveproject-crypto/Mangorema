/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Camera,
  Plus,
  Trash2,
  MessageSquare,
  MapPin,
  X,
  Maximize2,
  LogIn,
  Loader2,
  Compass,
  Eye,
  Tent,
  Signpost,
  AlertCircle,
} from 'lucide-react';
import {
  SiteContribution,
  SiteContributionType,
  UserProfile,
} from '../types';
import { GABON_SITES_CATALOG, resolveGabonSiteByParkNameOrId } from '../data/gabonSites';
import { MediaCaptureBox } from './MediaCaptureBox';
import { sanitizeImageUrl } from '../utils/urlSecurity';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthUserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface SiteContributionDraftInput {
  parkId: string;
  parkName: string;
  zoneLabel?: string;
  contributionType: SiteContributionType;
  title: string;
  description: string;
  photoBlob?: Blob | null;
  onUploadProgress?: (pct: number) => void;
}

interface SiteContributionsSectionProps {
  contributions: SiteContribution[];
  authUser: AuthUserSummary | null;
  userProfile: UserProfile;
  activeParkFilter?: string;
  onParkFilterChange?: (parkId: string) => void;
  filterOnlyOwnUserId?: string;
  title?: string;
  subtitle?: string;
  onSignInGoogle: () => void;
  onPublishContribution: (input: SiteContributionDraftInput) => Promise<void>;
  onDeleteContribution: (item: SiteContribution) => Promise<void>;
  onStartPrivateChat?: (target: { uid: string; displayName: string; avatarUrl?: string; subtitle?: string }) => void;
}

const CONTRIBUTION_TYPE_ICONS: Record<
  SiteContributionType,
  React.ComponentType<{ className?: string }>
> = {
  PHOTO: Camera,
  OBSERVATION: Eye,
  TRAIL_TIP: Signpost,
  CAMP_INFO: Tent,
};

export const SiteContributionsSection: React.FC<SiteContributionsSectionProps> = ({
  contributions,
  authUser,
  userProfile,
  activeParkFilter = 'all',
  onParkFilterChange,
  filterOnlyOwnUserId,
  title,
  subtitle,
  onSignInGoogle,
  onPublishContribution,
  onDeleteContribution,
  onStartPrivateChat,
}) => {
  const { t } = useLanguage();
  const effectiveTitle = title ?? t.contributions.title;
  const effectiveSubtitle = subtitle ?? t.contributions.subtitle;
  const [localParkFilter, setLocalParkFilter] = useState<string>(activeParkFilter || 'all');
  const effectiveParkFilter = onParkFilterChange ? activeParkFilter : localParkFilter;

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(() =>
    effectiveParkFilter !== 'all' ? effectiveParkFilter : (GABON_SITES_CATALOG[0]?.id || 'mondah')
  );
  const [contributionType, setContributionType] = useState<SiteContributionType>('PHOTO');
  const [zoneLabel, setZoneLabel] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [lightboxItem, setLightboxItem] = useState<SiteContribution | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSetParkFilter = (parkId: string) => {
    if (onParkFilterChange) {
      onParkFilterChange(parkId);
    } else {
      setLocalParkFilter(parkId);
    }
  };

  const openComposerForCurrentSite = () => {
    const defaultSite =
      effectiveParkFilter && effectiveParkFilter !== 'all'
        ? resolveGabonSiteByParkNameOrId(effectiveParkFilter).id
        : (GABON_SITES_CATALOG[0]?.id || 'mondah');
    setSelectedSiteId(defaultSite);
    setFormError(null);
    setIsComposerOpen(true);
  };

  const scopedContributions = useMemo(() => {
    return contributions.filter((item) => {
      if (filterOnlyOwnUserId && item.userId !== filterOnlyOwnUserId) {
        return false;
      }
      if (!effectiveParkFilter || effectiveParkFilter === 'all') {
        return true;
      }
      const normalized = effectiveParkFilter.toLowerCase();
      return (
        item.parkId.toLowerCase() === normalized ||
        item.parkName.toLowerCase().includes(normalized)
      );
    });
  }, [contributions, effectiveParkFilter, filterOnlyOwnUserId]);

  const countsByPark = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of contributions) {
      if (filterOnlyOwnUserId && c.userId !== filterOnlyOwnUserId) continue;
      counts[c.parkId] = (counts[c.parkId] || 0) + 1;
    }
    return counts;
  }, [contributions, filterOnlyOwnUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!authUser) {
      setFormError(t.contributions.errAuth);
      return;
    }
    const cleanTitle = draftTitle.trim();
    const cleanDesc = draftDescription.trim();
    if (cleanTitle.length < 2) {
      setFormError(t.contributions.errTitle);
      return;
    }
    if (cleanDesc.length < 2) {
      setFormError(t.contributions.errDesc);
      return;
    }
    if (contributionType === 'PHOTO' && !photoBlob) {
      setFormError(t.contributions.errPhotoRequired);
      return;
    }

    const site = resolveGabonSiteByParkNameOrId(selectedSiteId);
    setIsSubmitting(true);
    setUploadProgress(photoBlob ? 5 : null);

    try {
      await onPublishContribution({
        parkId: site.id,
        parkName: site.name,
        zoneLabel: zoneLabel.trim() || undefined,
        contributionType,
        title: cleanTitle,
        description: cleanDesc,
        photoBlob,
        onUploadProgress: (pct) => setUploadProgress(pct),
      });
      setDraftTitle('');
      setDraftDescription('');
      setZoneLabel('');
      setPhotoBlob(null);
      setUploadProgress(null);
      setIsComposerOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Publication impossible pour le moment.');
      setUploadProgress(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: SiteContribution) => {
    setDeletingId(item.id);
    try {
      await onDeleteContribution(item);
      if (lightboxItem?.id === item.id) {
        setLightboxItem(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="glass-card rounded-3xl p-4 sm:p-6 space-y-5">
      {/* Header & Action CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            <Compass className="w-4 h-4 shrink-0" />
            <span>{t.contributions.kicker}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {effectiveTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {effectiveSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={openComposerForCurrentSite}
          className="copper-gradient text-white px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 min-h-[44px] shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{t.contributions.ctaAdd}</span>
        </button>
      </div>

      {/* Site Selector Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => handleSetParkFilter('all')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap min-h-[38px] border ${
            effectiveParkFilter === 'all'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
              : 'glass-surface text-slate-700 dark:text-slate-200 border-white/25 hover:bg-white/50 dark:hover:bg-white/10'
          }`}
        >
          {t.contributions.allSites} · <span className="tabular-nums">{Object.values(countsByPark).reduce((a, b) => a + b, 0)}</span>
        </button>

        {GABON_SITES_CATALOG.map((site) => {
          const isActive = effectiveParkFilter === site.id;
          const count = countsByPark[site.id] || 0;
          return (
            <button
              key={site.id}
              type="button"
              onClick={() => handleSetParkFilter(site.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap min-h-[38px] border ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'glass-surface text-slate-700 dark:text-slate-200 border-white/25 hover:bg-white/50 dark:hover:bg-white/10'
              }`}
            >
              {site.shortName}
              {count > 0 && <span className="ms-1 opacity-80 tabular-nums">· {count}</span>}
            </button>
          );
        })}
      </div>

      {/* Contributions Photo & Field Notes Grid */}
      {scopedContributions.length === 0 ? (
        <div className="glass-surface rounded-2xl p-6 sm:p-8 text-center space-y-3 border border-dashed border-emerald-500/30">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
            <Camera className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {t.contributions.emptyTitle}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.contributions.emptyDescPrefix}{' '}
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                {effectiveParkFilter === 'all'
                  ? t.contributions.emptyAllParks
                  : resolveGabonSiteByParkNameOrId(effectiveParkFilter).name}
              </span>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={openComposerForCurrentSite}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {t.contributions.addFirstPhoto}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scopedContributions.map((item) => {
            const safePhoto = !brokenImages[item.id] ? sanitizeImageUrl(item.photoUrl) : undefined;
            const safeAvatar = sanitizeImageUrl(item.authorAvatar);
            const siteMeta = resolveGabonSiteByParkNameOrId(item.parkId);
            const displayImage = safePhoto || siteMeta.coverImage;
            const typeText = t.contributions.types[item.contributionType] || t.contributions.types.PHOTO;
            const TypeIcon = CONTRIBUTION_TYPE_ICONS[item.contributionType] || Camera;
            const isOwn = Boolean(authUser && authUser.uid === item.userId);

            return (
              <article
                key={item.id}
                className="glass-surface rounded-2xl overflow-hidden flex flex-col border border-white/25 dark:border-white/10 transition-transform hover:-translate-y-0.5"
              >
                {/* Photo Header */}
                <div className="relative aspect-[4/3] bg-slate-900/20 overflow-hidden group">
                  <img
                    src={displayImage}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    onError={() => {
                      if (safePhoto) {
                        setBrokenImages((prev) => ({ ...prev, [item.id]: true }));
                      }
                    }}
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
                      !safePhoto ? 'opacity-85 saturate-90' : ''
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-black/55 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5">
                      <TypeIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      {typeText.shortLabel}
                      {!safePhoto && ` · ${t.contributions.spotBadge}`}
                    </span>

                    {safePhoto && (
                      <button
                        type="button"
                        onClick={() => setLightboxItem(item)}
                        className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-colors"
                        aria-label={`Agrandir ${item.title}`}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <div className="flex items-center gap-1 text-[11px] text-amber-200 font-semibold truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {siteMeta.shortName}
                        {item.zoneLabel ? ` · ${item.zoneLabel}` : ''}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold leading-snug line-clamp-1 mt-0.5">
                      {item.title}
                    </h4>
                  </div>
                </div>

                {/* Body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  <div className="pt-2.5 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {safeAvatar ? (
                        <img
                          src={safeAvatar}
                          alt={item.authorName}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover border border-white/40 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {item.authorName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.authorName}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {item.createdAtLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isOwn && onStartPrivateChat && (
                        <button
                          type="button"
                          onClick={() =>
                            onStartPrivateChat({
                              uid: item.userId,
                              displayName: item.authorName,
                              avatarUrl: safeAvatar,
                              subtitle: `${t.contributions.contributedOnPrefix} ${siteMeta.shortName}`,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span>{t.contributions.messageBtn}</span>
                        </button>
                      )}

                      {isOwn && (
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 transition-colors"
                          aria-label="Supprimer ma contribution"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Composer Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-[120] glass-scrim flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="glass-modal w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[92dvh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {t.contributions.modalTitle}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {t.contributions.modalSubtitlePrefix} <span className="font-semibold">{userProfile.name}</span> · {t.contributions.modalSubtitleSuffix}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="p-2 rounded-xl glass-surface text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10"
                aria-label={t.common.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!authUser ? (
              <div className="glass-surface rounded-2xl p-5 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t.contributions.authPrompt}
                </p>
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl copper-gradient text-white text-xs font-bold shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  {t.common.connectGoogle}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      {t.contributions.siteLabel}
                    </label>
                    <select
                      value={selectedSiteId}
                      onChange={(e) => setSelectedSiteId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      {GABON_SITES_CATALOG.map((site) => (
                        <option key={site.id} value={site.id} className="bg-white dark:bg-slate-900">
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      {t.contributions.typeLabel}
                    </label>
                    <select
                      value={contributionType}
                      onChange={(e) => setContributionType(e.target.value as SiteContributionType)}
                      className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      {(Object.keys(CONTRIBUTION_TYPE_ICONS) as SiteContributionType[]).map((key) => (
                        <option key={key} value={key} className="bg-white dark:bg-slate-900">
                          {t.contributions.types[key].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      {t.contributions.shortTitleLabel}
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder={t.contributions.shortTitlePlaceholder}
                      className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      {t.contributions.zoneLabel}
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={zoneLabel}
                      onChange={(e) => setZoneLabel(e.target.value)}
                      placeholder={t.contributions.zonePlaceholder}
                      className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    {t.contributions.descLabel}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={800}
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    placeholder={t.contributions.descPlaceholder}
                    className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                  />
                </div>

                <MediaCaptureBox
                  label={contributionType === 'PHOTO' ? t.contributions.photoRecommended : t.contributions.photoOptional}
                  selectedBlob={photoBlob}
                  onBlobChange={setPhotoBlob}
                  uploadProgress={uploadProgress}
                  disabled={isSubmitting}
                />

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsComposerOpen(false)}
                    className="px-4 py-2.5 rounded-xl glass-surface text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl copper-gradient text-white text-xs sm:text-sm font-bold shadow-lg flex items-center gap-2 whitespace-nowrap"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t.contributions.publishBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="max-w-3xl w-full glass-modal rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-black">
              <img
                src={sanitizeImageUrl(lightboxItem.photoUrl) || resolveGabonSiteByParkNameOrId(lightboxItem.parkId).coverImage}
                alt={lightboxItem.title}
                referrerPolicy="no-referrer"
                className="w-full max-h-[68vh] object-contain mx-auto"
              />
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="absolute top-3 end-3 p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-white"
                aria-label={t.common.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {lightboxItem.parkName}
                    {lightboxItem.zoneLabel ? ` · ${lightboxItem.zoneLabel}` : ''}
                  </p>
                  <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    {lightboxItem.title}
                  </h4>
                </div>
                {onStartPrivateChat && authUser?.uid !== lightboxItem.userId && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = lightboxItem;
                      setLightboxItem(null);
                      onStartPrivateChat({
                        uid: target.userId,
                        displayName: target.authorName,
                        avatarUrl: sanitizeImageUrl(target.authorAvatar),
                        subtitle: target.parkName,
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t.contributions.writeToPrefix} {lightboxItem.authorName}
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {lightboxItem.description}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.contributions.publishedBy} {lightboxItem.authorName} · {lightboxItem.createdAtLabel}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
