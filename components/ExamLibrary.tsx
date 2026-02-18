
import React from 'react';

interface Exam {
  id: string;
  title: string;
  questions: number;
  duration: number;
  status: 'Active' | 'Popular' | 'Archived' | 'Preview';
  isAI?: boolean;
  isAdaptive?: boolean;
}

interface ExamLibraryProps {
  categories: Array<{
    id: string;
    name: string;
    examsCount: number;
    subfolders: number;
    isActive?: boolean;
  }>;
  exams: Exam[];
  onStartExam: () => void;
  onStartPractice: () => void;
}

const ExamLibrary: React.FC<ExamLibraryProps> = ({ categories, exams, onStartExam, onStartPractice }) => {
  return (
    <div className="space-y-10 animate-fade-in">
        {/* Folders Section */}
        <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white/90">Categories</h3>
                <button className="text-sm text-primary hover:text-blue-300 transition-colors flex items-center gap-1">
                    View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        className={`glass-card p-5 rounded-2xl relative group cursor-pointer transition-all duration-300 ${
                            cat.isActive ? 'ring-1 ring-primary/40 bg-gradient-to-br from-primary/10 to-transparent' : ''
                        }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl shadow-glow transition-colors ${
                                cat.isActive ? 'bg-primary/20 text-primary' : 'bg-white/5 text-blue-200 group-hover:bg-primary/20 group-hover:text-primary'
                            }`}>
                                <span className="material-symbols-outlined text-[32px]">
                                    {cat.isActive ? 'folder_open' : 'folder'}
                                </span>
                            </div>
                            <span className="material-symbols-outlined text-gray-500 group-hover:text-white transition-colors">more_horiz</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-1">{cat.name}</h4>
                        <p className={`text-sm ${cat.isActive ? 'text-blue-200/60' : 'text-gray-400'}`}>
                            {cat.examsCount} Exams • {cat.subfolders} Sub-folders
                        </p>
                        {cat.isActive && (
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Recent Exams / Files View */}
        <div>
            <div className="flex items-center gap-4 mb-6">
                <h3 className="text-lg font-semibold text-white/90">Degree Level Exams</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                {/* Filter Tabs */}
                <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                    <button className="px-3 py-1.5 rounded-md bg-white/10 text-xs font-medium text-white shadow-sm transition-all">All Years</button>
                    <button className="px-3 py-1.5 rounded-md hover:bg-white/5 text-xs font-medium text-gray-400 transition-colors">2023</button>
                    <button className="px-3 py-1.5 rounded-md hover:bg-white/5 text-xs font-medium text-gray-400 transition-colors">2022</button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {exams.map((exam) => (
                    <div key={exam.id} className="glass-card p-0 rounded-2xl overflow-hidden flex flex-col h-full group hover:translate-y-[-4px]">
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                    exam.status === 'Active' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                                    exam.status === 'Popular' ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' :
                                    'bg-white/5 text-gray-400 border-white/5'
                                }`}>
                                    {exam.status}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">ID: #{exam.id}</span>
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors">{exam.title}</h4>
                            <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px]">list_alt</span>
                                    <span>{exam.questions} Qns</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                                    <span>{exam.duration} Mins</span>
                                </div>
                                {exam.isAI && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                        <span className="text-purple-300 font-medium">AI Generated</span>
                                    </div>
                                )}
                                {exam.isAdaptive && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[16px]">psychology</span>
                                        <span className="text-blue-300 font-medium">Adaptive</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-black/20 border-t border-white/5 flex gap-3">
                            <button
                                onClick={onStartExam}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-blue-600 transition-all shadow-[0_0_15px_rgba(19,91,236,0.4)] hover:shadow-[0_0_20px_rgba(19,91,236,0.6)]"
                            >
                                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                                Test Mode
                            </button>
                            <button
                                onClick={onStartPractice}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-sm hover:bg-white/10 transition-all backdrop-blur-md"
                            >
                                <span className="material-symbols-outlined text-[18px]">school</span>
                                Practice
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default ExamLibrary;
