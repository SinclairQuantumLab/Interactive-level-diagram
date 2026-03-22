const fs = require("fs/promises");
const path = require("path");
const { contextBridge, shell } = require("electron");

const diagramsDir = path.join(__dirname, "..", "diagrams");

async function listDiagrams() {
  const entries = await fs.readdir(diagramsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(yaml|yml)$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function readDiagram(fileName) {
  const safeName = path.basename(fileName);

  if (!/\.(yaml|yml)$/i.test(safeName)) {
    throw new Error("Only YAML diagram files are supported.");
  }

  const fullPath = path.join(diagramsDir, safeName);
  return fs.readFile(fullPath, "utf8");
}

async function readTextFile(fileName) {
  const safeName = path.basename(fileName);
  const lowerName = safeName.toLowerCase();

  if (!lowerName.endsWith(".yaml") && !lowerName.endsWith(".yml") && !lowerName.endsWith(".bib")) {
    throw new Error("Only YAML and BibTeX files are supported.");
  }

  const fullPath = path.join(diagramsDir, safeName);
  return fs.readFile(fullPath, "utf8");
}

contextBridge.exposeInMainWorld("diagramHost", {
  isElectron: true,
  listDiagrams,
  readDiagram,
  readTextFile,
  openExternal: (url) => shell.openExternal(String(url)),
});
