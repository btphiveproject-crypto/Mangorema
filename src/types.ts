export type AppLanguage = 'fr' | 'en' | 'ar';

export type TabType = 'accueil' | 'explorer' | 'sorties' | 'equipement' | 'transports' | 'safety' | 'galerie' | 'profil';

export type EventCategory = 'PUBLIC' | 'PRIVATE' | 'INSTITUTIONAL';

export type ActivityDiscipline =
  | 'RANDONNEE'
  | 'CAMPING'
  | 'PLAGES'
  | 'NAUTIQUE'
  | 'FAUNE'
  | 'ECOTOURISME'
  | 'CULTURE'
  | 'AVENTURE';

export interface ExpeditionEvent {
  id: string;
  title: string;
  category: EventCategory;
  discipline?: ActivityDiscipline;
  date: string;
  location: string;
  parkName: string;
  coords: [number, number];
  locationEnabled?: boolean;
  organizer: string;
  basePrice: number;
  description: string;
  duration: string;
  difficulty: 'Facile' | 'Modéré' | 'Sportif' | 'Expédition';
  image: string;
  elevation: string;
  distance: string;
  maxParticipants?: number;
  spotsLeft?: number;
  providerVerified?: boolean;
  rating?: number;
  reviewsCount?: number;
  requiredGear?: string[];
  safetyRules?: string[];
  cancellationPolicy?: string;
  participationConditions?: string;
  featuredCollection?: string;
}

export interface ShuttleService {
  id: string;
  type: string;
  model: string;
  departurePoint: string;
  destination: string;
  departureTime: string;
  returnTime: string;
  price: number;
  totalSeats: number;
  bookedSeats: number;
  driverName: string;
  driverPhone: string;
  vehicleStatus: 'Confirmé' | 'Dernières places' | 'Complet';
}

export interface SafetyIncident {
  id: string;
  type: 'flood' | 'wildlife' | 'trail_blocked' | 'ranger_station' | 'medical';
  title: string;
  description: string;
  coords: [number, number];
  severity: 'low' | 'medium' | 'high';
  reportedAt: string;
  verifiedByANPN: boolean;
}

export interface Booking {
  id: string;
  refNumber: string;
  eventId?: string;
  eventTitle: string;
  eventDate: string;
  location: string;
  shuttleIncluded: boolean;
  shuttleDetail?: string;
  tentIncluded: boolean;
  guideIncluded: boolean;
  totalAmount: number;
  paymentMethod: 'AIRTEL' | 'MOOV' | 'GHETTOPAY';
  payerPhone: string;
  timestamp: string;
  status: 'CONFIRMED' | 'USED';
  qrCodeSeed: string;
}

export interface ExpeditionPhoto {
  id: string;
  title: string;
  expeditionName?: string;
  parkName: string;
  url: string;
  date: string;
  caption: string;
  isFavorite: boolean;
}

export interface UserProfile {
  name: string;
  role: string;
  phone: string;
  avatar: string;
  totalKm: number;
  totalAscent: number;
  stepsCount: number;
  subscription: 'Gratuit (0 F)' | 'Starter (500 F)' | 'Club Medium (1 000 F)' | 'Pro Expé (2 000 F)';
  badges: Array<{ id: string; name: string; icon: string; desc: string }>;
  favoritePhotoIds: string[];
  topThreePhotoIds: string[];
  offlineMapsDownloaded?: string[];
  ecoPoints?: number;
  zeroWasteExpeditionsCount?: number;
  unlockedBadgeIds?: string[];
  bio?: string;
  homeCity?: string;
  favoritePark?: string;
  publicDiscoverable?: boolean;
}

export interface ExpertGuide {
  id: string;
  name: string;
  title: string;
  anpnLicense: string;
  verified: boolean;
  photo: string;
  languages: string[];
  expertiseTags: string[];
  parks: string[];
  rating: number;
  reviewsCount: number;
  dayRate: number;
  availability: 'DISPONIBLE' | 'SUR_DEMANDE_24H' | 'COMPLET';
  availabilityNote: string;
  bio: string;
  phone: string;
  whatsapp: string;
}

export interface ExpertBookingRequest {
  id: string;
  expertId: string;
  expertName: string;
  customerName: string;
  customerPhone: string;
  date: string;
  durationDays: number;
  parkName: string;
  groupSize: number;
  notes?: string;
  totalAmount: number;
  depositStatus: 'PENDING' | 'CONFIRMED';
  status: 'AUTOMATIC_CONFIRM' | 'UNDER_REVIEW_24H' | 'VALIDATED';
  createdAt: string;
}

export interface RentalItem {
  id: string;
  category: 'tente' | 'sac_a_dos' | 'vtt' | 'balise_gps' | 'bivouac';
  name: string;
  model: string;
  partnerName: string;
  pickupLocation: string;
  pricePerDay: number;
  depositAmount: number;
  depositMethod: 'MOBILE_MONEY' | 'EMPREINTE_CB' | 'ESPECES';
  availableQuantity: number;
  totalQuantity: number;
  image: string;
  specs: string[];
  conditionChecklist: string[];
}

export interface RentalBooking {
  id: string;
  refNumber: string;
  itemId: string;
  itemName: string;
  rentalDays: number;
  startDate: string;
  endDate: string;
  totalRentalPrice: number;
  depositAmount: number;
  depositStatus: 'HELD_MOBILE_MONEY' | 'HELD_PREAUTH_CARD' | 'RETURNED';
  pickupLocation: string;
  pickupChecklistCompleted: boolean;
  returnChecklistCompleted: boolean;
  pickupPhotos: string[];
  returnPhotos: string[];
  status: 'RESERVED' | 'IN_USE' | 'RETURNED_INSPECTED';
}

export interface OfflineMapPackage {
  id: string;
  parkId: string;
  name: string;
  region: string;
  description: string;
  zoomRange: string;
  estimatedTiles: number;
  sizeMB: number;
  centerCoords: [number, number];
  bounds: [[number, number], [number, number]];
  isDownloaded: boolean;
  downloadDate?: string;
}

export interface OfflineParkTrail {
  id: string;
  name: string;
  distanceKm: number;
  elevationM: number;
  difficulty: string;
  color: string;
  coords: [number, number][];
}

export interface OfflineParkWaypoint {
  id: string;
  name: string;
  kind: 'ranger' | 'camp' | 'landmark' | 'water';
  coords: [number, number];
  elevationM: number;
  note: string;
}

export interface OfflineParkMapData {
  packageId: string;
  parkId: string;
  name: string;
  region: string;
  centerCoords: [number, number];
  bounds: [[number, number], [number, number]];
  zoom: number;
  trails: OfflineParkTrail[];
  waypoints: OfflineParkWaypoint[];
  downloadedAt: string;
  cachedTilesCount: number;
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface ScheduledNotification {
  id: string;
  bookingId?: string;
  shuttleId?: string;
  ecoChallengeId?: string;
  wildlifeAlertId?: string;
  targetType: 'SHUTTLE' | 'EXPEDITION' | 'ECO_CHALLENGE' | 'WILDLIFE_ALERT';
  title: string;
  body: string;
  eventTitle: string;
  location: string;
  departureTimeFormatted: string;
  alertTimeFormatted: string;
  scheduledTimestamp: number;
  departureTimestamp: number;
  enabled: boolean;
  status: 'PENDING' | 'TRIGGERED' | 'DISMISSED';
  createdAt: string;
}

export interface ExpeditionReview {
  id: string;
  eventId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  comment: string;
  photoUrl?: string;
  createdAtLabel: string;
  createdAtMs?: number;
  isSynced?: boolean;
}

export interface VirtualEcoBadge {
  id: string;
  name: string;
  icon: string;
  desc: string;
  kind: 'expedition' | 'milestone';
  requirementText: string;
  ecoPointsReward?: number;
}

export interface EcoChallengeDefinition {
  challengeId: string;
  eventId: string;
  eventTitle: string;
  parkName: string;
  challengeTitle: string;
  challengeRules: string;
  ecoPoints: number;
  badge: VirtualEcoBadge;
}

export interface WeeklyEcoChallengeDefinition extends EcoChallengeDefinition {
  weekKey: string;
  weekLabel: string;
  endsAtMs: number;
  targetAction: string;
}

export interface EcoChallengeCompletion {
  id: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  parkName: string;
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  wasteBagReturned: boolean;
  leaveNoTracePledge: boolean;
  wasteNote?: string;
  proofPhotoUrl?: string;
  proofStoragePath?: string;
  ecoPoints: number;
  completedAtLabel: string;
  createdAtMs?: number;
}

export type WildlifeAlertCategory = 'MARINE' | 'FAUNE' | 'OISEAUX' | 'FLORE';

export interface WildlifeSeasonalAlert {
  id: string;
  species: string;
  title: string;
  category: WildlifeAlertCategory;
  parkOrZone: string;
  activeMonths: number[]; // 1-12 (Jan = 1 ... Dec = 12)
  seasonLabel: string;
  summary: string;
  observationRule: string;
  safetyDistance: string;
  bestWindow: string;
  severity: 'info' | 'vigilance' | 'protection';
  icon: string;
}

export type EcoLogCategory = 'FAUNE' | 'FLORE' | 'MARINE' | 'OISEAUX';

export interface EcoLogEntry {
  id: string;
  userId: string;
  speciesName: string;
  category: EcoLogCategory;
  parkName: string;
  observedAt: string;
  notes: string;
  weatherOrContext?: string;
  createdAtMs?: number;
}

export interface GoogleContactCandidate {
  resourceName: string;
  displayName: string;
  phoneNumber?: string;
  email?: string;
  photoUrl?: string;
  organization?: string;
}

export interface TrustedContact {
  id: string;
  userId: string;
  resourceName: string;
  displayName: string;
  phoneNumber?: string;
  email?: string;
  photoUrl?: string;
  relationTag?: string;
  shareSafetyAlerts: boolean;
  shareExpeditionPlans: boolean;
  createdAtMs?: number;
}

export type CommunityActivityType = 'RANDONNEE' | 'FAUNE' | 'BIVOUAC' | 'ECO_ACTION';

export interface CommunityActivity {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  parkName: string;
  activityType: CommunityActivityType;
  title: string;
  description: string;
  photoUrl?: string;
  distanceKm?: number;
  elevationM?: number;
  createdAtLabel: string;
  createdAtMs?: number;
  isSynced?: boolean;
}

export interface CommunityActivityComment {
  id: string;
  activityId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAtLabel: string;
  createdAtMs?: number;
}

export type ChatRoomId = 'general' | 'mondah' | 'ivindo' | 'pongara' | 'cristal';

export interface CommunityChatMessage {
  id: string;
  roomId: ChatRoomId;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAtLabel: string;
  createdAtMs?: number;
}

export type StoreProductCategory =
  | 'randonnee'
  | 'camping'
  | 'chaussures_vetements'
  | 'optique_photo'
  | 'eclairage_gadgets'
  | 'lifestyle_mangorema';

export interface StoreProduct {
  id: string;
  name: string;
  brand: string;
  category: StoreProductCategory;
  price: number;
  originalPrice?: number;
  stock: number;
  soldCount: number;
  description: string;
  specs: string[];
  deliveryOptions: ('RETRAIT' | 'LIVRAISON')[];
  pickupLocation: string;
  weightOrSize: string;
  isOfficialMerch?: boolean;
  badgeText?: string;
  gradientTheme: string;
  iconName: string;
  rating: number;
}

export type CartItemKind = 'activity' | 'rental' | 'product' | 'shuttle';

export interface UnifiedCartItem {
  cartItemId: string;
  kind: CartItemKind;
  refId: string;
  title: string;
  subtitle: string;
  unitPrice: number;
  quantity: number;
  rentalDays?: number;
  startDate?: string;
  depositUnitAmount?: number;
  fulfillmentMode: 'IN_PERSON' | 'PICKUP' | 'DELIVERY';
  pickupLocation?: string;
  meta?: {
    parkName?: string;
    eventDate?: string;
    participants?: number;
    shuttleIncluded?: boolean;
    tentIncluded?: boolean;
    guideIncluded?: boolean;
    mealPackIncluded?: boolean;
  };
}

export type PaymentMethodType = 'AIRTEL' | 'MOOV' | 'GHETTOPAY' | 'CARD';

export type PaymentStatus = 'CONFIRMED' | 'PENDING' | 'FAILED' | 'REFUNDED';

export type FulfillmentStatus =
  | 'PENDING_VENDOR'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_PICKUP'
  | 'IN_DELIVERY'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'CANCELLED';

export interface MarketplaceVendorSplit {
  vendorUserId: string;
  vendorName: string;
  grossSubtotal: number;
  commissionAmount: number;
  netAmount: number;
  depositHeld: number;
  itemTitles: string[];
}

export interface VendorOrderFulfillment {
  orderId: string;
  refNumber: string;
  vendorUserId: string;
  vendorName: string;
  buyerDisplayLabel: string;
  deliveryZoneLabel?: string;
  deliveryAddress?: string;
  items: Array<{
    refId: string;
    kind: CartItemKind;
    title: string;
    quantity: number;
    rentalDays?: number;
    fulfillmentMode: 'IN_PERSON' | 'PICKUP' | 'DELIVERY';
    lineTotal: number;
    depositHeld: number;
  }>;
  grossSubtotal: number;
  commissionAmount: number;
  netAmount: number;
  depositHeld: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  timestamp: string;
  receiptHash: string;
  refundReason?: string;
  refundedAtLabel?: string;
}

export interface MarketplaceOrder {
  id: string;
  userId: string;
  refNumber: string;
  idempotencyKey: string;
  items: UnifiedCartItem[];
  itemsSubtotal: number;
  deliveryFee: number;
  depositTotal: number;
  platformCommission: number;
  vendorNetAmount: number;
  grandTotalCharged: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  payerLabel: string;
  deliveryZoneId?: string;
  deliveryZoneLabel?: string;
  deliveryAddress?: string;
  ussdPushRef?: string;
  ussdDialCode?: string;
  vendorSplits?: MarketplaceVendorSplit[];
  timestamp: string;
  receiptHash: string;
  refundReason?: string;
  refundedAtLabel?: string;
  createdAtMs?: number;
}

export type VendorListingKind = 'activity' | 'product' | 'rental';

export interface VendorListing {
  id: string;
  ownerUserId: string;
  ownerName: string;
  ownerRole?: 'pro' | 'store';
  listingKind: VendorListingKind;
  title: string;
  category: string;
  productCategory?: StoreProductCategory;
  rentalCategory?: RentalItem['category'];
  storeId?: string;
  storeName?: string;
  specialtyTag?: string;
  deliveryAvailable?: boolean;
  location: string;
  locationEnabled?: boolean;
  lat?: number;
  lng?: number;
  price: number;
  depositAmount?: number;
  stockOrCapacity: number;
  description: string;
  status: 'ACTIVE' | 'PAUSED';
  createdAtLabel: string;
  createdAtMs?: number;
}

export type AppWorkspaceMode = 'explorer' | 'professional' | 'store';

export type ProTabType = 'pro_dashboard' | 'pro_offers' | 'pro_bookings' | 'pro_profile';

export type StoreTabType = 'store_dashboard' | 'store_catalog' | 'store_rentals' | 'store_orders' | 'store_profile';

export type ProfessionalSpecialty =
  | 'guide_anpn'
  | 'ornithologue'
  | 'botaniste'
  | 'pisteur'
  | 'photographe'
  | 'ecoguide'
  | 'operateur'
  | 'autre';

export interface ProfessionalProfile {
  id: string;
  ownerUserId: string;
  displayName: string;
  specialty: ProfessionalSpecialty;
  customSpecialty?: string;
  title: string;
  anpnLicense?: string;
  certifications: string[];
  parks: string[];
  languages: string[];
  expertiseTags: string[];
  dayRate: number;
  availability: 'DISPONIBLE' | 'SUR_DEMANDE_24H' | 'COMPLET';
  availabilityNote?: string;
  bio: string;
  photoUrl?: string;
  status: 'ACTIVE' | 'PAUSED';
  createdAtLabel: string;
  createdAtMs?: number;
}

export type StoreCategory =
  | 'outdoor_shop'
  | 'rental_agency'
  | 'optique_photo'
  | 'marine_nautique'
  | 'multi_sport';

export interface StoreProfile {
  id: string;
  ownerUserId: string;
  storeName: string;
  storeType: StoreCategory;
  cityZone: string;
  pickupAddress: string;
  openingHours: string;
  deliveryAvailable: boolean;
  deliveryFee: number;
  deliveryZones?: string;
  description: string;
  logoUrl?: string;
  status: 'ACTIVE' | 'PAUSED';
  createdAtLabel: string;
  createdAtMs?: number;
}

export interface BusinessSettlementSettings {
  id: 'professional' | 'store';
  userId: string;
  payoutOperator: 'AIRTEL' | 'MOOV' | 'GHETTOPAY' | 'BANK';
  payoutAccountPhone: string;
  businessRegNumber?: string;
  emergencyContact?: string;
  autoAcceptBookings: boolean;
  updatedAtLabel?: string;
}

export interface PublicExplorerProfile {
  uid: string;
  displayName: string;
  role?: string;
  bio?: string;
  homeCity?: string;
  favoritePark?: string;
  avatarUrl?: string;
  ecoPoints: number;
  contributionsCount: number;
  isDiscoverable: boolean;
  createdAtMs?: number;
  updatedAtMs?: number;
}

export type SiteContributionType = 'PHOTO' | 'OBSERVATION' | 'TRAIL_TIP' | 'CAMP_INFO';

export interface SiteContribution {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  parkId: string;
  parkName: string;
  zoneLabel?: string;
  contributionType: SiteContributionType;
  title: string;
  description: string;
  photoUrl?: string;
  storagePath?: string;
  createdAtLabel: string;
  createdAtMs?: number;
}

export interface DirectChat {
  id: string;
  participantUids: [string, string];
  participantAId: string;
  participantBId: string;
  participantAName: string;
  participantBName: string;
  participantAAvatar?: string;
  participantBAvatar?: string;
  lastMessageText: string;
  lastMessageSenderId: string;
  lastMessageAtLabel: string;
  createdAtMs?: number;
  updatedAtMs?: number;
}

export interface DirectChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  participantUids: [string, string];
  text: string;
  photoUrl?: string;
  storagePath?: string;
  createdAtLabel: string;
  createdAtMs?: number;
}
