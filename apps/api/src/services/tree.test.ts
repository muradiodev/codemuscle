import { describe, expect, it } from "vitest";
import { buildTree } from "./tree.js";

describe("buildTree", () => {
  it("sorts folders alphabetically with controller before model", () => {
    const tree = buildTree([
      { id: "1", path: "src/main/java/com/example/model/Shipment.java" },
      { id: "2", path: "src/main/java/com/example/service/ShipmentService.java" },
      { id: "3", path: "src/main/java/com/example/controller/ShipmentController.java" },
      { id: "4", path: "src/main/java/com/example/config/AppConfig.java" }
    ]);

    const example = tree
      .find(n => n.name === "src")!
      .children!.find(n => n.name === "main")!
      .children!.find(n => n.name === "java")!
      .children!.find(n => n.name === "com")!
      .children!.find(n => n.name === "example")!;

    expect(example.children!.map(n => n.name)).toEqual([
      "config",
      "controller",
      "model",
      "service"
    ]);
  });

  it("sorts files alphabetically within a folder", () => {
    const tree = buildTree([
      { id: "1", path: "controller/ZebraController.java" },
      { id: "2", path: "controller/AlphaController.java" }
    ]);
    expect(tree[0]!.children!.map(n => n.name)).toEqual([
      "AlphaController.java",
      "ZebraController.java"
    ]);
  });
});
