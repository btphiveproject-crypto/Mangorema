import React from 'react';
import {
  Home,
  Compass,
  Calendar,
  ShoppingBag,
  ShieldAlert,
  User,
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  Award,
  Package,
  Tent,
  ClipboardList,
  Store,
} from 'lucide-react';
import { AppWorkspaceMode, ProTabType, StoreTabType, TabType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface NavigationProps {
  workspaceMode?: AppWorkspaceMode;
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  activeProTab?: ProTabType;
  onChangeProTab?: (tab: ProTabType) => void;
  activeStoreTab?: StoreTabType;
  onChangeStoreTab?: (tab: StoreTabType) => void;
  incidentCount: number;
  proBookingsCount?: number;
  storeOrdersCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  workspaceMode = 'explorer',
  activeTab,
  onChangeTab,
  activeProTab = 'pro_dashboard',
  onChangeProTab,
  activeStoreTab = 'store_dashboard',
  onChangeStoreTab,
  incidentCount,
  proBookingsCount = 0,
  storeOrdersCount = 0,
}) => {
  const { t } = useLanguage();

  if (workspaceMode === 'professional') {
    const proTabs: Array<{ id: ProTabType; label: string; icon: React.ReactNode; badge?: number }> = [
      { id: 'pro_dashboard', label: t.workspace.proTabs.dashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'pro_offers', label: t.workspace.proTabs.offers, icon: <MapPin className="w-5 h-5" /> },
      { id: 'pro_bookings', label: t.workspace.proTabs.bookings, icon: <CalendarCheck className="w-5 h-5" />, badge: proBookingsCount },
      { id: 'pro_profile', label: t.workspace.proTabs.profile, icon: <Award className="w-5 h-5" /> },
    ];

    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-chrome border-t border-white/60 dark:border-white/10 w-full pb-safe px-safe transition-colors duration-200">
        <div className="flex items-center justify-around h-16 px-1 max-w-2xl mx-auto">
          {proTabs.map((tab) => {
            const isActive = activeProTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeProTab && onChangeProTab(tab.id)}
                className={`flex-1 min-h-[44px] flex flex-col items-center justify-center py-1 relative transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-3 right-3 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                )}
                <div className="relative">
                  {tab.icon}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-white dark:border-[#080B09] tabular-nums">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 font-medium truncate max-w-full px-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  if (workspaceMode === 'store') {
    const storeTabs: Array<{ id: StoreTabType; label: string; icon: React.ReactNode; badge?: number }> = [
      { id: 'store_dashboard', label: t.workspace.storeTabs.dashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'store_catalog', label: t.workspace.storeTabs.catalog, icon: <Package className="w-5 h-5" /> },
      { id: 'store_rentals', label: t.workspace.storeTabs.rentals, icon: <Tent className="w-5 h-5" /> },
      { id: 'store_orders', label: t.workspace.storeTabs.orders, icon: <ClipboardList className="w-5 h-5" />, badge: storeOrdersCount },
      { id: 'store_profile', label: t.workspace.storeTabs.profile, icon: <Store className="w-5 h-5" /> },
    ];

    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-chrome border-t border-white/60 dark:border-white/10 w-full pb-safe px-safe transition-colors duration-200">
        <div className="flex items-center justify-around h-16 px-1 max-w-2xl mx-auto">
          {storeTabs.map((tab) => {
            const isActive = activeStoreTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeStoreTab && onChangeStoreTab(tab.id)}
                className={`flex-1 min-h-[44px] flex flex-col items-center justify-center py-1 relative transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-amber-700 dark:text-amber-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-3 right-3 h-0.5 bg-amber-600 dark:bg-amber-500 rounded-full" />
                )}
                <div className="relative">
                  {tab.icon}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-amber-600 text-slate-950 text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-white dark:border-[#080B09] tabular-nums">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 font-medium truncate max-w-full px-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'accueil', label: t.nav.accueil, icon: <Home className="w-5 h-5" /> },
    { id: 'explorer', label: t.nav.explorer, icon: <Compass className="w-5 h-5" /> },
    { id: 'sorties', label: t.nav.sorties, icon: <Calendar className="w-5 h-5" /> },
    { id: 'equipement', label: t.nav.equipement, icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'safety', label: t.nav.safety, icon: <ShieldAlert className="w-5 h-5" />, badge: incidentCount },
    { id: 'profil', label: t.nav.profil, icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-chrome border-t border-white/60 dark:border-white/10 w-full pb-safe px-safe transition-colors duration-200">
      <div className="flex items-center justify-around h-16 px-1 max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 min-h-[44px] flex flex-col items-center justify-center py-1 relative transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-amber-700 dark:text-amber-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-3 right-3 h-0.5 bg-amber-600 dark:bg-amber-500 rounded-full" />
              )}
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-[#080B09] tabular-nums">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium truncate max-w-full px-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
