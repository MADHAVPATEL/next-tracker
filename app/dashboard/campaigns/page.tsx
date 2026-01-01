import React from 'react';
import { Zap, Plus, Copy, Trash2, Rocket, Edit3, X, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';
// Using relative paths to ensure resolution in all environments
import { getDb, launchCampaign, deleteRecord, getInfrastructureData, getCampaignStats } from '../../lib/db';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export const runtime = 'edge';

interface Props {
  searchParams: Promise<{ editId?: string }>;
}

export default async function CampaignsPage({ searchParams }: Props) {
  const params = await searchParams;
  const editId = params.editId;
  
  // Get current domain for the tracking link
  // Note: headers() is a server-only function in Next.js
  const headersList = await headers();
  const host = headersList.get('host') || 'your-domain.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  const db = await getDb();
  
  // Fetch campaigns with raw traffic source params for link generation
  const { results: campaignsRaw } = await db.prepare(`
    SELECT c.*, l.name AS lander_name, o.name AS offer_name, ts.name as ts_name, ts.params as ts_params
    FROM campaigns c
    LEFT JOIN landers l ON c.lander_id = l.id
    LEFT JOIN offers o ON c.offer_id = o.id
    LEFT JOIN traffic_sources ts ON c.traffic_source_id = ts.id
    ORDER BY c.id DESC
  `).all();

  const campaigns = (campaignsRaw || []).map((c: any) => {
    let parsedParams = [];
    try { 
      parsedParams = typeof c.ts_params === 'string' ? JSON.parse(c.ts_params) : (c.ts_params || []); 
    } catch (e) { 
      parsedParams = []; 
    }
    return { ...c, ts_params_parsed: parsedParams };
  });

  const { landers, offers, sources } = await getInfrastructureData();
  const stats = await getCampaignStats();
  const editingCampaign = editId ? campaigns.find((c: any) => c.id === editId) : null;

  async function handleSave(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const landerId = formData.get('lander_id') as string;
    const offerId = formData.get('offer_id') as string;
    const trafficSourceId = formData.get('traffic_source_id') as string;

    const db = await getDb();
    if (id) {
      await db.prepare("UPDATE campaigns SET name = ?, lander_id = ?, offer_id = ?, traffic_source_id = ? WHERE id = ?")
        .bind(name, landerId, offerId, trafficSourceId, id).run();
    } else {
      await launchCampaign({ name, landerId, offerId, trafficSourceId });
    }
    revalidatePath('/dashboard/campaigns');
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Campaigns</h2>
          <p className="text-slate-500 font-medium">Generate and monitor your edge tracking links.</p>
        </div>
      </div>

      {/* DEPLOY FORM */}
      <section className={`p-8 rounded-[2.5rem] border transition-all ${editingCampaign ? 'bg-indigo-50 border-indigo-200 ring-4 ring-indigo-500/5' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
            {editingCampaign ? <Edit3 size={14} className="text-indigo-600" /> : <Rocket size={14} />} 
            {editingCampaign ? `Modify: ${editingCampaign.name}` : 'Deploy New Tracker'}
          </h3>
          {editingCampaign && <a href="/dashboard/campaigns" className="text-[10px] font-black text-indigo-400 hover:text-indigo-600 flex items-center gap-1 uppercase"><X size={12} /> Cancel</a>}
        </div>

        <form action={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input type="hidden" name="id" value={editingCampaign?.id || ''} />
          <input name="name" placeholder="Campaign Name" required defaultValue={editingCampaign?.name || ''} className="lg:col-span-2 p-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500/20 outline-none shadow-sm" />
          <select name="lander_id" required defaultValue={editingCampaign?.lander_id || ""} className="p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm">
            <option disabled value="">Select Lander</option>
            {landers.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select name="offer_id" required defaultValue={editingCampaign?.offer_id || ""} className="p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm">
            <option disabled value="">Select Offer</option>
            {offers.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select name="traffic_source_id" required defaultValue={editingCampaign?.traffic_source_id || ""} className="p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm">
            <option disabled value="">Traffic Source</option>
            {sources.map((ts: any) => <option key={ts.id} value={ts.id}>{ts.name}</option>)}
          </select>
          <button className={`lg:col-span-5 ${editingCampaign ? 'bg-indigo-600' : 'bg-slate-900'} text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-xl transition-all active:scale-[0.98]`}>
            {editingCampaign ? 'Update Campaign' : 'Deploy Tracking Link'}
          </button>
        </form>
      </section>

      {/* CAMPAIGN PERFORMANCE TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-6">Campaign & Tracking Link</th>
              <th className="px-8 py-6">Performance (24h)</th>
              <th className="px-8 py-6">Routing Pathway</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {campaigns.map((c: any) => {
              const s = stats[c.id] || { visits: 0, clicks: 0, revenue: 0 };
              const cr = s.visits > 0 ? ((s.clicks / s.visits) * 100).toFixed(1) : '0.0';
              
              // Build the link with configured parameters
              const paramString = c.ts_params_parsed.map((p: any) => `${p.key}=${p.value}`).join('&');
              const finalLink = `${origin}/${c.id}${paramString ? '?' + paramString : ''}`;

              return (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-800 text-base flex items-center gap-2">
                      {c.name}
                      <span className="text-[9px] text-indigo-500 font-black uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50">
                        {c.ts_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                       <input 
                         readOnly 
                         value={finalLink} 
                         className="bg-slate-100 text-[10px] px-3 py-1.5 rounded-xl border border-slate-200 w-64 font-mono text-slate-500 outline-none cursor-pointer hover:bg-slate-200 transition-colors" 
                         onClick={(e) => (e.target as HTMLInputElement).select()}
                       />
                       <button 
                         title="Copy Tracking Link"
                         className="p-2 text-indigo-500 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 shadow-sm transition-all active:scale-90"
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
                    <div className="flex items-center gap-8">
                       <div className="min-w-[70px]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visits</p>
                          <p className="text-lg font-black text-slate-700">{Math.round(s.visits).toLocaleString()}</p>
                       </div>
                       <div className="min-w-[70px]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CTR %</p>
                          <p className="text-lg font-black text-indigo-600">{cr}%</p>
                       </div>
                       <div className="min-w-[70px]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
                          <p className="text-lg font-black text-emerald-500">${s.revenue.toFixed(2)}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <TrendingUp size={12} className="text-slate-300" />
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[150px]">{c.lander_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600">
                        <CheckCircle2 size={12} className="text-indigo-300" />
                        <span className="bg-indigo-50 px-2 py-0.5 rounded-md truncate max-w-[150px]">{c.offer_name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a href={`?editId=${c.id}`} className="p-2.5 text-slate-300 hover:text-indigo-500 transition-colors bg-white border border-transparent hover:border-slate-100 rounded-xl hover:shadow-sm">
                        <Edit3 size={18} />
                      </a>
                      <form action={async () => { 'use server'; await deleteRecord('campaigns', c.id); revalidatePath('/dashboard/campaigns'); }}>
                        <button className="p-2.5 text-slate-200 hover:text-red-500 transition-colors bg-white border border-transparent hover:border-slate-100 rounded-xl hover:shadow-sm">
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
        {campaigns.length === 0 && (
          <div className="p-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="text-slate-200" size={32} />
            </div>
            <p className="text-slate-400 font-bold tracking-tight">No active campaigns found</p>
            <p className="text-slate-300 text-xs mt-1">Deploy your first tracking link above</p>
          </div>
        )}
      </div>
    </div>
  );
}
