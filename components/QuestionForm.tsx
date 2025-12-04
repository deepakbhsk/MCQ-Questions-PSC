
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Question, QuestionLevel, SUBTOPIC_SUGGESTIONS, HISTORY_SYLLABUS } from '../types';
import Icon from './Icon';
import Spinner from './Spinner';
import { generateQuestionWithAi, getExplanationWithAi, solveQuestionWithAi } from '../services/geminiService';

interface QuestionFormProps {
  onSubmit: (question: Omit<Question, 'id' | 'created_at'> | Question) => void;
  onCancel: () => void;
  initialData?: Question | null;
  disabled?: boolean;
  existingQuestions?: Question[];
}

const emptyQuestion: Omit<Question, 'id' | 'created_at'> = {
  level: QuestionLevel.DEGREE,
  code: '',
  name: '',
  subtopic: '',
  question: '',
  options: ['', '', '', ''],
  correct_answer_index: 0,
  explanation: '',
};

const QuestionForm: React.FC<QuestionFormProps> = ({ onSubmit, onCancel, initialData, disabled, existingQuestions = [] }) => {
  const [formData, setFormData] = useState<Omit<Question, 'id' | 'created_at'> | Question>(initialData || emptyQuestion);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  
  // State for explanation regeneration and solving
  const [isRegeneratingExpl, setIsRegeneratingExpl] = useState(false);
  const [isSolving, setIsSolving] = useState(false);

  // Autocomplete States
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showSubtopicSuggestions, setShowSubtopicSuggestions] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const subtopicInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFormData(initialData || emptyQuestion);
  }, [initialData]);

  // Close autocomplete on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
            setShowNameSuggestions(false);
            setShowSubtopicSuggestions(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(formData.options || ['', '', '', ''])];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };
  
  const handleCorrectAnswerChange = (index: number) => {
      setFormData({...formData, correct_answer_index: index});
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleGenerateWithAi = async () => {
    if (!aiTopic.trim()) {
        setAiError("Please enter a topic.");
        return;
    }
    if(!process.env.API_KEY) {
        setAiError("AI feature is disabled. API key not provided.");
        return;
    }

    setIsGenerating(true);
    setAiError('');
    try {
        const generatedQuestion = await generateQuestionWithAi(aiTopic);
        setFormData(prev => ({ 
            ...(prev as Omit<Question, 'id' | 'created_at'>),
            ...generatedQuestion, 
            explanation: '' 
        }));
    } catch (error) {
        setAiError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleRegenerateExplanation = async () => {
      if (!formData.question || !formData.options || formData.options.length < 2) {
          alert("Please ensure the Question and Options are filled out before generating an explanation.");
          return;
      }
      if(!process.env.API_KEY) {
          alert("AI feature is disabled. API key not provided.");
          return;
      }

      setIsRegeneratingExpl(true);
      try {
          // Construct a temporary question object to send to the service
          const tempQuestion = {
              ...formData,
              id: 'temp',
              created_at: new Date().toISOString()
          } as Question;

          const explanation = await getExplanationWithAi(tempQuestion);
          setFormData(prev => ({ ...prev, explanation }));
      } catch (error) {
          console.error(error);
          alert("Failed to regenerate explanation.");
      } finally {
          setIsRegeneratingExpl(false);
      }
  };

  const handleSolveWithAi = async () => {
      if (!formData.question || !formData.options || formData.options.length < 2) {
          alert("Please ensure the Question and Options are filled out.");
          return;
      }
      if(!process.env.API_KEY) {
          alert("AI feature is disabled.");
          return;
      }

      setIsSolving(true);
      try {
          const result = await solveQuestionWithAi(formData.question, formData.options);
          setFormData(prev => ({
              ...prev,
              correct_answer_index: result.correct_answer_index,
              explanation: result.explanation
          }));
      } catch (error) {
          console.error(error);
          alert("Failed to solve question.");
      } finally {
          setIsSolving(false);
      }
  };

  // Autocomplete Logic
  const nameSuggestions = useMemo(() => {
    const query = (formData.name || '').toLowerCase();
    const uniqueNames = new Set<string>();
    existingQuestions
        .filter(q => q.level === formData.level) // Filter by current level
        .forEach(q => { if(q.name) uniqueNames.add(q.name); });
    
    return Array.from(uniqueNames)
        .filter(name => name.toLowerCase().includes(query))
        .slice(0, 5);
  }, [existingQuestions, formData.name, formData.level]);

  const subtopicSuggestions = useMemo(() => {
    const query = (formData.subtopic || '').toLowerCase();
    const uniqueSubs = new Set<string>();
    
    // Suggest based on currently selected Name/Exam if possible, otherwise global for level
    const contextQuestions = existingQuestions.filter(q => 
        q.level === formData.level && 
        (!formData.name || q.name === formData.name)
    );

    contextQuestions.forEach(q => { if(q.subtopic && q.subtopic !== 'General') uniqueSubs.add(q.subtopic); });
    
    // Add default suggestions if list is empty or generic
    if (formData.level !== QuestionLevel.TOPIC) {
        SUBTOPIC_SUGGESTIONS.forEach(s => uniqueSubs.add(s));
    }
    
    // Add detailed history syllabus
    HISTORY_SYLLABUS.forEach(s => uniqueSubs.add(s));

    return Array.from(uniqueSubs)
        .filter(sub => sub.toLowerCase().includes(query))
        .slice(0, 5);
  }, [existingQuestions, formData.subtopic, formData.level, formData.name]);

  const inputClass = "mt-1 block w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white outline-none placeholder-slate-400";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1";
  
  const isTopicMode = formData.level === QuestionLevel.TOPIC;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 animate-fade-in border border-slate-200 dark:border-slate-800">
      <h3 className="text-xl font-bold mb-8 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
          {initialData ? 'Edit Question' : 'New Question'}
          {isTopicMode && <span className="ml-2 text-sky-600 text-sm font-medium bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 rounded-full border border-sky-100 dark:border-sky-800">Topic Wise</span>}
      </h3>
      
       <div className="mb-10 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
            <label htmlFor="ai-topic" className="block text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-2">
                <Icon name="sparkles" className="w-4 h-4 text-indigo-500"/>
                Auto-Generate with AI
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    id="ai-topic"
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g., Indian Constitution basics"
                    className="flex-grow px-4 py-2.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-400"
                />
                <button
                    type="button"
                    onClick={handleGenerateWithAi}
                    disabled={isGenerating}
                    className="bg-indigo-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {isGenerating ? <Spinner /> : 'Generate'}
                </button>
            </div>
            {aiError && <p className="text-rose-600 text-xs font-medium mt-3">{aiError}</p>}
        </div>

      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
        <div>
            <label htmlFor="level" className={labelClass}>Level</label>
            <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
                className={inputClass}
            >
                {Object.values(QuestionLevel).map(level => (
                    <option key={level} value={level}>{level}</option>
                ))}
            </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5" ref={suggestionsRef}>
            <div>
                <label htmlFor="code" className={labelClass}>Code</label>
                <input type="text" name="code" id="code" value={formData.code || ''} onChange={handleChange} className={inputClass} placeholder={isTopicMode ? "e.g. BIO-001" : "e.g. GK-001"}/>
            </div>
            
            {/* Name/Exam Field with Autocomplete */}
            <div className="relative">
                <label htmlFor="name" className={labelClass}>{isTopicMode ? "Main Subject" : "Exam Name"}</label>
                <input 
                    type="text" 
                    name="name" 
                    id="name" 
                    ref={nameInputRef}
                    value={formData.name || ''} 
                    onChange={(e) => {
                        handleChange(e);
                        setShowNameSuggestions(true);
                    }}
                    onFocus={() => setShowNameSuggestions(true)}
                    className={inputClass} 
                    placeholder={isTopicMode ? "e.g. History" : "e.g. LDC 2024"}
                    autoComplete="off"
                />
                {showNameSuggestions && nameSuggestions.length > 0 && (
                     <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-auto">
                         {nameSuggestions.map((suggestion, idx) => (
                             <button
                                 key={idx}
                                 type="button"
                                 onClick={() => {
                                     setFormData(prev => ({ ...prev, name: suggestion }));
                                     setShowNameSuggestions(false);
                                 }}
                                 className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                             >
                                 {suggestion}
                             </button>
                         ))}
                     </div>
                )}
            </div>

            {/* Subtopic Field with Autocomplete */}
            <div className="relative">
                <label htmlFor="subtopic" className={labelClass}>{isTopicMode ? "Topic / Subtopic" : "Subtopic"}</label>
                <div className="relative">
                    <input
                        type="text"
                        name="subtopic"
                        id="subtopic"
                        ref={subtopicInputRef}
                        value={formData.subtopic || ''}
                        onChange={(e) => {
                            handleChange(e);
                            setShowSubtopicSuggestions(true);
                        }}
                        onFocus={() => setShowSubtopicSuggestions(true)}
                        className={inputClass}
                        placeholder={isTopicMode ? "e.g. Ancient India" : "Select or Type Subtopic"}
                        autoComplete="off"
                    />
                    {/* Autocomplete Dropdown for Subtopic */}
                    {showSubtopicSuggestions && subtopicSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-auto">
                            {subtopicSuggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, subtopic: suggestion }));
                                        setShowSubtopicSuggestions(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
        <div>
          <label htmlFor="question" className={labelClass}>Question</label>
          <textarea
            id="question"
            name="question"
            value={formData.question}
            onChange={handleChange}
            required
            rows={3}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Options</label>
          <div className="space-y-3 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 mt-2">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-4">
                 <div className="flex items-center h-full pt-1">
                     <input 
                        type="radio" 
                        name="correctAnswer" 
                        id={`option-radio-${index}`}
                        checked={formData.correct_answer_index === index} 
                        onChange={() => handleCorrectAnswerChange(index)} 
                        className="h-5 w-5 text-emerald-500 border-slate-300 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                    />
                 </div>
                <div className="flex-1">
                    <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-400 font-bold text-xs">{String.fromCharCode(65 + index)}</span>
                        </div>
                        <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        required
                        className="block w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-sm outline-none transition-all"
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        />
                    </div>
                </div>
              </div>
            ))}
          </div>
          {formData.correct_answer_index === -1 && (
              <div className="mt-3 text-amber-600 dark:text-amber-500 text-xs font-bold flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-800">
                  <Icon name="lightning" className="w-4 h-4" />
                  Answer not yet identified. Use "Solve & Explain" below or select manually.
              </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap justify-between items-end mb-1 gap-2">
             <label htmlFor="explanation" className={labelClass}>Explanation</label>
             <div className="flex items-center gap-2">
                 {/* Solve Button */}
                 <button
                    type="button"
                    onClick={handleSolveWithAi}
                    disabled={isSolving}
                    className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                    title="Find the correct answer and explanation for this specific question"
                 >
                     {isSolving ? <Spinner /> : <Icon name="checkCircle" className="w-3 h-3" />}
                     Solve & Explain
                 </button>
                 
                 {/* Regenerate Explanation Only */}
                 <button
                    type="button"
                    onClick={handleRegenerateExplanation}
                    disabled={isRegeneratingExpl}
                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors px-2 py-1.5"
                    title="Generate explanation based on the current question text and options"
                 >
                     {isRegeneratingExpl ? <Spinner /> : <Icon name="sparkles" className="w-3 h-3" />}
                     Regenerate
                 </button>
             </div>
          </div>
          <textarea
            id="explanation"
            name="explanation"
            value={formData.explanation || ''}
            onChange={handleChange}
            rows={4}
            className={inputClass}
            placeholder="Detailed explanation..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-8 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="py-3 px-8 bg-indigo-600 text-white rounded-xl shadow-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {initialData ? 'Save Changes' : 'Create Question'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;
