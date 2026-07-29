import { describe, expect, it, vi } from "vitest";
import {
  configureJavaEditorThemes,
  intellijDarcula,
  resolveTheme
} from "../lib/theme";

describe("resolveTheme", () => {
  it("resolves system preference", () => {
    expect(resolveTheme("system", true)).toBe("light");
    expect(resolveTheme("system", false)).toBe("dark");
  });

  it("honors explicit theme", () => {
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("dark", true)).toBe("dark");
  });
});

describe("configureJavaEditorThemes", () => {
  it("registers IntelliJ Darcula keyword and string colors", () => {
    const defineTheme = vi.fn();
    configureJavaEditorThemes({ editor: { defineTheme } } as never);

    expect(defineTheme).toHaveBeenCalledWith(
      "codemuscle-java-dark",
      expect.objectContaining({
        inherit: false,
        colors: expect.objectContaining({
          "editor.background": intellijDarcula.background,
          "editor.foreground": intellijDarcula.foreground
        })
      })
    );

    const dark = defineTheme.mock.calls.find(call => call[0] === "codemuscle-java-dark")?.[1];
    expect(dark.rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ token: "keyword", foreground: "CC7832" }),
        expect.objectContaining({ token: "string", foreground: "6A8759" }),
        expect.objectContaining({ token: "number", foreground: "6897BB" }),
        expect.objectContaining({ token: "comment", foreground: "808080" })
      ])
    );
  });
});
