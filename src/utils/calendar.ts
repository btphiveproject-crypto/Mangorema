/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Booking } from '../types';

/**
 * Parses French date formats like "Samedi 14 Nov 2026", "14 Nov 2026", "2026-11-14"
 */
export function parseEventDate(dateStr: string): { start: Date; end: Date } {
  const monthsFr: { [key: string]: number } = {
    jan: 0, janv: 0, janvier: 0,
    fev: 1, fév: 1, fevr: 1, févr: 1, fevrier: 1, février: 1,
    mar: 2, mars: 2,
    avr: 3, avril: 3,
    mai: 4,
    juin: 5,
    juil: 6, juill: 6, juillet: 6,
    aou: 7, août: 7, aout: 7,
    sep: 8, sept: 8, septembre: 8,
    oct: 9, octobre: 9,
    nov: 10, novembre: 10,
    dec: 11, déc: 11, decembre: 11, décembre: 11,
  };

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();

  // Try regex matching: e.g. "14 Nov 2026" or "Samedi 14 Nov 2026"
  const match = dateStr.match(/(\d{1,2})\s+([a-zA-Zéû]+)\.?\s+(\d{4})/i);
  if (match) {
    day = parseInt(match[1], 10);
    const mStr = match[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [key, val] of Object.entries(monthsFr)) {
      if (mStr.startsWith(key)) {
        month = val;
        break;
      }
    }
    year = parseInt(match[3], 10);
  } else {
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      day = isoDate.getDate();
      month = isoDate.getMonth();
      year = isoDate.getFullYear();
    }
  }

  // Expedition start: 06:30 in Gabon (UTC+1)
  const start = new Date(year, month, day, 6, 30, 0);
  // Expedition end: Next day or same day evening at 18:30
  const end = new Date(year, month, day, 18, 30, 0);

  return { start, end };
}

/**
 * Formats a Date object to iCalendar UTC format: YYYYMMDDTHHMMSSZ
 */
function formatToICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generates an RFC 5545 compliant .ics string for a single booking
 */
export function generateBookingICS(booking: Booking): string {
  const { start, end } = parseEventDate(booking.eventDate);
  const now = new Date();
  const dtStamp = formatToICSDate(now);
  const dtStart = formatToICSDate(start);
  const dtEnd = formatToICSDate(end);

  const cleanTitle = booking.eventTitle.replace(/[\r\n,]/g, ' ');
  const cleanLocation = `${booking.location}, Gabon`.replace(/[\r\n,]/g, ' ');

  const descriptionLines = [
    `EXPÉDITION GABON - MANGOREMA`,
    `Référence Billet : ${booking.refNumber}`,
    `Date : ${booking.eventDate}`,
    `Lieu : ${booking.location}`,
    booking.shuttleIncluded ? `Navette A/R incluse : ${booking.shuttleDetail || 'Oui'}` : 'Navette : Non incluse',
    booking.tentIncluded ? 'Hébergement : Tente bivouac fournie' : 'Tente : Équipement personnel',
    booking.guideIncluded ? 'Accompagnement : Écoguide agréé ANPN inclus' : '',
    `Montant réglé : ${booking.totalAmount.toLocaleString('fr-FR')} FCFA via ${booking.paymentMethod}`,
    `Contact Sécurité ANPN : 1488 (Libreville)`,
    `Pass numérique disponible dans l'application MANGOREMA.`,
  ].filter(Boolean).join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MANGOREMA Gabon//Expeditions Calendar 1.0//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:MANGOREMA Expéditions',
    'X-WR-TIMEZONE:Africa/Libreville',
    'BEGIN:VEVENT',
    `UID:${booking.refNumber}-${start.getTime()}@mangorema.ga`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:🌿 [MANGOREMA] ${cleanTitle}`,
    `DESCRIPTION:${descriptionLines}`,
    `LOCATION:${cleanLocation}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Rappel départ expédition MANGOREMA demain ! Pensez à votre checklist bivouac.',
    'TRIGGER:-P1D',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Départ navette MANGOREMA dans 2 heures. Contrôlez votre Pass QR.',
    'TRIGGER:-PT2H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Generates an RFC 5545 compliant .ics string combining multiple bookings
 */
export function generateAllBookingsICS(bookings: Booking[]): string {
  const now = new Date();
  const dtStamp = formatToICSDate(now);

  const eventsICS = bookings.map((b) => {
    const { start, end } = parseEventDate(b.eventDate);
    const dtStart = formatToICSDate(start);
    const dtEnd = formatToICSDate(end);
    const cleanTitle = b.eventTitle.replace(/[\r\n,]/g, ' ');
    const cleanLocation = `${b.location}, Gabon`.replace(/[\r\n,]/g, ' ');

    const descriptionLines = [
      `EXPÉDITION GABON - MANGOREMA`,
      `Référence Billet : ${b.refNumber}`,
      `Date : ${b.eventDate}`,
      `Lieu : ${b.location}`,
      b.shuttleIncluded ? `Navette A/R : ${b.shuttleDetail || 'Incluse'}` : '',
      b.tentIncluded ? 'Tente bivouac incluse' : '',
      `Montant réglé : ${b.totalAmount.toLocaleString('fr-FR')} FCFA (${b.paymentMethod})`,
      `Pass numérique disponible sur l'application MANGOREMA.`,
    ].filter(Boolean).join('\\n');

    return [
      'BEGIN:VEVENT',
      `UID:${b.refNumber}-${start.getTime()}@mangorema.ga`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:🌿 [MANGOREMA] ${cleanTitle}`,
      `DESCRIPTION:${descriptionLines}`,
      `LOCATION:${cleanLocation}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Rappel expédition MANGOREMA demain !',
      'TRIGGER:-P1D',
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  }).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MANGOREMA Gabon//Expeditions Calendar 1.0//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:MANGOREMA Mes Expéditions',
    'X-WR-TIMEZONE:Africa/Libreville',
    eventsICS,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Triggers a browser download of the .ics file
 */
export function downloadICS(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Builds a direct Google Calendar Web URL for 1-click addition
 */
export function getGoogleCalendarUrl(booking: Booking): string {
  const { start, end } = parseEventDate(booking.eventDate);
  const dtStart = formatToICSDate(start);
  const dtEnd = formatToICSDate(end);
  const text = encodeURIComponent(`🌿 [MANGOREMA] ${booking.eventTitle}`);
  const details = encodeURIComponent(
    `Billet MANGOREMA : ${booking.refNumber}\nLieu : ${booking.location}\nDate : ${booking.eventDate}\nNavette : ${booking.shuttleIncluded ? 'Oui' : 'Non'}\nTente : ${booking.tentIncluded ? 'Oui' : 'Non'}\nMontant : ${booking.totalAmount} FCFA\nApp MANGOREMA Gabon`
  );
  const location = encodeURIComponent(`${booking.location}, Gabon`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dtStart}/${dtEnd}&details=${details}&location=${location}`;
}
