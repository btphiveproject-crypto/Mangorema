/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExpertGuide, Booking } from '../types';
import { X, Calendar, UserCheck, ShieldCheck, Star, MapPin, Check, Phone, MessageSquare, AlertCircle } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface ExpertBookingModalProps {
  expert: ExpertGuide | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingConfirmed: (booking: Booking) => void;
}

export const ExpertBookingModal: React.FC<ExpertBookingModalProps> = ({
  expert,
  isOpen,
  onClose,
  onBookingConfirmed,
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-11-21');
  const [durationDays, setDurationDays] = useState(1);
  const [selectedPark, setSelectedPark] = useState(expert?.parks[0] || 'Parc National de la Mondah');
  const [groupSize, setGroupSize] = useState(2);
  const [specialNotes, setSpecialNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'AIRTEL' | 'MOOV' | 'GHETTOPAY'>('AIRTEL');
  const [phone, setPhone] = useState('+241 74 12 34 56');
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState('');

  if (!isOpen || !expert) return null;

  const totalAmount = expert.dayRate * durationDays;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = `EXP-${expert.anpnLicense.split('-').pop() || 'GUIDE'}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking: Booking = {
      id: `bk-guide-${Date.now()}`,
      refNumber: ref,
      eventTitle: `Guide Privé : ${expert.name} (${expert.title})`,
      eventDate: selectedDate,
      location: selectedPark,
      shuttleIncluded: false,
      tentIncluded: false,
      guideIncluded: true,
      totalAmount,
      paymentMethod,
      payerPhone: phone,
      timestamp: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'CONFIRMED',
      qrCodeSeed: `MANGOREMA-EXPERT:${ref}:${expert.id}:${totalAmount}`,
    };

    setConfirmedRef(ref);
    setIsSuccess(true);
    onBookingConfirmed(newBooking);
  };

  const handleClose = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#121614] border border-amber-500/40 dark:border-amber-600/40 w-full max-w-lg rounded-3xl p-5 max-h-[92vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <CategoryIcon category="guides" size="sm" />
            <div>
              <span className="text-[10px] text-amber-700 dark:text-amber-500 font-bold uppercase tracking-wider block">
                ANNUAIRE DES EXPERTS CERTIFIÉS ANPN
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Réserver un Guide Professionnel</h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-xl">
              ✓
            </div>
            <div>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-mono font-bold block">RÉFÉRENCE : {confirmedRef}</span>
              <h4 className="font-serif-display text-xl text-slate-900 dark:text-white font-bold mt-1">Réservation Transmise avec Succès !</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                Votre demande avec <strong>{expert.name}</strong> a été enregistrée. Le guide et le PC Sécurité ANPN ont reçu votre fiche d'expédition.
              </p>
            </div>

            <div className="bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 max-w-sm mx-auto text-left text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Date & Lieu :</span>
                <strong className="text-slate-900 dark:text-white">{selectedDate} ({selectedPark})</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Durée & Groupe :</span>
                <strong className="text-slate-900 dark:text-white">{durationDays} jour(s) · {groupSize} randonneur(s)</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total convenu :</span>
                <strong className="text-amber-700 dark:text-amber-400 font-mono">{totalAmount.toLocaleString('fr-FR')} FCFA</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-stone-200 dark:border-white/5">
                <span>Agrément officiel :</span>
                <strong className="text-emerald-700 dark:text-emerald-400">{expert.anpnLicense}</strong>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="px-6 py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition active:scale-95"
            >
              Fermer & Voir dans mes billets
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Guide Card Mini Preview */}
            <div className="bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/10 rounded-2xl p-3 flex items-start gap-3">
              <img
                src={expert.photo}
                alt={expert.name}
                className="w-14 h-14 rounded-xl object-cover border border-amber-500/50 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{expert.name}</h4>
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] flex items-center justify-center font-bold" title="Vérifié ANPN">
                    ✓
                  </span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">{expert.title}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                    <Star className="w-3 h-3 fill-current" /> {expert.rating}
                  </span>
                  <span>·</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{expert.anpnLicense}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-black text-amber-700 dark:text-amber-400 block font-mono">
                  {expert.dayRate.toLocaleString('fr-FR')} F
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block">/ jour</span>
              </div>
            </div>

            {/* Availability Alert note */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-500/40 rounded-xl p-2.5 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-[11px] leading-tight">{expert.availabilityNote}</span>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Date de départ :
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Durée de l'expédition :
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>1 Journée (Randonnée)</option>
                  <option value={2}>2 Jours / 1 Nuit (Bivouac)</option>
                  <option value={3}>3 Jours (Immersion Forêt)</option>
                  <option value={5}>5 Jours (Grande Expédition)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Parc National visé :
                </label>
                <select
                  value={selectedPark}
                  onChange={(e) => setSelectedPark(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  {expert.parks.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Taille du groupe :
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value))}
                  required
                  className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                Numéro de contact (WhatsApp / SMS) :
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+241 74 XX XX XX"
                required
                className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                Besoins spécifiques & Thématiques (Optionnel) :
              </label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Passionnés d'orchidées, matériel photo lourd à transporter, enfants dans le groupe..."
                className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            {/* Payment method */}
            <div>
              <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Règlement des honoraires du guide :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('AIRTEL')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    paymentMethod === 'AIRTEL'
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 ring-1 ring-red-500'
                      : 'border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>🔴 Airtel Money</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MOOV')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    paymentMethod === 'MOOV'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 ring-1 ring-blue-500'
                      : 'border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>🔵 Moov Money</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('GHETTOPAY')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    paymentMethod === 'GHETTOPAY'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>🟢 GhettoPay</span>
                </button>
              </div>
              {paymentMethod === 'GHETTOPAY' && (
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1.5">
                  Wallet FCFA via{' '}
                  <a
                    href="https://www.ghettopay.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold"
                  >
                    ghettopay.com
                  </a>{' '}
                  · Règlement direct in-app.
                </p>
              )}
            </div>

            {/* Summary & Price */}
            <div className="bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block">Total Honoraires ({durationDays} jour{durationDays > 1 ? 's' : ''}) :</span>
                <strong className="text-base text-amber-700 dark:text-amber-400 font-mono">
                  {totalAmount.toLocaleString('fr-FR')} FCFA
                </strong>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                ✓ Barème Officiel ANPN
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Check className="w-4 h-4" />
                <span>Confirmer la Réservation</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
