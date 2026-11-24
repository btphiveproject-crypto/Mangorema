import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Terminal,
  Share2,
  PackageCheck,
  Cloud,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../contexts/LanguageContext';

interface CapacitorGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CapacitorGuideModal: React.FC<CapacitorGuideModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { lang } = useLanguage();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-2rjx4nyv2d2nvz7qktfegs-48689801186.europe-west3.run.app';

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleShareTestUrl = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'MANGOREMA — Prototype Mobile Gabon',
          text:
            lang === 'en'
              ? 'Open MANGOREMA on Android Chrome and tap Install App to test on your phone.'
              : lang === 'ar'
              ? 'افتح MANGOREMA على متصفح أندرويد واختر تثبيت التطبيق للتجربة على هاتفك.'
              : 'Ouvrez MANGOREMA dans Chrome sur Android puis touchez « Installer l’application » pour tester sur votre appareil.',
          url: currentUrl,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    void copyToClipboard(currentUrl, 'url');
  };

  const apkBuildCommands = `npm run apk:debug
# Génère : android/app/build/outputs/apk/debug/app-debug.apk
adb install -r android/app/build/outputs/apk/debug/app-debug.apk`;

  const labels =
    lang === 'en'
      ? {
          kicker: 'MOBILE TEST & ANDROID APK PROTOTYPE',
          title: 'Test on Phone & Android APK',
          instantTitle: 'Option 1 — Instant Phone Test (PWA Standalone)',
          instantBadge: 'Installed',
          instantDesc:
            'Test immediately on your Android phone without a cable: open this link in Chrome and tap "Install app" for full-screen icon, GPS, camera, and offline mode.',
          installNow: 'Install on this device now',
          shareLink: 'Send link to phone',
          copyLink: 'Copy link',
          copied: 'Copied',
          iosHint:
            'On iPhone: tap Share in Safari then choose Add to Home Screen.',
          apkTitle: 'Option 2 — Native Android APK Project Ready (com.mangorema.app)',
          apkBadge: 'Capacitor Android configured',
          apkDesc:
            'The native Gradle Android project (android/), Capacitor config, and GPS/Camera/SOS permissions are already generated in the repository. Build your debug APK locally in one command or automatically via GitHub Actions.',
          cmdTitle: 'Local 1-command APK build (requires Java 21 + Android SDK):',
          ciTitle: 'No Android Studio? Automatic Cloud APK Build:',
          ciDesc:
            'Push this project to GitHub to run the included workflow (.github/workflows/build-android-apk.yml) and download app-debug.apk directly from GitHub Actions.',
          permsTitle: 'Included Android permissions (AndroidManifest.xml):',
          close: 'Close',
        }
      : lang === 'ar'
      ? {
          kicker: 'اختبار الهاتف والنموذج الأولي APK',
          title: 'التجربة على الهاتف وتصدير Android APK',
          instantTitle: 'الخيار 1 — تجربة فورية على الهاتف (PWA)',
          instantBadge: 'مثبّت',
          instantDesc:
            'اختبر التطبيق فوراً على هاتف أندرويد دون كابل: افتح الرابط في Chrome ثم اختر تثبيت التطبيق للحصول على أيقونة وشاشة كاملة وGPS وكاميرا وعمل دون إنترنت.',
          installNow: 'تثبيت على هذا الجهاز الآن',
          shareLink: 'إرسال الرابط للهاتف',
          copyLink: 'نسخ الرابط',
          copied: 'تم النسخ',
          iosHint: 'على آيفون: اضغط مشاركة في Safari ثم إضافة إلى الشاشة الرئيسية.',
          apkTitle: 'الخيار 2 — مشروع Android APK جاهز (com.mangorema.app)',
          apkBadge: 'Capacitor Android مُهيأ',
          apkDesc:
            'تم إنشاء مشروع أندرويد الأصلي وإعدادات Capacitor وأذونات GPS والكاميرا والطوارئ في المستودع. يمكنك بناء ملف app-debug.apk بأمر واحد أو تلقائياً عبر GitHub Actions.',
          cmdTitle: 'أمر بناء ملف APK محلياً (يتطلب Java 21 و Android SDK):',
          ciTitle: 'بدون Android Studio؟ بناء تلقائي على السحابة:',
          ciDesc:
            'ارفع المشروع إلى GitHub لتشغيل سير العمل (.github/workflows/build-android-apk.yml) وتنزيل app-debug.apk مباشرة.',
          permsTitle: 'الأذونات المضافة في AndroidManifest.xml:',
          close: 'إغلاق',
        }
      : {
          kicker: 'TEST MOBILE & PROTOTYPE ANDROID APK',
          title: 'Tester sur Appareil & Générer l’APK',
          instantTitle: 'Option 1 — Test immédiat sur votre téléphone (Sans PC)',
          instantBadge: 'Déjà installée',
          instantDesc:
            'Testez dès maintenant sur votre appareil Android : ouvrez le lien dans Chrome puis touchez « Ajouter à l’écran d’accueil / Installer » (plein écran, icône MANGOREMA, GPS, caméra et hors-ligne).',
          installNow: 'Installer sur cet appareil maintenant',
          shareLink: 'Envoyer le lien au téléphone',
          copyLink: 'Copier le lien',
          copied: 'Copié',
          iosHint:
            'Sur iPhone : touchez le bouton Partager dans Safari puis Sur l’écran d’accueil.',
          apkTitle: 'Option 2 — Projet APK Android Capacitor prêt (com.mangorema.app)',
          apkBadge: 'Projet android/ généré',
          apkDesc:
            'Le projet natif Gradle (android/), la configuration Capacitor et les permissions GPS / Caméra / SOS sont déjà générés et synchronisés. Compilez votre prototype app-debug.apk en 1 commande ou via GitHub Actions.',
          cmdTitle: 'Commande de compilation APK (Java 21 + Android SDK requis) :',
          ciTitle: 'Sans Android Studio ? Compilation APK automatique (GitHub) :',
          ciDesc:
            'Poussez le projet sur GitHub : le workflow inclus (.github/workflows/build-android-apk.yml) compile et publie automatiquement app-debug.apk en téléchargement.',
          permsTitle: 'Permissions Android déjà configurées :',
          close: 'Fermer',
        };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))] px-safe animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-modal border border-white/60 dark:border-white/15 w-full max-w-lg rounded-3xl p-5 max-h-[90vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl text-start"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-bold shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider block truncate">
                {labels.kicker}
              </span>
              <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white truncate">
                {labels.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.close}
            className="w-8 h-8 rounded-full glass-surface border border-white/50 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Option 1: Instant Phone Test via PWA */}
        <div className="glass-surface border border-amber-500/40 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-bold">
              <Download className="w-4 h-4 shrink-0" />
              <span>{labels.instantTitle}</span>
            </strong>
            {isInstalled && (
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold whitespace-nowrap">
                ✓ {labels.instantBadge}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {labels.instantDesc}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {isInstallable && !isInstalled && (
              <button
                type="button"
                onClick={() => void install()}
                className="w-full py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md active:scale-95 transition"
              >
                {labels.installNow}
              </button>
            )}

            <button
              type="button"
              onClick={() => void handleShareTestUrl()}
              className="flex-1 min-h-[40px] px-3 py-2 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{labels.shareLink}</span>
            </button>

            <button
              type="button"
              onClick={() => void copyToClipboard(currentUrl, 'url')}
              className="min-h-[40px] px-3 py-2 glass-card border border-white/60 dark:border-white/15 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 transition"
            >
              {copiedCode === 'url' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedCode === 'url' ? labels.copied : labels.copyLink}</span>
            </button>
          </div>

          {isIOS && !isInstalled && (
            <div className="text-[11px] text-slate-700 dark:text-slate-300 glass-card p-2.5 rounded-xl border border-white/50 dark:border-white/10">
              {labels.iosHint}
            </div>
          )}
        </div>

        {/* Option 2: Native Capacitor Android APK Project */}
        <div className="space-y-3">
          <div className="glass-surface border border-emerald-500/35 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{labels.apkTitle}</span>
              </span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              ✓ {labels.apkBadge}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {labels.apkDesc}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{labels.cmdTitle}</span>
            </h4>
            <button
              type="button"
              onClick={() => void copyToClipboard(apkBuildCommands, 'cap')}
              className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold shrink-0"
            >
              {copiedCode === 'cap' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedCode === 'cap' ? labels.copied : labels.copyLink}</span>
            </button>
          </div>

          <pre className="p-3 bg-slate-950 border border-white/10 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
            {apkBuildCommands}
          </pre>

          <div className="glass-surface border border-white/50 dark:border-white/10 rounded-2xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Cloud className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{labels.ciTitle}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {labels.ciDesc}
            </p>
          </div>

          <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-800 dark:text-slate-200">{labels.permsTitle}</strong>{' '}
              INTERNET, ACCESS_FINE_LOCATION, CAMERA, VIBRATE, CALL_PHONE
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[42px] py-2.5 glass-surface hover:bg-white/80 dark:hover:bg-white/15 border border-white/60 dark:border-white/15 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition"
        >
          {labels.close}
        </button>
      </div>
    </div>
  );
};
