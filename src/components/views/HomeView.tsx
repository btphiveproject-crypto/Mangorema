import React, { useState } from 'react';
import {
  ExpeditionEvent,
  ExpeditionPhoto,
  ShuttleService,
  EcoChallengeCompletion,
  EcoChallengeDefinition,
  TabType,
} from '../../types';
import {
  Bus,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  MapPin,
  Calendar,
  Navigation,
  Leaf,
  Recycle,
  MessageCircle,
  Users,
  Compass,
  Camera,
} from 'lucide-react';
import { WeatherWidget } from '../WeatherWidget';
import { CategoryIcon } from '../CategoryIcon';
import { ECO_CHALLENGES_CATALOG } from '../../data/ecoChallenges';
import { GABON_LANDSCAPES } from '../../data/gabonLandscapes';
import { WeeklyEcoChallengesSection } from '../WeeklyEcoChallengesSection';
import { WildlifeAlertsPanel } from '../WildlifeAlertsPanel';
import { useLanguage } from '../../contexts/LanguageContext';
import { SponsoredAdCard } from '../SponsoredAdCard';
import { sanitizeImageUrl } from '../../utils/urlSecurity';
import imgHeroMondah from '../../assets/images/hero_mondah_canopy_1795342713775.jpg';

interface HomeViewProps {
  events: ExpeditionEvent[];
  shuttles: ShuttleService[];
  photos?: ExpeditionPhoto[];
  ecoChallenges?: EcoChallengeCompletion[];
  ecoPoints?: number;
  communityActivitiesCount?: number;
  onSelectEvent: (event: ExpeditionEvent) => void;
  onOpenShuttles: () => void;
  onOpenGPSTracker: () => void;
  onOpenChecklist: () => void;
  onOpenSOS: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenRental?: () => void;
  onOpenNextEcoChallenge?: () => void;
  onOpenChallengeModal?: (challenge: EcoChallengeDefinition) => void;
  onOpenCommunity?: (tab: 'activities' | 'chat') => void;
  onNotifyBanner?: (title: string, body: string) => void;
  onSyncNotificationsCount?: () => void;
  isFreeTier?: boolean;
  dismissedAdIds?: string[];
  onDismissAd?: (adId: string) => void;
  onUpgradeAdFree?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  events,
  shuttles,
  photos = [],
  ecoChallenges = [],
  ecoPoints = 0,
  communityActivitiesCount = 0,
  onSelectEvent,
  onOpenShuttles,
  onOpenGPSTracker,
  onOpenChecklist,
  onOpenSOS,
  onNavigateTab,
  onOpenRental,
  onOpenNextEcoChallenge,
  onOpenChallengeModal,
  onOpenCommunity,
  onNotifyBanner,
  onSyncNotificationsCount,
  isFreeTier = false,
  dismissedAdIds = [],
  onDismissAd,
  onUpgradeAdFree,
}) => {
  const { lang, t } = useLanguage();
  const numberLocale = lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar-EG' : 'fr-FR';
  const [brokenEventImages, setBrokenEventImages] = useState<Record<string, boolean>>({});
  const completedCount = new Set(ecoChallenges.map((c) => c.eventId)).size;
  const totalChallenges = ECO_CHALLENGES_CATALOG.length;

  return (
    <div className="space-y-8 p-4 sm:p-6 pb-24 lg:pb-12">
      {/* Top Architectural Row: Photographic Hero + Live Park Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Cinematic Photographic Hero (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          <div className="relative rounded-3xl overflow-hidden border border-stone-200 dark:border-white/10 shadow-sm min-h-[280px] sm:min-h-[320px] flex flex-col justify-end flex-1 bg-[#080B09]">
            <img
              src={imgHeroMondah}
              alt="Canopée du Parc National de la Mondah, Gabon"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080B09] via-[#080B09]/65 to-[#080B09]/25" />

            <div className="relative z-10 p-5 sm:p-7 space-y-4">
              {/* Quiet unboxed kicker + Brand emblem */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-amber-300 tracking-wide">
                  {t.home.heroBadge} <span aria-hidden="true">·</span> {t.header.tagline}
                </p>
                <div className="w-11 h-11 rounded-2xl overflow-hidden border border-amber-400/50 bg-[#080B09] shrink-0 hidden sm:flex items-center justify-center">
                  <img
                    src="/assets/aistudio/Gemini_Generated_Image_vn51dfvn51dfvn51__1__8a19ee16.jpeg"
                    alt="Emblème MANGOREMA"
                    className="w-full h-full object-cover scale-110"
                  />
                </div>
              </div>

              <div className="space-y-2 max-w-xl">
                <h1 className="font-serif-display text-3xl sm:text-4xl font-normal leading-[1.1] text-white text-balance">
                  {t.home.heroTitle}
                </h1>
                <p className="text-sm text-stone-200 leading-relaxed max-w-lg">
                  {t.home.heroSubtitle}
                </p>
              </div>

              {/* Primary Hero Actions */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateTab('sorties')}
                  className="min-h-[44px] px-5 py-2.5 copper-gradient text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-sm hover:brightness-105 active:scale-95 transition whitespace-nowrap"
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>{t.home.poleExpeditions}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('explorer')}
                  className="min-h-[44px] px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white font-bold text-xs rounded-xl flex items-center gap-2 active:scale-95 transition whitespace-nowrap"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{t.nav.explorer}</span>
                </button>
              </div>

              {/* Tabular Telemetry Strip */}
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/15 text-white">
                <div>
                  <span className="font-mono font-bold text-base sm:text-lg text-amber-300 block tabular-nums">
                    1 420+
                  </span>
                  <span className="text-[11px] text-stone-300">{t.home.statHikers}</span>
                </div>
                <div>
                  <span className="font-mono font-bold text-base sm:text-lg text-white block tabular-nums">
                    {t.home.statParksCount}
                  </span>
                  <span className="text-[11px] text-stone-300">{t.home.statParks}</span>
                </div>
                <div>
                  <span className="font-mono font-bold text-base sm:text-lg text-emerald-300 block tabular-nums">
                    100%
                  </span>
                  <span className="text-[11px] text-stone-300">{t.home.statMobileMoney}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Action Quick Strip */}
          <div className="grid grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={onOpenGPSTracker}
              className="min-h-[56px] glass-card border border-white/60 dark:border-white/12 hover:border-amber-500/55 rounded-2xl p-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 text-center transition active:scale-95"
            >
              <Navigation className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {t.home.quickGps}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenShuttles}
              className="min-h-[56px] glass-card border border-white/60 dark:border-white/12 hover:border-emerald-500/55 rounded-2xl p-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 text-center transition active:scale-95"
            >
              <Bus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {t.home.quickShuttles}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenChecklist}
              className="min-h-[56px] glass-card border border-white/60 dark:border-white/12 hover:border-amber-500/55 rounded-2xl p-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 text-center transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {t.home.quickChecklist}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenSOS}
              className="min-h-[56px] bg-red-50 dark:bg-red-950/35 border border-red-200 dark:border-red-500/40 hover:border-red-500 rounded-2xl p-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 text-center transition active:scale-95"
            >
              <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold text-red-700 dark:text-red-300 truncate">
                {t.home.quickSos}
              </span>
            </button>
          </div>
        </div>

        {/* Live Park Weather (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col">
          <WeatherWidget />
        </div>
      </div>

      {/* Pôles d'Activités Section (clean un-nested architectural cards) */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-serif-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {t.home.universeTitle}
          </h2>
          <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
            {t.home.universeSubtitle}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('sorties')}
            className="group glass-card border border-white/60 dark:border-white/12 hover:border-amber-500/55 rounded-2xl p-3.5 flex items-center gap-3 text-start transition active:scale-[0.98]"
          >
            <CategoryIcon
              category="expeditions"
              size="md"
              className="group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                {t.home.poleExpeditions}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 block truncate">
                {t.home.hubSubExpeditions}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenShuttles}
            className="group glass-card border border-white/60 dark:border-white/12 hover:border-amber-500/55 rounded-2xl p-3.5 flex items-center gap-3 text-start transition active:scale-[0.98]"
          >
            <CategoryIcon
              category="navettes"
              size="md"
              className="group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                {t.home.poleShuttles}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 block truncate">
                {t.home.hubSubShuttles}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('equipement')}
            className="group glass-card border border-white/60 dark:border-white/12 hover:border-amber-500/55 rounded-2xl p-3.5 flex items-center gap-3 text-start transition active:scale-[0.98]"
          >
            <CategoryIcon
              category="location"
              size="md"
              className="group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                {t.nav.equipement}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 block truncate">
                {t.home.hubSubGear}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('explorer')}
            className="group glass-card border border-white/60 dark:border-white/12 hover:border-amber-500/55 rounded-2xl p-3.5 flex items-center gap-3 text-start transition active:scale-[0.98]"
          >
            <CategoryIcon
              category="guides"
              size="md"
              className="group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                {t.home.poleGuides}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 block truncate">
                {t.home.hubSubGuides}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* Native Free-Tier Partner Ad */}
      <SponsoredAdCard
        placement="home"
        isFreeTier={isFreeTier}
        isDismissed={dismissedAdIds.includes('ad-home-airtel-pongara')}
        onDismiss={onDismissAd}
        onNavigateTab={(tab: TabType) => onNavigateTab(tab)}
        onUpgradeAdFree={onUpgradeAdFree}
      />

      {/* Featured Expeditions Grid (3 columns on desktop) */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {t.home.featuredTitle}
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('sorties')}
            className="min-h-[40px] px-2.5 text-xs text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-bold flex items-center gap-1 whitespace-nowrap"
          >
            <span>{t.common.seeAll}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {events.slice(0, 3).map((evt) => {
            const safeImg = sanitizeImageUrl(evt.image, { allowDataImage: true });
            const isBroken = brokenEventImages[evt.id];

            return (
              <article
                key={evt.id}
                className="glass-card border border-white/60 dark:border-white/12 rounded-2xl overflow-hidden hover:border-amber-500/50 transition flex flex-col"
              >
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                  {safeImg && !isBroken ? (
                    <img
                      src={safeImg}
                      alt={evt.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenEventImages((prev) => ({ ...prev, [evt.id]: true }))
                      }
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-slate-900 to-amber-950 flex flex-col items-center justify-center p-4 text-center">
                      <Compass className="w-7 h-7 text-amber-400 mb-1.5" />
                      <span className="text-xs text-stone-200 font-semibold">{evt.parkName}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  <div className="absolute bottom-3 left-3.5 right-3.5 flex justify-between items-end gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-amber-300 truncate">
                        {evt.parkName} <span aria-hidden="true">·</span> {evt.difficulty}
                      </p>
                      <h3 className="font-bold text-sm text-white leading-snug line-clamp-1 mt-0.5">
                        {evt.title}
                      </h3>
                    </div>
                    <span className="font-mono font-extrabold text-sm text-amber-300 shrink-0 tabular-nums">
                      {evt.basePrice === 0
                        ? t.common.free
                        : `${evt.basePrice.toLocaleString(numberLocale)} F`}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      {evt.date}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      {evt.location}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                      {t.home.organizerPrefix}{' '}
                      <strong className="text-slate-900 dark:text-slate-200">{evt.organizer}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectEvent(evt)}
                      className="min-h-[40px] px-3.5 py-2 copper-gradient text-slate-950 font-extrabold text-xs rounded-xl active:scale-95 transition whitespace-nowrap shrink-0"
                    >
                      {t.home.bookCartBtn}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Dual Band: Marketplace Équipement + Navettes Libreville */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Equipment & Rental Marketplace Banner */}
        <section className="glass-card border border-white/60 dark:border-white/12 rounded-3xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                {t.home.rentalBadge} <span aria-hidden="true">·</span>{' '}
                <span className="text-emerald-700 dark:text-emerald-400">{t.home.rentalVerified}</span>
              </p>
              <h3 className="font-serif-display font-bold text-lg text-slate-900 dark:text-white">
                {t.home.rentalTitle}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-md">
                {t.home.rentalDesc}
              </p>
            </div>
            <CategoryIcon category="location" size="md" />
          </div>

          <div className="pt-3 border-t border-slate-900/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-slate-600 dark:text-slate-400">
              {t.home.rentalPickup}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {onOpenRental && (
                <button
                  type="button"
                  onClick={onOpenRental}
                  className="min-h-[40px] px-3 py-1.5 glass-surface border border-white/60 dark:border-white/12 text-slate-800 dark:text-slate-100 font-bold rounded-xl text-xs whitespace-nowrap"
                >
                  {t.home.rentalChecklistBtn}
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigateTab('equipement')}
                className="min-h-[40px] px-3.5 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition whitespace-nowrap"
              >
                <span>{t.home.rentalStoreCta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Shuttle Highlights Card (clean hairline rows, zero nested cards) */}
        <section className="glass-card border border-white/60 dark:border-white/12 rounded-3xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <CategoryIcon category="navettes" size="sm" />
              <div className="min-w-0">
                <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white truncate">
                  {t.home.shuttlesBannerTitle}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {t.home.shuttlesBannerDesc}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenShuttles}
              className="min-h-[40px] px-2.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
            >
              {t.home.allRoutesBtn}
            </button>
          </div>

          <div className="divide-y divide-slate-900/10 dark:divide-white/10">
            {shuttles.slice(0, 2).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={onOpenShuttles}
                className="w-full py-2.5 flex items-center justify-between gap-3 text-start hover:opacity-85 transition"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 block truncate">
                    {s.departurePoint} → {s.destination}
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                    {s.departureTime} · {s.model} · {s.bookedSeats}/{s.totalSeats} {t.home.seatsUnit}
                  </span>
                </div>
                <strong className="font-mono font-bold text-amber-700 dark:text-amber-400 text-xs shrink-0 tabular-nums">
                  {s.price.toLocaleString(numberLocale)} F
                </strong>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Dual Band: Eco Zero-Waste Action + Community Explorers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="glass-card border border-white/60 dark:border-white/12 rounded-3xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white">
                  {t.home.ecoTitle}
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-0.5">
                  {t.home.ecoDesc}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
              {completedCount}/{totalChallenges}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-900/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
              <strong className="text-emerald-700 dark:text-emerald-400 font-mono">
                {ecoPoints} {t.home.ecoPointsUnit}
              </strong>{' '}
              · {completedCount}/{totalChallenges} {t.home.ecoCleanParks}
            </span>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateTab('profil')}
                className="min-h-[44px] px-3 py-2 rounded-xl glass-surface hover:bg-white/75 dark:hover:bg-white/12 border border-white/60 dark:border-white/10 text-slate-800 dark:text-slate-100 font-bold text-xs transition whitespace-nowrap"
              >
                {t.home.ecoBadgesBtn}
              </button>
              {onOpenNextEcoChallenge && (
                <button
                  type="button"
                  onClick={onOpenNextEcoChallenge}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition whitespace-nowrap"
                >
                  <Recycle className="w-3.5 h-3.5" />
                  <span>{t.home.ecoJoinBtn}</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {onOpenCommunity && (
          <section className="glass-card border border-white/60 dark:border-white/12 rounded-3xl p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white">
                    {t.home.communityTitle}
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-0.5">
                    {t.home.communityDesc}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums shrink-0">
                {communityActivitiesCount} {t.home.communityPostsUnit}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-900/10 dark:border-white/10 grid grid-cols-2 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => onOpenCommunity('activities')}
                className="min-h-[44px] px-3 py-2 rounded-xl glass-surface hover:bg-white/75 dark:hover:bg-white/12 border border-white/60 dark:border-white/10 text-slate-800 dark:text-slate-100 font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap"
              >
                <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">{t.home.communityPublishCommentBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenCommunity('chat')}
                className="min-h-[44px] px-3 py-2 rounded-xl copper-gradient text-slate-950 font-black flex items-center justify-center gap-1.5 active:scale-95 transition whitespace-nowrap"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.home.communityChatBtn}</span>
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Gabon Photo Gallery Showcase Strip */}
      <section className="glass-card border border-white/60 dark:border-white/12 rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif-display text-lg font-bold text-slate-900 dark:text-white truncate">
                {t.home.galleryTitle}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                {t.home.gallerySubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('galerie')}
            className="min-h-[40px] px-4 py-2 copper-gradient text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition whitespace-nowrap shrink-0"
          >
            <span>{t.home.galleryCta}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(photos.length > 0
            ? photos.slice(0, 4).map((p) => ({
                id: p.id,
                url: sanitizeImageUrl(p.url, { allowDataImage: true }),
                title: p.title,
                park: p.parkName,
              }))
            : GABON_LANDSCAPES.slice(0, 4).map((l) => ({
                id: l.id,
                url: sanitizeImageUrl(l.image),
                title: l.name,
                park: l.province,
              }))
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigateTab('galerie')}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/50 dark:border-white/12 bg-slate-900 text-start"
            >
              {item.url && (
                <img
                  src={item.url}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-2.5 inset-x-2.5">
                <p className="text-[10px] font-semibold text-amber-300 truncate">{item.park}</p>
                <p className="text-xs font-bold text-white truncate">{item.title}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Dual Band: Weekly Eco Challenges & Wildlife Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {onOpenChallengeModal && (
          <WeeklyEcoChallengesSection
            completions={ecoChallenges}
            onOpenChallengeModal={onOpenChallengeModal}
            onNotifyBanner={onNotifyBanner}
            onSyncNotificationsCount={onSyncNotificationsCount}
            compact
            onOpenProfile={() => onNavigateTab('profil')}
          />
        )}

        <WildlifeAlertsPanel
          compact
          onNavigateToSafety={() => onNavigateTab('safety')}
          onNotifyBanner={onNotifyBanner}
          onSyncNotificationsCount={onSyncNotificationsCount}
        />
      </div>
    </div>
  );
};
