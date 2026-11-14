import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { Loader } from '../components/Loader';
import { ErrorBox } from '../components/ErrorBox';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  TrendingUp,
  ShieldAlert,
  Users,
  Activity,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

const BAR_COLORS = [
  '#DC2626', // Red (Digital arrest)
  '#EA580C', // Orange (Electricity bill)
  '#D97706', // Amber (Bank kyc)
  '#7C3AED', // Purple (Part-time job)
  '#2563EB', // Blue (Customs)
  '#059669'  // Emerald
];

export function TrendsPage() {
  const [data, setData] = useState({
    total_scans: 0,
    scams_caught: 0,
    total_reports: 0,
    last_7_days: [],
    top_reported: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTrends() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.trends.get();
        if (res) {
          setData({
            total_scans: res.total_scans ?? 0,
            scams_caught: res.scams_caught ?? 0,
            total_reports: res.total_reports ?? 0,
            last_7_days: res.last_7_days || [],
            top_reported: res.top_reported || []
          });
        }
      } catch (err) {
        console.error('Failed to load trends:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadTrends();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-50 text-navy-900 border border-navy-200 text-sm font-bold">
          <TrendingUp className="w-4 h-4 text-navy-600" />
          <span>National Scam Trends Live Radar</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-navy-950 tracking-tight">
          India Scam Trends & Community Intelligence
        </h1>
        <p className="text-lg sm:text-xl text-slate-700 font-medium">
          Real-time aggregated fraud trends across India based on citizen checks, live call interceptions, and community reports.
        </p>
      </div>

      <ErrorBox error={error} />

      {/* 3 Large Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Total Checks Completed
            </span>
            <Activity className="w-6 h-6 text-navy-600" />
          </div>
          <div className="text-4xl font-black text-navy-950">
            {data.total_scans != null ? data.total_scans.toLocaleString('en-IN') : '0'}
          </div>
          <p className="text-sm text-slate-600 font-medium">
            Messages, calls, and payment identifiers scanned across India
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-red-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-red-700">
              Scams Intercepted
            </span>
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-4xl font-black text-red-600">
            {data.scams_caught != null ? data.scams_caught.toLocaleString('en-IN') : '0'}
          </div>
          <p className="text-sm text-slate-600 font-medium">
            High-severity extortion calls and phishing links stopped
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-emerald-800">
              Community Reports
            </span>
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-4xl font-black text-emerald-600">
            {data.total_reports != null ? data.total_reports.toLocaleString('en-IN') : '0'}
          </div>
          <p className="text-sm text-slate-600 font-medium">
            Crowdsourced malicious numbers and UPI IDs logged
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200">
          <Loader message="Rendering scam analytics and charts..." />
        </div>
      ) : (
        <div className="space-y-10">
          {/* Recharts Bar Chart: Scam Types (Last 7 Days) */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-navy-950">
                Top Scam Vectors in India (Last 7 Days)
              </h2>
              <p className="text-sm text-slate-600 font-medium">
                Breakdown of active fraud categories targeting Indian citizens this week
              </p>
            </div>

            <div className="h-[360px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.last_7_days}
                  margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="scam_type"
                    interval={0}
                    tick={{ fontSize: 13, fontWeight: 600, fill: '#334155' }}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 13, fontWeight: 600, fill: '#64748B' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F1E36',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`${value} incidents`, 'Weekly Cases']}
                  />
                  <Bar
                    dataKey="count"
                    radius={[8, 8, 0, 0]}
                    animationDuration={1200}
                  >
                    {data.last_7_days.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Reported Identifiers (Masked) */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-navy-950">
                  Most Reported Fraud Identifiers (Masked for Privacy)
                </h2>
                <p className="text-sm text-slate-600 font-medium">
                  Frequently cited numbers and handles reported to the National Cyber Crime network
                </p>
              </div>

              <Link
                to="/check"
                className="min-h-[48px] px-6 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-base shadow flex items-center justify-center gap-2 transition-colors shrink-0"
              >
                <Search className="w-5 h-5" />
                <span>Verify an Identifier</span>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-xs font-black tracking-wider">
                    <th className="py-3 px-4">Identifier Type</th>
                    <th className="py-3 px-4">Masked Value</th>
                    <th className="py-3 px-4 text-right">Complaint Reports</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {data.top_reported.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                          {item.identifier_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        {item.identifier_value}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-red-600">
                        {item.report_count} reports
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          to="/check"
                          className="text-sm font-bold text-navy-900 hover:underline inline-flex items-center gap-1"
                        >
                          Check <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
