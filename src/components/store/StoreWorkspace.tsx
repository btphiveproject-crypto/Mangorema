import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  LogIn,
  MapPin,
  Package,
  PauseCircle,
  PlayCircle,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Store,
  Tent,
  Trash2,
  TrendingUp,
  Truck,
  Wallet,
} from 'lucide-react';
import {
  BusinessSettlementSettings,
  FulfillmentStatus,
  MarketplaceOrder,
  RentalItem,
  StoreCategory,
  StoreProductCategory,
  StoreProfile,
  StoreTabType,
  VendorListing,
  VendorListingKind,
  VendorOrderFulfillment,
} from '../../types';
import { STORE_CATEGORIES_META } from '../../data/partnerSpecialties';
import { sanitizeImageUrl } from '../../utils/urlSecurity';

interface StoreWorkspaceProps {
  activeTab: StoreTabType;
  onChangeTab: (tab: StoreTabType) => void;
  onSwitchToEquipement: () => void;
  authUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
  } | null;
  onSignInGoogle: () => void;
  storeProfile: StoreProfile | null;
  settlementSettings: BusinessSettlementSettings | null;
  myListings: VendorListing[];
  orders: MarketplaceOrder[];
  onSaveStoreProfile: (store: Omit<StoreProfile, 'ownerUserId' | 'createdAtMs'>) => Promise<void>;
  onSaveSettlementSettings: (settings: Omit<BusinessSettlementSettings, 'userId'>) => Promise<void>;
  onCreateListing: (payload: {
    listingKind: VendorListingKind;
    ownerRole: 'store';
    productCategory?: StoreProductCategory;
    rentalCategory?: RentalItem['category'];
    storeId?: string;
    storeName?: string;
    deliveryAvailable?: boolean;
    title: string;
    category: string;
    location: string;
    price: number;
    depositAmount?: number;
    stockOrCapacity: number;
    description: string;
  }) => Promise<void>;
  onUpdateListing: (listing: VendorListing) => Promise<void>;
  onDeleteListing: (listingId: string) => Promise<void>;
  onUpdateOrderFulfillment: (order: MarketplaceOrder, nextStatus: FulfillmentStatus) => Promise<void>;
  onRefundOrder: (order: MarketplaceOrder, reason: string) => Promise<void>;
  vendorOrders?: VendorOrderFulfillment[];
  onUpdateVendorOrderStatus?: (orderId: string, nextStatus: FulfillmentStatus) => Promise<void>;
}

const PRODUCT_CATEGORIES: Array<{ id: StoreProductCategory; label: string }> = [
  { id: 'randonnee', label: 'Randonnée' },
  { id: 'camping', label: 'Camping' },
  { id: 'chaussures_vetements', label: 'Tenues & Chaussures' },
  { id: 'optique_photo', label: 'Optique & Photo' },
  { id: 'eclairage_gadgets', label: 'Éclairage & Tech' },
  { id: 'lifestyle_mangorema', label: 'Lifestyle & Goodies' },
];

const RENTAL_CATEGORIES: Array<{ id: RentalItem['category']; label: string }> = [
  { id: 'tente', label: 'Tente étanche' },
  { id: 'sac_a_dos', label: 'Sac à dos trek' },
  { id: 'vtt', label: 'VTT Expédition' },
  { id: 'balise_gps', label: 'Balise GPS / Sat' },
  { id: 'bivouac', label: 'Kit Bivouac complet' },
];

const FULFILLMENT_FLOW: Array<{ status: FulfillmentStatus; label: string }> = [
  { status: 'CONFIRMED', label: 'Confirmée' },
  { status: 'PREPARING', label: 'En préparation' },
  { status: 'READY_PICKUP', label: 'Prête retrait' },
  { status: 'IN_DELIVERY', label: 'En livraison' },
  { status: 'COMPLETED', label: 'Remise / Clôturée' },
];

export const StoreWorkspace: React.FC<StoreWorkspaceProps> = ({
  activeTab,
  onChangeTab,
  onSwitchToEquipement,
  authUser,
  onSignInGoogle,
  storeProfile,
  settlementSettings,
  myListings,
  orders,
  onSaveStoreProfile,
  onSaveSettlementSettings,
  onCreateListing,
  onUpdateListing,
  onDeleteListing,
  onUpdateOrderFulfillment,
  onRefundOrder,
  vendorOrders = [],
  onUpdateVendorOrderStatus,
}) => {
  // Store Profile State
  const [storeName, setStoreName] = useState(
    storeProfile?.storeName ||
      (authUser?.displayName ? `Boutique ${authUser.displayName}` : 'Libreville Outdoor Shop')
  );
  const [storeType, setStoreType] = useState<StoreCategory>(
    storeProfile?.storeType || 'outdoor_shop'
  );
  const [cityZone, setCityZone] = useState(storeProfile?.cityZone || 'Libreville · Charbonnages');
  const [pickupAddress, setPickupAddress] = useState(
    storeProfile?.pickupAddress || 'Carrefour Charbonnages, Immeuble Kévazingo RDC'
  );
  const [openingHours, setOpeningHours] = useState(
    storeProfile?.openingHours || 'Lun–Sam 08h30–18h30 · Dim 09h–13h'
  );
  const [deliveryAvailable, setDeliveryAvailable] = useState(
    storeProfile?.deliveryAvailable ?? true
  );
  const [deliveryFee, setDeliveryFee] = useState(String(storeProfile?.deliveryFee ?? 3000));
  const [deliveryZones, setDeliveryZones] = useState(
    storeProfile?.deliveryZones || 'Grand Libreville, Akanda, Owendo'
  );
  const [storeDescription, setStoreDescription] = useState(
    storeProfile?.description ||
      'Magasin spécialisé en équipements de randonnée tropicale, bivouac étanche et optique nature au Gabon.'
  );
  const [logoUrl, setLogoUrl] = useState(storeProfile?.logoUrl || '');
  const [storeStatus, setStoreStatus] = useState<'ACTIVE' | 'PAUSED'>(
    storeProfile?.status || 'ACTIVE'
  );

  // Private Settlement Form State
  const [payoutOperator, setPayoutOperator] = useState<'AIRTEL' | 'MOOV' | 'GHETTOPAY' | 'BANK'>(
    settlementSettings?.payoutOperator || 'AIRTEL'
  );
  const [payoutPhone, setPayoutPhone] = useState(settlementSettings?.payoutAccountPhone || '');
  const [regNumber, setRegNumber] = useState(settlementSettings?.businessRegNumber || '');
  const [emergencyContact, setEmergencyContact] = useState(settlementSettings?.emergencyContact || '');
  const [autoAccept, setAutoAccept] = useState(settlementSettings?.autoAcceptBookings ?? true);

  // New Product Form State
  const [prodTitle, setProdTitle] = useState('');
  const [prodCategory, setProdCategory] = useState<StoreProductCategory>('randonnee');
  const [prodPrice, setProdPrice] = useState('28000');
  const [prodStock, setProdStock] = useState('12');
  const [prodDesc, setProdDesc] = useState('');

  // New Rental Form State
  const [rentTitle, setRentTitle] = useState('');
  const [rentCategory, setRentCategory] = useState<RentalItem['category']>('tente');
  const [rentPricePerDay, setRentPricePerDay] = useState('6500');
  const [rentDeposit, setRentDeposit] = useState('30000');
  const [rentQty, setRentQty] = useState('5');
  const [rentDesc, setRentDesc] = useState('');

  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReasonInput, setRefundReasonInput] = useState('Rupture de stock / Annulation magasin');
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isPublishingItem, setIsPublishingItem] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!storeProfile) return;
    setStoreName(storeProfile.storeName);
    setStoreType(storeProfile.storeType);
    setCityZone(storeProfile.cityZone);
    setPickupAddress(storeProfile.pickupAddress);
    setOpeningHours(storeProfile.openingHours);
    setDeliveryAvailable(storeProfile.deliveryAvailable);
    setDeliveryFee(String(storeProfile.deliveryFee));
    setDeliveryZones(storeProfile.deliveryZones || '');
    setStoreDescription(storeProfile.description);
    setLogoUrl(storeProfile.logoUrl || '');
    setStoreStatus(storeProfile.status);
    setLogoBroken(false);
  }, [storeProfile]);

  useEffect(() => {
    if (!settlementSettings) return;
    setPayoutOperator(settlementSettings.payoutOperator);
    setPayoutPhone(settlementSettings.payoutAccountPhone);
    setRegNumber(settlementSettings.businessRegNumber || '');
    setEmergencyContact(settlementSettings.emergencyContact || '');
    setAutoAccept(settlementSettings.autoAcceptBookings);
  }, [settlementSettings]);

  const storeProducts = useMemo(
    () => myListings.filter((l) => l.listingKind === 'product'),
    [myListings]
  );

  const storeRentals = useMemo(
    () => myListings.filter((l) => l.listingKind === 'rental'),
    [myListings]
  );

  const lowStockItems = useMemo(
    () => [...storeProducts, ...storeRentals].filter((l) => l.stockOrCapacity <= 2),
    [storeProducts, storeRentals]
  );

  const routedStoreOrders = useMemo(
    () =>
      vendorOrders.filter((vo) =>
        vo.items.some((it) => it.kind === 'product' || it.kind === 'rental')
      ),
    [vendorOrders]
  );

  const routedOrderIds = useMemo(
    () => new Set(routedStoreOrders.map((vo) => vo.orderId)),
    [routedStoreOrders]
  );

  const storeOrders = useMemo(() => {
    return orders.filter((o) =>
      o.items.some((item) => item.kind === 'product' || item.kind === 'rental')
    );
  }, [orders]);

  const nonDuplicateStoreOrders = useMemo(
    () => storeOrders.filter((o) => !routedOrderIds.has(o.id)),
    [storeOrders, routedOrderIds]
  );

  const financials = useMemo(() => {
    const activeRouted = routedStoreOrders.filter((vo) => vo.paymentStatus !== 'REFUNDED');
    const activeLocal = nonDuplicateStoreOrders.filter((o) => o.paymentStatus !== 'REFUNDED');

    const routedGross = activeRouted.reduce((s, vo) => s + vo.grossSubtotal, 0);
    const localGross = activeLocal.reduce((s, o) => s + o.itemsSubtotal + o.deliveryFee, 0);
    const grossGMV = routedGross + localGross;

    const depositsHeld =
      activeRouted.reduce((s, vo) => s + vo.depositHeld, 0) +
      activeLocal.reduce((s, o) => s + o.depositTotal, 0);

    const routedCommission = activeRouted.reduce((s, vo) => s + vo.commissionAmount, 0);
    const localCommission = Math.round(localGross * 0.1);
    const commission = routedCommission + localCommission;

    const routedNet = activeRouted.reduce((s, vo) => s + vo.netAmount, 0);
    const localNet = localGross - localCommission;
    const netStore = routedNet + localNet;

    const pendingPrepCount =
      activeRouted.filter((vo) =>
        ['PENDING_VENDOR', 'CONFIRMED', 'PREPARING'].includes(vo.fulfillmentStatus)
      ).length +
      activeLocal.filter((o) =>
        ['PENDING_VENDOR', 'CONFIRMED', 'PREPARING'].includes(o.fulfillmentStatus)
      ).length;

    return {
      grossGMV,
      depositsHeld,
      commission,
      netStore,
      pendingPrepCount,
      totalCount: activeRouted.length + nonDuplicateStoreOrders.length,
    };
  }, [routedStoreOrders, nonDuplicateStoreOrders]);

  const safeLogoUrl = logoUrl ? sanitizeImageUrl(logoUrl) : '';
  const activeStoreTypeMeta =
    STORE_CATEGORIES_META.find((c) => c.id === storeType) || STORE_CATEGORIES_META[0];

  const showNotice = (ok: boolean, msg: string) => {
    setFeedback({ ok, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveStoreForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (storeName.trim().length < 2 || pickupAddress.trim().length < 3 || storeDescription.trim().length < 5) {
      showNotice(false, 'Nom du magasin (>= 2 car.), adresse (>= 3 car.) et description (>= 5 car.) requis.');
      return;
    }

    setIsSavingStore(true);
    try {
      const id = storeProfile?.id || (authUser ? `store_${authUser.uid}` : 'store_preview_local');
      await onSaveStoreProfile({
        id,
        storeName: storeName.trim(),
        storeType,
        cityZone: cityZone.trim() || 'Libreville, Gabon',
        pickupAddress: pickupAddress.trim(),
        openingHours: openingHours.trim() || 'Lun–Sam 08h30–18h30',
        deliveryAvailable,
        deliveryFee: Math.max(0, Number(deliveryFee) || 0),
        deliveryZones: deliveryZones.trim() || undefined,
        description: storeDescription.trim(),
        logoUrl: logoUrl.trim() || undefined,
        status: storeStatus,
        createdAtLabel: storeProfile?.createdAtLabel || "Aujourd'hui",
      });

      await onSaveSettlementSettings({
        id: 'store',
        payoutOperator,
        payoutAccountPhone: payoutPhone.trim(),
        businessRegNumber: regNumber.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        autoAcceptBookings: autoAccept,
        updatedAtLabel: "Aujourd'hui",
      });

      showNotice(
        true,
        authUser
          ? 'Vitrine Magasin publiée et reliée à la Marketplace Équipement !'
          : 'Brouillon Magasin sauvegardé localement. Connectez Google pour publier en direct.'
      );
    } catch (err) {
      showNotice(false, err instanceof Error ? err.message : 'Erreur sauvegarde magasin.');
    } finally {
      setIsSavingStore(false);
    }
  };

  const handlePublishProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prodTitle.trim().length < 3 || prodDesc.trim().length < 5) {
      showNotice(false, 'Nom du produit (>= 3 car.) et description (>= 5 car.) requis.');
      return;
    }

    setIsPublishingItem(true);
    try {
      const catLabel = PRODUCT_CATEGORIES.find((c) => c.id === prodCategory)?.label || 'Équipement';
      await onCreateListing({
        listingKind: 'product',
        ownerRole: 'store',
        productCategory: prodCategory,
        storeId: storeProfile?.id,
        storeName: storeProfile?.storeName || storeName.trim(),
        deliveryAvailable,
        title: prodTitle.trim(),
        category: catLabel,
        location: `${cityZone.trim()} · ${pickupAddress.trim()}`.slice(0, 120),
        price: Math.max(0, Number(prodPrice) || 15000),
        stockOrCapacity: Math.max(0, Number(prodStock) || 1),
        description: prodDesc.trim(),
      });
      setProdTitle('');
      setProdDesc('');
      showNotice(true, 'Article ajouté au catalogue de votre magasin et visible dans Équipement !');
    } catch (err) {
      showNotice(false, err instanceof Error ? err.message : 'Erreur publication produit.');
    } finally {
      setIsPublishingItem(false);
    }
  };

  const handlePublishRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rentTitle.trim().length < 3 || rentDesc.trim().length < 5) {
      showNotice(false, 'Nom du matériel (>= 3 car.) et état/description (>= 5 car.) requis.');
      return;
    }

    setIsPublishingItem(true);
    try {
      const catLabel = RENTAL_CATEGORIES.find((c) => c.id === rentCategory)?.label || 'Location';
      await onCreateListing({
        listingKind: 'rental',
        ownerRole: 'store',
        rentalCategory: rentCategory,
        storeId: storeProfile?.id,
        storeName: storeProfile?.storeName || storeName.trim(),
        deliveryAvailable,
        title: rentTitle.trim(),
        category: catLabel,
        location: `${cityZone.trim()} · ${pickupAddress.trim()}`.slice(0, 120),
        price: Math.max(0, Number(rentPricePerDay) || 5000),
        depositAmount: Math.max(0, Number(rentDeposit) || 20000),
        stockOrCapacity: Math.max(0, Number(rentQty) || 1),
        description: rentDesc.trim(),
      });
      setRentTitle('');
      setRentDesc('');
      showNotice(true, 'Matériel locatif publié avec caution Mobile Money !');
    } catch (err) {
      showNotice(false, err instanceof Error ? err.message : 'Erreur publication location.');
    } finally {
      setIsPublishingItem(false);
    }
  };

  const handleConfirmRefund = async (ord: MarketplaceOrder) => {
    try {
      await onRefundOrder(ord, refundReasonInput.trim() || 'Remboursement initié par le magasin');
      setRefundOrderId(null);
      showNotice(true, `Remboursement traité pour ${ord.refNumber}.`);
    } catch (err) {
      showNotice(false, err instanceof Error ? err.message : 'Erreur lors du remboursement.');
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-12 space-y-5">
      {/* Store Banner */}
      <div className="bg-gradient-to-br from-amber-950 via-[#1b1409] to-[#0f0c08] text-white rounded-3xl p-4 border border-amber-500/35 shadow-xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 overflow-hidden flex items-center justify-center shrink-0 font-serif-display font-bold text-lg text-amber-300">
              {safeLogoUrl && !logoBroken ? (
                <img
                  src={safeLogoUrl}
                  alt={storeName}
                  referrerPolicy="no-referrer"
                  onError={() => setLogoBroken(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-6 h-6 text-amber-300" />
              )}
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block truncate">
                Version Magasin · {activeStoreTypeMeta.shortLabel}
              </span>
              <h2 className="font-serif-display text-base font-bold text-white truncate mt-0.5">
                {storeProfile?.storeName || storeName}
              </h2>
              <p className="text-[11px] text-amber-100/80 truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{cityZone}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSwitchToEquipement}
            className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-white flex items-center gap-1 shrink-0 transition"
          >
            <Eye className="w-3.5 h-3.5 text-amber-300" />
            <span>Boutique</span>
          </button>
        </div>

        {!authUser && (
          <div className="bg-amber-500/15 border border-amber-400/40 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-amber-100 leading-snug">
              Mode aperçu local. Connectez Google pour synchroniser votre boutique et vos stocks sur Firestore.
            </span>
            <button
              type="button"
              onClick={onSignInGoogle}
              className="min-h-[36px] px-2.5 py-1.5 bg-amber-500 text-slate-950 font-black rounded-xl text-[11px] flex items-center gap-1 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Google</span>
            </button>
          </div>
        )}
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            feedback.ok
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/60 border-red-500/40 text-red-700 dark:text-red-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* TAB 1: STORE DASHBOARD */}
      {activeTab === 'store_dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="glass-card rounded-2xl p-3.5">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Net Magasin (90%)</span>
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <strong className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-400 mt-1 block tabular-nums">
                {financials.netStore.toLocaleString('fr-FR')} F
              </strong>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                Brut : {financials.grossGMV.toLocaleString('fr-FR')} F
              </span>
            </div>

            <div className="glass-card rounded-2xl p-3.5">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Cautions Location</span>
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <strong className="font-mono text-lg font-black text-amber-700 dark:text-amber-400 mt-1 block tabular-nums">
                {financials.depositsHeld.toLocaleString('fr-FR')} F
              </strong>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                {financials.pendingPrepCount} commande(s) à préparer
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="glass-card rounded-2xl p-3 text-center">
              <span className="font-mono text-lg font-black text-slate-900 dark:text-white block tabular-nums">
                {storeProducts.length}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Produits vente</span>
            </div>
            <div className="glass-card rounded-2xl p-3 text-center">
              <span className="font-mono text-lg font-black text-slate-900 dark:text-white block tabular-nums">
                {storeRentals.length}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Unités location</span>
            </div>
            <div className="glass-card rounded-2xl p-3 text-center">
              <span className="font-mono text-lg font-black text-amber-700 dark:text-amber-400 block tabular-nums">
                {financials.commission.toLocaleString('fr-FR')} F
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Com. 10%</span>
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-500/40 rounded-2xl p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Alerte stock faible ({lowStockItems.length})</span>
              </div>
              {lowStockItems.map((it) => (
                <div key={it.id} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300">
                  <span className="truncate">{it.title}</span>
                  <strong className="font-mono text-amber-700 dark:text-amber-400 tabular-nums shrink-0">
                    {it.stockOrCapacity} restant(s)
                  </strong>
                </div>
              ))}
            </div>
          )}

          {/* Quick Store Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChangeTab('store_catalog')}
              className="min-h-[48px] p-3 rounded-2xl copper-gradient text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un produit</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTab('store_rentals')}
              className="min-h-[48px] p-3 rounded-2xl glass-card text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Tent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Ajouter en location</span>
            </button>
          </div>

          {/* Pickup & Hours Summary */}
          <div className="glass-card rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Point de retrait &amp; Livraison</span>
              </h4>
              <button
                type="button"
                onClick={() => onChangeTab('store_profile')}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
              >
                Modifier
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              <strong>Adresse :</strong> {pickupAddress}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              <strong>Horaires :</strong> {openingHours}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {deliveryAvailable
                  ? `Livraison active (${Number(deliveryFee || 0).toLocaleString('fr-FR')} F · ${deliveryZones})`
                  : 'Retrait uniquement en boutique'}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: STORE CATALOG (RETAIL PRODUCTS) */}
      {activeTab === 'store_catalog' && (
        <div className="space-y-4">
          <form
            onSubmit={handlePublishProduct}
            className="glass-card rounded-2xl p-4 space-y-3"
          >
            <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Nouvel article boutique à vendre</span>
            </h3>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Catégorie officielle Équipement
              </label>
              <select
                value={prodCategory}
                onChange={(e) => setProdCategory(e.target.value as StoreProductCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Désignation produit
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={prodTitle}
                onChange={(e) => setProdTitle(e.target.value)}
                placeholder="Ex: Chaussures Trail Vibram Équateur GTX"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Prix de vente (FCFA)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10000000}
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Stock initial
                </label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Fiche technique &amp; pointures/tailles
              </label>
              <textarea
                rows={2}
                required
                minLength={5}
                maxLength={600}
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                placeholder="Membrane imperméable, tailles disponibles, garantie magasin..."
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isPublishingItem}
              className="w-full min-h-[44px] py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isPublishingItem ? 'Ajout...' : 'Mettre en rayon (Boutique)'}</span>
            </button>
          </form>

          <div className="space-y-2.5">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Stock Boutique ({storeProducts.length})
            </h4>

            {storeProducts.length === 0 ? (
              <div className="glass-card border-dashed border-stone-300/80 dark:border-white/20 rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Aucun produit en vente dans votre rayon. Ajoutez votre premier article ci-dessus.
              </div>
            ) : (
              storeProducts.map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        {item.category}
                      </span>
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <strong className="font-mono text-sm font-black text-amber-700 dark:text-amber-400 block">
                        {item.price.toLocaleString('fr-FR')} F
                      </strong>
                      <span
                        className={`text-[10px] font-bold ${
                          item.stockOrCapacity <= 2
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-500'
                        }`}
                      >
                        Stock : {item.stockOrCapacity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-white/5">
                    <span
                      className={`text-[10px] font-bold ${
                        item.status === 'ACTIVE'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {item.status === 'ACTIVE' ? 'En vente (Équipement)' : 'En pause'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateListing({
                            ...item,
                            stockOrCapacity: Math.max(0, item.stockOrCapacity - 1),
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-white/5 font-bold"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateListing({
                            ...item,
                            stockOrCapacity: item.stockOrCapacity + 1,
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-white/5 font-bold"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateListing({
                            ...item,
                            status: item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
                          })
                        }
                        className="h-8 px-2.5 rounded-lg bg-stone-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1"
                      >
                        {item.status === 'ACTIVE' ? (
                          <>
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Activer</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteListing(item.id)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STORE RENTALS & DEPOSITS */}
      {activeTab === 'store_rentals' && (
        <div className="space-y-4">
          <form
            onSubmit={handlePublishRental}
            className="glass-card rounded-2xl p-4 space-y-3"
          >
            <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Tent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Ajouter du matériel à louer (avec caution)</span>
            </h3>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Catégorie locative
              </label>
              <select
                value={rentCategory}
                onChange={(e) => setRentCategory(e.target.value as RentalItem['category'])}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              >
                {RENTAL_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Nom de l’équipement en location
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={rentTitle}
                onChange={(e) => setRentTitle(e.target.value)}
                placeholder="Ex: Pack Bivouac 2P Étanche + Matelas + Frontale"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Tarif / jour (F)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10000000}
                  value={rentPricePerDay}
                  onChange={(e) => setRentPricePerDay(e.target.value)}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Caution (F)
                </label>
                <input
                  type="number"
                  min={0}
                  max={5000000}
                  value={rentDeposit}
                  onChange={(e) => setRentDeposit(e.target.value)}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Quantité
                </label>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={rentQty}
                  onChange={(e) => setRentQty(e.target.value)}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Inclus &amp; conditions de retour
              </label>
              <textarea
                rows={2}
                required
                minLength={5}
                maxLength={600}
                value={rentDesc}
                onChange={(e) => setRentDesc(e.target.value)}
                placeholder="Sardines, housse étanche, inspection conjointe au retrait et au retour..."
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isPublishingItem}
              className="w-full min-h-[44px] py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isPublishingItem ? 'Publication...' : 'Publier dans le Parc Location'}</span>
            </button>
          </form>

          <div className="space-y-2.5">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Parc Locatif ({storeRentals.length})
            </h4>

            {storeRentals.length === 0 ? (
              <div className="glass-card border-dashed border-stone-300/80 dark:border-white/20 rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Aucun équipement en location pour le moment.
              </div>
            ) : (
              storeRentals.map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        {item.category} · Caution {(item.depositAmount || 0).toLocaleString('fr-FR')} F
                      </span>
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <strong className="font-mono text-sm font-black text-amber-700 dark:text-amber-400 block">
                        {item.price.toLocaleString('fr-FR')} F /j
                      </strong>
                      <span className="text-[10px] text-slate-500">{item.stockOrCapacity} unité(s)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-white/5">
                    <span
                      className={`text-[10px] font-bold ${
                        item.status === 'ACTIVE'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {item.status === 'ACTIVE' ? 'Disponible à la location' : 'En maintenance / pause'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateListing({
                            ...item,
                            stockOrCapacity: Math.max(0, item.stockOrCapacity - 1),
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-white/5 font-bold"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateListing({
                            ...item,
                            stockOrCapacity: item.stockOrCapacity + 1,
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-white/5 font-bold"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateListing({
                            ...item,
                            status: item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
                          })
                        }
                        className="h-8 px-2.5 rounded-lg bg-stone-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1"
                      >
                        {item.status === 'ACTIVE' ? (
                          <>
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Activer</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteListing(item.id)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: STORE ORDERS & FULFILLMENT */}
      {activeTab === 'store_orders' && (
        <div className="space-y-3">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block">Suivi des commandes Boutique &amp; Locations</strong>
              <p className="text-[11px] opacity-85 mt-0.5 leading-snug">
                Préparez les colis, validez les retraits en boutique et libérez les cautions après inspection retour.
              </p>
            </div>
          </div>

          {routedStoreOrders.length === 0 && nonDuplicateStoreOrders.length === 0 ? (
            <div className="glass-card border-dashed border-stone-300/80 dark:border-white/20 rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Aucune commande boutique ou location reçue pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {routedStoreOrders.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Commandes Clients Entrantes ({routedStoreOrders.length})
                  </h4>
                  {routedStoreOrders.map((vo) => (
                    <div
                      key={vo.orderId}
                      className="glass-card border-amber-500/35 rounded-2xl p-3.5 space-y-2.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400 block">
                            {vo.refNumber} · {vo.buyerDisplayLabel}
                          </span>
                          <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                            {vo.items.map((it) => `${it.quantity}x ${it.title}`).join(' · ')}
                          </p>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            {vo.timestamp}
                            {vo.deliveryZoneLabel || vo.deliveryAddress
                              ? ` · Livraison : ${vo.deliveryZoneLabel || vo.deliveryAddress}`
                              : ' · Retrait magasin'}
                          </span>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <strong className="font-mono text-emerald-700 dark:text-emerald-400 block">
                            +{vo.netAmount.toLocaleString('fr-FR')} F net
                          </strong>
                          <span className="text-[10px] text-slate-500 block">
                            Com. 10% : {vo.commissionAmount.toLocaleString('fr-FR')} F
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            {vo.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {vo.depositHeld > 0 && (
                        <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/25 text-[11px] flex items-center justify-between tabular-nums">
                          <span className="text-amber-800 dark:text-amber-300 font-semibold">
                            Caution location séquestrée
                          </span>
                          <strong className="font-mono text-amber-800 dark:text-amber-300">
                            {vo.depositHeld.toLocaleString('fr-FR')} F
                          </strong>
                        </div>
                      )}

                      {vo.paymentStatus !== 'REFUNDED' && onUpdateVendorOrderStatus && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-200 dark:border-white/5">
                          {FULFILLMENT_FLOW.map((step) => {
                            const isCurrent = vo.fulfillmentStatus === step.status;
                            return (
                              <button
                                key={step.status}
                                type="button"
                                onClick={() => onUpdateVendorOrderStatus(vo.orderId, step.status)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                  isCurrent
                                    ? 'copper-gradient text-slate-950 border-amber-400 shadow'
                                    : 'bg-stone-50 dark:bg-slate-950 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {step.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {nonDuplicateStoreOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="glass-card rounded-2xl p-3.5 space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400 block">
                        {ord.refNumber} · {ord.payerLabel}
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {ord.items.map((i) => `${i.quantity}x ${i.title}`).join(' · ')}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {ord.timestamp}
                        {ord.deliveryAddress ? ` · Livraison : ${ord.deliveryAddress}` : ' · Retrait magasin'}
                      </span>
                    </div>

                    <div className="text-right shrink-0 tabular-nums">
                      <strong className="font-mono text-amber-700 dark:text-amber-400 block">
                        {ord.grandTotalCharged.toLocaleString('fr-FR')} F
                      </strong>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        {ord.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {ord.depositTotal > 0 && (
                    <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/25 text-[11px] flex items-center justify-between tabular-nums">
                      <span className="text-amber-800 dark:text-amber-300 font-semibold">
                        Caution location séquestrée
                      </span>
                      <strong className="font-mono text-amber-800 dark:text-amber-300">
                        {ord.depositTotal.toLocaleString('fr-FR')} F
                      </strong>
                    </div>
                  )}

                  {ord.paymentStatus !== 'REFUNDED' ? (
                    <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-white/5">
                      <div className="flex flex-wrap gap-1.5">
                        {FULFILLMENT_FLOW.map((step) => {
                          const isCurrent = ord.fulfillmentStatus === step.status;
                          return (
                            <button
                              key={step.status}
                              type="button"
                              onClick={() => onUpdateOrderFulfillment(ord, step.status)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                isCurrent
                                  ? 'copper-gradient text-slate-950 border-amber-400 shadow'
                                  : 'bg-stone-50 dark:bg-slate-950 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {step.label}
                            </button>
                          );
                        })}
                      </div>

                      {refundOrderId === ord.id ? (
                        <div className="flex gap-1.5 items-center bg-red-50 dark:bg-red-950/30 p-2 rounded-xl border border-red-500/30">
                          <input
                            type="text"
                            maxLength={160}
                            value={refundReasonInput}
                            onChange={(e) => setRefundReasonInput(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-[11px]"
                            placeholder="Motif du remboursement..."
                          />
                          <button
                            type="button"
                            onClick={() => handleConfirmRefund(ord)}
                            className="px-2.5 py-1.5 bg-red-600 text-white font-bold rounded-lg text-[10px] shrink-0"
                          >
                            Confirmer
                          </button>
                          <button
                            type="button"
                            onClick={() => setRefundOrderId(null)}
                            className="px-2 py-1.5 text-[10px] text-slate-600 dark:text-slate-300"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRefundOrderId(ord.id)}
                          className="text-[11px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Rembourser / libérer caution</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold pt-1.5 border-t border-stone-200 dark:border-white/5">
                      Remboursée : {ord.refundReason || 'Traitée'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: STORE PROFILE & SETTINGS */}
      {activeTab === 'store_profile' && (
        <form onSubmit={handleSaveStoreForm} className="space-y-4">
          <div className="glass-card rounded-2xl p-4 space-y-3.5">
            <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Identité &amp; Vitrine du Magasin</span>
            </h3>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                Type de magasin
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {STORE_CATEGORIES_META.map((cat) => {
                  const selected = storeType === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setStoreType(cat.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selected
                          ? 'copper-gradient text-slate-950 border-amber-400 shadow'
                          : 'glass-surface text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <strong className="text-xs block">{cat.shortLabel}</strong>
                      <span className={`text-[10px] block mt-0.5 ${selected ? 'text-slate-900/80' : 'text-slate-500'}`}>
                        {cat.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Nom commercial du magasin
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Ville &amp; Quartier
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={cityZone}
                  onChange={(e) => setCityZone(e.target.value)}
                  placeholder="Libreville · Charbonnages"
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Adresse point de retrait client
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={160}
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Horaires d’ouverture
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Visibilité vitrine
                </label>
                <select
                  value={storeStatus}
                  onChange={(e) => setStoreStatus(e.target.value === 'PAUSED' ? 'PAUSED' : 'ACTIVE')}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                >
                  <option value="ACTIVE">Ouvert dans Équipement</option>
                  <option value="PAUSED">Fermé / En pause</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-white/10 space-y-2.5">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <span>Proposer la livraison coursier locale</span>
                <input
                  type="checkbox"
                  checked={deliveryAvailable}
                  onChange={(e) => setDeliveryAvailable(e.target.checked)}
                  className="w-4 h-4 accent-amber-600"
                />
              </label>

              {deliveryAvailable && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Frais livraison (FCFA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 text-xs font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Zones desservies
                    </label>
                    <input
                      type="text"
                      maxLength={160}
                      value={deliveryZones}
                      onChange={(e) => setDeliveryZones(e.target.value)}
                      placeholder="Libreville, Akanda, Owendo"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Présentation du magasin &amp; services
              </label>
              <textarea
                rows={3}
                required
                minLength={5}
                maxLength={600}
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                URL Logo / Enseigne (HTTPS optionnel)
              </label>
              <input
                type="url"
                maxLength={500}
                value={logoUrl}
                onChange={(e) => {
                  setLogoUrl(e.target.value);
                  setLogoBroken(false);
                }}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Private Store Settlement Settings */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Compte de reversement magasin (90%)</span>
              </h3>
              <span className="text-[10px] font-semibold text-slate-500">Privé · Non public</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(['AIRTEL', 'MOOV', 'GHETTOPAY', 'BANK'] as const).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setPayoutOperator(op)}
                  className={`min-h-[38px] rounded-xl text-[11px] font-bold border transition ${
                    payoutOperator === op
                      ? 'copper-gradient text-slate-950 border-amber-400 shadow'
                      : 'glass-surface text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {op === 'AIRTEL'
                    ? 'Airtel Money'
                    : op === 'MOOV'
                    ? 'Moov Money'
                    : op === 'GHETTOPAY'
                    ? 'GhettoPay'
                    : 'Virement'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  N° Marchand / Mobile Money
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value)}
                  placeholder="+241 74 00 00 00"
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  RCCM / NIF Magasin
                </label>
                <input
                  type="text"
                  maxLength={64}
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="GA-LBV-01-..."
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Téléphone SAV / Gérant interne
              </label>
              <input
                type="text"
                maxLength={80}
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Contact interne SAV"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs"
              />
            </div>

            <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/10 text-xs cursor-pointer">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Validation automatique des retraits quand le stock est suffisant
              </span>
              <input
                type="checkbox"
                checked={autoAccept}
                onChange={(e) => setAutoAccept(e.target.checked)}
                className="w-4 h-4 accent-amber-600"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSavingStore}
            className="w-full min-h-[46px] py-3 copper-gradient text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSavingStore ? 'Enregistrement...' : 'Enregistrer ma Version Magasin'}
            </span>
          </button>
        </form>
      )}
    </div>
  );
};
