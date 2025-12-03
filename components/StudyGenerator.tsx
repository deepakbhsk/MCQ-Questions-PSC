
import React, { useState, useRef } from 'react';
import { generateMcqsFromText } from '../services/geminiService';
import { Question, QuestionLevel } from '../types';
import Icon from './Icon';
import Spinner from './Spinner';

interface StudyGeneratorProps {
  onGenerate: (data: { questions: Question[], notes: string, topic: string }) => void;
  onCancel: () => void;
}

const StudyGenerator: React.FC<StudyGeneratorProps> = ({ onGenerate, onCancel }) => {
  const [topic, setTopic] = useState('');
  
  // Input Mode
  const [inputMode, setInputMode] = useState<'text' | 'pdf'>('text');
  
  const [rawText, setRawText] = useState('');
  const [pdfFile, setPdfFile] = useState<{ data: string, name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

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

  const handleGenerate = async () => {
    // Topic is optional now (auto-detected if empty)
    
    let inputData: string | { data: string, mimeType: string };

    if (inputMode === 'text') {
        if (!rawText.trim()) {
            setError("Please paste some content/text to study.");
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

    try {
      // Use standard settings for ad-hoc study
      // Request 20 questions for student mode
      const result = await generateMcqsFromText(
          inputData, 
          QuestionLevel.DEGREE, 
          topic || 'Auto-Detected Topic', 
          'AI-STUDY', 
          'General', 
          undefined, // specificTopic is optional
          20 // count
      );

      if (result.questions.length === 0) {
          setError("The AI could not generate questions. Try providing more detailed content.");
          setIsGenerating(false);
          return;
      }

      // Use detected topic if user didn't provide one
      const finalTopic = topic.trim() || result.detectedTopic || "Study Session";

      // Assign temporary IDs for the session
      const questionsWithIds = result.questions.map((q, i) => ({
          ...q,
          id: `custom-${Date.now()}-${i}`,
          created_at: new Date().toISOString()
      }));

      onGenerate({
          questions: questionsWithIds,
          notes: result.studyNotes,
          topic: finalTopic
      });

    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const inputClass = "mt-1 block w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white outline-none placeholder-slate-400";
  const labelClass = "block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg p-6 sm:p-8 animate-fade-in border border-slate-200 dark:border-slate-800">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
         <div className="flex items-center gap-3 mb-2">
             <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Icon name="lightBulb" className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Study Companion</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Turn your notes or PDF into a practice quiz instantly.</p>
             </div>
         </div>
      </div>

      <div className="space-y-6">
         <div>
            <label htmlFor="topic" className={labelClass}>Topic / Subject <span className="text-slate-400 font-normal normal-case">(Optional)</span></label>
            <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Leave empty to auto-detect from content"
                className={inputClass}
                disabled={isGenerating}
            />
        </div>
        
        {/* Input Method Switcher */}
        <div>
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
                    placeholder="Paste article text, notes, or paragraphs here."
                    rows={10}
                    className={inputClass}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-slate-400 mt-2 text-right">The more content you provide, the better the questions.</p>
                </div>
            ) : (
                <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center transition-all hover:border-indigo-400 dark:hover:border-indigo-600">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden" 
                        id="pdf-upload-student"
                    />
                    <label htmlFor="pdf-upload-student" className="cursor-pointer flex flex-col items-center">
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
                                    Maximum file size: 5MB. Content is processed in-memory for this session only.
                                </p>
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

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onCancel}
            disabled={isGenerating}
            className="py-3 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
          >
            {isGenerating ? <Spinner /> : <Icon name="sparkles" className="w-4 h-4" />}
            {isGenerating ? `Processing Content...` : `Generate Quiz & Notes`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyGenerator;
