import React from 'react';
import { Zap, Plus, Copy, Trash2, Rocket, Edit3, X, Save } from 'lucide-react';
import { getDb, launchCampaign, deleteRecord, getInfrastructureData } from '../../lib/db';
import { revalidatePath } from 'next/cache';

export const runtime = 'edge';

interface Props {
  searchParams: Promise<{ editId?: string }>;
}

export default async function CampaignsPage({ searchParams }: Props) {
  const params = await searchParams;
  const editId = params.editId;

  const db = await getDb();
  const { results: campaigns } = await db.prepare(`
    SELECT c.*, l.name AS lander_name, o.name AS offer_name, ts.name as ts_name
    FROM campaigns c
    LEFT JOIN landers l ON c.lander_id = l.id
    LEFT JOIN offers o ON c.offer_id = o.id
    LEFT JOIN traffic_sources ts ON c.traffic_source_id = ts.id
    ORDER BY c.id DESC
  `).all();

  const { landers, offers, sources } = await getInfrastructureData();
  const editingCampaign = editId ? campaigns.find((c: any) => c.id === editId) : null;

  async function handleSave(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const landerId = formData.get('lander_id') as string;
    const offerId = formData.get('offer_id') as string;
    const trafficSourceId = formData.get('traffic_source_id') as string;

    if (id) {
      const db = await getDb();
      await db.prepare("UPDATE campaigns SET name = ?, lander_id = ?, offer_id = ?, traffic_source_id = ? WHERE id = ?")
        .bind(name, landerId, offerId, trafficSourceId, id)
        .run();
      // Note: In production, you'd also want to refresh the KV redirect mapping here
    } else {
      await launchCampaign({ name, landerId, offerId, trafficSourceId });
    }
    revalidatePath('/dashboard/campaigns');
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Campaigns</h2>
        <p className="text-slate-500 font-medium">Launch and manage your tracking engines.</p>
      </div>

      <section className={`p-8 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden ${editingCampaign ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 shadow-sm'}`}>
        {!editingCampaign && (
          <div className="absolute top-0 right-0 p-8 text-indigo-50/50 -rotate-12 translate-x-4 -translate-y-4">
            <Rocket size={120} />
          </div>
        )}
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            {editingCampaign ? `Editing Campaign: ${editingCampaign.name}` : 'Launch New Campaign'}
          </h3>
          {editingCampaign && (
            <a href="/dashboard/campaigns" className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-600 flex items-center gap-1">
              <X size={12} /> Cancel Edit
            </a>
          )}
        </div>

        <form action={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
          <input type="hidden" name="id" value={editingCampaign?.id || ''} />
          <input 
            name="name" 
            placeholder="Campaign Name" 
            required 
            defaultValue={editingCampaign?.name || ''}
            className="lg:col-span-2 p-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium" 
          />
          <select name="lander_id" required defaultValue={editingCampaign?.lander_id || ""} className="p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold">
            <option disabled value="">Select Lander</option>
            {landers.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select name="offer_id" required defaultValue={editingCampaign?.offer_id || ""} className="p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold">
            <option disabled value="">Select Offer</option>
            {offers.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select name="traffic_source_id" required defaultValue={editingCampaign?.traffic_source_id || ""} className="p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold">
            <option disabled value="">Traffic Source</option>
            {sources.map((ts: any) => <option key={ts.id} value={ts.id}>{ts.name}</option>)}
          </select>
          <button className={`lg:col-span-5 ${editingCampaign ? 'bg-indigo-600' : 'bg-slate-900'} text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-2`}>
            {editingCampaign ? <Save size={16} /> : null}
            {editingCampaign ? 'Update Tracking Engine' : 'Deploy Tracking Link'}
          </button>
        </form>
      </section>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
            <tr className="border-b border-slate-100">
              <th className="px-8 py-5">Name & Source</th>
              <th className="px-8 py-5">Slug</th>
              <th className="px-8 py-5">Route</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {campaigns.map((c: any) => (
              <tr key={c.id} className={`hover:bg-slate-50/40 transition-colors group ${editId === c.id ? 'bg-indigo-50/30' : ''}`}>
                <td className="px-8 py-5">
                  <div className="font-bold text-slate-800">{c.name}</div>
                  <div className="text-[10px] text-indigo-500 font-black uppercase mt-0.5">{c.ts_name}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <code className="bg-slate-100 text-[10px] px-2 py-1 rounded border">/{c.id}</code>
                    <button className="p-1 text-slate-300 hover:text-indigo-600"><Copy size={14} /></button>
                  </div>
                </td>
                <td className="px-8 py-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[150px]">
                        {c.lander_name} → {c.offer_name}
                    </p>
                </td>
                <td className="px-8 py-5 text-right flex items-center justify-end gap-1">
                  <a href={`?editId=${c.id}`} className="p-2 text-slate-200 hover:text-indigo-500 transition-colors"><Edit3 size={18} /></a>
                  <form action={async () => { 'use server'; await deleteRecord('campaigns', c.id); revalidatePath('/dashboard/campaigns'); }}>
                    <button className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
