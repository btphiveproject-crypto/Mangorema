export const DEFAULT_LIBREVILLE_COORDS: [number, number] = [0.4162, 9.4673];

export const GABON_PARK_COORDS_PRESETS: Array<{
  keywords: string[];
  label: string;
  coords: [number, number];
}> = [
  {
    keywords: ['mondah', 'arboretum', 'raponda'],
    label: 'Parc National de la Mondah',
    coords: [0.5833, 9.35],
  },
  {
    keywords: ['cap estérias', 'esterias', 'phare'],
    label: 'Cap Estérias',
    coords: [0.6167, 9.3333],
  },
  {
    keywords: ['pongara', 'nyonié', 'nyonie', 'pointe denis'],
    label: 'Parc National de Pongara',
    coords: [0.0333, 9.3167],
  },
  {
    keywords: ['ivindo', 'djidji', 'kongou', 'makokou', 'langoué', 'langoue'],
    label: "Parc National de l'Ivindo",
    coords: [0.5167, 12.7833],
  },
  {
    keywords: ['cristal', 'kinguélé', 'kinguele', 'tchimbélé', 'tchimbele'],
    label: 'Monts de Cristal',
    coords: [0.45, 10.2833],
  },
  {
    keywords: ['lopé', 'lope', 'okanda'],
    label: 'Parc National de la Lopé',
    coords: [-0.205, 11.585],
  },
  {
    keywords: ['loango', 'iguéla', 'iguela', 'omboué', 'omboue'],
    label: 'Parc National de Loango',
    coords: [-2.15, 9.5833],
  },
  {
    keywords: ['akanda'],
    label: 'Parc National d’Akanda',
    coords: [0.556, 9.545],
  },
  {
    keywords: ['wonga', 'wongué', 'wongue'],
    label: 'Réserve de Wonga-Wongué',
    coords: [-0.45, 9.4],
  },
  {
    keywords: ['owendo'],
    label: 'Owendo',
    coords: [0.295, 9.505],
  },
  {
    keywords: ['kango', 'komo'],
    label: 'Kango / Komo',
    coords: [0.1667, 10.1],
  },
];

export function isValidCoords(coords?: [number, number] | null): coords is [number, number] {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lat, lng] = coords;
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function resolveParkCoords(locationOrPark?: string): [number, number] {
  const clean = (locationOrPark || '').toLowerCase().trim();
  if (!clean) return DEFAULT_LIBREVILLE_COORDS;
  for (const preset of GABON_PARK_COORDS_PRESETS) {
    if (preset.keywords.some((kw) => clean.includes(kw))) {
      return preset.coords;
    }
  }
  return DEFAULT_LIBREVILLE_COORDS;
}

export function calculateDistanceKm(from: [number, number], to: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(to[0] - from[0]);
  const dLng = toRad(to[1] - from[1]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from[0])) * Math.cos(toRad(to[0])) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '—';
  if (km < 1) {
    return `${Math.max(10, Math.round(km * 1000))} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

export function formatCoordsPair(coords: [number, number]): string {
  const [lat, lng] = coords;
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'O';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

export function buildDirectionsUrl(coords: [number, number]): string {
  const lat = Number(coords[0]).toFixed(5);
  const lng = Number(coords[1]).toFixed(5);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
}

const STORAGE_LOC_ENABLED_KEY = 'mangorema_activity_loc_enabled_v1';
const STORAGE_USER_GPS_KEY = 'mangorema_user_gps_coords_v1';

export function getStoredActivityLocationsEnabled(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_LOC_ENABLED_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

export function saveStoredActivityLocationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_LOC_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage quota errors
  }
}

export function getStoredUserGpsCoords(): [number, number] | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_GPS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidCoords(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveStoredUserGpsCoords(coords: [number, number] | null): void {
  try {
    if (!coords) {
      localStorage.removeItem(STORAGE_USER_GPS_KEY);
    } else if (isValidCoords(coords)) {
      localStorage.setItem(STORAGE_USER_GPS_KEY, JSON.stringify(coords));
    }
  } catch {
    // Ignore storage quota errors
  }
}
