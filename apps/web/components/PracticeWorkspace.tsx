"use client";

import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pause, Play, RotateCcw, Square } from "lucide-react";
import type { CalculatedMetrics, TreeNode, UserSettings } from "@codemuscle/shared";
import { api } from "../lib/api";
import { compare } from "../lib/comparison";
import { registerJavaCompletions } from "../lib/completions";
import { pasteBlockFeedback } from "../lib/paste";
import { getReferenceBlock } from "../lib/referenceBlock";
import {
  configureJavaEditorThemes,
  intellijDarcula,
  intellijLight,
  resolveTheme
} from "../lib/theme";
import { Explorer, type FileProgress } from "./Explorer";

type FileData = {
  id: string;
  fileName: string;
  path: string;
  referenceCode: string;
  difficulty: string;
  estimatedMinutes: number;
  project: { id: string; name: string };
  topics: Array<{ topic: { name: string } }>;
  sessions?: Array<{
    id: string;
    status: string;
    draft?: { typedCode: string } | null;
    attempts?: Array<{ tokenAccuracy: number; correctCharactersPerMinute: number }>;
  }>;
};

type Counters = {
  manual: number;
  autocomplete: number;
  keys: number;
  backspaces: number;
  pasteAttempts: number;
  errors: number;
  corrected: number;
};

type FinishResult = {
  pasteAttemptCount: number;
  errorCount: number;
  averageRecoveryTimeMs: number;
  metrics: CalculatedMetrics;
};

type Recommendation = { fileId: string; fileName: string; projectId?: string; reason: string };
type PersonalBests = {
  correctCharactersPerMinute: number | null;
  tokenAccuracy: number | null;
  linesPerMinute: number | null;
};

type ReferenceMode = "complete" | "block";

function emptyCounters(): Counters {
  return {
    manual: 0,
    autocomplete: 0,
    keys: 0,
    backspaces: 0,
    pasteAttempts: 0,
    errors: 0,
    corrected: 0
  };
}

export function javaPackageStarter(referenceCode: string): string {
  const packageDeclaration = referenceCode.match(/^\s*package\s+[\w.]+\s*;/m)?.[0].trim();
  return packageDeclaration ? `${packageDeclaration}\n\n` : "";
}

export function PracticeWorkspace({
  file,
  tree,
  settings,
  fileProgress
}: {
  file: FileData;
  tree: TreeNode[];
  settings: UserSettings;
  fileProgress?: Record<string, FileProgress>;
}) {
  const restored = file.sessions?.find(item => item.status === "ACTIVE" || item.status === "PAUSED");
  const starterCode = javaPackageStarter(file.referenceCode);
  const router = useRouter();
  const [typed, setTyped] = useState(restored?.draft?.typedCode ?? starterCode);
  const [session, setSession] = useState<string | undefined>(restored?.id);
  const [paused, setPaused] = useState(restored?.status === "PAUSED");
  const [seconds, setSeconds] = useState(0);
  const [showReference, setShowReference] = useState(true);
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>("complete");
  const [toast, setToast] = useState("");
  const [summary, setSummary] = useState<FinishResult | undefined>();
  const [explorerVisible, setExplorerVisible] = useState(true);
  const [explorerWidth, setExplorerWidth] = useState(270);
  const [prefersLight, setPrefersLight] = useState(false);

  const counters = useRef<Counters>({
    ...emptyCounters(),
    manual: restored?.draft?.typedCode.length ?? 0
  });
  const previousLength = useRef((restored?.draft?.typedCode ?? starterCode).length);
  const typingEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const referenceEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const scrollDisposables = useRef<Monaco.IDisposable[]>([]);
  const syncingScroll = useRef(false);
  const sessionRef = useRef<string | undefined>(restored?.id);
  const pausedRef = useRef(restored?.status === "PAUSED");
  const creatingSessionRef = useRef<Promise<string> | null>(null);
  const suppressAutoStartRef = useRef(false);
  const typedRef = useRef(restored?.draft?.typedCode ?? starterCode);
  const running = Boolean(session) && !paused;

  const comparison = useMemo(
    () => compare(typed, file.referenceCode, settings.comparisonMode),
    [typed, file.referenceCode, settings.comparisonMode]
  );

  const typedLineCount = useMemo(() => typed.split(/\r?\n/).length, [typed]);
  const referenceValue = useMemo(() => {
    if (referenceMode === "complete") return file.referenceCode;
    return getReferenceBlock(file.referenceCode, typedLineCount);
  }, [file.referenceCode, referenceMode, typedLineCount]);

  const correctCpm = seconds > 0 ? (comparison.correctCharacters / seconds) * 60 : 0;
  const resolvedTheme = resolveTheme(settings.theme, prefersLight);
  const monacoTheme =
    resolvedTheme === "light" ? "codemuscle-java-light" : "codemuscle-java-dark";
  const editorChrome = resolvedTheme === "light" ? intellijLight : intellijDarcula;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const apply = () => setPrefersLight(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!paused && session) {
      const timer = setInterval(() => setSeconds(x => x + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [paused, session]);

  useEffect(() => {
    if (!session || !typed) return;
    const timer = setTimeout(
      () =>
        api(`/sessions/${session}/draft`, {
          method: "PUT",
          body: JSON.stringify({ typedCode: typed })
        }).catch(() => undefined),
      1800
    );
    return () => clearTimeout(timer);
  }, [typed, session]);

  const wireScrollSync = useCallback(() => {
    scrollDisposables.current.forEach(d => d.dispose());
    scrollDisposables.current = [];
    if (!settings.synchronizedScrolling || !showReference) return;
    const typing = typingEditorRef.current;
    const reference = referenceEditorRef.current;
    if (!typing || !reference) return;

    const link = (
      source: Monaco.editor.IStandaloneCodeEditor,
      target: Monaco.editor.IStandaloneCodeEditor
    ) =>
      source.onDidScrollChange(() => {
        if (syncingScroll.current) return;
        syncingScroll.current = true;
        target.setScrollTop(source.getScrollTop());
        target.setScrollLeft(source.getScrollLeft());
        syncingScroll.current = false;
      });

    scrollDisposables.current = [link(typing, reference), link(reference, typing)];
  }, [settings.synchronizedScrolling, showReference]);

  useEffect(() => {
    wireScrollSync();
    return () => {
      scrollDisposables.current.forEach(d => d.dispose());
      scrollDisposables.current = [];
    };
  }, [wireScrollSync, referenceMode, referenceValue]);

  const ensureSession = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;
    if (!creatingSessionRef.current) {
      creatingSessionRef.current = api<{ id: string }>("/sessions", {
        method: "POST",
        body: JSON.stringify({
          projectId: file.project.id,
          fileId: file.id,
          comparisonMode: settings.comparisonMode
        })
      })
        .then(created => {
          sessionRef.current = created.id;
          setSession(created.id);
          return created.id;
        })
        .catch(error => {
          creatingSessionRef.current = null;
          throw error;
        });
    }
    return creatingSessionRef.current;
  }, [file.project.id, file.id, settings.comparisonMode]);

  /** Start timer on Start click or first real edit — not on focus / reference mode switches. */
  const beginPractice = useCallback(async () => {
    const id = await ensureSession();
    if (pausedRef.current) {
      await api(`/sessions/${id}/resume`, { method: "POST" });
      pausedRef.current = false;
      setPaused(false);
    }
    return id;
  }, [ensureSession]);

  const onChange = (value: string | undefined) => {
    const next = value ?? "";
    if (next === typedRef.current) return;
    if (next.length > previousLength.current) {
      counters.current.manual += next.length - previousLength.current;
    }
    previousLength.current = next.length;
    typedRef.current = next;
    setTyped(next);
    if (!suppressAutoStartRef.current) {
      void beginPractice().catch(() => undefined);
    }
  };

  const onTypingMount = (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    typingEditorRef.current = editor;
    configureJavaEditorThemes(monaco);
    monaco.editor.setTheme(monacoTheme);
    registerJavaCompletions(monaco, file.referenceCode);
    editor.onKeyDown(e => {
      counters.current.keys++;
      if (e.keyCode === monaco.KeyCode.Backspace) counters.current.backspaces++;
    });
    editor.onDidPaste(() => {
      const feedback = pasteBlockFeedback(settings.pasteAllowed);
      if (feedback.blocked) {
        counters.current.pasteAttempts++;
        editor.trigger("paste-block", "undo", null);
        setToast(feedback.message ?? "");
        setTimeout(() => setToast(""), 3500);
      }
    });
    editor.onDidChangeModelContent(event => {
      if (event.changes.some(change => change.text.length > 1 && !change.text.includes("\n"))) {
        const inserted = event.changes.reduce((sum, c) => sum + c.text.length, 0);
        counters.current.autocomplete += inserted;
        counters.current.manual = Math.max(0, counters.current.manual - inserted);
      }
    });
    wireScrollSync();
  };

  const onReferenceMount = (
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof Monaco
  ) => {
    referenceEditorRef.current = editor;
    configureJavaEditorThemes(monaco);
    monaco.editor.setTheme(monacoTheme);
    wireScrollSync();
  };

  const clearEditor = () => {
    suppressAutoStartRef.current = true;
    typedRef.current = starterCode;
    previousLength.current = starterCode.length;
    counters.current = emptyCounters();
    setSeconds(0);
    setTyped(starterCode);
    typingEditorRef.current?.setValue(starterCode);
    queueMicrotask(() => {
      suppressAutoStartRef.current = false;
    });
  };

  const pause = async () => {
    if (!sessionRef.current || pausedRef.current) return;
    await api(`/sessions/${sessionRef.current}/pause`, { method: "POST" });
    pausedRef.current = true;
    setPaused(true);
  };

  const finish = async () => {
    const id = await beginPractice();
    const c = counters.current;
    const result = await api<FinishResult>(`/sessions/${id}/finish`, {
      method: "POST",
      body: JSON.stringify({
        typedCode: typed,
        activeDurationMs: Math.max(1000, seconds * 1000),
        manualCharacterCount: c.manual,
        autocompleteCharacterCount: c.autocomplete,
        keystrokeCount: c.keys,
        backspaceCount: c.backspaces,
        pasteAttemptCount: c.pasteAttempts,
        errorCount: c.errors,
        correctedErrorCount: c.corrected,
        recoveryTimesMs: []
      })
    });
    setSummary(result);
  };

  const restart = async () => {
    if (sessionRef.current) {
      const created = await api<{ id: string }>(`/sessions/${sessionRef.current}/restart`, {
        method: "POST"
      });
      sessionRef.current = created.id;
      creatingSessionRef.current = Promise.resolve(created.id);
      setSession(created.id);
    } else {
      sessionRef.current = undefined;
      creatingSessionRef.current = null;
      setSession(undefined);
    }
    clearEditor();
    pausedRef.current = false;
    setPaused(false);
    setSummary(undefined);
  };

  const resetLocal = () => {
    clearEditor();
  };

  const editorOptions = {
    fontSize: settings.editorFontSize,
    fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', Consolas, 'Courier New', monospace",
    fontLigatures: true,
    lineHeight: Math.round(settings.editorFontSize * 1.45),
    suggestFontSize: settings.editorFontSize,
    suggestLineHeight: Math.max(settings.editorFontSize + 8, 24),
    tabSize: settings.tabSize,
    minimap: { enabled: settings.minimapEnabled },
    wordWrap: (settings.wordWrap ? "on" : "off") as "on" | "off",
    automaticLayout: true,
    // Keep suggest/hover widgets from being clipped by pane overflow (esp. 1-item lists).
    fixedOverflowWidgets: true,
    padding: { top: 8, bottom: 8 },
    renderLineHighlight: "all" as const,
    cursorBlinking: "smooth" as const,
    smoothScrolling: true
  };

  return (
    <div className="workspace">
      <header className="practice-header">
        <div>
          <strong>{file.project.name}</strong>
          <div className="muted">{file.path}</div>
        </div>
        <span className="tag">{file.difficulty}</span>
        <div className="toolbar-spacer" />
        <div className="header-metrics">
          <HeaderMetric
            label="Time"
            value={`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}
          />
          <HeaderMetric label="Correct CPM" value={correctCpm.toFixed(0)} />
          <HeaderMetric label="Token accuracy" value={`${comparison.tokenAccuracy.toFixed(1)}%`} />
          <HeaderMetric label="Progress" value={`${comparison.completionPercentage.toFixed(0)}%`} />
        </div>
        <button
          type="button"
          className={running ? undefined : "primary"}
          aria-label={running ? "Pause" : session ? "Resume" : "Start"}
          title={running ? "Pause" : session ? "Resume" : "Start"}
          onClick={() => {
            void (running ? pause() : beginPractice().catch(() => undefined));
          }}
        >
          {running ? <Pause size={15} /> : <Play size={15} />}
          {running ? "Pause" : session ? "Resume" : "Start"}
        </button>
        <button type="button" aria-label="Restart session" title="Restart session" onClick={restart}>
          <RotateCcw size={15} /> Restart
        </button>
        <button type="button" aria-label="Reset file" title="Clear editor" onClick={resetLocal}>
          Clear
        </button>
        <button type="button" className="primary" onClick={finish}>
          <Square size={14} /> Finish
        </button>
      </header>

      <div className="panes">
        <Explorer
          tree={tree}
          currentFile={file.id}
          projectId={file.project.id}
          onFile={id => router.push(`/practice/${file.project.id}/${id}`)}
          onProject={id => router.push(`/projects/${id}`)}
          {...(fileProgress ? { fileProgress } : {})}
          width={explorerWidth}
          onWidthChange={setExplorerWidth}
          visible={explorerVisible}
          onVisibleChange={setExplorerVisible}
        />
        <main
          className="editors"
          style={{ gridTemplateColumns: showReference ? "1fr 1fr" : "1fr" }}
        >
          <section className="editor-pane">
            <div className="editor-title">
              <span className={comparison.state === "mismatch" ? "status-bad" : "status-good"}>
                {comparison.state === "mismatch" ? "Current mismatch" : "Typing editor"}
              </span>
              <span className="toolbar-spacer" />
              <span className="muted">
                {counters.current.manual} manual · {counters.current.autocomplete} completion
              </span>
            </div>
            <div
              className="editor-host"
              style={{ background: editorChrome.background }}
            >
              <Editor
                language="java"
                beforeMount={configureJavaEditorThemes}
                theme={monacoTheme}
                value={typed}
                onChange={onChange}
                onMount={onTypingMount}
                options={{
                  ...editorOptions,
                  bracketPairColorization: { enabled: true },
                  multiCursorModifier: "ctrlCmd",
                  find: { addExtraSpaceOnTop: false },
                  suggest: { showSnippets: true },
                  quickSuggestions: true
                }}
              />
            </div>
          </section>

          {showReference && (
            <section className="editor-pane reference-pane">
              <div className="editor-title">
                <strong>Reference</strong>
                <div className="reveal-toggle" role="group" aria-label="Reference reveal mode">
                  <button
                    type="button"
                    className={referenceMode === "complete" ? "active" : ""}
                    onClick={() => setReferenceMode("complete")}
                  >
                    Complete file
                  </button>
                  <button
                    type="button"
                    className={referenceMode === "block" ? "active" : ""}
                    onClick={() => setReferenceMode("block")}
                  >
                    Current block
                  </button>
                </div>
                <span className="toolbar-spacer" />
                <span className="muted">
                  {file.estimatedMinutes} min · {file.topics.map(x => x.topic.name).join(", ")}
                </span>
                <button
                  type="button"
                  aria-label="Hide reference"
                  onClick={() => setShowReference(false)}
                >
                  <EyeOff size={13} />
                </button>
              </div>
              <div
                className="editor-host"
                style={{ background: editorChrome.background }}
              >
                <Editor
                  language="java"
                  beforeMount={configureJavaEditorThemes}
                  theme={monacoTheme}
                  value={referenceValue}
                  onMount={onReferenceMount}
                  options={{
                    ...editorOptions,
                    readOnly: true,
                    domReadOnly: true,
                    minimap: { enabled: false },
                    contextmenu: false
                  }}
                />
              </div>
            </section>
          )}

          {!showReference && (
            <button type="button" title="Show reference" onClick={() => setShowReference(true)}>
              <Eye size={15} />
            </button>
          )}
        </main>
      </div>

      {toast && (
        <div role="status" className="toast">
          {toast}
        </div>
      )}

      {summary && (
        <CompletionDialog
          result={summary}
          fileId={file.id}
          onClose={() => setSummary(undefined)}
          onRepeat={() => {
            setSummary(undefined);
            void restart();
          }}
          onStats={() => router.push("/statistics")}
          onDashboard={() => router.push("/")}
          onNext={item =>
            router.push(`/practice/${item.projectId ?? file.project.id}/${item.fileId}`)
          }
        />
      )}
    </div>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function buildInsight(metrics: CalculatedMetrics): string {
  if (metrics.tokenAccuracy >= 95 && metrics.autocompleteDependencyRatio < 25) {
    return "Strong session: high accuracy with low autocomplete dependency. Manual fluency is holding.";
  }
  if (metrics.tokenAccuracy >= 90 && metrics.autocompleteDependencyRatio >= 40) {
    return "Accuracy is solid, but autocomplete carried a large share. Slow down and type more of the structure yourself.";
  }
  if (metrics.tokenAccuracy < 80) {
    return "Accuracy dipped below a reliable range. Re-type this file with the reference in Current block mode.";
  }
  if (metrics.autocompleteDependencyRatio >= 50) {
    return "Autocomplete dependency is high. Prefer completing tokens manually before accepting suggestions.";
  }
  return "Steady practice. Review mismatches and keep daily goal minutes consistent.";
}

function CompletionDialog({
  result,
  fileId,
  onClose,
  onRepeat,
  onStats,
  onDashboard,
  onNext
}: {
  result: FinishResult;
  fileId: string;
  onClose: () => void;
  onRepeat: () => void;
  onStats: () => void;
  onDashboard: () => void;
  onNext: (item: Recommendation) => void;
}) {
  const m = result.metrics;
  const [busy, setBusy] = useState<string | null>(null);
  const [personalBests, setPersonalBests] = useState<PersonalBests | null>(null);
  const [nextItem, setNextItem] = useState<Recommendation | null>(null);

  useEffect(() => {
    void api<PersonalBests>("/dashboard/personal-bests")
      .then(setPersonalBests)
      .catch(() => setPersonalBests(null));
    void api<Recommendation[]>("/recommendations/daily")
      .then(items => setNextItem(items.find(item => item.fileId !== fileId) ?? items[0] ?? null))
      .catch(() => setNextItem(null));
  }, [fileId]);

  const markRepeat = async () => {
    setBusy("repeat");
    try {
      await api(`/files/${fileId}/repeat`, { method: "POST" });
    } finally {
      setBusy(null);
    }
  };

  const goNext = async () => {
    setBusy("next");
    try {
      const items = await api<Recommendation[]>("/recommendations/daily");
      const pick = items.find(item => item.fileId !== fileId) ?? items[0];
      if (pick) onNext(pick);
      else onDashboard();
    } finally {
      setBusy(null);
    }
  };

  const recoverySeconds =
    result.averageRecoveryTimeMs > 0 ? (result.averageRecoveryTimeMs / 1000).toFixed(1) : null;

  const pbHints: string[] = [];
  if (personalBests?.correctCharactersPerMinute != null) {
    if (m.correctCharactersPerMinute >= personalBests.correctCharactersPerMinute) {
      pbHints.push("New personal best Correct CPM");
    } else {
      pbHints.push(
        `Best Correct CPM: ${personalBests.correctCharactersPerMinute.toFixed(0)} (this run ${m.correctCharactersPerMinute.toFixed(0)})`
      );
    }
  }
  if (personalBests?.tokenAccuracy != null) {
    if (m.tokenAccuracy >= personalBests.tokenAccuracy) {
      pbHints.push("New personal best token accuracy");
    }
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog" role="dialog" aria-labelledby="session-summary-title">
        <h2 id="session-summary-title">Session summary</h2>
        <div className="grid grid-4">
          <HeaderMetric label="Correct CPM" value={m.correctCharactersPerMinute.toFixed(0)} />
          <HeaderMetric label="Raw CPM" value={m.rawCharactersPerMinute.toFixed(0)} />
          <HeaderMetric label="Token accuracy" value={`${m.tokenAccuracy.toFixed(1)}%`} />
          <HeaderMetric label="Manual ratio" value={`${m.manualCodingRatio.toFixed(1)}%`} />
          <HeaderMetric label="Lines / min" value={m.linesPerMinute.toFixed(1)} />
          <HeaderMetric
            label="Autocomplete"
            value={`${m.autocompleteDependencyRatio.toFixed(1)}%`}
          />
          <HeaderMetric label="Errors" value={String(result.errorCount)} />
          <HeaderMetric label="Paste attempts" value={String(result.pasteAttemptCount)} />
        </div>

        <p className="dialog-insight">{buildInsight(m)}</p>

        <div className="dialog-meta">
          <span className="muted">Paste attempts: {result.pasteAttemptCount}</span>
          {recoverySeconds && (
            <span className="muted">Avg recovery: {recoverySeconds}s</span>
          )}
          {pbHints.map(hint => (
            <span key={hint} className="tag">
              {hint}
            </span>
          ))}
          {nextItem && (
            <span className="muted">Next up: {nextItem.fileName}</span>
          )}
        </div>

        <div className="dialog-actions">
          <button type="button" className="primary" onClick={onRepeat}>
            Repeat
          </button>
          <button type="button" disabled={busy === "repeat"} onClick={markRepeat}>
            Mark for repetition
          </button>
          <button type="button" disabled={busy === "next"} onClick={goNext}>
            Next recommended
          </button>
          <button type="button" onClick={onStats}>
            Statistics
          </button>
          <button type="button" onClick={onDashboard}>
            Dashboard
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
