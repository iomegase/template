import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { isIgnoredPath, resolveProjectPath, toProjectRelativePath } from "../utils/safe-path.js";

export const readProjectTreeSchema = {
  path: z.string().default("."),
  depth: z.number().int().min(1).max(6).default(3),
};

type TreeEntry = {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: TreeEntry[];
};

async function walkDirectory(directoryPath: string, depth: number): Promise<TreeEntry[]> {
  if (depth <= 0) return [];

  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const sortedEntries = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const tree: TreeEntry[] = [];

  for (const entry of sortedEntries) {
    const absolutePath = path.join(directoryPath, entry.name);

    if (isIgnoredPath(absolutePath)) continue;

    const item: TreeEntry = {
      name: entry.name,
      path: toProjectRelativePath(absolutePath),
      type: entry.isDirectory() ? "directory" : "file",
    };

    if (entry.isDirectory()) {
      item.children = await walkDirectory(absolutePath, depth - 1);
    }

    tree.push(item);
  }

  return tree;
}

export async function readProjectTree(input: { path: string; depth: number }) {
  const absolutePath = resolveProjectPath(input.path);
  const stat = await fs.stat(absolutePath);

  if (!stat.isDirectory()) {
    throw new Error("The requested path is not a directory.");
  }

  const tree = await walkDirectory(absolutePath, input.depth);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(tree, null, 2),
      },
    ],
  };
}
