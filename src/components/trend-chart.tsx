'use client';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

type Row = { d: string; reach: number; engagement: number };

export function TrendChart({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2C241D" />
        <XAxis dataKey="d" stroke="#9A8F85" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#9A8F85" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: '#16120E', border: '1px solid #2C241D', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#D6CDC4' }}
        />
        <Line type="monotone" dataKey="reach" stroke="#FF5A1F" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="engagement" stroke="#FFA257" strokeWidth={2} dot={false} strokeDasharray="4 3" />
      </LineChart>
    </ResponsiveContainer>
  );
}
