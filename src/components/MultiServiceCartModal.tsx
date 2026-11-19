import React, { useState } from 'react';
import { ExpeditionEvent, Booking } from '../types';
import { X, Check, ShieldCheck, Phone, Bus, Tent, UserCheck, Utensils, QrCode, ArrowRight, Download, Sparkles, BellRing } from 'lucide-react';
import confetti from 'canvas-confetti';
import { scheduleBookingNotification } from '../utils/notificationService';
import { CategoryIcon } from './CategoryIcon';

interface MultiServiceCartModalProps {
  event: ExpeditionEvent | null;
  onClose: () => void;
  onBookingConfirmed: (booking: Booking) => void;
}

export const MultiServiceCartModal: React.FC<MultiServiceCartModalProps> = ({
  event,
  onClose,
  onBookingConfirmed,
}) => {
  if (!event) return null;

  // Options
  const [includeShuttle, setIncludeShuttle] = useState(true);
  const [includeTent, setIncludeTent] = useState(false);
  const [includeGuide, setIncludeGuide] = useState(true);
  const [includeMealPack, setIncludeMealPack] = useState(false);

  // Mobile Money
  const [operator, setOperator] = useState<'AIRTEL' | 'MOOV'>('AIRTEL');
  const [phoneNumber, setPhoneNumber] = useState('074 12 34 56');
  const [ussdPin, setUssdPin] = useState('');

  // Flow State
  const [step, setStep] = useState<'cart' | 'ussd' | 'success'>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Price calculations
  const shuttlePrice = includeShuttle ? 5000 : 0;
  const tentPrice = includeTent ? 3000 : 0;
  const guidePrice = includeGuide ? 2500 : 0;
  const mealPackPrice = includeMealPack ? 4000 : 0;
  const grandTotal = event.basePrice + shuttlePrice + tentPrice + guidePrice + mealPackPrice;

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      alert('Veuillez renseigner votre numéro Mobile Money gabonais.');
      return;
    }
    setStep('ussd');
  };

  const handleConfirmPIN = (e: React.FormEvent) => {
    e.preventDefault();
    if (ussdPin.length < 4) {
      alert('Veuillez saisir votre code PIN à 4 chiffres pour autoriser le débit.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const refNumber = `MANG-${operator}-${Math.floor(100000 + Math.random() * 900000)}`;
      const booking: Booking = {
        id: `bk-${Date.now()}`,
        refNumber,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        location: event.location,
        shuttleIncluded: includeShuttle,
        shuttleDetail: includeShuttle ? 'Navette A/R Libreville (Charbonnages)' : undefined,
        tentIncluded: includeTent,
        guideIncluded: includeGuide,
        totalAmount: grandTotal,
        paymentMethod: operator,
        payerPhone: phoneNumber,
        timestamp: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: 'CONFIRMED',
        qrCodeSeed: `MANGOREMA-PASS:${refNumber}:${grandTotal}:GABON`,
      };

      // Automatically schedule local H-1 Web Notification
      scheduleBookingNotification(booking);

      setConfirmedBooking(booking);
      onBookingConfirmed(booking);
      setStep('success');

      // Trigger celebratory confetti
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#d97706', '#ffffff'],
      });
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
      <div className="bg-white dark:bg-[#121614] border border-stone-200 dark:border-white/10 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto no-scrollbar shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Top Modal Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#121614]/95 backdrop-blur-md border-b border-stone-200 dark:border-white/10 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <CategoryIcon category="expeditions" size="sm" />
            <div className="min-w-0">
              <div className="text-[10px] text-amber-700 dark:text-amber-500 font-bold uppercase tracking-wider">
                {step === 'cart' && 'Guichet Unique Outdoor'}
                {step === 'ussd' && 'Passerelle Mobile Money Gabon'}
                {step === 'success' && 'Billet Électronique Validé'}
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{event.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: CART & MULTI-SERVICE OPTIONS */}
        {step === 'cart' && (
          <div className="p-4 space-y-4">
            {/* Event Summary Pill */}
            <div className="bg-stone-50 dark:bg-slate-900/80 border border-stone-200 dark:border-white/5 rounded-2xl p-3 flex gap-3 items-center">
              <img
                src={event.image}
                alt={event.title}
                className="w-16 h-16 rounded-xl object-cover border border-stone-200 dark:border-white/10"
              />
              <div className="flex-1 min-w-0 text-xs">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">{event.parkName}</span>
                <p className="text-slate-800 dark:text-slate-300 font-medium truncate">{event.date}</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] truncate">{event.location}</p>
                <div className="mt-1 font-bold text-amber-700 dark:text-amber-500">
                  Base expédition: {event.basePrice === 0 ? 'Gratuit (Volontariat)' : `${event.basePrice.toLocaleString('fr-FR')} FCFA`}
                </div>
              </div>
            </div>

            {/* Checkbox add-ons */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                Services & Logistique Complémentaires :
              </div>

              {/* Shuttle option */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-white/5 hover:border-amber-500/40 cursor-pointer transition">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={includeShuttle}
                    onChange={(e) => setIncludeShuttle(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-0 bg-white dark:bg-slate-950 border-stone-300 dark:border-white/20"
                  />
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                      Navette A/R mutualisée Libreville
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400">Rond-Point Charbonnages / Okala</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">+5 000 F</span>
              </label>

              {/* Tent option */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-white/5 hover:border-amber-500/40 cursor-pointer transition">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={includeTent}
                    onChange={(e) => setIncludeTent(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-0 bg-white dark:bg-slate-950 border-stone-300 dark:border-white/20"
                  />
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      <Tent className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                      Location Tente Bivouac 2 Places
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400">Double-toit tropical imperméable 3000mm</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">+3 000 F</span>
              </label>

              {/* Guide option */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-white/5 hover:border-amber-500/40 cursor-pointer transition">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={includeGuide}
                    onChange={(e) => setIncludeGuide(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-0 bg-white dark:bg-slate-950 border-stone-300 dark:border-white/20"
                  />
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                      Écoguide Botanique Certifié ANPN
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400">Botanique, faune & sécurité en forêt</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">+2 500 F</span>
              </label>

              {/* Meal option */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-white/5 hover:border-amber-500/40 cursor-pointer transition">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={includeMealPack}
                    onChange={(e) => setIncludeMealPack(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-0 bg-white dark:bg-slate-950 border-stone-300 dark:border-white/20"
                  />
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                      Pack Vivres & Dîner au feu de camp
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400">Poisson braisé forestier & eau minérale</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">+4 000 F</span>
              </label>
            </div>

            {/* Operator Selection */}
            <div className="pt-2 border-t border-stone-200 dark:border-white/10 space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Mode de paiement Mobile Money Gabon :</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOperator('AIRTEL')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    operator === 'AIRTEL'
                      ? 'bg-red-50 dark:bg-red-950/70 border-red-500 text-red-800 dark:text-red-200 shadow-md dark:shadow-red-950/50'
                      : 'bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                  <span>Airtel Money (*150#)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOperator('MOOV')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    operator === 'MOOV'
                      ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-800 dark:text-blue-200 shadow-md dark:shadow-blue-950/50'
                      : 'bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  <span>Moov Money (*555#)</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                  Numéro de débit ({operator === 'AIRTEL' ? '074 / 077' : '065 / 066 / 062'}) :
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="074 XX XX XX"
                    className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Total Recap & Action */}
            <div className="pt-3 border-t border-stone-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 block">Total Panier Unique</span>
                <span className="text-xl font-extrabold text-amber-700 dark:text-amber-400">
                  {grandTotal.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <button
                type="button"
                onClick={handleStartPayment}
                className="px-6 py-3 copper-gradient hover:opacity-95 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-900/25 dark:shadow-amber-900/40 active:scale-95 transition"
              >
                <span>Débiter via {operator === 'AIRTEL' ? 'Airtel' : 'Moov'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: USSD PUSH CONFIRMATION */}
        {step === 'ussd' && (
          <div className="p-5 space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border shadow-xl bg-amber-50 dark:bg-slate-900 border-amber-500/40 text-amber-600 dark:text-amber-500">
              <Phone className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h4 className="font-black text-lg text-slate-900 dark:text-white">Validation USSD en cours</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Un push de débit de <strong className="text-amber-700 dark:text-amber-400">{grandTotal.toLocaleString('fr-FR')} FCFA</strong> a été envoyé sur votre mobile <strong>{phoneNumber}</strong> ({operator === 'AIRTEL' ? 'Airtel Money Gabon' : 'Moov Money Gabon'}).
              </p>
            </div>

            {/* Simulated USSD Modal Prompt */}
            <form onSubmit={handleConfirmPIN} className="bg-stone-50 dark:bg-slate-950 border border-amber-500/40 dark:border-amber-600/40 rounded-2xl p-4 text-left space-y-3">
              <div className="flex justify-between items-center text-[11px] text-amber-700 dark:text-amber-400 font-mono">
                <span>POP-UP {operator} GABON</span>
                <span>*150# / *555#</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200">
                Payer {grandTotal.toLocaleString('fr-FR')} FCFA à MANGOREMA EXPEDITIONS ? Saisissez votre code secret Mobile Money :
              </p>
              <input
                type="password"
                maxLength={4}
                value={ussdPin}
                onChange={(e) => setUssdPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                autoFocus
                className="w-full text-center tracking-[1em] font-mono text-2xl py-2 bg-white dark:bg-slate-900 border border-amber-500/60 rounded-xl text-amber-700 dark:text-amber-400 focus:outline-none"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="flex-1 py-2.5 bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  {isProcessing ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Confirmer PIN'
                  )}
                </button>
              </div>
            </form>

            <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
              Agrément Écotourisme Gabon · Transaction cryptée SSL 256 bits
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS & TICKET WITH QR CODE */}
        {step === 'success' && confirmedBooking && (
          <div className="p-5 space-y-4 text-center">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg dark:shadow-emerald-950/60">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-black text-lg text-slate-900 dark:text-white">Réservation Confirmée !</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Votre pass expédition et vos options ont été validés auprès des écogardes.
              </p>
            </div>

            {/* Electronic Boarding Pass Card */}
            <div className="bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-white/10 rounded-2xl p-4 text-left font-mono space-y-2.5 relative overflow-hidden">
              <div className="absolute right-3 top-3 flex items-center gap-2">
                <img
                  src="/assets/aistudio/Gemini_Generated_Image_vn51dfvn51dfvn51__1__8a19ee16.jpeg"
                  alt="Sceau MANGOREMA Pangolin"
                  className="w-10 h-10 rounded-full border border-amber-500/60 p-0.5 bg-[#080B09] shadow object-cover"
                />
                <QrCode className="w-8 h-8 text-amber-600 dark:text-amber-500 opacity-60" />
              </div>

              <div className="border-b border-stone-200 dark:border-white/10 pb-2 pr-24">
                <span className="text-[9px] text-amber-700 dark:text-amber-400 uppercase tracking-widest block font-bold">RÉCÉPISSÉ MANGOREMA GABON</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{confirmedBooking.refNumber}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block">EXPÉDITION</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold truncate block">{event.title}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block">DATE & LIEU</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{event.date}</span>
                </div>
              </div>

              <div className="border-t border-stone-200 dark:border-white/10 pt-2 text-xs space-y-1">
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>Options :</span>
                  <span>
                    {[
                      confirmedBooking.shuttleIncluded ? 'Navette' : '',
                      confirmedBooking.tentIncluded ? 'Tente' : '',
                      confirmedBooking.guideIncluded ? 'Guide' : '',
                    ]
                      .filter(Boolean)
                      .join(' + ') || 'Pass Seul'}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-amber-700 dark:text-amber-400">
                  <span>Montant Débité :</span>
                  <span>{confirmedBooking.totalAmount.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Canal :</span>
                  <span>{operator} MONEY ({phoneNumber})</span>
                </div>
              </div>

              {/* Notification H-1 Badge */}
              <div className="mt-2.5 pt-2 border-t border-stone-200 dark:border-white/10 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                <BellRing className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-[10px]">
                  Rappel local H-1 programmé : alerte sonore et notification Web 1h avant le départ.
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  alert(
                    `Pass ${confirmedBooking.refNumber} enregistré dans votre profil. Vous recevrez également un SMS de confirmation au ${phoneNumber}.`
                  );
                  onClose();
                }}
                className="w-full py-3 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition"
              >
                Accéder à mes Pass & Billet
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs transition"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
