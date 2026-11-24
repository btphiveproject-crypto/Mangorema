/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Booking, ExpeditionEvent, MarketplaceOrder } from '../types';

export interface UnifiedPassItem {
  id: string;
  source: 'legacy_booking' | 'marketplace_order';
  booking: Booking;
  order?: MarketplaceOrder;
}

function mapOrderMethodToBookingMethod(
  method: MarketplaceOrder['paymentMethod']
): Booking['paymentMethod'] {
  if (method === 'MOOV' || method === 'GHETTOPAY' || method === 'AIRTEL') {
    return method;
  }
  return 'AIRTEL';
}

export function mergeUnifiedPasses(
  bookings: Booking[],
  marketplaceOrders: MarketplaceOrder[],
  events: ExpeditionEvent[]
): UnifiedPassItem[] {
  const passes: UnifiedPassItem[] = [];
  const seenKeys = new Set<string>();

  for (const bk of bookings) {
    seenKeys.add(`bk:${bk.refNumber}`);
    passes.push({
      id: bk.id,
      source: 'legacy_booking',
      booking: bk,
    });
  }

  for (const ord of marketplaceOrders) {
    if (ord.paymentStatus === 'FAILED' || ord.paymentStatus === 'REFUNDED') {
      continue;
    }

    const serviceItems = ord.items.filter(
      (item) => item.kind === 'activity' || item.kind === 'shuttle' || item.kind === 'rental'
    );
    if (serviceItems.length === 0) continue;

    for (const item of serviceItems) {
      const passRef =
        serviceItems.length === 1 ? ord.refNumber : `${ord.refNumber}-${item.kind.toUpperCase().slice(0, 3)}`;
      if (seenKeys.has(`bk:${passRef}`)) continue;
      seenKeys.add(`bk:${passRef}`);

      const matchedEvent =
        item.kind === 'activity' ? events.find((e) => e.id === item.refId) : undefined;
      const lineTotal =
        item.kind === 'rental'
          ? item.unitPrice * (item.rentalDays || 1) * item.quantity
          : item.unitPrice * item.quantity;

      const syntheticBooking: Booking = {
        id: `ordpass-${ord.id}-${item.cartItemId}`,
        refNumber: passRef,
        eventId: matchedEvent?.id || item.refId,
        eventTitle:
          item.quantity > 1 && item.kind === 'activity'
            ? `${item.title} (${item.quantity} pers.)`
            : item.title,
        eventDate:
          item.meta?.eventDate ||
          matchedEvent?.date ||
          (item.startDate ? `Dès le ${item.startDate} (${item.rentalDays || 1}j)` : ord.timestamp),
        location:
          item.pickupLocation ||
          item.meta?.parkName ||
          matchedEvent?.location ||
          ord.deliveryAddress ||
          'Grand Libreville · Gabon',
        shuttleIncluded: item.kind === 'shuttle' || Boolean(item.meta?.shuttleIncluded),
        shuttleDetail: item.kind === 'shuttle' ? item.subtitle : undefined,
        tentIncluded: Boolean(item.meta?.tentIncluded),
        guideIncluded: Boolean(item.meta?.guideIncluded),
        totalAmount: lineTotal,
        paymentMethod: mapOrderMethodToBookingMethod(ord.paymentMethod),
        payerPhone: ord.payerLabel,
        timestamp: ord.timestamp,
        status: ord.fulfillmentStatus === 'COMPLETED' ? 'USED' : 'CONFIRMED',
        qrCodeSeed: `MANGOREMA-UNIFIED:${ord.refNumber}:${item.refId}:${ord.receiptHash}`,
      };

      passes.push({
        id: syntheticBooking.id,
        source: 'marketplace_order',
        booking: syntheticBooking,
        order: ord,
      });
    }
  }

  return passes;
}
