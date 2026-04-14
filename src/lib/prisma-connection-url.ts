type LocalPrismaPostgresPayload = {
  databaseUrl?: string;
  shadowDatabaseUrl?: string;
};

export function resolvePrismaConnectionUrl(databaseUrl: string) {
  if (!databaseUrl.startsWith("prisma+postgres://")) {
    return {
      directUrl: databaseUrl,
      shadowDatabaseUrl: undefined,
    };
  }

  const apiKey = new URL(databaseUrl).searchParams.get("api_key");

  if (!apiKey) {
    return {
      directUrl: databaseUrl,
      shadowDatabaseUrl: undefined,
    };
  }

  try {
    const payload = JSON.parse(
      Buffer.from(apiKey, "base64url").toString("utf8"),
    ) as LocalPrismaPostgresPayload;

    return {
      directUrl: payload.databaseUrl ?? databaseUrl,
      shadowDatabaseUrl: payload.shadowDatabaseUrl,
    };
  } catch {
    return {
      directUrl: databaseUrl,
      shadowDatabaseUrl: undefined,
    };
  }
}
