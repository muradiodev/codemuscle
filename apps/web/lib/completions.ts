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
  "RequestParam",
  "Mapper",
  "Mapping",
  "Mappings",
  "Named",
  "Qualifier",
  "Primary",
  "Value",
  "Controller",
  "Entity",
  "Table",
  "Id",
  "GeneratedValue",
  "Column",
  "SpringBootApplication",
  "ControllerAdvice",
  "RestControllerAdvice",
  "ExceptionHandler",
  "ResponseStatus",
  "RequestHeader",
  "ModelAttribute",
  "CrossOrigin",
  "ConfigurationProperties",
  "EnableConfigurationProperties",
  "NoArgsConstructor",
  "AllArgsConstructor",
  "EqualsAndHashCode",
  "ToString",
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
  "clear",
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
  "clear",
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
  "noneMatch",
];

const systemOutMethods = ["println", "print", "printf", "format"];
const systemMembers = [
  "out",
  "err",
  "console",
  "currentTimeMillis",
  "nanoTime",
  "getenv",
  "getProperty",
];

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
  ResponseEntity: "org.springframework.http.ResponseEntity",
  Mapper: "org.mapstruct.Mapper",
  Mapping: "org.mapstruct.Mapping",
  Mappings: "org.mapstruct.Mappings",
  Named: "org.springframework.beans.factory.annotation.Named",
  Qualifier: "org.springframework.beans.factory.annotation.Qualifier",
  Primary: "org.springframework.context.annotation.Primary",
  Value: "org.springframework.beans.factory.annotation.Value",
  Controller: "org.springframework.stereotype.Controller",
  Entity: "jakarta.persistence.Entity",
  Table: "jakarta.persistence.Table",
  Id: "jakarta.persistence.Id",
  GeneratedValue: "jakarta.persistence.GeneratedValue",
  Column: "jakarta.persistence.Column",
  SpringBootApplication:
    "org.springframework.boot.autoconfigure.SpringBootApplication",
  ControllerAdvice: "org.springframework.web.bind.annotation.ControllerAdvice",
  RestControllerAdvice:
    "org.springframework.web.bind.annotation.RestControllerAdvice",
  ExceptionHandler: "org.springframework.web.bind.annotation.ExceptionHandler",
  ResponseStatus: "org.springframework.web.bind.annotation.ResponseStatus",
  RequestHeader: "org.springframework.web.bind.annotation.RequestHeader",
  ModelAttribute: "org.springframework.web.bind.annotation.ModelAttribute",
  CrossOrigin: "org.springframework.web.bind.annotation.CrossOrigin",
  ConfigurationProperties:
    "org.springframework.boot.context.properties.ConfigurationProperties",
  EnableConfigurationProperties:
    "org.springframework.boot.context.properties.EnableConfigurationProperties",
  NoArgsConstructor: "lombok.NoArgsConstructor",
  AllArgsConstructor: "lombok.AllArgsConstructor",
  EqualsAndHashCode: "lombok.EqualsAndHashCode",
  ToString: "lombok.ToString",
};

const ANNOTATION_IMPORT_PREFIXES = [
  "org.mapstruct.",
  "org.springframework.",
  "lombok.",
  "jakarta.",
  "javax.annotation.",
  "javax.persistence.",
];

export const JAVA_KEYWORDS = new Set([
  "abstract",
  "assert",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extends",
  "final",
  "finally",
  "float",
  "for",
  "goto",
  "if",
  "implements",
  "import",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "try",
  "void",
  "volatile",
  "while",
  "var",
  "record",
  "sealed",
  "permits",
  "yield",
  "true",
  "false",
  "null",
]);

type ScanState =
  "code" | "lineComment" | "blockComment" | "string" | "char" | "textBlock";

/** True when offset is inside ", ', or text-block string content. */
export function isInsideJavaString(source: string, offset: number): boolean {
  let i = 0;
  let state: ScanState = "code";
  const end = Math.min(offset, source.length);

  while (i < end) {
    const c = source[i]!;
    const n1 = source[i + 1];
    const n2 = source[i + 2];

    if (state === "code") {
      if (c === "/" && n1 === "/") {
        state = "lineComment";
        i += 2;
        continue;
      }
      if (c === "/" && n1 === "*") {
        state = "blockComment";
        i += 2;
        continue;
      }
      if (c === '"' && n1 === '"' && n2 === '"') {
        state = "textBlock";
        i += 3;
        continue;
      }
      if (c === '"') {
        state = "string";
        i += 1;
        continue;
      }
      if (c === "'") {
        state = "char";
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }

    if (state === "lineComment") {
      if (c === "\n") state = "code";
      i += 1;
      continue;
    }

    if (state === "blockComment") {
      if (c === "*" && n1 === "/") {
        state = "code";
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (state === "string") {
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === '"') {
        state = "code";
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }

    if (state === "char") {
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === "'") {
        state = "code";
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }

    // textBlock
    if (c === '"' && n1 === '"' && n2 === '"') {
      state = "code";
      i += 3;
      continue;
    }
    i += 1;
  }

  return state === "string" || state === "char" || state === "textBlock";
}

function stripStringsAndComments(source: string): string {
  let out = "";
  let i = 0;
  let state: ScanState = "code";

  while (i < source.length) {
    const c = source[i]!;
    const n1 = source[i + 1];
    const n2 = source[i + 2];

    if (state === "code") {
      if (c === "/" && n1 === "/") {
        state = "lineComment";
        out += "  ";
        i += 2;
        continue;
      }
      if (c === "/" && n1 === "*") {
        state = "blockComment";
        out += "  ";
        i += 2;
        continue;
      }
      if (c === '"' && n1 === '"' && n2 === '"') {
        state = "textBlock";
        out += "   ";
        i += 3;
        continue;
      }
      if (c === '"') {
        state = "string";
        out += " ";
        i += 1;
        continue;
      }
      if (c === "'") {
        state = "char";
        out += " ";
        i += 1;
        continue;
      }
      out += c;
      i += 1;
      continue;
    }

    if (state === "lineComment") {
      if (c === "\n") {
        state = "code";
        out += "\n";
      } else out += " ";
      i += 1;
      continue;
    }

    if (state === "blockComment") {
      if (c === "*" && n1 === "/") {
        state = "code";
        out += "  ";
        i += 2;
        continue;
      }
      out += c === "\n" ? "\n" : " ";
      i += 1;
      continue;
    }

    if (state === "string" || state === "char") {
      const quote = state === "string" ? '"' : "'";
      if (c === "\\") {
        out += "  ";
        i += 2;
        continue;
      }
      if (c === quote) {
        state = "code";
        out += " ";
        i += 1;
        continue;
      }
      out += c === "\n" ? "\n" : " ";
      i += 1;
      continue;
    }

    if (c === '"' && n1 === '"' && n2 === '"') {
      state = "code";
      out += "   ";
      i += 3;
      continue;
    }
    out += c === "\n" ? "\n" : " ";
    i += 1;
  }

  return out;
}

/** Identifiers from the complete reference file (code only, not string/comment text). */
export function tokensFromReference(reference: string): string[] {
  const code = stripStringsAndComments(reference);
  const tokens = code.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) ?? [];
  return [...new Set(tokens)].filter(
    (token) => token.length >= 2 && !JAVA_KEYWORDS.has(token),
  );
}

/** Annotation simple names used or imported in the complete reference file. */
export function annotationsFromReference(reference: string): string[] {
  const used = [...reference.matchAll(/@([A-Z][A-Za-z0-9_]*)/g)].map(
    (match) => match[1]!,
  );
  const imported: string[] = [];
  for (const match of reference.matchAll(
    /^\s*import\s+(?:static\s+)?([\w.]+)\s*;/gm,
  )) {
    const qualifiedName = match[1];
    if (!qualifiedName) continue;
    if (
      !ANNOTATION_IMPORT_PREFIXES.some((prefix) =>
        qualifiedName.startsWith(prefix),
      )
    )
      continue;
    const simpleName = qualifiedName.split(".").at(-1);
    if (simpleName && simpleName !== "*") imported.push(simpleName);
  }
  return [...new Set([...used, ...imported])];
}

export function javaAnnotationNames(reference: string): string[] {
  return [...new Set([...annotationsFromReference(reference), ...annotations])];
}

function importsFromReference(reference: string): Record<string, string> {
  const imports: Record<string, string> = {};
  for (const match of reference.matchAll(
    /^\s*import\s+(?:static\s+)?([\w.]+)\s*;/gm,
  )) {
    const qualifiedName = match[1];
    if (!qualifiedName) continue;
    const simpleName = qualifiedName.split(".").at(-1);
    if (simpleName && simpleName !== "*") imports[simpleName] = qualifiedName;
  }
  return imports;
}

function additionalImportEdit(
  model: Monaco.editor.ITextModel,
  qualifiedName: string | undefined,
): Monaco.languages.TextEdit[] | undefined {
  if (!qualifiedName || qualifiedName.startsWith("java.lang."))
    return undefined;
  const source = model.getValue();
  if (
    new RegExp(
      `^\\s*import\\s+${qualifiedName.replaceAll(".", "\\.")}\\s*;`,
      "m",
    ).test(source)
  ) {
    return undefined;
  }

  const packageName = source.match(/^\s*package\s+([\w.]+)\s*;/m)?.[1];
  if (packageName && qualifiedName.startsWith(`${packageName}.`))
    return undefined;

  const lines = source.split(/\r?\n/);
  let insertionLine = 1;
  let prefix = "";
  const importLines = lines
    .map((line, index) => (/^\s*import\s+/.test(line) ? index + 1 : 0))
    .filter(Boolean);
  if (importLines.length) {
    insertionLine = importLines.at(-1)! + 1;
  } else {
    const packageLine = lines.findIndex((line) => /^\s*package\s+/.test(line));
    if (packageLine >= 0) {
      return [
        {
          range: {
            startLineNumber: packageLine + 1,
            startColumn: lines[packageLine]!.length + 1,
            endLineNumber: packageLine + 1,
            endColumn: lines[packageLine]!.length + 1,
          },
          text: `\nimport ${qualifiedName};`,
        },
      ];
    }
    prefix = source.length ? "\n" : "";
  }

  return [
    {
      range: {
        startLineNumber: insertionLine,
        startColumn: 1,
        endLineNumber: insertionLine,
        endColumn: 1,
      },
      text: `${prefix}import ${qualifiedName};\n`,
    },
  ];
}

function matchesQuery(token: string, query: string): boolean {
  if (!query) return true;
  const t = token.toLowerCase();
  const q = query.toLowerCase();
  return t.startsWith(q) || t.includes(q);
}

function sortKey(token: string, query: string): string {
  const t = token.toLowerCase();
  const q = query.toLowerCase();
  if (!q) return `2_${t}`;
  if (t === q) return `0_${t}`;
  if (t.startsWith(q)) return `1_${t}`;
  return `2_${t}`;
}

export function registerJavaCompletions(
  monaco: typeof Monaco,
  reference: string,
  projectSymbols: string[] = [],
) {
  const symbolImports = {
    ...curatedImports,
    ...importsFromReference(reference),
  };
  const referenceTokens = tokensFromReference(reference);
  const referenceAnnotations = annotationsFromReference(reference);
  const allAnnotations = javaAnnotationNames(reference);
  const symbols = [
    ...new Set([
      ...projectSymbols,
      ...referenceTokens.filter((t) => /^[A-Z]/.test(t)),
    ]),
  ];

  return monaco.languages.registerCompletionItemProvider("java", {
    triggerCharacters: [
      ".",
      "@",
      ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_".split(""),
    ],
    provideCompletionItems(model, position) {
      const offset = model.getOffsetAt(position);
      if (isInsideJavaString(model.getValue(), offset)) {
        return { suggestions: [] };
      }

      const prefix = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      const word = model.getWordUntilPosition(position);
      const query = word.word;
      let range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: position.column,
      };

      type Item = {
        label: string;
        insertText: string;
        detail: string;
        filterText?: string;
        qualifiedName?: string;
        kind: Monaco.languages.CompletionItemKind;
        sortText: string;
        asSnippet?: boolean;
      };

      const referenceItems = (q: string): Item[] =>
        referenceTokens
          .filter((t) => matchesQuery(t, q))
          .map((t) => ({
            label: t,
            insertText: t,
            filterText: t,
            detail: "From reference file",
            ...(symbolImports[t] ? { qualifiedName: symbolImports[t] } : {}),
            kind: /^[A-Z]/.test(t)
              ? monaco.languages.CompletionItemKind.Class
              : monaco.languages.CompletionItemKind.Method,
            sortText: `0_${sortKey(t, q)}`,
          }));

      let items: Item[] = [];

      if (/\bSystem\.out\.$/.test(prefix)) {
        items = systemOutMethods
          .filter((x) => matchesQuery(x, query))
          .map((x) => ({
            label: `${x}()`,
            insertText: `${x}($1);`,
            filterText: x,
            detail: "System.out",
            kind: monaco.languages.CompletionItemKind.Method,
            sortText: sortKey(x, query),
            asSnippet: true,
          }));
      } else if (/\bSystem\.$/.test(prefix)) {
        items = systemMembers
          .filter((x) => matchesQuery(x, query))
          .map((x) => ({
            label: x,
            insertText:
              x === "out" || x === "err" || x === "console" ? x : `${x}()`,
            filterText: x,
            detail: "java.lang.System",
            kind: monaco.languages.CompletionItemKind.Property,
            sortText: sortKey(x, query),
          }));
      } else if (/\.stream\(\)\.$/.test(prefix)) {
        items = streamMethods
          .filter((x) => matchesQuery(x, query))
          .map((x) => ({
            label: `${x}()`,
            insertText: `${x}($1)`,
            filterText: x,
            detail: "Stream operation",
            kind: monaco.languages.CompletionItemKind.Method,
            sortText: sortKey(x, query),
            asSnippet: true,
          }));
      } else if (
        // Only real map variables (camelCase), never types like ShipmentMapper.
        /\b(?:hashMap|linkedHashMap|concurrentHashMap|treeMap|[a-z]\w*[Mm]ap)\s*\.\s*$/.test(
          prefix,
        )
      ) {
        items = mapMethods
          .filter((x) => matchesQuery(x, query))
          .map((x) => ({
            label: `${x}()`,
            insertText: `${x}($1)`,
            filterText: x,
            detail: "Map operation",
            kind: monaco.languages.CompletionItemKind.Method,
            sortText: sortKey(x, query),
            asSnippet: true,
          }));
      } else if (
        /\b(?:hashSet|linkedHashSet|treeSet|tags|[a-z]\w*[Ss]et)\s*\.\s*$/.test(
          prefix,
        )
      ) {
        items = setMethods
          .filter((x) => matchesQuery(x, query))
          .map((x) => ({
            label: `${x}()`,
            insertText: `${x}($1)`,
            filterText: x,
            detail: "Set operation",
            kind: monaco.languages.CompletionItemKind.Method,
            sortText: sortKey(x, query),
            asSnippet: true,
          }));
      } else if (/@\w*$/.test(prefix)) {
        const annotationQuery = query.replace(/^@/, "");
        const annotationColumn = prefix.lastIndexOf("@") + 1;
        range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: annotationColumn,
          endColumn: position.column,
        };
        items = allAnnotations
          .filter((x) => matchesQuery(x, annotationQuery))
          .map((x) => ({
            label: `@${x}`,
            insertText: `@${x}`,
            filterText: `@${x}`,
            detail: referenceAnnotations.includes(x)
              ? "From reference file"
              : "Java annotation",
            ...(symbolImports[x] ? { qualifiedName: symbolImports[x] } : {}),
            kind: monaco.languages.CompletionItemKind.Interface,
            sortText: `${referenceAnnotations.includes(x) ? "0" : "1"}_${sortKey(x, annotationQuery)}`,
          }));
      } else {
        const keywordItems: Item[] = [...JAVA_KEYWORDS]
          .filter((keyword) => matchesQuery(keyword, query))
          .map((keyword) => ({
            label: keyword,
            insertText: keyword,
            filterText: keyword,
            detail: "Java keyword",
            kind: monaco.languages.CompletionItemKind.Keyword,
            sortText: `0_${sortKey(keyword, query)}`,
          }));
        const curated: Item[] = [
          {
            label: "List<T>",
            insertText: "List<${1:T}>",
            filterText: "List",
            detail: "Generic collection",
            qualifiedName: curatedImports.List!,
            kind: monaco.languages.CompletionItemKind.Class,
            sortText: `1_${sortKey("List", query)}`,
            asSnippet: true,
          },
          {
            label: "Set<T>",
            insertText: "Set<${1:T}>",
            filterText: "Set",
            detail: "Generic collection",
            qualifiedName: curatedImports.Set!,
            kind: monaco.languages.CompletionItemKind.Class,
            sortText: `1_${sortKey("Set", query)}`,
            asSnippet: true,
          },
          {
            label: "Map<K, V>",
            insertText: "Map<${1:K}, ${2:V}>",
            filterText: "Map",
            detail: "Generic map",
            qualifiedName: curatedImports.Map!,
            kind: monaco.languages.CompletionItemKind.Class,
            sortText: `1_${sortKey("Map", query)}`,
            asSnippet: true,
          },
          {
            label: "Optional<T>",
            insertText: "Optional<${1:T}>",
            filterText: "Optional",
            detail: "Optional value",
            qualifiedName: curatedImports.Optional!,
            kind: monaco.languages.CompletionItemKind.Class,
            sortText: `1_${sortKey("Optional", query)}`,
            asSnippet: true,
          },
          {
            label: "ResponseEntity<T>",
            insertText: "ResponseEntity<${1:T}>",
            filterText: "ResponseEntity",
            detail: "Spring response",
            qualifiedName: curatedImports.ResponseEntity!,
            kind: monaco.languages.CompletionItemKind.Class,
            sortText: `1_${sortKey("ResponseEntity", query)}`,
            asSnippet: true,
          },
          ...symbols
            .filter(
              (x) => matchesQuery(x, query) && !referenceTokens.includes(x),
            )
            .map((x) => ({
              label: x,
              insertText: x,
              filterText: x,
              detail: "Project symbol",
              ...(symbolImports[x] ? { qualifiedName: symbolImports[x] } : {}),
              kind: monaco.languages.CompletionItemKind.Class,
              sortText: `1_${sortKey(x, query)}`,
            })),
        ].filter((item) =>
          matchesQuery(
            item.filterText ?? item.label.replace(/<.*>/, ""),
            query,
          ),
        );

        // Always lead with tokens from the complete reference file (toResponse, Mapper, …).
        items = [...referenceItems(query), ...keywordItems, ...curated];
      }

      return {
        suggestions: items.map((item) => {
          const importEdits = additionalImportEdit(model, item.qualifiedName);
          return {
            label: item.label,
            insertText: item.insertText,
            filterText: item.filterText ?? item.label,
            detail: item.detail,
            documentation: item.detail,
            kind: item.kind,
            sortText: item.sortText,
            ...(item.asSnippet
              ? {
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule
                      .InsertAsSnippet,
                }
              : {}),
            ...(importEdits ? { additionalTextEdits: importEdits } : {}),
            range,
          };
        }),
      };
    },
  });
}
