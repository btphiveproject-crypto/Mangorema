import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { GoogleAuthIssueInfo } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';

interface GoogleAuthHelpModalProps {
  issue: GoogleAuthIssueInfo | null;
  isLoading?: boolean;
  onClose: () => void;
  onRetryPopup: () => void;
  onRetryRedirect: () => void;
}

const LIVE_WEB_APP_URL =
  'https://ais-pre-2rjx4nyv2d2nvz7qktfegs-48689801186.europe-west3.run.app';

export const GoogleAuthHelpModal: React.FC<GoogleAuthHelpModalProps> = ({
  issue,
  isLoading = false,
  onClose,
  onRetryPopup,
  onRetryRedirect,
}) => {
  const { lang } = useLanguage();
  const [copiedKey, setCopiedKey] = useState<'url' | 'domain' | null>(null);

  if (!issue) return null;

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : LIVE_WEB_APP_URL;
  const isLocalhostOrigin =
    currentOrigin.startsWith('http://localhost') ||
    currentOrigin.startsWith('https://localhost') ||
    currentOrigin.startsWith('capacitor://');
  const externalBrowserUrl = isLocalhostOrigin ? LIVE_WEB_APP_URL : currentOrigin;

  const copyText = async (value: string, key: 'url' | 'domain') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      // Clipboard unsupported
    }
  };

  const labels =
    lang === 'en'
      ? {
          kicker: 'GOOGLE AUTHENTICATION',
          title: 'Unable to complete Google sign-in',
          webviewHint:
            'Google blocks OAuth sign-in inside embedded Android APK WebViews or in-app browsers (403 disallowed_useragent). Open MANGOREMA in Chrome or Safari to sign in with Google, or install it as a Chrome PWA.',
          domainHint:
            'Add this domain in Firebase Console → Authentication → Settings → Authorized domains:',
          popupHint:
            'Allow pop-ups for this site in your browser settings, or continue using direct Google redirect.',
          openInChrome: 'Open in Chrome / Browser',
          retryRedirect: 'Continue via Google Redirect',
          retryPopup: 'Retry Google Sign-In',
          copyLink: 'Copy link',
          copyDomain: 'Copy domain',
          copied: 'Copied',
          close: 'Close',
        }
      : lang === 'ar'
      ? {
          kicker: 'مصادقة GOOGLE',
          title: 'تعذر إكمال تسجيل الدخول عبر Google',
          webviewHint:
            'تمنع Google تسجيل الدخول داخل متصفحات التطبيقات المدمجة أو WebView في APK (خطأ disallowed_useragent). افتح MANGOREMA في Chrome أو Safari لإتمام التحقق عبر Google.',
          domainHint:
            'أضف هذا النطاق في Firebase Console → Authentication → Settings → Authorized domains:',
          popupHint:
            'اسمح بالنوافذ المنبثقة لهذا الموقع في إعدادات المتصفح، أو تابع عبر إعادة توجيه Google المباشرة.',
          openInChrome: 'فتح في Chrome / المتصفح',
          retryRedirect: 'المتابعة عبر إعادة توجيه Google',
          retryPopup: 'إعادة محاولة تسجيل الدخول',
          copyLink: 'نسخ الرابط',
          copyDomain: 'نسخ النطاق',
          copied: 'تم النسخ',
          close: 'إغلاق',
        }
      : {
          kicker: 'VALIDATION COMPTE GOOGLE',
          title: 'Impossible de finaliser la connexion Google',
          webviewHint:
            'Par sécurité, Google bloque la connexion OAuth dans les WebViews intégrées (APK Android ou navigateur intégré WhatsApp/Facebook : erreur 403 disallowed_useragent). Ouvrez MANGOREMA dans Chrome ou Safari pour vous connecter et valider vos défis.',
          domainHint:
            'Ajoutez ce nom de domaine dans Firebase Console → Authentication → Paramètres → Domaines autorisés :',
          popupHint:
            'Autorisez les fenêtres pop-up pour ce site dans les paramètres de votre navigateur, ou utilisez la redirection directe Google.',
          openInChrome: 'Ouvrir dans Chrome / Navigateur',
          retryRedirect: 'Continuer via redirection Google',
          retryPopup: 'Réessayer avec Google',
          copyLink: 'Copier le lien',
          copyDomain: 'Copier le domaine',
          copied: 'Copié',
          close: 'Fermer',
        };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))] px-safe animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-modal border border-amber-500/45 w-full max-w-md rounded-3xl p-5 space-y-4 shadow-2xl text-start max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-900/10 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              {issue.isWebViewBlocked ? (
                <Smartphone className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block truncate">
                {labels.kicker}
              </span>
              <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white leading-snug">
                {labels.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={labels.close}
            className="min-w-[40px] min-h-[40px] rounded-xl glass-surface border border-white/50 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 space-y-2 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
          <p className="font-semibold">{issue.message}</p>
          <p className="text-[11px] font-mono text-amber-800 dark:text-amber-300">
            Code : {issue.code}
          </p>
        </div>

        {issue.isWebViewBlocked && (
          <div className="glass-surface border border-white/50 dark:border-white/10 rounded-2xl p-3.5 space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>{labels.webviewHint}</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={externalBrowserUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[44px] px-3.5 py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>{labels.openInChrome}</span>
              </a>
              <button
                type="button"
                onClick={() => void copyText(externalBrowserUrl, 'url')}
                className="min-h-[44px] px-3 py-2 glass-card border border-white/60 dark:border-white/15 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"
              >
                {copiedKey === 'url' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === 'url' ? labels.copied : labels.copyLink}</span>
              </button>
            </div>
          </div>
        )}

        {issue.isUnauthorizedDomain && (
          <div className="glass-surface border border-white/50 dark:border-white/10 rounded-2xl p-3.5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
            <p>{labels.domainHint}</p>
            <div className="flex items-center justify-between gap-2 bg-slate-950 text-emerald-300 font-mono text-xs px-3 py-2 rounded-xl border border-white/10">
              <span className="truncate">{issue.hostname || currentOrigin}</span>
              <button
                type="button"
                onClick={() => void copyText(issue.hostname || currentOrigin, 'domain')}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-sans font-semibold flex items-center gap-1 shrink-0"
              >
                {copiedKey === 'domain' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedKey === 'domain' ? labels.copied : labels.copyDomain}</span>
              </button>
            </div>
          </div>
        )}

        {!issue.isWebViewBlocked && !issue.isUnauthorizedDomain && (
          <div className="glass-surface border border-white/50 dark:border-white/10 rounded-2xl p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>{labels.popupHint}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {issue.canRetryRedirect && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onRetryRedirect}
              className="flex-1 min-h-[44px] px-4 py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition disabled:opacity-60"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{labels.retryRedirect}</span>
            </button>
          )}
          {!issue.isWebViewBlocked && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onRetryPopup}
              className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-60 ${
                issue.canRetryRedirect
                  ? 'glass-surface border border-white/60 dark:border-white/15 text-slate-900 dark:text-white'
                  : 'copper-gradient text-slate-950 font-black shadow-md'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{labels.retryPopup}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 rounded-xl glass-surface border border-white/60 dark:border-white/15 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            {labels.close}
          </button>
        </div>
      </div>
    </div>
  );
};
