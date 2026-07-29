const METHODISH =
  /^\s*(?:(?:public|private|protected|static|final|default|synchronized|native|abstract)\s+)+[\w<>,\[\]\s.]+\s+\w+\s*\(/;
const ANNOTATION = /^\s*@\w+/;

/**
 * Returns a ~current method/region of the reference file based on how many lines the user has typed.
 * Falls back to a small window around the focus line when braces cannot be balanced.
 */
export function getReferenceBlock(reference: string, typedLineCount: number): string {
  const lines = reference.split(/\r?\n/);
  if (lines.length === 0) return "";
  const focus = Math.min(Math.max(typedLineCount, 1), lines.length) - 1;

  let start = focus;
  while (start > 0) {
    const line = lines[start] ?? "";
    if (METHODISH.test(line) || ANNOTATION.test(line)) {
      while (start > 0 && ANNOTATION.test(lines[start - 1] ?? "")) start--;
      break;
    }
    if ((lines[start - 1] ?? "").trim() === "" && start < focus) break;
    start--;
  }

  let end = focus;
  let depth = 0;
  let seenBrace = false;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;
    depth += opens - closes;
    end = i;
    if (opens > 0) seenBrace = true;
    if (seenBrace && depth <= 0) break;
    if (!seenBrace && i > focus && line.trim() === "") break;
  }

  if (!seenBrace) {
    start = Math.max(0, focus - 8);
    end = Math.min(lines.length - 1, focus + 16);
  }

  return lines.slice(start, end + 1).join("\n");
}
