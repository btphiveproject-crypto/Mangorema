import React, { useState } from 'react';
import { X, CheckSquare, Square, Plus, ShieldCheck, Backpack } from 'lucide-react';
import { BIVOUAC_CHECKLIST_ITEMS } from '../data/mockData';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<Array<{ id: string; title: string; category: string; essential: boolean; checked: boolean }>>(
    BIVOUAC_CHECKLIST_ITEMS.map((item, index) => ({
      ...item,
      checked: index < 5, // pre-check some for immediate feedback
    }))
  );
  const [newItemText, setNewItemText] = useState('');
  const [filter, setFilter] = useState<string>('all');

  if (!isOpen) return null;

  const toggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        title: newItemText.trim(),
        category: 'Personnel',
        essential: false,
        checked: false,
      },
    ]);
    setNewItemText('');
  };

  const checkedCount = items.filter((i) => i.checked).length;
  const progressPercent = Math.round((checkedCount / items.length) * 100);

  const filteredItems = items.filter((i) => {
    if (filter === 'essential') return i.essential;
    if (filter === 'completed') return i.checked;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#121614] border border-stone-200 dark:border-white/10 w-full max-w-md rounded-3xl p-5 max-h-[88vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Backpack className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider block">
                PRÉPARATION FORÊT GABON
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Checklist Bivouac Équatorial</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Card */}
        <div className="bg-stone-50 dark:bg-slate-900/80 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">État de préparation de votre sac :</span>
            <span className="font-extrabold text-amber-700 dark:text-amber-400">
              {checkedCount} / {items.length} équipés ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-stone-200 dark:bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 p-1 bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-white/5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              filter === 'all' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tous ({items.length})
          </button>
          <button
            onClick={() => setFilter('essential')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              filter === 'essential' ? 'bg-amber-100 dark:bg-amber-600/30 text-amber-800 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Vitaux
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              filter === 'completed' ? 'bg-emerald-100 dark:bg-emerald-600/30 text-emerald-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Prêts ({checkedCount})
          </button>
        </div>

        {/* Item List */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition select-none ${
                item.checked
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30 text-slate-700 dark:text-slate-300'
                  : 'bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-white/5 text-slate-800 dark:text-slate-200 hover:border-amber-500/40 dark:hover:border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {item.checked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                )}
                <span className={`text-xs ${item.checked ? 'line-through text-slate-400' : ''}`}>
                  {item.title}
                </span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-stone-200/70 dark:bg-white/5 text-slate-600 dark:text-slate-400 flex-shrink-0">
                {item.category}
              </span>
            </div>
          ))}
        </div>

        {/* Add custom item */}
        <form onSubmit={handleAddItem} className="flex gap-2">
          <input
            type="text"
            placeholder="Ajouter un équipement personnel..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="flex-1 bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </form>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-transparent text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition"
        >
          Valider ma checklist
        </button>

      </div>
    </div>
  );
};
