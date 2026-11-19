/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { ExpeditionEvent } from '../types';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface ExpeditionCalendarProps {
  events: ExpeditionEvent[];
  selectedPark: string;
  onSelectEvent: (event: ExpeditionEvent) => void;
}

const FRENCH_MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const MONTH_ALIASES: Record<string, number> = {
  jan: 0,
  janv: 0,
  janvier: 0,
  feb: 1,
  fev: 1,
  fevr: 1,
  fevrier: 1,
  mar: 2,
  mars: 2,
  avr: 3,
  avril: 3,
  apr: 3,
  mai: 4,
  may: 4,
  juin: 5,
  jun: 5,
  juil: 6,
  jul: 6,
  juillet: 6,
  aout: 7,
  aou: 7,
  aug: 7,
  sep: 8,
  sept: 8,
  septembre: 8,
  oct: 9,
  octobre: 9,
  nov: 10,
  novembre: 10,
  dec: 11,
  decembre: 11,
};

function normalizeStr(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Parses French expedition date strings ("Samedi 14 Nov 2026", "Samedi 05 Déc 2026")
 * or ISO dates ("2026-11-14") into a YYYY-MM-DD key.
 */
export function parseExpeditionDateKey(dateStr: string): string | null {
  if (!dateStr) return null;

  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const normalized = normalizeStr(dateStr).replace(/\./g, ' ');
  const tokens = normalized.split(/\s+/).filter(Boolean);

  let day: number | null = null;
  let monthIdx: number | null = null;
  let year: number | null = null;

  for (const token of tokens) {
    if (/^\d{4}$/.test(token)) {
      year = parseInt(token, 10);
    } else if (/^\d{1,2}$/.test(token) && day === null) {
      const parsedDay = parseInt(token, 10);
      if (parsedDay >= 1 && parsedDay <= 31) {
        day = parsedDay;
      }
    } else if (MONTH_ALIASES[token] !== undefined) {
      monthIdx = MONTH_ALIASES[token];
    }
  }

  if (day !== null && monthIdx !== null) {
    const resolvedYear = year ?? 2026;
    const mm = String(monthIdx + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${resolvedYear}-${mm}-${dd}`;
  }

  return null;
}

function matchesParkFilter(evt: ExpeditionEvent, selectedPark: string): boolean {
  if (selectedPark === 'all') return true;
  const target = `${evt.parkName} ${evt.location}`.toLowerCase();
  if (selectedPark === 'mondah') return target.includes('mondah');
  if (selectedPark === 'ivindo') return target.includes('ivindo');
  if (selectedPark === 'denis') return target.includes('pongara') || target.includes('nyoni');
  return true;
}

export const ExpeditionCalendar: React.FC<ExpeditionCalendarProps> = ({
  events,
  selectedPark,
  onSelectEvent,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(10); // Novembre 2026 (0-indexed)
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const filteredEvents = useMemo(
    () => events.filter((e) => matchesParkFilter(e, selectedPark)),
    [events, selectedPark]
  );

  // Map YYYY-MM-DD -> ExpeditionEvent[]
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ExpeditionEvent[]>();
    for (const evt of filteredEvents) {
      const key = parseExpeditionDateKey(evt.date);
      if (!key) continue;
      const existing = map.get(key) || [];
      existing.push(evt);
      map.set(key, existing);
    }
    return map;
  }, [filteredEvents]);

  // All available dates in currently displayed month sorted chronologically
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-`;
  const monthEventDates = useMemo(() => {
    return Array.from(eventsByDate.keys())
      .filter((k) => k.startsWith(monthPrefix))
      .sort();
  }, [eventsByDate, monthPrefix]);

  // Keep selectedDateKey synced when switching parks or months
  useEffect(() => {
    if (selectedDateKey && eventsByDate.has(selectedDateKey)) {
      return;
    }
    if (monthEventDates.length > 0) {
      const upcoming = monthEventDates.find((d) => d >= todayKey) || monthEventDates[0];
      setSelectedDateKey(upcoming);
    } else {
      setSelectedDateKey(null);
    }
  }, [selectedPark, viewYear, viewMonth, monthEventDates, eventsByDate, selectedDateKey, todayKey]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleResetMonth = () => {
    setViewYear(2026);
    setViewMonth(10);
  };

  // Build Monday-first calendar cells for (viewYear, viewMonth)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Convert Sunday (0) .. Saturday (6) -> Monday (0) .. Sunday (6)
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const cells: Array<{ day: number | null; dateKey: string | null }> = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, dateKey: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(
        2,
        '0'
      )}`;
      cells.push({ day: d, dateKey });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateKey: null });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const selectedDayEvents = selectedDateKey ? eventsByDate.get(selectedDateKey) || [] : [];

  const totalMonthExpeditions = monthEventDates.reduce(
    (sum, k) => sum + (eventsByDate.get(k)?.length || 0),
    0
  );

  return (
    <section
      aria-label="Calendrier mensuel des disponibilités d'expéditions"
      className="bg-white dark:bg-slate-900/90 border border-amber-500/35 dark:border-amber-500/25 rounded-3xl p-4 space-y-3.5 shadow-lg dark:shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <CategoryIcon category="expeditions" size="sm" />
          <div className="min-w-0">
            <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white truncate">
              Calendrier des Disponibilités
            </h3>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              {totalMonthExpeditions > 0
                ? `${totalMonthExpeditions} départ(s) disponible(s) en ${FRENCH_MONTHS[viewMonth]}`
                : `Aucun départ prévu en ${FRENCH_MONTHS[viewMonth]}`}
            </p>
          </div>
        </div>

        {(viewYear !== 2026 || viewMonth !== 10) && (
          <button
            type="button"
            onClick={handleResetMonth}
            className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 text-[10px] font-semibold text-amber-700 dark:text-amber-400 transition shrink-0"
          >
            Nov 2026
          </button>
        )}
      </div>

      {/* Month Switcher */}
      <div className="flex items-center justify-between bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/5 rounded-2xl px-2 py-1.5">
        <button
          type="button"
          onClick={handlePrevMonth}
          aria-label="Mois précédent"
          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center transition active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="font-serif-display font-bold text-sm text-slate-900 dark:text-white tracking-wide">
            {FRENCH_MONTHS[viewMonth]} {viewYear}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          aria-label="Mois suivant"
          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center transition active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((dayName) => (
          <span
            key={dayName}
            className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-1"
          >
            {dayName}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarCells.map((cell, idx) => {
          if (!cell.day || !cell.dateKey) {
            return <div key={`empty-${idx}`} className="aspect-square rounded-xl bg-stone-100/60 dark:bg-slate-950/25" />;
          }

          const dayEvents = eventsByDate.get(cell.dateKey) || [];
          const hasExpedition = dayEvents.length > 0;
          const isSelected = selectedDateKey === cell.dateKey;
          const isToday = cell.dateKey === todayKey;
          const isFree = dayEvents.some((e) => e.basePrice === 0);

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => setSelectedDateKey(cell.dateKey)}
              aria-label={`${cell.day} ${FRENCH_MONTHS[viewMonth]} ${viewYear}${
                hasExpedition ? ` - ${dayEvents.length} expédition disponible` : ''
              }`}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all text-xs tabular-nums ${
                isSelected
                  ? 'copper-gradient text-slate-950 font-black shadow-lg scale-[1.03]'
                  : hasExpedition
                  ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-500/60 text-amber-800 dark:text-amber-200 font-bold hover:border-amber-500 dark:hover:border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer'
                  : isToday
                  ? 'bg-emerald-50 dark:bg-slate-800/80 border border-emerald-500/50 text-emerald-900 dark:text-white font-semibold hover:border-emerald-600 dark:hover:border-white/30'
                  : 'bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-stone-300 dark:hover:border-white/15'
              }`}
            >
              <span>{cell.day}</span>
              {hasExpedition && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isSelected
                      ? 'bg-slate-950'
                      : isFree
                      ? 'bg-emerald-600 dark:bg-emerald-400'
                      : 'bg-amber-600 dark:bg-amber-400'
                  }`}
                />
              )}
              {isToday && !hasExpedition && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Compact Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600 dark:text-slate-400 pt-1 border-t border-stone-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span>Départ disponible</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span>Éco-volontariat / Aujourd&apos;hui</span>
          </span>
        </div>
        {monthEventDates.length === 0 && (
          <button
            type="button"
            onClick={() => {
              // Jump to Décembre 2026 if Nov has none (or vice versa)
              if (viewYear === 2026 && viewMonth === 10) {
                setViewMonth(11);
              } else {
                handleResetMonth();
              }
            }}
            className="text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Voir mois avec départs</span>
          </button>
        )}
      </div>

      {/* Selected Day Expedition Details */}
      {selectedDateKey && (
        <div className="pt-1 space-y-2">
          {selectedDayEvents.length > 0 ? (
            selectedDayEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-stone-50 dark:bg-slate-950/85 border border-amber-500/40 dark:border-amber-500/35 rounded-2xl p-3 space-y-2.5 animate-in fade-in"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block truncate">
                      {evt.date} · {evt.parkName}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate mt-0.5">{evt.title}</h4>
                  </div>
                  <span className="text-xs font-black font-mono text-amber-700 dark:text-amber-400 shrink-0 tabular-nums">
                    {evt.basePrice === 0 ? 'Gratuit' : `${evt.basePrice.toLocaleString('fr-FR')} F`}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-500 shrink-0" />
                      {evt.location}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      {evt.duration}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectEvent(evt)}
                    className="px-3 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-[11px] flex items-center gap-1 shrink-0 shadow active:scale-95 transition whitespace-nowrap"
                  >
                    <span>Réserver</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-white/5 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-[11px] truncate">
                  Aucune expédition groupée le {selectedDateKey.split('-').reverse().join('/')}.
                </span>
              </div>
              {monthEventDates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDateKey(monthEventDates[0])}
                  className="text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-bold shrink-0 whitespace-nowrap"
                >
                  Prochain départ →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
