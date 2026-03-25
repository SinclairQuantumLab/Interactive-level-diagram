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

function formatTHz(value) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  return `${formatGroupedNumberToken(value >= 100 ? value.toFixed(3) : value.toFixed(5))} THz`;
}

function formatMHz(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  const rounded = Number(value.toFixed(digits));
  return `${formatGroupedNumberToken(rounded.toString())} MHz`;
}

function formatSignedMHz(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  const rounded = Number(Math.abs(value).toFixed(digits));

  if (rounded === 0) {
    return "0 MHz";
  }

  return `${formatGroupedNumberToken(`${value > 0 ? "+" : "-"}${rounded}`)} MHz`;
}

function formatFieldScale(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  return formatGroupedNumberToken(Number(value.toFixed(digits)).toString());
}

function formatGauss(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  return `${formatGroupedNumberToken(Number(value.toFixed(digits)).toString())} G`;
}

function quantumIdToken(value) {
  return formatQuantumNumber(value).replace("/", "_");
}

function formatQuantumReferenceValue(value) {
  if (Math.abs(value - Math.round(value)) < 1e-9) {
    return String(Math.round(value));
  }

  const fractionText = `${Math.round(Math.abs(value) * 2)}/2`;
  return value < 0 ? `-${fractionText}` : fractionText;
}

function createStateReferenceId(reference) {
  if (!reference?.fineStateId) {
    return "";
  }

  const qualifiers = [];

  if (Number.isFinite(reference.F)) {
    qualifiers.push(`F=${formatQuantumReferenceValue(reference.F)}`);
  }

  if (Number.isFinite(reference.mF)) {
    qualifiers.push(`mF=${formatQuantumReferenceValue(reference.mF)}`);
  }

  return qualifiers.length > 0
    ? `${reference.fineStateId}[${qualifiers.join(",")}]`
    : reference.fineStateId;
}

function hyperfineLabel(level) {
  return `F=${formatQuantumNumber(level.F)}`;
}

function clamp(value, minValue, maxValue) {
  return Math.min(Math.max(value, minValue), maxValue);
}

function parseOrbitalLetter(label) {
  const match = label.match(/^\d+([A-Z])/);
  return match ? match[1] : "S";
}

function hyperfineCoefficient(I, J, F) {
  const K = F * (F + 1) - I * (I + 1) - J * (J + 1);
  return {
    K,
    aTerm: 0.5 * K,
    bTerm: I >= 1 && J >= 1
      ? (((3 / 4) * K * (K + 1)) - (I * (I + 1) * J * (J + 1))) / (2 * I * (2 * I - 1) * J * (2 * J - 1))
      : 0,
  };
}

function computeHyperfineShiftMHz(I, J, F, constants) {
  if (!constants) {
    return 0;
  }

  if (Number.isFinite(constants.cMHz) && Math.abs(constants.cMHz) > 0) {
    throw new Error("The current hyperfine renderer supports A and B terms only; a nonzero C term is not implemented yet.");
  }

  const coefficient = hyperfineCoefficient(I, J, F);
  let shiftMHz = 0;

  if (Number.isFinite(constants.aMHz)) {
    shiftMHz += constants.aMHz * coefficient.aTerm;
  }

  if (Number.isFinite(constants.bMHz)) {
    shiftMHz += constants.bMHz * coefficient.bTerm;
  }

  return shiftMHz;
}

function isKnownMeasurementValue(measurement) {
  return measurement?.uncertaintyMode === "known";
}

function isExactMeasurementValue(measurement) {
  return measurement?.uncertaintyMode === "exact";
}

function createZeroMeasurementValue(unitLabel) {
  return createExactMeasurementValue(0, unitLabel, `0 ${unitLabel}`);
}

function scaleMeasurementValue(measurement, factor) {
  if (!measurement) {
    return null;
  }

  if (Math.abs(factor) < 1e-12) {
    return createZeroMeasurementValue(measurement.unitLabel);
  }

  const scaledNominal = (measurement.nominalValue ?? 0) * factor;

  if (isExactMeasurementValue(measurement)) {
    return createExactMeasurementValue(scaledNominal, measurement.unitLabel, measurement.displayText);
  }

  if (isKnownMeasurementValue(measurement)) {
    return createMeasurementValue({
      numericValue: scaledNominal,
      unitLabel: measurement.unitLabel,
      uncertaintyMode: "known",
      lowerUncertainty: measurement.lowerUncertainty * Math.abs(factor),
      upperUncertainty: measurement.upperUncertainty * Math.abs(factor),
      displayText: measurement.displayText,
    });
  }

  return createUnknownMeasurementValue(scaledNominal, measurement.unitLabel, measurement.displayText);
}

function combineMeasurementValues(measurements, unitLabel = "") {
  const validMeasurements = (Array.isArray(measurements) ? measurements : [])
    .filter((measurement) => measurement && Number.isFinite(measurement.nominalValue));

  if (validMeasurements.length === 0) {
    return createZeroMeasurementValue(unitLabel);
  }

  const resolvedUnitLabel = unitLabel || validMeasurements[0].unitLabel || "";
  const nominalValue = validMeasurements.reduce((sum, measurement) => sum + measurement.nominalValue, 0);

  if (validMeasurements.some((measurement) => measurement.uncertaintyMode === "unknown")) {
    return createUnknownMeasurementValue(nominalValue, resolvedUnitLabel);
  }

  const knownMeasurements = validMeasurements.filter(isKnownMeasurementValue);

  if (knownMeasurements.length === 0) {
    return createExactMeasurementValue(nominalValue, resolvedUnitLabel);
  }

  const lowerUncertainty = Math.sqrt(knownMeasurements.reduce((sum, measurement) => sum + (measurement.lowerUncertainty ** 2), 0));
  const upperUncertainty = Math.sqrt(knownMeasurements.reduce((sum, measurement) => sum + (measurement.upperUncertainty ** 2), 0));

  return createMeasurementValue({
    numericValue: nominalValue,
    unitLabel: resolvedUnitLabel,
    uncertaintyMode: "known",
    lowerUncertainty,
    upperUncertainty,
  });
}

function differenceMeasurementValues(leftMeasurement, rightMeasurement, unitLabel = "") {
  const difference = signedDifferenceMeasurementValues(leftMeasurement, rightMeasurement, unitLabel);

  return {
    ...difference,
    nominalValue: Math.abs(difference.nominalValue),
  };
}

function signedDifferenceMeasurementValues(leftMeasurement, rightMeasurement, unitLabel = "") {
  const resolvedUnitLabel = unitLabel || leftMeasurement?.unitLabel || rightMeasurement?.unitLabel || "";
  const left = leftMeasurement || createZeroMeasurementValue(resolvedUnitLabel);
  const right = rightMeasurement || createZeroMeasurementValue(resolvedUnitLabel);
  return combineMeasurementValues([
    scaleMeasurementValue(left, 1),
    scaleMeasurementValue(right, -1),
  ], resolvedUnitLabel);
}

function deriveShortFormDecimals(uncertaintyValue, significantDigits = 2) {
  if (!Number.isFinite(uncertaintyValue) || uncertaintyValue <= 0) {
    return null;
  }

  const exponent = Math.floor(Math.log10(uncertaintyValue));
  return clamp(significantDigits - 1 - exponent, 0, 9);
}

function formatMeasurementNominal(value, decimals) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  return formatGroupedNumberToken(Number(value).toFixed(decimals));
}

function formatMeasurementValue(measurement, fallbackDecimals = null) {
  if (!measurement || !Number.isFinite(measurement.nominalValue)) {
    return "n/a";
  }

  const unitLabel = measurement.unitLabel || "";
  const defaultDecimals = Number.isFinite(fallbackDecimals)
    ? fallbackDecimals
    : (unitLabel === "THz" ? 5 : 3);

  if (measurement.uncertaintyMode === "exact") {
    return `${formatMeasurementNominal(measurement.nominalValue, defaultDecimals)} ${unitLabel}`.trim();
  }

  if (measurement.uncertaintyMode !== "known") {
    return `${formatMeasurementNominal(measurement.nominalValue, defaultDecimals)}(?) ${unitLabel}`.trim();
  }

  const uncertaintyScale = Math.max(measurement.lowerUncertainty, measurement.upperUncertainty);
  const decimals = deriveShortFormDecimals(uncertaintyScale, 2) ?? defaultDecimals;
  const nominalText = formatMeasurementNominal(measurement.nominalValue, decimals);
  const scaledLower = Math.round(measurement.lowerUncertainty * (10 ** decimals));
  const scaledUpper = Math.round(measurement.upperUncertainty * (10 ** decimals));
  const uncertaintyText = scaledLower === scaledUpper
    ? `(${scaledUpper})`
    : `(+${scaledUpper},-${scaledLower})`;

  return `${nominalText}${uncertaintyText} ${unitLabel}`.trim();
}

function getFrequencyUnitScale(unitLabel) {
  if (typeof unitLabel !== "string" || !unitLabel.endsWith("Hz")) {
    return Number.NaN;
  }

  const prefix = unitLabel.slice(0, -2);
  const scale = HZ_UNIT_PREFIX_SCALE[prefix];
  return Number.isFinite(scale) ? scale : Number.NaN;
}

function chooseBestFrequencyUnitFromHz(valueHz) {
  const magnitudeHz = Math.abs(valueHz);

  if (!Number.isFinite(magnitudeHz) || magnitudeHz <= 0) {
    return "Hz";
  }

  for (let index = MEASUREMENT_FREQUENCY_UNITS.length - 1; index >= 0; index -= 1) {
    const candidateUnit = MEASUREMENT_FREQUENCY_UNITS[index];
    const candidateScale = getFrequencyUnitScale(candidateUnit);

    if (!Number.isFinite(candidateScale) || candidateScale <= 0) {
      continue;
    }

    if (magnitudeHz >= candidateScale) {
      return candidateUnit;
    }
  }

  return MEASUREMENT_FREQUENCY_UNITS[0] || "Hz";
}

function getMeasurementFrequencyMagnitudeHz(frequencyMeasurement) {
  const sourceUnitLabel = typeof frequencyMeasurement?.unitLabel === "string" && frequencyMeasurement.unitLabel.trim()
    ? frequencyMeasurement.unitLabel.trim()
    : "THz";
  const sourceScale = getFrequencyUnitScale(sourceUnitLabel);

  if (!Number.isFinite(sourceScale)) {
    return {
      nominalHz: Number.NaN,
      upperUncertaintyHz: Number.NaN,
    };
  }

  return {
    nominalHz: Number.isFinite(frequencyMeasurement?.nominalValue)
      ? Math.abs(frequencyMeasurement.nominalValue) * sourceScale
      : Number.NaN,
    upperUncertaintyHz: frequencyMeasurement?.uncertaintyMode === "known"
      ? Math.max(frequencyMeasurement.lowerUncertainty, frequencyMeasurement.upperUncertainty) * sourceScale
      : Number.NaN,
  };
}

function chooseAutoMeasurementFrequencyUnit(frequencyMeasurement) {
  const { nominalHz, upperUncertaintyHz } = getMeasurementFrequencyMagnitudeHz(frequencyMeasurement);
  const baseMagnitudeHz = nominalHz > 0
    ? nominalHz
    : (upperUncertaintyHz > 0 ? upperUncertaintyHz : 1);
  const usualUnitLabel = chooseBestFrequencyUnitFromHz(baseMagnitudeHz);

  if (frequencyMeasurement?.uncertaintyMode !== "known" || !(nominalHz > 0)) {
    return usualUnitLabel;
  }

  const usualScale = getFrequencyUnitScale(usualUnitLabel);

  if (!Number.isFinite(usualScale) || usualScale <= 0) {
    return usualUnitLabel;
  }

  const nominalInUsualUnit = nominalHz / usualScale;
  const uncertaintyInUsualUnit = upperUncertaintyHz / usualScale;

  if (!(Number.isFinite(nominalInUsualUnit) && nominalInUsualUnit > 0 && Number.isFinite(uncertaintyInUsualUnit))) {
    return usualUnitLabel;
  }

  const leadingDigitPlaceValue = 10 ** Math.floor(Math.log10(nominalInUsualUnit));
  const usualUnitIndex = MEASUREMENT_FREQUENCY_UNITS.indexOf(usualUnitLabel);

  if (uncertaintyInUsualUnit >= leadingDigitPlaceValue
    && usualUnitIndex >= 0
    && usualUnitIndex < MEASUREMENT_FREQUENCY_UNITS.length - 1) {
    return MEASUREMENT_FREQUENCY_UNITS[usualUnitIndex + 1];
  }

  return usualUnitLabel;
}

function convertFrequencyMeasurementToUnit(frequencyMeasurement, unitLabel = null) {
  const targetUnitLabel = unitLabel
    ? normalizeMeasurementFrequencyUnit(unitLabel)
    : chooseAutoMeasurementFrequencyUnit(frequencyMeasurement);
  const sourceUnitLabel = typeof frequencyMeasurement?.unitLabel === "string" && frequencyMeasurement.unitLabel.trim()
    ? frequencyMeasurement.unitLabel.trim()
    : "THz";
  const sourceScale = getFrequencyUnitScale(sourceUnitLabel);
  const targetScale = getFrequencyUnitScale(targetUnitLabel);

  if (!Number.isFinite(sourceScale) || !Number.isFinite(targetScale)) {
    return createUnknownMeasurementValue(Number.NaN, targetUnitLabel);
  }

  if (!frequencyMeasurement || !Number.isFinite(frequencyMeasurement.nominalValue)) {
    return createUnknownMeasurementValue(Number.NaN, targetUnitLabel);
  }

  const factor = sourceScale / targetScale;
  const convertedNominalValue = frequencyMeasurement.nominalValue * factor;

  if (frequencyMeasurement.uncertaintyMode === "exact") {
    return createExactMeasurementValue(convertedNominalValue, targetUnitLabel);
  }

  if (frequencyMeasurement.uncertaintyMode !== "known") {
    return createUnknownMeasurementValue(convertedNominalValue, targetUnitLabel);
  }

  return createMeasurementValue({
    numericValue: convertedNominalValue,
    unitLabel: targetUnitLabel,
    uncertaintyMode: "known",
    lowerUncertainty: Math.abs(frequencyMeasurement.lowerUncertainty * factor),
    upperUncertainty: Math.abs(frequencyMeasurement.upperUncertainty * factor),
  });
}

function formatBestFrequencyMeasurementValue(frequencyMeasurement) {
  return formatMeasurementValue(convertFrequencyMeasurementToUnit(frequencyMeasurement));
}

function formatBestFrequencyMeasurementWithPrecision(frequencyMeasurement, decimals = null) {
  const convertedMeasurement = convertFrequencyMeasurementToUnit(frequencyMeasurement);
  return formatLimitedValueWithUnit(
    convertedMeasurement?.nominalValue,
    convertedMeasurement?.unitLabel || "Hz",
    decimals,
  );
}

const MEASUREMENT_COMPONENT_CONFIG = [
  {
    key: "fine",
    title: "Fine",
    breakdownLabel: "fine",
    threshold: 1e-9,
    unitLabel: "THz",
  },
  {
    key: "hyperfine",
    title: "HF",
    breakdownLabel: "HF",
    threshold: 1e-6,
    unitLabel: "MHz",
  },
  {
    key: "zeeman",
    title: "Zeeman",
    breakdownLabel: "Zeeman",
    threshold: 1e-6,
    unitLabel: "MHz",
  },
];

function getMeasurementEndpointSortKey(endpoint) {
  return `${endpoint?.type || ""}:${endpoint?.id || ""}`;
}

function orderMeasurementEndpointsByEnergy(endpointOne, endpointTwo) {
  const energyOne = endpointOne?.energyTHz;
  const energyTwo = endpointTwo?.energyTHz;

  if (Number.isFinite(energyOne) && Number.isFinite(energyTwo)) {
    if (energyOne > energyTwo) {
      return [endpointOne, endpointTwo];
    }

    if (energyTwo > energyOne) {
      return [endpointTwo, endpointOne];
    }
  }

  return getMeasurementEndpointSortKey(endpointOne).localeCompare(getMeasurementEndpointSortKey(endpointTwo)) <= 0
    ? [endpointOne, endpointTwo]
    : [endpointTwo, endpointOne];
}

function getSignedMeasurementComponentDifference(endpointOne, endpointTwo, componentKey, unitLabel = "") {
  const [upperEndpoint, lowerEndpoint] = orderMeasurementEndpointsByEnergy(endpointOne, endpointTwo);
  const upperComponents = upperEndpoint?.measurementComponents || {};
  const lowerComponents = lowerEndpoint?.measurementComponents || {};
  return signedDifferenceMeasurementValues(
    upperComponents[componentKey],
    lowerComponents[componentKey],
    unitLabel,
  );
}

function getMeasurementSectionFieldKey(sectionId, fieldKind) {
  return `${sectionId}:${fieldKind}`;
}

function getPreferredMeasurementFallbackKey(endpointOne, endpointTwo) {
  if (endpointOne?.type === "zeeman" || endpointTwo?.type === "zeeman") {
    return "zeeman";
  }

  if (endpointOne?.type === "hyperfine" || endpointTwo?.type === "hyperfine") {
    return "hyperfine";
  }

  return "fine";
}

function createMeasurementSectionField(sectionId, fieldKind, label, measurement) {
  return {
    key: getMeasurementSectionFieldKey(sectionId, fieldKind),
    kind: fieldKind,
    label,
    measurement,
  };
}

function createMeasurementComponentSectionFields(sectionId, measurement) {
  const fields = [];

  if (sectionId === "fine") {
    fields.push(createMeasurementSectionField(
      sectionId,
      "wavelength",
      "Wavelength",
      convertFrequencyMeasurementToWavelengthMeasurement(measurement),
    ));
  }

  fields.push(createMeasurementSectionField(sectionId, "frequency", "Frequency", measurement));
  return fields;
}

function getMeasurementRelevantComponentSections(node) {
  if (!node?.endpointOne || !node?.endpointTwo) {
    return [];
  }

  const sections = MEASUREMENT_COMPONENT_CONFIG
    .map((component) => {
      const measurement = getSignedMeasurementComponentDifference(
        node.endpointOne,
        node.endpointTwo,
        component.key,
        component.unitLabel,
      );
      const isRelevant = Math.abs(measurement.nominalValue) >= component.threshold
        || (component.key === "zeeman" && shouldForceExplicitZeemanDifference(node.endpointOne, node.endpointTwo));

      if (!isRelevant) {
        return null;
      }

      return {
        ...component,
        id: component.key,
        fields: createMeasurementComponentSectionFields(component.key, measurement),
        measurement,
      };
    })
    .filter(Boolean);

  if (sections.length > 0) {
    return sections;
  }

  const fallbackKey = getPreferredMeasurementFallbackKey(node.endpointOne, node.endpointTwo);
  const fallbackComponent = MEASUREMENT_COMPONENT_CONFIG.find((component) => component.key === fallbackKey)
    || MEASUREMENT_COMPONENT_CONFIG[0];
  const measurement = getSignedMeasurementComponentDifference(
    node.endpointOne,
    node.endpointTwo,
    fallbackComponent.key,
    fallbackComponent.unitLabel,
  );

  return [{
    ...fallbackComponent,
    id: fallbackComponent.key,
    fields: createMeasurementComponentSectionFields(fallbackComponent.key, measurement),
    measurement,
  }];
}

function getMeasurementSectionDefinitions(node) {
  const componentSections = getMeasurementRelevantComponentSections(node);
  const hasCompositeBreakdown = componentSections.length > 1;

  if (hasCompositeBreakdown) {
    return {
      hasCompositeBreakdown,
      componentSections,
      sections: [
        {
          id: "total",
          title: "Total",
          showTitle: true,
          fields: [
            createMeasurementSectionField(
              "total",
              "wavelength",
              "Wavelength",
              node?.wavelengthMeasurement || getMeasurementWavelength(node),
            ),
            createMeasurementSectionField(
              "total",
              "frequency",
              "Frequency",
              node?.frequencyMeasurement || getMeasurementTotalFrequency(node),
            ),
          ],
        },
        ...componentSections.map((section) => ({
          ...section,
          showTitle: true,
        })),
      ],
    };
  }

  return {
    hasCompositeBreakdown,
    componentSections,
    sections: componentSections.map((section) => ({
      ...section,
      showTitle: false,
      fields: [...section.fields],
    })),
  };
}

function getDefaultMeasurementLabelFieldKeys(node) {
  return getMeasurementSectionDefinitions(node).sections
    .filter((section) => section.id !== "total")
    .flatMap((section) => {
      if (section.id === "fine") {
        const wavelengthField = section.fields.find((field) => field.kind === "wavelength");
        return wavelengthField ? [wavelengthField.key] : [];
      }

      return section.fields.map((field) => field.key);
    });
}

function getMeasurementFieldEntriesByKey(node) {
  const entries = new Map();

  getMeasurementSectionDefinitions(node).sections.forEach((section) => {
    section.fields.forEach((field) => {
      entries.set(field.key, {
        section,
        field,
      });
    });
  });

  return entries;
}

function getMeasurementCanonicalFieldKey(node, fieldKey) {
  const normalizedFieldKey = String(fieldKey || "").trim().toLowerCase();

  if (!normalizedFieldKey || normalizedFieldKey === "value") {
    return null;
  }

  if (normalizedFieldKey === "notes" || /^note:\d+$/.test(normalizedFieldKey)) {
    return normalizedFieldKey;
  }

  const fieldEntriesByKey = getMeasurementFieldEntriesByKey(node);

  if (fieldEntriesByKey.has(normalizedFieldKey)) {
    return normalizedFieldKey;
  }

  return null;
}

function normalizeMeasurementSelectedFieldKeys(node, sourceFields = null, fallback = []) {
  const configuredFields = Array.isArray(sourceFields)
    ? sourceFields
    : (Array.isArray(node?.labelFields) ? node.labelFields : fallback);
  const normalizedFields = [];
  const seenFields = new Set();

  configuredFields.forEach((fieldKey) => {
    const canonicalFieldKey = getMeasurementCanonicalFieldKey(node, fieldKey);

    if (!canonicalFieldKey || seenFields.has(canonicalFieldKey)) {
      return;
    }

    seenFields.add(canonicalFieldKey);
    normalizedFields.push(canonicalFieldKey);
  });

  return normalizedFields;
}

function getMeasurementSectionField(node, fieldKey) {
  const canonicalFieldKey = getMeasurementCanonicalFieldKey(node, fieldKey);

  if (!canonicalFieldKey) {
    return {
      section: null,
      field: null,
    };
  }

  const entry = getMeasurementFieldEntriesByKey(node).get(canonicalFieldKey) || null;
  return entry || {
    section: null,
    field: null,
  };
}

function getMeasurementPrecisionLookupKeys(node, fieldKey) {
  const canonicalFieldKey = getMeasurementCanonicalFieldKey(node, fieldKey);

  return canonicalFieldKey ? [canonicalFieldKey] : [];
}

function getMeasurementFieldPrecisionValue(node, fieldKey) {
  const precision = node?.precision || {};
  const lookupKeys = getMeasurementPrecisionLookupKeys(node, fieldKey);

  for (const key of lookupKeys) {
    if (Number.isFinite(precision[key])) {
      return precision[key];
    }
  }

  return null;
}

function formatMeasurementSectionFieldValue(node, field, { usePrecision = true } = {}) {
  if (!node || !field) {
    return "";
  }

  const precisionValue = usePrecision ? getMeasurementFieldPrecisionValue(node, field.key) : null;

  if (field.kind === "wavelength") {
    if (Number.isFinite(precisionValue)) {
      return formatLimitedValueWithUnit(field.measurement?.nominalValue, field.measurement?.unitLabel || "nm", precisionValue);
    }

    return formatMeasurementValue(field.measurement, 5);
  }

  if (Number.isFinite(precisionValue)) {
    return formatBestFrequencyMeasurementWithPrecision(field.measurement, precisionValue);
  }

  return formatBestFrequencyMeasurementValue(field.measurement);
}

function appendMeasurementSectionLabelSuffix(valueText, section) {
  const normalizedValueText = String(valueText || "").trim();

  if (!normalizedValueText || !section || section.id === "total" || !section.breakdownLabel) {
    return normalizedValueText;
  }

  return `${normalizedValueText} (${section.breakdownLabel})`;
}

function enumerateFLevels(nuclearSpin, j) {
  const levels = [];
  const minTwoF = Math.round(Math.abs(nuclearSpin - j) * 2);
  const maxTwoF = Math.round((nuclearSpin + j) * 2);

  for (let twoF = minTwoF; twoF <= maxTwoF; twoF += 2) {
    levels.push(twoF / 2);
  }

  return levels;
}

function normalizeExplicitHyperfineLevels(levels, fineState) {
  const mapped = levels.map((level) => ({
    ...level,
    id: createStateReferenceId({
      fineStateId: fineState.id,
      F: level.F,
      mF: null,
    }),
    parentFineId: fineState.id,
    notes: Array.isArray(level.notes) ? [...level.notes] : (Array.isArray(fineState.notes) ? [...fineState.notes] : []),
    referenceMap: level.referenceMap || fineState.referenceMap || {},
    shiftMHz: Number.isFinite(level.relMHz) ? level.relMHz : 0,
    shiftMeasurement: level.relMeasurement || createUnknownMeasurementValue(Number.isFinite(level.relMHz) ? level.relMHz : 0, "MHz"),
  }));
  const sorted = [...mapped].sort((a, b) => a.shiftMHz - b.shiftMHz);
  const minShift = sorted[0]?.shiftMHz ?? 0;

  sorted.forEach((level, index) => {
    level.shiftFromLowestMHz = level.shiftMHz - minShift;
    level.intervalBelowMHz = index === 0 ? null : level.shiftMHz - sorted[index - 1].shiftMHz;
  });

  return mapped;
}

function buildHyperfineLevels(state, nuclearSpin) {
  if (!state.hyperfineConstants) {
    return normalizeExplicitHyperfineLevels(state.hyperfine || [], state);
  }

  const constants = state.hyperfineConstants;
  const rawLevels = enumerateFLevels(nuclearSpin, state.j).map((F) => ({
    id: createStateReferenceId({
      fineStateId: state.id,
      F,
      mF: null,
    }),
    parentFineId: state.id,
    F,
    notes: Array.isArray(state.notes) ? [...state.notes] : [],
    referenceMap: state.referenceMap || {},
    shiftMHz: computeHyperfineShiftMHz(nuclearSpin, state.j, F, state.hyperfineConstants),
    shiftMeasurement: combineMeasurementValues([
      scaleMeasurementValue(constants.aMeasurement, hyperfineCoefficient(nuclearSpin, state.j, F).aTerm),
      scaleMeasurementValue(constants.bMeasurement, hyperfineCoefficient(nuclearSpin, state.j, F).bTerm),
      scaleMeasurementValue(constants.cMeasurement, 0),
    ], "MHz"),
  }));
  const sortedByShift = [...rawLevels].sort((a, b) => a.shiftMHz - b.shiftMHz);
  const minShift = sortedByShift[0]?.shiftMHz ?? 0;

  sortedByShift.forEach((level, index) => {
    level.shiftFromLowestMHz = level.shiftMHz - minShift;
    level.intervalBelowMHz = index === 0 ? null : level.shiftMHz - sortedByShift[index - 1].shiftMHz;
  });

  return rawLevels;
}

function computeLandegJ(state) {
  const orbitalLetter = parseOrbitalLetter(state.id);
  const L = ORBITAL_L_BY_LETTER[orbitalLetter] ?? 0;
  const S = ELECTRON_SPIN;
  const J = state.j;
  const jTerm = J * (J + 1);

  if (jTerm === 0) {
    return 0;
  }

  const lTerm = L * (L + 1);
  const sTerm = S * (S + 1);
  const gL = 1;
  const gS = 2.00231930436256;

  return gL * ((jTerm - sTerm + lTerm) / (2 * jTerm))
    + gS * ((jTerm + sTerm - lTerm) / (2 * jTerm));
}

function computeLandegF(nuclearSpin, j, F, gJ) {
  const fTerm = F * (F + 1);

  if (fTerm === 0) {
    return 0;
  }

  return gJ * ((fTerm + j * (j + 1) - nuclearSpin * (nuclearSpin + 1)) / (2 * fTerm));
}

let fineStates = [];
let referenceEntries = [];
let referenceEntryMap = new Map();

function rebuildReferenceState() {
  referenceEntries = Array.isArray(config.bibliography) ? config.bibliography : [];
  referenceEntryMap = new Map(referenceEntries.map((entry) => [entry.key, entry]));
}

function rebuildDerivedDiagramState() {
  fineStates = config.states.map((state) => ({
    ...state,
    columnId: parseOrbitalLetter(state.id),
    gJ: computeLandegJ(state),
    hyperfine: buildHyperfineLevels(state, config.species.nuclearSpin),
  }));
  rebuildReferenceState();

  return fineStates;
}

rebuildDerivedDiagramState();

function createDefaultHyperfineScaleMap(scaleValue = defaultHyperfineScale) {
  return Object.fromEntries(fineStates.map((state) => [state.id, scaleValue]));
}

function createDefaultTransitionLabelFieldMap() {
  return Object.fromEntries(
    (Array.isArray(config.transitions) ? config.transitions : []).map((transition) => [
      transition.id,
      Array.isArray(transition.labelFields) && transition.labelFields.length > 0
        ? [...transition.labelFields]
        : ["wavelength"],
    ]),
  );
}

function resolveTransitionLabelFields(transitionId, fallbackFields = ["wavelength"]) {
  if (Object.prototype.hasOwnProperty.call(currentTransitionLabelFieldsById, transitionId)) {
    return Array.isArray(currentTransitionLabelFieldsById[transitionId])
      ? [...currentTransitionLabelFieldsById[transitionId]]
      : [];
  }

  return Array.isArray(fallbackFields) ? [...fallbackFields] : [];
}

function createDefaultTransitionLabelPrecisionMap() {
  return Object.fromEntries(
    (Array.isArray(config.transitions) ? config.transitions : []).map((transition) => [
      transition.id,
      {
        wavelength: null,
        frequency: null,
      },
    ]),
  );
}

function getReferenceEntry(referenceKey) {
  return referenceEntryMap.get(referenceKey) || null;
}

function getAllReferenceEntries() {
  return referenceEntries;
}

function getFineStateById(stateId) {
  return fineStates.find((state) => state.id === stateId) || null;
}

function getReferenceKeysForField(source, fieldName) {
  if (!source || typeof source !== "object") {
    return [];
  }

  const referenceMap = source.referenceMap && typeof source.referenceMap === "object"
    ? source.referenceMap
    : {};

  return uniqueReferenceKeys(referenceMap[fieldName]);
}

function uniqueReferenceKeys(referenceKeys) {
  return [...new Set((Array.isArray(referenceKeys) ? referenceKeys : []).filter((key) => getReferenceEntry(key)))];
}

function mergeReferenceKeys(...referenceGroups) {
  return uniqueReferenceKeys(referenceGroups.flat());
}

function extractInlineCitationKeys(text) {
  if (typeof text !== "string") {
    return [];
  }

  const matches = [...text.matchAll(/\\cite\{([^}]+)\}/g)];
  return uniqueReferenceKeys(
    matches.flatMap((match) => match[1].split(",").map((key) => key.trim()).filter(Boolean)),
  );
}

function stripInlineCitations(text) {
  if (typeof text !== "string") {
    return text;
  }

  return text.replace(/\s*\\cite\{[^}]+\}/g, "").trim();
}

function createDetailRow(label, value, references = [], options = {}) {
  return {
    label,
    value,
    references: uniqueReferenceKeys(references),
    selector: options.selector || null,
    editor: options.editor || null,
  };
}

function createDetailSectionRow(title) {
  return {
    type: "section",
    title: String(title || ""),
  };
}

function appendNoteRows(rows, notes, references = []) {
  const normalizedNotes = Array.isArray(notes)
    ? notes.filter((note) => typeof note === "string" && note.trim())
    : [];

  if (normalizedNotes.length > 0) {
    rows.push(createDetailRow("Note", normalizedNotes.join(" "), references));
  }

  return rows;
}

function withUnknownUncertainty(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed === "n/a" || trimmed.includes("(?)") || /\([^)]*\)/.test(trimmed)) {
    return value;
  }

  const match = trimmed.match(/^(.*?)(\s+[A-Za-z][A-Za-z0-9/^+-]*)$/);
  return match ? `${match[1]}(?)${match[2]}` : `${trimmed}(?)`;
}

function formatConstantDisplay(symbol, valueMHz) {
  return Number.isFinite(valueMHz) ? `${symbol}=${withUnknownUncertainty(formatMHz(valueMHz, 3))}` : null;
}

function getHyperfineScaleForFineState(fineStateId) {
  return currentHyperfineScaleByFineState[fineStateId] ?? defaultHyperfineScale;
}

function hyperfineScaleToSliderValue(scale) {
  const clampedScale = clamp(scale, hyperfineScaleSliderRange.min, hyperfineScaleSliderRange.max);
  const minLog = Math.log10(hyperfineScaleSliderRange.min);
  const maxLog = Math.log10(hyperfineScaleSliderRange.max);
  return (Math.log10(clampedScale) - minLog) / (maxLog - minLog);
}

function sliderValueToHyperfineScale(sliderValue) {
  const normalized = clamp(Number(sliderValue), 0, 1);
  const minLog = Math.log10(hyperfineScaleSliderRange.min);
  const maxLog = Math.log10(hyperfineScaleSliderRange.max);
  return 10 ** (minLog + normalized * (maxLog - minLog));
}

function visualScaleToSliderValue(scale) {
  const clampedScale = clamp(scale, bFieldVisualScaleSliderRange.min, bFieldVisualScaleSliderRange.max);
  const minLog = Math.log10(bFieldVisualScaleSliderRange.min);
  const maxLog = Math.log10(bFieldVisualScaleSliderRange.max);
  return (Math.log10(clampedScale) - minLog) / (maxLog - minLog);
}

function sliderValueToVisualScale(sliderValue) {
  const normalized = clamp(Number(sliderValue), 0, 1);
  const minLog = Math.log10(bFieldVisualScaleSliderRange.min);
  const maxLog = Math.log10(bFieldVisualScaleSliderRange.max);
  return 10 ** (minLog + normalized * (maxLog - minLog));
}

function createZeemanLevels(hyperfineState) {
  const levels = [];
  const count = Math.round(hyperfineState.F * 2 + 1);
  const start = -hyperfineState.F;
  const fineStateId = hyperfineState.parentFineId || hyperfineState.fineStateId || hyperfineState.id;

  for (let i = 0; i < count; i += 1) {
    const mF = start + i;
    levels.push({
      id: createStateReferenceId({
        fineStateId,
        F: hyperfineState.F,
        mF,
      }),
      mF,
      parentId: hyperfineState.id,
      parentF: hyperfineState.F,
      notes: [],
      referenceMap: hyperfineState.referenceMap || {},
    });
  }

  return levels;
}

function getFineDetail(state) {
  const constants = state.hyperfineConstants || {};
  const constantParts = [
    constants.aText ? `A=${constants.aText}` : formatConstantDisplay("A", constants.aMHz),
    constants.bText ? `B=${constants.bText}` : formatConstantDisplay("B", constants.bMHz),
    constants.cText ? `C=${constants.cText}` : formatConstantDisplay("C", constants.cMHz),
  ].filter(Boolean);

  const rows = [
    createDetailRow("Energy", state.energyText || withUnknownUncertainty(formatTHz(state.energyTHz)), getReferenceKeysForField(state, "energy")),
    createDetailRow("Constants", constantParts.join(", ") || "not configured", constantParts.length > 0 ? getReferenceKeysForField(state, "constants") : []),
  ];

  return appendNoteRows(rows, state.notes, getReferenceKeysForField(state, "notes"));
}

function getHyperfineDetail(node) {
  const references = getReferenceKeysForField(node, "constants");
  const rows = [
    createDetailRow("Shift", withUnknownUncertainty(formatSignedMHz(node.shiftMHz, 3)), references),
  ];

  if (Math.abs(node.shiftFromLowestMHz) > 1e-9) {
    rows.push(createDetailRow("From lowest", withUnknownUncertainty(formatMHz(node.shiftFromLowestMHz, 3)), references));
  }

  if (node.intervalBelowMHz !== null) {
    rows.push(createDetailRow("Interval below", withUnknownUncertainty(formatMHz(node.intervalBelowMHz, 3)), references));
  }

  return appendNoteRows(rows, node.notes, getReferenceKeysForField(node, "notes"));
}

function getZeemanDetail(node) {
  const references = getReferenceKeysForField(node, "constants");
  const rows = [
    createDetailRow({ type: "subscript-token", base: "g", subscript: "F", suffix: "" }, withUnknownUncertainty(formatGroupedNumberToken(node.gF.toFixed(4))), references),
    createDetailRow("Shift", withUnknownUncertainty(formatSignedMHz(node.zeemanShiftMHz, 3)), references),
  ];

  return appendNoteRows(rows, node.notes, getReferenceKeysForField(node, "notes"));
}

function renderPlainSubscriptToken(base, subscript, suffix = "") {
  return `<span class="plain-subscript-token">${escapeHtml(base)}<sub>${escapeHtml(subscript)}</sub>${escapeHtml(suffix)}</span>`;
}

function setSubscriptTokenContent(element, base, subscript, suffix = "") {
  if (!element) {
    return;
  }

  element.innerHTML = renderPlainSubscriptToken(base, subscript, suffix);
}

function setZeemanTitleContent(element, node) {
  if (!element || !node) {
    return;
  }

  const fineLabelHtml = renderMixedTexString(stripInlineCitations(node.parentLabel));
  const hyperfineText = ` F=${formatQuantumNumber(node.parentF)} `;
  const zeemanTokenHtml = renderPlainSubscriptToken("m", "F", `=${signedQuantumLabel(node.mF)}`);
  element.innerHTML = `${fineLabelHtml}${escapeHtml(hyperfineText)}${zeemanTokenHtml}`;
}

const SPEED_OF_LIGHT_NM_THz = 299792.458;
const TRANSITION_COLOR_STOPS = [
  { wavelengthNm: 380, color: "#8b74c9" },
  { wavelengthNm: 440, color: "#4d78ff" },
  { wavelengthNm: 490, color: "#33b7ff" },
  { wavelengthNm: 510, color: "#2fcf86" },
  { wavelengthNm: 580, color: "#f0d24a" },
  { wavelengthNm: 645, color: "#ee8741" },
  { wavelengthNm: 780, color: "#d85e5c" },
];

function formatWavelengthNm(value, digits = 1) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  return `${formatGroupedNumberToken(value.toFixed(digits))} nm`;
}

function formatPreciseValueWithUnit(value, unitLabel) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  let text = Number(value).toPrecision(15);
  text = text
    .replace(/(\.\d*?[1-9])0+(?=(?:[eE]|$))/, "$1")
    .replace(/\.0+(?=(?:[eE]|$))/, "");

  return `${formatGroupedNumberToken(text)} ${unitLabel}`.trim();
}

function formatLimitedValueWithUnit(value, unitLabel, decimals = null) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  if (!Number.isFinite(decimals)) {
    return formatPreciseValueWithUnit(value, unitLabel);
  }

  const normalizedDecimals = clamp(Math.round(decimals), 0, 12);
  return `${formatGroupedNumberToken(Number(value).toFixed(normalizedDecimals))} ${unitLabel}`.trim();
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const chunk = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;

  return {
    r: Number.parseInt(chunk.slice(0, 2), 16),
    g: Number.parseInt(chunk.slice(2, 4), 16),
    b: Number.parseInt(chunk.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function interpolateColor(startHex, endHex, t) {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);
  const amount = clamp(t, 0, 1);

  return rgbToHex({
    r: start.r + (end.r - start.r) * amount,
    g: start.g + (end.g - start.g) * amount,
    b: start.b + (end.b - start.b) * amount,
  });
}

function describeWavelengthBand(wavelengthNm) {
  if (!Number.isFinite(wavelengthNm)) {
    return "Unknown";
  }

  if (wavelengthNm < 380) {
    return "Ultraviolet";
  }

  if (wavelengthNm < 450) {
    return "Violet-blue";
  }

  if (wavelengthNm < 495) {
    return "Blue-cyan";
  }

  if (wavelengthNm < 570) {
    return "Green";
  }

  if (wavelengthNm < 590) {
    return "Yellow";
  }

  if (wavelengthNm < 620) {
    return "Orange";
  }

  if (wavelengthNm <= 780) {
    return "Red";
  }

  return "Infrared";
}

function parseQuantumReferenceValue(text) {
  if (typeof text !== "string") {
    return Number.isFinite(text) ? text : null;
  }

  const trimmed = text.trim();
  const fractionMatch = trimmed.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);

  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    return denominator === 0 ? null : numerator / denominator;
  }

  const numericValue = Number(trimmed);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function parseStateReference(referenceText) {
  if (typeof referenceText !== "string" || !referenceText.trim()) {
    return null;
  }

  const trimmed = referenceText.trim();
  const match = trimmed.match(/^([^\[\]]+?)(?:\[(.+)\])?$/);

  if (!match) {
    return null;
  }

  const fineStateId = match[1].trim();
  const qualifiersText = match[2];
  const parsed = {
    raw: trimmed,
    fineStateId,
    F: null,
    mF: null,
  };

  if (!qualifiersText) {
    return parsed;
  }

  const qualifiers = qualifiersText.split(",").map((part) => part.trim()).filter(Boolean);

  for (const qualifier of qualifiers) {
    const [rawKey, rawValue] = qualifier.split("=").map((part) => part.trim());

    if (!rawKey || !rawValue) {
      return null;
    }

    const key = rawKey.toLowerCase();
    const value = parseQuantumReferenceValue(rawValue);

    if (!Number.isFinite(value)) {
      return null;
    }

    if (key === "f") {
      parsed.F = value;
    } else if (key === "mf") {
      parsed.mF = value;
    } else {
      return null;
    }
  }

  if (parsed.mF !== null && parsed.F === null) {
    return null;
  }

  return parsed;
}

function formatStateReferenceDisplay(reference) {
  if (!reference) {
    return "";
  }

  let label = reference.fineStateId;

  if (Number.isFinite(reference.F)) {
    label += `  F=${formatQuantumNumber(reference.F)}`;
  }

  if (Number.isFinite(reference.mF)) {
    label += `  mF=${signedQuantumLabel(reference.mF)}`;
  }

  return label;
}

function createStateReferenceKey(reference) {
  if (!reference) {
    return "";
  }

  let key = reference.fineStateId;

  if (Number.isFinite(reference.F)) {
    key += `|F=${quantumIdToken(reference.F)}`;
  }

  if (Number.isFinite(reference.mF)) {
    key += `|mF=${String(reference.mF).replace(".", "_")}`;
  }

  return key;
}

function createFineMeasurementComponents(state) {
  return {
    fine: state?.energyMeasurement || createUnknownMeasurementValue(state?.energyTHz ?? 0, "THz"),
    hyperfine: createZeroMeasurementValue("MHz"),
    zeeman: createZeroMeasurementValue("MHz"),
  };
}

function createHyperfineMeasurementComponents(fineState, node) {
  return {
    fine: fineState?.energyMeasurement || createUnknownMeasurementValue(fineState?.energyTHz ?? 0, "THz"),
    hyperfine: node?.shiftMeasurement || createUnknownMeasurementValue(node?.shiftMHz ?? 0, "MHz"),
    zeeman: createZeroMeasurementValue("MHz"),
  };
}

function createZeemanMeasurementComponents(fineState, node) {
  return {
    fine: fineState?.energyMeasurement || createUnknownMeasurementValue(fineState?.energyTHz ?? 0, "THz"),
    hyperfine: node?.hyperfineShiftMeasurement || createUnknownMeasurementValue(node?.parentShiftMHz ?? 0, "MHz"),
    zeeman: createExactMeasurementValue(node?.zeemanShiftMHz ?? 0, "MHz"),
  };
}

function getRepresentativeMeasurementKey(type) {
  if (type === "hyperfine") {
    return "hyperfine";
  }

  if (type === "zeeman") {
    return "zeeman";
  }

  return "fine";
}

function shouldUseRepresentativeMeasurementOnly(endpointOne, endpointTwo) {
  if (!endpointOne || !endpointTwo || endpointOne.type !== endpointTwo.type) {
    return false;
  }

  if (endpointOne.type === "fine") {
    return true;
  }

  if (endpointOne.type === "hyperfine") {
    return endpointOne.reference?.fineStateId === endpointTwo.reference?.fineStateId;
  }

  if (endpointOne.type === "zeeman") {
    return endpointOne.reference?.fineStateId === endpointTwo.reference?.fineStateId
      && endpointOne.reference?.F === endpointTwo.reference?.F;
  }

  return false;
}

function shouldForceExplicitZeemanDifference(endpointOne, endpointTwo) {
  if (!endpointOne || !endpointTwo || endpointOne.type !== "zeeman" || endpointTwo.type !== "zeeman") {
    return false;
  }

  return endpointOne.reference?.fineStateId !== endpointTwo.reference?.fineStateId
    || endpointOne.reference?.F !== endpointTwo.reference?.F;
}

function buildMeasurementDifferenceLines(node, { usePrecision = true } = {}) {
  if (!node?.endpointOne || !node?.endpointTwo) {
    return [];
  }

  const sectionInfo = getMeasurementSectionDefinitions(node);
  const lines = sectionInfo.componentSections.map((section, index) => {
    const frequencyFieldKey = getMeasurementSectionFieldKey(section.key, "frequency");
    const precisionValue = usePrecision ? getMeasurementFieldPrecisionValue(node, frequencyFieldKey) : null;
    const valueText = Number.isFinite(precisionValue)
      ? formatBestFrequencyMeasurementWithPrecision(section.measurement, precisionValue)
      : formatBestFrequencyMeasurementValue(section.measurement);
    const prefix = index > 0 && !String(valueText || "").startsWith("-") ? "+ " : "";
    return `${prefix}${valueText} (${section.breakdownLabel})`;
  });

  return lines.length > 0 ? lines : ["0"];
}

function buildMeasureValueLines(endpointOne, endpointTwo) {
  return buildMeasurementDifferenceLines({
    endpointOne,
    endpointTwo,
    precision: {},
  }, {
    usePrecision: false,
  });
}

function getMeasurementTotalFrequency(node) {
  if (!node) {
    return createUnknownMeasurementValue(Number.NaN, "THz");
  }

  const componentsOne = node.endpointOne?.measurementComponents || {};
  const componentsTwo = node.endpointTwo?.measurementComponents || {};
  const totalOne = combineMeasurementValues([
    componentsOne.fine,
    scaleMeasurementValue(componentsOne.hyperfine, 1e-6),
    scaleMeasurementValue(componentsOne.zeeman, 1e-6),
  ], "THz");
  const totalTwo = combineMeasurementValues([
    componentsTwo.fine,
    scaleMeasurementValue(componentsTwo.hyperfine, 1e-6),
    scaleMeasurementValue(componentsTwo.zeeman, 1e-6),
  ], "THz");

  return differenceMeasurementValues(totalOne, totalTwo, "THz");
}

function convertFrequencyMeasurementToWavelengthMeasurement(frequencyMeasurement) {
  const nominalFrequency = frequencyMeasurement?.nominalValue ?? Number.NaN;

  if (!Number.isFinite(nominalFrequency) || nominalFrequency <= 0) {
    return createUnknownMeasurementValue(Number.NaN, "nm");
  }

  const nominalWavelength = SPEED_OF_LIGHT_NM_THz / nominalFrequency;

  if (frequencyMeasurement.uncertaintyMode === "exact") {
    return createExactMeasurementValue(nominalWavelength, "nm");
  }

  if (frequencyMeasurement.uncertaintyMode !== "known") {
    return createUnknownMeasurementValue(nominalWavelength, "nm");
  }

  const scale = SPEED_OF_LIGHT_NM_THz / (nominalFrequency ** 2);
  return createMeasurementValue({
    numericValue: nominalWavelength,
    unitLabel: "nm",
    uncertaintyMode: "known",
    lowerUncertainty: Math.abs(frequencyMeasurement.lowerUncertainty * scale),
    upperUncertainty: Math.abs(frequencyMeasurement.upperUncertainty * scale),
  });
}

function getMeasurementWavelength(node) {
  return convertFrequencyMeasurementToWavelengthMeasurement(getMeasurementTotalFrequency(node));
}

function getMeasurementEndpointHyperfineNode(endpoint) {
  if (!endpoint || !currentLayout) {
    return null;
  }

  if (endpoint.type === "hyperfine") {
    return currentLayout.hyperfineNodeMap?.get(endpoint.id) || null;
  }

  if (endpoint.type === "zeeman") {
    const zeemanNode = currentLayout.zeemanNodeMap?.get(endpoint.id) || null;
    return zeemanNode
      ? currentLayout.hyperfineNodeMap?.get(zeemanNode.parentHyperfineId) || null
      : null;
  }

  return null;
}

function getMeasurementEndpointZeemanNode(endpoint) {
  if (!endpoint || endpoint.type !== "zeeman" || !currentLayout) {
    return null;
  }

  return currentLayout.zeemanNodeMap?.get(endpoint.id) || null;
}

function getMeasurementFineReferences(node) {
  return mergeReferenceKeys(
    getReferenceKeysForField(getFineStateById(node?.endpointOne?.reference?.fineStateId), "energy"),
    getReferenceKeysForField(getFineStateById(node?.endpointTwo?.reference?.fineStateId), "energy"),
    extractInlineCitationKeys(getFineStateById(node?.endpointOne?.reference?.fineStateId)?.energyText),
    extractInlineCitationKeys(getFineStateById(node?.endpointTwo?.reference?.fineStateId)?.energyText),
  );
}

function getMeasurementHyperfineReferences(node) {
  return mergeReferenceKeys(
    getReferenceKeysForField(getMeasurementEndpointHyperfineNode(node?.endpointOne), "constants"),
    getReferenceKeysForField(getMeasurementEndpointHyperfineNode(node?.endpointTwo), "constants"),
  );
}

function getMeasurementZeemanReferences(node) {
  return mergeReferenceKeys(
    getReferenceKeysForField(getMeasurementEndpointZeemanNode(node?.endpointOne), "constants"),
    getReferenceKeysForField(getMeasurementEndpointZeemanNode(node?.endpointTwo), "constants"),
  );
}

function getMeasurementSectionReferences(node, sectionId) {
  if (sectionId === "fine") {
    return getMeasurementFineReferences(node);
  }

  if (sectionId === "hyperfine") {
    return getMeasurementHyperfineReferences(node);
  }

  if (sectionId === "zeeman") {
    return getMeasurementZeemanReferences(node);
  }

  return mergeReferenceKeys(
    getMeasurementFineReferences(node),
    getMeasurementHyperfineReferences(node),
    getMeasurementZeemanReferences(node),
  );
}

function getMeasurementDetail(node, options = {}) {
  const sectionInfo = getMeasurementSectionDefinitions(node);
  const rows = [];

  sectionInfo.sections.forEach((section) => {
    if (section.showTitle && section.title) {
      rows.push(createDetailSectionRow(section.title));
    }

    const references = getMeasurementSectionReferences(node, section.id);

    section.fields.forEach((field) => {
      rows.push(createDetailRow(
        field.label,
        formatMeasurementSectionFieldValue(node, field, { usePrecision: false }),
        references,
        {
          selector: {
            measurementId: node.id,
            fieldKey: field.key,
          },
        },
      ));
    });

    if (options.includeLabelFormatControls) {
      rows.push(createDetailRow("Label format", "", [], {
        editor: {
          type: "measurement-format",
          measurementId: node.id,
          sectionId: section.id,
        },
      }));
    }
  });

  const notes = Array.isArray(node.notes)
    ? node.notes.filter((note) => typeof note === "string")
    : [];

  notes.forEach((note, index) => {
    rows.push(createDetailRow(`Note ${index + 1}`, note, [], {
      selector: {
        measurementId: node.id,
        fieldKey: `note:${index}`,
      },
      editor: {
        type: "measurement-note",
        measurementId: node.id,
        noteIndex: index,
      },
    }));
  });

  if (options.includeEmptyNoteRow && notes.length === 0) {
    rows.push(createDetailRow("Note 1", "", [], {
      selector: {
        measurementId: node.id,
        fieldKey: "note:0",
      },
      editor: {
        type: "measurement-note",
        measurementId: node.id,
        noteIndex: 0,
        isEmptyPlaceholder: true,
      },
    }));
  }

  return rows;
}

function getMeasurementLabelValue(node, fieldKey, options = {}) {
  const normalizedFieldKey = String(fieldKey || "").trim().toLowerCase();
  const usePrecision = options.usePrecision !== false;

  if (!normalizedFieldKey) {
    return "";
  }

  const { section, field } = getMeasurementSectionField(node, normalizedFieldKey);

  if (field) {
    return appendMeasurementSectionLabelSuffix(
      formatMeasurementSectionFieldValue(node, field, { usePrecision }),
      section,
    );
  }

  if (normalizedFieldKey === "notes") {
    return Array.isArray(node?.notes)
      ? node.notes.map((note) => stripInlineCitations(note)).filter(Boolean)
      : [];
  }

  const noteMatch = normalizedFieldKey.match(/^note:(\d+)$/);

  if (noteMatch) {
    const noteIndex = Number.parseInt(noteMatch[1], 10);
    return stripInlineCitations(Array.isArray(node?.notes) ? node.notes[noteIndex] : "");
  }

  return "";
}

function getMeasurementLabelLines(node) {
  const configuredFields = normalizeMeasurementSelectedFieldKeys(node);
  const lines = [];

  configuredFields.forEach((fieldKey) => {
    const value = getMeasurementLabelValue(node, fieldKey);

    if (Array.isArray(value)) {
      value.forEach((item) => {
        const normalizedItem = String(item || "").trim();

        if (normalizedItem) {
          lines.push(normalizedItem);
        }
      });
      return;
    }

    const normalizedValue = String(value || "").trim();

    if (normalizedValue) {
      lines.push(normalizedValue);
    }
  });

  return lines;
}

function getTransitionColor(wavelengthNm) {
  if (!Number.isFinite(wavelengthNm)) {
    return "#b38a7d";
  }

  if (wavelengthNm < TRANSITION_COLOR_STOPS[0].wavelengthNm) {
    return "#a383bf";
  }

  const lastStop = TRANSITION_COLOR_STOPS[TRANSITION_COLOR_STOPS.length - 1];

  if (wavelengthNm > lastStop.wavelengthNm) {
    return "#c97f6d";
  }

  for (let index = 0; index < TRANSITION_COLOR_STOPS.length - 1; index += 1) {
    const start = TRANSITION_COLOR_STOPS[index];
    const end = TRANSITION_COLOR_STOPS[index + 1];

    if (wavelengthNm >= start.wavelengthNm && wavelengthNm <= end.wavelengthNm) {
      const span = end.wavelengthNm - start.wavelengthNm || 1;
      const amount = (wavelengthNm - start.wavelengthNm) / span;
      return interpolateColor(start.color, end.color, amount);
    }
  }

  return lastStop.color;
}

function computeTransitionFrequencyTHz(fromState, toState) {
  return Math.abs((toState?.energyTHz ?? 0) - (fromState?.energyTHz ?? 0));
}

function computeTransitionWavelengthNm(frequencyTHz) {
  if (!Number.isFinite(frequencyTHz) || frequencyTHz <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return SPEED_OF_LIGHT_NM_THz / frequencyTHz;
}

function buildTransitionTitle(transition) {
  return `${transition.endpointOneLabel} ↔ ${transition.endpointTwoLabel}`;
}

function getLegacyTransitionDetail(node) {
  return getTransitionDetail(node);
  /*
    ["State pair", `${node.endpointOneLabelPlain} ↔ ${node.endpointTwoLabelPlain}`],
    ["Frequency", formatTHz(node.frequencyTHz)],
    ["Wavelength", formatWavelengthNm(node.wavelengthNm)],
    ["Band", describeWavelengthBand(node.wavelengthNm)],
    ["Note", node.detailNote || "Arrow color follows the wavelength estimated from the state energies."],
  ];
  */
}

function getTransitionDetail(node) {
  const references = mergeReferenceKeys(
    getReferenceKeysForField(getFineStateById(node.endpointOne?.reference?.fineStateId), "energy"),
    getReferenceKeysForField(getFineStateById(node.endpointTwo?.reference?.fineStateId), "energy"),
    extractInlineCitationKeys(getFineStateById(node.endpointOne?.reference?.fineStateId)?.energyText),
    extractInlineCitationKeys(getFineStateById(node.endpointTwo?.reference?.fineStateId)?.energyText),
    getReferenceKeysForField(node, "derived"),
  );
  const frequencyValue = stripInlineCitations(node.frequencyText || withUnknownUncertainty(formatPreciseValueWithUnit(node.frequencyTHz, "THz")));
  const rows = [];

  if (node.transitionType) {
    rows.push(createDetailRow("Type", node.transitionType, [], {
      selector: {
        transitionId: node.id,
        fieldKey: "type",
      },
    }));
  }

  if (node.strengthText) {
    rows.push(createDetailRow("Strength", stripInlineCitations(node.strengthText), [], {
      selector: {
        transitionId: node.id,
        fieldKey: "strength",
      },
    }));
  }

  rows.push(
    createDetailRow("Wavelength", withUnknownUncertainty(formatPreciseValueWithUnit(node.wavelengthNm, "nm")), references, {
      selector: {
        transitionId: node.id,
        fieldKey: "wavelength",
      },
    }),
    createDetailRow("Frequency", frequencyValue, references, {
      selector: {
        transitionId: node.id,
        fieldKey: "frequency",
      },
    }),
  );

  const noteReferences = getReferenceKeysForField(node, "notes");
  const notes = Array.isArray(node.notes)
    ? node.notes.filter((note) => typeof note === "string" && note.trim())
    : [];

  notes.forEach((note, index) => {
    rows.push(createDetailRow(`Note ${index + 1}`, stripInlineCitations(note), noteReferences, {
      selector: {
        transitionId: node.id,
        fieldKey: `note:${index}`,
      },
    }));
  });

  return rows;
}

function getTransitionLabelValue(node, fieldKey) {
  const normalizedFieldKey = String(fieldKey || "").trim().toLowerCase();
  const precision = currentTransitionLabelPrecisionById[node.id] || {};

  if (!normalizedFieldKey) {
    return "";
  }

  if (normalizedFieldKey === "wavelength") {
    if (Number.isFinite(precision.wavelength)) {
      return formatLimitedValueWithUnit(node.wavelengthNm, "nm", precision.wavelength);
    }

    return withUnknownUncertainty(formatPreciseValueWithUnit(node.wavelengthNm, "nm"));
  }

  if (normalizedFieldKey === "frequency") {
    const frequencyTHzValue = Number.isFinite(node.frequencyHz)
      ? node.frequencyHz / 1e12
      : node.frequencyTHz;

    if (Number.isFinite(precision.frequency)) {
      return formatLimitedValueWithUnit(frequencyTHzValue, "THz", precision.frequency);
    }

    return stripInlineCitations(
      node.frequencyText || withUnknownUncertainty(formatPreciseValueWithUnit(frequencyTHzValue, "THz")),
    );
  }

  if (normalizedFieldKey === "type") {
    return node.transitionType || "";
  }

  if (normalizedFieldKey === "strength") {
    return stripInlineCitations(node.strengthText || "");
  }

  if (normalizedFieldKey === "notes") {
    return Array.isArray(node.notes)
      ? node.notes
        .map((note) => stripInlineCitations(note))
        .filter(Boolean)
      : [];
  }

  if (normalizedFieldKey === "note") {
    return stripInlineCitations(Array.isArray(node.notes) ? node.notes[0] : "");
  }

  const noteMatch = normalizedFieldKey.match(/^note:(\d+)$/);

  if (noteMatch) {
    const noteIndex = Number.parseInt(noteMatch[1], 10);
    return stripInlineCitations(Array.isArray(node.notes) ? node.notes[noteIndex] : "");
  }

  return "";
}

function getTransitionLabelLines(node) {
  const configuredFields = Array.isArray(node?.labelFields)
    ? [...node.labelFields]
    : resolveTransitionLabelFields(node?.id, ["wavelength"]);
  const lines = [];

  configuredFields.forEach((fieldKey) => {
    const value = getTransitionLabelValue(node, fieldKey);

    if (Array.isArray(value)) {
      value.forEach((item) => {
        const normalizedItem = String(item || "").trim();

        if (normalizedItem) {
          lines.push(normalizedItem);
        }
      });
      return;
    }

    const normalizedValue = String(value || "").trim();

    if (normalizedValue) {
      lines.push(normalizedValue);
    }
  });

  return lines;
}

function formatQuantumNumber(value) {
  if (Math.abs(value - Math.round(value)) < 1e-9) {
    return String(Math.round(value));
  }

  return `${Math.round(Math.abs(value) * 2)}/2`;
}

function signedQuantumLabel(value) {
  if (Math.abs(value) < 1e-9) {
    return "0";
  }

  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatQuantumNumber(Math.abs(value))}`;
}

function zeemanStateLabel(value) {
  if (Math.abs(value) < 1e-9) {
    return "=0";
  }

  if (value > 0) {
    return `=+${formatQuantumNumber(value)}`;
  }

  return `=-${formatQuantumNumber(Math.abs(value))}`;
}

function fineBarWidth(state) {
  return expandedFine.has(state.id)
    ? Math.max(34, Math.ceil(getFineStateDisplayWidth(state) + 22))
    : layoutConfig.fineBarWidth;
}

function fineBarEnd(state) {
  return state.lineX + fineBarWidth(state);
}

function hyperfineBarWidth(hyperfineState) {
  return expandedHyperfine.has(hyperfineState.id)
    ? Math.max(16, Math.ceil(measureTextWidth(hyperfineLabel(hyperfineState), 18)))
    : 88;
}

function normalizeInlineTex(text) {
  if (!text) {
    return "";
  }

  const trimmed = text.trim();

  if (trimmed.startsWith("$") && trimmed.endsWith("$") && trimmed.length >= 2) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function readTexGroup(source, startIndex) {
  if (source[startIndex] === "{") {
    let depth = 1;
    let index = startIndex + 1;

    while (index < source.length && depth > 0) {
      const char = source[index];

      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
      }

      index += 1;
    }

    return {
      value: source.slice(startIndex + 1, Math.max(startIndex + 1, index - 1)),
      nextIndex: index,
    };
  }

  return {
    value: source[startIndex] || "",
    nextIndex: Math.min(source.length, startIndex + 1),
  };
}

function renderLocalTexMath(source) {
  let html = "";

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (char === "\\") {
      const nextChar = source[index + 1];

      if (nextChar === ",") {
        html += "<span class=\"tex-space tex-space-thin\"></span>";
        index += 1;
        continue;
      }

      if (nextChar === " ") {
        html += " ";
        index += 1;
        continue;
      }

      let command = "";
      let lookahead = index + 1;

      while (lookahead < source.length && /[A-Za-z]/.test(source[lookahead])) {
        command += source[lookahead];
        lookahead += 1;
      }

      if (command) {
        html += escapeHtml(command);
        index = lookahead - 1;
        continue;
      }

      html += escapeHtml(nextChar || "");
      index += 1;
      continue;
    }

    if (char === "^" || char === "_") {
      const tagName = char === "^" ? "sup" : "sub";
      const group = readTexGroup(source, index + 1);
      html += `<${tagName} class="tex-script">${renderLocalTexMath(group.value)}</${tagName}>`;
      index = group.nextIndex - 1;
      continue;
    }

    if (char === "{") {
      const group = readTexGroup(source, index);
      html += renderLocalTexMath(group.value);
      index = group.nextIndex - 1;
      continue;
    }

    if (/[A-Za-z]/.test(char)) {
      html += `<span class="tex-letter">${escapeHtml(char)}</span>`;
      continue;
    }

    html += escapeHtml(char);
  }

  return html;
}

function renderMixedTexString(text) {
  if (!text) {
    return "";
  }

  if (window.katex) {
    const parts = [];
    const pattern = /\$([^$]+)\$/g;
    let lastIndex = 0;
    let match = pattern.exec(text);

    while (match) {
      if (match.index > lastIndex) {
        parts.push(escapeHtml(text.slice(lastIndex, match.index)));
      }

      parts.push(window.katex.renderToString(normalizeInlineTex(match[0]), {
        throwOnError: false,
        displayMode: false,
      }));

      lastIndex = match.index + match[0].length;
      match = pattern.exec(text);
    }

    if (lastIndex < text.length) {
      parts.push(escapeHtml(text.slice(lastIndex)));
    }

    return parts.length > 0 ? parts.join("") : escapeHtml(text);
  }

  const parts = [];
  const pattern = /\$([^$]+)\$/g;
  let lastIndex = 0;
  let match = pattern.exec(text);

  while (match) {
    if (match.index > lastIndex) {
      parts.push(escapeHtml(text.slice(lastIndex, match.index)));
    }

    parts.push(`<span class="tex-inline">${renderLocalTexMath(normalizeInlineTex(match[0]))}</span>`);

    lastIndex = match.index + match[0].length;
    match = pattern.exec(text);
  }

  if (lastIndex < text.length) {
    parts.push(escapeHtml(text.slice(lastIndex)));
  }

  return parts.length > 0 ? parts.join("") : escapeHtml(text);
}

function setMixedTextContent(element, text) {
  if (!element) {
    return;
  }

  if (typeof text !== "string") {
    element.textContent = text == null ? "" : String(text);
    return;
  }

  const plainText = stripInlineCitations(text);

  if (plainText.includes("$")) {
    element.innerHTML = renderMixedTexString(plainText);
    return;
  }

  element.textContent = plainText;
}

function renderFineStateLabelHtml(container, state) {
  if (!container) {
    return;
  }

  setMixedTextContent(container, state.label);
}

function toPlainDisplayText(text) {
  if (!text) {
    return "";
  }

  return normalizeInlineTex(text)
    .replaceAll("\\,", " ")
    .replaceAll("{}", "")
    .replaceAll("\\", "");
}

function parseSpectroscopicSvgLabel(text) {
  const normalized = normalizeInlineTex(text).replaceAll("\\,", "").replaceAll("{}", "");
  const match = normalized.match(/^(\d+)([a-zA-Z])\^\{([^}]+)\}([A-Z])_\{([^}]+)\}$/);

  if (!match) {
    return null;
  }

  const [, principal, orbitalLetter, multiplicity, termLetter, jLabel] = match;
  return {
    principal,
    orbitalLetter,
    multiplicity,
    termLetter,
    jLabel,
  };
}

function renderFineStateSvgLabel(selection, label) {
  if (!selection) {
    return;
  }

  const parsed = parseSpectroscopicSvgLabel(label);
  selection.text(null);

  if (!parsed) {
    selection.text(toPlainDisplayText(label));
    return;
  }

  selection.append("tspan")
    .attr("class", "spectroscopic-shell")
    .text(parsed.principal);
  selection.append("tspan")
    .attr("class", "spectroscopic-orbital")
    .attr("dx", "0.02em")
    .attr("font-style", "italic")
    .text(parsed.orbitalLetter);
  selection.append("tspan")
    .attr("class", "spectroscopic-multiplicity")
    .attr("font-size", "72%")
    .attr("dx", "0.04em")
    .attr("dy", "-0.62em")
    .text(parsed.multiplicity);
  selection.append("tspan")
    .attr("class", "spectroscopic-term")
    .attr("dx", "0.06em")
    .attr("dy", "0.62em")
    .attr("font-style", "italic")
    .text(parsed.termLetter);
  selection.append("tspan")
    .attr("class", "spectroscopic-j")
    .attr("font-size", "72%")
    .attr("dy", "0.34em")
    .text(parsed.jLabel);
}

function renderSubscriptTokenLabel(selection, base, subscript, suffix) {
  selection.text(null);
  selection.append("tspan").text(base);
  selection.append("tspan")
    .attr("baseline-shift", "sub")
    .attr("font-size", "76%")
    .text(subscript);
  selection.append("tspan")
    .text(suffix);
}

