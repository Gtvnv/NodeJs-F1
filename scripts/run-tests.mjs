/**
 * Runner de testes portavel.
 *
 * O test runner nativo do Node 20 nao descobre arquivos .test.ts
 * automaticamente, e a expansao de "**" depende do shell. Este script
 * encontra os arquivos *.test.ts em src/ e os entrega ao
 * `node --import tsx --test`, funcionando em qualquer sistema operacional.
 */
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const SRC_DIR = resolve(import.meta.dirname, "..", "src");

function findTestFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTestFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

const testFiles = findTestFiles(SRC_DIR);

if (testFiles.length === 0) {
  console.log("Nenhum arquivo de teste (*.test.ts) encontrado em src/.");
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...testFiles],
  { stdio: "inherit" }
);

process.exit(result.status ?? 1);
