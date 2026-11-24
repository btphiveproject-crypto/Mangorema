/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ShoppingBag,
  Tent,
  Search,
  Star,
  Truck,
  Store,
  Check,
  ShieldCheck,
  Calendar,
  Plus,
  Minus,
  Footprints,
  Flashlight,
  CloudRain,
  Flame,
  Binoculars,
  BatteryCharging,
  CupSoda,
  Shirt,
  Mountain,
  Package,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react';
import { RentalItem, StoreProduct, StoreProductCategory, StoreProfile, TabType } from '../../types';
import { ADDITIONAL_RENTALS, INITIAL_STORE_PRODUCTS } from '../../data/marketplaceData';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { SponsoredAdCard } from '../SponsoredAdCard';
import { sanitizeImageUrl } from '../../utils/urlSecurity';

interface EquipementViewProps {
  rentals: RentalItem[];
  extraProducts?: StoreProduct[];
  extraRentals?: RentalItem[];
  partnerStores?: StoreProfile[];
  liveStockMap?: Record<string, number>;
  onOpenRentalChecklistModal?: () => void;
  isFreeTier?: boolean;
  dismissedAdIds?: string[];
  onDismissAd?: (adId: string) => void;
  onUpgradeAdFree?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

const STORE_CATEGORY_IDS: Array<'all' | StoreProductCategory> = [
  'all',
  'randonnee',
  'camping',
  'chaussures_vetements',
  'optique_photo',
  'eclairage_gadgets',
  'lifestyle_mangorema',
];

function renderStudioIcon(iconName: string) {
  const cls = 'w-10 h-10 text-amber-300';
  switch (iconName) {
    case 'footprints':
      return <Footprints className={cls} />;
    case 'flashlight':
      return <Flashlight className={cls} />;
    case 'cloud-rain':
      return <CloudRain className={cls} />;
    case 'flame':
      return <Flame className={cls} />;
    case 'binoculars':
      return <Binoculars className={cls} />;
    case 'battery-charging':
      return <BatteryCharging className={cls} />;
    case 'cup-soda':
      return <CupSoda className={cls} />;
    case 'shirt':
      return <Shirt className={cls} />;
    case 'mountain':
      return <Mountain className={cls} />;
    default:
      return <Package className={cls} />;
  }
}

export const EquipementView: React.FC<EquipementViewProps> = ({
  rentals,
  extraProducts = [],
  extraRentals = [],
  partnerStores = [],
  liveStockMap,
  onOpenRentalChecklistModal,
  isFreeTier = false,
  dismissedAdIds = [],
  onDismissAd,
  onUpgradeAdFree,
  onNavigateTab,
}) => {
  const { addProductToCart, addRentalToCart, totalCount, setIsCartOpen } = useCart();
  const { lang, t } = useLanguage();
  const numberLocale = lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar-EG' : 'fr-FR';

  const [mode, setMode] = useState<'shop' | 'rental'>('shop');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | StoreProductCategory>('all');
  const [productFulfillment, setProductFulfillment] = useState<
    Record<string, 'PICKUP' | 'DELIVERY'>
  >({});
  const [rentalDaysById, setRentalDaysById] = useState<Record<string, number>>({});
  const [rentalStartById, setRentalStartById] = useState<Record<string, string>>({});
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  const [brokenRentalImgs, setBrokenRentalImgs] = useState<Record<string, boolean>>({});

  const allProducts = useMemo(
    () => [...extraProducts, ...INITIAL_STORE_PRODUCTS],
    [extraProducts]
  );

  const allRentals = useMemo(
    () => [...extraRentals, ...rentals, ...ADDITIONAL_RENTALS],
    [extraRentals, rentals]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allProducts.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [allProducts, selectedCategory, searchQuery]);

  const filteredRentals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRentals.filter((r) => {
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q) ||
        r.partnerName.toLowerCase().includes(q)
      );
    });
  }, [allRentals, searchQuery]);

  const triggerAddedToast = (label: string) => {
    setAddedFeedback(label);
    setTimeout(() => setAddedFeedback(null), 3200);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {t.equipement.title}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t.equipement.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="min-h-[44px] px-4 py-2 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-sm shrink-0 active:scale-95 transition whitespace-nowrap"
        >
          <ShoppingBag className="w-4 h-4 shrink-0" />
          <span className="font-mono tabular-nums">{t.equipement.cartBtn} ({totalCount})</span>
        </button>
      </div>

      {/* Mode Switcher + Search Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        <div className="lg:col-span-5 grid grid-cols-2 gap-1.5 p-1 glass-card border border-white/60 dark:border-white/12 rounded-2xl">
          <button
            type="button"
            onClick={() => setMode('shop')}
            className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition whitespace-nowrap ${
              mode === 'shop'
                ? 'copper-gradient text-slate-950 shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>{t.equipement.shopTab} ({allProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('rental')}
            className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition whitespace-nowrap ${
              mode === 'rental'
                ? 'copper-gradient text-slate-950 shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Tent className="w-4 h-4 shrink-0" />
            <span>{t.equipement.rentalTab} ({allRentals.length})</span>
          </button>
        </div>

        <div className="lg:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute start-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              mode === 'shop'
                ? t.equipement.shopSearchPlaceholder
                : t.equipement.rentalSearchPlaceholder
            }
            className="w-full min-h-[44px] glass-card border border-white/60 dark:border-white/12 rounded-2xl py-2.5 ps-10 pe-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Added to Cart Feedback */}
      {addedFeedback && (
        <div className="bg-emerald-50 dark:bg-emerald-950/75 border border-emerald-500/45 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate font-semibold">{addedFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="min-h-[36px] px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs shrink-0 whitespace-nowrap"
          >
            {t.equipement.viewCart}
          </button>
        </div>
      )}

      {/* Native Free-Tier Partner Ad */}
      <SponsoredAdCard
        placement="equipement"
        compact
        isFreeTier={isFreeTier}
        isDismissed={dismissedAdIds.includes('ad-equipement-outdoor')}
        onDismiss={onDismissAd}
        onNavigateTab={onNavigateTab}
        onUpgradeAdFree={onUpgradeAdFree}
      />

      {/* Partner Stores Directory Strip */}
      {partnerStores.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Store className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t.equipement.partnerStores} ({partnerStores.length})</span>
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-semibold"
              >
                {t.equipement.showAll}
              </button>
            )}
          </div>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-0.5">
            {partnerStores.map((st) => {
              const isSelected = searchQuery.toLowerCase() === st.storeName.toLowerCase();
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSearchQuery(isSelected ? '' : st.storeName)}
                  className={`min-w-[180px] max-w-[230px] p-3 rounded-2xl border text-start transition shrink-0 ${
                    isSelected
                      ? 'copper-gradient text-slate-950 border-amber-400 shadow-sm'
                      : 'glass-card border-white/60 dark:border-white/12 text-slate-800 dark:text-slate-100 hover:border-amber-500/45'
                  }`}
                >
                  <strong className="text-xs block truncate">{st.storeName}</strong>
                  <span
                    className={`text-[11px] block truncate mt-0.5 ${
                      isSelected ? 'text-slate-900/80' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {st.cityZone} · {st.openingHours}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* BOUTIQUE ACHAT MODE */}
      {mode === 'shop' && (
        <div className="space-y-4">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {STORE_CATEGORY_IDS.map((catId) => (
              <button
                key={catId}
                type="button"
                onClick={() => setSelectedCategory(catId)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                  selectedCategory === catId
                    ? 'copper-gradient text-slate-950 font-bold shadow-sm'
                    : 'glass-card border border-white/60 dark:border-white/12 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {t.equipement.categories[catId]}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="glass-card border border-white/60 dark:border-white/12 rounded-3xl p-8 text-center text-sm text-slate-700 dark:text-slate-300">
              {t.equipement.emptyProducts}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const modeChoice = productFulfillment[product.id] || 'PICKUP';
                const effectiveStock =
                  typeof liveStockMap?.[product.id] === 'number'
                    ? liveStockMap[product.id]
                    : product.stock;
                return (
                  <article
                    key={product.id}
                    className="glass-card border border-white/60 dark:border-white/12 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-amber-500/45 transition"
                  >
                    <div className="flex gap-3.5 p-4">
                      <div
                        className={`w-24 h-28 rounded-2xl bg-gradient-to-br ${product.gradientTheme} border border-amber-500/25 flex flex-col items-center justify-center shrink-0 p-2`}
                      >
                        {renderStudioIcon(product.iconName)}
                        {product.isOfficialMerch && (
                          <span className="mt-1.5 text-[9px] font-bold tracking-wide text-amber-200">
                            {t.equipement.officialBadge}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <span className="font-bold text-amber-700 dark:text-amber-400 truncate">
                              {product.brand}
                            </span>
                            <span className="flex items-center gap-0.5 font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0 tabular-nums">
                              <Star className="w-3 h-3 text-amber-500 fill-current" />
                              {product.rating.toFixed(1)}
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug mt-0.5">
                            {product.name}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                            {product.description}
                          </p>
                        </div>

                        <div className="flex items-baseline justify-between gap-2 pt-2">
                          <div className="tabular-nums">
                            <span className="text-base font-black text-amber-700 dark:text-amber-400 font-mono">
                              {product.price.toLocaleString(numberLocale)} F
                            </span>
                            {product.originalPrice && (
                              <span className="text-[11px] text-slate-400 line-through ms-1.5 font-mono">
                                {product.originalPrice.toLocaleString(numberLocale)} F
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[11px] font-semibold font-mono tabular-nums ${
                              effectiveStock <= 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {effectiveStock <= 0 ? t.equipement.outOfStock : `${t.equipement.stockLabel} ${effectiveStock}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-3 border-t border-stone-200/80 dark:border-white/10 space-y-3">
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                        {product.specs.slice(0, 2).join(' · ')}
                      </p>

                      <div className="flex items-center gap-2">
                        <div className="flex rounded-xl border border-stone-200 dark:border-white/10 overflow-hidden text-[11px] shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setProductFulfillment((prev) => ({ ...prev, [product.id]: 'PICKUP' }))
                            }
                            className={`min-h-[40px] px-2.5 py-2 font-bold flex items-center gap-1 transition whitespace-nowrap ${
                              modeChoice === 'PICKUP'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Store className="w-3.5 h-3.5 shrink-0" />
                            <span>{t.equipement.pickup}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setProductFulfillment((prev) => ({
                                ...prev,
                                [product.id]: 'DELIVERY',
                              }))
                            }
                            className={`min-h-[40px] px-2.5 py-2 font-bold flex items-center gap-1 transition whitespace-nowrap ${
                              modeChoice === 'DELIVERY'
                                ? 'bg-amber-600 text-slate-950'
                                : 'bg-stone-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Truck className="w-3.5 h-3.5 shrink-0" />
                            <span>{t.equipement.delivery}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={effectiveStock <= 0}
                          onClick={() => {
                            addProductToCart({ ...product, stock: effectiveStock }, 1, modeChoice);
                            triggerAddedToast(`"${product.name}" ${t.equipement.addedProductToast}`);
                          }}
                          className="flex-1 min-h-[40px] py-2 px-3 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition disabled:opacity-40 whitespace-nowrap"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                          <span>{effectiveStock <= 0 ? t.equipement.outOfStockShort : t.equipement.addToCart}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LOCATION MATÉRIEL MODE */}
      {mode === 'rental' && (
        <div className="space-y-4">
          <div className="glass-card border border-emerald-500/40 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t.equipement.cautionBannerTitle}</span>
              </div>
              <p className="text-[11px] text-emerald-800/85 dark:text-emerald-300/85 mt-0.5">
                {t.equipement.cautionBannerDesc}
              </p>
            </div>
            {onOpenRentalChecklistModal && (
              <button
                type="button"
                onClick={onOpenRentalChecklistModal}
                className="min-h-[40px] px-3 py-1.5 glass-surface border border-emerald-500/45 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>{t.equipement.checklistBtn}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRentals.map((item) => {
              const days = rentalDaysById[item.id] || 2;
              const startDate = rentalStartById[item.id] || '2026-11-22';
              const totalRental = item.pricePerDay * days;
              const imgBroken = brokenRentalImgs[item.id];
              const safeImg = sanitizeImageUrl(item.image, { allowDataImage: true });
              const effectiveAvail =
                typeof liveStockMap?.[item.id] === 'number'
                  ? liveStockMap[item.id]
                  : item.availableQuantity;

              return (
                <article
                  key={item.id}
                  className="glass-card border border-white/60 dark:border-white/12 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-amber-500/45 transition"
                >
                  <div className="flex gap-3.5 p-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10 bg-slate-900 shrink-0 flex items-center justify-center">
                      {!imgBroken && safeImg ? (
                        <img
                          src={safeImg}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenRentalImgs((prev) => ({ ...prev, [item.id]: true }))
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Tent className="w-9 h-9 text-amber-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block truncate">
                        {item.partnerName}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug mt-0.5">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                        {item.model}
                      </p>

                      <div className="flex items-baseline justify-between mt-2 tabular-nums">
                        <div>
                          <strong className="text-sm font-black text-amber-700 dark:text-amber-400 font-mono">
                            {item.pricePerDay.toLocaleString(numberLocale)} F
                          </strong>
                          <span className="text-[11px] text-slate-500"> {t.equipement.perDay}</span>
                        </div>
                        <span
                          className={`text-[11px] font-mono font-semibold ${
                            effectiveAvail <= 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {effectiveAvail <= 0 ? t.equipement.full : `${effectiveAvail}/${item.totalQuantity} ${t.equipement.availableSuffix}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-3 border-t border-stone-200/80 dark:border-white/10 space-y-3">
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          <span>{t.equipement.pickupLabel}</span>
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) =>
                            setRentalStartById((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          className="w-full min-h-[40px] glass-surface border border-white/55 dark:border-white/12 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                          {t.equipement.durationLabel}
                        </label>
                        <div className="min-h-[40px] flex items-center justify-between glass-surface border border-white/55 dark:border-white/12 rounded-xl px-2 py-1">
                          <button
                            type="button"
                            onClick={() =>
                              setRentalDaysById((prev) => ({
                                ...prev,
                                [item.id]: Math.max(1, days - 1),
                              }))
                            }
                            aria-label="-"
                            className="w-7 h-7 rounded-lg glass-surface flex items-center justify-center text-slate-800 dark:text-slate-100"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono font-bold text-xs tabular-nums text-slate-900 dark:text-white">
                            {days} {t.equipement.daysUnit}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setRentalDaysById((prev) => ({
                                ...prev,
                                [item.id]: Math.min(14, days + 1),
                              }))
                            }
                            aria-label="+"
                            className="w-7 h-7 rounded-lg glass-surface flex items-center justify-center text-slate-800 dark:text-slate-100"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                      <span>
                        {t.equipement.depositLabel}{' '}
                        <strong className="font-mono text-slate-900 dark:text-slate-200">
                          {item.depositAmount.toLocaleString(numberLocale)} F
                        </strong>
                      </span>
                      <span className="truncate max-w-[140px]">
                        {item.pickupLocation.split('(')[0].trim()}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={effectiveAvail <= 0}
                      onClick={() => {
                        addRentalToCart({ ...item, availableQuantity: effectiveAvail }, {
                          days,
                          quantity: 1,
                          startDate,
                          fulfillmentMode: 'PICKUP',
                        });
                        triggerAddedToast(`"${item.name}" (${days}${t.equipement.daysUnit}) ${t.equipement.addedRentalToast}`);
                      }}
                      className="w-full min-h-[44px] py-2 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition tabular-nums whitespace-nowrap disabled:opacity-40"
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {effectiveAvail <= 0
                          ? t.equipement.unavailable
                          : `${t.equipement.rentLabel} · ${totalRental.toLocaleString(numberLocale)} F (${days} ${t.equipement.daysUnit})`}
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
