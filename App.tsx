
import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Question, SyncStatus, SyncOperation, ADMIN_EMAIL } from './types';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Quiz from './components/Quiz';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabaseClient';
import Spinner from './components/Spinner';
import Auth from './components/Auth';
import { Session } from '@supabase/supabase-js';

const QUESTIONS_STORAGE_KEY = 'psc-mcq-questions';
const SYNC_QUEUE_STORAGE_KEY = 'psc-mcq-sync-queue';

// #region Local Storage Helpers
const getStoredQuestions = (): Question[] => {
  try {
    const stored = localStorage.getItem(QUESTIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse questions from localStorage", e);
    return [];
  }
};

const setStoredQuestions = (questions: Question[]) => {
  localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
};

const getSyncQueue = (): SyncOperation[] => {
    try {
        const stored = localStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to parse sync queue from localStorage", e);
        return [];
    }
};

const updateSyncQueue = (queue: SyncOperation[]) => {
    localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queue));
};
// #endregion

const formatSupabaseError = (error: any): string => {
  if (!error) return "An unknown error occurred.";
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error.error && typeof error.error === 'object') {
      return formatSupabaseError(error.error);
  }
  if (typeof error === 'object') {
      const message = error.message || error.msg || error.error_description || error.description || error.statusText;
      if (message) {
          let detailedMsg = String(message);
          if (error.details) detailedMsg += `\nDetails: ${error.details}`;
          if (error.hint) detailedMsg += `\nHint: ${error.hint}`;
          if (error.code) detailedMsg += ` (Code: ${error.code})`;
          if (detailedMsg.includes("violates row-level security policy")) {
              detailedMsg += `\n\n[ACTION REQUIRED]: Check Row Level Security policies for the 'questions' table in your Supabase dashboard.`;
          } else if (detailedMsg.includes("does not have a replica identity")) {
              detailedMsg += `\n\n[ACTION REQUIRED]: Your 'questions' table is missing a 'REPLICA IDENTITY'. To fix this, run the following command in your Supabase SQL Editor:\n\nALTER TABLE questions REPLICA IDENTITY FULL;`;
          }
          return detailedMsg;
      }
      if (error.code) return `Database Error: ${error.code}`;
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch (e) {
     return "An error occurred (details could not be serialized).";
  }
};


const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isWritePermissionError, setIsWritePermissionError] = useState(false);
  const [isReplicaIdentityError, setIsReplicaIdentityError] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [navKey, setNavKey] = useState(0);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const handleLogoClick = () => {
    setNavKey(prev => prev + 1);
    setActiveTab('dashboard');
  };

  const toggleRole = () => {
      setRole(prev => prev === UserRole.USER ? UserRole.ADMIN : UserRole.USER);
      setActiveTab('dashboard');
  };

  useEffect(() => {
    const handleSession = (session: Session | null) => {
        setSession(session);
        if (session?.user?.email === ADMIN_EMAIL) {
            setRole(UserRole.ADMIN);
        } else {
            setRole(UserRole.USER);
        }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe()
  }, [])


  const processSyncQueue = useCallback(async () => {
    if (syncStatus === 'syncing') return;
    let queue = getSyncQueue();
    if (queue.length === 0) {
      setSyncStatus('idle');
      return;
    }
    setSyncStatus('syncing');
    setIsWritePermissionError(false);
    setIsReplicaIdentityError(false);
    let errorOccurred = false;

    const createOps = queue.filter(op => op.type === 'create') as Extract<SyncOperation, { type: 'create' }>[];
    if (createOps.length > 0) {
      const payloads = createOps.map(op => op.payload);
      const { data: newQuestions, error } = await (supabase.from('questions') as any).insert(payloads).select();
      if (error) {
        if (String(error.message).includes("violates row-level security policy")) setIsWritePermissionError(true);
        setError(formatSupabaseError(error));
        errorOccurred = true;
      } else if (newQuestions) {
        let currentQuestions = getStoredQuestions();
        createOps.forEach((op, index) => {
          const createdQuestion = newQuestions[index];
          currentQuestions = currentQuestions.map(q => q.id === op.tempId ? createdQuestion : q);
        });
        setStoredQuestions(currentQuestions);
        setQuestions(currentQuestions);
        queue = queue.filter(op => op.type !== 'create');
      }
    }

    if (!errorOccurred) {
        const deleteOps = queue.filter(op => op.type === 'delete') as Extract<SyncOperation, { type: 'delete' }>[];
        if (deleteOps.length > 0) {
            const allIdsToDelete = deleteOps.map(op => op.payload.id);
            const serverIdsToDelete = allIdsToDelete.filter(id => !id.startsWith('temp-'));
            let deleteError = null;
            if (serverIdsToDelete.length > 0) {
                const CHUNK_SIZE = 20;
                for (let i = 0; i < serverIdsToDelete.length; i += CHUNK_SIZE) {
                    const chunk = serverIdsToDelete.slice(i, i + CHUNK_SIZE);
                    const { error } = await supabase.from('questions').delete().in('id', chunk);
                    if (error) { deleteError = error; break; }
                }
            }
            if (deleteError) {
                if (String(deleteError.message).includes("violates row-level security policy")) setIsWritePermissionError(true);
                setError(formatSupabaseError(deleteError));
                errorOccurred = true;
            } else {
                const processedIds = new Set(allIdsToDelete);
                queue = queue.filter(op => !(op.type === 'delete' && processedIds.has(op.payload.id)));
            }
        }
    }

    if (!errorOccurred) {
        const updateOps = queue.filter(op => op.type === 'update');
        if (updateOps.length > 0) {
            const uniqueUpdates = new Map<string, Question>();
            updateOps.forEach(op => {
                if (op.type === 'update') uniqueUpdates.set(op.payload.id, op.payload);
            });
            const payloads = Array.from(uniqueUpdates.values()).filter(p => !p.id.startsWith('temp-'));
            if (payloads.length > 0) {
                const CHUNK_SIZE = 50;
                for (let i = 0; i < payloads.length; i += CHUNK_SIZE) {
                    const chunk = payloads.slice(i, i + CHUNK_SIZE);
                    const { error } = await (supabase.from('questions') as any).upsert(chunk);
                    if (error) {
                         if (String(error.message).includes("violates row-level security policy")) setIsWritePermissionError(true);
                         else if (String(error.message).includes("does not have a replica identity")) setIsReplicaIdentityError(true);
                        setError(formatSupabaseError(error));
                        errorOccurred = true;
                        break;
                    }
                }
            }
             if (!errorOccurred) {
                 const processedIds = new Set(payloads.map(p => p.id));
                 queue = queue.filter(op => !(op.type === 'update' && processedIds.has(op.payload.id)));
             }
        }
    }

    updateSyncQueue(queue);
    setSyncStatus(errorOccurred ? 'error' : 'idle');
    if (!errorOccurred) fetchQuestions(false);
  }, [syncStatus]);

  useEffect(() => {
    if (syncStatus !== 'error') return;
    const intervalId = setInterval(() => { processSyncQueue(); }, 30000);
    return () => clearInterval(intervalId);
  }, [syncStatus, processSyncQueue]);

  const fetchQuestions = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('questions').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      const serverQuestions = data || [];
      setQuestions(serverQuestions);
      setStoredQuestions(serverQuestions);
    } catch (err: any) {
      const formattedError = formatSupabaseError(err);
      console.error("Error fetching questions:", err);
      setError(`Failed to fetch questions: ${formattedError}`);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase || !session) {
      if (!supabase) setError("Supabase client not initialized.");
      setIsLoading(false);
      return;
    }
    const localQuestions = getStoredQuestions();
    const isDemo = localStorage.getItem('demo_mode') === 'true';

    if (localQuestions.length > 0) {
      setQuestions(localQuestions);
      setIsLoading(false); 
      if (!isDemo) fetchQuestions(false);
    } else {
      fetchQuestions(true); 
    }
    if (!isDemo) processSyncQueue();
  }, [session, fetchQuestions, processSyncQueue]);


  const addQuestion = useCallback(async (newQuestion: Omit<Question, 'id' | 'created_at'>) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const questionForState: Question = { ...newQuestion, id: tempId, created_at: new Date().toISOString() };
    const updatedQuestions = [...getStoredQuestions(), questionForState];
    setQuestions(updatedQuestions);
    setStoredQuestions(updatedQuestions);
    const newOp: SyncOperation = { type: 'create', payload: newQuestion, tempId };
    updateSyncQueue([...getSyncQueue(), newOp]);
    processSyncQueue();
  }, [processSyncQueue]);

  const addQuestions = useCallback(async (newQuestions: Omit<Question, 'id' | 'created_at'>[]) => {
    const questionsForState: Question[] = [];
    const newOps: SyncOperation[] = [];
    const baseTime = Date.now();
    newQuestions.forEach((q, index) => {
        const tempId = `temp-${crypto.randomUUID()}`;
        const createdAt = new Date(baseTime + index).toISOString();
        questionsForState.push({ ...q, id: tempId, created_at: createdAt });
        newOps.push({ type: 'create', payload: q, tempId });
    });
    const updatedQuestions = [...getStoredQuestions(), ...questionsForState];
    setQuestions(updatedQuestions);
    setStoredQuestions(updatedQuestions);
    updateSyncQueue([...getSyncQueue(), ...newOps]);
    processSyncQueue();
  }, [processSyncQueue]);

  const updateQuestion = useCallback(async (updatedQuestion: Question) => {
    const updatedQuestions = getStoredQuestions().map(q => q.id === updatedQuestion.id ? updatedQuestion : q);
    setQuestions(updatedQuestions);
    setStoredQuestions(updatedQuestions);
    const newOp: SyncOperation = { type: 'update', payload: updatedQuestion };
    updateSyncQueue([...getSyncQueue(), newOp]);
    processSyncQueue();
  }, [processSyncQueue]);

  const updateQuestions = useCallback(async (updatedQuestionsList: Question[]) => {
    const currentQuestions = getStoredQuestions();
    const updatesMap = new Map(updatedQuestionsList.map(q => [q.id, q]));
    const newQuestions = currentQuestions.map(q => updatesMap.get(q.id) || q);
    setQuestions(newQuestions);
    setStoredQuestions(newQuestions);
    const newOps: SyncOperation[] = updatedQuestionsList.map(q => ({ type: 'update', payload: q }));
    updateSyncQueue([...getSyncQueue(), ...newOps]);
    processSyncQueue();
  }, [processSyncQueue]);

  const deleteQuestion = useCallback(async (questionId: string) => {
    const updatedQuestions = getStoredQuestions().filter(q => q.id !== questionId);
    setQuestions(updatedQuestions);
    setStoredQuestions(updatedQuestions);
    const currentQueue = getSyncQueue();
    const pendingCreateOp = currentQueue.find(op => op.type === 'create' && op.tempId === questionId);
    let newQueue;
    if (pendingCreateOp) newQueue = currentQueue.filter(op => op !== pendingCreateOp);
    else newQueue = [...currentQueue, { type: 'delete', payload: { id: questionId } } as SyncOperation];
    updateSyncQueue(newQueue);
    processSyncQueue();
  }, [processSyncQueue]);

  const deleteQuestions = useCallback(async (questionIds: string[]) => {
    const updatedQuestions = getStoredQuestions().filter(q => !questionIds.includes(q.id));
    setQuestions(updatedQuestions);
    setStoredQuestions(updatedQuestions);
    const idsToDeleteSet = new Set(questionIds);
    let currentQueue = getSyncQueue();
    const filteredQueue = currentQueue.filter(op => {
        if (op.type === 'create' && idsToDeleteSet.has(op.tempId)) {
            idsToDeleteSet.delete(op.tempId);
            return false;
        }
        return true;
    });
    const newOps: SyncOperation[] = Array.from(idsToDeleteSet).map(id => ({ type: 'delete', payload: { id } } as SyncOperation));
    updateSyncQueue([...filteredQueue, ...newOps]);
    processSyncQueue();
  }, [processSyncQueue]);
  
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-full">
          <Spinner />
          <p className="mt-4 text-slate-400 font-medium animate-pulse">Initializing AI Study Environment...</p>
        </div>
      );
    }

    if (!session) return <Auth />;

    if (role === UserRole.USER) {
      return <Quiz key={navKey} questions={questions} userId={session.user.id} activeTab={activeTab} onTabChange={setActiveTab} />;
    } else {
      return (
        <AdminDashboard
            key={navKey}
            questions={questions}
            onAddQuestion={addQuestion}
            onAddQuestions={addQuestions}
            onUpdateQuestion={updateQuestion}
            onUpdateQuestions={updateQuestions}
            onDeleteQuestion={deleteQuestion}
            onDeleteQuestions={deleteQuestions}
            isWritePermissionError={isWritePermissionError}
            isReplicaIdentityError={isReplicaIdentityError}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        />
      );
    }
  }

  const getPageTitle = () => {
      switch(activeTab) {
          case 'dashboard': return 'Dashboard';
          case 'exams': return 'Exam Library';
          case 'ai-tutor': return 'AI Tutor';
          case 'analytics': return 'Analytics';
          case 'profile': return 'My Profile';
          case 'settings': return 'Settings';
          case 'metadata': return 'Metadata Management';
          case 'creator': return 'AI Question Creator';
          default: return 'PSC AI Prep';
      }
  }

  const isAdmin = session?.user?.email === ADMIN_EMAIL;
  const user = session ? {
      name: session.user.email?.split('@')[0] || 'Aspirant',
      avatar: `https://ui-avatars.com/api/?name=${session.user.email}&background=135bec&color=fff`,
      plan: role === UserRole.ADMIN ? 'Admin Access' : 'Premium Scholar'
  } : undefined;

  return (
    <div className="min-h-screen font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased selection:bg-primary/30 overflow-hidden">
        {session ? (
            <div className="flex h-screen overflow-hidden">
                <Sidebar
                    currentRole={role}
                    onSignOut={handleSignOut}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isAdmin={isAdmin}
                    onToggleRole={toggleRole}
                />
                <main className="flex-1 ml-20 lg:ml-72 min-h-screen relative flex flex-col overflow-hidden">
                    {/* Background decorative elements */}
                    <div className="fixed top-[-10%] right-[-5%] w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none z-[-1]"></div>
                    <div className="fixed bottom-[10%] left-[20%] w-64 h-64 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none z-[-1]"></div>

                    <TopNav
                        title={getPageTitle()}
                        breadcrumbs={['Home', getPageTitle()]}
                        user={user}
                    />
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
                        <div className="max-w-7xl mx-auto">
                            {renderContent()}
                        </div>
                    </div>
                </main>
            </div>
        ) : (
            <Auth />
        )}
    </div>
  );
};

export default App;
