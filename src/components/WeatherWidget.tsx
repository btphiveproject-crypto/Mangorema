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
  AlertTriangle,
  CheckCircle2,
  Compass,
  Thermometer,
  ChevronDown,
} from 'lucide-react';
import {
  KEY_WEATHER_ZONES,
  WeatherZone,
  ZoneWeatherData,
  fetchAllParksWeather,
  getAllCachedParksWeather,
  mapWmoCodeToLocalized,
  getTrailAdvisory,
  formatDayLabel,
} from '../utils/weatherService';
import { useLanguage } from '../contexts/LanguageContext';

export const WeatherWidget: React.FC = () => {
  const { lang, t } = useLanguage();
  const [selectedZone, setSelectedZone] = useState<WeatherZone>(KEY_WEATHER_ZONES[0]);
  const [weatherByZone, setWeatherByZone] = useState<Record<string, ZoneWeatherData>>(() =>
    getAllCachedParksWeather()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showMobileForecast, setShowMobileForecast] = useState<boolean>(false);

  const loadAllWeather = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const cached = getAllCachedParksWeather();
    if (Object.keys(cached).length > 0) {
      setWeatherByZone((prev) => ({ ...cached, ...prev }));
    }

    try {
      const liveMap = await fetchAllParksWeather(KEY_WEATHER_ZONES);
      setWeatherByZone(liveMap);
    } catch {
      if (Object.keys(cached).length === 0) {
        setErrorMsg(t.weather.errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [t.weather.errorMsg]);

  useEffect(() => {
    loadAllWeather();
  }, [loadAllWeather]);

  const weather = weatherByZone[selectedZone.id] || null;
  const localizedZone = t.weather.parkNames[selectedZone.id] || {
    name: selectedZone.name,
    shortName: selectedZone.shortName,
    region: selectedZone.region,
  };

  const localizedCondition = weather
    ? mapWmoCodeToLocalized(weather.weatherCode, lang)
    : null;
  const localizedAdvisory = weather
    ? getTrailAdvisory(weather.weatherCode, weather.precipitation, weather.windSpeed, lang)
    : null;

  return (
    <section
      aria-label={t.weather.title}
      className="glass-card border border-white/60 dark:border-white/12 rounded-3xl p-4 space-y-3"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center shadow-sm shrink-0">
            <CloudSun className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white truncate">
              {t.weather.title}
            </h2>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
              {t.weather.subtitle}
              <span aria-hidden="true"> · </span>
              <span className={weather?.isCached ? 'text-amber-700 dark:text-amber-400 font-medium' : 'text-emerald-700 dark:text-emerald-400 font-medium'}>
                {weather?.isCached ? t.weather.cachedTag : t.weather.liveTag}
              </span>
              {weather?.fetchedAt && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono tabular-nums">{weather.fetchedAt}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadAllWeather}
          disabled={isLoading}
          title={t.weather.refreshTooltip}
          aria-label={t.weather.refreshTooltip}
          className="min-h-[44px] min-w-[44px] rounded-xl glass-surface hover:bg-white/75 dark:hover:bg-white/12 border border-white/60 dark:border-white/12 text-amber-700 dark:text-amber-400 flex items-center justify-center transition active:scale-95 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Interactive Multi-Park Selector Strip with Live Temp Preview */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5" role="tablist" aria-label={t.weather.title}>
        {KEY_WEATHER_ZONES.map((zone) => {
          const isSelected = zone.id === selectedZone.id;
          const zoneData = weatherByZone[zone.id];
          const zoneLabels = t.weather.parkNames[zone.id] || zone;
          const zoneCond = zoneData ? mapWmoCodeToLocalized(zoneData.weatherCode, lang) : null;

          return (
            <button
              key={zone.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedZone(zone)}
              className={`min-h-[44px] px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'copper-gradient text-slate-950 shadow-sm'
                  : 'glass-surface border border-white/55 dark:border-white/12 text-slate-800 dark:text-slate-200 hover:border-amber-500/45 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              {zoneCond && (
                <span className="text-sm leading-none" aria-hidden="true">
                  {zoneCond.emoji}
                </span>
              )}
              <span>{zoneLabels.shortName}</span>
              {zoneData && (
                <span
                  className={`font-mono tabular-nums text-[10.5px] ${
                    isSelected ? 'text-slate-950/90 font-black' : 'text-amber-700 dark:text-amber-400 font-bold'
                  }`}
                >
                  {zoneData.temperature}°
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Park Weather Detail */}
      {errorMsg && !weather ? (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-500/35 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-red-800 dark:text-red-200">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span className="text-[11px] leading-snug">{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={loadAllWeather}
            className="min-h-[40px] px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 rounded-xl text-[11px] font-bold shrink-0"
          >
            {t.weather.retryBtn}
          </button>
        </div>
      ) : weather && localizedCondition && localizedAdvisory ? (
        <div className="space-y-3 pt-1">
          {/* Focused Park Summary (unboxed, spacious) */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 text-start">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400 block truncate">
                {localizedZone.name}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl leading-none" aria-hidden="true">
                  {localizedCondition.emoji}
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {localizedCondition.label}
                  </span>
                  <span className="text-[10.5px] text-slate-600 dark:text-slate-400 flex items-center gap-1 tabular-nums">
                    <Thermometer className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    {t.weather.feelsLike} {weather.apparentTemperature}°C
                  </span>
                </div>
              </div>
            </div>

            <div className="text-end shrink-0">
              <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 font-mono tabular-nums leading-none">
                {weather.temperature}°C
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1 truncate max-w-[110px]">
                {localizedZone.region}
              </span>
            </div>
          </div>

          {/* 3 Outdoor Telemetry Metrics (hairline divided, zero nested clutter) */}
          <div className="grid grid-cols-3 divide-x divide-stone-200 dark:divide-white/10 py-2 border-y border-stone-200/80 dark:border-white/10">
            <div className="pe-2 flex items-center gap-1.5 sm:gap-2">
              <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate">
                  {t.weather.humidity}
                </span>
                <strong className="text-xs text-slate-900 dark:text-white font-mono tabular-nums">
                  {weather.humidity}%
                </strong>
              </div>
            </div>

            <div className="px-2 flex items-center gap-1.5 sm:gap-2">
              <Wind className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate">
                  {t.weather.wind}
                </span>
                <strong className="text-xs text-slate-900 dark:text-white font-mono tabular-nums">
                  {weather.windSpeed} km/h
                </strong>
              </div>
            </div>

            <div className="ps-2 flex items-center gap-1.5 sm:gap-2">
              <CloudRain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate">
                  {t.weather.precip}
                </span>
                <strong className="text-xs text-slate-900 dark:text-white font-mono tabular-nums">
                  {weather.precipitation} mm
                </strong>
              </div>
            </div>
          </div>

          {/* ANPN Trail Condition Advisory + Mobile 4-Day Toggle */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] min-w-0">
              {localizedAdvisory.level === 'optimal' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : localizedAdvisory.level === 'caution' ? (
                <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span
                className={`leading-snug font-medium ${
                  localizedAdvisory.level === 'alert'
                    ? 'text-red-700 dark:text-red-300'
                    : localizedAdvisory.level === 'caution'
                    ? 'text-amber-800 dark:text-amber-300'
                    : 'text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {localizedAdvisory.text}
              </span>
            </div>

            {weather.daily.length > 0 && (
              <button
                type="button"
                onClick={() => setShowMobileForecast((v) => !v)}
                className="sm:hidden shrink-0 px-2.5 py-1 rounded-lg glass-surface text-[10.5px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1"
              >
                <span>4j</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showMobileForecast ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>

          {/* 4-Day Forecast Strip (always visible on sm+, toggleable on mobile) */}
          {weather.daily.length > 0 && (
            <div
              className={`${
                showMobileForecast ? 'grid' : 'hidden sm:grid'
              } grid-cols-4 gap-1.5 pt-1`}
              aria-label={t.weather.forecast4Days}
            >
              {weather.daily.map((day, idx) => {
                const dayCond = mapWmoCodeToLocalized(day.weatherCode, lang);
                const label = formatDayLabel(day.date, idx, lang);
                return (
                  <div
                    key={day.date}
                    className="glass-surface border border-white/45 dark:border-white/10 rounded-xl p-2 text-center space-y-0.5"
                  >
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block truncate">
                      {label}
                    </span>
                    <span className="text-base block leading-tight" title={dayCond.label}>
                      {dayCond.emoji}
                    </span>
                    <div className="text-[10.5px] font-mono tabular-nums">
                      <strong className="text-slate-900 dark:text-white">{day.tempMax}°</strong>
                      <span className="text-slate-500">/{day.tempMin}°</span>
                    </div>
                    <span className="text-[9.5px] text-sky-700 dark:text-sky-400 font-semibold font-mono tabular-nums block">
                      {day.precipProbMax}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-surface border border-white/50 dark:border-white/10 rounded-2xl p-5 flex items-center justify-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
          <span>{t.weather.loadingText}</span>
        </div>
      )}
    </section>
  );
};
