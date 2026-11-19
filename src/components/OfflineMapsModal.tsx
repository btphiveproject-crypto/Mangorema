/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OfflineMapPackage } from '../types';
import { OFFLINE_MAP_PACKAGES, getDownloadedMapIds, downloadMapPackage, deleteMapPackage, getTotalStorageUsedMB } from '../utils/offlineMapStorage';
import { X, Map, Download, Trash2, CheckCircle2, HardDrive, Wifi, WifiOff, RefreshCw, Shield, AlertCircle } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMapsUpdated?: () => void;
}

export const OfflineMapsModal: React.FC<OfflineMapsModalProps> = ({
  isOpen,
  onClose,
  onMapsUpdated,
}) => {
  const isOnline = useOnlineStatus();
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [currentTileCount, setCurrentTileCount] = useState<{ [key: string]: number }>({});
  const [totalMB, setTotalMB] = useState<number>(0);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const ids = getDownloadedMapIds();
      setDownloadedIds(ids);
      setTotalMB(getTotalStorageUsedMB());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = async (pkg: OfflineMapPackage) => {
    setDownloadingId(pkg.id);
    setProgress((prev) => ({ ...prev, [pkg.id]: 0 }));

    try {
      await downloadMapPackage(pkg, (pct, current, total) => {
        setProgress((prev) => ({ ...prev, [pkg.id]: pct }));
        setCurrentTileCount((prev) => ({ ...prev, [pkg.id]: current }));
      });

      const updated = getDownloadedMapIds();
      setDownloadedIds(updated);
      setTotalMB(getTotalStorageUsedMB());
      setFeedbackMsg(`✓ Fonds de carte pour ${pkg.name} téléchargés dans le stockage local.`);
      if (onMapsUpdated) onMapsUpdated();
    } catch {
      setFeedbackMsg('Erreur lors du téléchargement. Veuillez vérifier votre connexion.');
    } finally {
      setDownloadingId(null);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleDelete = async (pkg: OfflineMapPackage) => {
    await deleteMapPackage(pkg.id);
    const updated = getDownloadedMapIds();
    setDownloadedIds(updated);
    setTotalMB(getTotalStorageUsedMB());
    setFeedbackMsg(`Fonds de carte pour ${pkg.name} retirés du stockage local.`);
    if (onMapsUpdated) onMapsUpdated();
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#121614] border border-amber-500/40 dark:border-amber-600/40 w-full max-w-lg rounded-3xl p-5 max-h-[92vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-bold shadow">
              <Map className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] text-amber-700 dark:text-amber-500 font-bold uppercase tracking-wider block">
                STOCKAGE LOCAL DU NAVIGATEUR
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Cartes Hors-Ligne (OpenStreetMap)</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Storage & Connection Status Card */}
        <div className="bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="font-bold text-slate-800 dark:text-slate-200">Espace utilisé dans le cache :</span>
            </div>
            <strong className="text-amber-700 dark:text-amber-400 font-mono text-sm">
              {totalMB.toFixed(1)} Mo / 150 Mo
            </strong>
          </div>

          {/* Storage bar */}
          <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-slate-900 border border-stone-300 dark:border-white/5 overflow-hidden">
            <div
              className="h-full copper-gradient rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalMB / 150) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Connecté (Prêt pour téléchargement)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-700 dark:text-amber-300">Mode Hors-Ligne Actif</span>
                </>
              )}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">
              {downloadedIds.length} parc(s) en mémoire
            </span>
          </div>
        </div>

        {/* Notification Toast */}
        {feedbackMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-3 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] leading-tight font-medium">{feedbackMsg}</span>
          </div>
        )}

        {/* Explanation Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-500/40 dark:border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px]">
            En pleine forêt équatoriale (Ivindo, Mondah, Nyonié), la couverture 4G est inexistante. En téléchargeant ces fonds de carte, les tuiles OpenStreetMap sont stockées dans la mémoire locale de votre navigateur pour un affichage fluide <strong>100% hors-ligne</strong>.
          </p>
        </div>

        {/* List of Available Packages */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center justify-between">
            <span>Packs Territoriaux Disponibles ({OFFLINE_MAP_PACKAGES.length}) :</span>
          </h4>

          <div className="space-y-2.5">
            {OFFLINE_MAP_PACKAGES.map((pkg) => {
              const isDownloaded = downloadedIds.includes(pkg.id);
              const isDownloading = downloadingId === pkg.id;
              const currentPct = progress[pkg.id] ?? 0;
              const currentTiles = currentTileCount[pkg.id] ?? 0;

              return (
                <div
                  key={pkg.id}
                  className={`border rounded-2xl p-3.5 space-y-2.5 transition ${
                    isDownloaded
                      ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900/90'
                      : 'bg-stone-50 dark:bg-slate-900/80 border-stone-200 dark:border-white/10 hover:border-stone-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider block">
                        {pkg.region}
                      </span>
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">{pkg.name}</h5>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block font-mono">
                        {pkg.sizeMB} Mo
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-mono">
                        ~{pkg.estimatedTiles} tuiles
                      </span>
                    </div>
                  </div>

                  {/* Resolution info */}
                  <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 pt-1 border-t border-stone-200 dark:border-white/5">
                    <span>Niveau de zoom : <strong className="text-slate-800 dark:text-slate-300">{pkg.zoomRange}</strong></span>
                    {isDownloaded && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Disponible hors-ligne</span>
                      </span>
                    )}
                  </div>

                  {/* Progress Bar during download */}
                  {isDownloading && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-amber-700 dark:text-amber-300 font-mono">
                        <span>Mise en cache des tuiles OSM...</span>
                        <span>{currentPct}% ({currentTiles}/{pkg.estimatedTiles})</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-slate-950 overflow-hidden">
                        <div
                          className="h-full copper-gradient rounded-full transition-all duration-150"
                          style={{ width: `${currentPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    {isDownloaded ? (
                      <>
                        <button
                          onClick={() => handleDownload(pkg)}
                          disabled={isDownloading}
                          className="px-2.5 py-1.5 bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                          title="Actualiser les tuiles"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Mettre à jour</span>
                        </button>
                        <button
                          onClick={() => handleDelete(pkg)}
                          className="px-2.5 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-500/35 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                          title="Supprimer du stockage pour libérer de l'espace"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Supprimer</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDownload(pkg)}
                        disabled={isDownloading}
                        className="px-4 py-2 copper-gradient text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow active:scale-95 transition disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isDownloading ? 'Téléchargement...' : 'Télécharger le pack (.osm)'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="pt-2 border-t border-stone-200 dark:border-white/10">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs transition"
          >
            Fermer le gestionnaire hors-ligne
          </button>
        </div>

      </div>
    </div>
  );
};
