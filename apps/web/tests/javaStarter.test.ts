import { describe, expect, it } from "vitest";
import { javaPackageStarter } from "../components/PracticeWorkspace";

describe("Java practice starter", () => {
  it("starts with the reference package declaration", () => {
    expect(javaPackageStarter("package com.codemuscle.hr;\n\nimport java.util.List;"))
      .toBe("package com.codemuscle.hr;\n\n");
  });

  it("does not invent a package when none exists", () => {
    expect(javaPackageStarter("public class Example {}")).toBe("");
  });
});
