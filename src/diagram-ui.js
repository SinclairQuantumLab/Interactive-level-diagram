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

const LAYOUT_EXPORT_VERSION = 3;

function buildSerializableState() {
  return {
    version: LAYOUT_EXPORT_VERSION,
    appVersion: APP_CONFIG.ui.appVersion || "",
    expandedFine: Array.from(expandedFine),
    expandedHyperfine: Array.from(expandedHyperfine),
    pinnedPanels: pinnedPanels.map(serializePinnedPanelEntry),
    theme: currentTheme,
    referencesVisible: currentReferencesVisible,
    measureToolEnabled: currentMeasureToolEnabled,
    hideToolEnabled: currentHideToolEnabled,
    measureSelection: currentMeasureSelection,
    measurements: currentMeasurements.map(serializeMeasurementEntry).filter(Boolean),
    hiddenStates: Array.from(hiddenStateKeys),
    hiddenTransitions: Array.from(hiddenTransitionIds)
      .map(serializeHiddenTransitionEntry)
      .filter(Boolean),
    controls: {
      hyperfineScaleByFineState: currentHyperfineScaleByFineState,
      transitionLabels: serializeTransitionControlEntries(),
      bFieldEnabled: currentBFieldEnabled,
      bFieldVisualScale: currentBFieldVisualScale,
      bFieldGauss: currentBFieldGauss,
      bFieldGaussMin: currentBFieldGaussMin,
      bFieldGaussMax: currentBFieldGaussMax,
    },
    zoom: {
      x: currentZoomTransform.x,
      y: currentZoomTransform.y,
      k: currentZoomTransform.k,
    },
  };
}

function serializeState() {
  const stateObject = buildSerializableState();

  if (typeof window.jsyaml?.dump !== "function") {
    throw new Error("YAML serializer is unavailable.");
  }

  return window.jsyaml.dump(stateObject, {
    noRefs: true,
    lineWidth: -1,
    flowLevel: 3,
    sortKeys: false,
  });
}

function parseSerializedState(raw) {
  const text = String(raw || "").trim();

  if (!text) {
    return null;
  }

  if (typeof window.jsyaml?.load === "function") {
    return window.jsyaml.load(text);
  }

  throw new Error("YAML parser is unavailable.");
}

const ACTION_TOAST_LIFETIME_MS = 3200;
const ACTION_TOAST_FADE_MS = 220;
const MAX_ACTION_TOASTS = 4;
let nextActionToastId = 1;
const actionToastTimers = new Map();

function removeActionToast(toastId) {
  const toastElement = actionStack?.querySelector(`[data-action-toast-id="${toastId}"]`);

  if (!toastElement) {
    return;
  }

  const existingTimer = actionToastTimers.get(toastId);

  if (existingTimer) {
    window.clearTimeout(existingTimer);
    actionToastTimers.delete(toastId);
  }

  if (toastElement.classList.contains("is-leaving")) {
    return;
  }

  toastElement.classList.add("is-leaving");
  window.setTimeout(() => {
    toastElement.remove();
  }, ACTION_TOAST_FADE_MS);
}

function showActionToast(message) {
  if (!actionStack) {
    return;
  }

  const normalizedMessage = String(message || "").trim();

  if (!normalizedMessage) {
    return;
  }

  const toastId = nextActionToastId;
  nextActionToastId += 1;

  const toast = document.createElement("section");
  toast.className = "action-toast";
  toast.dataset.actionToastId = String(toastId);

  const main = document.createElement("div");
  main.className = "action-toast-main";

  const title = document.createElement("p");
  title.className = "action-toast-title";
  title.textContent = "Action";

  const body = document.createElement("p");
  body.className = "action-toast-message";
  body.textContent = normalizedMessage;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "action-toast-close";
  closeButton.setAttribute("aria-label", "Close action message");
  closeButton.textContent = "x";
  closeButton.addEventListener("click", () => removeActionToast(toastId));

  main.append(title, body);
  toast.append(main, closeButton);
  actionStack.append(toast);

  const activeToasts = [...actionStack.children].filter((entry) => !entry.classList.contains("is-leaving"));

  if (activeToasts.length > MAX_ACTION_TOASTS) {
    removeActionToast(activeToasts[0].dataset.actionToastId);
  }

  const timerId = window.setTimeout(() => {
    actionToastTimers.delete(toastId);
    removeActionToast(toastId);
  }, ACTION_TOAST_LIFETIME_MS);
  actionToastTimers.set(toastId, timerId);
}

function setStatus(message) {
  showActionToast(message);
}

function trimHistoryStack(stack) {
  if (stack.length > MAX_HISTORY_ENTRIES) {
    stack.splice(0, stack.length - MAX_HISTORY_ENTRIES);
  }
}

function updateHistoryButtons() {
  if (undoActionButton) {
    undoActionButton.disabled = !hasInteractiveDiagram || undoHistory.length === 0;
  }

  if (redoActionButton) {
    redoActionButton.disabled = !hasInteractiveDiagram || redoHistory.length === 0;
  }
}

function setHistorySnapshot(serialized) {
  currentHistorySnapshot = serialized || serializeState();
  updateHistoryButtons();
}

function initializeHistoryState() {
  undoHistory = [];
  redoHistory = [];
  setHistorySnapshot(serializeState());
}

function recordHistorySnapshot(serialized) {
  if (!serialized) {
    return;
  }

  if (!currentHistorySnapshot) {
    setHistorySnapshot(serialized);
    return;
  }

  if (serialized === currentHistorySnapshot) {
    updateHistoryButtons();
    return;
  }

  undoHistory.push(currentHistorySnapshot);
  trimHistoryStack(undoHistory);
  redoHistory = [];
  currentHistorySnapshot = serialized;
  updateHistoryButtons();
}

function restoreHistoryState(serialized, { statusMessage } = {}) {
  if (!serialized) {
    return;
  }

  applyStateObject(parseSerializedState(serialized), {
    animationDuration: CONTROL_ANIMATION_MS,
    persist: false,
  });
  persistState({ recordHistory: false, announce: false });

  if (statusMessage) {
    setStatus(statusMessage);
  }
}

function undoStateChange() {
  if (undoHistory.length === 0) {
    return;
  }

  const target = undoHistory.pop();
  const currentSerialized = currentHistorySnapshot || serializeState();

  if (currentSerialized) {
    redoHistory.push(currentSerialized);
    trimHistoryStack(redoHistory);
  }

  restoreHistoryState(target, { statusMessage: "Undid the last layout change." });
}

function redoStateChange() {
  if (redoHistory.length === 0) {
    return;
  }

  const target = redoHistory.pop();
  const currentSerialized = currentHistorySnapshot || serializeState();

  if (currentSerialized) {
    undoHistory.push(currentSerialized);
    trimHistoryStack(undoHistory);
  }

  restoreHistoryState(target, { statusMessage: "Redid the last layout change." });
}

function renderDiagramIssues() {
  if (!issueStack) {
    return;
  }

  issueStack.innerHTML = "";

  currentDiagramIssues
    .filter((issue) => issue && issue.key && !dismissedDiagramIssueKeys.has(issue.key))
    .forEach((issue) => {
      const toast = document.createElement("section");
      toast.className = "issue-toast";
      toast.dataset.issueKey = issue.key;

      const main = document.createElement("div");
      main.className = "issue-toast-main";

      const title = document.createElement("p");
      title.className = "issue-toast-title";
      title.textContent = issue.title || "Diagram error";

      const message = document.createElement("p");
      message.className = "issue-toast-message";
      message.textContent = issue.message || "";

      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "issue-toast-close";
      closeButton.setAttribute("aria-label", "Close error message");
      closeButton.textContent = "x";
      closeButton.addEventListener("click", () => {
        dismissedDiagramIssueKeys.add(issue.key);
        renderDiagramIssues();
      });

      main.append(title, message);
      toast.append(main, closeButton);
      issueStack.append(toast);
    });
}

function setDiagramIssues(issues, { resetDismissed = false } = {}) {
  currentDiagramIssues = Array.isArray(issues) ? issues : [];

  if (resetDismissed) {
    dismissedDiagramIssueKeys = new Set();
  }

  renderDiagramIssues();
}

function renderMetadataRows(container, rows) {
  container.innerHTML = "";

  rows.forEach((row) => {
    container.append(buildMetadataEntryFragment(row));
  });
}

function buildMetadataFragment(rows, options = {}) {
  const fragment = document.createDocumentFragment();

  rows.forEach((row) => {
    fragment.append(buildMetadataEntryFragment(row, options));
  });

  return fragment;
}

function normalizeMetadataRow(row) {
  if (row?.type === "section") {
    return {
      type: "section",
      title: row?.title || "",
      label: "",
      value: "",
      references: [],
      selector: null,
      editor: null,
    };
  }

  if (Array.isArray(row)) {
    return {
      type: "entry",
      label: row[0],
      value: row[1],
      references: Array.isArray(row[2]) ? row[2] : [],
      selector: null,
      editor: null,
    };
  }

  return {
    type: "entry",
    label: row?.label || "",
    value: row?.value ?? "",
    references: Array.isArray(row?.references) ? row.references : [],
    selector: row?.selector || null,
    editor: row?.editor || null,
  };
}

function updateTransitionLabelFieldSelection(transitionId, fieldKey, enabled) {
  const normalizedTransitionId = String(transitionId || "").trim();
  const normalizedFieldKey = String(fieldKey || "").trim();

  if (!normalizedTransitionId || !normalizedFieldKey) {
    return;
  }

  const currentFields = resolveTransitionLabelFields(normalizedTransitionId, ["wavelength"]);
  const nextFieldSet = new Set(currentFields);

  if (enabled) {
    nextFieldSet.add(normalizedFieldKey);
  } else {
    nextFieldSet.delete(normalizedFieldKey);
  }

  currentTransitionLabelFieldsById[normalizedTransitionId] = [...nextFieldSet];
  render(CONTROL_ANIMATION_MS, { skipPinnedPanels: true });
  persistState();
}

function updateTransitionLabelPrecision(transitionId, key, rawValue) {
  const normalizedTransitionId = String(transitionId || "").trim();
  const normalizedKey = String(key || "").trim();

  if (!normalizedTransitionId || !normalizedKey) {
    return;
  }

  const parsedValue = rawValue === "" ? null : Number(rawValue);
  const normalizedValue = Number.isFinite(parsedValue)
    ? clamp(Math.round(parsedValue), 0, 12)
    : null;
  const currentValue = currentTransitionLabelPrecisionById[normalizedTransitionId] || {
    wavelength: null,
    frequency: null,
  };

  currentTransitionLabelPrecisionById[normalizedTransitionId] = {
    ...currentValue,
    [normalizedKey]: normalizedValue,
  };
  render(CONTROL_ANIMATION_MS, { skipPinnedPanels: true });
  persistState();
}

function getMeasurementEntryById(measurementId) {
  return currentMeasurements.find((entry) => normalizeMeasurementEntry(entry)?.id === measurementId) || null;
}

function getMeasurementNodeById(measurementId) {
  const normalizedMeasurementId = String(measurementId || "").trim();

  if (!normalizedMeasurementId || !currentLayout?.measurementNodeMap) {
    return null;
  }

  return currentLayout.measurementNodeMap.get(normalizedMeasurementId) || null;
}

function getSelectedMeasurementLabelFieldsForNode(node, fallback = []) {
  if (!node) {
    return Array.isArray(fallback) ? [...fallback] : [];
  }

  return Array.isArray(node.labelFields)
    ? [...node.labelFields]
    : [];
}

function resolveMeasurementLabelFields(measurementId, fallback = []) {
  const measurement = normalizeMeasurementEntry(
    getMeasurementEntryById(String(measurementId || "").trim()),
  );

  if (!measurement) {
    return Array.isArray(fallback) ? [...fallback] : [];
  }

  return Array.isArray(measurement.labelFields)
    ? [...measurement.labelFields]
    : (Array.isArray(fallback) ? [...fallback] : []);
}

function updateMeasurementEntry(measurementId, updater, { rerenderPanels = false, commitHistory = true } = {}) {
  const normalizedMeasurementId = String(measurementId || "").trim();

  if (!normalizedMeasurementId) {
    return;
  }

  let didUpdate = false;
  currentMeasurements = currentMeasurements.map((entry) => {
    const normalizedEntry = normalizeMeasurementEntry(entry);

    if (!normalizedEntry || normalizedEntry.id !== normalizedMeasurementId) {
      return entry;
    }

    const nextEntry = updater({ ...normalizedEntry });
    didUpdate = true;
    return normalizeMeasurementEntry(nextEntry) || normalizedEntry;
  });

  if (!didUpdate) {
    return;
  }

  render(CONTROL_ANIMATION_MS, { skipPinnedPanels: !rerenderPanels });

  if (commitHistory) {
    persistState();
  } else {
    persistState({ recordHistory: false, announce: false, preserveHistorySnapshot: true });
  }

  if (rerenderPanels) {
    renderPinnedPanels();
  }
}

function updateMeasurementLabelFieldSelection(measurementId, fieldKey, enabled) {
  const normalizedFieldKey = String(fieldKey || "").trim().toLowerCase();
  const measurementNode = getMeasurementNodeById(measurementId);
  const canonicalFieldKey = measurementNode
    ? getMeasurementCanonicalFieldKey(measurementNode, normalizedFieldKey)
    : normalizedFieldKey;

  if (!canonicalFieldKey) {
    return;
  }

  updateMeasurementEntry(measurementId, (entry) => {
    const nextFieldSet = new Set(
      measurementNode
        ? getSelectedMeasurementLabelFieldsForNode(measurementNode, [])
        : resolveMeasurementLabelFields(entry.id, []),
    );

    if (enabled) {
      nextFieldSet.add(canonicalFieldKey);
    } else {
      nextFieldSet.delete(canonicalFieldKey);
    }

    entry.labelFields = [...nextFieldSet];
    return entry;
  }, {
    rerenderPanels: true,
  });
}

function updateMeasurementLabelPrecision(measurementId, key, rawValue) {
  const normalizedKey = String(key || "").trim().toLowerCase();
  const measurementNode = getMeasurementNodeById(measurementId);
  const canonicalKey = measurementNode
    ? getMeasurementCanonicalFieldKey(measurementNode, normalizedKey)
    : normalizedKey;

  if (!canonicalKey) {
    return;
  }

  const parsedValue = rawValue === "" ? null : Number(rawValue);
  const normalizedValue = Number.isFinite(parsedValue)
    ? clamp(Math.round(parsedValue), 0, 12)
    : null;

  updateMeasurementEntry(measurementId, (entry) => {
    const nextPrecision = {
      ...(entry.precision || {}),
    };
    const precisionLookupKeys = measurementNode
      ? getMeasurementPrecisionLookupKeys(measurementNode, canonicalKey)
      : [canonicalKey];

    precisionLookupKeys.forEach((precisionKey) => {
      delete nextPrecision[precisionKey];
    });
    nextPrecision[canonicalKey] = normalizedValue;
    entry.precision = nextPrecision;
    return entry;
  });
}

function updateMeasurementNote(measurementId, noteIndex, noteText, { commitHistory = false } = {}) {
  updateMeasurementEntry(measurementId, (entry) => {
    const notes = Array.isArray(entry.notes) ? [...entry.notes] : [];
    notes[noteIndex] = String(noteText ?? "");
    entry.notes = notes;
    return entry;
  }, {
    rerenderPanels: false,
    commitHistory,
  });
}

function insertMeasurementNote(measurementId, insertIndex) {
  updateMeasurementEntry(measurementId, (entry) => {
    const notes = Array.isArray(entry.notes) ? [...entry.notes] : [];
    const normalizedIndex = clamp(Number.isFinite(insertIndex) ? insertIndex : notes.length, 0, notes.length);
    notes.splice(normalizedIndex, 0, "");
    entry.notes = notes;
    entry.labelFields = resolveMeasurementLabelFields(entry.id, [])
      .map((fieldKey) => {
        const noteMatch = String(fieldKey || "").trim().match(/^note:(\d+)$/);

        if (!noteMatch) {
          return fieldKey;
        }

        const currentIndex = Number.parseInt(noteMatch[1], 10);
        return currentIndex >= normalizedIndex ? `note:${currentIndex + 1}` : fieldKey;
      });
    return entry;
  }, {
    rerenderPanels: true,
  });
}

function removeMeasurementNote(measurementId, noteIndex) {
  updateMeasurementEntry(measurementId, (entry) => {
    const notes = Array.isArray(entry.notes) ? [...entry.notes] : [];
    notes.splice(noteIndex, 1);
    entry.notes = notes;
    entry.labelFields = resolveMeasurementLabelFields(entry.id, [])
      .flatMap((fieldKey) => {
        const noteMatch = String(fieldKey || "").trim().match(/^note:(\d+)$/);

        if (!noteMatch) {
          return [fieldKey];
        }

        const currentIndex = Number.parseInt(noteMatch[1], 10);

        if (currentIndex === noteIndex) {
          return [];
        }

        if (currentIndex > noteIndex) {
          return [`note:${currentIndex - 1}`];
        }

        return [fieldKey];
      });
    return entry;
  }, {
    rerenderPanels: true,
  });
}

function createMeasurementEditToggleButton(panel) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "inspector-icon-button";
  button.setAttribute("aria-label", panel.editMeasurementNotes ? "Hide note controls" : "Show note controls");
  button.setAttribute("title", panel.editMeasurementNotes ? "Hide note controls" : "Show note controls");
  button.setAttribute("aria-pressed", panel.editMeasurementNotes ? "true" : "false");
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 3.5h8l4 4V20.5H6z"></path>
      <path d="M14 3.5v4h4"></path>
      <path d="M9 12h6"></path>
      <path d="M9 15h6"></path>
    </svg>
  `;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    panel.editMeasurementNotes = !panel.editMeasurementNotes;
    renderPinnedPanels();
  });
  return button;
}

function isMetadataSelectorEnabled(selector) {
  if (selector?.transitionId && selector?.fieldKey) {
    return resolveTransitionLabelFields(selector.transitionId, ["wavelength"])
      .includes(selector.fieldKey);
  }

  if (selector?.measurementId && selector?.fieldKey) {
    const measurementNode = getMeasurementNodeById(selector.measurementId);
    const activeFields = new Set(getSelectedMeasurementLabelFieldsForNode(measurementNode, []));
    const candidateFieldKey = measurementNode
      ? getMeasurementCanonicalFieldKey(measurementNode, selector.fieldKey)
      : String(selector.fieldKey || "").trim().toLowerCase();

    return activeFields.has(candidateFieldKey);
  }

  return false;
}

function updateMetadataSelectorSelection(selector, enabled) {
  if (selector?.transitionId && selector?.fieldKey) {
    updateTransitionLabelFieldSelection(selector.transitionId, selector.fieldKey, enabled);
    return;
  }

  if (selector?.measurementId && selector?.fieldKey) {
    updateMeasurementLabelFieldSelection(selector.measurementId, selector.fieldKey, enabled);
  }
}

function createTransitionVisibilityToggleButton(panel) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "inspector-icon-button";
  button.setAttribute("aria-label", panel.showTransitionLabelSelectors ? "Hide transition label controls" : "Show transition label controls");
  button.setAttribute("title", panel.showTransitionLabelSelectors ? "Hide transition label controls" : "Show transition label controls");
  button.setAttribute("aria-pressed", panel.showTransitionLabelSelectors ? "true" : "false");
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M1.5 12s3.6-6 10.5-6 10.5 6 10.5 6-3.6 6-10.5 6S1.5 12 1.5 12z"></path>
      <circle cx="12" cy="12" r="3.2"></circle>
    </svg>
  `;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    panel.showTransitionLabelSelectors = !panel.showTransitionLabelSelectors;
    renderPinnedPanels();
  });
  return button;
}

function createMeasurementVisibilityToggleButton(panel) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "inspector-icon-button";
  button.setAttribute("aria-label", panel.showMeasurementLabelSelectors ? "Hide measurement label controls" : "Show measurement label controls");
  button.setAttribute("title", panel.showMeasurementLabelSelectors ? "Hide measurement label controls" : "Show measurement label controls");
  button.setAttribute("aria-pressed", panel.showMeasurementLabelSelectors ? "true" : "false");
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M1.5 12s3.6-6 10.5-6 10.5 6 10.5 6-3.6 6-10.5 6S1.5 12 1.5 12z"></path>
      <circle cx="12" cy="12" r="3.2"></circle>
    </svg>
  `;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    panel.showMeasurementLabelSelectors = !panel.showMeasurementLabelSelectors;
    renderPinnedPanels();
  });
  return button;
}

function buildTransitionLabelPrecisionControls(node) {
  const controlCard = document.createElement("div");
  controlCard.className = "inspector-control-card";

  const controlHeader = document.createElement("div");
  controlHeader.className = "hyperfine-scale-header";

  const controlTitle = document.createElement("strong");
  controlTitle.textContent = "Label decimals";

  const controlValue = document.createElement("span");
  controlValue.textContent = "Blank = full";

  const fields = document.createElement("div");
  fields.className = "precision-input-grid";

  const precision = currentTransitionLabelPrecisionById[node.id] || { wavelength: null, frequency: null };

  [
    ["wavelength", "Wavelength"],
    ["frequency", "Frequency"],
  ].forEach(([key, labelText]) => {
    const label = document.createElement("label");
    label.className = "precision-input";

    const span = document.createElement("span");
    span.textContent = labelText;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "12";
    input.step = "1";
    input.placeholder = "full";
    input.value = Number.isFinite(precision[key]) ? String(precision[key]) : "";
    input.addEventListener("change", () => updateTransitionLabelPrecision(node.id, key, input.value));

    label.append(span, input);
    fields.append(label);
  });

  controlHeader.append(controlTitle, controlValue);
  controlCard.append(controlHeader, fields);
  return controlCard;
}

function getVisibleMeasurementSectionFormatFields(node, sectionId) {
  const activeFields = new Set(getSelectedMeasurementLabelFieldsForNode(node, []));
  const section = getMeasurementSectionDefinitions(node).sections
    .find((candidate) => candidate.id === sectionId);

  if (!section) {
    return [];
  }

  return section.fields.filter((field) => activeFields.has(field.key));
}

function buildMeasurementSectionFormatEditorFragment(editor) {
  const node = getMeasurementNodeById(editor?.measurementId);

  if (!node) {
    return null;
  }

  const visibleFields = getVisibleMeasurementSectionFormatFields(node, editor?.sectionId);

  if (visibleFields.length === 0) {
    return null;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "precision-input-grid";

  visibleFields.forEach((field) => {
    const precisionInputRow = document.createElement("label");
    precisionInputRow.className = "precision-input";

    const precisionLabel = document.createElement("span");
    precisionLabel.textContent = field.label;

    const precisionInput = document.createElement("input");
    precisionInput.type = "number";
    precisionInput.min = "0";
    precisionInput.max = "12";
    precisionInput.step = "1";
    precisionInput.placeholder = "full";
    precisionInput.value = Number.isFinite(getMeasurementFieldPrecisionValue(node, field.key))
      ? String(getMeasurementFieldPrecisionValue(node, field.key))
      : "";
    precisionInput.addEventListener("change", () => updateMeasurementLabelPrecision(node.id, field.key, precisionInput.value));

    precisionInputRow.append(precisionLabel, precisionInput);
    wrapper.append(precisionInputRow);
  });

  return wrapper;
}

function buildMeasurementNoteEditorFragment(editor) {
  const wrapper = document.createElement("div");
  wrapper.className = "note-editor-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "note-editor-input";
  input.placeholder = "Add note";

  const measurement = getMeasurementEntryById(editor.measurementId);
  const notes = Array.isArray(measurement?.notes) ? measurement.notes : [];
  input.value = String(notes[editor.noteIndex] ?? "");
  input.addEventListener("input", () => updateMeasurementNote(editor.measurementId, editor.noteIndex, input.value, { commitHistory: false }));
  input.addEventListener("change", () => {
    updateMeasurementNote(editor.measurementId, editor.noteIndex, input.value, { commitHistory: true });
    renderPinnedPanels();
  });

  const buttonGroup = document.createElement("div");
  buttonGroup.className = "note-editor-actions";

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "note-editor-action";
  addButton.setAttribute("aria-label", `Add note after ${Math.max(1, (editor.noteIndex ?? 0) + 1)}`);
  addButton.setAttribute("title", `Add note after ${Math.max(1, (editor.noteIndex ?? 0) + 1)}`);
  addButton.textContent = "+";
  addButton.addEventListener("click", () => insertMeasurementNote(editor.measurementId, (editor.noteIndex ?? 0) + (editor.isEmptyPlaceholder ? 0 : 1)));

  buttonGroup.append(addButton);

  if (!editor.isEmptyPlaceholder) {
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "note-editor-action";
    removeButton.setAttribute("aria-label", `Delete note ${Math.max(1, (editor.noteIndex ?? 0) + 1)}`);
    removeButton.setAttribute("title", `Delete note ${Math.max(1, (editor.noteIndex ?? 0) + 1)}`);
    removeButton.textContent = "-";
    removeButton.addEventListener("click", () => removeMeasurementNote(editor.measurementId, editor.noteIndex));
    buttonGroup.append(removeButton);
  }

  wrapper.append(input, buttonGroup);
  return wrapper;
}

function buildMetadataValueFragment(value, referenceKeys) {
  const fragment = document.createDocumentFragment();
  const normalizedLines = Array.isArray(value)
    ? value
    : (typeof value === "string" && value.includes("\n")
      ? value.split("\n")
      : [value]);
  const valueContainer = document.createElement("span");
  valueContainer.className = normalizedLines.length > 1 ? "metadata-value-lines" : "metadata-value-inline";

  normalizedLines.forEach((line) => {
    const valueSpan = document.createElement("span");
    valueSpan.className = "metadata-value-line";
    setMixedTextContent(valueSpan, line);
    valueContainer.append(valueSpan);
  });

  fragment.append(valueContainer);

  const mergedReferenceKeys = uniqueReferenceKeys([
    ...(referenceKeys || []),
    ...normalizedLines.flatMap((line) => extractInlineCitationKeys(line)),
  ]);

  if (mergedReferenceKeys.length > 0) {
    const citations = document.createElement("sup");
    citations.className = "citation-cluster";

    mergedReferenceKeys.forEach((referenceKey) => {
      const reference = getReferenceEntry(referenceKey);

      if (!reference) {
        return;
      }

      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "citation-chip";
      chip.textContent = reference.key;
      chip.addEventListener("mouseenter", (event) => {
        event.stopPropagation();
        showReferenceTooltip(event, reference.key);
      });
      chip.addEventListener("mousemove", (event) => moveTooltip(event));
      chip.addEventListener("mouseleave", hideTooltip);
      chip.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openReferenceLink(reference);
      });
      chip.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        pinInspector(event, "reference", reference.key);
      });
      citations.append(chip);
    });

    if (citations.childElementCount > 0) {
      fragment.append(citations);
    }
  }

  return fragment;
}

function buildMetadataEntryFragment(row, options = {}) {
  const normalized = normalizeMetadataRow(row);
  const fragment = document.createDocumentFragment();

  if (normalized.type === "section") {
    const heading = document.createElement("div");
    heading.className = "metadata-section-heading";
    setMixedTextContent(heading, normalized.title);
    fragment.append(heading);
    return fragment;
  }

  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  const showSelectors = Boolean(options.showSelectors);
  const showEditors = Boolean(options.showEditors);
  const normalizedLabelText = typeof normalized.label === "string" ? normalized.label.trim() : "";
  const isCompactNoteRow = /^Note(?:\s+\d+)?$/i.test(normalizedLabelText);
  const formatEditor = normalized.editor?.type === "measurement-format"
    ? buildMeasurementSectionFormatEditorFragment(normalized.editor)
    : null;

  if (normalized.editor?.type === "measurement-format" && !formatEditor) {
    return fragment;
  }

  if (normalized.label && typeof normalized.label === "object" && normalized.label.type === "subscript-token") {
    setSubscriptTokenContent(dt, normalized.label.base, normalized.label.subscript, normalized.label.suffix || "");
  } else {
    setMixedTextContent(dt, normalized.label);
  }

  const shouldShowSelector = showSelectors
    && normalized.selector?.fieldKey
    && (normalized.selector?.transitionId || normalized.selector?.measurementId);
  const shouldShowEditor = showEditors
    && normalized.editor?.type === "measurement-note";

  if (formatEditor) {
    dd.append(formatEditor);
    fragment.append(dt, dd);
    return fragment;
  }

  if (isCompactNoteRow) {
    dt.classList.add("metadata-label-hidden");
    dd.classList.add("metadata-span-all", "metadata-note-item");
  }

  if (shouldShowSelector || shouldShowEditor || isCompactNoteRow) {
    const valueRow = document.createElement("div");
    valueRow.className = "metadata-value-row";

    if (shouldShowEditor) {
      valueRow.classList.add("is-note-editor-row");
    }

    if (isCompactNoteRow) {
      valueRow.classList.add("is-note-bullet-row");
    }

    if (shouldShowEditor || isCompactNoteRow) {
      dt.classList.add("metadata-label-hidden");
      dd.classList.add("metadata-span-all");
    }

    if (shouldShowSelector) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "metadata-selector";
      checkbox.checked = isMetadataSelectorEnabled(normalized.selector);
      checkbox.addEventListener("change", () => {
        updateMetadataSelectorSelection(normalized.selector, checkbox.checked);
      });
      valueRow.append(checkbox);
    }

    if (isCompactNoteRow) {
      const bullet = document.createElement("span");
      bullet.className = "metadata-note-bullet";
      bullet.setAttribute("aria-hidden", "true");
      bullet.textContent = "•";
      valueRow.append(bullet);
    }

    if (shouldShowEditor) {
      valueRow.append(buildMeasurementNoteEditorFragment(normalized.editor));
    } else {
      valueRow.append(buildMetadataValueFragment(normalized.value, normalized.references));
    }
    dd.append(valueRow);
  } else {
    dd.append(buildMetadataValueFragment(normalized.value, normalized.references));
  }
  fragment.append(dt, dd);
  return fragment;
}

function renderTooltipControls(controlMarkup) {
  if (!tooltipControls) {
    return;
  }

  tooltipControls.innerHTML = "";

  if (!controlMarkup) {
    tooltipControls.hidden = true;
    return;
  }

  tooltipControls.hidden = false;
  tooltipControls.append(controlMarkup);
}

function applyTheme(themeName) {
  currentTheme = themeName === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
  document.documentElement.style.colorScheme = currentTheme;
  document.body?.setAttribute("data-theme", currentTheme);
  appShell?.setAttribute("data-theme", currentTheme);
  themeToggleButton.textContent = currentTheme === "dark" ? "Light Mode" : "Dark Mode";

  try {
    const themeStorageKey = APP_CONFIG.storage.themeKey || "level-diagram-theme";
    window.localStorage.setItem(themeStorageKey, currentTheme);
  } catch {
    return;
  }
}

function persistState({ recordHistory = true, announce = true, preserveHistorySnapshot = false } = {}) {
  const serialized = serializeState();

  if (diagramPickerPreviewActive) {
    return serialized;
  }

  if (recordHistory) {
    recordHistorySnapshot(serialized);
  } else if (preserveHistorySnapshot) {
    if (!currentHistorySnapshot) {
      setHistorySnapshot(serialized);
    } else {
      updateHistoryButtons();
    }
  } else {
    setHistorySnapshot(serialized);
  }

  try {
    window.localStorage.setItem(storageKey, serialized);

    if (announce) {
      setStatus("This browser will remember the current diagram layout.");
    }
  } catch {
    if (announce) {
      setStatus("Local saving is unavailable here, but copy/load layout still works.");
    }
  }

  return serialized;
}

function syncControlUI() {
  const fieldRangeMin = Math.min(currentBFieldGaussMin, currentBFieldGaussMax);
  const fieldRangeMax = Math.max(currentBFieldGaussMin, currentBFieldGaussMax);
  const fieldRangeSpan = Math.max(fieldRangeMax - fieldRangeMin, 1e-6);

  bFieldRange.min = "0";
  bFieldRange.max = "1";
  bFieldRange.step = "0.001";
  bFieldRange.value = String(visualScaleToSliderValue(currentBFieldVisualScale));
  bFieldRange.disabled = !hasInteractiveDiagram || !currentBFieldEnabled;
  bFieldGaussRange.min = String(fieldRangeMin);
  bFieldGaussRange.max = String(fieldRangeMax);
  bFieldGaussRange.step = String(Math.max(fieldRangeSpan / 1000, 0.001));
  bFieldGaussRange.value = String(clamp(currentBFieldGauss, fieldRangeMin, fieldRangeMax));
  bFieldGaussRange.disabled = !hasInteractiveDiagram || !currentBFieldEnabled;
  bFieldGaussMinInput.value = formatFieldScale(fieldRangeMin, 3);
  bFieldGaussMaxInput.value = formatFieldScale(fieldRangeMax, 3);
  bFieldGaussMinInput.disabled = !hasInteractiveDiagram;
  bFieldGaussMaxInput.disabled = !hasInteractiveDiagram;
  bFieldToggleButton.disabled = !hasInteractiveDiagram;
  bFieldValue.textContent = currentBFieldEnabled ? formatGauss(currentBFieldGauss, 3) : "Off";
  bFieldGaussValue.textContent = currentBFieldEnabled ? formatGauss(currentBFieldGauss, 3) : "Off";
  bFieldScaleValue.textContent = `${formatFieldScale(currentBFieldVisualScale, 2)}x`;
  bFieldToggleButton?.setAttribute("aria-expanded", currentBFieldEnabled ? "true" : "false");
  bFieldControls?.setAttribute("aria-hidden", (!hasInteractiveDiagram || !currentBFieldEnabled) ? "true" : "false");
  bFieldTitle?.closest(".control-panel")?.classList.toggle("is-disabled", !hasInteractiveDiagram || !currentBFieldEnabled);

  if (measureToggleButton) {
    measureToggleButton.setAttribute("aria-pressed", currentMeasureToolEnabled ? "true" : "false");
  }

  if (hideToggleButton) {
    hideToggleButton.setAttribute("aria-pressed", currentHideToolEnabled ? "true" : "false");
  }

  updateHistoryButtons();
}

function formatBibtexAuthorName(name) {
  const trimmed = name.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.includes(",")) {
    const [lastName, givenNames] = trimmed.split(",").map((part) => part.trim());
    const initials = givenNames
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => `${part.replace(/\./g, "").charAt(0)}.`)
      .join(" ");
    return `${initials} ${lastName}`.trim();
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0];
  }

  const lastName = parts.pop();
  const initials = parts.map((part) => `${part.replace(/\./g, "").charAt(0)}.`).join(" ");
  return `${initials} ${lastName}`.trim();
}

function formatBibtexAuthors(authorField) {
  const authors = String(authorField || "")
    .split(/\s+and\s+/i)
    .map(formatBibtexAuthorName)
    .filter(Boolean);

  if (authors.length === 0) {
    return "Unknown author";
  }

  if (authors.length === 1) {
    return authors[0];
  }

  if (authors.length === 2) {
    return `${authors[0]} and ${authors[1]}`;
  }

  return `${authors.slice(0, -1).join(", ")}, and ${authors[authors.length - 1]}`;
}

function buildReferenceVenueLine(reference) {
  const fields = reference.fields || {};
  const journal = fields.journal || fields.booktitle || "";
  const volume = fields.volume ? ` ${fields.volume}` : "";
  const pages = fields.pages ? `, ${fields.pages}` : "";
  const year = fields.year ? ` (${fields.year})` : "";
  const publisher = fields.publisher ? `${fields.publisher}${year}` : "";
  const howPublished = fields.howpublished || "";

  if (journal) {
    return `${journal}${volume}${pages}${year}.`;
  }

  if (publisher) {
    return `${publisher}.`;
  }

  if (howPublished) {
    return `${howPublished}${year}.`;
  }

  if (year) {
    return year.trim();
  }

  return "";
}

function getReferenceLink(reference) {
  const fields = reference.fields || {};

  if (fields.url) {
    return fields.url;
  }

  if (fields.doi) {
    return `https://doi.org/${fields.doi}`;
  }

  return "";
}

function openExternalUrl(url) {
  if (!url) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function openReferenceLink(reference) {
  const link = getReferenceLink(reference);

  if (!link) {
    return;
  }

  openExternalUrl(link);
}

function createReferenceCitationMarkup(reference, { linked = false } = {}) {
  const citation = document.createElement(linked ? "a" : "p");
  citation.className = "reference-entry-citation";

  const fields = reference.fields || {};
  const authors = document.createElement("span");
  authors.className = "reference-authors";
  authors.textContent = formatBibtexAuthors(fields.author);

  const title = document.createElement("span");
  title.className = "reference-title";
  title.textContent = fields.title || reference.key;

  const source = document.createElement("span");
  source.className = "reference-source";
  source.textContent = buildReferenceVenueLine(reference);

  if (linked) {
    const referenceLink = getReferenceLink(reference);

    if (referenceLink) {
      citation.href = referenceLink;
      citation.target = "_blank";
      citation.rel = "noreferrer noopener";
    } else {
      citation.href = "#";
      citation.addEventListener("click", (event) => event.preventDefault());
      citation.classList.add("is-disabled-link");
    }
  }

  citation.append(authors, document.createTextNode(", "), title);

  if (source.textContent) {
    citation.append(document.createTextNode(", "), source);
  } else {
    citation.append(document.createTextNode("."));
  }

  return citation;
}

function formatReferenceLineText(reference) {
  const fields = reference.fields || {};
  const parts = [
    formatBibtexAuthors(fields.author),
    fields.title || reference.key,
    buildReferenceVenueLine(reference).replace(/\.$/, ""),
  ].filter(Boolean);

  return `${parts.join(", ")}.`;
}

function showReferenceTooltip(event, referenceKey) {
  const reference = getReferenceEntry(referenceKey);

  if (!reference) {
    return;
  }

  showTooltip(
    event,
    "Reference",
    reference.key,
    formatReferenceLineText(reference),
    [],
  );

  tooltip.classList.add("is-reference-tooltip");
}

function buildReferenceListItem(reference) {
  const item = document.createElement("li");
  item.className = "reference-entry";
  item.dataset.referenceKey = reference.key;

  const keyButton = document.createElement("button");
  keyButton.type = "button";
  keyButton.className = "reference-key";
  keyButton.textContent = reference.key;

  const content = document.createElement("div");
  content.className = "reference-entry-body";
  content.append(createReferenceCitationMarkup(reference, { linked: true }));

  const showPanel = (event) => {
    event.stopPropagation();
    showReferenceTooltip(event, reference.key);
  };

  const pinPanel = (event) => {
    event.preventDefault();
    event.stopPropagation();
    pinInspector(event, "reference", reference.key);
  };

  keyButton.addEventListener("mouseenter", showPanel);
  keyButton.addEventListener("mousemove", (event) => moveTooltip(event));
  keyButton.addEventListener("mouseleave", hideTooltip);
  keyButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openReferenceLink(reference);
  });
  keyButton.addEventListener("contextmenu", pinPanel);
  item.addEventListener("mouseenter", showPanel);
  item.addEventListener("mousemove", (event) => moveTooltip(event));
  item.addEventListener("mouseleave", hideTooltip);

  item.append(keyButton, content);
  return item;
}

function renderReferencesPanel() {
  if (!referencesPanel || !referencesList || !referencesToggleButton) {
    return;
  }

  referencesList.innerHTML = "";
  referencesPanel.classList.toggle("is-open", currentReferencesVisible);
  referencesPanel.setAttribute("aria-hidden", currentReferencesVisible ? "false" : "true");
  referencesToggleButton.setAttribute("aria-pressed", currentReferencesVisible ? "true" : "false");
  referencesToggleButton.textContent = currentReferencesVisible ? "Hide References" : "Show References";

  if (!currentReferencesVisible) {
    return;
  }

  const references = getAllReferenceEntries();

  if (references.length === 0) {
    referencesList.append(Object.assign(document.createElement("li"), {
      className: "diagram-picker-empty",
      textContent: "No bibliography entries were loaded for this diagram.",
    }));
    return;
  }

  references.forEach((reference) => {
    referencesList.append(buildReferenceListItem(reference));
  });
}

function buildMeasurementEntry(layout, measurement) {
  void layout;
  void measurement;
  return null;
  /*
    id: normalized.id,
    title: `${endpointOne.labelPlain} ↔ ${endpointTwo.labelPlain}`,
    value: buildMeasureValueLines(endpointOne, endpointTwo).join("\n"),
  };
  */
}

function closeHelpPanel() {
  if (!helpPanel || helpPanel.hidden) {
    return;
  }

  helpPanel.hidden = true;
  helpToggleButton.setAttribute("aria-expanded", "false");
}

function positionHelpPanel() {
  if (!helpPanel || helpPanel.hidden || !heroPanel || !appShell) {
    return;
  }

  const shellRect = appShell.getBoundingClientRect();
  const heroRect = heroPanel.getBoundingClientRect();
  const gap = 14;
  const viewportPadding = 24;
  const panelWidth = helpPanel.offsetWidth || 360;
  const panelHeight = helpPanel.offsetHeight || 220;

  let left = heroRect.right + gap;
  let top = heroRect.top;

  if (left + panelWidth + viewportPadding > window.innerWidth) {
    left = heroRect.left;
    top = heroRect.bottom + gap;
  }

  left = Math.min(Math.max(left, viewportPadding), window.innerWidth - panelWidth - viewportPadding);
  top = Math.min(Math.max(top, viewportPadding), window.innerHeight - panelHeight - viewportPadding);

  helpPanel.style.left = `${left - shellRect.left}px`;
  helpPanel.style.top = `${top - shellRect.top}px`;
}

let diagramPickerCustomPosition = null;

function setDiagramPickerCustomPosition(position) {
  if (!position || !Number.isFinite(position.left) || !Number.isFinite(position.top)) {
    diagramPickerCustomPosition = null;
    return;
  }

  diagramPickerCustomPosition = {
    left: position.left,
    top: position.top,
  };
}

function positionDiagramPickerPanel() {
  if (!diagramPicker || diagramPicker.hidden || !heroPanel || !appShell) {
    return;
  }

  const shellRect = appShell.getBoundingClientRect();
  const heroRect = heroPanel.getBoundingClientRect();
  const gap = 14;
  const viewportPadding = 24;
  const panelWidth = diagramPicker.offsetWidth || 620;
  const panelHeight = diagramPicker.offsetHeight || 420;

  let left = diagramPickerCustomPosition?.left ?? (heroRect.right + gap);
  let top = diagramPickerCustomPosition?.top ?? (heroRect.top + 52);

  if (!diagramPickerCustomPosition && left + panelWidth + viewportPadding > window.innerWidth) {
    left = heroRect.left;
    top = heroRect.bottom + gap;
  }

  left = Math.min(Math.max(left, viewportPadding), window.innerWidth - panelWidth - viewportPadding);
  top = Math.min(Math.max(top, viewportPadding), window.innerHeight - panelHeight - viewportPadding);

  diagramPickerCustomPosition = {
    left,
    top,
  };
  diagramPicker.style.left = `${left - shellRect.left}px`;
  diagramPicker.style.top = `${top - shellRect.top}px`;
}

function getSceneScreenCTM() {
  return scene.node()?.getScreenCTM() || null;
}

function getScenePointScreenPosition(x, y) {
  const ctm = getSceneScreenCTM();

  if (!ctm) {
    const svgRect = svg.node().getBoundingClientRect();
    return {
      x: svgRect.left + currentZoomTransform.applyX(x),
      y: svgRect.top + currentZoomTransform.applyY(y),
    };
  }

  return {
    x: (ctm.a * x) + (ctm.c * y) + ctm.e,
    y: (ctm.b * x) + (ctm.d * y) + ctm.f,
  };
}

function getScreenPointScenePosition(x, y) {
  const ctm = getSceneScreenCTM();

  if (!ctm) {
    const svgRect = svg.node().getBoundingClientRect();
    return {
      x: currentZoomTransform.invertX(x - svgRect.left),
      y: currentZoomTransform.invertY(y - svgRect.top),
    };
  }

  const inverse = ctm.inverse();
  return {
    x: (inverse.a * x) + (inverse.c * y) + inverse.e,
    y: (inverse.b * x) + (inverse.d * y) + inverse.f,
  };
}

function updatePinnedPanelLayerTransform() {
  pinnedPanelLayer.style.transformOrigin = "0 0";
  pinnedPanelLayer.style.transform = "none";
}

function getSceneScreenScale() {
  const ctm = getSceneScreenCTM();

  if (!ctm) {
    return currentZoomTransform.k;
  }

  return Math.hypot(ctm.a, ctm.b) || 1;
}

function clampPanelPosition(left, top, panelElement) {
  const padding = 18;
  const rect = panelElement.getBoundingClientRect();
  return {
    left: Math.min(Math.max(left, padding), window.innerWidth - rect.width - padding),
    top: Math.min(Math.max(top, padding), window.innerHeight - rect.height - padding),
  };
}

function getPinnedNode(layout, pinnedState) {
  if (!layout || !pinnedState) {
    return null;
  }

  if (pinnedState.type === "reference") {
    return getReferenceEntry(pinnedState.id);
  }

  if (pinnedState.type === "fine") {
    return layout.fineStateMap.get(pinnedState.id) || null;
  }

  if (pinnedState.type === "hyperfine") {
    return layout.hyperfineNodeMap.get(pinnedState.id) || null;
  }

  if (pinnedState.type === "zeeman") {
    return layout.zeemanNodeMap.get(pinnedState.id) || null;
  }

  if (pinnedState.type === "transition") {
    return layout.transitionNodeMap.get(pinnedState.id) || null;
  }

  if (pinnedState.type === "measurement") {
    return layout.measurementNodeMap.get(pinnedState.id) || null;
  }

  return null;
}

function getNodeAnchorScenePosition(node, type) {
  if (!node) {
    return null;
  }

  if (type === "fine") {
    return { x: node.lineX, y: node.energyY };
  }

  if (type === "transition") {
    return { x: node.midX, y: node.midY };
  }

  if (type === "measurement") {
    return {
      x: node.labelPosition?.x ?? node.midX,
      y: node.labelPosition?.y ?? (node.midY - layoutConfig.measureLabelOffsetPx),
    };
  }

  return { x: node.x1, y: node.y };
}

function removePinnedPanel(panelId) {
  pinnedPanels = pinnedPanels.filter((panel) => panel.panelId !== panelId);
  renderPinnedPanels();
}

function schedulePinnedPanelResizePersistence() {
  if (pinnedPanelResizePersistTimer) {
    window.clearTimeout(pinnedPanelResizePersistTimer);
  }

  pinnedPanelResizePersistTimer = window.setTimeout(() => {
    pinnedPanelResizePersistTimer = null;
    persistState({ recordHistory: false, announce: false, preserveHistorySnapshot: true });
  }, 160);
}

const pinnedPanelResizeObserver = typeof window.ResizeObserver === "function"
  ? new window.ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const panelId = Number(entry.target?.dataset?.panelId);

        if (!Number.isFinite(panelId)) {
          return;
        }

        const panel = pinnedPanels.find((item) => item.panelId === panelId);

        if (!panel || entry.target.dataset.resizable !== "true") {
          return;
        }

        const width = Math.round(entry.target.offsetWidth || entry.target.getBoundingClientRect().width);
        const height = Math.round(entry.target.offsetHeight || entry.target.getBoundingClientRect().height);
        let changed = false;

        if (Number.isFinite(width) && Math.abs((panel.widthScreen ?? 0) - width) >= 1) {
          panel.widthScreen = width;
          changed = true;
        }

        if (Number.isFinite(height) && Math.abs((panel.heightScreen ?? 0) - height) >= 1) {
          panel.heightScreen = height;
          changed = true;
        }

        if (changed) {
          schedulePinnedPanelResizePersistence();
        }
      });
    })
  : null;

function buildPinnedPanelContent(panel, layout) {
  const node = getPinnedNode(layout, panel);

  if (!node && panel.type !== "reference") {
    return null;
  }

  const container = document.createElement("aside");
  container.className = "inspector";
  container.dataset.panelId = String(panel.panelId);

  if (panel.type === "reference") {
    container.classList.add("reference-inspector");
  } else {
    container.classList.add("is-resizable");
    container.dataset.resizable = "true";
  }

  const header = document.createElement("div");
  header.className = "inspector-header";
  header.dataset.dragHandle = "true";

  const headerText = document.createElement("div");
  const headerActions = document.createElement("div");
  headerActions.className = "inspector-header-actions";
  const kicker = document.createElement("div");
  kicker.className = "tooltip-kicker";
  const title = document.createElement("h2");
  const subtitle = document.createElement("p");
  const metadata = document.createElement("dl");
  const controls = document.createElement("div");
  controls.className = "inspector-controls";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "inspector-close";
  closeButton.setAttribute("aria-label", "Close inspector");
  closeButton.textContent = "x";
  closeButton.addEventListener("click", () => removePinnedPanel(panel.panelId));

  if (panel.type === "reference") {
    kicker.textContent = "Reference";
    title.textContent = node.key;
    subtitle.textContent = "";
    controls.append(createReferenceCitationMarkup(node, { linked: true }));
  } else if (panel.type === "fine") {
    kicker.textContent = "Fine Structure";
    setMixedTextContent(title, node.label);
    subtitle.textContent = "";
    metadata.append(buildMetadataFragment(getFineDetail(node)));

    if (expandedFine.has(node.id)) {
      const controlCard = document.createElement("div");
      controlCard.className = "inspector-control-card";
      const controlHeader = document.createElement("div");
      controlHeader.className = "hyperfine-scale-header";
      const controlTitle = document.createElement("strong");
      controlTitle.textContent = "Hyperfine scale";
      const controlValue = document.createElement("span");
      const sliderLabel = document.createElement("label");
      sliderLabel.className = "slider-control";
      const slider = document.createElement("input");
      const initialScale = getHyperfineScaleForFineState(node.id);
      slider.type = "range";
      slider.min = "0";
      slider.max = "1";
      slider.step = "0.001";
      slider.value = String(hyperfineScaleToSliderValue(initialScale));
      controlValue.textContent = `${formatFieldScale(initialScale, 2)}x`;
      slider.addEventListener("input", () => {
        const scale = sliderValueToHyperfineScale(slider.value);
        currentHyperfineScaleByFineState[node.id] = scale;
        controlValue.textContent = `${formatFieldScale(scale, 2)}x`;
        render(CONTROL_ANIMATION_MS, { skipPinnedPanels: true });
        persistState({ recordHistory: false, announce: false, preserveHistorySnapshot: true });
      });
      slider.addEventListener("change", () => {
        persistState();
        renderPinnedPanels();
      });
      controlHeader.append(controlTitle, controlValue);
      sliderLabel.append(slider);
      controlCard.append(controlHeader, sliderLabel);
      controls.append(controlCard);
    }
  } else if (panel.type === "hyperfine") {
    kicker.textContent = "Hyperfine Level";
    setMixedTextContent(title, `${node.parentLabel}  ${hyperfineLabel(node)}`);
    subtitle.textContent = "";
    metadata.append(buildMetadataFragment(getHyperfineDetail(node)));
  } else if (panel.type === "zeeman") {
    kicker.textContent = "Zeeman Sublevel";
    setZeemanTitleContent(title, node);
    subtitle.textContent = "";
    metadata.append(buildMetadataFragment(getZeemanDetail(node)));
  } else if (panel.type === "transition") {
    kicker.textContent = "Transition";
    setMixedTextContent(title, buildTransitionTitle(node));
    subtitle.textContent = "";
    const transitionMetadata = buildMetadataFragment(getTransitionDetail(node), {
      showSelectors: Boolean(panel.showTransitionLabelSelectors),
    });
    if (panel.showTransitionLabelSelectors) {
      controls.append(buildTransitionLabelPrecisionControls(node));
    }
    metadata.append(transitionMetadata);
    headerActions.append(createTransitionVisibilityToggleButton(panel));
  } else if (panel.type === "measurement") {
    kicker.textContent = "Measurement";
    title.textContent = "";
    subtitle.textContent = "";
    metadata.append(buildMetadataFragment(getMeasurementDetail(node, {
      includeEmptyNoteRow: Boolean(panel.editMeasurementNotes),
      includeLabelFormatControls: Boolean(panel.showMeasurementLabelSelectors),
    }), {
      showSelectors: Boolean(panel.showMeasurementLabelSelectors),
      showEditors: Boolean(panel.editMeasurementNotes),
    }));
    headerActions.append(createMeasurementEditToggleButton(panel));
    headerActions.append(createMeasurementVisibilityToggleButton(panel));
  }

  title.hidden = !String(title.textContent || "").trim();
  headerText.append(kicker, title);
  subtitle.hidden = !subtitle.textContent;
  metadata.hidden = metadata.childElementCount === 0;
  controls.hidden = controls.childElementCount === 0;
  headerActions.append(closeButton);
  header.append(headerText, headerActions);
  if (panel.type === "transition") {
    container.append(header, subtitle, controls, metadata);
    return container;
  }

  container.append(header, subtitle, metadata, controls);
  return container;
}

function positionPinnedPanels() {
  updatePinnedPanelLayerTransform();

  if (!pinnedPanelLayer) {
    return;
  }

  const shellRect = appShell?.getBoundingClientRect();

  pinnedPanels.forEach((panel) => {
    const panelElement = pinnedPanelLayer.querySelector(`[data-panel-id="${panel.panelId}"]`);

    if (!panelElement) {
      return;
    }

    const screenPosition = getScenePointScreenPosition(panel.sceneX, panel.sceneY);
    const left = shellRect ? screenPosition.x - shellRect.left : screenPosition.x;
    const top = shellRect ? screenPosition.y - shellRect.top : screenPosition.y;
    panelElement.style.left = `${left}px`;
    panelElement.style.top = `${top}px`;
  });
}

function renderPinnedPanels(layout = currentLayout) {
  pinnedPanelResizeObserver?.disconnect();
  pinnedPanelLayer.innerHTML = "";

  const survivingPanels = [];

  pinnedPanels.forEach((panel) => {
    const panelElement = buildPinnedPanelContent(panel, layout);

    if (!panelElement) {
      return;
    }

    if (panel.widthScreen) {
      panelElement.style.width = `${panel.widthScreen}px`;
    }
    if (panel.heightScreen) {
      panelElement.style.height = `${panel.heightScreen}px`;
    }
    pinnedPanelLayer.append(panelElement);
    pinnedPanelResizeObserver?.observe(panelElement);
    survivingPanels.push(panel);
  });

  pinnedPanels = survivingPanels;
  positionPinnedPanels();
}

function beginPanelDrag(event, panelId) {
  const panel = pinnedPanels.find((item) => item.panelId === panelId);

  if (!panel) {
    return;
  }

  const pointerScene = getScreenPointScenePosition(event.clientX, event.clientY);
  activePanelDrag = {
    panelId,
    offsetX: pointerScene.x - panel.sceneX,
    offsetY: pointerScene.y - panel.sceneY,
  };

  const panelElement = pinnedPanelLayer.querySelector(`[data-panel-id="${panelId}"]`);
  panelElement?.querySelector(".inspector-header")?.classList.add("is-dragging");
}

function handlePanelDrag(event) {
  if (!activePanelDrag) {
    return;
  }

  const panel = pinnedPanels.find((item) => item.panelId === activePanelDrag.panelId);

  if (!panel) {
    activePanelDrag = null;
    return;
  }

  const pointerScene = getScreenPointScenePosition(event.clientX, event.clientY);
  panel.sceneX = pointerScene.x - activePanelDrag.offsetX;
  panel.sceneY = pointerScene.y - activePanelDrag.offsetY;
  renderPinnedPanels();
}

function endPanelDrag() {
  if (!activePanelDrag) {
    return;
  }

  const panelElement = pinnedPanelLayer.querySelector(`[data-panel-id="${activePanelDrag.panelId}"]`);
  panelElement?.querySelector(".inspector-header")?.classList.remove("is-dragging");
  activePanelDrag = null;
}

function pinInspector(event, type, id) {
  const layout = currentLayout;
  const existing = pinnedPanels.find((panel) => panel.type === type && panel.id === id);

  if (existing) {
    removePinnedPanel(existing.panelId);
    return;
  }

  const node = type === "reference" ? getReferenceEntry(id) : getPinnedNode(layout, { type, id });

  if (!node) {
    return;
  }

  const tooltipRect = !tooltip.hidden ? tooltip.getBoundingClientRect() : null;
  const desiredLeft = tooltipRect ? tooltipRect.left : event.clientX + 18;
  const desiredTop = tooltipRect ? tooltipRect.top : event.clientY + 18;
  const scenePoint = getScreenPointScenePosition(desiredLeft, desiredTop);

  pinnedPanels.push({
    panelId: nextPinnedPanelId,
    type,
    id,
    sceneX: scenePoint.x,
    sceneY: scenePoint.y,
    widthScreen: tooltipRect?.width ?? null,
    heightScreen: null,
  });
  nextPinnedPanelId += 1;
  renderPinnedPanels(layout);

  const panelElement = pinnedPanelLayer.querySelector(`[data-panel-id="${nextPinnedPanelId - 1}"]`);

  if (panelElement) {
    const clamped = clampPanelPosition(desiredLeft, desiredTop, panelElement);
    const clampedScene = getScreenPointScenePosition(clamped.left, clamped.top);
    const panel = pinnedPanels.find((item) => item.panelId === nextPinnedPanelId - 1);
    const shellRect = appShell?.getBoundingClientRect();

    if (panel) {
      panel.sceneX = clampedScene.x;
      panel.sceneY = clampedScene.y;
    }

    panelElement.style.left = `${shellRect ? clamped.left - shellRect.left : clamped.left}px`;
    panelElement.style.top = `${shellRect ? clamped.top - shellRect.top : clamped.top}px`;
  }
}

function applyStateObject(stateObject, options = {}) {
  expandedFine = new Set(Array.isArray(stateObject.expandedFine) ? stateObject.expandedFine : defaultExpandedFine);
  expandedHyperfine = new Set(
    (Array.isArray(stateObject.expandedHyperfine) ? stateObject.expandedHyperfine : defaultExpandedHyperfine)
      .map((id) => String(id || "").trim())
      .filter(Boolean),
  );
  pinnedPanels = Array.isArray(stateObject.pinnedPanels)
    ? stateObject.pinnedPanels
      .filter((panel) => panel && typeof panel === "object")
      .map((panel) => ({
        panelId: Number.isFinite(panel.panelId) ? panel.panelId : nextPinnedPanelId++,
        type: panel.type,
        id: (panel.type === "hyperfine" || panel.type === "zeeman")
          ? String(panel.id || "").trim()
          : (panel.type === "transition"
            ? normalizeTransitionPanelId(panel)
            : (panel.type === "measurement" ? normalizeMeasurementPanelId(panel) : panel.id)),
        sceneX: Number.isFinite(panel.sceneX) ? panel.sceneX : 0,
        sceneY: Number.isFinite(panel.sceneY) ? panel.sceneY : 0,
        widthScreen: Number.isFinite(panel.widthScreen)
          ? panel.widthScreen
          : null,
        heightScreen: Number.isFinite(panel.heightScreen)
          ? panel.heightScreen
          : null,
        showTransitionLabelSelectors: Boolean(panel.showTransitionLabelSelectors),
        showMeasurementLabelSelectors: Boolean(panel.showMeasurementLabelSelectors),
        editMeasurementNotes: Boolean(panel.editMeasurementNotes),
      }))
    : [];
  nextPinnedPanelId = Math.max(nextPinnedPanelId, ...pinnedPanels.map((panel) => panel.panelId + 1), 1);
  applyTheme(stateObject.theme || "light");
  currentReferencesVisible = typeof stateObject.referencesVisible === "boolean"
    ? stateObject.referencesVisible
    : defaultReferencesVisible;
  currentMeasureToolEnabled = typeof stateObject.measureToolEnabled === "boolean"
    ? stateObject.measureToolEnabled
    : defaultMeasureToolEnabled;
  currentHideToolEnabled = typeof stateObject.hideToolEnabled === "boolean"
    ? stateObject.hideToolEnabled
    : defaultHideToolEnabled;
  currentMeasureSelection = Array.isArray(stateObject.measureSelection)
    ? stateObject.measureSelection
      .map(normalizeMeasureSelection)
      .filter(Boolean)
      .slice(0, 2)
    : [];
  currentMeasurements = Array.isArray(stateObject.measurements)
    ? stateObject.measurements
      .map(normalizeMeasurementEntry)
      .filter(Boolean)
    : [];
  hiddenStateKeys = new Set(
    Array.isArray(stateObject.hiddenStates)
      ? stateObject.hiddenStates
        .map(normalizeHiddenStateEntry)
        .filter(Boolean)
        .map(createHiddenStateKey)
      : [],
  );
  hiddenTransitionIds = new Set(
    Array.isArray(stateObject.hiddenTransitions)
      ? stateObject.hiddenTransitions
        .map(normalizeHiddenTransitionId)
        .filter(Boolean)
      : [],
  );

  if (currentHideToolEnabled && currentMeasureToolEnabled) {
    currentMeasureToolEnabled = false;
    currentMeasureSelection = [];
  }
  const controls = stateObject.controls || {};
  const savedHyperfineScales = controls.hyperfineScaleByFineState;
  const normalizedTransitionControls = normalizeTransitionControlEntries(controls.transitionLabels);
  currentHyperfineScaleByFineState = createDefaultHyperfineScaleMap(defaultHyperfineScale);
  currentTransitionLabelFieldsById = createDefaultTransitionLabelFieldMap();
  currentTransitionLabelPrecisionById = createDefaultTransitionLabelPrecisionMap();

  if (savedHyperfineScales && typeof savedHyperfineScales === "object") {
    fineStates.forEach((state) => {
      const rawValue = savedHyperfineScales[state.id];
      currentHyperfineScaleByFineState[state.id] = Number.isFinite(rawValue)
        ? clamp(rawValue, hyperfineScaleSliderRange.min, hyperfineScaleSliderRange.max)
        : currentHyperfineScaleByFineState[state.id];
    });
  }

  if (normalizedTransitionControls.fieldsById && typeof normalizedTransitionControls.fieldsById === "object") {
    Object.entries(normalizedTransitionControls.fieldsById).forEach(([transitionId, fields]) => {
      if (!Array.isArray(fields)) {
        return;
      }

      const normalizedFields = fields
        .map((field) => String(field || "").trim())
        .filter(Boolean);

      currentTransitionLabelFieldsById[transitionId] = normalizedFields;
    });
  }

  if (normalizedTransitionControls.precisionById && typeof normalizedTransitionControls.precisionById === "object") {
    Object.entries(normalizedTransitionControls.precisionById).forEach(([transitionId, precision]) => {
      if (!precision || typeof precision !== "object") {
        return;
      }

      currentTransitionLabelPrecisionById[transitionId] = {
        wavelength: Number.isFinite(precision.wavelength) ? clamp(Math.round(precision.wavelength), 0, 12) : null,
        frequency: Number.isFinite(precision.frequency) ? clamp(Math.round(precision.frequency), 0, 12) : null,
      };
    });
  }

  currentBFieldEnabled = typeof controls.bFieldEnabled === "boolean"
    ? controls.bFieldEnabled
    : defaultBFieldEnabled;
  currentBFieldVisualScale = Number.isFinite(controls.bFieldVisualScale)
    ? clamp(controls.bFieldVisualScale, bFieldVisualScaleSliderRange.min, bFieldVisualScaleSliderRange.max)
    : defaultBFieldVisualScale;
  currentBFieldGaussMin = Number.isFinite(controls.bFieldGaussMin)
    ? controls.bFieldGaussMin
    : defaultBFieldGaussMin;
  currentBFieldGaussMax = Number.isFinite(controls.bFieldGaussMax)
    ? controls.bFieldGaussMax
    : defaultBFieldGaussMax;
  if (currentBFieldGaussMax < currentBFieldGaussMin) {
    [currentBFieldGaussMin, currentBFieldGaussMax] = [currentBFieldGaussMax, currentBFieldGaussMin];
  }
  currentBFieldGauss = Number.isFinite(controls.bFieldGauss)
    ? clamp(controls.bFieldGauss, currentBFieldGaussMin, currentBFieldGaussMax)
    : defaultBFieldGauss;
  syncControlUI();
  renderReferencesPanel();

  const zoomState = stateObject.zoom || defaultZoomState;
  const zoomTransform = d3.zoomIdentity.translate(
    Number.isFinite(zoomState.x) ? zoomState.x : defaultZoomState.x,
    Number.isFinite(zoomState.y) ? zoomState.y : defaultZoomState.y,
  ).scale(Number.isFinite(zoomState.k) ? zoomState.k : defaultZoomState.k);

  currentZoomTransform = zoomTransform;
  render(options.animationDuration ?? 0);

  if (options.syncZoom !== false) {
    applyZoomTransform(zoomTransform, { persist: false, animationDuration: 0 });
  } else {
    scene.attr("transform", currentZoomTransform);
  }

  if (options.persist !== false) {
    persistState();
  }
}

function loadStoredState() {
  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return false;
    }

    applyStateObject(parseSerializedState(raw), { persist: false, syncZoom: true });
    return true;
  } catch {
    setStatus("Stored layout could not be read, so the diagram default layout is in use.");
    return false;
  }
}

