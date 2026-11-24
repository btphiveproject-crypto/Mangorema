/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  ChevronLeft,
  Camera,
  Trash2,
  LogIn,
  Loader2,
  UserPlus,
  X,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  DirectChat,
  DirectChatMessage,
  ProfessionalProfile,
  PublicExplorerProfile,
  UserProfile,
} from '../types';
import {
  buildDirectChatId,
  subscribeDirectChatMessages,
} from '../firebase';
import { MediaCaptureBox } from './MediaCaptureBox';
import { sanitizeImageUrl } from '../utils/urlSecurity';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthUserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ChatRecipientTarget {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  subtitle?: string;
}

interface PrivateChatSectionProps {
  authUser: AuthUserSummary | null;
  userProfile: UserProfile;
  publicProfiles: PublicExplorerProfile[];
  proProfiles: ProfessionalProfile[];
  directChats: DirectChat[];
  initialRecipient?: ChatRecipientTarget | null;
  onClearInitialRecipient?: () => void;
  onSignInGoogle: () => void;
  onSendMessage: (params: {
    recipientUid: string;
    recipientName: string;
    recipientAvatar?: string;
    text: string;
    photoBlob?: Blob | null;
    onUploadProgress?: (pct: number) => void;
  }) => Promise<string>;
  onDeleteMessage: (chatId: string, msg: DirectChatMessage) => Promise<void>;
}

export const PrivateChatSection: React.FC<PrivateChatSectionProps> = ({
  authUser,
  userProfile,
  publicProfiles,
  proProfiles,
  directChats,
  initialRecipient = null,
  onClearInitialRecipient,
  onSignInGoogle,
  onSendMessage,
  onDeleteMessage,
}) => {
  const { t } = useLanguage();
  const [selectedRecipient, setSelectedRecipient] = useState<ChatRecipientTarget | null>(
    initialRecipient
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showDirectoryPicker, setShowDirectoryPicker] = useState(false);

  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [showPhotoAttach, setShowPhotoAttach] = useState(false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialRecipient && initialRecipient.uid && initialRecipient.uid !== authUser?.uid) {
      setSelectedRecipient(initialRecipient);
      setShowDirectoryPicker(false);
      onClearInitialRecipient?.();
    }
  }, [initialRecipient, authUser?.uid, onClearInitialRecipient]);

  // Auto-select most recent conversation on desktop if nothing chosen yet
  useEffect(() => {
    if (!authUser || selectedRecipient || directChats.length === 0) return;
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const top = directChats[0];
      const otherUid =
        top.participantAId === authUser.uid ? top.participantBId : top.participantAId;
      const otherName =
        top.participantAId === authUser.uid ? top.participantBName : top.participantAName;
      const otherAvatar = sanitizeImageUrl(
        top.participantAId === authUser.uid ? top.participantBAvatar : top.participantAAvatar
      );
      if (otherUid && otherUid !== authUser.uid) {
        setSelectedRecipient({
          uid: otherUid,
          displayName: otherName,
          avatarUrl: otherAvatar,
        });
      }
    }
  }, [authUser, directChats, selectedRecipient]);

  const activeChatId = useMemo(() => {
    if (!authUser || !selectedRecipient || selectedRecipient.uid === authUser.uid) return null;
    return buildDirectChatId(authUser.uid, selectedRecipient.uid);
  }, [authUser, selectedRecipient]);

  useEffect(() => {
    if (!authUser || !activeChatId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    setChatError(null);
    const unsub = subscribeDirectChatMessages(
      activeChatId,
      authUser.uid,
      (list) => {
        setMessages(list);
        setLoadingMessages(false);
      },
      (err) => {
        setLoadingMessages(false);
        setChatError(err.message);
      }
    );

    return () => unsub();
  }, [authUser, activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length, activeChatId]);

  // Build unified directory of reachable members & guides
  const contactDirectory = useMemo<ChatRecipientTarget[]>(() => {
    const map = new Map<string, ChatRecipientTarget>();
    for (const p of publicProfiles) {
      if (!p.uid || p.uid === authUser?.uid || p.isDiscoverable === false) continue;
      map.set(p.uid, {
        uid: p.uid,
        displayName: p.displayName,
        avatarUrl: sanitizeImageUrl(p.avatarUrl),
        subtitle: [p.role || 'Explorateur', p.homeCity || p.favoritePark].filter(Boolean).join(' · '),
      });
    }
    for (const g of proProfiles) {
      if (!g.ownerUserId || g.ownerUserId === authUser?.uid || g.status === 'PAUSED') continue;
      const existing = map.get(g.ownerUserId);
      map.set(g.ownerUserId, {
        uid: g.ownerUserId,
        displayName: existing?.displayName || g.displayName,
        avatarUrl: sanitizeImageUrl(g.photoUrl) || existing?.avatarUrl,
        subtitle: g.title || 'Guide & Pro Certifié Gabon',
      });
    }

    const q = searchQuery.trim().toLowerCase();
    return Array.from(map.values()).filter((c) => {
      if (!q) return true;
      return (
        c.displayName.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q))
      );
    });
  }, [publicProfiles, proProfiles, authUser?.uid, searchQuery]);

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return directChats.filter((chat) => {
      if (!q) return true;
      return (
        chat.participantAName.toLowerCase().includes(q) ||
        chat.participantBName.toLowerCase().includes(q) ||
        chat.lastMessageText.toLowerCase().includes(q)
      );
    });
  }, [directChats, searchQuery]);

  const handleSelectChat = (chat: DirectChat) => {
    if (!authUser) return;
    const isA = chat.participantAId === authUser.uid;
    const targetUid = isA ? chat.participantBId : chat.participantAId;
    const targetName = isA ? chat.participantBName : chat.participantAName;
    const targetAvatar = isA ? chat.participantBAvatar : chat.participantAAvatar;

    const dirMatch = contactDirectory.find((c) => c.uid === targetUid);
    setSelectedRecipient({
      uid: targetUid,
      displayName: targetName,
      avatarUrl: sanitizeImageUrl(targetAvatar) || dirMatch?.avatarUrl,
      subtitle: dirMatch?.subtitle,
    });
    setShowDirectoryPicker(false);
    setChatError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !selectedRecipient) return;
    if (!draftText.trim() && !photoBlob) return;

    setIsSending(true);
    setChatError(null);
    setUploadProgress(photoBlob ? 5 : null);

    try {
      await onSendMessage({
        recipientUid: selectedRecipient.uid,
        recipientName: selectedRecipient.displayName,
        recipientAvatar: selectedRecipient.avatarUrl,
        text: draftText.trim(),
        photoBlob,
        onUploadProgress: (pct) => setUploadProgress(pct),
      });
      setDraftText('');
      setPhotoBlob(null);
      setShowPhotoAttach(false);
      setUploadProgress(null);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : t.chat.sendError);
      setUploadProgress(null);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMsg = async (msg: DirectChatMessage) => {
    if (!activeChatId) return;
    setDeletingMsgId(msg.id);
    try {
      await onDeleteMessage(activeChatId, msg);
    } finally {
      setDeletingMsgId(null);
    }
  };

  if (!authUser) {
    return (
      <section className="glass-card rounded-3xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
          <MessageSquare className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {t.chat.authTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.chat.authDesc}
          </p>
        </div>
        <button
          type="button"
          onClick={onSignInGoogle}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl copper-gradient text-white text-sm font-bold shadow-lg"
        >
          <LogIn className="w-4 h-4" />
          {t.common.connectGoogle}
        </button>
      </section>
    );
  }

  return (
    <section className="glass-card rounded-3xl overflow-hidden border border-white/25 dark:border-white/10">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
        {/* Left Sidebar: Conversations & Explorer Directory */}
        <aside
          className={`lg:col-span-5 xl:col-span-4 border-b lg:border-b-0 lg:border-e border-slate-200/50 dark:border-white/10 flex flex-col ${
            selectedRecipient ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-slate-200/50 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {t.chat.sidebarTitle}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {directChats.length} {directChats.length > 1 ? t.chat.discussionPlural : t.chat.discussionSingular} · {t.chat.realtimeLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectoryPicker((v) => !v)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  showDirectoryPicker
                    ? 'bg-emerald-600 text-white'
                    : 'glass-surface text-emerald-700 dark:text-emerald-300 hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showDirectoryPicker ? t.chat.discussionsBtn : t.chat.newBtn}</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  showDirectoryPicker
                    ? t.chat.searchContactsPlaceholder
                    : t.chat.searchChatsPlaceholder
                }
                className="w-full ps-9 pe-3 py-2 rounded-xl glass-surface text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[420px] p-2 space-y-1.5">
            {showDirectoryPicker || filteredChats.length === 0 ? (
              <div className="space-y-1.5">
                <p className="px-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.chat.reachableTitle} ({contactDirectory.length})
                </p>
                {contactDirectory.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-500 dark:text-slate-400">
                    {t.chat.noContacts}
                  </div>
                ) : (
                  contactDirectory.map((contact) => {
                    const isSelected = selectedRecipient?.uid === contact.uid;
                    return (
                      <button
                        key={contact.uid}
                        type="button"
                        onClick={() => {
                          setSelectedRecipient(contact);
                          setShowDirectoryPicker(false);
                        }}
                        className={`w-full p-2.5 rounded-2xl text-start flex items-center gap-3 transition-colors ${
                          isSelected
                            ? 'bg-emerald-600/20 border border-emerald-500/40'
                            : 'hover:bg-white/40 dark:hover:bg-white/10'
                        }`}
                      >
                        {contact.avatarUrl ? (
                          <img
                            src={contact.avatarUrl}
                            alt={contact.displayName}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-white/40 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center shrink-0">
                            {contact.displayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {contact.displayName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {contact.subtitle || t.chat.memberFallback}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isA = chat.participantAId === authUser.uid;
                const peerUid = isA ? chat.participantBId : chat.participantAId;
                const peerName = isA ? chat.participantBName : chat.participantAName;
                const peerAvatar = sanitizeImageUrl(isA ? chat.participantBAvatar : chat.participantAAvatar);
                const isSelected = selectedRecipient?.uid === peerUid;

                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => handleSelectChat(chat)}
                    className={`w-full p-2.5 rounded-2xl text-start flex items-center gap-3 transition-colors ${
                      isSelected
                        ? 'bg-emerald-600/20 border border-emerald-500/40'
                        : 'hover:bg-white/40 dark:hover:bg-white/10'
                    }`}
                  >
                    {peerAvatar ? (
                      <img
                        src={peerAvatar}
                        alt={peerName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-white/40 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center shrink-0">
                        {peerName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {peerName}
                        </p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                          {chat.lastMessageAtLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                        {chat.lastMessageSenderId === authUser.uid ? `${t.chat.youPrefix} ` : ''}
                        {chat.lastMessageText}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Pane: Active 1-to-1 Conversation */}
        <div
          className={`lg:col-span-7 xl:col-span-8 flex flex-col ${
            selectedRecipient ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!selectedRecipient ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl glass-surface flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="max-w-sm space-y-1">
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {t.chat.emptySelectionTitle}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {t.chat.emptySelectionDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectoryPicker(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                {t.chat.browseMembersBtn}
              </button>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedRecipient(null)}
                    className="lg:hidden p-2 rounded-xl glass-surface text-slate-700 dark:text-slate-200"
                    aria-label={t.chat.backAria}
                  >
                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  </button>

                  {selectedRecipient.avatarUrl ? (
                    <img
                      src={selectedRecipient.avatarUrl}
                      alt={selectedRecipient.displayName}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-white/40 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center shrink-0">
                      {selectedRecipient.displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {selectedRecipient.displayName}
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1 truncate">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      <span>{selectedRecipient.subtitle || t.chat.privateThreadFallback}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px] min-h-[280px]">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.chat.loadingMessages}</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {t.chat.threadStartPrefix} {selectedRecipient.displayName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                      {t.chat.threadPrivacyNotePrefix} {selectedRecipient.displayName} {t.chat.threadPrivacyNoteSuffix}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === authUser.uid;
                    const safePhoto = sanitizeImageUrl(msg.photoUrl);

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 space-y-2 ${
                            isMine
                              ? 'bg-emerald-600 text-white rounded-br-sm shadow-sm'
                              : 'glass-surface text-slate-900 dark:text-white rounded-bl-sm'
                          }`}
                        >
                          {safePhoto && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoUrl(safePhoto)}
                              className="block rounded-xl overflow-hidden max-w-xs"
                            >
                              <img
                                src={safePhoto}
                                alt="Pièce jointe"
                                referrerPolicy="no-referrer"
                                className="max-h-48 w-auto object-cover rounded-xl"
                              />
                            </button>
                          )}

                          {msg.text && (
                            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>
                          )}

                          <div
                            className={`flex items-center justify-end gap-2 text-[10px] ${
                              isMine ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <span>{msg.createdAtLabel}</span>
                            {isMine && (
                              <button
                                type="button"
                                disabled={deletingMsgId === msg.id}
                                onClick={() => handleDeleteMsg(msg)}
                                className="opacity-75 hover:opacity-100 transition-opacity"
                                aria-label="Supprimer le message"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error Banner */}
              {chatError && (
                <div className="mx-4 mb-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{chatError}</span>
                </div>
              )}

              {/* Optional Photo Attachment Box */}
              {showPhotoAttach && (
                <div className="px-4 pb-2">
                  <MediaCaptureBox
                    compact
                    selectedBlob={photoBlob}
                    onBlobChange={setPhotoBlob}
                    uploadProgress={uploadProgress}
                    disabled={isSending}
                  />
                </div>
              )}

              {/* Input Bar */}
              <form
                onSubmit={handleSubmit}
                className="p-3 sm:p-4 border-t border-slate-200/50 dark:border-white/10 flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => setShowPhotoAttach((v) => !v)}
                  className={`p-2.5 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    showPhotoAttach || photoBlob
                      ? 'bg-emerald-600 text-white'
                      : 'glass-surface text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                  aria-label={t.chat.attachPhotoAria}
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  maxLength={1000}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder={`${t.chat.inputPlaceholderPrefix} ${selectedRecipient.displayName}...`}
                  className="flex-1 px-3.5 py-2.5 rounded-xl glass-surface text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[44px]"
                  disabled={isSending}
                />

                <button
                  type="submit"
                  disabled={isSending || (!draftText.trim() && !photoBlob)}
                  className="px-4 py-2.5 rounded-xl copper-gradient text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5 min-h-[44px] whitespace-nowrap"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{t.chat.sendBtn}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Lightbox for Chat Photos */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPhotoUrl}
              alt={t.chat.attachPhotoAria}
              referrerPolicy="no-referrer"
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-3 end-3 p-2.5 rounded-xl bg-black/60 text-white"
              aria-label={t.common.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
