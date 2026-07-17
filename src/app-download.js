/*
+--------------------------------------------------------------------+
| This Source Code Form is subject to the terms of the Mozilla Public |
| License, v. 2.0. If a copy of the MPL was not distributed with this |
| file, You can obtain one at https://mozilla.org/MPL/2.0/.           |
|                                                                     |
| Copyright (c) 2026 Joonseok Hur                                     |
|                                                                     |
| Originally developed by Joonseok Hur in the Josiah Sinclair Group,  |
| UW-Madison.                                                         |
+--------------------------------------------------------------------+
*/

const downloadLocalAppButton = document.getElementById("download-local-app");
const downloadLocalAppWithDiagramsToggle = document.getElementById("download-local-app-with-diagrams");

const LOCAL_APP_DOWNLOAD_MANIFEST_PATH = "download-manifest.json";
const LOCAL_APP_DOWNLOAD_ROOT_FOLDER = "interactive-level-diagram";
const LOCAL_APP_DOWNLOAD_EMPTY_DIRECTORIES = ["diagrams"];
const LOCAL_APP_DOWNLOAD_MAX_FILE_BYTES = 25 * 1024 * 1024;
const LOCAL_APP_DOWNLOAD_MAX_TOTAL_BYTES = 120 * 1024 * 1024;

let localAppDownloadBusy = false;
let localAppDownloadCrc32Table = null;

function setLocalAppDownloadStatus(message) {
  if (typeof setStatus === "function") {
    setStatus(message);
  }
}

function normalizeLocalAppDownloadPath(path) {
  const normalized = String(path || "").replace(/\\/g, "/").trim();

  if (
    !normalized ||
    normalized.startsWith("/") ||
    /^[A-Za-z]:/.test(normalized) ||
    normalized.includes("\0")
  ) {
    return null;
  }

  const parts = normalized.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    return null;
  }

  return parts.join("/");
}

function getLocalAppDownloadCrc32Table() {
  if (localAppDownloadCrc32Table) {
    return localAppDownloadCrc32Table;
  }

  localAppDownloadCrc32Table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    localAppDownloadCrc32Table[index] = value >>> 0;
  }

  return localAppDownloadCrc32Table;
}

function calculateLocalAppDownloadCrc32(bytes) {
  const table = getLocalAppDownloadCrc32Table();
  let crc = 0xffffffff;

  for (let index = 0; index < bytes.length; index += 1) {
    crc = table[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function getZipDosTimestampParts(date = new Date()) {
  const year = Math.min(2107, Math.max(1980, date.getFullYear()));
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  return {
    time: ((hours & 0x1f) << 11) | ((minutes & 0x3f) << 5) | (seconds & 0x1f),
    date: (((year - 1980) & 0x7f) << 9) | ((month & 0x0f) << 5) | (day & 0x1f),
  };
}

function writeZipUint16(view, offset, value) {
  view.setUint16(offset, value & 0xffff, true);
}

function writeZipUint32(view, offset, value) {
  view.setUint32(offset, value >>> 0, true);
}

function createStoredZipBlob(entries) {
  const encoder = new TextEncoder();
  const timestamp = getZipDosTimestampParts();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  entries.forEach((entry) => {
    const nameBytes = encoder.encode(entry.path);
    const dataBytes = entry.bytes || new Uint8Array();
    const crc32 = calculateLocalAppDownloadCrc32(dataBytes);
    const localOffset = offset;

    if (nameBytes.length > 0xffff || dataBytes.byteLength > 0xffffffff) {
      throw new Error(`File is too large for this zip format: ${entry.path}`);
    }

    const localHeader = new Uint8Array(30);
    const localView = new DataView(localHeader.buffer);
    writeZipUint32(localView, 0, 0x04034b50);
    writeZipUint16(localView, 4, 20);
    writeZipUint16(localView, 6, 0);
    writeZipUint16(localView, 8, 0);
    writeZipUint16(localView, 10, timestamp.time);
    writeZipUint16(localView, 12, timestamp.date);
    writeZipUint32(localView, 14, crc32);
    writeZipUint32(localView, 18, dataBytes.byteLength);
    writeZipUint32(localView, 22, dataBytes.byteLength);
    writeZipUint16(localView, 26, nameBytes.length);
    writeZipUint16(localView, 28, 0);

    localParts.push(localHeader, nameBytes, dataBytes);
    offset += localHeader.byteLength + nameBytes.byteLength + dataBytes.byteLength;

    const centralHeader = new Uint8Array(46);
    const centralView = new DataView(centralHeader.buffer);
    writeZipUint32(centralView, 0, 0x02014b50);
    writeZipUint16(centralView, 4, 20);
    writeZipUint16(centralView, 6, 20);
    writeZipUint16(centralView, 8, 0);
    writeZipUint16(centralView, 10, 0);
    writeZipUint16(centralView, 12, timestamp.time);
    writeZipUint16(centralView, 14, timestamp.date);
    writeZipUint32(centralView, 16, crc32);
    writeZipUint32(centralView, 20, dataBytes.byteLength);
    writeZipUint32(centralView, 24, dataBytes.byteLength);
    writeZipUint16(centralView, 28, nameBytes.length);
    writeZipUint16(centralView, 30, 0);
    writeZipUint16(centralView, 32, 0);
    writeZipUint16(centralView, 34, 0);
    writeZipUint16(centralView, 36, 0);
    writeZipUint32(centralView, 38, entry.directory ? 0x10 : 0);
    writeZipUint32(centralView, 42, localOffset);
    centralParts.push(centralHeader, nameBytes);
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.byteLength, 0);
  const centralOffset = offset;
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  writeZipUint32(endView, 0, 0x06054b50);
  writeZipUint16(endView, 4, 0);
  writeZipUint16(endView, 6, 0);
  writeZipUint16(endView, 8, entries.length);
  writeZipUint16(endView, 10, entries.length);
  writeZipUint32(endView, 12, centralSize);
  writeZipUint32(endView, 16, centralOffset);
  writeZipUint16(endView, 20, 0);

  return new Blob([...localParts, ...centralParts, endRecord], { type: "application/zip" });
}

async function loadLocalAppDownloadManifest() {
  const response = await fetch(new URL(LOCAL_APP_DOWNLOAD_MANIFEST_PATH, document.baseURI), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Download manifest could not be loaded (${response.status}).`);
  }

  const manifest = await response.json();
  if (!manifest || !Array.isArray(manifest.files)) {
    throw new Error("Download manifest is malformed.");
  }

  return manifest;
}

function getLocalAppDownloadFileSpecs(manifest, { includeDiagrams = false } = {}) {
  const wantedGroups = new Set(["app"]);
  if (includeDiagrams) {
    wantedGroups.add("diagrams");
  }

  const seenPaths = new Set();
  return manifest.files
    .map((file) => ({
      path: normalizeLocalAppDownloadPath(file?.path),
      group: String(file?.group || "app"),
      optional: Boolean(file?.optional),
    }))
    .filter((file) => {
      if (!file.path || !wantedGroups.has(file.group) || seenPaths.has(file.path)) {
        return false;
      }
      seenPaths.add(file.path);
      return true;
    });
}

async function fetchLocalAppDownloadFile(fileSpec) {
  const response = await fetch(new URL(fileSpec.path, document.baseURI), {
    cache: "no-store",
  });

  if (!response.ok) {
    if (fileSpec.optional && response.status === 404) {
      return null;
    }
    throw new Error(`Could not fetch ${fileSpec.path} (${response.status}).`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > LOCAL_APP_DOWNLOAD_MAX_FILE_BYTES) {
    throw new Error(`${fileSpec.path} is larger than the local package file limit.`);
  }

  return {
    path: `${LOCAL_APP_DOWNLOAD_ROOT_FOLDER}/${fileSpec.path}`,
    bytes,
  };
}

function getLocalAppDownloadDirectoryEntries() {
  return LOCAL_APP_DOWNLOAD_EMPTY_DIRECTORIES
    .map((path) => normalizeLocalAppDownloadPath(path))
    .filter(Boolean)
    .map((path) => ({
      path: `${LOCAL_APP_DOWNLOAD_ROOT_FOLDER}/${path}/`,
      bytes: new Uint8Array(),
      directory: true,
    }));
}

async function buildLocalAppDownloadEntries({ includeDiagrams = false } = {}) {
  const manifest = await loadLocalAppDownloadManifest();
  const fileSpecs = getLocalAppDownloadFileSpecs(manifest, { includeDiagrams });
  const entries = getLocalAppDownloadDirectoryEntries();
  let totalBytes = 0;

  for (const fileSpec of fileSpecs) {
    const entry = await fetchLocalAppDownloadFile(fileSpec);
    if (!entry) {
      continue;
    }

    totalBytes += entry.bytes.byteLength;
    if (totalBytes > LOCAL_APP_DOWNLOAD_MAX_TOTAL_BYTES) {
      throw new Error("Local app package is larger than the configured size limit.");
    }

    entries.push(entry);
  }

  if (!entries.length) {
    throw new Error("No files were available for the local app package.");
  }

  return entries;
}

function getLocalAppDownloadFileName({ includeDiagrams = false } = {}) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const flavor = includeDiagrams ? "with-diagrams" : "without-diagrams";
  return `${LOCAL_APP_DOWNLOAD_ROOT_FOLDER}-${flavor}-${stamp}.zip`;
}

function triggerLocalAppBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function setLocalAppDownloadBusy(isBusy) {
  localAppDownloadBusy = isBusy;
  if (downloadLocalAppButton) {
    downloadLocalAppButton.disabled = isBusy;
    downloadLocalAppButton.setAttribute("aria-busy", isBusy ? "true" : "false");
  }
  if (downloadLocalAppWithDiagramsToggle) {
    downloadLocalAppWithDiagramsToggle.disabled = isBusy;
  }
}

async function downloadLocalAppPackage({ includeDiagrams = false } = {}) {
  if (localAppDownloadBusy) {
    return;
  }

  if (window.location.protocol === "file:") {
    setLocalAppDownloadStatus("Package downloads need HTTP/HTTPS file access. Use the hosted page or serve this folder locally.");
    return;
  }

  setLocalAppDownloadBusy(true);
  setLocalAppDownloadStatus(includeDiagrams
    ? "Preparing local app download with bundled diagrams..."
    : "Preparing local app download without bundled diagrams...");

  try {
    const entries = await buildLocalAppDownloadEntries({ includeDiagrams });
    const zipBlob = createStoredZipBlob(entries);
    triggerLocalAppBlobDownload(zipBlob, getLocalAppDownloadFileName({ includeDiagrams }));
    const fileCount = entries.filter((entry) => !entry.directory).length;
    setLocalAppDownloadStatus(`Downloaded local app package with ${fileCount} file${fileCount === 1 ? "" : "s"}.`);
  } catch (error) {
    setLocalAppDownloadStatus(error.message || "Local app package could not be created.");
  } finally {
    setLocalAppDownloadBusy(false);
  }
}

downloadLocalAppButton?.addEventListener("click", () => {
  void downloadLocalAppPackage({
    includeDiagrams: Boolean(downloadLocalAppWithDiagramsToggle?.checked),
  });
});
