
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Spinner from './Spinner';
import { ADMIN_EMAIL } from '../types';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(ADMIN_EMAIL);
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
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage('Password reset link sent! Check your email.');
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Success! Check your email for the confirmation link.');
      } else {
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
    <div className="fixed inset-0 w-full mesh-gradient flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl mix-blend-screen"></div>

        <div className="glass-panel w-full max-w-[480px] rounded-2xl overflow-hidden relative z-10 animate-fade-in my-auto">
            {/* Header Section */}
            <div className="p-8 pb-0 text-center">
                <div className="flex justify-center items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-white text-2xl">school</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">PSC AI Prep</h1>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                    {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-slate-400 text-sm">
                    {isForgotPassword
                        ? 'Enter your email to receive a reset link'
                        : (isSignUp ? 'Join to start practicing' : 'Enter your details to access your AI study plan.')}
                </p>
            </div>

            {/* Tab Switcher */}
            {!isForgotPassword && (
                <div className="px-8 mt-8">
                    <div className="relative flex w-full p-1 bg-background-dark/50 rounded-xl border border-white/5">
                        <div className="w-1/2">
                            <button
                                onClick={() => { setIsSignUp(false); setError(null); setMessage(null); }}
                                className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-200 focus:outline-none ${!isSignUp ? 'text-white bg-primary/90 shadow ring-1 ring-black ring-opacity-5' : 'text-slate-400 hover:text-white'}`}
                            >
                                Login
                            </button>
                        </div>
                        <div className="w-1/2">
                            <button
                                onClick={() => { setIsSignUp(true); setError(null); setMessage(null); }}
                                className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-200 focus:outline-none ${isSignUp ? 'text-white bg-primary/90 shadow ring-1 ring-black ring-opacity-5' : 'text-slate-400 hover:text-white'}`}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Section */}
            <div className="p-8 pt-6">
                {error && (
                    <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium animate-fade-in">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium animate-fade-in">
                        {message}
                    </div>
                )}

                <form onSubmit={handleAuthAction} className="space-y-5">
                    {/* Email Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1" htmlFor="email">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
                            </div>
                            <input
                                className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-white/10 transition-all duration-200 sm:text-sm"
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    {!isForgotPassword && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1" htmlFor="password">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
                                </div>
                                <input
                                    className="block w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-white/10 transition-all duration-200 sm:text-sm"
                                    id="password"
                                    placeholder="••••••••"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <div
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-slate-500 hover:text-slate-300 transition-colors text-lg">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Utility Row */}
                    {!isForgotPassword && (
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                                <input className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 focus:ring-offset-0 transition-colors" id="remember-me" name="remember-me" type="checkbox"/>
                                <label className="ml-2 block text-slate-300" htmlFor="remember-me">Remember me</label>
                            </div>
                            {!isSignUp && (
                                <div className="text-sm">
                                    <button
                                        type="button"
                                        onClick={switchToForgotPassword}
                                        className="font-medium text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#101622] focus:ring-primary transition-all duration-200 shadow-[0_0_20px_rgba(19,91,236,0.3)] hover:shadow-[0_0_25px_rgba(19,91,236,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? <Spinner /> : (
                            <>
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <span className="material-symbols-outlined text-white/50 group-hover:text-white transition-colors">
                                        {isForgotPassword ? 'mail' : 'login'}
                                    </span>
                                </span>
                                {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Login to Account'}
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                {!isForgotPassword && (
                    <>
                        <div className="relative mt-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-[#151b28] text-slate-400 rounded-full text-xs uppercase tracking-wider font-semibold">Or continue with</span>
                            </div>
                        </div>

                        {/* Social Login */}
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center w-full px-4 py-3 border border-white/10 rounded-xl shadow-sm bg-white/5 text-sm font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200" type="button">
                                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"></path>
                                </svg>
                                Google
                            </button>
                            <button className="flex items-center justify-center w-full px-4 py-3 border border-white/10 rounded-xl shadow-sm bg-white/5 text-sm font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200" type="button">
                                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.1 1.88-2.52 5.76.67 7.23-.62 1.4-1.39 2.76-2.72 4m-4.08-14.7c1.3-1.65 2.14-3.15 1.86-5.04-1.68.12-3.63 1.21-4.7 2.45-1.02 1.15-1.84 2.91-1.57 4.6 1.76.12 3.3-1.09 4.41-2.01z"></path>
                                </svg>
                                Apple
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Footer area inside card */}
            <div className="px-8 py-6 bg-black/20 border-t border-white/5 text-center">
                <p className="text-sm text-slate-400">
                    {isForgotPassword ? (
                        <button onClick={toggleMode} className="font-medium text-primary hover:text-primary/80 transition-colors">
                            Back to Login
                        </button>
                    ) : (
                        <>
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                            <button
                                onClick={toggleMode}
                                className="font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                {isSignUp ? 'Login here' : 'Sign up for free'}
                            </button>
                        </>
                    )}
                </p>
            </div>
        </div>
    </div>
  );
};

export default Auth;
