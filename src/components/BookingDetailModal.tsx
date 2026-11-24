/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  QrCode,
  Calendar,
  MapPin,
  Bus,
  Tent,
  UserCheck,
  CreditCard,
  Share2,
  CalendarPlus,
  ExternalLink,
  Award,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Booking, EcoChallengeCompletion, ExpeditionEvent } from '../types';
import { ECO_CHALLENGES_CATALOG } from '../data/ecoChallenges';
import { getGoogleCalendarUrl } from '../utils/calendar';

interface BookingDetailModalProps {
  booking: Booking | null;
  ecoChallenges: EcoChallengeCompletion[];
  events?: ExpeditionEvent[];
  isOpen: boolean;
  onClose: () => void;
  onShareExpedition: (booking: Booking) => void;
  onDownloadICS?: (booking: Booking) => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  ecoChallenges,
  events = [],
  isOpen,
  onClose,
  onShareExpedition,
  onDownloadICS,
}) => {
  if (!isOpen || !booking) return null;

  const matchedChallengeCompletion = ecoChallenges.find(
    (c) => c.eventId === booking.eventId
  );
  const catalogChallenge = ECO_CHALLENGES_CATALOG.find(
    (c) => c.eventId === booking.eventId
  );
  const matchedEvent = events.find((e) => e.id === booking.eventId);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#101613] border-t sm:border border-stone-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block truncate">
              Pass Électronique · {booking.refNumber}
            </span>
            <h3 className="font-serif-display font-bold text-lg text-slate-900 dark:text-white leading-snug mt-0.5">
              {booking.eventTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les détails de la réservation"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cover Thumbnail if linked event exists */}
        {matchedEvent?.image && (
          <div className="relative h-36 rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10">
            <img
              src={matchedEvent.image}
              alt={booking.eventTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
              <span className="font-bold truncate">{matchedEvent.parkName}</span>
              <span className="font-mono text-[11px] bg-black/55 px-2 py-0.5 rounded-lg shrink-0">
                {matchedEvent.duration} · {matchedEvent.distance}
              </span>
            </div>
          </div>
        )}

        {/* Digital QR & Pass Verification Card */}
        <div className="rounded-2xl bg-stone-50 dark:bg-slate-950/75 border border-amber-500/35 p-4 flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Statut : {booking.status === 'USED' ? 'Utilisé' : 'Confirmé ANPN'}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate">
              Clé contrôle : {booking.qrCodeSeed}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 shrink-0" />
              <span>Émis le {booking.timestamp}</span>
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 flex flex-col items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-sm">
            <QrCode className="w-9 h-9" />
            <span className="text-[8px] font-mono font-bold mt-0.5">PASS QR</span>
          </div>
        </div>

        {/* Date, Location & Services Breakdown */}
        <div className="rounded-2xl bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-white/10 p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Date de départ</span>
            </span>
            <strong className="text-slate-900 dark:text-white">{booking.eventDate}</strong>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Lieu / Rassemblement</span>
            </span>
            <strong className="text-slate-900 dark:text-white text-right">{booking.location}</strong>
          </div>

          <div className="pt-2 border-t border-stone-200 dark:border-white/5 flex flex-wrap gap-2">
            <span
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 border ${
                booking.shuttleIncluded
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/40 text-amber-800 dark:text-amber-300'
                  : 'bg-stone-100 dark:bg-slate-900 border-stone-200 dark:border-white/5 text-slate-400'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>{booking.shuttleIncluded ? booking.shuttleDetail || 'Navette A/R incluse' : 'Sans navette'}</span>
            </span>

            <span
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 border ${
                booking.tentIncluded
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-stone-100 dark:bg-slate-900 border-stone-200 dark:border-white/5 text-slate-400'
              }`}
            >
              <Tent className="w-3.5 h-3.5" />
              <span>{booking.tentIncluded ? 'Tente bivouac incluse' : 'Sans tente'}</span>
            </span>

            <span
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 border ${
                booking.guideIncluded
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-stone-100 dark:bg-slate-900 border-stone-200 dark:border-white/5 text-slate-400'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{booking.guideIncluded ? 'Écoguide certifié' : 'Sans guide'}</span>
            </span>
          </div>

          <div className="pt-2 border-t border-stone-200 dark:border-white/5 flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Paiement {booking.paymentMethod} ({booking.payerPhone})</span>
            </span>
            <strong className="font-mono text-sm text-amber-700 dark:text-amber-400">
              {booking.totalAmount.toLocaleString('fr-FR')} FCFA
            </strong>
          </div>
        </div>

        {/* Linked Eco-Challenge / Badge Preview */}
        <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/35 p-3.5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/35 flex items-center justify-center text-2xl shrink-0">
            {matchedChallengeCompletion?.badgeIcon || catalogChallenge?.badge.icon || '🌿'}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>
                {matchedChallengeCompletion
                  ? 'Défi Zéro Déchet Accompli'
                  : 'Badge & Défi Associé'}
              </span>
            </span>
            <strong className="text-xs text-slate-900 dark:text-white block truncate mt-0.5">
              {matchedChallengeCompletion?.badgeName ||
                catalogChallenge?.badge.name ||
                'Explorateur Éco-Responsable MANGOREMA'}
            </strong>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 block truncate">
              {matchedChallengeCompletion
                ? `+${matchedChallengeCompletion.ecoPoints} pts éco · Validé le ${matchedChallengeCompletion.completedAtLabel}`
                : catalogChallenge?.challengeTitle || 'Incluez votre badge sur votre carte souvenir'}
            </span>
          </div>
        </div>

        {/* Primary CTA: Partager mon expédition */}
        <button
          type="button"
          onClick={() => onShareExpedition(booking)}
          className="w-full min-h-[46px] px-4 py-3 copper-gradient text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition"
        >
          <Share2 className="w-4 h-4" />
          <span>Partager mon expédition</span>
        </button>

        {/* Secondary Calendar & Close Actions */}
        <div className="grid grid-cols-2 gap-2">
          {onDownloadICS && (
            <button
              type="button"
              onClick={() => onDownloadICS(booking)}
              className="min-h-[42px] px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Exporter .ics</span>
            </button>
          )}
          <a
            href={getGoogleCalendarUrl(booking)}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[42px] px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Google Agenda</span>
          </a>
        </div>
      </div>
    </div>
  );
};
