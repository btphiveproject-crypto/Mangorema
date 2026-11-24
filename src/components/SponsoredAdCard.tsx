/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Crown,
  ExternalLink,
  MapPin,
  X,
} from 'lucide-react';
import { TabType } from '../types';
import {
  AdPlacement,
  getAdForPlacement,
  SponsoredAdItem,
} from '../data/sponsoredAds';
import { useLanguage } from '../contexts/LanguageContext';
import { sanitizeImageUrl } from '../utils/urlSecurity';

interface SponsoredAdCardProps {
  placement: AdPlacement;
  isFreeTier: boolean;
  isDismissed?: boolean;
  compact?: boolean;
  onDismiss?: (adId: string) => void;
  onNavigateTab?: (tab: TabType) => void;
  onUpgradeAdFree?: () => void;
}

export const SponsoredAdCard: React.FC<SponsoredAdCardProps> = ({
  placement,
  isFreeTier,
  isDismissed = false,
  compact = false,
  onDismiss,
  onNavigateTab,
  onUpgradeAdFree,
}) => {
  const { lang, t } = useLanguage();
  const [selectedAd, setSelectedAd] = useState<SponsoredAdItem | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isFreeTier || isDismissed) return null;

  const ad = getAdForPlacement(placement);
  const copy = ad.copy[lang] || ad.copy.fr;
  const safeImage = sanitizeImageUrl(ad.image, { allowDataImage: true });

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  return (
    <>
      <aside
        aria-label={`${t.ads.sponsoredLabel} — ${copy.partnerName}`}
        className={`glass-card border border-white/60 dark:border-white/12 rounded-3xl overflow-hidden transition text-start ${
          compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Ad Visual */}
          {safeImage && (
            <button
              type="button"
              onClick={() => setSelectedAd(ad)}
              className={`relative rounded-2xl overflow-hidden bg-slate-900 shrink-0 group ${
                compact ? 'w-full sm:w-36 aspect-[16/10]' : 'w-full sm:w-44 aspect-[16/10]'
              }`}
            >
              <img
                src={safeImage}
                alt={copy.headline}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-2 start-2.5 text-[10px] font-bold text-amber-300 truncate max-w-[85%]">
                {ad.locationLabel}
              </span>
            </button>
          )}

          {/* Ad Editorial Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 truncate">
                  {t.ads.sponsoredLabel} <span aria-hidden="true">·</span> {copy.partnerName}{' '}
                  <span aria-hidden="true">·</span> {copy.highlight}
                </p>
                <h3
                  onClick={() => setSelectedAd(ad)}
                  className="font-serif-display font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-0.5 cursor-pointer hover:text-amber-700 dark:hover:text-amber-300 transition line-clamp-2"
                >
                  {copy.headline}
                </h3>
              </div>

              {onDismiss && (
                <button
                  type="button"
                  onClick={() => onDismiss(ad.id)}
                  title={t.ads.hideAdTitle}
                  aria-label={t.ads.hideAdTitle}
                  className="w-7 h-7 rounded-full glass-surface border border-white/50 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center shrink-0 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
              {copy.description}
            </p>

            <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                {ad.promoCode && (
                  <button
                    type="button"
                    onClick={() => handleCopyCode(ad.promoCode!)}
                    className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {copiedCode ? (
                      <Check className="w-3 h-3 shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 shrink-0" />
                    )}
                    <span>
                      {t.ads.codePrefix} {ad.promoCode}
                    </span>
                  </button>
                )}

                {onUpgradeAdFree && (
                  <button
                    type="button"
                    onClick={onUpgradeAdFree}
                    className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 transition"
                  >
                    <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{t.ads.removeAdsBtn}</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedAd(ad)}
                className="min-h-[38px] px-3.5 py-1.5 copper-gradient text-slate-950 font-black text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition whitespace-nowrap shrink-0"
              >
                <span>{copy.ctaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Sponsored Offer Detail Modal */}
      {selectedAd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setSelectedAd(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-modal border border-white/60 dark:border-white/15 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl text-start"
          >
            {safeImage && (
              <div className="relative aspect-[16/9] bg-slate-900">
                <img
                  src={safeImage}
                  alt={copy.headline}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <button
                  type="button"
                  onClick={() => setSelectedAd(null)}
                  aria-label={t.common.close}
                  className="absolute top-3 end-3 w-8 h-8 rounded-full bg-black/55 border border-white/25 text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 inset-x-4 text-white">
                  <p className="text-[11px] font-semibold text-amber-300">
                    {t.ads.sponsoredLabel} <span aria-hidden="true">·</span> {copy.partnerName}
                  </p>
                  <h3 className="font-serif-display text-lg font-bold leading-snug mt-0.5">
                    {copy.headline}
                  </h3>
                </div>
              </div>
            )}

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{selectedAd.locationLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{copy.category}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {copy.description}
              </p>

              {selectedAd.promoCode && (
                <div className="glass-surface border border-white/50 dark:border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      {t.ads.promoCodeLabel}
                    </span>
                    <strong className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-400">
                      {selectedAd.promoCode}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(selectedAd.promoCode!)}
                    className="min-h-[36px] px-3 py-1.5 glass-card border border-white/50 dark:border-white/15 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t.ads.copiedLabel}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t.ads.copyBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {copy.terms} {t.ads.freeTierNotice}
              </p>

              <div className="flex items-center gap-2 pt-1">
                {onUpgradeAdFree && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAd(null);
                      onUpgradeAdFree();
                    }}
                    className="min-h-[42px] px-3.5 py-2 glass-surface border border-white/50 dark:border-white/12 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{t.ads.removeAdsBtn}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedAd.targetTab;
                    setSelectedAd(null);
                    onNavigateTab?.(target);
                  }}
                  className="flex-1 min-h-[42px] px-4 py-2 copper-gradient text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>{copy.ctaLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
