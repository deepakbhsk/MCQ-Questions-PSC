
import React, { useState } from 'react';
import { Question, QuestionLevel } from '../types';
import Spinner from './Spinner';
import { extractRawQuestionsFromText, solveQuestionWithAi } from '../services/geminiService';

interface BulkGenerateFormProps {
  onCancel: () => void;
  onAddQuestions: (questions: Omit<Question, 'id' | 'created_at'>[]) => void;
  existingQuestions: Question[];
  initialLevel: QuestionLevel | null;
}

const BulkGenerateForm: React.FC<BulkGenerateFormProps> = ({
  onCancel,
  onAddQuestions,
}) => {
  const [rawText, setRawText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<Omit<Question, 'id' | 'created_at'>[]>([]);
  const [currentExtraction, setCurrentExtraction] = useState<Omit<Question, 'id' | 'created_at'> | null>(null);

  const handleAnalyze = async () => {
    if (!rawText.trim()) return;
    setIsAnalyzing(true);
    try {
        const questions = await extractRawQuestionsFromText(rawText);
        if (questions.length > 0) {
            // Take the first one for detailed review/solving, add others to batch immediately?
            // Or just add all to batch and let user review them in the preview?

            // To follow the design, let's "solve" the first one to show it in the results section
            const solved = await solveQuestionWithAi(questions[0].question, questions[0].options);

            const fullQuestion: Omit<Question, 'id' | 'created_at'> = {
                question: questions[0].question,
                options: questions[0].options,
                correct_answer_index: solved.correct_answer_index,
                explanation: solved.explanation,
                level: QuestionLevel.DEGREE, // Default
                subtopic: "General",
                name: "AI Extracted Set"
            };
            
            setCurrentExtraction(fullQuestion);
            
            // Add the rest to batch if any
            if (questions.length > 1) {
                const others = questions.slice(1).map(q => ({
                    question: q.question,
                    options: q.options,
                    correct_answer_index: -1, // Unsolved
                    level: QuestionLevel.DEGREE,
                    subtopic: "General",
                    name: "AI Extracted Set"
                }));
                setExtractedQuestions(prev => [...others, ...prev]);
            }
        }
    } catch (error) {
        console.error("AI Extraction failed", error);
        alert("Failed to extract questions. Please try again.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleAddToBatch = () => {
      if (currentExtraction) {
          setExtractedQuestions([currentExtraction, ...extractedQuestions]);
          setCurrentExtraction(null);
          setRawText('');
      }
  };

  const handleFinalize = () => {
      onAddQuestions(extractedQuestions);
  };

  const glassInputClass = "glass-input w-full px-4 py-3 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
        <div className="flex-1 flex flex-col md:flex-row gap-8">
            {/* Left Column: Input & AI Canvas */}
            <div className="flex-[1.5] space-y-8 pb-12">
                <section className="space-y-6">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold text-white tracking-tight">AI Question Creator</h2>
                        <p className="text-slate-400 text-sm">Fill metadata and use AI to extract question details automatically.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Question Paper Code</label>
                            <div className="relative">
                                <input className={glassInputClass} placeholder="e.g., 045/2023" type="text"/>
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold uppercase rounded-lg hover:bg-primary/30 transition-all">
                                    Fetch
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Department</label>
                            <input className={glassInputClass} placeholder="e.g., Kerala Police" type="text"/>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">AI Input Canvas</label>
                        <div className="relative group">
                            <textarea
                                className={`${glassInputClass} min-h-[160px] p-6 resize-none`}
                                placeholder="Paste raw question text here... (e.g. 1. Who founded Sahodara Sangham? A. K. Ayyappan B. C. Kesavan...)"
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            ></textarea>
                            <div className={`absolute bottom-4 right-4 flex items-center gap-2 transition-opacity ${rawText ? 'opacity-100' : 'opacity-0'}`}>
                                <span className="text-[10px] text-slate-500 font-medium">Click to Process</span>
                                <button 
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing}
                                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                                >
                                    {isAnalyzing ? <Spinner /> : <span className="material-symbols-outlined text-[16px]">auto_awesome</span>}
                                    {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Results Section */}
                {currentExtraction && (
                    <section className="glass-panel rounded-2xl p-6 space-y-6 border-primary/30 bg-primary/5 animate-slide-up">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Suggestions</h3>
                            </div>
                            <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold rounded-full">98% Confidence</span>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-500 px-1">Extracted Question</p>
                                <p className="text-white text-base leading-relaxed font-medium">{currentExtraction.question}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {currentExtraction.options.map((opt, i) => (
                                    <div key={i} className={`p-4 rounded-xl border flex items-center gap-3 ${i === currentExtraction.correct_answer_index ? 'border-primary/30 bg-primary/10' : 'border-white/5 bg-white/5'}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${i === currentExtraction.correct_answer_index ? 'bg-primary' : 'bg-slate-700'}`}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <span className={`text-sm font-medium ${i === currentExtraction.correct_answer_index ? 'text-white' : 'text-slate-300'}`}>{opt}</span>
                                        {i === currentExtraction.correct_answer_index && (
                                            <span className="material-symbols-outlined text-emerald-500 ml-auto text-lg">check_circle</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-slate-500 px-1">Explanation & Context</label>
                                    <button className="text-[10px] text-primary font-bold hover:underline">Edit Explanation</button>
                                </div>
                                <div className="p-4 glass-input rounded-xl">
                                    <p className="text-sm text-slate-300 leading-relaxed italic">{currentExtraction.explanation}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 pt-2">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-slate-500 px-1 mb-2">Subject Category</p>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold">{currentExtraction.name}</span>
                                        <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold">{currentExtraction.subtopic}</span>
                                        <button className="material-symbols-outlined text-slate-500 hover:text-white text-[20px] transition-colors">add_circle</button>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleAddToBatch}
                                    className="mt-auto px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95"
                                >
                                    Add to Batch
                                    <span className="material-symbols-outlined text-[18px]">send</span>
                                </button>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Right Column: List Preview */}
            <div className="flex-1 max-w-md flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Batch Preview</h3>
                    <span className="text-xs font-medium text-slate-400">{extractedQuestions.length} Questions</span>
                </div>
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[600px]">
                    {extractedQuestions.map((q, idx) => (
                        <div key={idx} className="glass-panel p-5 rounded-2xl group relative hover:border-white/20 transition-all animate-slide-up">
                            <button className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                            <div className="flex items-start justify-between mb-3">
                                <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Q. {extractedQuestions.length - idx}</span>
                                <span className="text-[10px] text-slate-500 font-medium">Extracted</span>
                            </div>
                            <p className="text-sm text-white font-medium line-clamp-2 leading-relaxed mb-4">{q.question}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                    <span className="text-[11px] font-bold text-primary uppercase">{q.subtopic}</span>
                                </div>
                                <button className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                                    Details <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    {extractedQuestions.length === 0 && (
                        <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
                            <p className="text-slate-500 text-sm italic">Analyze text to add questions here.</p>
                        </div>
                    )}
                </div>

                {/* Batch Summary Footer */}
                {extractedQuestions.length > 0 && (
                    <div className="mt-auto glass-panel p-6 rounded-2xl border-emerald-500/20 bg-emerald-500/5 sticky bottom-0">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Batch Progress</span>
                            <span className="text-xs font-bold text-emerald-400">Ready to Publish</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="w-full h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        </div>
                        <button
                            onClick={handleFinalize}
                            className="w-full mt-6 py-3 bg-white text-background-dark font-bold text-sm rounded-xl hover:bg-slate-200 transition-all active:scale-95 shadow-lg"
                        >
                            Finalize & Publish Batch
                        </button>
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-center">
            <button onClick={onCancel} className="text-slate-500 hover:text-white font-medium transition-colors text-sm">
                Cancel and Return
            </button>
        </div>
    </div>
  );
};

export default BulkGenerateForm;
