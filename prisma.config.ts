import "dotenv/config";
import { defineConfig, env } from "prisma/config";

import { resolvePrismaConnectionUrl } from "./src/lib/prisma-connection-url";

const { directUrl, shadowDatabaseUrl } = resolvePrismaConnectionUrl(
  env("DATABASE_URL"),
);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: directUrl,
    shadowDatabaseUrl,
  },
});
