import React from 'react';
import { TrendingUp, MousePointerClick, Target, DollarSign } from 'lucide-react';

export const runtime = 'edge';

export default async function DashboardOverview(props: any) {
  // Stats will eventually be fetched from your SQL Analytics logic
  return (
    <div className="p-8 space-y-10">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pulse Overview</h2>
        <p className="text-sm text-slate-400 font-medium uppercase tracking-widest mt-1">Real-time Performance (Last 24h)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Visits" value="0" icon={<TrendingUp className="text-blue-500" />} />
        <StatCard label="Lander Clicks" value="0" icon={<MousePointerClick className="text-indigo-500" />} />
        <StatCard label="Conversions" value="0" icon={<Target className="text-green-500" />} />
        <StatCard label="Estimated Revenue" value="$0.00" icon={<DollarSign className="text-emerald-500" />} />
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-20 text-center space-y-4">
         <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
            <TrendingUp size={32} />
         </div>
         <h3 className="font-bold text-slate-800">Waiting for Data</h3>
         <p className="text-sm text-slate-400 max-w-xs mx-auto">Once your tracking links start receiving traffic, real-time analytics will appear here.</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  );
}
