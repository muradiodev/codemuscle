"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api,type ProjectSummary } from "../../lib/api";

export default function Projects(){
  const query=useQuery({queryKey:["projects"],queryFn:()=>api<ProjectSummary[]>("/projects")});
  return <main className="container">
    <h1 className="page-title">Java practice projects</h1>
    <p className="subtitle">Open a project to choose a specific file, or start full practice at the next unfinished file.</p>
    <div className="grid grid-3">{query.data?.map(project=>{
      const progress=project.fileCount?project.completedFiles/project.fileCount*100:0;
      return <article className="card" key={project.id}>
        <span className="tag">{project.difficulty}</span>
        <h2><Link href={`/projects/${project.id}`}>{project.name}</Link></h2>
        <p className="muted">{project.description}</p>
        <p>{project.fileCount} reference files</p>
        <div className="progress"><span style={{width:`${progress}%`}}/></div>
        <p className="muted">{progress.toFixed(0)}% completed</p>
        <div className="project-actions">
          <Link className="button" href={`/projects/${project.id}`}>Choose files</Link>
          {project.nextFileId&&<Link className="button primary" href={`/practice/${project.id}/${project.nextFileId}?mode=full`}>Full practice</Link>}
        </div>
      </article>
    })}</div>
  </main>
}
