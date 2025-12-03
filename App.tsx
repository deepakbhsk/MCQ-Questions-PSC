import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Question, SyncStatus, SyncOperation } from './types';
import Header from './components/Header';
import Quiz from './components/Quiz';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabaseClient';
import Spinner from './components/Spinner';
import Auth from './components/Auth';
import Icon from './components/Icon';
import { Session } from '@supabase/supabase-js';

const QUESTIONS_STORAGE_KEY = 'psc-mcq-questions';
const SYNC_QUEUE_STORAGE_KEY = 'psc-mcq-sync-queue';
const ADMIN_EMAIL = 'deepakbhaskarank01@gmail.com';

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
  
  // 1. Handle strings directly
  if (typeof error === 'string') return error;

  // 2. Handle standard JS Errors
  if (error instanceof Error) return error.message;

  // 3. Check for nested error object (common in Supabase responses)
  if (error.error && typeof error.error === 'object') {
      return formatSupabaseError(error.error);
  }

  // 4. Handle Supabase/Postgrest objects (checked loosely to handle various shapes)
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
      
      if (error.code) {
          return `Database Error: ${error.code}`;
      }
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [navKey, setNavKey] = useState(0);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  };
  
  const handleLogoClick = () => {
    setNavKey(prev => prev + 1);
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
      const { data: newQuestions, error } = await supabase.from('questions').insert(payloads).select();

      if (error) {
        if (String(error.message).includes("violates row-level security policy")) {
            setIsWritePermissionError(true);
        }
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
                    
                    if (error) {
                        deleteError = error;
                        break;
                    }
                }
            }
            
            if (deleteError) {
                if (String(deleteError.message).includes("violates row-level security policy")) {
                    setIsWritePermissionError(true);
                }
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
                if (op.type === 'update') {
                    uniqueUpdates.set(op.payload.id, op.payload);
                }
            });

            const payloads = Array.from(uniqueUpdates.values()).filter(p => !p.id.startsWith('temp-'));
            
            if (payloads.length > 0) {
                const CHUNK_SIZE = 50;
                for (let i = 0; i < payloads.length; i += CHUNK_SIZE) {
                    const chunk = payloads.slice(i, i + CHUNK_SIZE);
                    const { error } = await supabase.from('questions').upsert(chunk);
                    
                    if (error) {
                         if (String(error.message).includes("violates row-level security policy")) {
                            setIsWritePermissionError(true);
                        } else if (String(error.message).includes("does not have a replica identity")) {
                            setIsReplicaIdentityError(true);
                        }
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
    if (!errorOccurred) {
        fetchQuestions(false);
    }
  }, [syncStatus]);

  useEffect(() => {
    if (syncStatus !== 'error') return;
    const intervalId = setInterval(() => {
        processSyncQueue();
    }, 30000);
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
    if (!supabase) {
      setError("Supabase client not initialized. Check lib/supabaseClient.ts.");
      setIsLoading(false);
      return;
    }
    if (!session) {
      setIsLoading(false);
      return;
    }

    const localQuestions = getStoredQuestions();
    if (localQuestions.length > 0) {
      setQuestions(localQuestions);
      setIsLoading(false); 
      fetchQuestions(false); 
    } else {
      fetchQuestions(true); 
    }
    processSyncQueue();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);


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

    const newOps: SyncOperation[] = updatedQuestionsList.map(q => ({
        type: 'update',
        payload: q
    }));
    
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
    if (pendingCreateOp) {
        newQueue = currentQueue.filter(op => op !== pendingCreateOp);
    } else {
        const newOp: SyncOperation = { type: 'delete', payload: { id: questionId } };
        newQueue = [...currentQueue, newOp];
    }

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

    const newOps: SyncOperation[] = Array.from(idsToDeleteSet).map(id => ({
        type: 'delete',
        payload: { id }
    }));
    
    updateSyncQueue([...filteredQueue, ...newOps]);
    processSyncQueue();
  }, [processSyncQueue]);
  
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-16">
          <Spinner />
          <p className="ml-4 text-stone-600 dark:text-stone-400 font-medium">Getting things ready...</p>
        </div>
      );
    }

    if (!session) {
        return <Auth />;
    }

    const isBlockingError = error && questions.length === 0 && !isWritePermissionError && !isReplicaIdentityError;

    if (isBlockingError) {
      return (
        <div className="text-center p-8 bg-rose-100 dark:bg-rose-900/50 rounded-2xl shadow-sm text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">Oops! An Error Occurred</h2>
            <p className="whitespace-pre-wrap text-sm mb-4">{error}</p>
            <button 
                onClick={() => fetchQuestions(true)}
                className="px-6 py-3 bg-rose-600 text-white rounded-lg font-bold text-sm hover:bg-rose-700 transition-colors shadow-sm"
            >
                Retry Fetching
            </button>
        </div>
      );
    }
    
    const ErrorBanner = () => error && !isWritePermissionError && !isReplicaIdentityError ? (
         <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 rounded-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 dark:bg-rose-800/30 rounded-full text-rose-600 dark:text-rose-400">
                     <Icon name="lightning" className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-sm font-bold text-rose-800 dark:text-rose-300">Connection Issue</p>
                    <p className="text-xs text-rose-600 dark:text-rose-400">Showing cached data. Updates may be delayed.</p>
                </div>
            </div>
            <button onClick={() => fetchQuestions(false)} className="px-3 py-1.5 bg-white dark:bg-stone-800 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg border border-rose-100 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                Retry
            </button>
        </div>
    ) : null;
    
    return role === UserRole.USER ? (
      <>
        <ErrorBanner />
        <Quiz key={navKey} questions={questions} userId={session.user.id} />
      </>
    ) : (
      <>
        <ErrorBanner />
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
        />
      </>
    );
  }

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen font-sans text-stone-800 dark:text-stone-100 antialiased selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900/50 dark:selection:text-indigo-100">
        {session && (
            <Header 
                currentRole={role} 
                onRoleChange={setRole} 
                syncStatus={syncStatus} 
                onSignOut={handleSignOut} 
                session={session} 
                isAdmin={isAdmin}
                onRetrySync={processSyncQueue}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
                onLogoClick={handleLogoClick}
            />
        )}
        <main className="p-4 sm:p-6 md:p-8">
            <div className={!session ? "max-w-md mx-auto" : "max-w-4xl mx-auto"}>
            {renderContent()}
            </div>
        </main>
    </div>
  );
};

export default App;