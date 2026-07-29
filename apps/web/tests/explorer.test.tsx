import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Explorer, javaFileKind, parentFoldersForFile } from "../components/Explorer";

const tree = [
  {
    name: "src",
    path: "src",
    type: "folder" as const,
    children: [{ name: "A.java", path: "src/A.java", type: "file" as const, fileId: "a" }]
  }
];

describe("Explorer", () => {
  beforeEach(() => window.localStorage.clear());

  it("expands folders and selects files", () => {
    const select = vi.fn();
    render(
      <Explorer
        tree={tree}
        currentFile=""
        onFile={select}
        projectId="employee-hr-system"
        onProject={() => undefined}
      />
    );
    fireEvent.click(screen.getByText("A.java"));
    expect(select).toHaveBeenCalledWith("a");
    fireEvent.click(screen.getByText("Collapse all"));
    expect(screen.queryByText("A.java")).not.toBeInTheDocument();
  });

  it("switches projects via the project selector", () => {
    const onProject = vi.fn();
    render(
      <Explorer
        tree={tree}
        currentFile=""
        onFile={() => undefined}
        projectId="employee-hr-system"
        onProject={onProject}
      />
    );
    fireEvent.change(screen.getByLabelText("Project"), {
      target: { value: "logistics-system" }
    });
    expect(onProject).toHaveBeenCalledWith("logistics-system");
  });

  it("shows completed progress indicator when data is available", () => {
    render(
      <Explorer
        tree={tree}
        currentFile=""
        onFile={() => undefined}
        projectId="employee-hr-system"
        onProject={() => undefined}
        fileProgress={{ a: { completed: true, accuracy: 92 } }}
      />
    );
    expect(screen.getByTitle("92% accuracy")).toBeInTheDocument();
  });

  it("can hide and show the explorer", () => {
    const onVisibleChange = vi.fn();
    const { rerender } = render(
      <Explorer
        tree={tree}
        currentFile=""
        onFile={() => undefined}
        projectId="employee-hr-system"
        onProject={() => undefined}
        visible
        onVisibleChange={onVisibleChange}
      />
    );
    fireEvent.click(screen.getByLabelText("Hide explorer"));
    expect(onVisibleChange).toHaveBeenCalledWith(false);

    rerender(
      <Explorer
        tree={tree}
        currentFile=""
        onFile={() => undefined}
        projectId="employee-hr-system"
        onProject={() => undefined}
        visible={false}
        onVisibleChange={onVisibleChange}
      />
    );
    fireEvent.click(screen.getByLabelText("Show explorer"));
    expect(onVisibleChange).toHaveBeenCalledWith(true);
  });

  it("expands all parents of the selected file", () => {
    const nestedTree = [{
      name: "src",
      path: "src",
      type: "folder" as const,
      children: [{
        name: "main",
        path: "src/main",
        type: "folder" as const,
        children: [{
          name: "model",
          path: "src/main/model",
          type: "folder" as const,
          children: [{
            name: "Employee.java",
            path: "src/main/model/Employee.java",
            type: "file" as const,
            fileId: "employee"
          }]
        }]
      }]
    }];

    expect(parentFoldersForFile(nestedTree, "employee")).toEqual([
      "src",
      "src/main",
      "src/main/model"
    ]);
    render(
      <Explorer
        tree={nestedTree}
        currentFile="employee"
        onFile={() => undefined}
        projectId="employee-hr-system"
        onProject={() => undefined}
      />
    );
    expect(screen.getByText("Employee.java")).toBeVisible();
  });

  it("keeps unrelated folders open while switching files", () => {
    const multiFolderTree = [{
      name: "src",
      path: "src",
      type: "folder" as const,
      children: [
        {
          name: "model",
          path: "src/model",
          type: "folder" as const,
          children: [
            { name: "Employee.java", path: "src/model/Employee.java", type: "file" as const, fileId: "employee" },
            { name: "Department.java", path: "src/model/Department.java", type: "file" as const, fileId: "department" }
          ]
        },
        {
          name: "service",
          path: "src/service",
          type: "folder" as const,
          children: [
            { name: "EmployeeService.java", path: "src/service/EmployeeService.java", type: "file" as const, fileId: "service" }
          ]
        }
      ]
    }];
    const props = {
      tree: multiFolderTree,
      onFile: () => undefined,
      projectId: "employee-hr-system",
      onProject: () => undefined
    };
    const { rerender } = render(<Explorer {...props} currentFile="employee" />);

    fireEvent.click(screen.getByText("service"));
    expect(screen.getByText("EmployeeService.java")).toBeVisible();

    rerender(<Explorer {...props} currentFile="department" />);
    expect(screen.getByText("Department.java")).toBeVisible();
    expect(screen.getByText("EmployeeService.java")).toBeVisible();
  });

  it("uses distinct IntelliJ-style markers for Java file roles", () => {
    expect(javaFileKind("src/controller/EmployeeController.java", "EmployeeController.java").className)
      .toBe("controller");
    expect(javaFileKind("src/service/EmployeeService.java", "EmployeeService.java").className)
      .toBe("interface");
    expect(javaFileKind("src/repository/EmployeeRepository.java", "EmployeeRepository.java").className)
      .toBe("repository");
    expect(javaFileKind("src/mapper/EmployeeMapper.java", "EmployeeMapper.java").className)
      .toBe("mapper");
  });
});
