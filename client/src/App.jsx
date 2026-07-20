import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  Table2,
  UploadCloud,
  Coins,
  FileSpreadsheet,
  Users,
  TrendingUp,
  Download,
  Printer,
  HelpCircle,
  FileCheck,
  Globe2,
  X,
  Calendar,
  ClipboardList,
  CreditCard,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Search,
  Filter,
  LogOut,
  Database
} from 'lucide-react';
import { fetchWfpData, fetchBudgetData, saveWfpData, saveBudgetData, updateWfpActivity, deleteWfpActivity, updateBudgetTransaction, deleteBudgetTransaction, addWfpActivity, addBudgetTransaction, fetchUsers, addUser, updateUser, deleteUser } from './services/api';
import Login from './components/Login';
import KpiCard from './components/KpiCard';
import DashboardCharts from './components/DashboardCharts';
import ActivityTable from './components/ActivityTable';
import ExcelUploader from './components/ExcelUploader';
import UtilizationDashboard from './components/UtilizationDashboard';
import TransactionLedger from './components/TransactionLedger';
import EditWfpModal from './components/EditWfpModal';
import EditTransactionModal from './components/EditTransactionModal';
import UserManagement from './components/UserManagement';
import UserModal from './components/UserModal';
import AuditLogs from './components/AuditLogs';
import UserProfile from './components/UserProfile';
import MonthlyTimeline from './components/MonthlyTimeline';
import { sampleWfpData, downloadExcelTemplate } from './utils/sampleData';
import { sampleBudgetSummary, sampleBudgetTransactions } from './utils/budgetSampleData';
import { formatCurrency, formatNumber, normalizeString, getMonthQuarter } from './utils/formatters';
import chedIasLogo from './assets/ched-ias.png';

function App() {
  // Auth State
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('ias_user')));
  const isAuthenticated = !!user;

  // Application States
  const [wfpData, setWfpData] = useState([]);
  const [wfpFileName, setWfpFileName] = useState('');

  const [budgetSummary, setBudgetSummary] = useState(null);
  const [budgetTransactions, setBudgetTransactions] = useState([]);
  const [budgetFileName, setBudgetFileName] = useState('');
  const [regionalTransfers, setRegionalTransfers] = useState([]);
  const [usersData, setUsersData] = useState([]);

  const [activeTab, setActiveTab] = useState(() => {
    const userRole = JSON.parse(localStorage.getItem('ias_user'))?.role;
    return userRole === 'VIEWER' ? 'dashboard' : 'uploader';
  });
  const [dashboardTab, setDashboardTab] = useState('wfp');
  const [checklistTab, setChecklistTab] = useState('wfp');
  const [isTimelineView, setIsTimelineView] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Edit/Delete States
  const [isEditWfpOpen, setIsEditWfpOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState(null);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  // Sidebar States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const loadData = async (showToastOnLoad = false) => {
    try {
      let hasData = false;

      const wfp = await fetchWfpData();
      if (wfp && wfp.length > 0) {
        setWfpData(wfp);
        setWfpFileName('Database_WFP_Data');
        hasData = true;
      }

      const budget = await fetchBudgetData();
      if (budget && (budget.transactions?.length > 0 || budget.summary?.allCurrent?.length > 0)) {
        setBudgetSummary(budget.summary);
        setBudgetTransactions(budget.transactions);
        setRegionalTransfers(budget.regionalTransfers || []);
        setBudgetFileName('Database_Budget_Data');
        hasData = true;
      }

      if (hasData && showToastOnLoad) {
        setActiveTab('dashboard');
        triggerToast("Loaded data from database!");
      }

      try {
        const usersResponse = await fetchUsers();
        setUsersData(usersResponse);
      } catch (e) {
        console.error("Failed to load users:", e);
      }
    } catch (err) {
      console.error("Failed to load data from DB:", err);
    }
  };

  // Fetch data from backend on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    loadData(true);
  }, [isAuthenticated]);

  // Edit/Delete Handlers
  const openAddWfp = () => {
    setActivityToEdit({});
    setIsEditWfpOpen(true);
  };

  const openEditWfp = (activity) => {
    setActivityToEdit(activity ? { ...activity } : {});
    setIsEditWfpOpen(true);
  };

  const handleSaveWfpEdit = async (updatedData) => {
    try {
      if (updatedData._id) {
        await updateWfpActivity(updatedData._id, updatedData);
        triggerToast("Activity updated successfully!");
      } else {
        await addWfpActivity(updatedData);
        triggerToast("Activity added successfully!");
      }
      await loadData();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to save activity");
    }
  };

  const handleDeleteWfp = async (id) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    try {
      await deleteWfpActivity(id);
      triggerToast("Activity deleted successfully!");
      await loadData();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to delete activity");
    }
  };

  const openAddTransaction = () => {
    setTransactionToEdit({});
    setIsEditTransactionOpen(true);
  };

  const openEditTransaction = (transaction) => {
    setTransactionToEdit(transaction ? { ...transaction } : {});
    setIsEditTransactionOpen(true);
  };

  const handleSaveTransactionEdit = async (updatedData) => {
    try {
      if (updatedData._id) {
        await updateBudgetTransaction(updatedData._id, updatedData);
        triggerToast("Transaction updated successfully!");
      } else {
        await addBudgetTransaction(updatedData);
        triggerToast("Transaction added successfully!");
      }
      await loadData();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to save transaction");
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await deleteBudgetTransaction(id);
      triggerToast("Transaction deleted successfully!");
      await loadData();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to delete transaction");
    }
  };

  const openAddUser = () => {
    setUserToEdit({});
    setIsUserModalOpen(true);
  };

  const openEditUser = (u) => {
    setUserToEdit(u);
    setIsUserModalOpen(true);
  };

  const handleSaveUserEdit = async (updatedData) => {
    try {
      if (updatedData._id) {
        await updateUser(updatedData._id, updatedData);
        triggerToast("User updated successfully!");
      } else {
        await addUser(updatedData);
        triggerToast("User added successfully!");
      }
      await loadData();
    } catch (err) {
      console.error(err);
      triggerToast(err.message || "Failed to save user");
      throw err; // So UserModal can catch it
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      triggerToast("User deleted successfully!");
      await loadData();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to delete user");
    }
  };

  const handleSaveWfpToDb = async () => {
    try {
      if (wfpData.length === 0) return;
      await saveWfpData(wfpData);
      triggerToast("WFP Data saved to database successfully!");
    } catch (err) {
      triggerToast("Failed to save WFP data to database.");
      console.error(err);
    }
  };

  const handleSaveBudgetToDb = async () => {
    try {
      if (!budgetSummary || budgetTransactions.length === 0) return;
      const payload = {
        summary: budgetSummary,
        transactions: budgetTransactions,
        regionalTransfers: regionalTransfers
      };
      await saveBudgetData(payload);
      triggerToast("Budget Data saved to database successfully!");
    } catch (err) {
      triggerToast("Failed to save Budget data to database.");
      console.error(err);
    }
  };

  // Filters State (Affects charts and tables simultaneously!)
  const [filters, setFilters] = useState({
    quarter: '',
    month: '',
    activityTitle: '',
    objectOfExpenditure: '',
    search: ''
  });

  // Toast notification helper
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Callback when WFP Excel is parsed
  const handleWfpParsed = (data, name) => {
    setWfpData(data);
    setWfpFileName(name);
    setFilters({ quarter: '', month: '', activityTitle: '', objectOfExpenditure: '', search: '' });
    triggerToast(`Successfully parsed ${data.length} WFP activities from ${name}`);
  };

  // Callback when Budget Excel is parsed
  const handleBudgetParsed = (summary, transactions, name, regionalTransfersData) => {
    setBudgetSummary(summary);
    setBudgetTransactions(transactions);
    setRegionalTransfers(regionalTransfersData || []);
    setBudgetFileName(name);
    triggerToast(`Successfully parsed Budget Utilization data from ${name}`);
  };



  // Load both demo datasets
  const handleLoadAllDemo = () => {
    setWfpData(sampleWfpData);
    setWfpFileName('Demo_IAS_WFP_2026.xlsx');

    const demoSummary = {
      current: sampleBudgetSummary.current,
      continuing: sampleBudgetSummary.continuing,
      allCurrent: [
        sampleBudgetSummary.current,
        {
          program: 'Support to Continuous Quality Improvement (SCQI)',
          pap: 'SCQI',
          allotment: { central: 2608622.64, regional: 0, total: 2608622.64 },
          obligation: { central: 1067700.85, regional: 0, total: 1067700.85, percent: 0.4093 },
          disbursement: { central: 500000, regional: 0, total: 500000, percent: 0.468 },
          unobligated: { central: 1540921.79, regional: 0, total: 1540921.79, percent: 0.59 },
          unpaid: { central: 567700.85, regional: 0, total: 567700.85, percent: 0.53 }
        },
        {
          program: 'Provision of Support to STEEGS',
          pap: 'STEEGS',
          allotment: { central: 2908239.99, regional: 0, total: 2908239.99 },
          obligation: { central: 621072.18, regional: 0, total: 621072.18, percent: 0.213 },
          disbursement: { central: 300000, regional: 0, total: 300000, percent: 0.48 },
          unobligated: { central: 2287167.81, regional: 0, total: 2287167.81, percent: 0.787 },
          unpaid: { central: 321072.18, regional: 0, total: 321072.18, percent: 0.51 }
        }
      ],
      allContinuing: [
        sampleBudgetSummary.continuing,
        {
          program: 'Information Technology Development Program',
          pap: 'IT',
          allotment: { central: 5692961.92, regional: 0, total: 5692961.92 },
          obligation: { central: 5509621.86, regional: 0, total: 5509621.86, percent: 0.967 },
          disbursement: { central: 4000000, regional: 0, total: 4000000, percent: 0.726 },
          unobligated: { central: 183340.06, regional: 0, total: 183340.06, percent: 0.032 },
          unpaid: { central: 1509621.86, regional: 0, total: 1509621.86, percent: 0.274 }
        }
      ]
    };
    setBudgetSummary(demoSummary);

    const demoTransactions = [];
    sampleBudgetTransactions.forEach(t => {
      demoTransactions.push({
        ...t,
        year: '2026'
      });
    });

    const yearsToGen = ['2025', '2024', '2023', '2022', '2021'];
    yearsToGen.forEach((y, yrIndex) => {
      sampleBudgetTransactions.forEach((t, tIdx) => {
        if (tIdx % (yrIndex + 1) === 0) {
          const factor = 0.7 + (yrIndex * 0.05);
          const obAmt = Math.round(t.obligationAmount * factor * 100) / 100;
          const disbAmt = tIdx % 7 === 0 ? 0 : Math.round(t.disbursementAmount * factor * 100) / 100;

          let obDate = '';
          if (t.obligationDate) {
            obDate = t.obligationDate.replace('2026', y);
          } else {
            obDate = `Feb 15, ${y}`;
          }

          let disDate = '';
          if (t.disbursementDate) {
            disDate = t.disbursementDate.replace('2026', y);
          } else if (disbAmt > 0) {
            disDate = `Feb 25, ${y}`;
          }

          const papOptions = ['BICPPHE', 'ICPPHE', 'IT', 'HEDF', 'PSG DEV\'T', 'MSRS'];
          const pap = papOptions[tIdx % papOptions.length];

          demoTransactions.push({
            ...t,
            id: `${y}-${t.id}`,
            year: y,
            obligationDate: obDate,
            obligationAmount: obAmt,
            disbursementDate: disDate,
            disbursementAmount: disbAmt,
            pap: pap,
            type: t.type,
            obligationNumber: t.obligationNumber ? t.obligationNumber.replace('2026', y) : `N/A (${y})`
          });
        }
      });
    });
    setBudgetTransactions(demoTransactions);

    const mockRegionalTransfers = [];
    const regions = [
      'CHEDRO-I', 'CHEDRO-II', 'CHEDRO-III', 'CHEDRO-IV', 'CHEDRO-V',
      'CHEDRO-VI', 'CHEDRO-VII', 'CHEDRO-VIII', 'CHEDRO-IX', 'CHEDRO-X',
      'CHEDRO-XI', 'CHEDRO-XII', 'CHEDRO-CAR', 'CHEDRO-CARAGA', 'CHEDRO-NCR'
    ];
    const paps = ['BICPPHE', 'IT', 'HEDF', 'MSRS', 'PSG DEV\'T', 'STEEGS', 'LUDIP'];

    let transferId = 1;
    for (const year of ['2025', '2026']) {
      regions.forEach((region, rIdx) => {
        paps.forEach((pap, pIdx) => {
          if ((rIdx + pIdx) % 3 === 0) {
            const allocation = (100000 + (rIdx * 15000) + (pIdx * 25000)) * (year === '2026' ? 1.1 : 1.0);
            const status = pIdx % 2 === 0 ? 'Current' : 'Continuing';
            const obligation = allocation * 0.9;
            const disbursement = obligation * 0.85;
            const transferFrom = status === 'Continuing' ? allocation : 0;

            mockRegionalTransfers.push({
              id: `demo-ro-${transferId++}`,
              year: year,
              saaNumber: `${region}-${year}-${String(100 + pIdx).substring(1)} ${status}`,
              obligation: obligation,
              disbursement: disbursement,
              pap: pap,
              date: `Feb ${10 + (rIdx % 15)}, ${year}`,
              transferTo: region,
              status: status,
              transferFrom: transferFrom
            });
          }
        });
      });
    }
    setRegionalTransfers(mockRegionalTransfers);

    setBudgetFileName('Demo_IAS_Budget_Utilization.xlsx');
    setFilters({ quarter: '', month: '', activityTitle: '', objectOfExpenditure: '', search: '' });
    triggerToast("Loaded demo datasets! Don't forget to save to the database.");
  };

  const uniqueMonths = useMemo(() => {
    const months = wfpData.map(item => item.month);

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

    const getMonthOrderScore = (m) => {
      if (!m) return 99;
      const upper = m.toUpperCase().trim();
      const idx = monthsOrder.findIndex(o => o.short === upper || o.full.toUpperCase() === upper);
      return idx === -1 ? 99 : idx;
    };

    const uniqueRawMonths = [...new Set(months)];
    return uniqueRawMonths.sort((a, b) => getMonthOrderScore(a) - getMonthOrderScore(b));
  }, [wfpData]);

  const uniqueActivities = useMemo(() => {
    const activities = wfpData.map(item => item.activity);
    return [...new Set(activities)].sort();
  }, [wfpData]);

  const uniqueExpenses = useMemo(() => {
    const expenses = wfpData.map(item => item.objectOfExpenditure);
    return [...new Set(expenses)].sort();
  }, [wfpData]);

  const filteredData = useMemo(() => {
    return wfpData.filter(item => {
      const matchQuarter = !filters.quarter || getMonthQuarter(item.month) === filters.quarter;
      const matchMonth = !filters.month || item.month === filters.month;
      const matchActivity = !filters.activityTitle || item.activity === filters.activityTitle;
      const matchExpense = !filters.objectOfExpenditure || item.objectOfExpenditure === filters.objectOfExpenditure;

      const searchNorm = normalizeString(filters.search);
      const matchSearch = !filters.search ||
        normalizeString(item.activity).includes(searchNorm) ||
        normalizeString(item.projectProgram).includes(searchNorm) ||
        normalizeString(item.objectOfExpenditure).includes(searchNorm) ||
        normalizeString(item.remarks).includes(searchNorm);

      return matchQuarter && matchMonth && matchActivity && matchExpense && matchSearch;
    });
  }, [wfpData, filters]);

  // Compute KPI card calculations from FILTERED data
  const kpis = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalBudget: 0,
        activityCount: 0,
        totalParticipants: 0,
        highestBudgetActivity: { activity: 'N/A', totalBudget: 0 }
      };
    }

    let totalBudget = 0;
    let totalParticipants = 0;
    let highestBudgetActivity = filteredData[0];

    filteredData.forEach(item => {
      totalBudget += item.totalBudget;
      totalParticipants += item.participants;
      if (item.totalBudget > highestBudgetActivity.totalBudget) {
        highestBudgetActivity = item;
      }
    });

    return {
      totalBudget,
      activityCount: filteredData.length,
      totalParticipants,
      highestBudgetActivity
    };
  }, [filteredData]);

  // Top 5 highest budgeted activities in current filtered view (for Dashboard quick glance)
  const topActivitiesForDashboard = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => b.totalBudget - a.totalBudget)
      .slice(0, 5);
  }, [filteredData]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('ias_user');
    setUser(null);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen app-bg font-sans overflow-hidden relative transition-colors duration-300">
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-35 md:hidden transition-all duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* 4. SIDEBAR NAVIGATION */}
      <aside
        className={`bg-gradient-to-b from-sidebar via-[#0A1627] to-[#050C16] text-slate-300 flex flex-col justify-between flex-shrink-0 z-40 no-print border-r border-slate-800/60 transition-all duration-300 ease-in-out shadow-2xl
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
          w-64 fixed inset-y-0 left-0 md:relative
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div>
          {/* Logo & Branding */}
          <div className="p-6 border-b border-slate-800/60 bg-sidebar/40 flex items-center justify-between gap-3 group/brand">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden p-0.5 border border-slate-700 shrink-0 ring-2 ring-gov-gold/5 group-hover/brand:ring-gov-gold/40 transition-all duration-300">
                <img src={chedIasLogo} alt="CHED IAS Logo" className="h-full w-full object-contain" />
              </div>
              <div className={`text-left leading-none transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:opacity-0 md:w-0 md:pointer-events-none' : 'opacity-100'}`}>
                <h2 className="text-sm font-extrabold text-white tracking-wide whitespace-nowrap group-hover/brand:text-gov-gold transition-colors duration-300">CHED IAS</h2>
                <span className="text-[9px] font-bold text-gov-gold/80 uppercase tracking-widest whitespace-nowrap mt-0.5 block">WFP Monitoring</span>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Close Navigation"
            >
              <X size={18} />
            </button>
          </div>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex absolute -right-3 top-20 bg-[#0B192C]/95 border border-slate-700 hover:border-gov-blue-accent/65 hover:bg-gov-blue text-slate-300 hover:text-white h-6 w-6 rounded-full items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-50 cursor-pointer animate-fade-in"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => {
                if (wfpData.length > 0 || budgetTransactions.length > 0) {
                  setActiveTab('dashboard');
                  setIsMobileSidebarOpen(false);
                }
              }}
              disabled={wfpData.length === 0 && budgetTransactions.length === 0}
              className={`flex items-center w-full py-3 text-xs font-semibold rounded-xl transition-all group relative overflow-hidden
                ${isSidebarCollapsed ? 'md:justify-center md:px-0 hover:scale-[1.03]' : 'px-4 gap-3 hover:pl-5'}
                ${activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-gov-blue to-gov-blue-accent/90 text-white shadow-[0_4px_12px_rgba(0,56,168,0.25)]'
                  : (wfpData.length === 0 && budgetTransactions.length === 0)
                    ? 'opacity-40 cursor-not-allowed text-slate-500'
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-100'
                }
              `}
            >
              {activeTab === 'dashboard' && (
                <span className="absolute left-1.5 top-3 bottom-3 w-1 bg-gov-gold rounded-full shadow-[0_0_8px_rgba(255,199,44,0.8)]" />
              )}
              <LayoutDashboard size={16} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:opacity-0 md:w-0 md:pointer-events-none' : 'opacity-100'} whitespace-nowrap`}>
                Dashboard Home
              </span>
              {/* Tooltip for collapsed mode */}
              {isSidebarCollapsed && (
                <div className="hidden md:block absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-[11px] font-bold rounded-lg opacity-0 pointer-events-none translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-xl z-50">
                  Dashboard Home
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45"></div>
                </div>
              )}
            </button>

            <button
              onClick={() => {
                if (wfpData.length > 0 || budgetTransactions.length > 0) {
                  setActiveTab('activities');
                  setIsMobileSidebarOpen(false);
                }
              }}
              disabled={wfpData.length === 0 && budgetTransactions.length === 0}
              className={`flex items-center w-full py-3 text-xs font-semibold rounded-xl transition-all group relative overflow-hidden
                ${isSidebarCollapsed ? 'md:justify-center md:px-0 hover:scale-[1.03]' : 'px-4 gap-3 hover:pl-5'}
                ${activeTab === 'activities'
                  ? 'bg-gradient-to-r from-gov-blue to-gov-blue-accent/90 text-white shadow-[0_4px_12px_rgba(0,56,168,0.25)]'
                  : (wfpData.length === 0 && budgetTransactions.length === 0)
                    ? 'opacity-40 cursor-not-allowed text-slate-500'
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-100'
                }
              `}
            >
              {activeTab === 'activities' && (
                <span className="absolute left-1.5 top-3 bottom-3 w-1 bg-gov-gold rounded-full shadow-[0_0_8px_rgba(255,199,44,0.8)]" />
              )}
              <Table2 size={16} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:opacity-0 md:w-0 md:pointer-events-none' : 'opacity-100'} whitespace-nowrap`}>
                Activities Checklist
              </span>
              {/* Tooltip for collapsed mode */}
              {isSidebarCollapsed && (
                <div className="hidden md:block absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-[11px] font-bold rounded-lg opacity-0 pointer-events-none translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-xl z-50">
                  Activities Checklist
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45"></div>
                </div>
              )}
            </button>

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => {
                  setActiveTab('uploader');
                  setIsMobileSidebarOpen(false);
                }}
                className={`flex items-center w-full py-3 text-xs font-semibold rounded-xl transition-all group relative overflow-hidden
                ${isSidebarCollapsed ? 'md:justify-center md:px-0 hover:scale-[1.03]' : 'px-4 gap-3 hover:pl-5'}
                ${activeTab === 'uploader'
                    ? 'bg-gradient-to-r from-gov-blue to-gov-blue-accent/90 text-white shadow-[0_4px_12px_rgba(0,56,168,0.25)]'
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-100'
                  }
              `}
              >
                {activeTab === 'uploader' && (
                  <span className="absolute left-1.5 top-3 bottom-3 w-1 bg-gov-gold rounded-full shadow-[0_0_8px_rgba(255,199,44,0.8)]" />
                )}
                <UploadCloud size={16} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:opacity-0 md:w-0 md:pointer-events-none' : 'opacity-100'} whitespace-nowrap`}>
                  Upload Excel Files
                </span>
                {/* Tooltip for collapsed mode */}
                {isSidebarCollapsed && (
                  <div className="hidden md:block absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-[11px] font-bold rounded-lg opacity-0 pointer-events-none translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-xl z-50">
                    Upload Excel Files
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45"></div>
                  </div>
                )}
              </button>
            )}

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => {
                  setActiveTab('users');
                  setIsMobileSidebarOpen(false);
                }}
                className={`flex items-center w-full py-3 text-xs font-semibold rounded-xl transition-all group relative overflow-hidden mt-6
                ${isSidebarCollapsed ? 'md:justify-center md:px-0 hover:scale-[1.03]' : 'px-4 gap-3 hover:pl-5'}
                ${activeTab === 'users'
                    ? 'bg-gradient-to-r from-gov-blue to-gov-blue-accent/90 text-white shadow-[0_4px_12px_rgba(0,56,168,0.25)]'
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-100'
                  }
              `}
              >
                {activeTab === 'users' && (
                  <span className="absolute left-1.5 top-3 bottom-3 w-1 bg-gov-gold rounded-full shadow-[0_0_8px_rgba(255,199,44,0.8)]" />
                )}
                <Users size={16} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:opacity-0 md:w-0 md:pointer-events-none' : 'opacity-100'} whitespace-nowrap`}>
                  User Management
                </span>
                {/* Tooltip for collapsed mode */}
                {isSidebarCollapsed && (
                  <div className="hidden md:block absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-[11px] font-bold rounded-lg opacity-0 pointer-events-none translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-xl z-50">
                    User Management
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45"></div>
                  </div>
                )}
              </button>
            )}

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => {
                  setActiveTab('audit');
                  setIsMobileSidebarOpen(false);
                }}
                className={`flex items-center w-full py-3 text-xs font-semibold rounded-xl transition-all group relative overflow-hidden mt-2
                ${isSidebarCollapsed ? 'md:justify-center md:px-0 hover:scale-[1.03]' : 'px-4 gap-3 hover:pl-5'}
                ${activeTab === 'audit'
                    ? 'bg-gradient-to-r from-gov-blue to-gov-blue-accent/90 text-white shadow-[0_4px_12px_rgba(0,56,168,0.25)]'
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-100'
                  }
              `}
              >
                {activeTab === 'audit' && (
                  <span className="absolute left-1.5 top-3 bottom-3 w-1 bg-gov-gold rounded-full shadow-[0_0_8px_rgba(255,199,44,0.8)]" />
                )}
                <Database size={16} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:opacity-0 md:w-0 md:pointer-events-none' : 'opacity-100'} whitespace-nowrap`}>
                  System Audit Logs
                </span>
                {isSidebarCollapsed && (
                  <div className="hidden md:block absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-[11px] font-bold rounded-lg opacity-0 pointer-events-none translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-xl z-50">
                    System Audit Logs
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45"></div>
                  </div>
                )}
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab('profile');
                setIsMobileSidebarOpen(false);
              }}
              className={`flex items-center w-full py-3 text-xs font-semibold rounded-xl transition-all group relative overflow-hidden
                ${isSidebarCollapsed ? 'md:justify-center md:px-0 hover:scale-[1.03]' : 'px-4 gap-3 hover:pl-5'}
                ${activeTab === 'profile'
                  ? 'bg-gradient-to-r from-gov-blue to-gov-blue-accent/90 text-white shadow-[0_4px_12px_rgba(0,56,168,0.25)]'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-100'
                }
              `}
            >
              {activeTab === 'profile' && (
                <span className="absolute left-1.5 top-3 bottom-3 w-1 bg-gov-gold rounded-full shadow-[0_0_8px_rgba(255,199,44,0.8)]" />
              )}
              <Users size={16} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:opacity-0 md:w-0 md:pointer-events-none' : 'opacity-100'} whitespace-nowrap`}>
                My Profile
              </span>
              {isSidebarCollapsed && (
                <div className="hidden md:block absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-[11px] font-bold rounded-lg opacity-0 pointer-events-none translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-xl z-50">
                  My Profile
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45"></div>
                </div>
              )}
            </button>
          </nav>
        </div>

        {/* Sidebar Status & Footer info */}
        <div className="p-4 border-t border-slate-800 bg-sidebar/20 flex flex-col items-center justify-center">
          {isSidebarCollapsed ? (
            <div className="flex flex-col gap-2">
              <div className="group relative cursor-pointer p-1.5 bg-slate-800/40 border border-slate-700/50 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center">
                <FileCheck size={16} className={wfpData.length > 0 ? "text-emerald-500 animate-pulse" : "text-slate-500"} />
                <div className="hidden md:block absolute bottom-2 left-full ml-3 px-3 py-2 bg-slate-900 border border-slate-700 text-white text-[11px] font-bold rounded-lg opacity-0 pointer-events-none translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-xl z-50">
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">WFP Status</p>
                  <p className="text-white font-semibold">{wfpFileName || "No file loaded"}</p>
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45"></div>
                </div>
              </div>
              <div className="group relative cursor-pointer p-1.5 bg-slate-800/40 border border-slate-700/50 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center">
                <Coins size={16} className={budgetSummary ? "text-gov-gold animate-pulse" : "text-slate-500"} />
                <div className="hidden md:block absolute bottom-2 left-full ml-3 px-3 py-2 bg-slate-900 border border-slate-700 text-white text-[11px] font-bold rounded-lg opacity-0 pointer-events-none translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-xl z-50">
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Budget Status</p>
                  <p className="text-white font-semibold">{budgetFileName || "No file loaded"}</p>
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-2.5 text-left">
              <div className="p-2.5 bg-slate-800/35 border border-slate-700/40 rounded-xl space-y-1 hover:bg-slate-800/50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">WFP Spreadsheet</p>
                  <span className={`h-1.5 w-1.5 rounded-full ${wfpData.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
                </div>
                <p className="text-[10px] text-white font-semibold truncate" title={wfpFileName || "No file loaded"}>
                  {wfpFileName || "No WFP active"}
                </p>
              </div>

              <div className="p-2.5 bg-slate-800/35 border border-slate-700/40 rounded-xl space-y-1 hover:bg-slate-800/50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Budget Utilization</p>
                  <span className={`h-1.5 w-1.5 rounded-full ${budgetSummary ? "bg-gov-gold animate-pulse" : "bg-slate-600"}`} />
                </div>
                <p className="text-[10px] text-white font-semibold truncate" title={budgetFileName || "No file loaded"}>
                  {budgetFileName || "No Budget active"}
                </p>
              </div>

              {wfpData.length === 0 && !budgetSummary && (
                <button
                  onClick={handleLoadAllDemo}
                  className="w-full py-1.5 bg-gov-blue/40 hover:bg-gov-blue/70 text-slate-200 hover:text-white rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer shadow-sm text-center"
                >
                  Load Both Demo Datasets
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full py-2 flex items-center justify-center gap-2 bg-red-900/30 hover:bg-red-900/60 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer border border-red-900/50"
              >
                <LogOut size={14} />
                {!isSidebarCollapsed && <span>Logout</span>}
              </button>

              <div className="text-[9px] text-slate-600 text-center pt-1">
                CHED International Affairs Service &copy; 2026
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT MAIN LAYOUT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto main-content relative app-bg transition-colors duration-300">
        {/* Print Only Header (Visible only during prints) */}
        <div className="print-header text-left">
          <h1 className="text-lg font-bold text-gov-blue">CHED International Affairs Service (IAS)</h1>
          <p className="text-sm font-semibold text-slate-600">Work and Financial Plan (WFP) HEDF 2026 Monitoring System</p>
          <div className="mt-2 text-xs text-slate-400 flex justify-between">
            <span>Report Source: {wfpFileName || budgetFileName || "Demo Data"}</span>
            <span>Printed Date: {new Date().toLocaleDateString('en-PH')}</span>
          </div>
        </div>

        {/* 4. STICKY TOP HEADER */}
        <header className="sticky top-0 header-bg border-b px-4 sm:px-6 py-4 flex items-center justify-between z-10 no-print transition-colors duration-300">
          <div className="flex items-center gap-2 sm:gap-3 text-left min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Open Navigation"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate max-w-[170px] sm:max-w-none">
                IAS - WFP HEDF 2026 Monitoring
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                {activeTab === 'dashboard' && `System Analytics: ${dashboardTab === 'wfp' ? 'WFP Monitoring' : 'Budget Utilization'}`}
                {activeTab === 'activities' && `Detailed Checklist: ${checklistTab === 'wfp' ? 'WFP Activities' : 'Budget Transaction Ledger'}`}
                {activeTab === 'uploader' && "Upload spreadsheets locally to generate WFP and Budget dashboards"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {wfpData.length > 0 && (
              <>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  title="Print Report"
                >
                  <Printer size={14} /> <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  onClick={downloadExcelTemplate}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-950 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  title="Download Sample Spreadsheet"
                >
                  <Download size={14} /> <span className="hidden sm:inline">Download Sample</span>
                </button>
              </>
            )}

            {/* Dark Mode Theme Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center justify-center p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={14} className="text-gov-gold animate-fade-in" /> : <Moon size={14} className="animate-fade-in" />}
            </button>

            <a
              href="https://ched.gov.ph"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-gov-blue dark:text-gov-blue-accent hover:underline pl-2 hidden md:inline-block"
            >
              CHED Portal &rarr;
            </a>
          </div>
        </header>

        {/* Page Container */}
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full flex-grow text-left min-w-0">

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (wfpData.length > 0 || budgetSummary) && (
            <div className="space-y-6 animate-fade-in">

              {/* Premium Sub-Tab Switcher */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 no-print">
                <button
                  disabled={wfpData.length === 0}
                  onClick={() => setDashboardTab('wfp')}
                  className={`px-5 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${wfpData.length === 0 ? 'opacity-30 cursor-not-allowed border-transparent text-slate-500' : ''} ${wfpData.length > 0 && dashboardTab === 'wfp' ? 'border-gov-blue text-gov-blue dark:border-gov-blue-accent dark:text-gov-blue-accent' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  WFP Monitoring Analytics
                </button>
                <button
                  disabled={!budgetSummary}
                  onClick={() => setDashboardTab('budget')}
                  className={`px-5 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${!budgetSummary ? 'opacity-30 cursor-not-allowed border-transparent text-slate-500' : ''} ${budgetSummary && dashboardTab === 'budget' ? 'border-gov-blue text-gov-blue dark:border-gov-blue-accent dark:text-gov-blue-accent' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  Budget Utilization Analytics
                </button>
              </div>

              {dashboardTab === 'wfp' && wfpData.length > 0 && (
                <div className="space-y-6 animate-fade-in">
                  {/* WFP Quick Quarter Filter */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm text-left flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
                    <div className="flex items-center gap-2">
                      <Filter size={16} className="text-gov-blue dark:text-gov-blue-accent" />
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                        Dashboard Filter
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <select
                        value={filters.quarter}
                        onChange={(e) => setFilters(prev => ({ ...prev, quarter: e.target.value }))}
                        className="px-4 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue outline-none w-full sm:w-auto cursor-pointer"
                      >
                        <option value="">All Quarters</option>
                        <option value="Q1">Q1 (January - March)</option>
                        <option value="Q2">Q2 (April - June)</option>
                        <option value="Q3">Q3 (July - September)</option>
                        <option value="Q4">Q4 (October - December)</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Filter Badges Notification */}
                  {(filters.quarter || filters.month || filters.activityTitle || filters.objectOfExpenditure || filters.search) && (
                    <div className="p-3.5 bg-gov-gold-light dark:bg-slate-900/50 border border-gov-gold/20 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 no-print">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-200">Active Filters Dashboard:</span>
                        {filters.search && <span className="bg-white dark:bg-slate-800 border dark:border-slate-700 px-2 py-0.5 rounded font-medium">Search: "{filters.search}"</span>}
                        {filters.quarter && (
                          <span className="bg-white dark:bg-slate-800 border dark:border-slate-700 px-2 py-0.5 rounded font-medium">
                            Quarter: {filters.quarter === 'Q1' ? 'Q1 (January - March)' :
                              filters.quarter === 'Q2' ? 'Q2 (April - June)' :
                                filters.quarter === 'Q3' ? 'Q3 (July - September)' :
                                  filters.quarter === 'Q4' ? 'Q4 (October - December)' :
                                    filters.quarter}
                          </span>
                        )}
                        {filters.month && <span className="bg-white dark:bg-slate-800 border dark:border-slate-700 px-2 py-0.5 rounded font-medium">Month: {filters.month}</span>}
                        {filters.activityTitle && <span className="bg-white dark:bg-slate-800 border dark:border-slate-700 px-2 py-0.5 rounded font-medium">Activity: {filters.activityTitle}</span>}
                        {filters.objectOfExpenditure && <span className="bg-white dark:bg-slate-800 border dark:border-slate-700 px-2 py-0.5 rounded font-medium">Expense Class: {filters.objectOfExpenditure}</span>}
                      </div>
                      <button
                        onClick={() => setFilters({ quarter: '', month: '', activityTitle: '', objectOfExpenditure: '', search: '' })}
                        className="font-bold text-gov-blue dark:text-gov-blue-accent hover:underline text-[11px]"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )}

                  {/* 1. KPI Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print-grid-cols-2">
                    <KpiCard
                      title="Total Budget"
                      value={formatCurrency(kpis.totalBudget)}
                      icon={Coins}
                      colorClass="blue"
                      tooltip="Sum of total budget for filtered activities"
                      subtext={`Filtered from ${formatCurrency(wfpData.reduce((s, i) => s + i.totalBudget, 0))} total`}
                    />
                    <KpiCard
                      title="Total Activities"
                      value={formatNumber(kpis.activityCount)}
                      icon={FileSpreadsheet}
                      colorClass="gold"
                      tooltip="Count of activities matching current filters"
                      subtext={`Filtered from ${wfpData.length} total rows`}
                    />
                    <KpiCard
                      title="Total Participants"
                      value={formatNumber(kpis.totalParticipants)}
                      icon={Users}
                      colorClass="slate"
                      tooltip="Total expected participants/target delegates"
                      subtext={`Filtered from ${formatNumber(wfpData.reduce((s, i) => s + i.participants, 0))} pax`}
                    />
                    <KpiCard
                      title="Highest Budget Activity"
                      value={formatCurrency(kpis.highestBudgetActivity.totalBudget)}
                      icon={TrendingUp}
                      colorClass="red"
                      tooltip="The line-item with the largest budget in the current view. Click to view details."
                      subtext={kpis.highestBudgetActivity.activity}
                      onClick={() => kpis.highestBudgetActivity.activity !== 'N/A' && setSelectedActivity(kpis.highestBudgetActivity)}
                    />
                  </div>

                  {/* 1. Charts Grid */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">Analytics & Summary Visualizations</h3>
                    <DashboardCharts data={filteredData} budgetData={budgetTransactions} isDarkMode={isDarkMode} />
                  </div>

                  {/* 1. Recent / Top Activities Quick Table */}
                  <div className="card-bg rounded-2xl shadow-sm card overflow-hidden text-left">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between no-print">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Top Activities by Budget</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Quick list of the highest-funded items in this category</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('activities')}
                        className="text-xs font-bold text-gov-blue dark:text-gov-blue-accent hover:underline"
                      >
                        View All Checklist &rarr;
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="table-header-bg text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                            <th className="px-5 py-3">Month</th>
                            <th className="px-5 py-3 hidden sm:table-cell">Project / Program</th>
                            <th className="px-5 py-3">Activity</th>
                            <th className="px-5 py-3 text-right hidden md:table-cell">Participants</th>
                            <th className="px-5 py-3 text-right">Total Budget</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y table-divide text-xs">
                          {topActivitiesForDashboard.map((row, index) => (
                            <tr
                              key={row._id || index}
                              className="table-row-hover cursor-pointer transition-all"
                              onClick={() => setSelectedActivity(row)}
                              title="Click to view details"
                            >
                              <td className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-350">{row.month}</td>
                              <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 truncate max-w-[150px] hidden sm:table-cell">{row.projectProgram}</td>
                              <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200 leading-normal max-w-sm truncate" title={row.activity}>
                                {row.activity}
                              </td>
                              <td className="px-5 py-3.5 text-right font-medium text-slate-650 dark:text-slate-350 hidden md:table-cell">{formatNumber(row.participants)}</td>
                              <td className="px-5 py-3.5 text-right font-bold text-gov-blue dark:text-gov-blue-accent">{formatCurrency(row.totalBudget)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {dashboardTab === 'budget' && budgetSummary && (
                <div className="animate-fade-in">
                  <UtilizationDashboard
                    summary={budgetSummary}
                    transactions={budgetTransactions}
                    regionalTransfers={regionalTransfers}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}

            </div>
          )}

          {/* TAB 2: ACTIVITIES CHECKLIST TABLE */}
          {activeTab === 'activities' && (wfpData.length > 0 || budgetTransactions.length > 0) && (
            <div className="space-y-6 animate-fade-in">

              {/* Premium Sub-Tab Switcher */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 no-print">
                <button
                  disabled={wfpData.length === 0}
                  onClick={() => setChecklistTab('wfp')}
                  className={`px-5 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${wfpData.length === 0 ? 'opacity-30 cursor-not-allowed border-transparent text-slate-500' : ''} ${wfpData.length > 0 && checklistTab === 'wfp' ? 'border-gov-blue text-gov-blue dark:border-gov-blue-accent dark:text-gov-blue-accent' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  WFP Activities Checklist
                </button>
                <button
                  disabled={budgetTransactions.length === 0}
                  onClick={() => setChecklistTab('budget')}
                  className={`px-5 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${budgetTransactions.length === 0 ? 'opacity-30 cursor-not-allowed border-transparent text-slate-500' : ''} ${budgetTransactions.length > 0 && checklistTab === 'budget' ? 'border-gov-blue text-gov-blue dark:border-gov-blue-accent dark:text-gov-blue-accent' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  Budget Transaction Ledger
                </button>
              </div>

              {checklistTab === 'wfp' && wfpData.length > 0 && (
                <div className="animate-fade-in space-y-4">
                  <div className="flex justify-end no-print">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        onClick={() => setIsTimelineView(false)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!isTimelineView ? 'bg-white dark:bg-slate-700 text-gov-blue dark:text-gov-blue-accent shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Table View
                      </button>
                      <button
                        onClick={() => setIsTimelineView(true)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${isTimelineView ? 'bg-white dark:bg-slate-700 text-gov-blue dark:text-gov-blue-accent shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Timeline Board
                      </button>
                    </div>
                  </div>

                  {isTimelineView ? (
                    <MonthlyTimeline 
                      activities={filteredData}
                      onEditActivity={openEditWfp}
                      isDarkMode={isDarkMode}
                    />
                  ) : (
                    <ActivityTable
                      data={filteredData}
                      originalDataLength={wfpData.length}
                      filters={filters}
                      setFilters={setFilters}
                      uniqueMonths={uniqueMonths}
                      uniqueActivities={uniqueActivities}
                      uniqueExpenses={uniqueExpenses}
                      onViewActivity={setSelectedActivity}
                      onEditActivity={openEditWfp}
                      onDeleteActivity={handleDeleteWfp}
                      onAddActivity={openAddWfp}
                      userRole={user?.role}
                    />
                  )}
                </div>
              )}

              {checklistTab === 'budget' && budgetTransactions.length > 0 && (
                <div className="animate-fade-in">
                  <TransactionLedger
                    transactions={budgetTransactions}
                    isDarkMode={isDarkMode}
                    onEditTransaction={openEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onAddTransaction={openAddTransaction}
                    userRole={user?.role}
                  />
                </div>
              )}

            </div>
          )}

          {/* TAB 3: FILE UPLOAD PAGE */}
          {activeTab === 'uploader' && (
            <div className="py-6 animate-fade-in">
              <div className="text-center space-y-3 mb-8">
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Upload Spreadsheet Documents</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                  Provide your local government Excel spreadsheets for WFP Monitoring or Budget Utilization.
                  All files are processed securely inside your browser.
                </p>
              </div>
              <ExcelUploader
                onWfpParsed={handleWfpParsed}
                onBudgetParsed={handleBudgetParsed}
                onLoadAllDemo={handleLoadAllDemo}
                wfpFileName={wfpFileName}
                budgetFileName={budgetFileName}
                wfpCount={wfpData.length}
                budgetCount={budgetTransactions.length}
                onSaveWfpToDb={handleSaveWfpToDb}
                onSaveBudgetToDb={handleSaveBudgetToDb}
              />
            </div>
          )}

          {/* TAB 4: USER MANAGEMENT PAGE */}
          {activeTab === 'users' && (
            <div className="py-6 animate-fade-in">
              <UserManagement
                users={usersData}
                onAddUser={openAddUser}
                onEditUser={openEditUser}
                onDeleteUser={handleDeleteUser}
              />
            </div>
          )}

          {/* TAB 5: AUDIT LOGS PAGE */}
          {activeTab === 'audit' && user?.role === 'ADMIN' && (
            <div className="py-6 animate-fade-in">
              <AuditLogs />
            </div>
          )}

          {/* TAB 6: PROFILE PAGE */}
          {activeTab === 'profile' && (
            <div className="py-6 animate-fade-in">
              <UserProfile user={user} setUser={setUser} />
            </div>
          )}
        </div>
      </main>

      {/* Global Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce max-w-sm text-left">
          <div className="h-5 w-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold select-none shrink-0">
            ✓
          </div>
          <p className="text-xs font-semibold leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Global Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-fade-in" onClick={() => setSelectedActivity(null)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col text-left animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gov-blue text-white flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-gov-gold bg-gov-blue-dark px-2.5 py-1 rounded shadow-sm">
                  {selectedActivity.projectProgram}
                </span>
                <h3 className="text-sm font-bold mt-2 text-white leading-snug">
                  Activity Detail View
                </h3>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] text-slate-800 dark:text-slate-100">
              {/* Activity Title */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Activity Name / Title</p>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">
                  {selectedActivity.activity}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Month */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gov-blue-light dark:bg-gov-blue/10 text-gov-blue dark:text-gov-blue-accent rounded-xl">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Timeline</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedActivity.month}</p>
                  </div>
                </div>

                {/* Expense Object */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gov-gold-light dark:bg-gov-gold/10 text-gov-gold-dark dark:text-gov-gold rounded-xl">
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Object of Expenditure</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={selectedActivity.objectOfExpenditure}>
                      {selectedActivity.objectOfExpenditure}
                    </p>
                  </div>
                </div>

                {/* Pax */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Participants (Pax)</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatNumber(selectedActivity.participants)} pax</p>
                  </div>
                </div>

                {/* Unit Cost */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Unit Rate / Cost</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatCurrency(selectedActivity.unitCost)}</p>
                  </div>
                </div>
              </div>

              {/* Total Budget Card */}
              <div className="p-4 bg-gov-blue-light/30 dark:bg-gov-blue/10 border border-gov-blue/15 dark:border-gov-blue/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gov-blue text-white rounded-xl shadow-sm">
                    <Coins size={22} className="stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Line Item Budget</p>
                    <p className="text-lg font-black text-gov-blue-dark dark:text-gov-blue-light">{formatCurrency(selectedActivity.totalBudget)}</p>
                  </div>
                </div>
              </div>

              {/* Description / Remarks */}
              <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Remarks / Details of Expenditure</p>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                  {selectedActivity.remarks || "No additional remarks or description available for this activity line item."}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      <EditWfpModal
        isOpen={isEditWfpOpen}
        activity={activityToEdit}
        onClose={() => setIsEditWfpOpen(false)}
        onSave={handleSaveWfpEdit}
      />

      <EditTransactionModal
        isOpen={isEditTransactionOpen}
        transaction={transactionToEdit}
        onClose={() => setIsEditTransactionOpen(false)}
        onSave={handleSaveTransactionEdit}
      />

      <UserModal
        isOpen={isUserModalOpen}
        user={userToEdit}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUserEdit}
      />
    </div>
  );
}

export default App;
