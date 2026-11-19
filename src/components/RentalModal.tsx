/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RentalItem, Booking } from '../types';
import { X, Tent, Backpack, Bike, Radio, Shield, MapPin, Camera, Check, AlertTriangle, QrCode, Phone, CheckCircle2 } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface RentalModalProps {
  rentals: RentalItem[];
  isOpen: boolean;
  onClose: () => void;
  onRentalConfirmed: (booking: Booking) => void;
}

export const RentalModal: React.FC<RentalModalProps> = ({
  rentals,
  isOpen,
  onClose,
  onRentalConfirmed,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<RentalItem | null>(null);
  const [rentalDays, setRentalDays] = useState(2);
  const [startDate, setStartDate] = useState('2026-11-20');
  const [depositMethod, setDepositMethod] = useState<'AIRTEL' | 'MOOV'>('AIRTEL');
  const [contactPhone, setContactPhone] = useState('+241 74 12 34 56');
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Inspection Checklist state simulation
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [photoAdded, setPhotoAdded] = useState(true);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Tout le matériel', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'tente', label: '⛺ Tentes Bivouac', icon: <Tent className="w-3.5 h-3.5" /> },
    { id: 'sac_a_dos', label: '🎒 Sacs à Dos', icon: <Backpack className="w-3.5 h-3.5" /> },
    { id: 'vtt', label: '🚵 VTT Forêt', icon: <Bike className="w-3.5 h-3.5" /> },
    { id: 'balise_gps', label: '🛰️ Balises GPS SOS', icon: <Radio className="w-3.5 h-3.5" /> },
  ];

  const filteredRentals = rentals.filter((r) => {
    if (selectedCategory === 'all') return true;
    return r.category === selectedCategory;
  });

  const activeItem = selectedItem || rentals[0];
  const totalRentalPrice = activeItem.pricePerDay * rentalDays;

  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = `LOC-${activeItem.category.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking: Booking = {
      id: `bk-rent-${Date.now()}`,
      refNumber: ref,
      eventTitle: `Location : ${activeItem.name}`,
      eventDate: `Du ${startDate} (${rentalDays}j)`,
      location: activeItem.pickupLocation,
      shuttleIncluded: false,
      tentIncluded: activeItem.category === 'tente',
      guideIncluded: false,
      totalAmount: totalRentalPrice,
      paymentMethod: depositMethod,
      payerPhone: contactPhone,
      timestamp: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'CONFIRMED',
      qrCodeSeed: `MANGOREMA-RENTAL:${ref}:${activeItem.id}:${activeItem.depositAmount}`,
    };

    setConfirmedBooking(newBooking);
    setIsSuccess(true);
    onRentalConfirmed(newBooking);
  };

  const handleClose = () => {
    setIsSuccess(false);
    setSelectedItem(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#121614] border border-amber-500/40 dark:border-amber-600/40 w-full max-w-lg rounded-3xl p-5 max-h-[92vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <CategoryIcon category="location" size="sm" />
            <div>
              <span className="text-[10px] text-amber-700 dark:text-amber-500 font-bold uppercase tracking-wider block">
                MANGOREMA LOCATION · MATÉRIEL OUTDOOR
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Équipements Partenaires & Bivouac</h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess && confirmedBooking ? (
          <div className="py-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-xl">
              ✓
            </div>
            <div>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-mono font-bold block">
                CONTRAT DE LOCATION : {confirmedBooking.refNumber}
              </span>
              <h4 className="font-serif-display text-xl text-slate-900 dark:text-white font-bold mt-1">
                Matériel Réservé avec Caution Sécurisée !
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                Votre bon de retrait pour <strong>{activeItem.name}</strong> est disponible. Présentez ce pass au comptoir partenaire lors du retrait pour l'état des lieux photo.
              </p>
            </div>

            <div className="bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-white/10 rounded-2xl p-4 max-w-sm mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Point de retrait :</span>
                <strong className="text-slate-900 dark:text-white text-right">{activeItem.pickupLocation}</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Partenaire :</span>
                <strong className="text-amber-700 dark:text-amber-400">{activeItem.partnerName}</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Caution séquestrée :</span>
                <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{activeItem.depositAmount.toLocaleString('fr-FR')} F ({depositMethod})</strong>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 pt-1 border-t border-stone-200 dark:border-white/5">
                <span>Location ({rentalDays} jours) :</span>
                <strong className="text-slate-900 dark:text-white font-mono">{totalRentalPrice.toLocaleString('fr-FR')} FCFA</strong>
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
          <>
            {/* Category Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    selectedCategory === c.id
                      ? 'bg-amber-600 text-slate-950 font-bold shadow'
                      : 'bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Equipment Grid */}
            <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto no-scrollbar p-0.5">
              {filteredRentals.map((item) => {
                const isSelected = activeItem.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`group relative rounded-2xl overflow-hidden aspect-[4/3] border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/70 dark:ring-amber-400/70 shadow-lg'
                        : 'border-stone-200 dark:border-white/10 hover:border-stone-400 dark:hover:border-white/30'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {/* Availability Tag */}
                    <span className="absolute top-2 left-2 text-[8px] bg-slate-950/80 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                      {item.availableQuantity} dispo sur {item.totalQuantity}
                    </span>

                    <span className="absolute top-2 right-2 text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded shadow">
                      {item.pricePerDay.toLocaleString('fr-FR')} F/j
                    </span>

                    <div className="absolute bottom-2 left-2 right-2 text-left pointer-events-none">
                      <span className="text-[7.5px] text-amber-400 uppercase tracking-wider font-bold block truncate">
                        {item.partnerName}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate drop-shadow">{item.name}</h4>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Item Detail & Booking Form */}
            <form onSubmit={handleConfirmReservation} className="bg-stone-50 dark:bg-slate-950/90 border border-stone-200 dark:border-white/10 rounded-2xl p-4 space-y-3.5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] text-amber-700 dark:text-amber-400 uppercase tracking-wider font-bold block">
                    Modèle sélectionné :
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{activeItem.name}</h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">{activeItem.model}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-amber-700 dark:text-amber-400 font-mono">
                    {activeItem.pricePerDay.toLocaleString('fr-FR')} F
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block">/ jour</span>
                </div>
              </div>

              {/* Specs & Checklist */}
              <div className="bg-white dark:bg-slate-900/70 border border-stone-200 dark:border-white/5 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Caractéristiques & Spécifications Terrain :
                </span>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-700 dark:text-slate-300">
                  {activeItem.specs.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 truncate">
                      <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                      <span className="truncate">{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* État des lieux & Checklist Photos */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-500/40 dark:border-amber-500/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Camera className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>État des Lieux & Checklist Photos (Retrait / Retour)</span>
                  </span>
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/35 px-1.5 py-0.2 rounded">
                    Requis
                  </span>
                </div>
                <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  Au retrait chez <strong>{activeItem.partnerName}</strong>, 4 photos horodatées sont validées dans l'application pour garantir la restitution de votre caution.
                </p>
                <div className="space-y-1">
                  {activeItem.conditionChecklist.map((c, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-[10px] text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkedItems[idx] ?? true}
                        onChange={() => setCheckedItems({ ...checkedItems, [idx]: !(checkedItems[idx] ?? true) })}
                        className="rounded border-stone-300 dark:border-white/20 text-amber-600 dark:text-amber-500 focus:ring-0"
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pickup Point */}
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-stone-200 dark:border-white/5">
                <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block">Point de retrait à Libreville :</span>
                  <strong className="text-slate-900 dark:text-white text-xs block truncate">{activeItem.pickupLocation}</strong>
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">Date de retrait :</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">Durée (jours) :</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={rentalDays}
                    onChange={(e) => setRentalDays(Number(e.target.value))}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Deposit Management Banner */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-stone-200 dark:border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Caution sécurisée (restituée au retour) :</span>
                  <strong className="text-amber-700 dark:text-amber-400 font-mono">{activeItem.depositAmount.toLocaleString('fr-FR')} FCFA</strong>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDepositMethod('AIRTEL')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition ${
                      depositMethod === 'AIRTEL'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 font-bold'
                        : 'border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>🔴 Airtel Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositMethod('MOOV')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition ${
                      depositMethod === 'MOOV'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 font-bold'
                        : 'border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>🔵 Moov Money</span>
                  </button>
                </div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block leading-tight">
                  🔒 Empreinte bloquée par Mobile Money sans débit immédiat. Restitution automatique lors de l'état des lieux retour.
                </span>
              </div>

              {/* Price Calculation & Submit */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-200 dark:border-white/10">
                <div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block">Total Location ({rentalDays} j) :</span>
                  <strong className="text-base text-amber-700 dark:text-amber-400 font-mono">
                    {totalRentalPrice.toLocaleString('fr-FR')} FCFA
                  </strong>
                </div>
                <button
                  type="submit"
                  className="py-2.5 px-4 copper-gradient text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow active:scale-95 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Réserver ({totalRentalPrice.toLocaleString('fr-FR')} F)</span>
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};
