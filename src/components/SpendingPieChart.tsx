/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Booking } from '../types';
import { PieChart as PieChartIcon, Wallet } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface SpendingCategory {
  id: 'expeditions' | 'navettes' | 'location' | 'guides';
  label: string;
  amount: number;
  color: string;
  dotClass: string;
  textClass: string;
  icon: React.ReactNode;
}

interface SpendingPieChartProps {
  bookings: Booking[];
}

export function computeSpendingBreakdown(bookings: Booking[]): {
  categories: SpendingCategory[];
  totalSpent: number;
} {
  let expeditions = 0;
  let navettes = 0;
  let location = 0;
  let guides = 0;

  for (const b of bookings) {
    const amount = Math.max(0, Number(b.totalAmount) || 0);
    const seed = b.qrCodeSeed || '';
    const title = b.eventTitle || '';

    if (seed.startsWith('MANGOREMA-EXPERT:') || title.startsWith('Guide :')) {
      guides += amount;
    } else if (seed.startsWith('MANGOREMA-RENTAL:') || title.startsWith('Location :')) {
      location += amount;
    } else if (seed.startsWith('MANGOREMA-SHUTTLE:') || title.startsWith('Navette')) {
      navettes += amount;
    } else {
      // Expédition multi-services : ventilation des options incluses + tarif de base expédition
      let remaining = amount;
      if (b.shuttleIncluded && remaining > 0) {
        const fee = Math.min(remaining, 5000);
        navettes += fee;
        remaining -= fee;
      }
      if (b.tentIncluded && remaining > 0) {
        const fee = Math.min(remaining, 3000);
        location += fee;
        remaining -= fee;
      }
      if (b.guideIncluded && remaining > 0) {
        const fee = Math.min(remaining, 2500);
        guides += fee;
        remaining -= fee;
      }
      expeditions += remaining;
    }
  }

  const categories: SpendingCategory[] = [
    {
      id: 'expeditions',
      label: 'Expéditions',
      amount: expeditions,
      color: '#f59e0b',
      dotClass: 'bg-amber-500',
      textClass: 'text-amber-400',
      icon: <CategoryIcon category="expeditions" size="xs" />,
    },
    {
      id: 'navettes',
      label: 'Navettes',
      amount: navettes,
      color: '#10b981',
      dotClass: 'bg-emerald-500',
      textClass: 'text-emerald-400',
      icon: <CategoryIcon category="navettes" size="xs" />,
    },
    {
      id: 'location',
      label: 'Location',
      amount: location,
      color: '#38bdf8',
      dotClass: 'bg-sky-400',
      textClass: 'text-sky-400',
      icon: <CategoryIcon category="location" size="xs" />,
    },
    {
      id: 'guides',
      label: 'Guides',
      amount: guides,
      color: '#ea580c',
      dotClass: 'bg-orange-600',
      textClass: 'text-orange-400',
      icon: <CategoryIcon category="guides" size="xs" />,
    },
  ];

  const totalSpent = expeditions + navettes + location + guides;
  return { categories, totalSpent };
}

export const SpendingPieChart: React.FC<SpendingPieChartProps> = ({ bookings }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const { categories, totalSpent } = useMemo(
    () => computeSpendingBreakdown(bookings),
    [bookings]
  );

  // Filter non-zero categories for D3 pie arc layout
  const chartData = useMemo(
    () => categories.filter((c) => c.amount > 0),
    [categories]
  );

  const size = 180;
  const radius = size / 2;
  const innerRadius = 52;
  const outerRadius = 76;

  const arcs = useMemo(() => {
    const pieGenerator = d3
      .pie<SpendingCategory>()
      .value((d) => d.amount)
      .sort(null)
      .padAngle(0.035);

    return pieGenerator(chartData);
  }, [chartData]);

  const activeCategory = categories.find((c) => c.id === activeId) || null;

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-amber-500/35 dark:border-amber-500/30 rounded-3xl p-4 space-y-3.5 shadow-lg relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white">
              Répartition des Dépenses (D3.js)
            </h3>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Navettes, Guides, Location matériel & Expéditions
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-400 bg-amber-500/15 dark:bg-amber-500/10 border border-amber-500/35 dark:border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
          {bookings.length} op.
        </span>
      </div>

      {totalSpent === 0 ? (
        <div className="bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/5 rounded-2xl p-5 text-center space-y-1.5">
          <Wallet className="w-7 h-7 text-slate-400 dark:text-slate-600 mx-auto" />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Aucune dépense enregistrée pour le moment.
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-stone-50 dark:bg-slate-950/65 border border-stone-200 dark:border-white/5 rounded-2xl p-3.5">
          {/* Interactive D3.js SVG Donut Chart */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="overflow-visible select-none"
              role="img"
              aria-label="Graphique à secteurs des dépenses par catégorie"
            >
              <g transform={`translate(${radius}, ${radius})`}>
                {arcs.map((arcDatum) => {
                  const isActive = activeId === arcDatum.data.id;
                  const arcGen = d3
                    .arc<d3.PieArcDatum<SpendingCategory>>()
                    .innerRadius(innerRadius)
                    .outerRadius(isActive ? outerRadius + 6 : outerRadius)
                    .cornerRadius(5);

                  const pathData = arcGen(arcDatum) || undefined;
                  const pct = Math.round((arcDatum.data.amount / totalSpent) * 100);

                  return (
                    <path
                      key={arcDatum.data.id}
                      d={pathData}
                      fill={arcDatum.data.color}
                      strokeWidth={2}
                      opacity={activeId && !isActive ? 0.45 : 1}
                      className="cursor-pointer transition-all duration-200 stroke-stone-50 dark:stroke-[#0c100e]"
                      onMouseEnter={() => setActiveId(arcDatum.data.id)}
                      onMouseLeave={() => setActiveId(null)}
                      onClick={() =>
                        setActiveId((prev) =>
                          prev === arcDatum.data.id ? null : arcDatum.data.id
                        )
                      }
                    >
                      <title>
                        {`${arcDatum.data.label}: ${arcDatum.data.amount.toLocaleString('fr-FR')} FCFA (${pct}%)`}
                      </title>
                    </path>
                  );
                })}
              </g>
            </svg>

            {/* Center Donut Metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
              {activeCategory ? (
                <>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-600 dark:text-slate-400">
                    {activeCategory.label}
                  </span>
                  <span className="text-sm font-black font-mono text-amber-700 dark:text-amber-400">
                    {activeCategory.amount.toLocaleString('fr-FR')} F
                  </span>
                  <span className="text-[10px] font-bold text-slate-900 dark:text-white">
                    {Math.round((activeCategory.amount / totalSpent) * 100)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-600 dark:text-slate-400">
                    Total Dépensé
                  </span>
                  <span className="text-sm font-black font-mono text-amber-700 dark:text-amber-400">
                    {totalSpent.toLocaleString('fr-FR')} F
                  </span>
                  <span className="text-[9px] text-slate-600 dark:text-slate-400">FCFA</span>
                </>
              )}
            </div>
          </div>

          {/* 4-Category Interactive Breakdown Legend */}
          <div className="flex-1 w-full grid grid-cols-1 gap-2">
            {categories.map((cat) => {
              const pct = totalSpent > 0 ? Math.round((cat.amount / totalSpent) * 100) : 0;
              const isSelected = activeId === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => cat.amount > 0 && setActiveId(cat.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onClick={() =>
                    cat.amount > 0 &&
                    setActiveId((prev) => (prev === cat.id ? null : cat.id))
                  }
                  className={`w-full text-left p-2 rounded-xl border transition ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-amber-500/60 dark:border-amber-500/50 shadow-md'
                      : 'bg-white/80 dark:bg-slate-900/50 border-stone-200 dark:border-white/5 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cat.dotClass}`} />
                      {cat.icon}
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{cat.label}</span>
                    </div>
                    <div className="text-right shrink-0 font-mono">
                      <strong className="text-slate-900 dark:text-white text-[11px]">
                        {cat.amount.toLocaleString('fr-FR')} F
                      </strong>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 ml-1">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
