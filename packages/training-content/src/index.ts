import { createHash } from "node:crypto";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { TrainingFile, TrainingProject } from "@codemuscle/shared";
import { difficulties } from "@codemuscle/shared";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const languageRoots = ["java", "python"] as const;

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
  const projectLocations = languageRoots.flatMap((language) => {
    const root = join(packageRoot, language);
    if (!existsSync(root)) {
      throw new Error(`Training content missing at ${root}. Run: pnpm generate`);
    }
    return readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({ language, root, slug: entry.name }));
  });

  return projectLocations.map(({ language, root, slug }) => {
    const manifestPath = join(root, slug, "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
    if (manifest.language !== language) {
      throw new Error(`${manifestPath} declares ${manifest.language}; expected ${language}`);
    }
    const projectDir = join(root, slug, "project");
    const files: TrainingFile[] = manifest.files.map((entry, index) => {
      const referenceCode = readFileSync(join(projectDir, entry.path), "utf8").replace(/\r\n/g, "\n");
      const fileName = entry.path.split("/").at(-1)!;
      return {
        id: `${manifest.id}-${index + 1}`,
        projectId: manifest.id,
        path: entry.path,
        fileName,
        language,
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
      languageId: language,
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
export function projectSourceRoot(slug: string, languageId?: string) {
  const language = languageId ?? projectById(slug)?.languageId;
  if (!languageRoots.includes(language as (typeof languageRoots)[number])) {
    throw new Error(`Unknown language for project ${slug}`);
  }
  return join(packageRoot, language!, slug, "project");
}
