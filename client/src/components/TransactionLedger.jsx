import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Download, Printer, Search, RefreshCw, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';
import * as XLSX from 'xlsx';

export const TransactionLedger = ({ transactions, isDarkMode, onEditTransaction, onDeleteTransaction, onAddTransaction, userRole }) => {
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTx, setSelectedTx] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    startDate: '',
    endDate: '',
    pap: ''
  });

  // Removed uniqueMonths/uniqueYears as they are replaced by Date Range
  const handleResetFilters = () => {
    setFilters({ search: '', type: '', startDate: '', endDate: '', pap: '' });
    setCurrentPage(1);
  };

  // Unique PAPs
  const uniquePaps = useMemo(() => {
    const paps = new Set();
    transactions.forEach(t => {
      if (t.pap) paps.add(t.pap);
    });
    return [...paps].sort();
  }, [transactions]);

  // Apply filters
  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const matchType = !filters.type || t.type === filters.type;
      
      let matchDate = true;
      if ((filters.startDate || filters.endDate) && t.obligationDate) {
        const tDate = new Date(t.obligationDate);
        if (!isNaN(tDate)) {
          if (filters.startDate) {
            matchDate = matchDate && tDate >= new Date(filters.startDate);
          }
          if (filters.endDate) {
            // Include entire end date by adding 1 day or matching ignoring time
            const eDate = new Date(filters.endDate);
            eDate.setHours(23, 59, 59, 999);
            matchDate = matchDate && tDate <= eDate;
          }
        }
      }
      
      const matchPap = !filters.pap || t.pap === filters.pap;

      const normSearch = filters.search.toLowerCase().trim();
      const matchSearch = !filters.search ||
        (t.obligationNumber && t.obligationNumber.toLowerCase().includes(normSearch)) ||
        (t.payee && t.payee.toLowerCase().includes(normSearch)) ||
        (t.particulars && t.particulars.toLowerCase().includes(normSearch));

      return matchType && matchDate && matchPap && matchSearch;
    });
  }, [transactions, filters]);

  // Sorting
  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // Summaries
  const totalObligation = useMemo(() => filteredData.reduce((s, i) => s + i.obligationAmount, 0), [filteredData]);
  const totalDisbursement = useMemo(() => filteredData.reduce((s, i) => s + i.disbursementAmount, 0), [filteredData]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
  };



  const handleExportFiltered = () => {
    if (filteredData.length === 0) return;

    const headers = [
      "Obligation Number",
      "Fund Type",
      "Year",
      "P/A/P",
      "Payee",
      "Particulars",
      "Obligation Date",
      "Obligation Amount",
      "Disbursement Date",
      "Disbursement Amount"
    ];

    const rows = filteredData.map(t => [
      t.obligationNumber,
      t.type,
      t.year || '',
      t.pap || '',
      t.payee,
      t.particulars,
      t.obligationDate,
      t.obligationAmount,
      t.disbursementDate,
      t.disbursementAmount
    ]);

    rows.push([
      "TOTALS (Filtered)",
      `${filteredData.length} records`,
      "",
      "",
      "",
      "",
      "",
      totalObligation,
      "",
      totalDisbursement
    ]);

    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    worksheet['!cols'] = [
      { wch: 30 }, // Obligation
      { wch: 15 }, // Type
      { wch: 10 }, // Year
      { wch: 15 }, // PAP
      { wch: 30 }, // Payee
      { wch: 50 }, // Particulars
      { wch: 18 }, // Ob Date
      { wch: 18 }, // Ob Amt
      { wch: 18 }, // Dis Date
      { wch: 18 }  // Dis Amt
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger Transactions");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "IAS_Budget_Filtered_Ledger.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm text-left filter-bar no-print">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <Search size={16} className="text-gov-blue dark:text-gov-blue-accent" />
            Filter Budget Transactions
          </h4>
          <div className="flex items-center gap-4">
            {(filters.search || filters.type || filters.startDate || filters.endDate || filters.pap) && (
              <button onClick={handleResetFilters} className="flex items-center gap-1 text-[11px] font-bold text-gov-red dark:text-red-400 hover:underline">
                <RefreshCw size={10} /> Reset Filters
              </button>
            )}
            {userRole === 'ADMIN' && (
              <button
                onClick={onAddTransaction}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gov-blue hover:bg-gov-blue-dark text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <Plus size={14} /> Add Transaction
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {/* Keyword Search */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Search Ledger</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => { setFilters(prev => ({ ...prev, search: e.target.value })); setCurrentPage(1); }}
              placeholder="Search..."
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue dark:focus:border-gov-blue-accent focus:ring-1 focus:ring-gov-blue/20 outline-none transition-all"
            />
          </div>

          {/* Start Date */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => { setFilters(prev => ({ ...prev, startDate: e.target.value })); setCurrentPage(1); }}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue dark:focus:border-gov-blue-accent outline-none transition-all"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => { setFilters(prev => ({ ...prev, endDate: e.target.value })); setCurrentPage(1); }}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue dark:focus:border-gov-blue-accent outline-none transition-all"
            />
          </div>

          {/* PAP */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">P/A/P</label>
            <select
              value={filters.pap}
              onChange={(e) => { setFilters(prev => ({ ...prev, pap: e.target.value })); setCurrentPage(1); }}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue dark:focus:border-gov-blue-accent outline-none transition-all"
            >
              <option value="">All PAPs</option>
              {uniquePaps.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Fund Type */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fund Type</label>
            <select
              value={filters.type}
              onChange={(e) => { setFilters(prev => ({ ...prev, type: e.target.value })); setCurrentPage(1); }}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue dark:focus:border-gov-blue-accent outline-none transition-all"
            >
              <option value="">All Types</option>
              <option value="CURRENT">Current</option>
              <option value="CONTINUING">Continuing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm card overflow-hidden flex flex-col justify-between">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="text-left w-full sm:w-auto">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Transaction Ledger</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Showing {filteredData.length === transactions.length ? `all ${transactions.length}` : `${filteredData.length} of ${transactions.length}`} rows
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => window.print()}
              disabled={filteredData.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              <Printer size={14} /> <span className="hidden sm:inline">Print Ledger</span>
            </button>
            <button
              onClick={handleExportFiltered}
              disabled={filteredData.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gov-blue hover:bg-gov-blue-dark dark:bg-gov-blue-accent dark:hover:bg-gov-blue text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download size={14} /> <span className="hidden sm:inline">Export XLS</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('obligationNumber')}>
                  Obligation Number <SortIcon field="obligationNumber" />
                </th>
                <th className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('year')}>
                  Year <SortIcon field="year" />
                </th>
                <th className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('pap')}>
                  P/A/P <SortIcon field="pap" />
                </th>
                <th className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('type')}>
                  Type <SortIcon field="type" />
                </th>
                <th className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('payee')}>
                  Payee <SortIcon field="payee" />
                </th>
                <th className="px-4 py-3.5 hidden md:table-cell">Particulars</th>
                <th className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('obligationAmount')}>
                  Obligated Amt <SortIcon field="obligationAmount" />
                </th>
                <th className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('disbursementAmount')}>
                  Disbursed Amt <SortIcon field="disbursementAmount" />
                </th>
                <th className="px-4 py-3.5 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentRows.length > 0 ? (
                currentRows.map((tx, index) => (
                  <tr key={tx._id || tx.id || `tx-${index}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => setSelectedTx(tx)}>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 max-w-[150px] truncate" title={tx.obligationNumber}>{tx.obligationNumber}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">{tx.year || 'N/A'}</td>
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{tx.pap || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${tx.type === 'CURRENT' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                        {tx.type === 'CURRENT' ? 'Current' : 'Continuing'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 max-w-[150px] truncate" title={tx.payee}>{tx.payee}</td>
                    <td className="px-4 py-3 hidden md:table-cell max-w-sm truncate text-slate-450 dark:text-slate-500" title={tx.particulars}>{tx.particulars}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(tx.obligationAmount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gov-blue dark:text-gov-blue-accent">{formatCurrency(tx.disbursementAmount)}</td>
                    <td className="px-4 py-3 text-center no-print flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setSelectedTx(tx)} className="p-1.5 text-gov-blue dark:text-gov-blue-accent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg inline-flex items-center justify-center cursor-pointer">
                        <Eye size={16} />
                      </button>
                      {userRole === 'ADMIN' && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEditTransaction(tx); }}
                            className="p-1.5 text-slate-500 hover:text-gov-blue dark:hover:text-gov-blue-accent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Edit Transaction"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteTransaction(tx._id); }}
                            className="p-1.5 text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Delete Transaction"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No transactions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Summary Footer */}
            {filteredData.length > 0 && (
              <tfoot>
                <tr className="bg-gov-blue-light/30 dark:bg-slate-800/40 border-t border-gov-blue font-bold text-slate-800 dark:text-slate-100">
                  <td className="px-4 py-3.5">TOTALS</td>
                  <td className="px-4 py-3.5"></td>
                  <td className="px-4 py-3.5"></td>
                  <td className="px-4 py-3.5"></td>
                  <td className="px-4 py-3.5">({filteredData.length} items)</td>
                  <td className="px-4 py-3.5 hidden md:table-cell"></td>
                  <td className="px-4 py-3.5 text-right font-extrabold text-slate-700 dark:text-slate-300">{formatCurrency(totalObligation)}</td>
                  <td className="px-4 py-3.5 text-right font-extrabold text-gov-blue-dark dark:text-gov-blue-accent">{formatCurrency(totalDisbursement)}</td>
                  <td className="px-4 py-3.5 no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 no-print">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-750 rounded-md outline-none">
                {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v} rows</option>)}
              </select>
              <span>per page</span>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-50">
                Previous
              </button>
              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers().map((page, idx) => (
                  page === '...' ? <span key={`dots-${idx}`} className="px-1 text-slate-400">...</span> : (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`h-7 w-7 rounded-md font-bold ${currentPage === page ? "bg-gov-blue text-white shadow-sm" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                      {page}
                    </button>
                  )
                ))}
              </div>
              <span className="sm:hidden font-semibold px-2">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedTx(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col text-left animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gov-blue text-white flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-gov-gold bg-gov-blue-dark px-2.5 py-1 rounded shadow-sm">
                  {selectedTx.type === 'CURRENT' ? 'CURRENT FUND' : 'CONTINUING FUND'}
                </span>
                <h3 className="text-sm font-bold mt-2 text-white">Transaction Detail View</h3>
              </div>
              <button onClick={() => setSelectedTx(null)} className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Obligation Number</p>
                <p className="text-xs font-bold text-slate-850 dark:text-white mt-0.5">{selectedTx.obligationNumber}</p>
              </div>
              
              <div>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">P/A/P</p>
                <p className="text-xs font-bold text-slate-850 dark:text-white mt-0.5">{selectedTx.pap}</p>
              </div>

              <div>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Payee</p>
                <p className="text-xs font-bold text-slate-850 dark:text-white mt-0.5">{selectedTx.payee}</p>
              </div>

              <div>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Particulars</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 mt-1">{selectedTx.particulars || "No particulars description."}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Obligation Date</p>
                  <p className="text-xs font-bold mt-0.5">{selectedTx.obligationDate || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Obligated Amount</p>
                  <p className="text-xs font-bold mt-0.5 text-slate-800 dark:text-slate-100">{formatCurrency(selectedTx.obligationAmount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Disbursement Date</p>
                  <p className="text-xs font-bold mt-0.5">{selectedTx.disbursementDate || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Disbursed Amount</p>
                  <p className="text-xs font-extrabold mt-0.5 text-gov-blue dark:text-gov-blue-accent">{formatCurrency(selectedTx.disbursementAmount)}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => setSelectedTx(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionLedger;
