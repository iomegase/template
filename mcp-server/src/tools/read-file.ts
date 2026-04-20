import fs from "node:fs/promises";
import { z } from "zod";
import { resolveProjectPath, toProjectRelativePath } from "../utils/safe-path.js";

const MAX_FILE_SIZE_BYTES = 120_000;

export const readFileSchema = {
  path: z.string().min(1),
};

export async function readFile(input: { path: string }) {
  const absolutePath = resolveProjectPath(input.path);
  const stat = await fs.stat(absolutePath);

  if (!stat.isFile()) {
    throw new Error("The requested path is not a file.");
  }

  if (stat.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File too large to read safely: ${stat.size} bytes.`);
  }

  const content = await fs.readFile(absolutePath, "utf8");

  return {
    content: [
      {
        type: "text" as const,
        text: `File: ${toProjectRelativePath(absolutePath)}\n\n${content}`,
      },
    ],
  };
}
