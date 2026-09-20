import { describe, expect, it } from "vitest";
import { trainingProjects } from "./index.js";

describe("training content catalog", () => {
  it("loads four Java and four Python projects", () => {
    expect(trainingProjects).toHaveLength(8);
    expect(trainingProjects.filter(project => project.languageId === "java").map((project) => project.slug)).toEqual([
      "employee-hr-system",
      "logistics-system",
      "energy-billing-system",
      "b2b-saas-platform"
    ]);
    expect(trainingProjects.filter(project => project.languageId === "python").map((project) => project.slug)).toEqual([
      "python-employee-hr-system",
      "python-logistics-system",
      "python-energy-billing-system",
      "python-b2b-saas-platform"
    ]);
  });

  it("provides at least 15 unique practice files per project", () => {
    for (const project of trainingProjects) {
      expect(project.files.length).toBeGreaterThanOrEqual(15);
      expect(project.files.every(file => file.language === project.languageId)).toBe(true);
      expect(new Set(project.files.map((file) => file.path)).size).toBe(project.files.length);
    }
    const packages = trainingProjects.filter(project => project.languageId === "java").map((project) => {
      const match = project.files[0]!.referenceCode.match(/package (com\.codemuscle\.\w+)/);
      return match?.[1];
    });
    expect(new Set(packages).size).toBe(4);
  });

  it("includes JWT security and user profiles in every project", () => {
    for (const project of trainingProjects) {
      const paths = project.files.map((file) => file.path);
      if (project.languageId === "java") {
        expect(paths.some((path) => path.endsWith("/controller/AuthController.java"))).toBe(true);
        expect(paths.some((path) => path.endsWith("/security/SecurityConfiguration.java"))).toBe(true);
        expect(paths.some((path) => path.endsWith("/security/PlatformUser.java"))).toBe(true);
        expect(paths.some((path) => path.endsWith("/security/JwtAuthenticationService.java"))).toBe(true);
      } else {
        expect(paths).toEqual(expect.arrayContaining([
          "app/security/models.py",
          "app/security/service.py",
          "app/security/dependencies.py",
          "app/security/router.py"
        ]));
      }
    }
  });
});
