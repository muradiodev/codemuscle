import type { ComparisonResult } from "@codemuscle/shared";

/** Matches API `tokenizeJava` — includes comments as matches, then strips them by default. */
const TOKEN =
  /(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(?:[A-Za-z_$][\w$]*)|(?:\d+(?:\.\d+)?)|(?:==|!=|<=|>=|->|::|&&|\|\||\+\+|--)|[^\s]/g;

export const tokenizeJava = (code: string, comments = false): string[] =>
  [...code.matchAll(TOKEN)]
    .map(match => match[0]!)
    .filter(token => comments || (!token.startsWith("//") && !token.startsWith("/*")));

/** Alias used by browser comparison and tests. */
export const tokenize = (value: string, comments = false): string[] => tokenizeJava(value, comments);

export function compare(typed: string, reference: string, mode: "syntax" | "strict"): ComparisonResult {
  const a = mode === "strict" ? [...typed] : tokenizeJava(typed);
  const b = mode === "strict" ? [...reference] : tokenizeJava(reference);
  let correct = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) correct++;
  let chars = 0;
  for (let i = 0; i < Math.min(typed.length, reference.length); i++) if (typed[i] === reference[i]) chars++;
  const lines = reference.split(/\r?\n/);
  const typedLines = typed.split(/\r?\n/);
  const completedLines = lines.filter((line, i) =>
    mode === "strict"
      ? typedLines[i] === line
      : tokenizeJava(typedLines[i] ?? "").join(" ") === tokenizeJava(line).join(" ")
  ).length;
  const completionPercentage = b.length ? Math.min(100, (a.length / b.length) * 100) : 100;
  const compared = Math.max(a.length, b.length);
  return {
    characterAccuracy: typed.length ? (chars / typed.length) * 100 : 100,
    tokenAccuracy: compared ? (correct / compared) * 100 : 100,
    completionPercentage,
    correctCharacters: chars,
    correctTokens: correct,
    comparedTokens: compared,
    completedLines,
    totalLines: lines.length,
    state:
      completionPercentage >= 100 && correct === b.length
        ? "completed"
        : correct === a.length
          ? "correct"
          : "mismatch"
  };
}
