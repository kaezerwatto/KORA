import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

const outdir = new URL("../dist/", import.meta.url);
await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

await build({
  entryPoints: {
    content: "src/content.js",
    popup: "src/popup.js"
  },
  bundle: true,
  minify: true,
  sourcemap: false,
  target: "chrome120",
  outdir: "dist",
  format: "iife",
  logLevel: "info"
});

for (const file of ["manifest.json", "src/popup.html", "src/popup.css"]) {
  const name = file.split("/").at(-1);
  await cp(file, new URL(name, outdir));
}

await cp(new URL("../src/icons/", import.meta.url), new URL("icons/", outdir), {
  recursive: true
});
