/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeeklyEcoChallengeDefinition, VirtualEcoBadge } from '../types';

export interface WeekWindowInfo {
  weekKey: string;
  isoWeek: number;
  isoYear: number;
  startsAtMs: number;
  endsAtMs: number;
  label: string;
  progressPercent: number;
}

export interface CountdownParts {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpiringSoon: boolean;
  formattedCompact: string;
}

interface WeeklyChallengeTemplate {
  slug: string;
  eventTitle: string;
  parkName: string;
  challengeTitle: string;
  challengeRules: string;
  targetAction: string;
  ecoPoints: number;
  badge: VirtualEcoBadge;
}

export const WEEKLY_ECO_CHALLENGES_POOL: WeeklyChallengeTemplate[] = [
  {
    slug: 'plastique-mondah',
    eventTitle: 'Sprint Sentier Botanique Mondah',
    parkName: 'Parc National de la Mondah',
    challengeTitle: 'Mission 0 Plastique — Canopée Mondah',
    challengeRules:
      'Effectuez la boucle avec une gourde réutilisable et ramenez tout emballage trouvé le long des balises 1 à 10.',
    targetAction: '100 % contenants réutilisables',
    ecoPoints: 130,
    badge: {
      id: 'badge-hebdo-mondah-plastique',
      name: 'Vigie Mondah Hebdo',
      icon: '🌾',
      desc: 'Défi hebdomadaire zéro plastique validé dans la forêt de la Mondah',
      kind: 'expedition',
      requirementText: 'Défi hebdomadaire Mondah',
      ecoPointsReward: 130,
    },
  },
  {
    slug: 'littoral-pongara',
    eventTitle: 'Marche Littorale Pointe Denis',
    parkName: 'Parc National de Pongara',
    challengeTitle: 'Littoral Propre — Tortues Luth',
    challengeRules:
      'Collectez un sac de micro-plastiques et filets échoués entre Pointe Denis et le campement côtier.',
    targetAction: '1 sac de collecte littoral',
    ecoPoints: 170,
    badge: {
      id: 'badge-hebdo-pongara-littoral',
      name: 'Sentinelle des Plages',
      icon: '🐚',
      desc: 'Défi hebdomadaire de nettoyage du littoral à Pongara réussi',
      kind: 'expedition',
      requirementText: 'Défi hebdomadaire Pongara',
      ecoPointsReward: 170,
    },
  },
  {
    slug: 'eau-cristal',
    eventTitle: 'Randonnée Cascades Monts de Cristal',
    parkName: 'Parc National des Monts de Cristal',
    challengeTitle: 'Eaux Pures de Kinguélé',
    challengeRules:
      'Zéro savon ni lingette à proximité des cascades ; tri sélectif complet ramené jusqu’à Libreville.',
    targetAction: 'Protection des bassins',
    ecoPoints: 160,
    badge: {
      id: 'badge-hebdo-cristal-eau',
      name: 'Gardien des Sources',
      icon: '💦',
      desc: 'Défi hebdomadaire de protection des cascades des Monts de Cristal',
      kind: 'expedition',
      requirementText: 'Défi hebdomadaire Kinguélé',
      ecoPointsReward: 160,
    },
  },
  {
    slug: 'mangrove-akanda',
    eventTitle: 'Sortie Kayak Mangrove d’Akanda',
    parkName: "Parc National d'Akanda",
    challengeTitle: 'Mangrove Sans Trace — Akanda',
    challengeRules:
      'Explorez les chenaux d’Akanda en récupérant les bouteilles flottantes coincées dans les racines de palétuviers.',
    targetAction: 'Collecte en chenal mangrove',
    ecoPoints: 180,
    badge: {
      id: 'badge-hebdo-akanda-mangrove',
      name: 'Éclaireur d’Akanda',
      icon: '🦀',
      desc: 'Défi hebdomadaire zéro déchet accompli dans les mangroves d’Akanda',
      kind: 'expedition',
      requirementText: 'Défi hebdomadaire Akanda',
      ecoPointsReward: 180,
    },
  },
  {
    slug: 'megots-cap-esterias',
    eventTitle: 'Bivouac Cap Estérias',
    parkName: 'Estuaire & Cap Estérias',
    challengeTitle: 'Aire de Campement Zéro Mégot',
    challengeRules:
      'Laissez l’aire de bivouac plus propre qu’à votre arrivée et déposez les déchets organiques et secs aux bornes dédiées.',
    targetAction: 'Aire de bivouac 100 % nette',
    ecoPoints: 110,
    badge: {
      id: 'badge-hebdo-cap-bivouac',
      name: 'Bivouaqueur Exemplaire',
      icon: '⛺',
      desc: 'Défi hebdomadaire campement propre validé au Cap Estérias',
      kind: 'expedition',
      requirementText: 'Défi hebdomadaire Cap Estérias',
      ecoPointsReward: 110,
    },
  },
  {
    slug: 'ivindo-riviere',
    eventTitle: 'Piste Forestière de l’Ivindo',
    parkName: "Parc National de l'Ivindo (UNESCO)",
    challengeTitle: 'Autonomie Totale — Forêt Ivindo',
    challengeRules:
      'Transportez une boîte hermétique pour vos restes et conservez 100 % de vos piles et emballages jusqu’à Makokou.',
    targetAction: 'Autonomie zéro résidu',
    ecoPoints: 220,
    badge: {
      id: 'badge-hebdo-ivindo-autonomie',
      name: 'Pisteur UNESCO Propre',
      icon: '🦜',
      desc: 'Défi hebdomadaire d’autonomie sans trace relevé dans l’Ivindo',
      kind: 'expedition',
      requirementText: 'Défi hebdomadaire Ivindo',
      ecoPointsReward: 220,
    },
  },
  {
    slug: 'wonga-oiseaux',
    eventTitle: 'Affût Faune & Savane Wonga',
    parkName: 'Réserve de Wonga-Wongué',
    challengeTitle: 'Savane & Lagune Préservées',
    challengeRules:
      'Silence acoustique, zéro emballage alimentaire jeté et sac de tri complet remis à l’écogarde au retour.',
    targetAction: 'Sac de tri remis à l’ANPN',
    ecoPoints: 150,
    badge: {
      id: 'badge-hebdo-wonga-savane',
      name: 'Veilleur de Savane',
      icon: '🦒',
      desc: 'Défi hebdomadaire savane propre complété à Wonga-Wongué',
      kind: 'expedition',
      requirementText: 'Défi hebdomadaire Wonga-Wongué',
      ecoPointsReward: 150,
    },
  },
  {
    slug: 'loango-piste',
    eventTitle: 'Exploration Lagune Loango',
    parkName: 'Parc National de Loango',
    challengeTitle: 'Lagune Vivante — Zéro Rejet',
    challengeRules:
      'Protégez les zones humides de Loango en utilisant uniquement des produits biodégradables certifiés et sacs réutilisables.',
    targetAction: 'Équipement 100 % réutilisable',
    ecoPoints: 210,
    badge: {
      id: 'badge-hebdo-loango-lagune',
      name: 'Protecteur de Loango',
      icon: '🐊',
      desc: 'Défi hebdomadaire zéro rejet accompli dans la lagune de Loango',
      kind: 'expedition',
      requirementText: 'Défi hebdomadaire Loango',
      ecoPointsReward: 210,
    },
  },
  {
    slug: 'lope-crete',
    eventTitle: 'Ascension Mont Brazza — Lopé',
    parkName: 'Parc National de la Lopé (UNESCO)',
    challengeTitle: 'Crête Sans Trace — La Lopé',
    challengeRules:
      'Grimpée matinale sans aucun emballage individuel jetable ; chaque randonneur rapporte ses contenants au camp de base.',
    targetAction: 'Zéro emballage individuel',
    ecoPoints: 190,
    badge: {
      id: 'badge-hebdo-lope-mont',
      name: 'Alpiniste Sans Trace',
      icon: '⛰️',
      desc: 'Défi hebdomadaire d’ascension propre réussi au Parc de la Lopé',
      kind: 'expedition',
      requirementText: 'Défi hebdomadaire Lopé',
      ecoPointsReward: 190,
    },
  },
];

export const ALL_WEEKLY_VIRTUAL_BADGES: VirtualEcoBadge[] =
  WEEKLY_ECO_CHALLENGES_POOL.map((t) => t.badge);

/**
 * Computes Monday 00:00:00 -> Sunday 23:59:59.999 local week window & ISO week key
 */
export function getCurrentWeekWindow(now: Date = new Date()): WeekWindowInfo {
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // ISO week calculation
  const thursday = new Date(startOfWeek);
  thursday.setDate(startOfWeek.getDate() + 3);
  const isoYear = thursday.getFullYear();
  const jan4 = new Date(isoYear, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - (jan4Day - 1));
  firstMonday.setHours(0, 0, 0, 0);

  const isoWeek = Math.max(
    1,
    Math.round((startOfWeek.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
  );

  const weekKey = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;

  const fmtStart = startOfWeek.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
  const fmtEnd = endOfWeek.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const startsAtMs = startOfWeek.getTime();
  const endsAtMs = endOfWeek.getTime();
  const totalDuration = Math.max(1, endsAtMs - startsAtMs);
  const elapsed = Math.max(0, Math.min(totalDuration, now.getTime() - startsAtMs));
  const progressPercent = Math.round((elapsed / totalDuration) * 100);

  return {
    weekKey,
    isoWeek,
    isoYear,
    startsAtMs,
    endsAtMs,
    label: `Semaine ${isoWeek} · ${fmtStart} – ${fmtEnd}`,
    progressPercent,
  };
}

/**
 * Returns the 3 temporary ecological challenges active for the given week
 */
export function getActiveWeeklyChallenges(now: Date = new Date()): {
  weekWindow: WeekWindowInfo;
  challenges: WeeklyEcoChallengeDefinition[];
} {
  const weekWindow = getCurrentWeekWindow(now);
  const poolSize = WEEKLY_ECO_CHALLENGES_POOL.length;
  const groupCount = Math.floor(poolSize / 3);
  const weekGroupIndex = (weekWindow.isoYear * 53 + weekWindow.isoWeek) % groupCount;
  const startIndex = weekGroupIndex * 3;

  const selectedTemplates = [
    WEEKLY_ECO_CHALLENGES_POOL[startIndex % poolSize],
    WEEKLY_ECO_CHALLENGES_POOL[(startIndex + 1) % poolSize],
    WEEKLY_ECO_CHALLENGES_POOL[(startIndex + 2) % poolSize],
  ];

  const challenges: WeeklyEcoChallengeDefinition[] = selectedTemplates.map((tpl) => {
    const safeWeekKey = weekWindow.weekKey.replace(/[^a-zA-Z0-9_-]/g, '-');
    return {
      challengeId: `eco-wk-${safeWeekKey}-${tpl.slug}`,
      eventId: `wk-${safeWeekKey}-${tpl.slug}`,
      eventTitle: tpl.eventTitle,
      parkName: tpl.parkName,
      challengeTitle: tpl.challengeTitle,
      challengeRules: tpl.challengeRules,
      targetAction: tpl.targetAction,
      ecoPoints: tpl.ecoPoints,
      badge: tpl.badge,
      weekKey: weekWindow.weekKey,
      weekLabel: weekWindow.label,
      endsAtMs: weekWindow.endsAtMs,
    };
  });

  return { weekWindow, challenges };
}

/**
 * Computes remaining countdown components until weekly renewal
 */
export function formatCountdownParts(
  endsAtMs: number,
  nowMs: number = Date.now()
): CountdownParts {
  const totalMs = Math.max(0, endsAtMs - nowMs);
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isExpiringSoon = totalMs > 0 && totalMs <= 24 * 60 * 60 * 1000;

  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedCompact =
    days > 0
      ? `${days}j ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
      : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

  return {
    totalMs,
    days,
    hours,
    minutes,
    seconds,
    isExpiringSoon,
    formattedCompact,
  };
}
