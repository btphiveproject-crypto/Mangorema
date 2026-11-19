import React from 'react';
import { ShieldAlert, Download, WifiOff, Bell } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  onOpenSOS: () => void;
  onOpenCapacitorGuide: () => void;
  onOpenProfile: () => void;
  onOpenNotifications?: () => void;
  activeAlertsCount?: number;
  isAuthenticated?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenSOS,
  onOpenCapacitorGuide,
  onOpenProfile,
  onOpenNotifications,
  activeAlertsCount = 0,
  isAuthenticated = false,
}) => {
  const { isInstallable, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#080B09]/95 backdrop-blur-md border-b border-stone-200 dark:border-white/10 px-4 py-3 flex items-center justify-between gap-4 max-w-md mx-auto w-full transition-colors duration-200">
      {/* Zone 1: Single text element Brand mark */}
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-600/80 dark:border-amber-500/80 shadow-md shadow-amber-950/20 dark:shadow-amber-950/60 bg-[#080B09] shrink-0 flex items-center justify-center">
          <img
            src="/assets/aistudio/Gemini_Generated_Image_vn51dfvn51dfvn51__1__8a19ee16.jpeg"
            alt="MANGOREMA Pangolin Logo"
            className="w-full h-full object-cover scale-125"
          />
        </div>
        <div>
          <span className="font-serif-display text-base font-bold tracking-tight text-amber-700 dark:text-amber-400 leading-none block">
            MANGOREMA
          </span>
          <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium tracking-wider uppercase block">
            Connaître pour mieux protéger
          </span>
        </div>
      </div>

      {/* Zone 2: Offline / Status indicator */}
      {!isOnline && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-500/40 dark:border-amber-500/30 text-[10px] font-semibold">
          <WifiOff className="w-3 h-3 animate-pulse" />
          <span>Hors-ligne</span>
        </div>
      )}

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notification Bell */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            title="Alertes de départ H-1 (Web Notification)"
            className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 border border-stone-200 dark:border-white/10 text-amber-700 dark:text-amber-400 flex items-center justify-center transition relative active:scale-95"
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center shadow">
                {activeAlertsCount}
              </span>
            )}
          </button>
        )}

        {/* PWA / Mobile Export */}
        <button
          onClick={isInstallable ? install : onOpenCapacitorGuide}
          title="Installer sur mobile ou exporter"
          className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 border border-stone-200 dark:border-white/10 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-1 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline">App</span>
        </button>

        {/* SOS Button */}
        <button
          onClick={onOpenSOS}
          className="px-2.5 py-1 rounded-lg bg-red-600/15 dark:bg-red-600/20 hover:bg-red-600/25 dark:hover:bg-red-600/30 border border-red-500 text-red-700 dark:text-red-400 font-extrabold text-xs flex items-center gap-1 transition active:scale-95 shadow-sm shadow-red-950/20 dark:shadow-red-950"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>SOS</span>
        </button>

        {/* User Avatar */}
        <button
          onClick={onOpenProfile}
          title={isAuthenticated ? 'Profil synchronisé (Google / Firestore)' : 'Profil (Se connecter avec Google)'}
          className={`w-8 h-8 rounded-full border-2 overflow-hidden active:scale-95 transition relative ${
            isAuthenticated ? 'border-emerald-400 shadow-sm shadow-emerald-900' : 'border-amber-600/60'
          }`}
        >
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};
