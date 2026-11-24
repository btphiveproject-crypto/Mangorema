import React, { useMemo, useState } from 'react';
import { ExpeditionEvent, EcoChallengeCompletion, ActivityDiscipline, TabType } from '../../types';
import {
  Calendar,
  Users,
  ArrowUpRight,
  Leaf,
  CheckCircle2,
  MessageCircle,
  Search,
  Heart,
  Star,
  ShoppingBag,
  Eye,
  Bus,
  Compass,
  MapPin,
  Locate,
  Navigation,
} from 'lucide-react';
import { CategoryIcon } from '../CategoryIcon';
import { getEcoChallengeByEventId } from '../../data/ecoChallenges';
import { ACTIVITY_COLLECTIONS, enrichEvent } from '../../data/marketplaceData';
import { useLanguage } from '../../contexts/LanguageContext';
import { SponsoredAdCard } from '../SponsoredAdCard';
import { sanitizeImageUrl } from '../../utils/urlSecurity';
import {
  calculateDistanceKm,
  formatCoordsPair,
  formatDistanceKm,
} from '../../utils/activityLocation';

interface SortiesViewProps {
  events: ExpeditionEvent[];
  ecoChallenges?: EcoChallengeCompletion[];
  favoriteEventIds?: string[];
  liveStockMap?: Record<string, number>;
  showActivityLocations?: boolean;
  onToggleActivityLocations?: () => void;
  userGpsCoords?: [number, number] | null;
  isLocatingUser?: boolean;
  onActivateUserLocation?: () => void;
  onLocateOnMap?: (event: ExpeditionEvent) => void;
  onToggleFavorite?: (eventId: string) => void;
  onOpenDetail?: (event: ExpeditionEvent) => void;
  onSelectEvent: (event: ExpeditionEvent) => void;
  onQuickAddToCart?: (event: ExpeditionEvent) => void;
  onOpenEcoChallenge?: (event: ExpeditionEvent) => void;
  onOpenCommunity?: (tab: 'activities' | 'chat') => void;
  onNavigateShuttles?: () => void;
  isFreeTier?: boolean;
  dismissedAdIds?: string[];
  onDismissAd?: (adId: string) => void;
  onUpgradeAdFree?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

const DISCIPLINES: Array<{ id: 'ALL' | ActivityDiscipline; label: string }> = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'RANDONNEE', label: 'Randonnée' },
  { id: 'CAMPING', label: 'Camping' },
  { id: 'PLAGES', label: 'Plages' },
  { id: 'ECOTOURISME', label: 'Écotourisme' },
  { id: 'AVENTURE', label: 'Aventure' },
];

const BUDGET_OPTIONS = [
  { id: 'ALL', label: 'Tout budget', max: Infinity },
  { id: '15K', label: '≤ 15 000 F', max: 15000 },
  { id: '25K', label: '≤ 25 000 F', max: 25000 },
  { id: '40K', label: '≤ 40 000 F', max: 40000 },
];

export const SortiesView: React.FC<SortiesViewProps> = ({
  events,
  ecoChallenges = [],
  favoriteEventIds = [],
  liveStockMap,
  showActivityLocations = true,
  onToggleActivityLocations,
  userGpsCoords = null,
  isLocatingUser = false,
  onActivateUserLocation,
  onLocateOnMap,
  onToggleFavorite,
  onOpenDetail,
  onSelectEvent,
  onQuickAddToCart,
  onOpenEcoChallenge,
  onOpenCommunity,
  onNavigateShuttles,
  isFreeTier = false,
  dismissedAdIds = [],
  onDismissAd,
  onUpgradeAdFree,
  onNavigateTab,
}) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDiscipline, setSelectedDiscipline] = useState<'ALL' | ActivityDiscipline>('ALL');
  const [selectedCollection, setSelectedCollection] = useState<string>('ALL');
  const [maxBudgetId, setMaxBudgetId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortByProximity, setSortByProximity] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const enrichedEvents = useMemo(() => events.map(enrichEvent), [events]);

  const localizedCount = useMemo(
    () => enrichedEvents.filter((e) => e.locationEnabled !== false).length,
    [enrichedEvents]
  );

  const categories = [
    { id: 'ALL', label: t.sorties.catAll },
    { id: 'PUBLIC', label: t.sorties.catPublic },
    { id: 'PRIVATE', label: t.sorties.catPrivate },
    { id: 'INSTITUTIONAL', label: t.sorties.catInstitutional },
  ];

  const maxBudget = BUDGET_OPTIONS.find((b) => b.id === maxBudgetId)?.max ?? Infinity;

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = enrichedEvents.filter((e) => {
      if (selectedCategory !== 'ALL' && e.category !== selectedCategory) return false;
      if (selectedDiscipline !== 'ALL' && e.discipline !== selectedDiscipline) return false;
      if (selectedCollection !== 'ALL' && e.featuredCollection !== selectedCollection) return false;
      if (e.basePrice > maxBudget) return false;
      if (favoritesOnly && !favoriteEventIds.includes(e.id)) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.parkName.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.organizer.toLowerCase().includes(q)
      );
    });

    if (sortByProximity && userGpsCoords && showActivityLocations) {
      return [...list].sort((a, b) => {
        const aEnabled = a.locationEnabled !== false;
        const bEnabled = b.locationEnabled !== false;
        if (aEnabled !== bEnabled) return aEnabled ? -1 : 1;
        return calculateDistanceKm(userGpsCoords, a.coords) - calculateDistanceKm(userGpsCoords, b.coords);
      });
    }
    return list;
  }, [
    enrichedEvents,
    selectedCategory,
    selectedDiscipline,
    selectedCollection,
    maxBudget,
    favoritesOnly,
    favoriteEventIds,
    searchQuery,
    sortByProximity,
    userGpsCoords,
    showActivityLocations,
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CategoryIcon category="expeditions" size="md" />
          <div className="min-w-0">
            <h2 className="font-serif-display text-xl sm:text-2xl text-slate-900 dark:text-white font-bold">
              {t.sorties.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">{t.sorties.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onNavigateShuttles && (
            <button
              type="button"
              onClick={onNavigateShuttles}
              title="Navettes mutualisées"
              className="min-h-[44px] px-3 py-2 rounded-xl glass-card border border-white/60 dark:border-white/12 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition whitespace-nowrap"
            >
              <Bus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t.home.poleShuttles}</span>
            </button>
          )}
          {onOpenCommunity && (
            <button
              type="button"
              onClick={() => onOpenCommunity('activities')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{t.sorties.communityBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Favorites Row */}
      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Parc, randonnée, bivouac, guide..."
            className="w-full min-h-[44px] glass-card border border-white/60 dark:border-white/12 rounded-2xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 shrink-0 transition whitespace-nowrap ${
              favoritesOnly
                ? 'bg-red-600 text-white border-red-600'
                : 'glass-card border-white/60 dark:border-white/12 text-slate-800 dark:text-slate-200'
            }`}
          >
            <Heart className={`w-4 h-4 ${favoritesOnly ? 'fill-current' : ''}`} />
            <span className="font-mono tabular-nums">{favoriteEventIds.length}</span>
          </button>
        )}
      </div>

      {/* Activity GPS Localization Control Bar */}
      {(onToggleActivityLocations || onActivateUserLocation) && (
        <div
          className={`rounded-2xl p-3.5 border transition flex flex-wrap items-center justify-between gap-2.5 glass-card ${
            showActivityLocations
              ? 'border-emerald-500/45'
              : 'border-white/60 dark:border-white/12'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                showActivityLocations
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 dark:bg-slate-900 text-slate-500'
              }`}
            >
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <strong className="text-xs text-slate-900 dark:text-white block truncate">
                {showActivityLocations
                  ? `Localisations des activités activées (${localizedCount})`
                  : 'Localisations des activités désactivées'}
              </strong>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 block truncate">
                {userGpsCoords
                  ? `GPS actif · ${formatCoordsPair(userGpsCoords)}`
                  : 'Activez le GPS pour calculer les distances et trier autour de vous.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onToggleActivityLocations && (
              <button
                type="button"
                role="switch"
                aria-checked={showActivityLocations}
                onClick={onToggleActivityLocations}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition active:scale-95 ${
                  showActivityLocations
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'glass-surface text-slate-800 dark:text-slate-100 border-white/60 dark:border-white/12'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{showActivityLocations ? 'Localisations ON' : 'Activer localisations'}</span>
              </button>
            )}

            {onActivateUserLocation && (
              <button
                type="button"
                disabled={isLocatingUser}
                onClick={() => {
                  if (!userGpsCoords) {
                    onActivateUserLocation();
                    setSortByProximity(true);
                  } else {
                    setSortByProximity((v) => !v);
                  }
                }}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 ${
                  sortByProximity && userGpsCoords
                    ? 'copper-gradient text-slate-950 border-amber-500 font-black shadow-sm'
                    : 'glass-surface text-amber-800 dark:text-amber-300 border-amber-500/40 hover:border-amber-500'
                }`}
              >
                <Locate className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
                <span>
                  {isLocatingUser
                    ? 'Localisation...'
                    : userGpsCoords
                    ? sortByProximity
                      ? 'Tri : Autour de moi'
                      : 'Trier autour de moi'
                    : 'Activer mon GPS'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Thematic Collections */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {ACTIVITY_COLLECTIONS.map((col) => {
          const active = selectedCollection === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setSelectedCollection(active ? 'ALL' : col.id)}
              className={`min-h-[44px] text-left p-3.5 rounded-2xl border transition ${
                active
                  ? 'glass-card border-amber-500/75 ring-1 ring-amber-500/35'
                  : 'glass-card border-white/60 dark:border-white/12 hover:border-amber-500/45'
              }`}
            >
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">
                {col.badge}
              </span>
              <strong className="text-xs sm:text-sm text-slate-900 dark:text-white block truncate mt-0.5">
                {col.title}
              </strong>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 block truncate mt-0.5">
                {col.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Filter Controls */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                selectedCategory === c.id
                  ? 'copper-gradient text-slate-950 font-bold shadow-sm'
                  : 'glass-card border border-white/60 dark:border-white/12 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {DISCIPLINES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDiscipline(d.id)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                selectedDiscipline === d.id
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'glass-card border border-white/55 dark:border-white/10 text-slate-800 dark:text-slate-200'
              }`}
            >
              {d.label}
            </button>
          ))}
          {BUDGET_OPTIONS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setMaxBudgetId(b.id)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-mono font-semibold whitespace-nowrap shrink-0 transition tabular-nums ${
                maxBudgetId === b.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold'
                  : 'glass-card border border-white/55 dark:border-white/10 text-slate-800 dark:text-slate-200'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Catalog Grid */}
      {filteredEvents.length === 0 ? (
        <div className="glass-card border border-white/60 dark:border-white/12 rounded-3xl p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Aucune activité ne correspond à ces critères.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedDiscipline('ALL');
              setSelectedCollection('ALL');
              setMaxBudgetId('ALL');
              setFavoritesOnly(false);
              setSearchQuery('');
            }}
            className="min-h-[44px] px-4 py-2 copper-gradient text-slate-950 font-bold text-xs rounded-xl whitespace-nowrap"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((evt) => {
            const isFav = favoriteEventIds.includes(evt.id);
            const safeImg = sanitizeImageUrl(evt.image, { allowDataImage: true });
            const isBroken = brokenImages[evt.id];
            const spotsRemaining =
              typeof liveStockMap?.[evt.id] === 'number' ? liveStockMap[evt.id] : evt.spotsLeft;

            return (
              <article
                key={evt.id}
                className="glass-card border border-white/60 dark:border-white/12 rounded-2xl overflow-hidden hover:border-amber-500/50 transition flex flex-col"
              >
                {/* Header Photography */}
                <div
                  className="relative aspect-[16/10] cursor-pointer bg-slate-900 overflow-hidden"
                  onClick={() => (onOpenDetail ? onOpenDetail(evt) : onSelectEvent(evt))}
                >
                  {safeImg && !isBroken ? (
                    <img
                      src={safeImg}
                      alt={evt.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [evt.id]: true }))
                      }
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-slate-900 to-amber-950 flex flex-col items-center justify-center p-4 text-center">
                      <Compass className="w-7 h-7 text-amber-400 mb-1" />
                      <span className="text-xs text-stone-200 font-semibold">{evt.parkName}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(evt.id);
                      }}
                      aria-label="Ajouter aux favoris"
                      className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                        isFav
                          ? 'bg-red-600 text-white border-red-400'
                          : 'bg-black/45 text-white border-white/25 hover:bg-black/65'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  )}

                  <div className="absolute bottom-3 left-3.5 right-3.5 flex justify-between items-end gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-amber-300 truncate">
                        {evt.parkName} <span aria-hidden="true">·</span> {evt.difficulty}
                      </p>
                      <h3 className="font-bold text-base text-white leading-snug line-clamp-1 mt-0.5">
                        {evt.title}
                      </h3>
                    </div>
                    <span className="font-mono font-extrabold text-sm text-amber-300 shrink-0 tabular-nums">
                      {evt.basePrice === 0
                        ? 'Gratuit'
                        : `${evt.basePrice.toLocaleString('fr-FR')} F`}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {evt.description}
                    </p>

                    {/* Specs Hairline Strip */}
                    <div className="grid grid-cols-3 divide-x divide-stone-200 dark:divide-white/10 py-2 border-y border-stone-200/80 dark:border-white/10 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {t.sorties.distance}
                        </span>
                        <strong className="text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {evt.distance}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {t.sorties.elevation}
                        </span>
                        <strong className="text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                          {evt.elevation}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {t.sorties.duration}
                        </span>
                        <strong className="text-xs font-mono tabular-nums text-amber-700 dark:text-amber-400">
                          {evt.duration}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="truncate">{evt.organizer}</span>
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {evt.rating && (
                          <span className="flex items-center gap-0.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                            {evt.rating.toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          {evt.date}
                        </span>
                      </div>
                    </div>

                    {/* GPS Coordinates & Distance Row */}
                    {showActivityLocations && (
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-stone-200/70 dark:border-white/5 text-[11px]">
                        {evt.locationEnabled !== false ? (
                          <>
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium truncate">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{evt.location}</span>
                              {userGpsCoords && (
                                <strong className="font-mono tabular-nums text-slate-900 dark:text-white shrink-0">
                                  · À {formatDistanceKm(calculateDistanceKm(userGpsCoords, evt.coords))}
                                </strong>
                              )}
                            </span>
                            {onLocateOnMap && (
                              <button
                                type="button"
                                onClick={() => onLocateOnMap(evt)}
                                className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 shrink-0 transition"
                              >
                                <Navigation className="w-3 h-3" />
                                <span>Carte</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 italic">
                            Localisation GPS communiquée après réservation
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-5 gap-2">
                      <button
                        type="button"
                        onClick={() => (onOpenDetail ? onOpenDetail(evt) : onSelectEvent(evt))}
                        className="col-span-2 min-h-[44px] py-2 px-2 bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Détails</span>
                      </button>

                      <button
                        type="button"
                        disabled={typeof spotsRemaining === 'number' && spotsRemaining <= 0}
                        onClick={() =>
                          onQuickAddToCart ? onQuickAddToCart(evt) : onSelectEvent(evt)
                        }
                        className="col-span-3 min-h-[44px] py-2 px-3 copper-gradient hover:brightness-105 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition whitespace-nowrap disabled:opacity-40"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {typeof spotsRemaining === 'number' && spotsRemaining <= 0
                            ? 'Complet'
                            : typeof spotsRemaining === 'number' && spotsRemaining <= 5
                            ? `Panier (${spotsRemaining} pl.)`
                            : 'Ajouter Panier'}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>

                    {(() => {
                      const ecoChallenge = getEcoChallengeByEventId(evt.id);
                      if (!ecoChallenge || !onOpenEcoChallenge) return null;
                      const isDone = ecoChallenges.some((c) => c.eventId === evt.id);

                      return (
                        <button
                          type="button"
                          onClick={() => onOpenEcoChallenge(evt)}
                          className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition active:scale-95 ${
                            isDone
                              ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                              : 'bg-stone-50 dark:bg-slate-950/70 border-stone-200 dark:border-white/10 hover:border-emerald-500/50 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="text-sm shrink-0">{ecoChallenge.badge.icon}</span>
                            <span className="truncate">
                              {isDone
                                ? `Badge : ${ecoChallenge.badge.name}`
                                : `Défi Zéro Déchet · ${ecoChallenge.badge.name}`}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-mono shrink-0 tabular-nums font-bold">
                            {isDone ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Validé</span>
                              </>
                            ) : (
                              <>
                                <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>+{ecoChallenge.ecoPoints} pts</span>
                              </>
                            )}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <SponsoredAdCard
        placement="sorties"
        isFreeTier={isFreeTier}
        isDismissed={dismissedAdIds.includes('ad-sorties-komo')}
        onDismiss={onDismissAd}
        onNavigateTab={onNavigateTab}
        onUpgradeAdFree={onUpgradeAdFree}
      />
    </div>
  );
};
