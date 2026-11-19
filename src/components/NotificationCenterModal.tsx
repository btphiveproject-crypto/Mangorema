/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScheduledNotification, NotificationPermissionStatus, Booking } from '../types';
import {
  X,
  Bell,
  BellRing,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Trash2,
  Power,
  ShieldCheck,
  Send,
  Bus,
  Compass,
  Calendar,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  getStoredNotifications,
  toggleNotificationEnabled,
  deleteNotification,
  simulateImmediateH1Alert,
  playForestAlertChime,
  isNotificationSupported,
} from '../utils/notificationService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  onTriggerTestBanner: (title: string, body: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  bookings,
  onTriggerTestBanner,
}) => {
  const [permission, setPermission] = useState<NotificationPermissionStatus>('default');
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'warn'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
      setNotifications(getStoredNotifications());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showFeedback = (type: 'success' | 'warn', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
    if (perm === 'granted') {
      showFeedback('success', 'Permission accordée ! Vos alertes H-1 s\'afficheront en temps réel sur cet appareil.');
      playForestAlertChime();
    } else if (perm === 'denied') {
      showFeedback('warn', 'Notifications bloquées dans les paramètres de votre navigateur.');
    }
  };

  const handleToggle = (id: string) => {
    const updated = toggleNotificationEnabled(id);
    setNotifications(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteNotification(id);
    setNotifications(updated);
    showFeedback('success', 'Rappel supprimé.');
  };

  const handleTestChime = () => {
    playForestAlertChime();
    showFeedback('success', 'Carillon sonore d\'expédition joué.');
  };

  const handleTriggerTestAlert = (targetNotif?: ScheduledNotification) => {
    const title = targetNotif ? targetNotif.title : '⏰ [H-1] Départ dans 1h !';
    const body = targetNotif
      ? targetNotif.body
      : 'Votre navette pour Bivouac & Canopée Mondah part à 06h30 au Rond-Point Charbonnages. Préparez votre sac !';

    const result = simulateImmediateH1Alert(title, body);
    onTriggerTestBanner(title, body);

    if (result.nativeSent) {
      showFeedback('success', 'Notification Web native affichée sur votre écran avec succès !');
    } else {
      showFeedback('warn', 'Alerte simulée à l\'écran (Autorisez les notifications système pour l\'alerte en arrière-plan).');
    }
  };

  const activeCount = notifications.filter((n) => n.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4">
      <div className="bg-white dark:bg-[#121614] border border-amber-500/40 dark:border-amber-500/30 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto no-scrollbar shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#121614]/95 backdrop-blur-md border-b border-stone-200 dark:border-white/10 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl copper-gradient text-slate-950 flex items-center justify-center font-bold shadow-md">
              <BellRing className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>API Web Notification</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
              </div>
              <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white">
                Alertes Locales de Départ (H-1)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          
          {/* Feedback Toast */}
          {feedbackMsg && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500/50 text-emerald-800 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/80 border-amber-500/50 text-amber-900 dark:text-amber-200'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <span className="font-medium text-[11px]">{feedbackMsg.text}</span>
            </div>
          )}

          {/* System Permission Card */}
          <div className="bg-gradient-to-r from-stone-50 via-amber-50/60 to-stone-50 dark:from-slate-900/90 dark:via-amber-950/20 dark:to-slate-900/90 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block">
                  Statut Navigateur & OS
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      permission === 'granted'
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                        : permission === 'denied'
                        ? 'bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-500/40'
                        : 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {permission === 'granted' && '✓ Notifications Autorisées'}
                    {permission === 'denied' && '✕ Notifications Bloquées'}
                    {permission === 'default' && '⏳ En attente d\'autorisation'}
                    {permission === 'unsupported' && '⚠ API Non Supportée'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                  Les alertes sont déclenchées automatiquement <strong>60 minutes avant le départ</strong> de la navette ou le début du trek, même hors-ligne.
                </p>
              </div>

              {permission !== 'granted' && (
                <button
                  onClick={handleRequestPermission}
                  className="px-3 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-xs shrink-0 shadow-md active:scale-95 transition"
                >
                  Activer
                </button>
              )}
            </div>

            {/* Quick Test Actions */}
            <div className="pt-2 border-t border-stone-200 dark:border-white/5 flex items-center justify-between gap-2">
              <button
                onClick={handleTestChime}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition"
                title="Tester le carillon audio équatorial"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Tester le carillon</span>
              </button>

              <button
                onClick={() => handleTriggerTestAlert()}
                className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-800 dark:text-amber-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Tester l'alerte H-1 en direct</span>
              </button>
            </div>
          </div>

          {/* List of Scheduled H-1 Alerts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                Rappels Programmés ({activeCount}/{notifications.length})
              </h4>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Déclenchement à H-60 min</span>
            </div>

            {notifications.length === 0 ? (
              <div className="bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-white/5 rounded-2xl p-5 text-center text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <Bell className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                <p>Aucun rappel de départ programmé pour le moment.</p>
                <p className="text-[11px] text-slate-500">
                  Réservez une expédition ou une navette pour activer automatiquement l'alerte 1h avant le départ.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((n) => {
                  return (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-2xl border transition relative overflow-hidden ${
                        n.enabled
                          ? 'bg-stone-50 dark:bg-slate-900/90 border-amber-500/40 dark:border-amber-500/30 shadow-md'
                          : 'bg-stone-100/70 dark:bg-slate-950/60 border-stone-200 dark:border-white/5 opacity-65'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {n.targetType === 'SHUTTLE' ? (
                              <span className="text-[9px] bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/35 dark:border-amber-500/30 px-2 py-0.5 rounded-md font-bold uppercase flex items-center gap-1">
                                <Bus className="w-2.5 h-2.5" /> Navette
                              </span>
                            ) : n.targetType === 'ECO_CHALLENGE' ? (
                              <span className="text-[9px] bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/35 dark:border-emerald-500/30 px-2 py-0.5 rounded-md font-bold uppercase flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> Défi Éco Hebdo
                              </span>
                            ) : (
                              <span className="text-[9px] bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/35 dark:border-emerald-500/30 px-2 py-0.5 rounded-md font-bold uppercase flex items-center gap-1">
                                <Compass className="w-2.5 h-2.5" /> Expédition
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                                n.status === 'TRIGGERED'
                                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                                  : 'bg-stone-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {n.status === 'TRIGGERED' ? 'Déclenché' : 'En veille'}
                            </span>
                          </div>

                          <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{n.eventTitle}</h5>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate">{n.location}</p>

                          <div className="pt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                            <span>
                              Départ : <strong className="text-slate-900 dark:text-white font-mono">{n.departureTimeFormatted}</strong>
                            </span>
                            <span className="text-amber-700 dark:text-amber-400 font-bold">
                              ⏰ Alerte H-1 : <strong className="font-mono">{n.alertTimeFormatted}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Enable/Disable Switch & Delete */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <button
                            onClick={() => handleToggle(n.id)}
                            className={`w-9 h-5 rounded-full transition p-0.5 flex items-center ${
                              n.enabled ? 'bg-amber-500 justify-end' : 'bg-stone-300 dark:bg-slate-700 justify-start'
                            }`}
                            title={n.enabled ? 'Désactiver le rappel' : 'Activer le rappel'}
                          >
                            <span className="w-4 h-4 rounded-full bg-white dark:bg-slate-950 shadow-md" />
                          </button>

                          <button
                            onClick={() => handleDelete(n.id)}
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition"
                            title="Supprimer ce rappel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Immediate Trigger Button for this item */}
                      <div className="pt-2 mt-2 border-t border-stone-200 dark:border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[9px] text-slate-600 dark:text-slate-400">
                          {n.enabled ? '🟢 Surveillance active' : '⚪ Surveillance en pause'}
                        </span>
                        <button
                          onClick={() => handleTriggerTestAlert(n)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-950 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition active:scale-95"
                        >
                          <Send className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Simuler cette alerte maintenant</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Educational Note for Gabon & Mobile */}
          <div className="bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/5 rounded-2xl p-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-[11px]">
              <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              <span>Fonctionnement hors-ligne & mobile</span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
              L'API Web Notification fonctionne directement sur votre appareil (Android Chrome, PWA installée, PC/Mac). Aucun forfait internet n'est requis au moment de la sonnerie : l'heure de départ est calculée et gardée en mémoire dans votre navigateur.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
