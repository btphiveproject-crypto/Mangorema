import React from 'react';

interface PangolinLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: 'emblem' | 'full';
}

export const PangolinLogo: React.FC<PangolinLogoProps> = ({
  size = 40,
  className = '',
  showText = false,
  variant = 'emblem',
}) => {
  if (variant === 'full' || showText) {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div style={{ width: size, height: size }} className="relative flex-shrink-0 rounded-2xl overflow-hidden border border-amber-500/50 shadow-lg">
          <img
            src="/assets/aistudio/Gemini_Generated_Image_vn51dfvn51dfvn51__1__8a19ee16.jpeg"
            alt="Logo Officiel MANGOREMA"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="mt-2">
          <span className="font-serif-display text-xl font-bold tracking-wider text-amber-400 block leading-tight">
            MANGOREMA
          </span>
          <span className="text-[9px] text-amber-200/80 font-medium tracking-[0.25em] uppercase block mt-0.5">
            Connaître pour mieux protéger
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full overflow-hidden border border-amber-500/50 flex-shrink-0 ${className}`}
    >
      <img
        src="/assets/aistudio/Gemini_Generated_Image_vn51dfvn51dfvn51__1__8a19ee16.jpeg"
        alt="Logo Officiel MANGOREMA"
        className="w-full h-full object-cover scale-110"
      />
    </div>
  );
};
