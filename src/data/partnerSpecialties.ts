import {
  ExpertGuide,
  ProfessionalProfile,
  ProfessionalSpecialty,
  StoreCategory,
} from '../types';

export interface SpecialtyMeta {
  id: ProfessionalSpecialty;
  label: string;
  shortLabel: string;
  defaultTitle: string;
  defaultTags: string[];
  domainKeywords: string;
}

export const PRO_SPECIALTIES: SpecialtyMeta[] = [
  {
    id: 'guide_anpn',
    label: 'Guide Touristique / ANPN',
    shortLabel: 'Guide ANPN',
    defaultTitle: 'Guide Naturaliste Certifié ANPN',
    defaultTags: ['Guidage Parcs Nationaux', 'Sécurité Forêt', 'Écotourisme'],
    domainKeywords: 'guide anpn',
  },
  {
    id: 'ornithologue',
    label: 'Ornithologue',
    shortLabel: 'Ornithologue',
    defaultTitle: 'Ornithologue · Oiseaux Équatoriaux & Zones Humides',
    defaultTags: ['Ornithologie', 'Picatharte', 'Mangrove & Estuaire'],
    domainKeywords: 'ornithologie oiseaux',
  },
  {
    id: 'botaniste',
    label: 'Botaniste',
    shortLabel: 'Botaniste',
    defaultTitle: 'Botaniste · Flore Endémique & Orchidées du Gabon',
    defaultTags: ['Botanique', 'Orchidées Sauvages', 'Plantes Médicinales'],
    domainKeywords: 'botanique flore',
  },
  {
    id: 'pisteur',
    label: 'Pisteur Faune',
    shortLabel: 'Pisteur',
    defaultTitle: 'Pisteur Émérite · Éléphants, Gorilles & Grand Gibier',
    defaultTags: ['Pistage', 'Lecture des Traces', 'Approche Silencieuse'],
    domainKeywords: 'pistage faune',
  },
  {
    id: 'photographe',
    label: 'Photographe Animalier',
    shortLabel: 'Photographe',
    defaultTitle: 'Photographe Naturaliste & Guide Affût Canopée',
    defaultTags: ['Photo Animalière', 'Affût Canopée', 'Macro Forêt'],
    domainKeywords: 'photo animalier',
  },
  {
    id: 'ecoguide',
    label: 'Écoguide Communautaire',
    shortLabel: 'Écoguide',
    defaultTitle: 'Écoguide Local · Randonnées & Savoirs Traditionnels',
    defaultTags: ['Écoguide', 'Patrimoine Culturel', 'Zéro Déchet'],
    domainKeywords: 'ecoguide rando',
  },
  {
    id: 'operateur',
    label: 'Opérateur / Agence Expé',
    shortLabel: 'Opérateur',
    defaultTitle: 'Opérateur & Organisateur d’Expéditions Multi-Jours',
    defaultTags: ['Logistique Bivouac', 'Expéditions Sur-Mesure', 'Groupes'],
    domainKeywords: 'operateur agence',
  },
  {
    id: 'autre',
    label: 'Autre spécialité',
    shortLabel: 'Autre',
    defaultTitle: 'Spécialiste Terrain Gabon',
    defaultTags: ['Expertise Terrain', 'Sortie Privée'],
    domainKeywords: 'autre terrain',
  },
];

export const STORE_CATEGORIES_META: Array<{
  id: StoreCategory;
  label: string;
  shortLabel: string;
  desc: string;
}> = [
  {
    id: 'outdoor_shop',
    label: 'Boutique Équipement Outdoor',
    shortLabel: 'Boutique Outdoor',
    desc: 'Vente de chaussures, sacs, lampes, tenues et accessoires de randonnée',
  },
  {
    id: 'rental_agency',
    label: 'Loueur Matériel Bivouac',
    shortLabel: 'Loueur Bivouac',
    desc: 'Location de tentes étanches, matelas, VTT et packs camping avec caution',
  },
  {
    id: 'optique_photo',
    label: 'Optique, Jumelles & Photo',
    shortLabel: 'Optique & Photo',
    desc: 'Jumelles ornitho, longues-vues, trépieds et caissons tropicalisés',
  },
  {
    id: 'marine_nautique',
    label: 'Nautique & Mangrove',
    shortLabel: 'Nautique',
    desc: 'Kayaks, gilets SOLAS, sacs étanches et équipements côtiers',
  },
  {
    id: 'multi_sport',
    label: 'Magasin Multi-Services Expé',
    shortLabel: 'Multi-Services',
    desc: 'Vente neuve, location courte durée et retrait expédition Libreville',
  },
];

export const GABON_PARKS_PRESETS = [
  'Parc National de la Mondah',
  'Parc National de Pongara',
  'Parc National de la Lopé',
  "Parc National de l'Ivindo",
  'Parc National de Loango',
  'Monts de Cristal',
  'Cap Estérias',
  'Parc National d’Akanda',
  'Réserve de Wonga-Wongué',
];

export const GABON_LANGUAGES_PRESETS = [
  'Français',
  'Anglais',
  'Fang',
  'Myènè',
  'Punu',
  'Kota',
  'Espagnol',
  'Arabe',
];

export function getSpecialtyLabel(
  specialty: ProfessionalSpecialty,
  customSpecialty?: string
): string {
  if (specialty === 'autre' && customSpecialty?.trim()) {
    return customSpecialty.trim();
  }
  return PRO_SPECIALTIES.find((s) => s.id === specialty)?.label || 'Professionnel Outdoor';
}

export function proProfileToExpertGuide(profile: ProfessionalProfile): ExpertGuide {
  const specialtyLabel = getSpecialtyLabel(profile.specialty, profile.customSpecialty);
  const combinedTags = Array.from(
    new Set([specialtyLabel, ...(profile.expertiseTags || [])].filter(Boolean))
  ).slice(0, 6);

  return {
    id: profile.id,
    name: profile.displayName,
    title: profile.title || specialtyLabel,
    anpnLicense: profile.anpnLicense?.trim() || 'PRO-MANGOREMA',
    verified: Boolean(profile.anpnLicense?.trim()),
    photo: profile.photoUrl || '',
    languages: profile.languages.length > 0 ? profile.languages : ['Français'],
    expertiseTags: combinedTags,
    parks: profile.parks.length > 0 ? profile.parks : ['Gabon'],
    rating: 4.9,
    reviewsCount: 1,
    dayRate: profile.dayRate,
    availability: profile.availability,
    availabilityNote:
      profile.availabilityNote?.trim() ||
      (profile.availability === 'DISPONIBLE'
        ? 'Disponible pour sorties privées & accompagnement'
        : profile.availability === 'SUR_DEMANDE_24H'
        ? 'Confirmation sous 24h selon créneau terrain'
        : 'Agenda complet sur les prochaines dates'),
    bio: profile.bio,
    phone: '',
    whatsapp: '',
  };
}
