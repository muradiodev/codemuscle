"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

const TimeseriesChart = dynamic(() => import("./TimeseriesChart"), {
  ssr: false,
  loading: () => <p className="muted">Loading chart…</p>
});

type Summary = {
  activeMinutes: number;
  filesCompleted: number;
  averageAccuracy: number;
  averageCpm: number;
  manualCodingRatio: number;
};

type Point = {
  date: string;
  averageCpm: number;
  averageAccuracy: number;
  activeDurationMs: number;
};

type TopicRow = {
  topic?: string;
  name?: string;
  accuracy?: number;
  averageAccuracy?: number;
  attempts?: number;
};

function coefficientOfVariation(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean === 0) return null;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance) / mean;
}

export default function Statistics() {
  const summary = useQuery({
    queryKey: ["summary"],
    queryFn: () => api<Summary>("/dashboard/summary")
  });
  const series = useQuery({
    queryKey: ["timeseries"],
    queryFn: () => api<Point[]>("/dashboard/timeseries")
  });
  const topics = useQuery({
    queryKey: ["topics"],
    queryFn: () => api<TopicRow[]>("/dashboard/topics")
  });

  const s = summary.data;
  const consistency = useMemo(() => {
    const points = series.data ?? [];
    const cpms = points.map(p => p.averageCpm).filter(v => v > 0);
    const accuracies = points.map(p => p.averageAccuracy).filter(v => v > 0);
    const cpmCv = coefficientOfVariation(cpms);
    const accCv = coefficientOfVariation(accuracies);
    if (cpmCv == null && accCv == null) return null;
    const blended = ((cpmCv ?? 0) + (accCv ?? 0)) / (cpmCv != null && accCv != null ? 2 : 1);
    const score = Math.max(0, Math.min(100, (1 - blended) * 100));
    return { score, cpmCv, accCv };
  }, [series.data]);

  const topicRows = topics.data ?? [];

  return (
    <main className="container">
      <h1 className="page-title">Performance</h1>
      <p className="subtitle">
        Engineering-focused measures of speed, accuracy, consistency, and autocomplete dependency.
      </p>
      <div className="grid grid-4">
        <K label="Total practice" value={`${s?.activeMinutes ?? 0} min`} />
        <K label="Files completed" value={String(s?.filesCompleted ?? 0)} />
        <K label="Token accuracy" value={`${(s?.averageAccuracy ?? 0).toFixed(1)}%`} />
        <K label="Correct CPM" value={(s?.averageCpm ?? 0).toFixed(0)} />
      </div>

      <h2 className="section-title">Last 30 days</h2>
      <div className="card chart">
        {series.data?.length ? (
          <TimeseriesChart data={series.data} />
        ) : (
          <p className="muted">Complete a practice file to begin your performance history.</p>
        )}
      </div>

      <div className="grid grid-3">
        <section className="card">
          <h3>Formula transparency</h3>
          <p className="muted">
            Correct CPM = correctly matched manually typed characters ÷ active minutes.
          </p>
          <p className="muted">
            Manual ratio = manual characters ÷ total inserted characters × 100.
          </p>
        </section>
        <section className="card">
          <h3>Consistency</h3>
          {consistency ? (
            <>
              <p className="kpi-value" style={{ fontSize: 22 }}>
                {consistency.score.toFixed(0)}
              </p>
              <p className="muted">
                Derived from coefficient of variation across recent Correct CPM
                {consistency.cpmCv != null ? ` (CV ${(consistency.cpmCv * 100).toFixed(0)}%)` : ""}
                and accuracy
                {consistency.accCv != null ? ` (CV ${(consistency.accCv * 100).toFixed(0)}%)` : ""}.
                Higher is more stable.
              </p>
            </>
          ) : (
            <p className="muted">
              Consistency appears after at least two days of recorded practice sessions.
            </p>
          )}
        </section>
        <section className="card">
          <h3>Topic performance</h3>
          {topicRows.length ? (
            <div className="list">
              {topicRows.map((row, index) => {
                const name = row.topic ?? row.name ?? `Topic ${index + 1}`;
                const accuracy = row.averageAccuracy ?? row.accuracy ?? 0;
                return (
                  <div className="list-row" key={name}>
                    <div className="grow">
                      <strong>{name}</strong>
                      {typeof row.attempts === "number" && (
                        <div className="muted">{row.attempts} attempts</div>
                      )}
                    </div>
                    <span>{accuracy.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted">
              Topic breakdowns appear when the API returns per-topic accuracy data.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function K({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}
