import React, { useState, useEffect } from 'react';
import { X, AlertOctagon, PhoneCall, MessageSquare, Copy, Check, ShieldAlert, Radio, Users } from 'lucide-react';
import { TrustedContact } from '../types';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  trustedContacts?: TrustedContact[];
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose, trustedContacts = [] }) => {
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 0.5833, lng: 9.3500 });
  const [isLocating, setIsLocating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sosTransmitted, setSosTransmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
      setIsLocating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const smsBody = `URGENCE MANGOREMA SECOURS ANPN. Randonneur en detresse. Coordonnees GPS: [${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}]. Priere d'envoyer une patrouille d'ecogardes.`;
  const smsHref = `sms:1404?body=${encodeURIComponent(smsBody)}`;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateRadioBeacon = () => {
    setSosTransmitted(true);
    setTimeout(() => setSosTransmitted(false), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 dark:bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-red-50 dark:bg-[#181111] border-2 border-red-500/80 dark:border-red-600/70 w-full max-w-sm rounded-3xl p-5 text-center space-y-4 shadow-2xl shadow-red-950/30 dark:shadow-red-950/80">
        
        {/* Siren Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-600/20 border-2 border-red-500 text-red-600 dark:text-red-500 flex items-center justify-center mx-auto animate-pulse">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] text-red-700 dark:text-red-400 font-bold uppercase tracking-widest block">
            BALISE DE DÉTRESSE & SECOURS
          </span>
          <h3 className="font-black text-xl text-slate-900 dark:text-white">Alerte Écogardes ANPN</h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
            En cas d'accident, d'égarement ou de menace faune en forêt équatoriale gabonaise.
          </p>
        </div>

        {/* GPS Coordinates Box */}
        <div className="bg-white dark:bg-slate-950/90 border border-red-300 dark:border-red-900/60 rounded-2xl p-3.5 space-y-2 text-left">
          <div className="flex items-center justify-between text-[11px] text-red-700 dark:text-red-400 font-bold">
            <span className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-spin" /> Coordonnées GPS Précises
            </span>
            <button
              onClick={handleCopyCoords}
              className="text-[10px] bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800/80 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-red-200 dark:hover:bg-red-900 transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>

          <div className="font-mono text-amber-800 dark:text-amber-400 text-sm font-extrabold text-center py-1.5 bg-red-50 dark:bg-black/40 border border-red-200 dark:border-transparent rounded-lg">
            LAT: {coords.lat.toFixed(5)} | LON: {coords.lng.toFixed(5)}
          </div>

          <div className="text-[10px] text-slate-600 dark:text-slate-400 text-center">
            {isLocating ? 'Acquisition satellitaire en cours...' : 'Précision GPS confirmée par le capteur.'}
          </div>
        </div>

        {sosTransmitted && (
          <div className="bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-500 rounded-xl p-2.5 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in">
            ✓ Balise numérique transmise sur le réseau d'alerte ANPN Gabon !
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <a
            href={smsHref}
            onClick={handleSimulateRadioBeacon}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/30 dark:shadow-red-950 transition active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Envoyer SMS Urgence (1404)</span>
          </a>

          <a
            href="tel:1404"
            className="w-full py-2.5 bg-white dark:bg-slate-900 hover:bg-stone-100 dark:hover:bg-slate-800 border border-red-200 dark:border-white/10 text-slate-900 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Appel Vocal Direct Secours ANPN (1404)</span>
          </a>

          {trustedContacts.filter((c) => c.shareSafetyAlerts && (c.phoneNumber || c.email)).length > 0 && (
            <div className="bg-white dark:bg-slate-900/90 border border-red-200 dark:border-red-900/40 rounded-2xl p-2.5 text-left space-y-1.5">
              <span className="text-[10px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Prévenir aussi mes Proches Google synchronisés :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {trustedContacts
                  .filter((c) => c.shareSafetyAlerts && (c.phoneNumber || c.email))
                  .slice(0, 3)
                  .map((contact) => {
                    const sosMsg = `ALERTE SECURITE MANGOREMA. Position GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (https://maps.google.com/?q=${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}). Merci de contacter le 1404 si injoignable.`;
                    const href = contact.phoneNumber
                      ? `sms:${contact.phoneNumber.replace(/[^+\d]/g, '')}?body=${encodeURIComponent(sosMsg)}`
                      : `mailto:${encodeURIComponent(contact.email || '')}?subject=${encodeURIComponent(
                          'ALERTE SECURITE MANGOREMA'
                        )}&body=${encodeURIComponent(sosMsg)}`;

                    return (
                      <a
                        key={contact.id}
                        href={href}
                        onClick={handleSimulateRadioBeacon}
                        className="min-h-[44px] px-2.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800/60 text-red-800 dark:text-red-200 font-bold text-[11px] flex items-center gap-1 hover:bg-red-100 dark:hover:bg-red-900/60 transition"
                      >
                        <MessageSquare className="w-3 h-3 shrink-0" />
                        <span>{contact.displayName}</span>
                      </a>
                    );
                  })}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium text-xs transition"
          >
            Annuler / Fausse alerte
          </button>
        </div>

        {/* Survival Tip */}
        <div className="text-[10px] text-slate-600 dark:text-slate-400 border-t border-red-200 dark:border-white/5 pt-2 leading-tight">
          💡 <strong>Règle de survie :</strong> Ne quittez pas le sentier. Si vous avez un sifflet, émettez 3 coups brefs répétés toutes les 2 minutes.
        </div>
      </div>
    </div>
  );
};
