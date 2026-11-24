import { AppWorkspaceMode, TabType } from '../types';
import imgMondah from '../assets/images/hero_mondah_canopy_1795342713775.jpg';
import imgLoango from '../assets/images/gabon_loango_lagoon_1795398443917.jpg';
import imgIvindo from '../assets/images/gabon_ivindo_falls_1795398444066.jpg';
import imgPongara from '../assets/images/gabon_pongara_estuary_1795398444241.jpg';
import imgCristal from '../assets/images/gabon_cristal_mountains_1795398446159.jpg';

export type GabonLandscapeId = 'mondah' | 'loango' | 'ivindo' | 'pongara' | 'cristal';
export type LandscapePreference = 'auto' | GabonLandscapeId;

export interface GabonLandscape {
  id: GabonLandscapeId;
  name: string;
  shortName: string;
  province: string;
  image: string;
  alt: string;
}

export const GABON_LANDSCAPES: GabonLandscape[] = [
  {
    id: 'loango',
    name: 'Lagune de Loango',
    shortName: 'Loango',
    province: 'Ogooué-Maritime',
    image: imgLoango,
    alt: 'Lagune côtière et savane du Parc National de Loango au Gabon',
  },
  {
    id: 'ivindo',
    name: 'Chutes de Kongou · Ivindo',
    shortName: 'Ivindo',
    province: 'Ogooué-Ivindo',
    image: imgIvindo,
    alt: 'Chutes de Kongou au cœur de la forêt équatoriale du Parc National de l’Ivindo',
  },
  {
    id: 'pongara',
    name: 'Estuaire de Pongara',
    shortName: 'Pongara',
    province: 'Estuaire · Pointe-Denis',
    image: imgPongara,
    alt: 'Mangrove et eaux calmes de la réserve de Pongara face à Libreville',
  },
  {
    id: 'cristal',
    name: 'Monts de Cristal',
    shortName: 'Cristal',
    province: 'Woleu-Ntem · Estuaire',
    image: imgCristal,
    alt: 'Crêtes brumeuses et forêt dense des Monts de Cristal au Gabon',
  },
  {
    id: 'mondah',
    name: 'Canopée de la Mondah',
    shortName: 'Mondah',
    province: 'Libreville Nord',
    image: imgMondah,
    alt: 'Canopée équatoriale dorée du Parc National de la Mondah',
  },
];

const LANDSCAPE_STORAGE_KEY = 'mangorema_landscape_pref_v1';

export function getStoredLandscapePreference(): LandscapePreference {
  try {
    const raw = localStorage.getItem(LANDSCAPE_STORAGE_KEY);
    if (
      raw === 'auto' ||
      raw === 'mondah' ||
      raw === 'loango' ||
      raw === 'ivindo' ||
      raw === 'pongara' ||
      raw === 'cristal'
    ) {
      return raw;
    }
    return 'auto';
  } catch {
    return 'auto';
  }
}

export function saveLandscapePreference(pref: LandscapePreference): void {
  try {
    localStorage.setItem(LANDSCAPE_STORAGE_KEY, pref);
  } catch {
    // ignore storage quota errors
  }
}

export function resolveLandscapeForContext(
  pref: LandscapePreference,
  workspaceMode: AppWorkspaceMode,
  activeTab: TabType
): GabonLandscape {
  let targetId: GabonLandscapeId;

  if (pref !== 'auto') {
    targetId = pref;
  } else if (workspaceMode === 'store') {
    targetId = 'pongara';
  } else if (workspaceMode === 'professional') {
    targetId = 'cristal';
  } else {
    switch (activeTab) {
      case 'accueil':
        targetId = 'loango';
        break;
      case 'explorer':
        targetId = 'cristal';
        break;
      case 'sorties':
        targetId = 'ivindo';
        break;
      case 'equipement':
      case 'transports':
        targetId = 'pongara';
        break;
      case 'safety':
        targetId = 'ivindo';
        break;
      case 'galerie':
        targetId = 'loango';
        break;
      case 'profil':
        targetId = 'mondah';
        break;
      default:
        targetId = 'loango';
    }
  }

  return GABON_LANDSCAPES.find((l) => l.id === targetId) || GABON_LANDSCAPES[0];
}
