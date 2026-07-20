import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Download, Printer, Search, RefreshCw, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { formatCurrency, formatNumber, getMonthQuarter } from '../utils/formatters';
import * as XLSX from 'xlsx';

export const ActivityTable = ({ data, originalDataLength, filters, setFilters, uniqueMonths, uniqueActivities, uniqueExpenses, onViewActivity, onEditActivity, onDeleteActivity, onAddActivity, userRole }) => {
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Windowed pagination numbers generator
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
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    return pages;
  };

  // Sorting logic
  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
    setCurrentPage(1); // reset to page 1
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle strings case-insensitive
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  // Calculate totals for currently filtered data
  const totalBudget = data.reduce((sum, item) => sum + item.totalBudget, 0);
  const totalParticipants = data.reduce((sum, item) => sum + item.participants, 0);

  // Sorting icon indicator
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
  };

  // Export current filtered rows back to Excel
  const handleExportFiltered = () => {
    if (data.length === 0) return;

    const headers = [
      "Month",
      "Project / Program",
      "Activity",
      "Object of Expenditure",
      "No. of Participants",
      "Unit Cost",
      "Total Budget",
      "Remarks / Description"
    ];

    const rows = data.map(item => [
      item.month,
      item.projectProgram,
      item.activity,
      item.objectOfExpenditure,
      item.participants,
      item.unitCost,
      item.totalBudget,
      item.remarks
    ]);

    // Add a Totals summary row at the bottom of the export!
    rows.push([
      "TOTALS (Filtered)",
      "",
      `${data.length} activities`,
      "",
      totalParticipants,
      "",
      totalBudget,
      "Generated from CHED IAS Dashboard"
    ]);

    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    worksheet['!cols'] = [
      { wch: 15 }, // Month
      { wch: 30 }, // Project
      { wch: 45 }, // Activity
      { wch: 30 }, // Object of Expenditure
      { wch: 18 }, // Pax
      { wch: 12 }, // Unit Cost
      { wch: 18 }, // Total Budget
      { wch: 40 }  // Remarks
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Activities");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "CHED_IAS_WFP_Filtered_Report.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setFilters({
      quarter: '',
      month: '',
      activityTitle: '',
      objectOfExpenditure: '',
      search: ''
    });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* 2. Interactive Filter Panel */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm card filter-bar no-print text-left">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <Search size={16} className="text-gov-blue dark:text-gov-blue-accent" />
            Filter Activities
          </h4>
          <div className="flex items-center gap-4">
            {(filters.quarter || filters.month || filters.activityTitle || filters.objectOfExpenditure || filters.search) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-gov-red dark:text-red-400 hover:underline"
              >
                <RefreshCw size={10} /> Reset Filters
              </button>
            )}
            {userRole === 'ADMIN' && (
              <button
                onClick={onAddActivity}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gov-blue hover:bg-gov-blue-dark text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <Plus size={14} /> Add Activity
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Keyword Search */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Search Activity Title</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => { setFilters(prev => ({ ...prev, search: e.target.value })); setCurrentPage(1); }}
              placeholder="Type keywords..."
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue dark:focus:border-gov-blue-accent focus:ring-1 focus:ring-gov-blue/20 outline-none transition-all"
            />
          </div>

          {/* Quarter Selector */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quarter</label>
            <select
              value={filters.quarter || ''}
              onChange={(e) => {
                const selectedQuarter = e.target.value;
                setFilters(prev => {
                  const newFilters = { ...prev, quarter: selectedQuarter };
                  // If the current selected month doesn't match the new quarter, reset it
                  if (selectedQuarter && prev.month && getMonthQuarter(prev.month) !== selectedQuarter) {
                    newFilters.month = '';
                  }
                  return newFilters;
                });
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue dark:focus:border-gov-blue-accent outline-none transition-all"
            >
              <option value="">All Quarters</option>
              <option value="Q1">Q1 (Jan - Mar)</option>
              <option value="Q2">Q2 (Apr - Jun)</option>
              <option value="Q3">Q3 (Jul - Sep)</option>
              <option value="Q4">Q4 (Oct - Dec)</option>
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Month</label>
            <select
              value={filters.month}
              onChange={(e) => { setFilters(prev => ({ ...prev, month: e.target.value })); setCurrentPage(1); }}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue dark:focus:border-gov-blue-accent outline-none transition-all"
            >
              <option value="">All Months</option>
              {uniqueMonths
                .filter(m => !filters.quarter || getMonthQuarter(m) === filters.quarter)
                .map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Activity Selector */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Activity</label>
            <select
              value={filters.activityTitle}
              onChange={(e) => { setFilters(prev => ({ ...prev, activityTitle: e.target.value })); setCurrentPage(1); }}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue dark:focus:border-gov-blue-accent outline-none transition-all max-w-[200px]"
            >
              <option value="">All Activities</option>
              {uniqueActivities.map(a => <option key={a} value={a} title={a}>{a.length > 30 ? a.substring(0, 30) + '...' : a}</option>)}
            </select>
          </div>

          {/* Expense Selector */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Object of Expenditure</label>
            <select
              value={filters.objectOfExpenditure}
              onChange={(e) => { setFilters(prev => ({ ...prev, objectOfExpenditure: e.target.value })); setCurrentPage(1); }}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:border-gov-blue dark:focus:border-gov-blue-accent outline-none transition-all font-sans"
            >
              <option value="">All Expense Objects</option>
              {uniqueExpenses.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm card overflow-hidden flex flex-col justify-between">
        {/* Header Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="text-left w-full sm:w-auto">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Activity Checklist</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Showing {data.length === originalDataLength ? `all ${originalDataLength}` : `${data.length} of ${originalDataLength}`} records
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              disabled={data.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              title="Print Report"
            >
              <Printer size={14} /> <span className="hidden sm:inline">Print Report</span>
            </button>
            
            <button
              onClick={handleExportFiltered}
              disabled={data.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gov-blue hover:bg-gov-blue-dark dark:bg-gov-blue-accent dark:hover:bg-gov-blue text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              title="Export Filtered Checklist to Excel"
            >
              <Download size={14} /> <span className="hidden sm:inline">Export XLS</span>
            </button>
          </div>
        </div>

        {/* The Scrollable Table Container */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('month')}>
                  Month <SortIcon field="month" />
                </th>
                <th className="hidden lg:table-cell px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('projectProgram')}>
                  Project / Program <SortIcon field="projectProgram" />
                </th>
                <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('activity')}>
                  Activity Title <SortIcon field="activity" />
                </th>
                <th className="hidden md:table-cell px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('objectOfExpenditure')}>
                  Expense Object <SortIcon field="objectOfExpenditure" />
                </th>
                <th className="hidden sm:table-cell px-5 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('participants')}>
                  Pax <SortIcon field="participants" />
                </th>
                <th className="hidden sm:table-cell px-5 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('unitCost')}>
                  Unit Cost <SortIcon field="unitCost" />
                </th>
                <th className="px-5 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('totalBudget')}>
                  Budget <SortIcon field="totalBudget" />
                </th>
                <th className="hidden xl:table-cell px-5 py-3.5 text-slate-500 dark:text-slate-400">Remarks / Description</th>
                <th className="px-5 py-3.5 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {currentRows.length > 0 ? (
                currentRows.map((row, index) => (
                  <tr 
                    key={row._id || row.id || `activity-${index}`} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    onClick={() => onViewActivity(row)}
                  >
                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.month}</td>
                    <td className="hidden lg:table-cell px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap max-w-[150px] truncate" title={row.projectProgram}>
                      {row.projectProgram}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200 leading-normal max-w-sm" title={row.activity}>
                      {row.activity}
                    </td>
                    <td className="hidden md:table-cell px-5 py-4 text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={row.objectOfExpenditure}>
                      {row.objectOfExpenditure}
                    </td>
                    <td className="hidden sm:table-cell px-5 py-4 text-right font-medium text-slate-650 dark:text-slate-350 whitespace-nowrap">{formatNumber(row.participants)}</td>
                    <td className="hidden sm:table-cell px-5 py-4 text-right text-slate-600 dark:text-slate-350 whitespace-nowrap">{formatCurrency(row.unitCost)}</td>
                    <td className="px-5 py-4 text-right font-bold text-gov-blue dark:text-gov-blue-accent whitespace-nowrap">{formatCurrency(row.totalBudget)}</td>
                    <td className="hidden xl:table-cell px-5 py-4 text-slate-400 dark:text-slate-500 italic max-w-[200px] truncate" title={row.remarks}>
                      {row.remarks || "No description"}
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap no-print flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => onViewActivity(row)}
                        className="p-1.5 text-gov-blue dark:text-gov-blue-accent hover:text-gov-blue-dark dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                        title="View Full Details"
                      >
                        <Eye size={16} />
                      </button>
                      {userRole === 'ADMIN' && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEditActivity(row); }}
                            className="p-1.5 text-slate-500 hover:text-gov-blue dark:hover:text-gov-blue-accent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Edit Activity"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteActivity(row._id); }}
                            className="p-1.5 text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Delete Activity"
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
                  <td colSpan="9" className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No matching activities found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Totals Summary Footer */}
            {data.length > 0 && (
              <tfoot>
                <tr className="bg-gov-blue-light/30 dark:bg-slate-800/40 border-t-2 border-gov-blue dark:border-gov-blue-accent font-bold text-slate-800 dark:text-slate-100 text-xs">
                  <td className="px-5 py-4 text-left">TOTALS</td>
                  <td className="hidden lg:table-cell px-5 py-4"></td>
                  <td className="px-5 py-4">({data.length === originalDataLength ? "All Data" : "Filtered View"})</td>
                  <td className="hidden md:table-cell px-5 py-4"></td>
                  <td className="hidden sm:table-cell px-5 py-4 text-right text-slate-700 dark:text-slate-300 font-extrabold">{formatNumber(totalParticipants)}</td>
                  <td className="hidden sm:table-cell px-5 py-4 text-right text-slate-400 dark:text-slate-500 font-normal">-</td>
                  <td className="px-5 py-4 text-right text-gov-blue-dark dark:text-gov-blue-accent font-extrabold">{formatCurrency(totalBudget)}</td>
                  <td className="hidden xl:table-cell px-5 py-4"></td>
                  <td className="px-5 py-4 no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 no-print">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md outline-none"
              >
                {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v} rows</option>)}
              </select>
              <span>per page</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {/* Desktop visibility of windowed page buttons */}
                <div className="hidden md:flex items-center gap-1">
                  {getPageNumbers().map((page, idx) => (
                    page === '...' ? (
                      <span key={`dots-${idx}`} className="px-1.5 text-slate-400 dark:text-slate-500">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-7 w-7 rounded-md font-bold transition-all cursor-pointer ${currentPage === page ? "bg-gov-blue dark:bg-gov-blue-accent text-white shadow-sm" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>
                {/* Mobile visibility of simple page indicator */}
                <span className="md:hidden font-semibold px-2">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTable;
