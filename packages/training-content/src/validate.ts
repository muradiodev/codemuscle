import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { trainingProjects, projectSourceRoot } from "./index.js";

for (const project of trainingProjects) {
  const target = projectSourceRoot(project.slug);
  if (!existsSync(target)) {
    throw new Error(`Missing project source tree: ${target}`);
  }
  const result = spawnSync(
    "docker",
    ["run", "--rm", "-v", `${target}:/workspace`, "-w", "/workspace", "maven:3.9.11-eclipse-temurin-21", "mvn", "-q", "test"],
    { stdio: "inherit" }
  );
  if (result.status !== 0) {
    throw new Error(`${project.name} failed Maven validation`);
  }
  console.log(`✓ ${project.name}: ${project.files.length} practice files compiled`);
}
