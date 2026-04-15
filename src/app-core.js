/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2026 Joonseok Hur
 *
 * Originally developed by Joonseok Hur in the Josiah Sinclair Group,
 * UW-Madison.
 */

const svg = d3.select("#diagram");
const tooltip = document.getElementById("tooltip");
const tooltipKicker = document.getElementById("tooltip-kicker");
const tooltipTitle = document.getElementById("tooltip-title");
const tooltipSubtitle = document.getElementById("tooltip-subtitle");
const tooltipMetadata = document.getElementById("tooltip-metadata");
const tooltipControls = document.getElementById("tooltip-controls");
const fineLabelLayer = document.getElementById("fine-label-layer");
const pinnedPanelLayer = document.getElementById("pinned-panel-layer");
const actionStack = document.getElementById("action-stack");
const issueStack = document.getElementById("issue-stack");
const editConfigButton = document.getElementById("edit-config");
const resetConfigButton = document.getElementById("reset-config");
const resetViewButton = document.getElementById("reset-view");
const undoActionButton = document.getElementById("undo-action");
const redoActionButton = document.getElementById("redo-action");
const themeToggleButton = document.getElementById("theme-toggle");
const chooseDiagramToggleButton = document.getElementById("choose-diagram-toggle");
const referencesToggleButton = document.getElementById("references-toggle");
const measureToggleButton = document.getElementById("measure-toggle");
const hideToggleButton = document.getElementById("hide-toggle");
const layoutEditorModal = document.getElementById("layout-editor-modal");
const layoutEditorHighlight = document.getElementById("layout-editor-highlight");
const layoutEditorText = document.getElementById("layout-editor-text");
const layoutEditorCloseButton = document.getElementById("layout-editor-close");
const layoutEditorCopyButton = document.getElementById("layout-editor-copy");
const layoutEditorApplyButton = document.getElementById("layout-editor-apply");
const diagramPicker = document.getElementById("diagram-picker");
const diagramPickerCloseButton = document.getElementById("diagram-picker-close");
const diagramPickerWebList = document.getElementById("diagram-picker-web-list");
const diagramPickerWebHint = document.getElementById("diagram-picker-web-hint");
const diagramPickerWebPath = document.getElementById("diagram-picker-web-path");
const diagramPickerLocalPickButton = document.getElementById("diagram-picker-local-pick");
const diagramPickerLocalBody = document.getElementById("diagram-picker-local-body");
const diagramPickerLocalList = document.getElementById("diagram-picker-local-list");
const diagramPickerLocalHint = document.getElementById("diagram-picker-local-hint");
const diagramPickerLocalPath = document.getElementById("diagram-picker-local-path");
const referencesPanel = document.getElementById("references-panel");
const referencesList = document.getElementById("references-list");
const referencesCloseButton = document.getElementById("references-close");
const bFieldToggleButton = document.getElementById("b-field-toggle");
const bFieldControls = document.getElementById("b-field-controls");
const bFieldRange = document.getElementById("b-field-range");
const bFieldValue = document.getElementById("b-field-value");
const bFieldGaussRange = document.getElementById("b-field-gauss-range");
const bFieldGaussValue = document.getElementById("b-field-gauss-value");
const bFieldGaussMinInput = document.getElementById("b-field-gauss-min");
const bFieldGaussMaxInput = document.getElementById("b-field-gauss-max");
const bFieldScaleValue = document.getElementById("b-field-scale-value");
const bFieldTitle = document.getElementById("b-field-title");
const heroKicker = document.getElementById("hero-kicker");
const appVersionLabel = document.getElementById("app-version");
const helpToggleButton = document.getElementById("help-toggle");
const helpPanel = document.getElementById("help-panel");
const speciesNotation = document.getElementById("species-notation");
const speciesName = document.getElementById("species-name");
const speciesProperties = document.getElementById("species-properties");
const heroPanel = document.querySelector(".hero-copy");
const appShell = document.querySelector(".app-shell");
const controlStack = document.querySelector(".control-stack");

const DEFAULT_APP_CONFIG = {
  ui: {
    appTitle: "Interactive atomic level diagram",
    appVersion: "20260323.1",
  },
  canvas: {
    width: 1440,
    height: 920,
    margin: {
      top: 72,
      right: 72,
      bottom: 72,
      left: 84,
    },
  },
  storage: {
    stateVersion: 5,
    stateKeyPrefix: "level-diagram-state-",
    selectedDiagramKey: "level-diagram-selected-diagram",
    selectedDiagramSourceKey: "level-diagram-selected-source",
    themeKey: "level-diagram-theme",
    diagramsFolderDb: "level-diagram-db",
    diagramsFolderStore: "handles",
    diagramsFolderKey: "diagrams-folder",
  },
  defaults: {
    expandedFine: [],
    expandedHyperfine: [],
    zoom: {
      x: 0,
      y: 0,
      k: 1,
    },
  },
  layout: {
    columnOrder: ["S", "P", "D"],
    baseFineX: 170,
    fineColumnGap: 44,
    energyTopY: 128,
    energyBottomY: 760,
    hyperfineOffsetX: 34,
    zeemanOffsetX: 22,
    connectorBendX: 6,
    groupGapY: 28,
    hyperfineMHzToPx: 0.1,
    zeemanGapX: 42,
    zeemanGapY: 8,
    zeemanBarWidth: 34,
    fineBarWidth: 118,
    labelXOffset: 0,
    fineLabelYOffset: 3,
    hyperfineLabelYOffset: 6,
    zeemanLabelYOffset: 10,
    transitionSlotGap: 16,
    transitionSlotMargin: 14,
    transitionStrokeWidth: 2.5,
    transitionHitWidth: 14,
    transitionEndInsetPx: 8,
    transitionArrowSizePx: 15,
    transitionLabelOffsetPx: 14,
    transitionLabelWidthFactorPx: 6.6,
    transitionLabelHeightPx: 16,
    measureTickSizePx: 8,
    measureStrokeWidth: 1.6,
    measureLabelOffsetPx: 18,
    measureLabelWidthFactorPx: 7.2,
    measureLabelLineHeightPx: 17,
    measureRemoveButtonRadiusPx: 10,
    measureRemoveButtonGapPx: 8,
    hiddenStateGapY: 24,
    hiddenStateGapX: 24,
    fineStateLineClass: "fine-line",
  },
};

const BROWSER_DIAGRAMS_FOLDER_NAME = "diagrams";
const DIAGRAMS_FOLDER_PICKER_ID = "interactive-level-diagram-folder";
const HOSTED_DIAGRAM_MANIFEST_PATH = `${BROWSER_DIAGRAMS_FOLDER_NAME}/manifest.json`;

function isPlainConfigObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function mergeConfigObjects(baseValue, overrideValue) {
  if (!isPlainConfigObject(baseValue) || !isPlainConfigObject(overrideValue)) {
    return overrideValue === undefined ? baseValue : overrideValue;
  }

  const merged = { ...baseValue };

  Object.entries(overrideValue).forEach(([key, value]) => {
    merged[key] = key in baseValue
      ? mergeConfigObjects(baseValue[key], value)
      : value;
  });

  return merged;
}

function readEmbeddedAppConfigText() {
  return document.getElementById("app-config-yaml")?.textContent?.trim() || "";
}

function loadAppConfig() {
  const yamlText = readEmbeddedAppConfigText();

  if (!yamlText || typeof window.jsyaml?.load !== "function") {
    return DEFAULT_APP_CONFIG;
  }

  try {
    const parsed = window.jsyaml.load(yamlText);
    return isPlainConfigObject(parsed)
      ? mergeConfigObjects(DEFAULT_APP_CONFIG, parsed)
      : DEFAULT_APP_CONFIG;
  } catch (error) {
    console.warn("Failed to parse embedded app YAML config; falling back to defaults.", error);
    return DEFAULT_APP_CONFIG;
  }
}

const APP_CONFIG = loadAppConfig();
const RUNTIME_APP_VERSION_OVERRIDE = typeof window.__APP_RUNTIME_VERSION_OVERRIDE__ === "string"
  ? window.__APP_RUNTIME_VERSION_OVERRIDE__.trim()
  : "";

if (RUNTIME_APP_VERSION_OVERRIDE) {
  APP_CONFIG.ui = {
    ...(APP_CONFIG.ui || {}),
    appVersion: RUNTIME_APP_VERSION_OVERRIDE,
  };
}

function createBrowserDiagramSourceInfo(overrides = {}) {
  return {
    supported: typeof window.showDirectoryPicker === "function",
    hasStoredHandle: false,
    permissionGranted: false,
    folderName: "",
    expectedFolderName: BROWSER_DIAGRAMS_FOLDER_NAME,
    hostedCatalogAvailable: false,
    hostedManifestPath: HOSTED_DIAGRAM_MANIFEST_PATH,
    activeSource: "none",
    ...overrides,
  };
}

function inferExpectedBrowserDiagramsFolderPath() {
  try {
    const locationUrl = new URL(window.location.href);

    if (locationUrl.protocol !== "file:") {
      return `${BROWSER_DIAGRAMS_FOLDER_NAME}/`;
    }

    let decodedPath = decodeURIComponent(locationUrl.pathname || "");

    if (/^\/[A-Za-z]:/.test(decodedPath)) {
      decodedPath = decodedPath.slice(1);
    }

    decodedPath = decodedPath.replace(/\//g, "\\");

    if (!decodedPath) {
      return `${BROWSER_DIAGRAMS_FOLDER_NAME}\\`;
    }

    const parentPath = decodedPath.replace(/\\[^\\]*$/, "");
    return `${parentPath}\\${BROWSER_DIAGRAMS_FOLDER_NAME}`;
  } catch {
    return `${BROWSER_DIAGRAMS_FOLDER_NAME}/`;
  }
}

function shouldShowSuggestedLocalFolderPath() {
  try {
    return new URL(window.location.href).protocol === "file:";
  } catch {
    return false;
  }
}

function findMatchingBibtexDelimiter(text, startIndex, openChar, closeChar) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];

    if (char === "\\" && inString) {
      escaped = !escaped;
      continue;
    }

    if (char === "\"" && !escaped) {
      inString = !inString;
    }

    escaped = false;

    if (inString) {
      continue;
    }

    if (char === openChar) {
      depth += 1;
    } else if (char === closeChar) {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function splitBibtexFields(bodyText) {
  const parts = [];
  let current = "";
  let braceDepth = 0;
  let parenDepth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < bodyText.length; index += 1) {
    const char = bodyText[index];

    if (char === "\\" && inString) {
      escaped = !escaped;
      current += char;
      continue;
    }

    if (char === "\"" && !escaped) {
      inString = !inString;
      current += char;
      continue;
    }

    escaped = false;

    if (!inString && char === "{") {
      braceDepth += 1;
    } else if (!inString && char === "}") {
      braceDepth -= 1;
    } else if (!inString && char === "(") {
      parenDepth += 1;
    } else if (!inString && char === ")") {
      parenDepth -= 1;
    }

    if (!inString && braceDepth === 0 && parenDepth === 0 && char === ",") {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function unbraceBibtexValue(value) {
  const trimmed = value.trim();

  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function normalizeBibtexText(value) {
  return unbraceBibtexValue(value)
    .replace(/\s+/g, " ")
    .replace(/\\&/g, "&")
    .replace(/[{}]/g, "")
    .trim();
}

function parseBibtex(text) {
  const entries = [];
  let index = 0;

  while (index < text.length) {
    const atIndex = text.indexOf("@", index);

    if (atIndex === -1) {
      break;
    }

    const typeMatch = text.slice(atIndex + 1).match(/^([A-Za-z]+)/);

    if (!typeMatch) {
      index = atIndex + 1;
      continue;
    }

    const entryType = typeMatch[1].toLowerCase();
    const typeEnd = atIndex + 1 + typeMatch[1].length;
    const openChar = text[typeEnd];
    const closeChar = openChar === "(" ? ")" : "}";

    if (openChar !== "{" && openChar !== "(") {
      index = typeEnd + 1;
      continue;
    }

    const closeIndex = findMatchingBibtexDelimiter(text, typeEnd, openChar, closeChar);

    if (closeIndex === -1) {
      break;
    }

    const body = text.slice(typeEnd + 1, closeIndex).trim();
    const commaIndex = body.indexOf(",");

    if (commaIndex === -1) {
      index = closeIndex + 1;
      continue;
    }

    const key = body.slice(0, commaIndex).trim();
    const fieldsText = body.slice(commaIndex + 1).trim();
    const fields = {};

    splitBibtexFields(fieldsText).forEach((fieldChunk) => {
      const separatorIndex = fieldChunk.indexOf("=");

      if (separatorIndex === -1) {
        return;
      }

      const fieldName = fieldChunk.slice(0, separatorIndex).trim().toLowerCase();
      const rawValue = fieldChunk.slice(separatorIndex + 1).trim();
      fields[fieldName] = normalizeBibtexText(rawValue);
    });

    entries.push({
      type: entryType,
      key,
      fields,
    });
    index = closeIndex + 1;
  }

  return entries;
}

function isDiagramConfigFileName(fileName) {
  return /\.(yaml|yml)$/i.test(fileName || "");
}

function parseDiagramConfig(text) {
  if (!window.jsyaml?.load) {
    throw new Error("YAML parser is unavailable.");
  }

  const parsed = window.jsyaml.load(text);
  return parsed && typeof parsed === "object" ? parsed : {};
}

function extractInlineBibliographyText(rawConfig = {}) {
  const candidateKeys = [
    "bibliography_bibtex",
    "references_bibtex",
  ];

  for (const key of candidateKeys) {
    const value = rawConfig?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function openHandleDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(APP_CONFIG.storage.diagramsFolderDb, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(APP_CONFIG.storage.diagramsFolderStore);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredDiagramsFolderHandle() {
  try {
    const db = await openHandleDb();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(APP_CONFIG.storage.diagramsFolderStore, "readonly");
      const store = transaction.objectStore(APP_CONFIG.storage.diagramsFolderStore);
      const request = store.get(APP_CONFIG.storage.diagramsFolderKey);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function storeDiagramsFolderHandle(handle) {
  try {
    const db = await openHandleDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(APP_CONFIG.storage.diagramsFolderStore, "readwrite");
      const store = transaction.objectStore(APP_CONFIG.storage.diagramsFolderStore);
      const request = store.put(handle, APP_CONFIG.storage.diagramsFolderKey);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    return false;
  }

  return true;
}

async function clearStoredDiagramsFolderHandle() {
  try {
    const db = await openHandleDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(APP_CONFIG.storage.diagramsFolderStore, "readwrite");
      const store = transaction.objectStore(APP_CONFIG.storage.diagramsFolderStore);
      const request = store.delete(APP_CONFIG.storage.diagramsFolderKey);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    return false;
  }

  return true;
}

async function ensureDiagramsFolderPermission(handle) {
  if (!handle) {
    return false;
  }

  try {
    const status = await handle.queryPermission({ mode: "read" });
    return status === "granted";
  } catch {
    return false;
  }
}

async function pickDiagramsFolder() {
  if (!window.showDirectoryPicker) {
    if (typeof setStatus === "function") {
      setStatus("This browser does not support picking a local diagrams folder.");
    }
    return;
  }

  try {
    const rememberedHandle = diagramsFolderHandle || await getStoredDiagramsFolderHandle();
    const handle = await window.showDirectoryPicker({
      mode: "read",
      id: DIAGRAMS_FOLDER_PICKER_ID,
      startIn: rememberedHandle || "downloads",
    });
    const permission = await handle.requestPermission({ mode: "read" });

    if (permission !== "granted") {
      if (typeof setStatus === "function") {
        setStatus("Folder access was not granted.");
      }
      return;
    }

    await storeDiagramsFolderHandle(handle);
    diagramsFolderHandle = handle;
    const folderEntries = await loadFolderDiagramCatalog(handle);
    diagramCatalog = {
      ...diagramCatalog,
      folderHandle: handle,
      folderEntries,
    };
    browserDiagramSourceInfo = createBrowserDiagramSourceInfo({
      ...browserDiagramSourceInfo,
      hasStoredHandle: true,
      folderName: handle.name || "",
      permissionGranted: true,
    });

    if (!hasLoadedDiagramSource && folderEntries.length > 0) {
      activateDiagramSelection(
        "folder",
        folderEntries.find((entry) => typeof entry.text === "string")?.fileName || folderEntries[0]?.fileName || null,
      );
      if (typeof setStatus === "function") {
        setStatus(`Loaded ${folderEntries.length} diagram${folderEntries.length === 1 ? "" : "s"} from "${handle.name || BROWSER_DIAGRAMS_FOLDER_NAME}".`);
      }
      return;
    }

    renderDiagramPicker();
    if (typeof setStatus === "function") {
      setStatus(`Loaded ${folderEntries.length} diagram${folderEntries.length === 1 ? "" : "s"} from "${handle.name || BROWSER_DIAGRAMS_FOLDER_NAME}".`);
    }
  } catch {
    return;
  }
}

async function useHostedDiagrams() {
  storeSelectedDiagramSource("hosted");

  if (typeof setStatus === "function") {
    setStatus(`Using bundled ${BROWSER_DIAGRAMS_FOLDER_NAME}/ files from this site. Reloading diagrams.`);
  }

  window.location.reload();
}

function canFetchHostedDiagramCatalog() {
  return typeof window.fetch === "function"
    && window.location.protocol !== "file:";
}

async function fetchTextResource(resourceUrl, { optional = false } = {}) {
  try {
    const response = await window.fetch(resourceUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (optional) {
        return null;
      }

      throw new Error(`Failed to fetch ${resourceUrl}: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    if (optional) {
      return null;
    }

    throw error;
  }
}

function normalizeHostedManifestFileList(manifestData) {
  if (Array.isArray(manifestData)) {
    return manifestData
      .map((fileName) => String(fileName || "").trim())
      .filter(isDiagramConfigFileName);
  }

  if (manifestData && typeof manifestData === "object" && Array.isArray(manifestData.files)) {
    return manifestData.files
      .map((fileName) => String(fileName || "").trim())
      .filter(isDiagramConfigFileName);
  }

  return [];
}

function buildDiagramCatalogEntry(fileName, rawYamlText) {
  try {
    const parsed = parseDiagramConfig(rawYamlText);
    const inlineBibText = extractInlineBibliographyText(parsed);
    const normalized = normalizeConfig(parsed, inlineBibText ? parseBibtex(inlineBibText) : []);
    return {
      fileName,
      title: normalized.meta.title || fileName,
      text: rawYamlText,
      bibliographyText: inlineBibText,
    };
  } catch {
    return {
      fileName,
      title: `${fileName} (invalid YAML)`,
      text: null,
      bibliographyText: null,
    };
  }
}

function sortDiagramCatalogEntries(entries) {
  return [...entries].sort((left, right) => left.fileName.localeCompare(right.fileName));
}

async function loadHostedDiagramCatalog() {
  if (!canFetchHostedDiagramCatalog()) {
    return {
      available: false,
      entries: [],
    };
  }

  try {
    const manifestUrl = new URL(HOSTED_DIAGRAM_MANIFEST_PATH, window.location.href);
    const manifestText = await fetchTextResource(manifestUrl.toString());
    const manifestData = JSON.parse(manifestText);
    const fileNames = normalizeHostedManifestFileList(manifestData);
    const entries = [];

    for (const fileName of fileNames) {
      const diagramUrl = new URL(fileName, manifestUrl);
      const rawYamlText = await fetchTextResource(diagramUrl.toString(), { optional: true });

      if (!rawYamlText) {
        entries.push({
          fileName,
          title: `${fileName} (unreadable)`,
          text: null,
          bibliographyText: null,
        });
        continue;
      }

      entries.push(buildDiagramCatalogEntry(fileName, rawYamlText));
    }

    return {
      available: true,
      entries: sortDiagramCatalogEntries(entries),
    };
  } catch {
    return {
      available: false,
      entries: [],
    };
  }
}

async function loadFolderDiagramCatalog(folderHandle) {
  const entries = [];

  for await (const entry of folderHandle.values()) {
    if (entry.kind !== "file" || !isDiagramConfigFileName(entry.name)) {
      continue;
    }

    try {
      const file = await entry.getFile();
      const rawYamlText = await file.text();
      entries.push(buildDiagramCatalogEntry(entry.name, rawYamlText));
    } catch {
      entries.push({
        fileName: entry.name,
        title: `${entry.name} (invalid YAML)`,
        text: null,
        bibliographyText: null,
      });
    }
  }

  return sortDiagramCatalogEntries(entries);
}

function createConfigId(species) {
  const symbol = String(species?.species || "diagram")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const massNumber = Number.isFinite(species?.atomic_mass_number) ? species.atomic_mass_number : "x";
  const ionizationNumber = Number.isFinite(species?.ionization_number) ? species.ionization_number : 0;
  return `${symbol || "diagram"}-${massNumber}-${ionizationNumber}`;
}

function normalizeTransitionEndpointRef(referenceText) {
  return String(referenceText || "").trim();
}

function createTransitionPairId(between) {
  const normalizedPair = (Array.isArray(between) ? between : [])
    .map(normalizeTransitionEndpointRef)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

  return normalizedPair.join(" <-> ");
}

function splitTransitionPairId(transitionId) {
  const normalizedId = String(transitionId || "").trim();

  if (!normalizedId) {
    return [];
  }

  return normalizedId
    .split(" <-> ")
    .map(normalizeTransitionEndpointRef)
    .filter(Boolean);
}

const HZ_UNIT_PREFIX_SCALE = {
  Y: 1e24,
  Z: 1e21,
  E: 1e18,
  P: 1e15,
  T: 1e12,
  G: 1e9,
  M: 1e6,
  k: 1e3,
  h: 1e2,
  da: 1e1,
  "": 1,
  d: 1e-1,
  c: 1e-2,
  m: 1e-3,
  u: 1e-6,
  μ: 1e-6,
  µ: 1e-6,
  n: 1e-9,
  p: 1e-12,
  f: 1e-15,
  a: 1e-18,
  z: 1e-21,
  y: 1e-24,
};

function groupIntegerDigits(integerText) {
  const sign = integerText.startsWith("-") || integerText.startsWith("+") ? integerText[0] : "";
  const digits = sign ? integerText.slice(1) : integerText;

  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function groupFractionDigits(fractionText) {
  return fractionText.replace(/(\d{3})(?=\d)/g, "$1 ");
}

function formatGroupedNumberToken(numberText) {
  const trimmed = String(numberText || "").trim();

  if (!trimmed) {
    return "";
  }

  const exponentMatch = trimmed.match(/([eE][+-]?\d+)$/);
  const exponent = exponentMatch ? exponentMatch[1] : "";
  const mantissaWithUncertainty = exponent ? trimmed.slice(0, -exponent.length) : trimmed;
  const uncertaintyMatch = mantissaWithUncertainty.match(/(\([^)]*\))$/);
  const uncertainty = uncertaintyMatch ? uncertaintyMatch[1] : "";
  const mantissa = uncertainty ? mantissaWithUncertainty.slice(0, -uncertainty.length) : mantissaWithUncertainty;
  const sign = mantissa.startsWith("-") || mantissa.startsWith("+") ? mantissa[0] : "";
  const unsignedMantissa = sign ? mantissa.slice(1) : mantissa;
  const [integerPartRaw = "0", fractionPartRaw = ""] = unsignedMantissa.split(".");
  const integerPart = groupIntegerDigits(`${sign}${integerPartRaw}`);
  const fractionPart = fractionPartRaw ? `.${groupFractionDigits(fractionPartRaw)}` : "";

  return `${integerPart}${fractionPart}${uncertainty}${exponent}`;
}

function createMeasurementValue({
  numericValue = Number.NaN,
  unitLabel = "",
  uncertaintyMode = "unknown",
  lowerUncertainty = 0,
  upperUncertainty = 0,
  displayText = "",
} = {}) {
  return {
    nominalValue: numericValue,
    unitLabel: unitLabel || "",
    uncertaintyMode,
    lowerUncertainty: uncertaintyMode === "known" ? Math.abs(lowerUncertainty) : 0,
    upperUncertainty: uncertaintyMode === "known" ? Math.abs(upperUncertainty) : 0,
    displayText,
  };
}

function createExactMeasurementValue(numericValue, unitLabel, displayText = "") {
  return createMeasurementValue({
    numericValue,
    unitLabel,
    uncertaintyMode: "exact",
    displayText,
  });
}

function createUnknownMeasurementValue(numericValue, unitLabel, displayText = "") {
  return createMeasurementValue({
    numericValue,
    unitLabel,
    uncertaintyMode: "unknown",
    displayText,
  });
}

function parseConfiguredUncertaintyToken(uncertaintyToken, decimalPlaces, exponentValue) {
  const trimmed = String(uncertaintyToken || "").trim();

  if (!trimmed || trimmed === "?") {
    return {
      uncertaintyMode: "unknown",
      lowerUncertainty: 0,
      upperUncertainty: 0,
    };
  }

  const exponentScale = 10 ** (exponentValue - decimalPlaces);

  if (/^\d+$/.test(trimmed)) {
    const uncertainty = Number(trimmed) * exponentScale;
    return {
      uncertaintyMode: "known",
      lowerUncertainty: uncertainty,
      upperUncertainty: uncertainty,
    };
  }

  const asymmetricMatch = trimmed.match(/^\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*$/);

  if (asymmetricMatch) {
    const values = [Number(asymmetricMatch[1]), Number(asymmetricMatch[2])];
    let upperDigits = values.find((value) => value >= 0);
    let lowerDigits = values.find((value) => value <= 0);

    if (!Number.isFinite(upperDigits)) {
      upperDigits = values[0];
    }

    if (!Number.isFinite(lowerDigits)) {
      lowerDigits = values[1];
    }

    return {
      uncertaintyMode: "known",
      lowerUncertainty: Math.abs(lowerDigits) * exponentScale,
      upperUncertainty: Math.abs(upperDigits) * exponentScale,
    };
  }

  return {
    uncertaintyMode: "unknown",
    lowerUncertainty: 0,
    upperUncertainty: 0,
  };
}

function parseConfiguredNumberToken(numberToken) {
  const match = String(numberToken || "").trim().match(/^([+-]?)(\d+(?:\.\d*)?|\.\d+)(?:\(([^)]*)\))?(?:[eE]([+-]?\d+))?$/);

  if (!match) {
    return null;
  }

  const signToken = match[1] || "";
  const mantissaToken = match[2];
  const uncertaintyToken = match[3] || "";
  const exponentToken = match[4] || "0";
  const decimalPlaces = mantissaToken.includes(".") ? mantissaToken.split(".")[1].length : 0;
  const exponentValue = Number.parseInt(exponentToken, 10) || 0;
  const numericValue = Number(`${signToken}${mantissaToken}e${exponentValue}`);

  return {
    numericValue,
    uncertaintyToken,
    decimalPlaces,
    exponentValue,
  };
}

function parseUnitToken(unitToken, expectedBaseUnit) {
  if (!unitToken) {
    return {
      ok: false,
      reason: "missing",
      message: `Missing unit; expected a value written in ${expectedBaseUnit} with an optional SI prefix.`,
    };
  }

  if (!unitToken.endsWith(expectedBaseUnit)) {
    return {
      ok: false,
      reason: "unexpected",
      message: `Unexpected unit "${unitToken}"; expected ${expectedBaseUnit} with an optional SI prefix.`,
    };
  }

  const prefix = unitToken.slice(0, -expectedBaseUnit.length);
  const scale = HZ_UNIT_PREFIX_SCALE[prefix];

  if (!Number.isFinite(scale)) {
    return {
      ok: false,
      reason: "unexpected",
      message: `Unexpected unit "${unitToken}"; expected ${expectedBaseUnit} with a recognized SI prefix such as k, M, G, or T.`,
    };
  }

  return {
    ok: true,
    prefix,
    unit: expectedBaseUnit,
    scale,
  };
}

function normalizeConfig(rawConfig = {}, bibliography = []) {
  const rawMeta = rawConfig.meta && typeof rawConfig.meta === "object" ? rawConfig.meta : {};
  const rawSpecies = rawConfig.species && typeof rawConfig.species === "object" ? rawConfig.species : {};
  const issues = [];

  function stripInlineCitations(text) {
    return typeof text === "string" ? text.replace(/\\cite\{[^}]+\}/g, "").trim() : text;
  }

  function pushMeasurementIssue(key, title, message) {
    issues.push({ key, title, message });
  }

  function parseNominalNumberToken(numberToken) {
    const parsedNumber = parseConfiguredNumberToken(numberToken);
    return Number.isFinite(parsedNumber?.numericValue) ? parsedNumber.numericValue : Number.NaN;
  }

  function parseConfiguredMeasurement(value, {
    issueKey,
    fieldLabel,
    expectedBaseUnit = "Hz",
    targetUnitScale = 1,
    assumedUnitLabel = expectedBaseUnit,
  }) {
    if (value === undefined || value === null || value === "") {
      return {
        numericValue: Number.NaN,
        displayText: "",
        measurement: createUnknownMeasurementValue(Number.NaN, assumedUnitLabel, ""),
      };
    }

    const rawText = String(value).trim();
    const citationSuffix = [...rawText.matchAll(/\\cite\{[^}]+\}/g)].map((match) => match[0]).join("");
    const strippedText = stripInlineCitations(rawText);

    const measurementMatch = strippedText.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\([^)]*\))?(?:[eE][+-]?\d+)?)(?:\s*([A-Za-zμµ]+))?$/);

    if (!measurementMatch) {
      pushMeasurementIssue(
        `${issueKey}:syntax`,
        "Invalid measurement",
        `${fieldLabel} must be written as a value plus unit, such as "384.230352862(?) THz" or "84.72(?) MHz".`,
      );
      return {
        numericValue: Number.NaN,
        displayText: rawText,
        measurement: createUnknownMeasurementValue(Number.NaN, assumedUnitLabel, rawText),
      };
    }

    const numberToken = measurementMatch[1];
    const unitToken = measurementMatch[2] || "";
    const parsedNumber = parseConfiguredNumberToken(numberToken);
    const nominalValue = parseNominalNumberToken(numberToken);

    if (!Number.isFinite(nominalValue)) {
      pushMeasurementIssue(
        `${issueKey}:value`,
        "Invalid number",
        `${fieldLabel} contains a number that could not be parsed.`,
      );
    }

    const unitParse = parseUnitToken(unitToken, expectedBaseUnit);
    let numericValue = Number.NaN;
    let measurement = createUnknownMeasurementValue(Number.NaN, unitToken || assumedUnitLabel, rawText);

    if (!unitParse.ok) {
      pushMeasurementIssue(
        `${issueKey}:unit`,
        "Unexpected unit",
        `${fieldLabel}: ${unitParse.message}`,
      );

      if (Number.isFinite(nominalValue)) {
        numericValue = nominalValue;
        measurement = createUnknownMeasurementValue(numericValue, unitToken || assumedUnitLabel, rawText);
      }
    } else if (Number.isFinite(nominalValue)) {
      numericValue = (nominalValue * unitParse.scale) / targetUnitScale;
      const uncertaintyInfo = parseConfiguredUncertaintyToken(
        parsedNumber?.uncertaintyToken,
        parsedNumber?.decimalPlaces ?? 0,
        parsedNumber?.exponentValue ?? 0,
      );
      const uncertaintyScale = unitParse.scale / targetUnitScale;

      measurement = createMeasurementValue({
        numericValue,
        unitLabel: unitToken || assumedUnitLabel,
        uncertaintyMode: uncertaintyInfo.uncertaintyMode,
        lowerUncertainty: uncertaintyInfo.lowerUncertainty * uncertaintyScale,
        upperUncertainty: uncertaintyInfo.upperUncertainty * uncertaintyScale,
        displayText: rawText,
      });
    }

    const displayUnit = unitToken || assumedUnitLabel;
    const displayText = `${formatGroupedNumberToken(numberToken)} ${displayUnit}${citationSuffix}`;

    return {
      numericValue,
      displayText,
      measurement: {
        ...measurement,
        displayText,
      },
    };
  }

  function parseConfiguredScalar(value, {
    issueKey,
    fieldLabel,
  }) {
    if (value === undefined || value === null || value === "") {
      return {
        numericValue: Number.NaN,
        displayText: "",
      };
    }

    const rawText = String(value).trim();
    const citationSuffix = [...rawText.matchAll(/\\cite\{[^}]+\}/g)].map((match) => match[0]).join("");
    const strippedText = stripInlineCitations(rawText);
    const parsedNumber = parseConfiguredNumberToken(strippedText);

    if (!Number.isFinite(parsedNumber?.numericValue)) {
      pushMeasurementIssue(
        `${issueKey}:value`,
        "Invalid scalar value",
        `${fieldLabel} must be written as a plain number such as "1.3362(13)".`,
      );

      return {
        numericValue: Number.NaN,
        displayText: rawText,
      };
    }

    return {
      numericValue: parsedNumber.numericValue,
      displayText: `${formatGroupedNumberToken(strippedText)}${citationSuffix}`,
    };
  }

  function normalizePropertyEntries(entries) {
    return (Array.isArray(entries) ? entries : [])
      .map((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          return null;
        }

        if (typeof entry.section === "string" && entry.section.trim()) {
          return {
            section: entry.section.trim(),
          };
        }

        return {
          label: entry.label ?? "",
          value: entry.value ?? "",
          references: Array.isArray(entry.references) ? entry.references : [],
        };
      })
      .filter((entry) => {
        if (!entry) {
          return false;
        }

        if (entry.section) {
          return true;
        }

        return String(entry.label ?? "").trim() || String(entry.value ?? "").trim();
      });
  }

  function parseStateMeasurement(stateId, fieldLabel, value, targetUnitScale, assumedUnitLabel) {
    return parseConfiguredMeasurement(value, {
      issueKey: `state:${stateId}:${fieldLabel.toLowerCase()}`,
      fieldLabel: `${stateId} ${fieldLabel}`,
      targetUnitScale,
      assumedUnitLabel,
    });
  }

  function parseTransitionMeasurement(transitionId, fieldLabel, value, targetUnitScale, assumedUnitLabel) {
    return parseConfiguredMeasurement(value, {
      issueKey: `transition:${transitionId}:${fieldLabel.toLowerCase()}`,
      fieldLabel: `Transition ${transitionId} ${fieldLabel}`,
      targetUnitScale,
      assumedUnitLabel,
    });
  }

  return {
    meta: {
      id: rawMeta.id || createConfigId(rawSpecies),
      title: rawMeta.title || "",
    },
    species: {
      ...rawSpecies,
      notes: Array.isArray(rawSpecies.notes) ? rawSpecies.notes : [],
      nuclearSpin: rawSpecies.nuclear_spin,
    },
    diagramIssues: issues,
    states: (Array.isArray(rawConfig.states) ? rawConfig.states : []).map((state) => {
      const energyMeasurement = parseStateMeasurement(state.id, "energy", state.energy, 1e12, "THz");
      const gJValue = parseConfiguredScalar(state.g_j, {
        issueKey: `state:${state.id}:g_j`,
        fieldLabel: `${state.id} g_J`,
      });
      const hyperfineConstants = state.hyperfine_constants && typeof state.hyperfine_constants === "object"
        ? {
          a: parseStateMeasurement(state.id, "A", state.hyperfine_constants.a, 1e6, "MHz"),
          b: parseStateMeasurement(state.id, "B", state.hyperfine_constants.b, 1e6, "MHz"),
          c: parseStateMeasurement(state.id, "C", state.hyperfine_constants.c, 1e6, "MHz"),
        }
        : null;

      return {
        id: state.id,
        label: state.notation || state.id,
        notation: state.notation || state.id,
        labelPlain: state.id,
        j: state.j,
        gJConfigured: gJValue.numericValue,
        energyTHz: energyMeasurement.numericValue,
        energyText: energyMeasurement.displayText,
        energyMeasurement: energyMeasurement.measurement,
        notes: Array.isArray(state.notes) ? state.notes : [],
        properties: normalizePropertyEntries(state.properties),
        referenceMap: state.references && typeof state.references === "object" && !Array.isArray(state.references)
          ? state.references
          : {},
        references: [],
        hyperfineConstants: hyperfineConstants ? {
          aMHz: hyperfineConstants.a.numericValue,
          bMHz: hyperfineConstants.b.numericValue,
          cMHz: hyperfineConstants.c.numericValue,
          aText: hyperfineConstants.a.displayText,
          bText: hyperfineConstants.b.displayText,
          cText: hyperfineConstants.c.displayText,
          aMeasurement: hyperfineConstants.a.measurement,
          bMeasurement: hyperfineConstants.b.measurement,
          cMeasurement: hyperfineConstants.c.measurement,
        } : null,
        hyperfine: (Array.isArray(state.hyperfine) ? state.hyperfine : []).map((level) => {
          const relMeasurement = parseConfiguredMeasurement(level.rel, {
            issueKey: `state:${state.id}:hyperfine:${level.id || level.f}:rel`,
            fieldLabel: `${state.id} hyperfine shift`,
            targetUnitScale: 1e6,
            assumedUnitLabel: "MHz",
          });

          return {
            id: level.id,
            F: level.f,
            relMHz: relMeasurement.numericValue,
            relText: relMeasurement.displayText,
            relMeasurement: relMeasurement.measurement,
            notes: Array.isArray(level.notes) ? level.notes : [],
            referenceMap: level.references && typeof level.references === "object" && !Array.isArray(level.references)
              ? level.references
              : {},
          };
        }),
      };
    }),
    bibliography,
    transitions: (Array.isArray(rawConfig.transitions) ? rawConfig.transitions : []).map((transition, index) => {
      const between = (Array.isArray(transition.between) ? transition.between : [])
        .map(normalizeTransitionEndpointRef);
      const transitionId = createTransitionPairId(between) || `transition-${index + 1}`;
      const frequencyMeasurement = parseTransitionMeasurement(
        transitionId,
        "frequency",
        transition.frequency,
        1,
        "Hz",
      );

      return {
        id: transitionId,
        between,
        transitionType: typeof transition.type === "string" && transition.type.trim() ? transition.type.trim() : "",
        strengthText: typeof transition.strength === "string" && transition.strength.trim() ? transition.strength.trim() : "",
        labelFields: Array.isArray(transition.show)
          ? transition.show.map((item) => String(item || "").trim()).filter(Boolean)
          : (typeof transition.show === "string" && transition.show.trim() ? [transition.show.trim()] : []),
        frequencyHz: frequencyMeasurement.numericValue,
        frequencyText: frequencyMeasurement.displayText,
        frequencyMeasurement: frequencyMeasurement.measurement,
        notes: Array.isArray(transition.notes) ? transition.notes : [],
        properties: normalizePropertyEntries(transition.properties),
        referenceMap: transition.references && typeof transition.references === "object" && !Array.isArray(transition.references)
          ? transition.references
          : {},
        references: Array.isArray(transition.references) ? transition.references : [],
      };
    }),
  };
}

function createEmptyConfig() {
  return {
    meta: {
      id: "unloaded",
      title: "",
    },
    species: {
      species: "",
      atomic_mass_number: null,
      ionization_number: 0,
      nuclearSpin: null,
      notes: [],
    },
    bibliography: [],
    diagramIssues: [],
    states: [],
    transitions: [],
  };
}

function getStoredSelectedDiagramPath() {
  try {
    return window.localStorage.getItem(APP_CONFIG.storage.selectedDiagramKey);
  } catch {
    return null;
  }
}

function storeSelectedDiagramPath(path) {
  try {
    window.localStorage.setItem(APP_CONFIG.storage.selectedDiagramKey, path);
  } catch {
    return;
  }
}

function getStoredSelectedDiagramSource() {
  const storageKey = APP_CONFIG.storage.selectedDiagramSourceKey
    || `${APP_CONFIG.storage.selectedDiagramKey}-source`;

  try {
    const value = window.localStorage.getItem(storageKey);
    return value === "folder" || value === "hosted" ? value : null;
  } catch {
    return null;
  }
}

function storeSelectedDiagramSource(source) {
  const normalizedSource = source === "folder" || source === "hosted" ? source : null;
  const storageKey = APP_CONFIG.storage.selectedDiagramSourceKey
    || `${APP_CONFIG.storage.selectedDiagramKey}-source`;

  if (!normalizedSource) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, normalizedSource);
  } catch {
    return;
  }
}

async function loadDiagramCatalog() {
  const folderHandle = await getStoredDiagramsFolderHandle();
  const browserSourceInfo = createBrowserDiagramSourceInfo({
    hasStoredHandle: Boolean(folderHandle),
    folderName: folderHandle?.name || "",
  });
  const hasPermission = await ensureDiagramsFolderPermission(folderHandle);
  browserSourceInfo.permissionGranted = hasPermission;
  const hostedCatalog = await loadHostedDiagramCatalog();
  browserSourceInfo.hostedCatalogAvailable = hostedCatalog.available;
  const folderEntries = folderHandle && hasPermission
    ? await loadFolderDiagramCatalog(folderHandle)
    : [];
  const preferredSource = getStoredSelectedDiagramSource();
  let activeSource = "none";

  if (preferredSource === "folder" && folderHandle && hasPermission) {
    activeSource = "folder";
  } else if (preferredSource === "hosted" && hostedCatalog.available) {
    activeSource = "hosted";
  } else if (folderHandle && hasPermission && folderEntries.length > 0) {
    activeSource = "folder";
  } else if (hostedCatalog.available) {
    activeSource = "hosted";
  } else if (folderHandle && hasPermission) {
    activeSource = "folder";
  }

  return {
    folderHandle: folderHandle && hasPermission ? folderHandle : null,
    hostedEntries: hostedCatalog.entries,
    folderEntries,
    entries: activeSource === "folder"
      ? folderEntries
      : (activeSource === "hosted" ? hostedCatalog.entries : []),
    browserSourceInfo: createBrowserDiagramSourceInfo({
      ...browserSourceInfo,
      activeSource,
    }),
  };
}

function resolveSelectedDiagramPath(diagramCatalog) {
  const storedPath = getStoredSelectedDiagramPath();

  if (storedPath && diagramCatalog.entries.some((entry) => entry.fileName === storedPath)) {
    return storedPath;
  }

  return diagramCatalog.entries.find((entry) => typeof entry.text === "string")?.fileName
    || diagramCatalog.entries[0]?.fileName
    || null;
}

function loadInitialConfig(diagramCatalog) {
  const selectedDiagramPath = resolveSelectedDiagramPath(diagramCatalog);
  const selectedDiagram = diagramCatalog.entries.find((entry) => entry.fileName === selectedDiagramPath) || null;
  const rawYamlText = selectedDiagram?.text || null;
  const rawBibText = selectedDiagram?.bibliographyText || null;

  if (!rawYamlText) {
    return {
      config: createEmptyConfig(),
      hasLoadedDiagramSource: false,
      selectedDiagramPath,
    };
  }

  try {
    return {
      config: normalizeConfig(parseDiagramConfig(rawYamlText), rawBibText ? parseBibtex(rawBibText) : []),
      hasLoadedDiagramSource: true,
      selectedDiagramPath,
    };
  } catch {
    return {
      config: createEmptyConfig(),
      hasLoadedDiagramSource: false,
      selectedDiagramPath,
    };
  }
}

function getDiagramEntriesForSource(source) {
  if (source === "folder") {
    return Array.isArray(diagramCatalog.folderEntries) ? diagramCatalog.folderEntries : [];
  }

  if (source === "hosted") {
    return Array.isArray(diagramCatalog.hostedEntries) ? diagramCatalog.hostedEntries : [];
  }

  return [];
}

function activateDiagramSelection(source, preferredPath = null) {
  const normalizedSource = source === "folder" ? "folder" : "hosted";
  const sourceEntries = getDiagramEntriesForSource(normalizedSource);
  const nextCatalog = {
    ...diagramCatalog,
    entries: sourceEntries,
  };

  if (preferredPath) {
    storeSelectedDiagramPath(preferredPath);
  }
  storeSelectedDiagramSource(normalizedSource);
  browserDiagramSourceInfo = createBrowserDiagramSourceInfo({
    ...browserDiagramSourceInfo,
    activeSource: normalizedSource,
  });
  diagramCatalog = nextCatalog;

  ({ config, hasLoadedDiagramSource, selectedDiagramPath } = loadInitialConfig(nextCatalog));
  if (selectedDiagramPath) {
    storeSelectedDiagramPath(selectedDiagramPath);
  }
  hasInteractiveDiagram = config.states.length > 0;
  storageKey = `${APP_CONFIG.storage.stateKeyPrefix}${config.meta.id}-v${APP_CONFIG.storage.stateVersion}`;
  syncDocumentTitle();
  renderHomePanel();
  rebuildDerivedDiagramState();
  hideTooltip();

  currentHyperfineScaleByFineState = createDefaultHyperfineScaleMap();
  currentTransitionLabelFieldsById = createDefaultTransitionLabelFieldMap();
  currentTransitionLabelPrecisionById = createDefaultTransitionLabelPrecisionMap();

  const hasStoredState = loadStoredState();
  applyTheme(currentTheme);
  syncControlUI();
  renderReferencesPanel();

  if (!hasStoredState) {
    render();
    fitView({ persist: false, animationDuration: 0 });
  }

  initializeHistoryState();
}

let diagramsFolderHandle = null;
let diagramCatalog = {
  folderHandle: null,
  hostedEntries: [],
  folderEntries: [],
  entries: [],
};
let config = createEmptyConfig();
let hasLoadedDiagramSource = false;
let selectedDiagramPath = null;
let browserDiagramSourceInfo = createBrowserDiagramSourceInfo();
let hasInteractiveDiagram = false;
function syncDocumentTitle() {
  document.title = hasLoadedDiagramSource
    ? `${config.meta.title || `${config.species.species}-${config.species.atomic_mass_number}`} Diagram`
    : APP_CONFIG.ui.appTitle;
  svg.attr("aria-label", hasLoadedDiagramSource
    ? (config.meta.title || `${config.species.species || "Atomic"} level diagram`)
    : APP_CONFIG.ui.appTitle);
}

const width = APP_CONFIG.canvas.width;
const height = APP_CONFIG.canvas.height;
const margin = APP_CONFIG.canvas.margin;
let storageKey = `${APP_CONFIG.storage.stateKeyPrefix}unloaded-v${APP_CONFIG.storage.stateVersion}`;
const defaultExpandedFine = APP_CONFIG.defaults.expandedFine;
const defaultExpandedHyperfine = APP_CONFIG.defaults.expandedHyperfine;
const defaultZoomState = APP_CONFIG.defaults.zoom;
const columnOrder = APP_CONFIG.layout.columnOrder;
const layoutConfig = APP_CONFIG.layout;

svg.attr("viewBox", `0 0 ${width} ${height}`);

const scene = svg.append("g");
const layers = {
  guides: scene.append("g"),
  transitions: scene.append("g"),
  measurements: scene.append("g"),
  connectors: scene.append("g"),
  fine: scene.append("g"),
  hyperfine: scene.append("g"),
  zeeman: scene.append("g"),
};

let expandedFine = new Set(defaultExpandedFine);
let expandedHyperfine = new Set(defaultExpandedHyperfine);
let currentZoomTransform = d3.zoomIdentity.translate(defaultZoomState.x, defaultZoomState.y).scale(defaultZoomState.k);
let currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
const defaultHyperfineScale = 1;
const defaultBFieldVisualScale = 1;
const defaultBFieldGauss = 1;
const defaultBFieldGaussMin = 0;
const defaultBFieldGaussMax = 10;
const defaultBFieldEnabled = true;
const defaultReferencesVisible = false;
const defaultMeasureToolEnabled = false;
const defaultHideToolEnabled = false;
const bFieldVisualScaleSliderRange = { min: 0.1, max: 10 };
const hyperfineScaleSliderRange = { min: 0.01, max: 100 };
const MU_B_OVER_H_MHZ_PER_GAUSS = 1.3996246;
const ZEEMAN_VISUAL_MHZ_TO_PX = 14 / 3;
const ELECTRON_SPIN = 0.5;
const ORBITAL_L_BY_LETTER = {
  S: 0,
  P: 1,
  D: 2,
  F: 3,
  G: 4,
  H: 5,
};
let currentHyperfineScaleByFineState = {};
let currentTransitionLabelFieldsById = {};
let currentTransitionLabelPrecisionById = {};
let currentBFieldEnabled = defaultBFieldEnabled;
let currentBFieldVisualScale = defaultBFieldVisualScale;
let currentBFieldGauss = defaultBFieldGauss;
let currentBFieldGaussMin = defaultBFieldGaussMin;
let currentBFieldGaussMax = defaultBFieldGaussMax;
let currentReferencesVisible = defaultReferencesVisible;
let currentMeasureToolEnabled = defaultMeasureToolEnabled;
let currentHideToolEnabled = defaultHideToolEnabled;
let currentMeasureSelection = [];
let currentMeasurements = [];
let hiddenStateKeys = new Set();
let hiddenTransitionIds = new Set();
const EXPAND_COLLAPSE_ANIMATION_MS = 260;
const CONTROL_ANIMATION_MS = 180;
const labelMeasureCanvas = document.createElement("canvas");
const labelMeasureContext = labelMeasureCanvas.getContext("2d");
let currentLayout = null;
let pinnedPanels = [];
let nextPinnedPanelId = 1;
let activePanelDrag = null;
let pinnedPanelResizePersistTimer = null;
let currentDiagramIssues = [];
let dismissedDiagramIssueKeys = new Set();
let undoHistory = [];
let redoHistory = [];
let currentHistorySnapshot = "";
const MAX_HISTORY_ENTRIES = 100;

function createMeasureSelectionKey(selection) {
  return selection && selection.type && selection.id
    ? `${selection.type}:${selection.id}`
    : "";
}

function normalizeMeasureSelection(selection) {
  if (!selection || typeof selection !== "object" || !selection.type || !selection.id) {
    return null;
  }

  return {
    type: String(selection.type),
    id: String(selection.id).trim(),
  };
}

function areMeasureSelectionsEqual(leftSelection, rightSelection) {
  return createMeasureSelectionKey(leftSelection) === createMeasureSelectionKey(rightSelection);
}

function createMeasurePairId(leftSelection, rightSelection) {
  return [leftSelection, rightSelection]
    .map(normalizeMeasureSelection)
    .filter(Boolean)
    .map(createMeasureSelectionKey)
    .sort((left, right) => left.localeCompare(right))
    .join(" <-> ");
}

function inferMeasurementSelectionType(selectionId) {
  const normalizedId = String(selectionId || "").trim();

  if (!normalizedId) {
    return "";
  }

  if (/\[\s*F=.*?,\s*mF=/.test(normalizedId)) {
    return "zeeman";
  }

  if (/\[\s*F=/.test(normalizedId)) {
    return "hyperfine";
  }

  return "fine";
}

function normalizeMeasurementBetweenEntry(stateIds) {
  if (!Array.isArray(stateIds)) {
    return [];
  }

  return stateIds
    .map((stateId) => {
      const normalizedId = String(stateId || "").trim();

      if (!normalizedId) {
        return null;
      }

      return normalizeMeasureSelection({
        type: inferMeasurementSelectionType(normalizedId),
        id: normalizedId,
      });
    })
    .filter(Boolean);
}

const MEASUREMENT_SECTION_FIELD_KEY_PATTERN = /^(?:total|fine|hyperfine|zeeman):(?:frequency|wavelength)$/;
const MEASUREMENT_NOTE_FIELD_KEY_PATTERN = /^note:\d+$/;

function isSupportedMeasurementLabelFieldKey(fieldKey) {
  const normalizedFieldKey = String(fieldKey || "").trim().toLowerCase();
  return MEASUREMENT_SECTION_FIELD_KEY_PATTERN.test(normalizedFieldKey)
    || normalizedFieldKey === "notes"
    || MEASUREMENT_NOTE_FIELD_KEY_PATTERN.test(normalizedFieldKey);
}

function normalizeMeasurementLabelFieldList(fields, fallback = []) {
  if (Array.isArray(fields)) {
    return fields
      .map((field) => String(field || "").trim().toLowerCase())
      .filter((field) => isSupportedMeasurementLabelFieldKey(field));
  }

  return Array.isArray(fallback) ? [...fallback] : [];
}

const MEASUREMENT_FREQUENCY_UNITS = ["mHz", "Hz", "kHz", "MHz", "GHz", "THz", "PHz"];

function normalizeMeasurementFrequencyUnit(unitLabel) {
  const normalizedUnit = String(unitLabel || "").trim();
  return MEASUREMENT_FREQUENCY_UNITS.includes(normalizedUnit)
    ? normalizedUnit
    : "THz";
}

function normalizeMeasurementPrecisionEntry(precision) {
  const normalized = {};
  const source = precision && typeof precision === "object" ? precision : {};

  Object.entries(source).forEach(([key, value]) => {
    const normalizedKey = String(key || "").trim().toLowerCase();

    if (!MEASUREMENT_SECTION_FIELD_KEY_PATTERN.test(normalizedKey)) {
      return;
    }

    normalized[normalizedKey] = Number.isFinite(value)
      ? clamp(Math.round(value), 0, 12)
      : null;
  });

  return normalized;
}

function normalizeMeasurementEntry(entry) {
  const selections = normalizeMeasurementBetweenEntry(entry?.between);

  if (selections.length !== 2) {
    return null;
  }

  const orderedSelections = [...selections].sort((left, right) => createMeasureSelectionKey(left).localeCompare(createMeasureSelectionKey(right)));
  return {
    id: createMeasurePairId(orderedSelections[0], orderedSelections[1]),
    between: orderedSelections.map((selection) => selection.id),
    labelFields: normalizeMeasurementLabelFieldList(entry?.show ?? entry?.labelFields, []),
    precision: normalizeMeasurementPrecisionEntry(entry?.precision),
    notes: Array.isArray(entry?.notes)
      ? entry.notes.map((note) => String(note ?? "")).filter((note) => note.trim() || note === "")
      : [],
  };
}

function normalizeHiddenStateEntry(entry) {
  if (typeof entry === "string") {
    const match = entry.match(/^([^:]+):(.+)$/);

    if (!match) {
      return null;
    }

    return normalizeMeasureSelection({
      type: match[1],
      id: match[2],
    });
  }

  return normalizeMeasureSelection(entry);
}

function createHiddenStateKey(entry) {
  return createMeasureSelectionKey(entry);
}

function normalizeHiddenTransitionId(value) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === "object") {
    if (Array.isArray(value.between)) {
      return createTransitionPairId(value.between);
    }
  }

  return "";
}

function serializeHiddenTransitionEntry(transitionId) {
  const between = splitTransitionPairId(transitionId);

  if (between.length === 2) {
    return {
      between,
    };
  }

  return null;
}

function serializePinnedPanelEntry(panel) {
  if (!panel || typeof panel !== "object") {
    return panel;
  }

  if (panel.type === "transition") {
    return {
      panelId: panel.panelId,
      type: panel.type,
      between: splitTransitionPairId(panel.id),
      sceneX: panel.sceneX,
      sceneY: panel.sceneY,
      widthScreen: panel.widthScreen,
      heightScreen: panel.heightScreen,
      showTransitionLabelSelectors: Boolean(panel.showTransitionLabelSelectors),
    };
  }

  if (panel.type === "measurement") {
    const measurementEntry = currentMeasurements.find((entry) => normalizeMeasurementEntry(entry)?.id === panel.id) || panel;
    const between = serializeMeasurementEntry(measurementEntry)?.between || [];
    return {
      panelId: panel.panelId,
      type: panel.type,
      between,
      sceneX: panel.sceneX,
      sceneY: panel.sceneY,
      widthScreen: panel.widthScreen,
      heightScreen: panel.heightScreen,
      showMeasurementLabelSelectors: Boolean(panel.showMeasurementLabelSelectors),
      editMeasurementNotes: Boolean(panel.editMeasurementNotes),
    };
  }

  return panel;
}

function normalizeTransitionPanelId(panel) {
  if (!panel || panel.type !== "transition") {
    return panel?.id || "";
  }

  if (Array.isArray(panel.between)) {
    return createTransitionPairId(panel.between);
  }

  return String(panel.id || "").trim();
}

function normalizeMeasurementPanelId(panel) {
  if (!panel || panel.type !== "measurement") {
    return panel?.id || "";
  }

  if (Array.isArray(panel.between)) {
    return normalizeMeasurementEntry({ between: panel.between })?.id || "";
  }

  return String(panel.id || "").trim();
}

function serializeMeasurementEntry(measurement) {
  const normalized = normalizeMeasurementEntry(measurement);

  if (!normalized) {
    return null;
  }

  return {
    between: [...normalized.between],
    show: Array.isArray(normalized.labelFields) ? [...normalized.labelFields] : [],
    precision: {
      ...normalized.precision,
    },
    notes: Array.isArray(normalized.notes) ? [...normalized.notes] : [],
  };
}

function serializeTransitionControlEntries() {
  const transitionIds = new Set([
    ...Object.keys(currentTransitionLabelFieldsById || {}),
    ...Object.keys(currentTransitionLabelPrecisionById || {}),
  ]);

  return [...transitionIds]
    .map((transitionId) => {
      const between = splitTransitionPairId(transitionId);

      if (between.length !== 2) {
        return null;
      }

      const precision = currentTransitionLabelPrecisionById?.[transitionId] || {};
      return {
        between,
        show: Array.isArray(currentTransitionLabelFieldsById?.[transitionId])
          ? [...currentTransitionLabelFieldsById[transitionId]]
          : [],
        precision: {
          wavelength: Number.isFinite(precision.wavelength) ? precision.wavelength : null,
          frequency: Number.isFinite(precision.frequency) ? precision.frequency : null,
        },
      };
    })
    .filter(Boolean);
}

function normalizeTransitionControlEntries(value) {
  const normalizedFieldsById = {};
  const normalizedPrecisionById = {};

  if (!Array.isArray(value)) {
    return {
      fieldsById: normalizedFieldsById,
      precisionById: normalizedPrecisionById,
    };
  }

  value.forEach((entry) => {
    if (!entry || typeof entry !== "object" || !Array.isArray(entry.between)) {
      return;
    }

    const transitionId = createTransitionPairId(entry.between);

    if (!transitionId) {
      return;
    }

    normalizedFieldsById[transitionId] = Array.isArray(entry.show)
      ? entry.show.map((field) => String(field || "").trim()).filter(Boolean)
      : [];

    const precision = entry.precision && typeof entry.precision === "object" ? entry.precision : {};
    normalizedPrecisionById[transitionId] = {
      wavelength: Number.isFinite(precision.wavelength) ? clamp(Math.round(precision.wavelength), 0, 12) : null,
      frequency: Number.isFinite(precision.frequency) ? clamp(Math.round(precision.frequency), 0, 12) : null,
    };
  });

  return {
    fieldsById: normalizedFieldsById,
    precisionById: normalizedPrecisionById,
  };
}

function measureTextWidth(text, sizePx) {
  if (!labelMeasureContext) {
    return text.length * sizePx * 0.58;
  }

  labelMeasureContext.font = `${sizePx}px Georgia`;
  return labelMeasureContext.measureText(text).width;
}

function measureSpectroscopicLabelWidth(label) {
  const match = label.match(/^(\d+)([A-Z])(.+)$/);
  const baseSize = 20;

  if (!match) {
    return measureTextWidth(label, baseSize);
  }

  const [, principal, termLetter, jLabel] = match;

  return measureTextWidth(principal, baseSize)
    + measureTextWidth("2", baseSize * 0.68)
    + measureTextWidth(termLetter, baseSize)
    + measureTextWidth(jLabel, baseSize * 0.68);
}

function getFineStateDisplayWidth(state) {
  return measureSpectroscopicLabelWidth(state.labelPlain || state.id);
}

function formatSpeciesNotation(species) {
  const symbol = species.species || species.symbol || "";
  const massNumber = species.atomic_mass_number;
  const ionizationNumber = species.ionization_number ?? 0;
  let chargeSuffix = "";

  if (ionizationNumber === 1) {
    chargeSuffix = `<sup>+</sup>`;
  } else if (ionizationNumber >= 2) {
    chargeSuffix = `<sup>${ionizationNumber}+</sup>`;
  }

  return `${massNumber ? `<sup>${massNumber}</sup>` : ""}${symbol}${chargeSuffix}`;
}

function formatSpeciesSummary(species) {
  if (Number.isFinite(species.nuclearSpin)) {
    return `Nuclear spin I = ${formatQuantumNumber(species.nuclearSpin)}`;
  }

  return "";
}

function setDashboardTextContent(element, text) {
  if (!element) {
    return;
  }

  if (typeof setMixedTextContent === "function") {
    setMixedTextContent(element, text);
    return;
  }

  if (typeof text !== "string") {
    element.textContent = text == null ? "" : String(text);
    return;
  }

  const normalizedText = text.replace(/\\cite\{[^}]+\}/g, "").trim();

  if (normalizedText.includes("$") && window.katex) {
    const escapeHtml = (value) => value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    const parts = [];
    const pattern = /\$([^$]+)\$/g;
    let lastIndex = 0;
    let match = pattern.exec(normalizedText);

    while (match) {
      if (match.index > lastIndex) {
        parts.push(escapeHtml(normalizedText.slice(lastIndex, match.index)));
      }

      parts.push(window.katex.renderToString(match[0], {
        throwOnError: false,
        displayMode: false,
      }));

      lastIndex = match.index + match[0].length;
      match = pattern.exec(normalizedText);
    }

    if (lastIndex < normalizedText.length) {
      parts.push(escapeHtml(normalizedText.slice(lastIndex)));
    }

    element.innerHTML = parts.join("");
    return;
  }

  element.textContent = normalizedText;
}

function renderSpeciesProperties(species) {
  if (!speciesProperties) {
    return;
  }

  speciesProperties.innerHTML = "";
  const propertyItems = Array.isArray(species.notes)
    ? species.notes.filter((item) => typeof item === "string" && item.trim())
    : [];

  propertyItems.forEach((item) => {
    const li = document.createElement("li");
    setDashboardTextContent(li, item);
    speciesProperties.append(li);
  });

  speciesProperties.hidden = propertyItems.length === 0;
}

function closeDiagramPicker() {
  if (!diagramPicker || diagramPicker.hidden) {
    return;
  }

  diagramPicker.hidden = true;
  chooseDiagramToggleButton?.setAttribute("aria-expanded", "false");
}

function openDiagramPicker() {
  if (!diagramPicker || !diagramPicker.hidden) {
    return;
  }

  diagramPicker.hidden = false;
  chooseDiagramToggleButton?.setAttribute("aria-expanded", "true");
  if (typeof positionDiagramPickerPanel === "function") {
    requestAnimationFrame(positionDiagramPickerPanel);
  }
}

function getHostedDiagramPickerUiState() {
  if (!browserDiagramSourceInfo.hostedCatalogAvailable) {
    return {
      hint: "This page did not provide a built-in diagram catalog.",
      path: "",
      emptyText: "No built-in diagrams are available from this site.",
    };
  }

  return {
    hint: browserDiagramSourceInfo.activeSource === "hosted"
      ? "Currently using the built-in diagrams bundled with this site."
      : "Built-in diagrams from this site are available here.",
    path: `Bundled catalog: ${browserDiagramSourceInfo.hostedManifestPath}`,
    emptyText: "No readable bundled .yaml diagrams were found on this site.",
  };
}

function getLocalDiagramPickerUiState() {
  const folderName = browserDiagramSourceInfo.folderName || diagramsFolderHandle?.name || "";
  const expectedFolderPath = shouldShowSuggestedLocalFolderPath()
    ? inferExpectedBrowserDiagramsFolderPath()
    : "";
  const usesExpectedFolderName = folderName.toLowerCase() === BROWSER_DIAGRAMS_FOLDER_NAME;

  if (browserDiagramSourceInfo.activeSource === "folder") {
    return {
      hint: usesExpectedFolderName
        ? `Using "${folderName}" for local diagram YAML files.`
        : `Using "${folderName}" for local diagram YAML files.`,
      path: expectedFolderPath ? `Suggested local folder: ${expectedFolderPath}` : "",
      emptyText: `No readable .yaml diagrams were found in "${folderName}".`,
    };
  }

  if (!browserDiagramSourceInfo.supported) {
    return {
      hint: "This browser cannot access local folders directly.",
      path: "",
      emptyText: "Local folders are unavailable in this browser.",
    };
  }

  if (!browserDiagramSourceInfo.hasStoredHandle) {
    return {
      hint: `Pick the "${BROWSER_DIAGRAMS_FOLDER_NAME}" folder on your computer to browse local diagram YAML files in this browser.`,
      path: expectedFolderPath ? `Suggested local folder: ${expectedFolderPath}` : "",
      emptyText: "Choose a local folder to list local diagrams here.",
    };
  }

  if (!browserDiagramSourceInfo.permissionGranted) {
    return {
      hint: `This browser no longer has access to the previously chosen folder${folderName ? ` "${folderName}"` : ""}. Pick the "${BROWSER_DIAGRAMS_FOLDER_NAME}" folder again.`,
      path: expectedFolderPath ? `Suggested local folder: ${expectedFolderPath}` : "",
      emptyText: "Reconnect the local folder to browse its diagrams.",
    };
  }

  if (diagramCatalog.folderEntries.length === 0) {
    return {
      hint: usesExpectedFolderName
        ? `No readable .yaml diagrams were found in "${folderName}". Add diagram YAML files there or choose another folder.`
        : `You selected "${folderName}". The usual folder for this app is "${BROWSER_DIAGRAMS_FOLDER_NAME}". If this is the wrong folder, choose it again.`,
      path: expectedFolderPath ? `Suggested local folder: ${expectedFolderPath}` : "",
      emptyText: `No readable .yaml diagrams were found in "${folderName}".`,
    };
  }

  return {
    hint: browserDiagramSourceInfo.activeSource === "folder"
      ? (usesExpectedFolderName
        ? `Using "${folderName}" for diagram YAML files.`
        : `Using "${folderName}" for local diagram YAML files.`)
      : `Local diagrams from "${folderName}" are available here.`,
    path: expectedFolderPath ? `Suggested local folder: ${expectedFolderPath}` : "",
    emptyText: `No readable .yaml diagrams were found in "${folderName}".`,
  };
}

function syncDiagramSourceUi() {
  return;
}

function shouldPromptForDiagramsFolderFromPrimaryButton() {
  return false;
}

function buildHostedDiagramSourceUrl(fileName) {
  try {
    const manifestUrl = new URL(HOSTED_DIAGRAM_MANIFEST_PATH, window.location.href);
    return new URL(fileName, manifestUrl).toString();
  } catch {
    return "";
  }
}

function openDiagramSourceInNewTab(entry, source) {
  if (!entry || typeof entry.fileName !== "string") {
    return;
  }

  if (source === "hosted") {
    const hostedUrl = buildHostedDiagramSourceUrl(entry.fileName);

    if (hostedUrl) {
      window.open(hostedUrl, "_blank", "noopener,noreferrer");
      return;
    }
  }

  if (typeof entry.text !== "string") {
    return;
  }

  const previewUrl = URL.createObjectURL(new Blob([entry.text], { type: "text/yaml;charset=utf-8" }));
  window.open(previewUrl, "_blank", "noopener,noreferrer");
}

function renderDiagramPickerList(listElement, entries, { source, emptyText }) {
  if (!listElement) {
    return;
  }

  listElement.innerHTML = "";
  if (!entries.length) {
    const li = document.createElement("li");
    li.className = "diagram-picker-empty";
    li.textContent = emptyText;
    listElement.append(li);
    return;
  }

  entries.forEach((entry) => {
    const li = document.createElement("li");
    const card = document.createElement("div");
    const button = document.createElement("button");
    const title = document.createElement("span");
    const fileLink = document.createElement("a");

    li.className = "diagram-picker-item";
    card.className = "diagram-picker-card";
    button.type = "button";
    button.className = "diagram-picker-select";
    card.classList.toggle("is-active", browserDiagramSourceInfo.activeSource === source && entry.fileName === selectedDiagramPath);
    title.className = "diagram-picker-title";
    fileLink.className = "diagram-picker-file";
    fileLink.href = "#";
    fileLink.target = "_blank";
    fileLink.rel = "noopener noreferrer";
    setDashboardTextContent(title, entry.title);
    fileLink.textContent = entry.fileName;
    button.append(title);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      activateDiagramSelection(source, entry.fileName);
    });
    fileLink.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openDiagramSourceInNewTab(entry, source);
    });
    card.append(button, fileLink);
    li.append(card);
    listElement.append(li);
  });
}

function renderDiagramPicker() {
  if (!diagramPicker) {
    return;
  }

  syncDiagramSourceUi();

  const hostedState = getHostedDiagramPickerUiState();
  const localState = getLocalDiagramPickerUiState();

  if (diagramPickerWebHint) {
    diagramPickerWebHint.textContent = hostedState.hint;
  }

  if (diagramPickerWebPath) {
    diagramPickerWebPath.textContent = hostedState.path || "";
    diagramPickerWebPath.hidden = !hostedState.path;
  }

  if (diagramPickerLocalHint) {
    diagramPickerLocalHint.textContent = localState.hint;
  }

  if (diagramPickerLocalPath) {
    diagramPickerLocalPath.textContent = localState.path || "";
    diagramPickerLocalPath.hidden = !localState.path;
  }

  if (diagramPickerLocalPickButton) {
    diagramPickerLocalPickButton.disabled = !browserDiagramSourceInfo.supported;
  }

  if (diagramPickerLocalBody) {
    diagramPickerLocalBody.hidden = false;
  }

  renderDiagramPickerList(diagramPickerWebList, diagramCatalog.hostedEntries || [], {
    source: "hosted",
    emptyText: hostedState.emptyText,
  });
  renderDiagramPickerList(diagramPickerLocalList, diagramCatalog.folderEntries || [], {
    source: "folder",
    emptyText: localState.emptyText,
  });

  if (!diagramPicker.hidden && typeof positionDiagramPickerPanel === "function") {
    requestAnimationFrame(positionDiagramPickerPanel);
  }
}

function syncDiagramUiAvailability() {
  const diagramButtons = [undoActionButton, redoActionButton, referencesToggleButton, measureToggleButton, hideToggleButton, editConfigButton, resetConfigButton, resetViewButton];

  diagramButtons.forEach((button) => {
    if (button) {
      button.disabled = !hasInteractiveDiagram;
    }
  });

  if (controlStack) {
    controlStack.hidden = !hasInteractiveDiagram;
  }

  if (typeof updateHistoryButtons === "function") {
    updateHistoryButtons();
  }
}

function renderHomePanel() {
  heroKicker.textContent = APP_CONFIG.ui.appTitle;
  if (appVersionLabel) {
    appVersionLabel.textContent = APP_CONFIG.ui.appVersion || "";
    appVersionLabel.hidden = !APP_CONFIG.ui.appVersion;
  }
  syncDiagramSourceUi();

  if (!hasLoadedDiagramSource) {
    speciesNotation.textContent = "Choose Diagram";
    speciesName.hidden = false;
    speciesName.textContent = diagramCatalog.entries.length > 0
      ? "Pick a diagram from the project list."
      : (browserDiagramSourceInfo.hostedCatalogAvailable
        ? `No readable built-in diagrams were found for this site. Choose a local "${BROWSER_DIAGRAMS_FOLDER_NAME}" folder to continue.`
        : `Pick the "${BROWSER_DIAGRAMS_FOLDER_NAME}" folder inside this app folder to begin.`);
    renderSpeciesProperties({ notes: [] });
    syncDiagramUiAvailability();
    renderDiagramPicker();
    return;
  }

  const summary = formatSpeciesSummary(config.species);
  speciesNotation.innerHTML = formatSpeciesNotation(config.species);
  speciesName.hidden = !summary;
  setDashboardTextContent(speciesName, summary);
  renderSpeciesProperties(config.species);
  syncDiagramUiAvailability();
  renderDiagramPicker();
}

async function bootstrapConfig() {
  diagramCatalog = await loadDiagramCatalog();
  diagramsFolderHandle = diagramCatalog.folderHandle;
  browserDiagramSourceInfo = diagramCatalog.browserSourceInfo || createBrowserDiagramSourceInfo();
  ({ config, hasLoadedDiagramSource, selectedDiagramPath } = loadInitialConfig(diagramCatalog));
  hasInteractiveDiagram = config.states.length > 0;

  if (selectedDiagramPath) {
    storeSelectedDiagramPath(selectedDiagramPath);
  }

  storageKey = `${APP_CONFIG.storage.stateKeyPrefix}${config.meta.id}-v${APP_CONFIG.storage.stateVersion}`;
  syncDocumentTitle();
  renderHomePanel();
}

const appBootstrapPromise = bootstrapConfig();
