/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  ImagePlus,
  SwitchCamera,
  RotateCcw,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { compressImageBlobToJpeg, formatPhotoSize } from '../utils/imageCompression';
import { useLanguage } from '../contexts/LanguageContext';

interface MediaCaptureBoxProps {
  label?: string;
  helperText?: string;
  compact?: boolean;
  disabled?: boolean;
  uploadProgress?: number | null;
  selectedBlob: Blob | null;
  onBlobChange: (blob: Blob | null) => void;
}

export const MediaCaptureBox: React.FC<MediaCaptureBoxProps> = ({
  label,
  helperText,
  compact = false,
  disabled = false,
  uploadProgress = null,
  selectedBlob,
  onBlobChange,
}) => {
  const { t } = useLanguage();
  const effectiveLabel = label ?? t.media.defaultLabel;
  const effectiveHelper = helperText ?? t.media.defaultHelper;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedBlob) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(selectedBlob);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedBlob]);

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    stopCameraStream();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError(t.media.cameraUnavailable);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
      });
    } catch {
      setCameraError(t.media.cameraDenied);
      setIsCameraActive(false);
    }
  };

  const handleCaptureFrame = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    setIsCompressing(true);
    setCameraError(null);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const rawBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
      );
      if (!rawBlob) throw new Error('Capture failed');

      const compressed = await compressImageBlobToJpeg(rawBlob);
      onBlobChange(compressed);
      stopCameraStream();
    } catch {
      setCameraError(t.media.captureError);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCameraError(t.media.invalidFile);
      return;
    }

    setCameraError(null);
    setIsCompressing(true);
    try {
      const compressed = await compressImageBlobToJpeg(file);
      onBlobChange(compressed);
      stopCameraStream();
    } catch {
      setCameraError(t.media.processError);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    void startCamera(nextMode);
  };

  const handleClear = () => {
    stopCameraStream();
    setCameraError(null);
    onBlobChange(null);
  };

  return (
    <div className="space-y-2.5">
      {!compact && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{effectiveLabel}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{effectiveHelper}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {isCameraActive ? (
        <div className="relative rounded-2xl overflow-hidden border border-white/30 bg-slate-950">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full object-cover ${compact ? 'h-48' : 'h-60'}`}
          />
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-colors whitespace-nowrap"
            >
              <SwitchCamera className="w-4 h-4" />
              {t.media.switchCamera}
            </button>
            <button
              type="button"
              onClick={handleCaptureFrame}
              disabled={isCompressing}
              className="px-4 py-2 rounded-xl copper-gradient text-white text-xs font-bold flex items-center gap-1.5 shadow-lg whitespace-nowrap"
            >
              {isCompressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {t.media.captureBtn}
            </button>
            <button
              type="button"
              onClick={stopCameraStream}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
              aria-label={t.media.closeCameraAria}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : previewUrl && selectedBlob ? (
        <div className="relative rounded-2xl overflow-hidden border border-emerald-500/35 glass-surface">
          <img
            src={previewUrl}
            alt={effectiveLabel}
            className={`w-full object-cover ${compact ? 'h-36' : 'h-52'}`}
          />
          <div className="p-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold min-w-0">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.media.readyLabel} · {formatPhotoSize(selectedBlob.size)}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg glass-card text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                {t.media.changeBtn}
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={handleClear}
                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 transition-colors"
                aria-label={t.media.removeAria}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`grid grid-cols-2 gap-2.5 ${compact ? '' : ''}`}>
          <button
            type="button"
            disabled={disabled || isCompressing}
            onClick={() => startCamera('environment')}
            className={`glass-surface rounded-2xl border border-dashed border-emerald-500/35 hover:border-emerald-500/70 transition-all flex items-center justify-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100 min-h-[44px] whitespace-nowrap ${
              compact ? 'py-2.5 px-3' : 'py-3.5 px-4'
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t.media.takePhotoBtn}</span>
          </button>

          <button
            type="button"
            disabled={disabled || isCompressing}
            onClick={() => fileInputRef.current?.click()}
            className={`glass-surface rounded-2xl border border-dashed border-amber-500/40 hover:border-amber-500/80 transition-all flex items-center justify-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100 min-h-[44px] whitespace-nowrap ${
              compact ? 'py-2.5 px-3' : 'py-3.5 px-4'
            }`}
          >
            {isCompressing ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
            ) : (
              <ImagePlus className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span>{t.media.galleryBtn}</span>
          </button>
        </div>
      )}

      {uploadProgress !== null && uploadProgress >= 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <span>{t.media.uploadingCloud}</span>
            <span className="tabular-nums">{uploadProgress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {cameraError && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{cameraError}</span>
        </div>
      )}
    </div>
  );
};
