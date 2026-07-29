"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { TreeNode, UserSettings } from "@codemuscle/shared";
import { api } from "../../../../lib/api";
import { PracticeWorkspace } from "../../../../components/PracticeWorkspace";
import type { FileProgress } from "../../../../components/Explorer";

type PracticeFile = {
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

type ProjectDetail = {
  files: Array<{
    id: string;
    sessions: Array<{
      status: string;
      attempts: Array<{ tokenAccuracy: number }>;
    }>;
  }>;
};

export default function Practice() {
  const { projectId, fileId } = useParams<{ projectId: string; fileId: string }>();
  const file = useQuery({
    queryKey: ["file", fileId],
    queryFn: () => api<PracticeFile>(`/files/${fileId}`)
  });
  const tree = useQuery({
    queryKey: ["tree", projectId],
    queryFn: () => api<TreeNode[]>(`/projects/${projectId}/tree`)
  });
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<UserSettings>("/settings")
  });
  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api<ProjectDetail>(`/projects/${projectId}`)
  });

  const fileProgress = useMemo(() => {
    const map: Record<string, FileProgress> = {};
    for (const item of project.data?.files ?? []) {
      const attempt = item.sessions[0]?.attempts[0];
      const progress: FileProgress = {
        completed: item.sessions.some(s => s.status === "COMPLETED")
      };
      if (typeof attempt?.tokenAccuracy === "number") {
        progress.accuracy = attempt.tokenAccuracy;
      }
      map[item.id] = progress;
    }
    return map;
  }, [project.data]);

  if (file.isError || tree.isError) {
    return <main className="container">Unable to load this practice file.</main>;
  }
  if (!file.data || !tree.data || !settings.data) {
    return <main className="container">Preparing editor…</main>;
  }

  return (
    <PracticeWorkspace
      file={file.data}
      tree={tree.data}
      settings={settings.data}
      fileProgress={fileProgress}
    />
  );
}
