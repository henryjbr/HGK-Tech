import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "www");
const files = [
  "dashboard.css",
  "dashboard.js",
  "supabase-config.js",
];

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "assets"), { recursive: true });

const dashboard = await readFile(resolve(root, "dashboard.html"), "utf8");
await writeFile(resolve(output, "index.html"), dashboard, "utf8");

for (const file of files) {
  await cp(resolve(root, file), resolve(output, file));
}

await cp(resolve(root, "assets"), resolve(output, "assets"), {
  recursive: true,
});

console.log("Dashboard mobile preparado em www/.");
