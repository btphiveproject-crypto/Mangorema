import React from 'react';
import { SafetyIncident } from '../../types';
import { SafetyMap } from '../SafetyMap';
import { SearchGroundingPanel } from '../GroundingPanels';
import { WildlifeAlertsPanel } from '../WildlifeAlertsPanel';
import { ShieldAlert, AlertTriangle, PhoneCall, Radio, CheckCircle, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface SafetyViewProps {
  incidents: SafetyIncident[];
  onOpenSOS: () => void;
  onAddIncident: (incident: Omit<SafetyIncident, 'id' | 'reportedAt'>) => void;
  onNotifyBanner?: (title: string, body: string) => void;
  onSyncNotificationsCount?: () => void;
}

export const SafetyView: React.FC<SafetyViewProps> = ({
  incidents,
  onOpenSOS,
  onAddIncident,
  onNotifyBanner,
  onSyncNotificationsCount,
}) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-4 sm:space-y-6 px-3.5 py-4 sm:p-6 pb-24 lg:pb-12">
      {/* Title */}
      <div>
        <h2 className="font-serif-display text-xl sm:text-3xl text-slate-900 dark:text-white font-bold flex items-center gap-2 tracking-tight">
          <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-500 shrink-0" />
          <span>{t.safety.title}</span>
        </h2>
        <p className="hidden sm:block text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          {t.safety.subtitle}
        </p>
      </div>

      {/* Main 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Safety Map + Incidents Feed */}
        <div className="lg:col-span-7 space-y-5">
          {/* Safety Map with real-time hazard markers */}
          <SafetyMap incidents={incidents} onAddIncident={onAddIncident} />

          {/* Current Active Incidents Feed */}
          <div className="space-y-3 pt-1">
            <h3 className="font-serif-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              {t.safety.activeIncidentsTitle} ({incidents.length})
            </h3>

            <div className="space-y-3">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`glass-card rounded-2xl p-4 border transition ${
                    inc.severity === 'high'
                      ? 'border-red-500/50'
                      : inc.severity === 'medium'
                      ? 'border-amber-500/45'
                      : 'border-white/60 dark:border-white/12'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          inc.severity === 'high'
                            ? 'text-red-600 dark:text-red-400'
                            : inc.severity === 'medium'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        ● {inc.severity}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{inc.title}</span>
                    </div>
                    {inc.verifiedByANPN ? (
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" /> {t.safety.verifiedAnpn}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 shrink-0">{t.safety.userReport}</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{inc.description}</p>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-2.5 border-t border-stone-200 dark:border-white/5 mt-2.5">
                    <span>{t.safety.reportedAt} {inc.reportedAt}</span>
                    <span className="font-mono tabular-nums text-amber-700 dark:text-amber-500">
                      [{inc.coords[0].toFixed(4)}, {inc.coords[1].toFixed(4)}]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: SOS Trigger + Emergency Numbers + Veille ANPN + Wildlife Alerts */}
        <div className="lg:col-span-5 space-y-5">
          {/* SOS Big Emergency Trigger Banner */}
          <button
            type="button"
            onClick={onOpenSOS}
            className="w-full rounded-3xl bg-gradient-to-br from-red-50 via-red-100/70 to-red-50 dark:from-red-950/75 dark:via-red-900/50 dark:to-red-950/75 border-2 border-red-500/75 p-4 sm:p-6 text-center cursor-pointer shadow-lg hover:border-red-400 transition active:scale-[0.98]"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center mx-auto mb-2.5 sm:mb-3 shadow-md">
              <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-[10px] text-red-700 dark:text-red-400 font-extrabold uppercase tracking-widest block">
              {t.safety.beaconKicker}
            </span>
            <h3 className="font-serif-display text-2xl font-black text-red-950 dark:text-white mt-0.5">
              {t.safety.beaconTitle}
            </h3>
            <p className="text-xs text-red-800 dark:text-red-200/90 mt-1.5 max-w-xs mx-auto leading-relaxed">
              {t.safety.beaconDesc}
            </p>
            <div className="mt-4 inline-flex min-h-[44px] items-center gap-2 bg-red-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm uppercase tracking-wider">
              <span>{t.safety.beaconBtn}</span>
            </div>
          </button>

          {/* Emergency Phone Contacts */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Numéros d'Urgence Gabon (Gratuits)
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <a
                href="tel:1404"
                className="min-h-[84px] p-3.5 rounded-2xl glass-card border border-white/60 dark:border-white/12 hover:border-red-500/55 flex flex-col justify-between transition"
              >
                <div>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider block">Écogardes</span>
                  <strong className="text-slate-900 dark:text-white text-xl font-mono tabular-nums">1404</strong>
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Ligne de garde ANPN</span>
              </a>

              <a
                href="tel:1300"
                className="min-h-[84px] p-3.5 rounded-2xl glass-card border border-white/60 dark:border-white/12 hover:border-amber-500/55 flex flex-col justify-between transition"
              >
                <div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider block">SAMU Gabon</span>
                  <strong className="text-slate-900 dark:text-white text-xl font-mono tabular-nums">1300</strong>
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Urgences Médicales</span>
              </a>
            </div>
          </div>

          {/* Google Search Grounding (Veille ANPN & Conditions Terrain en direct) */}
          <SearchGroundingPanel />

          {/* Seasonal Wildlife, Marine, Birds & Flora Alerts */}
          <WildlifeAlertsPanel
            onNotifyBanner={onNotifyBanner}
            onSyncNotificationsCount={onSyncNotificationsCount}
          />
        </div>
      </div>
    </div>
  );
};
