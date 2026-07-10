const express = require('express');
const router = express.Router();
const { admin } = require('../middleware/auth');
const WfpActivity = require('../models/WfpActivity');
const BudgetTransaction = require('../models/BudgetTransaction');
const BudgetSummary = require('../models/BudgetSummary');
const RegionalTransfer = require('../models/RegionalTransfer');
const { logAction } = require('../utils/logger');

// --- WFP ROUTES ---

// Get all WFP activities
router.get('/wfp', async (req, res) => {
  try {
    const data = await WfpActivity.find({});
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching WFP data' });
  }
});

// Bulk upload WFP activities
router.post('/wfp', admin, async (req, res) => {
  try {
    const activities = req.body;
    
    // For now, we clear the entire collection and replace it to mimic the "replace on upload" behavior.
    // In Phase 4, we can make this more robust (e.g. by year).
    await WfpActivity.deleteMany({});
    
    const result = await WfpActivity.insertMany(activities);
    console.log(`✅ SUCCESS: Saved ${result.length} WFP activities to the database.`);
    
    await logAction(req.user, 'BULK_UPLOAD', 'WFP_ACTIVITY', null, { count: result.length });
    
    res.status(201).json({ message: 'WFP Data saved successfully', count: result.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error saving WFP data' });
  }
});

// Update single WFP activity
router.put('/wfp/:id', admin, async (req, res) => {
  try {
    const updated = await WfpActivity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Activity not found' });
    
    await logAction(req.user, 'UPDATE', 'WFP_ACTIVITY', updated._id, { activityTitle: updated.activity });
    
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating WFP activity' });
  }
});

// Add single WFP activity
router.post('/wfp/single', admin, async (req, res) => {
  try {
    const newActivity = new WfpActivity(req.body);
    const saved = await newActivity.save();
    
    await logAction(req.user, 'CREATE', 'WFP_ACTIVITY', saved._id, { activityTitle: saved.activity });
    
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error adding WFP activity' });
  }
});

// Delete single WFP activity
router.delete('/wfp/:id', admin, async (req, res) => {
  try {
    const deleted = await WfpActivity.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Activity not found' });
    
    await logAction(req.user, 'DELETE', 'WFP_ACTIVITY', deleted._id, { activityTitle: deleted.activity });
    
    res.json({ message: 'Activity deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting WFP activity' });
  }
});

// --- BUDGET ROUTES ---

// Get all Budget data
router.get('/budget', async (req, res) => {
  try {
    const transactions = await BudgetTransaction.find({});
    const summaries = await BudgetSummary.find({});
    const regionalTransfers = await RegionalTransfer.find({});

    // We need to format summary back to the object structure expected by the frontend: 
    // { current: {}, continuing: {}, allCurrent: [], allContinuing: [] }
    const formattedSummary = {
      allCurrent: summaries.filter(s => s.type === 'CURRENT'),
      allContinuing: summaries.filter(s => s.type === 'CONTINUING')
    };
    
    res.json({
      transactions,
      summary: formattedSummary,
      regionalTransfers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching Budget data' });
  }
});

// Bulk upload Budget data
router.post('/budget', admin, async (req, res) => {
  try {
    const { summary, transactions, regionalTransfers } = req.body;

    // Clear old data
    await BudgetTransaction.deleteMany({});
    await BudgetSummary.deleteMany({});
    await RegionalTransfer.deleteMany({});

    // Prepare summary data (converting from the frontend nested object to flat array)
    const summaryDocs = [];
    if (summary) {
       if (summary.allCurrent) {
          summary.allCurrent.forEach(s => {
             summaryDocs.push({ ...s, type: 'CURRENT' });
          });
       }
       if (summary.allContinuing) {
          summary.allContinuing.forEach(s => {
             summaryDocs.push({ ...s, type: 'CONTINUING' });
          });
       }
    }

    // Insert new data
    if (transactions && transactions.length > 0) {
      await BudgetTransaction.insertMany(transactions);
    }
    if (summaryDocs.length > 0) {
      await BudgetSummary.insertMany(summaryDocs);
    }
    if (regionalTransfers && regionalTransfers.length > 0) {
      await RegionalTransfer.insertMany(regionalTransfers);
    }

    console.log(`✅ SUCCESS: Saved Budget Data to the database.`);
    if (transactions) console.log(`   - Transactions: ${transactions.length}`);
    if (summaryDocs.length > 0) console.log(`   - Summary Items: ${summaryDocs.length}`);
    if (regionalTransfers) console.log(`   - Regional Transfers: ${regionalTransfers.length}`);

    await logAction(req.user, 'BULK_UPLOAD', 'BUDGET_TRANSACTION', null, { 
      transactionCount: transactions ? transactions.length : 0 
    });

    res.status(201).json({ message: 'Budget Data saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error saving Budget data' });
  }
});

// Update single Budget Transaction
router.put('/budget/transactions/:id', admin, async (req, res) => {
  try {
    const updated = await BudgetTransaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Transaction not found' });
    
    await logAction(req.user, 'UPDATE', 'BUDGET_TRANSACTION', updated._id, { obligationNumber: updated.obligationNumber });
    
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating transaction' });
  }
});

// Add single Budget Transaction
router.post('/budget/transactions/single', admin, async (req, res) => {
  try {
    const newTransaction = new BudgetTransaction(req.body);
    const saved = await newTransaction.save();
    
    await logAction(req.user, 'CREATE', 'BUDGET_TRANSACTION', saved._id, { obligationNumber: saved.obligationNumber });
    
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error adding budget transaction' });
  }
});

// Delete single Budget Transaction
router.delete('/budget/transactions/:id', admin, async (req, res) => {
  try {
    const deleted = await BudgetTransaction.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Transaction not found' });
    
    await logAction(req.user, 'DELETE', 'BUDGET_TRANSACTION', deleted._id, { obligationNumber: deleted.obligationNumber });
    
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting transaction' });
  }
});

// --- AUDIT ROUTES ---
const AuditLog = require('../models/AuditLog');

router.get('/audit', admin, async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(200); // Last 200 logs
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching audit logs' });
  }
});

module.exports = router;
