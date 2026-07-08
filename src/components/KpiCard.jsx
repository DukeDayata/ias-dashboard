import React from 'react';

/**
 * A reusable KPI Stat Card component.
 * Supports icons, custom colors, animations, and formatted values.
 */
export const KpiCard = ({ title, value, subtext, icon: Icon, colorClass = "blue", tooltip, onClick }) => {
  // Define color schemas for government aesthetic with dark mode support
  const colors = {
    blue: {
      bg: "bg-gov-blue-light/50 border-gov-blue/20 dark:bg-slate-900/60 dark:border-slate-800",
      icon: "bg-gov-blue text-white dark:bg-gov-blue/20 dark:text-gov-blue-accent",
      text: "text-gov-blue-dark dark:text-slate-100",
    },
    gold: {
      bg: "bg-gov-gold-light/50 border-gov-gold/20 dark:bg-slate-900/60 dark:border-slate-800",
      icon: "bg-gov-gold text-gov-gold-dark dark:bg-gov-gold/20 dark:text-gov-gold",
      text: "text-gov-gold-dark dark:text-slate-100",
    },
    red: {
      bg: "bg-gov-red-light/50 border-gov-red/20 dark:bg-slate-900/60 dark:border-slate-800",
      icon: "bg-gov-red text-white dark:bg-gov-red/20 dark:text-gov-red",
      text: "text-gov-red dark:text-slate-100",
    },
    slate: {
      bg: "bg-slate-100 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800",
      icon: "bg-slate-500 text-white dark:bg-slate-800 dark:text-slate-300",
      text: "text-slate-800 dark:text-slate-100",
    }
  };

  const scheme = colors[colorClass] || colors.blue;

  return (
    <div 
      className={`kpi-card relative flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 glass-card ${scheme.bg} ${onClick ? 'cursor-pointer hover:border-gov-blue/50 dark:hover:border-gov-blue-accent/50' : ''}`}
      onClick={onClick}
      title={tooltip}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className={`text-2xl font-bold tracking-tight ${scheme.text}`}>
            {value}
          </h3>
        </div>
        <div className={`flex items-center justify-center h-10 w-10 rounded-xl shadow-sm ${scheme.icon}`}>
          {Icon && <Icon size={20} className="stroke-[2.5]" />}
        </div>
      </div>
      
      {subtext && (
        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium" title={subtext}>
            {subtext}
          </p>
        </div>
      )}
    </div>
  );
};

export default KpiCard;
