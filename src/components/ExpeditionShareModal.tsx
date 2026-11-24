/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Sparkles,
  Loader2,
  MessageCircle,
  Send,
  Mail,
  ExternalLink,
  Award,
  Palette,
} from 'lucide-react';
import {
  Booking,
  EcoChallengeCompletion,
  ExpeditionEvent,
  UserProfile,
} from '../types';
import {
  ShareCardTheme,
  GeneratedShareCard,
  collectAvailableShareAchievements,
  generateExpeditionShareCard,
  buildExpeditionShareText,
  getSocialShareUrls,
} from '../utils/expeditionShareCard';

interface ExpeditionShareModalProps {
  booking: Booking | null;
  user: UserProfile;
  ecoChallenges: EcoChallengeCompletion[];
  events?: ExpeditionEvent[];
  isOpen: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: Array<{ id: ShareCardTheme; label: string; dotClass: string }> = [
  { id: 'emerald', label: 'Forêt Émeraude', dotClass: 'bg-emerald-500' },
  { id: 'copper', label: 'Cuivre MANGOREMA', dotClass: 'bg-amber-500' },
  { id: 'night', label: 'Nuit Équatoriale', dotClass: 'bg-indigo-500' },
];

export const ExpeditionShareModal: React.FC<ExpeditionShareModalProps> = ({
  booking,
  user,
  ecoChallenges,
  events = [],
  isOpen,
  onClose,
}) => {
  const achievements = useMemo(() => {
    if (!booking) return [];
    return collectAvailableShareAchievements(booking, user, ecoChallenges);
  }, [booking, user, ecoChallenges]);

  const [selectedAchievementId, setSelectedAchievementId] = useState<string>('');
  const [theme, setTheme] = useState<ShareCardTheme>('emerald');
  const [generatedCard, setGeneratedCard] = useState<GeneratedShareCard | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && achievements.length > 0) {
      setSelectedAchievementId((prev) =>
        achievements.some((a) => a.id === prev) ? prev : achievements[0].id
      );
      setShareFeedback(null);
      setCopiedText(false);
    }
  }, [isOpen, achievements]);

  const selectedAchievement =
    achievements.find((a) => a.id === selectedAchievementId) || achievements[0];

  const matchedEvent = useMemo(() => {
    if (!booking) return undefined;
    return events.find((e) => e.id === booking.eventId);
  }, [booking, events]);

  useEffect(() => {
    if (!isOpen || !booking || !selectedAchievement) return;
    let cancelled = false;

    const run = async () => {
      setIsGenerating(true);
      setGenError(null);
      try {
        const result = await generateExpeditionShareCard({
          booking,
          user,
          achievement: selectedAchievement,
          event: matchedEvent,
          theme,
        });
        if (!cancelled) {
          setGeneratedCard(result);
        }
      } catch (err) {
        if (!cancelled) {
          setGenError(
            err instanceof Error
              ? err.message
              : 'Impossible de générer la carte d’expédition.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, booking, user, selectedAchievement, matchedEvent, theme]);

  if (!isOpen || !booking || !selectedAchievement) return null;

  const shareText = buildExpeditionShareText({
    booking,
    achievement: selectedAchievement,
  });
  const socialLinks = getSocialShareUrls(shareText);

  const canUseNativeFileShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    Boolean(generatedCard?.file) &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [generatedCard!.file] });

  const canUseNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    if (!canUseNativeShare) {
      setShareFeedback(
        'Le partage natif n’est pas supporté sur ce navigateur. Utilisez Télécharger PNG ou WhatsApp ci-dessous.'
      );
      return;
    }

    try {
      if (canUseNativeFileShare && generatedCard?.file) {
        await navigator.share({
          title: `Mon expédition MANGOREMA · ${booking.eventTitle}`,
          text: shareText,
          files: [generatedCard.file],
        });
      } else {
        await navigator.share({
          title: `Mon expédition MANGOREMA · ${booking.eventTitle}`,
          text: shareText,
          url: typeof window !== 'undefined' ? window.location.origin : undefined,
        });
      }
      setShareFeedback('Carte d’expédition partagée avec succès !');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setShareFeedback(
        'Partage direct interrompu : téléchargez la carte PNG ou choisissez une application ci-dessous.'
      );
    }
  };

  const handleDownloadPng = () => {
    if (!generatedCard) return;
    const link = document.createElement('a');
    link.href = generatedCard.dataUrl;
    link.download = generatedCard.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareFeedback(`Image enregistrée (${generatedCard.file.name}). Prête à poster !`);
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setShareFeedback('Message d’expédition copié dans le presse-papiers !');
      setTimeout(() => setCopiedText(false), 3000);
    } catch {
      setShareFeedback('Copie automatique bloquée par le navigateur.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#101613] border-t sm:border border-stone-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl copper-gradient text-slate-950 flex items-center justify-center shadow shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block truncate">
                Carte Souvenir Générée · {booking.refNumber}
              </span>
              <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white truncate">
                Partager mon expédition
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le partage"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badge / Challenge Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Badge ou défi accompli à mettre en avant :</span>
          </label>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {achievements.map((opt) => {
              const active = opt.id === selectedAchievement.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedAchievementId(opt.id)}
                  className={`min-h-[42px] px-3 py-1.5 rounded-xl border text-left flex items-center gap-2 shrink-0 transition ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                      : 'bg-stone-50 dark:bg-slate-950/60 border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-amber-500/40'
                  }`}
                >
                  <span className="text-base leading-none">{opt.icon}</span>
                  <span className="text-[11px] whitespace-nowrap">{opt.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Style Theme Selector */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
            <Palette className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Style :</span>
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`min-h-[36px] px-2.5 py-1 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                  theme === opt.id
                    ? 'copper-gradient text-slate-950 border-transparent font-bold shadow-sm'
                    : 'bg-stone-50 dark:bg-slate-950/60 border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${opt.dotClass}`} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamically Generated Card Preview */}
        <div className="rounded-2xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-white/10 p-2.5 flex items-center justify-center relative min-h-[280px]">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-2 text-xs text-slate-600 dark:text-slate-400 py-16">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span>Génération dynamique de votre carte PNG...</span>
            </div>
          ) : genError ? (
            <p className="text-xs text-red-600 dark:text-red-400 p-4 text-center">{genError}</p>
          ) : generatedCard ? (
            <img
              src={generatedCard.dataUrl}
              alt={`Carte expédition ${booking.eventTitle}`}
              className="w-full max-h-[340px] object-contain rounded-xl shadow-xl"
            />
          ) : null}
        </div>

        {shareFeedback && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/40 px-3 py-2 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{shareFeedback}</span>
          </div>
        )}

        {/* Primary Share & Download Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleNativeShare}
            disabled={isGenerating || !generatedCard}
            className="min-h-[44px] px-3 py-2.5 copper-gradient text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>{canUseNativeFileShare ? 'Partager carte' : 'Partager'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isGenerating || !generatedCard}
            className="min-h-[44px] px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger PNG</span>
          </button>
        </div>

        {/* Messaging Apps & Social Networks */}
        <div className="pt-2 border-t border-stone-200 dark:border-white/10 space-y-2">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
            Réseaux sociaux &amp; messageries :
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
            <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-2.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/45 border border-emerald-500/35 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center gap-1.5 hover:brightness-105 transition"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>WhatsApp</span>
            </a>

            <a
              href={socialLinks.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-2.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/45 border border-sky-500/35 text-sky-800 dark:text-sky-300 font-bold flex items-center justify-center gap-1.5 hover:brightness-105 transition"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>Telegram</span>
            </a>

            <a
              href={socialLinks.x}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-2.5 py-2 rounded-xl bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-white/15 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center gap-1.5 hover:border-amber-500/40 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>X / Post</span>
            </a>

            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-2.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/45 border border-blue-500/35 text-blue-800 dark:text-blue-300 font-bold flex items-center justify-center gap-1.5 hover:brightness-105 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>Facebook</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <a
              href={socialLinks.email}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center gap-1.5 hover:border-amber-500/40 transition"
            >
              <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>E-mail</span>
            </a>

            <button
              type="button"
              onClick={handleCopyMessage}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center gap-1.5 hover:border-amber-500/40 transition"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Texte copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Copier texte</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
