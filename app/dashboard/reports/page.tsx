'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  traffic_source_id?: string;
}

export default function DrillDownReportPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [availableParams, setAvailableParams] = useState<string[]>([]);
  const [param1, setParam1] = useState('');
  const [param2, setParam2] = useState('');
  const [param3, setParam3] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/campaigns');
        const data = await res.json();
        setCampaigns(data);
      } catch (error) {
        console.error("Failed to fetch campaigns", error);
      }
      setIsLoading(false);
    };
    fetchCampaigns();
  }, []);

  useEffect(() => {
    const fetchParams = async () => {
      if (selectedCampaign) {
        const campaign = campaigns.find(c => c.id === selectedCampaign);
        if (campaign && campaign.traffic_source_id) {
          try {
            const res = await fetch(`/api/traffic-sources/${campaign.traffic_source_id}`);
            const data = await res.json();
            setAvailableParams(data || []);
          } catch (error) {
            console.error("Failed to fetch params", error);
            setAvailableParams([]);
          }
        } else {
          setAvailableParams([]);
        }
        setParam1('');
        setParam2('');
        setParam3('');
        setReportData([]);
      }
    };
    fetchParams();
  }, [selectedCampaign, campaigns]);

  const handleGenerateReport = async () => {
    if (!selectedCampaign || !param1) {
      alert('Please select a campaign and at least one parameter.');
      return;
    }
    setIsGenerating(true);
    
    const queryParams = new URLSearchParams({
        campaignId: selectedCampaign,
        param1: param1,
    });
    if (param2) queryParams.append('param2', param2);
    if (param3) queryParams.append('param3', param3);

    try {
        const res = await fetch(`/api/reports?${queryParams.toString()}`);
        const data = await res.json();
        setReportData(data);
    } catch (error) {
        console.error("Failed to generate report", error);
        setReportData([]);
    }

    setIsGenerating(false);
  };

  const getFilteredParams = (level: number) => {
    const selected = [param1, param2, param3].slice(0, level - 1);
    return availableParams.filter(p => !selected.includes(p));
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <h2 className="text-3xl font-black tracking-tight text-slate-900">Drill-Down Report</h2>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="lg:col-span-1">
          <label htmlFor="campaign" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Campaign</label>
          <Select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)} disabled={isLoading}>
            <option value="">{isLoading ? 'Loading...' : 'Select Campaign'}</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div className="lg:col-span-1">
          <label htmlFor="param1" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tier 1</label>
          <Select value={param1} onChange={e => setParam1(e.target.value)} disabled={!selectedCampaign}>
            <option value="">Select Parameter</option>
            {getFilteredParams(1).map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>
        <div className="lg:col-span-1">
          <label htmlFor="param2" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tier 2</label>
          <Select value={param2} onChange={e => setParam2(e.target.value)} disabled={!param1}>
            <option value="">Select Parameter</option>
            {getFilteredParams(2).map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>
        <div className="lg:col-span-1">
          <label htmlFor="param3" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tier 3</label>
          <Select value={param3} onChange={e => setParam3(e.target.value)} disabled={!param2}>
            <option value="">Select Parameter</option>
            {getFilteredParams(3).map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>
        <div className="lg:col-span-1">
          <button 
            onClick={handleGenerateReport}
            disabled={isGenerating || !param1}
            className="w-full bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest disabled:bg-indigo-300 hover:bg-indigo-700 transition-all"
          >
            {isGenerating ? 'Loading...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Report Table */}
      {reportData.length > 0 && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h4 className="font-black text-slate-800 tracking-tight">Report Results</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                <tr>
                  <th scope="col" className="px-6 py-3">{param1 || 'Param 1'}</th>
                  {param2 && <th scope="col" className="px-6 py-3">{param2}</th>}
                  {param3 && <th scope="col" className="px-6 py-3">{param3}</th>}
                  <th scope="col" className="px-6 py-3 text-right">Visits</th>
                  <th scope="col" className="px-6 py-3 text-right">Clicks</th>
                  <th scope="col" className="px-6 py-3 text-right">Conversions</th>
                  <th scope="col" className="px-6 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-800">{row[param1]}</td>
                    {param2 && <td className="px-6 py-4 text-slate-600">{row[param2]}</td>}
                    {param3 && <td className="px-6 py-4 text-slate-600">{row[param3]}</td>}
                    <td className="px-6 py-4 text-right font-mono text-slate-800">{row.visits.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-800">{row.clicks.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-green-600 font-bold">{row.conversions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-green-600 font-bold">${row.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// A reusable Select component to keep the UI consistent
function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative w-full">
      <select
        {...props}
        className="w-full appearance-none bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
      >
        {children}
      </select>
      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}
