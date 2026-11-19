import React, { useState } from 'react';
import { ExpeditionEvent, ExpertGuide, ExpeditionPhoto, ExpeditionReview } from '../../types';
import { ExplorerMap } from '../ExplorerMap';
import { MapsGroundingPanel } from '../GroundingPanels';
import { Compass, Navigation, MapPin, TreePine, Eye, ShieldCheck, Sparkles, UserCheck, Star, Calendar, MessageSquare, Phone, CheckCircle2, ChevronRight } from 'lucide-react';
import { CategoryIcon } from '../CategoryIcon';
import { ExpeditionCalendar } from '../ExpeditionCalendar';
import { ExpeditionReviewsSection } from '../ExpeditionReviewsSection';

interface ExplorerViewProps {
  events: ExpeditionEvent[];
  experts?: ExpertGuide[];
  photos?: ExpeditionPhoto[];
  reviews?: ExpeditionReview[];
  authUser?: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  onSelectEvent: (event: ExpeditionEvent) => void;
  onOpenGPSTracker: () => void;
  onBookExpert?: (expert: ExpertGuide) => void;
  onSignInGoogle?: () => void;
  onAddReview?: (payload: {
    eventId: string;
    rating: number;
    comment: string;
    photoUrl?: string;
  }) => Promise<void>;
  onDeleteReview?: (reviewId: string) => Promise<void>;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  events,
  experts = [],
  photos = [],
  reviews = [],
  authUser,
  onSelectEvent,
  onOpenGPSTracker,
  onBookExpert,
  onSignInGoogle,
  onAddReview,
  onDeleteReview,
}) => {
  const [selectedPark, setSelectedPark] = useState<string>('all');
  const [selectedExpertDomain, setSelectedExpertDomain] = useState<string>('all');

  const parksFilter = [
    { id: 'all', label: '🗺️ Tous les Parcs' },
    { id: 'mondah', label: '🌿 Mondah (Cap)' },
    { id: 'ivindo', label: '🌊 Ivindo (Djidji)' },
    { id: 'denis', label: '🏖️ Pointe Denis' },
  ];

  const expertDomains = [
    { id: 'all', label: 'Tous les experts' },
    { id: 'Pistage', label: '🐘 Pistage Éléphants' },
    { id: 'Botanique', label: '🌿 Botanique' },
    { id: 'Ornithologie', label: '🦅 Ornithologie' },
    { id: 'Photo', label: '📷 Safari Photo' },
  ];

  const filteredExperts = experts.filter((exp) => {
    if (selectedExpertDomain === 'all') return true;
    return exp.expertiseTags.some((tag) =>
      tag.toLowerCase().includes(selectedExpertDomain.toLowerCase())
    );
  });

  const protectedSites = [
    {
      title: 'Parc National de la Mondah',
      region: 'Estuaire · Cap Estérias',
      desc: 'Forêt littorale ancienne abritant des okoumés centenaires, essences rares (Ozigo, Bilinga) et sentier botanique équipé de balises ANPN.',
      fauna: 'Pangolin géant, cercopithèques, calaos à casque jaune',
      parkId: 'mondah',
    },
    {
      title: 'Parc National de l\'Ivindo',
      region: 'Ogooué-Ivindo · Makokou',
      desc: 'Joyau du patrimoine mondial de l\'UNESCO avec les chutes de Kongou et Djidji. Forêt primaire équatoriale vierge traversée par des baïs sauvages.',
      fauna: 'Éléphants de forêt d\'Afrique, gorilles des plaines de l\'Ouest, chimpanzés',
      parkId: 'ivindo',
    },
    {
      title: 'Parc National de Pongara & Nyonié',
      region: 'Komo-Océan · Rive Sud',
      desc: 'Plages sauvages atlantiques, mangroves côtières et savanes herbeuses où les éléphants viennent se promener sur le sable fin.',
      fauna: 'Tortues luth géantes en nidification, buffles de forêt, dauphins à bosse',
      parkId: 'denis',
    },
  ];

  return (
    <div className="space-y-5 p-4 pb-24">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif-display text-xl text-slate-900 dark:text-white font-bold flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            Cartographie des Sentiers & Parcs
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Tracés GPS réels, balisages ANPN & géolocalisation</p>
        </div>
        <button
          onClick={onOpenGPSTracker}
          className="px-3 py-1.5 copper-gradient text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow active:scale-95 transition"
        >
          <Navigation className="w-3.5 h-3.5 fill-current" />
          <span>Traceur</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
        {parksFilter.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedPark(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedPark === f.id
                ? 'bg-amber-600 text-slate-950 font-bold shadow-md'
                : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Interactive Leaflet Map */}
      <ExplorerMap
        events={events}
        selectedPark={selectedPark}
        onSelectEvent={onSelectEvent}
      />

      {/* Live GPS Trail Tracking Card */}
      <div className="bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">Chronomètre & Ordinateur Sentier</h4>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">Mesure la distance, le dénivelé et votre allure en forêt</p>
          </div>
        </div>
        <button
          onClick={onOpenGPSTracker}
          className="px-3 py-2 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 font-bold text-xs rounded-xl border border-amber-500/35 dark:border-amber-500/30 transition active:scale-95"
        >
          Ouvrir
        </button>
      </div>

      {/* Monthly Interactive Expedition Availability Calendar */}
      <ExpeditionCalendar
        events={events}
        selectedPark={selectedPark}
        onSelectEvent={onSelectEvent}
      />

      {/* Google Maps Grounding Assistant */}
      <MapsGroundingPanel selectedPark={selectedPark} />

      {/* SECTION 3.5 : ANNUAIRE DES EXPERTS & ÉCOGUIDES VÉRIFIÉS ANPN */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <CategoryIcon category="guides" size="md" />
            <div className="min-w-0">
              <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white truncate">
                Experts & Guides Naturalistes ANPN ({filteredExperts.length})
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">
                Pisteurs d'élite, botanistes et photographes animaliers agréés pour expéditions privées
              </p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-full shrink-0">
            ✓ 100% Agréés
          </span>
        </div>

        {/* Domain filter tags */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {expertDomains.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedExpertDomain(d.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                selectedExpertDomain === d.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Experts List Cards */}
        <div className="space-y-3">
          {filteredExperts.map((expert) => (
            <div
              key={expert.id}
              className="bg-white dark:bg-slate-900/90 border border-amber-500/30 dark:border-amber-500/25 rounded-2xl p-4 space-y-3 hover:border-amber-500/50 transition shadow-lg relative overflow-hidden"
            >
              {/* Top Header Profile */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={expert.photo}
                      alt={expert.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/60 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 text-slate-950 flex items-center justify-center text-[10px] font-black shadow">
                      ✓
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{expert.name}</h4>
                      <span className="text-[9px] text-emerald-800 dark:text-emerald-300 font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/35 px-1.5 py-0.2 rounded">
                        {expert.anpnLicense}
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">{expert.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" /> {expert.rating}
                      </span>
                      <span>({expert.reviewsCount} avis)</span>
                      <span>·</span>
                      <span className="text-slate-700 dark:text-slate-300">Langues : {expert.languages.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-black text-amber-700 dark:text-amber-400 font-mono block">
                    {expert.dayRate.toLocaleString('fr-FR')} F
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block">/ jour</span>
                </div>
              </div>

              {/* Bio summary */}
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-stone-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-stone-200 dark:border-white/5">
                {expert.bio}
              </p>

              {/* Expertise tags */}
              <div className="flex flex-wrap gap-1.5">
                {expert.expertiseTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-500/35 px-2 py-0.5 rounded-md font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Availability Note & Booking CTA */}
              <div className="pt-2 border-t border-stone-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-semibold">{expert.availabilityNote}</span>
                </div>

                <button
                  onClick={() => onBookExpert && onBookExpert(expert)}
                  className="px-3.5 py-2 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow active:scale-95 transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Réserver ce Guide</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Avis & Photos par Expédition (Firestore) */}
      {onAddReview && onDeleteReview && (
        <ExpeditionReviewsSection
          events={events}
          photos={photos}
          reviews={reviews}
          selectedPark={selectedPark}
          authUser={authUser}
          onSignInGoogle={onSignInGoogle}
          onAddReview={onAddReview}
          onDeleteReview={onDeleteReview}
        />
      )}

      {/* Protected Sites Guide */}
      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
          <TreePine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Fiches Biodiversité & Réglementation ANPN
        </h3>

        <div className="space-y-3">
          {protectedSites.map((site, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-900/70 border border-stone-200 dark:border-white/5 rounded-2xl p-4 space-y-2 hover:border-amber-500/35 transition shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                    {site.region}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{site.title}</h4>
                </div>
                <button
                  onClick={() => setSelectedPark(site.parkId)}
                  className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-semibold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Voir carte
                </button>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{site.desc}</p>

              <div className="pt-2 border-t border-stone-200 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  🐘 <strong>Faune :</strong> {site.fauna}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

