import { copyFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import pngToIco from "png-to-ico";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const releases = resolve(root, "releases", "windows");
const output = process.env.HGK_DESKTOP_BUILD_DIR
  ? resolve(process.env.HGK_DESKTOP_BUILD_DIR)
  : join(tmpdir(), "hgk-dashboard-windows-build");
const builder = join(root, "node_modules", "electron-builder", "out", "cli", "cli.js");

if (output === dirname(output) || !output.toLowerCase().endsWith("hgk-dashboard-windows-build")) {
  throw new Error(`Diretorio temporario inseguro: ${output}`);
}

const icon = await pngToIco(join(root, "desktop", "icon.png"));
await writeFile(join(root, "desktop", "icon.ico"), icon);
await mkdir(releases, { recursive: true });

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await new Promise((resolveBuild, rejectBuild) => {
  const child = spawn(
    process.execPath,
    [builder, "--win", "nsis", `--config.directories.output=${output}`],
    {
      cwd: root,
      stdio: "inherit",
      windowsHide: true,
    },
  );

  child.once("error", rejectBuild);
  child.once("exit", (code) => {
    if (code === 0) resolveBuild();
    else rejectBuild(new Error(`electron-builder terminou com codigo ${code}`));
  });
});

const installer = (await readdir(output))
  .find((file) => /^HGK-Dashboard-Setup-.*\.exe$/i.test(file));

if (!installer) {
  throw new Error("Instalador Windows nao encontrado.");
}

const destination = join(releases, "HGK-Dashboard-Windows-Setup.exe");
await copyFile(join(output, installer), destination);
console.log(`Instalador Windows criado em ${destination}`);
