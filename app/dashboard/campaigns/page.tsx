import React from 'react';
import { Zap, Plus, ExternalLink, Copy, TrendingUp, BarChart3 } from 'lucide-react';

export const runtime = 'edge';

/**
 * Note: getRequestContext is only available in the actual Cloudflare Pages environment.
 * For this preview, we handle the potential resolution error.
 */
async function getCampaignData() {
  try {
    // We dynamically require to avoid build-time errors in environments 
    // without the cloudflare context provided.
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext();
    const db = env.DB;

    const { results: campaigns } = await db.prepare(`
      SELECT c.*, l.name AS lander_name, o.name AS offer_name, ts.name as ts_name, ts.params as ts_params
      FROM campaigns c
      LEFT JOIN landers l ON c.lander_id = l.id
      LEFT JOIN offers o ON c.offer_id = o.id
      LEFT JOIN traffic_sources ts ON c.traffic_source_id = ts.id
      ORDER BY c.id DESC
    `).all();

    return campaigns.map((c: any) => ({
      ...c,
      stats: { visits: 1200, clicks: 450, revenue: 154.20 } // Real logic would go here
    }));
  } catch (e) {
    // Fallback/Mock data for the preview environment
    return [
      {
        id: 'cmp-alpha',
        name: 'Summer Sale 2024',
        ts_name: 'Google Ads',
        lander_name: 'Main Lander v2',
        offer_name: 'Premium Subscription',
        stats: { visits: 24502, clicks: 890, revenue: 1240.55 }
      },
      {
        id: 'cmp-beta',
        name: 'FB Retargeting',
        ts_name: 'Facebook',
        lander_name: 'Discount LP',
        offer_name: 'Ebook Bundle',
        stats: { visits: 1240, clicks: 310, revenue: 450.00 }
      }
    ];
  }
}

export default async function CampaignsPage() {
  const campaigns = await getCampaignData();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Campaigns</h2>
          <p className="text-slate-500 font-medium italic">Track your traffic flow and conversion engine.</p>
        </div>
        <button className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
          <Plus size={18} /> New Campaign
        </button>
      </div>

      {/* Campaign List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                <th className="px-8 py-6">Campaign Info</th>
                <th className="px-8 py-6">Tracking Path</th>
                <th className="px-8 py-6">Real-time Metrics</th>
                <th className="px-8 py-6 text-right">Mapping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {campaigns.map((c: any) => {
                const cr = c.stats.visits > 0 ? ((c.stats.clicks / c.stats.visits) * 100).toFixed(1) : '0';
                return (
                  <tr key={c.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-800 text-lg tracking-tight">{c.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-md">
                          {c.ts_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 group/link">
                        <code className="bg-slate-50 text-[11px] px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 font-mono">
                          /{c.id}
                        </code>
                        <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm">
                          <Copy size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-8">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visits</p>
                          <p className="text-xl font-black text-slate-800">{c.stats.visits.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CTR</p>
                          <p className="text-xl font-black text-indigo-600">{cr}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
                          <p className="text-xl font-black text-emerald-500">${c.stats.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="inline-flex flex-col items-end">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                          <span className="bg-slate-100 px-2 py-1 rounded-lg">{c.lander_name}</span>
                          <TrendingUp size={12} className="text-slate-300" />
                          <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">{c.offer_name}</span>
                        </div>
                        <button className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                          View Details <ExternalLink size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
