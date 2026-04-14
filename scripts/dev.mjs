import "dotenv/config";

import { spawn, spawnSync } from "node:child_process";

function resolveBin(command) {
  return process.platform === "win32" ? `${command}.cmd` : command;
}

function isLocalPrismaDevUrl(value) {
  return (
    value.startsWith("prisma+postgres://localhost") ||
    value.startsWith("prisma+postgres://127.0.0.1")
  );
}

const databaseUrl = process.env.DATABASE_URL ?? "";

if (isLocalPrismaDevUrl(databaseUrl)) {
  console.log("Starting local Prisma Postgres in detached mode...");

  const result = spawnSync(
    resolveBin("npx"),
    ["prisma", "dev", "--detach"],
    {
      stdio: "inherit",
      env: process.env,
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const nextProcess = spawn(
  resolveBin("npx"),
  ["next", "dev", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: process.env,
  },
);

const forwardSignal = (signal) => {
  if (!nextProcess.killed) {
    nextProcess.kill(signal);
  }
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

nextProcess.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
