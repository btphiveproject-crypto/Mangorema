import React from 'react';
import { ExpeditionEvent, ShuttleService, EcoChallengeCompletion, EcoChallengeDefinition } from '../../types';
import { Compass, Bus, ShieldAlert, Sparkles, ArrowRight, MapPin, Calendar, CheckCircle2, Navigation, Tent, Leaf, Recycle } from 'lucide-react';
import { WeatherWidget } from '../WeatherWidget';
import { CategoryIcon } from '../CategoryIcon';
import { ECO_CHALLENGES_CATALOG } from '../../data/ecoChallenges';
import { WeeklyEcoChallengesSection } from '../WeeklyEcoChallengesSection';

interface HomeViewProps {
  events: ExpeditionEvent[];
  shuttles: ShuttleService[];
  ecoChallenges?: EcoChallengeCompletion[];
  ecoPoints?: number;
  onSelectEvent: (event: ExpeditionEvent) => void;
  onOpenShuttles: () => void;
  onOpenGPSTracker: () => void;
  onOpenChecklist: () => void;
  onOpenSOS: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenRental?: () => void;
  onOpenNextEcoChallenge?: () => void;
  onOpenChallengeModal?: (challenge: EcoChallengeDefinition) => void;
  onNotifyBanner?: (title: string, body: string) => void;
  onSyncNotificationsCount?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  events,
  shuttles,
  ecoChallenges = [],
  ecoPoints = 0,
  onSelectEvent,
  onOpenShuttles,
  onOpenGPSTracker,
  onOpenChecklist,
  onOpenSOS,
  onNavigateTab,
  onOpenRental,
  onOpenNextEcoChallenge,
  onOpenChallengeModal,
  onNotifyBanner,
  onSyncNotificationsCount,
}) => {
  const completedCount = new Set(ecoChallenges.map((c) => c.eventId)).size;
  const totalChallenges = ECO_CHALLENGES_CATALOG.length;
  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Hero Banner with Copper Gradient */}
      <div className="rounded-3xl copper-gradient p-5 shadow-2xl relative overflow-hidden text-slate-950">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-slate-950/20 backdrop-blur-md text-amber-950 text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full border border-amber-900/30">
                Super-App Gabon · Écotourisme
              </span>
            </div>
            <h1 className="font-serif-display text-2xl font-black leading-tight text-slate-950">
              Le Gabon se vit en pleine nature.
            </h1>
          </div>
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-amber-950/40 p-0.5 bg-[#080B09] shadow-xl shrink-0 flex items-center justify-center">
            <img
              src="/assets/aistudio/Gemini_Generated_Image_vn51dfvn51dfvn51__1__8a19ee16.jpeg"
              alt="Logo MANGOREMA Pangolin"
              className="w-full h-full object-cover scale-110"
            />
          </div>
        </div>
        <p className="text-xs text-amber-950/90 mt-1 font-medium leading-relaxed">
          Randonnées, navettes 4x4 mutualisées, camping & guides ANPN payables en un clic avec Airtel & Moov Money.
        </p>

        {/* 3 Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-amber-900/20">
          <div className="text-center">
            <span className="font-black text-sm text-slate-950 block">1 420+</span>
            <span className="text-[9px] font-bold text-amber-950/80">Randonneurs</span>
          </div>
          <div className="text-center">
            <span className="font-black text-sm text-slate-950 block">13 Parcs</span>
            <span className="text-[9px] font-bold text-amber-950/80">ANPN Gabon</span>
          </div>
          <div className="text-center">
            <span className="font-black text-sm text-slate-950 block">100%</span>
            <span className="text-[9px] font-bold text-amber-950/80">Mobile Money</span>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onOpenGPSTracker}
          className="bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-white/5 hover:border-amber-500/40 rounded-2xl p-2.5 flex flex-col items-center text-center transition active:scale-95 shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-1">
            <Navigation className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Traceur GPS</span>
        </button>

        <button
          onClick={onOpenShuttles}
          className="bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-white/5 hover:border-amber-500/40 rounded-2xl p-2.5 flex flex-col items-center text-center transition active:scale-95 shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-1">
            <Bus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Navettes</span>
        </button>

        <button
          onClick={onOpenChecklist}
          className="bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-white/5 hover:border-amber-500/40 rounded-2xl p-2.5 flex flex-col items-center text-center transition active:scale-95 shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-1">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Checklist</span>
        </button>

        <button
          onClick={onOpenSOS}
          className="bg-red-50 dark:bg-red-950/40 border border-red-500/40 hover:border-red-500 rounded-2xl p-2.5 flex flex-col items-center text-center transition active:scale-95 shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-700 dark:text-red-400 flex items-center justify-center mb-1">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-red-700 dark:text-red-300">Alerte SOS</span>
        </button>
      </div>

      {/* Suite d'icônes unifiées par catégorie d'activité */}
      <div className="bg-white dark:bg-slate-900/75 border border-stone-200 dark:border-white/10 rounded-3xl p-3.5 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="font-serif-display font-bold text-xs text-slate-900 dark:text-slate-200 tracking-wide">
            Univers d&apos;Activités MANGOREMA
          </h2>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">4 Pôles · Gabon</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('sorties')}
            className="group bg-stone-50 dark:bg-[#0c100e] border border-stone-200 dark:border-white/5 hover:border-amber-500/50 rounded-2xl p-2 flex flex-col items-center text-center transition active:scale-95"
          >
            <CategoryIcon category="expeditions" size="md" className="mb-1.5 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">Expéditions</span>
          </button>
          <button
            type="button"
            onClick={onOpenShuttles}
            className="group bg-stone-50 dark:bg-[#0c100e] border border-stone-200 dark:border-white/5 hover:border-amber-500/50 rounded-2xl p-2 flex flex-col items-center text-center transition active:scale-95"
          >
            <CategoryIcon category="navettes" size="md" className="mb-1.5 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">Navettes</span>
          </button>
          <button
            type="button"
            onClick={onOpenRental}
            className="group bg-stone-50 dark:bg-[#0c100e] border border-stone-200 dark:border-white/5 hover:border-amber-500/50 rounded-2xl p-2 flex flex-col items-center text-center transition active:scale-95"
          >
            <CategoryIcon category="location" size="md" className="mb-1.5 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">Location</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('explorer')}
            className="group bg-stone-50 dark:bg-[#0c100e] border border-stone-200 dark:border-white/5 hover:border-amber-500/50 rounded-2xl p-2 flex flex-col items-center text-center transition active:scale-95"
          >
            <CategoryIcon category="guides" size="md" className="mb-1.5 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">Guides</span>
          </button>
        </div>
      </div>

      {/* Live Weather Widget for Key Gabon Zones */}
      <WeatherWidget />

      {/* Défis Écologiques Zéro Déchet — Accès Rapide */}
      <div className="bg-white dark:bg-slate-900/90 border border-emerald-500/35 rounded-3xl p-4 space-y-3 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white">
                Défis Écologiques Zéro Déchet
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug mt-0.5">
                Validez vos sorties sans laisser de déchets et gagnez des badges virtuels synchronisés Firebase.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 tabular-nums shrink-0">
            {completedCount}/{totalChallenges}
          </span>
        </div>

        <div className="pt-2.5 border-t border-stone-200 dark:border-white/10 flex items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
            <strong className="text-emerald-700 dark:text-emerald-400">{ecoPoints} pts éco</strong> · {completedCount}/{totalChallenges} parcs propres
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('profil')}
              className="min-h-[44px] px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition"
            >
              Badges
            </button>
            {onOpenNextEcoChallenge && (
              <button
                type="button"
                onClick={onOpenNextEcoChallenge}
                className="min-h-[44px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow active:scale-95 transition"
              >
                <Recycle className="w-3.5 h-3.5" />
                <span>Relever</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Défis Écologiques Temporaires (Hebdomadaires + Compte à Rebours & Push) */}
      {onOpenChallengeModal && (
        <WeeklyEcoChallengesSection
          completions={ecoChallenges}
          onOpenChallengeModal={onOpenChallengeModal}
          onNotifyBanner={onNotifyBanner}
          onSyncNotificationsCount={onSyncNotificationsCount}
          compact
          onOpenProfile={() => onNavigateTab('profil')}
        />
      )}

      {/* MANGOREMA LOCATION : Bannière Matériel Outdoor */}
      <div className="bg-gradient-to-r from-white via-amber-50/70 to-white dark:from-slate-900/95 dark:via-amber-950/30 dark:to-slate-900/90 border border-amber-500/35 rounded-3xl p-4 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                MANGOREMA LOCATION
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">✓ Cautions Mobile Money</span>
            </div>
            <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white">
              Location de Matériel Bivouac & Outdoor
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-xs">
              Tentes dôme étanches (&gt;4000mm), sacs 65L, VTT d'expédition et balises satellite Garmin InReach.
            </p>
          </div>

          <CategoryIcon category="location" size="md" />
        </div>

        <div className="pt-3 mt-3 border-t border-stone-200 dark:border-white/10 flex items-center justify-between text-xs">
          <span className="text-[10px] text-slate-600 dark:text-slate-400">
            Retraits : Charbonnages · Batterie 4 · Akanda
          </span>
          <button
            onClick={onOpenRental}
            className="px-3 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow active:scale-95 transition"
          >
            <span>Louer du matériel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Featured Expeditions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CategoryIcon category="expeditions" size="xs" />
            <span>Expéditions Vedettes au Gabon</span>
          </h2>
          <button
            onClick={() => onNavigateTab('sorties')}
            className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <span>Voir tout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {events.slice(0, 3).map((evt) => (
            <div
              key={evt.id}
              className="bg-white dark:bg-slate-900/80 border border-stone-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/40 transition shadow-lg flex flex-col"
            >
              <div className="relative h-40">
                <img
                  src={evt.image}
                  alt={evt.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-950/80 text-amber-400 border border-amber-500/30">
                    {evt.parkName}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                  <div>
                    <h3 className="font-bold text-sm text-white drop-shadow">{evt.title}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" /> {evt.date}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" /> {evt.location}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-amber-400 block drop-shadow">
                      {evt.basePrice === 0 ? 'Gratuit' : `${evt.basePrice.toLocaleString('fr-FR')} F`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between border-t border-stone-200 dark:border-white/5 bg-white dark:bg-[#121614]">
                <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                  Org: <strong className="text-slate-800 dark:text-slate-300">{evt.organizer}</strong>
                </div>
                <button
                  onClick={() => onSelectEvent(evt)}
                  className="px-3.5 py-1.5 copper-gradient text-slate-950 font-extrabold text-xs rounded-xl uppercase tracking-wider shadow active:scale-95 transition"
                >
                  Réserver (Panier)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shuttle Highlights Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-white to-stone-50 dark:from-[#121614] dark:to-slate-900 border border-amber-600/35 dark:border-amber-600/30 p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CategoryIcon category="navettes" size="sm" />
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white">Navettes Mutualisées MANGOREMA</h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">Départs réguliers de Libreville (Charbonnages, Okala, Owendo)</p>
            </div>
          </div>
          <button
            onClick={onOpenShuttles}
            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300"
          >
            Tous les trajets
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {shuttles.slice(0, 2).map((s) => (
            <div
              key={s.id}
              onClick={onOpenShuttles}
              className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-amber-500/40 transition text-xs"
            >
              <div className="min-w-0 pr-2">
                <span className="font-semibold text-slate-900 dark:text-slate-200 block truncate">{s.departurePoint} ➔ {s.destination}</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400">{s.departureTime} · {s.model}</span>
              </div>
              <strong className="text-amber-700 dark:text-amber-400 text-xs shrink-0">{s.price.toLocaleString('fr-FR')} F</strong>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
