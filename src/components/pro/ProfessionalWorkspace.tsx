import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Binoculars,
  CalendarCheck,
  CheckCircle2,
  Compass,
  Eye,
  Feather,
  Leaf,
  LogIn,
  MapPin,
  PauseCircle,
  PlayCircle,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Booking,
  BusinessSettlementSettings,
  FulfillmentStatus,
  MarketplaceOrder,
  ProfessionalProfile,
  ProfessionalSpecialty,
  ProTabType,
  VendorListing,
  VendorListingKind,
  VendorOrderFulfillment,
} from '../../types';
import {
  GABON_LANGUAGES_PRESETS,
  GABON_PARKS_PRESETS,
  getSpecialtyLabel,
  PRO_SPECIALTIES,
} from '../../data/partnerSpecialties';
import { sanitizeImageUrl } from '../../utils/urlSecurity';
import { formatCoordsPair, resolveParkCoords } from '../../utils/activityLocation';

interface ProfessionalWorkspaceProps {
  activeTab: ProTabType;
  onChangeTab: (tab: ProTabType) => void;
  onSwitchToExplorer: () => void;
  authUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
  } | null;
  onSignInGoogle: () => void;
  proProfile: ProfessionalProfile | null;
  settlementSettings: BusinessSettlementSettings | null;
  myListings: VendorListing[];
  orders: MarketplaceOrder[];
  bookings: Booking[];
  onSaveProProfile: (profile: Omit<ProfessionalProfile, 'ownerUserId' | 'createdAtMs'>) => Promise<void>;
  onSaveSettlementSettings: (settings: Omit<BusinessSettlementSettings, 'userId'>) => Promise<void>;
  onCreateListing: (payload: {
    listingKind: VendorListingKind;
    ownerRole: 'pro';
    specialtyTag?: string;
    title: string;
    category: string;
    location: string;
    locationEnabled?: boolean;
    lat?: number;
    lng?: number;
    price: number;
    stockOrCapacity: number;
    description: string;
  }) => Promise<void>;
  onUpdateListing: (listing: VendorListing) => Promise<void>;
  onDeleteListing: (listingId: string) => Promise<void>;
  vendorOrders?: VendorOrderFulfillment[];
  onUpdateVendorOrderStatus?: (orderId: string, nextStatus: FulfillmentStatus) => Promise<void>;
}

const AVAILABILITY_OPTIONS: Array<{
  id: ProfessionalProfile['availability'];
  label: string;
  desc: string;
}> = [
  { id: 'DISPONIBLE', label: 'Disponible', desc: 'Réservation immédiate ouverte' },
  { id: 'SUR_DEMANDE_24H', label: 'Sur demande 24h', desc: 'Validation créneau sous 24h' },
  { id: 'COMPLET', label: 'Complet / Terrain', desc: 'Indisponible temporairement' },
];

export const ProfessionalWorkspace: React.FC<ProfessionalWorkspaceProps> = ({
  activeTab,
  onChangeTab,
  onSwitchToExplorer,
  authUser,
  onSignInGoogle,
  proProfile,
  settlementSettings,
  myListings,
  orders,
  bookings,
  onSaveProProfile,
  onSaveSettlementSettings,
  onCreateListing,
  onUpdateListing,
  onDeleteListing,
  vendorOrders = [],
  onUpdateVendorOrderStatus,
}) => {
  // Profile Form State
  const [displayName, setDisplayName] = useState(
    proProfile?.displayName || authUser?.displayName || 'Guide Naturaliste Gabon'
  );
  const [specialty, setSpecialty] = useState<ProfessionalSpecialty>(
    proProfile?.specialty || 'guide_anpn'
  );
  const [customSpecialty, setCustomSpecialty] = useState(proProfile?.customSpecialty || '');
  const [title, setTitle] = useState(
    proProfile?.title || PRO_SPECIALTIES[0].defaultTitle
  );
  const [anpnLicense, setAnpnLicense] = useState(proProfile?.anpnLicense || '');
  const [certificationsText, setCertificationsText] = useState(
    (proProfile?.certifications || ['Secourisme Forêt PSC1', 'Charte Écoguide ANPN']).join(', ')
  );
  const [selectedParks, setSelectedParks] = useState<string[]>(
    proProfile?.parks || ['Parc National de la Mondah', 'Cap Estérias']
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    proProfile?.languages || ['Français', 'Anglais']
  );
  const [expertiseText, setExpertiseText] = useState(
    (proProfile?.expertiseTags || PRO_SPECIALTIES[0].defaultTags).join(', ')
  );
  const [dayRate, setDayRate] = useState(String(proProfile?.dayRate ?? 30000));
  const [availability, setAvailability] = useState<ProfessionalProfile['availability']>(
    proProfile?.availability || 'DISPONIBLE'
  );
  const [availabilityNote, setAvailabilityNote] = useState(
    proProfile?.availabilityNote || 'Disponible ce week-end pour sorties privées et repérages'
  );
  const [bio, setBio] = useState(
    proProfile?.bio ||
      'Accompagnateur de terrain spécialisé dans la découverte respectueuse des parcs nationaux gabonais et le suivi naturaliste.'
  );
  const [photoUrl, setPhotoUrl] = useState(proProfile?.photoUrl || authUser?.photoURL || '');
  const [profileStatus, setProfileStatus] = useState<'ACTIVE' | 'PAUSED'>(
    proProfile?.status || 'ACTIVE'
  );

  // Private Settlement Form State
  const [payoutOperator, setPayoutOperator] = useState<'AIRTEL' | 'MOOV' | 'GHETTOPAY' | 'BANK'>(
    settlementSettings?.payoutOperator || 'AIRTEL'
  );
  const [payoutPhone, setPayoutPhone] = useState(settlementSettings?.payoutAccountPhone || '');
  const [regNumber, setRegNumber] = useState(settlementSettings?.businessRegNumber || '');
  const [emergencyContact, setEmergencyContact] = useState(settlementSettings?.emergencyContact || '');
  const [autoAccept, setAutoAccept] = useState(settlementSettings?.autoAcceptBookings ?? true);

  // New Guided Expedition Offer Form State
  const [offerTitle, setOfferTitle] = useState('');
  const [offerSpecialtyTag, setOfferSpecialtyTag] = useState('Ornithologie');
  const [offerPark, setOfferPark] = useState(GABON_PARKS_PRESETS[0]);
  const [offerLocationEnabled, setOfferLocationEnabled] = useState(true);
  const [offerLat, setOfferLat] = useState(() => String(resolveParkCoords(GABON_PARKS_PRESETS[0])[0]));
  const [offerLng, setOfferLng] = useState(() => String(resolveParkCoords(GABON_PARKS_PRESETS[0])[1]));
  const [isLocatingOffer, setIsLocatingOffer] = useState(false);
  const [offerPrice, setOfferPrice] = useState('35000');
  const [offerCapacity, setOfferCapacity] = useState('6');
  const [offerDescription, setOfferDescription] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingOffer, setIsSavingOffer] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);

  // Sync incoming Firestore profile cleanly when loaded/updated
  useEffect(() => {
    if (!proProfile) return;
    setDisplayName(proProfile.displayName);
    setSpecialty(proProfile.specialty);
    setCustomSpecialty(proProfile.customSpecialty || '');
    setTitle(proProfile.title);
    setAnpnLicense(proProfile.anpnLicense || '');
    setCertificationsText(proProfile.certifications.join(', '));
    setSelectedParks(proProfile.parks);
    setSelectedLanguages(proProfile.languages);
    setExpertiseText(proProfile.expertiseTags.join(', '));
    setDayRate(String(proProfile.dayRate));
    setAvailability(proProfile.availability);
    setAvailabilityNote(proProfile.availabilityNote || '');
    setBio(proProfile.bio);
    setPhotoUrl(proProfile.photoUrl || '');
    setProfileStatus(proProfile.status);
    setAvatarBroken(false);
  }, [proProfile]);

  useEffect(() => {
    if (!settlementSettings) return;
    setPayoutOperator(settlementSettings.payoutOperator);
    setPayoutPhone(settlementSettings.payoutAccountPhone);
    setRegNumber(settlementSettings.businessRegNumber || '');
    setEmergencyContact(settlementSettings.emergencyContact || '');
    setAutoAccept(settlementSettings.autoAcceptBookings);
  }, [settlementSettings]);

  const myActivityListings = useMemo(
    () => myListings.filter((l) => l.listingKind === 'activity'),
    [myListings]
  );

  const routedProOrders = useMemo(
    () => vendorOrders.filter((vo) => vo.items.some((it) => it.kind === 'activity')),
    [vendorOrders]
  );

  const routedProOrderIds = useMemo(
    () => new Set(routedProOrders.map((vo) => vo.orderId)),
    [routedProOrders]
  );

  const proMissionsFromOrders = useMemo(() => {
    const ownedIds = new Set(myActivityListings.map((l) => l.id));
    return orders.filter(
      (o) =>
        !routedProOrderIds.has(o.id) &&
        o.items.some((item) => item.kind === 'activity' && (ownedIds.has(item.refId) || myActivityListings.length === 0))
    );
  }, [orders, myActivityListings, routedProOrderIds]);

  const proBookings = useMemo(() => {
    const ownedIds = new Set(myActivityListings.map((l) => l.id));
    return bookings.filter(
      (b) =>
        (b.eventId && ownedIds.has(b.eventId)) ||
        (proProfile && b.eventTitle.toLowerCase().includes(proProfile.displayName.toLowerCase())) ||
        b.guideIncluded
    );
  }, [bookings, myActivityListings, proProfile]);

  const financials = useMemo(() => {
    const validRouted = routedProOrders.filter((vo) => vo.paymentStatus !== 'REFUNDED');
    const validLocalOrders = proMissionsFromOrders.filter((o) => o.paymentStatus !== 'REFUNDED');
    const routedGross = validRouted.reduce((s, vo) => s + vo.grossSubtotal, 0);
    const localGrossOrders = validLocalOrders.reduce((s, o) => s + o.itemsSubtotal, 0);
    const bookingsSum = proBookings.reduce((s, b) => s + (b.guideIncluded ? 2500 : 0), 0);
    const gross = routedGross + localGrossOrders + bookingsSum;

    const routedCommission = validRouted.reduce((s, vo) => s + vo.commissionAmount, 0);
    const localCommission = Math.round((localGrossOrders + bookingsSum) * 0.1);
    const commission = routedCommission + localCommission;

    const routedNet = validRouted.reduce((s, vo) => s + vo.netAmount, 0);
    const localNet = localGrossOrders + bookingsSum - localCommission;
    const net = routedNet + localNet;

    return {
      gross,
      commission,
      net,
      activeOffers: myActivityListings.filter((l) => l.status === 'ACTIVE').length,
      missionsCount: validRouted.length + validLocalOrders.length + proBookings.length,
    };
  }, [routedProOrders, proMissionsFromOrders, proBookings, myActivityListings]);

  const activeSpecialtyLabel = getSpecialtyLabel(specialty, customSpecialty);
  const safeAvatarUrl = photoUrl ? sanitizeImageUrl(photoUrl) : '';

  const showNotice = (ok: boolean, msg: string) => {
    setFeedback({ ok, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSelectSpecialtyPreset = (nextSpec: ProfessionalSpecialty) => {
    setSpecialty(nextSpec);
    const preset = PRO_SPECIALTIES.find((p) => p.id === nextSpec);
    if (preset) {
      if (!proProfile || title === PRO_SPECIALTIES.find((p) => p.id === specialty)?.defaultTitle) {
        setTitle(preset.defaultTitle);
      }
      if (!proProfile) {
        setExpertiseText(preset.defaultTags.join(', '));
      }
      setOfferSpecialtyTag(preset.shortLabel);
    }
  };

  const togglePark = (park: string) => {
    setSelectedParks((prev) =>
      prev.includes(park) ? prev.filter((p) => p !== park) : prev.length < 10 ? [...prev, park] : prev
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : prev.length < 8 ? [...prev, lang] : prev
    );
  };

  const handleQuickAvailabilityChange = async (nextAvail: ProfessionalProfile['availability']) => {
    setAvailability(nextAvail);
    if (!proProfile) return;
    try {
      await onSaveProProfile({
        ...proProfile,
        availability: nextAvail,
      });
      showNotice(true, `Disponibilité mise à jour : ${nextAvail === 'DISPONIBLE' ? 'Disponible' : nextAvail === 'SUR_DEMANDE_24H' ? 'Sur demande 24h' : 'Complet'}`);
    } catch (err) {
      showNotice(false, err instanceof Error ? err.message : 'Erreur mise à jour statut.');
    }
  };

  const handleSaveProfileForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim().length < 2 || bio.trim().length < 10) {
      showNotice(false, 'Indiquez un nom (>= 2 car.) et une bio terrain (>= 10 car.).');
      return;
    }
    if (specialty === 'autre' && !customSpecialty.trim()) {
      showNotice(false, 'Précisez votre spécialité personnalisée.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const profileId = proProfile?.id || (authUser ? `pro_${authUser.uid}` : 'pro_preview_local');
      await onSaveProProfile({
        id: profileId,
        displayName: displayName.trim(),
        specialty,
        customSpecialty: specialty === 'autre' ? customSpecialty.trim() : undefined,
        title: title.trim() || activeSpecialtyLabel,
        anpnLicense: anpnLicense.trim() || undefined,
        certifications: certificationsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 8),
        parks: selectedParks.length > 0 ? selectedParks : ['Parc National de la Mondah'],
        languages: selectedLanguages.length > 0 ? selectedLanguages : ['Français'],
        expertiseTags: expertiseText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 10),
        dayRate: Math.max(0, Number(dayRate) || 25000),
        availability,
        availabilityNote: availabilityNote.trim() || undefined,
        bio: bio.trim(),
        photoUrl: photoUrl.trim() || undefined,
        status: profileStatus,
        createdAtLabel: proProfile?.createdAtLabel || "Aujourd'hui",
      });

      await onSaveSettlementSettings({
        id: 'professional',
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
          ? 'Fiche Pro publiée et synchronisée dans l’annuaire Explorateur.'
          : 'Brouillon Pro enregistré localement. Connectez Google pour publier en direct.'
      );
    } catch (err) {
      showNotice(false, err instanceof Error ? err.message : 'Échec de l’enregistrement.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSelectOfferPark = (nextPark: string) => {
    setOfferPark(nextPark);
    const [pLat, pLng] = resolveParkCoords(nextPark);
    setOfferLat(String(pLat));
    setOfferLng(String(pLng));
  };

  const handleUseCurrentGpsForOffer = () => {
    if (!navigator.geolocation) {
      showNotice(false, 'Géolocalisation indisponible sur cet appareil.');
      return;
    }
    setIsLocatingOffer(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingOffer(false);
        setOfferLocationEnabled(true);
        setOfferLat(pos.coords.latitude.toFixed(5));
        setOfferLng(pos.coords.longitude.toFixed(5));
        showNotice(true, 'Coordonnées GPS actuelles capturées pour cette sortie.');
      },
      () => {
        setIsLocatingOffer(false);
        showNotice(false, 'Accès GPS refusé ou indisponible. Coordonnées du parc conservées.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handlePublishOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offerTitle.trim().length < 3 || offerDescription.trim().length < 5) {
      showNotice(false, 'Titre (>= 3 car.) et description (>= 5 car.) requis.');
      return;
    }
    const parsedLat = Number(offerLat);
    const parsedLng = Number(offerLng);
    const [fallbackLat, fallbackLng] = resolveParkCoords(offerPark);
    const validLat =
      Number.isFinite(parsedLat) && parsedLat >= -90 && parsedLat <= 90 ? parsedLat : fallbackLat;
    const validLng =
      Number.isFinite(parsedLng) && parsedLng >= -180 && parsedLng <= 180 ? parsedLng : fallbackLng;

    setIsSavingOffer(true);
    try {
      await onCreateListing({
        listingKind: 'activity',
        ownerRole: 'pro',
        specialtyTag: offerSpecialtyTag || activeSpecialtyLabel,
        title: offerTitle.trim(),
        category: offerSpecialtyTag || activeSpecialtyLabel,
        location: offerPark,
        locationEnabled: offerLocationEnabled,
        lat: validLat,
        lng: validLng,
        price: Math.max(0, Number(offerPrice) || 25000),
        stockOrCapacity: Math.max(1, Number(offerCapacity) || 6),
        description: offerDescription.trim(),
      });
      setOfferTitle('');
      setOfferDescription('');
      showNotice(true, 'Sortie guidée publiée dans le calendrier Aventures !');
    } catch (err) {
      showNotice(false, err instanceof Error ? err.message : 'Erreur lors de la publication.');
    } finally {
      setIsSavingOffer(false);
    }
  };

  const renderSpecialtyIcon = (spec: ProfessionalSpecialty) => {
    switch (spec) {
      case 'ornithologue':
        return <Feather className="w-4 h-4" />;
      case 'botaniste':
        return <Leaf className="w-4 h-4" />;
      case 'pisteur':
        return <Binoculars className="w-4 h-4" />;
      case 'photographe':
        return <Eye className="w-4 h-4" />;
      case 'guide_anpn':
      case 'ecoguide':
        return <Compass className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-12 space-y-5">
      {/* Top Identity Strip */}
      <div className="bg-gradient-to-br from-emerald-950 via-[#10261c] to-[#0a130e] text-white rounded-3xl p-4 border border-emerald-500/35 shadow-xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 overflow-hidden flex items-center justify-center shrink-0 font-serif-display font-bold text-lg text-emerald-300">
              {safeAvatarUrl && !avatarBroken ? (
                <img
                  src={safeAvatarUrl}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarBroken(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{displayName.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                {renderSpecialtyIcon(specialty)}
                <span className="truncate">Version Pro · {activeSpecialtyLabel}</span>
              </div>
              <h2 className="font-serif-display text-base font-bold text-white truncate mt-0.5">
                {proProfile?.displayName || displayName}
              </h2>
              <p className="text-[11px] text-emerald-100/80 truncate">
                {anpnLicense ? `${anpnLicense} · ` : ''}
                {Number(dayRate || 0).toLocaleString('fr-FR')} F / jour
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSwitchToExplorer}
            className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-white flex items-center gap-1 shrink-0 transition"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-300" />
            <span>Annuaire</span>
          </button>
        </div>

        {/* Cloud Auth Callout if Guest */}
        {!authUser && (
          <div className="bg-amber-500/15 border border-amber-400/40 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-amber-100 leading-snug">
              Mode aperçu local. Connectez Google pour publier votre fiche Pro sur Firestore.
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

      {/* TAB 1: PRO DASHBOARD */}
      {activeTab === 'pro_dashboard' && (
        <div className="space-y-4">
          {/* 1-tap Availability Switcher */}
          <div className="glass-card rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Statut de disponibilité terrain
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                {availability === 'DISPONIBLE'
                  ? 'Ouvert aux réservations'
                  : availability === 'SUR_DEMANDE_24H'
                  ? 'Validation 24h'
                  : 'Agenda complet'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {AVAILABILITY_OPTIONS.map((opt) => {
                const active = availability === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleQuickAvailabilityChange(opt.id)}
                    className={`min-h-[42px] px-2 py-2 rounded-xl text-[11px] font-bold border transition text-center ${
                      active
                        ? opt.id === 'DISPONIBLE'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                          : opt.id === 'SUR_DEMANDE_24H'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                          : 'bg-slate-800 text-white border-slate-600 shadow'
                        : 'glass-surface text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pro Financial & Activity KPI Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="glass-card rounded-2xl p-3.5">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Revenus Net Pro (90%)</span>
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <strong className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-400 mt-1 block tabular-nums">
                {financials.net.toLocaleString('fr-FR')} F
              </strong>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                Commission 10% : {financials.commission.toLocaleString('fr-FR')} F
              </span>
            </div>

            <div className="glass-card rounded-2xl p-3.5">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Missions &amp; Sorties</span>
                <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <strong className="font-mono text-lg font-black text-slate-900 dark:text-white mt-1 block tabular-nums">
                {financials.missionsCount} missions
              </strong>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                {financials.activeOffers} sortie(s) active(s) publiée(s)
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChangeTab('pro_offers')}
              className="min-h-[48px] p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Publier une sortie</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTab('pro_profile')}
              className="min-h-[48px] p-3.5 rounded-2xl glass-card text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Configurer profil Pro</span>
            </button>
          </div>

          {/* Covered Parks & Languages Summary */}
          <div className="glass-card rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Couverture terrain &amp; spécialités</span>
              </h4>
              {!proProfile && (
                <button
                  type="button"
                  onClick={() => onChangeTab('pro_profile')}
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Compléter
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Parcs :</strong> {selectedParks.join(' · ') || 'À définir'}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              <strong>Langues :</strong> {selectedLanguages.join(', ') || 'Français'}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Votre fiche professionnelle est directement réservable par les visiteurs dans l’onglet{' '}
              <strong>Explorer → Experts &amp; Guides ANPN</strong>.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: PRO OFFERS (GUIDED EXPEDITIONS) */}
      {activeTab === 'pro_offers' && (
        <div className="space-y-4">
          <form
            onSubmit={handlePublishOffer}
            className="glass-card rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Publier une sortie guidée ou atelier terrain</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Discipline / Thème
                </label>
                <select
                  value={offerSpecialtyTag}
                  onChange={(e) => setOfferSpecialtyTag(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs text-slate-900 dark:text-white"
                >
                  <option value="Guide ANPN">Guidage Parc ANPN</option>
                  <option value="Ornithologie">Affût Ornithologique</option>
                  <option value="Botanique">Sortie Botanique &amp; Flore</option>
                  <option value="Pistage Faune">Pistage Éléphants / Gorilles</option>
                  <option value="Photo Animalière">Expé Photo &amp; Macro</option>
                  <option value="Bivouac Écoguide">Bivouac Éducatif</option>
                  {specialty === 'autre' && customSpecialty.trim() && (
                    <option value={customSpecialty.trim()}>{customSpecialty.trim()}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Parc / Zone
                </label>
                <select
                  value={offerPark}
                  onChange={(e) => handleSelectOfferPark(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs text-slate-900 dark:text-white"
                >
                  {GABON_PARKS_PRESETS.map((park) => (
                    <option key={park} value={park}>
                      {park}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* GPS Localization Toggle & Coordinates */}
            <div className="p-3 rounded-2xl glass-surface space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Activer la localisation GPS de l'activité</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Affiche le point de rassemblement sur la carte interactive et calcule la distance.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={offerLocationEnabled}
                  onClick={() => setOfferLocationEnabled((v) => !v)}
                  className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-bold border transition shrink-0 ${
                    offerLocationEnabled
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'glass-surface text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {offerLocationEnabled ? 'Activée' : 'Désactivée'}
                </button>
              </div>

              {offerLocationEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      min={-90}
                      max={90}
                      value={offerLat}
                      onChange={(e) => setOfferLat(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl glass-surface text-xs font-mono tabular-nums text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      min={-180}
                      max={180}
                      value={offerLng}
                      onChange={(e) => setOfferLng(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl glass-surface text-xs font-mono tabular-nums text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={isLocatingOffer}
                      onClick={handleUseCurrentGpsForOffer}
                      className="w-full min-h-[36px] px-2.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1 transition disabled:opacity-50"
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{isLocatingOffer ? 'GPS...' : 'Ma position GPS'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Titre de la sortie guidée
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={offerTitle}
                onChange={(e) => setOfferTitle(e.target.value)}
                placeholder="Ex: Observation Picathartes & Calaos à l'aube (Mondah)"
                className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Tarif / participant (FCFA)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10000000}
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs text-slate-900 dark:text-white font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Places max / groupe
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={offerCapacity}
                  onChange={(e) => setOfferCapacity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs text-slate-900 dark:text-white font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Programme, niveau &amp; matériel inclus
              </label>
              <textarea
                rows={3}
                required
                minLength={5}
                maxLength={600}
                value={offerDescription}
                onChange={(e) => setOfferDescription(e.target.value)}
                placeholder="Itinéraire, heure de rendez-vous, espèces recherchées, jumelles ou loupes fournies..."
                className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs text-slate-900 dark:text-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingOffer}
              className="w-full min-h-[44px] py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow disabled:opacity-50"
            >
              <MapPin className="w-4 h-4" />
              <span>{isSavingOffer ? 'Publication...' : 'Publier cette sortie dans Aventures'}</span>
            </button>
          </form>

          {/* List of Pro Offerings */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Mes sorties publiées ({myActivityListings.length})
            </h4>

            {myActivityListings.length === 0 ? (
              <div className="glass-card border-dashed border-stone-300/80 dark:border-white/20 rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Aucune sortie spécialisée publiée pour le moment. Utilisez le formulaire ci-dessus pour ouvrir vos créneaux.
              </div>
            ) : (
              myActivityListings.map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        {item.specialtyTag || item.category} · {item.location}
                      </span>
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <strong className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-400 block">
                        {item.price.toLocaleString('fr-FR')} F
                      </strong>
                      <span className="text-[10px] text-slate-500">{item.stockOrCapacity} places</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-white/5">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span
                        className={`text-[10px] font-bold ${
                          item.status === 'ACTIVE'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.status === 'ACTIVE' ? 'En ligne (Aventures)' : 'En pause'}
                      </span>
                      <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        · {item.locationEnabled === false
                          ? 'Localisation désactivée'
                          : `GPS : ${formatCoordsPair([
                              typeof item.lat === 'number' ? item.lat : resolveParkCoords(item.location)[0],
                              typeof item.lng === 'number' ? item.lng : resolveParkCoords(item.location)[1],
                            ])}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const [defLat, defLng] = resolveParkCoords(item.location);
                          const nextEnabled = item.locationEnabled === false;
                          onUpdateListing({
                            ...item,
                            locationEnabled: nextEnabled,
                            lat: typeof item.lat === 'number' ? item.lat : defLat,
                            lng: typeof item.lng === 'number' ? item.lng : defLng,
                          });
                        }}
                        className={`h-8 px-2.5 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition ${
                          item.locationEnabled !== false
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                        }`}
                        title="Activer ou désactiver la localisation GPS de cette activité"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>{item.locationEnabled !== false ? 'GPS Actif' : 'Activer GPS'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateListing({
                            ...item,
                            stockOrCapacity: Math.max(1, item.stockOrCapacity - 1),
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-white/5 font-bold"
                        title="Réduire capacité"
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
                        title="Augmenter capacité"
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
                        title="Supprimer"
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

      {/* TAB 3: PRO BOOKINGS & MISSIONS */}
      {activeTab === 'pro_bookings' && (
        <div className="space-y-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block">Manifeste &amp; Missions à encadrer</strong>
              <p className="text-[11px] opacity-85 mt-0.5 leading-snug">
                Suivez les expéditions avec option guide ou vos sorties privées confirmées via MANGOREMA Mobile Money.
              </p>
            </div>
          </div>

          {proBookings.length === 0 && proMissionsFromOrders.length === 0 && routedProOrders.length === 0 ? (
            <div className="glass-card border-dashed border-stone-300/80 dark:border-white/20 rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Aucune mission client planifiée pour l'instant.
            </div>
          ) : (
            <div className="space-y-2.5">
              {routedProOrders.map((vo) => (
                <div
                  key={vo.orderId}
                  className="glass-card border-emerald-500/35 rounded-2xl p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        {vo.refNumber} · {vo.buyerDisplayLabel}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                        {vo.items.map((it) => `${it.quantity}x ${it.title}`).join(' · ')}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {vo.timestamp}
                        {vo.deliveryZoneLabel ? ` · ${vo.deliveryZoneLabel}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <strong className="font-mono text-emerald-700 dark:text-emerald-400 block">
                        +{vo.netAmount.toLocaleString('fr-FR')} F net
                      </strong>
                      <span className="text-[10px] text-slate-500 block">
                        Com. 10% : {vo.commissionAmount.toLocaleString('fr-FR')} F
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        {vo.fulfillmentStatus}
                      </span>
                    </div>
                  </div>

                  {vo.paymentStatus !== 'REFUNDED' && onUpdateVendorOrderStatus && (
                    <div className="pt-2 border-t border-stone-200 dark:border-white/5 flex flex-wrap gap-1.5">
                      {(
                        [
                          { status: 'CONFIRMED' as FulfillmentStatus, label: 'Confirmer mission' },
                          { status: 'COMPLETED' as FulfillmentStatus, label: 'Terminer sortie' },
                        ]
                      ).map((btn) => {
                        const isCurrent = vo.fulfillmentStatus === btn.status;
                        return (
                          <button
                            key={btn.status}
                            type="button"
                            onClick={() => onUpdateVendorOrderStatus(vo.orderId, btn.status)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                              isCurrent
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                                : 'bg-stone-50 dark:bg-slate-950 border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {proBookings.map((bk) => (
                <div
                  key={bk.id}
                  className="glass-card rounded-2xl p-3.5 space-y-1.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        {bk.refNumber}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {bk.eventTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {bk.eventDate} · {bk.location}
                      </p>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <strong className="font-mono text-amber-700 dark:text-amber-400 block">
                        {bk.totalAmount.toLocaleString('fr-FR')} F
                      </strong>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        {bk.status === 'USED' ? 'Terminée' : 'Confirmée'}
                      </span>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-stone-200 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        {bk.guideIncluded ? 'Encadrement guide inclus' : 'Réservation activité'}
                        {bk.shuttleIncluded ? ' · Navette 4x4' : ''}
                      </span>
                    </span>
                    <span className="font-mono text-[10px]">{bk.paymentMethod}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRO PROFILE & ANPN SETTINGS */}
      {activeTab === 'pro_profile' && (
        <form onSubmit={handleSaveProfileForm} className="space-y-4">
          <div className="glass-card rounded-2xl p-4 space-y-3.5">
            <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Spécialité &amp; Identité Professionnelle</span>
            </h3>

            {/* Specialty Selector Grid */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                Profession / Spécialité principale
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRO_SPECIALTIES.map((spec) => {
                  const selected = specialty === spec.id;
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => handleSelectSpecialtyPreset(spec.id)}
                      className={`min-h-[40px] px-2.5 py-2 rounded-xl border text-left text-[11px] font-bold flex items-center gap-2 transition ${
                        selected
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                          : 'glass-surface text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {renderSpecialtyIcon(spec.id)}
                      <span className="truncate">{spec.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {specialty === 'autre' && (
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Précisez votre métier / spécialité
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={customSpecialty}
                  onChange={(e) => setCustomSpecialty(e.target.value)}
                  placeholder="Ex: Herpétologue, Moniteur Kayak Mangrove, Ethnobotaniste..."
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Nom complet / Enseigne Pro
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Tarif journalier (FCFA / jour)
                </label>
                <input
                  type="number"
                  min={0}
                  max={5000000}
                  value={dayRate}
                  onChange={(e) => setDayRate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Titre affiché sur votre carte Expert
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Ornithologue · Spécialiste Picathartes & Estuaire"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  N° Agrément ANPN / Carte Guide
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={anpnLicense}
                  onChange={(e) => setAnpnLicense(e.target.value)}
                  placeholder="Ex: AGR-ANPN-2026-042"
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Statut fiche publique
                </label>
                <select
                  value={profileStatus}
                  onChange={(e) => setProfileStatus(e.target.value === 'PAUSED' ? 'PAUSED' : 'ACTIVE')}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                >
                  <option value="ACTIVE">Visible dans l’annuaire Explorateur</option>
                  <option value="PAUSED">Masquée temporairement</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Parcs &amp; zones couverts ({selectedParks.length}/10)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GABON_PARKS_PRESETS.map((park) => {
                  const active = selectedParks.includes(park);
                  return (
                    <button
                      key={park}
                      type="button"
                      onClick={() => togglePark(park)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-stone-50 dark:bg-slate-950 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {park}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Langues parlées ({selectedLanguages.length}/8)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GABON_LANGUAGES_PRESETS.map((l) => {
                  const active = selectedLanguages.includes(l);
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => toggleLanguage(l)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition ${
                        active
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-stone-50 dark:bg-slate-950 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Domaines d’expertise (séparés par des virgules)
              </label>
              <input
                type="text"
                maxLength={240}
                value={expertiseText}
                onChange={(e) => setExpertiseText(e.target.value)}
                placeholder="Ornithologie, Orchidées sauvages, Pistage éléphants..."
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Certifications (séparées par des virgules)
              </label>
              <input
                type="text"
                maxLength={240}
                value={certificationsText}
                onChange={(e) => setCertificationsText(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Note de disponibilité
              </label>
              <input
                type="text"
                maxLength={160}
                value={availabilityNote}
                onChange={(e) => setAvailabilityNote(e.target.value)}
                placeholder="Ex: Créneaux ouverts week-ends Mondah & Pongara"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Biographie &amp; expérience terrain
              </label>
              <textarea
                rows={3}
                required
                minLength={10}
                maxLength={600}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                URL Photo de profil (HTTPS optionnel)
              </label>
              <input
                type="url"
                maxLength={500}
                value={photoUrl}
                onChange={(e) => {
                  setPhotoUrl(e.target.value);
                  setAvatarBroken(false);
                }}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Private Settlement Settings Box (Strict Owner Isolation) */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Paramètres privés de reversement (90%)</span>
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
                  Compte / Numéro Mobile Money
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value)}
                  placeholder="+241 74 00 00 00"
                  className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  NIF / N° Dossier professionnel
                </label>
                <input
                  type="text"
                  maxLength={64}
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="Optionnel"
                  className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Contact urgence terrain / ANPN
              </label>
              <input
                type="text"
                maxLength={80}
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Nom & numéro référent secours"
                className="w-full px-3 py-2.5 rounded-xl glass-surface text-xs text-slate-900 dark:text-white"
              />
            </div>

            <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl glass-surface text-xs cursor-pointer">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Accepter automatiquement les demandes quand « Disponible »
              </span>
              <input
                type="checkbox"
                checked={autoAccept}
                onChange={(e) => setAutoAccept(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full min-h-[46px] py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSavingProfile ? 'Enregistrement...' : 'Enregistrer ma Version Professionnel'}
            </span>
          </button>
        </form>
      )}
    </div>
  );
};
