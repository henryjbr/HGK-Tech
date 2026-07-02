import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "www");

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "assets"), { recursive: true });

const dashboard = await readFile(resolve(root, "dist", "dashboard.html"), "utf8");
await writeFile(resolve(output, "index.html"), dashboard, "utf8");

await cp(resolve(root, "dist", "dashboard.css"), resolve(output, "dashboard.css"));
await cp(resolve(root, "dist", "bundle.dashboard.js"), resolve(output, "bundle.dashboard.js"));
await cp(resolve(root, "src", "supabase-config.js"), resolve(output, "supabase-config.js"));
await cp(
  resolve(root, "dist", "assinatura-email-hgk-compativel.html"),
  resolve(output, "assinatura-email-hgk-compativel.html"),
);

await cp(resolve(root, "public", "assets"), resolve(output, "assets"), {
  recursive: true,
});

console.log("Dashboard mobile preparado em www/.");
