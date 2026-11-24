/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActivityDiscipline, ExpeditionEvent, RentalItem, StoreProduct } from '../types';
import imgBivouacGear from '../assets/images/bivouac_equatorial_gear_1795342715941.jpg';
import imgCristalHighlands from '../assets/images/cristal_misty_highlands_1795342716179.jpg';

export const ACTIVITY_COLLECTIONS = [
  {
    id: 'estuaire',
    title: 'Week-ends Grand Libreville',
    subtitle: 'Mondah, Pongara & Cap Estérias à moins de 2h',
    badge: 'Populaire',
  },
  {
    id: 'unesco',
    title: 'Parcs UNESCO & Faune',
    subtitle: 'Ivindo, Loango & La Lopé avec pisteurs certifiés',
    badge: 'Nature Sauvage',
  },
  {
    id: 'eco',
    title: 'Actions Zéro Déchet',
    subtitle: 'Reboisement mangrove, plages & défis écologiques',
    badge: 'Écotourisme',
  },
] as const;

export const ENRICHED_EVENT_DETAILS: Record<
  string,
  {
    discipline: ActivityDiscipline;
    maxParticipants: number;
    spotsLeft: number;
    providerVerified: boolean;
    rating: number;
    reviewsCount: number;
    requiredGear: string[];
    safetyRules: string[];
    cancellationPolicy: string;
    participationConditions: string;
    featuredCollection: string;
  }
> = {
  'evt-1': {
    discipline: 'CAMPING',
    maxParticipants: 16,
    spotsLeft: 5,
    providerVerified: true,
    rating: 4.9,
    reviewsCount: 38,
    requiredGear: [
      'Chaussures de randonnée fermées',
      'Lampe frontale étanche',
      'Gourde 1,5L minimum + répulsif',
      'Vêtement léger à manches longues',
    ],
    safetyRules: [
      'Enregistrement obligatoire au poste ANPN à l’entrée',
      'Rester groupé avec l’écoguide lors de la marche nocturne',
      'Zéro déchet plastique laissé sur le site de bivouac',
    ],
    cancellationPolicy: 'Annulation gratuite jusqu’à 48h avant le départ (remboursement 100%).',
    participationConditions: 'À partir de 10 ans (mineurs accompagnés). Bonne condition physique standard.',
    featuredCollection: 'estuaire',
  },
  'evt-2': {
    discipline: 'AVENTURE',
    maxParticipants: 10,
    spotsLeft: 3,
    providerVerified: true,
    rating: 4.95,
    reviewsCount: 24,
    requiredGear: [
      'Sac à dos étanche 50-65L',
      'Chaussures à crampons profonds pour boue & rivières',
      'Bâtons de marche & trousse de secours individuelle',
      'Hamac moustiquaire ou tente compacte',
    ],
    safetyRules: [
      'Respect strict des distances de sécurité face aux éléphants (min 80m)',
      'Port du gilet requis lors des traversées en pirogue',
      'Suivi GPS actif par le chef d’expédition',
    ],
    cancellationPolicy: 'Remboursement à 100% jusqu’à 7 jours avant, 50% jusqu’à 72h avant.',
    participationConditions: 'Réservé aux adultes (+18 ans) habitués aux treks en forêt humide.',
    featuredCollection: 'unesco',
  },
  'evt-3': {
    discipline: 'PLAGES',
    maxParticipants: 14,
    spotsLeft: 6,
    providerVerified: true,
    rating: 4.85,
    reviewsCount: 41,
    requiredGear: [
      'Crème solaire biodégradable & chapeau',
      'Lunettes de soleil + coupe-vent léger pour la traversée',
      'Lampe rouge recommandée pour observation nocturne',
    ],
    safetyRules: [
      'Port obligatoire du gilet SOLAS durant la traversée Port-Môle',
      'Interdiction d’utiliser des flashs photo près des tortues luth',
      'Respect des consignes des guides du Komo-Océan',
    ],
    cancellationPolicy: 'Annulation gratuite jusqu’à 48h avant le départ ou report météo offert.',
    participationConditions: 'Tout public et familles bienvenus (dès 6 ans).',
    featuredCollection: 'estuaire',
  },
  'evt-4': {
    discipline: 'ECOTOURISME',
    maxParticipants: 30,
    spotsLeft: 12,
    providerVerified: true,
    rating: 4.92,
    reviewsCount: 19,
    requiredGear: [
      'Bottes ou chaussures acceptant la boue/eau salée',
      'Gants de jardinage (fournis si indisponibles)',
      'Gourde réutilisable & casquette',
    ],
    safetyRules: [
      'Briefing sécurité marée & zone humide par les écogardes',
      'Travail en binôme dans les zones de plantation',
    ],
    cancellationPolicy: 'Événement citoyen gratuit — annulation libre à tout moment.',
    participationConditions: 'Ouvert à tous les volontaires dès 12 ans.',
    featuredCollection: 'eco',
  },
  'evt-5': {
    discipline: 'RANDONNEE',
    maxParticipants: 18,
    spotsLeft: 7,
    providerVerified: true,
    rating: 4.88,
    reviewsCount: 29,
    requiredGear: [
      'Chaussures de trail ou trek adhérentes',
      'Veste imperméable respirante',
      '2L d’eau + barres énergétiques',
    ],
    safetyRules: [
      'Pentes glissantes après pluie : suivre le balisage du guide',
      'Ne pas cueillir les orchidées protégées',
    ],
    cancellationPolicy: 'Annulation gratuite jusqu’à 48h avant le départ.',
    participationConditions: 'Bonne endurance cardio recommandée (dénivelé +580m).',
    featuredCollection: 'unesco',
  },
};

export function enrichEvent(evt: ExpeditionEvent): ExpeditionEvent {
  const extra = ENRICHED_EVENT_DETAILS[evt.id];
  if (!extra) return evt;
  return { ...extra, ...evt };
}

export const ADDITIONAL_RENTALS: RentalItem[] = [
  {
    id: 'rent-5',
    category: 'bivouac',
    name: 'Kit Couchage Tropical (Sac + Matelas)',
    model: 'Forclaz MT500 15°C + Matelas Isolant R3',
    partnerName: 'EquipOutdoor Gabon — Charbonnages',
    pickupLocation: 'Rond-Point Charbonnages (Face Pharmacie)',
    pricePerDay: 4000,
    depositAmount: 18000,
    depositMethod: 'MOBILE_MONEY',
    availableQuantity: 7,
    totalQuantity: 10,
    image: imgBivouacGear,
    specs: [
      'Tissu respirant adapté à l’humidité équatoriale',
      'Matelas gonflable ultra-compact 520g',
      'Drap de sac coton lavé et désinfecté',
      'Housse de compression étanche',
    ],
    conditionChecklist: [
      'Sac de couchage propre sans déchirure',
      'Valve du matelas étanche testée',
      'Kit rustines présent dans la housse',
    ],
  },
  {
    id: 'rent-6',
    category: 'bivouac',
    name: 'Kit Photo & Caméra Action 4K Étanche',
    model: 'GoPro Hero 12 + Harnais & Batteries (x3)',
    partnerName: 'Gabon Lens Outdoor — Batterie 4',
    pickupLocation: 'Batterie 4 (Près du Consulat)',
    pricePerDay: 9500,
    depositAmount: 60000,
    depositMethod: 'EMPREINTE_CB',
    availableQuantity: 3,
    totalQuantity: 4,
    image: imgCristalHighlands,
    specs: [
      'Vidéo 5.3K stabilisée étanche jusqu’à 10m',
      'Carte microSD 128 Go haute vitesse fournie',
      'Perche flottante + fixation sac à dos',
      '3 batteries Enduro + boîtier étanche plongée',
    ],
    conditionChecklist: [
      'Lentille et écran arrière sans rayure',
      '3 batteries chargées à 100%',
      'Joint du capot batterie vérifié',
    ],
  },
];

export const INITIAL_STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 'prod-1',
    name: 'Chaussures Trekking Latérite & Forêt',
    brand: 'Salomon X-Ultra Gabon Spec',
    category: 'chaussures_vetements',
    price: 58000,
    originalPrice: 65000,
    stock: 9,
    soldCount: 42,
    description:
      'Semelle Contagrip haute adhérence conçue pour les sentiers boueux de la Mondah et les crêtes humides des Monts de Cristal.',
    specs: ['Membrane respirante séchage rapide', 'Pare-pierres renforcé', 'Crampons 5mm auto-nettoyants'],
    deliveryOptions: ['RETRAIT', 'LIVRAISON'],
    pickupLocation: 'Boutique MANGOREMA Charbonnages',
    weightOrSize: 'Pointures 38 à 46',
    badgeText: 'Best-seller Gabon',
    gradientTheme: 'from-amber-600/30 via-stone-900 to-emerald-950',
    iconName: 'footprints',
    rating: 4.9,
  },
  {
    id: 'prod-2',
    name: 'Lampe Frontale Étanche 800 Lumens',
    brand: 'Petzl Actik Core Tropical',
    category: 'eclairage_gadgets',
    price: 29500,
    stock: 14,
    soldCount: 67,
    description:
      'Éclairage double faisceau blanc + mode lumière rouge discret indispensable pour observer la ponte des tortues luth à Pongara.',
    specs: ['Batterie USB-C rechargeable + compatibilité piles', 'Étanchéité IPX4 pluie équatoriale', 'Sifflet de secours intégré au bandeau'],
    deliveryOptions: ['RETRAIT', 'LIVRAISON'],
    pickupLocation: 'Charbonnages & Port-Môle',
    weightOrSize: '88 g',
    badgeText: 'Indispensable Pongara',
    gradientTheme: 'from-amber-500/30 via-slate-900 to-amber-950',
    iconName: 'flashlight',
    rating: 4.95,
  },
  {
    id: 'prod-3',
    name: 'Veste Imperméable Respirante 15 000mm',
    brand: 'MANGOREMA Pro Shell',
    category: 'chaussures_vetements',
    price: 42000,
    originalPrice: 48000,
    stock: 11,
    soldCount: 31,
    description:
      'Protection légère contre les grains tropicaux soudains avec aérations sous les bras et capuche tempête ajustable.',
    specs: ['Coutures 100% étanches thermosoudées', 'Se replie dans sa poche poitrine', 'Bandes réfléchissantes discrètes'],
    deliveryOptions: ['RETRAIT', 'LIVRAISON'],
    pickupLocation: 'Boutique MANGOREMA Charbonnages',
    weightOrSize: 'Tailles S à XXL',
    gradientTheme: 'from-emerald-600/30 via-slate-900 to-teal-950',
    iconName: 'cloud-rain',
    rating: 4.8,
  },
  {
    id: 'prod-4',
    name: 'Réchaud Bivouac Pliable + Popote Titane',
    brand: 'MSR PocketRocket Kit',
    category: 'camping',
    price: 34000,
    stock: 7,
    soldCount: 25,
    description:
      'Cuisine outdoor ultra-compacte : fait bouillir 1L d’eau en 3m30 même par vent côtier à Nyonié.',
    specs: ['Brûleur coupe-vent haute efficacité', 'Popote graduée 900ml avec poignées isolées', 'Allumeur piézo protégé'],
    deliveryOptions: ['RETRAIT', 'LIVRAISON'],
    pickupLocation: 'Akanda & Charbonnages',
    weightOrSize: '265 g complet',
    gradientTheme: 'from-orange-600/30 via-stone-900 to-red-950',
    iconName: 'flame',
    rating: 4.85,
  },
  {
    id: 'prod-5',
    name: 'Jumelles Observation Faune 10x42 HD',
    brand: 'Vortex Diamondback',
    category: 'optique_photo',
    price: 89000,
    stock: 5,
    soldCount: 16,
    description:
      'Optique lumineuse traitée anti-buée à l’azote pour repérer mandrills, oiseaux rares et éléphants en sous-bois dense.',
    specs: ['Grossissement 10x objectif 42mm', 'Étanche et antibuée (purgé azote)', 'Harnais poitrine inclus'],
    deliveryOptions: ['RETRAIT', 'LIVRAISON'],
    pickupLocation: 'Batterie 4 & Charbonnages',
    weightOrSize: '605 g',
    badgeText: 'Optique Pro',
    gradientTheme: 'from-sky-600/30 via-slate-900 to-indigo-950',
    iconName: 'binoculars',
    rating: 4.94,
  },
  {
    id: 'prod-6',
    name: 'Powerbank Solaire 20 000 mAh IP67',
    brand: 'Anker Gabon Trail Edition',
    category: 'eclairage_gadgets',
    price: 26500,
    stock: 18,
    soldCount: 84,
    description:
      'Autonomie smartphone & GPS garantie pendant 4 jours d’expédition loin de toute prise électrique.',
    specs: ['Charge rapide USB-C PD 22.5W', 'Coque antichoc étanche poussière/pluie', 'Panneau solaire d’appoint + lampe SOS'],
    deliveryOptions: ['RETRAIT', 'LIVRAISON'],
    pickupLocation: 'Charbonnages · Okala · Owendo',
    weightOrSize: '390 g',
    gradientTheme: 'from-amber-500/25 via-slate-900 to-emerald-950',
    iconName: 'battery-charging',
    rating: 4.88,
  },
  {
    id: 'prod-7',
    name: 'Gourde Isotherme Gravée MANGOREMA 1L',
    brand: 'MANGOREMA Collection Officielle',
    category: 'lifestyle_mangorema',
    price: 12500,
    stock: 30,
    soldCount: 112,
    description:
      'Acier inoxydable double paroi gravé du Pangolin MANGOREMA. Garde l’eau fraîche 24h et réduit l’usage de bouteilles jetables dans les parcs.',
    specs: ['Acier 18/8 sans BPA', '24h froid / 12h chaud', 'Bouchon mousqueton anti-fuite'],
    deliveryOptions: ['RETRAIT', 'LIVRAISON'],
    pickupLocation: 'Tous points relais Libreville',
    weightOrSize: '1 Litre',
    isOfficialMerch: true,
    badgeText: 'Officiel MANGOREMA',
    gradientTheme: 'from-amber-600/40 via-stone-900 to-amber-950',
    iconName: 'cup-soda',
    rating: 4.97,
  },
  {
    id: 'prod-8',
    name: 'T-Shirt Technique Éco-Fibre "Le Gabon se vit dehors"',
    brand: 'MANGOREMA Collection Officielle',
    category: 'lifestyle_mangorema',
    price: 15000,
    stock: 22,
    soldCount: 73,
    description:
      'Textile technique anti-UV respirant en coton bio & polyester recyclé, imprimé aux couleurs cuivre et forêt du Gabon.',
    specs: ['Séchage ultra-rapide anti-humidité', 'Protection UPF 40+', 'Coupe unisexe respirante'],
    deliveryOptions: ['RETRAIT', 'LIVRAISON'],
    pickupLocation: 'Tous points relais Libreville',
    weightOrSize: 'Tailles XS à XXL',
    isOfficialMerch: true,
    badgeText: 'Goodies Officiel',
    gradientTheme: 'from-emerald-700/35 via-slate-900 to-amber-950',
    iconName: 'shirt',
    rating: 4.91,
  },
  {
    id: 'prod-9',
    name: 'Bâtons de Randonnée Carbone Télescopiques (Paire)',
    brand: 'Black Diamond Trail Carbon',
    category: 'randonnee',
    price: 38500,
    stock: 8,
    soldCount: 29,
    description:
      'Stabilité maximale en descente raide et franchissement de gués dans l’Ivindo ou les Monts de Cristal.',
    specs: ['Verrouillage FlickLock aluminium', 'Poignées liège anti-transpiration', 'Rondelles boue incluses'],
    deliveryOptions: ['RETRAIT', 'LIVRAISON'],
    pickupLocation: 'Boutique MANGOREMA Charbonnages',
    weightOrSize: '430 g la paire',
    gradientTheme: 'from-stone-600/35 via-slate-900 to-emerald-950',
    iconName: 'mountain',
    rating: 4.86,
  },
];

export const PLATFORM_COMMISSION_RATE = 0.10; // 10% platform service commission
export const LIBREVILLE_DELIVERY_FEE = 2500; // 2 500 FCFA flat delivery in Grand Libreville
