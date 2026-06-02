'use client';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

export type SnapRow = {
  date: string; followers: number | null; reach: number | null; impressions: number | null;
  profileVisits: number | null; websiteClicks: number | null; adSpend: string | null;
  adResults: number | null; newLeads: number | null;
};

const SERIES: { key: keyof SnapRow; label: string; color: string }[] = [
  { key: 'followers', label: 'Seguidores', color: '#FF5A1F' },
  { key: 'reach', label: 'Alcance', color: '#FFA257' },
  { key: 'newLeads', label: 'Leads', color: '#3DD68C' },
  { key: 'adSpend', label: 'Gasto ads', color: '#5AA9FF' },
];

export function MetricTrends({ data, metric }: { data: SnapRow[]; metric: keyof SnapRow }) {
  const s = SERIES.find((x) => x.key === metric) ?? SERIES[0];
  const rows = data.map((r) => ({ d: r.date.slice(5), v: Number(r[metric] ?? 0) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={rows} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2C241D" />
        <XAxis dataKey="d" stroke="#9A8F85" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#9A8F85" fontSize={11} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          contentStyle={{ background: '#16120E', border: '1px solid #2C241D', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#D6CDC4' }} formatter={(v) => [v as number, s.label]}
        />
        <Area type="monotone" dataKey="v" stroke={s.color} strokeWidth={2.5} fill={`url(#g-${s.key})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
