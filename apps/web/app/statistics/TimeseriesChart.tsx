"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Point = {
  date: string;
  averageCpm: number;
  averageAccuracy: number;
  activeDurationMs: number;
};

export default function TimeseriesChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid stroke="var(--border)" />
        <XAxis dataKey="date" stroke="var(--muted)" />
        <YAxis stroke="var(--muted)" />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="averageCpm"
          stroke="var(--accent)"
          fill="color-mix(in srgb, var(--accent) 20%, transparent)"
          name="Correct CPM"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
