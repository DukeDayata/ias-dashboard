import React, { useMemo } from 'react';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { MoreHorizontal, Coins, Users, Calendar } from 'lucide-react';

export const MonthlyTimeline = ({ activities, onEditActivity, isDarkMode }) => {
  const monthsOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Group activities by month
  const groupedActivities = useMemo(() => {
    const groups = {};
    monthsOrder.forEach(m => groups[m] = []);
    
    activities.forEach(act => {
      const monthRaw = (act.month || '').trim().toLowerCase();
      // Find matching standard month
      const matchedMonth = monthsOrder.find(m => m.toLowerCase() === monthRaw);
      if (matchedMonth) {
        groups[matchedMonth].push(act);
      } else {
        // Fallback if month is unknown/malformed (put in January for now, or a "Misc" column if desired)
        groups["January"].push(act);
      }
    });

    return groups;
  }, [activities]);

  const getActivityColor = (index) => {
    const colors = [
      'border-l-gov-blue bg-blue-50/50 dark:bg-blue-900/10 dark:border-l-blue-500',
      'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-l-emerald-400',
      'border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10 dark:border-l-purple-400',
      'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10 dark:border-l-amber-400',
      'border-l-pink-500 bg-pink-50/50 dark:bg-pink-900/10 dark:border-l-pink-400'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-max px-1">
        {monthsOrder.map(month => (
          <div key={month} className="w-80 flex-shrink-0 flex flex-col h-[calc(100vh-250px)] min-h-[500px]">
            {/* Column Header */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-t-xl border border-slate-200 dark:border-slate-700/50 border-b-0 flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Calendar size={14} className="text-gov-blue dark:text-gov-blue-accent" />
                {month}
              </h3>
              <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 shadow-sm border border-slate-200 dark:border-slate-700">
                {groupedActivities[month].length}
              </span>
            </div>
            
            {/* Column Body */}
            <div className="bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-b-xl border border-slate-200 dark:border-slate-700/50 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {groupedActivities[month].length === 0 ? (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">No activities</p>
                </div>
              ) : (
                groupedActivities[month].map((act, idx) => (
                  <div 
                    key={act._id || idx}
                    onClick={() => onEditActivity && onEditActivity(act)}
                    className={`p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md transition-all group ${getActivityColor(idx)} border-l-4`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 dark:border-slate-800">
                        {act.projectProgram.length > 15 ? act.projectProgram.substring(0, 15) + '...' : act.projectProgram}
                      </span>
                      <button className="text-slate-400 hover:text-gov-blue opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                    
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight mb-3 line-clamp-2" title={act.activity}>
                      {act.activity}
                    </h4>
                    
                    <div className="space-y-1.5 mt-auto">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 flex items-center gap-1"><Coins size={10}/> Budget</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(act.totalBudget)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 flex items-center gap-1"><Users size={10}/> Pax</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{formatNumber(act.participants)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyTimeline;
