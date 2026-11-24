import React, { useState } from 'react';
import { ShuttleService } from '../types';
import { X, Bus, Clock, MapPin, User, Phone, CheckCircle2, AlertCircle, BellRing } from 'lucide-react';
import { scheduleShuttleNotification } from '../utils/notificationService';
import { CategoryIcon } from './CategoryIcon';

interface ShuttleBookingModalProps {
  shuttles: ShuttleService[];
  isOpen: boolean;
  focusedShuttleId?: string | null;
  onClose: () => void;
  onBookShuttle: (shuttle: ShuttleService) => void;
}

export const ShuttleBookingModal: React.FC<ShuttleBookingModalProps> = ({
  shuttles,
  isOpen,
  focusedShuttleId,
  onClose,
  onBookShuttle,
}) => {
  const [selectedShuttle, setSelectedShuttle] = useState<ShuttleService | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirmSeat = (shuttle: ShuttleService) => {
    setSelectedShuttle(shuttle);
    setBookingSuccess(true);
    scheduleShuttleNotification(shuttle);
    onBookShuttle(shuttle);
    setTimeout(() => {
      setBookingSuccess(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
      <div className="bg-white dark:bg-[#121614] border border-stone-200 dark:border-white/10 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto no-scrollbar shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#121614]/95 backdrop-blur-md border-b border-stone-200 dark:border-white/10 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <CategoryIcon category="navettes" size="sm" />
            <div>
              <div className="text-[10px] text-amber-700 dark:text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                MANGOREMA LOGISTICS GABON
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Navettes Mutualisées Libreville</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-500/40 dark:border-amber-600/30 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
            🌿 <strong>Zéro tracas de transport :</strong> Départs groupés depuis les principaux carrefours de Libreville avec chauffeurs accrédités ANPN.
          </div>

          {bookingSuccess && selectedShuttle && (
            <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500 rounded-xl p-3.5 flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div className="text-xs">
                <strong className="text-slate-900 dark:text-white block font-bold">Siège Réservé avec Succès !</strong>
                <span className="text-emerald-800 dark:text-emerald-200 block">
                  Navette {selectedShuttle.type} confirmée (départ {selectedShuttle.departureTime}).
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1 mt-1">
                  <BellRing className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Rappel local H-1 programmé : alerte Web 1h avant le départ.
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {[...shuttles]
              .sort((a, b) => (a.id === focusedShuttleId ? -1 : b.id === focusedShuttleId ? 1 : 0))
              .map((s) => {
                const occupancy = Math.round((s.bookedSeats / Math.max(1, s.totalSeats)) * 100);
                const remaining = Math.max(0, s.totalSeats - s.bookedSeats);
                const isFocused = s.id === focusedShuttleId;
                const barColor =
                  remaining <= 0
                    ? 'bg-red-600'
                    : occupancy >= 80
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : occupancy >= 55
                    ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                    : 'bg-emerald-500';

                return (
                  <div
                    key={s.id}
                    className={`bg-stone-50 dark:bg-slate-900/70 border rounded-2xl p-3.5 space-y-2.5 transition shadow-sm ${
                      isFocused
                        ? 'border-amber-500 ring-1 ring-amber-500/40'
                        : 'border-stone-200 dark:border-white/5 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-400">
                          {s.type}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{s.model}</h4>
                      </div>
                      <span className="font-black font-mono tabular-nums text-amber-700 dark:text-amber-400 text-sm">
                        {s.price.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                        <span className="truncate">Départ: <strong className="text-slate-900 dark:text-slate-200">{s.departurePoint}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
                        <span className="truncate">Arrivée: <strong className="text-slate-900 dark:text-slate-200">{s.destination}</strong></span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-500" /> {s.departureTime} (Retour {s.returnTime})
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-amber-600 dark:text-amber-500" /> {s.driverName}
                        </span>
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
                        <span>Remplissage ({occupancy}%)</span>
                        <span className="font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                          {remaining > 0 ? `${s.bookedSeats}/${s.totalSeats} places (${remaining} restantes)` : 'COMPLET'}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor}`}
                          style={{ width: `${occupancy}%` }}
                        />
                      </div>
                    </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`tel:${s.driverPhone.replace(/\s+/g, '')}`}
                      className="px-3 py-2 bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                      title="Contacter le chauffeur"
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                      <span className="hidden sm:inline">Chauffeur</span>
                    </a>
                    <button
                      onClick={() => handleConfirmSeat(s)}
                      disabled={remaining <= 0}
                      className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider transition active:scale-95"
                    >
                      {remaining > 0 ? `Prendre un siège (${s.price.toLocaleString('fr-FR')} F)` : 'Complet'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
