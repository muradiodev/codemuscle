import type { TrainingFile, TreeNode } from "@codemuscle/shared";

function compareNodes(a: TreeNode, b: TreeNode): number {
  if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function sortTree(nodes: TreeNode[]): TreeNode[] {
  const sorted = [...nodes].sort(compareNodes);
  for (const node of sorted) {
    if (node.children?.length) node.children = sortTree(node.children);
  }
  return sorted;
}

export function buildTree(files: Pick<TrainingFile, "id" | "path">[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    const parts = file.path.split("/");
    let level = root;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      let node = level.find(item => item.name === part);
      if (!node) {
        node = {
          name: part,
          path: parts.slice(0, index + 1).join("/"),
          type: isFile ? "file" : "folder",
          ...(isFile ? { fileId: file.id } : { children: [] })
        };
        level.push(node);
      }
      if (!isFile) level = node.children!;
    });
  }
  return sortTree(root);
}
