/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Leaf,
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  Cloud,
  LogIn,
  Loader2,
  Trash2,
  X,
  ShieldCheck,
  AlertCircle,
  Recycle,
} from 'lucide-react';
import {
  EcoChallengeDefinition,
  EcoChallengeCompletion,
} from '../types';
import {
  ECO_CHALLENGES_CATALOG,
  ALL_VIRTUAL_ECO_BADGES,
  computeEcoProgress,
} from '../data/ecoChallenges';

interface AuthUserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface EcoChallengeValidationModalProps {
  challenge: EcoChallengeDefinition | null;
  existingCompletion?: EcoChallengeCompletion;
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthUserSummary | null;
  isAuthLoading?: boolean;
  onSignInGoogle?: () => void;
  onConfirmCompletion: (payload: {
    challenge: EcoChallengeDefinition;
    wasteNote?: string;
  }) => Promise<void>;
  onRemoveCompletion?: (challengeId: string) => Promise<void>;
}

export const EcoChallengeValidationModal: React.FC<EcoChallengeValidationModalProps> = ({
  challenge,
  existingCompletion,
  isOpen,
  onClose,
  authUser,
  isAuthLoading = false,
  onSignInGoogle,
  onConfirmCompletion,
  onRemoveCompletion,
}) => {
  const [wasteBagReturned, setWasteBagReturned] = useState(false);
  const [leaveNoTracePledge, setLeaveNoTracePledge] = useState(false);
  const [wasteNote, setWasteNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWasteBagReturned(false);
      setLeaveNoTracePledge(false);
      setWasteNote('');
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, challenge?.challengeId]);

  if (!isOpen || !challenge) return null;

  const canSubmit = wasteBagReturned && leaveNoTracePledge && Boolean(authUser) && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmCompletion({
        challenge,
        wasteNote: wasteNote.trim() || undefined,
      });
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.68 },
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Impossible de synchroniser le défi avec Firestore.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingCompletion || !onRemoveCompletion || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onRemoveCompletion(existingCompletion.id);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Impossible de retirer la validation sur Firestore.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#101613] border-t sm:border border-stone-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shrink-0">
              {challenge.badge.icon}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block truncate">
                Défi Écologique · {challenge.parkName}
              </span>
              <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white leading-snug">
                {challenge.challengeTitle}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                {challenge.eventTitle} ·{' '}
                <strong className="text-amber-700 dark:text-amber-400 tabular-nums">
                  +{challenge.ecoPoints} pts éco
                </strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badge Reward Preview */}
        <div className="rounded-2xl bg-stone-50 dark:bg-slate-950/75 border border-stone-200 dark:border-white/10 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Badge virtuel : {challenge.badge.name}
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              +{challenge.ecoPoints} pts
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {challenge.challengeRules}
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-500/40 p-3 flex items-start gap-2 text-xs text-red-800 dark:text-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Check */}
        {!authUser ? (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/35 border border-amber-500/40 p-4 space-y-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Synchronisation Firebase requise
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Connectez votre compte Google pour valider ce défi Zéro Déchet et enregistrer votre badge virtuel dans votre profil cloud.
              </p>
            </div>
            {onSignInGoogle && (
              <button
                type="button"
                onClick={onSignInGoogle}
                disabled={isAuthLoading}
                className="w-full min-h-[44px] px-4 py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition disabled:opacity-60"
              >
                {isAuthLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>Connexion Google pour valider</span>
              </button>
            )}
          </div>
        ) : existingCompletion ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Défi validé &amp; synchronisé
                </span>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                  {existingCompletion.completedAtLabel}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200">
                Le badge <strong>{existingCompletion.badgeIcon} {existingCompletion.badgeName}</strong> est actif sur votre profil Firebase.
              </p>
              {existingCompletion.wasteNote && (
                <p className="text-xs text-slate-600 dark:text-slate-300 italic border-t border-emerald-500/20 pt-2">
                  Note terrain : « {existingCompletion.wasteNote} »
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onRemoveCompletion && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Annuler la validation</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl copper-gradient text-slate-950 font-black text-xs transition active:scale-95"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-2xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-slate-950/60 cursor-pointer min-h-[44px] hover:border-emerald-500/50 transition">
                <input
                  type="checkbox"
                  checked={wasteBagReturned}
                  onChange={(e) => setWasteBagReturned(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded accent-emerald-600 shrink-0"
                />
                <span className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                  <strong>Sac de tri rapatrié :</strong> j&apos;ai ramené 100 % de mes emballages, plastiques et piles hors du parc.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-2xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-slate-950/60 cursor-pointer min-h-[44px] hover:border-emerald-500/50 transition">
                <input
                  type="checkbox"
                  checked={leaveNoTracePledge}
                  onChange={(e) => setLeaveNoTracePledge(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded accent-emerald-600 shrink-0"
                />
                <span className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                  <strong>Charte Sans Trace ANPN :</strong> aucun déchet abandonné sur le campement, le sentier ou dans les cours d&apos;eau.
                </span>
              </label>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <label htmlFor="eco-waste-note" className="font-semibold">
                  Note terrain optionnelle (bilan tri / collecte)
                </label>
                <span className="font-mono tabular-nums">{wasteNote.length}/300</span>
              </div>
              <textarea
                id="eco-waste-note"
                rows={2}
                maxLength={300}
                value={wasteNote}
                onChange={(e) => setWasteNote(e.target.value)}
                placeholder="Ex : Gourdes réutilisables utilisées, sac de tri déposé à la sortie du parc."
                className="w-full rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>
                {isSubmitting
                  ? 'Synchronisation Firestore...'
                  : `Valider Zéro Déchet (+${challenge.ecoPoints} pts)`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

interface EcoChallengesSectionProps {
  completions: EcoChallengeCompletion[];
  authUser: AuthUserSummary | null;
  isAuthLoading?: boolean;
  onSignInGoogle?: () => void;
  onOpenChallengeModal: (challenge: EcoChallengeDefinition) => void;
  unlockedBadgeIds?: string[];
  ecoPoints?: number;
  onOpenBadgesGallery?: (badgeId?: string) => void;
}

export const EcoChallengesSection: React.FC<EcoChallengesSectionProps> = ({
  completions,
  authUser,
  isAuthLoading = false,
  onSignInGoogle,
  onOpenChallengeModal,
  unlockedBadgeIds,
  ecoPoints,
  onOpenBadgesGallery,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  const computed = computeEcoProgress(completions);
  const effectiveEcoPoints =
    completions.length > 0 ? computed.ecoPoints : (ecoPoints ?? 0);
  const effectiveUnlockedIds = new Set<string>([
    ...computed.unlockedBadgeIds,
    ...(unlockedBadgeIds || []),
  ]);
  const completedCount = completions.length > 0
    ? computed.zeroWasteExpeditionsCount
    : ECO_CHALLENGES_CATALOG.filter((c) => effectiveUnlockedIds.has(c.badge.id)).length;
  const totalCatalog = ECO_CHALLENGES_CATALOG.length;
  const progressPct = Math.min(100, Math.round((completedCount / totalCatalog) * 100));

  const completionByEventId = new Map<string, EcoChallengeCompletion>(
    completions.map((c) => [c.eventId, c])
  );

  const visibleChallenges = ECO_CHALLENGES_CATALOG.filter((challenge) => {
    const isDone = completionByEventId.has(challenge.eventId);
    if (filter === 'PENDING') return !isDone;
    if (filter === 'COMPLETED') return isDone;
    return true;
  });

  return (
    <section className="bg-white dark:bg-slate-900/90 border border-emerald-500/35 rounded-3xl p-4 space-y-4 shadow-lg">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white truncate">
              Défis Écologiques Zéro Déchet
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
              {computed.currentRankLabel} · Badges virtuels synchronisés Firebase
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-xl shrink-0 tabular-nums">
          {completedCount}/{totalCatalog}
        </span>
      </div>

      {/* Sync Status Notice if Signed Out */}
      {!authUser && (
        <div className="rounded-2xl bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/10 p-3 flex items-center justify-between gap-2.5">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Synchronisez vos badges écologiques
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 block truncate">
              Connectez Google pour sauvegarder vos défis sans déchets sur Firestore
            </span>
          </div>
          {onSignInGoogle && (
            <button
              type="button"
              onClick={onSignInGoogle}
              disabled={isAuthLoading}
              className="min-h-[44px] px-3 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-[11px] flex items-center gap-1.5 shrink-0 active:scale-95 transition disabled:opacity-60"
            >
              {isAuthLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              <span>Connexion</span>
            </button>
          )}
        </div>
      )}

      {/* Key Metrics + Progress Bar */}
      <div className="rounded-2xl bg-stone-50 dark:bg-slate-950/65 border border-stone-200 dark:border-white/10 p-3.5 space-y-2.5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono tabular-nums block">
              {effectiveEcoPoints}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 block">
              Points Éco
            </span>
          </div>
          <div>
            <span className="text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums block">
              {completedCount}/{totalCatalog}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 block">
              Zéro Déchet
            </span>
          </div>
          <div>
            <span className="text-sm font-black text-amber-700 dark:text-amber-400 font-mono tabular-nums block">
              {effectiveUnlockedIds.size}/{ALL_VIRTUAL_ECO_BADGES.length}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 block">
              Badges Éco
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="h-2 rounded-full bg-stone-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400">
            <span>Progression Clean Parks Gabon</span>
            <span className="font-mono font-bold tabular-nums">{progressPct} %</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-stone-100 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 text-xs">
        {[
          { id: 'ALL' as const, label: `Tous (${totalCatalog})` },
          { id: 'PENDING' as const, label: `À relever (${totalCatalog - completedCount})` },
          { id: 'COMPLETED' as const, label: `Validés (${completedCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`min-h-[44px] px-2 rounded-xl font-bold transition text-[11px] ${
              filter === tab.id
                ? 'copper-gradient text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Challenges List */}
      <div className="space-y-2.5">
        {visibleChallenges.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 dark:border-white/10 p-4 text-center text-xs text-slate-600 dark:text-slate-400">
            {filter === 'PENDING'
              ? 'Bravo ! Tous les défis écologiques des 5 parcs ont été validés sans laisser de déchets.'
              : 'Aucun défi validé pour le moment. Relevez votre première expédition sans déchets !'}
          </div>
        ) : (
          visibleChallenges.map((challenge) => {
            const completion = completionByEventId.get(challenge.eventId);
            const isCompleted = Boolean(completion);

            return (
              <div
                key={challenge.challengeId}
                className={`rounded-2xl border p-3.5 space-y-2.5 transition ${
                  isCompleted
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-500/40'
                    : 'bg-stone-50 dark:bg-slate-950/60 border-stone-200 dark:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 flex items-center justify-center text-xl shrink-0">
                      {challenge.badge.icon}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block truncate">
                        {challenge.parkName} · +{challenge.ecoPoints} pts
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                        {challenge.challengeTitle}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {challenge.challengeRules}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/80 dark:border-white/5 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    Badge : <strong>{challenge.badge.name}</strong>
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
                        <span>Valider Zéro Déchet</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Virtual Eco-Badges Vitrine */}
      <div className="pt-2 border-t border-stone-200 dark:border-white/10 space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 min-w-0 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">Vitrine Badges Zéro Déchet ({effectiveUnlockedIds.size}/{ALL_VIRTUAL_ECO_BADGES.length})</span>
          </span>
          {onOpenBadgesGallery ? (
            <button
              type="button"
              onClick={() => onOpenBadgesGallery()}
              className="min-h-[44px] px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
            >
              Galerie complète →
            </button>
          ) : (
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 tabular-nums">
              {effectiveUnlockedIds.size}/{ALL_VIRTUAL_ECO_BADGES.length}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ALL_VIRTUAL_ECO_BADGES.map((badge) => {
            const unlocked = effectiveUnlockedIds.has(badge.id);
            return (
              <button
                key={badge.id}
                type="button"
                onClick={() => onOpenBadgesGallery?.(badge.id)}
                className={`p-2.5 rounded-2xl border text-left flex items-start gap-2 transition active:scale-95 ${
                  unlocked
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-500/40 hover:border-emerald-500'
                    : 'bg-stone-50 dark:bg-slate-950/50 border-stone-200 dark:border-white/5 opacity-70 hover:opacity-95'
                }`}
              >
                <span className={`text-xl shrink-0 ${unlocked ? '' : 'grayscale opacity-60'}`}>
                  {badge.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-[11px] text-slate-900 dark:text-slate-100 truncate">
                      {badge.name}
                    </span>
                    {unlocked ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block line-clamp-2 leading-snug mt-0.5">
                    {unlocked ? badge.desc : badge.requirementText}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
