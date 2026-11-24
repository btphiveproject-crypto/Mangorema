/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Bell,
  BellOff,
  CheckCircle2,
  Recycle,
  RefreshCw,
  Send,
  AlertTriangle,
  Camera,
} from 'lucide-react';
import {
  EcoChallengeCompletion,
  EcoChallengeDefinition,
  NotificationPermissionStatus,
} from '../types';
import {
  getActiveWeeklyChallenges,
  formatCountdownParts,
} from '../data/weeklyEcoChallenges';
import {
  getNotificationPermission,
  requestNotificationPermission,
  isWeeklyEcoPushEnabled,
  setWeeklyEcoPushEnabled,
  syncWeeklyChallengeNotifications,
  triggerWeeklyChallengePushTest,
  playForestAlertChime,
} from '../utils/notificationService';

interface WeeklyEcoChallengesSectionProps {
  completions: EcoChallengeCompletion[];
  onOpenChallengeModal: (challenge: EcoChallengeDefinition) => void;
  onNotifyBanner?: (title: string, body: string) => void;
  onSyncNotificationsCount?: () => void;
  compact?: boolean;
  onOpenProfile?: () => void;
}

export const WeeklyEcoChallengesSection: React.FC<WeeklyEcoChallengesSectionProps> = ({
  completions,
  onOpenChallengeModal,
  onNotifyBanner,
  onSyncNotificationsCount,
  compact = false,
  onOpenProfile,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => isWeeklyEcoPushEnabled());
  const [permission, setPermission] = useState<NotificationPermissionStatus>(() =>
    getNotificationPermission()
  );
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  // Live 1-second countdown ticker & automatic Monday renewal
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { weekWindow, challenges } = getActiveWeeklyChallenges(new Date(nowMs));
  const countdown = formatCountdownParts(weekWindow.endsAtMs, nowMs);

  const completionById = new Map<string, EcoChallengeCompletion>(
    completions.map((c) => [c.id, c])
  );
  const completedIds = new Set(completions.map((c) => c.id));
  const completedWeeklyCount = challenges.filter((c) =>
    completedIds.has(c.challengeId)
  ).length;
  const pendingWeeklyCount = challenges.length - completedWeeklyCount;

  // Keep scheduled reminder in sync whenever week changes or push preference is active
  useEffect(() => {
    const result = syncWeeklyChallengeNotifications({
      weekKey: weekWindow.weekKey,
      weekLabel: weekWindow.label,
      endsAtMs: weekWindow.endsAtMs,
      pendingCount: pendingWeeklyCount,
      enabled: pushEnabled,
    });

    if (result.newWeekAlert && onNotifyBanner) {
      onNotifyBanner(result.newWeekAlert.title, result.newWeekAlert.body);
    }
    onSyncNotificationsCount?.();
  }, [weekWindow.weekKey, weekWindow.endsAtMs, weekWindow.label, pendingWeeklyCount, pushEnabled]);

  const showTimedFeedback = (msg: string) => {
    setPushFeedback(msg);
    setTimeout(() => setPushFeedback(null), 4500);
  };

  const handleToggleWeeklyPush = async () => {
    if (!pushEnabled) {
      let currentPerm = getNotificationPermission();
      if (currentPerm === 'default') {
        currentPerm = await requestNotificationPermission();
      }
      setPermission(currentPerm);
      setWeeklyEcoPushEnabled(true);
      setPushEnabled(true);

      syncWeeklyChallengeNotifications({
        weekKey: weekWindow.weekKey,
        weekLabel: weekWindow.label,
        endsAtMs: weekWindow.endsAtMs,
        pendingCount: pendingWeeklyCount,
        enabled: true,
      });
      onSyncNotificationsCount?.();

      const testResult = triggerWeeklyChallengePushTest(weekWindow.label, pendingWeeklyCount);
      if (currentPerm === 'granted' && testResult.nativeSent) {
        showTimedFeedback(
          'Notifications push activées : alerte de renouvellement hebdomadaire et rappel H-24 configurés.'
        );
      } else if (currentPerm === 'denied') {
        showTimedFeedback(
          'Rappels activés dans l’application (autorisez les notifications dans votre navigateur pour les recevoir en arrière-plan).'
        );
      } else {
        showTimedFeedback(
          'Alertes hebdomadaires activées pour vos défis écologiques temporaires.'
        );
      }
    } else {
      setWeeklyEcoPushEnabled(false);
      setPushEnabled(false);
      syncWeeklyChallengeNotifications({
        weekKey: weekWindow.weekKey,
        weekLabel: weekWindow.label,
        endsAtMs: weekWindow.endsAtMs,
        pendingCount: pendingWeeklyCount,
        enabled: false,
      });
      onSyncNotificationsCount?.();
      showTimedFeedback('Notifications push pour les défis temporaires désactivées.');
    }
  };

  const handleSendPushPreview = async () => {
    let currentPerm = getNotificationPermission();
    if (currentPerm === 'default') {
      currentPerm = await requestNotificationPermission();
      setPermission(currentPerm);
    }
    playForestAlertChime();
    const res = triggerWeeklyChallengePushTest(weekWindow.label, pendingWeeklyCount);
    onNotifyBanner?.(res.title, res.body);
    showTimedFeedback(
      res.nativeSent
        ? 'Notification push envoyée sur votre appareil !'
        : 'Alerte affichée dans l’application (permission push navigateur requise pour le système).'
    );
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="glass-card border border-amber-500/40 dark:border-amber-400/25 rounded-3xl p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white truncate">
              Défis Écologiques Temporaires
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
              Renouvellement chaque lundi · {weekWindow.label}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300 tabular-nums shrink-0">
          {completedWeeklyCount}/{challenges.length}
        </span>
      </div>

      {/* Live Countdown Box */}
      <div
        className={`rounded-2xl border p-3.5 space-y-2.5 ${
          countdown.isExpiringSoon
            ? 'bg-amber-50/75 dark:bg-amber-950/35 border-amber-500/50'
            : 'glass-surface border-white/55 dark:border-white/12'
        }`}
      >
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {countdown.isExpiringSoon
                ? 'Dernières heures avant renouvellement'
                : 'Temps restant cette semaine'}
            </span>
          </span>
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
            Cycle {weekWindow.progressPercent} %
          </span>
        </div>

        {/* 4-Unit Live Countdown */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {[
            { value: pad(countdown.days), label: 'Jours' },
            { value: pad(countdown.hours), label: 'Heures' },
            { value: pad(countdown.minutes), label: 'Min' },
            { value: pad(countdown.seconds), label: 'Sec' },
          ].map((unit) => (
            <div
              key={unit.label}
              className="rounded-xl glass-surface border border-white/60 dark:border-white/12 py-2 px-1"
            >
              <span className="text-base font-black text-slate-900 dark:text-white font-mono tabular-nums block leading-none">
                {unit.value}
              </span>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 block mt-1">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        <div className="h-1.5 rounded-full bg-slate-900/10 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${weekWindow.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Push Notifications Opt-in Bar */}
      <div className="rounded-2xl glass-surface border border-white/55 dark:border-white/12 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                pushEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                  : 'glass-surface border-white/55 dark:border-white/12 text-slate-600 dark:text-slate-400'
              }`}
            >
              {pushEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                Notifications push hebdomadaires
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate">
                {pushEnabled
                  ? permission === 'granted'
                    ? 'Push actif · Alerte nouveaux défis & rappel H-24'
                    : permission === 'denied'
                    ? 'Rappel app actif (push bloqué par navigateur)'
                    : 'Alertes programmées · Cliquez Tester pour autoriser'
                  : 'Recevez une alerte chaque lundi et 24h avant expiration'}
              </span>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={pushEnabled}
            onClick={handleToggleWeeklyPush}
            className={`min-h-[44px] px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition active:scale-95 ${
              pushEnabled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'copper-gradient text-slate-950'
            }`}
          >
            {pushEnabled ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Activées</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" />
                <span>Activer</span>
              </>
            )}
          </button>
        </div>

        {pushEnabled && (
          <div className="pt-2 border-t border-stone-200 dark:border-white/5 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 min-w-0 truncate">
              {permission === 'denied' && (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <span className="truncate">
                Prochain rappel : dimanche (H-24 avant renouvellement)
              </span>
            </span>
            <button
              type="button"
              onClick={handleSendPushPreview}
              className="min-h-[40px] px-2.5 py-1 rounded-xl glass-surface border border-white/55 dark:border-white/12 hover:border-amber-500/45 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1 shrink-0 transition"
            >
              <Send className="w-3 h-3" />
              <span>Tester push</span>
            </button>
          </div>
        )}

        {pushFeedback && (
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium pt-1">
            {pushFeedback}
          </p>
        )}
      </div>

      {/* Active Weekly Challenges Cards */}
      <div className="space-y-2.5">
        {challenges.map((challenge) => {
          const completion = completionById.get(challenge.challengeId);
          const isCompleted = Boolean(completion);

          return (
            <div
              key={challenge.challengeId}
              className={`rounded-2xl border p-3.5 space-y-2.5 transition ${
                isCompleted
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'glass-surface border-white/55 dark:border-white/12'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl glass-surface border border-white/60 dark:border-white/12 flex items-center justify-center text-xl shrink-0">
                  {challenge.badge.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="font-bold text-amber-700 dark:text-amber-400 truncate">
                      {challenge.parkName} · +{challenge.ecoPoints} pts
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
                      {countdown.days > 0
                        ? `Fin dans ${countdown.days}j ${pad(countdown.hours)}h`
                        : `Fin dans ${pad(countdown.hours)}h ${pad(countdown.minutes)}m`}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug mt-0.5">
                    {challenge.challengeTitle}
                  </h4>
                  {!compact && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {challenge.challengeRules}
                    </p>
                  )}
                </div>

                {completion?.proofPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => onOpenChallengeModal(challenge)}
                    title="Voir la preuve photo"
                    className="w-11 h-11 rounded-xl overflow-hidden border border-emerald-500/40 shrink-0"
                  >
                    <img
                      src={completion.proofPhotoUrl}
                      alt={`Preuve ${challenge.parkName}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-stone-200/80 dark:border-white/5 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate flex items-center gap-1">
                  <span className="truncate">
                    Objectif : <strong>{challenge.targetAction}</strong>
                  </span>
                  {completion?.proofPhotoUrl && (
                    <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                      · <Camera className="w-3 h-3" /> Photo
                    </span>
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => onOpenChallengeModal(challenge)}
                  className={`min-h-[44px] px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 shrink-0 transition active:scale-95 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'copper-gradient text-slate-950 hover:brightness-110'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Validé · Détails</span>
                    </>
                  ) : (
                    <>
                      <Recycle className="w-3.5 h-3.5" />
                      <span>Valider</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {compact && onOpenProfile && (
        <button
          type="button"
          onClick={onOpenProfile}
          className="w-full min-h-[44px] py-2 rounded-xl glass-surface hover:bg-white/75 dark:hover:bg-white/12 border border-white/55 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-100 transition"
        >
          Voir tous mes badges &amp; défis dans mon Profil →
        </button>
      )}
    </section>
  );
};
