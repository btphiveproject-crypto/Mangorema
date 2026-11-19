import React, { useState } from 'react';
import { X, Smartphone, Copy, Check, Download, Layers, ShieldCheck, Terminal } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface CapacitorGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CapacitorGuideModal: React.FC<CapacitorGuideModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const capacitorCommands = `npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/geolocation
npx cap init MANGOREMA com.mangorema.app --web-dir dist
npm run build
npx cap add android
npx cap add ios
npx cap sync
npx cap open android`;

  const androidPermissions = `<!-- Dans android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CALL_PHONE" />
<uses-permission android:name="android.permission.SEND_SMS" />`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#121614] border border-stone-200 dark:border-white/10 w-full max-w-lg rounded-3xl p-5 max-h-[90vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider block">
                EXPORT MOBILE SMARTPHONE
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Application Native & PWA</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* In-App Direct Installation if PWA ready */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-400/50 dark:border-amber-600/40 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <strong className="text-xs text-amber-800 dark:text-amber-400 flex items-center gap-1.5 font-bold">
              <Download className="w-4 h-4" />
              Installation Immédiate (PWA)
            </strong>
            {isInstalled && (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                ✓ Déjà Installée
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            Cette application dispose déjà d'un manifeste PWA complet, d'un service worker et d'icônes adaptatives pour fonctionner hors-ligne sur votre téléphone.
          </p>
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="w-full py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition"
            >
              Installer sur l'écran d'accueil maintenant
            </button>
          )}
          {isIOS && !isInstalled && (
            <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-stone-200 dark:border-white/10">
              Sur iPhone : touchez le bouton <strong>Partager</strong> <span className="text-sm">⎋</span> dans Safari puis sélectionnez <strong>Sur l'écran d'accueil</strong>.
            </div>
          )}
        </div>

        {/* Capacitor Android/iOS Packaging Guide */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Commandes de génération APK Android & iOS (Capacitor) :
            </h4>
            <button
              onClick={() => copyToClipboard(capacitorCommands, 'cap')}
              className="text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              {copiedCode === 'cap' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode === 'cap' ? 'Copié !' : 'Copier script'}
            </button>
          </div>

          <pre className="p-3 bg-slate-900 dark:bg-slate-950 border border-stone-300 dark:border-white/10 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
            {capacitorCommands}
          </pre>

          <div className="flex items-center justify-between pt-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Permissions GPS & SOS (AndroidManifest.xml) :
            </h4>
            <button
              onClick={() => copyToClipboard(androidPermissions, 'perms')}
              className="text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              {copiedCode === 'perms' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode === 'perms' ? 'Copié !' : 'Copier'}
            </button>
          </div>

          <pre className="p-3 bg-slate-900 dark:bg-slate-950 border border-stone-300 dark:border-white/10 rounded-xl text-xs font-mono text-amber-300/90 overflow-x-auto leading-relaxed">
            {androidPermissions}
          </pre>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-transparent text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition"
        >
          Fermer le guide
        </button>

      </div>
    </div>
  );
};
