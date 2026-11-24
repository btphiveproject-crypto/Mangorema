/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Truck,
  Store,
  ShieldCheck,
  Phone,
  CreditCard,
  Check,
  Clock,
  AlertCircle,
  QrCode,
  Sparkles,
  Lock,
  Loader2,
  ArrowRight,
  Compass,
  ExternalLink,
  Wallet,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../contexts/CartContext';
import { getCurrentIdToken } from '../firebase';
import { getGuestOrderControlToken, setGuestOrderControlToken } from '../utils/guestOrderTokens';
import { GABON_DELIVERY_ZONES } from '../data/gabonZones';
import { MarketplaceOrder, PaymentMethodType, UnifiedCartItem } from '../types';

interface UnifiedCartModalProps {
  userId?: string | null;
  userPhone?: string;
  onOrderCompleted: (order: MarketplaceOrder) => Promise<void> | void;
  onOrderStatusUpdated?: (order: MarketplaceOrder) => Promise<void> | void;
  onStockUpdated?: (stockMap: Record<string, number>) => void;
  onExploreCatalog?: () => void;
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `idem-${crypto.randomUUID()}`;
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const UnifiedCartModal: React.FC<UnifiedCartModalProps> = ({
  userId,
  userPhone = '074 12 34 56',
  onOrderCompleted,
  onOrderStatusUpdated,
  onStockUpdated,
  onExploreCatalog,
}) => {
  const {
    items,
    totalCount,
    itemsSubtotal,
    deliveryFee,
    deliveryZoneId,
    setDeliveryZoneId,
    selectedDeliveryZone,
    depositTotal,
    platformCommission,
    grandTotal,
    hasDeliveryItem,
    isCartOpen,
    setIsCartOpen,
    updateItemQuantity,
    toggleItemFulfillment,
    removeItem,
    clearCart,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('AIRTEL');
  const [payerPhone, setPayerPhone] = useState(userPhone);
  const [simulateMode, setSimulateMode] = useState<'INSTANT' | 'PENDING_USSD' | 'FAILED'>('INSTANT');
  const [showSandboxControls, setShowSandboxControls] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('Charbonnages, près Station Total');

  const [step, setStep] = useState<'cart' | 'pending' | 'receipt'>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());
  const [activeOrder, setActiveOrder] = useState<MarketplaceOrder | null>(null);
  const [snapshotItems, setSnapshotItems] = useState<UnifiedCartItem[]>([]);

  // Reset idempotency key when cart composition changes while on cart step
  const cartFingerprint = items
    .map((i) => `${i.refId}:${i.quantity}:${i.rentalDays || 1}:${i.fulfillmentMode}`)
    .join('|');

  useEffect(() => {
    if (step === 'cart') {
      setIdempotencyKey(generateIdempotencyKey());
      setErrorMsg(null);
    }
  }, [cartFingerprint, step]);

  if (!isCartOpen) return null;

  const handleClose = () => {
    setIsCartOpen(false);
    setTimeout(() => {
      setStep('cart');
      setErrorMsg(null);
      setActiveOrder(null);
      setCardCvv('');
    }, 150);
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || isSubmitting) return;
    setErrorMsg(null);

    if (hasDeliveryItem && deliveryAddress.trim().length < 4) {
      setErrorMsg(
        `Veuillez renseigner un point de repère pour la livraison (${selectedDeliveryZone.shortLabel}).`
      );
      return;
    }

    if (paymentMethod === 'AIRTEL' || paymentMethod === 'MOOV' || paymentMethod === 'GHETTOPAY') {
      const cleanWallet = payerPhone.replace(/\s+/g, '');
      if (paymentMethod === 'GHETTOPAY') {
        if (cleanWallet.length < 4) {
          setErrorMsg(
            'Veuillez saisir votre numéro mobile ou @identifiant GhettoPay (ex: 074 12 34 56 ou @nom).'
          );
          return;
        }
      } else if (cleanWallet.length < 8) {
        setErrorMsg('Veuillez saisir un numéro Mobile Money gabonais valide (ex: 074 12 34 56).');
        return;
      }
    } else {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19) {
        setErrorMsg('Numéro de carte bancaire invalide (13 à 19 chiffres).');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) {
        setErrorMsg('Date d’expiration invalide (format MM/AA requis).');
        return;
      }
      if (!/^\d{3,4}$/.test(cardCvv.trim())) {
        setErrorMsg('Code CVV à 3 ou 4 chiffres requis.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const idToken = await getCurrentIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }

      const formattedAddress = hasDeliveryItem
        ? `${selectedDeliveryZone.shortLabel} · ${deliveryAddress.trim()}`
        : undefined;

      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          idempotencyKey,
          paymentMethod,
          paymentFlow: 'USSD_PUSH',
          simulateMode,
          payerPhone,
          cardNumber,
          cardExpiry: cardExpiry.trim(),
          cardCvv: cardCvv.trim(),
          deliveryZoneId: hasDeliveryItem ? deliveryZoneId : undefined,
          deliveryAddress: formattedAddress,
          items: items.map((item) => ({
            refId: item.refId,
            kind: item.kind,
            quantity: item.quantity,
            rentalDays: item.rentalDays,
            fulfillmentMode: item.fulfillmentMode,
            meta: item.meta,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Le paiement a été refusé par la passerelle.');
      }

      if (data.stock && typeof data.stock === 'object' && onStockUpdated) {
        onStockUpdated(data.stock as Record<string, number>);
      }

      const rec = data.record;
      if (typeof data.orderControlToken === 'string') {
        setGuestOrderControlToken(rec.orderId, data.orderControlToken);
      }
      const itemsCopy = [...items];
      const order: MarketplaceOrder = {
        id: rec.orderId,
        userId: userId || rec.userId || 'guest',
        refNumber: rec.refNumber,
        idempotencyKey: rec.idempotencyKey,
        items: itemsCopy,
        itemsSubtotal: rec.itemsSubtotal,
        deliveryFee: rec.deliveryFee,
        depositTotal: rec.depositTotal,
        platformCommission: rec.platformCommission,
        vendorNetAmount: rec.vendorNetAmount,
        grandTotalCharged: rec.grandTotalCharged,
        paymentMethod: rec.paymentMethod,
        paymentStatus: rec.paymentStatus,
        fulfillmentStatus: rec.fulfillmentStatus,
        payerLabel: rec.payerLabel,
        deliveryZoneId: rec.deliveryZoneId,
        deliveryZoneLabel: rec.deliveryZoneLabel,
        deliveryAddress: rec.deliveryAddress || formattedAddress,
        ussdPushRef: rec.ussdPushRef,
        ussdDialCode: rec.ussdDialCode,
        vendorSplits: rec.vendorSplits,
        timestamp: rec.timestamp,
        receiptHash: rec.receiptHash,
      };

      setSnapshotItems(itemsCopy);
      setActiveOrder(order);
      await onOrderCompleted(order);
      clearCart();

      if (order.paymentStatus === 'PENDING') {
        setStep('pending');
      } else {
        setStep('receipt');
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#d97706', '#ffffff'],
        });
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau lors du paiement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPendingOrder = async () => {
    if (!activeOrder || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const idToken = await getCurrentIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }
      const res = await fetch('/api/payments/confirm-pending', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: activeOrder.id,
          orderControlToken: getGuestOrderControlToken(activeOrder.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossible de valider la transaction en attente.');
      }

      const updated: MarketplaceOrder = {
        ...activeOrder,
        paymentStatus: 'CONFIRMED',
        fulfillmentStatus: 'CONFIRMED',
      };
      setActiveOrder(updated);
      if (onOrderStatusUpdated) {
        await onOrderStatusUpdated(updated);
      }
      setStep('receipt');
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#d97706', '#ffffff'],
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la confirmation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const kindLabel = (kind: UnifiedCartItem['kind']) => {
    switch (kind) {
      case 'activity':
        return 'Expédition';
      case 'rental':
        return 'Location';
      case 'product':
        return 'Boutique';
      case 'shuttle':
        return 'Navette';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#121614] border border-stone-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto no-scrollbar shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#121614]/95 backdrop-blur-md border-b border-stone-200 dark:border-white/10 p-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center shrink-0 shadow">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                {step === 'cart' && `Panier Unifié · ${totalCount} article(s)`}
                {step === 'pending' && 'Validation Mobile Money en attente'}
                {step === 'receipt' && 'Récépissé Officiel Vérifié'}
              </span>
              <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white truncate">
                {step === 'cart' && 'Guichet Unique MANGOREMA'}
                {step === 'pending' && 'Confirmation USSD Requise'}
                {step === 'receipt' && (activeOrder?.refNumber || 'Commande Validée')}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: UNIFIED CART & CHECKOUT */}
        {step === 'cart' && (
          <div className="p-4 space-y-4">
            {items.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Votre panier unifié est vide
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Regroupez dans une seule commande vos activités, locations de tentes/GPS, achats boutique et navettes 4x4.
                  </p>
                </div>
                {onExploreCatalog && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onExploreCatalog();
                    }}
                    className="min-h-[44px] px-4 py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs inline-flex items-center gap-1.5 shadow active:scale-95 transition"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Découvrir activités &amp; équipement</span>
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitCheckout} className="space-y-4">
                {/* Item List */}
                <div className="space-y-2.5">
                  {items.map((item) => {
                    const addons =
                      item.kind === 'activity'
                        ? (item.meta?.shuttleIncluded ? 5000 : 0) +
                          (item.meta?.tentIncluded ? 3000 : 0) +
                          (item.meta?.guideIncluded ? 2500 : 0) +
                          (item.meta?.mealPackIncluded ? 4000 : 0)
                        : 0;
                    const lineTotal =
                      item.kind === 'rental'
                        ? item.unitPrice * (item.rentalDays || 1) * item.quantity
                        : (item.unitPrice + addons) * item.quantity;

                    return (
                      <div
                        key={item.cartItemId}
                        className="bg-stone-50 dark:bg-slate-900/75 border border-stone-200 dark:border-white/10 rounded-2xl p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                              {kindLabel(item.kind)}
                            </span>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.cartItemId)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition shrink-0"
                            title="Retirer du panier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Fulfillment toggle for products & rentals */}
                        {(item.kind === 'product' || item.kind === 'rental') && (
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => toggleItemFulfillment(item.cartItemId, 'PICKUP')}
                              className={`flex-1 py-1.5 px-2 rounded-xl font-semibold border flex items-center justify-center gap-1 transition ${
                                item.fulfillmentMode === 'PICKUP'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500/50 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-white dark:bg-slate-950 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <Store className="w-3 h-3" />
                              <span>Retrait gratuit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleItemFulfillment(item.cartItemId, 'DELIVERY')}
                              className={`flex-1 py-1.5 px-2 rounded-xl font-semibold border flex items-center justify-center gap-1 transition ${
                                item.fulfillmentMode === 'DELIVERY'
                                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500/50 text-amber-800 dark:text-amber-300'
                                  : 'bg-white dark:bg-slate-950 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <Truck className="w-3 h-3" />
                              <span>Livraison Gabon</span>
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-stone-200 dark:border-white/5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.cartItemId, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-950 border border-stone-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.cartItemId, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-950 border border-stone-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right tabular-nums">
                            <strong className="text-xs font-black text-amber-700 dark:text-amber-400">
                              {lineTotal.toLocaleString('fr-FR')} F
                            </strong>
                            {item.kind === 'rental' && item.depositUnitAmount ? (
                              <span className="block text-[9px] text-slate-500 dark:text-slate-400">
                                + caution {(item.depositUnitAmount * item.quantity).toLocaleString('fr-FR')} F
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Gabon Delivery Zone & Landmark Selector */}
                {hasDeliveryItem && (
                  <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Zone de livraison Gabon</span>
                      </label>
                      <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                        Délai : {selectedDeliveryZone.etaLabel}
                      </span>
                    </div>

                    <select
                      value={deliveryZoneId}
                      onChange={(e) => setDeliveryZoneId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-stone-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    >
                      {GABON_DELIVERY_ZONES.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.label} ({z.fee.toLocaleString('fr-FR')} F)
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder={`Repère exact (ex: ${selectedDeliveryZone.sampleLandmark})`}
                      className="w-full bg-white dark:bg-slate-950 border border-stone-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {/* Transparent Financial Summary */}
                <div className="bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 space-y-1.5 text-xs tabular-nums">
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>Sous-total articles &amp; services</span>
                    <span className="font-mono font-semibold">{itemsSubtotal.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>Livraison ({selectedDeliveryZone.shortLabel})</span>
                      <span className="font-mono font-semibold">{deliveryFee.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Frais plateforme MANGOREMA (10% inclus)</span>
                    <span className="font-mono">{platformCommission.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  {depositTotal > 0 && (
                    <div className="flex justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span>Caution location séquestrée (restituée au retour)</span>
                      <span className="font-mono">{depositTotal.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-stone-200 dark:border-white/10 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 dark:text-white">Total à régler maintenant</span>
                    <span className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono">
                      {grandTotal.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>

                {/* Integrated In-App Payment Selector */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Paiement intégré sécurisé serveur
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>100% in-app</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('AIRTEL')}
                      className={`py-2.5 px-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'AIRTEL'
                          ? 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-800 dark:text-red-200'
                          : 'bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                      <span>Airtel Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MOOV')}
                      className={`py-2.5 px-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'MOOV'
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-800 dark:text-blue-200'
                          : 'bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>Moov Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('GHETTOPAY')}
                      className={`py-2.5 px-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'GHETTOPAY'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                          : 'bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>GhettoPay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`py-2.5 px-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'CARD'
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-200'
                          : 'bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Carte Bancaire</span>
                    </button>
                  </div>

                  {paymentMethod === 'AIRTEL' || paymentMethod === 'MOOV' || paymentMethod === 'GHETTOPAY' ? (
                    <div className="space-y-2">
                      {paymentMethod === 'GHETTOPAY' && (
                        <div className="bg-emerald-50/70 dark:bg-emerald-950/35 border border-emerald-500/35 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-[10px]">
                          <span className="text-emerald-900 dark:text-emerald-200 font-medium">
                            Wallet mobile gabonais FCFA · QR &amp; Mobile Money
                          </span>
                          <a
                            href="https://www.ghettopay.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
                          >
                            <span>ghettopay.com</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">
                          {paymentMethod === 'GHETTOPAY'
                            ? 'Téléphone ou @ID GhettoPay'
                            : `Numéro ${paymentMethod === 'AIRTEL' ? 'Airtel Money (074 / 077)' : 'Moov Money (065 / 066)'}`}
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            value={payerPhone}
                            onChange={(e) => setPayerPhone(e.target.value)}
                            placeholder={paymentMethod === 'GHETTOPAY' ? '074 12 34 56 ou @nom' : '074 12 34 56'}
                            className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl py-2 pl-8 pr-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-500/30 rounded-xl p-2.5 text-[11px] text-emerald-900 dark:text-emerald-200 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Validation par Push USSD sur votre téléphone</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowSandboxControls((v) => !v)}
                            className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
                          >
                            {showSandboxControls ? 'Masquer test' : 'Mode test'}
                          </button>
                        </div>
                        <p className="text-[10px] opacity-85 leading-snug">
                          Aucun code secret n’est saisi ici : l’opérateur envoie la demande de confirmation sur votre mobile (
                          {paymentMethod === 'AIRTEL' ? '*150#' : paymentMethod === 'MOOV' ? '*555#' : 'GhettoPay'}).
                        </p>

                        {showSandboxControls && (
                          <div className="pt-1.5 border-t border-emerald-500/20 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSimulateMode('INSTANT')}
                              className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold border ${
                                simulateMode === 'INSTANT'
                                  ? 'bg-emerald-600 text-white border-emerald-500'
                                  : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              Direct OK
                            </button>
                            <button
                              type="button"
                              onClick={() => setSimulateMode('PENDING_USSD')}
                              className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold border ${
                                simulateMode === 'PENDING_USSD'
                                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                                  : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              Push attente
                            </button>
                            <button
                              type="button"
                              onClick={() => setSimulateMode('FAILED')}
                              className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold border ${
                                simulateMode === 'FAILED'
                                  ? 'bg-red-600 text-white border-red-500'
                                  : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              Refus test
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                        placeholder="Numéro Visa / Mastercard (16 chiffres)"
                        className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA"
                          className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="CVV"
                          className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Vérification 3D-Secure serveur · Fin 0002 simule un refus bancaire.
                      </p>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="bg-red-50 dark:bg-red-950/60 border border-red-500/40 rounded-2xl p-3 flex items-start gap-2 text-xs text-red-800 dark:text-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[46px] py-3 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Payer {grandTotal.toLocaleString('fr-FR')} FCFA</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* STEP 2: PENDING USSD CONFIRMATION */}
        {step === 'pending' && activeOrder && (
          <div className="p-5 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Confirmez le Push USSD sur votre mobile
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Commande <strong className="font-mono">{activeOrder.refNumber}</strong> en attente pour{' '}
                <strong>{activeOrder.grandTotalCharged.toLocaleString('fr-FR')} FCFA</strong>.
              </p>
              {(activeOrder.ussdDialCode || activeOrder.ussdPushRef) && (
                <div className="bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 rounded-xl p-2.5 text-[11px] font-mono text-slate-700 dark:text-slate-300 space-y-0.5">
                  {activeOrder.ussdDialCode && (
                    <div>Menu USSD : <strong>{activeOrder.ussdDialCode}</strong></div>
                  )}
                  {activeOrder.ussdPushRef && (
                    <div className="text-[10px] text-slate-500">Réf Push : {activeOrder.ussdPushRef}</div>
                  )}
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/60 border border-red-500/40 rounded-2xl p-3 text-xs text-red-800 dark:text-red-200 text-left">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmPendingOrder}
                disabled={isSubmitting}
                className="w-full min-h-[44px] py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow active:scale-95 transition disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Valider le push USSD maintenant</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                Conserver en attente dans mon profil
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CRYPTOGRAPHIC RECEIPT */}
        {step === 'receipt' && activeOrder && (
          <div className="p-5 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="font-black text-lg text-slate-900 dark:text-white">
                Commande Unifiée Confirmée !
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Paiement vérifié côté serveur et enregistré dans votre historique MANGOREMA.
              </p>
            </div>

            <div className="bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
              <div className="flex items-start justify-between border-b border-stone-200 dark:border-white/10 pb-2">
                <div>
                  <span className="text-[9px] text-amber-700 dark:text-amber-400 uppercase font-bold block">
                    RÉFÉRENCE COMMANDE
                  </span>
                  <strong className="text-sm text-slate-900 dark:text-white">{activeOrder.refNumber}</strong>
                </div>
                <QrCode className="w-8 h-8 text-amber-600 dark:text-amber-400 opacity-75" />
              </div>

              <div className="space-y-1 text-[11px] font-sans">
                {snapshotItems.map((it) => (
                  <div key={it.cartItemId} className="flex justify-between gap-2 text-slate-700 dark:text-slate-300">
                    <span className="truncate">
                      {it.quantity}x {it.title}
                    </span>
                    <span className="shrink-0 font-mono">
                      {it.kind === 'rental' ? `${it.rentalDays || 1}j` : it.fulfillmentMode === 'DELIVERY' ? 'Livraison' : 'Retrait'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-200 dark:border-white/10 pt-2 space-y-1 text-[11px] tabular-nums">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Canal validé :</span>
                  <span>{activeOrder.payerLabel}</span>
                </div>
                {activeOrder.depositTotal > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                    <span>Caution location :</span>
                    <span>{activeOrder.depositTotal.toLocaleString('fr-FR')} F</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-amber-700 dark:text-amber-400 text-xs">
                  <span>Montant Débité :</span>
                  <span>{activeOrder.grandTotalCharged.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="text-[9px] text-slate-500 pt-1 break-all">
                  Signature : {activeOrder.receiptHash}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 rounded-xl p-2.5">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Consultez votre reçu, suivi de livraison et retours depuis l’onglet Profil.</span>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full min-h-[44px] py-3 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow active:scale-95 transition"
            >
              Terminer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
