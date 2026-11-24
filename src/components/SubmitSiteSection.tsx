/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  X,
  LogIn,
  Loader2,
  AlertCircle,
  Trees,
  Shield,
  Waves,
  Droplets,
  Mountain,
  Footprints,
  Tent,
  Landmark,
  Sprout,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  SubmittedSite,
  SubmittedSiteDifficulty,
  SubmittedSiteType,
  UserProfile,
} from '../types';
import { MediaCaptureBox } from './MediaCaptureBox';
import { sanitizeImageUrl } from '../utils/urlSecurity';
import { useLanguage } from '../contexts/LanguageContext';

export interface SubmittedSiteDraftInput {
  siteName: string;
  siteType: SubmittedSiteType;
  province: string;
  locationLabel?: string;
  difficulty: SubmittedSiteDifficulty;
  description: string;
  photoBlob?: Blob | null;
  onUploadProgress?: (pct: number) => void;
}

interface SubmitSiteSectionProps {
  submittedSites: SubmittedSite[];
  authUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  userProfile: UserProfile;
  openComposerSignal?: number;
  onSignInGoogle: () => void;
  onSubmitSite: (input: SubmittedSiteDraftInput) => Promise<void>;
  onDeleteSubmittedSite: (site: SubmittedSite) => Promise<void>;
}

export const GABON_PROVINCES = [
  'Estuaire',
  'Haut-Ogooué',
  'Moyen-Ogooué',
  'Ngounié',
  'Nyanga',
  'Ogooué-Ivindo',
  'Ogooué-Lolo',
  'Ogooué-Maritime',
  'Woleu-Ntem',
] as const;

export const SITE_TYPE_META: Record<
  SubmittedSiteType,
  {
    icon: React.ComponentType<{ className?: string }>;
    labels: { fr: string; en: string; ar: string };
    hints: { fr: string; en: string; ar: string };
  }
> = {
  PARC_NATIONAL: {
    icon: Trees,
    labels: { fr: 'Parc National', en: 'National Park', ar: 'منتزه وطني' },
    hints: { fr: 'Aire protégée ANPN', en: 'ANPN protected area', ar: 'منطقة محمية' },
  },
  RESERVE_NATURELLE: {
    icon: Shield,
    labels: { fr: 'Réserve Naturelle', en: 'Nature Reserve', ar: 'محمية طبيعية' },
    hints: { fr: 'Sanctuaire faune & flore', en: 'Wildlife sanctuary', ar: 'ملاذ للحياة البرية' },
  },
  CASCADE_CHUTE: {
    icon: Droplets,
    labels: { fr: 'Cascade / Chute', en: 'Waterfall', ar: 'شلالات' },
    hints: { fr: 'Chute d’eau & rivière', en: 'Waterfall & river pool', ar: 'شلال ونهر' },
  },
  PLAGE_LAGUNE: {
    icon: Waves,
    labels: { fr: 'Plage / Lagune', en: 'Beach / Lagoon', ar: 'شاطئ وبحيرة' },
    hints: { fr: 'Littoral, baie ou lac', en: 'Coastline or lagoon', ar: 'ساحل أو بحيرة' },
  },
  MONTAGNE_SOMMET: {
    icon: Mountain,
    labels: { fr: 'Montagne / Sommet', en: 'Mountain / Peak', ar: 'جبل وقمة' },
    hints: { fr: 'Relief, crête, belvédère', en: 'Peak or viewpoint', ar: 'قمة ومطل' },
  },
  SENTIER_FORET: {
    icon: Footprints,
    labels: { fr: 'Sentier / Forêt', en: 'Forest Trail', ar: 'مسار غابي' },
    hints: { fr: 'Boucle pédestre ou VTT', en: 'Hiking or MTB loop', ar: 'مسار مشي أو دراجات' },
  },
  MANGROVE_ZONE_HUMIDE: {
    icon: Sprout,
    labels: { fr: 'Mangrove / Marais', en: 'Mangrove / Wetland', ar: 'مانغروف وأرض رطبة' },
    hints: { fr: 'Estuaire & zone humide', en: 'Estuary & wetland', ar: 'مصب وأرض رطبة' },
  },
  ECOLODGE_CAMP: {
    icon: Tent,
    labels: { fr: 'Écolodge / Bivouac', en: 'Ecolodge / Camp', ar: 'نزل بيئي ومخيم' },
    hints: { fr: 'Hébergement nature', en: 'Nature camp or lodge', ar: 'مخيم أو نزل طبيعي' },
  },
  SITE_CULTUREL: {
    icon: Landmark,
    labels: { fr: 'Site Culturel', en: 'Cultural Site', ar: 'موقع ثقافي' },
    hints: { fr: 'Patrimoine & traditions', en: 'Heritage & village', ar: 'تراث وتقاليد' },
  },
};

export const SubmitSiteSection: React.FC<SubmitSiteSectionProps> = ({
  submittedSites,
  authUser,
  userProfile,
  openComposerSignal = 0,
  onSignInGoogle,
  onSubmitSite,
  onDeleteSubmittedSite,
}) => {
  const { lang } = useLanguage();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteType, setSiteType] = useState<SubmittedSiteType>('CASCADE_CHUTE');
  const [province, setProvince] = useState<string>('Estuaire');
  const [locationLabel, setLocationLabel] = useState('');
  const [difficulty, setDifficulty] = useState<SubmittedSiteDifficulty>('Modéré');
  const [description, setDescription] = useState('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | SubmittedSiteType>('ALL');

  useEffect(() => {
    if (openComposerSignal > 0) {
      setFormError(null);
      setIsComposerOpen(true);
    }
  }, [openComposerSignal]);

  const labels = useMemo(() => {
    if (lang === 'en') {
      return {
        sectionTitle: 'Submit a Natural Site',
        sectionSubtitle:
          'Propose a waterfall, trail, beach, ecolodge, or cultural site in Gabon and define its exact site type.',
        submitBtn: 'Submit Site',
        modalTitle: 'Submit a New Site',
        modalSubtitle: 'Propose a site with its category & province',
        authPrompt: 'Sign in with Google to submit a new site and save it to Firestore.',
        connectGoogle: 'Sign in with Google',
        siteNameLabel: 'Site Name *',
        siteNamePlaceholder: 'e.g. Poubara Falls, Ekwata Beach...',
        siteTypeLabel: 'Define Site Type *',
        provinceLabel: 'Province *',
        zoneLabel: 'Area / Landmark',
        zonePlaceholder: 'e.g. 14 km south of Franceville',
        difficultyLabel: 'Access Difficulty',
        descLabel: 'Description & Highlights *',
        descPlaceholder: 'Access trail, wildlife, viewpoints, best season...',
        photoLabel: 'Site Photo (optional)',
        cancel: 'Cancel',
        publishBtn: 'Submit Site',
        errAuth: 'Please sign in with Google before submitting a site.',
        errName: 'Please enter a site name (at least 2 characters).',
        errDesc: 'Please describe the site (at least 5 characters).',
        allTypes: 'All types',
        emptyTitle: 'No submitted sites yet',
        emptyDesc: 'Be the first explorer to propose a new Gabonese site and set its type.',
        pendingStatus: 'Community submission',
        publishedStatus: 'Published',
        byPrefix: 'Submitted by',
        deleteLabel: 'Delete',
      };
    }
    if (lang === 'ar') {
      return {
        sectionTitle: 'اقتراح موقع طبيعي',
        sectionSubtitle:
          'أضف شلالاً أو مساراً أو شاطئاً أو نزلاً بيئياً في الغابون وحدد نوع الموقع بدقة.',
        submitBtn: 'إرسال موقع',
        modalTitle: 'إرسال موقع جديد',
        modalSubtitle: 'اقترح موقعاً وحدد نوعه والمقاطعة',
        authPrompt: 'سجّل الدخول عبر Google لإرسال موقع جديد وحفظه.',
        connectGoogle: 'تسجيل الدخول عبر Google',
        siteNameLabel: 'اسم الموقع *',
        siteNamePlaceholder: 'مثال: شلالات بوبارا، شاطئ إكواتا...',
        siteTypeLabel: 'تحديد نوع الموقع *',
        provinceLabel: 'المقاطعة *',
        zoneLabel: 'المنطقة / المعلم',
        zonePlaceholder: 'مثال: 14 كم جنوب فرانسفيل',
        difficultyLabel: 'صعوبة الوصول',
        descLabel: 'الوصف وأبرز المعالم *',
        descPlaceholder: 'تفاصيل المسار، الحياة البرية، أفضل موسم...',
        photoLabel: 'صورة الموقع (اختياري)',
        cancel: 'إلغاء',
        publishBtn: 'إرسال الموقع',
        errAuth: 'يرجى تسجيل الدخول عبر Google قبل إرسال موقع.',
        errName: 'يرجى إدخال اسم الموقع (حرفين على الأقل).',
        errDesc: 'يرجى كتابة وصف للموقع (5 أحرف على الأقل).',
        allTypes: 'كل الأنواع',
        emptyTitle: 'لا توجد مواقع مرسلة بعد',
        emptyDesc: 'كن أول من يقترح موقعاً جديداً في الغابون ويحدد نوعه.',
        pendingStatus: 'مقترح مجتمعي',
        publishedStatus: 'منشور',
        byPrefix: 'أرسله',
        deleteLabel: 'حذف',
      };
    }
    return {
      sectionTitle: 'Soumettre un Site',
      sectionSubtitle:
        'Proposez un nouveau site au Gabon (cascade, plage, sentier, réserve, écolodge...) et définissez son type de site.',
      submitBtn: 'Soumettre site',
      modalTitle: 'Soumettre un nouveau site',
      modalSubtitle: 'Définissez le type de site, la province et les points forts',
      authPrompt: 'Connectez votre compte Google pour soumettre un nouveau site sur MANGOREMA.',
      connectGoogle: 'Se connecter avec Google',
      siteNameLabel: 'Nom du site *',
      siteNamePlaceholder: 'Ex : Chutes de Poubara, Plage d’Ekwata...',
      siteTypeLabel: 'Définir le type de site *',
      provinceLabel: 'Province *',
      zoneLabel: 'Zone / Repère précis',
      zonePlaceholder: 'Ex : À 14 km au sud de Franceville',
      difficultyLabel: 'Niveau d’accès',
      descLabel: 'Description & atouts *',
      descPlaceholder: 'Accès, faune visible, baignade, meilleure saison...',
      photoLabel: 'Photo du site (optionnelle)',
      cancel: 'Annuler',
      publishBtn: 'Soumettre le site',
      errAuth: 'Connectez-vous avec Google avant de soumettre un site.',
      errName: 'Veuillez saisir un nom de site (minimum 2 caractères).',
      errDesc: 'Veuillez décrire le site (minimum 5 caractères).',
      allTypes: 'Tous les types',
      emptyTitle: 'Aucun site soumis pour le moment',
      emptyDesc: 'Proposez le premier site naturel ou culturel et définissez son type.',
      pendingStatus: 'Soumis par membre',
      publishedStatus: 'Validé',
      byPrefix: 'Soumis par',
      deleteLabel: 'Supprimer',
    };
  }, [lang]);

  const filteredSites = useMemo(() => {
    if (filterType === 'ALL') return submittedSites;
    return submittedSites.filter((s) => s.siteType === filterType);
  }, [submittedSites, filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!authUser) {
      setFormError(labels.errAuth);
      return;
    }
    if (siteName.trim().length < 2) {
      setFormError(labels.errName);
      return;
    }
    if (description.trim().length < 5) {
      setFormError(labels.errDesc);
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(photoBlob ? 5 : null);
    try {
      await onSubmitSite({
        siteName: siteName.trim(),
        siteType,
        province,
        locationLabel: locationLabel.trim() || undefined,
        difficulty,
        description: description.trim(),
        photoBlob,
        onUploadProgress: (pct) => setUploadProgress(pct),
      });
      setSiteName('');
      setLocationLabel('');
      setDescription('');
      setPhotoBlob(null);
      setUploadProgress(null);
      setIsComposerOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (site: SubmittedSite) => {
    setDeletingId(site.id);
    try {
      await onDeleteSubmittedSite(site);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="glass-card rounded-3xl p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              {labels.sectionTitle} ({submittedSites.length})
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {labels.sectionSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setIsComposerOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl copper-gradient text-slate-950 font-black text-xs shadow-md active:scale-95 transition whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{labels.submitBtn}</span>
        </button>
      </div>

      {/* Type filter */}
      {submittedSites.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filterType === 'ALL'
                ? 'bg-emerald-600 text-white'
                : 'glass-surface text-slate-700 dark:text-slate-200'
            }`}
          >
            {labels.allTypes} ({submittedSites.length})
          </button>
          {(Object.keys(SITE_TYPE_META) as SubmittedSiteType[]).map((key) => {
            const count = submittedSites.filter((s) => s.siteType === key).length;
            if (count === 0) return null;
            const meta = SITE_TYPE_META[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilterType(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  filterType === key
                    ? 'bg-emerald-600 text-white'
                    : 'glass-surface text-slate-700 dark:text-slate-200'
                }`}
              >
                {meta.labels[lang]} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Submitted Sites List */}
      {filteredSites.length === 0 ? (
        <div className="glass-surface border border-dashed border-stone-300 dark:border-white/15 rounded-2xl p-6 text-center space-y-2">
          <MapPin className="w-7 h-7 text-amber-600 dark:text-amber-400 mx-auto opacity-80" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{labels.emptyTitle}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{labels.emptyDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredSites.map((site) => {
            const meta = SITE_TYPE_META[site.siteType] || SITE_TYPE_META.PARC_NATIONAL;
            const TypeIcon = meta.icon;
            const safePhoto = sanitizeImageUrl(site.photoUrl);
            const isOwn = authUser?.uid === site.userId;

            return (
              <article
                key={site.id}
                className="glass-surface border border-white/55 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                {safePhoto && (
                  <div className="h-36 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={safePhoto}
                      alt={site.siteName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                        <TypeIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{meta.labels[lang]}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        {site.status === 'PUBLISHED' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>
                          {site.status === 'PUBLISHED' ? labels.publishedStatus : labels.pendingStatus}
                        </span>
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {site.siteName}
                    </h4>

                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                      <span>{site.province}</span>
                      {site.locationLabel && <span>· {site.locationLabel}</span>}
                      <span>· {site.difficulty}</span>
                    </p>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {site.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate">
                      {labels.byPrefix} {site.authorName} · {site.createdAtLabel}
                    </span>
                    {isOwn && (
                      <button
                        type="button"
                        disabled={deletingId === site.id}
                        onClick={() => void handleDelete(site)}
                        className="text-red-600 dark:text-red-400 hover:underline font-semibold inline-flex items-center gap-1 shrink-0"
                      >
                        {deletingId === site.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        <span>{labels.deleteLabel}</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Composer Modal */}
      {isComposerOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsComposerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-modal border border-white/60 dark:border-white/15 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[92dvh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl text-start"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-900/10 dark:border-white/10 pb-3">
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {labels.modalTitle}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {userProfile.name} · {labels.modalSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                aria-label={labels.cancel}
                className="min-w-[40px] min-h-[40px] rounded-xl glass-surface text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!authUser ? (
              <div className="glass-surface rounded-2xl p-5 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {labels.authPrompt}
                </p>
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl copper-gradient text-slate-950 text-xs font-black shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{labels.connectGoogle}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    {labels.siteNameLabel}
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder={labels.siteNamePlaceholder}
                    className="w-full px-3 py-2.5 rounded-xl glass-surface border border-white/50 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                  />
                </div>

                {/* Define Site Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                    {labels.siteTypeLabel}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(SITE_TYPE_META) as SubmittedSiteType[]).map((key) => {
                      const meta = SITE_TYPE_META[key];
                      const Icon = meta.icon;
                      const selected = siteType === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSiteType(key)}
                          className={`p-2.5 rounded-2xl border text-start transition flex items-start gap-2 min-w-0 ${
                            selected
                              ? 'copper-gradient text-slate-950 border-amber-400 shadow-md'
                              : 'glass-surface border-white/50 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:border-amber-500/40'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              selected ? 'text-slate-950' : 'text-amber-600 dark:text-amber-400'
                            }`}
                          />
                          <div className="min-w-0">
                            <span className="block text-[11px] font-bold leading-tight truncate">
                              {meta.labels[lang]}
                            </span>
                            <span
                              className={`block text-[10px] leading-tight truncate mt-0.5 ${
                                selected ? 'text-slate-900/80' : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {meta.hints[lang]}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      {labels.provinceLabel}
                    </label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl glass-surface border border-white/50 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                    >
                      {GABON_PROVINCES.map((prov) => (
                        <option key={prov} value={prov} className="bg-white dark:bg-slate-900">
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      {labels.difficultyLabel}
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as SubmittedSiteDifficulty)}
                      className="w-full px-3 py-2.5 rounded-xl glass-surface border border-white/50 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                    >
                      <option value="Facile" className="bg-white dark:bg-slate-900">
                        Facile
                      </option>
                      <option value="Modéré" className="bg-white dark:bg-slate-900">
                        Modéré
                      </option>
                      <option value="Difficile" className="bg-white dark:bg-slate-900">
                        Difficile
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    {labels.zoneLabel}
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={locationLabel}
                    onChange={(e) => setLocationLabel(e.target.value)}
                    placeholder={labels.zonePlaceholder}
                    className="w-full px-3 py-2.5 rounded-xl glass-surface border border-white/50 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    {labels.descLabel}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={800}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={labels.descPlaceholder}
                    className="w-full px-3 py-2.5 rounded-xl glass-surface border border-white/50 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60 resize-none"
                  />
                </div>

                <MediaCaptureBox
                  label={labels.photoLabel}
                  selectedBlob={photoBlob}
                  onBlobChange={setPhotoBlob}
                  uploadProgress={uploadProgress}
                  disabled={isSubmitting}
                />

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
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
                    {labels.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl copper-gradient text-slate-950 text-xs sm:text-sm font-black shadow-lg flex items-center gap-2 whitespace-nowrap"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{labels.publishBtn}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
