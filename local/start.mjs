// `npm run local`: runs the app on this computer with its own Postgres and a
// test sign-in instead of Replit's. Needs Docker Desktop to be running.
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

process.chdir(path.resolve(import.meta.dirname, ".."));

const envFile = path.join("local", ".env");
if (!existsSync(envFile)) {
  writeFileSync(
    envFile,
    [
      "# Generated for local development. Not committed to git.",
      `POSTGRES_PASSWORD=${randomBytes(24).toString("hex")}`,
      `SESSION_SECRET=${randomBytes(32).toString("hex")}`,
      "# Optional, for the AI features:",
      "# OPENAI_API_KEY=",
      "# AI_INTEGRATIONS_OPENAI_API_KEY=",
      "# AI_INTEGRATIONS_OPENAI_BASE_URL=",
      "",
    ].join("\n"),
  );
  console.log(`Created ${envFile}`);
}

const settings = parseEnv(readFileSync(envFile, "utf8"));
const env = {
  ...process.env,
  ...settings,
  NODE_ENV: "development",
  LOCAL_DEV_AUTH: "true",
  DATABASE_URL: `postgresql://crm:${settings.POSTGRES_PASSWORD}@127.0.0.1:5433/crm`,
};

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) {
    console.error(`\nFailed: ${command} ${args.join(" ")}`);
    process.exit(result.status ?? 1);
  }
}

run("docker", ["compose", "--env-file", envFile, "-f", "local/docker-compose.yml", "up", "-d", "--wait"]);
// Creates or updates the tables. Asks first if a change would lose data.
run(process.execPath, ["node_modules/drizzle-kit/bin.cjs", "push"]);

console.log("\nOpen http://localhost:5000\n");
spawn(
  process.execPath,
  ["--import", "tsx", "--import", "./local/neon-local.mjs", "server/index.ts"],
  { stdio: "inherit", env },
).on("exit", (code) => process.exit(code ?? 1));
