import React from 'react';
import { Globe, Plus, Layers, Trash2, Zap, Edit3, X, Save } from 'lucide-react';
import { getInfrastructureData, addInfrastructure, deleteRecord, getDb, updateInfrastructure } from '@/app/lib/db';
import { revalidatePath } from 'next/cache';

export const runtime = 'edge';

interface Props {
  searchParams: Promise<{ editId?: string; type?: string }>;
}

function ParamRow({ index, data }: { index: number; data?: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group transition-all">
      <div className="space-y-1">
        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Key (URL Param)</label>
        <input name={`p_key_${index}`} placeholder="e.g. gclid" defaultValue={data?.key || ''} className="w-full text-[11px] p-2 bg-white border border-slate-200 rounded-xl outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Token / Macro</label>
        <input name={`p_val_${index}`} placeholder="e.g. {clickid}" defaultValue={data?.value || ''} className="w-full text-[11px] p-2 bg-white border border-slate-200 rounded-xl outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Friendly Name</label>
        <input name={`p_name_${index}`} placeholder="e.g. Click ID" defaultValue={data?.name || ''} className="w-full text-[11px] p-2 bg-white border border-slate-200 rounded-xl outline-none" />
      </div>
    </div>
  );
}

export default async function SourcesPage({ searchParams }: Props) {
  const { landers, offers, sources } = await getInfrastructureData();
  const params = await searchParams;
  const editId = params.editId;
  const editType = params.type || 'landers';

  async function handleSave(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const type = formData.get('type') as string;
    const name = formData.get('name') as string;

    if (type === 'traffic_sources') {
      const sourceParams = [];
      for (let i = 0; i < 10; i++) {
        const key = formData.get(`p_key_${i}`) as string;
        const val = formData.get(`p_val_${i}`) as string;
        const friendlyName = formData.get(`p_name_${i}`) as string;
        if (key) sourceParams.push({ key, value: val, name: friendlyName });
      }
      if (id) await updateInfrastructure('traffic_sources', id, { name, params: sourceParams });
      else await addInfrastructure('traffic_sources', { name, params: sourceParams });
    } else {
      const url = formData.get('value') as string;
      if (id) await updateInfrastructure(type, id, { name, url });
      else await addInfrastructure(type, { name, url });
    }
    revalidatePath('/dashboard/sources');
  }

  const allItems = [...landers, ...offers, ...sources];
  const editingItem = editId ? allItems.find(item => item.id === editId) : null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Infrastructure</h2>
        <p className="text-slate-500 font-medium">Manage traffic sources and destination assets.</p>
      </div>

      <section className={`p-8 rounded-[2.5rem] border transition-all ${editingItem ? 'bg-indigo-50 border-indigo-200 ring-4 ring-indigo-500/5' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
            {editingItem ? <Edit3 size={14} className="text-indigo-600" /> : <Plus size={14} />} 
            {editingItem ? `Editing: ${editingItem.name}` : 'New Asset'}
          </h3>
          {editingItem && <a href="/dashboard/sources" className="text-[10px] font-black text-indigo-400 hover:text-indigo-600 flex items-center gap-1 uppercase"><X size={12} /> Cancel</a>}
        </div>
        <form action={handleSave} className="space-y-6">
          <input type="hidden" name="id" value={editingItem?.id || ''} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <select name="type" required defaultValue={editType} className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold disabled:opacity-50" disabled={!!editingItem}>
                {editingItem && <input type="hidden" name="type" value={editType} />}
                <option value="landers">Lander</option>
                <option value="offers">Offer</option>
                <option value="traffic_sources">Traffic Source</option>
             </select>
             <input name="name" placeholder="Internal Name" required defaultValue={editingItem?.name || ''} className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium" />
          </div>

          {editType === 'traffic_sources' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              {[0, 1, 2, 3, 4, 5].map(i => <ParamRow key={i} index={i} data={editingItem?.params?.[i]} />)}
            </div>
          )}

          {editType !== 'traffic_sources' && (
             <input name="value" placeholder="Destination URL" required={editType !== 'traffic_sources'} defaultValue={editingItem?.url || ''} className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-mono" />
          )}

          <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100">
            {editingItem ? 'Update Asset' : 'Save Asset'}
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {[ {title: 'Landers', items: landers, icon: Layers, type: 'landers'}, 
           {title: 'Offers', items: offers, icon: Globe, type: 'offers'}, 
           {title: 'Sources', items: sources, icon: Zap, type: 'traffic_sources'} 
        ].map((col) => (
          <div key={col.title} className="space-y-4">
            <h4 className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 tracking-widest px-2"><col.icon size={14} /> {col.title}</h4>
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm divide-y overflow-hidden">
              {col.items.map((item: any) => (
                <div key={item.id} className="p-5 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                  <div className="truncate pr-4">
                    <p className="text-sm font-bold text-slate-700">{item.name}</p>
                    <p className="text-[9px] text-slate-400 truncate">{item.url || `${item.params?.length || 0} Params`}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`?editId=${item.id}&type=${col.type}`} className="p-2 text-slate-400 hover:text-indigo-500"><Edit3 size={16} /></a>
                    <form action={async () => { 'use server'; try { await deleteRecord(col.type, item.id); revalidatePath('/dashboard/sources'); } catch (e: any) { console.error(e.message); } }}>
                      <button className="p-2 text-slate-200 hover:text-red-500"><Trash2 size={16} /></button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
