import React, { useMemo, useState } from 'react';
import { ShuttleService } from '../../types';
import {
  Bus,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
  CheckCircle2,
  BellRing,
  AlertTriangle,
  TrendingUp,
  Flame,
  ShoppingBag,
  Ship,
  Car,
} from 'lucide-react';
import { scheduleShuttleNotification } from '../../utils/notificationService';
import { CategoryIcon } from '../CategoryIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';

interface TransportsViewProps {
  shuttles: ShuttleService[];
  onOpenBookingModal: (shuttle?: ShuttleService) => void;
  onOpenRental?: () => void;
  onAlertScheduled?: (msg: string) => void;
  onShuttleAddedToCart?: (shuttle: ShuttleService) => void;
}

interface OccupancyTheme {
  label: string;
  barClass: string;
  seatFilledClass: string;
  textClass: string;
  surfaceClass: string;
  Icon: React.ComponentType<{ className?: string }>;
}

export const TransportsView: React.FC<TransportsViewProps> = ({
  shuttles,
  onOpenBookingModal,
  onOpenRental,
  onAlertScheduled,
  onShuttleAddedToCart,
}) => {
  const { t } = useLanguage();
  const { addShuttleToCart } = useCart();
  const [filterType, setFilterType] = useState<'ALL' | 'BUS' | '4X4' | 'BOAT'>('ALL');

  const filteredShuttles = useMemo(() => {
    return shuttles.filter((s) => {
      if (filterType === 'ALL') return true;
      if (filterType === 'BUS') return s.type.includes('Minibus') || s.type.includes('Navette');
      if (filterType === '4X4') return s.type.includes('4x4');
      if (filterType === 'BOAT') return s.type.includes('Bateau') || s.type.includes('Pirogue');
      return true;
    });
  }, [shuttles, filterType]);

  const fleetStats = useMemo(() => {
    const totalSeats = filteredShuttles.reduce((sum, s) => sum + s.totalSeats, 0);
    const bookedSeats = filteredShuttles.reduce((sum, s) => sum + s.bookedSeats, 0);
    const openSeats = Math.max(0, totalSeats - bookedSeats);
    const avgOccupancy = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;
    return { totalSeats, bookedSeats, openSeats, avgOccupancy };
  }, [filteredShuttles]);

  const getOccupancyTheme = (occupancy: number, remaining: number): OccupancyTheme => {
    if (remaining <= 0 || occupancy >= 100) {
      return {
        label: t.transports.statusFull,
        barClass: 'bg-red-600 dark:bg-red-500',
        seatFilledClass: 'bg-red-600 dark:bg-red-500',
        textClass: 'text-red-700 dark:text-red-400',
        surfaceClass: 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-500/25',
        Icon: AlertTriangle,
      };
    }
    if (occupancy >= 80) {
      return {
        label: t.transports.statusLastSeats,
        barClass: 'bg-gradient-to-r from-amber-500 to-rose-500',
        seatFilledClass: 'bg-rose-500 dark:bg-rose-400',
        textClass: 'text-rose-700 dark:text-rose-400',
        surfaceClass: 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-200 dark:border-rose-500/25',
        Icon: Flame,
      };
    }
    if (occupancy >= 55) {
      return {
        label: t.transports.statusFillingFast,
        barClass: 'bg-gradient-to-r from-emerald-500 to-amber-500',
        seatFilledClass: 'bg-amber-500 dark:bg-amber-400',
        textClass: 'text-amber-700 dark:text-amber-400',
        surfaceClass: 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-500/25',
        Icon: TrendingUp,
      };
    }
    return {
      label: t.transports.statusAvailable,
      barClass: 'bg-emerald-500 dark:bg-emerald-400',
      seatFilledClass: 'bg-emerald-500 dark:bg-emerald-400',
      textClass: 'text-emerald-700 dark:text-emerald-400',
      surfaceClass: 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-500/25',
      Icon: CheckCircle2,
    };
  };

  const getVehicleIcon = (type: string) => {
    if (type.includes('Bateau') || type.includes('Pirogue')) {
      return <Ship className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />;
    }
    if (type.includes('4x4')) {
      return <Car className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
    }
    return <Bus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
  };

  const fleetTheme = getOccupancyTheme(fleetStats.avgOccupancy, fleetStats.openSeats);
  const FleetIcon = fleetTheme.Icon;

  return (
    <div className="space-y-5 p-4 sm:p-6 pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CategoryIcon category="navettes" size="md" />
        <div className="min-w-0">
          <h2 className="font-serif-display text-xl sm:text-2xl text-slate-900 dark:text-white font-bold">
            {t.transports.title}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t.transports.subtitle}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {(
          [
            { id: 'ALL', label: t.transports.filterAll },
            { id: 'BUS', label: t.transports.filterBus },
            { id: '4X4', label: t.transports.filter4x4 },
            { id: 'BOAT', label: t.transports.filterBoat },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilterType(f.id)}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
              filterType === f.id
                ? 'copper-gradient text-slate-950 font-bold shadow-sm'
                : 'glass-card border border-white/60 dark:border-white/12 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Live Fleet Occupancy + Rental Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <section className="lg:col-span-7 glass-card border border-white/60 dark:border-white/12 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {t.transports.fleetTitle}
            </span>
            <span className={`font-semibold flex items-center gap-1.5 tabular-nums ${fleetTheme.textClass}`}>
              <FleetIcon className="w-3.5 h-3.5" />
              <span>{fleetStats.avgOccupancy}% {t.transports.seatsBookedLabel}</span>
            </span>
          </div>

          <div className="grid grid-cols-3 divide-x divide-stone-200 dark:divide-white/10">
            <div className="pr-3">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                {t.transports.filterAll}
              </span>
              <strong className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {filteredShuttles.length}
              </strong>
            </div>
            <div className="px-3">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                {t.transports.openSeatsLabel}
              </span>
              <strong className="text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {fleetStats.openSeats}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  /{fleetStats.totalSeats}
                </span>
              </strong>
            </div>
            <div className="pl-3">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                {t.transports.avgOccupancyLabel}
              </span>
              <strong className={`text-lg font-bold font-mono tabular-nums ${fleetTheme.textClass}`}>
                {fleetStats.avgOccupancy}%
              </strong>
            </div>
          </div>

          <div
            role="progressbar"
            aria-label={t.transports.fleetTitle}
            aria-valuenow={fleetStats.avgOccupancy}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full h-2.5 bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${fleetTheme.barClass}`}
              style={{ width: `${Math.min(100, fleetStats.avgOccupancy)}%` }}
            />
          </div>

          <div className="pt-2 border-t border-stone-200/80 dark:border-white/10 flex items-center gap-2.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
              <strong className="text-slate-900 dark:text-white">{t.transports.safetyTitle}</strong>
              {' · '}
              {t.transports.safetyDesc}
            </p>
          </div>
        </section>

        {/* MANGOREMA LOCATION Banner */}
        <div className="lg:col-span-5 glass-card border border-white/60 dark:border-white/12 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <CategoryIcon category="location" size="md" />
            <div className="min-w-0 space-y-1">
              <h4 className="font-serif-display font-bold text-base text-slate-900 dark:text-white">
                {t.transports.rentalTitle}
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {t.transports.rentalDesc}
              </p>
            </div>
          </div>
          {onOpenRental && (
            <button
              type="button"
              onClick={onOpenRental}
              className="w-full min-h-[44px] px-4 py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs whitespace-nowrap active:scale-95 transition"
            >
              {t.transports.rentBtn}
            </button>
          )}
        </div>
      </div>

      {/* Shuttle Cards */}
      {filteredShuttles.length === 0 ? (
        <div className="glass-card border border-white/60 dark:border-white/12 rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t.transports.emptyFilterTitle}
          </p>
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className="min-h-[44px] px-4 py-2 copper-gradient text-slate-950 font-bold rounded-xl text-xs whitespace-nowrap"
          >
            {t.transports.resetFilterBtn}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredShuttles.map((shuttle) => {
            const safeTotal = Math.max(1, shuttle.totalSeats);
            const safeBooked = Math.min(safeTotal, Math.max(0, shuttle.bookedSeats));
            const remaining = Math.max(0, safeTotal - safeBooked);
            const occupancy = Math.round((safeBooked / safeTotal) * 100);
            const theme = getOccupancyTheme(occupancy, remaining);
            const StatusIcon = theme.Icon;

            return (
              <article
                key={shuttle.id}
                className="glass-card border border-white/60 dark:border-white/12 hover:border-amber-500/55 rounded-2xl p-4 space-y-3.5 transition"
              >
                {/* Header (Unboxed metadata kicker + model + price) */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      {getVehicleIcon(shuttle.type)}
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                        {shuttle.type}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums whitespace-nowrap">
                        {shuttle.departureTime} → {shuttle.returnTime}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1 leading-snug">
                      {shuttle.model}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold font-mono tabular-nums text-amber-700 dark:text-amber-400 block">
                      {shuttle.price.toLocaleString('fr-FR')} FCFA
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.transports.perPerson}
                    </span>
                  </div>
                </div>

                {/* Hairline Route Timeline */}
                <div className="border-t border-stone-200/80 dark:border-white/10 pt-3 space-y-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center pt-0.5 shrink-0">
                      <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <div className="w-px h-3.5 bg-stone-300 dark:bg-slate-700 my-0.5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {t.transports.meetingPoint} · {t.transports.departureLabel} {shuttle.departureTime}
                      </span>
                      <strong className="text-slate-900 dark:text-slate-100 font-semibold block truncate">
                        {shuttle.departurePoint}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {t.transports.destinationLabel} · {t.transports.returnLabel} {shuttle.returnTime}
                      </span>
                      <strong className="text-slate-900 dark:text-slate-100 font-semibold block truncate">
                        {shuttle.destination}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Real-Time Occupancy Visual Indicator */}
                <div className={`rounded-xl border p-3 space-y-2.5 ${theme.surfaceClass}`}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={`font-bold flex items-center gap-1.5 ${theme.textClass}`}>
                      <StatusIcon className="w-4 h-4 shrink-0" />
                      <span>{theme.label}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{occupancy}%</span>
                    </span>

                    <span className="font-mono tabular-nums text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                      {safeBooked}/{safeTotal} {t.transports.seatsBookedLabel}
                      <span className="text-slate-400 dark:text-slate-500"> · </span>
                      <span className={theme.textClass}>
                        {remaining} {t.transports.seatsFreeLabel}
                      </span>
                    </span>
                  </div>

                  {/* Colored Progress Bar with Quartile Reference Ticks */}
                  <div
                    role="progressbar"
                    aria-label={`${t.transports.liveOccupancy} ${shuttle.model}`}
                    aria-valuenow={occupancy}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="relative w-full h-3 bg-stone-200/90 dark:bg-slate-800 rounded-full overflow-hidden"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${theme.barClass}`}
                      style={{ width: `${occupancy}%` }}
                    />
                    <div
                      className="pointer-events-none absolute inset-y-0 left-1/4 w-px bg-white/40 dark:bg-slate-950/50"
                      aria-hidden="true"
                    />
                    <div
                      className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/40 dark:bg-slate-950/50"
                      aria-hidden="true"
                    />
                    <div
                      className="pointer-events-none absolute inset-y-0 left-3/4 w-px bg-white/40 dark:bg-slate-950/50"
                      aria-hidden="true"
                    />
                  </div>

                  {/* Individual Seat Occupancy Blocks */}
                  <div
                    className="flex items-center gap-1 pt-0.5"
                    aria-hidden="true"
                    title={`${safeBooked} ${t.transports.seatsBookedLabel} / ${remaining} ${t.transports.seatsFreeLabel}`}
                  >
                    {Array.from({ length: safeTotal }).map((_, idx) => {
                      const isOccupied = idx < safeBooked;
                      return (
                        <span
                          key={idx}
                          className={`h-2 flex-1 rounded-sm transition-colors ${
                            isOccupied
                              ? theme.seatFilledClass
                              : 'glass-surface border border-slate-900/15 dark:border-white/15'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Driver Meta & Thumb-Friendly Actions */}
                <div className="border-t border-slate-900/10 dark:border-white/10 pt-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                      <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span className="truncate">
                        {t.transports.driverLabel} :{' '}
                        <strong className="text-slate-900 dark:text-slate-200">{shuttle.driverName}</strong>
                      </span>
                    </span>
                    <span className="flex items-center gap-1 font-mono tabular-nums text-[11px] shrink-0">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{shuttle.departureTime}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={`tel:${shuttle.driverPhone.replace(/\s+/g, '')}`}
                      className="min-h-[44px] px-2.5 py-2 glass-surface hover:bg-white/75 dark:hover:bg-white/12 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-white/60 dark:border-white/12 whitespace-nowrap"
                      title={`Appeler ${shuttle.driverName} (${shuttle.driverPhone})`}
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="truncate">{t.transports.driverLabel}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        const notif = scheduleShuttleNotification(shuttle);
                        if (onAlertScheduled) {
                          onAlertScheduled(
                            `Alerte H-1 programmée : Rappel à ${notif.alertTimeFormatted} (1h avant départ de ${shuttle.departureTime}).`
                          );
                        }
                      }}
                      className="min-h-[44px] px-2.5 py-2 glass-surface border border-white/60 dark:border-white/12 hover:border-amber-500/45 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 whitespace-nowrap"
                      title="Programmer une alerte Web Notification 1h avant le départ de cette navette"
                    >
                      <BellRing className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="truncate">{t.transports.alertH1}</span>
                    </button>

                    <button
                      type="button"
                      disabled={remaining <= 0}
                      onClick={() => {
                        addShuttleToCart(shuttle, 1);
                        if (onShuttleAddedToCart) {
                          onShuttleAddedToCart(shuttle);
                        }
                      }}
                      className="min-h-[44px] px-2.5 py-2 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 disabled:opacity-45 text-slate-900 dark:text-white border border-stone-200 dark:border-white/10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 whitespace-nowrap"
                      title="Ajouter 1 place au panier unifié"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="truncate">{t.transports.addCartBtn}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenBookingModal(shuttle)}
                    disabled={remaining <= 0}
                    className="w-full min-h-[44px] px-4 py-2.5 copper-gradient disabled:bg-stone-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow active:scale-95 transition whitespace-nowrap"
                  >
                    {remaining > 0
                      ? `${t.transports.reserveBtn} · ${shuttle.price.toLocaleString('fr-FR')} FCFA`
                      : t.transports.statusFull}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
