"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserSettings } from "@codemuscle/shared";
import { api } from "../../lib/api";
import { applyDocumentTheme, resolveTheme } from "../../lib/theme";

export default function Settings() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<UserSettings>("/settings")
  });

  const mutation = useMutation({
    mutationFn: (value: Partial<UserSettings>) =>
      api<UserSettings>("/settings", { method: "PATCH", body: JSON.stringify(value) }),
    onSuccess: data => {
      const normalized: UserSettings = {
        ...data,
        comparisonMode: String(data.comparisonMode).toLowerCase() as UserSettings["comparisonMode"],
        theme: data.theme
      };
      client.setQueryData(["settings"], normalized);
      if (normalized.theme) {
        const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
        applyDocumentTheme(resolveTheme(normalized.theme, prefersLight));
      }
    }
  });

  const s = query.data;
  if (!s) return <main className="container">Loading settings…</main>;

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (key === "theme") {
      const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      applyDocumentTheme(resolveTheme(value as UserSettings["theme"], prefersLight));
    }
    client.setQueryData<UserSettings>(["settings"], old =>
      old ? { ...old, [key]: value } : old
    );
    mutation.mutate({ [key]: value });
  };

  return (
    <main className="container">
      <h1 className="page-title">Settings</h1>
      <p className="subtitle">Editor and deliberate-practice preferences.</p>
      <div className="card form-grid">
        <Field label="Theme">
          <select
            value={s.theme}
            onChange={e => set("theme", e.target.value as UserSettings["theme"])}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </Field>
        <Field label="Font size">
          <input
            type="number"
            min={12}
            max={24}
            value={s.editorFontSize}
            onChange={e => set("editorFontSize", Number(e.target.value))}
          />
        </Field>
        <Field label="Tab size">
          <select value={s.tabSize} onChange={e => set("tabSize", Number(e.target.value))}>
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={8}>8</option>
          </select>
        </Field>
        <Field label="Comparison mode">
          <select
            value={s.comparisonMode}
            onChange={e => set("comparisonMode", e.target.value as "syntax" | "strict")}
          >
            <option value="syntax">Syntax (ignore formatting)</option>
            <option value="strict">Strict</option>
          </select>
        </Field>
        {(
          [
            ["wordWrap", "Word wrap"],
            ["minimapEnabled", "Editor minimap"],
            ["synchronizedScrolling", "Synchronized scrolling"],
            ["pasteAllowed", "Allow paste for accessibility"]
          ] as const
        ).map(([key, label]) => (
          <label className="field checkbox-field" key={key}>
            <input
              type="checkbox"
              checked={s[key]}
              onChange={e => set(key, e.target.checked)}
            />
            <span>{label}</span>
          </label>
        ))}
        <Field label="Daily goal">
          <select
            value={s.dailyGoalMinutes}
            onChange={e =>
              set("dailyGoalMinutes", Number(e.target.value) as 15 | 30 | 45 | 60)
            }
          >
            {[15, 30, 45, 60].map(x => (
              <option key={x} value={x}>
                {x} minutes
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="settings-note">
        Progress reset is not available through the current API. Session history and completions
        persist until cleared at the database level. You can still restart individual practice
        sessions from the editor and mark files for repetition.
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}
