import { z } from "zod";

export const themes = ["dark", "light", "system"] as const;
export const comparisonModes = ["syntax", "strict"] as const;
export const difficulties = ["warmup", "intermediate", "advanced"] as const;

export const settingsSchema = z.object({
  theme: z.enum(themes).default("dark"),
  editorFontSize: z.number().int().min(12).max(24).default(14),
  tabSize: z.number().int().min(2).max(8).default(4),
  wordWrap: z.boolean().default(false),
  minimapEnabled: z.boolean().default(false),
  synchronizedScrolling: z.boolean().default(false),
  pasteAllowed: z.boolean().default(false),
  comparisonMode: z.enum(comparisonModes).default("syntax"),
  dailyGoalMinutes: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]).default(30),
  onboardingComplete: z.boolean().default(false)
});
export type UserSettings = z.infer<typeof settingsSchema>;

export const profilePatchSchema = z.object({ displayName: z.string().trim().min(1).max(80) });
export const signUpSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
  confirmPassword: z.string(),
  termsAccepted: z.literal(true),
  deviceKey: z.string().min(8).max(200),
  deviceName: z.string().max(500).optional()
}).refine(value => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match."
});
export const signInSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().default(false),
  deviceKey: z.string().min(8).max(200),
  deviceName: z.string().max(500).optional()
});
export const forgotPasswordSchema = z.object({ email: z.string().trim().email().max(254) });
export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(500),
  password: z.string().min(10).max(128),
  confirmPassword: z.string()
}).refine(value => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match."
});
export const sessionCreateSchema = z.object({ projectId: z.string().min(1), fileId: z.string().min(1), comparisonMode: z.enum(comparisonModes).default("syntax") });
export const sessionPatchSchema = z.object({
  activeDurationMs: z.number().int().nonnegative().optional(),
  pausedDurationMs: z.number().int().nonnegative().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ABANDONED"]).optional()
});
export const draftSchema = z.object({ typedCode: z.string().max(250_000) });
export const metricsInputSchema = z.object({
  typedCode: z.string().max(250_000),
  activeDurationMs: z.number().int().positive(),
  manualCharacterCount: z.number().int().nonnegative(),
  autocompleteCharacterCount: z.number().int().nonnegative(),
  keystrokeCount: z.number().int().nonnegative(),
  backspaceCount: z.number().int().nonnegative(),
  pasteAttemptCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
  correctedErrorCount: z.number().int().nonnegative(),
  recoveryTimesMs: z.array(z.number().int().nonnegative()).max(10_000).default([])
});
export type MetricsInput = z.infer<typeof metricsInputSchema>;

export interface TrainingFile {
  id: string; projectId: string; path: string; fileName: string; language: "java";
  difficulty: typeof difficulties[number]; order: number; estimatedMinutes: number;
  topics: string[]; referenceCode: string; enabled: boolean; contentHash: string;
}
export interface TrainingProject {
  id: string; slug: string; name: string; description: string; difficulty: string;
  languageId: string; version: string; order: number; files: TrainingFile[];
}
export interface TreeNode {
  name: string; path: string; type: "folder" | "file"; fileId?: string; children?: TreeNode[];
}
export interface CompletionDefinition {
  label: string; insertText: string; detail: string; documentation: string; trigger?: string;
}
export interface LanguageDefinition {
  id: string; name: string; extensions: string[]; monacoLanguageId: string; enabled: boolean;
  completionProvider: { definitions: CompletionDefinition[] };
  comparisonStrategy: { defaultMode: "syntax" | "strict"; ignoreWhitespace: boolean };
}
export interface ComparisonResult {
  characterAccuracy: number; tokenAccuracy: number; completionPercentage: number;
  correctCharacters: number; correctTokens: number; comparedTokens: number;
  completedLines: number; totalLines: number; state: "correct" | "mismatch" | "completed";
}
export interface CalculatedMetrics extends ComparisonResult {
  correctCharactersPerMinute: number; rawCharactersPerMinute: number; linesPerMinute: number;
  manualCodingRatio: number; autocompleteDependencyRatio: number; averageRecoveryTimeMs: number;
}
export interface ApiError { error: { code: string; message: string; details: unknown[] } }

export const JAVA_KEYWORDS = [
  "abstract","assert","boolean","break","byte","case","catch","char","class","const","continue","default",
  "do","double","else","enum","extends","final","finally","float","for","if","implements","import","instanceof",
  "int","interface","long","native","new","package","private","protected","public","record","return","sealed",
  "short","static","strictfp","super","switch","synchronized","this","throw","throws","transient","try","var","void","volatile","while","yield"
] as const;
