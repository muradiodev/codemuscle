import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { trainingProjects, projectSourceRoot } from "./index.js";

for (const project of trainingProjects) {
  const target = projectSourceRoot(project.slug, project.languageId);
  if (!existsSync(target)) {
    throw new Error(`Missing project source tree: ${target}`);
  }
  const results = project.languageId === "java"
    ? [spawnSync(
        "docker",
        ["run", "--rm", "-v", `${target}:/workspace`, "-w", "/workspace", "maven:3.9.11-eclipse-temurin-21", "mvn", "-q", "test"],
        { stdio: "inherit" }
      )]
    : [
        spawnSync("python", ["-m", "compileall", "-q", "app", "tests"], {
          cwd: target,
          stdio: "inherit"
        }),
        spawnSync("python", ["-m", "pytest", "-q"], {
          cwd: target,
          stdio: "inherit"
        })
      ];
  if (results.some(result => result.status !== 0)) {
    throw new Error(`${project.name} failed ${project.languageId} validation`);
  }
  console.log(`✓ ${project.name}: ${project.files.length} practice files compiled`);
}
