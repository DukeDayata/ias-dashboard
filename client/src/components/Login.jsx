import React, { useState } from 'react';
import { loginUser } from '../services/api';
import chedIasLogo from '../assets/ched-ias.png';

export const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await loginUser(email, password);
      localStorage.setItem('ias_user', JSON.stringify(data));
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-bg flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in">
        <div className="p-8 space-y-8">
          
          <div className="text-center space-y-4">
            <div className="h-16 w-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden p-1 border border-slate-200 dark:border-slate-700 ring-4 ring-gov-gold/10">
              <img src={chedIasLogo} alt="CHED IAS Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome Back</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to access the IAS Dashboard</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-gov-blue outline-none transition-all dark:text-white"
                placeholder="admin@ched.gov.ph"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-gov-blue outline-none transition-all dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 bg-gradient-to-r from-gov-blue to-gov-blue-accent hover:from-gov-blue-dark hover:to-gov-blue text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-gov-blue/20 flex justify-center items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            For access, please contact the system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
