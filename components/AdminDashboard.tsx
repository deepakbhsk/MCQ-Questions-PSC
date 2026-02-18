
import React, { useState, useMemo, useCallback } from 'react';
import { Question, QuestionLevel } from '../types';
import Icon from './Icon';
import BulkGenerateForm from './BulkGenerateForm';

interface AdminDashboardProps {
  questions: Question[];
  onAddQuestion: (question: Omit<Question, 'id' | 'created_at'>) => void;
  onAddQuestions: (questions: Omit<Question, 'id' | 'created_at'>[]) => void;
  onUpdateQuestion: (question: Question) => void;
  onUpdateQuestions: (questions: Question[]) => void;
  onDeleteQuestion: (id: string) => void;
  onDeleteQuestions: (ids: string[]) => void;
  isWritePermissionError: boolean;
  isReplicaIdentityError: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  questions,
  onAddQuestion,
  onAddQuestions,
  onUpdateQuestion,
  onUpdateQuestions,
  onDeleteQuestion,
  onDeleteQuestions,
  isWritePermissionError,
  isReplicaIdentityError,
  activeTab,
  onTabChange
}) => {
  const stats = useMemo(() => ({
      totalQs: questions.length,
      totalPapers: new Set(questions.map(q => q.name)).size,
      activeUsers: 1204
  }), [questions]);

  const recentMetadata = [
      { code: 'PSC-2023-M-02', name: 'Municipal Secretary Gr. III', date: 'Oct 24, 2023', status: 'Processed' },
      { code: 'PSC-2023-U-05', name: 'University Assistant Main', date: 'Oct 22, 2023', status: 'Indexing' },
  ];

  const glassInputClass = "glass-input w-full px-4 py-3.5 rounded-xl text-sm placeholder:text-slate-600 focus:outline-none transition-all";
  const labelClass = "text-sm font-medium text-slate-300 ml-1 mb-2 block";

  if (activeTab === 'metadata') {
      return (
          <div className="flex flex-col gap-8 animate-fade-in">
              <div className="flex flex-col gap-2">
                  <h1 className="text-white text-3xl font-bold tracking-tight">Exam Metadata Configuration</h1>
                  <p className="text-slate-400 text-base">Manage and configure properties for new exam papers and question banks.</p>
              </div>

              {/* Stats HUD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500"></div>
                      <div className="flex items-center justify-between">
                          <div className="size-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                              <span className="material-symbols-outlined">library_books</span>
                          </div>
                          <span className="flex items-center text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md text-xs font-medium">
                              <span className="material-symbols-outlined text-sm mr-1">trending_up</span> +5.2%
                          </span>
                      </div>
                      <div>
                          <p className="text-slate-400 text-sm font-medium">Total Questions</p>
                          <p className="text-white text-3xl font-bold mt-1">{stats.totalQs.toLocaleString()}</p>
                      </div>
                  </div>
                  <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all duration-500"></div>
                      <div className="flex items-center justify-between">
                          <div className="size-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                              <span className="material-symbols-outlined">folder_open</span>
                          </div>
                          <span className="flex items-center text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md text-xs font-medium">
                              <span className="material-symbols-outlined text-sm mr-1">trending_up</span> +1.5%
                          </span>
                      </div>
                      <div>
                          <p className="text-slate-400 text-sm font-medium">Total Papers</p>
                          <p className="text-white text-3xl font-bold mt-1">{stats.totalPapers}</p>
                      </div>
                  </div>
                  <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl group-hover:bg-pink-500/30 transition-all duration-500"></div>
                      <div className="flex items-center justify-between">
                          <div className="size-12 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
                              <span className="material-symbols-outlined">group</span>
                          </div>
                          <span className="flex items-center text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md text-xs font-medium">
                              <span className="material-symbols-outlined text-sm mr-1">trending_up</span> +12%
                          </span>
                      </div>
                      <div>
                          <p className="text-slate-400 text-sm font-medium">Active Users</p>
                          <p className="text-white text-3xl font-bold mt-1">{stats.activeUsers.toLocaleString()}</p>
                      </div>
                  </div>
              </div>

              {/* Main Form Section */}
              <div className="glass-panel rounded-2xl p-8 border-t border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="flex flex-col gap-1">
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary">description</span>
                              Paper Details
                          </h3>
                          <p className="text-slate-400 text-sm">Fill in the details below to configure a new exam paper.</p>
                      </div>
                      <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-300">AI Analysis</span>
                          <button className="w-12 h-6 rounded-full bg-primary/20 border border-primary/30 relative flex items-center transition-colors hover:bg-primary/30 cursor-pointer">
                              <span className="size-4 bg-primary rounded-full absolute left-1 shadow-lg shadow-primary/50"></span>
                          </button>
                      </div>
                  </div>
                  <form className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
                      <div className="md:col-span-12 flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 flex flex-col gap-2">
                              <label className="text-sm font-medium text-slate-300 ml-1">Question Paper Code</label>
                              <div className="relative group">
                                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">qr_code_scanner</span>
                                  <input className={`${glassInputClass} pl-12`} placeholder="e.g. PSC-2023-A-01" type="text"/>
                              </div>
                          </div>
                          <button className="glass-button h-[50px] px-6 rounded-xl text-white font-medium text-sm flex items-center gap-2 whitespace-nowrap group transition-all" type="button">
                              <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">sync</span>
                              Fetch Existing Metadata
                          </button>
                      </div>
                      <div className="md:col-span-12 h-px bg-white/5 my-2"></div>
                      <div className="md:col-span-8 flex flex-col gap-2">
                          <label className="text-sm font-medium text-slate-300 ml-1">Exam Name</label>
                          <input className={glassInputClass} placeholder="e.g. Assistant Grade II Preliminary" type="text"/>
                      </div>
                      <div className="md:col-span-4 flex flex-col gap-2">
                          <label className="text-sm font-medium text-slate-300 ml-1">Level of Exam</label>
                          <div className="relative">
                              <select className={`${glassInputClass} appearance-none cursor-pointer text-slate-300`}>
                                  <option disabled selected value="">Select Level</option>
                                  {Object.values(QuestionLevel).map(l => <option key={l} className="text-black bg-white">{l}</option>)}
                              </select>
                              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">expand_more</span>
                          </div>
                      </div>
                      <div className="md:col-span-4 flex flex-col gap-2">
                          <label className="text-sm font-medium text-slate-300 ml-1">Year</label>
                          <div className="relative">
                              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">calendar_month</span>
                              <input className={`${glassInputClass} pl-12`} max="2100" min="2000" placeholder="2024" type="number"/>
                          </div>
                      </div>
                      <div className="md:col-span-4 flex flex-col gap-2">
                          <label className="text-sm font-medium text-slate-300 ml-1">Section / Phase</label>
                          <input className={glassInputClass} placeholder="e.g. Phase 1" type="text"/>
                      </div>
                      <div className="md:col-span-4 flex flex-col gap-2">
                          <label className="text-sm font-medium text-slate-300 ml-1">Difficulty Estimate</label>
                          <div className="relative">
                              <select className={`${glassInputClass} appearance-none cursor-pointer text-slate-300`}>
                                  <option className="text-black bg-white">Easy</option>
                                  <option className="text-black bg-white" selected>Moderate</option>
                                  <option className="text-black bg-white">Hard</option>
                              </select>
                              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">expand_more</span>
                          </div>
                      </div>
                      <div className="md:col-span-12 pt-4 flex justify-end gap-4">
                          <button className="px-6 py-3.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors" type="button">Reset Form</button>
                          <button className="glass-button px-8 py-3.5 rounded-xl text-white font-semibold text-sm shadow-[0_0_20px_rgba(19,91,236,0.3)] hover:shadow-[0_0_30px_rgba(19,91,236,0.5)] flex items-center gap-2" type="button">
                              <span className="material-symbols-outlined text-[20px]">save</span>
                              Save Metadata
                          </button>
                      </div>
                  </form>
              </div>

              {/* Recent Activity Table */}
              <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-white px-2">Recent Metadata Updates</h3>
                  <div className="glass-panel rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="border-b border-white/10 bg-white/5">
                                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Paper Code</th>
                                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {recentMetadata.map((m, i) => (
                                  <tr key={i} className="group hover:bg-white/5 transition-colors">
                                      <td className="p-4 text-sm text-white font-medium">{m.code}</td>
                                      <td className="p-4 text-sm text-slate-300">{m.name}</td>
                                      <td className="p-4 text-sm text-slate-400">{m.date}</td>
                                      <td className="p-4 text-right">
                                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border ${
                                              m.status === 'Processed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                          }`}>
                                              {m.status}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      );
  }

  if (activeTab === 'creator') {
      return (
          <BulkGenerateForm
            onCancel={() => onTabChange('dashboard')}
            onAddQuestions={onAddQuestions}
            existingQuestions={questions}
            initialLevel={null}
          />
      );
  }

  return (
    <div className="animate-fade-in pb-20">
        <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Admin Control Center</h2>
            <p className="text-slate-400 text-sm mt-1">Manage content, generate questions, and organize the library.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <button
                onClick={() => onTabChange('creator')}
                className="group relative p-6 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-lg hover:shadow-primary/40 transition-all duration-300 text-left overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[80px] text-white">auto_awesome</span>
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between min-h-[140px]">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white mb-4">
                        <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">AI Question Creator</h3>
                        <p className="text-blue-100 text-xs font-medium">Extract and categorize questions using AI.</p>
                    </div>
                </div>
            </button>
            <button
                onClick={() => onTabChange('metadata')}
                className="group relative p-6 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg hover:shadow-indigo-400/40 transition-all duration-300 text-left overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[80px] text-white">description</span>
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between min-h-[140px]">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white mb-4">
                        <span className="material-symbols-outlined text-2xl">description</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Metadata Management</h3>
                        <p className="text-indigo-100 text-xs font-medium">Configure paper codes, levels and subjects.</p>
                    </div>
                </div>
            </button>
        </div>

        <div className="glass-panel p-8 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-6">Database Management</h3>
            {/* Sync pause buttons, etc would go here */}
            {isReplicaIdentityError && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl mb-6">
                    <p className="font-bold text-sm">Sync Paused: Database Configuration Required</p>
                    <code className="block mt-2 bg-black/40 p-2 rounded text-xs select-all">ALTER TABLE questions REPLICA IDENTITY FULL;</code>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sync Status</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-white font-medium">Live Synchronized</p>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Records</p>
                    <p className="text-white font-medium">{stats.totalQs} Questions</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminDashboard;
