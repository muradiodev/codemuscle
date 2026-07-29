"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileCode2 } from "lucide-react";
import { api } from "../../../lib/api";

type ProjectDetail = {
  id: string;
  name: string;
  description: string;
  files: Array<{
    id: string;
    fileName: string;
    path: string;
    difficulty: string;
    estimatedMinutes: number;
    sessions: Array<{
      status: string;
      attempts: Array<{ tokenAccuracy: number; correctCharactersPerMinute: number }>;
    }>;
    topics: Array<{ topic: { name: string } }>;
  }>;
};

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const query = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api<ProjectDetail>(`/projects/${projectId}`),
    enabled: Boolean(projectId)
  });

  const project = query.data;
  if (!project) {
    return (
      <main className="container">
        <p>{query.isError ? "Failed to load project." : "Loading project…"}</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 className="page-title">{project.name}</h1>
      <p className="subtitle">{project.description}</p>
      <div className="card list">
        {project.files.map((file, index) => {
          const attempt = file.sessions[0]?.attempts[0];
          const done = file.sessions.some((session) => session.status === "COMPLETED");
          return (
            <div className="list-row" key={file.id}>
              {done ? <CheckCircle2 className="status-good" size={18} /> : <FileCode2 size={18} />}
              <span className="muted">{index + 1}</span>
              <div className="grow">
                <strong>{file.fileName}</strong>
                <div className="muted">
                  {file.path} · {file.estimatedMinutes} min · {file.topics.map((item) => item.topic.name).join(", ")}
                </div>
              </div>
              {attempt && (
                <span className="muted">
                  {attempt.tokenAccuracy.toFixed(1)}% · {attempt.correctCharactersPerMinute.toFixed(0)} CPM
                </span>
              )}
              <Link className="button" href={`/practice/${project.id}/${file.id}`}>
                {done ? "Repeat" : "Practice"}
              </Link>
            </div>
          );
        })}
      </div>
    </main>
  );
}
