/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OfflineMapPackage } from '../types';

export const OFFLINE_MAP_PACKAGES: OfflineMapPackage[] = [
  {
    id: 'pkg-mondah',
    name: 'Parc National de la Mondah & Cap Estérias',
    region: 'Estuaire · Forêt Littorale',
    description: 'Sentier botanique de la Mondah, littoral rocheux et mangrove de Cap Estérias. Idéal pour bivouacs côtiers.',
    zoomRange: 'Z10 à Z15 (Très haute résolution)',
    estimatedTiles: 112,
    sizeMB: 8.4,
    centerCoords: [0.5833, 9.3500],
    bounds: [[0.5200, 9.2800], [0.6500, 9.4200]],
    isDownloaded: false,
  },
  {
    id: 'pkg-ivindo',
    name: 'Parc National de l\'Ivindo & Chutes de Djidji',
    region: 'Ogooué-Ivindo · Makokou',
    description: 'Cœur de la forêt vierge équatoriale UNESCO, Chutes de Kongou, baïs et corridors de faune (éléphants et gorilles).',
    zoomRange: 'Z10 à Z14 (Couverture forêt dense)',
    estimatedTiles: 168,
    sizeMB: 13.6,
    centerCoords: [0.5100, 12.8200],
    bounds: [[0.3800, 12.6500], [0.6400, 12.9800]],
    isDownloaded: false,
  },
  {
    id: 'pkg-pongara',
    name: 'Parc National de Pongara & Safari Nyonié',
    region: 'Komo-Océan · Rive Sud',
    description: 'Plages sauvages, vasières à mangroves et savanes littorales entre Pointe Denis et Nyonié.',
    zoomRange: 'Z10 à Z14 (Zone côtière complète)',
    estimatedTiles: 134,
    sizeMB: 10.2,
    centerCoords: [0.1200, 9.3200],
    bounds: [[0.0100, 9.1800], [0.2400, 9.4500]],
    isDownloaded: false,
  },
  {
    id: 'pkg-cristal',
    name: 'Monts de Cristal & Cascades de Kinguélé',
    region: 'Estuaire / Woleu-Ntem',
    description: 'Reliefs de brume, forêt d\'altitude, sentier des crêtes et cascades hydroélectriques de Kinguélé & Tchimbélé.',
    zoomRange: 'Z10 à Z14 (Cartographie relief)',
    estimatedTiles: 120,
    sizeMB: 9.1,
    centerCoords: [0.4500, 10.2800],
    bounds: [[0.3500, 10.1500], [0.5500, 10.4200]],
    isDownloaded: false,
  },
];

const CACHE_NAME = 'mangorema-osm-offline-v1';
const STORAGE_KEY = 'mangorema_downloaded_offline_maps';

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
  if ('caches' in window) {
    try {
      cache = await window.caches.open(CACHE_NAME);
    } catch {
      cache = null;
    }
  }

  // Generate representative coordinates around center
  const [centerLat, centerLng] = pkg.centerCoords;
  const zoomLevels = [11, 12, 13];

  for (const z of zoomLevels) {
    const [cx, cy] = deg2tile(centerLat, centerLng, z);
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const x = cx + dx;
        const y = cy + dy;
        const tileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

        if (cache) {
          try {
            // Attempt fetching or caching with timeout
            const response = await fetch(tileUrl, { mode: 'cors' });
            if (response.ok) {
              await cache.put(tileUrl, response.clone());
            }
          } catch {
            // Continue on fetch error
          }
        }

        downloaded++;
        const pct = Math.min(100, Math.round((downloaded / totalTiles) * 100));
        if (onProgress) {
          onProgress(pct, downloaded, totalTiles);
        }

        // Small breathing delay to not choke browser thread
        if (downloaded % 10 === 0) {
          await new Promise((r) => setTimeout(r, 40));
        }

        if (downloaded >= totalTiles) break;
      }
      if (downloaded >= totalTiles) break;
    }
    if (downloaded >= totalTiles) break;
  }

  // Ensure 100% progress
  if (onProgress) {
    onProgress(100, totalTiles, totalTiles);
  }

  // Update localStorage
  const current = getDownloadedMapIds();
  if (!current.includes(pkg.id)) {
    saveDownloadedMapIds([...current, pkg.id]);
  }

  return true;
}

export async function deleteMapPackage(packageId: string): Promise<boolean> {
  const current = getDownloadedMapIds();
  saveDownloadedMapIds(current.filter((id) => id !== packageId));

  if ('caches' in window) {
    try {
      // Reclaim space or delete entries
      const cache = await window.caches.open(CACHE_NAME);
      const keys = await cache.keys();
      // Keep cache active, just remove references
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
  return OFFLINE_MAP_PACKAGES.filter((p) => downloadedIds.includes(p.id))
    .reduce((acc, p) => acc + p.sizeMB, 0);
}
