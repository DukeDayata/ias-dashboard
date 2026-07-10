import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export const EditTransactionModal = ({ isOpen, transaction, onClose, onSave }) => {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData(transaction);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['obligationAmount', 'disbursementAmount'].includes(name)) {
      setFormData({ ...formData, [name]: Number(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{transaction._id ? 'Edit' : 'Add'} Budget Transaction</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="edit-transaction-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Obligation Number</label>
                <input type="text" name="obligationNumber" value={formData.obligationNumber || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">P/A/P</label>
                <input required type="text" name="pap" value={formData.pap || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                <select required name="type" value={formData.type || 'CURRENT'} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white">
                  <option value="CURRENT">Current</option>
                  <option value="CONTINUING">Continuing</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Year</label>
                <input required type="text" name="year" value={formData.year || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Payee</label>
              <input type="text" name="payee" value={formData.payee || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Particulars</label>
              <textarea name="particulars" value={formData.particulars || ''} onChange={handleChange} rows="2" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white"></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Obligated Amount</label>
                <input type="number" name="obligationAmount" value={formData.obligationAmount || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Obligation Date</label>
                <input type="text" name="obligationDate" placeholder="e.g. Feb 9, 2026" value={formData.obligationDate || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Disbursed Amount</label>
                <input type="number" name="disbursementAmount" value={formData.disbursementAmount || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Disbursement Date</label>
                <input type="text" name="disbursementDate" placeholder="e.g. Feb 20, 2026" value={formData.disbursementDate || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white" />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
            Cancel
          </button>
          <button form="edit-transaction-form" type="submit" disabled={isSaving} className="px-5 py-2 bg-gov-blue hover:bg-gov-blue-dark text-white text-sm font-bold rounded-xl transition-colors shadow-lg flex items-center gap-2">
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTransactionModal;
