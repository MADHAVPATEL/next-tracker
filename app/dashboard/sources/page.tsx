import React from 'react';
import { Globe, Plus, Link as LinkIcon, Layers, Settings2, Trash2, Edit3 } from 'lucide-react';

export const runtime = 'edge';

/**
 * Note: getRequestContext is only available in the actual Cloudflare Pages environment.
 * We use dynamic importing and a fallback mechanism to ensure the UI renders in this preview.
 */
async function getInfrastructure() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext();
    const db = env.DB;

    const [landers, offers, sources] = await Promise.all([
      db.prepare("SELECT * FROM landers ORDER BY id DESC").all(),
      db.prepare("SELECT * FROM offers ORDER BY id DESC").all(),
      db.prepare("SELECT * FROM traffic_sources ORDER BY id DESC").all(),
    ]);

    return { 
      landers: landers.results || [], 
      offers: offers.results || [], 
      sources: sources.results || [] 
    };
  } catch (e) {
    // Fallback Mock Data for Preview Environment
    return {
      landers: [
        { id: 'l1', name: 'Main Lander v1', url: 'https://lander.pulse-saas.com/v1' },
        { id: 'l2', name: 'Quiz Page Alpha', url: 'https://lander.pulse-saas.com/quiz' }
      ],
      offers: [
        { id: 'o1', name: 'Health Supplement', url: 'https://network.com/offer/123' },
        { id: 'o2', name: 'Crypto Course', url: 'https://network.com/offer/456' }
      ],
      sources: [
        { id: 's1', name: 'Google Search', params: 'gclid,keyword,matchtype' },
        { id: 's2', name: 'FB Pixel', params: 'fbclid,adid,campaign_id' }
      ]
    };
  }
}

export default async function SourcesPage() {
  const { landers, offers, sources } = await getInfrastructure();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Infrastructure</h2>
          <p className="text-slate-500 font-medium">Manage your traffic sources, landers, and offer destinations.</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                <Settings2 size={14} /> Global Params
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Landers Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 tracking-widest">
              <Layers size={14} className="text-indigo-500" /> Landers
            </div>
            <button className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
              <Plus size={18} />
            </button>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50">
                {landers.length > 0 ? landers.map((l: any) => (
                <div key={l.id} className="p-6 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                    <div className="truncate pr-4">
                        <p className="text-sm font-black text-slate-800">{l.name}</p>
                        <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">{l.url}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-300 hover:text-slate-600"><Edit3 size={14} /></button>
                        <button className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                </div>
                )) : (
                    <div className="p-10 text-center text-xs text-slate-300 font-bold italic">No landers added</div>
                )}
            </div>
          </div>
        </section>

        {/* Offers Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 tracking-widest">
              <Globe size={14} className="text-emerald-500" /> Offers
            </div>
            <button className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-emerald-100">
              <Plus size={18} />
            </button>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50">
                {offers.length > 0 ? offers.map((o: any) => (
                <div key={o.id} className="p-6 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                    <div className="truncate pr-4">
                        <p className="text-sm font-black text-slate-800">{o.name}</p>
                        <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">{o.url}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-300 hover:text-slate-600"><Edit3 size={14} /></button>
                        <button className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                </div>
                )) : (
                    <div className="p-10 text-center text-xs text-slate-300 font-bold italic">No offers added</div>
                )}
            </div>
          </div>
        </section>

        {/* Traffic Sources Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 tracking-widest">
              <Plus size={14} className="text-indigo-600" /> Traffic Sources
            </div>
            <button className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
              <Plus size={18} />
            </button>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50">
                {sources.length > 0 ? sources.map((ts: any) => (
                <div key={ts.id} className="p-6 hover:bg-slate-50/50 transition-colors group relative">
                    <div className="flex justify-between items-start">
                        <p className="text-sm font-black text-slate-800">{ts.name}</p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 text-slate-300 hover:text-slate-600"><Edit3 size={12} /></button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                    {ts.params.split(',').map((p: string) => (
                        <span key={p} className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-100">
                        {p.trim()}
                        </span>
                    ))}
                    </div>
                </div>
                )) : (
                    <div className="p-10 text-center text-xs text-slate-300 font-bold italic">No sources added</div>
                )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
