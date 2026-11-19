/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeMode = 'auto' | 'dark' | 'light';

export interface ThemeSchedule {
  /** Hour (0-23) when Light Mode automatically starts */
  dayStartHour: number;
  /** Hour (0-23) when Dark Mode automatically starts */
  nightStartHour: number;
}

export const THEME_MODE_STORAGE_KEY = 'mangorema_theme_mode';
export const THEME_SCHEDULE_STORAGE_KEY = 'mangorema_theme_schedule';

export const DEFAULT_THEME_SCHEDULE: ThemeSchedule = {
  dayStartHour: 6, // 06h00 (lever du soleil équatorial au Gabon)
  nightStartHour: 19, // 19h00 (tombée de la nuit à Libreville)
};

function clampHour(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 23) return fallback;
  return n;
}

export function getStoredThemeMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (raw === 'dark' || raw === 'light' || raw === 'auto') {
      return raw;
    }
  } catch {
    // Ignore storage errors
  }
  return 'auto';
}

export function saveThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage errors
  }
}

export function getStoredThemeSchedule(): ThemeSchedule {
  try {
    const raw = localStorage.getItem(THEME_SCHEDULE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ThemeSchedule>;
      return {
        dayStartHour: clampHour(parsed.dayStartHour, DEFAULT_THEME_SCHEDULE.dayStartHour),
        nightStartHour: clampHour(parsed.nightStartHour, DEFAULT_THEME_SCHEDULE.nightStartHour),
      };
    }
  } catch {
    // Ignore storage / parse errors
  }
  return { ...DEFAULT_THEME_SCHEDULE };
}

export function saveThemeSchedule(schedule: ThemeSchedule): ThemeSchedule {
  const sanitized: ThemeSchedule = {
    dayStartHour: clampHour(schedule.dayStartHour, DEFAULT_THEME_SCHEDULE.dayStartHour),
    nightStartHour: clampHour(schedule.nightStartHour, DEFAULT_THEME_SCHEDULE.nightStartHour),
  };
  try {
    localStorage.setItem(THEME_SCHEDULE_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignore storage errors
  }
  return sanitized;
}

export function isNightHour(date: Date, schedule: ThemeSchedule): boolean {
  const hour = date.getHours();
  const { dayStartHour, nightStartHour } = schedule;

  if (dayStartHour === nightStartHour) {
    return true;
  }
  if (nightStartHour > dayStartHour) {
    return hour >= nightStartHour || hour < dayStartHour;
  }
  return hour >= nightStartHour && hour < dayStartHour;
}

export function resolveIsDarkTheme(
  mode: ThemeMode,
  schedule: ThemeSchedule,
  now: Date = new Date()
): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return isNightHour(now, schedule);
}

export function formatHourLabel(hour: number): string {
  return `${String(clampHour(hour, 0)).padStart(2, '0')}h00`;
}

export function getNextAutoSwitchInfo(
  schedule: ThemeSchedule,
  now: Date = new Date()
): { nextModeLabel: string; nextHourLabel: string } {
  const currentlyNight = isNightHour(now, schedule);
  if (currentlyNight) {
    return {
      nextModeLabel: 'Mode Clair',
      nextHourLabel: formatHourLabel(schedule.dayStartHour),
    };
  }
  return {
    nextModeLabel: 'Mode Sombre',
    nextHourLabel: formatHourLabel(schedule.nightStartHour),
  };
}

export function applyThemeToDocument(isDark: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', isDark);
  root.style.colorScheme = isDark ? 'dark' : 'light';

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', isDark ? '#080B09' : '#F4F5F2');
  }
}
