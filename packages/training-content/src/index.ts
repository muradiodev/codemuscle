import { createHash } from "node:crypto";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { TrainingFile, TrainingProject } from "@codemuscle/shared";
import { difficulties } from "@codemuscle/shared";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const javaRoot = join(packageRoot, "java");

type ManifestFile = {
  path: string;
  difficulty?: (typeof difficulties)[number];
  order?: number;
  estimatedMinutes?: number;
  topics?: string[];
};

type Manifest = {
  id: string;
  name: string;
  language: string;
  version: string;
  description: string;
  difficulty: string;
  order: number;
  files: ManifestFile[];
};

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

function loadProjects(): TrainingProject[] {
  if (!existsSync(javaRoot)) {
    throw new Error(`Training content missing at ${javaRoot}. Run: node scripts/generate-projects.mjs`);
  }
  const slugs = readdirSync(javaRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return slugs.map((slug) => {
    const manifestPath = join(javaRoot, slug, "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
    const projectDir = join(javaRoot, slug, "project");
    const files: TrainingFile[] = manifest.files.map((entry, index) => {
      const referenceCode = readFileSync(join(projectDir, entry.path), "utf8").replace(/\r\n/g, "\n");
      const fileName = entry.path.split("/").at(-1)!;
      return {
        id: `${manifest.id}-${index + 1}`,
        projectId: manifest.id,
        path: entry.path,
        fileName,
        language: "java",
        difficulty: entry.difficulty ?? "intermediate",
        order: entry.order ?? index + 1,
        estimatedMinutes: entry.estimatedMinutes ?? Math.max(4, Math.ceil(referenceCode.split("\n").length / 6)),
        topics: entry.topics ?? [],
        referenceCode,
        enabled: true,
        contentHash: hash(referenceCode)
      };
    });
    return {
      id: manifest.id,
      slug: manifest.id,
      name: manifest.name,
      description: manifest.description,
      difficulty: manifest.difficulty,
      languageId: "java",
      version: manifest.version,
      order: manifest.order,
      files
    };
  }).sort((a, b) => a.order - b.order);
}

export const trainingProjects: TrainingProject[] = loadProjects();
export function projectById(id: string) {
  return trainingProjects.find((project) => project.id === id);
}
export function fileById(id: string) {
  return trainingProjects.flatMap((project) => project.files).find((file) => file.id === id);
}
export function projectSourceRoot(slug: string) {
  return join(javaRoot, slug, "project");
}
