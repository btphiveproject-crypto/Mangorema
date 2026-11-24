/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import imgMondah from '../assets/images/hero_mondah_canopy_1795342713775.jpg';
import imgLoango from '../assets/images/gabon_loango_lagoon_1795398443917.jpg';
import imgIvindo from '../assets/images/gabon_ivindo_falls_1795398444066.jpg';
import imgPongara from '../assets/images/gabon_pongara_estuary_1795398444241.jpg';
import imgCristal from '../assets/images/gabon_cristal_mountains_1795398446159.jpg';

export interface GabonSiteDefinition {
  id: string;
  name: string;
  shortName: string;
  province: string;
  highlights: string;
  coverImage: string;
}

export const GABON_SITES_CATALOG: GabonSiteDefinition[] = [
  {
    id: 'mondah',
    name: 'Parc National de la Mondah & Cap Estérias',
    shortName: 'Mondah',
    province: 'Estuaire · Libreville Nord',
    highlights: 'Sentiers de canopée, mangrovier littoral et clairières côtières.',
    coverImage: imgMondah,
  },
  {
    id: 'ivindo',
    name: "Parc National de l'Ivindo",
    shortName: 'Ivindo',
    province: 'Ogooué-Ivindo · Makokou',
    highlights: 'Chutes de Kongou, chutes de Mingouli et baï de Langoué.',
    coverImage: imgIvindo,
  },
  {
    id: 'pongara',
    name: 'Parc National de Pongara & Pointe-Denis',
    shortName: 'Pongara',
    province: 'Estuaire · Rive Sud',
    highlights: 'Ponte des tortues luths, plage sauvage et traversée maritime.',
    coverImage: imgPongara,
  },
  {
    id: 'cristal',
    name: 'Parc National des Monts de Cristal',
    shortName: 'Monts de Cristal',
    province: 'Estuaire · Woleu-Ntem',
    highlights: 'Cascades de Kinguélé, forêt de nuage et orchidées endémiques.',
    coverImage: imgCristal,
  },
  {
    id: 'loango',
    name: 'Parc National de Loango',
    shortName: 'Loango',
    province: 'Ogooué-Maritime',
    highlights: 'Éléphants et hippopotames sur la plage, lagune d’Iguéla.',
    coverImage: imgLoango,
  },
  {
    id: 'lope',
    name: 'Parc National de la Lopé',
    shortName: 'La Lopé',
    province: 'Ogooué-Ivindo · UNESCO',
    highlights: 'Savanes millénaires, Mont Brazza et grands rassemblements de mandrills.',
    coverImage: imgCristal,
  },
  {
    id: 'wonga',
    name: 'Réserve Présidentielle de Wonga-Wongué',
    shortName: 'Wonga-Wongué',
    province: 'Estuaire · Moyen-Ogooué',
    highlights: 'Canyons d’érosion, savanes intérieures et buffles de forêt.',
    coverImage: imgLoango,
  },
  {
    id: 'akanda',
    name: "Parc National d'Akanda",
    shortName: 'Akanda',
    province: 'Estuaire · Nord Libreville',
    highlights: 'Zones humides Ramsar, ballets d’oiseaux migrateurs et mangroves.',
    coverImage: imgPongara,
  },
  {
    id: 'mayumba',
    name: 'Parc National de Mayumba',
    shortName: 'Mayumba',
    province: 'Nyanga · Extrême Sud',
    highlights: 'Cordons dunaires de 60 km, baleines à bosse et sanctuaire marin.',
    coverImage: imgLoango,
  },
];

export function resolveGabonSiteByParkNameOrId(input?: string): GabonSiteDefinition {
  const q = (input || '').trim().toLowerCase();
  if (!q || q === 'all' || q === 'tous') {
    return GABON_SITES_CATALOG[0];
  }
  const exactId = GABON_SITES_CATALOG.find((s) => s.id === q);
  if (exactId) return exactId;

  const fuzzy = GABON_SITES_CATALOG.find(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      q.includes(s.id) ||
      s.shortName.toLowerCase().includes(q) ||
      q.includes(s.shortName.toLowerCase())
  );
  return fuzzy || GABON_SITES_CATALOG[0];
}
