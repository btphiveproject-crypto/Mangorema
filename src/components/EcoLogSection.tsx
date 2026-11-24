/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { EcoLogEntry, EcoLogCategory } from '../types';
import {
  BookOpen,
  Plus,
  Calendar,
  MapPin,
  Trash2,
  Edit3,
  Check,
  X,
  Search,
  Cloud,
  LogIn,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface EcoLogSectionProps {
  entries: EcoLogEntry[];
  authUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  isAuthLoading?: boolean;
  onSignInGoogle?: () => void;
  onAddEntry: (entry: Omit<EcoLogEntry, 'id' | 'userId' | 'createdAtMs'>) => Promise<void>;
  onUpdateEntry: (entry: EcoLogEntry) => Promise<void>;
  onDeleteEntry: (logId: string) => Promise<void>;
}

const GABON_PARKS_PRESETS = [
  'Parc National de Pongara',
  'Forêt de la Mondah',
  'Parc National de la Lopé',
  'Parc National de Loango',
  "Parc National d'Ivindo",
  'Monts de Cristal',
  "Parc National d'Akanda",
  'Parc National de Mayumba',
  'Réserve de Nyonié',
];

const CATEGORY_META: Record<EcoLogCategory, { label: string; icon: string }> = {
  FAUNE: { label: 'Faune', icon: '🐘' },
  MARINE: { label: 'Marine', icon: '🐢' },
  OISEAUX: { label: 'Oiseaux', icon: '🦜' },
  FLORE: { label: 'Flore', icon: '🌺' },
};

export const EcoLogSection: React.FC<EcoLogSectionProps> = ({
  entries,
  authUser,
  isAuthLoading = false,
  onSignInGoogle,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const todayISO = new Date().toISOString().slice(0, 10);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EcoLogEntry | null>(null);
  const [speciesName, setSpeciesName] = useState('');
  const [category, setCategory] = useState<EcoLogCategory>('FAUNE');
  const [parkName, setParkName] = useState(GABON_PARKS_PRESETS[0]);
  const [observedAt, setObservedAt] = useState(todayISO);
  const [weatherOrContext, setWeatherOrContext] = useState('');
  const [notes, setNotes] = useState('');

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | EcoLogCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setSpeciesName('');
    setCategory('FAUNE');
    setParkName(GABON_PARKS_PRESETS[0]);
    setObservedAt(todayISO);
    setWeatherOrContext('');
    setNotes('');
    setEditingEntry(null);
    setErrorMsg(null);
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (entry: EcoLogEntry) => {
    setEditingEntry(entry);
    setSpeciesName(entry.speciesName);
    setCategory(entry.category);
    setParkName(entry.parkName);
    setObservedAt(entry.observedAt || todayISO);
    setWeatherOrContext(entry.weatherOrContext || '');
    setNotes(entry.notes);
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedSpecies = speciesName.trim();
    const trimmedPark = parkName.trim();
    const trimmedNotes = notes.trim();

    if (trimmedSpecies.length < 2) {
      setErrorMsg("Indiquez le nom de l'espèce ou de l'observation (min. 2 caractères).");
      return;
    }
    if (trimmedPark.length < 2) {
      setErrorMsg('Indiquez le parc ou lieu d’observation au Gabon.');
      return;
    }
    if (trimmedNotes.length < 3) {
      setErrorMsg("Ajoutez une description ou note d'observation (min. 3 caractères).");
      return;
    }

    setIsSaving(true);
    try {
      if (editingEntry) {
        await onUpdateEntry({
          ...editingEntry,
          speciesName: trimmedSpecies,
          category,
          parkName: trimmedPark,
          observedAt,
          weatherOrContext: weatherOrContext.trim() || undefined,
          notes: trimmedNotes,
        });
      } else {
        await onAddEntry({
          speciesName: trimmedSpecies,
          category,
          parkName: trimmedPark,
          observedAt,
          weatherOrContext: weatherOrContext.trim() || undefined,
          notes: trimmedNotes,
        });
      }
      resetForm();
      setIsFormOpen(false);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Impossible d'enregistrer dans Firestore."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (logId: string) => {
    try {
      await onDeleteEntry(logId);
      setConfirmDeleteId(null);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erreur lors de la suppression.'
      );
    }
  };

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((item) => {
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.speciesName.toLowerCase().includes(q) ||
        item.parkName.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
      );
    });
  }, [entries, categoryFilter, searchQuery]);

  const formatFrenchDate = (iso: string) => {
    if (!iso) return 'Date non précisée';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-emerald-500/35 rounded-3xl p-4 space-y-3.5 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white">
                Carnet Éco-Log ({entries.length})
              </h3>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                {authUser ? '· Sync Firestore' : '· Hors connexion'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Vos observations personnelles de faune et flore gabonaises datées
            </p>
          </div>
        </div>

        {authUser && (
          <button
            type="button"
            onClick={() => (isFormOpen ? setIsFormOpen(false) : openCreateForm())}
            className="min-h-[44px] px-3 py-1.5 copper-gradient text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 shadow active:scale-95 transition shrink-0"
          >
            {isFormOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isFormOpen ? 'Fermer' : 'Noter'}</span>
          </button>
        )}
      </div>

      {/* Unauthenticated Gate */}
      {!authUser && (
        <div className="bg-stone-50 dark:bg-slate-950/75 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              Synchronisation Firestore requise
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Connectez votre compte Google pour consigner vos observations faune &amp; flore dans votre carnet privé.
            </p>
          </div>
          {onSignInGoogle && (
            <button
              type="button"
              onClick={onSignInGoogle}
              disabled={isAuthLoading}
              className="min-h-[44px] px-3 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow shrink-0 active:scale-95 transition disabled:opacity-60"
            >
              {isAuthLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
              <span>Connexion</span>
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Form */}
      {authUser && isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-stone-50 dark:bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-3.5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">
              {editingEntry ? 'Modifier une observation' : 'Nouvelle observation naturaliste'}
            </h4>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/70 border border-red-500/40 text-red-800 dark:text-red-200 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Category Selector */}
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(CATEGORY_META) as EcoLogCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`min-h-[44px] px-2 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition ${
                  category === cat
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{CATEGORY_META[cat].icon}</span>
                <span>{CATEGORY_META[cat].label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Espèce / Sujet observé *
              </label>
              <input
                type="text"
                value={speciesName}
                onChange={(e) => setSpeciesName(e.target.value)}
                maxLength={120}
                placeholder="Ex: Tortue Luth en ponte, Orchidée..."
                className="w-full min-h-[44px] bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Date d&apos;observation *
              </label>
              <input
                type="date"
                value={observedAt}
                onChange={(e) => setObservedAt(e.target.value)}
                className="w-full min-h-[44px] bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Parc ou Zone au Gabon *
              </label>
              <input
                type="text"
                list="mangorema-parks-list"
                value={parkName}
                onChange={(e) => setParkName(e.target.value)}
                maxLength={120}
                placeholder="Parc National de Pongara"
                className="w-full min-h-[44px] bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <datalist id="mangorema-parks-list">
                {GABON_PARKS_PRESETS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Météo / Contexte (optionnel)
              </label>
              <input
                type="text"
                value={weatherOrContext}
                onChange={(e) => setWeatherOrContext(e.target.value)}
                maxLength={160}
                placeholder="Ex: Aube brumeuse, marée basse"
                className="w-full min-h-[44px] bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                Notes d&apos;observation sur le terrain *
              </label>
              <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                {notes.length}/800
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={800}
              rows={3}
              placeholder="Comportement observé, traces relevées, nombre d'individus, floraison..."
              className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsFormOpen(false);
              }}
              className="min-h-[44px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-[44px] px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 transition disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{editingEntry ? 'Mettre à jour' : 'Enregistrer sur Firestore'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Search & Category Filters when logged in */}
      {authUser && entries.length > 0 && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une espèce, un parc ou une note..."
              className="w-full min-h-[44px] bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {(['ALL', 'FAUNE', 'MARINE', 'OISEAUX', 'FLORE'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`min-h-[44px] px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                  categoryFilter === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-100 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                {cat === 'ALL'
                  ? `Tout (${entries.length})`
                  : `${CATEGORY_META[cat].icon} ${CATEGORY_META[cat].label}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Entries List */}
      {authUser && filteredEntries.length === 0 ? (
        <div className="bg-stone-50 dark:bg-slate-950/60 border border-dashed border-stone-300 dark:border-white/15 rounded-2xl p-5 text-center space-y-2">
          <BookOpen className="w-7 h-7 text-emerald-600/70 dark:text-emerald-400/70 mx-auto" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {entries.length === 0
              ? 'Votre Carnet Éco-Log est vide'
              : 'Aucune observation ne correspond à ce filtre'}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
            Notez vos rencontres avec la biodiversité gabonaise (tortues luth, éléphants, orchidées, oiseaux) avec date et lieu.
          </p>
          {entries.length === 0 && !isFormOpen && (
            <button
              type="button"
              onClick={openCreateForm}
              className="min-h-[44px] mt-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter ma première observation</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEntries.map((entry) => {
            const meta = CATEGORY_META[entry.category] || CATEGORY_META.FAUNE;
            const isConfirmingDelete = confirmDeleteId === entry.id;

            return (
              <div
                key={entry.id}
                className="bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{meta.icon}</span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {entry.speciesName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {meta.label}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          {entry.parkName}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5 font-mono">
                          <Calendar className="w-3 h-3" />
                          {formatFrenchDate(entry.observedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditForm(entry)}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-amber-500/40 flex items-center justify-center transition"
                      title="Modifier cette observation"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDeleteId(isConfirmingDelete ? null : entry.id)
                      }
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/40 flex items-center justify-center transition"
                      title="Supprimer cette observation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {entry.notes}
                </p>

                {entry.weatherOrContext && (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Contexte : {entry.weatherOrContext}
                  </div>
                )}

                {isConfirmingDelete && (
                  <div className="pt-2 border-t border-red-300 dark:border-red-900/50 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] font-semibold text-red-700 dark:text-red-300">
                      Supprimer définitivement cette note ?
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="min-h-[44px] px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(entry.id)}
                        className="min-h-[44px] px-3 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold"
                      >
                        Confirmer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
