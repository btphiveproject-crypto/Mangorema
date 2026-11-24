/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Booking,
  EcoChallengeCompletion,
  ExpeditionEvent,
  UserProfile,
} from '../types';
import {
  ALL_VIRTUAL_ECO_BADGES,
  ECO_CHALLENGES_CATALOG,
} from '../data/ecoChallenges';
import { sanitizeImageUrl } from './urlSecurity';

export type ShareCardTheme = 'emerald' | 'copper' | 'night';

export interface ShareAchievementOption {
  id: string;
  kind: 'challenge' | 'badge' | 'expedition';
  title: string;
  subtitle: string;
  icon: string;
  badgeLabel: string;
  ecoPoints?: number;
  completedDate?: string;
  proofPhotoUrl?: string;
  wasteNote?: string;
}

export interface GeneratedShareCard {
  dataUrl: string;
  blob: Blob;
  file: File;
  width: number;
  height: number;
}

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

const THEME_PALETTES: Record<
  ShareCardTheme,
  {
    bgTop: string;
    bgBottom: string;
    accent: string;
    accentSoft: string;
    accentText: string;
    panelBg: string;
    panelBorder: string;
    pillBg: string;
  }
> = {
  emerald: {
    bgTop: '#071B14',
    bgBottom: '#040C09',
    accent: '#34D399',
    accentSoft: 'rgba(52, 211, 153, 0.16)',
    accentText: '#A7F3D0',
    panelBg: 'rgba(10, 32, 24, 0.88)',
    panelBorder: 'rgba(52, 211, 153, 0.42)',
    pillBg: 'rgba(16, 185, 129, 0.18)',
  },
  copper: {
    bgTop: '#24170B',
    bgBottom: '#0B0907',
    accent: '#F59E0B',
    accentSoft: 'rgba(245, 158, 11, 0.18)',
    accentText: '#FDE68A',
    panelBg: 'rgba(34, 23, 12, 0.88)',
    panelBorder: 'rgba(245, 158, 11, 0.45)',
    pillBg: 'rgba(245, 158, 11, 0.18)',
  },
  night: {
    bgTop: '#0B1324',
    bgBottom: '#05080F',
    accent: '#D99A4E',
    accentSoft: 'rgba(217, 154, 78, 0.18)',
    accentText: '#FDE68A',
    panelBg: 'rgba(15, 23, 42, 0.90)',
    panelBorder: 'rgba(217, 154, 78, 0.42)',
    pillBg: 'rgba(217, 154, 78, 0.18)',
  },
};

export function collectAvailableShareAchievements(
  booking: Booking,
  user: UserProfile,
  ecoChallenges: EcoChallengeCompletion[]
): ShareAchievementOption[] {
  const options: ShareAchievementOption[] = [];
  const seen = new Set<string>();

  // 1. Prioritize any completed eco-challenge linked directly to this booking's event
  const sortedChallenges = [...ecoChallenges].sort((a, b) => {
    const aMatch = a.eventId === booking.eventId ? 1 : 0;
    const bMatch = b.eventId === booking.eventId ? 1 : 0;
    return bMatch - aMatch;
  });

  for (const ch of sortedChallenges) {
    const key = `challenge:${ch.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({
      id: key,
      kind: 'challenge',
      title: ch.badgeName,
      subtitle: `Défi Zéro Déchet accompli · ${ch.parkName}`,
      icon: ch.badgeIcon,
      badgeLabel:
        ch.eventId === booking.eventId
          ? 'DÉFI ACCOMPLI SUR CETTE EXPÉDITION'
          : 'DÉFI ZÉRO DÉCHET ACCOMPLI',
      ecoPoints: ch.ecoPoints,
      completedDate: ch.completedAtLabel,
      proofPhotoUrl: ch.proofPhotoUrl,
      wasteNote: ch.wasteNote,
    });
  }

  // 2. Include unlocked virtual eco-badges if not already covered by completion objects
  const unlockedVirtual = new Set(user.unlockedBadgeIds || []);
  for (const vb of ALL_VIRTUAL_ECO_BADGES) {
    if (!unlockedVirtual.has(vb.id)) continue;
    const alreadyFromCompletion = ecoChallenges.some((c) => c.badgeId === vb.id);
    if (alreadyFromCompletion) continue;
    const key = `vbadge:${vb.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({
      id: key,
      kind: 'badge',
      title: vb.name,
      subtitle: vb.desc,
      icon: vb.icon,
      badgeLabel: 'BADGE ÉCOLOGIQUE DÉBLOQUÉ',
      ecoPoints: vb.ecoPointsReward,
    });
  }

  // 3. Include user's core ANPN/ecotourism badges
  for (const b of user.badges) {
    const key = `badge:${b.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({
      id: key,
      kind: 'badge',
      title: b.name,
      subtitle: b.desc,
      icon: b.icon,
      badgeLabel: 'BADGE ÉCOTOURISME CERTIFIÉ',
    });
  }

  // 4. Fallback expedition-specific achievement if user has no unlocked badges yet
  if (options.length === 0) {
    const catalogMatch = ECO_CHALLENGES_CATALOG.find(
      (c) => c.eventId === booking.eventId
    );
    options.push({
      id: `exp:${booking.id}`,
      kind: 'expedition',
      title: catalogMatch?.badge.name || 'Explorateur MANGOREMA',
      subtitle: `${booking.eventTitle} · ${booking.location}`,
      icon: catalogMatch?.badge.icon || '🌿',
      badgeLabel: 'EXPÉDITION CONFIRMÉE GABON',
      ecoPoints: catalogMatch?.ecoPoints,
    });
  }

  return options;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  if (lines.length === maxLines && words.length > 0) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}...`).width > maxWidth && last.length > 3) {
      last = last.slice(0, -1);
    }
    // Check if text was actually truncated
    const joined = lines.join(' ');
    if (joined.length < text.trim().length) {
      lines[maxLines - 1] = `${last.trimEnd()}...`;
    }
  }
  return lines;
}

async function tryLoadImage(url?: string): Promise<HTMLImageElement | null> {
  const safeUrl = sanitizeImageUrl(url, { allowDataImage: true, allowBlob: true });
  if (!safeUrl) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 4500);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = safeUrl;
  });
}

export async function generateExpeditionShareCard(params: {
  booking: Booking;
  user: UserProfile;
  achievement: ShareAchievementOption;
  event?: ExpeditionEvent;
  theme?: ShareCardTheme;
}): Promise<GeneratedShareCard> {
  const { booking, user, achievement, event, theme = 'emerald' } = params;
  const palette = THEME_PALETTES[theme];

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Impossible d’initialiser le générateur d’image Canvas.');
  }

  // 1. Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  bgGrad.addColorStop(0, palette.bgTop);
  bgGrad.addColorStop(1, palette.bgBottom);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 2. Subtle optional hero image background (proof photo or expedition photo)
  const bgImageUrl = achievement.proofPhotoUrl || event?.image;
  const loadedBg = await tryLoadImage(bgImageUrl);
  if (loadedBg) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    const imgRatio = loadedBg.width / loadedBg.height;
    const targetRatio = CARD_WIDTH / 620;
    let drawW = CARD_WIDTH;
    let drawH = 620;
    if (imgRatio > targetRatio) {
      drawW = 620 * imgRatio;
    } else {
      drawH = CARD_WIDTH / imgRatio;
    }
    ctx.drawImage(
      loadedBg,
      (CARD_WIDTH - drawW) / 2,
      (620 - drawH) / 2,
      drawW,
      drawH
    );
    ctx.restore();

    const fadeGrad = ctx.createLinearGradient(0, 0, 0, 660);
    fadeGrad.addColorStop(0, 'rgba(4, 10, 8, 0.55)');
    fadeGrad.addColorStop(1, palette.bgBottom);
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, 0, CARD_WIDTH, 660);
  }

  // 3. Topographic decorative contour rings
  ctx.save();
  ctx.strokeStyle = palette.accent;
  ctx.globalAlpha = 0.1;
  ctx.lineWidth = 2;
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(CARD_WIDTH - 120, 180, 140 * i, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Outer framing border
  drawRoundedRect(ctx, 36, 36, CARD_WIDTH - 72, CARD_HEIGHT - 72, 44);
  ctx.strokeStyle = palette.panelBorder;
  ctx.lineWidth = 3;
  ctx.stroke();

  // 5. Header Brand Bar
  ctx.fillStyle = palette.pillBg;
  drawRoundedRect(ctx, 76, 78, 390, 54, 27);
  ctx.fill();
  ctx.strokeStyle = palette.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = palette.accentText;
  ctx.font = '700 22px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌿  MANGOREMA · GABON', 102, 105);

  // Reference badge on top-right
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  drawRoundedRect(ctx, CARD_WIDTH - 390, 78, 314, 54, 27);
  ctx.fill();
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '600 20px ui-monospace, SFMono-Regular, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(booking.refNumber, CARD_WIDTH - 233, 105);
  ctx.textAlign = 'left';

  // 6. Expedition Title & Date/Location
  ctx.fillStyle = palette.accent;
  ctx.font = '700 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('EXPÉDITION ÉCOTOURISME CERTIFIÉE', 76, 196);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 50px Georgia, serif';
  const titleLines = wrapTextLines(ctx, booking.eventTitle, CARD_WIDTH - 152, 2);
  titleLines.forEach((line, idx) => {
    ctx.fillText(line, 76, 260 + idx * 62);
  });

  const metaY = 260 + titleLines.length * 62 + 24;
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '500 26px system-ui, -apple-system, sans-serif';
  ctx.fillText(`📍 ${booking.location}   ·   📅 ${booking.eventDate}`, 76, metaY);

  // Services included tags
  const serviceTags = [
    booking.shuttleIncluded ? '🚌 Navette A/R' : null,
    booking.tentIncluded ? '⛺ Bivouac & Tente' : null,
    booking.guideIncluded ? '🧭 Écoguide ANPN' : null,
  ].filter(Boolean) as string[];
  if (serviceTags.length === 0) {
    serviceTags.push('🎫 Pass Expédition');
  }

  let chipX = 76;
  const chipY = metaY + 42;
  ctx.font = '600 21px system-ui, -apple-system, sans-serif';
  for (const tag of serviceTags) {
    const textW = ctx.measureText(tag).width;
    const chipW = textW + 38;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    drawRoundedRect(ctx, chipX, chipY, chipW, 44, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(tag, chipX + 19, chipY + 23);
    chipX += chipW + 14;
  }

  // 7. Centerpiece Dynamic Badge / Challenge Accomplishment Card
  const cardTop = chipY + 86;
  const cardH = 540;
  ctx.fillStyle = palette.panelBg;
  drawRoundedRect(ctx, 76, cardTop, CARD_WIDTH - 152, cardH, 36);
  ctx.fill();
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Top achievement status ribbon
  ctx.fillStyle = palette.accentSoft;
  drawRoundedRect(ctx, 112, cardTop + 34, CARD_WIDTH - 224, 48, 24);
  ctx.fill();
  ctx.fillStyle = palette.accentText;
  ctx.font = '800 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(achievement.badgeLabel, CARD_WIDTH / 2, cardTop + 59);

  // Badge Medallion Halo
  const medalCenterX = CARD_WIDTH / 2;
  const medalCenterY = cardTop + 195;
  const haloGrad = ctx.createRadialGradient(
    medalCenterX,
    medalCenterY,
    24,
    medalCenterX,
    medalCenterY,
    130
  );
  haloGrad.addColorStop(0, palette.accentSoft);
  haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(medalCenterX, medalCenterY, 130, 0, Math.PI * 2);
  ctx.fill();

  // Outer medal ring
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(medalCenterX, medalCenterY, 86, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Inner dashed ring
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = palette.accentText;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(medalCenterX, medalCenterY, 72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Badge Emoji Icon
  ctx.font = '82px system-ui, Apple Color Emoji, Segoe UI Emoji, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(achievement.icon, medalCenterX, medalCenterY + 4);

  // Badge Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 38px Georgia, serif';
  const badgeTitleLines = wrapTextLines(ctx, achievement.title, CARD_WIDTH - 240, 2);
  badgeTitleLines.forEach((line, idx) => {
    ctx.fillText(line, CARD_WIDTH / 2, cardTop + 322 + idx * 46);
  });

  // Badge Subtitle
  const subStartY = cardTop + 322 + badgeTitleLines.length * 46 + 10;
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '500 24px system-ui, -apple-system, sans-serif';
  const subLines = wrapTextLines(ctx, achievement.subtitle, CARD_WIDTH - 240, 2);
  subLines.forEach((line, idx) => {
    ctx.fillText(line, CARD_WIDTH / 2, subStartY + idx * 34);
  });

  // Eco Points / Verification Footer Pill inside Achievement Card
  const badgeMetaParts: string[] = [];
  if (achievement.ecoPoints) badgeMetaParts.push(`+${achievement.ecoPoints} pts éco`);
  if (achievement.completedDate) badgeMetaParts.push(`Validé le ${achievement.completedDate}`);
  if (achievement.proofPhotoUrl) badgeMetaParts.push('📷 Preuve photo vérifiée');
  if (badgeMetaParts.length === 0) badgeMetaParts.push('✓ Parc National Certifié ANPN');

  const metaPillText = badgeMetaParts.join('  ·  ');
  ctx.font = '700 20px system-ui, -apple-system, sans-serif';
  const pillW = Math.min(CARD_WIDTH - 220, ctx.measureText(metaPillText).width + 52);
  const pillY = cardTop + cardH - 76;
  ctx.fillStyle = palette.pillBg;
  drawRoundedRect(ctx, (CARD_WIDTH - pillW) / 2, pillY, pillW, 46, 23);
  ctx.fill();
  ctx.fillStyle = palette.accentText;
  ctx.fillText(metaPillText, CARD_WIDTH / 2, pillY + 24);
  ctx.textAlign = 'left';

  // 8. Explorer Profile & Stats Strip at Bottom
  const footerTop = cardTop + cardH + 34;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  drawRoundedRect(ctx, 76, footerTop, CARD_WIDTH - 152, 128, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 26px system-ui, -apple-system, sans-serif';
  ctx.fillText(user.name, 110, footerTop + 44);

  ctx.fillStyle = palette.accentText;
  ctx.font = '600 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(user.role, 110, footerTop + 82);

  // Right-aligned key outdoor stats
  ctx.textAlign = 'right';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 26px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(
    `${user.totalKm} km  ·  +${user.totalAscent}m  ·  ${user.ecoPoints ?? 0} pts éco`,
    CARD_WIDTH - 110,
    footerTop + 46
  );
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    `${user.zeroWasteExpeditionsCount ?? 0} expédition(s) Zéro Déchet · Gabon`,
    CARD_WIDTH - 110,
    footerTop + 82
  );
  ctx.textAlign = 'left';

  // Bottom Watermark Footer
  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'Partagé depuis MANGOREMA · Super-App Écotourisme Gabon',
    CARD_WIDTH / 2,
    CARD_HEIGHT - 68
  );
  ctx.textAlign = 'left';

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Impossible de générer le fichier PNG.'));
    }, 'image/png');
  });

  const safeSlug = booking.refNumber.replace(/[^a-zA-Z0-9_-]/g, '-');
  const file = new File([blob], `MANGOREMA-${safeSlug}.png`, {
    type: 'image/png',
  });

  return {
    dataUrl,
    blob,
    file,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  };
}

export function buildExpeditionShareText(params: {
  booking: Booking;
  achievement: ShareAchievementOption;
  appUrl?: string;
}): string {
  const { booking, achievement, appUrl } = params;
  const link =
    appUrl ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://mangorema.ga');

  return [
    `🌿 Mon expédition MANGOREMA au Gabon : ${booking.eventTitle}`,
    `📍 ${booking.location} · 📅 ${booking.eventDate}`,
    `${achievement.icon} ${achievement.title} (${achievement.subtitle})`,
    achievement.ecoPoints ? `♻️ +${achievement.ecoPoints} pts éco Zéro Déchet` : null,
    `🎫 Réf. Pass : ${booking.refNumber}`,
    `Découvrir l'aventure sur MANGOREMA : ${link}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function getSocialShareUrls(shareText: string, appUrl?: string) {
  const targetUrl =
    appUrl ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://mangorema.ga');

  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(shareText)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}&quote=${encodeURIComponent(shareText)}`,
    email: `mailto:?subject=${encodeURIComponent('Mon expédition écotourisme MANGOREMA Gabon')}&body=${encodeURIComponent(shareText)}`,
  };
}
