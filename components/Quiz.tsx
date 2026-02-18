
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Question, QuestionLevel, IncorrectAnswer, QuizMode } from '../types';
import QuestionCard from './QuestionCard';
import ScoreScreen from './ScoreScreen';
import Icon from './Icon';
import Dashboard from './Dashboard';
import ExamLibrary from './ExamLibrary';
import Timer from './Timer';

interface QuizProps {
  questions: Question[];
  userId: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

type ViewState = 'home' | 'library' | 'quiz' | 'score' | 'practice';

const Quiz: React.FC<QuizProps> = ({ questions, userId, activeTab, onTabChange }) => {
  const [view, setView] = useState<ViewState>('home');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [bookmarkedQuestionIds, setBookmarkedQuestionIds] = useState<Set<string>>(new Set());
  const [quizMode, setQuizMode] = useState<QuizMode>('exam');
  
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState<IncorrectAnswer[]>([]);
  const [timeTaken, setTimeTaken] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`bookmarks_${userId}`);
    if (stored) {
      try {
        setBookmarkedQuestionIds(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }
  }, [userId]);

  useEffect(() => {
    localStorage.setItem(`bookmarks_${userId}`, JSON.stringify(Array.from(bookmarkedQuestionIds)));
  }, [bookmarkedQuestionIds, userId]);

  // Sync activeTab from App.tsx with internal view
  useEffect(() => {
      if (activeTab === 'dashboard') setView('home');
      else if (activeTab === 'exams') setView('library');
  }, [activeTab]);

  const stats = useMemo(() => ({
      totalExams: 42,
      avgScore: 78,
      globalRank: 'Top 15%'
  }), []);

  const recentActivity = useMemo(() => [
      { id: '1', title: 'Mock Test 4 - Kerala Renaissance', time: '2 hours ago', score: '85/100', status: 'Passed' as const },
      { id: '2', title: 'Daily Current Affairs Quiz', time: 'Yesterday', score: '10/10', status: 'Perfect' as const },
      { id: '3', title: 'Indian Constitution Basics', time: '2 days ago', score: '42/50', status: 'Average' as const },
  ], []);

  const libraryData = useMemo(() => {
      const categories = [
          { id: 'degree', name: 'Degree Level', examsCount: 45, subfolders: 12, isActive: true },
          { id: '12th', name: '12th Level', examsCount: 32, subfolders: 8 },
          { id: '10th', name: '10th Level', examsCount: 28, subfolders: 6 },
      ];
      const exams = questions.filter(q => q.level !== QuestionLevel.TOPIC).slice(0, 4).map((q, i) => ({
          id: q.id.substring(0, 8),
          title: q.name || 'Sample Exam',
          questions: 100,
          duration: 75,
          status: (['Active', 'Popular', 'Archived', 'Preview'] as const)[i % 4],
          isAI: i % 2 === 0
      }));
      return { categories, exams };
  }, [questions]);

  const startQuiz = (mode: QuizMode, selectedQuestions: Question[]) => {
      setQuizQuestions(selectedQuestions);
      setQuizMode(mode);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setScore(0);
      setIncorrectAnswers([]);
      setStartTime(Date.now());
      setTimeTaken(0);
      setView('quiz');
      setIsPaused(false);
  };

  const handleStartExam = () => {
      const testQs = questions.filter(q => q.level !== QuestionLevel.TOPIC).slice(0, 100);
      startQuiz('exam', testQs);
  };

  const handleStartPractice = () => {
      const practiceQs = questions.filter(q => q.level === QuestionLevel.TOPIC).slice(0, 50);
      startQuiz('practice', practiceQs);
  };

  const handleAnswer = (optionIndex: number) => {
    const currentQ = quizQuestions[currentQuestionIndex];
    if (quizMode === 'practice' && userAnswers[currentQ.id] !== undefined) return;
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
        handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
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
    setTimeTaken(Math.floor((Date.now() - startTime) / 1000));

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
  };

  const handleExit = () => {
      setView('home');
      onTabChange('dashboard');
  };

  if (view === 'quiz') {
      const currentQuestion = quizQuestions[currentQuestionIndex];
      const isLast = currentQuestionIndex === quizQuestions.length - 1;
      const isFirst = currentQuestionIndex === 0;

      return (
          <div className="fixed inset-0 z-[60] bg-background-dark flex flex-col overflow-hidden animate-fade-in">
              {/* HUD Header */}
              <header className="h-16 flex-none glass-panel z-50 px-6 flex items-center justify-between border-b-0">
                  <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/20 rounded-lg text-primary">
                          <span className="material-symbols-outlined text-[20px]">school</span>
                      </div>
                      <div>
                          <h1 className="text-sm font-bold text-white tracking-wide">PSC General Studies</h1>
                          <p className="text-xs text-slate-400">Mock Test • Full Length</p>
                      </div>
                  </div>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                      <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/40 border border-white/5">
                          <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
                          <Timer startTime={startTime} isPaused={isPaused} />
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="glass-button h-9 px-4 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                      >
                          <span className="material-symbols-outlined text-[18px]">{isPaused ? 'play_arrow' : 'pause'}</span>
                          <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-[0_0_15px_rgba(19,91,236,0.5)] transition-all"
                      >
                          Finish Test
                      </button>
                  </div>
              </header>

              <main className="flex-1 flex overflow-hidden">
                  {/* Left: Question Area */}
                  <section className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar">
                      <div className="h-1 w-full bg-slate-800 sticky top-0 z-20">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-r-full shadow-[0_0_10px_rgba(19,91,236,0.6)] transition-all duration-300"
                            style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                          ></div>
                      </div>

                      <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full flex flex-col justify-center">
                          <div className="glass-panel p-8 rounded-2xl relative">
                              <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
                              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                              <QuestionCard
                                  question={currentQuestion}
                                  mode={quizMode}
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
                  </section>

                  {/* Right: Side Panel (Question Grid) */}
                  <aside className={`w-80 border-l border-slate-800 bg-[#151b28]/80 backdrop-blur-xl flex flex-col z-40 lg:flex ${showPalette ? 'fixed inset-0 w-full z-[70]' : 'hidden'}`}>
                      <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                          <h3 className="text-white font-semibold text-lg">Question Palette</h3>
                          <button onClick={() => setShowPalette(false)} className="lg:hidden text-slate-400">
                              <span className="material-symbols-outlined">close</span>
                          </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                          <div className="grid grid-cols-5 gap-3">
                              {quizQuestions.map((q, idx) => {
                                  const isAnswered = userAnswers[q.id] !== undefined;
                                  const isCurrent = idx === currentQuestionIndex;
                                  const isMarked = bookmarkedQuestionIds.has(q.id);

                                  let btnClasses = "bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-700 hover:text-white";
                                  if (isCurrent) btnClasses = "bg-primary text-white font-bold ring-2 ring-primary ring-offset-2 ring-offset-[#151b28] shadow-[0_0_15px_rgba(19,91,236,0.5)]";
                                  else if (isAnswered) btnClasses = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-white";

                                  return (
                                      <button
                                        key={q.id}
                                        onClick={() => { setCurrentQuestionIndex(idx); setShowPalette(false); }}
                                        className={`w-10 h-10 rounded-md border text-sm font-medium transition-all flex items-center justify-center relative ${btnClasses}`}
                                      >
                                          {idx + 1}
                                          {isMarked && (
                                              <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full translate-x-1/3 -translate-y-1/3"></span>
                                          )}
                                      </button>
                                  );
                              })}
                          </div>
                      </div>
                      <div className="p-4 border-t border-slate-800 bg-[#151b28]">
                          <div className="flex gap-2 text-[10px] text-slate-400 mb-4 justify-between uppercase font-bold tracking-widest px-1">
                              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ans</div>
                              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-700"></span> Not Visited</div>
                              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-500"></span> Review</div>
                          </div>
                          <button onClick={handleSubmit} className="w-full py-2.5 text-xs font-bold text-white bg-primary rounded-lg transition-colors hover:bg-primary/80">
                              Submit Assessment
                          </button>
                      </div>
                  </aside>
              </main>
              
              {/* Mobile Palette Toggle */}
              <div className="lg:hidden fixed bottom-6 right-6 z-50">
                  <button
                    onClick={() => setShowPalette(true)}
                    className="w-14 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center transition-transform active:scale-95"
                  >
                      <span className="material-symbols-outlined">grid_view</span>
                  </button>
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
              onRestart={() => setView('quiz')}
              onExit={handleExit}
              incorrectAnswers={incorrectAnswers}
          />
      );
  }

  return (
    <div className="animate-fade-in pb-20">
        {view === 'home' && (
            <Dashboard
                user={{ name: userId.substring(0, 8) }}
                stats={stats}
                recentActivity={recentActivity}
            />
        )}
        {view === 'library' && (
            <ExamLibrary
                categories={libraryData.categories}
                exams={libraryData.exams as any}
                onStartExam={handleStartExam}
                onStartPractice={handleStartPractice}
            />
        )}

        {/* FAB for quick quiz */}
        <button
            onClick={handleStartExam}
            className="fixed bottom-8 right-8 p-4 bg-primary text-white rounded-2xl shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group z-30"
        >
            <span className="material-symbols-outlined">bolt</span>
            <span className="font-bold">Quick Exam</span>
        </button>
    </div>
  );
};

export default Quiz;
