import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ExpeditionEvent } from '../types';
import { Locate, Layers, Compass, ArrowUpRight } from 'lucide-react';

interface ExplorerMapProps {
  events: ExpeditionEvent[];
  selectedPark: string;
  onSelectEvent: (event: ExpeditionEvent) => void;
}

export const ExplorerMap: React.FC<ExplorerMapProps> = ({
  events,
  selectedPark,
  onSelectEvent,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const onSelectEventRef = useRef(onSelectEvent);
  onSelectEventRef.current = onSelectEvent;
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let isDisposed = false;

    // Clean up if already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      userMarkerRef.current = null;
    }

    // Default center: Gabon (near Libreville/Mondah)
    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    }).setView([0.5500, 9.3800], 11);

    // OpenStreetMap dark-friendly tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add zoom controls at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Sentier 1: Mondah (Cap Estérias)
    const mondahTrailCoords: [number, number][] = [
      [0.5500, 9.3300],
      [0.5620, 9.3380],
      [0.5750, 9.3440],
      [0.5833, 9.3500],
      [0.5920, 9.3590],
      [0.6050, 9.3660],
    ];
    const mondahPolyline = L.polyline(mondahTrailCoords, {
      color: '#10b981',
      weight: 5,
      opacity: 0.9,
      dashArray: '8, 6',
    }).addTo(map);
    mondahPolyline.bindPopup(
      `<div class="p-1">
        <strong style="color:#10b981">Sentier Botanique Mondah</strong>
        <p style="font-size:11px;margin:2px 0 0;color:#cbd5e1">9.4 km · Dénivelé +180m · Canopée</p>
      </div>`
    );

    // Sentier 2: Chutes de Djidji (Ivindo)
    const ivindoTrailCoords: [number, number][] = [
      [0.5100, 12.7600],
      [0.5140, 12.7720],
      [0.5167, 12.7833],
      [0.5210, 12.7950],
    ];
    L.polyline(ivindoTrailCoords, {
      color: '#f59e0b',
      weight: 5,
      opacity: 0.85,
    }).addTo(map).bindPopup(
      `<div class="p-1">
        <strong style="color:#f59e0b">Sentier des Chutes de Djidji (Ivindo)</strong>
        <p style="font-size:11px;margin:2px 0 0;color:#cbd5e1">24.0 km · Expédition forêt primaire</p>
      </div>`
    );

    // Sentier 3: Pointe Denis Plage & Mangrove
    const pointeDenisCoords: [number, number][] = [
      [0.3200, 9.3650],
      [0.3100, 9.3720],
      [0.3000, 9.3800],
      [0.2850, 9.3880],
    ];
    L.polyline(pointeDenisCoords, {
      color: '#38bdf8',
      weight: 4,
      dashArray: '4, 4',
    }).addTo(map).bindPopup(
      `<div class="p-1">
        <strong style="color:#38bdf8">Piste Littorale Pointe Denis</strong>
        <p style="font-size:11px;margin:2px 0 0;color:#cbd5e1">Plages sauvages & nidification tortues luth</p>
      </div>`
    );

    // Custom Icon helper for Events
    events.forEach((evt) => {
      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="background: linear-gradient(135deg, #78350f, #d97706); width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5); border: 2px solid #ffffff; cursor: pointer;">
            <span style="font-size: 15px;">🌿</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      const marker = L.marker(evt.coords, { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div style="min-width: 190px; padding: 2px 0;">
          <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #f59e0b; letter-spacing: 0.5px;">${evt.category} · ${evt.parkName}</span>
          <h4 style="font-size: 13px; font-weight: 800; margin: 3px 0; color: #ffffff;">${evt.title}</h4>
          <p style="font-size: 11px; color: #94a3b8; margin: 0 0 6px;">📅 ${evt.date}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
            <strong style="color: #fbbf24; font-size: 13px;">${evt.basePrice === 0 ? 'Gratuit' : evt.basePrice.toLocaleString('fr-FR') + ' F'}</strong>
            <button id="book-btn-${evt.id}" style="background: #d97706; color: #080B09; border: none; border-radius: 6px; padding: 4px 9px; font-size: 10px; font-weight: 800; cursor: pointer;">
              Réserver
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`book-btn-${evt.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectEventRef.current(evt);
            map.closePopup();
          };
        }
      });
    });

    mapInstanceRef.current = map;

    // Small delay to invalidate size after layout stabilizes
    const timer = setTimeout(() => {
      if (!isDisposed && mapInstanceRef.current === map && container.isConnected) {
        map.invalidateSize();
      }
    }, 250);

    return () => {
      isDisposed = true;
      clearTimeout(timer);
      userMarkerRef.current = null;
      if (mapInstanceRef.current === map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [events]);

  // Adjust view when selectedPark changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (selectedPark === 'mondah') {
      map.flyTo([0.5833, 9.3500], 12);
    } else if (selectedPark === 'ivindo') {
      map.flyTo([0.5167, 12.7833], 11);
    } else if (selectedPark === 'denis') {
      map.flyTo([0.3000, 9.3800], 12);
    } else {
      map.flyTo([0.5500, 9.3800], 10);
    }
  }, [selectedPark]);

  // User Geolocation locator
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setUserCoords([latitude, longitude]);

        const container = mapContainerRef.current;
        const map = mapInstanceRef.current;
        if (map && container && container.isConnected) {
          try {
            if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng([latitude, longitude]);
            } else {
              userMarkerRef.current = L.circleMarker([latitude, longitude], {
                radius: 9,
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.8,
                weight: 2,
              }).addTo(map);
              userMarkerRef.current.bindPopup(
                `<div style="font-size:11px;font-weight:700;color:#10b981">
                  📍 Votre position GPS actuelle<br/>
                  <span style="font-size:9px;color:#94a3b8">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</span>
                </div>`
              );
            }

            map.flyTo([latitude, longitude], 13);
            userMarkerRef.current.openPopup();
          } catch (err) {
            console.warn('Ignored stale ExplorerMap geolocation marker:', err);
          }
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation denied or unavailable, centering on Libreville', err);
        // Fallback default: Libreville Center
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([0.3924, 9.4537], 12);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10 shadow-lg dark:shadow-xl bg-stone-100 dark:bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-72 md:h-96" />

      {/* Floating Controls Bar */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2">
        <div className="bg-white/90 dark:bg-[#121614]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-amber-700 dark:text-amber-400 font-bold">OpenStreetMap Gabon</span>
        </div>
      </div>

      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        <button
          onClick={handleLocateUser}
          disabled={isLocating}
          title="Me localiser en direct"
          className="w-9 h-9 rounded-xl bg-white/90 dark:bg-[#121614]/90 backdrop-blur-md border border-stone-200 dark:border-white/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition active:scale-95"
        >
          <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Map Legend Footer */}
      <div className="bg-white dark:bg-[#121614] border-t border-stone-200 dark:border-white/10 px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-emerald-500 rounded-full inline-block" /> Mondah (9.4 km)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-amber-500 rounded-full inline-block" /> Ivindo Djidji
          </span>
        </div>
        <span className="text-amber-700 dark:text-amber-500/80 font-medium text-[10px]">Touchez un repère</span>
      </div>
    </div>
  );
};
