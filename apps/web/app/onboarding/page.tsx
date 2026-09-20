"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { UserSettings } from "@codemuscle/shared";
import { api } from "../../lib/api";

const PROJECTS = [
  { id: "employee-hr-system", name: "Employee HR Management System", languageId: "java" },
  { id: "logistics-system", name: "Logistics and Shipment Management System", languageId: "java" },
  { id: "energy-billing-system", name: "Energy Consumption and Billing System", languageId: "java" },
  { id: "b2b-saas-platform", name: "Multi-Tenant B2B SaaS Platform", languageId: "java" },
  { id: "python-employee-hr-system", name: "Employee HR Management System", languageId: "python" },
  { id: "python-logistics-system", name: "Logistics and Shipment Management System", languageId: "python" },
  { id: "python-energy-billing-system", name: "Energy Consumption and Billing System", languageId: "python" },
  { id: "python-b2b-saas-platform", name: "Multi-Tenant B2B SaaS Platform", languageId: "python" }
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
  const [languageId, setLanguageId] = useState<"java" | "python">("java");
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
          <select
            value={languageId}
            aria-label="Language"
            onChange={event => {
              const language = event.target.value as "java" | "python";
              setLanguageId(language);
              const firstProject = PROJECTS.find(project => project.languageId === language);
              if (firstProject) setProjectId(firstProject.id);
            }}
          >
            <option value="java">Java</option>
            <option value="python">Python</option>
          </select>
        </label>
        <label className="field">
          Initial project
          <select
            aria-label="Initial project"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
          >
            {PROJECTS.filter(project => project.languageId === languageId).map(project => (
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
