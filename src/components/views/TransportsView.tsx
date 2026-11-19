import React, { useState } from 'react';
import { ShuttleService } from '../../types';
import { Bus, Clock, MapPin, Phone, ShieldCheck, Users, CheckCircle2, Tent, ArrowRight, Bell, BellRing } from 'lucide-react';
import { scheduleShuttleNotification, calculateShuttleTimestamps, simulateImmediateH1Alert } from '../../utils/notificationService';
import { CategoryIcon } from '../CategoryIcon';

interface TransportsViewProps {
  shuttles: ShuttleService[];
  onOpenBookingModal: (shuttle?: ShuttleService) => void;
  onOpenRental?: () => void;
  onAlertScheduled?: (msg: string) => void;
}

export const TransportsView: React.FC<TransportsViewProps> = ({
  shuttles,
  onOpenBookingModal,
  onOpenRental,
  onAlertScheduled,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredShuttles = shuttles.filter((s) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'BUS') return s.type.includes('Minibus');
    if (filterType === '4X4') return s.type.includes('4x4');
    if (filterType === 'BOAT') return s.type.includes('Bateau') || s.type.includes('Pirogue');
    return true;
  });

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Title */}
      <div className="flex items-center gap-3">
        <CategoryIcon category="navettes" size="md" />
        <div>
          <h2 className="font-serif-display text-xl text-slate-900 dark:text-white font-bold">
            MANGOREMA Logistics & Navettes
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Trajets groupés et mutualisés au départ des carrefours clés de Libreville
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'ALL', label: 'Tous les Trajets' },
          { id: 'BUS', label: 'Minibus 15P' },
          { id: '4X4', label: '4x4 Tout-Terrain' },
          { id: 'BOAT', label: 'Bateau / Pirogue' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterType(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterType === t.id
                ? 'bg-amber-600 text-slate-950 font-bold shadow-md'
                : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Safety & Comfort badge */}
      <div className="bg-white dark:bg-slate-900/80 border border-emerald-500/35 dark:border-emerald-500/30 rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <div className="text-xs">
          <strong className="text-slate-900 dark:text-white block font-bold">Flotte Agréée & Sécurisée</strong>
          <span className="text-slate-700 dark:text-slate-300 text-[11px]">
            Véhicules révisés, gilets SOLAS sur l'eau, chauffeurs connaissant parfaitement les pistes gabonaises.
          </span>
        </div>
      </div>

      {/* MANGOREMA LOCATION Banner */}
      <div className="bg-white dark:bg-slate-900/90 border border-amber-500/35 dark:border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <CategoryIcon category="location" size="sm" />
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">MANGOREMA LOCATION Matériel</h4>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">Tentes bivouac, sacs 65L, VTT d'expédition et balises GPS</p>
          </div>
        </div>
        <button
          onClick={onOpenRental}
          className="px-3 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shrink-0 active:scale-95 transition"
        >
          Louer
        </button>
      </div>

      {/* Shuttle Cards */}
      <div className="space-y-3">
        {filteredShuttles.map((shuttle) => {
          const occupancy = Math.round((shuttle.bookedSeats / shuttle.totalSeats) * 100);
          const remaining = shuttle.totalSeats - shuttle.bookedSeats;

          return (
            <div
              key={shuttle.id}
              className="bg-white dark:bg-slate-900/80 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 rounded-2xl p-4 space-y-3 transition shadow-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-amber-500/15 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/30 dark:border-amber-500/20 px-2 py-0.5 rounded font-bold">
                    {shuttle.type}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">{shuttle.model}</h3>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-amber-700 dark:text-amber-400 block">
                    {shuttle.price.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">par personne A/R</span>
                </div>
              </div>

              {/* Route Details */}
              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 bg-stone-50 dark:bg-slate-950/60 p-3 rounded-xl border border-stone-200 dark:border-white/5">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">POINT DE RENCONTRE</span>
                    <strong className="text-slate-900 dark:text-white">{shuttle.departurePoint}</strong>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1 border-t border-stone-200 dark:border-white/5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">DESTINATION FORÊT / PLAGE</span>
                    <strong className="text-slate-900 dark:text-white">{shuttle.destination}</strong>
                  </div>
                </div>
              </div>

              {/* Time & Driver */}
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                  Départ <strong className="text-slate-900 dark:text-slate-200">{shuttle.departureTime}</strong> (Retour {shuttle.returnTime})
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  {shuttle.driverName}
                </span>
              </div>

              {/* Seat filling progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>Remplissage navette</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {remaining > 0 ? `${shuttle.bookedSeats} / ${shuttle.totalSeats} places (${remaining} libres)` : 'COMPLET'}
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-200 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      occupancy > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${occupancy}%` }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${shuttle.driverPhone.replace(/\s+/g, '')}`}
                  className="px-3 py-2.5 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-stone-200 dark:border-transparent"
                  title="Contacter le chauffeur"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">Chauffeur</span>
                </a>

                <button
                  onClick={() => {
                    const notif = scheduleShuttleNotification(shuttle);
                    if (onAlertScheduled) {
                      onAlertScheduled(`Alerte H-1 programmée : Rappel à ${notif.alertTimeFormatted} (1h avant départ de ${shuttle.departureTime}).`);
                    }
                  }}
                  className="px-3 py-2.5 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  title="Programmer une alerte Web Notification 1h avant le départ de cette navette"
                >
                  <BellRing className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Alerte H-1</span>
                </button>

                <button
                  onClick={() => onOpenBookingModal(shuttle)}
                  disabled={remaining <= 0}
                  className="flex-1 py-2.5 copper-gradient disabled:bg-stone-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow active:scale-95 transition"
                >
                  {remaining > 0 ? `Réserver (${shuttle.price.toLocaleString('fr-FR')} F)` : 'Complet'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
