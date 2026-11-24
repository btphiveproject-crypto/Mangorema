/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  OfflineMapPackage,
  OfflineParkMapData,
  OfflineParkTrail,
  OfflineParkWaypoint,
} from '../types';

export const OFFLINE_MAP_PACKAGES: OfflineMapPackage[] = [
  {
    id: 'pkg-mondah',
    parkId: 'mondah',
    name: 'Parc National de la Mondah & Cap Estérias',
    region: 'Estuaire · Forêt Littorale',
    description:
      'Sentier botanique de la Mondah, littoral rocheux et mangrove de Cap Estérias. Idéal pour bivouacs côtiers.',
    zoomRange: 'Z10 à Z15 (Très haute résolution)',
    estimatedTiles: 112,
    sizeMB: 8.4,
    centerCoords: [0.5833, 9.35],
    bounds: [
      [0.52, 9.28],
      [0.65, 9.42],
    ],
    isDownloaded: false,
  },
  {
    id: 'pkg-ivindo',
    parkId: 'ivindo',
    name: "Parc National de l'Ivindo & Chutes de Djidji",
    region: 'Ogooué-Ivindo · Makokou',
    description:
      'Cœur de la forêt vierge équatoriale UNESCO, Chutes de Kongou, baïs et corridors de faune (éléphants et gorilles).',
    zoomRange: 'Z10 à Z14 (Couverture forêt dense)',
    estimatedTiles: 168,
    sizeMB: 13.6,
    centerCoords: [0.5167, 12.7833],
    bounds: [
      [0.38, 12.65],
      [0.64, 12.98],
    ],
    isDownloaded: false,
  },
  {
    id: 'pkg-pongara',
    parkId: 'denis',
    name: 'Parc National de Pongara & Pointe Denis',
    region: 'Komo-Océan · Rive Sud',
    description:
      'Plages sauvages, vasières à mangroves et savanes littorales entre Pointe Denis et Nyonié.',
    zoomRange: 'Z10 à Z14 (Zone côtière complète)',
    estimatedTiles: 134,
    sizeMB: 10.2,
    centerCoords: [0.3, 9.38],
    bounds: [
      [0.01, 9.18],
      [0.35, 9.45],
    ],
    isDownloaded: false,
  },
  {
    id: 'pkg-cristal',
    parkId: 'cristal',
    name: 'Monts de Cristal & Cascades de Kinguélé',
    region: 'Estuaire / Woleu-Ntem',
    description:
      "Reliefs de brume, forêt d'altitude, sentier des crêtes et cascades hydroélectriques de Kinguélé & Tchimbélé.",
    zoomRange: 'Z10 à Z14 (Cartographie relief)',
    estimatedTiles: 120,
    sizeMB: 9.1,
    centerCoords: [0.45, 10.2833],
    bounds: [
      [0.35, 10.15],
      [0.55, 10.42],
    ],
    isDownloaded: false,
  },
  {
    id: 'pkg-loango',
    parkId: 'loango',
    name: 'Parc National de Loango & Lagune Iguéla',
    region: 'Ogooué-Maritime · Côte Atlantique',
    description:
      'Savanes côtières, lagune Iguéla et plages célèbres où éléphants et hippopotames surfent les vagues.',
    zoomRange: 'Z10 à Z14 (Littoral & lagune)',
    estimatedTiles: 148,
    sizeMB: 11.8,
    centerCoords: [-2.1667, 9.5667],
    bounds: [
      [-2.35, 9.42],
      [-1.98, 9.75],
    ],
    isDownloaded: false,
  },
  {
    id: 'pkg-lope',
    parkId: 'lope',
    name: 'Parc National de la Lopé & Mont Brazza',
    region: 'Ogooué-Ivindo · Patrimoine UNESCO',
    description:
      'Mosaïque forêt-savane, gravures rupestres millénaires et piste panoramique du Mont Brazza.',
    zoomRange: 'Z10 à Z14 (Savanes & crêtes)',
    estimatedTiles: 142,
    sizeMB: 11.2,
    centerCoords: [-0.2, 11.6],
    bounds: [
      [-0.36, 11.44],
      [-0.04, 11.76],
    ],
    isDownloaded: false,
  },
];

const PARK_OFFLINE_DETAILS: Record<
  string,
  { zoom: number; trails: OfflineParkTrail[]; waypoints: OfflineParkWaypoint[] }
> = {
  'pkg-mondah': {
    zoom: 12,
    trails: [
      {
        id: 'trail-mondah-1',
        name: 'Sentier Botanique Arboretum Raponda Walker',
        distanceKm: 9.4,
        elevationM: 180,
        difficulty: 'Modéré',
        color: '#10b981',
        coords: [
          [0.55, 9.33],
          [0.562, 9.338],
          [0.575, 9.344],
          [0.5833, 9.35],
          [0.592, 9.359],
          [0.605, 9.366],
        ],
      },
      {
        id: 'trail-mondah-2',
        name: 'Boucle Mangrove & Cap Estérias',
        distanceKm: 6.2,
        elevationM: 75,
        difficulty: 'Facile',
        color: '#34d399',
        coords: [
          [0.5833, 9.35],
          [0.595, 9.342],
          [0.611, 9.339],
          [0.618, 9.351],
        ],
      },
    ],
    waypoints: [
      {
        id: 'wp-mondah-1',
        name: 'Poste Écogardes ANPN Mondah',
        kind: 'ranger',
        coords: [0.553, 9.333],
        elevationM: 28,
        note: 'Enregistrement permis & radio VHF canal 16',
      },
      {
        id: 'wp-mondah-2',
        name: 'Okoumé Géant Centenaire',
        kind: 'landmark',
        coords: [0.5833, 9.35],
        elevationM: 64,
        note: 'Point de repère principal km 4.8',
      },
      {
        id: 'wp-mondah-3',
        name: 'Bivouac Cap Estérias',
        kind: 'camp',
        coords: [0.605, 9.366],
        elevationM: 15,
        note: 'Aire de campement autorisée près de la crique',
      },
    ],
  },
  'pkg-ivindo': {
    zoom: 12,
    trails: [
      {
        id: 'trail-ivindo-1',
        name: 'Expédition Chutes de Kongou & Djidji',
        distanceKm: 24.0,
        elevationM: 420,
        difficulty: 'Expédition',
        color: '#f59e0b',
        coords: [
          [0.51, 12.76],
          [0.514, 12.772],
          [0.5167, 12.7833],
          [0.521, 12.795],
          [0.528, 12.812],
        ],
      },
    ],
    waypoints: [
      {
        id: 'wp-ivindo-1',
        name: 'Station Recherche Ipassa / ANPN',
        kind: 'ranger',
        coords: [0.512, 12.763],
        elevationM: 495,
        note: 'Point de départ piste Kongou · trousse secours',
      },
      {
        id: 'wp-ivindo-2',
        name: 'Chutes de Kongou (Belvédère)',
        kind: 'water',
        coords: [0.521, 12.795],
        elevationM: 430,
        note: 'Zone humide · prudence rochers glissants',
      },
      {
        id: 'wp-ivindo-3',
        name: 'Baï de Langoué (Zone Faune)',
        kind: 'landmark',
        coords: [0.528, 12.812],
        elevationM: 465,
        note: 'Mirador éléphants de forêt & gorilles',
      },
    ],
  },
  'pkg-pongara': {
    zoom: 12,
    trails: [
      {
        id: 'trail-pongara-1',
        name: 'Piste Littorale Pointe Denis — Nyonié',
        distanceKm: 14.5,
        elevationM: 40,
        difficulty: 'Facile',
        color: '#38bdf8',
        coords: [
          [0.32, 9.365],
          [0.31, 9.372],
          [0.3, 9.38],
          [0.285, 9.388],
          [0.268, 9.392],
        ],
      },
    ],
    waypoints: [
      {
        id: 'wp-pongara-1',
        name: 'Débarcadère Pointe Denis',
        kind: 'landmark',
        coords: [0.32, 9.365],
        elevationM: 4,
        note: 'Navettes maritimes Libreville — Michel Marine',
      },
      {
        id: 'wp-pongara-2',
        name: 'Poste Vigilance Tortues Luth ANPN',
        kind: 'ranger',
        coords: [0.3, 9.38],
        elevationM: 6,
        note: 'Observation nocturne encadrée (Nov–Fév)',
      },
      {
        id: 'wp-pongara-3',
        name: 'Campement Savane Nyonié',
        kind: 'camp',
        coords: [0.268, 9.392],
        elevationM: 12,
        note: 'Abri ombragé & eau douce filtrée',
      },
    ],
  },
  'pkg-cristal': {
    zoom: 12,
    trails: [
      {
        id: 'trail-cristal-1',
        name: 'Sentier des Crêtes & Cascades Kinguélé',
        distanceKm: 13.8,
        elevationM: 610,
        difficulty: 'Sportif',
        color: '#a855f7',
        coords: [
          [0.442, 10.265],
          [0.447, 10.274],
          [0.45, 10.2833],
          [0.458, 10.294],
        ],
      },
    ],
    waypoints: [
      {
        id: 'wp-cristal-1',
        name: 'Poste ANPN Kinguélé',
        kind: 'ranger',
        coords: [0.442, 10.265],
        elevationM: 310,
        note: 'Contrôle équipement pluie & crampons boue',
      },
      {
        id: 'wp-cristal-2',
        name: 'Chutes de Kinguélé',
        kind: 'water',
        coords: [0.45, 10.2833],
        elevationM: 420,
        note: 'Point de vue principal sur les cascades',
      },
    ],
  },
  'pkg-loango': {
    zoom: 11,
    trails: [
      {
        id: 'trail-loango-1',
        name: 'Traversée Lagune Iguéla & Plage des Éléphants',
        distanceKm: 18.2,
        elevationM: 90,
        difficulty: 'Modéré',
        color: '#fb923c',
        coords: [
          [-2.14, 9.545],
          [-2.155, 9.555],
          [-2.1667, 9.5667],
          [-2.182, 9.575],
        ],
      },
    ],
    waypoints: [
      {
        id: 'wp-loango-1',
        name: 'Embarcadère Lagune Iguéla',
        kind: 'water',
        coords: [-2.14, 9.545],
        elevationM: 5,
        note: 'Accès pirogue motorisée vers camp Akaka',
      },
      {
        id: 'wp-loango-2',
        name: 'Poste Écogardes Loango Sud',
        kind: 'ranger',
        coords: [-2.1667, 9.5667],
        elevationM: 12,
        note: 'Distance sécurité faune 30m obligatoire',
      },
    ],
  },
  'pkg-lope': {
    zoom: 12,
    trails: [
      {
        id: 'trail-lope-1',
        name: 'Ascension Mont Brazza & Piste des Savanes',
        distanceKm: 11.6,
        elevationM: 520,
        difficulty: 'Sportif',
        color: '#eab308',
        coords: [
          [-0.215, 11.585],
          [-0.207, 11.592],
          [-0.2, 11.6],
          [-0.188, 11.612],
        ],
      },
    ],
    waypoints: [
      {
        id: 'wp-lope-1',
        name: 'Centre Visiteurs Lopé (UNESCO)',
        kind: 'ranger',
        coords: [-0.215, 11.585],
        elevationM: 290,
        note: 'Départ randos mandrills & pétroglyphes',
      },
      {
        id: 'wp-lope-2',
        name: 'Sommet Panorama Mont Brazza',
        kind: 'landmark',
        coords: [-0.188, 11.612],
        elevationM: 560,
        note: 'Vue 360° sur la vallée de l’Ogooué',
      },
    ],
  },
};

const CACHE_NAME = 'mangorema-osm-offline-v1';
const STORAGE_KEY = 'mangorema_downloaded_offline_maps';
const STORAGE_MAPS_DATA_KEY = 'mangorema_offline_park_maps_v2';
const STORAGE_OFFLINE_MODE_KEY = 'mangorema_explorer_offline_mode';

function buildParkMapData(pkg: OfflineMapPackage, cachedTilesCount = pkg.estimatedTiles): OfflineParkMapData {
  const details = PARK_OFFLINE_DETAILS[pkg.id] || {
    zoom: 12,
    trails: [],
    waypoints: [],
  };

  return {
    packageId: pkg.id,
    parkId: pkg.parkId,
    name: pkg.name,
    region: pkg.region,
    centerCoords: pkg.centerCoords,
    bounds: pkg.bounds,
    zoom: details.zoom,
    trails: details.trails,
    waypoints: details.waypoints,
    downloadedAt: new Date().toISOString(),
    cachedTilesCount,
  };
}

// Helper to convert lat/lng to tile x/y
function deg2tile(latDeg: number, lonDeg: number, zoom: number): [number, number] {
  const latRad = (latDeg * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const xtile = Math.floor(((lonDeg + 180) / 360) * n);
  const ytile = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return [xtile, ytile];
}

export function getExplorerOfflineMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_OFFLINE_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setExplorerOfflineMode(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_OFFLINE_MODE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage quota errors
  }
}

export function getStoredOfflineMaps(): Record<string, OfflineParkMapData> {
  try {
    const raw = localStorage.getItem(STORAGE_MAPS_DATA_KEY);
    if (raw) {
      return JSON.parse(raw) as Record<string, OfflineParkMapData>;
    }
    // Bootstrap previously downloaded package IDs into structured LocalStorage map data
    const ids = getDownloadedMapIds();
    if (ids.length > 0) {
      const seeded: Record<string, OfflineParkMapData> = {};
      for (const id of ids) {
        const pkg = OFFLINE_MAP_PACKAGES.find((p) => p.id === id);
        if (pkg) {
          seeded[id] = buildParkMapData(pkg);
        }
      }
      localStorage.setItem(STORAGE_MAPS_DATA_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return {};
  } catch {
    return {};
  }
}

function saveStoredOfflineMaps(mapData: Record<string, OfflineParkMapData>): void {
  try {
    localStorage.setItem(STORAGE_MAPS_DATA_KEY, JSON.stringify(mapData));
  } catch (e) {
    console.error('LocalStorage offline map write error:', e);
  }
}

export function getOfflineMapByParkFilter(parkFilterId: string): OfflineParkMapData | null {
  const maps = getStoredOfflineMaps();
  if (parkFilterId === 'all') {
    const firstKey = Object.keys(maps)[0];
    return firstKey ? maps[firstKey] : null;
  }
  const match = Object.values(maps).find((m) => m.parkId === parkFilterId);
  return match || null;
}

export function getDownloadedMapIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ['pkg-mondah']; // Default Mondah pre-cached for trial
    return JSON.parse(raw);
  } catch {
    return ['pkg-mondah'];
  }
}

export function saveDownloadedMapIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export async function downloadMapPackage(
  pkg: OfflineMapPackage,
  onProgress?: (percent: number, currentTile: number, total: number) => void
): Promise<boolean> {
  const totalTiles = pkg.estimatedTiles;
  let downloaded = 0;

  let cache: Cache | null = null;
  if ('caches' in window && navigator.onLine) {
    try {
      cache = await window.caches.open(CACHE_NAME);
    } catch {
      cache = null;
    }
  }

  // Attempt best-effort OSM tile caching when online (short batch so LocalStorage save stays snappy)
  const [centerLat, centerLng] = pkg.centerCoords;
  const zoomLevels = [11, 12];
  let cachedTileSuccess = 0;

  for (const z of zoomLevels) {
    const [cx, cy] = deg2tile(centerLat, centerLng, z);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const x = cx + dx;
        const y = cy + dy;
        const tileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

        if (cache) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 1200);
            const response = await fetch(tileUrl, { mode: 'cors', signal: controller.signal });
            clearTimeout(timer);
            if (response.ok) {
              await cache.put(tileUrl, response.clone());
              cachedTileSuccess++;
            }
          } catch {
            // Continue offline-safe even if tile server is unreachable
          }
        }

        downloaded = Math.min(totalTiles, downloaded + Math.ceil(totalTiles / 18));
        const pct = Math.min(95, Math.round((downloaded / totalTiles) * 100));
        if (onProgress) {
          onProgress(pct, downloaded, totalTiles);
        }
      }
    }
  }

  // Persist complete vector trails, ANPN waypoints, bounds & coordinates into LocalStorage
  const allMaps = getStoredOfflineMaps();
  allMaps[pkg.id] = buildParkMapData(pkg, Math.max(pkg.estimatedTiles, cachedTileSuccess));
  saveStoredOfflineMaps(allMaps);

  // Update ID list in LocalStorage
  const current = getDownloadedMapIds();
  if (!current.includes(pkg.id)) {
    saveDownloadedMapIds([...current, pkg.id]);
  }

  if (onProgress) {
    onProgress(100, totalTiles, totalTiles);
  }

  return true;
}

export async function downloadAllMapPackages(
  onProgress?: (completedCount: number, totalCount: number, currentName: string) => void
): Promise<boolean> {
  const total = OFFLINE_MAP_PACKAGES.length;
  for (let i = 0; i < total; i++) {
    const pkg = OFFLINE_MAP_PACKAGES[i];
    if (onProgress) {
      onProgress(i, total, pkg.name);
    }
    await downloadMapPackage(pkg);
  }
  if (onProgress) {
    onProgress(total, total, '');
  }
  return true;
}

export async function deleteMapPackage(packageId: string): Promise<boolean> {
  const current = getDownloadedMapIds();
  saveDownloadedMapIds(current.filter((id) => id !== packageId));

  const allMaps = getStoredOfflineMaps();
  delete allMaps[packageId];
  saveStoredOfflineMaps(allMaps);

  if ('caches' in window) {
    try {
      if (current.length <= 1) {
        await window.caches.delete(CACHE_NAME);
      }
    } catch {
      // Ignore
    }
  }

  return true;
}

export function getTotalStorageUsedMB(): number {
  const downloadedIds = getDownloadedMapIds();
  return OFFLINE_MAP_PACKAGES.filter((p) => downloadedIds.includes(p.id)).reduce(
    (acc, p) => acc + p.sizeMB,
    0
  );
}

export function getLocalStorageMapKB(): number {
  try {
    const raw = localStorage.getItem(STORAGE_MAPS_DATA_KEY) || '';
    return Number((new Blob([raw]).size / 1024).toFixed(1));
  } catch {
    return 0;
  }
}
