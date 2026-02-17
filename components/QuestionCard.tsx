
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Question, QuizMode } from '../types';
import Icon from './Icon';
import Spinner from './Spinner';
import { getExplanationWithAi } from '../services/geminiService';

interface QuestionCardProps {
  question: Question;
  mode: QuizMode;
  userSelectedOption?: number;
  onAnswer: (selectedIndex: number) => void;
  onNext: () => void;
  onSaveNext?: () => void;
  onPrevious: () => void;
  onClearResponse?: () => void;
  onMarkForReview?: () => void;
  isFirst: boolean;
  isLast: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = React.memo(({
    question, 
    mode, 
    userSelectedOption, 
    onAnswer, 
    onNext, 
    onSaveNext,
    onPrevious,
    onClearResponse,
    onMarkForReview,
    isFirst,
    isLast,
    isBookmarked, 
    onToggleBookmark 
}) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState(true);
  
  const cardRef = useRef<HTMLDivElement>(null);

  const isAnswered = userSelectedOption !== undefined;
  const isPracticeLocked = mode === 'practice' && isAnswered;

  useEffect(() => {
    setExplanation(null);
    setIsLoadingExplanation(false);
    setIsExplanationOpen(true);
  }, [question]);

  useEffect(() => {
    if (mode === 'practice' && isAnswered && question.explanation) {
      setExplanation(question.explanation);
      setIsExplanationOpen(true);
    }
  }, [mode, isAnswered, question.explanation]);

  useEffect(() => {
      if (cardRef.current && (window as any).renderMathInElement) {
          setTimeout(() => {
            if (cardRef.current) {
                try {
                    (window as any).renderMathInElement(cardRef.current, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\(', right: '\\)', display: false},
                            {left: '\\[', right: '\\]', display: true}
                        ],
                        throwOnError: false
                    });
                } catch (e) {
                    console.error("KaTeX render error:", e);
                }
            }
          }, 0);
      }
  }, [question, explanation, isExplanationOpen, userSelectedOption, mode]);

  const correctIndex = typeof question.correct_answer_index === 'string' 
      ? parseInt(question.correct_answer_index, 10) 
      : question.correct_answer_index;

  const processLatex = (text: string) => {
      if (!text) return "";
      let processed = text;
      processed = processed.replace(/\\frac\{([^{}]+)\}\[([^{}]+)\]/g, '\\frac{$1}{$2}');
      processed = processed.replace(/\\frac\{([^{}]+)\}\[([^{}]+)\}/g, '\\frac{$1}{$2}');
      processed = processed.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\]/g, '\\frac{$1}{$2}');
      processed = processed.replace(/\\frac\[([^{}]+)\]\{([^{}]+)\}/g, '\\frac{$1}{$2}');
      processed = processed.replace(/(?<!\$|\d)(\d+\^\{[a-zA-Z]+\})(?!\$)/g, '$$$1$$');
      processed = processed.replace(/\$\$(\d+\^\{.*?\})\$\$/g, '$$$1$$');
      return processed;
  };

  const formattedQuestion = useMemo(() => {
      if (!question.question) return "";
      let text = processLatex(question.question);
      text = text.replace(/(\s|^)(List\s+[I]+)(\s|:)/g, '\n$2$3');
      text = text.replace(/(\s|^)(\d+\.)(\s)/g, '\n$2$3');
      text = text.replace(/(\s|^)(\([a-zA-Z0-9]+\))(\s)/g, '\n$2$3');
      text = text.replace(/(\s|^)([ivx]+\.)(\s)/g, '\n$2$3');
      text = text.replace(/(\s|^)(I\.|II\.|III\.|IV\.|V\.|VI\.)(\s)/g, '\n$2$3');
      return text.trim();
  }, [question.question]);

  const handleOptionClick = (index: number) => {
    if (isPracticeLocked) return; 
    onAnswer(index);
  };
  
  const handleGetExplanation = async () => {
    if(!process.env.API_KEY) {
        setExplanation("AI explanation feature is disabled. API key not provided.");
        setIsExplanationOpen(true);
        return;
    }
    setIsLoadingExplanation(true);
    setExplanation(null);
    try {
        const result = await getExplanationWithAi(question);
        setExplanation(result);
        setIsExplanationOpen(true);
    } catch (error) {
        setExplanation(error instanceof Error ? error.message : "Could not fetch explanation.");
        setIsExplanationOpen(true);
    } finally {
        setIsLoadingExplanation(false);
    }
  };

  const getOptionClass = (index: number) => {
    // Apple UI Style: rounded-2xl, subtle borders, smooth scale on press
    let baseClass = 'relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 text-left flex items-center gap-4 w-full group outline-none select-none ';
    
    const isSelected = userSelectedOption === index;

    if (mode === 'exam') {
        if (isSelected) {
            return `${baseClass} border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm ring-1 ring-indigo-600`;
        }
        return `${baseClass} border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-700 active:scale-[0.98] cursor-pointer`;
    }

    if (!isPracticeLocked) {
      return `${baseClass} border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm active:scale-[0.98] cursor-pointer`;
    }
    
    if (index === correctIndex) {
      return `${baseClass} border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm ring-1 ring-emerald-500`;
    }
    
    if (isSelected) {
      return `${baseClass} border-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-sm ring-1 ring-rose-500`;
    }
    
    return `${baseClass} border-transparent bg-stone-100/50 dark:bg-stone-900/50 text-stone-400 dark:text-stone-600 cursor-default`;
  };

  const renderQuestionText = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g).filter(part => part !== '');
      return parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-bold text-stone-900 dark:text-white">{part.slice(2, -2)}</strong>;
          }
          return <span key={i}>{part}</span>;
      });
  };

  const renderTextWithBold = (text: string) => {
      const latexText = processLatex(text);
      const parts = latexText.split(/(\*\*.*?\*\*)/g).filter(part => part !== '');
      
      const SECTION_HEADERS = [
          'Correct Answer:',
          'Detailed Explanation:',
          'Core Concept:',
          'Why other options are incorrect:',
          'Explanation:'
      ];

      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            const content = part.slice(2, -2);
            const isHeader = SECTION_HEADERS.some(header => content.includes(header));
            
            if (isHeader) {
                return <strong key={i} className="font-bold text-indigo-700 dark:text-indigo-300 block mt-5 mb-2 text-sm tracking-wide uppercase">{content}</strong>;
            } else {
                return <strong key={i} className="font-bold text-stone-900 dark:text-stone-100">{content}</strong>;
            }
        }
        
        let content = part;
        if (i > 0 && parts[i-1].startsWith('**') && parts[i-1].endsWith('**')) {
             const prevContent = parts[i-1].slice(2, -2);
             if (SECTION_HEADERS.some(header => prevContent.includes(header))) {
                 content = content.trimStart();
             }
        }
        if (i < parts.length - 1 && parts[i+1].startsWith('**') && parts[i+1].endsWith('**')) {
             const nextContent = parts[i+1].slice(2, -2);
             if (SECTION_HEADERS.some(header => nextContent.includes(header))) {
                content = content.trimEnd();
             }
        }

        return <span key={i} className="text-stone-700 dark:text-stone-300">{content}</span>;
      });
  };

  return (
    <div ref={cardRef} className="flex flex-col min-h-full w-full">
      <div className="flex justify-between items-start mb-8 gap-6">
          <h3 className="text-lg sm:text-xl font-medium text-stone-900 dark:text-stone-100 leading-relaxed tracking-tight whitespace-pre-wrap text-justify">
              {renderQuestionText(formattedQuestion)}
          </h3>
          
          {onToggleBookmark && mode === 'practice' && (
              <button
                  onClick={onToggleBookmark}
                  className={`p-2.5 rounded-full transition-all flex-shrink-0 ${isBookmarked 
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100' 
                      : 'text-stone-300 hover:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                  title={isBookmarked ? "Remove Bookmark" : "Bookmark this Question"}
              >
                  <Icon name={isBookmarked ? "bookmarkSolid" : "bookmark"} className="w-5 h-5" />
              </button>
          )}
      </div>
      
      <div className="space-y-3 mb-auto">
        {question.options.map((option, index) => {
            const isSelected = userSelectedOption === index;
            let icon;
            
            if (mode === 'exam') {
                icon = (
                    <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-600' : 'border-stone-400 group-hover:border-indigo-400'}`}>
                        {isSelected && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                );
            } else {
                icon = <span className="font-bold">{String.fromCharCode(65 + index)}</span>;
                if (isPracticeLocked) {
                    if (index === correctIndex) icon = <Icon name="check" className="w-4 h-4" strokeWidth={3}/>;
                    else if (isSelected) icon = <Icon name="xCircle" className="w-4 h-4" />;
                }
            }

            let iconContainerClass = `w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 flex-shrink-0 border `;
            if (mode !== 'exam') {
                if (!isPracticeLocked) {
                    // Default State
                    iconContainerClass += 'bg-stone-100 dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-500 dark:text-stone-400 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white group-hover:shadow-md';
                } else if (index === correctIndex) {
                    // Correct
                    iconContainerClass += 'bg-emerald-500 border-emerald-500 text-white shadow-sm';
                } else if (isSelected) {
                    // Incorrect
                    iconContainerClass += 'bg-rose-500 border-rose-500 text-white shadow-sm';
                } else {
                    // Dimmed
                    iconContainerClass += 'bg-stone-100 dark:bg-stone-800 border-transparent text-stone-300 dark:text-stone-600';
                }
            } else {
                iconContainerClass = "hidden";
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={isPracticeLocked}
                className={getOptionClass(index)}
              >
                {mode !== 'exam' && <div className={iconContainerClass}>{icon}</div>}
                {mode === 'exam' && icon}
                <span className={`flex-1 font-medium text-sm sm:text-base transition-colors ${
                    mode === 'practice' && isPracticeLocked 
                    ? (index === correctIndex ? 'text-emerald-900 dark:text-emerald-100' : isSelected ? 'text-rose-900 dark:text-rose-100' : 'text-stone-700 dark:text-stone-400')
                    : (isSelected && mode === 'exam' ? 'text-indigo-900 dark:text-indigo-100 font-bold' : 'text-stone-700 dark:text-stone-200 group-hover:text-stone-900 dark:group-hover:text-white')
                }`}>
                    {processLatex(option)}
                </span>
              </button>
            );
        })}
      </div>

      {/* Explanation Section */}
      {mode === 'practice' && isPracticeLocked && (
        <div className="mt-8 animate-fade-in w-full">
          {explanation && (
            <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 overflow-hidden">
                <button 
                    onClick={() => setIsExplanationOpen(!isExplanationOpen)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus:outline-none hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 transition-colors"
                >
                    <h4 className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2 text-xs uppercase tracking-wide">
                        <Icon name="sparkles" className="w-4 h-4" />
                        Explanation
                    </h4>
                    <Icon name="chevronRight" className={`w-4 h-4 text-indigo-500 transition-transform ${isExplanationOpen ? 'rotate-90' : ''}`} />
                </button>
                {isExplanationOpen && (
                     <div className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
                        <div className="text-stone-700 dark:text-stone-300 leading-7 text-sm sm:text-base whitespace-pre-wrap text-justify break-words border-t border-indigo-100 dark:border-indigo-900/20 pt-4">
                            {renderTextWithBold(explanation)}
                        </div>
                    </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 w-full">
          {mode === 'practice' ? (
             <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                  <div className="w-full sm:w-auto flex-1 flex justify-start">
                    <button onClick={onPrevious} disabled={isFirst} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2 border border-stone-200 dark:border-stone-700 shadow-sm active:scale-[0.98] transition-transform">
                        <Icon name="chevronLeft" className="w-4 h-4" /> Back
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-end">
                    {isPracticeLocked && !question.explanation && !explanation && (
                        <button onClick={handleGetExplanation} disabled={isLoadingExplanation} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-800 active:scale-[0.98] transition-transform">
                            {isLoadingExplanation ? <Spinner /> : <Icon name="sparkles" className="w-4 h-4" />} Explain
                        </button>
                    )}

                    {isPracticeLocked && (
                        <button onClick={onNext} className="w-full sm:w-auto sm:min-w-[140px] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                            {isLast ? 'Finish' : 'Next'} <Icon name="chevronRight" className="w-4 h-4" />
                        </button>
                    )}
                  </div>
             </div>
          ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                  <div className="flex gap-3 w-full sm:w-auto flex-1">
                      <button 
                          onClick={onMarkForReview ? () => { onMarkForReview(); if(!isLast) onNext(); } : undefined} 
                          className="flex-1 sm:flex-none px-4 py-3 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 rounded-xl text-sm font-bold hover:bg-fuchsia-100 transition-colors active:scale-[0.98]"
                      >
                          {isLast ? 'Mark Review' : 'Mark Review & Next'}
                      </button>
                      
                      <button onClick={onClearResponse} className="flex-1 sm:flex-none px-4 py-3 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-bold hover:bg-stone-100 transition-colors active:scale-[0.98]">
                          Clear
                      </button>
                  </div>

                  <button onClick={onSaveNext} className="w-full sm:w-auto sm:min-w-[140px] px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-[0.98]">
                      {isLast ? 'Save & Submit' : 'Save & Next'}
                  </button>
              </div>
          )}
      </div>
    </div>
  );
});

export default QuestionCard;
