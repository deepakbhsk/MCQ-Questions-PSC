
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from './Icon';
import Spinner from './Spinner';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false); // New state for reset flow
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('deepakbhaskarank01@gmail.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isForgotPassword) {
        // Handle Password Reset
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage('Password reset link sent! Check your email.');
      } else if (isSignUp) {
        // Handle Sign Up
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Success! Check your email for the confirmation link.');
      } else {
        // Handle Sign In
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      let errMsg = error?.error_description || error?.message || "An unknown authentication error occurred.";
      
      if (errMsg.includes("Invalid login credentials")) {
          errMsg = "Invalid credentials. Please create an account if you haven't.";
      } else if (errMsg.includes("Email not confirmed")) {
          errMsg = "Email not confirmed. Please check your inbox.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
      if (isForgotPassword) {
          setIsForgotPassword(false);
          setIsSignUp(false);
      } else {
          setIsSignUp(!isSignUp);
      }
      setError(null);
      setMessage(null);
  };

  const switchToForgotPassword = () => {
      setIsForgotPassword(true);
      setIsSignUp(false);
      setError(null);
      setMessage(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in px-4">
        <div className="w-full max-w-sm relative">
            {/* Decorative blurred background */}
            <div className="absolute top-0 -left-4 w-60 h-60 sm:w-72 sm:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-60 h-60 sm:w-72 sm:h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
            
            {/* Card with Glassmorphism */}
            <div className="relative bg-white/50 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 sm:p-8 overflow-hidden">
                
                <div className="flex flex-col items-center mb-6 sm:mb-8">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 text-white">
                         <Icon name={isForgotPassword ? "lock" : "academicCap"} className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight text-center">
                        {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 text-center">
                        {isForgotPassword 
                            ? 'Enter your email to receive a reset link' 
                            : (isSignUp ? 'Join to start practicing' : 'Sign in to continue learning')}
                    </p>
                </div>

                {!isSignUp && !isForgotPassword && (
                    <div className="mb-6 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30 text-xs font-medium text-indigo-700 dark:text-indigo-300 flex gap-2 items-center">
                        <Icon name="briefcase" className="w-4 h-4 flex-shrink-0" />
                        <p>Demo Admin credentials pre-filled.</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 px-4 py-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800/30 flex items-center gap-3">
                        <Icon name="xCircle" className="w-5 h-5 text-rose-500 flex-shrink-0" />
                        <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold leading-snug">{error}</p>
                    </div>
                )}
                
                {message && (
                    <div className="mb-6 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-3">
                         <Icon name="checkCircle" className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold leading-snug">{message}</p>
                    </div>
                )}

                <form onSubmit={handleAuthAction} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white transition-all outline-none placeholder-slate-400 backdrop-blur-sm"
                            placeholder="you@example.com"
                        />
                    </div>

                    {!isForgotPassword && (
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Password</label>
                                {!isSignUp && (
                                    <button 
                                        type="button" 
                                        onClick={switchToForgotPassword}
                                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                            <div className="relative group">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white transition-all outline-none placeholder-slate-400 backdrop-blur-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <Icon name={showPassword ? "eyeSlash" : "eye"} className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-[0.98]"
                    >
                        {loading ? <Spinner /> : (isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
                    <button 
                        onClick={toggleMode} 
                        className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors"
                    >
                        {isForgotPassword 
                            ? "Back to Log In" 
                            : (isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up")}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Auth;
