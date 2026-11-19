import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Flag, Battery, Flame, Mountain, Navigation, Compass } from 'lucide-react';

interface GPSTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishActivity: (stats: { km: number; ascent: number; durationSeconds: number }) => void;
}

export const GPSTrackerModal: React.FC<GPSTrackerModalProps> = ({
  isOpen,
  onClose,
  onFinishActivity,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [elevation, setElevation] = useState(140);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
        if (seconds % 15 === 0) {
          setElevation((e) => e + Math.floor(Math.random() * 3));
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  // Real GPS watch position toggle
  useEffect(() => {
    if (isActive && navigator.geolocation && watchId === null) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          // Can track real distance
        },
        (err) => console.log('GPS watch note:', err),
        { enableHighAccuracy: true }
      );
      setWatchId(id);
    } else if (!isActive && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [isActive]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const distanceKm = Number((seconds * 0.00135).toFixed(2));
  const calories = Math.floor(seconds * 0.12);
  const pace = seconds > 0 ? "5'45\"" : "0'00\"";

  const handleFinish = () => {
    if (seconds < 5) {
      onClose();
      return;
    }
    setIsActive(false);
    onFinishActivity({
      km: distanceKm,
      ascent: elevation - 140,
      durationSeconds: seconds,
    });
    alert(`Bravo Stéphane ! Trace enregistrée : ${distanceKm} km et +${elevation - 140}m de dénivelé ajoutés à votre profil.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 dark:bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0f1512] border border-amber-500/40 dark:border-amber-600/30 w-full max-w-sm rounded-3xl p-5 text-center space-y-5 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Traceur Sentier GPS Live
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Chronometer */}
        <div className="py-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-bold mb-1">
            DURÉE D'ACTIVITÉ
          </span>
          <div className="text-5xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400">
            {formatTimer(seconds)}
          </div>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-3 gap-2 bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 rounded-2xl p-3 text-center">
          <div>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Distance</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{distanceKm}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">km</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Allure</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-500">{pace}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">/km</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Dénivelé</span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">+{elevation - 140}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">mètres</span>
          </div>
        </div>

        {/* Energy & Status */}
        <div className="flex items-center justify-around text-xs text-slate-600 dark:text-slate-400 border-y border-stone-200 dark:border-white/5 py-2">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" /> {calories} kcal
          </span>
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Cap Estérias
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <Battery className="w-3.5 h-3.5" /> Éco-GPS
          </span>
        </div>

        {/* Controls */}
        <div className="space-y-2">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
              isActive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/30 dark:shadow-red-950/60'
                : 'copper-gradient text-slate-950 shadow-amber-900/20 dark:shadow-amber-950/60'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4 fill-current" /> Pause la Rando
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> {seconds === 0 ? 'Démarrer l\'Enregistrement' : 'Reprendre'}
              </>
            )}
          </button>

          {seconds > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsActive(false);
                  setSeconds(0);
                  setElevation(140);
                }}
                className="flex-1 py-2.5 bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-white/10 hover:bg-stone-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Flag className="w-3.5 h-3.5" /> Sauvegarder
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
