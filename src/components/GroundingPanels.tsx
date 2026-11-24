/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MapPin,
  Search,
  ExternalLink,
  Navigation,
  Sparkles,
  Loader2,
  AlertCircle,
  Globe,
  Compass,
  Quote,
} from 'lucide-react';
import { sanitizeSafeHttpUrl } from '../utils/urlSecurity';

interface MapPlace {
  title: string;
  uri: string;
  placeId?: string;
  reviewSnippets: string[];
}

interface WebSource {
  title: string;
  uri: string;
}

const PARK_COORDS: Record<string, { name: string; lat: number; lng: number }> = {
  all: { name: 'Libreville & Estuaire', lat: 0.4162, lng: 9.4673 },
  mondah: { name: 'Parc National de la Mondah', lat: 0.5833, lng: 9.35 },
  ivindo: { name: "Parc National de l'Ivindo", lat: 0.5167, lng: 12.7833 },
  denis: { name: 'Parc National de Pongara & Pointe Denis', lat: 0.0333, lng: 9.3167 },
};

/**
 * Clean lightweight formatter for grounded Markdown snippets (bold & bullets)
 */
function FormattedGroundingText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
        const content = isBullet ? trimmed.slice(2) : trimmed;

        // Render **bold** inline segments cleanly
        const parts = content.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={j} className="text-amber-700 dark:text-amber-300 font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{part}</span>;
        });

        if (isBullet) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
              <span className="flex-1">{rendered}</span>
            </div>
          );
        }

        return (
          <p key={i} className="text-slate-700 dark:text-slate-200">
            {rendered}
          </p>
        );
      })}
    </div>
  );
}

// =========================================================================
// 1. GOOGLE MAPS GROUNDING PANEL (ExplorerView)
// =========================================================================
export const MapsGroundingPanel: React.FC<{ selectedPark?: string }> = ({
  selectedPark = 'mondah',
}) => {
  const activePark = PARK_COORDS[selectedPark] || PARK_COORDS.mondah;
  const [query, setQuery] = useState('');
  const [useMyGPS, setUseMyGPS] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ text: string; places: MapPlace[] } | null>(null);

  const quickQueries = [
    `Écolodges et hébergements près de ${activePark.name}`,
    `Stations-service et ravitaillement vers ${activePark.name}`,
    `Restaurants et points d'eau près du Cap Estérias / Libreville Nord`,
    `Embarcadères et accès bateau pour Pointe Denis / Pongara`,
  ];

  const handleToggleGPS = () => {
    if (useMyGPS) {
      setUseMyGPS(false);
      return;
    }
    if (!navigator.geolocation) {
      setError('Géolocalisation non disponible sur cet appareil.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUseMyGPS(true);
        setError(null);
      },
      () => {
        setError("Position GPS refusée. Utilisation des coordonnées du parc sélectionné.");
        setUseMyGPS(false);
      },
      { timeout: 6000 }
    );
  };

  const runMapsQuery = async (customQuery?: string) => {
    const q = (customQuery ?? query).trim();
    if (!q) return;
    if (customQuery) setQuery(customQuery);

    setIsLoading(true);
    setError(null);

    const coords = useMyGPS && gpsCoords ? gpsCoords : { lat: activePark.lat, lng: activePark.lng };

    try {
      const res = await fetch('/api/grounding/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          latitude: coords.lat,
          longitude: coords.lng,
          zoneName: useMyGPS ? 'Ma position GPS actuelle' : activePark.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur serveur Google Maps Grounding');
      }
      setResult({
        text: data.text,
        places: Array.isArray(data.places) ? data.places : [],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche Google Maps.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-amber-50/35 to-stone-50 dark:from-slate-900/95 dark:via-[#131915] dark:to-slate-900/90 border border-amber-500/40 dark:border-amber-500/35 rounded-3xl p-4 space-y-3 shadow-lg dark:shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl copper-gradient text-slate-950 flex items-center justify-center shadow-md shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white">
                Points d'Intérêt & Accès (Google Maps)
              </h3>
              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">
                Maps Grounding
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Lieux vérifiés en direct autour de : <strong className="text-amber-700 dark:text-amber-300">{useMyGPS ? 'Ma position GPS' : activePark.name}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleGPS}
          type="button"
          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 border transition shrink-0 ${
            useMyGPS
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500/50 text-emerald-800 dark:text-emerald-300'
              : 'bg-stone-100 dark:bg-slate-950 border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-amber-500/40'
          }`}
          title="Utiliser votre géolocalisation GPS réelle"
        >
          <Navigation className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>{useMyGPS ? 'GPS Actif' : 'Mon GPS'}</span>
        </button>
      </div>

      {/* Quick Chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {quickQueries.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => runMapsQuery(chip)}
            disabled={isLoading}
            className="px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 text-[10.5px] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white whitespace-nowrap transition shrink-0 disabled:opacity-50"
          >
            📍 {chip.split(' près')[0].split(' vers')[0]}
          </button>
        ))}
      </div>

      {/* Search Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runMapsQuery();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: pharmacie, embarcadère, écolodge près de la Mondah..."
          className="flex-1 bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-white/15 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-3.5 py-2 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow active:scale-95 transition disabled:opacity-50 shrink-0"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
          <span>Explorer</span>
        </button>
      </form>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-500/40 rounded-xl p-2.5 flex items-center gap-2 text-xs text-red-800 dark:text-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span className="text-[11px]">{error}</span>
        </div>
      )}

      {result && (
        <div className="bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 space-y-3 animate-in fade-in">
          <FormattedGroundingText text={result.text} />

          {/* Mandatory Google Maps Grounding Links */}
          {result.places.length > 0 && (
            <div className="pt-2.5 border-t border-stone-200 dark:border-white/10 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Lieux & Liens Google Maps vérifiés ({result.places.length})
              </span>
              <div className="space-y-2">
                {result.places.map((place, idx) => {
                  const safeUri = sanitizeSafeHttpUrl(place.uri);
                  const cardContent = (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 truncate">
                          {place.title}
                        </span>
                        {safeUri && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1 shrink-0">
                            <span>Ouvrir Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      {place.reviewSnippets.length > 0 && (
                        <p className="text-[10.5px] text-slate-600 dark:text-slate-400 mt-1 flex items-start gap-1.5 line-clamp-2">
                          <Quote className="w-3 h-3 text-amber-600 dark:text-amber-500/70 shrink-0 mt-0.5" />
                          <span>{place.reviewSnippets[0]}</span>
                        </p>
                      )}
                    </>
                  );

                  return safeUri ? (
                    <a
                      key={idx}
                      href={safeUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-amber-500/35 dark:border-amber-500/25 hover:border-amber-500 dark:hover:border-amber-400 transition group"
                    >
                      {cardContent}
                    </a>
                  ) : (
                    <div
                      key={idx}
                      className="block p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-amber-500/35 dark:border-amber-500/25"
                    >
                      {cardContent}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 2. GOOGLE SEARCH GROUNDING PANEL (SafetyView / ExplorerView)
// =========================================================================
export const SearchGroundingPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ text: string; sources: WebSource[] } | null>(null);

  const quickTopics = [
    "Tarifs et permis d'entrée Parcs Nationaux ANPN Gabon",
    'Saison ponte des tortues luth Parc National de Pongara Gabon',
    'État de la route Libreville vers Makokou Parc Ivindo',
    'Horaires marées Libreville & Pointe Denis Gabon',
  ];

  const runSearchQuery = async (customQuery?: string) => {
    const q = (customQuery ?? query).trim();
    if (!q) return;
    if (customQuery) setQuery(customQuery);

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/grounding/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          context: 'Sécurité terrain, réglementation ANPN et conditions actuelles au Gabon',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur serveur Google Search Grounding');
      }
      setResult({
        text: data.text,
        sources: Array.isArray(data.sources) ? data.sources : [],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-sky-50/40 to-stone-50 dark:from-slate-900/95 dark:via-[#12181a] dark:to-slate-900/90 border border-sky-500/35 dark:border-sky-500/30 rounded-3xl p-4 space-y-3 shadow-lg dark:shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-sky-100 dark:bg-sky-500/20 border border-sky-400/50 dark:border-sky-400/40 text-sky-700 dark:text-sky-300 flex items-center justify-center shadow-md shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white">
                Veille Terrain & Infos ANPN en Direct
              </h3>
              <span className="text-[9px] bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded-full font-bold">
                Google Search
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Informations actualisées sur le Web : accès parcs, routes, marées et faune
            </p>
          </div>
        </div>
      </div>

      {/* Quick Topics */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {quickTopics.map((topic, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => runSearchQuery(topic)}
            disabled={isLoading}
            className="px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 hover:border-sky-500/50 dark:hover:border-sky-400/40 text-[10.5px] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white whitespace-nowrap transition shrink-0 disabled:opacity-50"
          >
            🔎 {topic.length > 38 ? topic.slice(0, 38) + '…' : topic}
          </button>
        ))}
      </div>

      {/* Search Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearchQuery();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: permis ANPN Ivindo, marées Pointe Denis, alerte crues..."
          className="flex-1 bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-white/15 focus:border-sky-500 dark:focus:border-sky-400 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow active:scale-95 transition disabled:opacity-50 shrink-0"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Vérifier</span>
        </button>
      </form>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-500/40 rounded-xl p-2.5 flex items-center gap-2 text-xs text-red-800 dark:text-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span className="text-[11px]">{error}</span>
        </div>
      )}

      {result && (
        <div className="bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 space-y-3 animate-in fade-in">
          <FormattedGroundingText text={result.text} />

          {result.sources.length > 0 && (
            <div className="pt-2.5 border-t border-stone-200 dark:border-white/10 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Sources Web vérifiées ({result.sources.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.sources.map((src, idx) => {
                  const safeUri = sanitizeSafeHttpUrl(src.uri);
                  if (!safeUri) return null;
                  return (
                    <a
                      key={idx}
                      href={safeUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-sky-500/30 dark:border-sky-500/25 hover:border-sky-500 dark:hover:border-sky-400 text-[10.5px] text-sky-800 dark:text-sky-200 hover:text-sky-950 dark:hover:text-white transition max-w-full"
                    >
                      <span className="truncate max-w-[200px]">{src.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 text-sky-600 dark:text-sky-400" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
