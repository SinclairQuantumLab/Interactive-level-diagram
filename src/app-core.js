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
const collapseConfigButton = document.getElementById("collapse-config");
const expandConfigButton = document.getElementById("expand-config");
const resetViewButton = document.getElementById("reset-view");
const undoActionButton = document.getElementById("undo-action");
const redoActionButton = document.getElementById("redo-action");
const themeToggleButton = document.getElementById("theme-toggle");
const chooseDiagramToggleButton = document.getElementById("choose-diagram-toggle");
const referencesToggleButton = document.getElementById("references-toggle");
const measureToggleButton = document.getElementById("measure-toggle");
const hideToggleButton = document.getElementById("hide-toggle");
const moveToggleButton = document.getElementById("move-toggle");
const layoutEditorModal = document.getElementById("layout-editor-modal");
const layoutEditorHighlight = document.getElementById("layout-editor-highlight");
const layoutEditorText = document.getElementById("layout-editor-text");
const layoutEditorCloseButton = document.getElementById("layout-editor-close");
const layoutEditorCopyButton = document.getElementById("layout-editor-copy");
const layoutEditorApplyButton = document.getElementById("layout-editor-apply");
const diagramPicker = document.getElementById("diagram-picker");
const diagramPickerCloseButton = document.getElementById("diagram-picker-close");
const diagramPickerSharedList = document.getElementById("diagram-picker-shared-list");
const diagramPickerSharedHint = document.getElementById("diagram-picker-shared-hint");
const diagramPickerSharedPath = document.getElementById("diagram-picker-shared-path");
const sharedAuthPanel = document.getElementById("shared-auth-panel");
const sharedAuthSignedOut = document.getElementById("shared-auth-signed-out");
const sharedAuthSignedIn = document.getElementById("shared-auth-signed-in");
const sharedAuthEmailInput = document.getElementById("shared-auth-email");
const sharedAuthCodeInput = document.getElementById("shared-auth-code");
const sharedAuthSendLinkButton = document.getElementById("shared-auth-send-link");
const sharedAuthVerifyCodeButton = document.getElementById("shared-auth-verify-code");
const sharedAuthSignOutButton = document.getElementById("shared-auth-sign-out");
const sharedAuthUser = document.getElementById("shared-auth-user");
const sharedDiagramNewButton = document.getElementById("shared-diagram-new");
const sharedMyDiagrams = document.getElementById("shared-my-diagrams");
const diagramPickerMyList = document.getElementById("diagram-picker-my-list");
const diagramPickerLocalPickButton = document.getElementById("diagram-picker-local-pick");
const diagramPickerLocalList = document.getElementById("diagram-picker-local-list");
const diagramPickerLocalHint = document.getElementById("diagram-picker-local-hint");
const diagramPickerLocalPath = document.getElementById("diagram-picker-local-path");
const diagramPickerLayoutDefaultButton = document.getElementById("diagram-picker-layout-default");
const diagramPickerLayoutSavedButton = document.getElementById("diagram-picker-layout-saved");
const diagramPickerLayoutCollapsedButton = document.getElementById("diagram-picker-layout-collapsed");
const diagramPickerLayoutExpandedButton = document.getElementById("diagram-picker-layout-expanded");
const diagramPickerSearchInput = document.getElementById("diagram-picker-search");
const diagramPickerSortSelect = document.getElementById("diagram-picker-sort");
const sharedDiagramEditorModal = document.getElementById("shared-diagram-editor-modal");
const sharedDiagramEditorTitle = document.getElementById("shared-diagram-editor-title");
const sharedDiagramEditorCopy = document.getElementById("shared-diagram-editor-copy");
const sharedDiagramEditorCloseButton = document.getElementById("shared-diagram-editor-close");
const sharedDiagramSaveButton = document.getElementById("shared-diagram-save");
const sharedDiagramDeleteButton = document.getElementById("shared-diagram-delete");
const sharedDiagramEditorFields = document.getElementById("shared-diagram-editor-fields");
const sharedDiagramFileNameInput = document.getElementById("shared-diagram-file-name");
const sharedDiagramFileField = document.getElementById("shared-diagram-file-field");
const sharedDiagramFileInput = document.getElementById("shared-diagram-file-input");
const sharedDiagramYamlMeta = document.getElementById("shared-diagram-yaml-meta");
const sharedDiagramYamlHighlight = document.getElementById("shared-diagram-yaml-highlight");
const sharedDiagramYamlText = document.getElementById("shared-diagram-yaml");
const sharedDiagramYamlTitle = document.getElementById("shared-diagram-yaml-title");
const sharedDiagramYamlDescription = document.getElementById("shared-diagram-yaml-description");
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
    appVersion: "",
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
    sharedSessionTokenKey: "level-diagram-shared-session",
    sharedEmailKey: "level-diagram-shared-email",
  },
  sharedApiBaseUrl: "",
  shared: {
    apiBaseUrl: "",
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
const DEFAULT_HOME_DIAGRAM_FILE = "Rb87.yaml";

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
    sharedApiAvailable: false,
    sharedApiBaseUrl: "",
    activeSource: "none",
    ...overrides,
  };
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
    "bibliography",
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

function getSharedApiBaseUrl() {
  const rawBaseUrl = String(
    APP_CONFIG.sharedApiBaseUrl
      || APP_CONFIG.shared?.apiBaseUrl
      || "",
  ).trim();

  if (!rawBaseUrl || typeof window.fetch !== "function") {
    return "";
  }

  try {
    return new URL(rawBaseUrl, window.location.href).toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function isSharedDiagramApiConfigured() {
  return Boolean(getSharedApiBaseUrl());
}

function getSharedStorageKey(name, fallback) {
  return String(APP_CONFIG.storage?.[name] || fallback);
}

function readStoredSharedSessionToken() {
  try {
    return window.localStorage.getItem(getSharedStorageKey("sharedSessionTokenKey", "level-diagram-shared-session")) || null;
  } catch {
    return null;
  }
}

function storeSharedSessionToken(token) {
  sharedDiagramSessionToken = token || null;

  try {
    if (sharedDiagramSessionToken) {
      window.localStorage.setItem(getSharedStorageKey("sharedSessionTokenKey", "level-diagram-shared-session"), sharedDiagramSessionToken);
    } else {
      window.localStorage.removeItem(getSharedStorageKey("sharedSessionTokenKey", "level-diagram-shared-session"));
    }
  } catch {
    return;
  }
}

function readStoredSharedEmail() {
  try {
    return window.localStorage.getItem(getSharedStorageKey("sharedEmailKey", "level-diagram-shared-email")) || "";
  } catch {
    return "";
  }
}

function storeSharedEmail(email) {
  const normalizedEmail = String(email || "").trim();

  try {
    if (normalizedEmail) {
      window.localStorage.setItem(getSharedStorageKey("sharedEmailKey", "level-diagram-shared-email"), normalizedEmail);
    }
  } catch {
    return;
  }
}

function clearSharedSession() {
  sharedDiagramUser = null;
  storeSharedSessionToken(null);
}

function buildSharedApiUrl(endpoint) {
  const baseUrl = getSharedApiBaseUrl();

  if (!baseUrl) {
    throw new Error("Shared diagram API is not configured.");
  }

  const normalizedEndpoint = String(endpoint || "").startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
}

async function sharedApiFetch(endpoint, {
  method = "GET",
  body = null,
  auth = false,
} = {}) {
  const headers = {};

  if (body !== null) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    if (!sharedDiagramSessionToken) {
      throw new Error("Sign in to manage shared diagrams.");
    }

    headers.Authorization = `Bearer ${sharedDiagramSessionToken}`;
  }

  const response = await window.fetch(buildSharedApiUrl(endpoint), {
    method,
    headers,
    body: body === null ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    const error = new Error(payload?.error || `Shared API request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

function makeSharedAuthReturnUrl() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("authToken");
    return url.toString();
  } catch {
    return window.location.href;
  }
}

function clearSharedAuthTokenFromUrl() {
  try {
    const url = new URL(window.location.href);

    if (!url.searchParams.has("authToken")) {
      return;
    }

    url.searchParams.delete("authToken");
    window.history?.replaceState?.(null, "", url.toString());
  } catch {
    return;
  }
}

async function consumeSharedAuthTokenFromUrl() {
  const authToken = String(readUrlQueryParam("authToken", { preservePlus: true }) || "").trim();

  if (!authToken || !isSharedDiagramApiConfigured()) {
    return;
  }

  try {
    const result = await sharedApiFetch(`/api/auth/verify?token=${encodeURIComponent(authToken)}`);
    storeSharedSessionToken(result.token);
    sharedDiagramUser = result.user || null;
    clearSharedAuthTokenFromUrl();

    if (typeof setStatus === "function") {
      setStatus("Signed in to shared diagrams.");
    }
  } catch (error) {
    clearSharedAuthTokenFromUrl();
    if (typeof setStatus === "function") {
      setStatus(error.message || "Shared diagram sign-in failed.");
    }
  }
}

function normalizeSharedDiagramApiRecord(diagram, sourceIndex = 0, { owner = false } = {}) {
  const yamlText = String(diagram?.yamlText || diagram?.yaml || "");
  const sharedId = String(diagram?.id || "").trim();
  const sourceKey = isDiagramConfigFileName(sharedId) ? sharedId : `${sharedId || `shared-${sourceIndex}`}.yaml`;
  const displayFileName = String(diagram?.fileName || sourceKey).trim() || sourceKey;
  const updatedAtMs = Date.parse(diagram?.updatedAt || diagram?.createdAt || "");
  const entry = buildDiagramCatalogEntry(sourceKey, yamlText, {
    lastModifiedMs: Number.isFinite(updatedAtMs) ? updatedAtMs : null,
    sourceIndex,
  });

  return {
    ...entry,
    title: String(diagram?.title || entry.title || displayFileName),
    description: String(diagram?.description || entry.description || ""),
    sharedId,
    displayFileName,
    ownerUserId: diagram?.ownerUserId || "",
    isOwner: Boolean(owner || diagram?.isOwner),
    createdAt: diagram?.createdAt || "",
    updatedAt: diagram?.updatedAt || "",
  };
}

function mergeSharedDiagramEntries(publicEntries = [], myEntries = []) {
  const merged = [];
  const seen = new Set();

  [...myEntries, ...publicEntries].forEach((entry) => {
    const key = entry.sharedId || entry.fileName;

    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(entry);
  });

  return merged;
}

async function loadSharedCurrentUser() {
  if (!sharedDiagramSessionToken || !isSharedDiagramApiConfigured()) {
    sharedDiagramUser = null;
    return null;
  }

  try {
    const result = await sharedApiFetch("/api/me", { auth: true });
    sharedDiagramUser = result.user || null;
    return sharedDiagramUser;
  } catch {
    clearSharedSession();
    return null;
  }
}

async function loadSharedDiagramCatalog() {
  const apiBaseUrl = getSharedApiBaseUrl();

  if (!apiBaseUrl) {
    return {
      available: false,
      apiBaseUrl: "",
      entries: [],
      myEntries: [],
      error: "",
    };
  }

  try {
    await loadSharedCurrentUser();
    const publicResult = await sharedApiFetch("/api/diagrams");
    const publicEntries = (Array.isArray(publicResult.diagrams) ? publicResult.diagrams : [])
      .map((diagram, sourceIndex) => normalizeSharedDiagramApiRecord(diagram, sourceIndex));
    let myEntries = [];

    if (sharedDiagramSessionToken) {
      const myResult = await sharedApiFetch("/api/diagrams?mine=1", { auth: true });
      myEntries = (Array.isArray(myResult.diagrams) ? myResult.diagrams : [])
        .map((diagram, sourceIndex) => normalizeSharedDiagramApiRecord(diagram, sourceIndex, { owner: true }));
    }

    return {
      available: true,
      apiBaseUrl,
      entries: publicEntries,
      myEntries,
      error: "",
    };
  } catch (error) {
    return {
      available: false,
      apiBaseUrl,
      entries: [],
      myEntries: [],
      error: error.message || "Shared diagrams could not be loaded.",
    };
  }
}

async function refreshSharedDiagramCatalog({ announce = false } = {}) {
  const sharedCatalog = await loadSharedDiagramCatalog();
  const sharedEntries = mergeSharedDiagramEntries(sharedCatalog.entries, sharedCatalog.myEntries);

  diagramCatalog = {
    ...diagramCatalog,
    sharedEntries,
    mySharedEntries: sharedCatalog.myEntries,
    entries: browserDiagramSourceInfo.activeSource === "shared"
      ? sharedEntries
      : diagramCatalog.entries,
  };
  browserDiagramSourceInfo = createBrowserDiagramSourceInfo({
    ...browserDiagramSourceInfo,
    sharedApiAvailable: sharedCatalog.available,
    sharedApiBaseUrl: sharedCatalog.apiBaseUrl,
    sharedApiError: sharedCatalog.error,
  });
  renderDiagramPicker();

  if (announce && typeof setStatus === "function") {
    setStatus(sharedCatalog.available
      ? "Shared diagrams refreshed."
      : (sharedCatalog.error || "Shared diagrams are unavailable."));
  }

  return sharedCatalog;
}

async function requestSharedMagicLink() {
  if (!isSharedDiagramApiConfigured()) {
    setStatus("Shared diagram API is not configured for this copy yet.");
    return;
  }

  const email = String(sharedAuthEmailInput?.value || "").trim();

  if (!email) {
    setStatus("Enter an email address for the magic link.");
    sharedAuthEmailInput?.focus();
    return;
  }

  try {
    sharedAuthSendLinkButton.disabled = true;
    const result = await sharedApiFetch("/api/auth/magic-link", {
      method: "POST",
      body: {
        email,
        returnUrl: makeSharedAuthReturnUrl(),
      },
    });
    storeSharedEmail(email);
    setStatus(result.emailConfigured === false
      ? "Magic link was created, but the API email provider is not configured yet."
      : `Magic link sent to ${email}. Local fallback code is in the same email.`);
  } catch (error) {
    setStatus(error.message || "Could not send a shared diagram magic link.");
  } finally {
    sharedAuthSendLinkButton.disabled = false;
  }
}

async function verifySharedFallbackCode() {
  if (!isSharedDiagramApiConfigured()) {
    setStatus("Shared diagram API is not configured for this copy yet.");
    return;
  }

  const email = String(sharedAuthEmailInput?.value || "").trim();
  const code = String(sharedAuthCodeInput?.value || "").trim();

  if (!email || !code) {
    setStatus("Enter the email address and one-time code from the magic-link email.");
    return;
  }

  try {
    sharedAuthVerifyCodeButton.disabled = true;
    const result = await sharedApiFetch("/api/auth/code", {
      method: "POST",
      body: { email, code },
    });
    storeSharedEmail(email);
    storeSharedSessionToken(result.token);
    sharedDiagramUser = result.user || null;
    if (sharedAuthCodeInput) {
      sharedAuthCodeInput.value = "";
    }
    await refreshSharedDiagramCatalog();
    setStatus("Signed in to shared diagrams.");
  } catch (error) {
    setStatus(error.message || "The shared diagram login code could not be verified.");
  } finally {
    sharedAuthVerifyCodeButton.disabled = false;
  }
}

async function signOutSharedDiagrams() {
  clearSharedSession();
  await refreshSharedDiagramCatalog();
  setStatus("Signed out of shared diagrams.");
}

function validateSharedDiagramYamlText(text) {
  const normalizedText = String(text || "").trim();

  if (!normalizedText) {
    return "Paste diagram YAML before saving.";
  }

  try {
    const parsed = parseDiagramConfig(normalizedText);
    const bibliographyText = extractInlineBibliographyText(parsed);
    const normalized = normalizeConfig(parsed, bibliographyText ? parseBibtex(bibliographyText) : []);

    if (!Array.isArray(normalized.states) || normalized.states.length === 0) {
      return "Diagram YAML must define at least one state.";
    }
  } catch (error) {
    return error.message || "Diagram YAML could not be parsed.";
  }

  return "";
}

function getSharedDiagramMetadataFromYaml(text) {
  try {
    const parsed = parseDiagramConfig(text);
    return {
      title: String(parsed?.meta?.title || parsed?.meta?.id || "").trim(),
      description: String(parsed?.meta?.description || "").trim(),
    };
  } catch {
    return {
      title: "",
      description: "",
    };
  }
}

function syncSharedDiagramYamlMetadataPreview() {
  const yamlText = String(sharedDiagramYamlText?.value || "").trim();
  const metadata = getSharedDiagramMetadataFromYaml(yamlText);

  if (sharedDiagramYamlTitle) {
    setDashboardTextContent(sharedDiagramYamlTitle, metadata.title || "Not set in YAML meta.title");
  }
  if (sharedDiagramYamlDescription) {
    setDashboardTextContent(sharedDiagramYamlDescription, metadata.description || "Optional meta.description is not set");
  }
}

function getDashboardTooltipText(text) {
  return String(text || "")
    .replace(/\\cite\{[^}]+\}/g, "")
    .replace(/\$/g, "")
    .trim();
}

function getYamlTextForSaving(text) {
  return `${String(text || "").trimEnd()}\n`;
}

function normalizeDiagramTitleKey(titleText) {
  return String(titleText || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findDiagramEntryByTitle(entries, titleText) {
  const titleKey = normalizeDiagramTitleKey(titleText);

  if (!titleKey) {
    return null;
  }

  return (Array.isArray(entries) ? entries : [])
    .find((entry) => normalizeDiagramTitleKey(entry.title) === titleKey) || null;
}

function normalizeDiagramDownloadFileName(fileName) {
  const baseName = String(fileName || "diagram.yaml")
    .split(/[\\/]/)
    .pop()
    .trim()
    .replace(/[^A-Za-z0-9._+-]/g, "-") || "diagram.yaml";
  return /\.ya?ml$/i.test(baseName) ? baseName : `${baseName}.yaml`;
}

function formatLocalTimezoneOffset(date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
  const minutes = String(absoluteMinutes % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
}

function formatDetailedLocalTimestamp(timestampMs) {
  if (!Number.isFinite(timestampMs)) {
    return "Unknown local time";
  }

  const date = new Date(timestampMs);
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}${formatLocalTimezoneOffset(date)}`;
}

function formatRelativeTimestamp(timestampMs, nowMs = Date.now()) {
  if (!Number.isFinite(timestampMs)) {
    return "";
  }

  const elapsedSeconds = Math.max(0, Math.round((nowMs - timestampMs) / 1000));

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s ago`;
  }

  const elapsedMinutes = Math.round(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}min ago`;
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.round(elapsedHours / 24);
  if (elapsedDays < 30) {
    return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
  }

  const elapsedMonths = Math.round(elapsedDays / 30);
  if (elapsedMonths < 12) {
    return `${elapsedMonths}mo ago`;
  }

  const elapsedYears = Math.round(elapsedDays / 365);
  return `${elapsedYears}y ago`;
}

function setDiagramUpdatedElement(element, entry) {
  if (!element) {
    return;
  }

  const timestampMs = getDiagramEntryTimestampMs(entry);

  if (timestampMs === null) {
    element.textContent = "";
    element.title = "";
    element.hidden = true;
    return;
  }

  element.hidden = false;
  element.textContent = `Updated ${formatRelativeTimestamp(timestampMs)}`;
  element.title = formatDetailedLocalTimestamp(timestampMs);
}

function getDiagramEntryTimestampMs(entry) {
  if (Number.isFinite(entry?.lastModifiedMs)) {
    return entry.lastModifiedMs;
  }

  const parsedTimestamp = Date.parse(entry?.updatedAt || entry?.createdAt || "");
  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : null;
}

function formatOverwriteTimestamp(timestampMs) {
  return Number.isFinite(timestampMs)
    ? formatDetailedLocalTimestamp(timestampMs)
    : "Unknown local time";
}

function confirmDiagramOverwrite({
  title,
  targetLabel = "diagram",
  oldTimestampMs = null,
  newTimestampMs = null,
} = {}) {
  return window.confirm([
    `A ${targetLabel} titled "${title || "Untitled diagram"}" already exists.`,
    `Old version: ${formatOverwriteTimestamp(oldTimestampMs)}`,
    `New version: ${formatOverwriteTimestamp(newTimestampMs)}`,
    "",
    "Overwrite it?",
  ].join("\n"));
}

async function ensureDiagramsFolderWritePermission(folderHandle) {
  if (!folderHandle) {
    return false;
  }

  const options = { mode: "readwrite" };

  try {
    if (typeof folderHandle.queryPermission === "function") {
      const currentPermission = await folderHandle.queryPermission(options);
      if (currentPermission === "granted") {
        return true;
      }
    }

    if (typeof folderHandle.requestPermission === "function") {
      return await folderHandle.requestPermission(options) === "granted";
    }
  } catch {
    return false;
  }

  return true;
}

async function writeYamlTextToFileHandle(fileHandle, yamlText) {
  const writable = await fileHandle.createWritable();
  await writable.write(getYamlTextForSaving(yamlText));
  await writable.close();
}

async function refreshFolderDiagramCatalogFromHandle(folderHandle) {
  const folderEntries = await loadFolderDiagramCatalog(folderHandle);
  diagramCatalog = {
    ...diagramCatalog,
    folderHandle,
    folderEntries,
    entries: browserDiagramSourceInfo.activeSource === "folder" ? folderEntries : diagramCatalog.entries,
  };
  return folderEntries;
}

function downloadDiagramTextViaBrowser(entry) {
  const yamlText = getYamlTextForSaving(entry?.rawText || entry?.text || "");
  const fileName = normalizeDiagramDownloadFileName(entry?.displayFileName || entry?.fileName || `${entry?.title || "diagram"}.yaml`);
  const blob = new Blob([yamlText], { type: "text/yaml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function findOwnedSharedEntryByTitle(titleText, { excludeSharedId = "" } = {}) {
  const titleKey = normalizeDiagramTitleKey(titleText);

  if (!titleKey) {
    return null;
  }

  return (diagramCatalog.mySharedEntries || []).find((entry) => (
    normalizeDiagramTitleKey(entry.title) === titleKey
    && entry.sharedId !== excludeSharedId
  ))
    || null;
}

function getDiagramTitleForOverwrite(yamlText, fallbackTitle = "") {
  return getSharedDiagramMetadataFromYaml(yamlText).title || fallbackTitle || "Untitled diagram";
}

async function uploadLocalDiagramEntry(entry) {
  if (!sharedDiagramSessionToken) {
    setStatus("Sign in before uploading a local diagram.");
    sharedAuthEmailInput?.focus();
    return;
  }

  const yamlText = String(entry?.rawText || entry?.text || "").trim();
  const validationError = validateSharedDiagramYamlText(yamlText);

  if (validationError) {
    setStatus(validationError);
    return;
  }

  const uploadTitle = getDiagramTitleForOverwrite(yamlText, entry?.title);
  const existingSharedEntry = findOwnedSharedEntryByTitle(uploadTitle);

  if (
    existingSharedEntry
    && !confirmDiagramOverwrite({
      title: uploadTitle,
      targetLabel: "shared diagram",
      oldTimestampMs: getDiagramEntryTimestampMs(existingSharedEntry),
      newTimestampMs: getDiagramEntryTimestampMs(entry) ?? Date.now(),
    })
  ) {
    setStatus("Local diagram upload canceled.");
    return;
  }

  const payload = {
    fileName: normalizeDiagramDownloadFileName(entry?.displayFileName || entry?.fileName || `${uploadTitle}.yaml`),
    yamlText,
  };

  try {
    const result = await sharedApiFetch(existingSharedEntry
      ? `/api/diagrams/${encodeURIComponent(existingSharedEntry.sharedId)}`
      : "/api/diagrams", {
        method: existingSharedEntry ? "PUT" : "POST",
        auth: true,
        body: payload,
      });

    await refreshSharedDiagramCatalog();
    const savedEntry = mergeSharedDiagramEntries(diagramCatalog.sharedEntries, diagramCatalog.mySharedEntries)
      .find((candidate) => candidate.sharedId === result.diagram?.id);

    if (savedEntry) {
      activateDiagramSelection("shared", savedEntry.fileName, {
        layoutFlavor: diagramPickerLayoutFlavor,
        historyMode: "push",
      });
    }

    setStatus(existingSharedEntry ? "Shared diagram overwritten." : "Local diagram uploaded to shared diagrams.");
  } catch (error) {
    setStatus(error.message || "Local diagram could not be uploaded.");
  }
}

async function downloadSharedDiagramEntry(entry) {
  const yamlText = String(entry?.rawText || entry?.text || "").trim();

  if (!yamlText) {
    setStatus("This shared diagram has no YAML text to download.");
    return;
  }

  const folderHandle = diagramCatalog.folderHandle;

  if (!folderHandle || typeof folderHandle.getFileHandle !== "function") {
    downloadDiagramTextViaBrowser(entry);
    setStatus("Shared diagram downloaded through the browser. Choose a local folder to save directly into Local Diagrams.");
    return;
  }

  const downloadTitle = getDiagramTitleForOverwrite(yamlText, entry?.title);
  const localEntries = Array.isArray(diagramCatalog.folderEntries) ? diagramCatalog.folderEntries : [];
  const matchingTitleEntry = findDiagramEntryByTitle(localEntries, downloadTitle);
  const targetFileName = normalizeDiagramDownloadFileName(entry?.displayFileName || entry?.fileName || `${downloadTitle}.yaml`);
  const matchingFileEntry = localEntries.find((candidate) => (
    String(candidate.fileName || "").toLowerCase() === targetFileName.toLowerCase()
  ));
  const overwriteEntry = matchingTitleEntry || matchingFileEntry || null;

  if (
    overwriteEntry
    && !confirmDiagramOverwrite({
      title: overwriteEntry.title || downloadTitle,
      targetLabel: "local diagram",
      oldTimestampMs: getDiagramEntryTimestampMs(overwriteEntry),
      newTimestampMs: getDiagramEntryTimestampMs(entry) ?? Date.now(),
    })
  ) {
    setStatus("Shared diagram download canceled.");
    return;
  }

  try {
    const canWriteFolder = await ensureDiagramsFolderWritePermission(folderHandle);

    if (!canWriteFolder) {
      downloadDiagramTextViaBrowser(entry);
      setStatus("Local folder write access was not granted, so the browser download was used instead.");
      return;
    }

    const fileHandle = overwriteEntry?.fileHandle
      || await folderHandle.getFileHandle(targetFileName, { create: true });
    await writeYamlTextToFileHandle(fileHandle, yamlText);
    await refreshFolderDiagramCatalogFromHandle(folderHandle);
    renderDiagramPicker();
    setStatus(overwriteEntry ? "Local diagram overwritten." : "Shared diagram saved to Local Diagrams.");
  } catch (error) {
    setStatus(error.message || "Shared diagram could not be saved locally.");
  }
}

function configureDiagramYamlEditorUi({
  title,
  copy,
  saveLabel = "Save",
  localMode = false,
  showDelete = false,
} = {}) {
  if (sharedDiagramEditorTitle) {
    sharedDiagramEditorTitle.textContent = title || "Diagram YAML";
  }
  if (sharedDiagramEditorCopy) {
    sharedDiagramEditorCopy.textContent = copy || "";
    sharedDiagramEditorCopy.hidden = localMode;
  }
  if (sharedDiagramSaveButton) {
    sharedDiagramSaveButton.textContent = saveLabel;
  }
  if (sharedDiagramDeleteButton) {
    sharedDiagramDeleteButton.hidden = !showDelete;
  }
  if (sharedDiagramFileField) {
    sharedDiagramFileField.hidden = localMode;
  }
  if (sharedDiagramEditorFields) {
    sharedDiagramEditorFields.hidden = localMode;
  }
  if (sharedDiagramYamlMeta) {
    sharedDiagramYamlMeta.hidden = false;
  }
  if (sharedDiagramFileNameInput) {
    sharedDiagramFileNameInput.readOnly = localMode;
  }
  if (sharedDiagramYamlText) {
    sharedDiagramYamlText.setAttribute(
      "aria-label",
      localMode ? "Local diagram YAML editor" : "Shared diagram YAML editor",
    );
  }
  if (sharedDiagramEditorModal) {
    sharedDiagramEditorModal.classList.toggle("is-local-diagram-editor", localMode);
  }
}

function openSharedDiagramEditor(entry = null) {
  if (!sharedDiagramSessionToken) {
    setStatus("Sign in before uploading or editing shared diagrams.");
    sharedAuthEmailInput?.focus();
    return;
  }

  sharedDiagramEditorState = entry?.sharedId
    ? { mode: "edit", sharedId: entry.sharedId, entry }
    : { mode: "new", sharedId: null, entry: null };

  configureDiagramYamlEditorUi({
    title: entry?.sharedId ? "Edit Shared Diagram" : "New Shared Diagram",
    copy: "Upload or edit diagram YAML for the shared catalog.",
    saveLabel: "Save",
    localMode: false,
    showDelete: Boolean(entry?.sharedId),
  });
  if (sharedDiagramFileNameInput) {
    sharedDiagramFileNameInput.value = entry?.displayFileName || "";
  }
  if (sharedDiagramYamlText) {
    sharedDiagramYamlText.value = entry?.text || "";
  }
  if (sharedDiagramFileInput) {
    sharedDiagramFileInput.value = "";
  }
  syncSharedDiagramYamlMetadataPreview();
  if (typeof syncSharedDiagramYamlHighlight === "function") {
    syncSharedDiagramYamlHighlight();
  }
  if (sharedDiagramEditorModal) {
    sharedDiagramEditorModal.hidden = false;
    requestAnimationFrame(() => sharedDiagramYamlText?.focus());
  }
}

function openLocalDiagramEditor(entry) {
  if (!entry?.fileHandle) {
    setStatus("Choose a local diagrams folder before editing local YAML.");
    return;
  }

  sharedDiagramEditorState = {
    mode: "local",
    entry,
  };

  configureDiagramYamlEditorUi({
    title: "Edit Local Diagram",
    copy: "Edit diagram YAML from the selected local folder.",
    saveLabel: "Save",
    localMode: true,
    showDelete: false,
  });
  if (sharedDiagramFileNameInput) {
    sharedDiagramFileNameInput.value = entry.displayFileName || entry.fileName || "";
  }
  if (sharedDiagramYamlText) {
    sharedDiagramYamlText.value = entry.rawText || entry.text || "";
  }
  if (sharedDiagramFileInput) {
    sharedDiagramFileInput.value = "";
  }
  syncSharedDiagramYamlMetadataPreview();
  if (typeof syncSharedDiagramYamlHighlight === "function") {
    syncSharedDiagramYamlHighlight();
  }
  if (sharedDiagramEditorModal) {
    sharedDiagramEditorModal.hidden = false;
    requestAnimationFrame(() => sharedDiagramYamlText?.focus());
  }
}

function closeSharedDiagramEditor() {
  if (sharedDiagramEditorModal) {
    sharedDiagramEditorModal.hidden = true;
  }
  configureDiagramYamlEditorUi({
    title: "Shared Diagram",
    copy: "Upload or edit diagram YAML for the shared catalog.",
    saveLabel: "Save",
    localMode: false,
    showDelete: false,
  });
  sharedDiagramEditorState = null;
}

async function loadSharedDiagramYamlFile(file) {
  if (!file || !sharedDiagramYamlText) {
    if (sharedDiagramFileInput) {
      sharedDiagramFileInput.value = "";
    }
    return;
  }

  if (sharedDiagramFileInput) {
    sharedDiagramFileInput.value = "";
  }
  const text = await file.text();
  sharedDiagramYamlText.value = text;

  if (sharedDiagramFileNameInput) {
    sharedDiagramFileNameInput.value = file.name || "";
  }
  syncSharedDiagramYamlMetadataPreview();
  if (typeof syncSharedDiagramYamlHighlight === "function") {
    syncSharedDiagramYamlHighlight();
  }
}

async function ensureLocalDiagramWritePermission(fileHandle) {
  if (!fileHandle) {
    return false;
  }

  const options = { mode: "readwrite" };

  try {
    if (typeof fileHandle.queryPermission === "function") {
      const currentPermission = await fileHandle.queryPermission(options);
      if (currentPermission === "granted") {
        return true;
      }
    }

    if (typeof fileHandle.requestPermission === "function") {
      return await fileHandle.requestPermission(options) === "granted";
    }
  } catch {
    return true;
  }

  return true;
}

function replaceLocalDiagramEntry(updatedEntry) {
  const currentEntries = Array.isArray(diagramCatalog.folderEntries) ? diagramCatalog.folderEntries : [];
  const existingIndex = currentEntries.findIndex((entry) => entry.fileName === updatedEntry.fileName);
  const nextFolderEntries = [...currentEntries];

  if (existingIndex >= 0) {
    nextFolderEntries[existingIndex] = updatedEntry;
  } else {
    nextFolderEntries.push(updatedEntry);
  }

  diagramCatalog = {
    ...diagramCatalog,
    folderEntries: nextFolderEntries,
    entries: browserDiagramSourceInfo.activeSource === "folder" ? nextFolderEntries : diagramCatalog.entries,
  };
}

async function saveLocalDiagramEditor() {
  const entry = sharedDiagramEditorState?.entry;
  const yamlText = String(sharedDiagramYamlText?.value || "").trim();
  const validationError = validateSharedDiagramYamlText(yamlText);

  if (!entry?.fileHandle) {
    setStatus("Local diagram file access is unavailable. Choose the folder again.");
    return;
  }

  if (validationError) {
    setStatus(validationError);
    return;
  }

  try {
    if (sharedDiagramSaveButton) {
      sharedDiagramSaveButton.disabled = true;
    }

    const canWrite = await ensureLocalDiagramWritePermission(entry.fileHandle);
    if (!canWrite) {
      setStatus("Write access was not granted for this local diagram.");
      return;
    }

    await writeYamlTextToFileHandle(entry.fileHandle, yamlText);

    const updatedEntry = {
      ...buildDiagramCatalogEntry(entry.fileName, getYamlTextForSaving(yamlText), {
        lastModifiedMs: Date.now(),
        sourceIndex: entry.sourceIndex,
      }),
      fileHandle: entry.fileHandle,
      rawText: getYamlTextForSaving(yamlText),
    };
    replaceLocalDiagramEntry(updatedEntry);
    closeSharedDiagramEditor();

    if (browserDiagramSourceInfo.activeSource === "folder" && selectedDiagramPath === entry.fileName) {
      activateDiagramSelection("folder", entry.fileName, {
        layoutFlavor: "saved",
        historyMode: "replace",
      });
    } else {
      renderDiagramPicker();
    }

    setStatus(`Saved local diagram "${entry.fileName}".`);
  } catch (error) {
    setStatus(error.message || "Local diagram could not be saved.");
  } finally {
    if (sharedDiagramSaveButton) {
      sharedDiagramSaveButton.disabled = false;
    }
  }
}

async function saveSharedDiagramEditor() {
  if (sharedDiagramEditorState?.mode === "local") {
    await saveLocalDiagramEditor();
    return;
  }

  if (!sharedDiagramSessionToken) {
    setStatus("Sign in before saving shared diagrams.");
    return;
  }

  const yamlText = String(sharedDiagramYamlText?.value || "").trim();
  const validationError = validateSharedDiagramYamlText(yamlText);

  if (validationError) {
    setStatus(validationError);
    return;
  }

  const payload = {
    fileName: String(sharedDiagramFileNameInput?.value || "").trim(),
    yamlText,
  };
  const isEdit = sharedDiagramEditorState?.mode === "edit" && sharedDiagramEditorState.sharedId;
  const uploadTitle = getDiagramTitleForOverwrite(yamlText, sharedDiagramEditorState?.entry?.title);
  const overwriteEntry = isEdit
    ? null
    : findOwnedSharedEntryByTitle(uploadTitle);

  if (
    overwriteEntry
    && !confirmDiagramOverwrite({
      title: uploadTitle,
      targetLabel: "shared diagram",
      oldTimestampMs: getDiagramEntryTimestampMs(overwriteEntry),
      newTimestampMs: Date.now(),
    })
  ) {
    setStatus("Shared diagram upload canceled.");
    return;
  }
  const targetSharedId = isEdit
    ? sharedDiagramEditorState.sharedId
    : overwriteEntry?.sharedId;
  const shouldUpdateExisting = Boolean(targetSharedId);

  try {
    if (sharedDiagramSaveButton) {
      sharedDiagramSaveButton.disabled = true;
    }
    const result = await sharedApiFetch(shouldUpdateExisting
      ? `/api/diagrams/${encodeURIComponent(targetSharedId)}`
      : "/api/diagrams", {
        method: shouldUpdateExisting ? "PUT" : "POST",
        auth: true,
        body: payload,
      });
    closeSharedDiagramEditor();
    await refreshSharedDiagramCatalog();

    const savedEntry = mergeSharedDiagramEntries(diagramCatalog.sharedEntries, diagramCatalog.mySharedEntries)
      .find((entry) => entry.sharedId === result.diagram?.id);
    if (savedEntry) {
      activateDiagramSelection("shared", savedEntry.fileName, {
        layoutFlavor: diagramPickerLayoutFlavor,
        historyMode: "push",
      });
    }
    setStatus(shouldUpdateExisting ? "Shared diagram updated." : "Shared diagram uploaded.");
  } catch (error) {
    setStatus(error.message || "Shared diagram could not be saved.");
  } finally {
    if (sharedDiagramSaveButton) {
      sharedDiagramSaveButton.disabled = false;
    }
  }
}

async function deleteSharedDiagramEntry(entry = sharedDiagramEditorState?.entry) {
  if (!entry?.sharedId) {
    return;
  }

  const label = entry.displayFileName || entry.title || entry.sharedId;

  if (!window.confirm(`Delete shared diagram "${label}"? This cannot be undone.`)) {
    return;
  }

  try {
    await sharedApiFetch(`/api/diagrams/${encodeURIComponent(entry.sharedId)}`, {
      method: "DELETE",
      auth: true,
    });
    closeSharedDiagramEditor();
    await refreshSharedDiagramCatalog();

    if (browserDiagramSourceInfo.activeSource === "shared" && selectedDiagramPath === entry.fileName) {
      const fallbackSource = ["shared", "folder"]
        .find((candidate) => getDiagramEntriesForSource(candidate).some((entry) => typeof entry.text === "string"));
      const fallbackEntry = fallbackSource
        ? getDiagramEntriesForSource(fallbackSource).find((candidate) => typeof candidate.text === "string")
        : null;

      if (fallbackEntry) {
        activateDiagramSelection(fallbackSource, fallbackEntry.fileName, { layoutFlavor: "saved" });
      } else {
        renderHomePanel();
      }
    }

    setStatus("Shared diagram deleted.");
  } catch (error) {
    setStatus(error.message || "Shared diagram could not be deleted.");
  }
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

function buildDiagramCatalogEntry(fileName, rawYamlText, { lastModifiedMs = null, sourceIndex = 0 } = {}) {
  try {
    const parsed = parseDiagramConfig(rawYamlText);
    const inlineBibText = extractInlineBibliographyText(parsed);
    const normalized = normalizeConfig(parsed, inlineBibText ? parseBibtex(inlineBibText) : []);
    return {
      fileName,
      title: normalized.meta.title || fileName,
      description: normalized.meta.description || "",
      text: rawYamlText,
      rawText: rawYamlText,
      bibliographyText: inlineBibText,
      lastModifiedMs: Number.isFinite(lastModifiedMs) ? lastModifiedMs : null,
      sourceIndex,
    };
  } catch {
    return {
      fileName,
      title: `${fileName} (invalid YAML)`,
      description: "",
      text: null,
      rawText: rawYamlText,
      bibliographyText: null,
      lastModifiedMs: Number.isFinite(lastModifiedMs) ? lastModifiedMs : null,
      sourceIndex,
    };
  }
}

const diagramPickerFileNameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function compareDiagramCatalogEntries(left, right, sortMode = "alpha-asc") {
  const alphaCompare = diagramPickerFileNameCollator.compare(left.fileName || "", right.fileName || "");

  if (sortMode === "alpha-desc") {
    return alphaCompare * -1;
  }

  if (sortMode === "modified-desc" || sortMode === "modified-asc") {
    const leftModified = Number.isFinite(left.lastModifiedMs) ? left.lastModifiedMs : null;
    const rightModified = Number.isFinite(right.lastModifiedMs) ? right.lastModifiedMs : null;

    if (leftModified !== null && rightModified !== null && leftModified !== rightModified) {
      return sortMode === "modified-desc"
        ? rightModified - leftModified
        : leftModified - rightModified;
    }

    if (leftModified !== rightModified) {
      return leftModified === null ? 1 : -1;
    }
  }

  if (left.sourceIndex !== right.sourceIndex) {
    return left.sourceIndex - right.sourceIndex;
  }

  return alphaCompare;
}

function filterAndSortDiagramCatalogEntries(entries) {
  const normalizedQuery = diagramPickerSearchQuery.trim().toLowerCase();
  const filteredEntries = normalizedQuery
    ? entries.filter((entry) => {
      const haystack = `${entry.title || ""}\n${entry.description || ""}\n${entry.fileName || ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    : [...entries];

  return filteredEntries.sort((left, right) => compareDiagramCatalogEntries(left, right, diagramPickerSortMode));
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
      entries.push({
        ...buildDiagramCatalogEntry(entry.name, rawYamlText, {
          lastModifiedMs: file.lastModified,
          sourceIndex: entries.length,
        }),
        fileHandle: entry,
      });
    } catch {
      entries.push({
        fileName: entry.name,
        title: `${entry.name} (invalid YAML)`,
        text: null,
        rawText: "",
        bibliographyText: null,
        lastModifiedMs: null,
        sourceIndex: entries.length,
        fileHandle: entry,
      });
    }
  }

  return entries;
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

  function extractInlineCitationKeys(text) {
    if (typeof text !== "string") {
      return [];
    }

    return [...new Set(
      [...text.matchAll(/\\cite\{([^}]+)\}/g)]
        .flatMap((match) => match[1].split(","))
        .map((key) => key.trim())
        .filter(Boolean),
    )];
  }

  function mergeReferenceKeyLists(...groups) {
    return [...new Set(
      groups.flatMap((group) => (Array.isArray(group) ? group : [])).map((key) => String(key || "").trim()).filter(Boolean),
    )];
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
        referenceKeys: [],
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
        referenceKeys: extractInlineCitationKeys(rawText),
      };
    }

    const normalizedDisplayToken = parsedNumber.uncertaintyToken
      ? strippedText
      : `${strippedText}(?)`;

    return {
      numericValue: parsedNumber.numericValue,
      displayText: `${formatGroupedNumberToken(normalizedDisplayToken)}${citationSuffix}`,
      referenceKeys: extractInlineCitationKeys(rawText),
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

  function normalizeDefinedGroundEnergy(energyMeasurement) {
    if (!Number.isFinite(energyMeasurement?.numericValue) || Math.abs(energyMeasurement.numericValue) > 1e-12) {
      return energyMeasurement;
    }

    const displayText = "0 (def.)";
    const unitLabel = energyMeasurement.measurement?.unitLabel || "THz";

    return {
      numericValue: 0,
      displayText,
      measurement: createExactMeasurementValue(0, unitLabel, displayText),
    };
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
      description: rawMeta.description || "",
    },
    species: {
      ...rawSpecies,
      notes: Array.isArray(rawSpecies.notes) ? rawSpecies.notes : [],
      nuclearSpin: rawSpecies.nuclear_spin,
    },
    diagramIssues: issues,
    states: (Array.isArray(rawConfig.states) ? rawConfig.states : []).map((state) => {
      const energyMeasurement = normalizeDefinedGroundEnergy(
        parseStateMeasurement(state.id, "energy", state.energy, 1e12, "THz"),
      );
      const gJValue = parseConfiguredScalar(state.g_j, {
        issueKey: `state:${state.id}:g_j`,
        fieldLabel: `${state.id} g_J`,
      });
      const stateReferenceMap = state.references && typeof state.references === "object" && !Array.isArray(state.references)
        ? { ...state.references }
        : {};
      const gJReferences = mergeReferenceKeyLists(
        stateReferenceMap.gJ,
        stateReferenceMap.g_j,
        gJValue.referenceKeys,
      );

      if (gJReferences.length > 0) {
        stateReferenceMap.gJ = gJReferences;
      }

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
        labelFields: Array.isArray(state.show)
          ? state.show.map((item) => String(item || "").trim()).filter(Boolean)
          : (typeof state.show === "string" && state.show.trim() ? [state.show.trim()] : []),
        j: state.j,
        gJConfigured: gJValue.numericValue,
        gJText: gJValue.displayText,
        energyTHz: energyMeasurement.numericValue,
        energyText: energyMeasurement.displayText,
        energyMeasurement: energyMeasurement.measurement,
        notes: Array.isArray(state.notes) ? state.notes : [],
        properties: normalizePropertyEntries(state.properties),
        referenceMap: stateReferenceMap,
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
          const gFValue = parseConfiguredScalar(level.g_f, {
            issueKey: `state:${state.id}:hyperfine:${level.id || level.f}:g_f`,
            fieldLabel: `${state.id} hyperfine g_F`,
          });
          const levelReferenceMap = level.references && typeof level.references === "object" && !Array.isArray(level.references)
            ? { ...level.references }
            : {};
          const gFReferences = mergeReferenceKeyLists(
            levelReferenceMap.gF,
            levelReferenceMap.g_f,
            gFValue.referenceKeys,
          );

          if (gFReferences.length > 0) {
            levelReferenceMap.gF = gFReferences;
          }

          return {
            id: level.id,
            F: level.f,
            labelFields: Array.isArray(level.show)
              ? level.show.map((item) => String(item || "").trim()).filter(Boolean)
              : (typeof level.show === "string" && level.show.trim() ? [level.show.trim()] : []),
            relMHz: relMeasurement.numericValue,
            relText: relMeasurement.displayText,
            relMeasurement: relMeasurement.measurement,
            gFConfigured: gFValue.numericValue,
            gFText: gFValue.displayText,
            notes: Array.isArray(level.notes) ? level.notes : [],
            properties: normalizePropertyEntries(level.properties),
            referenceMap: levelReferenceMap,
          };
        }),
      };
    }),
    bibliography,
    defaultLayout: rawConfig.default_layout && typeof rawConfig.default_layout === "object" && !Array.isArray(rawConfig.default_layout)
      ? rawConfig.default_layout
      : null,
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
    defaultLayout: null,
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

function normalizeDiagramSelectionSource(source) {
  return source === "folder" || source === "shared" ? source : null;
}

function isHomeRouteUrl() {
  try {
    const locationUrl = new URL(window.location.href);
    const pathSegments = locationUrl.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1] || "";

    return !lastSegment || lastSegment.toLowerCase() === "index.html" || !lastSegment.includes(".");
  } catch {
    return false;
  }
}

function readUrlQueryParam(name, { preservePlus = false } = {}) {
  const normalizedName = String(name || "").trim();

  if (!normalizedName) {
    return "";
  }

  const rawSearch = String(window.location.search || "").replace(/^\?/, "");

  if (!rawSearch) {
    return "";
  }

  for (const segment of rawSearch.split("&")) {
    if (!segment) {
      continue;
    }

    const separatorIndex = segment.indexOf("=");
    const rawKey = separatorIndex >= 0 ? segment.slice(0, separatorIndex) : segment;
    const rawValue = separatorIndex >= 0 ? segment.slice(separatorIndex + 1) : "";

    try {
      const decodedKey = decodeURIComponent(rawKey.replace(/\+/g, "%20"));

      if (decodedKey !== normalizedName) {
        continue;
      }

      const valueForDecoding = preservePlus
        ? rawValue.replace(/\+/g, "%2B")
        : rawValue.replace(/\+/g, "%20");

      return decodeURIComponent(valueForDecoding);
    } catch {
      continue;
    }
  }

  return "";
}

function readUrlDiagramSelection() {
  try {
    const rawPath = String(readUrlQueryParam("diagram", { preservePlus: true }) || "").trim();
    const rawSource = String(readUrlQueryParam("source") || "").trim();
    const path = isDiagramConfigFileName(rawPath) ? rawPath : null;
    const source = normalizeDiagramSelectionSource(rawSource);

    return { path, source };
  } catch {
    return { path: null, source: null };
  }
}

function shouldUseDefaultHomeDiagramSelection() {
  const urlDiagramSelection = readUrlDiagramSelection();

  return !urlDiagramSelection.path && !urlDiagramSelection.source && isHomeRouteUrl();
}

function syncUrlDiagramSelection(path, source, { historyMode = "replace" } = {}) {
  if (!window.history || typeof window.history.replaceState !== "function") {
    return;
  }

  try {
    const nextUrl = new URL(window.location.href);
    const normalizedPath = String(path || "").trim();
    const normalizedSource = normalizeDiagramSelectionSource(source);

    if (normalizedPath && isDiagramConfigFileName(normalizedPath)) {
      nextUrl.searchParams.set("diagram", normalizedPath);
    } else {
      nextUrl.searchParams.delete("diagram");
    }

    if (normalizedSource) {
      nextUrl.searchParams.set("source", normalizedSource);
    } else {
      nextUrl.searchParams.delete("source");
    }

    if (nextUrl.toString() === window.location.href) {
      return;
    }

    const historyMethod = historyMode === "push" && typeof window.history.pushState === "function"
      ? "pushState"
      : "replaceState";
    window.history[historyMethod](null, "", nextUrl.toString());
  } catch {
    return;
  }
}

function diagramCatalogEntriesContainPath(entries, fileName) {
  const normalizedFileName = String(fileName || "").trim();

  if (!normalizedFileName) {
    return false;
  }

  return (Array.isArray(entries) ? entries : [])
    .some((entry) => entry?.fileName === normalizedFileName);
}

function resolveSourceForUrlDiagramSelection({ folderEntries = [], sharedEntries = [] } = {}, selection = {}) {
  const normalizedSource = normalizeDiagramSelectionSource(selection?.source);
  const normalizedPath = String(selection?.path || "").trim();

  if (normalizedPath) {
    const folderHasPath = diagramCatalogEntriesContainPath(folderEntries, normalizedPath);
    const sharedHasPath = diagramCatalogEntriesContainPath(sharedEntries, normalizedPath);

    if (normalizedSource === "folder" && folderHasPath) {
      return "folder";
    }

    if (normalizedSource === "shared" && sharedHasPath) {
      return "shared";
    }

    if (sharedHasPath) {
      return "shared";
    }

    if (folderHasPath) {
      return "folder";
    }
  }

  return normalizedSource;
}

function getStoredSelectedDiagramSource() {
  const storageKey = APP_CONFIG.storage.selectedDiagramSourceKey
    || `${APP_CONFIG.storage.selectedDiagramKey}-source`;

  try {
    const value = window.localStorage.getItem(storageKey);
    return normalizeDiagramSelectionSource(value);
  } catch {
    return null;
  }
}

function storeSelectedDiagramSource(source) {
  const normalizedSource = normalizeDiagramSelectionSource(source);
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
  sharedDiagramSessionToken = readStoredSharedSessionToken();
  if (sharedAuthEmailInput && !sharedAuthEmailInput.value) {
    sharedAuthEmailInput.value = readStoredSharedEmail();
  }

  const folderHandle = await getStoredDiagramsFolderHandle();
  const browserSourceInfo = createBrowserDiagramSourceInfo({
    hasStoredHandle: Boolean(folderHandle),
    folderName: folderHandle?.name || "",
  });
  const hasPermission = await ensureDiagramsFolderPermission(folderHandle);
  browserSourceInfo.permissionGranted = hasPermission;
  const sharedCatalog = await loadSharedDiagramCatalog();
  const sharedEntries = mergeSharedDiagramEntries(sharedCatalog.entries, sharedCatalog.myEntries);
  browserSourceInfo.sharedApiAvailable = sharedCatalog.available;
  browserSourceInfo.sharedApiBaseUrl = sharedCatalog.apiBaseUrl;
  browserSourceInfo.sharedApiError = sharedCatalog.error;
  const folderEntries = folderHandle && hasPermission
    ? await loadFolderDiagramCatalog(folderHandle)
    : [];
  const preferredSource = getStoredSelectedDiagramSource();
  const urlDiagramSelection = readUrlDiagramSelection();
  const urlPreferredSource = resolveSourceForUrlDiagramSelection({
    folderEntries,
    sharedEntries,
  }, urlDiagramSelection);
  let activeSource = "none";

  if (urlPreferredSource === "folder" && folderHandle && hasPermission) {
    activeSource = "folder";
  } else if (urlPreferredSource === "shared" && sharedCatalog.available) {
    activeSource = "shared";
  } else if (preferredSource === "folder" && folderHandle && hasPermission) {
    activeSource = "folder";
  } else if (preferredSource === "shared" && sharedCatalog.available && sharedEntries.length > 0) {
    activeSource = "shared";
  } else if (sharedCatalog.available && sharedEntries.length > 0) {
    activeSource = "shared";
  } else if (folderHandle && hasPermission && folderEntries.length > 0) {
    activeSource = "folder";
  } else if (folderHandle && hasPermission) {
    activeSource = "folder";
  }

  return {
    folderHandle: folderHandle && hasPermission ? folderHandle : null,
    folderEntries,
    sharedEntries,
    mySharedEntries: sharedCatalog.myEntries,
    entries: activeSource === "folder"
      ? folderEntries
      : (activeSource === "shared" ? sharedEntries : []),
    browserSourceInfo: createBrowserDiagramSourceInfo({
      ...browserSourceInfo,
      activeSource,
    }),
  };
}

function resolveSelectedDiagramPath(diagramCatalog, preferredPath = null) {
  const normalizedPreferredPath = String(preferredPath || "").trim();
  const urlDiagramSelection = readUrlDiagramSelection();
  const urlPath = urlDiagramSelection.path;
  const storedPath = getStoredSelectedDiagramPath();

  if (normalizedPreferredPath && diagramCatalog.entries.some((entry) => entry.fileName === normalizedPreferredPath)) {
    return normalizedPreferredPath;
  }

  if (urlPath && diagramCatalog.entries.some((entry) => entry.fileName === urlPath)) {
    return urlPath;
  }

  if (shouldUseDefaultHomeDiagramSelection()
    && diagramCatalog.entries.some((entry) => entry.fileName === DEFAULT_HOME_DIAGRAM_FILE)) {
    return DEFAULT_HOME_DIAGRAM_FILE;
  }

  if (storedPath && diagramCatalog.entries.some((entry) => entry.fileName === storedPath)) {
    return storedPath;
  }

  return diagramCatalog.entries.find((entry) => typeof entry.text === "string")?.fileName
    || diagramCatalog.entries[0]?.fileName
    || null;
}

function loadInitialConfig(diagramCatalog, preferredPath = null) {
  const selectedDiagramPath = resolveSelectedDiagramPath(diagramCatalog, preferredPath);
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

  if (source === "shared") {
    return Array.isArray(diagramCatalog.sharedEntries) ? diagramCatalog.sharedEntries : [];
  }

  return [];
}

function activateDiagramSelection(source, preferredPath = null, { layoutFlavor = "saved", historyMode = "push" } = {}) {
  const normalizedSource = normalizeDiagramSelectionSource(source);

  if (!normalizedSource) {
    return;
  }

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

  ({ config, hasLoadedDiagramSource, selectedDiagramPath } = loadInitialConfig(nextCatalog, preferredPath));
  if (selectedDiagramPath) {
    storeSelectedDiagramPath(selectedDiagramPath);
  }
  syncUrlDiagramSelection(selectedDiagramPath, normalizedSource, { historyMode });
  hasInteractiveDiagram = config.states.length > 0;
  storageKey = `${APP_CONFIG.storage.stateKeyPrefix}${config.meta.id}-v${APP_CONFIG.storage.stateVersion}`;
  syncDocumentTitle();
  renderHomePanel();
  rebuildDerivedDiagramState();
  hideTooltip();

  currentHyperfineScaleByFineState = createDefaultHyperfineScaleMap();
  currentStateLabelFieldsById = createDefaultStateLabelFieldMap();
  currentTransitionLabelFieldsById = createDefaultTransitionLabelFieldMap();
  currentTransitionLabelPrecisionById = createDefaultTransitionLabelPrecisionMap();

  const hasStoredState = layoutFlavor === "saved" ? loadStoredState() : false;
  applyTheme(currentTheme);
  syncControlUI();
  renderReferencesPanel();

  if (!hasStoredState) {
    applyStateObject(buildDiagramPickerPreviewStateObject(layoutFlavor), { persist: false });
    render();
    fitView({ persist: false, animationDuration: 0 });
  }

  initializeHistoryState();
}

let diagramsFolderHandle = null;
let diagramCatalog = {
  folderHandle: null,
  folderEntries: [],
  sharedEntries: [],
  mySharedEntries: [],
  entries: [],
};
let config = createEmptyConfig();
let hasLoadedDiagramSource = false;
let selectedDiagramPath = null;
let browserDiagramSourceInfo = createBrowserDiagramSourceInfo();
let sharedDiagramSessionToken = null;
let sharedDiagramUser = null;
let sharedDiagramEditorState = null;
let hasInteractiveDiagram = false;
let diagramPickerLayoutFlavor = "default";
let diagramPickerPreviewActive = false;
let diagramPickerSearchQuery = "";
let diagramPickerSortMode = "alpha-asc";
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
const defaultMoveToolEnabled = false;
const bFieldVisualScaleSliderRange = { min: 0.1, max: 10 };
const hyperfineScaleSliderRange = { min: 0.01, max: 100 };
const MU_B_OVER_H_MHZ_PER_GAUSS = 1.3996246;

function createExpandedDefaultStateLists() {
  return {
    expandedFine: fineStates.map((state) => state.id),
    expandedHyperfine: fineStates.flatMap((state) => (
      Array.isArray(state.hyperfine) ? state.hyperfine.map((level) => level.id) : []
    )),
  };
}

function createExpansionStateLists(expansionMode = "collapsed") {
  return expansionMode === "expanded"
    ? createExpandedDefaultStateLists()
    : {
      expandedFine: defaultExpandedFine,
      expandedHyperfine: defaultExpandedHyperfine,
    };
}

function getConfiguredDefaultLayout() {
  return config.defaultLayout && typeof config.defaultLayout === "object" && !Array.isArray(config.defaultLayout)
    ? config.defaultLayout
    : null;
}

function normalizeFineDisplacementEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return null;
  }

  const x = Number.isFinite(entry.x) ? entry.x : 0;
  const y = Number.isFinite(entry.y) ? entry.y : 0;

  if (Math.abs(x) < 1e-9 && Math.abs(y) < 1e-9) {
    return null;
  }

  return { x, y };
}

function normalizeFineDisplacements(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([stateId, entry]) => {
        const normalizedStateId = String(stateId || "").trim();
        const normalizedEntry = normalizeFineDisplacementEntry(entry);

        if (!normalizedStateId || !normalizedEntry) {
          return null;
        }

        return [normalizedStateId, normalizedEntry];
      })
      .filter(Boolean),
  );
}

function getLayoutRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
}

function pickFirstArray(...candidates) {
  return candidates.find((candidate) => Array.isArray(candidate));
}

function pickFirstBoolean(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate === "boolean") {
      return candidate;
    }
  }

  return undefined;
}

function pickFirstFiniteNumber(...candidates) {
  for (const candidate of candidates) {
    if (Number.isFinite(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function pickFirstString(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return undefined;
}

function normalizeLayoutStateObject(stateObject, { expansionMode = "collapsed" } = {}) {
  const sourceState = getLayoutRecord(stateObject) || {};
  const layoutState = getLayoutRecord(sourceState.layout) || {};
  const expandedState = getLayoutRecord(layoutState.expanded) || {};
  const hiddenState = getLayoutRecord(layoutState.hidden) || {};
  const viewState = getLayoutRecord(sourceState.view) || {};
  const viewZoomState = getLayoutRecord(viewState.zoom) || {};
  const toolsState = getLayoutRecord(sourceState.tools) || {};
  const hideToolState = getLayoutRecord(toolsState.hide) || {};
  const measureToolState = getLayoutRecord(toolsState.measure) || {};
  const moveToolState = getLayoutRecord(toolsState.move) || {};
  const diagramState = getLayoutRecord(sourceState.diagram) || {};
  const diagramStatesState = getLayoutRecord(diagramState.states) || {};
  const diagramHyperfineState = getLayoutRecord(diagramState.hyperfine) || {};
  const diagramTransitionsState = getLayoutRecord(diagramState.transitions) || {};
  const magneticFieldState = getLayoutRecord(diagramState.magneticField) || {};
  const magneticFieldRangeState = getLayoutRecord(magneticFieldState.range) || {};
  const legacyControlsState = getLayoutRecord(sourceState.controls) || {};
  const legacyZoomState = getLayoutRecord(sourceState.zoom) || {};
  const baseState = buildBaseLayoutStateObject({ expansionMode });

  const normalizedState = {
    ...baseState,
    expandedFine: pickFirstArray(expandedState.fine, sourceState.expandedFine) || baseState.expandedFine,
    expandedHyperfine: pickFirstArray(expandedState.hyperfine, sourceState.expandedHyperfine) || baseState.expandedHyperfine,
    pinnedPanels: pickFirstArray(layoutState.pinnedPanels, sourceState.pinnedPanels) || baseState.pinnedPanels,
    theme: pickFirstString(viewState.theme, sourceState.theme) || baseState.theme,
    referencesVisible: pickFirstBoolean(viewState.referencesVisible, sourceState.referencesVisible) ?? baseState.referencesVisible,
    measureToolEnabled: pickFirstBoolean(measureToolState.enabled, sourceState.measureToolEnabled) ?? baseState.measureToolEnabled,
    hideToolEnabled: pickFirstBoolean(hideToolState.enabled, sourceState.hideToolEnabled) ?? baseState.hideToolEnabled,
    moveToolEnabled: pickFirstBoolean(moveToolState.enabled, sourceState.moveToolEnabled) ?? baseState.moveToolEnabled,
      measureSelection: pickFirstArray(measureToolState.selection, sourceState.measureSelection) || baseState.measureSelection,
      measurements: pickFirstArray(measureToolState.measurements, sourceState.measurements) || baseState.measurements,
      hiddenStates: pickFirstArray(hiddenState.states, sourceState.hiddenStates) || baseState.hiddenStates,
      hiddenTransitions: pickFirstArray(hiddenState.transitions, sourceState.hiddenTransitions) || baseState.hiddenTransitions,
      fineDisplacements: normalizeFineDisplacements(
        layoutState.displacements
          ?? layoutState.fineDisplacements
          ?? sourceState.fineDisplacements,
      ),
      controls: {
      ...baseState.controls,
      stateLabels: pickFirstArray(diagramStatesState.labels, legacyControlsState.stateLabels)
        || baseState.controls.stateLabels,
      hyperfineScaleByFineState: getLayoutRecord(diagramHyperfineState.scaleByFineState)
        || getLayoutRecord(legacyControlsState.hyperfineScaleByFineState)
        || baseState.controls.hyperfineScaleByFineState,
      transitionLabels: pickFirstArray(diagramTransitionsState.labels, legacyControlsState.transitionLabels)
        || baseState.controls.transitionLabels,
      bFieldEnabled: pickFirstBoolean(magneticFieldState.enabled, legacyControlsState.bFieldEnabled)
        ?? baseState.controls.bFieldEnabled,
      bFieldVisualScale: pickFirstFiniteNumber(magneticFieldState.visualScale, legacyControlsState.bFieldVisualScale)
        ?? baseState.controls.bFieldVisualScale,
      bFieldGauss: pickFirstFiniteNumber(magneticFieldState.gauss, legacyControlsState.bFieldGauss)
        ?? baseState.controls.bFieldGauss,
      bFieldGaussMin: pickFirstFiniteNumber(magneticFieldRangeState.min, legacyControlsState.bFieldGaussMin)
        ?? baseState.controls.bFieldGaussMin,
      bFieldGaussMax: pickFirstFiniteNumber(magneticFieldRangeState.max, legacyControlsState.bFieldGaussMax)
        ?? baseState.controls.bFieldGaussMax,
    },
    zoom: {
      x: pickFirstFiniteNumber(viewZoomState.x, legacyZoomState.x) ?? baseState.zoom.x,
      y: pickFirstFiniteNumber(viewZoomState.y, legacyZoomState.y) ?? baseState.zoom.y,
      k: pickFirstFiniteNumber(viewZoomState.k, legacyZoomState.k) ?? baseState.zoom.k,
    },
  };

  const hasExplicitHideEnabled = pickFirstBoolean(hideToolState.enabled, sourceState.hideToolEnabled);

  if (
    typeof hasExplicitHideEnabled !== "boolean"
    && (normalizedState.hiddenStates.length > 0 || normalizedState.hiddenTransitions.length > 0)
  ) {
    normalizedState.hideToolEnabled = true;
  }

  return normalizedState;
}

function getFineStateDisplacement(stateId) {
  const entry = currentFineDisplacements?.[stateId];
  return normalizeFineDisplacementEntry(entry) || { x: 0, y: 0 };
}

function setFineStateDisplacement(stateId, displacement) {
  const normalizedStateId = String(stateId || "").trim();

  if (!normalizedStateId) {
    return;
  }

  const normalizedEntry = normalizeFineDisplacementEntry(displacement);

  if (!normalizedEntry) {
    delete currentFineDisplacements[normalizedStateId];
    return;
  }

  currentFineDisplacements[normalizedStateId] = normalizedEntry;
}

function stateObjectHasHiddenItems(stateObject) {
  const normalizedState = normalizeLayoutStateObject(stateObject);
  return normalizedState.hiddenStates.length > 0 || normalizedState.hiddenTransitions.length > 0;
}

function buildBaseLayoutStateObject({ expansionMode = "collapsed" } = {}) {
  const expansionState = createExpansionStateLists(expansionMode);

  return {
    expandedFine: expansionState.expandedFine,
    expandedHyperfine: expansionState.expandedHyperfine,
    pinnedPanels: [],
    theme: currentTheme,
    referencesVisible: defaultReferencesVisible,
    measureToolEnabled: defaultMeasureToolEnabled,
    hideToolEnabled: defaultHideToolEnabled,
    moveToolEnabled: defaultMoveToolEnabled,
    measureSelection: [],
    measurements: [],
    hiddenStates: [],
    hiddenTransitions: [],
    fineDisplacements: {},
    controls: {
      hyperfineScaleByFineState: createDefaultHyperfineScaleMap(),
      stateLabels: [],
      transitionLabels: [],
      bFieldEnabled: defaultBFieldEnabled,
      bFieldVisualScale: defaultBFieldVisualScale,
      bFieldGauss: defaultBFieldGauss,
      bFieldGaussMin: defaultBFieldGaussMin,
      bFieldGaussMax: defaultBFieldGaussMax,
    },
    zoom: defaultZoomState,
  };
}

function buildDiagramDefaultStateObject() {
  const configuredLayout = getConfiguredDefaultLayout();
  return configuredLayout
    ? normalizeLayoutStateObject(configuredLayout, { expansionMode: "expanded" })
    : buildBaseLayoutStateObject({ expansionMode: "expanded" });
}

function buildExpansionOnlyStateObject(expansionMode = "collapsed") {
  const baseState = typeof buildCurrentLayoutStateObject === "function"
    ? buildCurrentLayoutStateObject()
    : buildDiagramDefaultStateObject();
  const expansionState = createExpansionStateLists(expansionMode);

  return {
    ...baseState,
    expandedFine: expansionState.expandedFine,
    expandedHyperfine: expansionState.expandedHyperfine,
  };
}

function parseStoredStateText(raw) {
  const text = String(raw || "").trim();

  if (!text || typeof window.jsyaml?.load !== "function") {
    return null;
  }

  try {
    return window.jsyaml.load(text);
  } catch {
    return null;
  }
}

async function fetchTextResourceRecord(resourceUrl, { optional = false } = {}) {
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

    const lastModifiedHeader = response.headers.get("last-modified");
    const parsedLastModified = lastModifiedHeader ? Date.parse(lastModifiedHeader) : Number.NaN;

    return {
      text: await response.text(),
      lastModifiedMs: Number.isFinite(parsedLastModified) ? parsedLastModified : null,
    };
  } catch (error) {
    if (optional) {
      return null;
    }

    throw error;
  }
}

function readStoredStateObject(stateStorageKey = storageKey) {
  try {
    const raw = window.localStorage.getItem(stateStorageKey);
    return raw ? normalizeLayoutStateObject(parseStoredStateText(raw)) : null;
  } catch {
    return null;
  }
}

function resolveDiagramPickerLayoutStateObject(layoutFlavor = "default") {
  if (layoutFlavor === "saved") {
    return readStoredStateObject(storageKey) || buildDiagramDefaultStateObject();
  }

  if (layoutFlavor === "collapsed") {
    return buildExpansionOnlyStateObject("collapsed");
  }

  if (layoutFlavor === "expanded") {
    return buildExpansionOnlyStateObject("expanded");
  }

  return buildDiagramDefaultStateObject();
}

function buildDiagramPickerPreviewStateObject(layoutFlavor = "default") {
  const stateObject = resolveDiagramPickerLayoutStateObject(layoutFlavor);

  if (layoutFlavor !== "default" || !stateObjectHasHiddenItems(stateObject)) {
    return {
      ...stateObject,
      moveToolEnabled: false,
    };
  }

  return {
    ...stateObject,
    hideToolEnabled: true,
    moveToolEnabled: false,
  };
}

function syncDiagramPickerLayoutFlavorUi() {
  if (diagramPickerLayoutDefaultButton) {
    const isDefault = diagramPickerLayoutFlavor === "default";
    diagramPickerLayoutDefaultButton.setAttribute("aria-pressed", isDefault ? "true" : "false");
    diagramPickerLayoutDefaultButton.classList.toggle("is-active", isDefault);
  }

  if (diagramPickerLayoutSavedButton) {
    const isSaved = diagramPickerLayoutFlavor === "saved";
    diagramPickerLayoutSavedButton.setAttribute("aria-pressed", isSaved ? "true" : "false");
    diagramPickerLayoutSavedButton.classList.toggle("is-active", isSaved);
  }

  if (diagramPickerLayoutCollapsedButton) {
    const isCollapsed = diagramPickerLayoutFlavor === "collapsed";
    diagramPickerLayoutCollapsedButton.setAttribute("aria-pressed", isCollapsed ? "true" : "false");
    diagramPickerLayoutCollapsedButton.classList.toggle("is-active", isCollapsed);
  }

  if (diagramPickerLayoutExpandedButton) {
    const isExpanded = diagramPickerLayoutFlavor === "expanded";
    diagramPickerLayoutExpandedButton.setAttribute("aria-pressed", isExpanded ? "true" : "false");
    diagramPickerLayoutExpandedButton.classList.toggle("is-active", isExpanded);
  }
}

function syncDiagramPickerBrowseControlsUi() {
  if (diagramPickerSearchInput && diagramPickerSearchInput.value !== diagramPickerSearchQuery) {
    diagramPickerSearchInput.value = diagramPickerSearchQuery;
  }

  if (diagramPickerSortSelect && diagramPickerSortSelect.value !== diagramPickerSortMode) {
    diagramPickerSortSelect.value = diagramPickerSortMode;
  }
}

function setDiagramPickerLayoutFlavor(layoutFlavor, { applyCurrentDiagram = false, announce = true } = {}) {
  diagramPickerLayoutFlavor = ["saved", "collapsed", "expanded"].includes(layoutFlavor) ? layoutFlavor : "default";
  syncDiagramPickerLayoutFlavorUi();

  if (!applyCurrentDiagram || !hasLoadedDiagramSource || typeof applyStateObject !== "function") {
    return;
  }

  const savedState = diagramPickerLayoutFlavor === "saved" ? readStoredStateObject(storageKey) : null;
  const stateObject = buildDiagramPickerPreviewStateObject(diagramPickerLayoutFlavor);

  applyStateObject(stateObject, { animationDuration: CONTROL_ANIMATION_MS, persist: false });
  fitView({ persist: false, animationDuration: CONTROL_ANIMATION_MS });
  initializeHistoryState();

  if (!announce) {
    return;
  }

  if (diagramPickerLayoutFlavor === "saved") {
    setStatus(savedState
      ? "Browsing the saved layout for this diagram."
      : "No saved layout was found, so the diagram default is shown while browsing.");
    return;
  }

  if (diagramPickerLayoutFlavor === "collapsed") {
    setStatus("Browsing the fully collapsed layout.");
    return;
  }

  if (diagramPickerLayoutFlavor === "expanded") {
    setStatus("Browsing the fully expanded layout.");
    return;
  }

  setStatus("Browsing the diagram default layout.");
}
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
let currentStateLabelFieldsById = {};
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
let currentMoveToolEnabled = defaultMoveToolEnabled;
let currentMeasureSelection = [];
let currentMeasurements = [];
let hiddenStateKeys = new Set();
let hiddenTransitionIds = new Set();
let currentFineDisplacements = {};
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
    const normalizedEntry = entry.trim();

    if (!normalizedEntry) {
      return null;
    }

    const match = normalizedEntry.match(/^([^:]+):(.+)$/);

    if (match) {
      return normalizeMeasureSelection({
        type: match[1],
        id: match[2],
      });
    }

    return normalizeMeasureSelection({
      type: inferMeasurementSelectionType(normalizedEntry),
      id: normalizedEntry,
    });
  }

  return normalizeMeasureSelection(entry);
}

function serializeHiddenStateEntry(entry) {
  const normalizedEntry = normalizeHiddenStateEntry(entry);
  return normalizedEntry ? normalizedEntry.id : null;
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

  if (panel.type === "fine" || panel.type === "hyperfine" || panel.type === "zeeman") {
    return {
      ...panel,
      showStateLabelSelectors: Boolean(panel.showStateLabelSelectors || panel.showFineLabelSelectors),
    };
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

function serializeStateLabelControlEntries() {
  return Object.entries(currentStateLabelFieldsById || {})
    .map(([stateId, fields]) => {
      const normalizedStateId = String(stateId || "").trim();

      if (!normalizedStateId) {
        return null;
      }

      return {
        state: normalizedStateId,
        show: Array.isArray(fields)
          ? fields.map((field) => String(field || "").trim()).filter(Boolean)
          : [],
      };
    })
    .filter(Boolean);
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

function normalizeStateLabelControlEntries(value) {
  const normalizedFieldsById = {};

  if (!Array.isArray(value)) {
    return normalizedFieldsById;
  }

  value.forEach((entry) => {
    if (!entry || typeof entry !== "object") {
      return;
    }

    const stateId = String(entry.state ?? entry.id ?? "").trim();

    if (!stateId) {
      return;
    }

    normalizedFieldsById[stateId] = Array.isArray(entry.show)
      ? entry.show.map((field) => String(field || "").trim()).filter(Boolean)
      : [];
  });

  return normalizedFieldsById;
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

      parts.push(window.katex.renderToString(match[1], {
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
  const shouldRestoreNormalLayout = diagramPickerPreviewActive && hasLoadedDiagramSource;
  diagramPickerPreviewActive = false;

  if (shouldRestoreNormalLayout) {
    setDiagramPickerLayoutFlavor("saved", {
      applyCurrentDiagram: true,
      announce: false,
    });
  }
}

function openDiagramPicker() {
  if (!diagramPicker || !diagramPicker.hidden) {
    return;
  }

  diagramPickerPreviewActive = true;
  diagramPicker.hidden = false;
  chooseDiagramToggleButton?.setAttribute("aria-expanded", "true");
  syncDiagramPickerBrowseControlsUi();
  if (typeof positionDiagramPickerPanel === "function") {
    requestAnimationFrame(positionDiagramPickerPanel);
  }
}

function getLocalDiagramPickerUiState() {
  const folderName = browserDiagramSourceInfo.folderName || diagramsFolderHandle?.name || "";

  if (browserDiagramSourceInfo.activeSource === "folder") {
    return {
      hint: `Local diagrams from "${folderName}" are listed below.`,
      path: "",
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
      hint: "Choose a folder on this computer that contains diagram YAML files.",
      path: "",
      emptyText: "Local diagrams will appear here after you choose a folder.",
    };
  }

  if (!browserDiagramSourceInfo.permissionGranted) {
    return {
      hint: "Choose a folder on this computer that contains diagram YAML files.",
      path: "",
      emptyText: "Local diagrams will appear here after you choose a folder.",
    };
  }

  if (diagramCatalog.folderEntries.length === 0) {
    return {
      hint: `No readable .yaml diagrams were found in "${folderName}". Add diagram YAML files there or choose another folder.`,
      path: "",
      emptyText: `No readable .yaml diagrams were found in "${folderName}".`,
    };
  }

  return {
    hint: browserDiagramSourceInfo.activeSource === "folder"
      ? `Local diagrams from "${folderName}" are listed below.`
      : `Local diagrams from "${folderName}" are available here.`,
    path: "",
    emptyText: `No readable .yaml diagrams were found in "${folderName}".`,
  };
}

function getSharedDiagramPickerUiState() {
  const apiBaseUrl = browserDiagramSourceInfo.sharedApiBaseUrl || getSharedApiBaseUrl();

  if (!apiBaseUrl) {
    return {
      hint: "Shared diagrams are not configured for this copy yet.",
      path: "",
      emptyText: "Shared diagrams are unavailable in this copy.",
    };
  }

  if (!browserDiagramSourceInfo.sharedApiAvailable) {
    return {
      hint: browserDiagramSourceInfo.sharedApiError || "Shared diagrams are unavailable right now.",
      path: "",
      emptyText: "Shared diagrams could not be loaded.",
    };
  }

  return {
    hint: sharedDiagramUser
      ? ""
      : "Public shared diagrams are available below. Sign in by email to upload or manage your own diagrams.",
    path: "",
    emptyText: "No public shared diagrams are available yet.",
  };
}

function getSharedUserDisplayLabel() {
  return sharedDiagramUser?.email
    || readStoredSharedEmail()
    || sharedDiagramUser?.emailHint
    || "shared diagram user";
}

function setSharedSignedInText(element, userLabel, suffix = ".") {
  const strong = document.createElement("strong");
  strong.className = "shared-user-email";
  strong.textContent = userLabel;
  element.replaceChildren(
    document.createTextNode("Signed in as "),
    strong,
    document.createTextNode(suffix),
  );
}

function syncDiagramSourceUi() {
  return;
}

function shouldPromptForDiagramsFolderFromPrimaryButton() {
  return false;
}

function renderDiagramPickerList(listElement, entries, {
  source,
  emptyText,
  ownerActions = false,
  localActions = false,
  sharedActions = false,
} = {}) {
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
    const description = document.createElement("span");
    const updated = document.createElement("span");
    const actions = document.createElement("div");
    const selectDiagram = (event) => {
      event?.stopPropagation?.();
      activateDiagramSelection(source, entry.fileName, { layoutFlavor: diagramPickerLayoutFlavor });
    };

    li.className = "diagram-picker-item";
    card.className = "diagram-picker-card";
    button.type = "button";
    button.className = "diagram-picker-select";
    card.classList.toggle("is-active", browserDiagramSourceInfo.activeSource === source && entry.fileName === selectedDiagramPath);
    title.className = "diagram-picker-title";
    description.className = "diagram-picker-description";
    updated.className = "diagram-picker-updated";
    actions.className = "diagram-picker-card-actions";
    setDashboardTextContent(title, entry.title);
    setDashboardTextContent(description, entry.description || "");
    setDiagramUpdatedElement(updated, entry);
    title.title = getDashboardTooltipText(entry.title);
    description.title = getDashboardTooltipText(entry.description || "");
    button.append(title);
    if (entry.description) {
      button.append(description);
    }
    if (!updated.hidden) {
      button.append(updated);
    }
    button.addEventListener("click", selectDiagram);
    card.addEventListener("click", (event) => {
      if (event.target.closest(".diagram-picker-card-actions")) {
        return;
      }

      selectDiagram(event);
    });

    if (sharedActions && entry.sharedId) {
      const downloadButton = document.createElement("button");

      downloadButton.type = "button";
      downloadButton.className = "diagram-picker-mini-action diagram-picker-icon-action";
      downloadButton.textContent = "\u2193";
      downloadButton.title = "Download to Local Diagrams";
      downloadButton.setAttribute("aria-label", `Download ${entry.title || entry.displayFileName || entry.fileName}`);
      downloadButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void downloadSharedDiagramEntry(entry);
      });
      actions.append(downloadButton);
    }

    if (ownerActions && entry.isOwner) {
      const editButton = document.createElement("button");
      const deleteButton = document.createElement("button");

      editButton.type = "button";
      editButton.className = "diagram-picker-mini-action";
      editButton.textContent = "Edit";
      deleteButton.type = "button";
      deleteButton.className = "diagram-picker-mini-action";
      deleteButton.textContent = "Delete";
      editButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openSharedDiagramEditor(entry);
      });
      deleteButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void deleteSharedDiagramEntry(entry);
      });
      actions.append(editButton, deleteButton);
    }

    if (localActions && entry.fileHandle) {
      const uploadButton = document.createElement("button");
      const editButton = document.createElement("button");

      uploadButton.type = "button";
      uploadButton.className = "diagram-picker-mini-action diagram-picker-icon-action";
      uploadButton.textContent = "\u2191";
      uploadButton.title = "Upload to Shared Diagrams";
      uploadButton.setAttribute("aria-label", `Upload ${entry.title || entry.fileName}`);
      editButton.type = "button";
      editButton.className = "diagram-picker-mini-action";
      editButton.textContent = "Edit";
      uploadButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void uploadLocalDiagramEntry(entry);
      });
      editButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openLocalDiagramEditor(entry);
      });
      actions.append(uploadButton, editButton);
    }

    card.append(button);
    if (actions.childElementCount > 0) {
      card.append(actions);
    }
    li.append(card);
    listElement.append(li);
  });
}

function renderDiagramPicker() {
  if (!diagramPicker) {
    return;
  }

  syncDiagramSourceUi();
  syncDiagramPickerBrowseControlsUi();

  const localState = getLocalDiagramPickerUiState();
  const sharedState = getSharedDiagramPickerUiState();
  const localEntries = filterAndSortDiagramCatalogEntries(diagramCatalog.folderEntries || []);
  const sharedEntries = filterAndSortDiagramCatalogEntries(diagramCatalog.sharedEntries || []);
  const mySharedEntries = filterAndSortDiagramCatalogEntries(diagramCatalog.mySharedEntries || []);
  const normalizedSearchQuery = diagramPickerSearchQuery.trim();
  const localEmptyText = normalizedSearchQuery
    ? `No local diagrams matched "${normalizedSearchQuery}".`
    : localState.emptyText;
  const sharedEmptyText = normalizedSearchQuery
    ? `No shared diagrams matched "${normalizedSearchQuery}".`
    : sharedState.emptyText;
  const mySharedEmptyText = normalizedSearchQuery
    ? `No owned shared diagrams matched "${normalizedSearchQuery}".`
    : "You have not uploaded any shared diagrams yet.";

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

  const sharedApiConfigured = isSharedDiagramApiConfigured();

  if (diagramPickerSharedHint) {
    diagramPickerSharedHint.textContent = sharedState.hint;
    diagramPickerSharedHint.hidden = !sharedState.hint;
  }

  if (diagramPickerSharedPath) {
    diagramPickerSharedPath.textContent = sharedState.path || "";
    diagramPickerSharedPath.hidden = !sharedState.path;
  }

  if (sharedAuthPanel) {
    sharedAuthPanel.hidden = !sharedApiConfigured;
  }

  if (sharedAuthSignedOut) {
    sharedAuthSignedOut.hidden = !sharedApiConfigured || Boolean(sharedDiagramUser);
  }

  if (sharedAuthSignedIn) {
    sharedAuthSignedIn.hidden = !sharedApiConfigured || !sharedDiagramUser;
  }

  if (sharedAuthUser) {
    const sharedUserLabel = getSharedUserDisplayLabel();
    if (sharedDiagramUser) {
      setSharedSignedInText(sharedAuthUser, sharedUserLabel);
    } else {
      sharedAuthUser.textContent = "";
    }
  }

  [sharedAuthEmailInput, sharedAuthCodeInput, sharedAuthSendLinkButton, sharedAuthVerifyCodeButton].forEach((element) => {
    if (element) {
      element.disabled = !sharedApiConfigured;
    }
  });

  if (sharedDiagramNewButton) {
    sharedDiagramNewButton.hidden = !sharedDiagramUser;
  }

  if (sharedMyDiagrams) {
    sharedMyDiagrams.hidden = !sharedDiagramUser;
  }

  renderDiagramPickerList(diagramPickerSharedList, sharedEntries, {
    source: "shared",
    emptyText: sharedEmptyText,
    sharedActions: true,
  });
  renderDiagramPickerList(diagramPickerMyList, mySharedEntries, {
    source: "shared",
    emptyText: mySharedEmptyText,
    ownerActions: true,
    sharedActions: true,
  });
  renderDiagramPickerList(diagramPickerLocalList, localEntries, {
    source: "folder",
    emptyText: localEmptyText,
    localActions: true,
  });

  if (!diagramPicker.hidden && typeof positionDiagramPickerPanel === "function") {
    requestAnimationFrame(positionDiagramPickerPanel);
  }
}

function syncDiagramUiAvailability() {
  const diagramButtons = [
    undoActionButton,
    redoActionButton,
    referencesToggleButton,
    measureToggleButton,
    hideToggleButton,
    moveToggleButton,
    editConfigButton,
    resetConfigButton,
    collapseConfigButton,
    expandConfigButton,
    resetViewButton,
  ];

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
      : "Choose a shared diagram or pick a local folder that contains diagram YAML files.";
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

function handleDiagramSelectionPopState() {
  const urlDiagramSelection = readUrlDiagramSelection();
  const sourceFromUrl = resolveSourceForUrlDiagramSelection({
    folderEntries: diagramCatalog.folderEntries,
    sharedEntries: diagramCatalog.sharedEntries,
  }, urlDiagramSelection);

  let nextSource = sourceFromUrl;

  if (!nextSource) {
    nextSource = normalizeDiagramSelectionSource(browserDiagramSourceInfo.activeSource);
  }

  if (!getDiagramEntriesForSource(nextSource).length) {
    nextSource = ["shared", "folder"]
      .find((candidate) => getDiagramEntriesForSource(candidate).length) || null;
  }

  if (!nextSource || !getDiagramEntriesForSource(nextSource).length) {
    return;
  }

  activateDiagramSelection(nextSource, urlDiagramSelection.path, {
    layoutFlavor: "saved",
    historyMode: "replace",
  });
}

async function bootstrapConfig() {
  await consumeSharedAuthTokenFromUrl();
  diagramCatalog = await loadDiagramCatalog();
  diagramsFolderHandle = diagramCatalog.folderHandle;
  browserDiagramSourceInfo = diagramCatalog.browserSourceInfo || createBrowserDiagramSourceInfo();
  ({ config, hasLoadedDiagramSource, selectedDiagramPath } = loadInitialConfig(diagramCatalog));
  hasInteractiveDiagram = config.states.length > 0;

  if (selectedDiagramPath) {
    storeSelectedDiagramPath(selectedDiagramPath);
  }

  storageKey = `${APP_CONFIG.storage.stateKeyPrefix}${config.meta.id}-v${APP_CONFIG.storage.stateVersion}`;
  syncUrlDiagramSelection(selectedDiagramPath, browserDiagramSourceInfo.activeSource, { historyMode: "replace" });
  syncDocumentTitle();
  renderHomePanel();
}

const appBootstrapPromise = bootstrapConfig();

window.addEventListener("popstate", () => {
  void appBootstrapPromise.then(() => {
    handleDiagramSelectionPopState();
  });
});
