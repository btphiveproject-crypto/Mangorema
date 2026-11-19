/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudSun,
  Droplets,
  Wind,
  CloudRain,
  RefreshCw,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Thermometer,
  WifiOff,
} from 'lucide-react';
import {
  KEY_WEATHER_ZONES,
  WeatherZone,
  ZoneWeatherData,
  fetchZoneWeather,
  getCachedZoneWeather,
  mapWmoCodeToFrench,
} from '../utils/weatherService';

export const WeatherWidget: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<WeatherZone>(KEY_WEATHER_ZONES[0]); // Parc National de la Mondah par défaut
  const [weather, setWeather] = useState<ZoneWeatherData | null>(() =>
    getCachedZoneWeather(KEY_WEATHER_ZONES[0].id)
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadWeather = useCallback(async (zone: WeatherZone) => {
    setIsLoading(true);
    setErrorMsg(null);
    const cached = getCachedZoneWeather(zone.id);
    if (cached) {
      setWeather(cached);
    }

    try {
      const liveData = await fetchZoneWeather(zone);
      setWeather(liveData);
    } catch (err) {
      if (!cached) {
        setErrorMsg('Impossible de joindre la station météo Open-Meteo (vérifiez la connexion).');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather(selectedZone);
  }, [selectedZone, loadWeather]);

  return (
    <div className="bg-gradient-to-br from-white via-stone-50 to-amber-50/40 dark:from-[#121814] dark:via-slate-900/95 dark:to-[#0d120f] border border-amber-500/35 dark:border-amber-500/30 rounded-3xl p-4 shadow-xl space-y-3 relative overflow-hidden">
      {/* Subtle Copper Atmosphere Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl copper-gradient text-slate-950 flex items-center justify-center shadow-md shrink-0">
            <CloudSun className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white truncate">
                Météo Expéditions en Direct
              </h3>
              {weather?.isCached ? (
                <span className="text-[9px] bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/35 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                  <WifiOff className="w-2.5 h-2.5" /> Cache
                </span>
              ) : (
                <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/35 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
              Open-Meteo · Coordonnées GPS des parcs nationaux
            </p>
          </div>
        </div>

        <button
          onClick={() => loadWeather(selectedZone)}
          disabled={isLoading}
          title="Actualiser les prévisions météo"
          className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 border border-stone-200 dark:border-white/10 text-amber-700 dark:text-amber-400 transition active:scale-95 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Zone Selector Chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 relative z-10">
        {KEY_WEATHER_ZONES.map((zone) => {
          const isSelected = zone.id === selectedZone.id;
          return (
            <button
              key={zone.id}
              onClick={() => setSelectedZone(zone)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1 shrink-0 ${
                isSelected
                  ? 'copper-gradient text-slate-950 shadow-md'
                  : 'bg-stone-100 dark:bg-slate-950/70 border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-amber-500/40 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <MapPin className={`w-3 h-3 ${isSelected ? 'text-slate-950' : 'text-amber-600 dark:text-amber-400'}`} />
              <span>{zone.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* Main Weather Card Content */}
      {errorMsg && !weather ? (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-500/35 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-red-800 dark:text-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span className="text-[11px]">{errorMsg}</span>
          </div>
          <button
            onClick={() => loadWeather(selectedZone)}
            className="px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 rounded-lg text-[10px] font-bold shrink-0"
          >
            Réessayer
          </button>
        </div>
      ) : weather ? (
        <div className="space-y-3 relative z-10">
          {/* Current Zone Summary */}
          <div className="bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider block truncate">
                {selectedZone.name}
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate">
                {selectedZone.region} · MàJ {weather.fetchedAt}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl leading-none" aria-hidden="true">
                  {weather.conditionEmoji}
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {weather.conditionLabel}
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    Ressenti {weather.apparentTemperature}°C
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-3xl font-black text-amber-700 dark:text-amber-400 font-mono leading-none">
                {weather.temperature}°C
              </div>
              <span className="text-[9.5px] text-slate-600 dark:text-slate-400 block mt-1 font-mono">
                {selectedZone.lat.toFixed(2)}°N, {selectedZone.lon.toFixed(2)}°E
              </span>
            </div>
          </div>

          {/* 3 Outdoor Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-white/5 rounded-xl p-2 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-slate-600 dark:text-slate-400 block">Humidité</span>
                <strong className="text-xs text-slate-900 dark:text-white font-mono">{weather.humidity}%</strong>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-white/5 rounded-xl p-2 flex items-center gap-2">
              <Wind className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-slate-600 dark:text-slate-400 block">Vent</span>
                <strong className="text-xs text-slate-900 dark:text-white font-mono">{weather.windSpeed} km/h</strong>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-white/5 rounded-xl p-2 flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-slate-600 dark:text-slate-400 block">Précip.</span>
                <strong className="text-xs text-slate-900 dark:text-white font-mono">{weather.precipitation} mm</strong>
              </div>
            </div>
          </div>

          {/* ANPN Trail Advisory Banner */}
          <div
            className={`rounded-xl px-3 py-2 border flex items-center gap-2 text-[11px] ${
              weather.trailAdvisory.level === 'alert'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-500/40 text-red-900 dark:text-red-200'
                : weather.trailAdvisory.level === 'caution'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/40 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/35 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            {weather.trailAdvisory.level === 'optimal' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : weather.trailAdvisory.level === 'caution' ? (
              <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span className="leading-snug font-medium">{weather.trailAdvisory.text}</span>
          </div>

          {/* 4-Day Forecast Strip */}
          {weather.daily.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {weather.daily.map((day) => {
                const dayCond = mapWmoCodeToFrench(day.weatherCode);
                return (
                  <div
                    key={day.date}
                    className="bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-white/5 rounded-xl p-2 text-center space-y-0.5"
                  >
                    <span className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 uppercase block">
                      {day.dayLabel}
                    </span>
                    <span className="text-base block leading-tight" title={dayCond.label}>
                      {dayCond.emoji}
                    </span>
                    <div className="text-[10.5px] font-mono">
                      <strong className="text-slate-900 dark:text-white">{day.tempMax}°</strong>
                      <span className="text-slate-500">/{day.tempMin}°</span>
                    </div>
                    <span className="text-[9px] text-sky-700 dark:text-sky-400 font-semibold block">
                      💧 {day.precipProbMax}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Loading Skeleton */
        <div className="bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-white/5 rounded-2xl p-5 flex items-center justify-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
          <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
          <span>Récupération météo Open-Meteo pour {selectedZone.shortName}...</span>
        </div>
      )}
    </div>
  );
};
