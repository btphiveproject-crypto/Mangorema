/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EcoChallengeDefinition,
  EcoChallengeCompletion,
  VirtualEcoBadge,
} from '../types';

export const ECO_CHALLENGES_CATALOG: EcoChallengeDefinition[] = [
  {
    challengeId: 'eco-evt-1',
    eventId: 'evt-1',
    eventTitle: 'Bivouac & Canopée Mondah',
    parkName: 'Parc National de la Mondah',
    challengeTitle: 'Bivouac Sans Trace — Mondah',
    challengeRules:
      'Ramenez 100 % des emballages, lingettes, piles et mégots au point de tri de Cap Estérias.',
    ecoPoints: 120,
    badge: {
      id: 'badge-zero-mondah',
      name: 'Gardien de la Mondah',
      icon: '🌿',
      desc: 'Expédition Mondah validée sans aucun déchet abandonné',
      kind: 'expedition',
      requirementText: 'Réaliser Bivouac & Canopée Mondah sans déchets',
      ecoPointsReward: 120,
    },
  },
  {
    challengeId: 'eco-evt-2',
    eventId: 'evt-2',
    eventTitle: 'Expédition Chutes de Djidji',
    parkName: "Parc National de l'Ivindo (UNESCO)",
    challengeTitle: 'Rivière & Forêt Vierge — Ivindo',
    challengeRules:
      'Aucun savon chimique dans les affluents ni reste alimentaire à proximité des chutes de Djidji.',
    ecoPoints: 200,
    badge: {
      id: 'badge-zero-ivindo',
      name: "Sentinelle de l'Ivindo",
      icon: '💧',
      desc: 'Trek des chutes de Djidji réalisé en autonomie zéro déchet',
      kind: 'expedition',
      requirementText: 'Réaliser Expédition Chutes de Djidji sans déchets',
      ecoPointsReward: 200,
    },
  },
  {
    challengeId: 'eco-evt-3',
    eventId: 'evt-3',
    eventTitle: 'Safari Côtier & Bivouac Nyonié',
    parkName: 'Parc National de Pongara',
    challengeTitle: 'Plage Propre & Tortues Luth',
    challengeRules:
      'Zéro plastique abandonné sur le littoral de Nyonié pour protéger les sites de ponte des tortues.',
    ecoPoints: 150,
    badge: {
      id: 'badge-zero-pongara',
      name: 'Protecteur Tortues Luth',
      icon: '🐢',
      desc: 'Bivouac côtier à Nyonié certifié zéro plastique marin',
      kind: 'expedition',
      requirementText: 'Réaliser Safari Côtier Nyonié sans déchets',
      ecoPointsReward: 150,
    },
  },
  {
    challengeId: 'eco-evt-4',
    eventId: 'evt-4',
    eventTitle: 'Restauration Mangrove & Lagune Wonga',
    parkName: 'Réserve de Wonga-Wongué',
    challengeTitle: 'Mangrove Zéro Plastique',
    challengeRules:
      'Reboisement des palétuviers et rapatriement complet des déchets marins collectés sur la lagune.',
    ecoPoints: 180,
    badge: {
      id: 'badge-zero-wonga',
      name: 'Allié des Palétuviers',
      icon: '🌱',
      desc: 'Mission mangrove Wonga-Wongué accomplie sans laisser de trace',
      kind: 'expedition',
      requirementText: 'Réaliser Restauration Mangrove Wonga sans déchets',
      ecoPointsReward: 180,
    },
  },
  {
    challengeId: 'eco-evt-5',
    eventId: 'evt-5',
    eventTitle: 'Trek des Crêtes & Kinguélé',
    parkName: 'Parc National des Monts de Cristal',
    challengeTitle: 'Crêtes & Orchidées Préservées',
    challengeRules:
      'Descente complète des contenants réutilisables et respect absolu des stations d’orchidées rares.',
    ecoPoints: 160,
    badge: {
      id: 'badge-zero-cristal',
      name: 'Veilleur Monts de Cristal',
      icon: '🏔️',
      desc: 'Ascension de Kinguélé validée zéro déchet en altitude',
      kind: 'expedition',
      requirementText: 'Réaliser Trek des Crêtes Kinguélé sans déchets',
      ecoPointsReward: 160,
    },
  },
];

export const MILESTONE_ECO_BADGES: Array<VirtualEcoBadge & { requiredCount: number }> = [
  {
    id: 'badge-eco-pioneer',
    name: 'Débutant Zéro Déchet',
    icon: '♻️',
    desc: 'Première expédition certifiée sans aucun déchet laissé en forêt',
    kind: 'milestone',
    requirementText: '1 expédition sans déchets',
    requiredCount: 1,
  },
  {
    id: 'badge-eco-ambassador',
    name: 'Ambassadeur Forêt Propre',
    icon: '🏆',
    desc: 'Engagement régulier sur au moins 3 expéditions gabonaises',
    kind: 'milestone',
    requirementText: '3 expéditions sans déchets',
    requiredCount: 3,
  },
  {
    id: 'badge-eco-master',
    name: 'Maître ANPN Sans Trace',
    icon: '👑',
    desc: 'Tous les défis écologiques des 5 parcs validés sans trace',
    kind: 'milestone',
    requirementText: '5 expéditions sans déchets',
    requiredCount: 5,
  },
];

export const ALL_VIRTUAL_ECO_BADGES: VirtualEcoBadge[] = [
  ...ECO_CHALLENGES_CATALOG.map((c) => c.badge),
  ...MILESTONE_ECO_BADGES,
];

export function getEcoChallengeByEventId(eventId: string): EcoChallengeDefinition | undefined {
  return ECO_CHALLENGES_CATALOG.find((c) => c.eventId === eventId);
}

export function computeEcoProgress(completions: EcoChallengeCompletion[]): {
  ecoPoints: number;
  zeroWasteExpeditionsCount: number;
  unlockedBadgeIds: string[];
  currentRankLabel: string;
} {
  const uniqueEventIds = new Set(completions.map((c) => c.eventId));
  const zeroWasteExpeditionsCount = uniqueEventIds.size;

  const ecoPoints = completions.reduce((sum, item) => sum + (Number(item.ecoPoints) || 0), 0);

  const badgeIdSet = new Set<string>();
  for (const item of completions) {
    if (item.badgeId) {
      badgeIdSet.add(item.badgeId);
    }
  }
  for (const milestone of MILESTONE_ECO_BADGES) {
    if (zeroWasteExpeditionsCount >= milestone.requiredCount) {
      badgeIdSet.add(milestone.id);
    }
  }

  let currentRankLabel = 'Explorateur Engagé';
  if (zeroWasteExpeditionsCount >= 5) {
    currentRankLabel = 'Maître ANPN Sans Trace';
  } else if (zeroWasteExpeditionsCount >= 3) {
    currentRankLabel = 'Ambassadeur Forêt Propre';
  } else if (zeroWasteExpeditionsCount >= 1) {
    currentRankLabel = 'Sentinelle Zéro Déchet';
  }

  return {
    ecoPoints,
    zeroWasteExpeditionsCount,
    unlockedBadgeIds: Array.from(badgeIdSet).slice(0, 30),
    currentRankLabel,
  };
}
