import type * as Monaco from "monaco-editor";

export const PYTHON_KEYWORDS = [
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "case",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "False",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "match",
  "None",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "True",
  "try",
  "while",
  "with",
  "yield"
] as const;

const BUILTINS = [
  "dict",
  "enumerate",
  "filter",
  "float",
  "frozenset",
  "int",
  "len",
  "list",
  "map",
  "max",
  "min",
  "print",
  "range",
  "set",
  "sorted",
  "str",
  "sum",
  "tuple",
  "zip"
] as const;

export function pythonSymbolsFromReference(reference: string): string[] {
  const code = reference
    .replace(/'''[\s\S]*?'''|\"\"\"[\s\S]*?\"\"\"/g, " ")
    .replace(/#[^\n]*/g, " ")
    .replace(/'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"/g, " ");
  const identifiers = code.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) ?? [];
  return [...new Set(identifiers)].filter(
    token => token.length >= 2 && !PYTHON_KEYWORDS.includes(token as (typeof PYTHON_KEYWORDS)[number])
  );
}

export function registerPythonCompletions(monaco: typeof Monaco, reference: string) {
  const referenceSymbols = pythonSymbolsFromReference(reference);
  return monaco.languages.registerCompletionItemProvider("python", {
    triggerCharacters: [..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_"],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const query = word.word.toLowerCase();
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: position.column
      };
      const matches = (value: string) => !query || value.toLowerCase().includes(query);
      const seen = new Set<string>();
      const items = [
        ...referenceSymbols.map(label => ({
          label,
          detail: "From reference file",
          kind: /^[A-Z]/.test(label)
            ? monaco.languages.CompletionItemKind.Class
            : monaco.languages.CompletionItemKind.Variable,
          priority: "0"
        })),
        ...PYTHON_KEYWORDS.map(label => ({
          label,
          detail: "Python keyword",
          kind: monaco.languages.CompletionItemKind.Keyword,
          priority: "1"
        })),
        ...BUILTINS.map(label => ({
          label,
          detail: "Python built-in",
          kind: monaco.languages.CompletionItemKind.Function,
          priority: "2"
        }))
      ].filter(item => matches(item.label) && !seen.has(item.label) && seen.add(item.label));

      return {
        suggestions: items.map(item => ({
          label: item.label,
          insertText: item.label,
          detail: item.detail,
          documentation: item.detail,
          kind: item.kind,
          sortText: `${item.priority}_${item.label.toLowerCase()}`,
          range
        }))
      };
    }
  });
}
