import { access, cp, mkdir, rm, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";

await mkdir("release", { recursive: true });
const archive = "release/kora-extension.zip";
const unpacked = "release/kora-unpacked";
await rm(archive, { force: true });
await rm(unpacked, { recursive: true, force: true });
await cp("dist", unpacked, { recursive: true });
await access(`${unpacked}/manifest.json`);

const result = spawnSync("zip", ["-9", "-r", "../release/kora-extension.zip", "."], {
  cwd: "dist",
  stdio: "inherit"
});
if (result.status !== 0) process.exit(result.status ?? 1);

const { size } = await stat(archive);
const max = 10 * 1024 * 1024;
console.log(`KORA ZIP: ${(size / 1024).toFixed(1)} KiB`);
console.log(`Dossier à sélectionner dans Chrome: ${unpacked}`);
if (size > max) {
  console.error("Le ZIP dépasse la limite de 10 Mo.");
  process.exit(1);
}
