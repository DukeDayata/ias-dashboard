import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';

// Government style color palette
const CHART_COLORS = [
  '#0038A8', // Gov Blue
  '#FFC72C', // CHED Gold
  '#0E59F2', // Accent Blue
  '#D22630', // Gov Red
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
];

// Custom frosted glass Tooltip with Dark Mode support
const CustomTooltip = ({ active, payload, label, isCurrency = true }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg backdrop-blur-sm text-left">
        {label && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</p>}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-xs text-slate-600 dark:text-slate-350">{entry.name}:</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isCurrency ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardCharts = ({ data, budgetData, isDarkMode }) => {
  // If no data, return placeholder or empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <p className="text-slate-400 dark:text-slate-500 font-medium">Upload WFP data to visualize analytics</p>
      </div>
    );
  }

  // Dynamic Chart Styling Variables
  const gridStroke = isDarkMode ? '#1E293B' : '#E2E8F0';
  const axisStroke = isDarkMode ? '#94A3B8' : '#64748B';

  // 1. Prepare Monthly Budget Data
  const monthsOrder = [
    { short: "JAN", full: "January" },
    { short: "FEB", full: "February" },
    { short: "MAR", full: "March" },
    { short: "APR", full: "April" },
    { short: "MAY", full: "May" },
    { short: "JUN", full: "June" },
    { short: "JUL", full: "July" },
    { short: "AUG", full: "August" },
    { short: "SEP", full: "September" },
    { short: "OCT", full: "October" },
    { short: "NOV", full: "November" },
    { short: "DEC", full: "December" }
  ];
  
  const monthlyMap = data.reduce((acc, curr) => {
    if (!curr.month) return acc;
    const rawMonth = curr.month.toUpperCase().trim();
    const config = monthsOrder.find(o => o.short === rawMonth || o.full.toUpperCase() === rawMonth);
    const key = config ? config.full : curr.month;
    acc[key] = (acc[key] || 0) + curr.totalBudget;
    return acc;
  }, {});

  const monthlyData = monthsOrder.map(month => ({
    name: month.full,
    Budget: monthlyMap[month.full] || 0
  }));

  // 2. Prepare Budget by Object of Expenditure Data
  const expenditureMap = data.reduce((acc, curr) => {
    const obj = curr.objectOfExpenditure;
    acc[obj] = (acc[obj] || 0) + curr.totalBudget;
    return acc;
  }, {});

  const expenditureData = Object.entries(expenditureMap)
    .map(([name, val]) => ({ name, value: val }))
    .sort((a, b) => b.value - a.value);

  // 3. Prepare Top 10 Activities by Budget
  const topActivitiesData = [...data]
    .sort((a, b) => b.totalBudget - a.totalBudget)
    .slice(0, 10)
    .map(act => ({
      name: act.activity.length > 24 ? act.activity.substring(0, 21) + '...' : act.activity,
      fullName: act.activity,
      Budget: act.totalBudget
    }))
    .reverse(); // reverse for horizontal bar chart display top-to-bottom

  // 4. Prepare Budget by Project/Program
  const programMap = data.reduce((acc, curr) => {
    const prog = curr.projectProgram;
    acc[prog] = (acc[prog] || 0) + curr.totalBudget;
    return acc;
  }, {});

  const programData = Object.entries(programMap)
    .map(([name, val]) => ({ name, Budget: val }))
    .sort((a, b) => b.Budget - a.Budget);

  // 5. Prepare Disbursement Trends Data
  const disbursementMap = (budgetData || []).reduce((acc, curr) => {
    if (!curr.disbursementDate) return acc;
    const dStr = curr.disbursementDate.split(' ')[0];
    if (!dStr) return acc;
    const shortMonth = dStr.toUpperCase().substring(0, 3);
    const config = monthsOrder.find(o => o.short === shortMonth);
    if (config) {
      acc[config.full] = (acc[config.full] || 0) + (curr.disbursementAmount || 0);
    }
    return acc;
  }, {});

  const disbursementTrendData = monthsOrder.map(month => ({
    name: month.short,
    Disbursed: disbursementMap[month.full] || 0
  }));

  // 6. Prepare Budget Utilization by P/A/P
  const papMap = (budgetData || []).reduce((acc, curr) => {
    if (!curr.pap) return acc;
    if (!acc[curr.pap]) acc[curr.pap] = { Obligated: 0, Disbursed: 0 };
    acc[curr.pap].Obligated += (curr.obligationAmount || 0);
    acc[curr.pap].Disbursed += (curr.disbursementAmount || 0);
    return acc;
  }, {});

  const papUtilizationData = Object.entries(papMap).map(([name, val]) => ({
    name: name.length > 15 ? name.substring(0, 12) + '...' : name,
    fullName: name,
    Obligated: val.Obligated,
    Disbursed: val.Disbursed
  })).sort((a, b) => b.Obligated - a.Obligated).slice(0, 10); // Top 10 P/A/Ps

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* Top row: WFP Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-grid-cols-1 w-full min-w-0">
      {/* Chart 1: Monthly Budget Trend */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/85 shadow-sm card flex flex-col justify-between min-w-0">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">Monthly Budget Summary</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500">Total WFP allocation tracked across the fiscal year months</p>
        </div>
        <div className="chart-container h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0038A8" stopOpacity={isDarkMode ? 0.45 : 0.25}/>
                  <stop offset="95%" stopColor="#0038A8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis 
                dataKey="name" 
                tickFormatter={(tick) => tick.substring(0, 3)} 
                stroke={axisStroke} 
                tick={{ fontSize: 11 }}
                dy={8}
              />
              <YAxis 
                tickFormatter={(value) => formatCompactCurrency(value)} 
                stroke={axisStroke} 
                tick={{ fontSize: 11 }}
                dx={-8}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="Budget" 
                stroke={isDarkMode ? '#0E59F2' : '#0038A8'} 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorBudget)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Budget by Object of Expenditure */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/85 shadow-sm card flex flex-col justify-between min-w-0">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">Budget by Object of Expenditure</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500">Distribution of funds across standardized expense classes</p>
        </div>
        <div className="h-60 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenditureData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {expenditureData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Custom React Legend below the chart SVG */}
        <div className="mt-2 flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium max-h-24 overflow-y-auto pr-1">
          {expenditureData.map((entry, index) => (
            <span key={`legend-${index}`} className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
              <span className="truncate max-w-[130px]" title={entry.name}>
                {entry.name} ({formatCompactCurrency(entry.value)})
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Chart 3: Top 10 Activities by Budget */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/85 shadow-sm card flex flex-col justify-between min-w-0">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">Top 10 Activities by Budget</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500">Highest funded line-item activities in the 2026 WFP</p>
        </div>
        <div className="chart-container h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topActivitiesData}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
              <XAxis 
                type="number" 
                tickFormatter={(value) => formatCompactCurrency(value)} 
                stroke={axisStroke}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke={axisStroke} 
                width={110}
                tick={{ fontSize: 9 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg backdrop-blur-sm max-w-sm text-left">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Activity Detail</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-white mb-1 leading-snug">{data.fullName}</p>
                        <p className="text-sm font-extrabold text-gov-blue dark:text-gov-blue-accent">
                          Budget: {formatCurrency(data.Budget)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="Budget" fill="#0038A8" radius={[0, 4, 4, 0]}>
                {topActivitiesData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      index === topActivitiesData.length - 1 
                        ? '#FFC72C' 
                        : (isDarkMode ? '#0E59F2' : '#0038A8')
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 4: Budget by Sub-Component / Program */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/85 shadow-sm card flex flex-col justify-between min-w-0">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">Budget by Sub-Component</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500">Aggregated funding breakdown by core Program area</p>
        </div>
        <div className="chart-container h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={programData} margin={{ top: 10, right: 10, left: 15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis 
                dataKey="name" 
                stroke={axisStroke}
                tick={{ fontSize: 8 }}
                tickFormatter={(tick) => tick.length > 15 ? tick.substring(0, 12) + '...' : tick}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                tickFormatter={(value) => formatCompactCurrency(value)} 
                stroke={axisStroke}
                tick={{ fontSize: 11 }}
                dx={-8}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Budget" fill="#0E59F2" radius={[4, 4, 0, 0]}>
                {programData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>

      {/* Bottom row: Budget Charts */}
      {(budgetData && budgetData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-grid-cols-1 w-full min-w-0">
          {/* Chart 5: Disbursement Trends */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/85 shadow-sm card flex flex-col justify-between min-w-0">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Monthly Disbursement Trend</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500">Track the rate of fund disbursements over the year</p>
            </div>
            <div className="chart-container h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={disbursementTrendData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDisburse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis 
                    dataKey="name" 
                    stroke={axisStroke}
                    tick={{ fontSize: 10 }}
                    tickMargin={10}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCompactCurrency(value)} 
                    stroke={axisStroke}
                    tick={{ fontSize: 11 }}
                    dx={-8}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="Disbursed" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorDisburse)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 6: Budget Utilization by P/A/P */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/85 shadow-sm card flex flex-col justify-between min-w-0">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Budget Utilization (Top 10 P/A/P)</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500">Compare Obligated vs Disbursed amounts</p>
            </div>
            <div className="chart-container h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={papUtilizationData} margin={{ top: 10, right: 10, left: 15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis 
                    dataKey="name" 
                    stroke={axisStroke}
                    tick={{ fontSize: 9 }}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCompactCurrency(value)} 
                    stroke={axisStroke}
                    tick={{ fontSize: 11 }}
                    dx={-8}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg backdrop-blur-sm max-w-sm text-left">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">P/A/P Detail</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-white mb-1 leading-snug">{data.fullName}</p>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Obligated: {formatCurrency(data.Obligated)}</p>
                            <p className="text-sm font-extrabold text-emerald-500">Disbursed: {formatCurrency(data.Disbursed)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Obligated" fill="#0038A8" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Disbursed" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCharts;
