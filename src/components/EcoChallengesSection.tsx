/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Camera,
  SwitchCamera,
  ImagePlus,
  RotateCcw,
  Maximize2,
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
import { uploadEcoChallengeProofPhoto } from '../firebase';
import { sanitizeImageUrl } from '../utils/urlSecurity';

interface AuthUserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const MAX_PHOTO_DIMENSION = 1280;
const JPEG_COMPRESSION_QUALITY = 0.82;

async function compressImageBlobToJpeg(source: Blob | File): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return source;
  }

  const objectUrl = URL.createObjectURL(source);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image illisible pour la compression.'));
      el.src = objectUrl;
    });

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) return source;

    const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return source;

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const compressed = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_COMPRESSION_QUALITY)
    );
    return compressed && compressed.size > 0 ? compressed : source;
  } catch {
    return source;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function formatPhotoSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
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
    proofPhotoUrl?: string;
    proofStoragePath?: string;
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

  // Camera & proof photo states
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [expandedProofUrl, setExpandedProofUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors on already-ended streams
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
  }, []);

  const clearCapturedPhoto = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCapturedBlob(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setWasteBagReturned(false);
      setLeaveNoTracePledge(false);
      setWasteNote('');
      setErrorMsg(null);
      setCameraError(null);
      setIsSubmitting(false);
      setUploadProgress(null);
      setExpandedProofUrl(null);
      clearCapturedPhoto();
    } else {
      stopCameraStream();
      clearCapturedPhoto();
      setExpandedProofUrl(null);
    }
  }, [isOpen, challenge?.challengeId, stopCameraStream, clearCapturedPhoto]);

  // Attach active MediaStream once <video> mounts
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {
        // Autoplay fallback handled by muted + playsInline
      });
    }
  }, [isCameraActive]);

  // Always release hardware camera on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const startCamera = async (requestedFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Votre navigateur ne permet pas le flux caméra direct. Utilisez le bouton « Caméra / Photo » ci-dessous.'
      );
      return;
    }

    stopCameraStream();
    setIsStartingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: requestedFacing },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setFacingMode(requestedFacing);
      setIsCameraActive(true);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraError(
          'Accès à la caméra refusé. Autorisez la caméra dans votre navigateur ou utilisez « Caméra / Photo ».'
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraError(
          'Aucune caméra détectée sur cet appareil. Vous pouvez importer une photo avec le bouton ci-dessous.'
        );
      } else {
        setCameraError(
          'Flux caméra indisponible dans ce contexte. Utilisez « Caméra / Photo » pour prendre ou choisir une image.'
        );
      }
      stopCameraStream();
    } finally {
      setIsStartingCamera(false);
    }
  };

  const handleToggleFacingCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  };

  const handleCapturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const rawW = video.videoWidth || 1280;
    const rawH = video.videoHeight || 720;
    if (!rawW || !rawH) {
      setCameraError('La caméra démarre encore. Patientez une seconde avant de capturer.');
      return;
    }

    setIsProcessingPhoto(true);
    setCameraError(null);
    try {
      const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(rawW, rawH));
      const targetW = Math.max(1, Math.round(rawW * scale));
      const targetH = Math.max(1, Math.round(rawH * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas indisponible pour capturer la photo.');
      }
      ctx.drawImage(video, 0, 0, targetW, targetH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_COMPRESSION_QUALITY)
      );
      if (!blob || blob.size === 0) {
        throw new Error('Impossible de capturer l’image.');
      }

      clearCapturedPhoto();
      const nextUrl = URL.createObjectURL(blob);
      setCapturedBlob(blob);
      setPreviewUrl(nextUrl);
      stopCameraStream();
    } catch (err) {
      setCameraError(
        err instanceof Error ? err.message : 'Erreur lors de la capture photo.'
      );
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      setCameraError('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).');
      return;
    }

    setIsProcessingPhoto(true);
    setCameraError(null);
    stopCameraStream();
    try {
      const compressed = await compressImageBlobToJpeg(file);
      if (compressed.size > 6 * 1024 * 1024) {
        setCameraError('La photo reste trop lourde (> 6 Mo). Essayez une photo plus compacte.');
        return;
      }
      clearCapturedPhoto();
      const nextUrl = URL.createObjectURL(compressed);
      setCapturedBlob(compressed);
      setPreviewUrl(nextUrl);
    } catch {
      setCameraError('Impossible de traiter cette image.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  if (!isOpen || !challenge) return null;

  const canSubmit =
    wasteBagReturned &&
    leaveNoTracePledge &&
    Boolean(authUser) &&
    !isSubmitting &&
    !isProcessingPhoto;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !authUser) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setUploadProgress(null);

    try {
      let proofPhotoUrl: string | undefined;
      let proofStoragePath: string | undefined;

      if (capturedBlob) {
        setUploadProgress(5);
        const uploaded = await uploadEcoChallengeProofPhoto(
          authUser.uid,
          challenge.challengeId,
          capturedBlob,
          (pct) => setUploadProgress(pct)
        );
        proofPhotoUrl = uploaded.downloadUrl;
        proofStoragePath = uploaded.storagePath;
      }

      await onConfirmCompletion({
        challenge,
        wasteNote: wasteNote.trim() || undefined,
        proofPhotoUrl,
        proofStoragePath,
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
          : 'Impossible de synchroniser le défi avec Firebase.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
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
                Connectez votre compte Google pour valider ce défi Zéro Déchet, joindre une preuve photo et enregistrer votre badge virtuel dans votre profil cloud.
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
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 p-4 space-y-3">
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

              {sanitizeImageUrl(existingCompletion.proofPhotoUrl) && (
                <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      Preuve photo ramassage (Firebase Storage)
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedProofUrl(sanitizeImageUrl(existingCompletion.proofPhotoUrl) || null)}
                      className="text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Agrandir</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedProofUrl(sanitizeImageUrl(existingCompletion.proofPhotoUrl) || null)}
                    className="block w-full rounded-xl overflow-hidden border border-emerald-500/30 bg-black/20 group relative"
                  >
                    <img
                      src={sanitizeImageUrl(existingCompletion.proofPhotoUrl)}
                      alt={`Preuve ramassage ${existingCompletion.parkName}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-44 object-cover group-hover:scale-[1.02] transition duration-300"
                    />
                  </button>
                </div>
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

            {/* Camera Photo Proof Capture Box */}
            <div className="rounded-2xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-slate-950/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Preuve photo de ramassage</span>
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Synchronisée Firebase Storage
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {cameraError && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/35 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              {isCameraActive ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden bg-black border border-emerald-500/40 aspect-[4/3]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/65 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm">
                      Visée directe · Sac de déchets / site propre
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      disabled={isProcessingPhoto}
                      className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-60"
                    >
                      {isProcessingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                      <span>Capturer</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleFacingCamera}
                      title="Changer de caméra"
                      className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center transition"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="min-h-[44px] px-3 rounded-xl bg-stone-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : previewUrl && capturedBlob ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/45 bg-black/10">
                    <img
                      src={sanitizeImageUrl(previewUrl, { allowBlob: true })}
                      alt="Aperçu preuve ramassage de déchets"
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 bg-black/70 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
                      <span className="truncate">
                        Photo prête · {formatPhotoSize(capturedBlob.size)} (JPEG)
                      </span>
                      <span className="text-emerald-300 font-bold shrink-0">Prêt</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      disabled={isSubmitting}
                      className="flex-1 min-h-[44px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 hover:border-emerald-500/40 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reprendre</span>
                    </button>
                    <button
                      type="button"
                      onClick={clearCapturedPhoto}
                      disabled={isSubmitting}
                      className="min-h-[44px] px-3 py-1.5 rounded-xl border border-red-500/35 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Retirer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    disabled={isStartingCamera || isProcessingPhoto || isSubmitting}
                    className="min-h-[44px] px-3 py-2 rounded-xl copper-gradient text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition disabled:opacity-60"
                  >
                    {isStartingCamera ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <span>Caméra directe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isStartingCamera || isProcessingPhoto || isSubmitting}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 hover:border-emerald-500/50 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-60"
                  >
                    {isProcessingPhoto ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImagePlus className="w-4 h-4" />
                    )}
                    <span>Appareil / Photo</span>
                  </button>
                </div>
              )}
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
                  ? uploadProgress !== null && uploadProgress < 100
                    ? `Envoi photo Firebase Storage (${uploadProgress}%)...`
                    : 'Synchronisation Firestore...'
                  : capturedBlob
                  ? `Valider avec photo (+${challenge.ecoPoints} pts)`
                  : `Valider Zéro Déchet (+${challenge.ecoPoints} pts)`}
              </span>
            </button>
          </form>
        )}
      </div>

      {/* Fullscreen Proof Photo Lightbox */}
      {expandedProofUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setExpandedProofUrl(null);
          }}
        >
          <button
            type="button"
            aria-label="Fermer l'aperçu photo"
            onClick={() => setExpandedProofUrl(null)}
            className="absolute top-4 right-4 min-w-[44px] min-h-[44px] rounded-xl bg-white/15 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={sanitizeImageUrl(expandedProofUrl)}
            alt="Preuve photo ramassage de déchets"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
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
              {computed.currentRankLabel} · Badges &amp; preuves photo Firebase
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
              Connectez Google pour sauvegarder vos défis &amp; preuves photo sur Firebase
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

                  {sanitizeImageUrl(completion?.proofPhotoUrl) && (
                    <button
                      type="button"
                      onClick={() => onOpenChallengeModal(challenge)}
                      title="Voir la preuve photo"
                      className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/40 shrink-0"
                    >
                      <img
                        src={sanitizeImageUrl(completion?.proofPhotoUrl)}
                        alt={`Preuve ${challenge.parkName}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-200/80 dark:border-white/5 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    Badge : <strong>{challenge.badge.name}</strong>
                    {completion?.proofPhotoUrl && (
                      <span className="ml-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                        · Photo jointe
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
