import React from 'react';
import { 
  Zap, Plus, Copy, Trash2, Rocket, 
  Edit3, X, BarChart3, TrendingUp, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';

// Using the path alias defined in tsconfig.json for more reliable resolution
import { 
  getDb, 
  launchCampaign, 
  deleteRecord, 
  getInfrastructureData, 
  getCampaignStats 
} from '@/app/lib/db';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export const runtime = 'edge';

interface Props {
  searchParams: Promise<{ editId?: string }>;
}

/**
 * HELPER: Safe JSON Parsing to prevent page crashes on malformed DB data
 */
function safeParse(str: string | null | undefined, fallback: any = []) {
  if (!str || typeof str !== 'string') return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return fallback;
  }
}

export default async function CampaignsPage({ searchParams }: Props) {
  const params = await searchParams;
  const editId = params.editId;
  
  const headersList = await headers();
  const host = headersList.get('host') || 'your-domain.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  let campaigns: any[] = [];
  let infrastructure = { landers: [], offers: [], sources: [] };
  let stats: any = {};
  let dbError = null;

  try {
    const db = await getDb();
    
    // 1. Fetch campaigns with explicit join and column alias for TS params
    const queryResult = await db.prepare(`
      SELECT 
        c.id, c.name, c.lander_id, c.offer_id, c.traffic_source_id, c.status,
        l.name AS lander_name, 
        o.name AS offer_name, 
        ts.name as ts_name, 
        ts.params as ts_params
      FROM campaigns c
      LEFT JOIN landers l ON c.lander_id = l.id
      LEFT JOIN offers o ON c.offer_id = o.id
      LEFT JOIN traffic_sources ts ON c.traffic_source_id = ts.id
      ORDER BY c.id DESC
    `).all();

    campaigns = (queryResult.results || []).map((c: any) => ({
      ...c,
      ts_params_parsed: safeParse(c.ts_params)
    }));

    // 2. Fetch dependencies
    infrastructure = await getInfrastructureData();
    stats = await getCampaignStats();
  } catch (err: any) {
    console.error("Database Fetch Error:", err);
    dbError = err.message;
  }

  const { landers, offers, sources } = infrastructure;
  const editingCampaign = editId ? campaigns.find((c: any) => c.id === editId) : null;

  /**
   * SERVER ACTION: Save or Update Campaign
   */
  async function handleSave(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const landerId = formData.get('lander_id') as string;
    const offerId = formData.get('offer_id') as string;
    const trafficSourceId = formData.get('traffic_source_id') as string;

    try {
      if (id) {
        const database = await getDb();
        await database.prepare("UPDATE campaigns SET name = ?, lander_id = ?, offer_id = ?, traffic_source_id = ? WHERE id = ?")
          .bind(name, landerId, offerId, trafficSourceId, id).run();
      } else {
        await launchCampaign({ name, landerId, offerId, trafficSourceId });
      }
      revalidatePath('/dashboard/campaigns');
    } catch (e) {
      console.error("Save Error:", e);
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Campaigns</h2>
          <p className="text-slate-500 font-medium italic">Track your traffic flow and monitor real-time ROI.</p>
        </div>
      </div>

      {dbError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold shadow-sm">
          <AlertCircle size={20} />
          <div>
            <p>Database Connectivity Issue</p>
            <p className="text-[10px] font-mono opacity-70">{dbError}</p>
          </div>
        </div>
      )}

      {/* CAMPAIGN EDITOR */}
      <section className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${editingCampaign ? 'bg-indigo-50 border-indigo-200 ring-8 ring-indigo-500/5' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            {editingCampaign ? <Edit3 size={14} className="text-indigo-600" /> : <Rocket size={14} />} 
            {editingCampaign ? `Modifying: ${editingCampaign.name}` : 'Launch Tracking Link'}
          </h3>
          {editingCampaign && (
            <a href="/dashboard/campaigns" className="text-[10px] font-black text-indigo-400 hover:text-indigo-600 flex items-center gap-1 uppercase tracking-widest">
              <X size={12} /> Cancel Edit
            </a>
          )}
        </div>

        <form action={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input type="hidden" name="id" value={editingCampaign?.id || ''} />
          <input 
            name="name" 
            placeholder="Campaign Name" 
            required 
            defaultValue={editingCampaign?.name || ''} 
            className="lg:col-span-2 p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500/20 outline-none shadow-sm" 
          />
          <select name="lander_id" required defaultValue={editingCampaign?.lander_id || ""} className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none cursor-pointer">
            <option disabled value="">Select Lander</option>
            {landers.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select name="offer_id" required defaultValue={editingCampaign?.offer_id || ""} className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none cursor-pointer">
            <option disabled value="">Select Offer</option>
            {offers.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select name="traffic_source_id" required defaultValue={editingCampaign?.traffic_source_id || ""} className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none cursor-pointer">
            <option disabled value="">Traffic Source</option>
            {sources.map((ts: any) => <option key={ts.id} value={ts.id}>{ts.name}</option>)}
          </select>
          <button className={`lg:col-span-5 ${editingCampaign ? 'bg-indigo-600' : 'bg-slate-900'} text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-xl transition-all active:scale-[0.98] hover:opacity-90`}>
            {editingCampaign ? 'Update Routing' : 'Deploy Tracking Link'}
          </button>
        </form>
      </section>

      {/* CAMPAIGN LIST */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-6">Tracker Details</th>
              <th className="px-8 py-6">24h Stats</th>
              <th className="px-8 py-6">Pathing</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {campaigns.map((c: any) => {
              const s = stats[c.id] || { visits: 0, clicks: 0, revenue: 0 };
              const cr = s.visits > 0 ? ((s.clicks / s.visits) * 100).toFixed(1) : '0.0';
              
              // Map parameters for URL generation
              const paramString = (c.ts_params_parsed || []).map((p: any) => `${p.key}=${p.value}`).join('&');
              const finalLink = `${origin}/${c.id}${paramString ? '?' + paramString : ''}`;

              return (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-slate-800 text-base">{c.name}</div>
                      <span className="text-[9px] text-indigo-500 font-black uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50">
                        {c.ts_name || 'Direct'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                       <input 
                         readOnly 
                         value={finalLink} 
                         className="bg-slate-100 text-[10px] px-3 py-2 rounded-xl border border-slate-200 w-80 font-mono text-slate-500 outline-none cursor-pointer hover:bg-slate-200 transition-colors" 
                         onClick={(e) => (e.target as HTMLInputElement).select()}
                       />
                       <button 
                         title="Copy Tracking Link"
                         className="p-2.5 text-indigo-500 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 shadow-sm transition-all active:scale-90"
                         onClick={() => {
                           const el = document.createElement('textarea');
                           el.value = finalLink;
                           document.body.appendChild(el);
                           el.select();
                           document.execCommand('copy');
                           document.body.removeChild(el);
                         }}
                       >
                         <Copy size={14} />
                       </button>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-10">
                       <div className="min-w-[80px]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visits</p>
                          <p className="text-xl font-black text-slate-700">{Math.round(s.visits).toLocaleString()}</p>
                       </div>
                       <div className="min-w-[80px]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clicks (CR)</p>
                          <p className="text-xl font-black text-indigo-600">{Math.round(s.clicks)} <span className="text-xs text-slate-300 ml-1">({cr}%)</span></p>
                       </div>
                       <div className="min-w-[80px]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rev</p>
                          <p className="text-xl font-black text-emerald-500">${s.revenue.toFixed(2)}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <TrendingUp size={12} className="text-slate-300" />
                        <span className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 max-w-[160px] truncate">{c.lander_name || 'No Lander'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600">
                        <CheckCircle2 size={12} className="text-indigo-300" />
                        <span className="bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100/50 max-w-[160px] truncate">{c.offer_name || 'No Offer'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`?editId=${c.id}`} className="p-3 text-slate-300 hover:text-indigo-600 transition-all bg-white border border-transparent hover:border-slate-100 rounded-2xl hover:shadow-sm">
                        <Edit3 size={18} />
                      </a>
                      <form action={async () => { 'use server'; await deleteRecord('campaigns', c.id); revalidatePath('/dashboard/campaigns'); }}>
                        <button className="p-3 text-slate-200 hover:text-red-500 transition-all bg-white border border-transparent hover:border-slate-100 rounded-2xl hover:shadow-sm">
                          <Trash2 size={18} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {campaigns.length === 0 && !dbError && (
          <div className="p-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="text-slate-200" size={36} />
            </div>
            <p className="text-slate-800 font-black text-lg tracking-tight">Deployment Ready</p>
            <p className="text-slate-400 text-sm mt-1">Configure your first tracking link using the form above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
