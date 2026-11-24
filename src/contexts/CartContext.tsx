/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CartItemKind, ExpeditionEvent, RentalItem, ShuttleService, StoreProduct, UnifiedCartItem } from '../types';
import { PLATFORM_COMMISSION_RATE } from '../data/marketplaceData';
import {
  DEFAULT_GABON_ZONE_ID,
  GabonDeliveryZone,
  computeMarketplaceDeliveryFee,
  resolveDeliveryZone,
} from '../data/gabonZones';

const CART_STORAGE_KEY = 'mangorema_unified_cart_v1';
const DELIVERY_ZONE_STORAGE_KEY = 'mangorema_delivery_zone_v1';

interface CartContextValue {
  items: UnifiedCartItem[];
  totalCount: number;
  itemsSubtotal: number;
  deliveryFee: number;
  deliveryZoneId: string;
  setDeliveryZoneId: (zoneId: string) => void;
  selectedDeliveryZone: GabonDeliveryZone;
  depositTotal: number;
  platformCommission: number;
  grandTotal: number;
  hasDeliveryItem: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (item: UnifiedCartItem) => void;
  addEventToCart: (
    event: ExpeditionEvent,
    options?: {
      participants?: number;
      shuttleIncluded?: boolean;
      tentIncluded?: boolean;
      guideIncluded?: boolean;
      mealPackIncluded?: boolean;
    }
  ) => void;
  addProductToCart: (
    product: StoreProduct,
    quantity?: number,
    fulfillmentMode?: 'PICKUP' | 'DELIVERY'
  ) => void;
  addRentalToCart: (
    rental: RentalItem,
    options: { days: number; quantity: number; startDate: string; fulfillmentMode?: 'PICKUP' | 'DELIVERY' }
  ) => void;
  addShuttleToCart: (shuttle: ShuttleService, seats?: number) => void;
  updateItemQuantity: (cartItemId: string, quantity: number) => void;
  toggleItemFulfillment: (cartItemId: string, mode: 'PICKUP' | 'DELIVERY') => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function computeItemLineTotal(item: UnifiedCartItem): number {
  const qty = Math.max(1, item.quantity);
  if (item.kind === 'rental') {
    const days = Math.max(1, item.rentalDays || 1);
    return item.unitPrice * days * qty;
  }
  if (item.kind === 'activity') {
    let addons = 0;
    if (item.meta?.shuttleIncluded) addons += 5000;
    if (item.meta?.tentIncluded) addons += 3000;
    if (item.meta?.guideIncluded) addons += 2500;
    if (item.meta?.mealPackIncluded) addons += 4000;
    return (item.unitPrice + addons) * qty;
  }
  return item.unitPrice * qty;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<UnifiedCartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as UnifiedCartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [deliveryZoneId, setDeliveryZoneIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(DELIVERY_ZONE_STORAGE_KEY) || DEFAULT_GABON_ZONE_ID;
    } catch {
      return DEFAULT_GABON_ZONE_ID;
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  const setDeliveryZoneId = useCallback((zoneId: string) => {
    const resolved = resolveDeliveryZone(zoneId);
    setDeliveryZoneIdState(resolved.id);
    try {
      localStorage.setItem(DELIVERY_ZONE_STORAGE_KEY, resolved.id);
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors
    }
  }, [items]);

  const addItem = useCallback((incoming: UnifiedCartItem) => {
    setItems((prev) => {
      const matchIdx = prev.findIndex(
        (cur) =>
          cur.refId === incoming.refId &&
          cur.kind === incoming.kind &&
          cur.fulfillmentMode === incoming.fulfillmentMode &&
          cur.startDate === incoming.startDate &&
          cur.rentalDays === incoming.rentalDays &&
          JSON.stringify(cur.meta || {}) === JSON.stringify(incoming.meta || {})
      );
      if (matchIdx >= 0) {
        return prev.map((cur, idx) =>
          idx === matchIdx ? { ...cur, quantity: Math.min(20, cur.quantity + incoming.quantity) } : cur
        );
      }
      return [incoming, ...prev];
    });
  }, []);

  const addEventToCart = useCallback(
    (
      event: ExpeditionEvent,
      options?: {
        participants?: number;
        shuttleIncluded?: boolean;
        tentIncluded?: boolean;
        guideIncluded?: boolean;
        mealPackIncluded?: boolean;
      }
    ) => {
      const participants = Math.max(1, Math.min(20, options?.participants || 1));
      const addonsList: string[] = [];
      if (options?.shuttleIncluded) addonsList.push('Navette');
      if (options?.tentIncluded) addonsList.push('Tente');
      if (options?.guideIncluded) addonsList.push('Guide');
      if (options?.mealPackIncluded) addonsList.push('Vivres');

      addItem({
        cartItemId: `cart-evt-${event.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        kind: 'activity' as CartItemKind,
        refId: event.id,
        title: event.title,
        subtitle: `${event.parkName} · ${event.date}${addonsList.length > 0 ? ` (${addonsList.join('+')})` : ''}`,
        unitPrice: event.basePrice,
        quantity: participants,
        fulfillmentMode: 'IN_PERSON',
        pickupLocation: event.location,
        meta: {
          parkName: event.parkName,
          eventDate: event.date,
          participants,
          shuttleIncluded: Boolean(options?.shuttleIncluded),
          tentIncluded: Boolean(options?.tentIncluded),
          guideIncluded: Boolean(options?.guideIncluded),
          mealPackIncluded: Boolean(options?.mealPackIncluded),
        },
      });
    },
    [addItem]
  );

  const addProductToCart = useCallback(
    (product: StoreProduct, quantity = 1, fulfillmentMode: 'PICKUP' | 'DELIVERY' = 'PICKUP') => {
      addItem({
        cartItemId: `cart-prod-${product.id}-${Date.now()}`,
        kind: 'product',
        refId: product.id,
        title: product.name,
        subtitle: `${product.brand} · ${product.weightOrSize}`,
        unitPrice: product.price,
        quantity: Math.max(1, Math.min(product.stock || 20, quantity)),
        fulfillmentMode,
        pickupLocation: product.pickupLocation,
      });
    },
    [addItem]
  );

  const addRentalToCart = useCallback(
    (
      rental: RentalItem,
      options: { days: number; quantity: number; startDate: string; fulfillmentMode?: 'PICKUP' | 'DELIVERY' }
    ) => {
      const days = Math.max(1, Math.min(14, options.days));
      const qty = Math.max(1, Math.min(rental.availableQuantity || 10, options.quantity));
      addItem({
        cartItemId: `cart-rent-${rental.id}-${Date.now()}`,
        kind: 'rental',
        refId: rental.id,
        title: `Location : ${rental.name}`,
        subtitle: `${days} jour(s) dès le ${options.startDate} · ${rental.partnerName}`,
        unitPrice: rental.pricePerDay,
        quantity: qty,
        rentalDays: days,
        startDate: options.startDate,
        depositUnitAmount: rental.depositAmount,
        fulfillmentMode: options.fulfillmentMode || 'PICKUP',
        pickupLocation: rental.pickupLocation,
      });
    },
    [addItem]
  );

  const addShuttleToCart = useCallback(
    (shuttle: ShuttleService, seats = 1) => {
      addItem({
        cartItemId: `cart-shut-${shuttle.id}-${Date.now()}`,
        kind: 'shuttle',
        refId: shuttle.id,
        title: `Navette ${shuttle.type} → ${shuttle.destination}`,
        subtitle: `Départ ${shuttle.departureTime} · ${shuttle.departurePoint}`,
        unitPrice: shuttle.price,
        quantity: Math.max(1, Math.min(10, seats)),
        fulfillmentMode: 'IN_PERSON',
        pickupLocation: shuttle.departurePoint,
      });
    },
    [addItem]
  );

  const updateItemQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: Math.min(20, quantity) } : item
      )
    );
  }, []);

  const toggleItemFulfillment = useCallback((cartItemId: string, mode: 'PICKUP' | 'DELIVERY') => {
    setItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId && item.kind !== 'activity' && item.kind !== 'shuttle'
          ? { ...item, fulfillmentMode: mode }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const selectedDeliveryZone = useMemo(() => resolveDeliveryZone(deliveryZoneId), [deliveryZoneId]);

  const totals = useMemo(() => {
    let itemsSubtotal = 0;
    let depositTotal = 0;
    let totalCount = 0;
    let hasDeliveryItem = false;

    for (const item of items) {
      totalCount += item.quantity;
      itemsSubtotal += computeItemLineTotal(item);
      if (item.kind === 'rental' && item.depositUnitAmount) {
        depositTotal += item.depositUnitAmount * item.quantity;
      }
      if (item.fulfillmentMode === 'DELIVERY') {
        hasDeliveryItem = true;
      }
    }

    const deliveryFee = computeMarketplaceDeliveryFee({
      requiresDelivery: hasDeliveryItem,
      deliveryZoneId: selectedDeliveryZone.id,
    });
    const platformCommission = Math.round(itemsSubtotal * PLATFORM_COMMISSION_RATE);
    const grandTotal = itemsSubtotal + deliveryFee;

    return {
      totalCount,
      itemsSubtotal,
      deliveryFee,
      depositTotal,
      platformCommission,
      grandTotal,
      hasDeliveryItem,
    };
  }, [items, selectedDeliveryZone.id]);

  const value: CartContextValue = {
    items,
    ...totals,
    deliveryZoneId: selectedDeliveryZone.id,
    setDeliveryZoneId,
    selectedDeliveryZone,
    isCartOpen,
    setIsCartOpen,
    addItem,
    addEventToCart,
    addProductToCart,
    addRentalToCart,
    addShuttleToCart,
    updateItemQuantity,
    toggleItemFulfillment,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
