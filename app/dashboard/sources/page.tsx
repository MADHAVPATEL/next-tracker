import React from 'react';
import { Globe, Plus, Link as LinkIcon, Layers, Trash2, Zap, Edit3, X, Save } from 'lucide-react';
// Using absolute alias for reliable resolution
import { getInfrastructureData, addInfrastructure, deleteRecord, getDb, updateInfrastructure } from '@/app/lib/db';
import { revalidatePath } from 'next/cache';

export const runtime = 'edge';

interface Props {
  searchParams: Promise<{ editId?: string; type?: string }>;
}

/**
 * Dynamic Parameter Row Component
 * Handles the Query Key, Value/Token, and Friendly Name fields.
 */
function ParamRow({ index, data }: { index: number; data?: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-colors">
      <div className="space-y-1">
        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Query Key</label>
        <input 
          name={`p_key_${index}`} 
          placeholder="e.g. s1" 
          defaultValue={data?.key || ''} 
          className="w-full text-[11px] p-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Value / Token</label>
        <input 
          name={`p_val_${index}`} 
          placeholder="e.g. {clickid}" 
          defaultValue={data?.value || ''} 
          className="w-full text-[11px] p-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Friendly Name</label>
        <input 
          name={`p_name_${index}`} 
          placeholder="e.g. Sub ID 1" 
          defaultValue={data?.name || ''} 
          className="w-full text-[11px] p-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20" 
        />
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
      // Support up to 10 dynamic parameters
      for (let i = 0; i < 10; i++) {
        const key = formData.get(`p_key_${i}`) as string;
        const val = formData.get(`p_val_${i}`) as string;
        const friendlyName = formData.get(`p_name_${i}`) as string;
        if (key) sourceParams.push({ key, value: val, name: friendlyName });
      }

      if (id) {
        await updateInfrastructure('traffic_sources', id, { name, params: sourceParams });
      } else {
        await addInfrastructure('traffic_sources', { name, params: sourceParams });
      }
    } else {
      const url = formData.get('value') as string;
      if (id) {
        await updateInfrastructure(type, id, { name, url });
      } else {
        await addInfrastructure(type, { name, url });
      }
    }
    
    revalidatePath('/dashboard/sources');
  }

  const allItems = [...landers, ...offers, ...sources];
  const editingItem = editId ? allItems.find(item => item.id === editId) : null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Infrastructure</h2>
          <p className="text-slate-500 font-medium">Manage tracking assets and dynamic traffic source parameters.</p>
        </div>
      </div>

      {/* ASSET EDITOR FORM */}
      <section className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${editingItem ? 'bg-indigo-50/50 border-indigo-200 ring-8 ring-indigo-500/5' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            {editingItem ? <Edit3 size={14} className="text-indigo-600" /> : <Plus size={14} />} 
            {editingItem ? `Editing: ${editingItem.name}` : 'New Tracking Asset'}
          </h3>
          {editingItem && (
            <a href="/dashboard/sources" className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1">
              <X size={12} /> Cancel Edit
            </a>
          )}
        </div>
        
        <form action={handleSave} className="space-y-6">
          <input type="hidden" name="id" value={editingItem?.id || ''} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Asset Type</label>
                <select 
                    name="type" 
                    required 
                    defaultValue={editType}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20 disabled:opacity-50"
                    disabled={!!editingItem}
                >
                    {editingItem && <input type="hidden" name="type" value={editType} />}
                    <option value="landers">Landing Page</option>
                    <option value="offers">Offer Destination</option>
                    <option value="traffic_sources">Traffic Source (Dynamic Params)</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Internal Name</label>
                <input 
                    name="name" 
                    placeholder="e.g. Google Search - US" 
                    required 
                    defaultValue={editingItem?.name || ''}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-indigo-500/20" 
                />
             </div>
          </div>

          {/* DYNAMIC PARAMETER BUILDER */}
          {(editType === 'traffic_sources') && (
            <div className="space-y-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
               <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Parameter Mapping Configuration</label>
                  <span className="text-[9px] text-slate-400 font-bold italic">Mappings will be forwarded to your Lander</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <ParamRow key={i} index={i} data={editingItem?.params?.[i]} />
                  ))}
               </div>
            </div>
          )}

          {editType !== 'traffic_sources' && (
             <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Destination URL</label>
                <input 
                    name="value" 
                    placeholder="https://your-page.com/lander" 
                    required={editType !== 'traffic_sources'}
                    defaultValue={editingItem?.url || ''}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-mono outline-none focus:ring-2 ring-indigo-500/20" 
                />
             </div>
          )}

          <button type="submit" className={`w-full ${editingItem ? 'bg-indigo-600' : 'bg-slate-900'} text-white font-black py-5 rounded-2xl text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100`}>
            {editingItem ? <Save size={18} /> : <Plus size={18} />}
            {editingItem ? 'Update Asset' : 'Save Asset'}
          </button>
        </form>
      </section>

      {/* ASSET LIST GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Landers Column */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 tracking-widest px-2"><Layers size={14} /> Landers</h4>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm divide-y">
            {landers.map((l: any) => (
              <div key={l.id} className="p-5 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-700">{l.name}</p>
                  <p className="text-[9px] text-slate-400 truncate font-mono">{l.url}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={`?editId=${l.id}&type=landers`} className="p-2 text-slate-400 hover:text-indigo-500"><Edit3 size={16} /></a>
                  <form action={async () => { 'use server'; await deleteRecord('landers', l.id); revalidatePath('/dashboard/sources'); }}>
                    <button className="p-2 text-slate-200 hover:text-red-500"><Trash2 size={16} /></button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Offers Column */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 tracking-widest px-2"><Globe size={14} /> Offers</h4>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm divide-y">
            {offers.map((o: any) => (
              <div key={o.id} className="p-5 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-700">{o.name}</p>
                  <p className="text-[9px] text-slate-400 truncate font-mono">{o.url}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={`?editId=${o.id}&type=offers`} className="p-2 text-slate-400 hover:text-indigo-500"><Edit3 size={16} /></a>
                  <form action={async () => { 'use server'; await deleteRecord('offers', o.id); revalidatePath('/dashboard/sources'); }}>
                    <button className="p-2 text-slate-200 hover:text-red-500"><Trash2 size={16} /></button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sources Column */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 tracking-widest px-2"><Zap size={14} /> Traffic Sources</h4>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm divide-y">
            {sources.map((ts: any) => (
              <div key={ts.id} className="p-6 group relative hover:bg-slate-50/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">{ts.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {ts.params?.map((p: any, i: number) => (
                            <div key={i} className="flex items-center bg-indigo-50/50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100/50">
                                <span className="text-[9px] font-black">{p.key}</span>
                                <span className="mx-1 text-indigo-200 text-[8px]">|</span>
                                <span className="text-[8px] font-medium opacity-70">{p.name}</span>
                            </div>
                        ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    <a href={`?editId=${ts.id}&type=traffic_sources`} className="p-2 text-slate-400 hover:text-indigo-500"><Edit3 size={16} /></a>
                    <form action={async () => { 'use server'; await deleteRecord('traffic_sources', ts.id); revalidatePath('/dashboard/sources'); }}>
                        <button className="p-2 text-slate-200 hover:text-red-500"><Trash2 size={16} /></button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
