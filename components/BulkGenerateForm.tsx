import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Question, QuestionLevel, SUBTOPIC_SUGGESTIONS, SUBTOPIC_HIERARCHY } from '../types';
import Icon from './Icon';
import Spinner from './Spinner';
import { generateMcqsFromText } from '../services/geminiService';

interface BulkGenerateFormProps {
  onCancel: () => void;
  onAddQuestions: (questions: Omit<Question, 'id' | 'created_at'>[]) => void;
  disabled?: boolean;
  existingQuestions: Question[];
  initialLevel?: QuestionLevel | null;
}

const BulkGenerateForm: React.FC<BulkGenerateFormProps> = ({ onCancel, onAddQuestions, disabled, existingQuestions, initialLevel }) => {
  // Input Mode: 'text' or 'pdf'
  const [inputMode, setInputMode] = useState<'text' | 'pdf'>('text');
  
  const [rawText, setRawText] = useState('');
  const [pdfFile, setPdfFile] = useState<{ data: string, name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [level, setLevel] = useState<QuestionLevel>(initialLevel || QuestionLevel.DEGREE);
  
  // Persistent State Logic
  const [examName, setExamName] = useState(() => localStorage.getItem('last_exam_name') || '');
  const [codePrefix, setCodePrefix] = useState(() => localStorage.getItem('last_code_prefix') || '');
  const [subtopic, setSubtopic] = useState(() => localStorage.getItem('last_subtopic') || '');
  const [specificTopic, setSpecificTopic] = useState(() => localStorage.getItem('last_specific_topic') || '');
  
  const [generatedQuestions, setGeneratedQuestions] = useState<Omit<Question, 'id' | 'created_at'>[]>([]);
  const [studyNotes, setStudyNotes] = useState<string>('');
  const [detectedTopic, setDetectedTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Preview Mode State
  const [previewTab, setPreviewTab] = useState<'questions' | 'notes'>('questions');

  // Autocomplete States
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
      if (initialLevel) {
          setLevel(initialLevel);
      }
  }, [initialLevel]);

  // Check if we are in the specific Topic Generator flow
  const isFixedTopicMode = initialLevel === QuestionLevel.TOPIC;
  const isTopicMode = level === QuestionLevel.TOPIC;

  // Persist inputs to localStorage whenever they change
  useEffect(() => { localStorage.setItem('last_exam_name', examName); }, [examName]);
  useEffect(() => { localStorage.setItem('last_code_prefix', codePrefix); }, [codePrefix]);
  useEffect(() => { localStorage.setItem('last_subtopic', subtopic); }, [subtopic]);
  useEffect(() => { localStorage.setItem('last_specific_topic', specificTopic); }, [specificTopic]);

  // Restrict subtopics for OTHERS and TECHNICAL levels
  const isSubtopicRestricted = level === QuestionLevel.OTHERS || level === QuestionLevel.TECHNICAL;

  // Derived available specific topics based on selected subtopic
  const availableSpecificTopics = useMemo(() => {
      if (!subtopic || subtopic === 'General') return [];
      return SUBTOPIC_HIERARCHY[subtopic] || [];
  }, [subtopic]);

  // Reset specific topic if subtopic changes to something incompatible
  useEffect(() => {
      if (subtopic && availableSpecificTopics.length > 0) {
          if (!availableSpecificTopics.includes(specificTopic) && specificTopic !== '') {
             // Optional: Reset specific topic if it doesn't match new list
             // setSpecificTopic(''); 
          }
      }
  }, [subtopic, availableSpecificTopics, specificTopic]);


  // Close suggestions when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
              setShowSuggestions(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter existing exams for autocomplete
  const examSuggestions = useMemo(() => {
      if (!examName.trim()) return [];
      const uniqueExams = new Set<string>();
      existingQuestions
        .filter(q => q.level === level) // Filter by current level to show relevant suggestions
        .forEach(q => {
          if (q.name) uniqueExams.add(q.name);
        });
      
      return Array.from(uniqueExams)
          .filter(name => name.toLowerCase().includes(examName.toLowerCase()))
          .slice(0, 5); // Limit to 5 suggestions
  }, [examName, existingQuestions, level]);

  // Render LaTeX in preview
  useEffect(() => {
    if ((generatedQuestions.length > 0 || studyNotes) && previewRef.current && (window as any).renderMathInElement) {
         (window as any).renderMathInElement(previewRef.current, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false
        });
    }
  }, [generatedQuestions, studyNotes, previewTab]);

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

  const renderPreviewText = (text: string) => {
    const processed = processLatex(text);
    const parts = processed.split(/(\*\*.*?\*\*)/g).filter(part => part !== '');
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
    });
  };

  const extractPrefix = (code: string | undefined) => {
      if (!code) return '';
      return code.split('-').slice(0, -1).join('-') || code.split('-')[0];
  }

  const handleSelectExam = (selectedName: string) => {
      setExamName(selectedName);
      setShowSuggestions(false);

      // Find a reference question to auto-fill other fields
      const refQuestion = existingQuestions.find(q => q.name === selectedName && q.level === level);
      if (refQuestion) {
          if (refQuestion.level === QuestionLevel.OTHERS || refQuestion.level === QuestionLevel.TECHNICAL) {
              setSubtopic('General');
          } else if (refQuestion.level !== QuestionLevel.TOPIC) {
              setSubtopic('');
          }

          const prefix = extractPrefix(refQuestion.code);
          if (prefix) setCodePrefix(prefix);
      }
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newLevel = e.target.value as QuestionLevel;
      setLevel(newLevel);
      if (newLevel === QuestionLevel.OTHERS || newLevel === QuestionLevel.TECHNICAL) {
          setSubtopic('General');
      } else {
          // If switching away from Restricted, ensure we unlock/reset to Auto-detect
          if (subtopic === 'General') setSubtopic('');
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          if (file.size > 5 * 1024 * 1024) { // 5MB Limit
              setError("File size exceeds 5MB limit. Please upload a smaller PDF.");
              setPdfFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
              return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
              const base64Data = base64String.split(',')[1];
              setPdfFile({ data: base64Data, name: file.name });
              setError('');
          };
          reader.readAsDataURL(file);
      }
  };

  const checkDuplicate = (newQ: Omit<Question, 'id' | 'created_at'>) => {
      // 1. Check against DB questions
      const isDbDuplicate = existingQuestions.some(existing => 
          existing.question.trim().toLowerCase() === newQ.question.trim().toLowerCase() ||
          // Fuzzy check: if 80% of start matches
          (existing.question.length > 50 && newQ.question.length > 50 && existing.question.substring(0, 50) === newQ.question.substring(0, 50))
      );
      
      return isDbDuplicate;
  };

  const handleGenerate = async () => {
    // Logic to handle code prefix
    let activeCodePrefix = codePrefix;
    
    if (isTopicMode) {
        // Auto-generate prefix from Exam Name (Main Topic)
        const sanitized = examName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
        activeCodePrefix = sanitized || 'TOPIC';
    }

    if (!examName.trim() || (!isTopicMode && !activeCodePrefix.trim())) {
      setError("Please provide required fields.");
      return;
    }

    let inputData: string | { data: string, mimeType: string };

    if (inputMode === 'text') {
        if (!rawText.trim()) {
            setError("Please paste some text into the content area first.");
            return;
        }
        inputData = rawText;
    } else {
        if (!pdfFile) {
            setError("Please upload a PDF file first.");
            return;
        }
        inputData = { data: pdfFile.data, mimeType: 'application/pdf' };
    }
    
    if(!process.env.API_KEY) {
        setError("AI feature is disabled. API key not provided.");
        return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedQuestions([]);
    setStudyNotes('');
    setDetectedTopic('');

    try {
      // Request more questions (30) to account for duplicate filtering (we want 20)
      // If PDF, limit request to max 30 to not overwhelm model context
      const requestCount = inputMode === 'pdf' ? 30 : 50; 
      
      // Hierarchy Handling for Topic Mode:
      // Level 1: Exam Name (Main Topic)
      // Level 2: Subtopic
      // Level 3: Specific Topic (Name)
      
      let effectiveExamName = examName;
      let effectiveSubtopic = subtopic;
      
      if (isTopicMode) {
          // In Topic Mode, we restructure the data to support 3 levels.
          // DB 'name' field stores -> Specific Topic (Level 3)
          // DB 'subtopic' field stores -> Main Topic > Subtopic (Levels 1 & 2)
          
          // Use a temporary placeholder for Specific Topic if auto-detecting, it will be updated after generation
          effectiveExamName = specificTopic || 'Auto-Detect'; 
          
          // Combine Main and Sub into composite
          const sub = subtopic || 'General';
          effectiveSubtopic = `${examName} > ${sub}`;
      }

      const result = await generateMcqsFromText(
          inputData, 
          level, 
          effectiveExamName, 
          activeCodePrefix, 
          effectiveSubtopic, 
          specificTopic, 
          requestCount
      );

      if (result.questions.length === 0) {
          setError("The AI could not generate questions. Try providing more detailed content.");
      } else {
          // If we were auto-detecting specific topic, update the question names now
          let generatedQs = result.questions;
          if (isTopicMode && !specificTopic) {
             const finalSpecificTopic = result.detectedTopic || 'Generated Set';
             generatedQs = generatedQs.map(q => ({
                 ...q,
                 name: finalSpecificTopic // Update Name to Specific Topic
             }));
             setDetectedTopic(finalSpecificTopic);
          } else if (isTopicMode) {
             setDetectedTopic(specificTopic);
          }

          // Filter Duplicates
          const uniqueNewQuestions = generatedQs.filter(newQ => !checkDuplicate(newQ));
          
          const duplicateCount = generatedQs.length - uniqueNewQuestions.length;
          
          if (uniqueNewQuestions.length === 0) {
              setError(`Generated ${generatedQs.length} questions, but ALL were duplicates of existing questions in the database.`);
          } else {
              // Limit to 20 if PDF mode per requirements, otherwise take all unique
              const finalQuestions = inputMode === 'pdf' ? uniqueNewQuestions.slice(0, 20) : uniqueNewQuestions;
              
              setGeneratedQuestions(finalQuestions);
              setStudyNotes(result.studyNotes);
              if (!isTopicMode) setDetectedTopic(result.detectedTopic);
              setPreviewTab('questions');
              
              if (duplicateCount > 0) {
                  console.info(`Filtered out ${duplicateCount} duplicate questions.`);
              }
          }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddAll = () => {
    onAddQuestions(generatedQuestions);
  };
  
  const handleCopyNotes = () => {
      navigator.clipboard.writeText(studyNotes);
      alert("Study notes copied to clipboard!");
  }

  const inputClass = "mt-1 block w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white outline-none placeholder-slate-400";
  const labelClass = "block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg p-8 animate-fade-in space-y-8 border border-slate-200 dark:border-slate-800">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-3">
         <div className={`p-2 rounded-xl flex items-center justify-center ${isTopicMode ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'}`}>
            <Icon name={isTopicMode ? "lightBulb" : "sparkles"} className="w-6 h-6" />
         </div>
         <div>
            <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">
                {isTopicMode ? "Topic Generator" : "Bulk AI Generator"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Generate questions and study notes from your study material.</p>
         </div>
      </div>

      <div className="space-y-5">
         {!isFixedTopicMode && (
         <div>
            <label htmlFor="level" className={labelClass}>Type / Level <span className="text-rose-500">*</span></label>
            <select
                id="level"
                name="level"
                value={level}
                onChange={handleLevelChange}
                required
                className={inputClass}
            >
                {Object.values(QuestionLevel).map(levelValue => (
                    <option key={levelValue} value={levelValue}>{levelValue}</option>
                ))}
            </select>
        </div>
        )}
        <div className={`grid grid-cols-1 ${!isTopicMode ? 'sm:grid-cols-2' : ''} gap-4`}>
            <div className="relative" ref={suggestionsRef}>
                <label htmlFor="examName" className={labelClass}>
                    {isTopicMode ? "Main Topic / Subject" : "Exam Name"} <span className="text-rose-500">*</span>
                </label>
                <input 
                    type="text" 
                    name="examName" 
                    id="examName" 
                    value={examName} 
                    onChange={(e) => {
                        setExamName(e.target.value);
                        setShowSuggestions(true);
                    }} 
                    onFocus={() => setShowSuggestions(true)}
                    required 
                    className={inputClass} 
                    placeholder={isTopicMode ? "e.g., Biology" : "e.g., Kerala History"}
                    autoComplete="off"
                />
                {/* Autocomplete Dropdown */}
                {showSuggestions && examSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-auto">
                        {examSuggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectExam(suggestion)}
                                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {!isTopicMode && (
            <div>
                <label htmlFor="codePrefix" className={labelClass}>
                    Question Code <span className="text-rose-500">*</span>
                </label>
                <input type="text" name="codePrefix" id="codePrefix" value={codePrefix} onChange={(e) => setCodePrefix(e.target.value)} required className={inputClass} placeholder="e.g. GK-KER"/>
            </div>
            )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
                <label htmlFor="subtopic" className={labelClass}>{isTopicMode ? "Subtopic" : "Subtopic"}</label>
                <div className="relative">
                    <select
                        id="subtopic"
                        name="subtopic"
                        value={subtopic}
                        onChange={(e) => {
                            setSubtopic(e.target.value);
                            // If user selects a subtopic that has specific topics, clear the specific topic field if it's invalid
                            setSpecificTopic(''); 
                        }}
                        className={`${inputClass} ${isSubtopicRestricted ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed' : ''}`}
                        disabled={isSubtopicRestricted}
                    >
                        <option value="">Auto-detect (Per Question)</option>
                        <option value="General">General</option>
                        {SUBTOPIC_SUGGESTIONS.map(suggestion => (
                            <option key={suggestion} value={suggestion}>{suggestion}</option>
                        ))}
                    </select>
                    {isSubtopicRestricted && (
                        <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none" title="Subtopic disabled for this level">
                            <Icon name="lock" className="w-4 h-4 text-slate-400" />
                        </div>
                    )}
                </div>
            </div>
             <div>
                <label htmlFor="specificTopic" className={labelClass}>
                    Specific Topic <span className="text-slate-400 font-normal normal-case">(Optional Context)</span>
                </label>
                {availableSpecificTopics.length > 0 ? (
                    <select
                        name="specificTopic"
                        id="specificTopic"
                        value={specificTopic}
                        onChange={(e) => setSpecificTopic(e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Auto-detect from content</option>
                        {availableSpecificTopics.map((topic, idx) => (
                            <option key={idx} value={topic}>{topic}</option>
                        ))}
                    </select>
                ) : (
                    <input 
                        type="text" 
                        name="specificTopic" 
                        id="specificTopic" 
                        value={specificTopic} 
                        onChange={(e) => setSpecificTopic(e.target.value)} 
                        className={inputClass} 
                        placeholder={isTopicMode ? "Leave empty to auto-detect" : "Leave empty to auto-detect"}
                    />
                )}
            </div>
        </div>
        
        {/* Input Method Switcher */}
        <div className="mt-6">
            <div className="flex items-center gap-6 mb-3 border-b border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => setInputMode('text')}
                    className={`pb-2 text-sm font-bold transition-all border-b-2 ${inputMode === 'text' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}
                >
                    Paste Text
                </button>
                <button
                    onClick={() => setInputMode('pdf')}
                    className={`pb-2 text-sm font-bold transition-all border-b-2 ${inputMode === 'pdf' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}
                >
                    Upload PDF
                </button>
            </div>
            
            {inputMode === 'text' ? (
                <div>
                  <textarea
                    id="rawText"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste content here... (Provide enough text for as many questions as possible)"
                    rows={8}
                    className={inputClass}
                    disabled={isGenerating}
                  />
                </div>
            ) : (
                <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center transition-all hover:border-indigo-400 dark:hover:border-indigo-600">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden" 
                        id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm text-indigo-500 dark:text-indigo-400">
                             {pdfFile ? <Icon name="documentText" className="w-8 h-8" /> : <Icon name="upload" className="w-8 h-8" />}
                        </div>
                        {pdfFile ? (
                             <>
                                <p className="font-bold text-slate-800 dark:text-white mb-1">{pdfFile.name}</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Ready to process</p>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setPdfFile(null);
                                        if(fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="mt-4 text-xs text-rose-500 hover:underline"
                                >
                                    Remove File
                                </button>
                             </>
                        ) : (
                             <>
                                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Click to upload PDF</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                                    Maximum file size: 5MB. Files are processed in-memory and not stored on the server.
                                </p>
                             </>
                        )}
                    </label>
                </div>
            )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || disabled || (inputMode === 'pdf' && !pdfFile) || (inputMode === 'text' && !rawText)}
            className={`${isTopicMode ? 'bg-sky-600 hover:bg-sky-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 text-sm`}
          >
            {isGenerating ? <Spinner /> : <Icon name="sparkles" className="w-4 h-4" />}
            {isGenerating ? `Analyzing & Generating...` : `Generate Questions`}
          </button>
        </div>
        {error && <p className="text-rose-600 font-medium text-sm bg-rose-50 p-3 rounded-lg">{error}</p>}
      </div>
      
      {/* Generated Content Section */}
      {(generatedQuestions.length > 0 || studyNotes) && (
          <div className="space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
                 <div>
                     <h4 className="text-lg font-bold text-slate-900 dark:text-white">Generated Output</h4>
                     {detectedTopic && (
                         <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                             Detected Topic: <span className="font-bold">{detectedTopic}</span>
                         </p>
                     )}
                 </div>
                 {/* Tabs */}
                 <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                     <button 
                        onClick={() => setPreviewTab('questions')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${previewTab === 'questions' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                     >
                         Questions ({generatedQuestions.length})
                     </button>
                     <button 
                        onClick={() => setPreviewTab('notes')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${previewTab === 'notes' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                     >
                         Study Notes
                     </button>
                 </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
                {previewTab === 'questions' ? (
                     <ul ref={previewRef} className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {generatedQuestions.map((q, index) => (
                            <li key={index} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{q.code}</span>
                                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">{q.subtopic}</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{q.name}</span>
                                </div>
                                <p className="font-medium text-sm mb-3 text-slate-800 dark:text-slate-200 text-justify">{renderPreviewText(q.question)}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                <strong className="text-emerald-700 dark:text-emerald-400">Ans:</strong> {processLatex(q.options[q.correct_answer_index])}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="relative">
                        <div ref={previewRef as any} className="max-h-96 overflow-y-auto pr-4 custom-scrollbar p-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed prose dark:prose-invert max-w-none">
                            {studyNotes || "No notes available."}
                        </div>
                        <button 
                            onClick={handleCopyNotes}
                            className="absolute top-2 right-2 p-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Copy Notes"
                        >
                            <Icon name="clipboardList" className="w-5 h-5"/>
                        </button>
                    </div>
                )}
            </div>

             <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="py-3 px-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                >
                    Discard
                </button>
                <button
                    onClick={handleAddAll}
                    disabled={disabled || generatedQuestions.length === 0}
                    className="bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50 text-sm"
                >
                    <Icon name="check" className="w-4 h-4"/>
                    Save Questions
                </button>
            </div>
          </div>
      )}
    </div>
  );
};

export default BulkGenerateForm;