import { describe, expect, it } from "vitest";
import { javaAnnotationNames } from "../lib/completions";

describe("Java annotation completion catalog", () => {
  it("contains Spring, Lombok, validation, JPA, and MapStruct annotations", () => {
    expect(javaAnnotationNames("package demo;")).toEqual(
      expect.arrayContaining([
        "SpringBootApplication",
        "RestController",
        "GetMapping",
        "Service",
        "Transactional",
        "Valid",
        "Data",
        "Builder",
        "Entity",
        "Mapper",
        "Mapping",
      ]),
    );
  });

  it("includes custom annotations used by the reference file", () => {
    const reference = "import com.example.Audited;\n@Audited\nclass Example {}";
    expect(javaAnnotationNames(reference)).toContain("Audited");
  });
});
