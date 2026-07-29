import { describe, expect, it } from "vitest";
import { trainingProjects } from "./index.js";

describe("training content catalog", () => {
  it("loads four distinct java projects", () => {
    expect(trainingProjects).toHaveLength(4);
    expect(trainingProjects.map((project) => project.slug)).toEqual([
      "employee-hr-system",
      "logistics-system",
      "energy-billing-system",
      "b2b-saas-platform"
    ]);
  });

  it("provides at least 15 practice files per project with unique packages", () => {
    for (const project of trainingProjects) {
      expect(project.files.length).toBeGreaterThanOrEqual(15);
      expect(project.files.every((file) => file.referenceCode.includes("package com.codemuscle."))).toBe(true);
      expect(new Set(project.files.map((file) => file.path)).size).toBe(project.files.length);
    }
    const packages = trainingProjects.map((project) => {
      const match = project.files[0]!.referenceCode.match(/package (com\.codemuscle\.\w+)/);
      return match?.[1];
    });
    expect(new Set(packages).size).toBe(4);
  });

  it("includes JWT security and user profiles in every project", () => {
    for (const project of trainingProjects) {
      const paths = project.files.map((file) => file.path);
      expect(paths.some((path) => path.endsWith("/controller/AuthController.java"))).toBe(true);
      expect(paths.some((path) => path.endsWith("/security/SecurityConfiguration.java"))).toBe(true);
      expect(paths.some((path) => path.endsWith("/security/PlatformUser.java"))).toBe(true);
      expect(paths.some((path) => path.endsWith("/security/JwtAuthenticationService.java"))).toBe(true);
    }
  });
});
