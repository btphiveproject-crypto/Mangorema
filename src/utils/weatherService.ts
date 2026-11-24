/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AppLanguage } from '../types';

export interface WeatherZone {
  id: string;
  name: string;
  shortName: string;
  region: string;
  lat: number;
  lon: number;
}

export interface DailyForecastItem {
  date: string;
  dayLabel: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipProbMax: number;
}

export interface ZoneWeatherData {
  zoneId: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  conditionLabel: string;
  conditionEmoji: string;
  trailAdvisory: {
    level: 'optimal' | 'caution' | 'alert';
    text: string;
  };
  daily: DailyForecastItem[];
  fetchedAt: string;
  fetchedAtMs: number;
  isCached?: boolean;
}

export const KEY_WEATHER_ZONES: WeatherZone[] = [
  {
    id: 'mondah',
    name: 'Parc National de la Mondah',
    shortName: 'Mondah',
    region: 'Estuaire · Cap Estérias',
    lat: 0.5833,
    lon: 9.35,
  },
  {
    id: 'loango',
    name: 'Parc National de Loango',
    shortName: 'Loango',
    region: 'Ogooué-Maritime · Iguéla',
    lat: -2.1667,
    lon: 9.5667,
  },
  {
    id: 'lope',
    name: 'Parc National de la Lopé',
    shortName: 'La Lopé',
    region: 'Ogooué-Ivindo · UNESCO',
    lat: -0.2,
    lon: 11.6,
  },
  {
    id: 'pongara',
    name: 'Parc National de Pongara',
    shortName: 'Pongara',
    region: 'Estuaire · Nyonié',
    lat: 0.0333,
    lon: 9.3167,
  },
  {
    id: 'ivindo',
    name: "Parc National de l'Ivindo",
    shortName: 'Ivindo',
    region: 'Makokou · Chutes Kongou',
    lat: 0.5167,
    lon: 12.7833,
  },
  {
    id: 'cristal',
    name: 'Parc Nat. Monts de Cristal',
    shortName: 'Mts Cristal',
    region: 'Woleu-Ntem · Kinguélé',
    lat: 0.45,
    lon: 10.2833,
  },
];

const WEATHER_CACHE_KEY = 'mangorema_weather_cache_v2';

type ConditionCategory = 'clear' | 'cloudy' | 'fog' | 'rain' | 'storm';

const WMO_LABELS: Record<AppLanguage, Record<string, string>> = {
  fr: {
    clear0: 'Ciel dégagé',
    clear1: 'Principalement clair',
    cloudy2: 'Partiellement nuageux',
    cloudy3: 'Couvert (canopée)',
    fog: 'Brume tropicale',
    drizzle: 'Bruine équatoriale',
    rain: 'Pluie équatoriale',
    heavyRain: 'Pluie soutenue',
    showers: 'Averses passagères',
    storm: 'Orage équatorial',
    variable: 'Temps variable',
  },
  en: {
    clear0: 'Clear sky',
    clear1: 'Mainly clear',
    cloudy2: 'Partly cloudy',
    cloudy3: 'Overcast canopy',
    fog: 'Tropical mist',
    drizzle: 'Equatorial drizzle',
    rain: 'Equatorial rain',
    heavyRain: 'Heavy rainfall',
    showers: 'Passing showers',
    storm: 'Equatorial storm',
    variable: 'Variable weather',
  },
  ar: {
    clear0: 'سماء صافية',
    clear1: 'صحو غالبًا',
    cloudy2: 'غائم جزئيًا',
    cloudy3: 'غائم فوق الغابة',
    fog: 'ضباب استوائي',
    drizzle: 'رذاذ استوائي',
    rain: 'أمطار استوائية',
    heavyRain: 'أمطار غزيرة',
    showers: 'زخات عابرة',
    storm: 'عاصفة رعدية',
    variable: 'طقس متقلب',
  },
};

export function mapWmoCodeToLocalized(
  code: number,
  lang: AppLanguage = 'fr'
): {
  label: string;
  emoji: string;
  category: ConditionCategory;
} {
  const dict = WMO_LABELS[lang] || WMO_LABELS.fr;
  if (code === 0) return { label: dict.clear0, emoji: '☀️', category: 'clear' };
  if (code === 1) return { label: dict.clear1, emoji: '🌤️', category: 'clear' };
  if (code === 2) return { label: dict.cloudy2, emoji: '⛅', category: 'cloudy' };
  if (code === 3) return { label: dict.cloudy3, emoji: '☁️', category: 'cloudy' };
  if (code === 45 || code === 48) return { label: dict.fog, emoji: '🌫️', category: 'fog' };
  if (code >= 51 && code <= 57) return { label: dict.drizzle, emoji: '🌦️', category: 'rain' };
  if (code >= 61 && code <= 65) return { label: dict.rain, emoji: '🌧️', category: 'rain' };
  if (code >= 66 && code <= 67) return { label: dict.heavyRain, emoji: '🌧️', category: 'rain' };
  if (code >= 80 && code <= 82) return { label: dict.showers, emoji: '🌦️', category: 'rain' };
  if (code >= 95 && code <= 99) return { label: dict.storm, emoji: '⛈️', category: 'storm' };
  return { label: dict.variable, emoji: '⛅', category: 'cloudy' };
}

export function mapWmoCodeToFrench(code: number) {
  return mapWmoCodeToLocalized(code, 'fr');
}

export function getTrailAdvisory(
  code: number,
  precipitation: number,
  windSpeed: number,
  lang: AppLanguage = 'fr'
): ZoneWeatherData['trailAdvisory'] {
  const mapped = mapWmoCodeToLocalized(code, lang);
  if (mapped.category === 'storm' || windSpeed > 35) {
    return {
      level: 'alert',
      text:
        lang === 'en'
          ? 'Storm or high canopy gusts: avoid exposed ridges and tall forest zones.'
          : lang === 'ar'
          ? 'عواصف أو رياح قوية تحت الأشجار: تجنّب المرتفعات والمناطق المشجرة العالية.'
          : 'Orage ou rafales sous canopée : évitez les crêtes et zones boisées hautes.',
    };
  }
  if (mapped.category === 'rain' || precipitation > 0.5) {
    return {
      level: 'caution',
      text:
        lang === 'en'
          ? 'Slippery forest tracks: gaiters and waterproof poncho recommended.'
          : lang === 'ar'
          ? 'مسارات غابية زلقة: يُنصح بارتداء أحذية مقاومة للماء ومعطف مطري.'
          : 'Pistes glissantes en sous-bois : guêtres et poncho imperméable conseillés.',
    };
  }
  return {
    level: 'optimal',
    text:
      lang === 'en'
        ? 'Favorable trail conditions · Good visibility and dry footing.'
        : lang === 'ar'
        ? 'ظروف مثالية على المسارات · رؤية واضحة وثبات جيد.'
        : 'Conditions favorables sur les sentiers · Visibilité & adhérence optimales.',
  };
}

export function formatDayLabel(dateStr: string, index: number, lang: AppLanguage = 'fr'): string {
  if (index === 0) return lang === 'en' ? 'Today' : lang === 'ar' ? 'اليوم' : 'Auj.';
  if (index === 1) return lang === 'en' ? 'Tmrw' : lang === 'ar' ? 'غدًا' : 'Dem.';
  try {
    const d = new Date(dateStr + 'T12:00:00');
    const locale = lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar-SA' : 'fr-FR';
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d).replace('.', '');
  } catch {
    return dateStr.slice(5);
  }
}

function readWeatherCache(): Record<string, ZoneWeatherData> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeWeatherCacheMap(entries: Record<string, ZoneWeatherData>): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = readWeatherCache();
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ ...existing, ...entries }));
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedZoneWeather(zoneId: string): ZoneWeatherData | null {
  const cache = readWeatherCache();
  return cache[zoneId] ? { ...cache[zoneId], isCached: true } : null;
}

export function getAllCachedParksWeather(): Record<string, ZoneWeatherData> {
  const cache = readWeatherCache();
  const out: Record<string, ZoneWeatherData> = {};
  for (const zone of KEY_WEATHER_ZONES) {
    if (cache[zone.id]) {
      out[zone.id] = { ...cache[zone.id], isCached: true };
    }
  }
  return out;
}

interface OpenMeteoPayloadItem {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
}

function parseOpenMeteoItem(zone: WeatherZone, json: OpenMeteoPayloadItem): ZoneWeatherData {
  const current = json.current || {};
  const dailyRaw = json.daily;

  const code = typeof current.weather_code === 'number' ? current.weather_code : 2;
  const precipitation = typeof current.precipitation === 'number' ? current.precipitation : 0;
  const windSpeed = typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : 0;
  const mapped = mapWmoCodeToLocalized(code, 'fr');
  const nowMs = Date.now();

  const daily: DailyForecastItem[] = (dailyRaw?.time || []).map((date: string, idx: number) => ({
    date,
    dayLabel: formatDayLabel(date, idx, 'fr'),
    weatherCode: dailyRaw?.weather_code?.[idx] ?? 2,
    tempMax: Math.round(dailyRaw?.temperature_2m_max?.[idx] ?? 29),
    tempMin: Math.round(dailyRaw?.temperature_2m_min?.[idx] ?? 23),
    precipProbMax: dailyRaw?.precipitation_probability_max?.[idx] ?? 20,
  }));

  return {
    zoneId: zone.id,
    temperature: Math.round(typeof current.temperature_2m === 'number' ? current.temperature_2m : 27),
    apparentTemperature: Math.round(
      typeof current.apparent_temperature === 'number' ? current.apparent_temperature : 30
    ),
    humidity: Math.round(typeof current.relative_humidity_2m === 'number' ? current.relative_humidity_2m : 82),
    precipitation: Number(precipitation.toFixed(1)),
    windSpeed: Math.round(windSpeed),
    weatherCode: code,
    conditionLabel: mapped.label,
    conditionEmoji: mapped.emoji,
    trailAdvisory: getTrailAdvisory(code, precipitation, windSpeed, 'fr'),
    daily,
    fetchedAt: new Date(nowMs).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    fetchedAtMs: nowMs,
    isCached: false,
  };
}

export async function fetchAllParksWeather(
  zones: WeatherZone[] = KEY_WEATHER_ZONES
): Promise<Record<string, ZoneWeatherData>> {
  const latitudes = zones.map((z) => z.lat).join(',');
  const longitudes = zones.map((z) => z.lon).join(',');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Africa%2FLagos&forecast_days=4`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = (await response.json()) as OpenMeteoPayloadItem | OpenMeteoPayloadItem[];
    const items: OpenMeteoPayloadItem[] = Array.isArray(json) ? json : [json];

    const result: Record<string, ZoneWeatherData> = {};
    zones.forEach((zone, index) => {
      const payload = items[index];
      if (payload && payload.current) {
        result[zone.id] = parseOpenMeteoItem(zone, payload);
      }
    });

    if (Object.keys(result).length === 0) {
      throw new Error('Empty Open-Meteo response');
    }

    writeWeatherCacheMap(result);
    return result;
  } catch (error) {
    const cached = getAllCachedParksWeather();
    if (Object.keys(cached).length > 0) {
      return cached;
    }
    throw error;
  }
}

export async function fetchZoneWeather(zone: WeatherZone): Promise<ZoneWeatherData> {
  const all = await fetchAllParksWeather([zone]);
  if (all[zone.id]) {
    return all[zone.id];
  }
  const cached = getCachedZoneWeather(zone.id);
  if (cached) return cached;
  throw new Error('Weather unavailable');
}
