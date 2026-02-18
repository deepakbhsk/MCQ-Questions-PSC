
import React from 'react';

interface DashboardProps {
  user: {
    name: string;
    avatar?: string;
  };
  stats: {
    totalExams: number;
    avgScore: number;
    globalRank: string;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    time: string;
    score: string;
    status: 'Passed' | 'Perfect' | 'Average' | 'Failed';
  }>;
}

const Dashboard: React.FC<DashboardProps> = ({ user, stats, recentActivity }) => {
  return (
    <div className="space-y-8 animate-fade-in">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2">
            <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 text-glow">Welcome back, {user.name}</h2>
                <p className="text-white/60 font-light text-lg">Let's crack the Degree Level Prelims today.</p>
            </div>
            <div className="hidden md:flex items-center gap-3 glass-card px-4 py-2 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-white/80">Premium Active</span>
            </div>
        </header>

        {/* Profile Overview Card */}
        <section className="glass-card rounded-2xl p-6 lg:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                <div className="relative group-hover:scale-105 transition-transform duration-300">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-br from-white/20 to-transparent">
                        <img
                            src={user.avatar || "https://ui-avatars.com/api/?name=" + user.name}
                            alt={user.name}
                            className="w-full h-full object-cover rounded-full border-4 border-[#1c2333]"
                        />
                    </div>
                    <button className="absolute bottom-2 right-2 w-10 h-10 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30 transition-all hover:scale-110">
                        <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                </div>
                <div className="flex-1 text-center md:text-left space-y-4 w-full">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-white">{user.name}</h3>
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-1 text-white/60">
                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                                <span>Kerala, India</span>
                                <span className="mx-2">•</span>
                                <span>Joined Jan 2024</span>
                            </div>
                        </div>
                        <button className="glass-card hover:bg-white/10 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all border border-white/10 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">settings</span>
                            Edit Profile
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 w-full">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Target Exam</p>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-yellow-400">emoji_events</span>
                                <p className="text-white font-medium">Degree Level Preliminary</p>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Current Status</p>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-400">trending_up</span>
                                <p className="text-white font-medium">Top 15% in Global Rank</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between group hover:border-primary/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                        <span className="material-symbols-outlined">assignment</span>
                    </div>
                    <span className="text-green-400 text-sm font-medium bg-green-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12%
                    </span>
                </div>
                <div>
                    <p className="text-white/60 font-medium text-sm">Total Exams Taken</p>
                    <h4 className="text-3xl font-bold text-white mt-1">{stats.totalExams}</h4>
                </div>
            </div>
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between group hover:border-primary/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                        <span className="material-symbols-outlined">analytics</span>
                    </div>
                    <span className="text-green-400 text-sm font-medium bg-green-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 5%
                    </span>
                </div>
                <div>
                    <p className="text-white/60 font-medium text-sm">Average Score</p>
                    <h4 className="text-3xl font-bold text-white mt-1">{stats.avgScore}%</h4>
                </div>
            </div>
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between group hover:border-primary/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400">
                        <span className="material-symbols-outlined">public</span>
                    </div>
                    <span className="text-green-400 text-sm font-medium bg-green-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 2%
                    </span>
                </div>
                <div>
                    <p className="text-white/60 font-medium text-sm">Global Rank</p>
                    <h4 className="text-3xl font-bold text-white mt-1">{stats.globalRank}</h4>
                </div>
            </div>
        </div>

        {/* Content Split */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column: Activity & Charts */}
            <div className="xl:col-span-2 space-y-6">
                {/* Progress Chart */}
                <div className="glass-card p-6 rounded-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">show_chart</span>
                            Performance Trend
                        </h3>
                        <select className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-primary focus:border-primary outline-none cursor-pointer hover:bg-white/10 transition-colors">
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 3 Months</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                    {/* Simulated Chart Area */}
                    <div className="h-64 w-full relative flex items-end justify-between px-2 gap-2">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                            <div className="w-full h-px bg-white border-t border-dashed"></div>
                            <div className="w-full h-px bg-white border-t border-dashed"></div>
                            <div className="w-full h-px bg-white border-t border-dashed"></div>
                            <div className="w-full h-px bg-white border-t border-dashed"></div>
                            <div className="w-full h-px bg-white border-t border-dashed"></div>
                        </div>
                        {[40, 55, 45, 70, 65, 85].map((h, i) => (
                            <div
                                key={i}
                                className={`w-full rounded-t-lg transition-all relative group cursor-pointer ${i === 5 ? 'bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(19,91,236,0.5)]' : 'bg-primary/20 hover:bg-primary/40'}`}
                                style={{ height: `${h}%` }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                    {h}% Accuracy
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-white/40 mt-2 px-1">
                        <span>Week 1</span>
                        <span>Week 2</span>
                        <span>Week 3</span>
                        <span>Week 4</span>
                        <span>Week 5</span>
                        <span>Current</span>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                        <button className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">View All</button>
                    </div>
                    <div className="divide-y divide-white/5">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                        activity.status === 'Perfect' ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20' :
                                        activity.status === 'Passed' ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20' :
                                        'bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20'
                                    }`}>
                                        <span className="material-symbols-outlined text-lg">
                                            {activity.status === 'Perfect' ? 'emoji_events' : activity.status === 'Passed' ? 'history_edu' : 'quiz'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{activity.title}</p>
                                        <p className="text-white/40 text-xs">{activity.time}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-bold text-sm">{activity.score}</p>
                                    <p className={`text-xs font-medium ${
                                        activity.status === 'Average' ? 'text-yellow-400' : 'text-green-400'
                                    }`}>{activity.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: AI Insights & Quick Actions */}
            <div className="space-y-6">
                {/* AI Insight Widget */}
                <div className="glass-card p-1 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20">
                    <div className="bg-[#111722]/80 backdrop-blur-xl rounded-xl p-6 h-full relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/20 rounded-full blur-[40px]"></div>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
                            </div>
                            <h3 className="text-white font-bold text-lg">AI Tutor Insight</h3>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed mb-4 relative z-10">
                            Based on your recent tests, you're strong in <span className="text-green-400 font-semibold">Geography</span> but need more practice in <span className="text-red-300 font-semibold">Indian History</span>.
                        </p>
                        <div className="bg-white/5 rounded-lg p-3 mb-4 border border-white/5 relative z-10">
                            <p className="text-xs text-white/50 mb-1">Recommended Action</p>
                            <p className="text-white text-sm font-medium">Take a "Modern History" rapid fire quiz.</p>
                        </div>
                        <button className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all relative z-10">
                            Start Quiz Now
                        </button>
                    </div>
                </div>

                {/* Upcoming Exams */}
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Upcoming Exams</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                            <div className="flex flex-col items-center bg-white/5 rounded-lg p-2 min-w-[60px] border border-white/10">
                                <span className="text-xs text-white/50 uppercase">Oct</span>
                                <span className="text-xl font-bold text-white">24</span>
                            </div>
                            <div>
                                <p className="text-white font-medium text-sm">LDC Mains Mock Test</p>
                                <p className="text-white/40 text-xs mt-1">10:00 AM - 11:30 AM</p>
                                <span className="inline-block mt-2 text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500/20">High Priority</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-white/5"></div>
                        <div className="flex gap-4 items-start">
                            <div className="flex flex-col items-center bg-white/5 rounded-lg p-2 min-w-[60px] border border-white/10">
                                <span className="text-xs text-white/50 uppercase">Oct</span>
                                <span className="text-xl font-bold text-white">28</span>
                            </div>
                            <div>
                                <p className="text-white font-medium text-sm">Weekly General Knowledge</p>
                                <p className="text-white/40 text-xs mt-1">All Day Event</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subject Strength Pills */}
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Weak Areas</h3>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium">Modern History</span>
                        <span className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium">Mental Ability</span>
                        <span className="px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-medium">English Grammar</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
