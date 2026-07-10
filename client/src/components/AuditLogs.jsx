import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Database } from 'lucide-react';
import { fetchAuditLogs } from '../services/api';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const s = search.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(s) ||
      (log.collectionName || '').toLowerCase().includes(s) ||
      (log.username || '').toLowerCase().includes(s)
    );
  });

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'bg-green-500/10 text-green-500';
      case 'UPDATE': return 'bg-blue-500/10 text-blue-500';
      case 'DELETE': return 'bg-red-500/10 text-red-500';
      case 'BULK_UPLOAD': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-slate-500/10 text-slate-500';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Database className="text-gov-blue dark:text-gov-blue-accent" />
            System Audit Logs
          </h2>
          <p className="text-sm text-slate-500 mt-1">Track modifications to the database (Last 200 actions)</p>
        </div>
        <button onClick={loadLogs} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <RefreshCw size={16} className={`text-slate-600 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="card p-4 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by user, action, or collection..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-gov-blue outline-none transition-colors dark:text-white"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Collection</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredLogs.map(log => (
                <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {log.username}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {log.collectionName}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-slate-500">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
