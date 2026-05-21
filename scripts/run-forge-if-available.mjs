import { spawnSync } from "node:child_process";

const forgeCommand = process.platform === "win32" ? "forge.cmd" : "forge";
const forgeCheck = spawnSync(forgeCommand, ["--version"], {
  encoding: "utf8",
  shell: false
});

if (forgeCheck.error || forgeCheck.status !== 0) {
  console.warn(
    "Foundry forge is not available on PATH. Skipping contract build in the JS workspace build."
  );
  console.warn("Install Foundry to run: pnpm --filter @probity/contracts build");
  process.exit(0);
}

const args = process.argv.slice(2);
const result = spawnSync(forgeCommand, args, {
  encoding: "utf8",
  shell: false,
  stdio: "inherit"
});

process.exit(result.status ?? 1);
