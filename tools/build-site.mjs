import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");
const publicDir = resolve(root, "public");

const sourceFiles = [
  "supabase-config.js",
];

const publicFiles = [
  "_headers",
  "robots.txt",
  "sitemap.xml",
];

await mkdir(output, { recursive: true });

for (const file of sourceFiles) {
  await cp(resolve(root, "src", file), resolve(output, file));
}

for (const file of publicFiles) {
  await cp(resolve(publicDir, file), resolve(output, file));
}

await cp(resolve(publicDir, "assets"), resolve(output, "assets"), {
  recursive: true,
});

console.log("Site preparado em dist/.");
