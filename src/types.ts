export type TabType = 'accueil' | 'explorer' | 'sorties' | 'transports' | 'safety' | 'profil';

export type EventCategory = 'PUBLIC' | 'PRIVATE' | 'INSTITUTIONAL';

export interface ExpeditionEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  location: string;
  parkName: string;
  coords: [number, number];
  organizer: string;
  basePrice: number;
  description: string;
  duration: string;
  difficulty: 'Facile' | 'Modéré' | 'Sportif' | 'Expédition';
  image: string;
  elevation: string;
  distance: string;
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
  paymentMethod: 'AIRTEL' | 'MOOV';
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
  subscription: 'Starter (500 F)' | 'Club Medium (1 000 F)' | 'Pro Expé (2 000 F)';
  badges: Array<{ id: string; name: string; icon: string; desc: string }>;
  favoritePhotoIds: string[];
  topThreePhotoIds: string[];
  offlineMapsDownloaded?: string[];
  ecoPoints?: number;
  zeroWasteExpeditionsCount?: number;
  unlockedBadgeIds?: string[];
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

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface ScheduledNotification {
  id: string;
  bookingId?: string;
  shuttleId?: string;
  ecoChallengeId?: string;
  targetType: 'SHUTTLE' | 'EXPEDITION' | 'ECO_CHALLENGE';
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
  ecoPoints: number;
  completedAtLabel: string;
  createdAtMs?: number;
}
