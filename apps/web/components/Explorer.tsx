"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  PanelLeftClose,
  Search
} from "lucide-react";
import type { TreeNode } from "@codemuscle/shared";

export type FileProgress = { completed?: boolean; accuracy?: number };

const PROJECTS = [
  { id: "employee-hr-system", name: "Employee HR Management" },
  { id: "logistics-system", name: "Logistics & Shipment" },
  { id: "energy-billing-system", name: "Energy & Billing" },
  { id: "b2b-saas-platform", name: "Multi-Tenant SaaS" }
] as const;

export function Explorer({
  tree,
  currentFile,
  onFile,
  projectId,
  onProject,
  fileProgress,
  width = 270,
  onWidthChange,
  visible = true,
  onVisibleChange
}: {
  tree: TreeNode[];
  currentFile: string;
  onFile: (id: string) => void;
  projectId: string;
  onProject: (id: string) => void;
  fileProgress?: Record<string, FileProgress>;
  width?: number;
  onWidthChange?: (width: number) => void;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
}) {
  const [open, setOpen] = useState(new Set(["src", "src/main", "src/main/java"]));
  const [search, setSearch] = useState("");
  const dragging = useRef(false);
  const activeRow = useRef<HTMLDivElement | null>(null);
  const loadedProject = useRef<string | null>(null);

  useEffect(() => {
    const expanded = readExpandedFolders(projectId);
    for (const path of parentFoldersForFile(tree, currentFile)) expanded.add(path);
    loadedProject.current = projectId;
    persistExpandedFolders(projectId, expanded);
    setOpen(expanded);
  }, [projectId]);

  useEffect(() => {
    const parents = parentFoldersForFile(tree, currentFile);
    if (!parents.length) return;
    setOpen(previous => {
      const next = new Set(previous);
      parents.forEach(path => next.add(path));
      persistExpandedFolders(projectId, next);
      return next;
    });
  }, [currentFile, tree, projectId]);

  useEffect(() => {
    if (loadedProject.current !== projectId) return;
    window.requestAnimationFrame(() => {
      activeRow.current?.scrollIntoView?.({ block: "nearest" });
    });
  }, [open, projectId, currentFile]);

  const toggle = (path: string) =>
    setOpen(old => {
      const next = new Set(old);
      next.has(path) ? next.delete(path) : next.add(path);
      persistExpandedFolders(projectId, next);
      return next;
    });

  const onResizeMove = useCallback(
    (event: MouseEvent) => {
      if (!dragging.current || !onWidthChange) return;
      const next = Math.min(480, Math.max(180, event.clientX));
      onWidthChange(next);
    },
    [onWidthChange]
  );

  const onResizeEnd = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onResizeMove);
    window.addEventListener("mouseup", onResizeEnd);
    return () => {
      window.removeEventListener("mousemove", onResizeMove);
      window.removeEventListener("mouseup", onResizeEnd);
    };
  }, [onResizeMove, onResizeEnd]);

  if (!visible) {
    return (
      <aside className="explorer collapsed" aria-label="Explorer collapsed">
        <button
          type="button"
          className="explorer-rail"
          aria-label="Show explorer"
          onClick={() => onVisibleChange?.(true)}
        >
          Explorer
        </button>
      </aside>
    );
  }

  const render = (nodes: TreeNode[], depth = 0): React.ReactNode =>
    nodes.map(node => {
      if (search && node.type === "file" && !node.name.toLowerCase().includes(search.toLowerCase())) {
        return null;
      }
      const expanded = open.has(node.path);
      const progress = node.fileId ? fileProgress?.[node.fileId] : undefined;
      const twist =
        node.type === "folder" ? (
          expanded ? (
            <ChevronDown size={13} />
          ) : (
            <ChevronRight size={13} />
          )
        ) : null;
      const icon =
        node.type === "folder" ? (
          expanded ? (
            <FolderOpen size={15} />
          ) : (
            <Folder size={15} />
          )
        ) : progress?.completed ? (
          <CheckCircle2 size={15} className="status-good" />
        ) : (
          <JavaFileIcon path={node.path} fileName={node.name} />
        );
      return (
        <div key={node.path}>
          <div
            ref={node.fileId === currentFile ? activeRow : undefined}
            role="treeitem"
            tabIndex={0}
            className={`tree-row ${node.fileId === currentFile ? "active" : ""}`}
            style={{ paddingLeft: 5 + depth * 14 }}
            onClick={() => (node.type === "folder" ? toggle(node.path) : onFile(node.fileId!))}
            onKeyDown={e => {
              if (e.key === "Enter") {
                node.type === "folder" ? toggle(node.path) : onFile(node.fileId!);
              }
            }}
          >
            <span className="tree-twist">{twist}</span>
            <span className="tree-icon">{icon}</span>
            <span className="tree-label">{node.name}</span>
            {progress && typeof progress.accuracy === "number" ? (
              <span className="tree-progress" title={`${progress.accuracy.toFixed(0)}% accuracy`}>
                <span style={{ width: `${Math.min(100, progress.accuracy)}%` }} />
              </span>
            ) : (
              <span className="tree-progress-spacer" aria-hidden />
            )}
          </div>
          {node.type === "folder" && expanded && render(node.children ?? [], depth + 1)}
        </div>
      );
    });

  return (
    <aside className="explorer" style={{ width }} aria-label="Explorer">
      <div className="explorer-head">
        <select aria-label="Language" defaultValue="java">
          <option value="java">Java</option>
          <option value="python" disabled>
            Python — Coming soon
          </option>
        </select>
        <select aria-label="Project" value={projectId} onChange={e => onProject(e.target.value)}>
          {PROJECTS.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <label className="explorer-search">
          <Search size={13} />
          <input
            aria-label="Search files"
            placeholder="Search files"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
        <div className="explorer-actions">
          <button
            type="button"
            onClick={() => {
              const next = new Set(flatFolders(tree));
              persistExpandedFolders(projectId, next);
              setOpen(next);
            }}
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={() => {
              const next = new Set<string>();
              persistExpandedFolders(projectId, next);
              setOpen(next);
            }}
          >
            Collapse all
          </button>
          {onVisibleChange && (
            <button type="button" aria-label="Hide explorer" onClick={() => onVisibleChange(false)}>
              <PanelLeftClose size={13} />
            </button>
          )}
        </div>
      </div>
      <div className="tree" role="tree">
        {render(tree)}
      </div>
      {onWidthChange && (
        <div
          className="explorer-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize explorer"
          onMouseDown={() => {
            dragging.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
        />
      )}
    </aside>
  );
}

const flatFolders = (nodes: TreeNode[]): string[] =>
  nodes.flatMap(node =>
    node.type === "folder" ? [node.path, ...flatFolders(node.children ?? [])] : []
  );

export function parentFoldersForFile(nodes: TreeNode[], fileId: string): string[] {
  for (const node of nodes) {
    if (node.type === "file" && node.fileId === fileId) return [];
    if (node.type === "folder") {
      const childParents = parentFoldersForFile(node.children ?? [], fileId);
      const containsFile =
        childParents.length > 0 ||
        (node.children ?? []).some(child => child.type === "file" && child.fileId === fileId);
      if (containsFile) return [node.path, ...childParents];
    }
  }
  return [];
}

const defaultExpandedFolders = () => new Set(["src", "src/main", "src/main/java"]);

function readExpandedFolders(projectId: string): Set<string> {
  try {
    const stored = window.localStorage.getItem(`codemuscle:explorer:${projectId}`);
    return stored ? new Set(JSON.parse(stored) as string[]) : defaultExpandedFolders();
  } catch {
    return defaultExpandedFolders();
  }
}

function persistExpandedFolders(projectId: string, folders: Set<string>): void {
  window.localStorage.setItem(
    `codemuscle:explorer:${projectId}`,
    JSON.stringify([...folders])
  );
}

type JavaFileKind = {
  label: string;
  shortLabel: string;
  className: string;
};

export function javaFileKind(path: string, fileName: string): JavaFileKind {
  const normalized = path.replaceAll("\\", "/").toLowerCase();
  if (fileName.endsWith("Controller.java")) return { label: "Controller class", shortLabel: "C", className: "controller" };
  if (fileName.endsWith("Repository.java")) return { label: "Repository", shortLabel: "R", className: "repository" };
  if (fileName.endsWith("Mapper.java")) return { label: "MapStruct mapper interface", shortLabel: "M", className: "mapper" };
  if (normalized.includes("/service/impl/")) return { label: "Service implementation", shortLabel: "S", className: "service-impl" };
  if (normalized.includes("/service/")) return { label: "Service interface", shortLabel: "I", className: "interface" };
  if (normalized.includes("/dto/") || fileName.endsWith("Request.java") || fileName.endsWith("Response.java")) {
    return { label: "DTO or record", shortLabel: "D", className: "dto" };
  }
  if (normalized.includes("/exception/")) return { label: "Exception class", shortLabel: "E", className: "exception" };
  if (normalized.includes("/config/")) return { label: "Configuration class", shortLabel: "C", className: "configuration" };
  if (normalized.includes("/strategy/")) return { label: "Strategy interface", shortLabel: "I", className: "interface" };
  if (/(Status|Type|Priority|Role|Permission)\.java$/.test(fileName)) {
    return { label: "Java enum", shortLabel: "E", className: "enum" };
  }
  if (normalized.includes("/model/")) return { label: "Domain model", shortLabel: "C", className: "model" };
  if (fileName.endsWith("Application.java")) return { label: "Spring Boot application", shortLabel: "▶", className: "application" };
  return { label: "Java class", shortLabel: "C", className: "class" };
}

function JavaFileIcon({ path, fileName }: { path: string; fileName: string }) {
  const kind = javaFileKind(path, fileName);
  return (
    <span
      className={`java-kind-icon ${kind.className}`}
      title={kind.label}
      aria-label={kind.label}
    >
      {kind.shortLabel}
    </span>
  );
}
