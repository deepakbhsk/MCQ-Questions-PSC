
import React, { useState } from 'react';
import { IncorrectAnswer } from '../types';
import Icon from './Icon';

interface ScoreScreenProps {
  score: number;
  total: number;
  userAnswersCount: number;
  timeTaken: number;
  onRestart: () => void;
  onExit: () => void;
  incorrectAnswers: IncorrectAnswer[];
}

const ScoreScreen: React.FC<ScoreScreenProps> = ({
  score,
  total,
  userAnswersCount,
  timeTaken,
  onRestart,
  onExit,
  incorrectAnswers
}) => {
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'correct' | 'skipped'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}h ${secs}m`; // Simplified for design matching
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20">
        {/* Performance Summary Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Main Stats Card */}
            <div className="md:col-span-8 glass-panel rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-500"></div>
                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {accuracy >= 80 ? 'Excellent Performance!' : accuracy >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
                        </h3>
                        <p className="text-gray-400 max-w-md">You've scored higher than 85% of candidates. Focus on improving your speed in Economics to reach the top tier.</p>
                    </div>
                    <button
                        onClick={onRestart}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                        Retake Exam
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-4 relative z-10">
                    <div className="glass-card rounded-2xl p-5 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-1">
                            <span className="material-symbols-outlined text-primary text-[20px]">trophy</span>
                            Total Score
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">{score}</span>
                            <span className="text-lg text-gray-500 font-medium mb-1.5">/ {total}</span>
                        </div>
                        <div className="text-green-400 text-xs font-bold bg-green-400/10 py-1 px-2 rounded w-fit flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">trending_up</span> +5%
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-5 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-1">
                            <span className="material-symbols-outlined text-blue-400 text-[20px]">target</span>
                            Accuracy
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">{accuracy}%</span>
                        </div>
                        <div className="text-green-400 text-xs font-bold bg-green-400/10 py-1 px-2 rounded w-fit flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span> High
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-5 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-1">
                            <span className="material-symbols-outlined text-orange-400 text-[20px]">timer</span>
                            Time Taken
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">{formatTime(timeTaken)}</span>
                        </div>
                        <div className="text-yellow-400 text-xs font-bold bg-yellow-400/10 py-1 px-2 rounded w-fit flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">speed</span> Avg 1m 20s
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Insights Card */}
            <div className="md:col-span-4 glass-panel rounded-3xl p-6 flex flex-col relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                    <div className="size-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">AI Analysis</h3>
                </div>
                <div className="space-y-4 flex-grow">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-green-400 mt-0.5">verified</span>
                            <div>
                                <p className="text-sm font-bold text-white">Strong in Polity</p>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">You answered 90% of Polity questions correctly. Keep it up!</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-orange-400 mt-0.5">bolt</span>
                            <div>
                                <p className="text-sm font-bold text-white">Speed Up in History</p>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">You spent an average of 2.5 mins on history. Review timelines.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <button className="mt-4 w-full py-2.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors">
                    View Full Report
                </button>
            </div>
        </section>

        {/* Review Section */}
        <section className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white">Question Review</h2>
                {/* Filter Tabs */}
                <div className="glass-panel p-1 rounded-xl flex items-center overflow-x-auto custom-scrollbar">
                    {(['all', 'incorrect', 'correct', 'skipped'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize whitespace-nowrap ${
                                filter === f ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {incorrectAnswers.map((q, idx) => (
                    <div key={q.id} className="glass-card rounded-2xl p-6 border-l-4 border-l-rose-500 animate-slide-up">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex items-start gap-4">
                                <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Q. {idx + 1}</span>
                                    <div className="size-8 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[20px]">close</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-lg font-medium text-white leading-relaxed">{q.question}</h4>
                                    <div className="mt-4 p-5 rounded-xl bg-[#0b101a]/50 border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5">
                                            <span className="block text-xs text-rose-500 font-bold uppercase mb-1">Your Answer</span>
                                            <p className="text-white font-medium">{q.options[q.user_answer_index]}</p>
                                        </div>
                                        <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                                            <span className="block text-xs text-green-500 font-bold uppercase mb-1">Correct Answer</span>
                                            <p className="text-white font-medium">{q.options[typeof q.correct_answer_index === 'string' ? parseInt(q.correct_answer_index) : q.correct_answer_index]}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <h5 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
                                            Explanation
                                        </h5>
                                        <p className="text-sm text-gray-400 leading-relaxed">
                                            {q.explanation || 'No detailed explanation available for this question.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="px-3 py-1 rounded-lg bg-white/5 text-xs font-medium text-gray-400 border border-white/5">{q.subtopic || 'General'}</span>
                                <button className="text-gray-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">bookmark_border</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {incorrectAnswers.length === 0 && (
                    <div className="text-center py-20 glass-panel rounded-3xl">
                        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl">verified</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Errors!</h3>
                        <p className="text-gray-400">You answered all questions correctly or skipped them.</p>
                    </div>
                )}
            </div>
        </section>

        <div className="flex justify-center pt-4">
            <button
                onClick={onExit}
                className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2"
            >
                Back to Dashboard
                <span className="material-symbols-outlined text-sm">home</span>
            </button>
        </div>
    </div>
  );
};

export default ScoreScreen;
