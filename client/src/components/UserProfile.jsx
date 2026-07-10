import React, { useState, useEffect } from 'react';
import { Save, User as UserIcon, Lock, Mail, Shield } from 'lucide-react';
import { fetchProfile, updateProfile } from '../services/api';

export const UserProfile = ({ user, setUser }) => {
  const [formData, setFormData] = useState({ name: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await fetchProfile();
      setFormData(prev => ({ ...prev, name: profile.name }));
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const updateData = { name: formData.name };
      if (formData.password) {
        updateData.password = formData.password;
      }

      const updatedUser = await updateProfile(updateData);
      
      // Update global user state (so name changes instantly in navbar)
      if (setUser) {
        setUser({
          ...user,
          name: updatedUser.name
        });
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' })); // clear passwords
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gov-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gov-blue/10 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
              <UserIcon size={32} className="text-gov-blue dark:text-gov-blue-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user?.name || 'User Profile'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal settings</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'}`}>
              {message.text}
            </div>
          )}

          {/* Read Only Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Mail size={12}/> Email Address</label>
              <input type="email" disabled value={user?.email || ''} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Shield size={12}/> Account Role</label>
              <input type="text" disabled value={user?.role || ''} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" />
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Editable Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <UserIcon size={16} className="text-gov-blue" />
              Personal Details
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
              <input 
                type="text" 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue dark:text-white transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Lock size={16} className="text-gov-blue" />
              Security (Optional)
            </h3>
            <p className="text-xs text-slate-500">Leave password fields blank if you do not wish to change your password.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue dark:text-white transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue dark:text-white transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              type="submit" 
              disabled={saving} 
              className="px-6 py-2.5 bg-gov-blue hover:bg-gov-blue-dark text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default UserProfile;
