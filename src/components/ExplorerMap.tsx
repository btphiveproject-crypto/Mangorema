import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ExpeditionEvent, OfflineParkMapData } from '../types';
import { Locate, WifiOff, Download, HardDrive, Globe, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { buildDirectionsUrl, formatCoordsPair } from '../utils/activityLocation';

interface ExplorerMapProps {
  events: ExpeditionEvent[];
  selectedPark: string;
  onSelectEvent: (event: ExpeditionEvent) => void;
  showActivityLocations?: boolean;
  onToggleActivityLocations?: () => void;
  userGpsCoords?: [number, number] | null;
  focusedEventId?: string | null;
  onClearFocusedEvent?: () => void;
  offlineMode?: boolean;
  onToggleOfflineMode?: () => void;
  offlineMaps?: Record<string, OfflineParkMapData>;
  onDownloadParkOffline?: (parkId: string) => void;
  isDownloadingPark?: boolean;
}

const PARK_CENTERS: Record<string, { coords: [number, number]; zoom: number }> = {
  mondah: { coords: [0.5833, 9.35], zoom: 12 },
  ivindo: { coords: [0.5167, 12.7833], zoom: 12 },
  denis: { coords: [0.3, 9.38], zoom: 12 },
  cristal: { coords: [0.45, 10.2833], zoom: 12 },
  loango: { coords: [-2.1667, 9.5667], zoom: 11 },
  lope: { coords: [-0.2, 11.6], zoom: 12 },
  all: { coords: [0.45, 10.1], zoom: 7 },
};

function createOfflineTopoLayer(): L.GridLayer {
  const TopoGrid = L.GridLayer.extend({
    createTile(coords: L.Coords) {
      const tile = document.createElement('canvas');
      const size = this.getTileSize();
      tile.width = size.x;
      tile.height = size.y;
      const ctx = tile.getContext('2d');
      if (!ctx) return tile;

      // Rich topographic dark-forest offline canvas surface
      ctx.fillStyle = '#0d1511';
      ctx.fillRect(0, 0, size.x, size.y);

      // Subtle topographic contour arcs
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        const radius = (size.x / 3) * i;
        ctx.arc((coords.x % 2 === 0 ? 0 : size.x), (coords.y % 2 === 0 ? 0 : size.y), radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crisp 64px minor grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let p = 0; p < size.x; p += 64) {
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, size.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(size.x, p);
        ctx.stroke();
      }

      // Tile border & topo sector reference
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.18)';
      ctx.strokeRect(0, 0, size.x, size.y);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.32)';
      ctx.font = '10px monospace';
      ctx.fillText(`Z${coords.z} · ${coords.x}:${coords.y}`, 8, 16);

      return tile;
    },
  });

  return new (TopoGrid as unknown as { new (): L.GridLayer })();
}

export const ExplorerMap: React.FC<ExplorerMapProps> = ({
  events,
  selectedPark,
  onSelectEvent,
  showActivityLocations = true,
  onToggleActivityLocations,
  userGpsCoords = null,
  focusedEventId = null,
  onClearFocusedEvent,
  offlineMode = false,
  onToggleOfflineMode,
  offlineMaps = {},
  onDownloadParkOffline,
  isDownloadingPark = false,
}) => {
  const { t } = useLanguage();
  const isOnline = useOnlineStatus();
  const effectiveOffline = offlineMode || !isOnline;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const eventMarkersRef = useRef<Record<string, L.Marker>>({});
  const onSelectEventRef = useRef(onSelectEvent);
  onSelectEventRef.current = onSelectEvent;

  const [isLocating, setIsLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const downloadedList = Object.values(offlineMaps);
  const selectedParkOfflineData =
    selectedPark === 'all'
      ? downloadedList[0] || null
      : downloadedList.find((m) => m.parkId === selectedPark) || null;

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let isDisposed = false;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      userMarkerRef.current = null;
    }

    const initialView = PARK_CENTERS[selectedPark] || PARK_CENTERS.mondah;
    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    }).setView(initialView.coords, initialView.zoom);

    if (effectiveOffline) {
      createOfflineTopoLayer().addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);
    }

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    if (effectiveOffline && downloadedList.length > 0) {
      // Render all offline park map vectors, trails, bounds & ANPN waypoints from LocalStorage
      downloadedList.forEach((parkData) => {
        L.rectangle(parkData.bounds, {
          color: '#d97706',
          weight: 1.5,
          dashArray: '5, 5',
          fillColor: '#10b981',
          fillOpacity: 0.08,
        })
          .addTo(map)
          .bindPopup(
            `<div style="padding:2px 0;">
              <strong style="color:#f59e0b;font-size:12px;">${parkData.name}</strong>
              <p style="font-size:11px;margin:2px 0 0;color:#cbd5e1;">${parkData.region} · LocalStorage Hors-Ligne</p>
            </div>`
          );

        parkData.trails.forEach((trail) => {
          L.polyline(trail.coords, {
            color: trail.color,
            weight: 5,
            opacity: 0.95,
          })
            .addTo(map)
            .bindPopup(
              `<div style="padding:2px 0;">
                <strong style="color:${trail.color};font-size:12px;">${trail.name}</strong>
                <p style="font-size:11px;margin:2px 0 0;color:#cbd5e1;">${trail.distanceKm} km · +${trail.elevationM}m · ${trail.difficulty}</p>
              </div>`
            );
        });

        parkData.waypoints.forEach((wp) => {
          const wpIconHtml =
            wp.kind === 'ranger' ? '🛡️' : wp.kind === 'camp' ? '⛺' : wp.kind === 'water' ? '💧' : '📍';
          const wpColor =
            wp.kind === 'ranger'
              ? '#10b981'
              : wp.kind === 'camp'
              ? '#f59e0b'
              : wp.kind === 'water'
              ? '#38bdf8'
              : '#eab308';

          const wpIcon = L.divIcon({
            className: 'offline-wp-pin',
            html: `<div style="background:#0c100e;border:2px solid ${wpColor};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 3px 10px rgba(0,0,0,0.6);">${wpIconHtml}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          L.marker(wp.coords, { icon: wpIcon })
            .addTo(map)
            .bindPopup(
              `<div style="min-width:170px;padding:2px 0;">
                <strong style="color:${wpColor};font-size:12px;">${wp.name}</strong>
                <p style="font-size:11px;color:#e2e8f0;margin:3px 0;">${wp.note}</p>
                <span style="font-size:10px;color:#94a3b8;">Alt. ${wp.elevationM}m · GPS ${wp.coords[0].toFixed(3)}, ${wp.coords[1].toFixed(3)}</span>
              </div>`
            );
        });
      });
    } else {
      // Standard Live OpenStreetMap Trails
      const mondahTrailCoords: [number, number][] = [
        [0.55, 9.33],
        [0.562, 9.338],
        [0.575, 9.344],
        [0.5833, 9.35],
        [0.592, 9.359],
        [0.605, 9.366],
      ];
      L.polyline(mondahTrailCoords, {
        color: '#10b981',
        weight: 5,
        opacity: 0.9,
        dashArray: '8, 6',
      })
        .addTo(map)
        .bindPopup(
          `<div class="p-1">
            <strong style="color:#10b981">Sentier Botanique Mondah</strong>
            <p style="font-size:11px;margin:2px 0 0;color:#cbd5e1">9.4 km · Dénivelé +180m · Canopée</p>
          </div>`
        );

      const ivindoTrailCoords: [number, number][] = [
        [0.51, 12.76],
        [0.514, 12.772],
        [0.5167, 12.7833],
        [0.521, 12.795],
      ];
      L.polyline(ivindoTrailCoords, {
        color: '#f59e0b',
        weight: 5,
        opacity: 0.85,
      })
        .addTo(map)
        .bindPopup(
          `<div class="p-1">
            <strong style="color:#f59e0b">Sentier des Chutes de Djidji (Ivindo)</strong>
            <p style="font-size:11px;margin:2px 0 0;color:#cbd5e1">24.0 km · Expédition forêt primaire</p>
          </div>`
        );

      const pointeDenisCoords: [number, number][] = [
        [0.32, 9.365],
        [0.31, 9.372],
        [0.3, 9.38],
        [0.285, 9.388],
      ];
      L.polyline(pointeDenisCoords, {
        color: '#38bdf8',
        weight: 4,
        dashArray: '4, 4',
      })
        .addTo(map)
        .bindPopup(
          `<div class="p-1">
            <strong style="color:#38bdf8">Piste Littorale Pointe Denis</strong>
            <p style="font-size:11px;margin:2px 0 0;color:#cbd5e1">Plages sauvages & nidification tortues luth</p>
          </div>`
        );
    }

    // Reset stored marker registry for this map cycle
    eventMarkersRef.current = {};

    const escapeHtml = (value: string) =>
      String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Event Pins (rendered only when activity localization layer is active & activity allows location)
    if (showActivityLocations) {
      events
        .filter((evt) => evt.locationEnabled !== false)
        .forEach((evt) => {
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
          eventMarkersRef.current[evt.id] = marker;
          const dirUrl = buildDirectionsUrl(evt.coords);
          const safeBtnId = `book-btn-${evt.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
          const popupHtml = `
            <div style="min-width: 205px; padding: 2px 0;">
              <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #f59e0b; letter-spacing: 0.5px;">${escapeHtml(evt.category)} · ${escapeHtml(evt.parkName)}</span>
              <h4 style="font-size: 13px; font-weight: 800; margin: 3px 0; color: #ffffff;">${escapeHtml(evt.title)}</h4>
              <p style="font-size: 11px; color: #cbd5e1; margin: 0 0 2px;">📅 ${escapeHtml(evt.date)}</p>
              <p style="font-size: 10px; font-family: monospace; color: #94a3b8; margin: 0 0 6px;">📍 ${escapeHtml(formatCoordsPair(evt.coords))}</p>
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
                <strong style="color: #fbbf24; font-size: 12px;">${evt.basePrice === 0 ? 'Gratuit' : evt.basePrice.toLocaleString('fr-FR') + ' F'}</strong>
                <div style="display: flex; gap: 4px;">
                  <a href="${dirUrl}" target="_blank" rel="noopener noreferrer" style="background: rgba(255,255,255,0.12); color: #ffffff; text-decoration: none; border-radius: 6px; padding: 4px 7px; font-size: 10px; font-weight: 700;">Itinéraire</a>
                  <button id="${safeBtnId}" style="background: #d97706; color: #080B09; border: none; border-radius: 6px; padding: 4px 9px; font-size: 10px; font-weight: 800; cursor: pointer;">
                    Réserver
                  </button>
                </div>
              </div>
            </div>
          `;

          marker.bindPopup(popupHtml);
          marker.on('popupopen', () => {
            const btn = document.getElementById(safeBtnId);
            if (btn) {
              btn.onclick = () => {
                onSelectEventRef.current(evt);
                map.closePopup();
              };
            }
          });
        });
    }

    if (userGpsCoords) {
      userMarkerRef.current = L.circleMarker(userGpsCoords, {
        radius: 8,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.85,
        weight: 2,
      }).addTo(map);
      userMarkerRef.current.bindPopup(
        `<div style="font-size:11px;font-weight:700;color:#10b981">
          📍 Votre position GPS<br/>
          <span style="font-size:9px;color:#94a3b8">${userGpsCoords[0].toFixed(4)}, ${userGpsCoords[1].toFixed(4)}</span>
        </div>`
      );
    }

    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      if (!isDisposed && mapInstanceRef.current === map && container.isConnected) {
        map.invalidateSize();
        if (focusedEventId && eventMarkersRef.current[focusedEventId]) {
          const targetMarker = eventMarkersRef.current[focusedEventId];
          map.flyTo(targetMarker.getLatLng(), 13);
          targetMarker.openPopup();
          if (onClearFocusedEvent) onClearFocusedEvent();
        }
      }
    }, 240);

    return () => {
      isDisposed = true;
      clearTimeout(timer);
      userMarkerRef.current = null;
      eventMarkersRef.current = {};
      if (mapInstanceRef.current === map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [events, showActivityLocations, userGpsCoords, effectiveOffline, downloadedList.length]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (focusedEventId && eventMarkersRef.current[focusedEventId]) {
      const targetMarker = eventMarkersRef.current[focusedEventId];
      mapInstanceRef.current.flyTo(targetMarker.getLatLng(), 13);
      targetMarker.openPopup();
      if (onClearFocusedEvent) onClearFocusedEvent();
      return;
    }
    const target = PARK_CENTERS[selectedPark] || PARK_CENTERS.mondah;
    mapInstanceRef.current.flyTo(target.coords, target.zoom);
  }, [selectedPark, focusedEventId, onClearFocusedEvent]);

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Géolocalisation indisponible sur cet appareil.');
      setTimeout(() => setGeoMessage(null), 3000);
      return;
    }

    setIsLocating(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;

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
      () => {
        setIsLocating(false);
        setGeoMessage('Position GPS centrée sur Libreville.');
        setTimeout(() => setGeoMessage(null), 3000);
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

      {/* Top Overlay: Mode Indicator & Interactive Offline Mode Switch */}
      <div className="absolute top-3 start-3 z-[400] flex items-center gap-2 flex-wrap max-w-[78%]">
        <div className="bg-white/95 dark:bg-[#121614]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs font-semibold flex items-center gap-2 shadow-lg">
          {effectiveOffline ? (
            <>
              <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                {t.explorer.offlineLegendLabel}
              </span>
            </>
          ) : (
            <>
              <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-amber-700 dark:text-amber-400 font-bold">
                OpenStreetMap Gabon
              </span>
            </>
          )}
        </div>

        {onToggleOfflineMode && (
          <button
            type="button"
            onClick={onToggleOfflineMode}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-lg border transition active:scale-95 ${
              effectiveOffline
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-white/95 dark:bg-[#121614]/95 text-slate-800 dark:text-slate-200 border-stone-200 dark:border-white/15 hover:border-amber-500/50'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>
              {effectiveOffline ? t.explorer.offlineModeActive : t.explorer.offlineModeBtn}
            </span>
          </button>
        )}

        {onToggleActivityLocations && (
          <button
            type="button"
            onClick={onToggleActivityLocations}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-lg border transition active:scale-95 ${
              showActivityLocations
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-white/95 dark:bg-[#121614]/95 text-slate-700 dark:text-slate-300 border-stone-200 dark:border-white/15 hover:border-amber-500/50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{showActivityLocations ? 'Activités : ON' : 'Activités : OFF'}</span>
          </button>
        )}
      </div>

      {/* Geolocation Button */}
      <div className="absolute top-3 end-3 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLocateUser}
          disabled={isLocating}
          title="Me localiser en direct"
          aria-label="Me localiser en direct"
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-[#121614]/95 backdrop-blur-md border border-stone-200 dark:border-white/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition active:scale-95"
        >
          <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Geolocation Status Banner */}
      {geoMessage && (
        <div className="absolute bottom-11 start-3 z-[400] bg-slate-900/90 text-white text-[11px] px-3 py-1.5 rounded-xl border border-white/10 shadow">
          {geoMessage}
        </div>
      )}

      {/* Missing Park Offline Prompt Overlay */}
      {effectiveOffline && selectedPark !== 'all' && !selectedParkOfflineData && (
        <div className="absolute bottom-11 inset-x-3 z-[400] bg-white/95 dark:bg-[#121614]/95 border border-amber-500/50 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 leading-snug">
            {t.explorer.offlineMissingNotice}
          </span>
          {onDownloadParkOffline && (
            <button
              type="button"
              disabled={isDownloadingPark}
              onClick={() => onDownloadParkOffline(selectedPark)}
              className="min-h-[38px] px-3 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-[11px] flex items-center gap-1.5 shrink-0 shadow active:scale-95 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.explorer.offlineDownloadNowBtn}</span>
            </button>
          )}
        </div>
      )}

      {/* Map Legend Footer */}
      <div className="bg-white dark:bg-[#121614] border-t border-stone-200 dark:border-white/10 px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-1 bg-emerald-500 rounded-full inline-block" /> Mondah (9.4 km)
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-1 bg-amber-500 rounded-full inline-block" /> Ivindo Djidji
          </span>
          {effectiveOffline && (
            <span className="flex items-center gap-1 whitespace-nowrap text-emerald-700 dark:text-emerald-400 font-semibold">
              · {downloadedList.length} LocalStorage
            </span>
          )}
        </div>
        <span className="text-amber-700 dark:text-amber-500/80 font-medium text-[10px] shrink-0 ms-2">
          Touchez un repère
        </span>
      </div>
    </div>
  );
};
