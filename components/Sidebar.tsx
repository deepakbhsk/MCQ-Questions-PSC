
import React from 'react';
import { UserRole } from '../types';

interface SidebarProps {
  currentRole: UserRole;
  onSignOut: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  onToggleRole: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  onSignOut,
  activeTab,
  setActiveTab,
  isAdmin,
  onToggleRole
}) => {
  const isUser = currentRole === UserRole.USER;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'exams', label: 'Exams', icon: 'quiz' },
    { id: 'ai-tutor', label: 'AI Tutor', icon: 'psychology', badge: 'NEW' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  ];

  const settingItems = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside className="w-20 lg:w-72 glass-panel h-screen flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 border-r border-white/10">
        <div className="p-6 flex items-center gap-4">
            <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-white">school</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#111722]"></div>
            </div>
            <div className="hidden lg:flex flex-col">
                <h1 className="font-bold text-lg tracking-tight text-white">PSC Prep AI</h1>
                <span className="text-xs text-white/50 font-medium">Premium Plan</span>
            </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                        activeTab === item.id
                        ? 'bg-primary/20 text-white border border-primary/20 shadow-[0_0_15px_rgba(19,91,236,0.3)]'
                        : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                >
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="hidden lg:block font-medium">{item.label}</span>
                    {item.badge && (
                        <span className="hidden lg:flex ml-auto text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-bold">
                            {item.badge}
                        </span>
                    )}
                </button>
            ))}

            <div className="pt-4 mt-4 border-t border-white/5">
                <p className="hidden lg:block px-4 text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Settings</p>
                {settingItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                            activeTab === item.id
                            ? 'bg-primary/20 text-white border border-primary/20 shadow-[0_0_15px_rgba(19,91,236,0.3)]'
                            : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span className="hidden lg:block font-medium">{item.label}</span>
                    </button>
                ))}

                {isAdmin && (
                    <button
                        onClick={onToggleRole}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group mt-2 ${
                            !isUser
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                            : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">admin_panel_settings</span>
                        <span className="hidden lg:block font-medium">Admin Mode</span>
                    </button>
                )}
            </div>
        </nav>

        <div className="p-4 border-t border-white/10">
            <button
                onClick={onSignOut}
                className="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
                <span className="material-symbols-outlined">logout</span>
                <span className="hidden lg:block font-medium">Sign Out</span>
            </button>
        </div>
    </aside>
  );
};

export default Sidebar;
