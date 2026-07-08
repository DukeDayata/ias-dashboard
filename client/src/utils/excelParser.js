import * as XLSX from 'xlsx';

/**
 * Helper to convert Excel serial dates to human-readable string formats (e.g. Feb 28, 2026)
 */
const excelDateToISO = (serial) => {
  if (!serial) return "";
  const num = parseInt(serial, 10);
  if (isNaN(num)) return serial.toString().trim();
  // Excel base date is 1899-12-30 (due to 1900 leap year bug)
  const date = new Date((num - 25569) * 86400 * 1000);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Synchronous parser for WFP activities from a loaded workbook
 */
const parseWfpWorkbook = (workbook, file) => {
  // 1. Refined Sheet Matching
  let targetSheetName = workbook.SheetNames[0];

  // Look for EXACT or near-exact match first
  const exactMatch = workbook.SheetNames.find(name => {
    const lower = name.toLowerCase().trim();
    return lower === 'activity' || lower === 'db_activity' || lower === 'wfp_activity';
  });

  if (exactMatch) {
    targetSheetName = exactMatch;
  } else {
    // Fallback search prioritizing activity sheets, then WFP sheets
    const prioritisedMatch = workbook.SheetNames.find(name => name.toLowerCase().includes('activity'))
      || workbook.SheetNames.find(name => name.toLowerCase().includes('wfp'))
      || workbook.SheetNames.find(name => name.toLowerCase().includes('work and financial'));

    if (prioritisedMatch) {
      targetSheetName = prioritisedMatch;
    }
  }

  const worksheet = workbook.Sheets[targetSheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

  if (rawRows.length === 0) {
    throw new Error("The selected worksheet is empty.");
  }

  // 2. Identify the Header Row by searching for keywords
  let headerRowIndex = -1;
  let colIndices = {
    month: -1,
    projectProgram: -1,
    activity: -1,
    objectOfExpenditure: -1,
    participants: -1,
    unitCost: -1,
    totalBudget: -1,
    remarks: -1
  };

  for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
    const row = rawRows[i];
    let matchCount = 0;

    row.forEach((cell, idx) => {
      const val = cell.toString().toLowerCase().trim();

      if (val.includes('remarks') || val.includes('description') || val.includes('notes') || val.includes('details of') || val.includes('specifics')) {
        colIndices.remarks = idx;
        matchCount++;
      }
      else if (val.includes('month') || val.includes('schedule') || val.includes('timeline') || val.includes('quarter') || val === 'date' || val.includes('date')) {
        colIndices.month = idx;
        matchCount++;
      }
      else if (val.includes('activity') || val.includes('title of act') || val.includes('name of act')) {
        colIndices.activity = idx;
        matchCount++;
      }
      else if (val.includes('project') || val.includes('program') || val.includes('sub-component') || val.includes('component') || val === 'mfo') {
        if (colIndices.projectProgram === -1 || val.includes('project') || val.includes('program')) {
          colIndices.projectProgram = idx;
        }
        matchCount++;
      }
      else if (val.includes('object') || val.includes('expenditure') || val.includes('expense class') || val.includes('uacs')) {
        colIndices.objectOfExpenditure = idx;
        matchCount++;
      }
      else if (val.includes('participant') || val.includes('pax') || val.includes('no. of p') || val.includes('number of p') || val === 'qty' || val === 'quantity') {
        colIndices.participants = idx;
        matchCount++;
      }
      else if (val.includes('unit cost') || val.includes('unit rate') || val.includes('cost per')) {
        colIndices.unitCost = idx;
        matchCount++;
      }
      else if (val.includes('total budget') || val.includes('total cost') || val.includes('amount') || val === 'budget' || val === 'total') {
        colIndices.totalBudget = idx;
        matchCount++;
      }
    });

    if (matchCount >= 3 && colIndices.activity !== -1) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    colIndices = {
      month: 0,
      projectProgram: 1,
      activity: 2,
      objectOfExpenditure: 3,
      participants: 4,
      unitCost: 5,
      totalBudget: 6,
      remarks: 7
    };
  }

  // 3. Extract Data Rows and fill vertical merges
  const records = [];
  let currentMonth = "";
  let currentProjectProgram = "";

  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const rawActivity = colIndices.activity !== -1 && row[colIndices.activity] !== undefined
      ? row[colIndices.activity].toString().trim()
      : "";

    if (!rawActivity) continue;
    const rawActivityUpper = rawActivity.toUpperCase();
    if (
      rawActivityUpper.includes("TOTAL") ||
      rawActivityUpper.includes("SUBTOTAL") ||
      rawActivityUpper.includes("SUB-TOTAL") ||
      rawActivityUpper.includes("GRAND TOTAL") ||
      rawActivityUpper === "TOTALS"
    ) {
      continue;
    }

    let month = "";
    if (colIndices.month !== -1 && row[colIndices.month] !== undefined) {
      month = row[colIndices.month].toString().trim();
    }
    if (month !== "") {
      currentMonth = month;
    } else {
      month = currentMonth;
    }

    let projectProgram = "";
    if (colIndices.projectProgram !== -1 && row[colIndices.projectProgram] !== undefined) {
      projectProgram = row[colIndices.projectProgram].toString().trim();
    }
    if (projectProgram !== "") {
      currentProjectProgram = projectProgram;
    } else {
      projectProgram = currentProjectProgram;
    }

    const objectOfExpenditure = colIndices.objectOfExpenditure !== -1 && row[colIndices.objectOfExpenditure] !== undefined
      ? row[colIndices.objectOfExpenditure].toString().trim()
      : "Other Operating Expenses";

    const remarks = colIndices.remarks !== -1 && row[colIndices.remarks] !== undefined
      ? row[colIndices.remarks].toString().trim()
      : "";

    const parseNumber = (val) => {
      if (val === undefined || val === null || val === "") return 0;
      const cleaned = val.toString().replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const participants = colIndices.participants !== -1 ? parseNumber(row[colIndices.participants]) : 0;
    const unitCost = colIndices.unitCost !== -1 ? parseNumber(row[colIndices.unitCost]) : 0;
    let totalBudget = colIndices.totalBudget !== -1 ? parseNumber(row[colIndices.totalBudget]) : 0;

    if (totalBudget === 0 && participants > 0 && unitCost > 0) {
      totalBudget = participants * unitCost;
    }

    records.push({
      id: i - headerRowIndex,
      month: month || "Unscheduled",
      projectProgram: projectProgram || "General Program",
      activity: rawActivity,
      objectOfExpenditure: objectOfExpenditure || "MOOE",
      participants: parseInt(participants) || 0,
      unitCost: parseFloat(unitCost) || 0,
      totalBudget: parseFloat(totalBudget) || 0,
      remarks: remarks
    });
  }

  if (records.length === 0) {
    throw new Error("Could not parse any valid WFP activity records from the sheet.");
  }

  return {
    type: 'wfp',
    data: records,
    fileName: file.name,
    sheetName: targetSheetName
  };
};

/**
 * Synchronous parser for Budget Utilization summary and transactions
 */
const parseBudgetWorkbook = (workbook, file) => {
  const parseSummarySheet = (sheet) => {
    if (!sheet) return [];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const summaries = [];
    
    // Find header row or start from Row 8
    let dataStartIdx = 9; // default
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const r = rows[i];
      if (r && r.some(c => String(c).includes('CENTRAL OFFICE') && r.some(c => String(c).includes('REGIONAL')))) {
        dataStartIdx = i + 1;
        break;
      }
    }
    
    for (let i = dataStartIdx; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 8) continue;
      const programName = String(r[0] || '').trim();
      const papCode = String(r[1] || '').trim();
      
      // Stop at total row
      if (programName.toUpperCase() === 'TOTAL' || papCode.toUpperCase() === 'TOTAL') {
        break;
      }
      
      if (papCode && programName) {
        summaries.push({
          program: programName,
          pap: papCode,
          allotment: {
            central: parseFloat(r[2]) || 0,
            regional: parseFloat(r[3]) || 0,
            total: parseFloat(r[4]) || 0
          },
          obligation: {
            central: parseFloat(r[5]) || 0,
            regional: parseFloat(r[6]) || 0,
            total: parseFloat(r[7]) || 0,
            percent: parseFloat(r[8]) || 0
          },
          disbursement: {
            central: parseFloat(r[9]) || 0,
            regional: parseFloat(r[10]) || 0,
            total: parseFloat(r[11]) || 0,
            percent: parseFloat(r[12]) || 0
          },
          unobligated: {
            central: parseFloat(r[13]) || 0,
            regional: parseFloat(r[14]) || 0,
            total: parseFloat(r[15]) || 0,
            percent: parseFloat(r[16]) || 0
          },
          unpaid: {
            central: parseFloat(r[17]) || 0,
            regional: parseFloat(r[18]) || 0,
            total: parseFloat(r[19]) || 0,
            percent: parseFloat(r[20]) || 0
          }
        });
      }
    }
    return summaries;
  };

  const parseYearSheet = (sheet, yearName) => {
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (rows.length === 0) return [];

    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const row = rows[i];
      const rowStr = row.map(c => String(c).toLowerCase()).join(' ');
      if (rowStr.includes('particulars') || rowStr.includes('payee')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      headerRowIndex = 0;
    }

    const header = rows[headerRowIndex].map(c => String(c).trim().toUpperCase());
    const hasObligationNumber = header.some(c => c.includes('OBLIGATION NUMBER') || c.includes('OB NUMBER'));

    const parseNumber = (val) => {
      if (val === undefined || val === null || val === "") return 0;
      const cleaned = val.toString().replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const yearTransactions = [];

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const isTotalRow = row.some(cell => {
        const s = String(cell).toUpperCase();
        return s === 'TOTAL' || s === 'TOTALS' || s === 'GRAND TOTAL' || s === 'SUB-TOTAL' || s === 'SUBTOTAL';
      });
      if (isTotalRow) continue;

      if (hasObligationNumber) {
        // 2024-2026 format
        const obNum = row[0] ? row[0].toString().trim() : '';
        const payee = row[2] ? row[2].toString().trim() : '';
        const pap = row[1] ? row[1].toString().trim() : 'BICPPHE';
        const particulars = row[3] ? row[3].toString().trim() : '';
        
        if (!obNum && !payee && !particulars) continue;

        const obDate = excelDateToISO(row[4]);
        const obAmount = parseNumber(row[5]);
        const disDate = excelDateToISO(row[6]);
        const disAmount = parseNumber(row[7]);
        
        const saaDate = excelDateToISO(row[8]);
        const saaAmount = parseNumber(row[9]);
        const ntaDate = excelDateToISO(row[10]);
        const ntaAmount = parseNumber(row[11]);
        
        const roObligationAmount = parseNumber(row[12]);
        const roDisbursementAmount = parseNumber(row[13]);
        
        let returnedToCo = 0;
        let type = '';

        if (yearName === '2024') {
          type = row[14] ? row[14].toString().trim().toUpperCase() : '';
        } else {
          returnedToCo = parseNumber(row[14]);
          type = row[15] ? row[15].toString().trim().toUpperCase() : '';
        }

        if (!type) {
          type = obNum.toUpperCase().includes('CONTINUING') ? 'CONTINUING' : 'CURRENT';
        }

        yearTransactions.push({
          id: `${yearName}-${i}`,
          year: yearName,
          obligationNumber: obNum,
          pap: pap,
          payee: payee,
          particulars: particulars,
          obligationDate: obDate,
          obligationAmount: obAmount,
          disbursementDate: disDate,
          disbursementAmount: disAmount,
          saaDate: saaDate,
          saaAmount: saaAmount,
          ntaDate: ntaDate,
          ntaAmount: ntaAmount,
          roObligationAmount: roObligationAmount,
          roDisbursementAmount: roDisbursementAmount,
          returnedToCo: returnedToCo,
          type: type === 'CONTINUING' ? 'CONTINUING' : 'CURRENT'
        });

      } else {
        // 2021-2023 format
        const dateVal = row[0] ? row[0].toString().trim() : '';
        const pap = row[1] ? row[1].toString().trim() : 'ICPPHE';
        const payee = row[2] ? row[2].toString().trim() : '';
        const particulars = row[3] ? row[3].toString().trim() : '';

        if (!dateVal && !payee && !particulars) continue;

        const obDate = excelDateToISO(row[0]);
        const obAmount = parseNumber(row[4]);
        const disDate = excelDateToISO(row[5]);
        const disAmount = parseNumber(row[6]);

        let ntaDate = '';
        let ntaNumber = '';
        let returnedNta = 0;
        if (yearName === '2023') {
          ntaDate = excelDateToISO(row[7]);
          ntaNumber = row[8] ? row[8].toString().trim() : '';
          returnedNta = parseNumber(row[9]);
        }

        yearTransactions.push({
          id: `${yearName}-${i}`,
          year: yearName,
          obligationNumber: `N/A (${yearName})`,
          pap: pap,
          payee: payee,
          particulars: particulars,
          obligationDate: obDate,
          obligationAmount: obAmount,
          disbursementDate: disDate,
          disbursementAmount: disAmount,
          ntaDate: ntaDate,
          ntaNumber: ntaNumber,
          returnedNta: returnedNta,
          type: 'CURRENT'
        });
      }
    }

    return yearTransactions;
  };

  const parseRoSheet = (sheet, year) => {
    if (!sheet) return [];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (rows.length === 0) return [];
    
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const r = rows[i];
      if (r && r.some(c => String(c).toUpperCase().includes('SAA NUMBER'))) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) headerRowIndex = 0;
    
    const parseNumber = (val) => {
      if (val === undefined || val === null || val === "") return 0;
      const cleaned = val.toString().replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };
    
    const transfers = [];
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;
      
      const saa = String(row[0]).trim();
      const isTotalRow = saa.toUpperCase() === 'TOTAL' || saa.toUpperCase() === 'TOTALS' || saa.toUpperCase() === 'GRAND TOTAL';
      if (isTotalRow) continue;
      
      let region = '';
      const parts = saa.split('-');
      if (parts[0] === 'CHEDRO' && parts[1]) {
        region = `CHEDRO-${parts[1]}`;
      } else if (saa.includes('CHEDRO')) {
        const match = saa.match(/(CHEDRO-[A-Z]+)/);
        if (match) region = match[1];
      }
      
      if (!region && row[13]) {
        region = String(row[13]).trim();
      }
      
      transfers.push({
        id: `${year}-ro-${i}`,
        year: year,
        saaNumber: saa,
        obligation: parseNumber(row[1]),
        disbursement: parseNumber(row[2]),
        pap: row[3] ? String(row[3]).trim() : '',
        date: excelDateToISO(row[4]),
        transferTo: region || 'Other Region',
        status: row[14] ? String(row[14]).trim() : (saa.toUpperCase().includes('CONTINUING') ? 'Continuing' : 'Current'),
        transferFrom: parseNumber(row[15])
      });
    }
    return transfers;
  };

  const currentSheet = workbook.Sheets['CURRENT'] || workbook.Sheets['current'];
  const continuingSheet = workbook.Sheets['CONTINUING'] || workbook.Sheets['continuing'];
  
  const currentSummaries = parseSummarySheet(currentSheet) || [];
  const continuingSummaries = parseSummarySheet(continuingSheet) || [];
  
  const yearSheets = workbook.SheetNames.filter(name => /^(20\d{2})$/.test(name.trim()));
  let transactions = [];
  for (const year of yearSheets) {
    const sheet = workbook.Sheets[year];
    const yearTx = parseYearSheet(sheet, year.trim());
    transactions = transactions.concat(yearTx);
  }
  
  const roSheets = workbook.SheetNames.filter(name => /^RO(20\d{2})$/i.test(name.trim()));
  let regionalTransfers = [];
  for (const roSheet of roSheets) {
    const sheet = workbook.Sheets[roSheet];
    const match = roSheet.match(/^RO(20\d{2})$/i);
    const year = match ? match[1] : '';
    const roTx = parseRoSheet(sheet, year);
    regionalTransfers = regionalTransfers.concat(roTx);
  }

  const defaultSummary = {
    program: 'Building Internationalization Competitiveness Program for Philippine Higher Education',
    pap: 'BICPPHE',
    allotment: { central: 0, regional: 0, total: 0 },
    obligation: { central: 0, regional: 0, total: 0, percent: 0 },
    disbursement: { central: 0, regional: 0, total: 0, percent: 0 },
    unobligated: { central: 0, regional: 0, total: 0, percent: 0 },
    unpaid: { central: 0, regional: 0, total: 0, percent: 0 }
  };

  return {
    type: 'budget',
    data: {
      summary: {
        current: currentSummaries.find(s => s.pap === 'BICPPHE') || currentSummaries[0] || defaultSummary,
        continuing: continuingSummaries.find(s => s.pap === 'BICPPHE') || continuingSummaries[0] || defaultSummary,
        allCurrent: currentSummaries,
        allContinuing: continuingSummaries
      },
      transactions: transactions,
      regionalTransfers: regionalTransfers
    },
    fileName: file.name,
    sheetName: `All Years (${yearSheets.join(', ')}), RO (${roSheets.join(', ')})`
  };
};

/**
 * Main wrapper function to parse an Excel file, auto-detecting its type (WFP vs Budget Utilization)
 * @param {ArrayBuffer} arrayBuffer 
 * @param {File} file 
 * @returns {Promise<{type: 'wfp'|'budget', data: any, fileName: string, sheetName: string}>}
 */
export const parseExcelFile = (arrayBuffer, file) => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetNames = workbook.SheetNames.map(n => n.toUpperCase().trim());
      const isBudget = sheetNames.includes('2026') || sheetNames.includes('CURRENT') || sheetNames.includes('CONTINUING') || sheetNames.includes('2025') || sheetNames.includes('2024');

      if (isBudget) {
        resolve(parseBudgetWorkbook(workbook, file));
      } else {
        resolve(parseWfpWorkbook(workbook, file));
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Legacy wrapper for backward compatibility
 */
export const parseWfpExcel = (arrayBuffer, file) => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      resolve(parseWfpWorkbook(workbook, file));
    } catch (error) {
      reject(error);
    }
  });
};
