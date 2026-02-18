
import React from 'react';

interface TopNavProps {
  title: string;
  breadcrumbs?: string[];
  onSearch?: (query: string) => void;
  user?: {
    name: string;
    avatar?: string;
    plan?: string;
  };
}

const TopNav: React.FC<TopNavProps> = ({ title, breadcrumbs, user }) => {
  return (
    <header className="h-24 px-8 flex items-center justify-between shrink-0 glass-panel border-b border-white/5 sticky top-0 z-40">
        <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
            {breadcrumbs && (
                <div className="flex items-center gap-2 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={crumb}>
                            <span className={`${index === breadcrumbs.length - 1 ? 'text-white font-medium px-2 py-0.5 rounded bg-white/5 border border-white/5' : 'text-gray-400 hover:text-white cursor-pointer transition-colors'}`}>
                                {crumb}
                            </span>
                            {index < breadcrumbs.length - 1 && (
                                <span className="material-symbols-outlined text-gray-600 text-[16px]">chevron_right</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>

        <div className="flex items-center gap-6">
            {/* Search Bar */}
            <div className="relative group w-96 hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                </div>
                <input
                    className="block w-full pl-10 pr-3 py-2.5 rounded-xl glass-input text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-lg"
                    placeholder="Search exams, topics, or years..."
                    type="text"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-500 border border-gray-600 rounded px-1.5 py-0.5">⌘K</span>
                </div>
            </div>

            {/* Notification & User Profile */}
            <div className="flex items-center gap-4">
                <button className="glass-card w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors relative">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {user && (
                    <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                        <div className="text-right hidden lg:block">
                            <p className="text-sm font-bold text-white">{user.name}</p>
                            <p className="text-xs text-white/50">{user.plan || 'Premium Scholar'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-400 border-2 border-primary/20">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </header>
  );
};

export default TopNav;
