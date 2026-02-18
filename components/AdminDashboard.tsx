
import React, { useState, useMemo, useCallback } from 'react';
import { Question, QuestionLevel, SUBTOPIC_SUGGESTIONS } from '../types';
import QuestionForm from './QuestionForm';
import QuestionList from './QuestionList';
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
}

type TabView = 'exams' | 'topics';

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
}) => {
  const [activeTab, setActiveTab] = useState<TabView>('exams');
  const [editingQuestion, setEditingQuestion] = useState<Question | Omit<Question, 'id' | 'created_at'> | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isBulkFormVisible, setIsBulkFormVisible] = useState(false);
  
  // To pre-fill Bulk Form for Topics
  const [initialBulkLevel, setInitialBulkLevel] = useState<QuestionLevel | null>(null);

  // State for Batch Edit Modal
  const [editingSet, setEditingSet] = useState<{ prefix: string, questions: Question[] } | null>(null);
  const [batchEditData, setBatchEditData] = useState({ level: QuestionLevel.DEGREE, name: '', prefix: '' });

  // Filter questions based on active tab
  const filteredQuestions = useMemo(() => {
      if (activeTab === 'topics') {
          return questions.filter(q => q.level === QuestionLevel.TOPIC);
      }
      return questions.filter(q => q.level !== QuestionLevel.TOPIC);
  }, [questions, activeTab]);

  // Compute Stats based on FILTERED questions
  const stats = useMemo(() => {
      const totalQs = filteredQuestions.length;
      const exams = new Set(filteredQuestions.map(q => q.name).filter(Boolean)).size;
      const sets = new Set(filteredQuestions.map(q => {
          return q.code ? (q.code.split('-').slice(0, -1).join('-') || q.code.split('-')[0]) : 'Uncategorized';
      })).size;
      return { totalQs, exams, sets };
  }, [filteredQuestions]);

  const handleEdit = useCallback((question: Question) => {
    setEditingQuestion(question);
    setIsBulkFormVisible(false);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleFormSubmit = (question: Omit<Question, 'id' | 'created_at'> | Question) => {
      if('id' in question && question.id) {
          onUpdateQuestion(question as Question);
      } else {
          onAddQuestion(question as Omit<Question, 'id' | 'created_at'>);
      }
      setIsFormVisible(false);
      setEditingQuestion(null);
  }

  const handleCancel = () => {
    setEditingQuestion(null);
    setIsFormVisible(false);
    setIsBulkFormVisible(false);
    setInitialBulkLevel(null);
  };
  
  const handleBulkGenerate = () => {
      setEditingQuestion(null);
      setInitialBulkLevel(null);
      setIsFormVisible(false);
      setIsBulkFormVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleTopicBulkGenerate = () => {
      setEditingQuestion(null);
      setInitialBulkLevel(QuestionLevel.TOPIC);
      setIsFormVisible(false);
      setIsBulkFormVisible(true);
      setActiveTab('topics'); // Switch to Topic view automatically
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  const handleManualAdd = () => {
      setEditingQuestion(null);
      setIsBulkFormVisible(false);
      setIsFormVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleAddTopicQuestion = () => {
      setEditingQuestion({
          level: QuestionLevel.TOPIC,
          code: '',
          name: '',
          subtopic: '',
          question: '',
          options: ['', '', '', ''],
          correct_answer_index: 0,
          explanation: ''
      });
      setIsBulkFormVisible(false);
      setIsFormVisible(true);
      setActiveTab('topics');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  const handleBulkAdd = (newQuestions: Omit<Question, 'id' | 'created_at'>[]) => {
      onAddQuestions(newQuestions);
      setIsBulkFormVisible(false);
      setInitialBulkLevel(null);
  }

  const handleEditSet = useCallback((prefix: string, setQuestions: Question[]) => {
      if (setQuestions.length === 0) return;
      const first = setQuestions[0];
      setBatchEditData({
          level: first.level,
          name: first.name || '',
          prefix: prefix
      });
      setEditingSet({ prefix, questions: setQuestions });
  }, []);

  const handleSaveSet = () => {
      if (!editingSet) return;
      
      const updatedQuestions = editingSet.questions.map(q => {
          // Determine new code
          let newCode = q.code;
          if (q.code && editingSet.prefix && batchEditData.prefix && editingSet.prefix !== batchEditData.prefix) {
              // Replace the old prefix with the new one, keeping the number
              newCode = q.code.replace(editingSet.prefix, batchEditData.prefix);
          }

          return {
            ...q,
            level: batchEditData.level,
            name: batchEditData.name,
            code: newCode
            // Subtopic is preserved from the original question, not updated via batch edit
          };
      });
      
      onUpdateQuestions(updatedQuestions);
      setEditingSet(null);
  };

  const inputClass = "mt-1 block w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white outline-none placeholder-slate-400";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1";

  return (
    <div className="animate-fade-in pb-20">
       {/* Error Banners */}
       {isReplicaIdentityError && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-200 p-4 sm:p-5 rounded-2xl mb-6 flex gap-3 sm:gap-4 items-start shadow-sm">
            <div className="bg-amber-100 dark:bg-amber-800/40 p-2 rounded-lg flex-shrink-0">
               <Icon name="xCircle" className="w-5 h-5 text-amber-600 dark:text-amber-400"/>
            </div>
            <div className="flex-1">
                <p className="font-bold text-sm">Sync Paused: Database Configuration Required</p>
                <div className="mt-3 mb-3 bg-white dark:bg-amber-950/50 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 font-mono text-xs select-all text-slate-700 dark:text-amber-100 overflow-x-auto shadow-inner">
                    ALTER TABLE questions REPLICA IDENTITY FULL;
                </div>
                <a 
                  href={`https://supabase.com/dashboard/project/lqibglpbquybvsrywyhm/sql/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-amber-300 dark:border-amber-700 text-xs font-bold rounded-lg text-amber-800 dark:text-amber-100 bg-white dark:bg-amber-900/40 hover:bg-amber-50 transition-colors shadow-sm"
                >
                  Open Supabase SQL Editor
                  <Icon name="externalLink" className="ml-1.5 w-3 h-3" />
                </a>
            </div>
        </div>
      )}
      {isWritePermissionError && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50 text-rose-800 dark:text-rose-200 p-4 sm:p-5 rounded-2xl mb-6 flex gap-3 sm:gap-4 items-start shadow-sm">
            <div className="bg-rose-100 dark:bg-rose-800/40 p-2 rounded-lg flex-shrink-0">
              <Icon name="xCircle" className="w-5 h-5 text-rose-600 dark:text-rose-400"/>
            </div>
            <div>
              <p className="font-bold text-sm">Sync Paused: Permission Denied</p>
              <p className="text-xs mt-1">You don't have permission to write to the database.</p>
            </div>
          </div>
      )}

      {/* Hero / Header Section */}
      <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Control</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage content, generate questions, and organize the library.</p>
      </div>

      {/* Quick Actions & Stats Grid */}
      {!isFormVisible && !isBulkFormVisible && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Stats Column */}
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Questions</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalQs}</p>
                    </div>
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Icon name="collection" className="w-5 h-5" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{activeTab === 'topics' ? 'Topics' : 'Exams'}</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{stats.exams}</p>
                     </div>
                     <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sets</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{stats.sets}</p>
                     </div>
                </div>
            </div>

            {/* Actions Column (2 Cols wide) */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                 {/* AI Generator Action Card (General) */}
                 <button 
                    onClick={handleBulkGenerate}
                    className="group relative p-6 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-left overflow-hidden col-span-2 sm:col-span-1"
                 >
                     <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                         <Icon name="sparkles" className="w-32 h-32 text-white" />
                     </div>
                     <div className="relative z-10 h-full flex flex-col justify-between">
                         <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white mb-4">
                             <Icon name="sparkles" className="w-6 h-6" />
                         </div>
                         <div>
                             <h3 className="text-xl font-bold text-white mb-1">AI Generator</h3>
                             <p className="text-indigo-100 text-xs font-medium">Auto-create MCQs from any text source.</p>
                         </div>
                     </div>
                 </button>
                 
                  {/* Topic Generator Action Card (AI) */}
                 <button 
                    onClick={handleTopicBulkGenerate}
                    className="group relative p-6 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-left overflow-hidden col-span-2 sm:col-span-1"
                 >
                     <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                         <Icon name="lightBulb" className="w-32 h-32 text-white" />
                     </div>
                     <div className="relative z-10 h-full flex flex-col justify-between">
                         <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white mb-4">
                             <Icon name="lightBulb" className="w-6 h-6" />
                         </div>
                         <div>
                             <h3 className="text-xl font-bold text-white mb-1">Topic Generator</h3>
                             <p className="text-sky-100 text-xs font-medium">Generate Topic Wise content from text.</p>
                         </div>
                     </div>
                 </button>
            </div>
        </div>
      )}

      {/* Main Content Area */}
      {isFormVisible && (
        <QuestionForm
          key={editingQuestion && 'id' in editingQuestion ? editingQuestion.id : 'new'}
          initialData={editingQuestion as Question}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          disabled={false}
          existingQuestions={questions}
        />
      )}

      {isBulkFormVisible && (
        <BulkGenerateForm
          onCancel={handleCancel}
          onAddQuestions={handleBulkAdd}
          existingQuestions={questions}
          initialLevel={initialBulkLevel}
        />
      )}

      {!isFormVisible && !isBulkFormVisible && (
        <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800/50 p-1">
            {/* Tab Switcher */}
            <div className="flex p-1 bg-white dark:bg-slate-900 rounded-2xl mb-4 shadow-sm border border-slate-100 dark:border-slate-800/50 mx-1 mt-1">
                <button
                    onClick={() => setActiveTab('exams')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'exams' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <Icon name="documentText" className="w-4 h-4" />
                    Exam Papers
                </button>
                <button
                    onClick={() => setActiveTab('topics')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'topics' ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 shadow-sm ring-1 ring-sky-100 dark:ring-sky-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <Icon name="folder" className="w-4 h-4" />
                    Topic Library
                </button>
            </div>

            <QuestionList
                questions={filteredQuestions}
                onEdit={handleEdit}
                onDelete={onDeleteQuestion}
                onDeleteSet={onDeleteQuestions}
                onEditSet={handleEditSet}
            />
        </div>
      )}

      {/* Batch Edit Modal */}
      {editingSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transform transition-all scale-100">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Set Details</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update metadata for multiple questions.</p>
                    </div>
                    <button onClick={() => setEditingSet(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <Icon name="xCircle" className="w-6 h-6"/>
                    </button>
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className={labelClass}>Level</label>
                         <div className="relative">
                            <select
                                value={batchEditData.level}
                                onChange={(e) => setBatchEditData({...batchEditData, level: e.target.value as QuestionLevel})}
                                className={inputClass}
                            >
                                {Object.values(QuestionLevel).map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                         </div>
                    </div>
                    <div>
                        <label className={labelClass}>Exam Name</label>
                        <input 
                            type="text" 
                            value={batchEditData.name} 
                            onChange={(e) => setBatchEditData({...batchEditData, name: e.target.value})}
                            className={inputClass}
                        />
                    </div>
                     <div>
                        <label className={labelClass}>Question Code Prefix</label>
                        <input 
                            type="text" 
                            value={batchEditData.prefix} 
                            onChange={(e) => setBatchEditData({...batchEditData, prefix: e.target.value})}
                            className={inputClass}
                            placeholder="e.g. GK-2024"
                        />
                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                             <Icon name="lightning" className="w-3 h-3 text-amber-500" />
                             Updates codes for all questions (e.g., GK-001 → LDC-001).
                         </p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button 
                        onClick={() => setEditingSet(null)}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveSet}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 text-sm"
                    >
                        Save Changes
                    </button>
                </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(AdminDashboard);
