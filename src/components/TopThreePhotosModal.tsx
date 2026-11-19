import React, { useState } from 'react';
import { ExpeditionPhoto } from '../types';
import { X, Sparkles, Check, Heart, Camera, MapPin, Calendar, Trash2, ArrowRight, Eye, Plus, Star } from 'lucide-react';

interface TopThreePhotosModalProps {
  photos: ExpeditionPhoto[];
  topThreeIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSaveTopThree: (newTopThreeIds: string[], updatedPhotos?: ExpeditionPhoto[]) => void;
}

export const TopThreePhotosModal: React.FC<TopThreePhotosModalProps> = ({
  photos,
  topThreeIds,
  isOpen,
  onClose,
  onSaveTopThree,
}) => {
  const [currentPhotos, setCurrentPhotos] = useState<ExpeditionPhoto[]>(photos);
  const [selectedTopIds, setSelectedTopIds] = useState<string[]>(topThreeIds.slice(0, 3));
  const [selectedFilterPark, setSelectedFilterPark] = useState<string>('all');
  const [activeSlotTarget, setActiveSlotTarget] = useState<number | null>(null);

  // New photo form upload
  const [isUploading, setIsUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newExpedition, setNewExpedition] = useState('Bivouac & Canopée Mondah');
  const [newPark, setNewPark] = useState('Parc National de la Mondah');
  const [uploadedImageData, setUploadedImageData] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSelectPhoto = (photoId: string) => {
    if (activeSlotTarget !== null) {
      // Direct slot assignment
      const updated = [...selectedTopIds];
      updated[activeSlotTarget] = photoId;
      setSelectedTopIds(updated.filter(Boolean));
      setActiveSlotTarget(null);
      return;
    }

    if (selectedTopIds.includes(photoId)) {
      setSelectedTopIds(selectedTopIds.filter((id) => id !== photoId));
    } else {
      if (selectedTopIds.length >= 3) {
        // Replace last slot or alert
        const updated = [selectedTopIds[1], selectedTopIds[2], photoId].filter(Boolean);
        setSelectedTopIds(updated);
      } else {
        setSelectedTopIds([...selectedTopIds, photoId]);
      }
    }
  };

  const removeSlot = (index: number) => {
    const updated = [...selectedTopIds];
    updated.splice(index, 1);
    setSelectedTopIds(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImageData(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNewExpeditionPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedImageData) {
      alert('Veuillez sélectionner un cliché depuis votre appareil.');
      return;
    }
    if (!newTitle.trim()) {
      alert('Veuillez indiquer un titre pour cette photo.');
      return;
    }

    const createdPhoto: ExpeditionPhoto = {
      id: `photo-custom-${Date.now()}`,
      title: newTitle.trim(),
      expeditionName: newExpedition,
      parkName: newPark,
      url: uploadedImageData,
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      caption: `Photo capturée lors de l'expédition réalisée : ${newExpedition}.`,
      isFavorite: true,
    };

    const updated = [createdPhoto, ...currentPhotos];
    setCurrentPhotos(updated);

    // Auto-assign to Top 3
    if (selectedTopIds.length < 3) {
      setSelectedTopIds([...selectedTopIds, createdPhoto.id]);
    } else {
      setSelectedTopIds([selectedTopIds[0], selectedTopIds[1], createdPhoto.id]);
    }

    setIsUploading(false);
    setNewTitle('');
    setUploadedImageData(null);
  };

  const handleSave = () => {
    onSaveTopThree(selectedTopIds, currentPhotos);
    onClose();
  };

  // Group photos or filter
  const filteredPhotos = currentPhotos.filter((p) => {
    if (selectedFilterPark === 'all') return true;
    return p.parkName.toLowerCase().includes(selectedFilterPark.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#121614] border border-amber-500/40 dark:border-amber-600/40 w-full max-w-lg rounded-3xl p-5 max-h-[92vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider block">
                PERSONNALISATION DU HAUT DE PROFIL
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Sélectionner mon Top 3 Photos</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The 3 Top Slots Banner Preview */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0" />
              <span>Vos 3 photos vedettes affichées en tête de profil :</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border border-amber-400/50 dark:border-amber-500/40 px-2 py-0.5 rounded-full shrink-0">
              {selectedTopIds.length} / 3 choisis
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((slotIdx) => {
              const photoId = selectedTopIds[slotIdx];
              const photo = photoId ? currentPhotos.find((p) => p.id === photoId) : null;
              const isTarget = activeSlotTarget === slotIdx;

              return (
                <div
                  key={slotIdx}
                  onClick={() => setActiveSlotTarget(isTarget ? null : slotIdx)}
                  className={`relative rounded-2xl overflow-hidden aspect-[4/3] border cursor-pointer transition-all ${
                    isTarget
                      ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                      : photo
                      ? 'border-amber-500/60 shadow-md'
                      : 'border-dashed border-stone-300 dark:border-white/20 bg-stone-50 dark:bg-slate-950/60 hover:border-amber-500/50'
                  }`}
                >
                  {photo ? (
                    <>
                      <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Slot Badge */}
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[9px] shadow">
                        #{slotIdx + 1}
                      </span>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSlot(slotIdx);
                        }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 text-white/80 hover:text-red-400 flex items-center justify-center transition"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      <div className="absolute bottom-1 left-1.5 right-1.5 text-left pointer-events-none">
                        <span className="text-[8px] text-amber-300 font-bold block truncate leading-tight">
                          {photo.title}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition">
                      <Plus className="w-5 h-5 mb-1 text-amber-600 dark:text-amber-500" />
                      <span className="text-[10px] font-bold block leading-tight">Slot #{slotIdx + 1}</span>
                      <span className="text-[8px] opacity-75">Choisir</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {activeSlotTarget !== null && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-400/50 dark:border-amber-500/40 rounded-xl p-2 text-center text-[11px] text-amber-900 dark:text-amber-300 animate-in fade-in">
              👉 Touchez une photo ci-dessous pour l'attribuer à l'<strong>Emplacement #{activeSlotTarget + 1}</strong>
            </div>
          )}
        </div>

        {/* Filter bar & Upload toggle */}
        <div className="flex items-center justify-between border-t border-stone-200 dark:border-white/10 pt-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Photos de vos expéditions réalisées :
          </div>
          <button
            onClick={() => setIsUploading(!isUploading)}
            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-1"
          >
            {isUploading ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isUploading ? 'Fermer import' : 'Importer photo'}</span>
          </button>
        </div>

        {/* Inline Upload Form */}
        {isUploading && (
          <form onSubmit={handleAddNewExpeditionPhoto} className="bg-stone-50 dark:bg-slate-950/90 border border-amber-500/40 rounded-2xl p-3.5 space-y-3 animate-in fade-in">
            <h4 className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Camera className="w-4 h-4" />
              Ajouter une photo prise sur le terrain
            </h4>

            {uploadedImageData ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-stone-200 dark:border-white/10">
                <img src={uploadedImageData} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setUploadedImageData(null)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-stone-300 dark:border-white/20 hover:border-amber-500/50 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-transparent">
                <Camera className="w-6 h-6 text-amber-600 dark:text-amber-500 mb-1" />
                <span className="font-bold text-slate-900 dark:text-white">Sélectionner depuis la galerie ou l'appareil</span>
                <span className="text-[10px] text-slate-500">JPG, PNG, WEBP</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">Titre du souvenir :</label>
                <input
                  type="text"
                  placeholder="Ex: Vue sur la canopée"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">Expédition réalisée :</label>
                <select
                  value={newExpedition}
                  onChange={(e) => setNewExpedition(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Bivouac & Canopée Mondah">Bivouac & Canopée Mondah</option>
                  <option value="Expédition Chutes de Djidji">Expédition Chutes de Djidji</option>
                  <option value="Safari Côtier & Bivouac Nyonié">Safari Côtier Nyonié</option>
                  <option value="Trek des Crêtes & Kinguélé">Trek des Crêtes Kinguélé</option>
                  <option value="Restauration Mangrove Wonga">Restauration Mangrove Wonga</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition"
            >
              Ajouter et sélectionner dans mon Top 3
            </button>
          </form>
        )}

        {/* Filter Chips by Park */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'Toutes les expéditions' },
            { id: 'mondah', label: '🌿 Mondah' },
            { id: 'ivindo', label: '🌊 Ivindo' },
            { id: 'pongara', label: '🏖️ Nyonié' },
            { id: 'cristal', label: '⛰️ Monts de Cristal' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilterPark(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedFilterPark === tab.id
                  ? 'bg-slate-900 dark:bg-white/15 text-white font-bold'
                  : 'bg-stone-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Available Photos Grid */}
        <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto no-scrollbar p-0.5">
          {filteredPhotos.map((photo) => {
            const isSelected = selectedTopIds.includes(photo.id);
            const slotIndex = selectedTopIds.indexOf(photo.id);

            return (
              <div
                key={photo.id}
                onClick={() => toggleSelectPhoto(photo.id)}
                className={`group relative rounded-2xl overflow-hidden aspect-[4/3] border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-400/60 shadow-lg'
                    : 'border-stone-300 dark:border-white/10 hover:border-amber-500/40 dark:hover:border-white/30'
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                {/* Top 3 Selection Pin Badge */}
                <div className="absolute top-2 right-2">
                  {isSelected ? (
                    <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border border-amber-300">
                      #{slotIndex + 1}
                    </span>
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-black/50 border border-white/20 text-white flex items-center justify-center hover:bg-amber-600 hover:text-slate-950 transition">
                      +
                    </span>
                  )}
                </div>

                {/* Expedition Badge */}
                <div className="absolute top-2 left-2">
                  <span className="text-[8px] bg-slate-950/80 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                    ✓ Réalisée
                  </span>
                </div>

                {/* Title & Expedition name */}
                <div className="absolute bottom-2 left-2 right-2 text-left pointer-events-none">
                  <span className="text-[8px] text-amber-400 font-bold uppercase tracking-wider block truncate">
                    {photo.expeditionName || photo.parkName}
                  </span>
                  <h5 className="text-xs font-bold text-white truncate drop-shadow">{photo.title}</h5>
                  <span className="text-[9px] text-slate-300 block">{photo.date}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-stone-200 dark:border-white/10 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
          >
            <Check className="w-4 h-4" />
            <span>Valider le Top 3 ({selectedTopIds.length}/3)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
