import type * as Monaco from "monaco-editor";

const annotations = [
  "RestController",
  "RequestMapping",
  "GetMapping",
  "PostMapping",
  "PutMapping",
  "PatchMapping",
  "DeleteMapping",
  "Service",
  "Component",
  "Repository",
  "Configuration",
  "Bean",
  "RequiredArgsConstructor",
  "Getter",
  "Setter",
  "Data",
  "Builder",
  "Slf4j",
  "Valid",
  "Validated",
  "Transactional",
  "Override",
  "Autowired",
  "PathVariable",
  "RequestBody",
  "RequestParam"
];

const mapMethods = [
  "put",
  "putIfAbsent",
  "get",
  "getOrDefault",
  "containsKey",
  "containsValue",
  "remove",
  "replace",
  "compute",
  "computeIfAbsent",
  "computeIfPresent",
  "merge",
  "keySet",
  "values",
  "entrySet",
  "forEach",
  "size",
  "isEmpty",
  "clear"
];

const setMethods = [
  "add",
  "addAll",
  "contains",
  "containsAll",
  "remove",
  "removeAll",
  "retainAll",
  "forEach",
  "stream",
  "size",
  "isEmpty",
  "clear"
];

const streamMethods = [
  "filter",
  "map",
  "flatMap",
  "sorted",
  "distinct",
  "peek",
  "limit",
  "skip",
  "forEach",
  "collect",
  "toList",
  "reduce",
  "count",
  "findFirst",
  "findAny",
  "anyMatch",
  "allMatch",
  "noneMatch"
];

const systemOutMethods = ["println", "print", "printf", "format"];
const systemMembers = ["out", "err", "console", "currentTimeMillis", "nanoTime", "getenv", "getProperty"];

const curatedImports: Record<string, string> = {
  RestController: "org.springframework.web.bind.annotation.RestController",
  RequestMapping: "org.springframework.web.bind.annotation.RequestMapping",
  GetMapping: "org.springframework.web.bind.annotation.GetMapping",
  PostMapping: "org.springframework.web.bind.annotation.PostMapping",
  PutMapping: "org.springframework.web.bind.annotation.PutMapping",
  PatchMapping: "org.springframework.web.bind.annotation.PatchMapping",
  DeleteMapping: "org.springframework.web.bind.annotation.DeleteMapping",
  PathVariable: "org.springframework.web.bind.annotation.PathVariable",
  RequestBody: "org.springframework.web.bind.annotation.RequestBody",
  RequestParam: "org.springframework.web.bind.annotation.RequestParam",
  Service: "org.springframework.stereotype.Service",
  Component: "org.springframework.stereotype.Component",
  Repository: "org.springframework.stereotype.Repository",
  Configuration: "org.springframework.context.annotation.Configuration",
  Bean: "org.springframework.context.annotation.Bean",
  Autowired: "org.springframework.beans.factory.annotation.Autowired",
  Transactional: "org.springframework.transaction.annotation.Transactional",
  Valid: "jakarta.validation.Valid",
  Validated: "org.springframework.validation.annotation.Validated",
  RequiredArgsConstructor: "lombok.RequiredArgsConstructor",
  Getter: "lombok.Getter",
  Setter: "lombok.Setter",
  Data: "lombok.Data",
  Builder: "lombok.Builder",
  Slf4j: "lombok.extern.slf4j.Slf4j",
  List: "java.util.List",
  Set: "java.util.Set",
  Map: "java.util.Map",
  Optional: "java.util.Optional",
  HashMap: "java.util.HashMap",
  HashSet: "java.util.HashSet",
  ConcurrentHashMap: "java.util.concurrent.ConcurrentHashMap",
  ResponseEntity: "org.springframework.http.ResponseEntity"
};

function importsFromReference(reference: string): Record<string, string> {
  const imports: Record<string, string> = {};
  for (const match of reference.matchAll(/^\s*import\s+(?:static\s+)?([\w.]+)\s*;/gm)) {
    const qualifiedName = match[1];
    if (!qualifiedName) continue;
    const simpleName = qualifiedName.split(".").at(-1);
    if (simpleName && simpleName !== "*") imports[simpleName] = qualifiedName;
  }
  return imports;
}

function additionalImportEdit(
  model: Monaco.editor.ITextModel,
  qualifiedName: string | undefined
): Monaco.languages.TextEdit[] | undefined {
  if (!qualifiedName || qualifiedName.startsWith("java.lang.")) return undefined;
  const source = model.getValue();
  if (new RegExp(`^\\s*import\\s+${qualifiedName.replaceAll(".", "\\.")}\\s*;`, "m").test(source)) {
    return undefined;
  }

  const packageName = source.match(/^\s*package\s+([\w.]+)\s*;/m)?.[1];
  if (packageName && qualifiedName.startsWith(`${packageName}.`)) return undefined;

  const lines = source.split(/\r?\n/);
  let insertionLine = 1;
  let prefix = "";
  const importLines = lines
    .map((line, index) => (/^\s*import\s+/.test(line) ? index + 1 : 0))
    .filter(Boolean);
  if (importLines.length) {
    insertionLine = importLines.at(-1)! + 1;
  } else {
    const packageLine = lines.findIndex(line => /^\s*package\s+/.test(line));
    if (packageLine >= 0) insertionLine = packageLine + 2;
    else prefix = source.length ? "\n" : "";
  }

  return [{
    range: {
      startLineNumber: insertionLine,
      startColumn: 1,
      endLineNumber: insertionLine,
      endColumn: 1
    },
    text: `${prefix}import ${qualifiedName};\n`
  }];
}

export function registerJavaCompletions(
  monaco: typeof Monaco,
  reference: string,
  projectSymbols: string[] = []
) {
  const symbolImports = { ...curatedImports, ...importsFromReference(reference) };
  const symbols = [
    ...new Set([...projectSymbols, ...(reference.match(/\b[A-Z][A-Za-z0-9_]*\b/g) ?? [])])
  ];

  return monaco.languages.registerCompletionItemProvider("java", {
    triggerCharacters: [".", "@"],
    provideCompletionItems(model, position) {
      const prefix = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: position.column
      };

      let items: Array<[string, string, string, string?]> = [];

      if (/\bSystem\.out\.$/.test(prefix)) {
        items = systemOutMethods.map(x => [`${x}()`, `${x}($1);`, "System.out"]);
      } else if (/\bSystem\.$/.test(prefix)) {
        items = systemMembers.map(x => [
          x,
          x === "out" || x === "err" || x === "console" ? x : `${x}()`,
          "java.lang.System"
        ]);
      } else if (/\.stream\(\)\.$/.test(prefix)) {
        items = streamMethods.map(x => [`${x}()`, `${x}($1)`, "Stream operation"]);
      } else if (/\b(?:\w*(?:[Mm]ap)|HashMap|LinkedHashMap|ConcurrentHashMap|TreeMap)\s*\.\s*$/.test(prefix) ||
        /\b\w+[Mm]ap\.$/.test(prefix)) {
        items = mapMethods.map(x => [`${x}()`, `${x}($1)`, "Map operation"]);
      } else if (/\b(?:\w*(?:[Ss]et)|HashSet|LinkedHashSet|TreeSet|Tags|tags)\s*\.\s*$/.test(prefix) ||
        /\b\w+[Ss]et\.$/.test(prefix)) {
        items = setMethods.map(x => [`${x}()`, `${x}($1)`, "Set operation"]);
      } else if (/@\w*$/.test(prefix)) {
        items = annotations.map((x): [string, string, string, string?] => {
          const qualifiedName = symbolImports[x];
          return qualifiedName
            ? [`@${x}`, x, "Spring / Lombok annotation", qualifiedName]
            : [`@${x}`, x, "Spring / Lombok annotation"];
        });
      } else {
        items = [
          ["List<T>", "List<${1:T}>", "Generic collection", curatedImports.List!],
          ["Set<T>", "Set<${1:T}>", "Generic collection", curatedImports.Set!],
          ["Map<K, V>", "Map<${1:K}, ${2:V}>", "Generic map", curatedImports.Map!],
          ["Optional<T>", "Optional<${1:T}>", "Optional value", curatedImports.Optional!],
          ["ResponseEntity<T>", "ResponseEntity<${1:T}>", "Spring response", curatedImports.ResponseEntity!],
          ...symbols.map(x => {
            const qualifiedName = symbolImports[x];
            return qualifiedName
              ? [x, x, "Project symbol", qualifiedName] as [string, string, string, string]
              : [x, x, "Project symbol"] as [string, string, string];
          })
        ];
      }

      return {
        suggestions: items.map(([label, insertText, detail, qualifiedName]) => {
          const importEdits = additionalImportEdit(model, qualifiedName);
          return {
            label,
            insertText,
            detail,
            documentation: `Deterministic ${detail} completion`,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            ...(importEdits ? { additionalTextEdits: importEdits } : {}),
            range
          };
        })
      };
    }
  });
}
