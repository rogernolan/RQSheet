import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";

function getLanAddresses() {
  const interfaces = networkInterfaces();
  const addresses = new Set();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family !== "IPv4" || entry.internal) {
        continue;
      }

      addresses.add(entry.address);
    }
  }

  return Array.from(addresses);
}

const lanAddresses = getLanAddresses();
const allowedOrigins = lanAddresses.flatMap((address) => [
  address,
  `http://${address}:3000`,
  `http://${address}:3001`,
]);

if (allowedOrigins.length > 0) {
  process.env.DEV_ALLOWED_ORIGINS = allowedOrigins.join(",");
}

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "dev", "--hostname", "0.0.0.0"],
  {
    stdio: "inherit",
    env: process.env,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
