import React, { useState } from 'react';
import { Download, Share, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
  label?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  label = 'Installer',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        title="Installer l’application MANGOREMA hors-ligne"
        className={`h-9 ${
          compact ? 'px-2.5' : 'px-3'
        } rounded-xl copper-gradient text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 transition active:scale-95 whitespace-nowrap shrink-0`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="Installer MANGOREMA sur iPhone / iPad"
          className="h-9 px-2.5 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="hidden sm:inline">iOS App</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#121614] border border-stone-200 dark:border-white/10 p-5 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white">
                  Installer MANGOREMA sur iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 text-slate-500 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Emportez vos billets QR et cartes des parcs nationaux hors réseau dans le navigateur Safari :
              </p>
              <ol className="text-xs text-slate-700 dark:text-slate-200 space-y-2 bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/10 rounded-2xl p-3">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Appuyez sur <Share className="w-3.5 h-3.5 inline text-amber-600 mx-0.5" /> <strong>Partager</strong> en bas de Safari.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Faites défiler et touchez <strong>Sur l’écran d’accueil</strong>.
                  </span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[42px] py-2 copper-gradient text-slate-950 font-black rounded-xl text-xs"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
