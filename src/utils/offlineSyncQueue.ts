/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EcoLogCategory, SafetyIncident } from '../types';

const OFFLINE_QUEUE_KEY = 'mangorema_offline_queue_v1';

export type OfflineQueuedAction =
  | {
      id: string;
      kind: 'INCIDENT';
      createdAtMs: number;
      payload: Omit<SafetyIncident, 'id' | 'reportedAt'>;
    }
  | {
      id: string;
      kind: 'ECOLOG';
      createdAtMs: number;
      payload: {
        speciesName: string;
        category: EcoLogCategory;
        parkName: string;
        observedAt: string;
        notes: string;
        weatherOrContext?: string;
      };
    };

export function getOfflineQueue(): OfflineQueuedAction[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflineQueuedAction[]) : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(items: OfflineQueuedAction[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    // Ignore storage quota errors
  }
}

export function enqueueOfflineAction(action: Omit<OfflineQueuedAction, 'id' | 'createdAtMs'>): OfflineQueuedAction {
  const item = {
    ...action,
    id: `oq-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    createdAtMs: Date.now(),
  } as OfflineQueuedAction;
  const current = getOfflineQueue();
  saveOfflineQueue([item, ...current]);
  return item;
}

export function removeOfflineQueueItem(itemId: string): void {
  const current = getOfflineQueue();
  saveOfflineQueue(current.filter((it) => it.id !== itemId));
}
