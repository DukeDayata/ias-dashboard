const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const AuditLog = require('./models/AuditLog');
const WfpActivity = require('./models/WfpActivity');
const BudgetTransaction = require('./models/BudgetTransaction');
const BudgetSummary = require('./models/BudgetSummary');
const RegionalTransfer = require('./models/RegionalTransfer');

dotenv.config();

const seedData = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await AuditLog.deleteMany({});
    await WfpActivity.deleteMany({});
    await BudgetTransaction.deleteMany({});
    await BudgetSummary.deleteMany({});
    await RegionalTransfer.deleteMany({});

    console.log('Seeding Users...');
    const adminUser = new User({
      email: 'admin@example.com',
      password: 'password123',
      role: 'ADMIN',
      name: 'Admin User'
    });
    await adminUser.save();

    const viewerUser = new User({
      email: 'viewer@example.com',
      password: 'password123',
      role: 'VIEWER',
      name: 'Viewer User'
    });
    await viewerUser.save();

    console.log('Seeding WfpActivity...');
    const wfpActivities = [
      {
        month: 'January',
        projectProgram: 'Health Program',
        activity: 'Medical Mission',
        objectOfExpenditure: 'Supplies',
        participants: 100,
        unitCost: 50,
        totalBudget: 5000,
        remarks: 'Successful',
        year: '2026'
      },
      {
        month: 'February',
        projectProgram: 'Education Program',
        activity: 'Book Donation',
        objectOfExpenditure: 'Books',
        participants: 200,
        unitCost: 20,
        totalBudget: 4000,
        remarks: 'Ongoing',
        year: '2026'
      }
    ];
    await WfpActivity.insertMany(wfpActivities);

    console.log('Seeding BudgetTransaction...');
    const budgetTransactions = [
      {
        obligationNumber: 'OB-001',
        pap: 'PAP 1',
        payee: 'Supplier A',
        particulars: 'Office Supplies',
        obligationDate: '2026-01-15',
        obligationAmount: 10000,
        disbursementDate: '2026-01-20',
        disbursementAmount: 10000,
        type: 'CURRENT',
        year: '2026'
      },
      {
        obligationNumber: 'OB-002',
        pap: 'PAP 2',
        payee: 'Supplier B',
        particulars: 'IT Equipment',
        obligationDate: '2026-02-10',
        obligationAmount: 50000,
        disbursementDate: '',
        disbursementAmount: 0,
        type: 'CONTINUING',
        year: '2026'
      }
    ];
    await BudgetTransaction.insertMany(budgetTransactions);

    console.log('Seeding BudgetSummary...');
    const budgetSummaries = [
      {
        program: 'Program A',
        pap: 'PAP 1',
        type: 'CURRENT',
        allotment: {
          central: 50000,
          regional: 20000,
          total: 70000
        },
        year: '2026'
      },
      {
        program: 'Program B',
        pap: 'PAP 2',
        type: 'CONTINUING',
        allotment: {
          central: 100000,
          regional: 50000,
          total: 150000
        },
        year: '2026'
      }
    ];
    await BudgetSummary.insertMany(budgetSummaries);

    console.log('Seeding RegionalTransfer...');
    const regionalTransfers = [
      {
        id: 'RT-001',
        year: '2026',
        pap: 'PAP 1',
        saaNumber: 'SAA-2026-01',
        obligation: 20000,
        disbursement: 15000,
        date: '2026-03-01',
        transferTo: 'Region I',
        transferFrom: 0,
        status: 'Completed'
      }
    ];
    await RegionalTransfer.insertMany(regionalTransfers);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
