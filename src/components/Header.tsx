import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert, Download, WifiOff, Bell, MessageCircle, MessageSquare, Globe, Check, ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  AppLanguage,
  AppWorkspaceMode,
  ProTabType,
  StoreTabType,
  TabType,
  UserProfile,
} from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import { sanitizeImageUrl } from '../utils/urlSecurity';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  user: UserProfile;
  workspaceMode?: AppWorkspaceMode;
  activeTab?: TabType;
  onChangeTab?: (tab: TabType) => void;
  activeProTab?: ProTabType;
  onChangeProTab?: (tab: ProTabType) => void;
  activeStoreTab?: StoreTabType;
  onChangeStoreTab?: (tab: StoreTabType) => void;
  onOpenSOS: () => void;
  onOpenCapacitorGuide: () => void;
  onOpenProfile: () => void;
  onOpenNotifications?: () => void;
  onOpenGallery?: () => void;
  onOpenCommunity?: () => void;
  onOpenPrivateChat?: () => void;
  onLanguageChanged?: (lang: AppLanguage) => void;
  communityCount?: number;
  directChatsCount?: number;
  activeAlertsCount?: number;
  isAuthenticated?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  workspaceMode = 'explorer',
  activeTab = 'accueil',
  onChangeTab,
  activeProTab = 'pro_dashboard',
  onChangeProTab,
  activeStoreTab = 'store_dashboard',
  onChangeStoreTab,
  onOpenSOS,
  onOpenCapacitorGuide,
  onOpenProfile,
  onOpenNotifications,
  onOpenGallery,
  onOpenCommunity,
  onOpenPrivateChat,
  onLanguageChanged,
  communityCount = 0,
  directChatsCount = 0,
  activeAlertsCount = 0,
  isAuthenticated = false,
}) => {
  const { isInstallable, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const { lang, setLang, t } = useLanguage();
  const { totalCount, setIsCartOpen } = useCart();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!langMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [langMenuOpen]);

  const currentLangOption = LANGUAGE_OPTIONS.find((opt) => opt.code === lang) || LANGUAGE_OPTIONS[0];

  const handleSelectLanguage = (next: AppLanguage) => {
    setLang(next);
    setLangMenuOpen(false);
    if (onLanguageChanged) {
      onLanguageChanged(next);
    }
  };

  const desktopNavItems: Array<{ id: string; label: string; isActive: boolean; onClick: () => void }> =
    workspaceMode === 'professional'
      ? [
          {
            id: 'pro_dashboard',
            label: t.workspace.proTabs.dashboard,
            isActive: activeProTab === 'pro_dashboard',
            onClick: () => onChangeProTab?.('pro_dashboard'),
          },
          {
            id: 'pro_offers',
            label: t.workspace.proTabs.offers,
            isActive: activeProTab === 'pro_offers',
            onClick: () => onChangeProTab?.('pro_offers'),
          },
          {
            id: 'pro_bookings',
            label: t.workspace.proTabs.bookings,
            isActive: activeProTab === 'pro_bookings',
            onClick: () => onChangeProTab?.('pro_bookings'),
          },
          {
            id: 'pro_profile',
            label: t.workspace.proTabs.profile,
            isActive: activeProTab === 'pro_profile',
            onClick: () => onChangeProTab?.('pro_profile'),
          },
        ]
      : workspaceMode === 'store'
      ? [
          {
            id: 'store_dashboard',
            label: t.workspace.storeTabs.dashboard,
            isActive: activeStoreTab === 'store_dashboard',
            onClick: () => onChangeStoreTab?.('store_dashboard'),
          },
          {
            id: 'store_catalog',
            label: t.workspace.storeTabs.catalog,
            isActive: activeStoreTab === 'store_catalog',
            onClick: () => onChangeStoreTab?.('store_catalog'),
          },
          {
            id: 'store_rentals',
            label: t.workspace.storeTabs.rentals,
            isActive: activeStoreTab === 'store_rentals',
            onClick: () => onChangeStoreTab?.('store_rentals'),
          },
          {
            id: 'store_orders',
            label: t.workspace.storeTabs.orders,
            isActive: activeStoreTab === 'store_orders',
            onClick: () => onChangeStoreTab?.('store_orders'),
          },
          {
            id: 'store_profile',
            label: t.workspace.storeTabs.profile,
            isActive: activeStoreTab === 'store_profile',
            onClick: () => onChangeStoreTab?.('store_profile'),
          },
        ]
      : [
          {
            id: 'accueil',
            label: t.nav.accueil,
            isActive: activeTab === 'accueil',
            onClick: () => onChangeTab?.('accueil'),
          },
          {
            id: 'explorer',
            label: t.nav.explorer,
            isActive: activeTab === 'explorer',
            onClick: () => onChangeTab?.('explorer'),
          },
          {
            id: 'sorties',
            label: t.nav.sorties,
            isActive: activeTab === 'sorties',
            onClick: () => onChangeTab?.('sorties'),
          },
          {
            id: 'equipement',
            label: t.nav.equipement,
            isActive: activeTab === 'equipement',
            onClick: () => onChangeTab?.('equipement'),
          },
          {
            id: 'transports',
            label: t.home.poleShuttles,
            isActive: activeTab === 'transports',
            onClick: () => onChangeTab?.('transports'),
          },
          {
            id: 'safety',
            label: t.nav.safety,
            isActive: activeTab === 'safety',
            onClick: () => onChangeTab?.('safety'),
          },
          {
            id: 'galerie',
            label: t.nav.galerie,
            isActive: activeTab === 'galerie',
            onClick: () => onChangeTab?.('galerie'),
          },
        ];

  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-x-clip glass-chrome pt-safe px-safe border-b border-white/60 dark:border-white/10 transition-colors duration-200">
      <div className="w-full max-w-6xl mx-auto px-2.5 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-1.5 sm:gap-4 lg:gap-8 min-w-0">
        {/* Zone 1: Brand wordmark (clean single-line anchor) */}
        <button
          type="button"
          onClick={() => {
            if (workspaceMode === 'explorer' && onChangeTab) {
              onChangeTab('accueil');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-1.5 sm:gap-2.5 text-start whitespace-nowrap min-w-0 shrink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-amber-600/80 dark:border-amber-500/80 bg-[#F4F1EA] shrink-0 flex items-center justify-center shadow-xs">
            <img
              src="/logo-badge.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/icon.svg';
              }}
              alt="MANGOREMA"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-serif-display text-[13px] min-[375px]:text-sm sm:text-lg font-bold tracking-tight text-slate-900 dark:text-amber-400 leading-none truncate">
            MANGOREMA
          </span>
        </button>

        {/* Zone 2: Clean Desktop Navigation Links */}
        <nav
          aria-label="Navigation principale"
          className="hidden lg:flex items-center gap-5 xl:gap-6 text-[13px] font-semibold"
        >
          {desktopNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                item.onClick();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative py-1 whitespace-nowrap shrink-0 transition-colors ${
                item.isActive
                  ? 'text-amber-700 dark:text-amber-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              {item.isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400 rounded-full"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Zone 3: Utility & Primary Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {!isOnline && (
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/35 text-[11px] font-semibold shrink-0 whitespace-nowrap">
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{t.header.offline}</span>
            </div>
          )}

          {/* Language Selector */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen((v) => !v)}
              title={t.language.switchTooltip}
              aria-expanded={langMenuOpen}
              aria-haspopup="listbox"
              className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl glass-surface hover:bg-white/80 dark:hover:bg-white/12 border border-white/60 dark:border-white/12 text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition active:scale-95 whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-mono">{currentLangOption.shortCode}</span>
            </button>

            {langMenuOpen && (
              <div
                role="listbox"
                aria-label={t.language.sectionTitle}
                className="absolute top-full mt-1.5 end-0 w-44 glass-modal border border-white/70 dark:border-white/15 rounded-2xl p-1.5 z-50 space-y-1"
              >
                {LANGUAGE_OPTIONS.map((opt) => {
                  const isSelected = lang === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectLanguage(opt.code)}
                      className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition whitespace-nowrap ${
                        isSelected
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[10px] w-5 text-center opacity-75">
                          {opt.shortCode}
                        </span>
                        <span>{opt.nativeName}</span>
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Photo Gallery Quick Access */}
          {onOpenGallery && (
            <button
              type="button"
              onClick={onOpenGallery}
              title={t.header.galleryTooltip}
              className={`hidden sm:flex w-9 h-9 rounded-xl glass-surface hover:bg-white/80 dark:hover:bg-white/12 border items-center justify-center transition relative active:scale-95 shrink-0 ${
                workspaceMode === 'explorer' && activeTab === 'galerie'
                  ? 'border-amber-500 text-amber-700 dark:text-amber-300'
                  : 'border-white/60 dark:border-white/12 text-slate-700 dark:text-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          )}

          {/* Private Direct Chat */}
          {onOpenPrivateChat && (
            <button
              type="button"
              onClick={onOpenPrivateChat}
              title={t.header.privateChatTooltip}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl glass-surface hover:bg-white/80 dark:hover:bg-white/12 border border-white/60 dark:border-white/12 text-amber-700 dark:text-amber-300 flex items-center justify-center transition relative active:scale-95 shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              {directChatsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center shadow tabular-nums">
                  {directChatsCount > 9 ? '9+' : directChatsCount}
                </span>
              )}
            </button>
          )}

          {/* Community & Chat */}
          {onOpenCommunity && (
            <button
              type="button"
              onClick={onOpenCommunity}
              title={t.header.communityTooltip}
              className="hidden sm:flex w-9 h-9 rounded-xl glass-surface hover:bg-white/80 dark:hover:bg-white/12 border border-white/60 dark:border-white/12 text-emerald-700 dark:text-emerald-400 items-center justify-center transition relative active:scale-95 shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              {communityCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-emerald-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow tabular-nums">
                  {communityCount > 9 ? '9+' : communityCount}
                </span>
              )}
            </button>
          )}

          {/* Unified Cart */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            title={t.header.cartTooltip}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl glass-surface hover:bg-white/80 dark:hover:bg-white/12 border border-white/60 dark:border-white/12 text-amber-700 dark:text-amber-400 flex items-center justify-center transition relative active:scale-95 shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-amber-600 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center shadow tabular-nums">
                {totalCount > 9 ? '9+' : totalCount}
              </span>
            )}
          </button>

          {/* Notification Bell */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              title={t.header.notificationsTooltip}
              className="hidden sm:flex w-9 h-9 rounded-xl glass-surface hover:bg-white/80 dark:hover:bg-white/12 border border-white/60 dark:border-white/12 text-slate-700 dark:text-slate-200 items-center justify-center transition relative active:scale-95 shrink-0"
            >
              <Bell className="w-4 h-4" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center shadow tabular-nums">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          )}

          {/* PWA Install Button & Mobile App Guide */}
          <div className="hidden sm:flex items-center">
            <PWAInstallButton compact />
          </div>
          <button
            type="button"
            onClick={() => {
              if (isInstallable) {
                void install();
              } else {
                onOpenCapacitorGuide();
              }
            }}
            title={t.header.app}
            aria-label={t.header.app}
            className="h-8 sm:h-9 px-2 md:px-2.5 rounded-xl glass-surface hover:bg-white/80 dark:hover:bg-white/12 border border-white/60 dark:border-white/12 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition relative whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="hidden md:inline">{t.header.app}</span>
            {isInstallable && (
              <span className="sm:hidden w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5" />
            )}
          </button>

          {/* Primary Safety SOS Action */}
          <button
            type="button"
            onClick={onOpenSOS}
            className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition active:scale-95 shadow-sm whitespace-nowrap shrink-0"
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{t.header.sos}</span>
          </button>

          {/* User Avatar -> Profile */}
          <button
            type="button"
            onClick={onOpenProfile}
            title={isAuthenticated ? t.profile.cloudActive : t.profile.cloudInactive}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 overflow-hidden active:scale-95 transition relative shrink-0 ${
              isAuthenticated
                ? 'border-emerald-500'
                : 'border-amber-600/70'
            }`}
          >
            <img
              src={sanitizeImageUrl(user.avatar, {
                fallback: '/logo-badge.png',
              })}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
