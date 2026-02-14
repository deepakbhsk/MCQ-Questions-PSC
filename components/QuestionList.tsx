
import React, { useMemo, useState, useEffect } from 'react';
import { Question, QuestionLevel } from '../types';
import Icon from './Icon';

interface QuestionListProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  onDeleteSet: (ids: string[]) => void;
  onEditSet?: (codePrefix: string, questions: Question[]) => void;
  disabled?: boolean; 
}

// Subtle color indicators for levels in the list
const levelColorMap: Record<QuestionLevel, string> = {
    [QuestionLevel.SEVENTH]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    [QuestionLevel.TENTH]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    [QuestionLevel.TWELFTH]: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    [QuestionLevel.DEGREE]: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    [QuestionLevel.TECHNICAL]: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
    [QuestionLevel.OTHERS]: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    [QuestionLevel.TOPIC]: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
};

const getCodePrefix = (code: string | undefined) => code ? code.split('-').slice(0, -1).join('-') || code.split('-')[0] : 'Uncategorized';

interface QuestionListItemProps {
    q: Question;
    onEdit: (q: Question) => void;
    onDelete: (id: string) => void;
}

const QuestionListItem = React.memo(({ q, onEdit, onDelete }: QuestionListItemProps) => {
    return (
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-white dark:hover:bg-slate-800 transition-colors group flex gap-4">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">{q.code}</span>
                    {q.subtopic && q.subtopic !== 'General' && (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                            {q.subtopic}
                        </span>
                    )}
                    {q.correct_answer_index === -1 && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Icon name="lightning" className="w-3 h-3"/> Unsolved
                        </span>
                    )}
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                    {q.question}
                </p>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {q.correct_answer_index !== -1
                        ? `Ans: ${q.options[q.correct_answer_index]}`
                        : <span className="text-amber-500">Answer needed</span>
                    }
                </div>
            </div>
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
                <button
                    onClick={() => onEdit(q)}
                    className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm"
                >
                    <Icon name="pencil" className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(q.id)}
                    className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 shadow-sm"
                >
                    <Icon name="trash" className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
});


const QuestionList: React.FC<QuestionListProps> = React.memo(({ questions, onEdit, onDelete, onDeleteSet, onEditSet }) => {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQuestions = useMemo(() => {
    if (!searchTerm.trim()) return questions;
    
    const lowerTerm = searchTerm.toLowerCase();
    return questions.filter(q => 
      (q.question && q.question.toLowerCase().includes(lowerTerm)) ||
      (q.code && q.code.toLowerCase().includes(lowerTerm)) ||
      (q.name && q.name.toLowerCase().includes(lowerTerm))
    );
  }, [questions, searchTerm]);

  const groupedQuestions = useMemo(() => {
    const groups = new Map<string, Question[]>();
    for (const q of filteredQuestions) {
      const prefix = getCodePrefix(q.code);
      if (!groups.has(prefix)) {
        groups.set(prefix, []);
      }
      groups.get(prefix)!.push(q);
    }
    
    // Sort questions within each group by created_at (Ascending/FIFO)
    // If timestamps are identical (batch import), fallback to Code (Numeric sort) to prevent shuffling
    groups.forEach(qs => qs.sort((a, b) => {
        const timeCompare = (a.created_at || '').localeCompare(b.created_at || '');
        if (timeCompare !== 0) return timeCompare;
        return (a.code || '').localeCompare(b.code || '', undefined, { numeric: true });
    }));
    
    return new Map([...groups.entries()].sort());
  }, [filteredQuestions]);

  useEffect(() => {
    if (groupedQuestions.size > 0 && openFolders.size === 0 && !searchTerm) {
        setOpenFolders(new Set([groupedQuestions.keys().next().value]));
    } else if (searchTerm && groupedQuestions.size > 0) {
        setOpenFolders(new Set(groupedQuestions.keys()));
    }
  }, [groupedQuestions, searchTerm]);

  const toggleFolder = (codePrefix: string) => {
    setOpenFolders(prev => {
        const newSet = new Set(prev);
        if (newSet.has(codePrefix)) {
            newSet.delete(codePrefix);
        } else {
            newSet.add(codePrefix);
        }
        return newSet;
    });
  };

  const handleDeleteFolder = (e: React.MouseEvent, codePrefix: string, folderQuestions: Question[]) => {
      e.stopPropagation();
      if (window.confirm(`Are you sure you want to delete the entire "${codePrefix}" set? This will remove ${folderQuestions.length} questions.`)) {
          const ids = folderQuestions.map(q => q.id);
          onDeleteSet(ids);
      }
  };

  const handleBatchEdit = (e: React.MouseEvent, codePrefix: string, folderQuestions: Question[]) => {
      e.stopPropagation();
      if (onEditSet) {
          onEditSet(codePrefix, folderQuestions);
      }
  };

  return (
    <div className="space-y-4">
       {/* Search Bar */}
       <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="search" className="w-5 h-5 text-slate-400" />
            </div>
            <input 
                type="text" 
                placeholder="Search questions by content, code, or exam name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl leading-5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
            />
       </div>

       {groupedQuestions.size === 0 ? (
           <div className="text-center py-12">
               <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Icon name="documentText" className="w-8 h-8 text-slate-300" />
               </div>
               <p className="text-slate-500 dark:text-slate-400 font-medium">No questions found in this section.</p>
           </div>
       ) : (
           Array.from(groupedQuestions.entries()).map(([codePrefix, folderQuestions]) => {
               const isOpen = openFolders.has(codePrefix);
               const firstQ = folderQuestions[0];
               const level = firstQ.level;
               const examName = firstQ.name || 'Uncategorized';
               const levelColor = levelColorMap[level] || 'bg-slate-100 text-slate-700';
               const unsolvedCount = folderQuestions.filter(q => q.correct_answer_index === -1).length;
               
               return (
                   <div key={codePrefix} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
                       <div 
                           onClick={() => toggleFolder(codePrefix)}
                           className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                       >
                           <div className="flex items-center gap-4 min-w-0">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOpen ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                   <Icon name={isOpen ? "folder" : "folder"} className="w-5 h-5" />
                               </div>
                               <div className="min-w-0">
                                   <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                       {codePrefix}
                                       <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-extrabold ${levelColor}`}>
                                           {level}
                                       </span>
                                       {unsolvedCount > 0 && (
                                            <span className="flex items-center gap-1 text-[10px] uppercase px-2 py-0.5 rounded font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                                <Icon name="lightning" className="w-3 h-3"/> {unsolvedCount} Unsolved
                                            </span>
                                       )}
                                   </h3>
                                   <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                       {examName} • {folderQuestions.length} Questions
                                   </p>
                               </div>
                           </div>
                           <div className="flex items-center gap-2">
                               {onEditSet && (
                                   <button 
                                        onClick={(e) => handleBatchEdit(e, codePrefix, folderQuestions)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                        title="Edit Set Details"
                                   >
                                       <Icon name="pencil" className="w-4 h-4" />
                                   </button>
                               )}
                               <button 
                                   onClick={(e) => handleDeleteFolder(e, codePrefix, folderQuestions)}
                                   className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                   title="Delete Set"
                               >
                                   <Icon name="trash" className="w-4 h-4" />
                               </button>
                               <Icon name="chevronRight" className={`w-5 h-5 text-slate-300 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                           </div>
                       </div>
                       
                       {isOpen && (
                           <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                               {folderQuestions.map((q) => (
                                   <QuestionListItem
                                        key={q.id}
                                        q={q}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                   />
                               ))}
                           </div>
                       )}
                   </div>
               );
           })
       )}
    </div>
  );
});

export default QuestionList;
