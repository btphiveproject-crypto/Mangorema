import React, { useEffect, useState } from 'react';
import { ExpeditionPhoto } from '../types';
import { X, Heart, Plus, Camera, Image as ImageIcon, Check, AlertCircle, Eye } from 'lucide-react';
import { sanitizeImageUrl } from '../utils/urlSecurity';
import { useLanguage } from '../contexts/LanguageContext';
import { GABON_SITES_CATALOG } from '../data/gabonSites';

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
  const { lang, t } = useLanguage();
  const dateLocale = lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar-EG' : 'fr-FR';

  const [currentPhotos, setCurrentPhotos] = useState<ExpeditionPhoto[]>(photos);
  const [selectedIds, setSelectedIds] = useState<string[]>(favoriteIds);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'upload'>('all');
  const [previewPhoto, setPreviewPhoto] = useState<ExpeditionPhoto | null>(null);

  // New photo form state
  const [newTitle, setNewTitle] = useState('');
  const [newPark, setNewPark] = useState(
    GABON_SITES_CATALOG[0]?.name || 'Parc National de la Mondah & Cap Estérias'
  );
  const [newCaption, setNewCaption] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [uploadedImageData, setUploadedImageData] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentPhotos(photos);
      setSelectedIds(favoriteIds);
      setFormError(null);
    }
  }, [isOpen, photos, favoriteIds]);

  if (!isOpen) return null;

  const toggleFavorite = (photoId: string) => {
    setFormError(null);
    setSelectedIds((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      } else {
        if (prev.length >= 6) {
          setFormError(t.favoriteModal.maxSixError);
          return prev;
        }
        return [...prev, photoId];
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      setFormError(t.favoriteModal.invalidFormatError);
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setFormError(t.favoriteModal.tooLargeError);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = typeof event.target?.result === 'string' ? event.target.result : '';
      const safeDataUrl = sanitizeImageUrl(result, { allowDataImage: true });
      if (!safeDataUrl) {
        setFormError(t.favoriteModal.corruptFileError);
        return;
      }
      setUploadedImageData(safeDataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleAddNewPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const rawCandidate = uploadedImageData || newUrl.trim();
    if (!rawCandidate) {
      setFormError(t.favoriteModal.missingImageError);
      return;
    }
    const safeUrl = sanitizeImageUrl(rawCandidate, { allowDataImage: Boolean(uploadedImageData) });
    if (!safeUrl) {
      setFormError(t.favoriteModal.invalidUrlError);
      return;
    }
    if (!newTitle.trim()) {
      setFormError(t.favoriteModal.missingTitleError);
      return;
    }

    const newPhoto: ExpeditionPhoto = {
      id: `photo-custom-${Date.now()}`,
      title: newTitle.trim().slice(0, 120),
      parkName: newPark,
      url: safeUrl,
      date: new Date().toLocaleDateString(dateLocale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      caption: newCaption.trim() || t.favoriteModal.defaultCaption,
      isFavorite: true,
    };

    const updated = [newPhoto, ...currentPhotos];
    setCurrentPhotos(updated);
    setSelectedIds((prev) => [newPhoto.id, ...prev.slice(0, 5)]);

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

  const displayedPhotos =
    activeTab === 'favorites'
      ? currentPhotos.filter((p) => selectedIds.includes(p.id))
      : currentPhotos;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="glass-modal border border-white/60 dark:border-white/15 w-full max-w-lg rounded-3xl p-5 max-h-[90vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl text-start">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider block truncate">
                {t.favoriteModal.kicker}
              </span>
              <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white truncate">
                {t.favoriteModal.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="w-8 h-8 rounded-full glass-surface border border-white/50 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info & Counter */}
        <div className="glass-surface border border-white/50 dark:border-white/10 rounded-2xl p-3.5 flex items-center justify-between text-xs gap-2">
          <div className="min-w-0">
            <span className="text-slate-900 dark:text-slate-200 font-semibold block">
              {t.favoriteModal.subtitleTitle}
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">
              {t.favoriteModal.subtitleHint}
            </span>
          </div>
          <div className="bg-amber-500/15 border border-amber-500/40 px-3 py-1.5 rounded-xl font-mono text-amber-800 dark:text-amber-300 font-black text-sm shrink-0 tabular-nums">
            {selectedIds.length} / 6
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1.5 p-1 glass-surface border border-white/50 dark:border-white/10 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-lg transition whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-900 dark:bg-white/15 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.favoriteModal.tabAll} ({currentPhotos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current text-amber-500" />
            <span>
              {t.favoriteModal.tabFavorites} ({selectedIds.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.favoriteModal.tabUpload}</span>
          </button>
        </div>

        {formError && (
          <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-2.5 flex items-center gap-2 text-xs text-red-800 dark:text-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span className="flex-1 text-[11px]">{formError}</span>
          </div>
        )}

        {/* TAB 1 & 2: PHOTO GRID */}
        {(activeTab === 'all' || activeTab === 'favorites') && (
          <div className="grid grid-cols-2 gap-2.5 max-h-80 overflow-y-auto no-scrollbar p-0.5">
            {displayedPhotos.map((photo) => {
              const isFav = selectedIds.includes(photo.id);

              return (
                <div
                  key={photo.id}
                  className={`group relative rounded-2xl overflow-hidden border transition-all duration-200 aspect-[4/3] bg-slate-900 ${
                    isFav
                      ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                      : 'border-white/30 dark:border-white/10 hover:border-amber-500/40'
                  }`}
                >
                  <img
                    src={sanitizeImageUrl(photo.url, { allowDataImage: true })}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(photo.id);
                    }}
                    className={`absolute top-2 end-2 w-8 h-8 rounded-full backdrop-blur-md border flex items-center justify-center transition active:scale-90 ${
                      isFav
                        ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg'
                        : 'bg-black/50 border-white/20 text-white/75 hover:text-white hover:bg-black/70'
                    }`}
                    title={isFav ? t.favoriteModal.removeFavTitle : t.favoriteModal.addFavTitle}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current text-slate-950' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewPhoto(photo)}
                    className="absolute top-2 start-2 w-7 h-7 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white/80 hover:text-white flex items-center justify-center transition"
                    title={t.favoriteModal.zoomTitle}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <div className="absolute bottom-2 inset-x-2 text-start pointer-events-none">
                    <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block truncate">
                      {photo.parkName}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate drop-shadow">
                      {photo.title}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: UPLOAD / ADD NEW PHOTO FORM */}
        {activeTab === 'upload' && (
          <form onSubmit={handleAddNewPhoto} className="space-y-3 p-1 animate-in fade-in">
            <div className="border-2 border-dashed border-slate-400/40 dark:border-white/15 rounded-2xl p-4 text-center space-y-2 glass-surface">
              {sanitizeImageUrl(uploadedImageData, { allowDataImage: true }) ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-amber-500/50">
                  <img
                    src={sanitizeImageUrl(uploadedImageData, { allowDataImage: true })}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setUploadedImageData(null)}
                    className="absolute top-2 end-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto" />
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 glass-card border border-amber-500/35 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-xl transition shadow-sm">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{t.favoriteModal.chooseFileBtn}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {t.favoriteModal.supportedFormats}
                  </p>
                </>
              )}
            </div>

            <div>
              <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">
                {t.favoriteModal.orUrlLabel}
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full glass-surface border border-white/60 dark:border-white/12 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 text-start"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">
                  {t.favoriteModal.titleLabel}
                </label>
                <input
                  type="text"
                  placeholder={t.favoriteModal.titlePlaceholder}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full glass-surface border border-white/60 dark:border-white/12 rounded-xl p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 text-start"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">
                  {t.favoriteModal.parkLabel}
                </label>
                <select
                  value={newPark}
                  onChange={(e) => setNewPark(e.target.value)}
                  className="w-full glass-surface border border-white/60 dark:border-white/12 rounded-xl p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 text-start"
                >
                  {GABON_SITES_CATALOG.map((site) => (
                    <option key={site.id} value={site.name}>
                      {site.shortName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">
                {t.favoriteModal.captionLabel}
              </label>
              <textarea
                rows={2}
                placeholder={t.favoriteModal.captionPlaceholder}
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                className="w-full glass-surface border border-white/60 dark:border-white/12 rounded-xl p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 text-start"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition"
            >
              {t.favoriteModal.saveUploadBtn}
            </button>
          </form>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-900/10 dark:border-white/10 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 glass-surface border border-white/60 dark:border-white/12 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
          >
            <Check className="w-4 h-4" />
            <span>
              {t.favoriteModal.validateSelectionBtn} ({selectedIds.length})
            </span>
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
            <div className="text-start">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                {previewPhoto.parkName} · {previewPhoto.date}
              </span>
              <h3 className="font-bold text-base text-white">{previewPhoto.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              aria-label={t.common.close}
              className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center py-4">
            <img
              src={sanitizeImageUrl(previewPhoto.url, { allowDataImage: true })}
              alt={previewPhoto.title}
              referrerPolicy="no-referrer"
              className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-modal border border-white/15 rounded-2xl p-4 max-w-md mx-auto w-full text-center space-y-2"
          >
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {previewPhoto.caption}
            </p>
            <button
              type="button"
              onClick={() => {
                toggleFavorite(previewPhoto.id);
                setPreviewPhoto(null);
              }}
              className="px-4 py-2 copper-gradient text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 mx-auto"
            >
              <Heart
                className={`w-3.5 h-3.5 ${selectedIds.includes(previewPhoto.id) ? 'fill-current' : ''}`}
              />
              <span>
                {selectedIds.includes(previewPhoto.id)
                  ? t.favoriteModal.removeFromFavBtn
                  : t.favoriteModal.addToFavBtn}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
