/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExpeditionEvent, ExpeditionReview } from '../types';
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  Backpack,
  Star,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Bus,
  Tent,
  UserCheck,
  Utensils,
  Heart,
  BadgeCheck,
  Navigation,
  Locate,
  ExternalLink,
} from 'lucide-react';
import {
  buildDirectionsUrl,
  calculateDistanceKm,
  formatCoordsPair,
  formatDistanceKm,
} from '../utils/activityLocation';

interface ActivityDetailModalProps {
  event: ExpeditionEvent | null;
  reviews?: ExpeditionReview[];
  isFavorite?: boolean;
  userGpsCoords?: [number, number] | null;
  isLocatingUser?: boolean;
  onActivateUserLocation?: () => void;
  onLocateOnMap?: (event: ExpeditionEvent) => void;
  onToggleFavorite?: (eventId: string) => void;
  onClose: () => void;
  onAddToUnifiedCart: (
    event: ExpeditionEvent,
    options: {
      participants: number;
      shuttleIncluded: boolean;
      tentIncluded: boolean;
      guideIncluded: boolean;
      mealPackIncluded: boolean;
    }
  ) => void;
  onQuickCheckout: (event: ExpeditionEvent) => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  event,
  reviews = [],
  isFavorite = false,
  userGpsCoords = null,
  isLocatingUser = false,
  onActivateUserLocation,
  onLocateOnMap,
  onToggleFavorite,
  onClose,
  onAddToUnifiedCart,
  onQuickCheckout,
}) => {
  const [participants, setParticipants] = useState(1);
  const [shuttleIncluded, setShuttleIncluded] = useState(true);
  const [tentIncluded, setTentIncluded] = useState(false);
  const [guideIncluded, setGuideIncluded] = useState(true);
  const [mealPackIncluded, setMealPackIncluded] = useState(false);

  if (!event) return null;

  const eventReviews = reviews.filter((r) => r.eventId === event.id);
  const avgRating =
    eventReviews.length > 0
      ? (eventReviews.reduce((s, r) => s + r.rating, 0) / eventReviews.length).toFixed(1)
      : (event.rating || 4.9).toFixed(1);

  const addonsUnit =
    (shuttleIncluded ? 5000 : 0) +
    (tentIncluded ? 3000 : 0) +
    (guideIncluded ? 2500 : 0) +
    (mealPackIncluded ? 4000 : 0);
  const estimatedTotal = (event.basePrice + addonsUnit) * participants;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#101613] border-t sm:border border-stone-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto no-scrollbar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Hero Image */}
        <div className="relative h-52">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/25" />

          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                {event.discipline || event.category}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/60 text-white font-bold text-[10px] border border-white/15">
                {event.difficulty}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(event.id)}
                  aria-label="Ajouter aux favoris"
                  className={`min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center border transition ${
                    isFavorite
                      ? 'bg-rose-600 border-rose-400 text-white'
                      : 'bg-black/60 border-white/20 text-white hover:bg-black/80'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la fiche"
                className="min-w-[40px] min-h-[40px] rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-amber-400 block truncate">
                {event.parkName}
              </span>
              <h2 className="font-serif-display text-xl font-bold text-white leading-tight">
                {event.title}
              </h2>
            </div>
            <div className="bg-slate-950/90 border border-amber-500/40 px-3 py-1.5 rounded-xl text-right shrink-0">
              <span className="text-sm font-black text-amber-400 font-mono tabular-nums block">
                {event.basePrice === 0 ? 'Gratuit' : `${event.basePrice.toLocaleString('fr-FR')} F`}
              </span>
              <span className="text-[9px] text-slate-300">/ participant</span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-4">
          {/* Quick Metrics & Provider Verification */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-2 min-w-0">
              <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Prestataire vérifié ANPN</span>
                <strong className="text-slate-900 dark:text-white truncate block">{event.organizer}</strong>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-xl shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span className="font-black text-amber-700 dark:text-amber-300 font-mono tabular-nums">
                {avgRating}
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400">
                ({eventReviews.length || event.reviewsCount || 12} avis)
              </span>
            </div>
          </div>

          {/* Core Specs Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900/70 border border-stone-200 dark:border-white/5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-slate-500 block">Date</span>
                <strong className="text-slate-900 dark:text-white truncate block">{event.date}</strong>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900/70 border border-stone-200 dark:border-white/5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-slate-500 block">Durée & Effort</span>
                <strong className="text-slate-900 dark:text-white truncate block">
                  {event.duration} · {event.distance}
                </strong>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900/70 border border-stone-200 dark:border-white/5 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-slate-500 block">Zone / Rassemblement</span>
                <strong className="text-slate-900 dark:text-white truncate block">{event.location}</strong>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900/70 border border-stone-200 dark:border-white/5 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-slate-500 block">Disponibilités</span>
                <strong className="text-emerald-700 dark:text-emerald-400 truncate block">
                  {event.spotsLeft ?? 6} places libres / {event.maxParticipants ?? 16}
                </strong>
              </div>
            </div>
          </div>

          {/* Interactive GPS Location & Directions Panel */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/75 dark:bg-emerald-950/25 border border-emerald-500/35 space-y-2.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>Localisation GPS &amp; Point de rendez-vous</span>
                </span>
                {event.locationEnabled !== false ? (
                  <>
                    <strong className="font-mono text-slate-900 dark:text-white block mt-0.5 tabular-nums">
                      {formatCoordsPair(event.coords)}
                    </strong>
                    {userGpsCoords && (
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mt-0.5 tabular-nums">
                        À {formatDistanceKm(calculateDistanceKm(userGpsCoords, event.coords))} de votre position GPS
                      </span>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Localisation GPS restreinte par l’organisateur. Coordonnées envoyées après validation.
                  </p>
                )}
              </div>

              {event.locationEnabled !== false && !userGpsCoords && onActivateUserLocation && (
                <button
                  type="button"
                  disabled={isLocatingUser}
                  onClick={onActivateUserLocation}
                  className="min-h-[34px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 shrink-0 transition active:scale-95"
                >
                  <Locate className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
                  <span>{isLocatingUser ? 'GPS...' : 'Distance'}</span>
                </button>
              )}
            </div>

            {event.locationEnabled !== false && (
              <div className="grid grid-cols-2 gap-2">
                {onLocateOnMap && (
                  <button
                    type="button"
                    onClick={() => onLocateOnMap(event)}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Voir sur la carte</span>
                  </button>
                )}
                <a
                  href={buildDirectionsUrl(event.coords)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/15 hover:border-amber-500/50 text-slate-800 dark:text-slate-100 font-bold text-[11px] flex items-center justify-center gap-1.5 transition ${
                    onLocateOnMap ? '' : 'col-span-2'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Itinéraire GPS</span>
                </a>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {event.description}
          </p>

          {/* Equipment Required & Safety Instructions */}
          {(event.requiredGear || event.safetyRules) && (
            <div className="grid grid-cols-1 gap-2.5">
              {event.requiredGear && event.requiredGear.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Backpack className="w-3.5 h-3.5" />
                    <span>Équipement nécessaire</span>
                  </h4>
                  <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                    {event.requiredGear.map((g, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {event.safetyRules && event.safetyRules.length > 0 && (
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-500/30 space-y-1.5">
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Consignes de sécurité & Conditions</span>
                  </h4>
                  <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                    {event.safetyRules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                  {event.participationConditions && (
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 pt-1 border-t border-emerald-500/20">
                      Conditions : {event.participationConditions}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cancellation Policy */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-900/70 border border-stone-200 dark:border-white/10 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-800 dark:text-slate-200">Annulation :</strong>{' '}
              {event.cancellationPolicy || 'Annulation gratuite jusqu’à 48h avant le départ.'}
            </span>
          </div>

          {/* Participants & Quick Add-ons for Unified Cart */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Nombre de participants
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setParticipants((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 font-bold text-sm"
                >
                  −
                </button>
                <span className="font-mono font-black text-sm w-6 text-center tabular-nums">
                  {participants}
                </span>
                <button
                  type="button"
                  onClick={() => setParticipants((p) => Math.min(12, p + 1))}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setShuttleIncluded((v) => !v)}
                className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition ${
                  shuttleIncluded
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                    : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Bus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Navette (+5 000 F)</span>
              </button>
              <button
                type="button"
                onClick={() => setTentIncluded((v) => !v)}
                className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition ${
                  tentIncluded
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                    : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Tent className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Tente (+3 000 F)</span>
              </button>
              <button
                type="button"
                onClick={() => setGuideIncluded((v) => !v)}
                className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition ${
                  guideIncluded
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                    : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Guide (+2 500 F)</span>
              </button>
              <button
                type="button"
                onClick={() => setMealPackIncluded((v) => !v)}
                className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition ${
                  mealPackIncluded
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                    : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Utensils className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Vivres (+4 000 F)</span>
              </button>
            </div>
          </div>

          {/* Reviews Snippet if available */}
          {eventReviews.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Dernier avis vérifié
              </span>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-white/5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-slate-900 dark:text-white">{eventReviews[0].authorName}</strong>
                  <span className="text-amber-500 font-mono text-[11px]">
                    {'★'.repeat(eventReviews[0].rating)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                  « {eventReviews[0].comment} »
                </p>
              </div>
            </div>
          )}

          {/* Dual CTA: Add to Unified Cart OR Instant Checkout */}
          <div className="pt-2 border-t border-stone-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onAddToUnifiedCart(event, {
                  participants,
                  shuttleIncluded,
                  tentIncluded,
                  guideIncluded,
                  mealPackIncluded,
                });
                onClose();
              }}
              className="min-h-[46px] px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Panier ({estimatedTotal.toLocaleString('fr-FR')} F)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onQuickCheckout(event);
              }}
              className="min-h-[46px] px-3.5 py-2.5 copper-gradient text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              <span>Réserver direct</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
