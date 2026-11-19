/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Compass, Bus, Tent, UserCheck } from 'lucide-react';
import iconExpeditions from '../assets/images/icon_expeditions_1794990186765.jpg';
import iconNavettes from '../assets/images/icon_navettes_1794990184691.jpg';
import iconLocation from '../assets/images/icon_location_1794990184570.jpg';
import iconGuides from '../assets/images/icon_guides_1794990185916.jpg';

export type ActivityCategory = 'expeditions' | 'navettes' | 'location' | 'guides';

interface CategoryMeta {
  src: string;
  alt: string;
  label: string;
  fallbackIcon: React.ReactNode;
}

const CATEGORY_MAP: Record<ActivityCategory, CategoryMeta> = {
  expeditions: {
    src: iconExpeditions,
    alt: 'Icône Expéditions MANGOREMA',
    label: 'Expéditions',
    fallbackIcon: <Compass className="w-1/2 h-1/2 text-amber-400" />,
  },
  navettes: {
    src: iconNavettes,
    alt: 'Icône Navettes 4x4 MANGOREMA',
    label: 'Navettes',
    fallbackIcon: <Bus className="w-1/2 h-1/2 text-emerald-400" />,
  },
  location: {
    src: iconLocation,
    alt: 'Icône Location Matériel MANGOREMA',
    label: 'Location',
    fallbackIcon: <Tent className="w-1/2 h-1/2 text-sky-400" />,
  },
  guides: {
    src: iconGuides,
    alt: 'Icône Guides Naturalistes ANPN',
    label: 'Guides',
    fallbackIcon: <UserCheck className="w-1/2 h-1/2 text-orange-400" />,
  },
};

export interface CategoryIconProps {
  category: ActivityCategory;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<CategoryIconProps['size']>, string> = {
  xs: 'w-6 h-6 rounded-lg',
  sm: 'w-9 h-9 rounded-xl',
  md: 'w-11 h-11 rounded-2xl',
  lg: 'w-14 h-14 rounded-2xl',
  xl: 'w-16 h-16 rounded-2xl',
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const meta = CATEGORY_MAP[category];

  return (
    <div
      className={`${SIZE_CLASSES[size]} bg-[#080B09] border border-amber-500/40 shadow-md overflow-hidden shrink-0 flex items-center justify-center relative ${className}`}
    >
      {hasError ? (
        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-[#080B09] flex items-center justify-center">
          {meta.fallbackIcon}
        </div>
      ) : (
        <img
          src={meta.src}
          alt={meta.alt}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover scale-105"
        />
      )}
    </div>
  );
};
