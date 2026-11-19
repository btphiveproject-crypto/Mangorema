/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  isCached?: boolean;
}

export const KEY_WEATHER_ZONES: WeatherZone[] = [
  {
    id: 'mondah',
    name: 'Parc National de la Mondah',
    shortName: 'Mondah',
    region: 'Cap Estérias · Estuaire',
    lat: 0.5833,
    lon: 9.35,
  },
  {
    id: 'pongara',
    name: 'Parc National de Pongara',
    shortName: 'Pongara',
    region: 'Nyonié · Komo-Océan',
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
    region: 'Kinguélé · Woleu-Ntem',
    lat: 0.45,
    lon: 10.2833,
  },
  {
    id: 'wonga',
    name: 'Réserve de Wonga-Wongué',
    shortName: 'Wonga-Wongué',
    region: 'Ogooué-Maritime',
    lat: -0.45,
    lon: 9.4,
  },
];

const WEATHER_CACHE_KEY = 'mangorema_weather_cache_v1';

export function mapWmoCodeToFrench(code: number): {
  label: string;
  emoji: string;
  category: 'clear' | 'cloudy' | 'fog' | 'rain' | 'storm';
} {
  if (code === 0) return { label: 'Ciel dégagé', emoji: '☀️', category: 'clear' };
  if (code === 1) return { label: 'Principalement clair', emoji: '🌤️', category: 'clear' };
  if (code === 2) return { label: 'Partiellement nuageux', emoji: '⛅', category: 'cloudy' };
  if (code === 3) return { label: 'Couvert (canopée)', emoji: '☁️', category: 'cloudy' };
  if (code === 45 || code === 48) return { label: 'Brume matinale', emoji: '🌫️', category: 'fog' };
  if (code >= 51 && code <= 57) return { label: 'Bruine tropicale', emoji: '🌦️', category: 'rain' };
  if (code >= 61 && code <= 65) return { label: 'Pluie équatoriale', emoji: '🌧️', category: 'rain' };
  if (code >= 66 && code <= 67) return { label: 'Pluie soutenue', emoji: '🌧️', category: 'rain' };
  if (code >= 80 && code <= 82) return { label: 'Averses passagères', emoji: '🌦️', category: 'rain' };
  if (code >= 95 && code <= 99) return { label: 'Orage équatorial', emoji: '⛈️', category: 'storm' };
  return { label: 'Temps variable', emoji: '⛅', category: 'cloudy' };
}

function getTrailAdvisory(
  code: number,
  precipitation: number,
  windSpeed: number
): ZoneWeatherData['trailAdvisory'] {
  const mapped = mapWmoCodeToFrench(code);
  if (mapped.category === 'storm' || windSpeed > 35) {
    return {
      level: 'alert',
      text: 'Orage ou rafales sous canopée : évitez les crêtes et zones boisées hautes.',
    };
  }
  if (mapped.category === 'rain' || precipitation > 0.5) {
    return {
      level: 'caution',
      text: 'Pistes glissantes en sous-bois : guêtres et poncho imperméable conseillés.',
    };
  }
  return {
    level: 'optimal',
    text: 'Conditions favorables sur les sentiers · Visibilité & adhérence optimales.',
  };
}

function formatDayLabel(dateStr: string, index: number): string {
  if (index === 0) return "Auj.";
  if (index === 1) return "Demain";
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(d).replace('.', '');
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

function writeWeatherCache(zoneId: string, data: ZoneWeatherData): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = readWeatherCache();
    existing[zoneId] = data;
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedZoneWeather(zoneId: string): ZoneWeatherData | null {
  const cache = readWeatherCache();
  return cache[zoneId] ? { ...cache[zoneId], isCached: true } : null;
}

export async function fetchZoneWeather(zone: WeatherZone): Promise<ZoneWeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${zone.lat}&longitude=${zone.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Africa%2FLagos&forecast_days=4`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const json = await response.json();

    const current = json.current;
    const dailyRaw = json.daily;

    const code = typeof current.weather_code === 'number' ? current.weather_code : 2;
    const precipitation = typeof current.precipitation === 'number' ? current.precipitation : 0;
    const windSpeed = typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : 0;
    const mapped = mapWmoCodeToFrench(code);

    const daily: DailyForecastItem[] = (dailyRaw?.time || []).map((date: string, idx: number) => ({
      date,
      dayLabel: formatDayLabel(date, idx),
      weatherCode: dailyRaw.weather_code?.[idx] ?? 2,
      tempMax: Math.round(dailyRaw.temperature_2m_max?.[idx] ?? 29),
      tempMin: Math.round(dailyRaw.temperature_2m_min?.[idx] ?? 23),
      precipProbMax: dailyRaw.precipitation_probability_max?.[idx] ?? 20,
    }));

    const data: ZoneWeatherData = {
      zoneId: zone.id,
      temperature: Math.round(current.temperature_2m),
      apparentTemperature: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      precipitation: Number(precipitation.toFixed(1)),
      windSpeed: Math.round(windSpeed),
      weatherCode: code,
      conditionLabel: mapped.label,
      conditionEmoji: mapped.emoji,
      trailAdvisory: getTrailAdvisory(code, precipitation, windSpeed),
      daily,
      fetchedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isCached: false,
    };

    writeWeatherCache(zone.id, data);
    return data;
  } catch (error) {
    const cached = getCachedZoneWeather(zone.id);
    if (cached) {
      return cached;
    }
    throw error;
  }
}
