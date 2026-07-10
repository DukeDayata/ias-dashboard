import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Mail, Shield, Calendar } from 'lucide-react';

export const UserManagement = ({ users, onAddUser, onEditUser, onDeleteUser }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3">
            <Users className="text-gov-blue dark:text-gov-blue-accent" size={28} />
            User Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage administrative and viewer accounts
          </p>
        </div>
        <button
          onClick={onAddUser}
          className="flex items-center gap-2 px-4 py-2 bg-gov-blue hover:bg-gov-blue-dark text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                    {user.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Mail size={14} />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      user.role === 'ADMIN' 
                        ? 'bg-gov-blue/10 text-gov-blue border border-gov-blue/20 dark:bg-gov-blue-accent/10 dark:text-gov-blue-accent' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}>
                      <Shield size={10} />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEditUser(user)}
                        className="p-1.5 text-slate-400 hover:text-gov-blue dark:hover:text-gov-blue-accent bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteUser(user._id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Users size={32} className="mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No users found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
