import type { NextConfig } from "next";

function normalizeOrigins(rawOrigins: string[] | undefined): string[] {
  const values = rawOrigins ?? [];
  const normalized = new Set<string>();

  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      continue;
    }

    normalized.add(trimmed);

    const withoutProtocol = trimmed.replace(/^https?:\/\//u, "");
    const hostOnly = withoutProtocol.replace(/:\d+$/u, "");
    normalized.add(hostOnly);
    normalized.add(`http://${hostOnly}:3000`);
    normalized.add(`http://${hostOnly}:3001`);
  }

  return Array.from(normalized);
}

const envOrigins = normalizeOrigins(
  process.env.DEV_ALLOWED_ORIGINS?.split(","),
);

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    ...envOrigins,
  ],
};

export default nextConfig;
