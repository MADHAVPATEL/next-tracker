import React from 'react';
import { ArrowUpRight, Users, Zap, DollarSign, Activity } from 'lucide-react';

export const runtime = 'edge';

/**
 * PRODUCTION NOTE: 
 * In your actual Cloudflare Pages environment, you will use:
 * import { getRequestContext } from '@cloudflare/next-on-pages';
 * const { env } = getRequestContext();
 */

async function getStats() {
  // Mocking data for the preview environment
  // In production, you will use your env.DB.prepare(...) calls here
  return { 
    campaignCount: 12,
    visitCount: 14502,
    revenue: 1240.55,
    clickCount: 890,
    conversions: 45
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { 
      label: 'Active Campaigns', 
      value: stats.campaignCount, 
      trend: '+2', 
      icon: Zap,
      color: 'text-orange-500',
      bg: 'bg-orange-50'
    },
    { 
      label: 'Total Visits', 
      value: stats.visitCount.toLocaleString(), 
      trend: '+12.5%', 
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    { 
      label: 'Revenue', 
      value: `$${stats.revenue.toLocaleString()}`, 
      trend: '+$240', 
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-50'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Pulse Overview</h2>
          <p className="text-slate-500 font-medium">Real-time performance of your traffic engine.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <Activity size={14} className="text-green-500 animate-pulse" />
          System Live
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`${card.bg} ${card.color} p-3 rounded-2xl`}>
                <card.icon size={24} />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${card.bg} ${card.color}`}>
                {card.trend}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
            <h3 className="text-4xl font-black mt-1 text-slate-800">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h4 className="font-black text-slate-800 tracking-tight">Recent Conversions</h4>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="divide-y divide-slate-50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Campaign-Alpha-{i}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Click ID: 8xf2...9a{i}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-800">+$12.50</p>
                  <p className="text-[10px] text-slate-400">2 mins ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-xl font-bold">New Performance Metric</h4>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              We've integrated the Traffic Source Engine directly into your dashboard. 
              You can now see breakdown by <span className="text-indigo-400 font-bold">gclid</span> and 
              <span className="text-indigo-400 font-bold">fbclid</span> in real-time.
            </p>
            <button className="mt-6 bg-white text-slate-900 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              Go to Analytics <ArrowUpRight size={14} />
            </button>
          </div>
          {/* Decorative element */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/40 transition-all"></div>
        </div>
      </div>
    </div>
  );
}
