
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Question, QuestionLevel, SUBTOPIC_SUGGESTIONS, SUBTOPIC_HIERARCHY } from '../types';
import Icon from './Icon';
import Spinner from './Spinner';
import { generateMcqsFromText, extractRawQuestionsFromText } from '../services/geminiService';

interface BulkGenerateFormProps {
  onCancel: () => void;
  onAddQuestions: (questions: Omit<Question, 'id' | 'created_at'>[]) => void;
  disabled?: boolean;
  existingQuestions: Question[];
  initialLevel?: QuestionLevel | null;
}

const BulkGenerateForm: React.FC<BulkGenerateFormProps> = ({ onCancel, onAddQuestions, disabled, existingQuestions, initialLevel }) => {
  // Input Mode: 'text' or 'pdf' or 'excel'
  const [inputMode, setInputMode] = useState<'text' | 'pdf' | 'excel'>('text');
  
  const [rawText, setRawText] = useState('');
  const [pdfFile, setPdfFile] = useState<{ data: string, name: string } | null>(null);
  const [excelFile, setExcelFile] = useState<{ name: string, data: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

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
  const [isExtracting, setIsExtracting] = useState(false); // For "Extract Only" mode
  const [error, setError] = useState('');
  
  // Preview Mode State
  const [previewTab, setPreviewTab] = useState<'questions' | 'notes'>('questions');

  // Autocomplete States
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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
         setTimeout(() => {
            if (previewRef.current) {
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
         }, 100);
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
              const base64Data = base64String.split(',')[1];
              setPdfFile({ data: base64Data, name: file.name });
              setError('');
          };
          reader.readAsDataURL(file);
      }
  };
  
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = (window as any).XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = (window as any).XLSX.utils.sheet_to_json(sheet);
                    
                    if (jsonData.length === 0) {
                        setError("The Excel file appears to be empty.");
                        setExcelFile(null);
                        return;
                    }
                    
                    setExcelFile({ name: file.name, data: jsonData });
                    setError('');
                } catch (err) {
                    console.error("Excel parse error:", err);
                    setError("Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.");
                }
            };
            
            reader.readAsArrayBuffer(file);
        }
  };
  
  const downloadTemplate = () => {
      const templateData = [
          {
              "Question": "Which is the capital of India?",
              "Option A": "Mumbai",
              "Option B": "Delhi",
              "Option C": "Kolkata",
              "Option D": "Chennai",
              "Answer": "Option B",
              "Explanation": "Delhi is the capital of India."
          },
          {
              "Question": "The largest planet in our solar system is?",
              "Option A": "Mars",
              "Option B": "Jupiter",
              "Option C": "Earth",
              "Option D": "Saturn",
              "Answer": "Jupiter",
              "Explanation": "Jupiter is the largest planet."
          }
      ];
      
      const worksheet = (window as any).XLSX.utils.json_to_sheet(templateData);
      const workbook = (window as any).XLSX.utils.book_new();
      (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
      (window as any).XLSX.writeFile(workbook, "PSC_Questions_Template.xlsx");
  };

  const checkDuplicate = (newQ: Omit<Question, 'id' | 'created_at'>) => {
      const isDbDuplicate = existingQuestions.some(existing => 
          existing.question.trim().toLowerCase() === newQ.question.trim().toLowerCase() ||
          (existing.question.length > 50 && newQ.question.length > 50 && existing.question.substring(0, 50) === newQ.question.substring(0, 50))
      );
      return isDbDuplicate;
  };

  const validateInputs = () => {
    let activeCodePrefix = codePrefix;
    if (isTopicMode) {
        const sanitized = examName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
        activeCodePrefix = sanitized || 'TOPIC';
    }

    if (!examName.trim() || (!isTopicMode && !activeCodePrefix.trim())) {
      setError("Please provide required fields.");
      return null;
    }

    let inputData: any;
    
    if (inputMode === 'excel') {
        if (!excelFile) {
            setError("Please upload an Excel file first.");
            return null;
        }
        inputData = excelFile.data;
    } else if (inputMode === 'text') {
        if (!rawText.trim()) {
            setError("Please paste some text into the content area first.");
            return null;
        }
        inputData = rawText;
    } else {
        if (!pdfFile) {
            setError("Please upload a PDF file first.");
            return null;
        }
        inputData = { data: pdfFile.data, mimeType: 'application/pdf' };
    }
    
    if(!process.env.API_KEY && inputMode !== 'excel') {
        setError("AI feature is disabled. API key not provided.");
        return null;
    }

    let effectiveExamName = examName;
    let effectiveSubtopic = subtopic;
    
    if (isTopicMode) {
        effectiveExamName = specificTopic || 'Auto-Detect'; 
        const sub = subtopic || 'General';
        effectiveSubtopic = `${examName} > ${sub}`;
    }

    return { inputData, activeCodePrefix, effectiveExamName, effectiveSubtopic };
  };
  
  const processExcelData = (data: any[], vars: any) => {
      const questions: Omit<Question, 'id' | 'created_at'>[] = [];
      
      data.forEach((row, index) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
              normalizedRow[key.trim().toLowerCase()] = row[key];
          });
          
          const qText = normalizedRow['question'] || normalizedRow['q'] || normalizedRow['statement'];
          const optA = normalizedRow['option a'] || normalizedRow['a'] || normalizedRow['option 1'];
          const optB = normalizedRow['option b'] || normalizedRow['b'] || normalizedRow['option 2'];
          const optC = normalizedRow['option c'] || normalizedRow['c'] || normalizedRow['option 3'];
          const optD = normalizedRow['option d'] || normalizedRow['d'] || normalizedRow['option 4'];
          const ans = normalizedRow['answer'] || normalizedRow['ans'] || normalizedRow['correct'] || normalizedRow['key'];
          const expl = normalizedRow['explanation'] || normalizedRow['exp'] || normalizedRow['rationale'];
          
          if (qText && optA && optB && optC && optD) {
              const options = [String(optA), String(optB), String(optC), String(optD)];
              let correctIdx = -1;
              
              if (ans) {
                  const ansStr = String(ans).toLowerCase().trim();
                  if (ansStr === 'a' || ansStr === 'option a') correctIdx = 0;
                  else if (ansStr === 'b' || ansStr === 'option b') correctIdx = 1;
                  else if (ansStr === 'c' || ansStr === 'option c') correctIdx = 2;
                  else if (ansStr === 'd' || ansStr === 'option d') correctIdx = 3;
                  else {
                      const idx = options.findIndex(o => o.toLowerCase().trim() === ansStr);
                      if (idx !== -1) correctIdx = idx;
                  }
              }
              
              questions.push({
                  level: level,
                  name: isTopicMode ? (specificTopic || 'Uncategorized') : vars.effectiveExamName,
                  code: `${vars.activeCodePrefix}-${(index + 1).toString().padStart(3, '0')}`,
                  subtopic: vars.effectiveSubtopic || 'General',
                  question: String(qText),
                  options: options,
                  correct_answer_index: correctIdx,
                  explanation: expl ? String(expl) : ''
              });
          }
      });
      
      return questions;
  };

  const handleGenerate = async () => {
    const vars = validateInputs();
    if (!vars) return;
    
    setIsGenerating(true);
    setError('');
    setGeneratedQuestions([]);
    setStudyNotes('');
    setDetectedTopic('');

    try {
      if (inputMode === 'excel') {
          // EXCEL IMPORT FLOW
          const extractedQs = processExcelData(vars.inputData, vars);
          
          if (extractedQs.length === 0) {
              setError("Could not find any valid questions in the Excel file. Please check column headers (Question, Option A, Option B, etc.).");
          } else {
              const uniqueNewQuestions = extractedQs.filter(newQ => !checkDuplicate(newQ));
              if (uniqueNewQuestions.length === 0) {
                   setError(`Found ${extractedQs.length} questions, but ALL were duplicates.`);
              } else {
                   setGeneratedQuestions(uniqueNewQuestions);
                   setPreviewTab('questions');
              }
          }
      } else {
          // AI GENERATION FLOW
          const requestCount = inputMode === 'pdf' ? 30 : 50; 
          
          const result = await generateMcqsFromText(
              vars.inputData, 
              level, 
              vars.effectiveExamName, 
              vars.activeCodePrefix, 
              vars.effectiveSubtopic, 
              specificTopic, 
              requestCount
          );

          if (result.questions.length === 0) {
              setError("The AI could not generate questions. Try providing more detailed content.");
          } else {
              let generatedQs = result.questions;
              if (isTopicMode && !specificTopic) {
                 const finalSpecificTopic = result.detectedTopic || 'Generated Set';
                 generatedQs = generatedQs.map(q => ({
                     ...q,
                     name: finalSpecificTopic
                 }));
                 setDetectedTopic(finalSpecificTopic);
              } else if (isTopicMode) {
                 setDetectedTopic(specificTopic);
              }

              const uniqueNewQuestions = generatedQs.filter(newQ => !checkDuplicate(newQ));
              const duplicateCount = generatedQs.length - uniqueNewQuestions.length;
              
              if (uniqueNewQuestions.length === 0) {
                  setError(`Generated ${generatedQs.length} questions, but ALL were duplicates of existing questions in the database.`);
              } else {
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
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtractOnly = async () => {
    if (inputMode === 'excel') {
        handleGenerate(); // Excel is already "extracted"
        return;
    }

    const vars = validateInputs();
    if (!vars) return;

    setIsExtracting(true);
    setError('');
    setGeneratedQuestions([]);
    setStudyNotes('');
    setDetectedTopic('');

    try {
        const rawQs = await extractRawQuestionsFromText(vars.inputData, 100);
        
        if (rawQs.length === 0) {
            setError("Could not extract any questions.");
        } else {
            const extractedQuestions: Omit<Question, 'id' | 'created_at'>[] = rawQs.map((q, i) => ({
                level: level,
                name: isTopicMode ? (specificTopic || 'Uncategorized Topic') : vars.effectiveExamName,
                code: `${vars.activeCodePrefix}-${(i + 1).toString().padStart(3, '0')}`,
                subtopic: vars.effectiveSubtopic || 'General',
                question: q.question,
                options: q.options,
                correct_answer_index: -1, // Marked as unsolved
                explanation: ''
            }));

            const uniqueNewQuestions = extractedQuestions.filter(newQ => !checkDuplicate(newQ));
            
            if (uniqueNewQuestions.length === 0) {
                setError(`Extracted ${extractedQuestions.length} questions, but ALL were duplicates.`);
            } else {
                setGeneratedQuestions(uniqueNewQuestions);
                setPreviewTab('questions');
            }
        }

    } catch (e) {
        setError(e instanceof Error ? e.message : "Extraction failed.");
    } finally {
        setIsExtracting(false);
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Generate questions from text, PDF, or import Excel.</p>
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
                        placeholder={isTopicMode ? "e.g. Indus Valley" : "Leave empty to auto-detect"}
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
                 <button
                    onClick={() => setInputMode('excel')}
                    className={`pb-2 text-sm font-bold transition-all border-b-2 ${inputMode === 'excel' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}
                >
                    Excel / CSV
                </button>
            </div>
            
            {inputMode === 'text' && (
                <div>
                  <textarea
                    id="rawText"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste content here... (Provide enough text for as many questions as possible)"
                    rows={8}
                    className={inputClass}
                    disabled={isGenerating || isExtracting}
                  />
                </div>
            )}
            
            {inputMode === 'pdf' && (
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
                                    Maximum file size: 5MB.
                                </p>
                             </>
                        )}
                    </label>
                </div>
            )}
            
            {inputMode === 'excel' && (
                <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center transition-all hover:border-indigo-400 dark:hover:border-indigo-600">
                    <input 
                        type="file" 
                        ref={excelInputRef}
                        accept=".xlsx, .xls, .csv"
                        onChange={handleExcelUpload}
                        className="hidden" 
                        id="excel-upload"
                    />
                    <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm text-emerald-500 dark:text-emerald-400">
                             {excelFile ? <Icon name="table" className="w-8 h-8" /> : <Icon name="upload" className="w-8 h-8" />}
                        </div>
                        {excelFile ? (
                             <>
                                <p className="font-bold text-slate-800 dark:text-white mb-1">{excelFile.name}</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{excelFile.data.length} rows detected</p>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setExcelFile(null);
                                        if(excelInputRef.current) excelInputRef.current.value = "";
                                    }}
                                    className="mt-4 text-xs text-rose-500 hover:underline"
                                >
                                    Remove File
                                </button>
                             </>
                        ) : (
                             <>
                                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Click to upload Excel / CSV</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4">
                                    Supports .xlsx, .xls, .csv
                                </p>
                                <button 
                                    onClick={(e) => { e.preventDefault(); downloadTemplate(); }}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    <Icon name="download" className="w-3 h-3" /> Download Template
                                </button>
                             </>
                        )}
                    </label>
                </div>
            )}
        </div>

        {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-start gap-3">
                <Icon name="xCircle" className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>
            </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onCancel}
            disabled={isGenerating || isExtracting}
            className="py-3 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleExtractOnly}
            disabled={isGenerating || isExtracting}
            className="bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800 font-bold py-3 px-6 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
          >
            {isExtracting ? <Spinner /> : <Icon name="layers" className="w-4 h-4" />}
            {isExtracting ? 'Extracting...' : 'Extract Questions Only'}
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || isExtracting}
            className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
          >
            {isGenerating ? <Spinner /> : <Icon name="sparkles" className="w-4 h-4" />}
            {isGenerating ? `Processing...` : (inputMode === 'excel' ? 'Import Questions' : 'Generate with AI')}
          </button>
        </div>
      </div>
      
      {/* PREVIEW SECTION */}
      {(generatedQuestions.length > 0 || studyNotes) && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden" ref={previewRef}>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-wrap gap-4">
                   <div className="flex gap-2">
                       <button
                         onClick={() => setPreviewTab('questions')}
                         className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${previewTab === 'questions' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                       >
                           Questions ({generatedQuestions.length})
                       </button>
                       {studyNotes && (
                        <button
                            onClick={() => setPreviewTab('notes')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${previewTab === 'notes' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Study Notes
                        </button>
                       )}
                   </div>
                   
                   <button
                     onClick={handleAddAll}
                     className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
                   >
                       <Icon name="check" className="w-4 h-4" />
                       Save to Database
                   </button>
              </div>

              <div className="p-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {previewTab === 'questions' && (
                      <div className="space-y-4">
                          {generatedQuestions.map((q, i) => (
                              <div key={i} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <div className="flex justify-between items-start mb-2">
                                     <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wider">{q.code}</span>
                                     {q.subtopic && q.subtopic !== 'General' && <span className="text-[10px] font-bold text-indigo-500 uppercase">{q.subtopic}</span>}
                                  </div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-sm">{renderPreviewText(q.question)}</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                      {q.options.map((opt, idx) => (
                                          <div key={idx} className={`text-xs px-3 py-2 rounded-lg border ${idx === q.correct_answer_index ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                              {String.fromCharCode(65 + idx)}. {renderPreviewText(opt)}
                                          </div>
                                      ))}
                                  </div>
                                  {q.explanation && (
                                      <p className="text-xs text-slate-500 dark:text-slate-400 italic border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                                          <span className="font-bold not-italic text-indigo-500">Explanation: </span>
                                          {renderPreviewText(q.explanation.substring(0, 100))}...
                                      </p>
                                  )}
                                  {q.correct_answer_index === -1 && (
                                     <div className="mt-2 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 inline-block px-2 py-1 rounded">
                                         ⚠️ Answer & Explanation needed
                                     </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  )}

                  {previewTab === 'notes' && (
                      <div className="relative">
                          <button onClick={handleCopyNotes} className="absolute top-0 right-0 p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Copy Notes">
                              <Icon name="clipboardList" className="w-5 h-5" />
                          </button>
                          <div className="prose dark:prose-invert prose-stone max-w-none text-sm">
                              {studyNotes.split('\n').map((line, i) => (
                                  <p key={i} className="mb-2">{renderPreviewText(line)}</p>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default BulkGenerateForm;
