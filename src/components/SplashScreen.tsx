import React, { useState } from 'react';
import { Compass, Bus, ShieldAlert, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      icon: <Compass className="w-10 h-10 text-amber-400" />,
      tag: 'ÉCOTOURISME AUTHENTIQUE',
      title: 'Vivez le Gabon en Pleine Nature',
      desc: 'Parcs Nationaux de la Mondah, de l\'Ivindo et de Pongara : parcourez les plus beaux sentiers équatoriaux en toute confiance.',
    },
    {
      icon: <Bus className="w-10 h-10 text-amber-500" />,
      tag: 'LOGISTIQUE FACILITÉE',
      title: 'Navettes & Mobile Money Intégrés',
      desc: 'Départs groupés depuis Charbonnages et Okala, tentes de bivouac et écoguides ANPN payables en un clic via Airtel, Moov Money & GhettoPay.',
    },
    {
      icon: <ShieldAlert className="w-10 h-10 text-emerald-400" />,
      tag: 'SÉCURITÉ & CONSERVATION',
      title: 'Connaître pour Mieux Protéger',
      desc: 'Balise de détresse SOS satellite, signalement en direct des crues et respect de la faune sauvage aux côtés des gardes des parcs.',
    },
  ];

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#f5f3ef] dark:bg-[#080B09] flex items-center justify-center p-6 animate-in fade-in">
      <div className="w-full max-w-md flex flex-col justify-between min-h-[82vh] max-h-[760px]">
        {/* Top Brand Mark with Official Logo */}
        <div className="pt-4 flex flex-col items-center text-center space-y-3">
          <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden border-2 border-amber-500/80 p-1 bg-white dark:bg-[#101412] shadow-xl transition-transform duration-500 hover:scale-105">
            <img
              src="/assets/aistudio/Gemini_Generated_Image_vn51dfvn51dfvn51__1__8a19ee16.jpeg"
              alt="Logo Officiel MANGOREMA - Connaître pour mieux protéger"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>

          <div className="pt-2">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold tracking-[0.25em] uppercase block">
              SUPER-APP ÉCOTOURISME & PLEIN AIR · GABON
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Parcs Nationaux · Randonnées · Navettes · Bivouac
            </p>
          </div>
        </div>

        {/* Slide Content */}
        <div className="py-6 space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-white/10 flex items-center justify-center mx-auto shadow-sm">
            {slides[slide].icon}
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 tracking-wider uppercase block mb-1">
              {slides[slide].tag}
            </span>
            <h2 className="font-serif-display text-2xl text-slate-900 dark:text-white font-bold leading-tight">
              {slides[slide].title}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 max-w-xs mx-auto leading-relaxed">
              {slides[slide].desc}
            </p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 pt-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? 'w-6 bg-amber-500' : 'w-1.5 bg-stone-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="pb-4 space-y-2.5">
          <button
            type="button"
            onClick={onComplete}
            className="w-full min-h-[48px] py-3.5 copper-gradient text-slate-950 font-black rounded-2xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
          >
            <span>Entrer dans l'Application</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex justify-between items-center px-1 text-xs">
            {slide < slides.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="min-h-[36px] text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <span>Découvrir les fonctionnalités ({slide + 1}/{slides.length})</span>
                <span>→</span>
              </button>
            ) : (
              <span className="text-slate-500 text-[11px]">Présentation complète</span>
            )}

            <button
              type="button"
              onClick={onComplete}
              className="min-h-[36px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition text-[11px]"
            >
              Passer l'intro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
