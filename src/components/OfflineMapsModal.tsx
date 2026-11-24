/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OfflineMapPackage, OfflineParkMapData } from '../types';
import {
  OFFLINE_MAP_PACKAGES,
  getDownloadedMapIds,
  getStoredOfflineMaps,
  downloadMapPackage,
  downloadAllMapPackages,
  deleteMapPackage,
  getTotalStorageUsedMB,
  getLocalStorageMapKB,
} from '../utils/offlineMapStorage';
import {
  X,
  Map,
  Download,
  Trash2,
  CheckCircle2,
  HardDrive,
  Wifi,
  WifiOff,
  RefreshCw,
  Shield,
  Eye,
  Compass,
} from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMapsUpdated?: () => void;
  onViewOfflineMap?: (parkId: string) => void;
}

export const OfflineMapsModal: React.FC<OfflineMapsModalProps> = ({
  isOpen,
  onClose,
  onMapsUpdated,
  onViewOfflineMap,
}) => {
  const isOnline = useOnlineStatus();
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [storedMaps, setStoredMaps] = useState<Record<string, OfflineParkMapData>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [currentTileCount, setCurrentTileCount] = useState<{ [key: string]: number }>({});
  const [totalMB, setTotalMB] = useState<number>(0);
  const [localKB, setLocalKB] = useState<number>(0);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const syncLocalState = () => {
    setDownloadedIds(getDownloadedMapIds());
    setStoredMaps(getStoredOfflineMaps());
    setTotalMB(getTotalStorageUsedMB());
    setLocalKB(getLocalStorageMapKB());
  };

  useEffect(() => {
    if (isOpen) {
      syncLocalState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = async (pkg: OfflineMapPackage) => {
    setDownloadingId(pkg.id);
    setProgress((prev) => ({ ...prev, [pkg.id]: 0 }));

    try {
      await downloadMapPackage(pkg, (pct, current) => {
        setProgress((prev) => ({ ...prev, [pkg.id]: pct }));
        setCurrentTileCount((prev) => ({ ...prev, [pkg.id]: current }));
      });

      syncLocalState();
      setFeedbackMsg(`✓ Carte, sentiers GPS et repères ANPN de ${pkg.name} enregistrés dans LocalStorage.`);
      onMapsUpdated?.();
    } catch {
      setFeedbackMsg('Erreur lors du téléchargement local.');
    } finally {
      setDownloadingId(null);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      await downloadAllMapPackages((done, total, currentName) => {
        if (currentName) {
          setFeedbackMsg(`Téléchargement LocalStorage (${done + 1}/${total}) : ${currentName}...`);
        }
      });
      syncLocalState();
      setFeedbackMsg(`✓ Toutes les cartes des ${OFFLINE_MAP_PACKAGES.length} parcs nationaux sont disponibles hors-ligne.`);
      onMapsUpdated?.();
    } catch {
      setFeedbackMsg('Erreur lors de la synchronisation globale.');
    } finally {
      setIsDownloadingAll(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleDelete = async (pkg: OfflineMapPackage) => {
    await deleteMapPackage(pkg.id);
    syncLocalState();
    setFeedbackMsg(`Carte de ${pkg.name} retirée du LocalStorage.`);
    onMapsUpdated?.();
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const allDownloaded = OFFLINE_MAP_PACKAGES.every((p) => downloadedIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#121614] border border-amber-500/40 dark:border-amber-600/40 w-full max-w-lg rounded-3xl p-5 max-h-[92vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl copper-gradient text-slate-950 flex items-center justify-center font-bold shadow shrink-0">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-amber-700 dark:text-amber-500 font-bold uppercase tracking-wider block">
                LOCALSTORAGE & CACHE HORS-LIGNE
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Cartes des Parcs Nationaux
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="min-h-[40px] min-w-[40px] rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Storage & Connection Status Card */}
        <div className="bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs gap-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Stockage hors-ligne utilisé :
              </span>
            </div>
            <strong className="text-amber-700 dark:text-amber-400 font-mono text-xs tabular-nums">
              {totalMB.toFixed(1)} Mo · {localKB} Ko JSON
            </strong>
          </div>

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
                  <span>Connecté · Prêt pour téléchargement</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-700 dark:text-amber-300 font-semibold">
                    Hors-Ligne · Lecture depuis LocalStorage
                  </span>
                </>
              )}
            </span>
            <span className="text-slate-600 dark:text-slate-400 font-mono tabular-nums text-[10px]">
              {downloadedIds.length}/{OFFLINE_MAP_PACKAGES.length} parcs
            </span>
          </div>

          {!allDownloaded && (
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={isDownloadingAll || Boolean(downloadingId)}
              className="w-full min-h-[42px] px-3 py-2 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow active:scale-95 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isDownloadingAll
                  ? 'Téléchargement des 6 parcs...'
                  : `Tout télécharger dans LocalStorage (${OFFLINE_MAP_PACKAGES.length} parcs)`}
              </span>
            </button>
          )}
        </div>

        {/* Feedback Toast */}
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
            Sans couverture 4G en forêt (Ivindo, Mondah, Loango, La Lopé), chaque pack téléchargé stocke les tracés GPS, postes ANPN, bivouacs et repères topographiques directement dans votre <strong>LocalStorage</strong> pour une consultation immédiate hors-ligne.
          </p>
        </div>

        {/* List of Available Packages */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300">
            Parcs Nationaux Disponibles ({OFFLINE_MAP_PACKAGES.length})
          </h4>

          {OFFLINE_MAP_PACKAGES.map((pkg) => {
            const isDownloaded = downloadedIds.includes(pkg.id);
            const mapData = storedMaps[pkg.id];
            const isDownloading = downloadingId === pkg.id;
            const currentPct = progress[pkg.id] ?? 0;
            const currentTiles = currentTileCount[pkg.id] ?? 0;

            return (
              <div
                key={pkg.id}
                className={`border rounded-2xl p-3.5 space-y-2.5 transition ${
                  isDownloaded
                    ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900/90'
                    : 'bg-stone-50 dark:bg-slate-900/80 border-stone-200 dark:border-white/10'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">
                      {pkg.region}
                    </span>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                      {pkg.name}
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block font-mono tabular-nums">
                      {pkg.sizeMB} Mo
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono tabular-nums">
                      ~{pkg.estimatedTiles} tuiles
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-slate-600 dark:text-slate-400 pt-1.5 border-t border-stone-200 dark:border-white/5">
                  <span>
                    {mapData
                      ? `${mapData.trails.length} sentier(s) GPS · ${mapData.waypoints.length} repères ANPN`
                      : pkg.zoomRange}
                  </span>
                  {isDownloaded && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sauvé LocalStorage</span>
                    </span>
                  )}
                </div>

                {isDownloading && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-amber-700 dark:text-amber-300 font-mono tabular-nums">
                      <span>Sauvegarde tuiles & vecteurs GPS...</span>
                      <span>
                        {currentPct}% ({currentTiles}/{pkg.estimatedTiles})
                      </span>
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
                <div className="pt-1 flex flex-wrap items-center justify-end gap-2">
                  {isDownloaded ? (
                    <>
                      {onViewOfflineMap && (
                        <button
                          type="button"
                          onClick={() => {
                            onViewOfflineMap(pkg.parkId);
                            onClose();
                          }}
                          className="min-h-[38px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Consulter hors-ligne</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownload(pkg)}
                        disabled={isDownloading || isDownloadingAll}
                        className="min-h-[38px] px-2.5 py-1.5 bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                        title="Mettre à jour le cache LocalStorage"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>MàJ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pkg)}
                        disabled={isDownloadingAll}
                        className="min-h-[38px] px-2.5 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-500/35 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                        title="Supprimer du stockage"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Supprimer</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDownload(pkg)}
                      disabled={isDownloading || isDownloadingAll}
                      className="min-h-[40px] px-4 py-2 copper-gradient text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow active:scale-95 transition disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        {isDownloading ? 'Téléchargement...' : 'Télécharger (LocalStorage)'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Close Button */}
        <div className="pt-2 border-t border-stone-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[42px] py-2.5 bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Fermer le gestionnaire hors-ligne</span>
          </button>
        </div>
      </div>
    </div>
  );
};
