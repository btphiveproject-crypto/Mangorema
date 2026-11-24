/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GabonDeliveryZone {
  id: string;
  label: string;
  shortLabel: string;
  fee: number;
  etaLabel: string;
  sampleLandmark: string;
}

export const DEFAULT_GABON_ZONE_ID = 'lbv_nord';

export const GABON_DELIVERY_ZONES: GabonDeliveryZone[] = [
  {
    id: 'lbv_centre',
    label: 'Libreville Centre · Glass / Louis / Batterie 4',
    shortLabel: 'Libreville Centre',
    fee: 2000,
    etaLabel: '45 min – 1h30',
    sampleLandmark: 'Bord de mer, près Station PetroGabon / Rond-Point',
  },
  {
    id: 'lbv_nord',
    label: 'Libreville Nord · Charbonnages / Okala / Sablière',
    shortLabel: 'Charbonnages / Okala',
    fee: 2500,
    etaLabel: '1h – 2h',
    sampleLandmark: 'Charbonnages, face Pharmacie / Carrefour Okala',
  },
  {
    id: 'owendo',
    label: 'Owendo · Port / Nzeng-Ayong / PK5–PK12',
    shortLabel: 'Owendo / Nzeng',
    fee: 3000,
    etaLabel: '1h30 – 2h30',
    sampleLandmark: 'Carrefour SNI Owendo / Gare Octra',
  },
  {
    id: 'akanda',
    label: 'Akanda · Angondjé / Malibé / Cap Estérias',
    shortLabel: 'Akanda / Cap',
    fee: 3500,
    etaLabel: '1h30 – 3h',
    sampleLandmark: 'Stade d’Angondjé / Entrée Cap Estérias',
  },
  {
    id: 'ntoum',
    label: 'Ntoum / Kango (Corridor Monts de Cristal)',
    shortLabel: 'Ntoum / Kango',
    fee: 5000,
    etaLabel: 'Sous 24h',
    sampleLandmark: 'Marché de Ntoum / Carrefour Kango',
  },
  {
    id: 'province',
    label: 'Port-Gentil / Franceville / Lambaréné (Colis Express)',
    shortLabel: 'Provinces Gabon',
    fee: 7500,
    etaLabel: '24h – 48h',
    sampleLandmark: 'Agence maritime Port-Gentil / Gare Setrag',
  },
];

export function resolveDeliveryZone(zoneId?: string | null): GabonDeliveryZone {
  if (!zoneId) {
    return GABON_DELIVERY_ZONES[1];
  }
  return GABON_DELIVERY_ZONES.find((z) => z.id === zoneId) || GABON_DELIVERY_ZONES[1];
}

export function computeMarketplaceDeliveryFee(params: {
  requiresDelivery: boolean;
  deliveryZoneId?: string | null;
  storeDeliveryFees?: number[];
}): number {
  if (!params.requiresDelivery) return 0;
  const zone = resolveDeliveryZone(params.deliveryZoneId);
  const validStoreFees = (params.storeDeliveryFees || []).filter(
    (fee) => typeof fee === 'number' && Number.isFinite(fee) && fee >= 0 && fee <= 100000
  );
  if (validStoreFees.length > 0) {
    // Use the highest store-configured base fee only when greater than 0, combined cleanly with zone distance surcharge if province/outskirts
    const storeBase = Math.max(...validStoreFees);
    if (zone.id === 'ntoum' || zone.id === 'province') {
      return Math.max(storeBase, zone.fee);
    }
    return storeBase;
  }
  return zone.fee;
}
