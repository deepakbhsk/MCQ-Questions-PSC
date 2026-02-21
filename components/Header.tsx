import React from 'react';
import { UserRole, SyncStatus } from '../types';
import Icon from './Icon';
import { Session } from '@supabase/supabase-js';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  syncStatus: SyncStatus;
  session: Session;
  onSignOut: () => void;
  isAdmin: boolean;
  onRetrySync?: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLogoClick: () => void;
}

/**
 * ⚡ Bolt: Memoized Header to prevent redundant re-renders.
 * Combined with useCallback in App.tsx for stable function props.
 */
const Header: React.FC<HeaderProps> = React.memo(({
    currentRole, 
    onRoleChange, 
    syncStatus, 
    session, 
    onSignOut, 
    isAdmin, 
    onRetrySync, 
    isDarkMode, 
    onToggleTheme,
    onLogoClick
}) => {
  const isUser = currentRole === UserRole.USER;

  const handleToggle = () => {
    onRoleChange(isUser ? UserRole.ADMIN : UserRole.USER);
  };

  const syncIndicator = {
    idle: { 
        icon: 'checkCircle', 
        iconColor: 'text-emerald-500', 
        textColor: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'Synced',
        clickable: false
    },
    syncing: { 
        icon: 'refresh', 
        iconColor: 'text-indigo-500 animate-spin', 
        textColor: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        border: 'border-indigo-200 dark:border-indigo-800',
        text: 'Syncing...',
        clickable: false
    },
    error: { 
        icon: 'xCircle', 
        iconColor: 'text-rose-500', 
        textColor: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-900/20',
        border: 'border-rose-200 dark:border-rose-800',
        text: 'Error',
        clickable: true 
    }
  }[syncStatus] || { 
      icon: 'xCircle', 
      iconColor: 'text-stone-400', 
      textColor: 'text-stone-500',
      bg: 'bg-stone-100 dark:bg-stone-800', 
      border: 'border-stone-200 dark:border-stone-700',
      text: 'Unknown',
      clickable: false
  };

  return (
    <header className="sticky top-0 z-50 pt-2 pb-2">
        <div className="max-w-6xl mx-auto bg-white dark:bg-stone-900 shadow-sm border-b border-stone-200 dark:border-stone-800/50 px-6 py-3 flex justify-between items-center transition-colors duration-300 rounded-b-2xl sm:rounded-2xl sm:mt-2 sm:mx-4">
            <button 
                onClick={onLogoClick}
                className="flex items-center gap-3 group focus:outline-none"
                title="Go to Home"
            >
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-md transition-transform duration-200 group-hover:scale-105">
                    <Icon name="academicCap" className="w-5 h-5" />
                </div>
                <div className="text-left hidden xs:block">
                    <h1 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight leading-none">
                        PSC<span className="text-indigo-600 dark:text-indigo-400">Practice</span>
                    </h1>
                </div>
            </button>

            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <button
                    onClick={onToggleTheme}
                    className="p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    <Icon name={isDarkMode ? "sun" : "moon"} className="w-5 h-5" />
                </button>

                {/* Sync Status */}
                <button 
                    onClick={syncIndicator.clickable && onRetrySync ? onRetrySync : undefined}
                    disabled={!syncIndicator.clickable}
                    className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 ${syncIndicator.bg} ${syncIndicator.border} ${syncIndicator.clickable ? 'cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/30' : 'cursor-default'}`} 
                >
                    <Icon name={syncIndicator.icon as any} className={`w-3.5 h-3.5 ${syncIndicator.iconColor}`} />
                    <span className={`text-[10px] uppercase font-bold tracking-wide ${syncIndicator.textColor}`}>{syncIndicator.text}</span>
                </button>
                
                {isAdmin && (
                    <div className="relative flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-lg w-32 h-9 border border-stone-200 dark:border-stone-700 transition-colors">
                        <button
                            onClick={handleToggle}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            aria-label="Toggle Admin Mode"
                        />
                        <div 
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-stone-600 rounded-[6px] shadow-sm border border-stone-200 dark:border-stone-500 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isUser ? 'left-1' : 'left-[calc(50%)]'}`}
                        ></div>
                        <span className={`relative z-0 flex-1 text-center text-[10px] font-bold transition-colors duration-200 ${isUser ? 'text-indigo-700 dark:text-indigo-300' : 'text-stone-400 dark:text-stone-500'}`}>Student</span>
                        <span className={`relative z-0 flex-1 text-center text-[10px] font-bold transition-colors duration-200 ${!isUser ? 'text-indigo-700 dark:text-indigo-300' : 'text-stone-400 dark:text-stone-500'}`}>Admin</span>
                    </div>
                )}

                <div className="h-5 w-px bg-stone-200 dark:bg-stone-700 mx-1"></div>

                <button
                    onClick={onSignOut}
                    className="p-2 text-stone-400 hover:text-rose-600 dark:text-stone-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    title="Sign Out"
                >
                    <Icon name="logout" className="w-5 h-5" />
                </button>
            </div>
        </div>
    </header>
  );
});

export default Header;