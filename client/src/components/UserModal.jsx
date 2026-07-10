import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export const UserModal = ({ isOpen, user, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'VIEWER', password: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user._id) {
      setFormData({ name: user.name, email: user.email, role: user.role, password: '' });
    } else {
      setFormData({ name: '', email: '', role: 'VIEWER', password: '' });
    }
    setError('');
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await onSave({ ...formData, _id: user?._id });
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save user');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{user?._id ? 'Edit' : 'Add'} User</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold text-center">
              {error}
            </div>
          )}
          
          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
              <select required name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white">
                <option value="VIEWER">Viewer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">
                {user?._id ? 'New Password (Optional)' : 'Password'}
              </label>
              <input 
                required={!user?._id} 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder={user?._id ? 'Leave blank to keep current password' : 'Enter password'}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-gov-blue dark:text-white placeholder-slate-400" 
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
            Cancel
          </button>
          <button form="user-form" type="submit" disabled={isSaving} className="px-5 py-2 bg-gov-blue hover:bg-gov-blue-dark text-white text-sm font-bold rounded-xl transition-colors shadow-lg flex items-center gap-2">
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
