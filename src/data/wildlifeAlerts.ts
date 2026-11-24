/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WildlifeSeasonalAlert } from '../types';

export const WILDLIFE_SEASONAL_ALERTS: WildlifeSeasonalAlert[] = [
  {
    id: 'wl-tortues-luth',
    species: 'Tortue Luth (Dermochelys coriacea)',
    title: 'Saison des pontes des Tortues Luth sur les plages',
    category: 'MARINE',
    parkOrZone: 'Pongara · Nyonié · Mayumba',
    activeMonths: [11, 12, 1, 2, 3],
    seasonLabel: 'Novembre – Mars',
    summary:
      'Des centaines de femelles montent pondre de nuit sur les plages sableuses du Gabon, l’un des plus importants sites de nidification au monde.',
    observationRule:
      'Aucun flash photo, lampe frontale à filtre rouge obligatoire, ne jamais toucher la carapace ni bloquer le retour vers l’océan.',
    safetyDistance: 'Distance min. 10 m derrière la tortue',
    bestWindow: '20h30 – 03h00 (marée descendante)',
    severity: 'protection',
    icon: '🐢',
  },
  {
    id: 'wl-baleines-bosse',
    species: 'Baleine à Bosse (Megaptera novaeangliae)',
    title: 'Passage & mise bas des Baleines à bosse au large',
    category: 'MARINE',
    parkOrZone: 'Large Cap Estérias · Pongara · Port-Gentil · Mayumba',
    activeMonths: [7, 8, 9, 10],
    seasonLabel: 'Juillet – Octobre',
    summary:
      'Remontée depuis l’Antarctique vers les eaux chaudes côtières gabonaises pour la reproduction, les sauts spectaculaires et le nourrissage des baleineaux.',
    observationRule:
      'Navigation d’approche encadrée ANPN, moteur au ralenti, jamais de poursuite frontale ni d’encerclement du couple mère-baleineau.',
    safetyDistance: 'Distance bateau min. 100 m (300 m si baleineau)',
    bestWindow: '07h00 – 11h30 & 15h00 – 17h30',
    severity: 'info',
    icon: '🐋',
  },
  {
    id: 'wl-elephants-foret',
    species: 'Éléphant de Forêt (Loxodonta cyclotis)',
    title: 'Forte présence des Éléphants de forêt (baïs & plages)',
    category: 'FAUNE',
    parkOrZone: 'Loango · Pongara · Lopé · Mondah',
    activeMonths: [1, 2, 3, 9, 10, 11, 12],
    seasonLabel: 'Septembre – Mars (pic fructification)',
    summary:
      'Déplacements fréquents le long des sentiers forestiers, salines et plages côtières attirés par les mangues sauvages et fruits de saison des pluies.',
    observationRule:
      'Rester strictement en file derrière l’écoguide ANPN, parler à voix basse, couper les sonneries et ne jamais s’interposer entre femelle et éléphanteau.',
    safetyDistance: 'Distance sécurité min. 30 m (vent défavorable : 50 m)',
    bestWindow: '06h00 – 09h30 & 16h00 – 18h15',
    severity: 'vigilance',
    icon: '🐘',
  },
  {
    id: 'wl-oiseaux-migrateurs',
    species: 'Picatharte, Pélicans & Calaos géants',
    title: 'Pic d’observation avifaune & oiseaux migrateurs',
    category: 'OISEAUX',
    parkOrZone: 'Akanda · Monts de Cristal · Pongara · Lopé',
    activeMonths: [10, 11, 12, 1, 2],
    seasonLabel: 'Octobre – Février',
    summary:
      'Arrivée des limicoles paléarctiques dans les mangroves d’Akanda et forte activité vocale des calaos et picathartes à cou gris sous couvert rocheux.',
    observationRule:
      'Équipement aux couleurs neutres (kaki/vert), jumelles recommandées, silence absolu près des sites de nidification sur parois rocheuses.',
    safetyDistance: 'Distance nidification min. 15 m',
    bestWindow: '05h45 – 09h00 (lever du soleil)',
    severity: 'info',
    icon: '🦜',
  },
  {
    id: 'wl-orchidees-monts',
    species: 'Orchidées épiphytes & Bégonias forestiers',
    title: 'Floraison des Orchidées & flore des forêts de brouillard',
    category: 'FLORE',
    parkOrZone: 'Monts de Cristal · Kinguélé · Belinga',
    activeMonths: [9, 10, 11, 12],
    seasonLabel: 'Septembre – Décembre',
    summary:
      'L’humidité élevée de la petite saison des pluies déclenche la floraison de plus de 80 espèces d’orchidées sauvages sur les troncs moussants.',
    observationRule:
      'Observation photographique uniquement : aucune cueillette ni prélèvement de rhizomes. Rester sur les caillebotis et sentiers balisés.',
    safetyDistance: 'Observation sans contact (0 prélèvement)',
    bestWindow: '08h00 – 14h00 (brume matinale dissipée)',
    severity: 'protection',
    icon: '🌺',
  },
  {
    id: 'wl-gorilles-mandrills',
    species: 'Gorilles des Plaines & Mandrills',
    title: 'Rassemblages de Mandrills & suivi Gorilles en lisière',
    category: 'FAUNE',
    parkOrZone: 'Lopé · Moukalaba-Doudou · Ivindo',
    activeMonths: [5, 6, 7, 8, 9, 11, 12],
    seasonLabel: 'Mai – Sept & Nov – Déc',
    summary:
      'Regroupements importants de mandrills dans les galeries forestières de la Lopé et sorties de familles de gorilles habituées en clairière.',
    observationRule:
      'Port du masque chirurgical FFP2/chirurgical obligatoire pour protéger les grands singes de tout virus humain. Groupe limité à 4 visiteurs.',
    safetyDistance: 'Distance stricte min. 7 m',
    bestWindow: '06h30 – 11h00',
    severity: 'protection',
    icon: '🦍',
  },
];

export interface SeasonalAlertStatus {
  state: 'ACTIVE' | 'UPCOMING' | 'OFF_SEASON';
  label: string;
  helperText: string;
}

const MONTH_NAMES_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export function getSeasonalAlertStatus(
  alert: WildlifeSeasonalAlert,
  now: Date = new Date()
): SeasonalAlertStatus {
  const currentMonth = now.getMonth() + 1; // 1..12
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

  if (alert.activeMonths.includes(currentMonth)) {
    return {
      state: 'ACTIVE',
      label: `Saison active · ${MONTH_NAMES_FR[currentMonth - 1]}`,
      helperText: 'Fenêtre d’observation optimale en cours ce mois-ci.',
    };
  }

  if (alert.activeMonths.includes(nextMonth)) {
    return {
      state: 'UPCOMING',
      label: `Démarre en ${MONTH_NAMES_FR[nextMonth - 1]}`,
      helperText: 'Préparez votre sortie pour l’ouverture prochaine de la saison.',
    };
  }

  return {
    state: 'OFF_SEASON',
    label: 'Veille hors pic',
    helperText: `Période principale : ${alert.seasonLabel}.`,
  };
}
