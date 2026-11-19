import React, { useState } from 'react';
import { ExpeditionEvent, EcoChallengeCompletion } from '../../types';
import { Calendar, Users, ArrowUpRight, Leaf, CheckCircle2 } from 'lucide-react';
import { CategoryIcon } from '../CategoryIcon';
import { getEcoChallengeByEventId } from '../../data/ecoChallenges';

interface SortiesViewProps {
  events: ExpeditionEvent[];
  ecoChallenges?: EcoChallengeCompletion[];
  onSelectEvent: (event: ExpeditionEvent) => void;
  onOpenEcoChallenge?: (event: ExpeditionEvent) => void;
}

export const SortiesView: React.FC<SortiesViewProps> = ({
  events,
  ecoChallenges = [],
  onSelectEvent,
  onOpenEcoChallenge,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { id: 'ALL', label: 'Toutes les Sorties' },
    { id: 'PUBLIC', label: 'Rando Publique' },
    { id: 'PRIVATE', label: 'Expé Privée' },
    { id: 'INSTITUTIONAL', label: 'Éco-Volontariat' },
  ];

  const filteredEvents = events.filter((e) => {
    if (selectedCategory === 'ALL') return true;
    return e.category === selectedCategory;
  });

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Title */}
      <div className="flex items-center gap-3">
        <CategoryIcon category="expeditions" size="md" />
        <div>
          <h2 className="font-serif-display text-xl text-slate-900 dark:text-white font-bold">
            Calendrier des Expéditions au Gabon
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Bivouacs encadrés par des écoguides et clubs certifiés</p>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === c.id
                ? 'bg-amber-600 text-slate-950 font-bold shadow-md'
                : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className="bg-white dark:bg-slate-900/80 border border-stone-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/40 transition shadow-xl"
          >
            {/* Header Image */}
            <div className="relative h-44">
              <img
                src={evt.image}
                alt={evt.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                    evt.category === 'PUBLIC'
                      ? 'bg-amber-600 text-slate-950'
                      : evt.category === 'PRIVATE'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {evt.category}
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-white/10">
                  {evt.difficulty}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold block">{evt.parkName}</span>
                  <h3 className="font-bold text-base text-white">{evt.title}</h3>
                </div>
                <div className="bg-slate-950/90 border border-amber-500/30 px-3 py-1 rounded-xl text-right">
                  <span className="text-xs font-extrabold text-amber-400">
                    {evt.basePrice === 0 ? 'Gratuit' : `${evt.basePrice.toLocaleString('fr-FR')} F`}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="p-4 space-y-3 bg-white dark:bg-[#121614]">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{evt.description}</p>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-stone-200 dark:border-white/5 text-center text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block">Distance</span>
                  <strong className="text-slate-900 dark:text-slate-200">{evt.distance}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block">Dénivelé</span>
                  <strong className="text-emerald-700 dark:text-emerald-400">{evt.elevation}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block">Durée</span>
                  <strong className="text-amber-700 dark:text-amber-400">{evt.duration}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1 truncate max-w-[180px]">
                  <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" /> {evt.organizer}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" /> {evt.date}
                </span>
              </div>

              <button
                onClick={() => onSelectEvent(evt)}
                className="w-full min-h-[44px] py-3 copper-gradient hover:opacity-95 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20 dark:shadow-amber-950/40 active:scale-95 transition"
              >
                <span>Pass Expédition (Panier Multi-Services)</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              {(() => {
                const ecoChallenge = getEcoChallengeByEventId(evt.id);
                if (!ecoChallenge || !onOpenEcoChallenge) return null;
                const isDone = ecoChallenges.some((c) => c.eventId === evt.id);

                return (
                  <button
                    type="button"
                    onClick={() => onOpenEcoChallenge(evt)}
                    className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition active:scale-95 ${
                      isDone
                        ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                        : 'bg-stone-50 dark:bg-slate-950/70 border-stone-200 dark:border-white/10 hover:border-emerald-500/50 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{ecoChallenge.badge.icon}</span>
                      <span className="truncate">
                        {isDone
                          ? `Badge obtenu : ${ecoChallenge.badge.name}`
                          : `Défi Zéro Déchet · Badge ${ecoChallenge.badge.name}`}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono shrink-0 tabular-nums">
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
        ))}
      </div>
    </div>
  );
};
