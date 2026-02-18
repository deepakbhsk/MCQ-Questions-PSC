
import React, { useEffect, useRef } from 'react';
import { Question, QuizMode } from '../types';

interface QuestionCardProps {
  question: Question;
  mode: QuizMode;
  userSelectedOption?: number;
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSaveNext: () => void;
  onClearResponse: () => void;
  onMarkForReview: () => void;
  isFirst: boolean;
  isLast: boolean;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  mode,
  userSelectedOption,
  onAnswer,
  onNext,
  onPrevious,
  onSaveNext,
  onClearResponse,
  onMarkForReview,
  isFirst,
  isLast,
  isBookmarked,
  onToggleBookmark
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPractice = mode === 'practice';
  const showExplanation = isPractice && userSelectedOption !== undefined;

  useEffect(() => {
    if (containerRef.current && (window as any).renderMathInElement) {
        (window as any).renderMathInElement(containerRef.current, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError : false
        });
    }
  }, [question, showExplanation]);
  
  const correctIndex = typeof question.correct_answer_index === 'string'
    ? parseInt(question.correct_answer_index, 10)
    : question.correct_answer_index;

  const isCorrect = userSelectedOption === correctIndex;

  const options = ['A', 'B', 'C', 'D'];

  return (
    <div ref={containerRef} className="space-y-8 animate-slide-up">
        {/* Question Header */}
        <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600/50 text-xs font-semibold text-slate-300">
                    {question.subtopic || 'General'}
                </span>
                <span className="text-slate-400 text-sm font-medium">Question Details</span>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={onToggleBookmark}
                    className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${isBookmarked ? 'text-yellow-400' : 'text-slate-400'}`}
                    title="Mark for Review"
                >
                    <span className={`material-symbols-outlined ${isBookmarked ? 'filled' : ''}`}>bookmark</span>
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors" title="Report Issue">
                    <span className="material-symbols-outlined">flag</span>
                </button>
            </div>
        </div>

        {/* Question Text */}
        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight relative z-10 drop-shadow-sm">
            {question.question}
        </h2>

        {/* Split Layout for Options & AI Explanation */}
        <div className={`grid grid-cols-1 gap-6 ${showExplanation ? 'lg:grid-cols-2' : ''}`}>
            {/* Options */}
            <div className="flex flex-col gap-4 relative z-10">
                {question.options.map((option, idx) => {
                    const isSelected = userSelectedOption === idx;
                    const isCorrectOption = idx === correctIndex;

                    let stateClasses = "border-slate-700 bg-slate-800/30 hover:bg-slate-700/40 group-hover:border-slate-600";
                    let circleClasses = "border-slate-500 text-slate-300";

                    if (isSelected) {
                        if (isPractice) {
                            if (isCorrectOption) {
                                stateClasses = "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                                circleClasses = "border-emerald-500 bg-emerald-500 text-white shadow-sm";
                            } else {
                                stateClasses = "border-rose-500/50 bg-rose-500/10";
                                circleClasses = "border-rose-500 bg-rose-500 text-white";
                            }
                        } else {
                            stateClasses = "border-primary bg-primary/10 shadow-[0_0_15px_rgba(19,91,236,0.1)]";
                            circleClasses = "border-primary bg-primary text-white shadow-sm";
                        }
                    } else if (showExplanation && isCorrectOption) {
                        stateClasses = "border-emerald-500/30 bg-emerald-500/5";
                        circleClasses = "border-emerald-500/50 text-emerald-500";
                    }

                    return (
                        <label key={idx} className="group cursor-pointer relative">
                            <input
                                className="sr-only"
                                type="radio"
                                name="options"
                                checked={isSelected}
                                onChange={() => onAnswer(idx)}
                                disabled={showExplanation}
                            />
                            <div className={`p-4 rounded-xl border transition-all flex items-center gap-4 ${stateClasses}`}>
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all shrink-0 ${circleClasses}`}>
                                    {options[idx]}
                                    {isPractice && isSelected && isCorrectOption && (
                                        <span className="material-symbols-outlined text-[14px] absolute -top-1 -right-1 bg-emerald-500 rounded-full text-white">check</span>
                                    )}
                                </div>
                                <span className="text-slate-200 text-lg leading-snug">{option}</span>
                                {isPractice && isSelected && isCorrectOption && (
                                    <div className="absolute inset-0 rounded-xl bg-emerald-400/5 animate-pulse pointer-events-none"></div>
                                )}
                            </div>
                        </label>
                    );
                })}
            </div>

            {/* AI Explanation Card */}
            {showExplanation && (
                <div className="animate-fade-in lg:block">
                    <div className="glass-panel h-full rounded-2xl overflow-hidden relative group border-t-0">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isCorrect ? 'from-emerald-500 via-primary' : 'from-rose-500 via-primary'} to-purple-500 opacity-80`}></div>
                        <div className="p-6 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <span className="material-symbols-outlined text-white text-[18px]">auto_awesome</span>
                                </div>
                                <h3 className="text-white text-lg font-bold">AI Insight</h3>
                                <div className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/60 border border-white/5 uppercase tracking-wider">Beta</div>
                            </div>
                            <div className="text-gray-300 text-sm leading-relaxed overflow-y-auto pr-2 custom-scrollbar flex-1">
                                <p className={`font-medium mb-2 ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isCorrect ? 'Excellent! That\'s the correct answer.' : 'Not quite. Here\'s the breakdown:'}
                                </p>
                                <div className="mb-3 whitespace-pre-wrap">
                                    {question.explanation || 'No detailed explanation available for this question.'}
                                </div>
                                <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-400">
                                    <strong className="text-gray-200 block mb-1">Key Takeaway:</strong>
                                    Keep practicing to master this topic!
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10 flex gap-2">
                                <button className="flex-1 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">thumb_up</span> Helpful
                                </button>
                                <button className="flex-1 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">share</span> Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-700/50 relative z-10">
            <button
                onClick={onPrevious}
                disabled={isFirst}
                className="glass-button px-6 py-3 rounded-xl text-slate-300 font-semibold hover:bg-white/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <span className="material-symbols-outlined">arrow_back</span>
                Previous
            </button>
            <div className="flex gap-3">
                <button
                    onClick={onClearResponse}
                    className="glass-button px-6 py-3 rounded-xl text-slate-300 font-semibold hover:bg-white/10 flex items-center gap-2 transition-all"
                >
                    Clear
                </button>
                <button
                    onClick={onSaveNext}
                    className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/25 flex items-center gap-2 transform transition-transform active:scale-95"
                >
                    {isLast ? 'Finish Test' : 'Save & Next'}
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default React.memo(QuestionCard);
