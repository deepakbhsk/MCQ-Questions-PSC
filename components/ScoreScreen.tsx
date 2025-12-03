
import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import Spinner from './Spinner';
import { IncorrectAnswer } from '../types';
import { getQuizFeedbackWithAi } from '../services/geminiService';

interface ScoreScreenProps {
  score: number;
  total: number;
  userAnswersCount: number;
  timeTaken: number;
  onRestart: () => void;
  onExit: () => void;
  incorrectAnswers: IncorrectAnswer[];
}

const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const finalOffset = percentage >= 100 ? 0 : circumference - (percentage / 100) * circumference;

    // Determine color based on score
    let colorClass = "text-rose-500";
    let strokeColor = "#f43f5e"; // rose-500
    if (percentage >= 90) { colorClass = "text-amber-500"; strokeColor = "#f59e0b"; } // amber-500
    else if (percentage >= 75) { colorClass = "text-indigo-500"; strokeColor = "#6366f1"; } // indigo-500
    else if (percentage >= 50) { colorClass = "text-emerald-500"; strokeColor = "#10b981"; } // emerald-500
    else if (percentage >= 30) { colorClass = "text-blue-500"; strokeColor = "#3b82f6"; } // blue-500

    return (
        <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                <circle
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                />
                {/* Progress Circle */}
                <circle
                    className={`progress-circle-animation drop-shadow-md ${colorClass}`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    style={{ '--stroke-offset': finalOffset, stroke: strokeColor } as React.CSSProperties}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${colorClass} tracking-tight`}>{percentage}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Accuracy</span>
            </div>
        </div>
    )
};

const ScoreScreen: React.FC<ScoreScreenProps> = ({ score, total, userAnswersCount, timeTaken, onRestart, onExit, incorrectAnswers }) => {
    const [percentage, setPercentage] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const finalPercentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const incorrectCount = incorrectAnswers.length;
    const skippedCount = total - userAnswersCount;
    
    useEffect(() => {
        if (finalPercentage === 0) {
            setPercentage(0);
            return;
        };
        
        let start = 0;
        const duration = 1500;
        const increment = finalPercentage / (duration / 16); 

        const timer = setInterval(() => {
            start += increment;
            if (start >= finalPercentage) {
                setPercentage(finalPercentage);
                clearInterval(timer);
            } else {
                setPercentage(Math.ceil(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [finalPercentage]);


    const [feedback, setFeedback] = useState<string | null>(null);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);

    const handleGetFeedback = async () => {
        if(!process.env.API_KEY) {
            setFeedbackError("AI feedback feature is disabled. API key not provided.");
            return;
        }
        setIsLoadingFeedback(true);
        setFeedback(null);
        setFeedbackError(null);
        try {
            const result = await getQuizFeedbackWithAi(incorrectAnswers);
            setFeedback(result);
        } catch (error) {
            setFeedbackError(error instanceof Error ? error.message : "Could not fetch feedback.");
        } finally {
            setIsLoadingFeedback(false);
        }
    };

    // Trigger KaTeX rendering for feedback
    useEffect(() => {
        if (containerRef.current && (window as any).renderMathInElement) {
            setTimeout(() => {
                if (containerRef.current) {
                    (window as any).renderMathInElement(containerRef.current, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\(', right: '\\)', display: false},
                            {left: '\\[', right: '\\]', display: true}
                        ],
                        throwOnError: false
                    });
                }
            }, 100);
        }
    }, [feedback]);

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

    const renderTextWithBold = (text: string) => {
        const latexText = processLatex(text);
        const parts = latexText.split(/(\*\*.*?\*\*)/g).filter(part => part !== '');
        
        // Known section headers
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
                    return <strong key={i} className="font-bold text-indigo-700 dark:text-indigo-300 block mt-5 mb-2 text-[15px] tracking-wide">{content}</strong>;
                } else {
                     return <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">{content}</strong>;
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
            
            return <span key={i}>{content}</span>;
        });
    };
    
    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };
    
    const avgTime = userAnswersCount > 0 ? Math.round(timeTaken / userAnswersCount) : 0;

    let performanceMessage = "Good Start!";
    if (finalPercentage >= 90) performanceMessage = "Outstanding!";
    else if (finalPercentage >= 75) performanceMessage = "Excellent Job!";
    else if (finalPercentage >= 50) performanceMessage = "Good Effort!";
    else if (finalPercentage >= 30) performanceMessage = "Getting There";
    else performanceMessage = "Keep Practicing";

  return (
    <div className="animate-fade-in pb-12 max-w-3xl mx-auto px-4 sm:px-6" ref={containerRef}>
        
        {/* Main Result Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-indigo-500/5 border border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center relative overflow-hidden mb-6">
            {/* Top Gradient Line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Quiz Complete!</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 text-lg">{performanceMessage}</p>

            <div className="flex justify-center mb-10">
                <CircularProgress percentage={percentage} />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-emerald-500 leading-none mb-1">{score}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correct</span>
                </div>
                <div className="flex flex-col items-center relative after:content-[''] after:absolute after:right-0 after:top-1/4 after:h-1/2 after:w-px after:bg-slate-100 dark:after:bg-slate-800 sm:after:hidden">
                    <span className="text-3xl font-black text-rose-500 leading-none mb-1">{incorrectCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wrong</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-slate-400 leading-none mb-1">{skippedCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skipped</span>
                </div>
                <div className="flex flex-col items-center relative before:content-[''] before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-px before:bg-slate-100 dark:before:bg-slate-800 sm:before:hidden">
                    <span className="text-3xl font-black text-indigo-500 dark:text-indigo-400 leading-none mb-1">{formatDuration(timeTaken)}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</span>
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <button 
                onClick={onExit} 
                className="order-2 sm:order-1 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
                <Icon name="home" className="w-5 h-5"/> Back to Dashboard
            </button>
            <button 
                onClick={onRestart} 
                className="order-1 sm:order-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 text-sm flex items-center justify-center gap-2"
            >
                <Icon name="refresh" className="w-5 h-5"/> Try Again
            </button>
        </div>

        {/* AI Feedback Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden relative">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/10 dark:to-transparent pointer-events-none"></div>
             
             <div className="p-8 sm:p-10 relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Icon name="sparkles" className="w-6 h-6 text-indigo-600"/>
                            AI Tutor Insights
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Get personalized analysis of your performance.</p>
                    </div>
                    {(!feedback && !isLoadingFeedback) && (
                        <button
                            onClick={handleGetFeedback}
                            className="px-6 py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors whitespace-nowrap"
                        >
                            Generate Analysis
                        </button>
                    )}
                </div>

                {isLoadingFeedback && (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
                        <Spinner />
                        <p>Analyzing your answers...</p>
                    </div>
                )}

                {feedback && (
                    <div className="animate-fade-in bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                        <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm text-justify">
                            {renderTextWithBold(feedback)}
                        </div>
                    </div>
                )}
                
                {feedbackError && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-center text-sm font-medium">
                        {feedbackError}
                        <button onClick={handleGetFeedback} className="block w-full mt-2 text-indigo-600 underline">Retry</button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ScoreScreen;
