import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SafetyIncident } from '../types';
import { AlertTriangle, ShieldCheck, Waves, PlusCircle, CheckCircle2 } from 'lucide-react';

interface SafetyMapProps {
  incidents: SafetyIncident[];
  onAddIncident: (incident: Omit<SafetyIncident, 'id' | 'reportedAt'>) => void;
}

export const SafetyMap: React.FC<SafetyMapProps> = ({ incidents, onAddIncident }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<SafetyIncident['type']>('flood');
  const [newSeverity, setNewSeverity] = useState<SafetyIncident['severity']>('medium');
  const [currentCoords, setCurrentCoords] = useState<[number, number]>([0.5750, 9.3500]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let isDisposed = false;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    }).setView([0.5750, 9.3500], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add incidents to map
    incidents.forEach((inc) => {
      let pinColor = '#ef4444'; // Red for high or floods
      let pinIcon = '⚠️';

      if (inc.type === 'ranger_station') {
        pinColor = '#10b981';
        pinIcon = '🛡️';
      } else if (inc.type === 'wildlife') {
        pinColor = '#f59e0b';
        pinIcon = '🐘';
      } else if (inc.type === 'trail_blocked') {
        pinColor = '#f97316';
        pinIcon = '🪵';
      }

      const customIcon = L.divIcon({
        className: 'safety-pin',
        html: `
          <div style="background: ${pinColor}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.6); border: 2px solid #ffffff; font-size: 14px;">
            ${pinIcon}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(inc.coords, { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div style="min-width: 200px; padding: 2px 0;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;background:${inc.severity === 'high' ? '#7f1d1d' : '#78350f'};color:#ffffff;">
              ${inc.severity.toUpperCase()}
            </span>
            ${inc.verifiedByANPN ? '<span style="font-size:9px;color:#10b981;font-weight:700;">✓ Validé ANPN</span>' : '<span style="font-size:9px;color:#cbd5e1;">Signalement usager</span>'}
          </div>
          <strong style="color:#ffffff;font-size:12px;display:block;margin-bottom:3px;">${inc.title}</strong>
          <p style="font-size:11px;color:#cbd5e1;line-height:1.3;margin:0 0 6px;">${inc.description}</p>
          <span style="font-size:9px;color:#94a3b8;">Signalé: ${inc.reportedAt}</span>
        </div>
      `);
    });

    mapInstanceRef.current = map;

    // Detect user coordinates for accurate reporting (strictly guarded against unmount/disposal)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (isDisposed || mapInstanceRef.current !== map || !container.isConnected) {
            return;
          }
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentCoords([lat, lng]);
          try {
            L.circleMarker([lat, lng], {
              radius: 8,
              color: '#38bdf8',
              fillColor: '#38bdf8',
              fillOpacity: 0.9,
            }).addTo(map).bindPopup("<b style='color:#38bdf8'>Votre position actuelle</b>");
          } catch (err) {
            console.warn('Ignored stale geolocation marker update:', err);
          }
        },
        () => {},
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }

    const timer = setTimeout(() => {
      if (!isDisposed && mapInstanceRef.current === map && container.isConnected) {
        map.invalidateSize();
      }
    }, 250);

    return () => {
      isDisposed = true;
      clearTimeout(timer);
      if (mapInstanceRef.current === map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [incidents]);

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddIncident({
      title: newTitle.trim(),
      description: newDesc.trim() || 'Signalement terrain transmis par un randonneur MANGOREMA.',
      type: newType,
      severity: newSeverity,
      coords: currentCoords,
      verifiedByANPN: false,
    });

    setNewTitle('');
    setNewDesc('');
    setShowReportForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10 shadow-lg dark:shadow-xl bg-stone-100 dark:bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-72 md:h-80" />

        {/* Floating Header Badge */}
        <div className="absolute top-3 left-3 z-[400]">
          <div className="bg-white/90 dark:bg-[#121614]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs font-semibold flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-700 dark:text-red-400 font-bold">Réseau Sentiers & Vigilance ANPN</span>
          </div>
        </div>

        {/* Add report button */}
        <div className="absolute top-3 right-3 z-[400]">
          <button
            onClick={() => setShowReportForm(!showReportForm)}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Signaler</span>
          </button>
        </div>

        {/* Legend */}
        <div className="bg-white dark:bg-[#121614] border-t border-stone-200 dark:border-white/10 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="text-sm">⚠️</span> Crue / Inondation
            </span>
            <span className="flex items-center gap-1">
              <span className="text-sm">🐘</span> Faune active
            </span>
            <span className="flex items-center gap-1">
              <span className="text-sm">🛡️</span> Poste Secours
            </span>
          </div>
          <span className="text-emerald-700 dark:text-emerald-400 font-medium text-[10px]">Ligne VHF 1404 active</span>
        </div>
      </div>

      {/* Incident Form Modal / Drawer */}
      {showReportForm && (
        <form
          onSubmit={handleSubmitReport}
          className="bg-white dark:bg-[#121614] border border-amber-500/50 dark:border-amber-600/40 rounded-2xl p-4 space-y-3 shadow-lg animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-2">
            <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              Signaler un risque ou obstacle sur le sentier
            </h4>
            <button
              type="button"
              onClick={() => setShowReportForm(false)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Annuler
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">Type d'aléa :</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as SafetyIncident['type'])}
                className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="flood">🌊 Crue / Rivière impraticable</option>
                <option value="wildlife">🐘 Faune dangereuse (éléphants/buffles)</option>
                <option value="trail_blocked">🪵 Arbre couché / Éboulement</option>
                <option value="medical">🩹 Blessure / Assistance requise</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">Niveau d'urgence :</label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as SafetyIncident['severity'])}
                className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="low">Faible (Informatif)</option>
                <option value="medium">Moyen (Ralentissement / Risque)</option>
                <option value="high">Élevé (Danger direct)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">Titre court :</label>
            <input
              type="text"
              placeholder="Ex: Pont de lianes détérioré au km 6"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">Précisions utiles pour les écogardes :</label>
            <textarea
              rows={2}
              placeholder="Description du lieu, repères visuels..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1">
            <span>Coordonnées GPS auto-capturées</span>
            <span className="font-mono text-amber-700 dark:text-amber-400">
              [{currentCoords[0].toFixed(4)}, {currentCoords[1].toFixed(4)}]
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition"
          >
            Diffuser le signalement aux randonneurs
          </button>
        </form>
      )}
    </div>
  );
};
