import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Question, QuestionLevel, IncorrectAnswer, QuizMode } from '../types';
import QuestionCard from './QuestionCard';
import ScoreScreen from './ScoreScreen';
import Icon from './Icon';
import { getRandomQuote, Quote } from '../quotes';
import Spinner from './Spinner';
import StudyGenerator from './StudyGenerator';

interface QuizProps {
  questions: Question[];
  userId: string;
}

type ViewState = 'intro' | 'home' | 'level' | 'exam' | 'set' | 'quiz' | 'score' | 'topic_list' | 'topic_set' | 'bookmark_set' | 'study_generator' | 'study_prep' | 'topic_library' | 'topic_library_sub' | 'topic_library_specific';
type NavTab = 'dashboard' | 'subjects' | 'bookmarks';

// Polished, less neon colors for the levels
const levelVisuals: Record<QuestionLevel, { icon: React.ComponentProps<typeof Icon>['name'], color: string, bg: string, border: string }> = {
    [QuestionLevel.SEVENTH]: { icon: 'bookOpen', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800' },
    [QuestionLevel.TENTH]: { icon: 'academicCap', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800' },
    [QuestionLevel.TWELFTH]: { icon: 'bookOpen', color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/10', border: 'border-indigo-200 dark:border-indigo-800' },
    [QuestionLevel.DEGREE]: { icon: 'academicCap', color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/10', border: 'border-violet-200 dark:border-violet-800' },
    [QuestionLevel.TECHNICAL]: { icon: 'briefcase', color: 'text-fuchsia-700 dark:text-fuchsia-400', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/10', border: 'border-fuchsia-200 dark:border-fuchsia-800' },
    [QuestionLevel.OTHERS]: { icon: 'collection', color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/10', border: 'border-teal-200 dark:border-teal-800' },
    [QuestionLevel.TOPIC]: { icon: 'lightBulb', color: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/10', border: 'border-sky-200 dark:border-sky-800' },
};

const Quiz: React.FC<QuizProps> = ({ questions, userId }) => {
  const [view, setView] = useState<ViewState>('intro');
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [customQuiz, setCustomQuiz] = useState<{ questions: Question[], notes: string, topic: string } | null>(null);

  const [path, setPath] = useState<{ 
      mode: 'level' | 'topic' | 'bookmarks' | 'custom' | 'library' | null;
      level: QuestionLevel | null; 
      exam: string | null; 
      subtopic: string | null;
      chunkIndex: number | null;
  }>({ mode: null, level: null, exam: null, subtopic: null, chunkIndex: null });

  const [selectedMainTopic, setSelectedMainTopic] = useState<string | null>(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState<string | null>(null);

  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [bookmarkedQuestionIds, setBookmarkedQuestionIds] = useState<Set<string>>(new Set());
  
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState<IncorrectAnswer[]>([]);
  const [timeTaken, setTimeTaken] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);

  const notesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`bookmarks_${userId}`);
    if (stored) {
      try {
        setBookmarkedQuestionIds(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }
    setDailyQuote(getRandomQuote());
    
    const timer = setTimeout(() => {
        setView('home');
    }, 2500); // Shorter intro
    return () => clearTimeout(timer);
  }, [userId]);

  useEffect(() => {
    localStorage.setItem(`bookmarks_${userId}`, JSON.stringify(Array.from(bookmarkedQuestionIds)));
  }, [bookmarkedQuestionIds, userId]);

  useEffect(() => {
    let interval: number;
    if (view === 'quiz' && startTime > 0) {
      interval = window.setInterval(() => {
        setTimeTaken(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, startTime]);

  useEffect(() => {
    if (view === 'study_prep' && customQuiz?.notes && notesRef.current && (window as any).renderMathInElement) {
        setTimeout(() => {
            if(notesRef.current) {
                (window as any).renderMathInElement(notesRef.current, {
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
  }, [view, customQuiz]);

  const paperCountsByLevel = useMemo(() => {
    const counts: Partial<Record<QuestionLevel, Set<string>>> = {};
    Object.values(QuestionLevel).forEach(l => {
        if (l !== QuestionLevel.TOPIC) counts[l] = new Set();
    });

    questions.forEach(q => {
        if (q.level !== QuestionLevel.TOPIC && q.name && counts[q.level]) {
            counts[q.level]!.add(q.name);
        }
    });
    
    const result: Partial<Record<QuestionLevel, number>> = {};
    Object.entries(counts).forEach(([level, set]) => {
        result[level as QuestionLevel] = set.size;
    });
    
    return result;
  }, [questions]);

  const topicLibraryData = useMemo(() => {
    const hierarchy: Record<string, Record<string, Record<string, Question[]>>> = {};
    
    questions.filter(q => q.level === QuestionLevel.TOPIC).forEach(q => {
        const compositeSub = q.subtopic || 'Uncategorized';
        const parts = compositeSub.split(' > ');
        
        const mainTopic = parts[0].trim() || 'Uncategorized';
        const subTopic = parts.length > 1 ? parts[1].trim() : 'General';
        const specificTopic = q.name || 'General Questions';

        if (!hierarchy[mainTopic]) hierarchy[mainTopic] = {};
        if (!hierarchy[mainTopic][subTopic]) hierarchy[mainTopic][subTopic] = {};
        if (!hierarchy[mainTopic][subTopic][specificTopic]) hierarchy[mainTopic][subTopic][specificTopic] = [];
        
        hierarchy[mainTopic][subTopic][specificTopic].push(q);
    });
    
    return hierarchy;
  }, [questions]);


  const handleLevelSelect = (level: QuestionLevel) => {
    setPath({ mode: 'level', level, exam: null, subtopic: null, chunkIndex: null });
    setView('level');
  };

  const handleExamSelect = (exam: string) => {
    setPath(prev => ({ ...prev, exam }));
    setView('exam');
  };

  const handleSetSelect = (codePrefix: string) => {
      const setQs = questions.filter(q => 
          q.level === path.level && 
          q.name === path.exam && 
          (q.code && q.code.startsWith(codePrefix))
      );
      setQs.sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }));

      setQuizQuestions(setQs);
      startQuizSession();
  };

  const startQuizSession = () => {
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setScore(0);
      setIncorrectAnswers([]);
      setStartTime(Date.now());
      setTimeTaken(0);
      setView('quiz');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMainTopicSelect = (mainTopic: string) => {
      setSelectedMainTopic(mainTopic);
      setView('topic_library_sub');
  };

  const handleSubTopicSelect = (subTopic: string) => {
      setSelectedSubTopic(subTopic);
      setView('topic_library_specific');
  };

  const handleSpecificTopicSelect = (specificTopic: string) => {
      if (!selectedMainTopic || !selectedSubTopic) return;

      const questionsForTopic = topicLibraryData[selectedMainTopic][selectedSubTopic][specificTopic];
      const sortedQs = [...questionsForTopic].sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }));
      
      setQuizQuestions(sortedQs);
      setPath({
          mode: 'library',
          level: QuestionLevel.TOPIC,
          subtopic: `${selectedMainTopic} > ${selectedSubTopic}`,
          exam: specificTopic,
          chunkIndex: null
      });

      startQuizSession();
  };


  const handleCustomQuizGenerated = (data: { questions: Question[], notes: string, topic: string }) => {
      setCustomQuiz(data);
      setView('study_prep');
  };

  const startCustomQuiz = () => {
      if (!customQuiz) return;
      setQuizQuestions(customQuiz.questions);
      setPath({ mode: 'custom', level: null, exam: customQuiz.topic, subtopic: null, chunkIndex: null });
      startQuizSession();
  };

  const handleAnswer = (optionIndex: number) => {
    const currentQ = quizQuestions[currentQuestionIndex];
    if (userAnswers[currentQ.id] !== undefined) return;
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleSaveNext = () => {
      handleNext();
  };

  const handleClearResponse = () => {
      const currentQ = quizQuestions[currentQuestionIndex];
      const newAnswers = { ...userAnswers };
      delete newAnswers[currentQ.id];
      setUserAnswers(newAnswers);
  };
  
  const handleMarkForReview = () => {
  };

  const toggleBookmark = () => {
    const currentQ = quizQuestions[currentQuestionIndex];
    const newBookmarks = new Set(bookmarkedQuestionIds);
    if (newBookmarks.has(currentQ.id)) {
      newBookmarks.delete(currentQ.id);
    } else {
      newBookmarks.add(currentQ.id);
    }
    setBookmarkedQuestionIds(newBookmarks);
  };

  const handleSubmit = () => {
    let calculatedScore = 0;
    const incorrect: IncorrectAnswer[] = [];

    quizQuestions.forEach(q => {
      const userAnswer = userAnswers[q.id];
      const correctIndex = typeof q.correct_answer_index === 'string' 
            ? parseInt(q.correct_answer_index, 10) 
            : q.correct_answer_index;

      if (userAnswer === correctIndex) {
        calculatedScore++;
      } else if (userAnswer !== undefined) {
        incorrect.push({ ...q, user_answer_index: userAnswer });
      }
    });

    setScore(calculatedScore);
    setIncorrectAnswers(incorrect);
    setView('score');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestart = () => {
    setUserAnswers({});
    setScore(0);
    setIncorrectAnswers([]);
    setCurrentQuestionIndex(0);
    setStartTime(Date.now());
    setTimeTaken(0);
    setView('quiz');
  };

  const handleExit = () => {
      setView('home');
      setPath({ mode: null, level: null, exam: null, subtopic: null, chunkIndex: null });
      setCustomQuiz(null);
  };

  const renderLevelView = () => {
    if (!path.level) return null;
    const exams = Array.from(new Set(
        questions
        .filter(q => q.level === path.level)
        .map(q => q.name)
        .filter(Boolean) as string[]
    )).sort();

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex items-center gap-2 mb-6 cursor-pointer hover:opacity-75 transition-opacity" onClick={() => setView('home')}>
                <Icon name="chevronLeft" className="w-5 h-5 text-stone-400" />
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">{path.level} Exams</h2>
            </div>
            
            {exams.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                    <div className="w-16 h-16 bg-stone-50 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                        <Icon name="documentText" className="w-8 h-8" />
                    </div>
                    <p className="text-stone-500 dark:text-stone-400 font-medium">No exams found for this level yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exams.map(exam => (
                        <button
                            key={exam}
                            onClick={() => handleExamSelect(exam)}
                            className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-left group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-700 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Icon name="documentText" className="w-6 h-6" />
                                </div>
                                <Icon name="chevronRight" className="w-5 h-5 text-stone-300 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{exam}</h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400">
                                {questions.filter(q => q.level === path.level && q.name === exam).length} Questions
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
  };

  const renderExamView = () => {
      if (!path.level || !path.exam) return null;
      const sets = new Map<string, number>(); 
      questions
        .filter(q => q.level === path.level && q.name === path.exam)
        .forEach(q => {
             const prefix = q.code ? (q.code.split('-').slice(0, -1).join('-') || q.code.split('-')[0]) : 'Uncategorized';
             sets.set(prefix, (sets.get(prefix) || 0) + 1);
        });
      const sortedSets = Array.from(sets.entries()).sort((a, b) => a[0].localeCompare(b[0]));

      return (
        <div className="animate-fade-in pb-20">
            <div className="flex items-center gap-2 mb-4 text-sm font-bold text-stone-500 cursor-pointer hover:text-indigo-600 w-fit" onClick={() => setView('level')}>
                <Icon name="chevronLeft" className="w-4 h-4" />
                Back to {path.level}
            </div>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-6 tracking-tight">{path.exam}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedSets.map(([prefix, count]) => (
                    <button
                        key={prefix}
                        onClick={() => handleSetSelect(prefix)}
                        className="flex items-center justify-between p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-lg flex items-center justify-center text-stone-500 dark:text-stone-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors font-bold text-sm">
                                {prefix.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-stone-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{prefix}</h4>
                                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{count} Questions</p>
                            </div>
                        </div>
                        <Icon name="chevronRight" className="w-4 h-4 text-stone-300 group-hover:text-indigo-500" />
                    </button>
                ))}
            </div>
        </div>
      );
  };

  if (view === 'intro' && dailyQuote) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6 animate-fade-in">
              <div className="max-w-md text-center">
                  <div className="w-16 h-16 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-sm">
                      <Icon name="academicCap" className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-4 leading-tight tracking-tight">
                      "{dailyQuote.text}"
                  </h2>
                  <p className="text-stone-500 dark:text-stone-400 font-medium">— {dailyQuote.author}</p>
                  <div className="mt-12 flex justify-center">
                      <Spinner />
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'quiz') {
      const currentQuestion = quizQuestions[currentQuestionIndex];
      const isLast = currentQuestionIndex === quizQuestions.length - 1;
      const isFirst = currentQuestionIndex === 0;
      
      const mode: QuizMode = (path.mode === 'custom' || path.mode === 'library') ? 'practice' : 'practice';

      return (
          <div className="max-w-3xl mx-auto pb-20 animate-fade-in">
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-sm z-30 py-4 border-b border-stone-200 dark:border-stone-800">
                   <div className="flex items-center gap-4">
                       <button onClick={handleExit} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors">
                           <Icon name="xCircle" className="w-6 h-6 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200" />
                       </button>
                       <div>
                           <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wide">
                               Question {currentQuestionIndex + 1} <span className="text-stone-300 dark:text-stone-600">/ {quizQuestions.length}</span>
                           </h2>
                           <div className="h-1.5 w-24 bg-stone-200 dark:bg-stone-800 rounded-full mt-1.5 overflow-hidden">
                               <div 
                                   className="h-full bg-indigo-600 transition-all duration-300"
                                   style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                               ></div>
                           </div>
                       </div>
                   </div>
                   <div className="flex items-center gap-3">
                       <div className="px-3 py-1 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 text-xs font-mono font-bold text-stone-600 dark:text-stone-400 tabular-nums shadow-sm">
                            {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}
                       </div>
                   </div>
              </div>

              <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 p-6 sm:p-8 min-h-[400px]">
                  <QuestionCard
                      question={currentQuestion}
                      mode={mode}
                      userSelectedOption={userAnswers[currentQuestion.id]}
                      onAnswer={handleAnswer}
                      onNext={handleNext}
                      onPrevious={handlePrevious}
                      onSaveNext={handleSaveNext}
                      onClearResponse={handleClearResponse}
                      onMarkForReview={handleMarkForReview}
                      isFirst={isFirst}
                      isLast={isLast}
                      isBookmarked={bookmarkedQuestionIds.has(currentQuestion.id)}
                      onToggleBookmark={toggleBookmark}
                  />
              </div>
          </div>
      );
  }

  if (view === 'score') {
      return (
          <ScoreScreen
              score={score}
              total={quizQuestions.length}
              userAnswersCount={Object.keys(userAnswers).length}
              timeTaken={timeTaken}
              onRestart={handleRestart}
              onExit={handleExit}
              incorrectAnswers={incorrectAnswers}
          />
      );
  }
  
  if (view === 'study_generator') {
      return (
          <div className="max-w-2xl mx-auto pt-4 pb-20 animate-fade-in">
               <button 
                  onClick={() => setView('home')}
                  className="mb-6 flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
               >
                   <Icon name="chevronLeft" className="w-4 h-4" /> Back to Dashboard
               </button>
               <StudyGenerator onGenerate={handleCustomQuizGenerated} onCancel={() => setView('home')} />
          </div>
      )
  }

  if (view === 'study_prep') {
      return (
          <div className="max-w-4xl mx-auto pt-4 pb-20 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                  <button 
                      onClick={() => setView('home')}
                      className="flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                  >
                      <Icon name="chevronLeft" className="w-4 h-4" /> Back
                  </button>
                  <button
                      onClick={startCustomQuiz}
                      className="bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                  >
                      Start Practice Quiz <Icon name="chevronRight" className="w-4 h-4" />
                  </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 p-8">
                          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-stone-100 dark:border-stone-800">
                               <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                                   <Icon name="documentText" className="w-6 h-6" />
                               </div>
                               <div>
                                   <h2 className="text-xl font-bold text-stone-900 dark:text-white">Topic Study Notes</h2>
                                   <p className="text-sm text-stone-500 dark:text-stone-400">Read through before starting the quiz.</p>
                               </div>
                          </div>
                          <div 
                              ref={notesRef}
                              className="prose dark:prose-invert prose-stone max-w-none text-sm sm:text-base leading-relaxed"
                          >
                              {customQuiz?.notes.split('\n').map((line, i) => {
                                  if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4 mt-6 text-stone-900 dark:text-white">{line.replace('# ', '')}</h1>;
                                  if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mb-3 mt-5 text-stone-800 dark:text-stone-100">{line.replace('## ', '')}</h2>;
                                  if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1 text-stone-700 dark:text-stone-300">{line.replace('- ', '')}</li>;
                                  const parts = line.split(/(\*\*.*?\*\*)/g);
                                  return (
                                    <p key={i} className="mb-2 text-stone-700 dark:text-stone-300">
                                        {parts.map((part, j) => 
                                            part.startsWith('**') && part.endsWith('**') 
                                            ? <strong key={j} className="font-bold text-stone-900 dark:text-white">{part.slice(2, -2)}</strong> 
                                            : part
                                        )}
                                    </p>
                                  );
                              })}
                          </div>
                      </div>
                  </div>
                  
                  <div>
                       <div className="bg-indigo-600 rounded-xl shadow-md p-6 text-white mb-6 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-10">
                               <Icon name="sparkles" className="w-24 h-24" />
                           </div>
                           <h3 className="text-lg font-bold mb-1">AI Generated Session</h3>
                           <p className="text-indigo-100 text-sm mb-6 opacity-90">{customQuiz?.topic}</p>
                           
                           <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                               <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                   <Icon name="clipboardList" className="w-5 h-5" />
                               </div>
                               <div>
                                   <p className="text-xl font-black">{customQuiz?.questions.length}</p>
                                   <p className="text-xs text-indigo-100 font-medium">Questions Ready</p>
                               </div>
                           </div>
                       </div>
                  </div>
              </div>
          </div>
      )
  }

  // Views for Topic Gallery (3-Level Hierarchy)
  if (view === 'topic_library') {
      const mainTopics = Object.keys(topicLibraryData).sort();
      return (
          <div className="animate-fade-in pb-20">
              <div className="flex items-center gap-2 mb-6 cursor-pointer hover:opacity-75 transition-opacity" onClick={() => setView('home')}>
                  <Icon name="chevronLeft" className="w-5 h-5 text-stone-400" />
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">Topic Wise Library</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mainTopics.map(topic => (
                      <button
                          key={topic}
                          onClick={() => handleMainTopicSelect(topic)}
                          className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition-all text-left group"
                      >
                          <div className="flex justify-between items-start mb-4">
                              <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg text-sky-700 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                                  <Icon name="folder" className="w-6 h-6" />
                              </div>
                              <Icon name="chevronRight" className="w-5 h-5 text-stone-300 group-hover:text-sky-400 transition-colors" />
                          </div>
                          <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{topic}</h3>
                          <p className="text-sm text-stone-500 dark:text-stone-400">
                              {Object.keys(topicLibraryData[topic]).length} Subtopics
                          </p>
                      </button>
                  ))}
                  {mainTopics.length === 0 && (
                      <div className="col-span-full text-center py-10 text-stone-500">No topics found.</div>
                  )}
              </div>
          </div>
      );
  }

  if (view === 'topic_library_sub' && selectedMainTopic) {
      const subTopics = Object.keys(topicLibraryData[selectedMainTopic]).sort();
      return (
          <div className="animate-fade-in pb-20">
              <nav className="flex items-center text-sm font-medium text-stone-500 mb-6 overflow-x-auto whitespace-nowrap">
                  <button onClick={() => setView('home')} className="hover:text-sky-600 transition-colors">Home</button>
                  <Icon name="chevronRight" className="w-3 h-3 mx-2 text-stone-300" />
                  <button onClick={() => setView('topic_library')} className="hover:text-sky-600 transition-colors">Library</button>
                  <Icon name="chevronRight" className="w-3 h-3 mx-2 text-stone-300" />
                  <span className="text-stone-900 dark:text-white font-bold">{selectedMainTopic}</span>
              </nav>

              <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-6 tracking-tight">{selectedMainTopic}</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subTopics.map(sub => (
                      <button
                          key={sub}
                          onClick={() => handleSubTopicSelect(sub)}
                          className="bg-white dark:bg-stone-900 p-5 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 hover:border-sky-400 transition-all text-left group"
                      >
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-lg flex items-center justify-center text-stone-500 dark:text-stone-400 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                                   <Icon name="hashtag" className="w-5 h-5" />
                              </div>
                              <div>
                                  <h3 className="font-bold text-stone-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{sub}</h3>
                                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                                      {Object.keys(topicLibraryData[selectedMainTopic][sub]).length} Specific Topics
                                  </p>
                              </div>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      );
  }

  if (view === 'topic_library_specific' && selectedMainTopic && selectedSubTopic) {
      const specificTopics = Object.keys(topicLibraryData[selectedMainTopic][selectedSubTopic]).sort();
      return (
          <div className="animate-fade-in pb-20">
              <nav className="flex items-center text-sm font-medium text-stone-500 mb-6 overflow-x-auto whitespace-nowrap">
                  <button onClick={() => setView('topic_library')} className="hover:text-sky-600 transition-colors">Library</button>
                  <Icon name="chevronRight" className="w-3 h-3 mx-2 text-stone-300" />
                  <button onClick={() => setView('topic_library_sub')} className="hover:text-sky-600 transition-colors">{selectedMainTopic}</button>
                  <Icon name="chevronRight" className="w-3 h-3 mx-2 text-stone-300" />
                  <span className="text-stone-900 dark:text-white font-bold">{selectedSubTopic}</span>
              </nav>

              <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-6 tracking-tight">{selectedSubTopic}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {specificTopics.map(topic => {
                      const count = topicLibraryData[selectedMainTopic][selectedSubTopic][topic].length;
                      return (
                          <button
                              key={topic}
                              onClick={() => handleSpecificTopicSelect(topic)}
                              className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200 dark:border-stone-800 hover:shadow-md hover:border-sky-400 transition-all text-left flex justify-between items-center group"
                          >
                              <div>
                                  <h4 className="font-bold text-stone-900 dark:text-white mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{topic}</h4>
                                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{count} Questions</p>
                              </div>
                              <div className="w-8 h-8 rounded-lg bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-stone-300 group-hover:text-sky-500 transition-colors">
                                  <Icon name="chevronRight" className="w-4 h-4" />
                              </div>
                          </button>
                      );
                  })}
              </div>
          </div>
      );
  }

  if (view === 'level') {
      return renderLevelView();
  }

  if (view === 'exam') {
      return renderExamView();
  }

  return (
    <div className="animate-fade-in pb-20">
        
        {/* Daily Motivation Quote */}
        {dailyQuote && (
            <div className="mb-8 p-6 bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 relative overflow-hidden group hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded text-amber-500">
                        <Icon name="fire" className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Daily Thought</span>
                </div>
                <blockquote className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3 leading-snug font-serif italic">
                    "{dailyQuote.text}"
                </blockquote>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">— {dailyQuote.author}</p>
            </div>
        )}

        <div className="space-y-8">
            
            <section>
                 <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="p-2 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-lg">
                        <Icon name="folder" className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight">Topic Wise Library</h3>
                 </div>
                 
                 <button 
                    onClick={() => setView('topic_library')}
                    className="w-full bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm hover:border-sky-400 transition-all text-left flex items-center justify-between group"
                 >
                     <div className="flex items-center gap-5">
                         <div className="w-14 h-14 bg-sky-50 dark:bg-sky-900/10 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                             <Icon name="collection" className="w-7 h-7" />
                         </div>
                         <div>
                             <h4 className="text-lg font-bold text-stone-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">Browse Topics</h4>
                             <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                                 Structured learning by subject
                             </p>
                         </div>
                     </div>
                     <div className="w-10 h-10 rounded-full border border-stone-100 dark:border-stone-800 flex items-center justify-center text-stone-300 group-hover:border-sky-200 group-hover:text-sky-500 transition-all">
                        <Icon name="chevronRight" className="w-5 h-5" />
                     </div>
                 </button>
            </section>

            <section>
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Icon name="academicCap" className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight">Previous Year Papers</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.values(QuestionLevel)
                        .filter(l => l !== QuestionLevel.TOPIC)
                        .map((level) => {
                            const visual = levelVisuals[level] || levelVisuals[QuestionLevel.OTHERS];
                            const count = paperCountsByLevel[level] || 0;
                            return (
                                <button
                                    key={level}
                                    onClick={() => handleLevelSelect(level)}
                                    className={`relative p-5 rounded-xl border transition-all duration-300 text-left group overflow-hidden bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700`}
                                >
                                    <div className={`mb-3 w-10 h-10 rounded-lg flex items-center justify-center ${visual.bg} ${visual.color}`}>
                                        <Icon name={visual.icon} className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-stone-900 dark:text-white text-base mb-1">{level}</h3>
                                    <p className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                                        {count} Papers
                                    </p>
                                </button>
                            );
                    })}
                </div>
            </section>

        </div>
    </div>
  );
};

export default Quiz;