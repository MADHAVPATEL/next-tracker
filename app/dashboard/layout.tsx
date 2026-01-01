import React from 'react';
import { LayoutDashboard, Globe, Zap, BarChart3, Settings, ShieldCheck } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Navigation items for the SaaS structure
  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Campaigns', href: '/dashboard/campaigns', icon: Zap },
    { name: 'Traffic Sources', href: '/dashboard/sources', icon: Globe },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar - Fixed width, no-shrink */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col flex-shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <ShieldCheck size={18} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter">
              Pulse <span className="text-indigo-600 italic">SaaS</span>
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <a 
              key={item.name} 
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all group"
            >
              <item.icon size={18} className="group-hover:scale-110 transition-transform duration-200" />
              {item.name}
            </a>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</p>
            <p className="text-xs font-bold text-slate-700 mt-1">Free Tier / Edge</p>
          </div>
          <button className="flex items-center gap-3 w-full px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        {/* Top Header / Breadcrumb placeholder */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md px-8 py-4 border-b border-slate-200/50 md:hidden">
           <h1 className="text-lg font-black text-indigo-600">Pulse</h1>
        </div>

        <div className="p-4 md:p-10 lg:p-12">
          <div className="max-w-5xl mx-auto">
            {children || (
              <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 bg-white/50">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <LayoutDashboard size={32} className="text-slate-200" />
                </div>
                <p className="font-semibold tracking-tight">Dashboard ready</p>
                <p className="text-xs mt-1">Select a route to view tracking data</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
