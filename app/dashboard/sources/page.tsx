import React from 'react';
import { Globe, Plus, Link as LinkIcon, Layers, Trash2, Zap, Edit3, X, Save } from 'lucide-react';
// Use relative paths to ensure resolution in the preview environment
import { getInfrastructureData, addInfrastructure, deleteRecord, getDb } from '../../lib/db';
import { revalidatePath } from 'next/cache';

export const runtime = 'edge';

interface Props {
  searchParams: Promise<{ editId?: string; type?: string }>;
}

export default async function SourcesPage({ searchParams }: Props) {
  const { landers, offers, sources } = await getInfrastructureData();
  const params = await searchParams;
  const editId = params.editId;
  const editType = params.type;

  // Server Action for adding/updating items
  async function handleSave(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const type = formData.get('type') as string;
    const name = formData.get('name') as string;
    const value = formData.get('value') as string;

    const db = await getDb();
    const valueColumn = type === 'traffic_sources' ? 'params' : 'url';

    if (id) {
      // Update existing
      await db.prepare(`UPDATE ${type} SET name = ?, ${valueColumn} = ? WHERE id = ?`)
        .bind(name, value, id)
        .run();
    } else {
      // Create new
      await addInfrastructure(type, { name, [valueColumn]: value });
    }
    
    revalidatePath('/dashboard/sources');
  }

  // Find the item being edited
  const allItems = [...landers, ...offers, ...sources];
  const editingItem = editId ? allItems.find(item => item.id === editId) : null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Infrastructure</h2>
          <p className="text-slate-500 font-medium">Manage your tracking assets and traffic parameters.</p>
        </div>
      </div>

      {/* SAVE / EDIT FORM */}
      <section className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${editingItem ? 'bg-indigo-50 border-indigo-200 ring-4 ring-indigo-500/5' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            {editingItem ? <Edit3 size={14} className="text-indigo-600" /> : <Plus size={14} />} 
            {editingItem ? `Editing Asset: ${editingItem.name}` : 'Quick Add Asset'}
          </h3>
          {editingItem && (
            <a href="/dashboard/sources" className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-600 flex items-center gap-1">
              <X size={12} /> Cancel Edit
            </a>
          )}
        </div>
        
        <form action={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="hidden" name="id" value={editingItem?.id || ''} />
          <select 
            name="type" 
            required 
            defaultValue={editType || 'landers'}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20 disabled:opacity-50"
            disabled={!!editingItem}
          >
            {editingItem && <input type="hidden" name="type" value={editType} />}
            <option value="landers">Lander</option>
            <option value="offers">Offer</option>
            <option value="traffic_sources">Traffic Source</option>
          </select>
          <input 
            name="name" 
            placeholder="Display Name" 
            required 
            defaultValue={editingItem?.name || ''}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium" 
          />
          <input 
            name="value" 
            placeholder={editType === 'traffic_sources' ? "CSV Params (gclid,adid)" : "https://..."} 
            required 
            defaultValue={editingItem?.url || editingItem?.params || ''}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium" 
          />
          <button type="submit" className={`${editingItem ? 'bg-indigo-600' : 'bg-slate-900'} text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2`}>
            {editingItem ? <Save size={14} /> : null}
            {editingItem ? 'Update Asset' : 'Save Asset'}
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Landers */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 tracking-widest px-2"><Layers size={14} /> Landers</h4>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm divide-y overflow-hidden">
            {landers.map((l: any) => (
              <div key={l.id} className={`p-5 flex justify-between items-center group transition-colors ${editId === l.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-700">{l.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{l.url}</p>
                </div>
                <div className="flex items-center gap-1">
                  <a href={`?editId=${l.id}&type=landers`} className="p-2 text-slate-200 hover:text-indigo-500 transition-colors"><Edit3 size={16} /></a>
                  <form action={async () => { 'use server'; await deleteRecord('landers', l.id); revalidatePath('/dashboard/sources'); }}>
                    <button className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Offers */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 tracking-widest px-2"><Globe size={14} /> Offers</h4>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm divide-y overflow-hidden">
            {offers.map((o: any) => (
              <div key={o.id} className={`p-5 flex justify-between items-center group transition-colors ${editId === o.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-700">{o.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{o.url}</p>
                </div>
                <div className="flex items-center gap-1">
                  <a href={`?editId=${o.id}&type=offers`} className="p-2 text-slate-200 hover:text-indigo-500 transition-colors"><Edit3 size={16} /></a>
                  <form action={async () => { 'use server'; await deleteRecord('offers', o.id); revalidatePath('/dashboard/sources'); }}>
                    <button className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 tracking-widest px-2"><Zap size={14} /> Sources</h4>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm divide-y overflow-hidden">
            {sources.map((ts: any) => (
              <div key={ts.id} className={`p-5 flex justify-between items-start group transition-colors ${editId === ts.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                <div>
                  <p className="text-sm font-bold text-slate-700">{ts.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ts.params.split(',').map((p: string) => (
                      <span key={p} className="text-[8px] font-black bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded uppercase">{p.trim()}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a href={`?editId=${ts.id}&type=traffic_sources`} className="p-2 text-slate-200 hover:text-indigo-500 transition-colors"><Edit3 size={16} /></a>
                  <form action={async () => { 'use server'; await deleteRecord('traffic_sources', ts.id); revalidatePath('/dashboard/sources'); }}>
                    <button className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
