import React, { useState, useMemo } from 'react';
import {
  Coins,
  TrendingUp,
  ArrowUpRight,
  TrendingDown,
  Calendar,
  Layers,
  MapPin,
  Clock,
  AlertCircle,
  BarChart4,
  Briefcase,
  Users,
  Search,
  RefreshCw,
  FolderSync
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import KpiCard from './KpiCard';
import { formatCurrency, formatCompactCurrency, formatNumber, getMonthQuarter } from '../utils/formatters';

const CHART_COLORS = [
  '#0038A8', // Gov Blue
  '#FFC72C', // CHED Gold
  '#0E59F2', // Accent Blue
  '#D22630', // Gov Red
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
];

const CustomTooltip = ({ active, payload, label, isCurrency = true }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg backdrop-blur-sm text-left">
        {label && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</p>}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-xs text-slate-650 dark:text-slate-350">{entry.name}:</span>
            <span className="text-sm font-bold text-slate-850 dark:text-slate-100">
              {isCurrency ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const UtilizationDashboard = ({ summary, transactions = [], regionalTransfers = [], isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'monthly' | 'pap' | 'regional' | 'efficiency'
  
  // Local filter states inside dashboard tab
  const [dashFilters, setDashFilters] = useState({
    year: '',
    quarter: '',
    pap: '',
    type: ''
  });

  const gridStroke = isDarkMode ? '#1E293B' : '#E2E8F0';
  const axisStroke = isDarkMode ? '#94A3B8' : '#64748B';

  // Extract unique options dynamically
  const uniqueYears = useMemo(() => {
    const years = new Set();
    transactions.forEach(t => t.year && years.add(t.year));
    return [...years].sort((a, b) => b - a);
  }, [transactions]);

  const uniquePaps = useMemo(() => {
    const paps = new Set();
    transactions.forEach(t => t.pap && paps.add(t.pap));
    return [...paps].sort();
  }, [transactions]);

  // Apply dashboard level filters to transactions
  const filteredTx = useMemo(() => {
    return transactions.filter(t => {
      const matchYear = !dashFilters.year || String(t.year) === dashFilters.year;
      const matchQuarter = !dashFilters.quarter || getMonthQuarter(t.obligationDate) === dashFilters.quarter;
      const matchPap = !dashFilters.pap || t.pap === dashFilters.pap;
      const matchType = !dashFilters.type || t.type === dashFilters.type;
      return matchYear && matchQuarter && matchPap && matchType;
    });
  }, [transactions, dashFilters]);

  // Helper date calculation functions
  const getDaysBetween = (dateStr1, dateStr2) => {
    if (!dateStr1 || !dateStr2) return null;
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    if (isNaN(d1) || isNaN(d2)) return null;
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  // KPIs aggregated from filtered transactions
  const aggregatedKpis = useMemo(() => {
    let totalObligation = 0;
    let totalDisbursement = 0;
    let validEfficiencyPairs = 0;
    let totalEfficiencyDays = 0;
    let returnedFunds = 0;

    filteredTx.forEach(t => {
      totalObligation += t.obligationAmount || 0;
      totalDisbursement += t.disbursementAmount || 0;
      
      if (t.returnedToCo) {
        returnedFunds += t.returnedToCo;
      }
      if (t.returnedNta) {
        returnedFunds += t.returnedNta;
      }

      if (t.obligationDate && t.disbursementDate && t.disbursementAmount > 0) {
        const days = getDaysBetween(t.obligationDate, t.disbursementDate);
        if (days !== null) {
          totalEfficiencyDays += days;
          validEfficiencyPairs++;
        }
      }
    });

    const unpaidBalance = Math.max(0, totalObligation - totalDisbursement);
    const disbursementRate = totalObligation > 0 ? (totalDisbursement / totalObligation) * 100 : 0;
    const avgDaysToPay = validEfficiencyPairs > 0 ? (totalEfficiencyDays / validEfficiencyPairs) : 0;

    return {
      totalObligation,
      totalDisbursement,
      unpaidBalance,
      disbursementRate,
      avgDaysToPay,
      returnedFunds
    };
  }, [filteredTx]);

  // Allotment calculations (from parsed summary sheets if available)
  const allotmentSum = useMemo(() => {
    if (!summary) return 0;
    
    // If filtering by a specific PAP, grab allotment for that PAP
    const filterPap = dashFilters.pap;
    const filterType = dashFilters.type; // CURRENT vs CONTINUING

    let sum = 0;
    
    const countCurrent = summary.allCurrent || (summary.current ? [summary.current] : []);
    const countContinuing = summary.allContinuing || (summary.continuing ? [summary.continuing] : []);

    if (!filterType || filterType === 'CURRENT') {
      countCurrent.forEach(s => {
        if (!filterPap || s.pap === filterPap) {
          sum += s.allotment.total;
        }
      });
    }

    if (!filterType || filterType === 'CONTINUING') {
      countContinuing.forEach(s => {
        if (!filterPap || s.pap === filterPap) {
          sum += s.allotment.total;
        }
      });
    }

    return sum;
  }, [summary, dashFilters.pap, dashFilters.type]);

  // 1. Tab: Overview - Yearly Table data
  const yearlySummaryData = useMemo(() => {
    const tracker = {};
    
    // Group all transactions by year
    transactions.forEach(t => {
      const yr = t.year || 'Unknown';
      if (!tracker[yr]) {
        tracker[yr] = { year: yr, obligation: 0, disbursement: 0, count: 0 };
      }
      // Apply PAP & Type filters if active
      const matchPap = !dashFilters.pap || t.pap === dashFilters.pap;
      const matchType = !dashFilters.type || t.type === dashFilters.type;
      const matchQuarter = !dashFilters.quarter || getMonthQuarter(t.obligationDate) === dashFilters.quarter;
      
      if (matchPap && matchType && matchQuarter) {
        tracker[yr].obligation += t.obligationAmount || 0;
        tracker[yr].disbursement += t.disbursementAmount || 0;
        tracker[yr].count++;
      }
    });

    return Object.values(tracker)
      .map(d => ({
        ...d,
        unpaid: Math.max(0, d.obligation - d.disbursement),
        rate: d.obligation > 0 ? (d.disbursement / d.obligation) * 100 : 0
      }))
      .sort((a, b) => b.year.localeCompare(a.year));
  }, [transactions, dashFilters.pap, dashFilters.type, dashFilters.quarter]);

  // Multi-Year Chart Data
  const multiYearChartData = useMemo(() => {
    return [...yearlySummaryData].reverse();
  }, [yearlySummaryData]);

  // 2. Tab: Monthly Trend Data
  const monthlyTrendData = useMemo(() => {
    const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const tracker = monthsOrder.reduce((acc, m) => {
      acc[m] = { Obligation: 0, Disbursement: 0 };
      return acc;
    }, {});

    filteredTx.forEach(t => {
      if (t.obligationDate) {
        const parts = t.obligationDate.split(' ');
        const m = parts[0];
        if (tracker[m]) tracker[m].Obligation += t.obligationAmount || 0;
      }
      if (t.disbursementDate) {
        const parts = t.disbursementDate.split(' ');
        const m = parts[0];
        if (tracker[m]) tracker[m].Disbursement += t.disbursementAmount || 0;
      }
    });

    return monthsOrder.map(name => ({
      name,
      Obligation: tracker[name].Obligation,
      Disbursement: tracker[name].Disbursement
    }));
  }, [filteredTx]);

  // Top Payees
  const topPayeesData = useMemo(() => {
    const payees = {};
    filteredTx.forEach(t => {
      if (!t.payee) return;
      if (!payees[t.payee]) payees[t.payee] = { name: t.payee, obligation: 0, disbursement: 0 };
      payees[t.payee].obligation += t.obligationAmount || 0;
      payees[t.payee].disbursement += t.disbursementAmount || 0;
    });

    return Object.values(payees)
      .sort((a, b) => b.obligation - a.obligation)
      .slice(0, 10);
  }, [filteredTx]);

  // 3. Tab: PAP Analysis breakdown
  const papAnalysisData = useMemo(() => {
    const breakdown = {};
    filteredTx.forEach(t => {
      const p = t.pap || 'General';
      if (!breakdown[p]) {
        breakdown[p] = { pap: p, obligation: 0, disbursement: 0, count: 0 };
      }
      breakdown[p].obligation += t.obligationAmount || 0;
      breakdown[p].disbursement += t.disbursementAmount || 0;
      breakdown[p].count++;
    });

    return Object.values(breakdown)
      .map(d => ({
        ...d,
        unpaid: Math.max(0, d.obligation - d.disbursement),
        rate: d.obligation > 0 ? (d.disbursement / d.obligation) * 100 : 0
      }))
      .sort((a, b) => b.obligation - a.obligation);
  }, [filteredTx]);

  // 4. Tab: Regional transfers (from RO2025/RO2026 or year columns)
  // Let's combine regionalTransfers data parsed from sheets
  const regionalDashboardData = useMemo(() => {
    const filterYear = dashFilters.year;
    const filterPap = dashFilters.pap;
    const filterQuarter = dashFilters.quarter;
    
    // Group SAA/NTA transfers from regional sheets
    const regions = {};
    regionalTransfers.forEach(r => {
      const matchYear = !filterYear || r.year === filterYear;
      const matchPap = !filterPap || r.pap === filterPap;
      const matchQuarter = !filterQuarter || getMonthQuarter(r.date) === filterQuarter;
      
      if (matchYear && matchPap && matchQuarter) {
        const reg = r.transferTo || 'Unspecified Region';
        if (!regions[reg]) {
          regions[reg] = { region: reg, obligation: 0, disbursement: 0, returned: 0, count: 0 };
        }
        regions[reg].obligation += r.obligation || 0;
        regions[reg].disbursement += r.disbursement || 0;
        regions[reg].returned += r.transferFrom || 0;
        regions[reg].count++;
      }
    });

    // If regionalTransfers is empty (e.g. not parsed or old data), fallback to regional columns in transactions
    if (Object.keys(regions).length === 0) {
      filteredTx.forEach(t => {
        // Deduced from payee or obligation number if it has CHEDRO info
        if (t.roObligationAmount > 0 || t.roDisbursementAmount > 0) {
          let reg = 'CHEDRO-RO';
          const match = (t.obligationNumber || t.payee || '').match(/(CHEDRO-[A-Z0-9]+)/i);
          if (match) reg = match[1].toUpperCase();
          
          if (!regions[reg]) {
            regions[reg] = { region: reg, obligation: 0, disbursement: 0, returned: 0, count: 0 };
          }
          regions[reg].obligation += t.roObligationAmount || 0;
          regions[reg].disbursement += t.roDisbursementAmount || 0;
          regions[reg].returned += t.returnedToCo || 0;
          regions[reg].count++;
        }
      });
    }

    return Object.values(regions)
      .map(d => ({
        ...d,
        unpaid: Math.max(0, d.obligation - d.disbursement),
        rate: d.obligation > 0 ? (d.disbursement / d.obligation) * 100 : 0
      }))
      .sort((a, b) => b.obligation - a.obligation);
  }, [regionalTransfers, filteredTx, dashFilters.year, dashFilters.pap, dashFilters.quarter]);

  // 5. Tab: Efficiency & Unpaid Aging
  const unpaidAgingData = useMemo(() => {
    // Reference date for aging is June 16, 2026
    const refDate = new Date('2026-06-16');
    
    let under30 = { count: 0, amount: 0 };
    let mid30to90 = { count: 0, amount: 0 };
    let over90 = { count: 0, amount: 0 };
    
    const items = [];

    filteredTx.forEach(t => {
      const unpaid = Math.max(0, t.obligationAmount - t.disbursementAmount);
      if (unpaid > 10) { // threshold of 10 pesos to exclude minor differences
        let days = 999;
        if (t.obligationDate) {
          const d = new Date(t.obligationDate);
          if (!isNaN(d)) {
            days = Math.max(0, Math.ceil((refDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
          }
        }

        const item = {
          ...t,
          unpaid,
          days
        };
        items.push(item);

        if (days < 30) {
          under30.count++;
          under30.amount += unpaid;
        } else if (days <= 90) {
          mid30to90.count++;
          mid30to90.amount += unpaid;
        } else {
          over90.count++;
          over90.amount += unpaid;
        }
      }
    });

    return {
      summary: [
        { name: '< 30 Days Aging', value: under30.amount, count: under30.count },
        { name: '30 - 90 Days Aging', value: mid30to90.amount, count: mid30to90.count },
        { name: '> 90 Days Aging', value: over90.amount, count: over90.count }
      ],
      list: items.sort((a, b) => b.unpaid - a.unpaid)
    };
  }, [filteredTx]);

  const handleResetFilters = () => {
    setDashFilters({ year: '', quarter: '', pap: '', type: '' });
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Filter Panel */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm text-left filter-bar no-print flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-gov-blue dark:text-gov-blue-accent" />
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
            Dashboard Filters
          </h4>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Year Select */}
          <div className="flex flex-col space-y-1 w-full sm:w-auto min-w-[120px]">
            <select
              value={dashFilters.year}
              onChange={(e) => setDashFilters(prev => ({ ...prev, year: e.target.value }))}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue outline-none"
            >
              <option value="">All Years</option>
              {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Quarter Select */}
          <div className="flex flex-col space-y-1 w-full sm:w-auto min-w-[120px]">
            <select
              value={dashFilters.quarter}
              onChange={(e) => setDashFilters(prev => ({ ...prev, quarter: e.target.value }))}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue outline-none"
            >
              <option value="">All Quarters</option>
              <option value="Q1">Q1 (Jan - Mar)</option>
              <option value="Q2">Q2 (Apr - Jun)</option>
              <option value="Q3">Q3 (Jul - Sep)</option>
              <option value="Q4">Q4 (Oct - Dec)</option>
            </select>
          </div>

          {/* PAP Select */}
          <div className="flex flex-col space-y-1 w-full sm:w-auto min-w-[140px]">
            <select
              value={dashFilters.pap}
              onChange={(e) => setDashFilters(prev => ({ ...prev, pap: e.target.value }))}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue outline-none"
            >
              <option value="">All PAPs</option>
              {uniquePaps.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Fund Type Select */}
          <div className="flex flex-col space-y-1 w-full sm:w-auto min-w-[120px]">
            <select
              value={dashFilters.type}
              onChange={(e) => setDashFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue outline-none"
            >
              <option value="">All Fund Types</option>
              <option value="CURRENT">Current</option>
              <option value="CONTINUING">Continuing</option>
            </select>
          </div>

          {(dashFilters.year || dashFilters.quarter || dashFilters.pap || dashFilters.type) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gov-red dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
            >
              <RefreshCw size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print-grid-cols-2">
        {allotmentSum > 0 && (
          <KpiCard
            title="Active Allotment"
            value={formatCurrency(allotmentSum)}
            icon={Briefcase}
            colorClass="blue"
            tooltip="Total parsed budget allocation from summary sheets"
            subtext="From CURRENT / CONTINUING"
          />
        )}
        <KpiCard
          title="Total Obligations"
          value={formatCurrency(aggregatedKpis.totalObligation)}
          icon={Coins}
          colorClass="gold"
          tooltip="Committed financial obligations matching current filters"
          subtext={allotmentSum > 0 ? `Utilization: ${((aggregatedKpis.totalObligation / allotmentSum) * 100).toFixed(2)}%` : `${filteredTx.length} transactions`}
        />
        <KpiCard
          title="Disbursements"
          value={formatCurrency(aggregatedKpis.totalDisbursement)}
          icon={ArrowUpRight}
          colorClass="slate"
          tooltip="Actual disbursement payments completed"
          subtext={`Payment Rate: ${aggregatedKpis.disbursementRate.toFixed(2)}%`}
        />
        <KpiCard
          title="Unpaid Balance"
          value={formatCurrency(aggregatedKpis.unpaidBalance)}
          icon={TrendingDown}
          colorClass="red"
          tooltip="Obligation minus disbursement outstanding"
          subtext={`${(100 - aggregatedKpis.disbursementRate).toFixed(2)}% unpaid obligations`}
        />
      </div>

      {/* Primary Dashboard Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 no-print overflow-x-auto scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap
            ${activeTab === 'overview'
              ? 'border-gov-blue text-gov-blue dark:border-gov-blue-accent dark:text-gov-blue-accent'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
        >
          <BarChart4 size={14} /> Yearly Overview & Trends
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap
            ${activeTab === 'monthly'
              ? 'border-gov-blue text-gov-blue dark:border-gov-blue-accent dark:text-gov-blue-accent'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
        >
          <Calendar size={14} /> Monthly Trend & Payees
        </button>
        <button
          onClick={() => setActiveTab('pap')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap
            ${activeTab === 'pap'
              ? 'border-gov-blue text-gov-blue dark:border-gov-blue-accent dark:text-gov-blue-accent'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
        >
          <Layers size={14} /> P/A/P Breakdown
        </button>
        <button
          onClick={() => setActiveTab('regional')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap
            ${activeTab === 'regional'
              ? 'border-gov-blue text-gov-blue dark:border-gov-blue-accent dark:text-gov-blue-accent'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
        >
          <MapPin size={14} /> Regional Transfers
        </button>
        <button
          onClick={() => setActiveTab('efficiency')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap
            ${activeTab === 'efficiency'
              ? 'border-gov-blue text-gov-blue dark:border-gov-blue-accent dark:text-gov-blue-accent'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
        >
          <Clock size={14} /> Efficiency & Aging ({unpaidAgingData.list.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0 w-full">
              {/* Table */}
              <div className="card-bg rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 card overflow-hidden text-left flex flex-col justify-between">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Yearly Summary Table</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Obligation and payment tracking per fiscal year</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <th className="px-5 py-3">Year</th>
                        <th className="px-5 py-3 text-right">Obligated</th>
                        <th className="px-5 py-3 text-right">Disbursed</th>
                        <th className="px-5 py-3 text-right">Unpaid Balance</th>
                        <th className="px-5 py-3 text-right">Disbursed %</th>
                        <th className="px-5 py-3 text-center">Tx Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {yearlySummaryData.map((d) => (
                        <tr key={d.year} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-3.5 font-bold text-slate-700 dark:text-slate-350">{d.year}</td>
                          <td className="px-5 py-3.5 text-right font-medium">{formatCurrency(d.obligation)}</td>
                          <td className="px-5 py-3.5 text-right font-medium text-slate-750 dark:text-slate-300">{formatCurrency(d.disbursement)}</td>
                          <td className="px-5 py-3.5 text-right font-semibold text-rose-500">{formatCurrency(d.unpaid)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={`inline-flex px-1.5 py-0.5 rounded font-bold border text-[10px]
                              ${d.rate > 85 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                d.rate > 50 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                              {d.rate.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center text-slate-500">{formatNumber(d.count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chart */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm card flex flex-col justify-between min-w-0">
                <div className="mb-4 text-left">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Multi-Year Allotment Trend</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Comparative obligation vs disbursement over the years</p>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={multiYearChartData} margin={{ top: 10, right: 10, left: 15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                      <XAxis dataKey="year" stroke={axisStroke} tick={{ fontSize: 11 }} dy={8} />
                      <YAxis tickFormatter={(val) => formatCompactCurrency(val)} stroke={axisStroke} tick={{ fontSize: 11 }} dx={-8} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Bar dataKey="obligation" name="Obligated" fill="#0038A8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="disbursement" name="Disbursed" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Monthly Trend & Payees */}
        {activeTab === 'monthly' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
              {/* Monthly Line Chart */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm card flex flex-col justify-between min-w-0">
                <div className="mb-4 text-left">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Monthly Transaction Trend</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Aggregated obligations vs disbursements over month timeline</p>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 15, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorOb" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0E59F2" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#0E59F2" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDis" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                      <XAxis dataKey="name" stroke={axisStroke} tick={{ fontSize: 11 }} dy={8} />
                      <YAxis tickFormatter={(val) => formatCompactCurrency(val)} stroke={axisStroke} tick={{ fontSize: 11 }} dx={-8} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Area type="monotone" dataKey="Obligation" stroke="#0E59F2" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOb)" />
                      <Area type="monotone" dataKey="Disbursement" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDis)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payees List */}
              <div className="card-bg rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 card overflow-hidden text-left flex flex-col justify-between">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Top 10 Payees</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Payees receiving the highest total obligation allocations</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <th className="px-5 py-3">Payee Name</th>
                        <th className="px-5 py-3 text-right">Obligated Amount</th>
                        <th className="px-5 py-3 text-right">Disbursed Amount</th>
                        <th className="px-5 py-3 text-right">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {topPayeesData.map((d, index) => (
                        <tr key={d.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={d.name}>
                            <span className="inline-block text-slate-400 font-bold mr-2 text-[10px] w-4 text-center">#{index + 1}</span>
                            {d.name}
                          </td>
                          <td className="px-5 py-3 text-right font-medium">{formatCurrency(d.obligation)}</td>
                          <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(d.disbursement)}</td>
                          <td className="px-5 py-3 text-right font-bold text-rose-500">{formatCurrency(Math.max(0, d.obligation - d.disbursement))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: PAP Analysis */}
        {activeTab === 'pap' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              {/* PAP List Table */}
              <div className="card-bg rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 card overflow-hidden text-left lg:col-span-2 flex flex-col justify-between">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Program / Project / Activity (P/A/P) List</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Utilization breakdown by budget PAP codes</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <th className="px-5 py-3">P/A/P Code</th>
                        <th className="px-5 py-3 text-right">Obligated</th>
                        <th className="px-5 py-3 text-right">Disbursed</th>
                        <th className="px-5 py-3 text-right">Unpaid Balance</th>
                        <th className="px-5 py-3 text-right">Payment %</th>
                        <th className="px-5 py-3 text-center">Tx</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {papAnalysisData.map((d) => (
                        <tr key={d.pap} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-3.5 font-bold text-gov-blue dark:text-gov-blue-accent">{d.pap}</td>
                          <td className="px-5 py-3.5 text-right font-medium">{formatCurrency(d.obligation)}</td>
                          <td className="px-5 py-3.5 text-right font-medium text-slate-700 dark:text-slate-300">{formatCurrency(d.disbursement)}</td>
                          <td className="px-5 py-3.5 text-right font-semibold text-rose-500">{formatCurrency(d.unpaid)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={`inline-flex px-1.5 py-0.5 rounded font-bold border text-[10px]
                              ${d.rate > 85 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                d.rate > 50 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                              {d.rate.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center text-slate-500">{formatNumber(d.count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PAP Share Chart */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm card flex flex-col justify-between min-w-0">
                <div className="mb-4 text-left">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Obligation Share by PAP</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Distribution share of total obligated funds</p>
                </div>
                <div className="h-64 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={papAnalysisData}
                        dataKey="obligation"
                        nameKey="pap"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {papAnalysisData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                  {papAnalysisData.slice(0, 5).map((d, index) => (
                    <div key={d.pap} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{d.pap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Regional Transfers */}
        {activeTab === 'regional' && (
          <div className="space-y-6 animate-fade-in">
            {aggregatedKpis.returnedFunds > 0 && (
              <div className="p-4 bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-400">
                <FolderSync size={18} className="text-emerald-500" />
                <div>
                  <span className="font-bold">Returned Funds Tracking:</span> Active sub-allotments have returned a total of <span className="font-extrabold">{formatCurrency(aggregatedKpis.returnedFunds)}</span> back to the Central Office.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              {/* Regional Table */}
              <div className="card-bg rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 card overflow-hidden text-left lg:col-span-2 flex flex-col justify-between">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">CHED Regional Offices (CHEDRO) Allotments</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">SAA & NTA utilization per region</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <th className="px-5 py-3">Region</th>
                        <th className="px-5 py-3 text-right">Obligated</th>
                        <th className="px-5 py-3 text-right">Disbursed</th>
                        <th className="px-5 py-3 text-right">Returned</th>
                        <th className="px-5 py-3 text-right">Disbursed %</th>
                        <th className="px-5 py-3 text-center">SAAs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {regionalDashboardData.length > 0 ? (
                        regionalDashboardData.map((d) => (
                          <tr key={d.region} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-350">{d.region}</td>
                            <td className="px-5 py-3 text-right font-medium">{formatCurrency(d.obligation)}</td>
                            <td className="px-5 py-3 text-right font-medium text-slate-700 dark:text-slate-300">{formatCurrency(d.disbursement)}</td>
                            <td className="px-5 py-3 text-right text-slate-500">{formatCurrency(d.returned)}</td>
                            <td className="px-5 py-3 text-right">
                              <span className={`inline-flex px-1.5 py-0.5 rounded font-bold border text-[10px]
                                ${d.rate > 85 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                  d.rate > 50 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                  'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                                {d.rate.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center text-slate-550">{formatNumber(d.count)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                            No regional transfer data parsed for the current year.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Regional Bar Chart */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm card flex flex-col justify-between min-w-0">
                <div className="mb-4 text-left">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Obligation by CHEDRO Region</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Comparing regional allocations</p>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionalDashboardData.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                      <XAxis type="number" tickFormatter={(val) => formatCompactCurrency(val)} stroke={axisStroke} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="region" width={85} stroke={axisStroke} tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="obligation" name="Obligated" fill="#0038A8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Efficiency & Aging */}
        {activeTab === 'efficiency' && (
          <div className="space-y-6 animate-fade-in">
            {/* Payment Efficiency Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Payment Efficiency */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm card text-left flex items-center gap-5">
                <div className="p-4 bg-blue-500/10 text-gov-blue dark:text-gov-blue-accent rounded-full shrink-0">
                  <Clock size={32} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-405 dark:text-slate-500 uppercase tracking-widest">
                    Payment Efficiency Rate
                  </h4>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {aggregatedKpis.avgDaysToPay.toFixed(1)} Days
                  </p>
                  <p className="text-xs text-slate-450 dark:text-slate-400 mt-1.5 leading-normal">
                    Average elapsed days from obligation request approval date to payment disbursement completed date.
                  </p>
                </div>
              </div>

              {/* Aging Summary */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm card flex flex-col justify-between text-left">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Unpaid Aging Classification</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Aging brackets of outstanding unpaid balances</p>
                </div>
                <div className="mt-4 space-y-3">
                  {unpaidAgingData.summary.map((d, index) => {
                    const totalAmt = unpaidAgingData.summary.reduce((s, x) => s + x.value, 0);
                    const pct = totalAmt > 0 ? (d.value / totalAmt) * 100 : 0;
                    const colors = ['bg-blue-500', 'bg-amber-500', 'bg-rose-500'];
                    return (
                      <div key={d.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-350">
                          <span>{d.name} ({d.count} items)</span>
                          <span className="font-bold">{formatCurrency(d.value)} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${colors[index]} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Unpaid Transactions Drilldown */}
            <div className="card-bg rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 card overflow-hidden text-left flex flex-col justify-between">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <AlertCircle size={18} className="text-rose-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Unpaid Ledger Monitoring</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Aging report listing all line-items with outstanding unpaid obligations</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="px-5 py-3">Obligation Number</th>
                      <th className="px-5 py-3">P/A/P</th>
                      <th className="px-5 py-3">Payee</th>
                      <th className="px-5 py-3">Particulars</th>
                      <th className="px-5 py-3 text-right">Obligated</th>
                      <th className="px-5 py-3 text-right">Disbursed</th>
                      <th className="px-5 py-3 text-right">Unpaid Balance</th>
                      <th className="px-5 py-3 text-center">Aging Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {unpaidAgingData.list.length > 0 ? (
                      unpaidAgingData.list.slice(0, 15).map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-350 max-w-[130px] truncate" title={d.obligationNumber}>
                            {d.obligationNumber}
                          </td>
                          <td className="px-5 py-3 font-bold text-gov-blue dark:text-gov-blue-accent">{d.pap}</td>
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200 max-w-[120px] truncate" title={d.payee}>
                            {d.payee}
                          </td>
                          <td className="px-5 py-3 text-slate-500 max-w-[180px] truncate" title={d.particulars}>
                            {d.particulars}
                          </td>
                          <td className="px-5 py-3 text-right font-medium">{formatCurrency(d.obligationAmount)}</td>
                          <td className="px-5 py-3 text-right text-slate-500">{formatCurrency(d.disbursementAmount)}</td>
                          <td className="px-5 py-3 text-right font-bold text-rose-500">{formatCurrency(d.unpaid)}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex px-1.5 py-0.5 rounded font-bold border text-[10px]
                              ${d.days < 30 ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                d.days <= 90 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                              {d.days} days
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                          Excellent! All obligations have been fully paid (0 unpaid balances).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {unpaidAgingData.list.length > 15 && (
                <div className="p-3 border-t text-center text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40">
                  Showing top 15 highest unpaid balances. Go to the Checklist tab to inspect all {unpaidAgingData.list.length} unpaid items.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UtilizationDashboard;
