"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { UserSettings } from "@codemuscle/shared";
import { api } from "../../lib/api";

const PROJECTS = [
  { id: "employee-hr-system", name: "Employee HR Management System" },
  { id: "logistics-system", name: "Logistics and Shipment Management System" },
  { id: "energy-billing-system", name: "Energy Consumption and Billing System" },
  { id: "b2b-saas-platform", name: "Multi-Tenant B2B SaaS Platform" }
] as const;

export default function Onboarding() {
  const router = useRouter();
  const client = useQueryClient();
  const [goal, setGoal] = useState<15 | 30 | 45 | 60>(30);
  const [theme, setTheme] = useState<UserSettings["theme"]>("dark");
  const [font, setFont] = useState(14);
  const [tab, setTab] = useState(4);
  const [syncScrolling, setSyncScrolling] = useState(false);
  const [pasteAllowed, setPasteAllowed] = useState(false);
  const [projectId, setProjectId] = useState<string>(PROJECTS[0].id);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const settings = await api<UserSettings>("/settings", {
        method: "PATCH",
        body: JSON.stringify({
          dailyGoalMinutes: goal,
          theme,
          editorFontSize: font,
          tabSize: tab,
          synchronizedScrolling: syncScrolling,
          pasteAllowed,
          onboardingComplete: true
        })
      });
      client.setQueryData(["settings"], settings);

      try {
        const detail = await api<{ files: Array<{ id: string }> }>(`/projects/${projectId}`);
        const first = detail.files[0];
        if (first) {
          router.push(`/practice/${projectId}/${first.id}`);
          return;
        }
      } catch {
        /* fall through to project page */
      }
      router.push(`/projects/${projectId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="onboarding">
      <h1>Preserve your manual coding fluency</h1>
      <blockquote>
        AI can increase delivery speed, but unused manual coding skills weaken over time. CodeMuscle
        helps experienced engineers preserve syntax fluency, IDE confidence, typing speed, and
        implementation memory through deliberate manual practice.
      </blockquote>
      <div className="card form-grid">
        <label className="field">
          Daily goal
          <select value={goal} onChange={e => setGoal(Number(e.target.value) as 15 | 30 | 45 | 60)}>
            {[15, 30, 45, 60].map(x => (
              <option key={x} value={x}>
                {x} minutes
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Theme
          <select
            value={theme}
            onChange={e => setTheme(e.target.value as UserSettings["theme"])}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </label>
        <label className="field">
          Font size
          <input
            type="number"
            min={12}
            max={24}
            value={font}
            onChange={e => setFont(Number(e.target.value))}
          />
        </label>
        <label className="field">
          Tab size
          <select value={tab} onChange={e => setTab(Number(e.target.value))}>
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={8}>8</option>
          </select>
        </label>
        <label className="field">
          Language
          <select value="java" aria-label="Language">
            <option value="java">Java</option>
            <option value="python" disabled>
              Python — Coming soon
            </option>
          </select>
        </label>
        <label className="field">
          Initial project
          <select
            aria-label="Initial project"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
          >
            {PROJECTS.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field checkbox-field">
          <input
            type="checkbox"
            checked={syncScrolling}
            onChange={e => setSyncScrolling(e.target.checked)}
          />
          <span>Synchronized scrolling</span>
        </label>
        <label className="field checkbox-field">
          <input
            type="checkbox"
            checked={pasteAllowed}
            onChange={e => setPasteAllowed(e.target.checked)}
          />
          <span>Allow paste (accessibility)</span>
        </label>
      </div>
      <p>
        <button type="button" className="primary" disabled={saving} onClick={submit}>
          {saving ? "Saving…" : "Start manual practice"}
        </button>
      </p>
    </main>
  );
}
