/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  X,
  Briefcase,
  BarChart3,
  Package,
  Receipt,
  Plus,
  Minus,
  PauseCircle,
  PlayCircle,
  Trash2,
  CheckCircle2,
  RotateCcw,
  LogIn,
  Loader2,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { resolveParkCoords } from '../utils/activityLocation';
import {
  FulfillmentStatus,
  MarketplaceOrder,
  VendorListing,
  VendorListingKind,
} from '../types';

interface VendorPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser?: { uid: string; email: string | null; displayName: string | null } | null;
  onSignInGoogle?: () => void;
  vendorListings: VendorListing[];
  orders: MarketplaceOrder[];
  onCreateListing: (payload: {
    listingKind: VendorListingKind;
    title: string;
    category: string;
    location: string;
    locationEnabled?: boolean;
    lat?: number;
    lng?: number;
    price: number;
    depositAmount?: number;
    stockOrCapacity: number;
    description: string;
  }) => Promise<void>;
  onUpdateListing: (listing: VendorListing) => Promise<void>;
  onDeleteListing: (listingId: string) => Promise<void>;
  onUpdateOrderFulfillment: (order: MarketplaceOrder, nextStatus: FulfillmentStatus) => Promise<void>;
  onRefundOrder: (order: MarketplaceOrder, reason: string) => Promise<void>;
}

export const VendorPortalModal: React.FC<VendorPortalModalProps> = ({
  isOpen,
  onClose,
  authUser,
  onSignInGoogle,
  vendorListings,
  orders,
  onCreateListing,
  onUpdateListing,
  onDeleteListing,
  onUpdateOrderFulfillment,
  onRefundOrder,
}) => {
  const [tab, setTab] = useState<'analytics' | 'listings' | 'orders'>('analytics');
  const [showForm, setShowForm] = useState(false);

  // New Listing Form State
  const [listingKind, setListingKind] = useState<VendorListingKind>('product');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Randonnée & Bivouac');
  const [location, setLocation] = useState('Libreville · Charbonnages');
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [lat, setLat] = useState('0.5833');
  const [lng, setLng] = useState('9.3500');
  const [isLocating, setIsLocating] = useState(false);
  const [price, setPrice] = useState('25000');
  const [depositAmount, setDepositAmount] = useState('15000');
  const [stockOrCapacity, setStockOrCapacity] = useState('10');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const financials = useMemo(() => {
    const validOrders = orders.filter((o) => o.paymentStatus !== 'FAILED');
    const confirmedOrders = validOrders.filter((o) => o.paymentStatus === 'CONFIRMED');
    const refundedOrders = validOrders.filter((o) => o.paymentStatus === 'REFUNDED');

    const grossSales = confirmedOrders.reduce((s, o) => s + o.itemsSubtotal, 0);
    const totalCommission = confirmedOrders.reduce((s, o) => s + o.platformCommission, 0);
    const netRevenue = confirmedOrders.reduce((s, o) => s + o.vendorNetAmount, 0);
    const heldDeposits = confirmedOrders.reduce((s, o) => s + o.depositTotal, 0);
    const refundedTotal = refundedOrders.reduce((s, o) => s + o.grandTotalCharged, 0);

    return {
      grossSales,
      totalCommission,
      netRevenue,
      heldDeposits,
      refundedTotal,
      confirmedCount: confirmedOrders.length,
    };
  }, [orders]);

  const myListings = useMemo(() => {
    if (!authUser) return vendorListings;
    return vendorListings.filter((l) => l.ownerUserId === authUser.uid);
  }, [vendorListings, authUser]);

  if (!isOpen) return null;

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const numPrice = Math.round(Number(price));
    const numStock = Math.max(1, Math.round(Number(stockOrCapacity)));
    const numDeposit = listingKind === 'rental' ? Math.max(0, Math.round(Number(depositAmount))) : undefined;

    if (title.trim().length < 3) {
      setFormError('Le titre doit contenir au moins 3 caractères.');
      return;
    }
    if (description.trim().length < 5) {
      setFormError('Veuillez rédiger une courte description (5 car. min).');
      return;
    }
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      setFormError('Veuillez saisir un tarif valide en FCFA.');
      return;
    }

    const [fallbackLat, fallbackLng] = resolveParkCoords(location);
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    const validLat =
      Number.isFinite(parsedLat) && parsedLat >= -90 && parsedLat <= 90 ? parsedLat : fallbackLat;
    const validLng =
      Number.isFinite(parsedLng) && parsedLng >= -180 && parsedLng <= 180 ? parsedLng : fallbackLng;

    setIsSaving(true);
    try {
      await onCreateListing({
        listingKind,
        title: title.trim(),
        category: category.trim() || 'Outdoor Gabon',
        location: location.trim() || 'Libreville',
        locationEnabled: listingKind === 'activity' ? locationEnabled : undefined,
        lat: listingKind === 'activity' ? validLat : undefined,
        lng: listingKind === 'activity' ? validLng : undefined,
        price: numPrice,
        depositAmount: numDeposit,
        stockOrCapacity: numStock,
        description: description.trim(),
      });
      setTitle('');
      setDescription('');
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la publication.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#121614] border border-stone-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto no-scrollbar shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#121614]/95 backdrop-blur-md border-b border-stone-200 dark:border-white/10 p-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center shrink-0 shadow">
              <Briefcase className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                Espace Pro &amp; Partenaires Gabon
              </span>
              <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white truncate">
                Prestataire &amp; Vendeur
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="p-3 border-b border-stone-200 dark:border-white/10 grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setTab('analytics')}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition ${
              tab === 'analytics'
                ? 'copper-gradient text-slate-950 shadow'
                : 'bg-stone-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Revenus</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('listings')}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition ${
              tab === 'listings'
                ? 'copper-gradient text-slate-950 shadow'
                : 'bg-stone-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Offres ({myListings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('orders')}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition ${
              tab === 'orders'
                ? 'copper-gradient text-slate-950 shadow'
                : 'bg-stone-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Commandes ({orders.length})</span>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!authUser && (
            <div className="bg-amber-50 dark:bg-amber-950/35 border border-amber-500/40 rounded-2xl p-3 flex items-center justify-between gap-2">
              <span className="text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                Connectez votre compte Google pour publier des offres et gérer vos commandes sur Firestore.
              </span>
              {onSignInGoogle && (
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  className="px-3 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-[11px] flex items-center gap-1 shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Connexion</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 1: ANALYTICS & COMMISSIONS */}
          {tab === 'analytics' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5 tabular-nums">
                <div className="bg-stone-50 dark:bg-slate-900/90 border border-stone-200 dark:border-white/10 rounded-2xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                    Volume Brut (GMV)
                  </span>
                  <strong className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1 block">
                    {financials.grossSales.toLocaleString('fr-FR')} F
                  </strong>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    {financials.confirmedCount} commande(s) validée(s)
                  </span>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-500/35 rounded-2xl p-3">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold block">
                    Revenu Net Partenaire
                  </span>
                  <strong className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {financials.netRevenue.toLocaleString('fr-FR')} F
                  </strong>
                  <span className="text-[10px] text-emerald-800/80 dark:text-emerald-400">
                    90% reversé · Airtel / Moov / GhettoPay
                  </span>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-slate-950/75 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 space-y-2 text-xs tabular-nums">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Commission plateforme (10%)</span>
                  <strong className="font-mono text-amber-700 dark:text-amber-400">
                    {financials.totalCommission.toLocaleString('fr-FR')} FCFA
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Cautions locations séquestrées</span>
                  <strong className="font-mono text-slate-900 dark:text-white">
                    {financials.heldDeposits.toLocaleString('fr-FR')} FCFA
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Montants remboursés</span>
                  <strong className="font-mono text-red-600 dark:text-red-400">
                    {financials.refundedTotal.toLocaleString('fr-FR')} FCFA
                  </strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200 dark:border-white/10">
                  <span className="text-slate-600 dark:text-slate-400">Fiches actives en catalogue</span>
                  <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                    {myListings.filter((l) => l.status === 'ACTIVE').length} active(s)
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE LISTINGS & STOCK */}
          {tab === 'listings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Mes activités, produits &amp; locations
                </span>
                <button
                  type="button"
                  onClick={() => setShowForm((v) => !v)}
                  className="px-3 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showForm ? 'Masquer' : 'Nouvelle offre'}</span>
                </button>
              </div>

              {showForm && (
                <form
                  onSubmit={handleSubmitListing}
                  className="bg-stone-50 dark:bg-slate-950/90 border border-amber-500/40 rounded-2xl p-3.5 space-y-2.5 text-xs"
                >
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['product', 'rental', 'activity'] as VendorListingKind[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setListingKind(k)}
                        className={`py-2 px-2 rounded-xl font-bold border transition ${
                          listingKind === k
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {k === 'product' ? 'Produit' : k === 'rental' ? 'Location' : 'Activité'}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titre (ex: Hamac Jungle Moustiquaire ou Trek Akanda)"
                    className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Catégorie"
                      className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Lieu / Retrait"
                      className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        {listingKind === 'rental' ? 'Tarif / jour (FCFA)' : 'Prix (FCFA)'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        {listingKind === 'activity' ? 'Places dispo' : 'Stock initial'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={stockOrCapacity}
                        onChange={(e) => setStockOrCapacity(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {listingKind === 'rental' && (
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Caution séquestrée (FCFA)</label>
                      <input
                        type="number"
                        min={0}
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  {listingKind === 'activity' && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Activer la localisation GPS</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setLocationEnabled((v) => !v)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                            locationEnabled
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-stone-200 dark:border-white/10'
                          }`}
                        >
                          {locationEnabled ? 'Activée' : 'Désactivée'}
                        </button>
                      </div>
                      {locationEnabled && (
                        <div className="grid grid-cols-3 gap-1.5">
                          <input
                            type="number"
                            step="0.0001"
                            value={lat}
                            onChange={(e) => setLat(e.target.value)}
                            placeholder="Lat"
                            className="bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-mono tabular-nums"
                          />
                          <input
                            type="number"
                            step="0.0001"
                            value={lng}
                            onChange={(e) => setLng(e.target.value)}
                            placeholder="Lng"
                            className="bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-mono tabular-nums"
                          />
                          <button
                            type="button"
                            disabled={isLocating}
                            onClick={() => {
                              if (!navigator.geolocation) return;
                              setIsLocating(true);
                              navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                  setIsLocating(false);
                                  setLat(pos.coords.latitude.toFixed(5));
                                  setLng(pos.coords.longitude.toFixed(5));
                                },
                                () => {
                                  setIsLocating(false);
                                  const [fLat, fLng] = resolveParkCoords(location);
                                  setLat(String(fLat));
                                  setLng(String(fLng));
                                },
                                { enableHighAccuracy: true, timeout: 7000 }
                              );
                            }}
                            className="px-2 py-1.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-[10px]"
                          >
                            {isLocating ? '...' : 'Mon GPS'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description détaillée, consignes sécurité et points de retrait..."
                    className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />

                  {formError && (
                    <div className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full min-h-[42px] py-2 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publier au catalogue MANGOREMA'}
                  </button>
                </form>
              )}

              {myListings.length === 0 ? (
                <div className="bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-white/10 rounded-2xl p-6 text-center text-xs text-slate-600 dark:text-slate-400">
                  Aucune fiche partenaire publiée. Cliquez sur « Nouvelle offre » pour proposer une activité, un équipement à louer ou un article boutique.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="bg-stone-50 dark:bg-slate-900/75 border border-stone-200 dark:border-white/10 rounded-2xl p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                            {listing.listingKind} · {listing.status}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {listing.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate">
                            {listing.location} · {listing.price.toLocaleString('fr-FR')} F
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {listing.listingKind === 'activity' && (
                            <button
                              type="button"
                              onClick={() => {
                                const [fLat, fLng] = resolveParkCoords(listing.location);
                                onUpdateListing({
                                  ...listing,
                                  locationEnabled: listing.locationEnabled === false,
                                  lat: typeof listing.lat === 'number' ? listing.lat : fLat,
                                  lng: typeof listing.lng === 'number' ? listing.lng : fLng,
                                });
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                                listing.locationEnabled !== false
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-white dark:bg-slate-950 border-stone-200 dark:border-white/10 text-slate-500'
                              }`}
                              title="Activer ou désactiver la localisation GPS"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>{listing.locationEnabled !== false ? 'GPS' : 'Off'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateListing({
                                ...listing,
                                status: listing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
                              })
                            }
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                            title={listing.status === 'ACTIVE' ? 'Mettre en pause' : 'Activer'}
                          >
                            {listing.status === 'ACTIVE' ? (
                              <PauseCircle className="w-4 h-4 text-amber-600" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-emerald-600" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteListing(listing.id)}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-red-500"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-white/5 text-xs">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">Stock / Capacité</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateListing({
                                ...listing,
                                stockOrCapacity: Math.max(0, listing.stockOrCapacity - 1),
                              })
                            }
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-950 border border-stone-200 dark:border-white/10 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold w-6 text-center tabular-nums text-slate-900 dark:text-white">
                            {listing.stockOrCapacity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateListing({
                                ...listing,
                                stockOrCapacity: listing.stockOrCapacity + 1,
                              })
                            }
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-950 border border-stone-200 dark:border-white/10 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORDERS, FULFILLMENT & REFUNDS */}
          {tab === 'orders' && (
            <div className="space-y-2.5">
              {orders.length === 0 ? (
                <div className="bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-white/10 rounded-2xl p-6 text-center text-xs text-slate-600 dark:text-slate-400">
                  Aucune commande unifiée enregistrée pour le moment.
                </div>
              ) : (
                orders.map((ord) => {
                  const isTerminal = ord.paymentStatus === 'REFUNDED' || ord.fulfillmentStatus === 'REFUNDED';
                  const isBusy = busyOrderId === ord.id;

                  return (
                    <div
                      key={ord.id}
                      className="bg-stone-50 dark:bg-slate-900/75 border border-stone-200 dark:border-white/10 rounded-2xl p-3 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400 block">
                            {ord.refNumber} · {ord.paymentStatus}
                          </span>
                          <p className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
                            {ord.items.map((i) => `${i.quantity}x ${i.title}`).join(' · ') || 'Commande MANGOREMA'}
                          </p>
                          <span className="text-[10px] text-slate-500">
                            Statut logistique : <strong>{ord.fulfillmentStatus}</strong>
                          </span>
                        </div>
                        <strong className="font-mono text-amber-700 dark:text-amber-400 shrink-0 tabular-nums">
                          {ord.grandTotalCharged.toLocaleString('fr-FR')} F
                        </strong>
                      </div>

                      {!isTerminal && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-200 dark:border-white/5">
                          <button
                            type="button"
                            disabled={isBusy || ord.fulfillmentStatus === 'COMPLETED'}
                            onClick={async () => {
                              setBusyOrderId(ord.id);
                              try {
                                const next: FulfillmentStatus =
                                  ord.fulfillmentStatus === 'CONFIRMED'
                                    ? 'PREPARING'
                                    : ord.fulfillmentStatus === 'PREPARING'
                                    ? 'READY_PICKUP'
                                    : 'COMPLETED';
                                await onUpdateOrderFulfillment(ord, next);
                              } finally {
                                setBusyOrderId(null);
                              }
                            }}
                            className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {ord.fulfillmentStatus === 'COMPLETED'
                                ? 'Terminée'
                                : ord.fulfillmentStatus === 'READY_PICKUP'
                                ? 'Clôturer'
                                : 'Avancer préparation'}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={async () => {
                              setBusyOrderId(ord.id);
                              try {
                                await onRefundOrder(ord, 'Remboursement validé depuis Espace Prestataire');
                              } finally {
                                setBusyOrderId(null);
                              }
                            }}
                            className="py-1.5 px-2.5 bg-red-50 dark:bg-red-950/50 border border-red-500/40 text-red-700 dark:text-red-300 font-bold rounded-xl text-[11px] flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Rembourser</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
