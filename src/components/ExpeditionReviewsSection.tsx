/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { ExpeditionEvent, ExpeditionPhoto, ExpeditionReview } from '../types';
import {
  Camera,
  Star,
  MessageSquare,
  Send,
  Cloud,
  Trash2,
  ChevronDown,
  ChevronUp,
  LogIn,
  X,
  ImagePlus,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { sanitizeImageUrl, sanitizeStoredMediaUrl } from '../utils/urlSecurity';

interface ExpeditionReviewsSectionProps {
  events: ExpeditionEvent[];
  photos: ExpeditionPhoto[];
  reviews: ExpeditionReview[];
  selectedPark: string;
  authUser?: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  onSignInGoogle?: () => void;
  onAddReview: (payload: {
    eventId: string;
    rating: number;
    comment: string;
    photoUrl?: string;
  }) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
}

function matchesPark(evt: ExpeditionEvent, selectedPark: string): boolean {
  if (selectedPark === 'all') return true;
  const target = `${evt.parkName} ${evt.location}`.toLowerCase();
  if (selectedPark === 'mondah') return target.includes('mondah');
  if (selectedPark === 'ivindo') return target.includes('ivindo');
  if (selectedPark === 'denis') return target.includes('pongara') || target.includes('nyoni');
  return true;
}

function photoBelongsToEvent(photo: ExpeditionPhoto, evt: ExpeditionEvent): boolean {
  const expName = (photo.expeditionName || '').toLowerCase();
  const parkName = (photo.parkName || '').toLowerCase();
  const evtTitle = evt.title.toLowerCase();
  const evtPark = evt.parkName.toLowerCase();

  if (expName && (evtTitle.includes(expName.slice(0, 12)) || expName.includes(evtTitle.slice(0, 12)))) {
    return true;
  }
  if (evtPark.includes('mondah') && parkName.includes('mondah')) return true;
  if (evtPark.includes('ivindo') && parkName.includes('ivindo')) return true;
  if (evtPark.includes('pongara') && (parkName.includes('pongara') || parkName.includes('nyoni'))) return true;
  if (evtPark.includes('wonga') && parkName.includes('wonga')) return true;
  if (evtPark.includes('cristal') && parkName.includes('cristal')) return true;
  return false;
}

export const ExpeditionReviewsSection: React.FC<ExpeditionReviewsSectionProps> = ({
  events,
  photos,
  reviews,
  selectedPark,
  authUser,
  onSignInGoogle,
  onAddReview,
  onDeleteReview,
}) => {
  const visibleEvents = useMemo(
    () => events.filter((e) => matchesPark(e, selectedPark)),
    [events, selectedPark]
  );

  // First visible expedition starts expanded so users see gallery & review form immediately
  const [expandedEventId, setExpandedEventId] = useState<string>(visibleEvents[0]?.id || 'evt-1');
  const [ratingsByEvent, setRatingsByEvent] = useState<Record<string, number>>({});
  const [commentsByEvent, setCommentsByEvent] = useState<Record<string, string>>({});
  const [photoUrlsByEvent, setPhotoUrlsByEvent] = useState<Record<string, string>>({});
  const [showPhotoInputByEvent, setShowPhotoInputByEvent] = useState<Record<string, boolean>>({});
  const [submittingEventId, setSubmittingEventId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [feedbackByEvent, setFeedbackByEvent] = useState<Record<string, { type: 'ok' | 'err'; text: string }>>({});
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent, eventId: string) => {
    e.preventDefault();
    const rating = ratingsByEvent[eventId] || 5;
    const comment = (commentsByEvent[eventId] || '').trim();
    const photoUrl = (photoUrlsByEvent[eventId] || '').trim();

    if (comment.length < 3) {
      setFeedbackByEvent((prev) => ({
        ...prev,
        [eventId]: { type: 'err', text: 'Veuillez saisir au moins 3 caractères pour votre avis.' },
      }));
      return;
    }

    let safePhotoUrl: string | undefined;
    if (photoUrl) {
      if (photoUrl.length > 500) {
        setFeedbackByEvent((prev) => ({
          ...prev,
          [eventId]: { type: 'err', text: 'Le lien photo ne doit pas dépasser 500 caractères.' },
        }));
        return;
      }
      safePhotoUrl = sanitizeStoredMediaUrl(photoUrl);
      if (!safePhotoUrl) {
        setFeedbackByEvent((prev) => ({
          ...prev,
          [eventId]: { type: 'err', text: 'Veuillez saisir un lien image https:// valide.' },
        }));
        return;
      }
    }

    setSubmittingEventId(eventId);
    setFeedbackByEvent((prev) => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });

    try {
      await onAddReview({
        eventId,
        rating,
        comment,
        photoUrl: safePhotoUrl,
      });

      setCommentsByEvent((prev) => ({ ...prev, [eventId]: '' }));
      setPhotoUrlsByEvent((prev) => ({ ...prev, [eventId]: '' }));
      setShowPhotoInputByEvent((prev) => ({ ...prev, [eventId]: false }));
      setFeedbackByEvent((prev) => ({
        ...prev,
        [eventId]: { type: 'ok', text: 'Merci ! Votre avis a été synchronisé avec Firestore.' },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible d’enregistrer votre avis.';
      setFeedbackByEvent((prev) => ({
        ...prev,
        [eventId]: { type: 'err', text: msg },
      }));
    } finally {
      setSubmittingEventId(null);
    }
  };

  const handleDelete = async (reviewId: string, eventId: string) => {
    setDeletingReviewId(reviewId);
    try {
      await onDeleteReview(reviewId);
      setFeedbackByEvent((prev) => ({
        ...prev,
        [eventId]: { type: 'ok', text: 'Avis supprimé de Firestore.' },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression.';
      setFeedbackByEvent((prev) => ({
        ...prev,
        [eventId]: { type: 'err', text: msg },
      }));
    } finally {
      setDeletingReviewId(null);
    }
  };

  return (
    <section aria-label="Avis et Photos des expéditions" className="space-y-3 pt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <CategoryIcon category="expeditions" size="md" />
          <div className="min-w-0">
            <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white truncate">
              Avis &amp; Photos par Expédition
            </h3>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Notes 1–5 étoiles et retours de terrain synchronisés avec Firestore
            </p>
          </div>
        </div>

        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1 ${
            authUser
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Cloud className="w-3 h-3" />
          <span>{authUser ? 'Firestore Actif' : 'Lecture'}</span>
        </span>
      </div>

      {/* Expedition Cards with Photos & Reviews */}
      <div className="space-y-3">
        {visibleEvents.map((evt) => {
          const evtReviews = reviews.filter((r) => r.eventId === evt.id);
          const avgRating =
            evtReviews.length > 0
              ? (evtReviews.reduce((acc, r) => acc + r.rating, 0) / evtReviews.length).toFixed(1)
              : '5.0';

          // Collect expedition gallery photos (main cover + matching gallery photos + review photos)
          const galleryItems: Array<{ url: string; title: string; subtitle: string }> = [
            { url: evt.image, title: evt.title, subtitle: evt.parkName },
          ];
          const seenUrls = new Set<string>([evt.image]);

          for (const p of photos) {
            if (photoBelongsToEvent(p, evt) && !seenUrls.has(p.url)) {
              seenUrls.add(p.url);
              galleryItems.push({ url: p.url, title: p.title, subtitle: p.caption });
            }
          }
          for (const r of evtReviews) {
            if (r.photoUrl && !seenUrls.has(r.photoUrl)) {
              seenUrls.add(r.photoUrl);
              galleryItems.push({
                url: r.photoUrl,
                title: `Photo par ${r.authorName}`,
                subtitle: r.comment,
              });
            }
          }

          const isExpanded = expandedEventId === evt.id;
          const activeRating = ratingsByEvent[evt.id] || 5;
          const activeComment = commentsByEvent[evt.id] || '';
          const activePhotoUrl = photoUrlsByEvent[evt.id] || '';
          const showPhotoInput = Boolean(showPhotoInputByEvent[evt.id]);
          const feedback = feedbackByEvent[evt.id];
          const isSubmitting = submittingEventId === evt.id;

          return (
            <div
              key={evt.id}
              className="bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-white/10 hover:border-amber-500/45 dark:hover:border-amber-500/35 rounded-2xl overflow-hidden shadow-md dark:shadow-lg transition"
            >
              {/* Clickable Card Summary Header */}
              <button
                type="button"
                onClick={() => setExpandedEventId(isExpanded ? '' : evt.id)}
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-500/35 bg-stone-100 dark:bg-slate-950 shrink-0">
                    {sanitizeImageUrl(evt.image) && (
                      <img
                        src={sanitizeImageUrl(evt.image)}
                        alt={evt.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block truncate">
                      {evt.parkName}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{evt.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 tabular-nums">
                      <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        {avgRating}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {evtReviews.length} {evtReviews.length > 1 ? 'avis' : 'avis'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Camera className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        {galleryItems.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded Gallery + Reviews + Review Form */}
              {isExpanded && (
                <div className="px-3.5 pb-4 pt-2 border-t border-stone-200 dark:border-white/5 space-y-3.5 bg-stone-50 dark:bg-[#0e1310]/70">
                  {/* Photos Strip */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Camera className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      Galerie Photos ({galleryItems.length})
                    </span>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {galleryItems.map((item, idx) => {
                        const safeItemUrl = sanitizeImageUrl(item.url);
                        if (!safeItemUrl) return null;
                        return (
                          <button
                            key={`${evt.id}-gal-${idx}`}
                            type="button"
                            onClick={() => setLightboxPhoto({ ...item, url: safeItemUrl })}
                            className="group relative w-28 h-20 rounded-xl overflow-hidden border border-stone-200 dark:border-white/10 hover:border-amber-500/60 dark:hover:border-amber-400/60 shrink-0 bg-stone-200 dark:bg-slate-950 transition"
                          >
                            <img
                              src={safeItemUrl}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                            <span className="absolute bottom-1 left-1.5 right-1.5 text-[9px] text-white font-semibold truncate text-left">
                              {item.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      Retours des Explorateurs ({evtReviews.length})
                    </span>

                    {evtReviews.length === 0 ? (
                      <div className="bg-white dark:bg-slate-950/60 border border-stone-200 dark:border-white/5 rounded-xl p-3 text-center text-xs text-slate-600 dark:text-slate-400">
                        Soyez le premier à noter cette expédition.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-0.5">
                        {evtReviews.map((rev) => {
                          const isOwn = Boolean(authUser && authUser.uid === rev.userId);
                          return (
                            <div
                              key={rev.id}
                              className="bg-white dark:bg-slate-950/75 border border-stone-200 dark:border-white/5 rounded-xl p-2.5 space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {sanitizeImageUrl(rev.authorAvatar) ? (
                                    <img
                                      src={sanitizeImageUrl(rev.authorAvatar)}
                                      alt={rev.authorName}
                                      referrerPolicy="no-referrer"
                                      className="w-6 h-6 rounded-full object-cover border border-amber-500/40 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                                      {rev.authorName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <strong className="text-xs text-slate-900 dark:text-white truncate">
                                        {rev.authorName}
                                      </strong>
                                      {rev.isSynced && (
                                        <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5 shrink-0">
                                          <Cloud className="w-2.5 h-2.5" />
                                          Firestore
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-slate-500 block">
                                      {rev.createdAtLabel}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="flex items-center gap-0.5" aria-label={`Note ${rev.rating} sur 5`}>
                                    {[1, 2, 3, 4, 5].map((starVal) => (
                                      <Star
                                        key={starVal}
                                        className={`w-3 h-3 ${
                                          starVal <= rev.rating
                                            ? 'text-amber-500 dark:text-amber-400 fill-current'
                                            : 'text-slate-300 dark:text-slate-700'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  {isOwn && (
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(rev.id, evt.id)}
                                      disabled={deletingReviewId === rev.id}
                                      className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition p-1"
                                      title="Supprimer mon avis"
                                    >
                                      {deletingReviewId === rev.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{rev.comment}</p>

                              {sanitizeImageUrl(rev.photoUrl) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLightboxPhoto({
                                      url: sanitizeImageUrl(rev.photoUrl),
                                      title: `Photo · ${rev.authorName}`,
                                      subtitle: rev.comment,
                                    })
                                  }
                                  className="block w-24 h-16 rounded-lg overflow-hidden border border-stone-200 dark:border-white/10 hover:border-amber-500/60 dark:hover:border-amber-400/60 transition"
                                >
                                  <img
                                    src={sanitizeImageUrl(rev.photoUrl)}
                                    alt={`Souvenir de ${rev.authorName}`}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Interactive Review Form */}
                  <form
                    onSubmit={(e) => handleSubmit(e, evt.id)}
                    className="bg-white dark:bg-slate-950/90 border border-amber-500/35 dark:border-amber-500/25 rounded-2xl p-3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Laisser une note &amp; un avis</span>
                      <div className="flex items-center gap-1" role="group" aria-label="Note de 1 à 5 étoiles">
                        {[1, 2, 3, 4, 5].map((starVal) => (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() => setRatingsByEvent((prev) => ({ ...prev, [evt.id]: starVal }))}
                            className="p-0.5 transition active:scale-90"
                            aria-label={`${starVal} étoile${starVal > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-4 h-4 transition ${
                                starVal <= activeRating
                                  ? 'text-amber-500 dark:text-amber-400 fill-current'
                                  : 'text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 ml-1 tabular-nums">
                          {activeRating}/5
                        </span>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      maxLength={400}
                      value={activeComment}
                      onChange={(e) =>
                        setCommentsByEvent((prev) => ({ ...prev, [evt.id]: e.target.value }))
                      }
                      placeholder="Partagez votre expérience terrain, l'état du sentier ou vos conseils..."
                      className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 focus:border-amber-500/60 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-none"
                    />

                    {showPhotoInput && (
                      <input
                        type="url"
                        maxLength={500}
                        value={activePhotoUrl}
                        onChange={(e) =>
                          setPhotoUrlsByEvent((prev) => ({ ...prev, [evt.id]: e.target.value }))
                        }
                        placeholder="Lien https:// d'une photo de l'expédition (optionnel)"
                        className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-white/10 focus:border-amber-500/60 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                      />
                    )}

                    {feedback && (
                      <div
                        className={`rounded-xl px-2.5 py-1.5 text-[11px] flex items-center gap-1.5 ${
                          feedback.type === 'ok'
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                            : 'bg-red-50 dark:bg-red-950/70 border border-red-500/40 text-red-800 dark:text-red-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{feedback.text}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setShowPhotoInputByEvent((prev) => ({ ...prev, [evt.id]: !showPhotoInput }))
                          }
                          className="px-2.5 py-1.5 bg-stone-100 dark:bg-slate-900 hover:bg-stone-200 dark:hover:bg-slate-800 border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <ImagePlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Photo</span>
                        </button>
                        <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                          {activeComment.length}/400
                        </span>
                      </div>

                      {authUser ? (
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-3.5 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow active:scale-95 transition disabled:opacity-60"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Publier l&apos;avis</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onSignInGoogle}
                          className="px-3 py-1.5 copper-gradient text-slate-950 font-black rounded-xl text-[11px] flex items-center gap-1.5 shadow active:scale-95 transition"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Connexion Google &amp; Publier</span>
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Photo Lightbox Preview Modal */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#121614] border border-amber-500/40 rounded-3xl overflow-hidden max-w-md w-full shadow-2xl"
          >
            <div className="relative aspect-[4/3] bg-stone-900 dark:bg-slate-950">
              <img
                src={sanitizeImageUrl(lightboxPhoto.url)}
                alt={lightboxPhoto.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white border border-white/20 flex items-center justify-center"
                aria-label="Fermer l'aperçu photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{lightboxPhoto.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{lightboxPhoto.subtitle}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
