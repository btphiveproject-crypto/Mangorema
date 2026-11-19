import React from 'react';
import { Home, Compass, Calendar, Bus, ShieldAlert, User } from 'lucide-react';
import { TabType } from '../types';

interface NavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  incidentCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  incidentCount,
}) => {
  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'accueil', label: 'Accueil', icon: <Home className="w-5 h-5" /> },
    { id: 'explorer', label: 'Explorer', icon: <Compass className="w-5 h-5" /> },
    { id: 'sorties', label: 'Sorties', icon: <Calendar className="w-5 h-5" /> },
    { id: 'transports', label: 'Navettes', icon: <Bus className="w-5 h-5" /> },
    { id: 'safety', label: 'Safety', icon: <ShieldAlert className="w-5 h-5" />, badge: incidentCount },
    { id: 'profil', label: 'Profil', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#080B09]/95 backdrop-blur-md border-t border-stone-200 dark:border-white/10 max-w-md mx-auto w-full pb-safe transition-colors duration-200">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
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
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-[#080B09]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
