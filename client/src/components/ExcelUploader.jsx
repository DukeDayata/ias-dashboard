import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, Play, FileCheck } from 'lucide-react';
import { parseExcelFile } from '../utils/excelParser';
import { downloadExcelTemplate } from '../utils/sampleData';

export const ExcelUploader = ({ 
  onWfpParsed, 
  onBudgetParsed, 
  onLoadAllDemo,
  wfpFileName,
  budgetFileName,
  wfpCount,
  budgetCount,
  onSaveWfpToDb,
  onSaveBudgetToDb
}) => {
  const [loadingType, setLoadingType] = useState(null); // 'wfp' | 'budget' | null
  const [errors, setErrors] = useState({ wfp: null, budget: null });
  
  const wfpInputRef = useRef(null);
  const budgetInputRef = useRef(null);

  const processFile = async (file, uploadType) => {
    // Validate type
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls' && extension !== 'csv') {
      setErrors(prev => ({ 
        ...prev, 
        [uploadType]: "Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file." 
      }));
      return;
    }

    setLoadingType(uploadType);
    setErrors(prev => ({ ...prev, [uploadType]: null }));

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const buffer = e.target.result;
          const result = await parseExcelFile(buffer, file);
          setLoadingType(null);
          
          if (result.type === 'wfp') {
            if (uploadType !== 'wfp') {
              // User uploaded a WFP sheet into the budget slot
              throw new Error("This appears to be a Work & Financial Plan (WFP) sheet. Please upload it in the WFP section.");
            }
            onWfpParsed(result.data, file.name);
          } else if (result.type === 'budget') {
            if (uploadType !== 'budget') {
              // User uploaded a budget sheet into the WFP slot
              throw new Error("This appears to be a Budget Utilization sheet. Please upload it in the Budget Utilization section.");
            }
            onBudgetParsed(result.data.summary, result.data.transactions, file.name, result.data.regionalTransfers);
          }
        } catch (err) {
          setLoadingType(null);
          setErrors(prev => ({ 
            ...prev, 
            [uploadType]: err.message || "Failed to parse the Excel file. Please ensure it aligns with the expected columns." 
          }));
        }
      };
      
      reader.onerror = () => {
        setLoadingType(null);
        setErrors(prev => ({ ...prev, [uploadType]: "Error reading file." }));
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      setLoadingType(null);
      setErrors(prev => ({ ...prev, [uploadType]: "An unexpected error occurred during processing." }));
    }
  };

  const handleWfpDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], 'wfp');
    }
  };

  const handleBudgetDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], 'budget');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto uploader-section">
      {/* 1. Side-by-Side Upload Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* WFP Activity Spreadsheet */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white text-left flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gov-blue" />
            Work and Financial Plan (WFP)
          </h3>
          
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleWfpDrop}
            onClick={() => wfpInputRef.current.click()}
            className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 outline-none h-60 text-center
              ${loadingType === 'wfp' ? "pointer-events-none opacity-80" : ""}
              ${wfpFileName 
                ? "border-emerald-500/50 bg-emerald-500/[0.02] dark:bg-emerald-950/[0.02] hover:border-emerald-500 hover:bg-emerald-500/[0.04]" 
                : "border-slate-300 dark:border-slate-700 hover:border-gov-blue dark:hover:border-gov-blue-accent hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }
            `}
          >
            <input 
              ref={wfpInputRef}
              type="file"
              className="hidden"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => e.target.files[0] && processFile(e.target.files[0], 'wfp')}
              disabled={loadingType !== null}
            />

            <div className="flex flex-col items-center space-y-3">
              <div className={`p-3.5 rounded-full ${wfpFileName ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-555" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                {wfpFileName ? <FileCheck size={28} /> : <Upload size={28} className={loadingType === 'wfp' ? "animate-pulse" : ""} />}
              </div>
              
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-850 dark:text-white">
                  {loadingType === 'wfp' ? "Parsing WFP Sheet..." : wfpFileName ? "WFP Spreadsheet Active" : "Drag & Drop WFP Excel File"}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[220px] mx-auto leading-normal">
                  {wfpFileName ? `${wfpFileName} (${wfpCount} activities)` : "Supports standard timeline WFP sheets with activities, unit costs, and budgets."}
                </p>
              </div>
              
              {!wfpFileName && (
                <button type="button" className="px-3.5 py-1.5 text-[10px] font-bold text-white bg-gov-blue hover:bg-gov-blue-dark dark:bg-gov-blue-accent dark:hover:bg-gov-blue rounded-lg shadow-sm">
                  Choose WFP File
                </button>
              )}
              {wfpFileName && onSaveWfpToDb && (
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); onSaveWfpToDb(); }}
                  className="px-3.5 py-1.5 mt-2 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm w-full"
                >
                  Save WFP to Database
                </button>
              )}
            </div>
          </div>

          {errors.wfp && (
            <div className="flex items-start gap-2.5 p-3.5 bg-gov-red-light/60 dark:bg-slate-900 border border-gov-red/20 dark:border-gov-red/30 rounded-xl text-left">
              <AlertCircle className="text-gov-red shrink-0 mt-0.5" size={16} />
              <p className="text-[11px] text-gov-red leading-relaxed">{errors.wfp}</p>
            </div>
          )}
        </div>

        {/* Budget Utilization Spreadsheet */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white text-left flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gov-gold" />
            Budget Utilization
          </h3>
          
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleBudgetDrop}
            onClick={() => budgetInputRef.current.click()}
            className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 outline-none h-60 text-center
              ${loadingType === 'budget' ? "pointer-events-none opacity-80" : ""}
              ${budgetFileName 
                ? "border-emerald-500/50 bg-emerald-500/[0.02] dark:bg-emerald-950/[0.02] hover:border-emerald-500 hover:bg-emerald-500/[0.04]" 
                : "border-slate-300 dark:border-slate-700 hover:border-gov-gold hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }
            `}
          >
            <input 
              ref={budgetInputRef}
              type="file"
              className="hidden"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => e.target.files[0] && processFile(e.target.files[0], 'budget')}
              disabled={loadingType !== null}
            />

            <div className="flex flex-col items-center space-y-3">
              <div className={`p-3.5 rounded-full ${budgetFileName ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-555" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                {budgetFileName ? <FileCheck size={28} /> : <Upload size={28} className={loadingType === 'budget' ? "animate-pulse" : ""} />}
              </div>
              
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-850 dark:text-white">
                  {loadingType === 'budget' ? "Parsing Budget Sheet..." : budgetFileName ? "Budget Spreadsheet Active" : "Drag & Drop Budget Utilization File"}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[220px] mx-auto leading-normal">
                  {budgetFileName ? `${budgetFileName} (${budgetCount} transactions)` : "Requires sheets CURRENT, CONTINUING, and 2026 for obligations ledger."}
                </p>
              </div>
              
              {!budgetFileName && (
                <button type="button" className="px-3.5 py-1.5 text-[10px] font-bold text-white bg-gov-gold text-gov-sidebar hover:bg-gov-gold/90 dark:text-white dark:bg-gov-gold dark:hover:bg-gov-gold/90 rounded-lg shadow-sm">
                  Choose Budget File
                </button>
              )}
              {budgetFileName && onSaveBudgetToDb && (
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); onSaveBudgetToDb(); }}
                  className="px-3.5 py-1.5 mt-2 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm w-full"
                >
                  Save Budget to Database
                </button>
              )}
            </div>
          </div>

          {errors.budget && (
            <div className="flex items-start gap-2.5 p-3.5 bg-gov-red-light/60 dark:bg-slate-900 border border-gov-red/20 dark:border-gov-red/30 rounded-xl text-left">
              <AlertCircle className="text-gov-red shrink-0 mt-0.5" size={16} />
              <p className="text-[11px] text-gov-red leading-relaxed">{errors.budget}</p>
            </div>
          )}
        </div>

      </div>

      {/* 2. Combined Demo Loader & Template Action Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadExcelTemplate();
          }}
          className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-gov-blue dark:hover:border-gov-blue-accent hover:shadow-sm transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gov-blue-light dark:bg-gov-blue/10 text-gov-blue dark:text-gov-blue-accent rounded-lg group-hover:bg-gov-blue group-hover:text-white transition-all">
              <Download size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Download WFP Template File</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Get a pre-formatted WFP template to test imports</p>
            </div>
          </div>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onLoadAllDemo();
          }}
          className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-gov-gold hover:shadow-sm transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gov-gold-light dark:bg-gov-gold/10 text-gov-gold dark:text-gov-gold-dark rounded-lg group-hover:bg-gov-gold group-hover:text-gov-sidebar dark:group-hover:text-white transition-all">
              <Play size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Load Both Demo Datasets</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Instantly populate both WFP and Budget dashboards</p>
            </div>
          </div>
        </button>
      </div>

      {/* 3. Helper Info */}
      <div className="p-6 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left space-y-4">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <FileSpreadsheet size={15} className="text-gov-blue dark:text-gov-blue-accent" />
          Importing Excel Spreadsheets Info
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The dashboard allows you to import and analyze two separate systems side-by-side: WFP Activities and Budget Utilization (ledger/summary). Your uploaded files are parsed directly inside your browser. To persist data across sessions, click "Save to Database" after uploading.
        </p>
        <div className="bg-white dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[10.5px] text-slate-400 dark:text-slate-500 leading-normal">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Sheet Mapping Logic:</span> 
          <ul className="list-disc pl-4 mt-1.5 space-y-1">
            <li><b>WFP Sheet</b>: Automatically matches sheet names like <i>Activity</i>, <i>db_activity</i> or <i>WFP</i>. Vertically merged month cells are filled down.</li>
            <li><b>Budget Utilization Sheet</b>: Assumes standard DBM/IAS format with sheets <i>CURRENT</i> (current allotment release), <i>CONTINUING</i> (continuing allotment release), and <i>2026</i> (central office obligation transactions ledger).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploader;
