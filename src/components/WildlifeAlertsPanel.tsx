/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  WILDLIFE_SEASONAL_ALERTS,
  getSeasonalAlertStatus,
} from '../data/wildlifeAlerts';
import { WildlifeAlertCategory, WildlifeSeasonalAlert } from '../types';
import {
  getSubscribedWildlifeAlertIds,
  toggleWildlifeAlertSubscription,
  requestNotificationPermission,
  getNotificationPermission,
} from '../utils/notificationService';
import {
  Binoculars,
  Bell,
  BellRing,
  Clock,
  ShieldCheck,
  MapPin,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface WildlifeAlertsPanelProps {
  compact?: boolean;
  onNavigateToSafety?: () => void;
  onNotifyBanner?: (title: string, body: string) => void;
  onSyncNotificationsCount?: () => void;
}

type FilterOption = 'ALL' | 'ACTIVE' | 'MARINE' | 'FAUNE' | 'FLORE_OISEAUX';

const CATEGORY_LABELS: Record<WildlifeAlertCategory, string> = {
  MARINE: 'Milieu marin',
  FAUNE: 'Grande faune',
  OISEAUX: 'Oiseaux',
  FLORE: 'Flore & Orchidées',
};

export const WildlifeAlertsPanel: React.FC<WildlifeAlertsPanelProps> = ({
  compact = false,
  onNavigateToSafety,
  onNotifyBanner,
  onSyncNotificationsCount,
}) => {
  const [filter, setFilter] = useState<FilterOption>('ALL');
  const [subscribedIds, setSubscribedIds] = useState<string[]>(() =>
    getSubscribedWildlifeAlertIds()
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);

  const enrichedAlerts = useMemo(() => {
    return WILDLIFE_SEASONAL_ALERTS.map((alert) => ({
      alert,
      status: getSeasonalAlertStatus(alert, now),
    })).sort((a, b) => {
      const rank = { ACTIVE: 0, UPCOMING: 1, OFF_SEASON: 2 };
      return rank[a.status.state] - rank[b.status.state];
    });
  }, [now]);

  const activeAlertsCount = enrichedAlerts.filter((e) => e.status.state === 'ACTIVE').length;

  const filteredAlerts = enrichedAlerts.filter(({ alert, status }) => {
    if (filter === 'ACTIVE') return status.state === 'ACTIVE';
    if (filter === 'MARINE') return alert.category === 'MARINE';
    if (filter === 'FAUNE') return alert.category === 'FAUNE';
    if (filter === 'FLORE_OISEAUX') {
      return alert.category === 'FLORE' || alert.category === 'OISEAUX';
    }
    return true;
  });

  const handleToggleAlertSubscription = async (alert: WildlifeSeasonalAlert) => {
    if (getNotificationPermission() === 'default') {
      await requestNotificationPermission();
    }

    const res = toggleWildlifeAlertSubscription({
      alertId: alert.id,
      title: alert.title,
      parkOrZone: alert.parkOrZone,
      seasonLabel: alert.seasonLabel,
      icon: alert.icon,
    });
    setSubscribedIds(res.subscribedIds);

    if (res.added && onNotifyBanner) {
      onNotifyBanner(
        `${alert.icon} Alerte Nature activée`,
        `${alert.title} (${alert.seasonLabel}) · ${alert.parkOrZone}`
      );
    }

    if (onSyncNotificationsCount) {
      onSyncNotificationsCount();
    }

    setFeedback(
      res.added
        ? `Alerte activée pour "${alert.species}".`
        : `Alerte mise en pause pour "${alert.species}".`
    );
    setTimeout(() => setFeedback(null), 3500);
  };

  if (compact) {
    const highlightItems = enrichedAlerts.filter((e) => e.status.state === 'ACTIVE').slice(0, 2);

    return (
      <div className="glass-card border border-amber-500/40 dark:border-amber-400/25 rounded-3xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Binoculars className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white">
                Alertes Saisons Faune &amp; Flore
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug mt-0.5">
                {activeAlertsCount} phénomène(s) actif(s) ce mois-ci au Gabon (tortues luth, éléphants, oiseaux, orchidées).
              </p>
            </div>
          </div>

          {onNavigateToSafety && (
            <button
              type="button"
              onClick={onNavigateToSafety}
              className="min-h-[44px] px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1 shrink-0 transition"
            >
              <span>Tout voir</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          {highlightItems.map(({ alert, status }) => (
            <div
              key={alert.id}
              onClick={onNavigateToSafety}
              className="p-2.5 rounded-2xl glass-surface border border-white/55 dark:border-white/12 hover:border-amber-500/45 cursor-pointer flex items-start gap-2.5 transition"
            >
              <span className="text-xl shrink-0 mt-0.5">{alert.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs text-slate-900 dark:text-white truncate">
                    {alert.title}
                  </strong>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                    {status.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                  {alert.parkOrZone} · {alert.safetyDistance}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card border border-amber-500/40 dark:border-amber-400/25 rounded-3xl p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Binoculars className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white">
              Alertes Faune, Flore &amp; Saisons Nature
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Tortues luth, baleines à bosse, éléphants, oiseaux &amp; floraisons du Gabon ({activeAlertsCount} saisons actives)
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-[11px] font-medium">{feedback}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {(
          [
            { id: 'ALL', label: `Toutes (${enrichedAlerts.length})` },
            { id: 'ACTIVE', label: `Actives ce mois (${activeAlertsCount})` },
            { id: 'MARINE', label: '🐢 Tortues & Baleines' },
            { id: 'FAUNE', label: '🐘 Éléphants & Primates' },
            { id: 'FLORE_OISEAUX', label: '🦜 Oiseaux & Fleurs' },
          ] as { id: FilterOption; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`min-h-[44px] px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
              filter === tab.id
                ? 'copper-gradient text-slate-950 shadow-sm'
                : 'glass-surface border border-white/55 dark:border-white/12 text-slate-800 dark:text-slate-200 hover:border-amber-500/45'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filteredAlerts.map(({ alert, status }) => {
          const isSubscribed = subscribedIds.includes(alert.id);
          const isActiveNow = status.state === 'ACTIVE';

          return (
            <div
              key={alert.id}
              className={`rounded-2xl p-3.5 border transition space-y-2.5 ${
                isActiveNow
                  ? 'glass-surface border-amber-500/45 shadow-sm'
                  : 'glass-surface border-white/55 dark:border-white/12'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="text-2xl shrink-0 leading-none mt-0.5">{alert.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      <span
                        className={`font-extrabold uppercase tracking-wider ${
                          isActiveNow
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : status.state === 'UPCOMING'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {status.label}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {CATEGORY_LABELS[alert.category]}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-0.5 leading-snug">
                      {alert.title}
                    </h4>
                    <span className="text-[10px] font-mono text-amber-800 dark:text-amber-400 block mt-0.5">
                      {alert.species}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleAlertSubscription(alert)}
                  className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 shrink-0 transition active:scale-95 ${
                    isSubscribed
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'glass-surface border border-white/60 dark:border-white/15 text-slate-800 dark:text-slate-100 hover:border-amber-500/50'
                  }`}
                  title={
                    isSubscribed
                      ? 'Désactiver le suivi de cette alerte saisonnière'
                      : 'Activer une notification pour cette alerte saisonnière'
                  }
                >
                  {isSubscribed ? (
                    <>
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Suivie</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      <span>M&apos;alerter</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                {alert.summary}
              </p>

              <div className="glass-surface border border-white/50 dark:border-white/10 rounded-xl p-2.5 space-y-1.5 text-[10px]">
                <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-900 dark:text-white">Protocole ANPN :</strong>{' '}
                    {alert.observationRule}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-stone-200 dark:border-white/5 text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    {alert.parkOrZone}
                  </span>
                  <span className="flex items-center gap-1 font-mono font-semibold text-amber-800 dark:text-amber-300">
                    <Clock className="w-3 h-3" />
                    {alert.seasonLabel} ({alert.bestWindow})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
