'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './data-table';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Campaign {
  id: string;
  name: string;
  traffic_source_id?: string;
}

export default function DrillDownReportPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | undefined>(undefined);
  const [availableParams, setAvailableParams] = useState<string[]>([]);
  const [param1, setParam1] = useState<string | undefined>(undefined);
  const [param2, setParam2] = useState<string | undefined>(undefined);
  const [param3, setParam3] = useState<string | undefined>(undefined);
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
            const paramKeys = (data || []).map((p: any) => p.key);
            setAvailableParams(paramKeys);
          } catch (error) {
            console.error("Failed to fetch params", error);
            setAvailableParams([]);
          }
        } else {
          setAvailableParams([]);
        }
        setParam1(undefined);
        setParam2(undefined);
        setParam3(undefined);
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

  const columns: ColumnDef<any>[] = React.useMemo(() => {
    const dynamicColumns: ColumnDef<any>[] = [];
    if (param1) dynamicColumns.push({
      accessorKey: param1,
      header: param1,
    });
    if (param2) dynamicColumns.push({
      accessorKey: param2,
      header: param2,
    });
    if (param3) dynamicColumns.push({
      accessorKey: param3,
      header: param3,
    });

    return [
      ...dynamicColumns,
      {
        accessorKey: "visits",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Visits
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="text-right">{row.getValue("visits")}</div>,
      },
      {
        accessorKey: "clicks",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Clicks
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
        cell: ({ row }) => <div className="text-right">{row.getValue("clicks")}</div>,
      },
      {
        accessorKey: "conversions",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Conversions
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
        cell: ({ row }) => <div className="text-right">{row.getValue("conversions")}</div>,
      },
      {
        accessorKey: "revenue",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Revenue
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("revenue"))
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(amount)
 
          return <div className="text-right font-medium">{formatted}</div>
        },
      },
    ]
  }, [param1, param2, param3]);

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: reportData.map(d => d[param1 as string]),
    },
    yaxis: {
      title: {
        text: 'Count',
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val.toString();
        },
      },
    },
  };

  const chartSeries = [
    {
      name: 'Visits',
      data: reportData.map(d => d.visits),
    },
    {
      name: 'Clicks',
      data: reportData.map(d => d.clicks),
    },
    {
      name: 'Conversions',
      data: reportData.map(d => d.conversions),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Drill-Down Report</h2>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="campaign">Campaign</Label>
              <Select onValueChange={setSelectedCampaign} value={selectedCampaign} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? 'Loading...' : 'Select Campaign'} />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="param1">Tier 1</Label>
              <Select onValueChange={setParam1} value={param1} disabled={!selectedCampaign}>
                <SelectTrigger>
                    <SelectValue placeholder="Select Parameter" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredParams(1).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="param2">Tier 2</Label>
              <Select onValueChange={setParam2} value={param2} disabled={!param1}>
                <SelectTrigger>
                    <SelectValue placeholder="Select Parameter" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredParams(2).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="param3">Tier 3</Label>
              <Select onValueChange={setParam3} value={param3} disabled={!param2}>
                <SelectTrigger>
                    <SelectValue placeholder="Select Parameter" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredParams(3).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleGenerateReport}
              disabled={isGenerating || !param1}
            >
              {isGenerating ? 'Loading...' : 'Generate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <Chart options={chartOptions} series={chartSeries} type="bar" height={350} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Report Results</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={reportData} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
