import type * as Monaco from "monaco-editor";

export type ThemePreference = "dark" | "light" | "system";

/**
 * Editor chrome matches the app global dark palette; Java tokens stay IntelliJ-colored.
 * (Avoid Darcula #2B2B2B — reads muddy/brown against the cooler UI.)
 */
export const intellijDarcula = {
  background: "#0d1117",
  foreground: "#d8dee9",
  gutter: "#0d1117",
  lineNumber: "#8b98a8",
  lineNumberActive: "#d8dee9",
  lineHighlight: "#171e27",
  selection: "#214283",
  cursor: "#d8dee9",
  keyword: "#CC7832",
  string: "#6A8759",
  number: "#6897BB",
  comment: "#808080",
  docComment: "#629755",
  annotation: "#BBB529",
  staticMember: "#9876AA",
  method: "#FFC66D",
  invalid: "#BC3F3C",
  suggestBackground: "#121820",
  suggestBorder: "#29313d",
  suggestSelected: "#2F65CA",
  suggestHighlight: "#FFC66D"
} as const;

/** IntelliJ Light / Default editor colors. */
export const intellijLight = {
  background: "#FFFFFF",
  foreground: "#000000",
  gutter: "#F0F0F0",
  lineNumber: "#999999",
  lineNumberActive: "#333333",
  lineHighlight: "#FCFFC8",
  selection: "#A6D2FF",
  cursor: "#000000",
  keyword: "#000080",
  string: "#008000",
  number: "#0000FF",
  comment: "#808080",
  docComment: "#808080",
  annotation: "#808000",
  staticMember: "#660E7A",
  method: "#000000",
  invalid: "#FF0000",
  suggestBackground: "#F7F7F7",
  suggestBorder: "#B8B8B8",
  suggestSelected: "#3875D6",
  suggestHighlight: "#7A4A00"
} as const;

export function resolveTheme(preference: ThemePreference, prefersLight: boolean): "dark" | "light" {
  if (preference === "system") return prefersLight ? "light" : "dark";
  return preference;
}

export function applyDocumentTheme(resolved: "dark" | "light"): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.style.colorScheme = resolved;
}

export function configureJavaEditorThemes(monaco: typeof Monaco): void {
  const d = intellijDarcula;
  monaco.editor.defineTheme("codemuscle-java-dark", {
    base: "vs-dark",
    inherit: false,
    rules: [
      { token: "", foreground: d.foreground.slice(1) },
      { token: "keyword", foreground: d.keyword.slice(1) },
      { token: "annotation", foreground: d.annotation.slice(1) },
      { token: "string", foreground: d.string.slice(1) },
      { token: "string.escape", foreground: d.keyword.slice(1) },
      { token: "string.invalid", foreground: d.invalid.slice(1) },
      { token: "number", foreground: d.number.slice(1) },
      { token: "number.float", foreground: d.number.slice(1) },
      { token: "number.hex", foreground: d.number.slice(1) },
      { token: "number.octal", foreground: d.number.slice(1) },
      { token: "number.binary", foreground: d.number.slice(1) },
      { token: "comment", foreground: d.comment.slice(1), fontStyle: "italic" },
      { token: "comment.doc", foreground: d.docComment.slice(1), fontStyle: "italic" },
      { token: "identifier", foreground: d.foreground.slice(1) },
      { token: "type.identifier", foreground: d.foreground.slice(1) },
      { token: "delimiter", foreground: d.foreground.slice(1) },
      { token: "operator", foreground: d.foreground.slice(1) },
      { token: "brackets", foreground: d.foreground.slice(1) },
      { token: "invalid", foreground: d.invalid.slice(1) }
    ],
    colors: {
      "editor.background": d.background,
      "editor.foreground": d.foreground,
      "editorGutter.background": d.gutter,
      "editorLineNumber.foreground": d.lineNumber,
      "editorLineNumber.activeForeground": d.lineNumberActive,
      "editor.lineHighlightBackground": d.lineHighlight,
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": d.selection,
      "editor.inactiveSelectionBackground": `${d.selection}80`,
      "editor.selectionHighlightBackground": "#21428355",
      "editor.findMatchBackground": "#32593D",
      "editor.findMatchHighlightBackground": "#3A3A0080",
      "editorCursor.foreground": d.cursor,
      "editorWhitespace.foreground": "#29313d",
      "editorIndentGuide.background1": "#222b36",
      "editorIndentGuide.activeBackground1": "#29313d",
      "editorBracketMatch.background": "#202a36",
      "editorBracketMatch.border": "#8b98a880",
      "editorSuggestWidget.background": d.suggestBackground,
      "editorSuggestWidget.border": d.suggestBorder,
      "editorSuggestWidget.foreground": "#d8dee9",
      "editorSuggestWidget.selectedBackground": d.suggestSelected,
      "editorSuggestWidget.highlightForeground": d.suggestHighlight,
      "editorWidget.background": d.suggestBackground,
      "editorWidget.border": d.suggestBorder,
      "scrollbarSlider.background": "#29313d99",
      "scrollbarSlider.hoverBackground": "#8b98a866",
      "scrollbarSlider.activeBackground": "#8b98a899"
    }
  });

  const l = intellijLight;
  monaco.editor.defineTheme("codemuscle-java-light", {
    base: "vs",
    inherit: false,
    rules: [
      { token: "", foreground: "000000" },
      { token: "keyword", foreground: l.keyword.slice(1), fontStyle: "bold" },
      { token: "annotation", foreground: l.annotation.slice(1) },
      { token: "string", foreground: l.string.slice(1) },
      { token: "string.escape", foreground: "000080" },
      { token: "number", foreground: l.number.slice(1) },
      { token: "number.float", foreground: l.number.slice(1) },
      { token: "number.hex", foreground: l.number.slice(1) },
      { token: "comment", foreground: l.comment.slice(1), fontStyle: "italic" },
      { token: "comment.doc", foreground: l.docComment.slice(1), fontStyle: "italic" },
      { token: "identifier", foreground: "000000" },
      { token: "type.identifier", foreground: "000000" },
      { token: "delimiter", foreground: "000000" },
      { token: "operator", foreground: "000000" },
      { token: "brackets", foreground: "000000" }
    ],
    colors: {
      "editor.background": l.background,
      "editor.foreground": l.foreground,
      "editorGutter.background": l.gutter,
      "editorLineNumber.foreground": l.lineNumber,
      "editorLineNumber.activeForeground": l.lineNumberActive,
      "editor.lineHighlightBackground": l.lineHighlight,
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": l.selection,
      "editor.inactiveSelectionBackground": "#A6D2FF80",
      "editorCursor.foreground": l.cursor,
      "editorIndentGuide.background1": "#E0E0E0",
      "editorIndentGuide.activeBackground1": "#BBBBBB",
      "editorSuggestWidget.background": l.suggestBackground,
      "editorSuggestWidget.border": l.suggestBorder,
      "editorSuggestWidget.foreground": "#1F1F1F",
      "editorSuggestWidget.selectedBackground": l.suggestSelected,
      "editorSuggestWidget.selectedForeground": "#FFFFFF",
      "editorSuggestWidget.highlightForeground": l.suggestHighlight
    }
  });
}
