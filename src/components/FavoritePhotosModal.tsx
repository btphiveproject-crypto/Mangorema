import React, { useState } from 'react';
import { ExpeditionPhoto } from '../types';
import { X, Heart, Plus, Camera, Image as ImageIcon, Check, Sparkles, MapPin, Calendar, Trash2, Eye } from 'lucide-react';

interface FavoritePhotosModalProps {
  photos: ExpeditionPhoto[];
  favoriteIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSaveFavorites: (newFavoriteIds: string[], updatedPhotos: ExpeditionPhoto[]) => void;
}

export const FavoritePhotosModal: React.FC<FavoritePhotosModalProps> = ({
  photos,
  favoriteIds,
  isOpen,
  onClose,
  onSaveFavorites,
}) => {
  const [currentPhotos, setCurrentPhotos] = useState<ExpeditionPhoto[]>(photos);
  const [selectedIds, setSelectedIds] = useState<string[]>(favoriteIds);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'upload'>('all');
  const [previewPhoto, setPreviewPhoto] = useState<ExpeditionPhoto | null>(null);

  // New photo form state
  const [newTitle, setNewTitle] = useState('');
  const [newPark, setNewPark] = useState('Parc National de la Mondah');
  const [newCaption, setNewCaption] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [uploadedImageData, setUploadedImageData] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleFavorite = (photoId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      } else {
        if (prev.length >= 6) {
          alert('Vous pouvez choisir jusqu\'à 6 photos coup de cœur à mettre en avant sur votre profil.');
          return prev;
        }
        return [...prev, photoId];
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImageData(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNewPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = uploadedImageData || newUrl.trim();
    if (!finalUrl) {
      alert('Veuillez sélectionner une image depuis votre appareil ou renseigner une adresse web.');
      return;
    }
    if (!newTitle.trim()) {
      alert('Veuillez donner un titre à votre photo.');
      return;
    }

    const newPhoto: ExpeditionPhoto = {
      id: `photo-custom-${Date.now()}`,
      title: newTitle.trim(),
      parkName: newPark,
      url: finalUrl,
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      caption: newCaption.trim() || 'Photo personnelle ajoutée à mon carnet d\'expédition MANGOREMA.',
      isFavorite: true,
    };

    const updated = [newPhoto, ...currentPhotos];
    setCurrentPhotos(updated);
    setSelectedIds((prev) => [newPhoto.id, ...prev.slice(0, 5)]);

    // Reset form
    setNewTitle('');
    setNewCaption('');
    setNewUrl('');
    setUploadedImageData(null);
    setActiveTab('all');
  };

  const handleSave = () => {
    onSaveFavorites(selectedIds, currentPhotos);
    onClose();
  };

  const displayedPhotos = activeTab === 'favorites'
    ? currentPhotos.filter((p) => selectedIds.includes(p.id))
    : currentPhotos;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#121614] border border-stone-200 dark:border-white/10 w-full max-w-lg rounded-3xl p-5 max-h-[90vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 dark:bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider block">
                GALERIE EXPÉDITIONS GABON
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Choisir mes Photos Préférées</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info & Counter */}
        <div className="bg-stone-50 dark:bg-slate-900/80 border border-stone-200 dark:border-white/5 rounded-2xl p-3.5 flex items-center justify-between text-xs gap-2">
          <div>
            <span className="text-slate-800 dark:text-slate-300 font-semibold block">Sélectionnez vos coups de cœur</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Elles s'afficheront en vitrine sur votre profil d'explorateur (max 6).
            </span>
          </div>
          <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-400/50 dark:border-amber-500/40 px-3 py-1.5 rounded-xl font-mono text-amber-800 dark:text-amber-400 font-black text-sm shrink-0">
            {selectedIds.length} / 6
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1.5 p-1 bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-white/5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'all' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Toutes ({currentPhotos.length})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'favorites' ? 'bg-amber-100 dark:bg-amber-600/30 text-amber-800 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current text-amber-500" />
            <span>Favoris ({selectedIds.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'upload' ? 'bg-emerald-100 dark:bg-emerald-600/30 text-emerald-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter photo</span>
          </button>
        </div>

        {/* TAB 1 & 2: PHOTO GRID */}
        {(activeTab === 'all' || activeTab === 'favorites') && (
          <div className="grid grid-cols-2 gap-2.5 max-h-80 overflow-y-auto no-scrollbar p-0.5">
            {displayedPhotos.map((photo) => {
              const isFav = selectedIds.includes(photo.id);

              return (
                <div
                  key={photo.id}
                  className={`group relative rounded-2xl overflow-hidden border transition-all duration-200 aspect-[4/3] bg-stone-900 dark:bg-slate-950 ${
                    isFav
                      ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                      : 'border-stone-300 dark:border-white/10 hover:border-amber-500/40 dark:hover:border-white/20'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Favorite toggle button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(photo.id);
                    }}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full backdrop-blur-md border flex items-center justify-center transition active:scale-90 ${
                      isFav
                        ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg'
                        : 'bg-black/50 border-white/20 text-white/70 hover:text-white hover:bg-black/70'
                    }`}
                    title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current text-slate-950' : ''}`} />
                  </button>

                  {/* Quick Zoom Preview */}
                  <button
                    type="button"
                    onClick={() => setPreviewPhoto(photo)}
                    className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/80 hover:text-white flex items-center justify-center transition"
                    title="Agrandir"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Photo Title and Park */}
                  <div className="absolute bottom-2 left-2 right-2 text-left pointer-events-none">
                    <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block truncate">
                      {photo.parkName}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate drop-shadow">{photo.title}</h4>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: UPLOAD / ADD NEW PHOTO FORM */}
        {activeTab === 'upload' && (
          <form onSubmit={handleAddNewPhoto} className="space-y-3 p-1 animate-in fade-in">
            {/* File input preview */}
            <div className="border-2 border-dashed border-stone-300 dark:border-white/15 rounded-2xl p-4 text-center space-y-2 bg-stone-50 dark:bg-slate-950/60">
              {uploadedImageData ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-amber-500/50">
                  <img src={uploadedImageData} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setUploadedImageData(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-amber-600 dark:text-amber-500/70 mx-auto" />
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 font-bold text-xs rounded-xl border border-amber-500/30 transition shadow-sm">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Choisir une photo sur mon téléphone</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Formats supportés : JPG, PNG, WEBP</p>
                </>
              )}
            </div>

            <div>
              <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">Ou renseigner l'adresse d'une image (URL) :</label>
              <input
                type="url"
                placeholder="https://..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">Titre de la photo :</label>
                <input
                  type="text"
                  placeholder="Ex: Soirée bivouac Cap Estérias"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">Parc / Lieu au Gabon :</label>
                <select
                  value={newPark}
                  onChange={(e) => setNewPark(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Parc National de la Mondah">Parc de la Mondah</option>
                  <option value="Parc National de l'Ivindo">Parc de l'Ivindo</option>
                  <option value="Parc National de Pongara">Parc de Pongara / Nyonié</option>
                  <option value="Réserve de Wonga-Wongué">Réserve de Wonga-Wongué</option>
                  <option value="Monts de Cristal">Monts de Cristal</option>
                  <option value="Cap Estérias / Phare">Cap Estérias / Phare</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">Légende / Récit de randonnée :</label>
              <textarea
                rows={2}
                placeholder="Quelques mots sur ce moment fort..."
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition"
            >
              Enregistrer et ajouter aux favoris
            </button>
          </form>
        )}

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
            <span>Valider ma Sélection ({selectedIds.length})</span>
          </button>
        </div>

      </div>

      {/* FULL-SCREEN LIGHTBOX MODAL */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col justify-between p-4 animate-in fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="flex justify-between items-center text-white">
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                {previewPhoto.parkName} · {previewPhoto.date}
              </span>
              <h3 className="font-bold text-base text-white">{previewPhoto.title}</h3>
            </div>
            <button
              onClick={() => setPreviewPhoto(null)}
              className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center py-4">
            <img
              src={previewPhoto.url}
              alt={previewPhoto.title}
              className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="bg-white/95 dark:bg-[#121614]/90 border border-stone-200 dark:border-white/10 rounded-2xl p-4 max-w-md mx-auto w-full text-center space-y-2">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{previewPhoto.caption}</p>
            <button
              onClick={() => {
                toggleFavorite(previewPhoto.id);
                setPreviewPhoto(null);
              }}
              className="px-4 py-2 bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 mx-auto"
            >
              <Heart className={`w-3.5 h-3.5 ${selectedIds.includes(previewPhoto.id) ? 'fill-current' : ''}`} />
              <span>{selectedIds.includes(previewPhoto.id) ? 'Retirer des photos favorites' : 'Ajouter à mes photos favorites'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
