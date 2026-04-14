import path from "node:path";

const IGNORED_SEGMENTS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
]);

export const PROJECT_ROOT = path.resolve(process.cwd(), "..");

export function resolveProjectPath(inputPath: string): string {
  const cleanPath = inputPath.trim().replace(/^\/+/, "");
  const resolvedPath = path.resolve(PROJECT_ROOT, cleanPath);

  if (!resolvedPath.startsWith(PROJECT_ROOT)) {
    throw new Error("Access denied: path is outside the project root.");
  }

  const relativePath = path.relative(PROJECT_ROOT, resolvedPath);
  const segments = relativePath.split(path.sep);

  if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) {
    throw new Error("Access denied: ignored directory.");
  }

  return resolvedPath;
}

export function toProjectRelativePath(absolutePath: string): string {
  return path.relative(PROJECT_ROOT, absolutePath) || ".";
}

export function isIgnoredPath(absolutePath: string): boolean {
  const relativePath = path.relative(PROJECT_ROOT, absolutePath);
  return relativePath.split(path.sep).some((segment) => IGNORED_SEGMENTS.has(segment));
}
