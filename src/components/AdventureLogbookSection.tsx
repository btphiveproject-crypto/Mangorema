import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Camera,
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  MapPin,
  Mountain,
  Route,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import {
  Booking,
  EcoChallengeCompletion,
  ExpeditionEvent,
  ExpeditionPhoto,
  MarketplaceOrder,
  UserProfile,
} from '../types';
import { ALL_VIRTUAL_ECO_BADGES } from '../data/ecoChallenges';
import { sanitizeImageUrl } from '../utils/urlSecurity';

export interface LogbookBadgeItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  source: 'profile' | 'eco';
}

export interface LogbookEntry {
  id: string;
  title: string;
  parkName: string;
  dateLabel: string;
  timestampMs: number;
  distance?: string;
  elevation?: string;
  duration?: string;
  summary: string;
  statusLabel: string;
  badges: LogbookBadgeItem[];
  photos: ExpeditionPhoto[];
}

interface AdventureLogbookSectionProps {
  user: UserProfile;
  bookings: Booking[];
  events: ExpeditionEvent[];
  photos: ExpeditionPhoto[];
  ecoChallenges: EcoChallengeCompletion[];
  marketplaceOrders?: MarketplaceOrder[];
  onSelectPhoto: (photo: ExpeditionPhoto) => void;
  onSelectBadge: (badgeId: string) => void;
}

const FRENCH_MONTHS: Record<string, number> = {
  janv: 0,
  janvier: 0,
  jan: 0,
  fev: 1,
  fevr: 1,
  fevrier: 1,
  feb: 1,
  mars: 2,
  mar: 2,
  avr: 3,
  avril: 3,
  apr: 3,
  mai: 4,
  may: 4,
  juin: 5,
  jun: 5,
  juil: 6,
  juillet: 6,
  jul: 6,
  aout: 7,
  aug: 7,
  sept: 8,
  septembre: 8,
  sep: 8,
  oct: 9,
  octobre: 9,
  nov: 10,
  novembre: 10,
  dec: 11,
  decembre: 11,
};

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function parseFrenchDateMs(dateStr: string): number {
  if (!dateStr) return 0;
  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])).getTime();
  }

  const normalized = normalizeToken(dateStr).replace(/,/g, ' ');
  const tokens = normalized.split(/\s+/);
  let day = 1;
  let month = 0;
  let year = 2026;
  let foundMonth = false;

  for (const tok of tokens) {
    if (/^\d{4}$/.test(tok)) {
      year = Number(tok);
    } else if (/^\d{1,2}$/.test(tok)) {
      day = Number(tok);
    } else if (tok in FRENCH_MONTHS) {
      month = FRENCH_MONTHS[tok];
      foundMonth = true;
    }
  }

  if (foundMonth) {
    return new Date(year, month, day).getTime();
  }

  const parsed = Date.parse(dateStr);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getParkKeyword(text: string): string {
  const n = normalizeToken(text);
  if (n.includes('mondah') || n.includes('esterias')) return 'mondah';
  if (n.includes('ivindo') || n.includes('djidji') || n.includes('langoue')) return 'ivindo';
  if (n.includes('pongara') || n.includes('nyonie') || n.includes('port-mole') || n.includes('pointe denis')) {
    return 'pongara';
  }
  if (n.includes('wonga') || n.includes('mangrove')) return 'wonga';
  if (n.includes('cristal') || n.includes('kinguele')) return 'cristal';
  return n;
}

const PhotoThumb: React.FC<{
  photo: ExpeditionPhoto;
  onClick: () => void;
}> = ({ photo, onClick }) => {
  const [hasError, setHasError] = useState(false);
  const safePhotoUrl = sanitizeImageUrl(photo.url, { allowDataImage: true });

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative rounded-xl overflow-hidden aspect-[4/3] w-full border border-stone-200 dark:border-white/10 hover:border-amber-500/60 bg-stone-100 dark:bg-slate-950 text-left transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      aria-label={`Voir la photo : ${photo.title}`}
    >
      {!hasError && safePhotoUrl ? (
        <img
          src={safePhotoUrl}
          alt={photo.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-slate-900 to-amber-950 flex flex-col items-center justify-center p-2 text-center">
          <Camera className="w-5 h-5 text-amber-400/80 mb-1" />
          <span className="text-[9px] text-slate-200 font-semibold line-clamp-2 leading-tight">
            {photo.title}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />
      <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 text-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
        <Eye className="w-3 h-3" />
      </span>
      <div className="absolute bottom-1.5 left-1.5 right-1.5 pointer-events-none">
        <span className="text-[10px] font-semibold text-white line-clamp-1 drop-shadow">
          {photo.title}
        </span>
      </div>
    </button>
  );
};

export const AdventureLogbookSection: React.FC<AdventureLogbookSectionProps> = ({
  user,
  bookings,
  events,
  photos,
  ecoChallenges,
  marketplaceOrders = [],
  onSelectPhoto,
  onSelectBadge,
}) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterMode, setFilterMode] = useState<'all' | 'badges' | 'photos'>('all');
  const [showAll, setShowAll] = useState(false);

  const entries = useMemo<LogbookEntry[]>(() => {
    const unlockedIds = new Set<string>([
      ...(user.unlockedBadgeIds || []),
      ...ecoChallenges.map((c) => c.badgeId),
    ]);

    const allBadgesMap = new Map<string, LogbookBadgeItem>();
    for (const b of user.badges) {
      allBadgesMap.set(b.id, { ...b, source: 'profile' });
    }
    for (const vb of ALL_VIRTUAL_ECO_BADGES) {
      if (unlockedIds.has(vb.id) && !allBadgesMap.has(vb.id)) {
        allBadgesMap.set(vb.id, {
          id: vb.id,
          name: vb.name,
          icon: vb.icon,
          desc: vb.desc,
          source: 'eco',
        });
      }
    }
    for (const comp of ecoChallenges) {
      if (!allBadgesMap.has(comp.badgeId)) {
        allBadgesMap.set(comp.badgeId, {
          id: comp.badgeId,
          name: comp.badgeName,
          icon: comp.badgeIcon,
          desc: `${comp.parkName} · ${comp.completedAtLabel}`,
          source: 'eco',
        });
      }
    }

    const matchEvent = (title: string, park: string): ExpeditionEvent | undefined => {
      const nt = normalizeToken(title);
      const pk = getParkKeyword(`${title} ${park}`);
      return events.find(
        (ev) =>
          normalizeToken(ev.title) === nt ||
          nt.includes(normalizeToken(ev.title)) ||
          getParkKeyword(`${ev.title} ${ev.parkName}`) === pk
      );
    };

    const matchBadgesForEntry = (
      title: string,
      park: string,
      eventId?: string
    ): LogbookBadgeItem[] => {
      const result = new Map<string, LogbookBadgeItem>();
      const pk = getParkKeyword(`${title} ${park}`);
      const nt = normalizeToken(`${title} ${park}`);

      if (pk === 'mondah') {
        const b1 = allBadgesMap.get('b1');
        if (b1) result.set(b1.id, b1);
        const zm = allBadgesMap.get('badge-zero-mondah');
        if (zm) result.set(zm.id, zm);
      }
      if (pk === 'ivindo') {
        const b2 = allBadgesMap.get('b2');
        if (b2) result.set(b2.id, b2);
        const zi = allBadgesMap.get('badge-zero-ivindo');
        if (zi) result.set(zi.id, zi);
      }
      if (pk === 'pongara') {
        const zp = allBadgesMap.get('badge-zero-pongara');
        if (zp) result.set(zp.id, zp);
      }
      if (pk === 'wonga') {
        const b3 = allBadgesMap.get('b3');
        if (b3) result.set(b3.id, b3);
        const zw = allBadgesMap.get('badge-zero-wonga');
        if (zw) result.set(zw.id, zw);
      }
      if (pk === 'cristal') {
        const zc = allBadgesMap.get('badge-zero-cristal');
        if (zc) result.set(zc.id, zc);
      }
      if (nt.includes('bivouac') || nt.includes('nocturne')) {
        const b4 = allBadgesMap.get('b4');
        if (b4) result.set(b4.id, b4);
      }

      for (const comp of ecoChallenges) {
        const sameEvent =
          (eventId && comp.eventId === eventId) ||
          normalizeToken(comp.eventTitle) === normalizeToken(title) ||
          getParkKeyword(comp.parkName) === pk;
        if (sameEvent) {
          const item = allBadgesMap.get(comp.badgeId);
          if (item) result.set(item.id, item);
        }
      }

      return Array.from(result.values());
    };

    const grouped = new Map<string, LogbookEntry>();

    // 1. Historical completed expeditions derived from expedition photos
    for (const photo of photos) {
      const activityTitle = photo.expeditionName || photo.title;
      const key = `${normalizeToken(activityTitle)}::${normalizeToken(photo.date)}`;
      const matchedEv = matchEvent(activityTitle, photo.parkName);

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: `log-${key}`,
          title: activityTitle,
          parkName: photo.parkName,
          dateLabel: photo.date,
          timestampMs: parseFrenchDateMs(photo.date),
          distance: matchedEv?.distance,
          elevation: matchedEv?.elevation,
          duration: matchedEv?.duration,
          summary: photo.caption || matchedEv?.description || 'Expédition réalisée au Gabon.',
          statusLabel: 'Activité réalisée',
          badges: matchBadgesForEntry(activityTitle, photo.parkName, matchedEv?.id),
          photos: [photo],
        });
      } else {
        const existing = grouped.get(key)!;
        if (!existing.photos.some((p) => p.id === photo.id)) {
          existing.photos.push(photo);
        }
      }
    }

    // 2. Eco-challenge completions (attach proof photos & badges or add entry)
    for (const comp of ecoChallenges) {
      const proofPhoto: ExpeditionPhoto | null = comp.proofPhotoUrl
        ? {
            id: `eco-proof-${comp.id}`,
            title: `Preuve Défi : ${comp.badgeName}`,
            expeditionName: comp.eventTitle,
            parkName: comp.parkName,
            url: comp.proofPhotoUrl,
            date: comp.completedAtLabel,
            caption: comp.wasteNote || 'Validation écologique Zéro Déchet certifiée avec photo terrain.',
            isFavorite: false,
          }
        : null;

      const existingMatch = Array.from(grouped.values()).find(
        (entry) =>
          normalizeToken(entry.title) === normalizeToken(comp.eventTitle) ||
          getParkKeyword(entry.parkName) === getParkKeyword(comp.parkName)
      );

      const ecoBadge: LogbookBadgeItem = allBadgesMap.get(comp.badgeId) || {
        id: comp.badgeId,
        name: comp.badgeName,
        icon: comp.badgeIcon,
        desc: `${comp.parkName} · ${comp.completedAtLabel}`,
        source: 'eco',
      };

      if (existingMatch) {
        if (!existingMatch.badges.some((b) => b.id === ecoBadge.id)) {
          existingMatch.badges.push(ecoBadge);
        }
        if (proofPhoto && !existingMatch.photos.some((p) => p.id === proofPhoto.id)) {
          existingMatch.photos.unshift(proofPhoto);
        }
        existingMatch.statusLabel = 'Réalisée & Certifiée Zéro Déchet';
      } else {
        const matchedEv = matchEvent(comp.eventTitle, comp.parkName);
        const key = `eco-${comp.id}`;
        grouped.set(key, {
          id: key,
          title: comp.eventTitle,
          parkName: comp.parkName,
          dateLabel: comp.completedAtLabel,
          timestampMs: comp.createdAtMs || parseFrenchDateMs(comp.completedAtLabel) || Date.now(),
          distance: matchedEv?.distance,
          elevation: matchedEv?.elevation,
          duration: matchedEv?.duration,
          summary: comp.wasteNote || 'Défi écologique Zéro Déchet validé sur le terrain.',
          statusLabel: 'Certifiée Zéro Déchet',
          badges: [ecoBadge],
          photos: proofPhoto ? [proofPhoto] : [],
        });
      }
    }

    // 3. Used bookings (realized passes) or confirmed bookings tied to completed trips
    for (const bk of bookings) {
      if (bk.status !== 'USED') continue;
      const matchedEv = bk.eventId ? events.find((e) => e.id === bk.eventId) : matchEvent(bk.eventTitle, bk.location);
      const parkName = matchedEv?.parkName || bk.location;
      const key = `bk-${bk.id}`;
      const relatedPhotos = photos.filter(
        (p) =>
          normalizeToken(p.expeditionName || '') === normalizeToken(bk.eventTitle) ||
          getParkKeyword(p.parkName) === getParkKeyword(parkName)
      );

      grouped.set(key, {
        id: key,
        title: bk.eventTitle,
        parkName,
        dateLabel: bk.eventDate,
        timestampMs: parseFrenchDateMs(bk.eventDate) || Date.parse(bk.timestamp) || Date.now(),
        distance: matchedEv?.distance,
        elevation: matchedEv?.elevation,
        duration: matchedEv?.duration,
        summary: `Pass ${bk.refNumber} validé à ${bk.location}.`,
        statusLabel: 'Pass validé sur site',
        badges: matchBadgesForEntry(bk.eventTitle, parkName, matchedEv?.id),
        photos: relatedPhotos.slice(0, 3),
      });
    }

    // 4. Completed marketplace activity orders
    for (const ord of marketplaceOrders) {
      if (ord.fulfillmentStatus !== 'COMPLETED') continue;
      for (const item of ord.items) {
        if (item.kind !== 'activity') continue;
        const matchedEv = events.find((e) => e.id === item.refId) || matchEvent(item.title, item.meta?.parkName || '');
        const parkName = item.meta?.parkName || matchedEv?.parkName || 'Gabon Outdoor';
        const dateLabel = item.meta?.eventDate || ord.timestamp;
        const key = `ord-${ord.id}-${item.cartItemId}`;
        if (grouped.has(key)) continue;

        grouped.set(key, {
          id: key,
          title: item.title,
          parkName,
          dateLabel,
          timestampMs: ord.createdAtMs || parseFrenchDateMs(dateLabel) || Date.now(),
          distance: matchedEv?.distance,
          elevation: matchedEv?.elevation,
          duration: matchedEv?.duration,
          summary: `Commande ${ord.refNumber} finalisée (${item.subtitle}).`,
          statusLabel: 'Activité réalisée',
          badges: matchBadgesForEntry(item.title, parkName, matchedEv?.id),
          photos: photos
            .filter((p) => getParkKeyword(p.parkName) === getParkKeyword(parkName))
            .slice(0, 2),
        });
      }
    }

    return Array.from(grouped.values());
  }, [user.badges, user.unlockedBadgeIds, photos, ecoChallenges, bookings, events, marketplaceOrders]);

  const filteredAndSorted = useMemo(() => {
    const filtered = entries.filter((entry) => {
      if (filterMode === 'badges') return entry.badges.length > 0;
      if (filterMode === 'photos') return entry.photos.length > 0;
      return true;
    });

    return [...filtered].sort((a, b) =>
      sortOrder === 'desc' ? b.timestampMs - a.timestampMs : a.timestampMs - b.timestampMs
    );
  }, [entries, filterMode, sortOrder]);

  const visibleEntries = showAll ? filteredAndSorted : filteredAndSorted.slice(0, 4);

  const uniqueBadgeCount = useMemo(() => {
    const ids = new Set<string>();
    for (const e of entries) {
      for (const b of e.badges) ids.add(b.id);
    }
    return ids.size;
  }, [entries]);

  const totalPhotoCount = useMemo(() => {
    const ids = new Set<string>();
    for (const e of entries) {
      for (const p of e.photos) ids.add(p.id);
    }
    return ids.size;
  }, [entries]);

  return (
    <section
      id="adventure-logbook-section"
      aria-labelledby="adventure-logbook-heading"
      className="bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-white/10 rounded-3xl p-4 sm:p-5 space-y-4 shadow-lg"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3
              id="adventure-logbook-heading"
              className="font-serif-display font-bold text-base text-slate-900 dark:text-white tracking-tight"
            >
              Mon Carnet d&apos;Aventures
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
              {entries.length} activités réalisées · {uniqueBadgeCount} badges gagnés · {totalPhotoCount} photos
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          className="min-h-[44px] px-3 py-2 bg-stone-100 dark:bg-slate-950 hover:bg-stone-200 dark:hover:bg-slate-800 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition shrink-0"
          title="Inverser l'ordre chronologique"
        >
          {sortOrder === 'desc' ? (
            <>
              <SortDesc className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Plus récentes</span>
            </>
          ) : (
            <>
              <SortAsc className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Plus anciennes</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Segmented Control */}
      <div
        role="tablist"
        aria-label="Filtrer le carnet d'aventures"
        className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 rounded-2xl text-xs"
      >
        {(
          [
            { id: 'all', label: `Toutes (${entries.length})` },
            { id: 'badges', label: `Badges (${entries.filter((e) => e.badges.length > 0).length})` },
            { id: 'photos', label: `Photos (${entries.filter((e) => e.photos.length > 0).length})` },
          ] as const
        ).map((tab) => {
          const isSelected = filterMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setFilterMode(tab.id);
                setShowAll(false);
              }}
              className={`min-h-[40px] px-2 py-1.5 rounded-xl font-bold transition truncate ${
                isSelected
                  ? 'copper-gradient text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Chronological Timeline */}
      {filteredAndSorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-slate-950/40 p-6 text-center space-y-2">
          <Compass className="w-7 h-7 text-amber-600 dark:text-amber-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Aucune entrée pour ce filtre
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Participez à une expédition ou validez un défi écologique pour enrichir votre carnet.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-4 ps-6">
          {/* Hairline Chronological Rail */}
          <div
            aria-hidden="true"
            className="absolute top-2 bottom-2 start-2.5 w-px bg-stone-200 dark:bg-white/15"
          />

          {visibleEntries.map((entry) => (
            <li key={entry.id} className="relative">
              {/* Timeline Node Marker */}
              <span
                aria-hidden="true"
                className="absolute -start-[18px] top-4 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 shadow-sm"
              />

              <article className="bg-stone-50/90 dark:bg-slate-950/75 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 space-y-3">
                {/* Date + Status + Title */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {entry.dateLabel}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {entry.statusLabel}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                    {entry.title}
                  </h4>

                  {/* Unboxed Metadata Strip */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                      {entry.parkName}
                    </span>
                    {entry.distance && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Route className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          {entry.distance}
                        </span>
                      </>
                    )}
                    {entry.elevation && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Mountain className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
                          {entry.elevation}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Activity Summary */}
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {entry.summary}
                </p>

                {/* Earned Badges for This Activity */}
                {entry.badges.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Badges gagnés ({entry.badges.length})</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.badges.map((badge) => (
                        <button
                          key={badge.id}
                          type="button"
                          onClick={() => onSelectBadge(badge.id)}
                          className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/35 hover:border-amber-500 text-left flex items-center gap-2 transition active:scale-95 shadow-xs"
                        >
                          <span className="text-base leading-none shrink-0">{badge.icon}</span>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 block leading-tight">
                              {badge.name}
                            </span>
                            <span className="text-[9px] text-amber-700 dark:text-amber-400 block leading-tight">
                              {badge.source === 'eco' ? 'Défi Éco' : 'Accomplissement'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Associated Photos */}
                {entry.photos.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Photos associées ({entry.photos.length})</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {entry.photos.map((photo) => (
                        <PhotoThumb
                          key={photo.id}
                          photo={photo}
                          onClick={() => onSelectPhoto(photo)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </article>
            </li>
          ))}
        </ol>
      )}

      {/* Expand / Collapse Footer */}
      {filteredAndSorted.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="w-full min-h-[44px] py-2.5 px-4 bg-stone-100 dark:bg-slate-950 hover:bg-stone-200 dark:hover:bg-slate-800 border border-stone-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Réduire l&apos;historique</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Voir tout le carnet ({filteredAndSorted.length} activités)</span>
            </>
          )}
        </button>
      )}
    </section>
  );
};
