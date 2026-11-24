import React, { useEffect, useRef, useState } from 'react';
import { Compass, Award, Store, Mountain, Check, Sparkles } from 'lucide-react';
import { AppWorkspaceMode } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import {
  GABON_LANDSCAPES,
  GabonLandscape,
  LandscapePreference,
} from '../data/gabonLandscapes';

interface WorkspaceModeBarProps {
  mode: AppWorkspaceMode;
  onChangeMode: (mode: AppWorkspaceMode) => void;
  hasProProfile?: boolean;
  hasStoreProfile?: boolean;
  landscapePref?: LandscapePreference;
  activeLandscape?: GabonLandscape;
  onChangeLandscape?: (pref: LandscapePreference) => void;
}

export const WorkspaceModeBar: React.FC<WorkspaceModeBarProps> = ({
  mode,
  onChangeMode,
  hasProProfile = false,
  hasStoreProfile = false,
  landscapePref = 'auto',
  activeLandscape,
  onChangeLandscape,
}) => {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const items: Array<{
    id: AppWorkspaceMode;
    label: string;
    icon: React.ReactNode;
    isConfigured?: boolean;
  }> = [
    {
      id: 'explorer',
      label: t.workspace.explorer,
      icon: <Compass className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'professional',
      label: t.workspace.professional,
      icon: <Award className="w-3.5 h-3.5 shrink-0" />,
      isConfigured: hasProProfile,
    },
    {
      id: 'store',
      label: t.workspace.store,
      icon: <Store className="w-3.5 h-3.5 shrink-0" />,
      isConfigured: hasStoreProfile,
    },
  ];

  return (
    <div className="relative z-30 glass-chrome border-b border-white/50 dark:border-white/10 px-3 sm:px-6 px-safe py-1.5 transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <span className="hidden md:inline text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
            {t.workspace.switchTitle}
          </span>

          {onChangeLandscape && activeLandscape && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="listbox"
                title={t.workspace.landscapeTooltip}
                className="h-9 sm:h-8 px-2.5 rounded-xl glass-surface hover:bg-white/75 dark:hover:bg-white/12 border border-white/55 dark:border-white/12 text-[11px] font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap"
              >
                <Mountain className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="hidden md:inline text-slate-500 dark:text-slate-400">{t.workspace.landscapeLabel}</span>
                <span className="hidden sm:inline font-bold truncate max-w-[140px]">
                  {landscapePref === 'auto' ? `${t.profile.modeAuto} · ${activeLandscape.shortName}` : activeLandscape.shortName}
                </span>
                <span className="sm:hidden font-bold truncate max-w-[74px]">
                  {activeLandscape.shortName}
                </span>
              </button>

              {menuOpen && (
                <div
                  role="listbox"
                  aria-label={t.workspace.landscapeTooltip}
                  className="absolute top-full mt-1.5 start-0 w-64 glass-modal border border-white/75 dark:border-white/15 rounded-2xl p-1.5 z-50 space-y-1"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={landscapePref === 'auto'}
                    onClick={() => {
                      onChangeLandscape('auto');
                      setMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-start text-xs flex items-center justify-between gap-2 transition ${
                      landscapePref === 'auto'
                        ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="block truncate">{t.workspace.landscapeAutoTitle}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          {t.workspace.landscapeAutoDesc}
                        </span>
                      </div>
                    </div>
                    {landscapePref === 'auto' && (
                      <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                  </button>

                  <div className="h-px bg-slate-900/10 dark:bg-white/10 my-1" />

                  {GABON_LANDSCAPES.map((item) => {
                    const isSelected = landscapePref === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onChangeLandscape(item.id);
                          setMenuOpen(false);
                        }}
                        className={`w-full px-2 py-1.5 rounded-xl text-start text-xs flex items-center justify-between gap-2 transition ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-950 dark:text-emerald-300 font-bold'
                            : 'text-slate-800 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.image}
                            alt={item.shortName}
                            className="w-8 h-6 rounded-md object-cover border border-white/50 dark:border-white/15 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="block truncate">{item.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                              {item.province}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          role="tablist"
          aria-label={t.workspace.switchTitle}
          className="flex-1 sm:flex-none sm:w-auto grid grid-cols-3 sm:inline-flex gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-xl glass-surface border border-white/55 dark:border-white/12 min-w-0"
        >
          {items.map((item) => {
            const isSelected = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onChangeMode(item.id)}
                className={`min-h-[34px] min-w-0 px-1.5 sm:px-3 py-1 rounded-lg text-[10.5px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition whitespace-nowrap active:scale-[0.98] ${
                  isSelected
                    ? 'copper-gradient text-slate-950 font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <span className="hidden min-[380px]:inline-flex">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {item.isConfigured && !isSelected && (
                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
