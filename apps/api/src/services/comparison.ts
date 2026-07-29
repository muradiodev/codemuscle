import type { CalculatedMetrics, ComparisonResult, MetricsInput } from "@codemuscle/shared";

const TOKEN = /(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(?:[A-Za-z_$][\w$]*)|(?:\d+(?:\.\d+)?)|(?:==|!=|<=|>=|->|::|&&|\|\||\+\+|--)|[^\s]/g;
export const tokenizeJava = (code: string, comments = false) =>
  [...code.matchAll(TOKEN)].map(match => match[0]!).filter(token => comments || !token.startsWith("//") && !token.startsWith("/*"));

export function compareCode(typed: string, reference: string, mode: "syntax" | "strict" = "syntax"): ComparisonResult {
  const typedUnits = mode === "strict" ? [...typed] : tokenizeJava(typed);
  const referenceUnits = mode === "strict" ? [...reference] : tokenizeJava(reference);
  const compared = Math.max(typedUnits.length, referenceUnits.length);
  let correctUnits = 0;
  for (let index = 0; index < Math.min(typedUnits.length, referenceUnits.length); index++) {
    if (typedUnits[index] === referenceUnits[index]) correctUnits++;
  }
  const maxCharacters = Math.max(typed.length, reference.length);
  let correctCharacters = 0;
  for (let index = 0; index < Math.min(typed.length, reference.length); index++) if (typed[index] === reference[index]) correctCharacters++;
  const referenceLines = reference.split(/\r?\n/);
  const typedLines = typed.split(/\r?\n/);
  const completedLines = referenceLines.filter((line, index) =>
    (mode === "strict" ? typedLines[index] === line : tokenizeJava(typedLines[index] ?? "").join(" ") === tokenizeJava(line).join(" "))
  ).length;
  const completionPercentage = referenceUnits.length ? Math.min(100, typedUnits.length / referenceUnits.length * 100) : 100;
  return {
    characterAccuracy: typed.length ? correctCharacters / typed.length * 100 : 100,
    tokenAccuracy: compared ? correctUnits / compared * 100 : 100,
    completionPercentage, correctCharacters,
    correctTokens: correctUnits, comparedTokens: compared,
    completedLines, totalLines: referenceLines.length,
    state: completionPercentage >= 100 && correctUnits === referenceUnits.length ? "completed" : correctUnits === typedUnits.length ? "correct" : "mismatch"
  };
}

export function calculateMetrics(input: MetricsInput, reference: string, mode: "syntax" | "strict"): CalculatedMetrics {
  const comparison = compareCode(input.typedCode, reference, mode);
  const activeMinutes = Math.max(input.activeDurationMs / 60_000, 1 / 60);
  const inserted = input.manualCharacterCount + input.autocompleteCharacterCount;
  return {
    ...comparison,
    correctCharactersPerMinute: comparison.correctCharacters / activeMinutes,
    rawCharactersPerMinute: inserted / activeMinutes,
    linesPerMinute: comparison.completedLines / activeMinutes,
    manualCodingRatio: inserted ? input.manualCharacterCount / inserted * 100 : 100,
    autocompleteDependencyRatio: inserted ? input.autocompleteCharacterCount / inserted * 100 : 0,
    averageRecoveryTimeMs: input.recoveryTimesMs.length ? input.recoveryTimesMs.reduce((sum,value)=>sum+value,0)/input.recoveryTimesMs.length : 0
  };
}
