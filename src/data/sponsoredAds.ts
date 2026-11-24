/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLanguage, TabType } from '../types';
import imgPongara from '../assets/images/gabon_pongara_estuary_1795398444241.jpg';
import imgBivouac from '../assets/images/bivouac_equatorial_gear_1795342715941.jpg';
import imgLoango from '../assets/images/gabon_loango_lagoon_1795398443917.jpg';
import imgIvindo from '../assets/images/gabon_ivindo_falls_1795398444066.jpg';
import imgCristal from '../assets/images/gabon_cristal_mountains_1795398446159.jpg';

export type AdPlacement = 'home' | 'sorties' | 'equipement' | 'explorer' | 'galerie';

export interface SponsoredAdCopy {
  partnerName: string;
  category: string;
  headline: string;
  description: string;
  highlight: string;
  ctaLabel: string;
  terms: string;
}

export interface SponsoredAdItem {
  id: string;
  placement: AdPlacement;
  image: string;
  targetTab: TabType;
  promoCode?: string;
  locationLabel: string;
  copy: Record<AppLanguage, SponsoredAdCopy>;
}

export const GABON_SPONSORED_ADS: SponsoredAdItem[] = [
  {
    id: 'ad-home-airtel-pongara',
    placement: 'home',
    image: imgPongara,
    targetTab: 'sorties',
    promoCode: 'MANGO0',
    locationLabel: 'Port-Môle · Pongara',
    copy: {
      fr: {
        partnerName: 'Airtel Money x Pongara Écolodge',
        category: 'Partenaire Mobilité & Paiement',
        headline: '0 F de frais Mobile Money sur votre prochain week-end à Pongara',
        description:
          'Payez votre sortie et traversée pirogue depuis Port-Môle via Airtel Money et profitez du transfert offert au lodge partenaire.',
        highlight: 'Offre Gabon · Valable jusqu’au 31 Déc',
        ctaLabel: 'Voir les expéditions',
        terms: 'Valable sur les réservations payées in-app avec le code MANGO0.',
      },
      en: {
        partnerName: 'Airtel Money x Pongara Ecolodge',
        category: 'Mobility & Payment Partner',
        headline: 'Zero Mobile Money fees on your next Pongara weekend escape',
        description:
          'Book your expedition and boat crossing from Port-Môle with Airtel Money and enjoy complimentary pier transfer at our partner lodge.',
        highlight: 'Gabon Offer · Valid until Dec 31',
        ctaLabel: 'Browse expeditions',
        terms: 'Valid on in-app bookings checked out with promo code MANGO0.',
      },
      ar: {
        partnerName: 'Airtel Money × منتجع بونغارا البيئي',
        category: 'شريك الدفع والتنقل',
        headline: 'رسوم 0 فرنك عبر Mobile Money لعطلتك القادمة في بونغارا',
        description:
          'احجز رحلتك والقارب من ميناء Port-Môle عبر Airtel Money واستفد من التوصيل المجاني إلى النزل الشريك.',
        highlight: 'عرض الغابون · ساري حتى 31 ديسمبر',
        ctaLabel: 'استعراض الرحلات',
        terms: 'يسري العرض على الحجوزات داخل التطبيق باستخدام الرمز MANGO0.',
      },
    },
  },
  {
    id: 'ad-sorties-komo',
    placement: 'sorties',
    image: imgLoango,
    targetTab: 'transports',
    promoCode: 'KOMO10',
    locationLabel: 'Libreville · Rive Sud',
    copy: {
      fr: {
        partnerName: 'Compagnie Nautique du Komo',
        category: 'Traversées & Navettes Maritimes',
        headline: 'Traversée express Port-Môle → Pointe-Denis à -10 % en semaine',
        description:
          'Pirogues rapides homologuées SOLAS avec gilets de sauvetage et embarquement prioritaire pour les membres MANGOREMA.',
        highlight: 'Départs 08h00 & 14h00',
        ctaLabel: 'Voir les navettes',
        terms: 'Présentez le code KOMO10 lors de votre réservation de navette.',
      },
      en: {
        partnerName: 'Komo Nautical Express',
        category: 'Boat Crossings & Shuttles',
        headline: '10% off weekday Port-Môle → Pointe-Denis speedboat crossings',
        description:
          'SOLAS-certified fast boats with lifejackets and priority boarding for MANGOREMA explorers.',
        highlight: 'Departures 08:00 & 14:00',
        ctaLabel: 'View shuttles',
        terms: 'Apply code KOMO10 when reserving your maritime shuttle.',
      },
      ar: {
        partnerName: 'شركة كومو البحرية السريعة',
        category: 'العبارات والنقل البحري',
        headline: 'خصم 10% على رحلات القوارب السريعة Port-Môle ← Pointe-Denis',
        description:
          'قوارب سريعة معتمدة بستر نجاة وصعود أولوي لمستكشفي MANGOREMA.',
        highlight: 'الرحلات 08:00 و 14:00',
        ctaLabel: 'عرض الحافلات والقوارب',
        terms: 'استخدم الرمز KOMO10 عند حجز النقل البحري.',
      },
    },
  },
  {
    id: 'ad-equipement-outdoor',
    placement: 'equipement',
    image: imgBivouac,
    targetTab: 'equipement',
    promoCode: 'BIVOUAC15',
    locationLabel: 'Charbonnages · Libreville',
    copy: {
      fr: {
        partnerName: 'Libreville Outdoor Pro',
        category: 'Boutique & Location Certifiée',
        headline: '-15 % sur les tentes tropicales 4000mm & lampes solaires',
        description:
          'Retrait rapide à Charbonnages ou livraison directe sur Libreville et Akanda avant votre départ en forêt.',
        highlight: 'Stock local Gabon',
        ctaLabel: 'Voir l’équipement',
        terms: 'Code BIVOUAC15 applicable dans votre panier boutique.',
      },
      en: {
        partnerName: 'Libreville Outdoor Pro',
        category: 'Certified Gear & Rentals',
        headline: '15% off tropical 4000mm waterproof tents & solar headlamps',
        description:
          'Fast pickup at Charbonnages or direct delivery across Libreville and Akanda before your trek.',
        highlight: 'In stock in Gabon',
        ctaLabel: 'Browse gear',
        terms: 'Apply code BIVOUAC15 in your shop & rental cart.',
      },
      ar: {
        partnerName: 'ليبرفيل أوتدور برو',
        category: 'متجر وتأجير معتمد',
        headline: 'خصم 15% على الخيام الاستوائية المقاومة للمطر والمصابيح الشمسية',
        description:
          'استلام سريع من Charbonnages أو توصيل مباشر في ليبرفيل وأكاندا قبل انطلاق رحلتك.',
        highlight: 'متوفر محليًا في الغابون',
        ctaLabel: 'تصفح المعدات',
        terms: 'استخدم الرمز BIVOUAC15 في سلة المتجر.',
      },
    },
  },
  {
    id: 'ad-explorer-setrag',
    placement: 'explorer',
    image: imgIvindo,
    targetTab: 'explorer',
    promoCode: 'LOPE2026',
    locationLabel: 'Owendo → La Lopé · Ivindo',
    copy: {
      fr: {
        partnerName: 'Escapades Rail & Forêt Gabon',
        category: 'Corridor UNESCO La Lopé & Ivindo',
        headline: 'Combinez train Owendo–La Lopé et guide ANPN certifié',
        description:
          'Accédez aux savanes millénaires et chutes de l’Ivindo sans contrainte routière avec accueil guide dès la gare.',
        highlight: 'Corridor Est',
        ctaLabel: 'Explorer les parcs',
        terms: 'Mentionnez LOPE2026 lors de votre demande de guide ANPN.',
      },
      en: {
        partnerName: 'Gabon Rail & Forest Escapes',
        category: 'UNESCO La Lopé & Ivindo Corridor',
        headline: 'Bundle Owendo–La Lopé train travel with a certified ANPN guide',
        description:
          'Reach ancient savannas and Ivindo waterfalls effortlessly with local ranger pickup right at the station.',
        highlight: 'Eastern Corridor',
        ctaLabel: 'Explore parks',
        terms: 'Reference LOPE2026 when booking your ANPN guide.',
      },
      ar: {
        partnerName: 'رحلات السكك والغابات في الغابون',
        category: 'ممر اليونسكو لا لوبي وإيفيندو',
        headline: 'اجمع بين القطار من أويندو إلى لا لوبي ومرشد ANPN معتمد',
        description:
          'اكتشف السافانا التاريخية وشلالات إيفيندو بسهولة مع استقبال مباشر من المحطة.',
        highlight: 'الممر الشرقي',
        ctaLabel: 'استكشاف المحميات',
        terms: 'اذكر الرمز LOPE2026 عند حجز المرشد المعتمد.',
      },
    },
  },
  {
    id: 'ad-galerie-optique',
    placement: 'galerie',
    image: imgCristal,
    targetTab: 'equipement',
    promoCode: 'SAFARIOPTIC',
    locationLabel: 'Batterie 4 · Libreville',
    copy: {
      fr: {
        partnerName: 'Studio Safari Gabon · Optique',
        category: 'Location Photo & Jumelles Étanche',
        headline: 'Louez jumelles 10x42 et housses étanches dès 3 500 F / week-end',
        description:
          'Immortalisez les oiseaux de l’estuaire et les cascades des Monts de Cristal même sous la pluie équatoriale.',
        highlight: 'Caution Mobile Money',
        ctaLabel: 'Louer du matériel',
        terms: 'Code SAFARIOPTIC valable sur toute location optique week-end.',
      },
      en: {
        partnerName: 'Studio Safari Gabon · Optics',
        category: 'Camera & Waterproof Binocular Rentals',
        headline: 'Rent 10x42 binoculars & rain housings from 3,500 F / weekend',
        description:
          'Capture estuary birds and Monts de Cristal waterfalls clearly even in equatorial rain.',
        highlight: 'Mobile Money Deposit',
        ctaLabel: 'Rent gear',
        terms: 'Apply SAFARIOPTIC on weekend optical gear rentals.',
      },
      ar: {
        partnerName: 'ستوديو سفاري الغابون · بصريات',
        category: 'تأجير كاميرات ومناظير مقاومة للماء',
        headline: 'استأجر مناظير 10x42 وأغطية مقاومة للمطر بدءًا من 3,500 F',
        description:
          'التقط صور طيور المصب وشلالات جبال الكريستال بوضوح حتى تحت الأمطار الاستوائية.',
        highlight: 'تأمين عبر Mobile Money',
        ctaLabel: 'استئجار المعدات',
        terms: 'الرمز SAFARIOPTIC سارٍ على تأجير معدات التصوير لعطلة نهاية الأسبوع.',
      },
    },
  },
];

export function getAdForPlacement(placement: AdPlacement): SponsoredAdItem {
  return (
    GABON_SPONSORED_ADS.find((ad) => ad.placement === placement) || GABON_SPONSORED_ADS[0]
  );
}
