/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Award,
  CheckCircle2,
  Cloud,
  Leaf,
  Lock,
  MapPin,
  Recycle,
  X,
} from 'lucide-react';
import {
  EcoChallengeCompletion,
  EcoChallengeDefinition,
  UserProfile,
} from '../types';
import {
  ALL_VIRTUAL_ECO_BADGES,
  ECO_CHALLENGES_CATALOG,
  MILESTONE_ECO_BADGES,
  computeEcoProgress,
} from '../data/ecoChallenges';
import { getActiveWeeklyChallenges } from '../data/weeklyEcoChallenges';

type GalleryFilter = 'UNLOCKED' | 'ECO' | 'EXPEDITION' | 'LOCKED';

interface GalleryBadgeItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  categoryLabel: string;
  kind: 'ecotourism' | 'zero_waste' | 'milestone';
  unlocked: boolean;
  dateLabel?: string;
  parkName?: string;
  ecoPoints?: number;
  requirementText?: string;
  wasteNote?: string;
  syncedWithFirebase: boolean;
  challengeDef?: EcoChallengeDefinition;
}

interface BadgesGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  ecoChallenges: EcoChallengeCompletion[];
  initialBadgeId?: string | null;
  isAuthenticated?: boolean;
  onOpenEcoChallengeModal?: (challenge: EcoChallengeDefinition) => void;
}

export const BadgesGalleryModal: React.FC<BadgesGalleryModalProps> = ({
  isOpen,
  onClose,
  user,
  ecoChallenges,
  initialBadgeId = null,
  isAuthenticated = false,
  onOpenEcoChallengeModal,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [filter, setFilter] = useState<GalleryFilter>('UNLOCKED');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(initialBadgeId);

  // Build unified badge inventory from profile badges + Firebase-synced eco badges (permanent + weekly)
  const allBadges = useMemo<GalleryBadgeItem[]>(() => {
    const completionByBadgeId = new Map<string, EcoChallengeCompletion>(
      ecoChallenges.map((c) => [c.badgeId, c])
    );

    const unlockedVirtualIds = new Set<string>([
      ...(user.unlockedBadgeIds || []),
      ...ecoChallenges.map((c) => c.badgeId),
    ]);

    const milestoneMap = new Map(MILESTONE_ECO_BADGES.map((m) => [m.id, m]));
    const challengeByBadgeId = new Map(
      ECO_CHALLENGES_CATALOG.map((c) => [c.badge.id, c])
    );

    const items: GalleryBadgeItem[] = [];
    const seenIds = new Set<string>();

    // 1. User's core ecotourism badges
    for (const b of user.badges) {
      seenIds.add(b.id);
      items.push({
        id: b.id,
        name: b.name,
        icon: b.icon,
        desc: b.desc,
        categoryLabel: 'Écotourisme Gabon',
        kind: 'ecotourism',
        unlocked: true,
        dateLabel: 'Certifié ANPN',
        parkName: 'Parcs Nationaux du Gabon',
        syncedWithFirebase: isAuthenticated,
      });
    }

    // 2. Virtual Zero-Waste & Milestone badges
    for (const vb of ALL_VIRTUAL_ECO_BADGES) {
      if (seenIds.has(vb.id)) continue;
      seenIds.add(vb.id);

      const completion = completionByBadgeId.get(vb.id);
      const challengeDef = challengeByBadgeId.get(vb.id);
      const milestone = milestoneMap.get(vb.id);
      const isUnlocked = unlockedVirtualIds.has(vb.id);

      items.push({
        id: vb.id,
        name: vb.name,
        icon: vb.icon,
        desc: vb.desc,
        categoryLabel:
          vb.kind === 'milestone' ? 'Palier Zéro Déchet' : 'Défi Zéro Déchet',
        kind: vb.kind === 'milestone' ? 'milestone' : 'zero_waste',
        unlocked: isUnlocked,
        dateLabel: completion
          ? `Validé le ${completion.completedAtLabel}`
          : isUnlocked && milestone
          ? `Palier atteint (${milestone.requirementText})`
          : undefined,
        parkName: challengeDef?.parkName || 'Réseau Parcs Gabon',
        ecoPoints: challengeDef?.ecoPoints ?? vb.ecoPointsReward,
        requirementText: vb.requirementText,
        wasteNote: completion?.wasteNote,
        syncedWithFirebase: Boolean(completion) || (isUnlocked && isAuthenticated),
        challengeDef,
      });
    }

    // 3. Active weekly temporary challenges badges & past completed weekly badges
    const { challenges: activeWeekly } = getActiveWeeklyChallenges();
    for (const wc of activeWeekly) {
      if (seenIds.has(wc.badge.id)) continue;
      seenIds.add(wc.badge.id);

      const completion = completionByBadgeId.get(wc.badge.id);
      const isUnlocked = unlockedVirtualIds.has(wc.badge.id);

      items.push({
        id: wc.badge.id,
        name: wc.badge.name,
        icon: wc.badge.icon,
        desc: wc.badge.desc,
        categoryLabel: 'Défi Hebdo Temporaire',
        kind: 'zero_waste',
        unlocked: isUnlocked,
        dateLabel: completion ? `Validé le ${completion.completedAtLabel}` : undefined,
        parkName: wc.parkName,
        ecoPoints: wc.ecoPoints,
        requirementText: wc.targetAction,
        wasteNote: completion?.wasteNote,
        syncedWithFirebase: Boolean(completion) || (isUnlocked && isAuthenticated),
        challengeDef: wc,
      });
    }

    for (const comp of ecoChallenges) {
      if (seenIds.has(comp.badgeId)) continue;
      seenIds.add(comp.badgeId);
      items.push({
        id: comp.badgeId,
        name: comp.badgeName,
        icon: comp.badgeIcon,
        desc: `Défi écologique validé sur ${comp.eventTitle}`,
        categoryLabel: 'Défi Hebdo Zéro Déchet',
        kind: 'zero_waste',
        unlocked: true,
        dateLabel: `Validé le ${comp.completedAtLabel}`,
        parkName: comp.parkName,
        ecoPoints: comp.ecoPoints,
        wasteNote: comp.wasteNote,
        syncedWithFirebase: true,
      });
    }

    return items;
  }, [user.badges, user.unlockedBadgeIds, ecoChallenges, isAuthenticated]);

  const unlockedBadges = useMemo(
    () => allBadges.filter((b) => b.unlocked),
    [allBadges]
  );
  const lockedBadges = useMemo(
    () => allBadges.filter((b) => !b.unlocked),
    [allBadges]
  );
  const unlockedEcoBadges = useMemo(
    () => unlockedBadges.filter((b) => b.kind === 'zero_waste' || b.kind === 'milestone'),
    [unlockedBadges]
  );
  const unlockedEcotourismBadges = useMemo(
    () => unlockedBadges.filter((b) => b.kind === 'ecotourism'),
    [unlockedBadges]
  );

  const filteredBadges = useMemo(() => {
    if (filter === 'ECO') return unlockedEcoBadges;
    if (filter === 'EXPEDITION') return unlockedEcotourismBadges;
    if (filter === 'LOCKED') return lockedBadges;
    return unlockedBadges;
  }, [filter, unlockedBadges, unlockedEcoBadges, unlockedEcotourismBadges, lockedBadges]);

  const ecoProgress = useMemo(() => computeEcoProgress(ecoChallenges), [ecoChallenges]);
  const effectiveEcoPoints =
    ecoChallenges.length > 0 ? ecoProgress.ecoPoints : (user.ecoPoints ?? 0);

  useEffect(() => {
    if (!isOpen) return;
    if (initialBadgeId && allBadges.some((b) => b.id === initialBadgeId)) {
      const target = allBadges.find((b) => b.id === initialBadgeId);
      setFilter(target && !target.unlocked ? 'LOCKED' : 'UNLOCKED');
      setSelectedBadgeId(initialBadgeId);
    } else {
      setFilter('UNLOCKED');
      setSelectedBadgeId(unlockedBadges[0]?.id ?? null);
    }
  }, [isOpen, initialBadgeId, allBadges, unlockedBadges]);

  // Keep selected badge synchronized when switching tabs
  useEffect(() => {
    if (!isOpen) return;
    if (!filteredBadges.some((b) => b.id === selectedBadgeId)) {
      setSelectedBadgeId(filteredBadges[0]?.id ?? null);
    }
  }, [filter, filteredBadges, selectedBadgeId, isOpen]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const selectedBadge =
    filteredBadges.find((b) => b.id === selectedBadgeId) ||
    allBadges.find((b) => b.id === selectedBadgeId) ||
    filteredBadges[0] ||
    null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="badges-gallery-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="badges-gallery-title"
          className="fixed inset-0 z-50 bg-black/75 dark:bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            key="badges-gallery-panel"
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, y: 32, scale: 0.94 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 24, scale: 0.96 }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 320, damping: 28, mass: 0.85 }
            }
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#121614] border-t sm:border border-stone-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
              <span className="w-10 h-1 rounded-full bg-stone-300 dark:bg-white/15" />
            </div>

            {/* Header */}
            <div className="px-5 pt-3 sm:pt-5 pb-3.5 border-b border-stone-200 dark:border-white/10 flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <motion.div
                  initial={prefersReducedMotion ? false : { rotate: -14, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 360,
                    damping: 20,
                    delay: prefersReducedMotion ? 0 : 0.08,
                  }}
                  className="w-11 h-11 rounded-2xl copper-gradient text-slate-950 flex items-center justify-center shadow-md shrink-0"
                >
                  <Award className="w-5 h-5" />
                </motion.div>
                <div className="min-w-0">
                  <h2
                    id="badges-gallery-title"
                    className="font-serif-display font-bold text-lg text-slate-900 dark:text-white leading-tight truncate"
                  >
                    Galerie de Badges
                  </h2>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5 tabular-nums">
                    {unlockedBadges.length} débloqué(s) · {effectiveEcoPoints} pts éco ·{' '}
                    {ecoProgress.currentRankLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la galerie de badges"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 border border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Gallery Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
              {/* Spotlight Card for Active Badge */}
              {selectedBadge && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedBadge.id}
                    initial={
                      prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 0, y: 8, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -6, scale: 0.98 }
                    }
                    transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                    className={`rounded-2xl border p-4 space-y-3 ${
                      selectedBadge.unlocked
                        ? 'bg-stone-50 dark:bg-slate-950/75 border-amber-500/40'
                        : 'bg-stone-50 dark:bg-slate-950/50 border-stone-200 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <motion.div
                        initial={prefersReducedMotion ? false : { scale: 0.75 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 border ${
                          selectedBadge.unlocked
                            ? 'bg-white dark:bg-slate-900 border-amber-500/40 shadow-md'
                            : 'bg-stone-100 dark:bg-slate-900/70 border-stone-200 dark:border-white/10 grayscale opacity-65'
                        }`}
                      >
                        {selectedBadge.icon}
                      </motion.div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-amber-700 dark:text-amber-400 truncate">
                            {selectedBadge.categoryLabel}
                            {selectedBadge.ecoPoints
                              ? ` · +${selectedBadge.ecoPoints} pts`
                              : ''}
                          </span>
                          {selectedBadge.unlocked ? (
                            <span className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Débloqué
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-semibold text-slate-500 shrink-0">
                              <Lock className="w-3.5 h-3.5" />
                              Verrouillé
                            </span>
                          )}
                        </div>

                        <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white leading-snug">
                          {selectedBadge.name}
                        </h3>

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {selectedBadge.desc}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Line (Clean typographic separators, zero pills) */}
                    <div className="pt-2.5 border-t border-stone-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="truncate">
                          {selectedBadge.parkName || 'Gabon'}
                          {selectedBadge.dateLabel ? ` · ${selectedBadge.dateLabel}` : ''}
                        </span>
                      </span>

                      {selectedBadge.syncedWithFirebase && (
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
                          <Cloud className="w-3.5 h-3.5" />
                          <span>Profil Firebase</span>
                        </span>
                      )}
                    </div>

                    {selectedBadge.wasteNote && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic pt-1 border-t border-stone-200/70 dark:border-white/5">
                        Note terrain : « {selectedBadge.wasteNote} »
                      </p>
                    )}

                    {!selectedBadge.unlocked && selectedBadge.requirementText && (
                      <div className="pt-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">
                          Condition : {selectedBadge.requirementText}
                        </span>
                        {selectedBadge.challengeDef && onOpenEcoChallengeModal && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenEcoChallengeModal(selectedBadge.challengeDef!);
                            }}
                            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shrink-0 transition active:scale-95"
                          >
                            <Recycle className="w-3.5 h-3.5" />
                            <span>Relever ce défi</span>
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Interactive Filter Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-stone-100 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 text-[11px]">
                {[
                  { id: 'UNLOCKED' as const, label: `Tous (${unlockedBadges.length})` },
                  { id: 'ECO' as const, label: `Éco (${unlockedEcoBadges.length})` },
                  { id: 'EXPEDITION' as const, label: `Parcs (${unlockedEcotourismBadges.length})` },
                  { id: 'LOCKED' as const, label: `À venir (${lockedBadges.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    className={`min-h-[44px] px-1.5 rounded-xl font-bold transition whitespace-nowrap truncate ${
                      filter === tab.id
                        ? 'copper-gradient text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Staggered Animated Grid of Badges */}
              {filteredBadges.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 dark:border-white/10 p-6 text-center space-y-1.5">
                  <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {filter === 'LOCKED'
                      ? 'Tous les badges disponibles ont été débloqués !'
                      : 'Aucun badge dans cette catégorie pour le moment.'}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Validez vos expéditions Zéro Déchet pour enrichir votre collection.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredBadges.map((badge, idx) => {
                    const isSelected = selectedBadge?.id === badge.id;

                    return (
                      <motion.button
                        key={badge.id}
                        type="button"
                        onClick={() => setSelectedBadgeId(badge.id)}
                        initial={
                          prefersReducedMotion
                            ? { opacity: 1 }
                            : { opacity: 0, y: 14, scale: 0.92 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={
                          prefersReducedMotion
                            ? { duration: 0 }
                            : {
                                type: 'spring',
                                stiffness: 360,
                                damping: 24,
                                delay: Math.min(idx * 0.045, 0.35),
                              }
                        }
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                        className={`min-h-[84px] p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-colors ${
                          isSelected
                            ? badge.unlocked
                              ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-500 ring-1 ring-amber-400/60'
                              : 'bg-stone-100 dark:bg-slate-900 border-amber-500/60'
                            : badge.unlocked
                            ? 'bg-white dark:bg-slate-900/75 border-stone-200 dark:border-white/10 hover:border-amber-500/50'
                            : 'bg-stone-50 dark:bg-slate-950/45 border-stone-200 dark:border-white/5 opacity-75 hover:opacity-95'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 w-full">
                          <span
                            className={`text-2xl leading-none ${
                              badge.unlocked ? '' : 'grayscale opacity-60'
                            }`}
                          >
                            {badge.icon}
                          </span>
                          {badge.unlocked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                        </div>

                        <div className="min-w-0 w-full">
                          <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                            {badge.name}
                          </span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate mt-0.5">
                            {badge.unlocked
                              ? badge.categoryLabel
                              : badge.requirementText || 'À débloquer'}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-stone-200 dark:border-white/10 bg-stone-50/80 dark:bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                Collection : <strong className="text-slate-900 dark:text-white">{unlockedBadges.length}/{allBadges.length}</strong> badges
              </span>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-5 py-2 copper-gradient text-slate-950 font-black rounded-xl text-xs shadow active:scale-95 transition"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
