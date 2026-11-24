import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  MessageCircle,
  Heart,
  Send,
  Plus,
  Trash2,
  MapPin,
  Users,
  Footprints,
  Trees,
  Tent,
  Leaf,
  Loader2,
  LogIn,
  Radio,
  ChevronDown,
  ChevronUp,
  Mountain,
  Route,
} from 'lucide-react';
import {
  ChatRoomId,
  CommunityActivity,
  CommunityActivityComment,
  CommunityActivityType,
  CommunityChatMessage,
} from '../types';
import {
  addActivityComment,
  deleteActivityComment,
  subscribeActivityComments,
  subscribeActivityLikes,
  toggleActivityLike,
} from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { sanitizeImageUrl, sanitizeStoredMediaUrl } from '../utils/urlSecurity';

interface AuthUserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface CommunityHubModalProps {
  isOpen: boolean;
  initialTab?: 'activities' | 'chat';
  onClose: () => void;
  authUser: AuthUserSummary | null;
  onSignInGoogle: () => Promise<void>;
  activities: CommunityActivity[];
  chatMessages: CommunityChatMessage[];
  onPublishActivity: (payload: {
    parkName: string;
    activityType: CommunityActivityType;
    title: string;
    description: string;
    photoUrl?: string;
    distanceKm?: number;
    elevationM?: number;
  }) => Promise<void>;
  onDeleteActivity: (activityId: string) => Promise<void>;
  onSendChatMessage: (payload: { roomId: ChatRoomId; text: string }) => Promise<CommunityChatMessage>;
  onDeleteChatMessage: (messageId: string) => Promise<void>;
}

const GABON_PARKS = [
  'Parc National de la Mondah',
  "Parc National de l'Ivindo",
  'Parc National de Pongara',
  'Parc National des Monts de Cristal',
  'Réserve de Wonga-Wongué',
  'Parc National de Loango',
  'Cap Estérias & Raponda Walker',
];

const CHAT_ROOMS: Array<{ id: ChatRoomId; label: string; subtitle: string }> = [
  { id: 'general', label: 'Général Gabon', subtitle: 'Tous les explorateurs et clubs' },
  { id: 'mondah', label: 'Mondah', subtitle: 'Cap Estérias & Raponda Walker' },
  { id: 'ivindo', label: 'Ivindo', subtitle: 'Makokou & Chutes de Djidji' },
  { id: 'pongara', label: 'Pongara', subtitle: 'Nyonié, Point Denis & Tortues' },
  { id: 'cristal', label: 'Monts de Cristal', subtitle: 'Kinguélé & Tchimbélé' },
];

const ACTIVITY_TYPE_META: Record<
  CommunityActivityType,
  { label: string; icon: React.ComponentType<{ className?: string }>; badgeClass: string }
> = {
  RANDONNEE: {
    label: 'Randonnée',
    icon: Footprints,
    badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35',
  },
  FAUNE: {
    label: 'Faune & Flore',
    icon: Trees,
    badgeClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/35',
  },
  BIVOUAC: {
    label: 'Bivouac',
    icon: Tent,
    badgeClass: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/35',
  },
  ECO_ACTION: {
    label: 'Éco-Action',
    icon: Leaf,
    badgeClass: 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/35',
  },
};

interface ActivityCardProps {
  activity: CommunityActivity;
  authUser: AuthUserSummary | null;
  onDeleteActivity: (id: string) => Promise<void>;
  onSignInGoogle: () => Promise<void>;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  authUser,
  onDeleteActivity,
  onSignInGoogle,
}) => {
  const { t } = useLanguage();
  const [comments, setComments] = useState<CommunityActivityComment[]>([]);
  const [likeUserIds, setLikeUserIds] = useState<string[]>([]);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const isSignedIn = Boolean(authUser?.uid);
  const isAuthor = Boolean(authUser?.uid && authUser.uid === activity.userId);
  const hasLiked = Boolean(authUser?.uid && likeUserIds.includes(authUser.uid));

  useEffect(() => {
    if (!isSignedIn) {
      setComments([]);
      setLikeUserIds([]);
      return;
    }

    const unsubComments = subscribeActivityComments(
      activity.id,
      (list) => setComments(list),
      () => {}
    );
    const unsubLikes = subscribeActivityLikes(
      activity.id,
      (ids) => setLikeUserIds(ids),
      () => {}
    );

    return () => {
      unsubComments();
      unsubLikes();
    };
  }, [activity.id, isSignedIn]);

  const typeMeta = ACTIVITY_TYPE_META[activity.activityType] || ACTIVITY_TYPE_META.RANDONNEE;
  const TypeIcon = typeMeta.icon;
  const safeAuthorAvatar = sanitizeImageUrl(activity.authorAvatar);
  const safePhotoUrl = sanitizeImageUrl(activity.photoUrl);

  const handleToggleLike = async () => {
    if (!authUser?.uid) {
      await onSignInGoogle();
      return;
    }
    if (isTogglingLike) return;
    setCardError(null);
    setIsTogglingLike(true);
    try {
      await toggleActivityLike(authUser.uid, activity.id, hasLiked);
    } catch (err) {
      setCardError(err instanceof Error ? err.message : 'Erreur lors du vote.');
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.uid) {
      await onSignInGoogle();
      return;
    }
    const clean = commentText.trim();
    if (clean.length < 2) {
      setCardError('Écrivez au moins 2 caractères pour commenter.');
      return;
    }

    setCardError(null);
    setIsSendingComment(true);
    try {
      const commentId = `com-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const createdAtLabel = new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      await addActivityComment(authUser.uid, {
        id: commentId,
        activityId: activity.id,
        authorName: authUser.displayName || 'Explorateur MANGOREMA',
        authorAvatar: authUser.photoURL || undefined,
        text: clean,
        createdAtLabel,
      });
      setCommentText('');
      setCommentsExpanded(true);
    } catch (err) {
      setCardError(err instanceof Error ? err.message : 'Impossible d’ajouter le commentaire.');
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleDeleteOwnActivity = async () => {
    if (!isAuthor || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteActivity(activity.id);
    } catch (err) {
      setCardError(err instanceof Error ? err.message : 'Suppression impossible.');
      setIsDeleting(false);
    }
  };

  return (
    <article className="bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-white/10 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {safeAuthorAvatar ? (
            <img
              src={safeAuthorAvatar}
              alt={activity.authorName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-amber-500/40 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
              {activity.authorName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{activity.authorName}</h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="truncate">{activity.createdAtLabel}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5 text-amber-700 dark:text-amber-400 font-semibold truncate">
                <MapPin className="w-2.5 h-2.5 shrink-0" />
                {activity.parkName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${typeMeta.badgeClass}`}
          >
            <TypeIcon className="w-3 h-3" />
            <span>{t.community.activityTypes[activity.activityType] || typeMeta.label}</span>
          </span>
          {isAuthor && (
            <button
              type="button"
              onClick={handleDeleteOwnActivity}
              disabled={isDeleting}
              title="Supprimer mon activité"
              className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center transition"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{activity.title}</h3>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {activity.description}
        </p>
      </div>

      {(activity.distanceKm !== undefined || activity.elevationM !== undefined) && (
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300 pt-0.5">
          {activity.distanceKm !== undefined && (
            <span className="inline-flex items-center gap-1 bg-stone-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
              <Route className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              {activity.distanceKm} km
            </span>
          )}
          {activity.elevationM !== undefined && (
            <span className="inline-flex items-center gap-1 bg-stone-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
              <Mountain className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />+{activity.elevationM} m D+
            </span>
          )}
        </div>
      )}

      {safePhotoUrl && (
        <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-white/10 max-h-48">
          <img
            src={safePhotoUrl}
            alt={activity.title}
            referrerPolicy="no-referrer"
            className="w-full h-44 object-cover"
          />
        </div>
      )}

      {cardError && (
        <p className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2.5 py-1.5 rounded-lg">
          {cardError}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isTogglingLike}
            className={`min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95 ${
              hasLiked
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/35'
                : 'bg-stone-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-white/10'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
            <span>{t.community.bravo}</span>
            <span className="tabular-nums font-mono">{likeUserIds.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setCommentsExpanded((v) => !v)}
            className="min-h-[36px] px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <MessageCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{t.community.comments}</span>
            <span className="tabular-nums font-mono">{comments.length}</span>
            {commentsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {commentsExpanded && (
        <div className="space-y-2.5 pt-2 border-t border-stone-200/70 dark:border-white/5">
          {comments.length === 0 ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              {t.community.noComments}
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {comments.map((c) => {
                const isCommentOwner = Boolean(authUser?.uid && authUser.uid === c.userId);
                return (
                  <div
                    key={c.id}
                    className="bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-white/5 rounded-xl px-2.5 py-2 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <strong className="text-slate-900 dark:text-white">{c.authorName}</strong>
                        <span className="text-slate-400">· {c.createdAtLabel}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 break-words">{c.text}</p>
                    </div>
                    {isCommentOwner && (
                      <button
                        type="button"
                        onClick={() => deleteActivityComment(activity.id, c.id)}
                        title="Supprimer ce commentaire"
                        className="text-slate-400 hover:text-red-500 p-1 shrink-0 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isSignedIn ? (
            <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={400}
                placeholder={`${t.community.commentPlaceholder} ${activity.authorName}...`}
                className="flex-1 min-w-0 bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={isSendingComment}
                className="min-h-[36px] px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0 disabled:opacity-50 transition"
              >
                {isSendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={onSignInGoogle}
              className="w-full py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.community.signInToComment}</span>
            </button>
          )}
        </div>
      )}
    </article>
  );
};

export const CommunityHubModal: React.FC<CommunityHubModalProps> = ({
  isOpen,
  initialTab = 'activities',
  onClose,
  authUser,
  onSignInGoogle,
  activities,
  chatMessages,
  onPublishActivity,
  onDeleteActivity,
  onSendChatMessage,
  onDeleteChatMessage,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'activities' | 'chat'>(initialTab);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomId>('general');
  const [showPublishForm, setShowPublishForm] = useState(false);

  // Activity form fields
  const [parkName, setParkName] = useState(GABON_PARKS[0]);
  const [activityType, setActivityType] = useState<CommunityActivityType>('RANDONNEE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [elevationM, setElevationM] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Chat state + WebSocket real-time presence & live frame layer
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [wsMessages, setWsMessages] = useState<CommunityChatMessage[]>([]);
  const [roomOnlineCount, setRoomOnlineCount] = useState<number>(0);
  const [roomOnlineUsers, setRoomOnlineUsers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Connect to /ws/community when modal is open for live presence & low-latency frames
  useEffect(() => {
    if (!isOpen) return;

    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (closed) return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws/community`);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              roomId: selectedRoom,
              userId: authUser?.uid || undefined,
              displayName: authUser?.displayName || 'Visiteur',
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data as string) as {
              type?: string;
              roomId?: string;
              onlineCount?: number;
              users?: string[];
              message?: CommunityChatMessage;
            };
            if (payload.type === 'PRESENCE' && payload.roomId === selectedRoom) {
              setRoomOnlineCount(Number(payload.onlineCount || 0));
              setRoomOnlineUsers(Array.isArray(payload.users) ? payload.users : []);
            }
            if (payload.type === 'CHAT_MESSAGE' && payload.message) {
              const incomingMsg = payload.message;
              const safeId =
                typeof incomingMsg.id === 'string' && /^[a-zA-Z0-9_-]{3,128}$/.test(incomingMsg.id)
                  ? incomingMsg.id
                  : '';
              const safeRoomId = incomingMsg.roomId;
              const safeText = typeof incomingMsg.text === 'string' ? incomingMsg.text.trim().slice(0, 500) : '';
              if (
                safeId &&
                ['general', 'mondah', 'ivindo', 'pongara', 'cristal'].includes(safeRoomId) &&
                safeText
              ) {
                const sanitizedMsg: CommunityChatMessage = {
                  id: safeId,
                  roomId: safeRoomId,
                  userId: typeof incomingMsg.userId === 'string' ? incomingMsg.userId.slice(0, 128) : 'guest',
                  authorName:
                    typeof incomingMsg.authorName === 'string' && incomingMsg.authorName.trim()
                      ? incomingMsg.authorName.trim().slice(0, 80)
                      : 'Explorateur',
                  authorAvatar: sanitizeStoredMediaUrl(incomingMsg.authorAvatar),
                  text: safeText,
                  createdAtLabel:
                    typeof incomingMsg.createdAtLabel === 'string'
                      ? incomingMsg.createdAtLabel.slice(0, 40)
                      : '',
                  createdAtMs: typeof incomingMsg.createdAtMs === 'number' ? incomingMsg.createdAtMs : Date.now(),
                };
                setWsMessages((prev) => {
                  if (prev.some((m) => m.id === sanitizedMsg.id)) return prev;
                  return [...prev, sanitizedMsg];
                });
              }
            }
          } catch {
            // Ignore malformed WS payloads
          }
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (!closed) {
            reconnectTimer = setTimeout(connect, 4000);
          }
        };
      } catch {
        // Firestore remains primary persistent transport if WS is unavailable
      }
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen, authUser?.uid, authUser?.displayName]);

  // Notify WS when switching rooms
  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          roomId: selectedRoom,
          userId: authUser?.uid || undefined,
          displayName: authUser?.displayName || 'Visiteur',
        })
      );
    }
  }, [selectedRoom, authUser?.uid, authUser?.displayName]);

  // Merge Firestore persisted messages + live WS frames deduplicated by id
  const roomMessages = useMemo(() => {
    const byId = new Map<string, CommunityChatMessage>();
    for (const m of chatMessages) {
      if (m.roomId === selectedRoom) byId.set(m.id, m);
    }
    for (const m of wsMessages) {
      if (m.roomId === selectedRoom && !byId.has(m.id)) {
        byId.set(m.id, m);
      }
    }
    return Array.from(byId.values()).sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
  }, [chatMessages, wsMessages, selectedRoom]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [roomMessages.length, isOpen, activeTab, selectedRoom]);

  if (!isOpen) return null;

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.uid) {
      await onSignInGoogle();
      return;
    }
    if (title.trim().length < 3 || description.trim().length < 3) {
      setPublishError('Renseignez un titre et une description (au moins 3 caractères chacun).');
      return;
    }

    const rawPhoto = photoUrl.trim();
    const safePhotoUrl = rawPhoto ? sanitizeStoredMediaUrl(rawPhoto) : undefined;
    if (rawPhoto && !safePhotoUrl) {
      setPublishError("L'adresse de l'image doit être un lien https:// valide.");
      return;
    }

    setPublishError(null);
    setIsPublishing(true);
    try {
      await onPublishActivity({
        parkName,
        activityType,
        title: title.trim(),
        description: description.trim(),
        photoUrl: safePhotoUrl,
        distanceKm: distanceKm ? Number(distanceKm) : undefined,
        elevationM: elevationM ? Number(elevationM) : undefined,
      });

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'ACTIVITY_EVENT',
            activityTitle: title.trim(),
          })
        );
      }

      setTitle('');
      setDescription('');
      setDistanceKm('');
      setElevationM('');
      setPhotoUrl('');
      setShowPublishForm(false);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Erreur lors de la publication.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.uid) {
      await onSignInGoogle();
      return;
    }
    const clean = chatInput.trim();
    if (!clean) return;

    setChatError(null);
    setIsSendingChat(true);
    try {
      const saved = await onSendChatMessage({ roomId: selectedRoom, text: clean });
      setChatInput('');
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'CHAT_MESSAGE',
            message: saved,
          })
        );
      }
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Échec de l'envoi du message.");
    } finally {
      setIsSendingChat(false);
    }
  };

  const activeRoomMeta = CHAT_ROOMS.find((r) => r.id === selectedRoom) || CHAT_ROOMS[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-stone-50 dark:bg-[#0B0F0D] border-t sm:border border-stone-200 dark:border-white/10 w-full max-w-md h-[92vh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 bg-white dark:bg-[#101512] border-b border-stone-200 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="font-serif-display font-bold text-base text-slate-900 dark:text-white truncate">
              {t.community.modalTitle}
            </h2>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
              {t.community.modalSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 transition"
            aria-label={t.common.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-4 pt-3 pb-2 bg-white dark:bg-[#101512] border-b border-stone-200 dark:border-white/10 grid grid-cols-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('activities')}
            className={`min-h-[40px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'activities'
                ? 'copper-gradient text-slate-950 shadow'
                : 'bg-stone-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-white/10'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>{t.community.activitiesTab} ({activities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`min-h-[40px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'chat'
                ? 'copper-gradient text-slate-950 shadow'
                : 'bg-stone-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-white/10'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{t.community.chatTab}</span>
            {roomOnlineCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono">
                {roomOnlineCount}
              </span>
            )}
          </button>
        </div>

        {/* Auth Prompt when signed out */}
        {!authUser && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/35 flex items-center justify-between gap-2.5 shrink-0">
            <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
              <strong>{t.community.authRequiredStrong}</strong> {t.community.authRequiredRest}
            </div>
            <button
              type="button"
              onClick={onSignInGoogle}
              className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 shrink-0 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.common.signIn}</span>
            </button>
          </div>
        )}

        {/* TAB 1: ACTIVITIES FEED & COMMENTS */}
        {activeTab === 'activities' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                {t.community.feedTitle}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!authUser) {
                    onSignInGoogle();
                    return;
                  }
                  setShowPublishForm((v) => !v);
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showPublishForm ? t.community.hideForm : t.community.publishToggle}</span>
              </button>
            </div>

            {/* Activity Composer */}
            {showPublishForm && (
              <form
                onSubmit={handlePublishSubmit}
                className="bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-2xl p-3.5 space-y-3 shadow-lg"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      {t.community.parkLabel}
                    </label>
                    <select
                      value={parkName}
                      onChange={(e) => setParkName(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-white/15 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      {GABON_PARKS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      {t.community.typeLabel}
                    </label>
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value as CommunityActivityType)}
                      className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-white/15 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="RANDONNEE">{t.community.activityTypes.RANDONNEE}</option>
                      <option value="FAUNE">{t.community.activityTypes.FAUNE}</option>
                      <option value="BIVOUAC">{t.community.activityTypes.BIVOUAC}</option>
                      <option value="ECO_ACTION">{t.community.activityTypes.ECO_ACTION}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                    {t.community.titleLabel}
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={120}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.community.titlePlaceholder}
                    className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                    {t.community.descLabel}
                  </label>
                  <textarea
                    required
                    minLength={3}
                    maxLength={600}
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.community.descPlaceholder}
                    className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    max={500}
                    step="0.1"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    placeholder={t.community.distancePlaceholder}
                    className="bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={elevationM}
                    onChange={(e) => setElevationM(e.target.value)}
                    placeholder={t.community.elevationPlaceholder}
                    className="bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <input
                  type="url"
                  maxLength={1000}
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder={t.community.photoPlaceholder}
                  className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />

                {publishError && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl">
                    {publishError}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPublishForm(false)}
                    className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{t.common.publish}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Feed List */}
            {activities.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/70 border border-stone-200 dark:border-white/10 rounded-2xl p-6 text-center space-y-2">
                <Footprints className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {authUser ? t.community.emptyTitleSignedIn : t.community.emptyTitleSignedOut}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.community.emptySubtitle}
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-2">
                {activities.map((act) => (
                  <ActivityCard
                    key={act.id}
                    activity={act}
                    authUser={authUser}
                    onDeleteActivity={onDeleteActivity}
                    onSignInGoogle={onSignInGoogle}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REAL-TIME MULTI-ROOM CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Room Pills */}
            <div className="px-4 py-2.5 border-b border-stone-200 dark:border-white/10 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-white/70 dark:bg-[#0f1411]">
              {CHAT_ROOMS.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelectedRoom(room.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedRoom === room.id
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-stone-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-white/10'
                  }`}
                >
                  {room.label}
                </button>
              ))}
            </div>

            {/* Room Banner */}
            <div className="px-4 py-2 bg-stone-100/80 dark:bg-slate-900/60 border-b border-stone-200 dark:border-white/5 flex items-center justify-between gap-2 text-[11px] shrink-0">
              <div className="min-w-0">
                <strong className="text-slate-900 dark:text-white">{activeRoomMeta.label}</strong>
                <span className="text-slate-500 dark:text-slate-400 ms-1.5 hidden sm:inline">
                  · {activeRoomMeta.subtitle}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>
                  {roomOnlineCount} {t.common.onlineLabel}
                  {roomOnlineUsers.length > 0 ? ` (${roomOnlineUsers.slice(0, 2).join(', ')})` : ''}
                </span>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {roomMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 space-y-2">
                  <MessageCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    « {activeRoomMeta.label} » · {t.community.roomReadySuffix}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                    {t.community.roomReadyDesc}
                  </p>
                </div>
              ) : (
                roomMessages.map((msg) => {
                  const isMine = Boolean(authUser?.uid && authUser.uid === msg.userId);
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm space-y-1 ${
                          isMine
                            ? 'bg-emerald-600 text-white rounded-br-sm'
                            : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px]">
                          <span
                            className={`font-bold truncate ${
                              isMine ? 'text-emerald-100' : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {isMine ? t.community.you : msg.authorName}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={isMine ? 'text-emerald-100/80' : 'text-slate-400'}>
                              {msg.createdAtLabel}
                            </span>
                            {isMine && (
                              <button
                                type="button"
                                onClick={() => onDeleteChatMessage(msg.id)}
                                title="Supprimer ce message"
                                className="text-emerald-100/80 hover:text-white transition"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="leading-relaxed break-words whitespace-pre-line">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Error */}
            {chatError && (
              <div className="mx-4 mb-2 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[11px]">
                {chatError}
              </div>
            )}

            {/* Chat Input */}
            <form
              onSubmit={handleSendChat}
              className="p-3 bg-white dark:bg-[#101512] border-t border-stone-200 dark:border-white/10 flex items-center gap-2 shrink-0"
            >
              {authUser ? (
                <>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    maxLength={500}
                    placeholder={`${t.community.chatPlaceholderPrefix} ${activeRoomMeta.label}...`}
                    className="flex-1 min-w-0 bg-stone-100 dark:bg-slate-950 border border-stone-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isSendingChat || !chatInput.trim()}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 disabled:opacity-45 transition active:scale-95"
                  >
                    {isSendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  className="w-full min-h-[42px] rounded-xl copper-gradient text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t.community.signInToChat}</span>
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
