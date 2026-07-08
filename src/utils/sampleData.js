import * as XLSX from 'xlsx';

// Realistic CHED IAS WFP 2026 Sample Data
export const sampleWfpData = [
  {
    id: 1,
    month: "January",
    projectProgram: "Transnational Education (TNE) Development",
    activity: "Regional Orientation on TNE Policies and Guidelines",
    objectOfExpenditure: "Training and Seminar Expenses",
    participants: 80,
    unitCost: 2500,
    totalBudget: 200000,
    remarks: "Conduct in Luzon, Visayas, and Mindanao HEI representatives"
  },
  {
    id: 2,
    month: "January",
    projectProgram: "HEI Internationalization Support Program",
    activity: "Evaluation of HEI applications for Internationalization Grants",
    objectOfExpenditure: "Other Professional Services",
    participants: 10,
    unitCost: 5000,
    totalBudget: 50000,
    remarks: "Honoraria for external evaluators"
  },
  {
    id: 3,
    month: "February",
    projectProgram: "Bilateral & Multilateral Relations",
    activity: "Coordination Meeting with British Council and French Embassy",
    objectOfExpenditure: "Representation Expenses",
    participants: 15,
    unitCost: 1200,
    totalBudget: 18000,
    remarks: "Catering and venue hire"
  },
  {
    id: 4,
    month: "February",
    projectProgram: "IAS Capacity Development & Administration",
    activity: "Strategic Planning and Team Building Workshop",
    objectOfExpenditure: "Training and Seminar Expenses",
    participants: 35,
    unitCost: 8000,
    totalBudget: 280000,
    remarks: "Accommodation and training fees for staff"
  },
  {
    id: 5,
    month: "March",
    projectProgram: "ASEAN and SEAMEO Cooperation",
    activity: "Attendance to the 15th ASEAN Working Group on Higher Education",
    objectOfExpenditure: "Traveling Expenses - Foreign",
    participants: 3,
    unitCost: 150000,
    totalBudget: 450000,
    remarks: "Airfare, per diem, and registration for delegates"
  },
  {
    id: 6,
    month: "March",
    projectProgram: "HEI Internationalization Support Program",
    activity: "Capacity Building on Global Citizenship Education",
    objectOfExpenditure: "Training and Seminar Expenses",
    participants: 120,
    unitCost: 1500,
    totalBudget: 180000,
    remarks: "National workshop for Focal Persons"
  },
  {
    id: 7,
    month: "April",
    projectProgram: "Transnational Education (TNE) Development",
    activity: "Site Monitoring and Evaluation of Active TNE Partnerships",
    objectOfExpenditure: "Traveling Expenses - Local",
    participants: 5,
    unitCost: 25000,
    totalBudget: 125000,
    remarks: "Inspect 5 universities offering dual-degree programs"
  },
  {
    id: 8,
    month: "April",
    projectProgram: "Bilateral & Multilateral Relations",
    activity: "Hosting of Vietnamese Ministry of Education Delegation",
    objectOfExpenditure: "Representation Expenses",
    participants: 30,
    unitCost: 2000,
    totalBudget: 60000,
    remarks: "Official welcome dinner and gift tokens"
  },
  {
    id: 9,
    month: "May",
    projectProgram: "HEI Internationalization Support Program",
    activity: "National Conference on Higher Education Internationalization",
    objectOfExpenditure: "Training and Seminar Expenses",
    participants: 200,
    unitCost: 3000,
    totalBudget: 600000,
    remarks: "A major annual event for all internationalized HEIs"
  },
  {
    id: 10,
    month: "June",
    projectProgram: "IAS Capacity Development & Administration",
    activity: "Procurement of Specialized Language Translation Software Licenses",
    objectOfExpenditure: "Office Supplies Expenses",
    participants: 10,
    unitCost: 15000,
    totalBudget: 150000,
    remarks: "Annual subscription for IAS desks"
  },
  {
    id: 11,
    month: "July",
    projectProgram: "ASEAN and SEAMEO Cooperation",
    activity: "Participation in SEAMEO RIHED Governing Board Meeting",
    objectOfExpenditure: "Traveling Expenses - Foreign",
    participants: 2,
    unitCost: 180000,
    totalBudget: 360000,
    remarks: "CHED leadership and IAS Director representation"
  },
  {
    id: 12,
    month: "August",
    projectProgram: "Transnational Education (TNE) Development",
    activity: "Workshop on Joint and Double Degree Program Frameworks",
    objectOfExpenditure: "Training and Seminar Expenses",
    participants: 60,
    unitCost: 2000,
    totalBudget: 120000,
    remarks: "Formulating policy guidelines"
  },
  {
    id: 13,
    month: "September",
    projectProgram: "Bilateral & Multilateral Relations",
    activity: "Joint Working Group Meeting on UK-PH Higher Education Alliance",
    objectOfExpenditure: "Representation Expenses",
    participants: 20,
    unitCost: 1500,
    totalBudget: 30000,
    remarks: "Hosted in CHED Central Office"
  },
  {
    id: 14,
    month: "October",
    projectProgram: "HEI Internationalization Support Program",
    activity: "Publication of the 2026 Directory of Philippine Internationalized HEIs",
    objectOfExpenditure: "Printing and Publication Expenses",
    participants: 500,
    unitCost: 500,
    totalBudget: 250000,
    remarks: "Layout, printing, and distribution to global embassies"
  },
  {
    id: 15,
    month: "November",
    projectProgram: "ASEAN and SEAMEO Cooperation",
    activity: "ASEAN Youth Cultural Exchange and Leadership Camp",
    objectOfExpenditure: "Training and Seminar Expenses",
    participants: 50,
    unitCost: 6000,
    totalBudget: 300000,
    remarks: "IAS coordinating the PH youth delegation"
  },
  {
    id: 16,
    month: "December",
    projectProgram: "IAS Capacity Development & Administration",
    activity: "IAS Annual Performance Review and Accomplishment Assessment",
    objectOfExpenditure: "Rent Expenses",
    participants: 40,
    unitCost: 1200,
    totalBudget: 48000,
    remarks: "Venue rental for year-end assessment"
  }
];

/**
 * Generates and downloads a formatted Excel template based on the sample data.
 * Supports download in browser.
 */
export const downloadExcelTemplate = () => {
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

  // We can write sample data with some vertically merged-like layout (e.g. leaving some Month and Program cells blank)
  // to prove the robustness of the parser!
  const rows = [
    ["January", "Transnational Education (TNE) Development", "Regional Orientation on TNE Policies and Guidelines", "Training and Seminar Expenses", 80, 2500, 200000, "Conduct in Luzon, Visayas, and Mindanao HEI representatives"],
    ["", "", "Evaluation of HEI applications for Internationalization Grants", "Other Professional Services", 10, 5000, 50000, "Honoraria for external evaluators (vertical merge test: same Month & Program as above)"],
    ["February", "Bilateral & Multilateral Relations", "Coordination Meeting with British Council and French Embassy", "Representation Expenses", 15, 1200, 18000, "Catering and venue hire"],
    ["", "IAS Capacity Development & Administration", "Strategic Planning and Team Building Workshop", "Training and Seminar Expenses", 35, 8000, 280000, "Accommodation and training fees for staff"],
    ["March", "ASEAN and SEAMEO Cooperation", "Attendance to the 15th ASEAN Working Group on Higher Education", "Traveling Expenses - Foreign", 3, 150000, 450000, "Airfare, per diem, and registration for delegates"],
    ["", "HEI Internationalization Support Program", "Capacity Building on Global Citizenship Education", "Training and Seminar Expenses", 120, 1500, 180000, "National workshop for Focal Persons"],
    ["April", "Transnational Education (TNE) Development", "Site Monitoring and Evaluation of Active TNE Partnerships", "Traveling Expenses - Local", 5, 25000, 125000, "Inspect 5 universities offering dual-degree programs"],
    ["", "Bilateral & Multilateral Relations", "Hosting of Vietnamese Ministry of Education Delegation", "Representation Expenses", 30, 2000, 60000, "Official welcome dinner and gift tokens"],
    ["May", "HEI Internationalization Support Program", "National Conference on Higher Education Internationalization", "Training and Seminar Expenses", 200, 3000, 600000, "A major annual event for all internationalized HEIs"],
    ["June", "IAS Capacity Development & Administration", "Procurement of Specialized Language Translation Software Licenses", "Office Supplies Expenses", 10, 15000, 150000, "Annual subscription for IAS desks"],
    ["July", "ASEAN and SEAMEO Cooperation", "Participation in SEAMEO RIHED Governing Board Meeting", "Traveling Expenses - Foreign", 2, 180000, 360000, "CHED leadership and IAS Director representation"],
    ["August", "Transnational Education (TNE) Development", "Workshop on Joint and Double Degree Program Frameworks", "Training and Seminar Expenses", 60, 2000, 120000, "Formulating policy guidelines"],
    ["September", "Bilateral & Multilateral Relations", "Joint Working Group Meeting on UK-PH Higher Education Alliance", "Representation Expenses", 20, 1500, 30000, "Hosted in CHED Central Office"],
    ["October", "HEI Internationalization Support Program", "Publication of the 2026 Directory of Philippine Internationalized HEIs", "Printing and Publication Expenses", 500, 500, 250000, "Layout, printing, and distribution to global embassies"],
    ["November", "ASEAN and SEAMEO Cooperation", "ASEAN Youth Cultural Exchange and Leadership Camp", "Training and Seminar Expenses", 50, 6000, 300000, "IAS coordinating the PH youth delegation"],
    ["December", "IAS Capacity Development & Administration", "IAS Annual Performance Review and Accomplishment Assessment", "Rent Expenses", 40, 1200, 48000, "Venue rental for year-end assessment"]
  ];

  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Month
    { wch: 30 }, // Project / Program
    { wch: 50 }, // Activity
    { wch: 30 }, // Object of Expenditure
    { wch: 18 }, // No. of Participants
    { wch: 12 }, // Unit Cost
    { wch: 15 }, // Total Budget
    { wch: 45 }  // Remarks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Activity");
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = "CHED_IAS_WFP_2026_Sample.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
