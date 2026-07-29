"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, Flame, Target, Trophy } from "lucide-react";
import type { UserSettings } from "@codemuscle/shared";
import { api, type ProjectSummary } from "../lib/api";

type Summary = {
  activeMinutes: number;
  todayActiveMinutes?: number;
  filesCompleted: number;
  averageAccuracy: number;
  averageCpm: number;
  manualCodingRatio: number;
  currentStreak: number;
  dailyGoalMinutes: number;
};

type Recommendation = {
  fileId: string;
  fileName: string;
  reason: string;
  projectId?: string;
};

type UnlockedAchievement = {
  unlockedAt: string;
  achievement: { id: string; name: string; description: string };
};

export default function Dashboard() {
  const router = useRouter();
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<UserSettings>("/settings")
  });
  const summary = useQuery({
    queryKey: ["summary"],
    queryFn: () => api<Summary>("/dashboard/summary")
  });
  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<ProjectSummary[]>("/projects")
  });
  const queue = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api<Recommendation[]>("/recommendations/daily")
  });
  const achievements = useQuery({
    queryKey: ["achievements-unlocked"],
    queryFn: () => api<UnlockedAchievement[]>("/achievements/unlocked")
  });

  useEffect(() => {
    if (settings.data && !settings.data.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [settings.data, router]);

  if (settings.isLoading || (settings.data && !settings.data.onboardingComplete)) {
    return <main className="container">Loading…</main>;
  }

  const value = summary.data;

  return (
    <main className="container">
      <h1 className="page-title">Today</h1>
      <p className="subtitle">
        One focused session protects the manual fluency you built over years.
      </p>
      <div className="grid grid-4">
        <Kpi
          icon={<Target size={17} />}
          label="Daily goal"
          value={`${value?.todayActiveMinutes ?? 0} / ${value?.dailyGoalMinutes ?? 30} min`}
        />
        <Kpi
          icon={<Flame size={17} />}
          label="Current streak"
          value={`${value?.currentStreak ?? 0} days`}
        />
        <Kpi
          icon={<Activity size={17} />}
          label="Correct CPM"
          value={(value?.averageCpm ?? 0).toFixed(0)}
        />
        <Kpi
          label="Manual coding ratio"
          value={`${(value?.manualCodingRatio ?? 100).toFixed(1)}%`}
        />
      </div>

      <h2 className="section-title">Recommended practice queue</h2>
      <div className="card list">
        {queue.isLoading ? (
          <p className="muted">Building your queue…</p>
        ) : (
          queue.data?.map((item, index) => (
            <div className="list-row" key={item.fileId}>
              <span className="muted">{index + 1}</span>
              <div className="grow">
                <strong>{item.fileName}</strong>
                <div className="muted">{item.reason}</div>
              </div>
              <Link
                className="button"
                href={`/practice/${item.projectId ?? "employee-hr-system"}/${item.fileId}`}
              >
                Practice <ArrowRight size={13} />
              </Link>
            </div>
          ))
        )}
      </div>

      <h2 className="section-title">Recent achievements</h2>
      <div className="card list">
        {achievements.data?.length ? (
          achievements.data.slice(0, 5).map(item => (
            <div className="list-row" key={`${item.achievement.id}-${item.unlockedAt}`}>
              <Trophy size={16} className="status-good" />
              <div className="grow">
                <strong>{item.achievement.name}</strong>
                <div className="muted">{item.achievement.description}</div>
              </div>
              <span className="muted">
                {new Date(item.unlockedAt).toLocaleDateString()}
              </span>
            </div>
          ))
        ) : (
          <p className="muted">Complete a file to unlock your first achievement.</p>
        )}
      </div>

      <h2 className="section-title">Project progress</h2>
      <div className="grid grid-4">
        {projects.data?.map(project => (
          <Link href={`/projects/${project.id}`} className="card" key={project.id}>
            <strong>{project.name}</strong>
            <p className="muted">
              {project.completedFiles} of {project.fileCount} files
            </p>
            <div className="progress">
              <span
                style={{
                  width: `${project.fileCount ? (project.completedFiles / project.fileCount) * 100 : 0}%`
                }}
              />
            </div>
          </Link>
        ))}
        <div className="card coming-soon">
          <strong>Python</strong>
          <p className="muted">Coming soon</p>
        </div>
      </div>
    </main>
  );
}

function Kpi({
  icon,
  label,
  value
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card">
      <div className="kpi-label">
        {icon} {label}
      </div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}
