import React from 'react';
import { Globe, Plus, Trash2 } from 'lucide-react';

export const runtime = 'edge';

export default async function SourcesPage(props: any) {
  const env = props?.context?.env || {};
  const DB = env.DB;

  const sources = await DB.prepare("SELECT * FROM traffic_sources").all().then((r: any) => r.results || []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-800">Traffic Sources</h2>
        <p className="text-sm text-slate-400 font-medium">Define parameters for automatic tracking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm sticky top-10">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">Add Source</h3>
            <form action="/api/traffic-source" method="POST" className="space-y-4">
              <input name="name" placeholder="e.g. Google Ads" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
              <input name="params" placeholder="Params: gclid,device,adid" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
              <p className="text-[10px] text-slate-400 px-1 leading-relaxed font-medium uppercase tracking-tight">
                Comma separated list of URL parameters to capture.
              </p>
              <button className="w-full bg-indigo-600 text-white font-black py-5 rounded-3xl shadow-lg hover:bg-indigo-700 transition-all">
                Save Source
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {sources.map((ts: any) => (
            <div key={ts.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
               <div>
                  <h4 className="font-black text-slate-800 tracking-tight">{ts.name}</h4>
                  <div className="flex flex-wrap gap-2 mt-3">
                     {ts.params.split(',').map((p: string) => (
                       <span key={p} className="bg-slate-100 text-[10px] font-bold text-slate-500 px-2 py-1 rounded-lg border border-slate-200">
                         {p.trim()}
                       </span>
                     ))}
                  </div>
               </div>
               <button className="text-slate-200 hover:text-red-500 transition-colors p-2">
                  <Trash2 size={18} />
               </button>
            </div>
          ))}
          {sources.length === 0 && (
            <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 text-sm font-medium">
              No traffic sources defined yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
