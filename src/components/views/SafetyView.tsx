import React from 'react';
import { SafetyIncident } from '../../types';
import { SafetyMap } from '../SafetyMap';
import { SearchGroundingPanel } from '../GroundingPanels';
import { ShieldAlert, AlertTriangle, PhoneCall, Radio, CheckCircle, Info } from 'lucide-react';

interface SafetyViewProps {
  incidents: SafetyIncident[];
  onOpenSOS: () => void;
  onAddIncident: (incident: Omit<SafetyIncident, 'id' | 'reportedAt'>) => void;
}

export const SafetyView: React.FC<SafetyViewProps> = ({
  incidents,
  onOpenSOS,
  onAddIncident,
}) => {
  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Title */}
      <div>
        <h2 className="font-serif-display text-xl text-slate-900 dark:text-white font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-500" />
          Sécurité Sentiers & Vigilance ANPN
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Signaux d'alerte, crues de rivières, faune et réseau des écogardes gabonais
        </p>
      </div>

      {/* SOS Big Emergency Trigger Banner */}
      <div
        onClick={onOpenSOS}
        className="rounded-3xl bg-gradient-to-r from-red-50 via-red-100/80 to-red-50 dark:from-red-950/80 dark:via-red-900/60 dark:to-red-950/80 border-2 border-red-500/80 p-5 text-center cursor-pointer shadow-2xl shadow-red-950/15 dark:shadow-red-950/80 hover:border-red-400 transition active:scale-[0.98]"
      >
        <div className="w-14 h-14 rounded-2xl bg-red-600/15 dark:bg-red-600/30 border border-red-500 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-2 animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <span className="text-[10px] text-red-700 dark:text-red-400 font-extrabold uppercase tracking-widest block">
          BALISE NUMÉRIQUE D'URGENCE
        </span>
        <h3 className="font-serif-display text-2xl font-black text-red-950 dark:text-white mt-0.5">
          DÉCLENCHER LES SECOURS ANPN
        </h3>
        <p className="text-xs text-red-800 dark:text-red-200/90 mt-1 max-w-xs mx-auto">
          Envoie instantanément vos coordonnées GPS par SMS satellitaire au poste de garde le plus proche.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-red-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md uppercase tracking-wider">
          <span>Ouvrir la Balise SOS</span>
        </div>
      </div>

      {/* Safety Map with real-time hazard markers */}
      <SafetyMap incidents={incidents} onAddIncident={onAddIncident} />

      {/* Google Search Grounding (Veille ANPN & Conditions Terrain en direct) */}
      <SearchGroundingPanel />

      {/* Current Active Incidents Feed */}
      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
          Alertes de Terrain Actives ({incidents.length})
        </h3>

        <div className="space-y-2.5">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className={`bg-white dark:bg-slate-900/80 rounded-2xl p-3.5 border transition shadow-sm ${
                inc.severity === 'high'
                  ? 'border-red-500/50 shadow-md shadow-red-950/10 dark:shadow-red-950/20'
                  : inc.severity === 'medium'
                  ? 'border-amber-500/40'
                  : 'border-stone-200 dark:border-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      inc.severity === 'high'
                        ? 'bg-red-600 text-white'
                        : inc.severity === 'medium'
                        ? 'bg-amber-600 text-slate-950'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {inc.severity.toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{inc.title}</span>
                </div>
                {inc.verifiedByANPN ? (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Validé ANPN
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">Signalement usager</span>
                )}
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{inc.description}</p>
              
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-stone-200 dark:border-white/5 mt-2">
                <span>Signalé : {inc.reportedAt}</span>
                <span className="font-mono text-amber-700 dark:text-amber-500">
                  [{inc.coords[0].toFixed(4)}, {inc.coords[1].toFixed(4)}]
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Phone Contacts */}
      <div className="space-y-2 pt-2">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200 flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Numéros d'Urgence Gabon (Gratuits)
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <a
            href="tel:1404"
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 hover:border-red-500/50 flex flex-col justify-between transition shadow-sm"
          >
            <div>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-bold block">ÉCOGARDES NATIONAUX</span>
              <strong className="text-slate-900 dark:text-white text-base">1404</strong>
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-2">Ligne de garde ANPN</span>
          </a>

          <a
            href="tel:1300"
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 hover:border-amber-500/50 flex flex-col justify-between transition shadow-sm"
          >
            <div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">SAMU GABON</span>
              <strong className="text-slate-900 dark:text-white text-base">1300</strong>
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-2">Urgences Médicales</span>
          </a>
        </div>
      </div>

    </div>
  );
};
