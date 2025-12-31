import React from 'react';
import { LayoutDashboard, Globe, Zap, BarChart3, Settings } from 'lucide-react';

export default function App({ children }: { children: React.ReactNode }) {
  // Navigation items matching your SaaS goals
  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Campaigns', href: '/dashboard/campaigns', icon: Zap },
    { name: 'Traffic Sources', href: '/dashboard/sources', icon: Globe },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-black text-indigo-600 tracking-tighter">
            Pulse <span className="text-slate-900 text-sm italic font-medium">SaaS</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <a 
              key={item.name} 
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all group"
            >
              <item.icon size={18} className="group-hover:scale-110 transition-transform" />
              {item.name}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto">
          {children || (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
              <p>Select a view from the sidebar to begin.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
