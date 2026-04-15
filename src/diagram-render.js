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

function getHyperfineScalePxPerMHz(fineState) {
  const localScale = getHyperfineScaleForFineState(fineState.id);
  return layoutConfig.hyperfineMHzToPx * localScale;
}

function getRelativeHyperfineLevels(fineState) {
  const levels = fineState.hyperfine;
  const scalePxPerMHz = getHyperfineScalePxPerMHz(fineState);

  return levels.map((level) => ({
    level,
    relY: -level.shiftMHz * scalePxPerMHz,
    scalePxPerMHz,
  }));
}

function getZeemanScalePxPerMHz() {
  return ZEEMAN_VISUAL_MHZ_TO_PX * currentBFieldVisualScale;
}

function computeZeemanShiftMHz(fineState, hyperfineLevel, mF) {
  const gF = computeLandegF(config.species.nuclearSpin, fineState.j, hyperfineLevel.F, fineState.gJ);

  return {
    gF,
    shiftMHz: currentBFieldEnabled ? gF * mF * MU_B_OVER_H_MHZ_PER_GAUSS * currentBFieldGauss : 0,
  };
}

function getRelativeStateSpan(fineState) {
  let top = -30;
  let bottom = 10;

  if (!expandedFine.has(fineState.id)) {
    return { top, bottom };
  }

  const substructureLayout = buildExpandedStateLayout(fineState, {
    parentEndX: 0,
    parentEnergyY: 0,
  });

  substructureLayout.hyperfineNodes.forEach((node) => {
    top = Math.min(top, node.y - 18);
    bottom = Math.max(bottom, node.y + 10);
  });

  substructureLayout.hyperfineEllipses.forEach((node) => {
    top = Math.min(top, node.y - 16);
    bottom = Math.max(bottom, node.y + 16);
  });

  substructureLayout.zeemanNodes.forEach((node) => {
    top = Math.min(top, node.y - 16);
    bottom = Math.max(bottom, node.y + 10);
  });

  substructureLayout.zeemanEllipses.forEach((node) => {
    top = Math.min(top, node.y - 12);
    bottom = Math.max(bottom, node.y + 12);
  });

  return { top, bottom };
}

function getRelativeStateRightExtent(fineState) {
  const fineExtent = fineBarWidth(fineState);

  if (!expandedFine.has(fineState.id)) {
    return fineExtent;
  }

  const substructureLayout = buildExpandedStateLayout(fineState, {
    parentEndX: 0,
    parentEnergyY: 0,
  });
  const hyperfineExtent = substructureLayout.hyperfineNodes.length > 0
    ? (d3.max(substructureLayout.hyperfineNodes, (node) => node.x2) || 0)
    : fineExtent;
  let extent = Math.max(fineExtent, hyperfineExtent);

  if (substructureLayout.hyperfineEllipses.length > 0) {
    extent = Math.max(extent, (d3.max(substructureLayout.hyperfineEllipses, (node) => node.x) || 0) + 10);
  }

  if (substructureLayout.zeemanNodes.length > 0) {
    extent = Math.max(extent, d3.max(substructureLayout.zeemanNodes, (node) => node.x2) || extent);
  }

  if (substructureLayout.zeemanEllipses.length > 0) {
    extent = Math.max(extent, (d3.max(substructureLayout.zeemanEllipses, (node) => node.x) || extent) + 12);
  }

  return extent;
}

function isFineStateEffectivelyHidden(fineStateOrId) {
  const fineStateId = typeof fineStateOrId === "string" ? fineStateOrId : fineStateOrId?.id;
  return hiddenStateKeys.has(createHiddenStateKey({ type: "fine", id: fineStateId }));
}

function isHyperfineStateEffectivelyHidden(hyperfineNode) {
  return isFineStateEffectivelyHidden(hyperfineNode?.parentId)
    || hiddenStateKeys.has(createHiddenStateKey({ type: "hyperfine", id: hyperfineNode?.id }));
}

function isZeemanStateEffectivelyHidden(zeemanNode) {
  return isFineStateEffectivelyHidden(zeemanNode?.parentId)
    || hiddenStateKeys.has(createHiddenStateKey({ type: "hyperfine", id: zeemanNode?.parentHyperfineId }))
    || hiddenStateKeys.has(createHiddenStateKey({ type: "zeeman", id: zeemanNode?.id }));
}

function isEndpointEffectivelyHidden(endpoint) {
  if (!endpoint) {
    return false;
  }

  if (endpoint.type === "fine") {
    return isFineStateEffectivelyHidden(endpoint.id);
  }

  if (endpoint.type === "hyperfine") {
    return isFineStateEffectivelyHidden(endpoint.reference?.fineStateId)
      || hiddenStateKeys.has(createHiddenStateKey({ type: "hyperfine", id: endpoint.id }));
  }

  if (endpoint.type === "zeeman") {
    const hyperfineId = `${endpoint.reference?.fineStateId}[F=${formatQuantumNumber(endpoint.reference?.F)}]`;
    return isFineStateEffectivelyHidden(endpoint.reference?.fineStateId)
      || hiddenStateKeys.has(createHiddenStateKey({ type: "hyperfine", id: hyperfineId }))
      || hiddenStateKeys.has(createHiddenStateKey({ type: "zeeman", id: endpoint.id }));
  }

  return false;
}

function isTransitionExplicitlyHidden(transitionOrId) {
  const transitionId = typeof transitionOrId === "string" ? transitionOrId : transitionOrId?.id;
  return hiddenTransitionIds.has(transitionId);
}

function isTransitionSuppressedByHiddenState(transitionOrId, endpointOne = null, endpointTwo = null) {
  const resolvedEndpointOne = endpointOne || transitionOrId?.endpointOne;
  const resolvedEndpointTwo = endpointTwo || transitionOrId?.endpointTwo;

  return isEndpointEffectivelyHidden(resolvedEndpointOne)
    || isEndpointEffectivelyHidden(resolvedEndpointTwo);
}

function toggleStateHidden(type, id) {
  const key = createHiddenStateKey({ type, id });

  if (!key) {
    return false;
  }

  if (hiddenStateKeys.has(key)) {
    hiddenStateKeys.delete(key);
    return false;
  }

  hiddenStateKeys.add(key);
  return true;
}

function toggleTransitionHidden(transitionId) {
  const normalizedId = normalizeHiddenTransitionId(transitionId);

  if (!normalizedId) {
    return false;
  }

  if (hiddenTransitionIds.has(normalizedId)) {
    hiddenTransitionIds.delete(normalizedId);
    return false;
  }

  hiddenTransitionIds.add(normalizedId);
  return true;
}

function buildCollapsedVisibilitySequence(items, isHidden) {
  const sequence = [];
  let hiddenRun = [];

  items.forEach((item) => {
    if (isHidden(item)) {
      hiddenRun.push(item);
      return;
    }

    if (hiddenRun.length > 0) {
      sequence.push({
        kind: "ellipsis",
        items: hiddenRun,
      });
      hiddenRun = [];
    }

    sequence.push({
      kind: "visible",
      item,
    });
  });

  if (hiddenRun.length > 0) {
    sequence.push({
      kind: "ellipsis",
      items: hiddenRun,
    });
  }

  return sequence;
}

function buildCollapsedHyperfineLayout(fineState, allNodes) {
  if (currentHideToolEnabled) {
    return {
      nodes: allNodes,
      ellipses: [],
    };
  }

  const orderedNodes = [...allNodes].sort((left, right) => left.y - right.y);
  const visibleNodes = orderedNodes.filter((node) => !isHyperfineStateEffectivelyHidden(node));

  if (visibleNodes.length === orderedNodes.length) {
    return {
      nodes: allNodes,
      ellipses: [],
    };
  }

  if (orderedNodes.length === 0) {
    return {
      nodes: [],
      ellipses: [],
    };
  }

  const sequence = buildCollapsedVisibilitySequence(orderedNodes, (node) => isHyperfineStateEffectivelyHidden(node));

  if (sequence.length === 0) {
    return {
      nodes: [],
      ellipses: [],
    };
  }

  const ellipsisX = (d3.min(allNodes, (node) => node.x1) ?? (fineBarEnd(fineState) + layoutConfig.hyperfineOffsetX))
    + ((d3.max(allNodes, (node) => node.x2 - node.x1) ?? 42) / 2);
  const ellipses = [];

  sequence.forEach((entry, index) => {
    if (entry.kind !== "ellipsis") {
      return;
    }

    const previousVisibleEntry = [...sequence.slice(0, index)].reverse().find((item) => item.kind === "visible");
    const nextVisibleEntry = sequence.slice(index + 1).find((item) => item.kind === "visible");
    let y = d3.mean(entry.items, (node) => node.y) ?? fineState.energyY;

    if (previousVisibleEntry && nextVisibleEntry) {
      y = (previousVisibleEntry.item.y + nextVisibleEntry.item.y) / 2;
    } else if (!previousVisibleEntry && nextVisibleEntry) {
      y = nextVisibleEntry.item.y - (layoutConfig.hiddenStateGapY / 2);
    } else if (previousVisibleEntry && !nextVisibleEntry) {
      y = previousVisibleEntry.item.y + (layoutConfig.hiddenStateGapY / 2);
    }

    ellipses.push({
      id: `${fineState.id}-hyperfine-ellipsis-${entry.items[0]?.id || "start"}-${entry.items[entry.items.length - 1]?.id || "end"}`,
      parentId: fineState.id,
      x: ellipsisX,
      y,
      glyph: "⋮",
    });
  });

  return {
    nodes: visibleNodes,
    ellipses,
  };
}

function buildCollapsedZeemanLayout(fineState, zeemanNodes, minMF, maxMF, zeemanOriginX, referenceY) {
  if (currentHideToolEnabled) {
    return {
      nodes: zeemanNodes,
      ellipses: [],
    };
  }

  const visibleNodes = zeemanNodes.filter((node) => !isZeemanStateEffectivelyHidden(node));
  if (visibleNodes.length === zeemanNodes.length) {
    return {
      nodes: zeemanNodes,
      ellipses: [],
    };
  }
  const ellipses = [];
  const xByNodeId = new Map();
  const nodesByHyperfineId = d3.group(zeemanNodes, (node) => node.parentHyperfineId);
  const desiredAnchorCenter = zeemanOriginX + ((0 - minMF) * layoutConfig.zeemanGapX) + (layoutConfig.zeemanBarWidth / 2);

  nodesByHyperfineId.forEach((rowNodes) => {
    const orderedRowNodes = [...rowNodes].sort((left, right) => left.mF - right.mF);
    const sequence = buildCollapsedVisibilitySequence(orderedRowNodes, (node) => isZeemanStateEffectivelyHidden(node));

    if (sequence.length === 0) {
      return;
    }

    let removedStride = 0;
    const collapsedEntries = [];

    sequence.forEach((entry) => {
      if (entry.kind === "visible") {
        const x1 = entry.item.x1 - removedStride;

        collapsedEntries.push({
          kind: "visible",
          items: [entry.item],
          x1,
          centerX: x1 + (layoutConfig.zeemanBarWidth / 2),
          coveredMinMF: entry.item.mF,
          coveredMaxMF: entry.item.mF,
        });
        return;
      }

      const firstHiddenNode = entry.items[0];

      if (!firstHiddenNode) {
        return;
      }

      const displayX = firstHiddenNode.x1 - removedStride;
      collapsedEntries.push({
        kind: "ellipsis",
        items: entry.items,
        x1: displayX,
        centerX: displayX + (layoutConfig.zeemanBarWidth / 2),
        coveredMinMF: d3.min(entry.items, (node) => node.mF) ?? firstHiddenNode.mF,
        coveredMaxMF: d3.max(entry.items, (node) => node.mF) ?? firstHiddenNode.mF,
      });

      removedStride += Math.max(0, entry.items.length - 1) * layoutConfig.zeemanGapX;
    });

    const anchorEntry = collapsedEntries.find((entry) => entry.coveredMinMF <= 0 && entry.coveredMaxMF >= 0);
    const leftEntry = [...collapsedEntries]
      .filter((entry) => entry.coveredMaxMF < 0)
      .sort((left, right) => right.coveredMaxMF - left.coveredMaxMF)[0] || null;
    const rightEntry = [...collapsedEntries]
      .filter((entry) => entry.coveredMinMF > 0)
      .sort((left, right) => left.coveredMinMF - right.coveredMinMF)[0] || null;
    const rowAnchorCenter = anchorEntry
      ? anchorEntry.centerX
      : (leftEntry && rightEntry
        ? ((leftEntry.centerX + rightEntry.centerX) / 2)
        : (leftEntry?.centerX ?? rightEntry?.centerX ?? desiredAnchorCenter));
    const rowShift = desiredAnchorCenter - rowAnchorCenter;

    collapsedEntries.forEach((entry) => {
      if (entry.kind === "visible") {
        const node = entry.items[0];

        if (node) {
          xByNodeId.set(node.id, entry.x1 + rowShift);
        }
        return;
      }

      const firstHiddenNode = entry.items[0];

      if (!firstHiddenNode) {
        return;
      }

      ellipses.push({
        id: `${firstHiddenNode.parentHyperfineId}-zeeman-ellipsis-${entry.items[0]?.id || "start"}-${entry.items[entry.items.length - 1]?.id || "end"}`,
        parentId: fineState.id,
        x: entry.centerX + rowShift,
        y: d3.mean(entry.items, (node) => node.y) ?? referenceY,
        glyph: "⋯",
      });
    });
  });

  return {
    nodes: visibleNodes.map((node) => {
      const x1 = xByNodeId.get(node.id) ?? node.x1;
      return {
        ...node,
        x1,
        x2: x1 + layoutConfig.zeemanBarWidth,
      };
    }),
    ellipses,
  };
}

function buildExpandedStateLayout(fineState, { parentEndX = 0, parentEnergyY = 0 } = {}) {
  const anchoredFineState = {
    ...fineState,
    energyY: parentEnergyY,
  };
  const hyperfineX1 = parentEndX + layoutConfig.hyperfineOffsetX;
  const allHyperfineNodes = getRelativeHyperfineLevels(fineState).map(({ level, relY }) => {
    const width = hyperfineBarWidth(level);

    return {
      ...level,
      type: "hyperfine",
      parentId: fineState.id,
      parentLabel: fineState.label,
      parentLabelPlain: fineState.labelPlain,
      parentEnergyY: parentEnergyY,
      x1: hyperfineX1,
      x2: hyperfineX1 + width,
      y: parentEnergyY + relY,
      shiftMHz: level.shiftMHz,
      shiftFromLowestMHz: level.shiftFromLowestMHz,
      intervalBelowMHz: level.intervalBelowMHz,
      hyperfineConstants: fineState.hyperfineConstants,
      absoluteEnergyTHz: fineState.energyTHz + level.shiftMHz * 1e-6,
    };
  });

  const collapsedHyperfineLayout = buildCollapsedHyperfineLayout(anchoredFineState, allHyperfineNodes);
  const expandedHyperfineNodes = collapsedHyperfineLayout.nodes.filter((node) => expandedHyperfine.has(node.id));
  const zeemanNodes = [];
  const zeemanEllipses = [];
  let zeemanAnchorX = null;

  if (expandedHyperfineNodes.length > 0) {
    const zeemanOriginX = (d3.max(collapsedHyperfineLayout.nodes, (node) => node.x2) || parentEndX) + layoutConfig.zeemanOffsetX;
    const minMF = d3.min(expandedHyperfineNodes, (node) => -node.F) || 0;
    const maxMF = d3.max(expandedHyperfineNodes, (node) => node.F) || 0;
    const allZeemanNodes = [];
    zeemanAnchorX = zeemanOriginX;

    expandedHyperfineNodes.forEach((node) => {
      createZeemanLevels(node).forEach((level) => {
        const columnIndex = Math.round(level.mF - minMF);
        const x1 = zeemanOriginX + columnIndex * layoutConfig.zeemanGapX;
        const zeemanShift = computeZeemanShiftMHz(fineState, node, level.mF);

        allZeemanNodes.push({
          ...level,
          type: "zeeman",
          x1,
          x2: x1 + layoutConfig.zeemanBarWidth,
          y: node.y - zeemanShift.shiftMHz * getZeemanScalePxPerMHz(),
          parentId: fineState.id,
          parentHyperfineId: node.id,
          parentLabel: node.parentLabel,
          parentLabelPlain: node.parentLabelPlain,
          parentShiftMHz: node.shiftMHz,
          hyperfineShiftMeasurement: node.shiftMeasurement,
          gF: zeemanShift.gF,
          zeemanShiftMHz: zeemanShift.shiftMHz,
          absoluteEnergyTHz: fineState.energyTHz + node.shiftMHz * 1e-6 + zeemanShift.shiftMHz * 1e-6,
        });
      });
    });

    const collapsedZeemanLayout = buildCollapsedZeemanLayout(
      anchoredFineState,
      allZeemanNodes,
      minMF,
      maxMF,
      zeemanOriginX,
      d3.mean(expandedHyperfineNodes, (node) => node.y) ?? parentEnergyY,
    );
    zeemanNodes.push(...collapsedZeemanLayout.nodes);
    zeemanEllipses.push(...collapsedZeemanLayout.ellipses);
  }

  return {
    hyperfineNodes: collapsedHyperfineLayout.nodes,
    hyperfineEllipses: collapsedHyperfineLayout.ellipses,
    zeemanNodes,
    zeemanEllipses,
    zeemanAnchorX,
  };
}

function computePositionedFineStates() {
  const sourceStates = currentHideToolEnabled
    ? [...fineStates]
    : fineStates.filter((state) => !isFineStateEffectivelyHidden(state));
  const sorted = [...sourceStates].sort((a, b) => a.energyTHz - b.energyTHz);
  let currentTop = layoutConfig.energyBottomY;
  const positionedMap = new Map();

  sorted.forEach((state, index) => {
    const span = getRelativeStateSpan(state);
    const positionedY = index === 0
      ? layoutConfig.energyBottomY
      : currentTop - layoutConfig.groupGapY - span.bottom;

    currentTop = positionedY + span.top;

    positionedMap.set(state.id, {
      ...state,
      energyY: positionedY,
      spanTop: span.top,
      spanBottom: span.bottom,
    });
  });

  return sourceStates.map((state) => positionedMap.get(state.id));
}

function applyColumnPositions(positionedFineStates) {
  const grouped = d3.group(positionedFineStates, (state) => state.columnId);
  const columnX = new Map();
  let currentX = layoutConfig.baseFineX;
  const orderedColumns = [
    ...columnOrder,
    ...[...grouped.keys()].filter((columnId) => !columnOrder.includes(columnId)),
  ];

  orderedColumns.forEach((columnId) => {
    const states = grouped.get(columnId) || [];

    if (states.length === 0) {
      return;
    }

    columnX.set(columnId, currentX);
    const columnWidth = d3.max(states, (state) => getRelativeStateRightExtent(state)) || 0;
    currentX += columnWidth + layoutConfig.fineColumnGap;
  });

  return positionedFineStates.map((state) => ({
    ...state,
    lineX: columnX.get(state.columnId) ?? layoutConfig.baseFineX,
  }));
}

function computeCenteredTransitionAnchorsOnBar(x1, x2, count) {
  if (!Number.isFinite(x1) || !Number.isFinite(x2) || count <= 0) {
    return [];
  }

  const width = Math.max(0, x2 - x1);
  const margin = Math.min(layoutConfig.transitionSlotMargin, Math.max(6, width * 0.22));
  const usableWidth = Math.max(0, width - margin * 2);
  const gap = count > 1
    ? Math.min(layoutConfig.transitionSlotGap, usableWidth / (count - 1 || 1))
    : 0;
  const span = gap * Math.max(0, count - 1);
  const startX = x1 + (width - span) / 2;

  return Array.from({ length: count }, (_, index) => startX + index * gap);
}

function shouldShowTransitionLabel(node) {
  return Array.isArray(node?.labelLines) && node.labelLines.length > 0;
}

function getTransitionVectorGeometry(node) {
  const dx = (node?.x2 ?? 0) - (node?.x1 ?? 0);
  const dy = (node?.y2 ?? 0) - (node?.y1 ?? 0);
  const length = Math.hypot(dx, dy) || 1;
  return {
    dx,
    dy,
    length,
    tangentX: dx / length,
    tangentY: dy / length,
    normalX: -dy / length,
    normalY: dx / length,
  };
}

function insetTransitionEndpoints(x1, y1, x2, y2, insetPx) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;

  if (length <= (insetPx * 2) + 1e-6) {
    return { x1, y1, x2, y2 };
  }

  const ux = dx / length;
  const uy = dy / length;

  return {
    x1: x1 + (ux * insetPx),
    y1: y1 + (uy * insetPx),
    x2: x2 - (ux * insetPx),
    y2: y2 - (uy * insetPx),
  };
}

function createRectFromCenter(x, y, width, height) {
  return {
    left: x - (width / 2),
    top: y - (height / 2),
    right: x + (width / 2),
    bottom: y + (height / 2),
  };
}

function rectIntersects(leftRect, rightRect, padding = 0) {
  return !(
    leftRect.right + padding < rightRect.left
    || leftRect.left - padding > rightRect.right
    || leftRect.bottom + padding < rightRect.top
    || leftRect.top - padding > rightRect.bottom
  );
}

function distancePointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const segmentLengthSquared = (dx * dx) + (dy * dy);

  if (segmentLengthSquared <= 1e-9) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = clamp((((px - ax) * dx) + ((py - ay) * dy)) / segmentLengthSquared, 0, 1);
  const projectedX = ax + (t * dx);
  const projectedY = ay + (t * dy);
  return Math.hypot(px - projectedX, py - projectedY);
}

function estimateTransitionLabelRect(node, x, y) {
  const lines = Array.isArray(node?.labelLines) ? node.labelLines : [];
  const longestLineLength = lines.reduce((maxLength, line) => Math.max(maxLength, String(line || "").length), 0);
  const width = Math.max(34, longestLineLength * layoutConfig.transitionLabelWidthFactorPx);
  const height = Math.max(layoutConfig.transitionLabelHeightPx, lines.length * layoutConfig.transitionLabelHeightPx);
  return {
    width,
    height,
    ...createRectFromCenter(x, y, width, height),
  };
}

function createStateBarObstacles(layout) {
  const obstacles = [];

  layout.fineStates.forEach((state) => {
    obstacles.push({
      left: state.lineX - 5,
      top: state.energyY - 10,
      right: fineBarEnd(state) + 5,
      bottom: state.energyY + 10,
    });
  });

  layout.hyperfineNodes.forEach((node) => {
    obstacles.push({
      left: node.x1 - 4,
      top: node.y - 8,
      right: node.x2 + 4,
      bottom: node.y + 8,
    });
  });

  layout.zeemanNodes.forEach((node) => {
    obstacles.push({
      left: node.x1 - 3,
      top: node.y - 6,
      right: node.x2 + 3,
      bottom: node.y + 6,
    });
  });

  return obstacles;
}

function buildTransitionPathData(node) {
  return `M ${node.x1} ${node.y1} L ${node.x2} ${node.y2}`;
}

function getLinearPoint(point0, point1, t) {
  return {
    x: point0.x + ((point1.x - point0.x) * t),
    y: point0.y + ((point1.y - point0.y) * t),
  };
}

function getTransitionLabelCandidates(node) {
  const geometry = node.vectorGeometry || getTransitionVectorGeometry(node);
  const controlPoint = { x: node.midX, y: node.midY };
  const labelOffset = layoutConfig.transitionLabelOffsetPx;
  const point0 = { x: node.x1, y: node.y1 };
  const point1 = { x: node.x2, y: node.y2 };
  const point35 = getLinearPoint(point0, point1, 0.35);
  const point65 = getLinearPoint(point0, point1, 0.65);
  const longestLineLength = (Array.isArray(node.labelLines) ? node.labelLines : [])
    .reduce((maxLength, line) => Math.max(maxLength, String(line || "").length), 0);
  const lateralShift = Math.max(24, (longestLineLength * layoutConfig.transitionLabelWidthFactorPx) * 0.55);

  return [
    { x: controlPoint.x + (geometry.normalX * labelOffset), y: controlPoint.y + (geometry.normalY * labelOffset), preference: 0 },
    { x: controlPoint.x - (geometry.normalX * labelOffset), y: controlPoint.y - (geometry.normalY * labelOffset), preference: 1 },
    { x: point35.x + (geometry.normalX * labelOffset), y: point35.y + (geometry.normalY * labelOffset), preference: 2 },
    { x: point65.x - (geometry.normalX * labelOffset), y: point65.y - (geometry.normalY * labelOffset), preference: 3 },
    { x: controlPoint.x - lateralShift, y: controlPoint.y - 4, preference: 4 },
    { x: controlPoint.x + lateralShift, y: controlPoint.y - 4, preference: 5 },
  ];
}

function chooseTransitionLabelPosition(node, layout, acceptedLabelRects) {
  const obstacles = layout.stateBarObstacles || [];
  const svgWidth = APP_CONFIG.canvas.width;
  const svgHeight = APP_CONFIG.canvas.height;
  const geometry = node.vectorGeometry || getTransitionVectorGeometry(node);
  const candidates = getTransitionLabelCandidates(node);
  let bestCandidate = {
    x: node.midX,
    y: node.midY - layoutConfig.transitionLabelOffsetPx,
  };
  let bestScore = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate) => {
    const rect = estimateTransitionLabelRect(node, candidate.x, candidate.y);
    let score = candidate.preference * 2;

    if (rect.left < 0 || rect.right > svgWidth || rect.top < 0 || rect.bottom > svgHeight) {
      score += 180;
    }

    obstacles.forEach((obstacle) => {
      if (rectIntersects(rect, obstacle, 2)) {
        score += 1000;
      }
    });

    acceptedLabelRects.forEach((acceptedRect) => {
      if (rectIntersects(rect, acceptedRect, 4)) {
        score += 600;
      }
    });

    const centerX = (rect.left + rect.right) / 2;
    const centerY = (rect.top + rect.bottom) / 2;
    const controlPoint = { x: node.midX, y: node.midY };
    score += Math.hypot(centerX - controlPoint.x, centerY - controlPoint.y) * 0.08;

    const distance = distancePointToSegment(centerX, centerY, node.x1, node.y1, node.x2, node.y2);

    if (distance < Math.max(rect.height * 0.55, 8)) {
      score += 120;
    }

    score += Math.abs((geometry.normalX * (centerX - controlPoint.x)) + (geometry.normalY * (centerY - controlPoint.y))) < 4
      ? 18
      : 0;

    if (score < bestScore) {
      bestScore = score;
      bestCandidate = {
        x: candidate.x,
        y: candidate.y,
      };
    }
  });

  const finalRect = estimateTransitionLabelRect(node, bestCandidate.x, bestCandidate.y);
  acceptedLabelRects.push(finalRect);
  return {
    ...bestCandidate,
    rect: finalRect,
  };
}

function createEndpointNodeKey(type, id) {
  return `${type}:${id}`;
}

function estimateMeasureLabelRect(lines, x, y) {
  const normalizedLines = Array.isArray(lines) ? lines : [];
  const longestLineLength = normalizedLines.reduce((maxLength, line) => Math.max(maxLength, String(line || "").length), 0);
  const width = Math.max(70, longestLineLength * layoutConfig.measureLabelWidthFactorPx);
  const height = Math.max(
    layoutConfig.measureLabelLineHeightPx + 6,
    normalizedLines.length * layoutConfig.measureLabelLineHeightPx,
  );

  return {
    width,
    height,
    ...createRectFromCenter(x, y, width, height),
  };
}

function getMeasureLabelCandidates(node) {
  const geometry = node.vectorGeometry || getTransitionVectorGeometry(node);
  const centerPoint = { x: node.midX, y: node.midY };
  const point30 = getLinearPoint({ x: node.x1, y: node.y1 }, { x: node.x2, y: node.y2 }, 0.3);
  const point70 = getLinearPoint({ x: node.x1, y: node.y1 }, { x: node.x2, y: node.y2 }, 0.7);
  const labelOffset = layoutConfig.measureLabelOffsetPx;

  return [
    { x: centerPoint.x + (geometry.normalX * labelOffset), y: centerPoint.y + (geometry.normalY * labelOffset), preference: 0 },
    { x: centerPoint.x - (geometry.normalX * labelOffset), y: centerPoint.y - (geometry.normalY * labelOffset), preference: 1 },
    { x: point30.x + (geometry.normalX * (labelOffset + 6)), y: point30.y + (geometry.normalY * (labelOffset + 6)), preference: 2 },
    { x: point70.x - (geometry.normalX * (labelOffset + 6)), y: point70.y - (geometry.normalY * (labelOffset + 6)), preference: 3 },
    { x: centerPoint.x - 48, y: centerPoint.y - 6, preference: 4 },
    { x: centerPoint.x + 48, y: centerPoint.y - 6, preference: 5 },
  ];
}

function chooseMeasureLabelPosition(node, layout, acceptedLabelRects = []) {
  const obstacles = layout.stateBarObstacles || [];
  const svgWidth = APP_CONFIG.canvas.width;
  const svgHeight = APP_CONFIG.canvas.height;
  const geometry = node.vectorGeometry || getTransitionVectorGeometry(node);
  const candidates = getMeasureLabelCandidates(node);
  let bestCandidate = {
    x: node.midX,
    y: node.midY - layoutConfig.measureLabelOffsetPx,
  };
  let bestScore = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate) => {
    const rect = estimateMeasureLabelRect(node.lines, candidate.x, candidate.y);
    let score = candidate.preference * 2;

    if (rect.left < 0 || rect.right > svgWidth || rect.top < 0 || rect.bottom > svgHeight) {
      score += 180;
    }

    obstacles.forEach((obstacle) => {
      if (rectIntersects(rect, obstacle, 4)) {
        score += 1000;
      }
    });

    acceptedLabelRects.forEach((acceptedRect) => {
      if (rectIntersects(rect, acceptedRect, 4)) {
        score += 600;
      }
    });

    const centerX = (rect.left + rect.right) / 2;
    const centerY = (rect.top + rect.bottom) / 2;
    const distance = distancePointToSegment(centerX, centerY, node.x1, node.y1, node.x2, node.y2);

    if (distance < Math.max(rect.height * 0.52, 10)) {
      score += 120;
    }

    score += Math.abs((geometry.normalX * (centerX - node.midX)) + (geometry.normalY * (centerY - node.midY))) < 4
      ? 16
      : 0;

    if (score < bestScore) {
      bestScore = score;
      bestCandidate = {
        x: candidate.x,
        y: candidate.y,
      };
    }
  });

  const finalRect = estimateMeasureLabelRect(node.lines, bestCandidate.x, bestCandidate.y);
  acceptedLabelRects.push(finalRect);
  return {
    ...bestCandidate,
    rect: finalRect,
  };
}

function buildMeasurementNodes(endpointNodeMap, layout) {
  const acceptedLabelRects = [];

  return currentMeasurements
    .map((measurement) => normalizeMeasurementEntry(measurement))
    .filter(Boolean)
    .map((measurement) => {
      const [selectionOne, selectionTwo] = normalizeMeasurementBetweenEntry(measurement.between);

      if (areMeasureSelectionsEqual(selectionOne, selectionTwo)) {
        return null;
      }

      const endpointOne = endpointNodeMap.get(createEndpointNodeKey(selectionOne.type, selectionOne.id));
      const endpointTwo = endpointNodeMap.get(createEndpointNodeKey(selectionTwo.type, selectionTwo.id));

      if (!endpointOne || !endpointTwo) {
        return null;
      }

      const x1 = (endpointOne.x1 + endpointOne.x2) / 2;
      const y1 = endpointOne.y;
      const x2 = (endpointTwo.x1 + endpointTwo.x2) / 2;
      const y2 = endpointTwo.y;
      const vectorGeometry = getTransitionVectorGeometry({ x1, y1, x2, y2 });

      if (vectorGeometry.length < 1e-6) {
        return null;
      }

      const node = {
        id: measurement.id,
        type: "measurement",
        endpointOne,
        endpointTwo,
        x1,
        y1,
        x2,
        y2,
        midX: (x1 + x2) / 2,
        midY: (y1 + y2) / 2,
        vectorGeometry,
        notes: Array.isArray(measurement.notes) ? [...measurement.notes] : [],
        labelFields: [],
        precision: measurement.precision || {},
        isHidden: isEndpointEffectivelyHidden(endpointOne) || isEndpointEffectivelyHidden(endpointTwo),
      };

      node.frequencyMeasurement = getMeasurementTotalFrequency(node);
      node.wavelengthMeasurement = getMeasurementWavelength(node);
      node.labelFields = normalizeMeasurementSelectedFieldKeys(node, measurement.labelFields, []);
      node.valueLines = buildMeasurementDifferenceLines(node);
      node.lines = getMeasurementLabelLines(node);

      return {
        ...node,
        labelPosition: node.lines.length > 0
          ? chooseMeasureLabelPosition(node, layout, acceptedLabelRects)
          : null,
      };
    })
    .filter(Boolean);
}

function createVisibleStateEndpointMap(fineStateMap, hyperfineNodeMap, zeemanNodeMap) {
  const endpointMap = new Map();

  fineStateMap.forEach((state) => {
    const reference = {
      fineStateId: state.id,
      F: null,
      mF: null,
    };

    endpointMap.set(createStateReferenceKey(reference), {
      type: "fine",
      id: state.id,
      reference,
      x1: state.lineX,
      x2: fineBarEnd(state),
      y: state.energyY,
      energyTHz: state.energyTHz,
      label: state.label,
      labelPlain: state.labelPlain,
      sortX: state.lineX,
      sortY: state.energyY,
      measurementComponents: createFineMeasurementComponents(state),
    });
  });

  hyperfineNodeMap.forEach((node) => {
    const reference = {
      fineStateId: node.parentId,
      F: node.F,
      mF: null,
    };

    endpointMap.set(createStateReferenceKey(reference), {
      type: "hyperfine",
      id: node.id,
      reference,
      x1: node.x1,
      x2: node.x2,
      y: node.y,
      energyTHz: node.absoluteEnergyTHz,
      label: `${node.parentLabel}  ${hyperfineLabel(node)}`,
      labelPlain: `${node.parentLabelPlain}  ${hyperfineLabel(node)}`,
      sortX: node.x1,
      sortY: node.y,
      measurementComponents: createHyperfineMeasurementComponents(getFineStateById(node.parentId), node),
    });
  });

  zeemanNodeMap.forEach((node) => {
    const reference = {
      fineStateId: node.parentId,
      F: node.parentF,
      mF: node.mF,
    };

    endpointMap.set(createStateReferenceKey(reference), {
      type: "zeeman",
      id: node.id,
      reference,
      x1: node.x1,
      x2: node.x2,
      y: node.y,
      energyTHz: node.absoluteEnergyTHz,
      label: `${node.parentLabel}  F=${formatQuantumNumber(node.parentF)}  mF=${signedQuantumLabel(node.mF)}`,
      labelPlain: `${node.parentLabelPlain}  F=${formatQuantumNumber(node.parentF)}  mF=${signedQuantumLabel(node.mF)}`,
      sortX: node.x1,
      sortY: node.y,
      measurementComponents: createZeemanMeasurementComponents(getFineStateById(node.parentId), node),
    });
  });

  return endpointMap;
}

function createPotentialStateReferenceKeySet(fineStateCollection) {
  const keys = new Set();

  fineStateCollection.forEach((state) => {
    keys.add(createStateReferenceKey({
      fineStateId: state.id,
      F: null,
      mF: null,
    }));

    (state.hyperfine || []).forEach((hyperfineLevel) => {
      keys.add(createStateReferenceKey({
        fineStateId: state.id,
        F: hyperfineLevel.F,
        mF: null,
      }));

      createZeemanLevels(hyperfineLevel).forEach((zeemanLevel) => {
        keys.add(createStateReferenceKey({
          fineStateId: state.id,
          F: hyperfineLevel.F,
          mF: zeemanLevel.mF,
        }));
      });
    });
  });

  return keys;
}

function buildStateTransitionAnchorMap(transitions) {
  const transitionsByEndpointKey = new Map();

  transitions.forEach((transition) => {
    [transition.endpointOne, transition.endpointTwo].forEach((endpoint) => {
      if (!endpoint) {
        return;
      }

      const endpointKey = createStateReferenceKey(endpoint.reference);

      if (!transitionsByEndpointKey.has(endpointKey)) {
        transitionsByEndpointKey.set(endpointKey, []);
      }

      transitionsByEndpointKey.get(endpointKey).push(transition);
    });
  });

  const anchorMap = new Map();

  transitionsByEndpointKey.forEach((endpointTransitions, endpointKey) => {
    const exemplar = endpointTransitions[0];
    const endpoint = createStateReferenceKey(exemplar.endpointOne.reference) === endpointKey
      ? exemplar.endpointOne
      : exemplar.endpointTwo;

    if (!endpoint || endpointTransitions.length === 0) {
      return;
    }

    const ordered = [...endpointTransitions].sort((leftTransition, rightTransition) => {
      const leftOther = createStateReferenceKey(leftTransition.endpointOne.reference) === endpointKey
        ? leftTransition.endpointTwo
        : leftTransition.endpointOne;
      const rightOther = createStateReferenceKey(rightTransition.endpointOne.reference) === endpointKey
        ? rightTransition.endpointTwo
        : rightTransition.endpointOne;
      const yDelta = (leftOther?.sortY ?? 0) - (rightOther?.sortY ?? 0);

      if (Math.abs(yDelta) > 1e-6) {
        return yDelta;
      }

      const xDelta = (leftOther?.sortX ?? 0) - (rightOther?.sortX ?? 0);

      if (Math.abs(xDelta) > 1e-9) {
        return xDelta;
      }

      return leftTransition.id.localeCompare(rightTransition.id);
    });

    const anchors = computeCenteredTransitionAnchorsOnBar(endpoint.x1, endpoint.x2, ordered.length);

    ordered.forEach((transition, index) => {
      anchorMap.set(`${endpointKey}::${transition.id}`, anchors[index] ?? ((endpoint.x1 + endpoint.x2) / 2));
    });
  });

  return anchorMap;
}

function buildTransitionNodes(fineStateMap, hyperfineNodeMap, zeemanNodeMap, issues, endpointMap = createVisibleStateEndpointMap(fineStateMap, hyperfineNodeMap, zeemanNodeMap)) {
  const potentialEndpointKeys = createPotentialStateReferenceKeySet(fineStates);
  const normalizedTransitions = (Array.isArray(config.transitions) ? config.transitions : [])
    .map((transition) => {
      if (!Array.isArray(transition.between) || transition.between.length !== 2) {
        issues.push({
          key: `transition:${transition.id}:pair`,
          title: "Invalid transition",
          message: `Transition "${transition.id}" must use exactly two endpoints in between = ["state A", "state B"].`,
        });
        return null;
      }

      const endpointRefOne = parseStateReference(transition.between[0]);
      const endpointRefTwo = parseStateReference(transition.between[1]);

      if (!endpointRefOne || !endpointRefTwo) {
        issues.push({
          key: `transition:${transition.id}:syntax`,
          title: "Invalid state reference",
          message: `Transition "${transition.id}" contains an endpoint that could not be parsed. Use forms like "5P3/2", "3D[3/2]1/2", "5P3/2[F=3]", or "3D[3/2]1/2[F=1,mF=0]".`,
        });
        return null;
      }

      const endpointOneKey = createStateReferenceKey(endpointRefOne);
      const endpointTwoKey = createStateReferenceKey(endpointRefTwo);

      if (!potentialEndpointKeys.has(endpointOneKey)) {
        issues.push({
          key: `transition:${transition.id}:missing:${endpointOneKey}`,
          title: "Unknown state reference",
          message: `Transition "${transition.id}" refers to "${transition.between[0]}", but no such state bar exists in this diagram.`,
        });
        return null;
      }

      if (!potentialEndpointKeys.has(endpointTwoKey)) {
        issues.push({
          key: `transition:${transition.id}:missing:${endpointTwoKey}`,
          title: "Unknown state reference",
          message: `Transition "${transition.id}" refers to "${transition.between[1]}", but no such state bar exists in this diagram.`,
        });
        return null;
      }

      const endpointOne = endpointMap.get(endpointOneKey);
      const endpointTwo = endpointMap.get(endpointTwoKey);

      if (!endpointOne || !endpointTwo) {
        return null;
      }

      if (endpointOne.type === endpointTwo.type && endpointOne.id === endpointTwo.id) {
        issues.push({
          key: `transition:${transition.id}:same-endpoint`,
          title: "Invalid transition",
          message: `Transition "${transition.id}" resolves both endpoints to the same state bar.`,
        });
        return null;
      }

      const lowerEndpoint = endpointOne.energyTHz <= endpointTwo.energyTHz ? endpointOne : endpointTwo;
      const upperEndpoint = lowerEndpoint === endpointOne ? endpointTwo : endpointOne;
      const frequencyTHz = computeTransitionFrequencyTHz(endpointOne, endpointTwo);
      const wavelengthNm = computeTransitionWavelengthNm(frequencyTHz);

      return {
        ...transition,
        labelFields: resolveTransitionLabelFields(
          transition.id,
          Array.isArray(transition.labelFields) && transition.labelFields.length > 0
            ? transition.labelFields
            : ["wavelength"],
        ),
        type: "transition",
        endpointOne,
        endpointTwo,
        endpointOneLabel: endpointOne.label,
        endpointTwoLabel: endpointTwo.label,
        endpointOneLabelPlain: endpointOne.labelPlain,
        endpointTwoLabelPlain: endpointTwo.labelPlain,
        lowerLabel: lowerEndpoint.label,
        upperLabel: upperEndpoint.label,
        lowerLabelPlain: lowerEndpoint.labelPlain,
        upperLabelPlain: upperEndpoint.labelPlain,
        frequencyTHz,
        wavelengthNm,
        color: getTransitionColor(wavelengthNm),
        band: describeWavelengthBand(wavelengthNm),
        isExplicitlyHidden: isTransitionExplicitlyHidden(transition.id),
        isSuppressedByHiddenState: isTransitionSuppressedByHiddenState(transition.id, endpointOne, endpointTwo),
      };
    })
    .filter(Boolean);

  const filteredTransitions = currentHideToolEnabled
    ? normalizedTransitions
    : normalizedTransitions.filter((transition) => !transition.isExplicitlyHidden && !transition.isSuppressedByHiddenState);

  const anchorMap = buildStateTransitionAnchorMap(filteredTransitions);
  const anchoredTransitions = filteredTransitions.map((transition) => {
    const endpointOneKey = createStateReferenceKey(transition.endpointOne.reference);
    const endpointTwoKey = createStateReferenceKey(transition.endpointTwo.reference);
    const rawX1 = anchorMap.get(`${endpointOneKey}::${transition.id}`) ?? ((transition.endpointOne.x1 + transition.endpointOne.x2) / 2);
    const rawX2 = anchorMap.get(`${endpointTwoKey}::${transition.id}`) ?? ((transition.endpointTwo.x1 + transition.endpointTwo.x2) / 2);
    const rawY1 = transition.endpointOne.y;
    const rawY2 = transition.endpointTwo.y;
    const insetEndpoints = insetTransitionEndpoints(
      rawX1,
      rawY1,
      rawX2,
      rawY2,
      layoutConfig.transitionEndInsetPx,
    );
    const x1 = insetEndpoints.x1;
    const y1 = insetEndpoints.y1;
    const x2 = insetEndpoints.x2;
    const y2 = insetEndpoints.y2;

    const node = {
      ...transition,
      rawX1,
      rawY1,
      rawX2,
      rawY2,
      x1,
      y1,
      x2,
      y2,
      midX: (x1 + x2) / 2,
      midY: (y1 + y2) / 2,
    };

    node.labelLines = getTransitionLabelLines(node);
    return node;
  });

  return anchoredTransitions.map((transition) => {
    const vectorGeometry = getTransitionVectorGeometry(transition);

    return {
      ...transition,
      vectorGeometry,
      pathData: buildTransitionPathData(transition),
    };
  });
}

function buildLayoutModel() {
  const positionedFineStates = applyColumnPositions(computePositionedFineStates());
  const fineStateMap = new Map(positionedFineStates.map((state) => [state.id, state]));
  const hyperfineByFineId = new Map();
  const hyperfineNodes = [];
  const hyperfineEllipsisNodes = [];
  const zeemanAnchorByFineId = new Map();
  const zeemanNodes = [];
  const zeemanEllipsisNodes = [];
  const diagramIssues = Array.isArray(config.diagramIssues) ? [...config.diagramIssues] : [];

  positionedFineStates.forEach((fineState) => {
    if (!expandedFine.has(fineState.id)) {
      hyperfineByFineId.set(fineState.id, []);
      return;
    }

    const substructureLayout = buildExpandedStateLayout(fineState, {
      parentEndX: fineBarEnd(fineState),
      parentEnergyY: fineState.energyY,
    });

    hyperfineByFineId.set(fineState.id, substructureLayout.hyperfineNodes);
    hyperfineNodes.push(...substructureLayout.hyperfineNodes);
    hyperfineEllipsisNodes.push(...substructureLayout.hyperfineEllipses);

    if (Number.isFinite(substructureLayout.zeemanAnchorX)) {
      zeemanAnchorByFineId.set(fineState.id, substructureLayout.zeemanAnchorX);
    }

    zeemanNodes.push(...substructureLayout.zeemanNodes);
    zeemanEllipsisNodes.push(...substructureLayout.zeemanEllipses);
  });

  const hyperfineNodeMap = new Map(hyperfineNodes.map((node) => [node.id, node]));
  const zeemanNodeMap = new Map(zeemanNodes.map((node) => [node.id, node]));
  const visibleEndpointMap = createVisibleStateEndpointMap(fineStateMap, hyperfineNodeMap, zeemanNodeMap);
  const visibleEndpointNodeMap = new Map(
    Array.from(visibleEndpointMap.values()).map((endpoint) => [createEndpointNodeKey(endpoint.type, endpoint.id), endpoint]),
  );
  let transitionNodes = buildTransitionNodes(fineStateMap, hyperfineNodeMap, zeemanNodeMap, diagramIssues, visibleEndpointMap);
  const stateBarObstacles = createStateBarObstacles({
    fineStates: positionedFineStates,
    hyperfineNodes,
    zeemanNodes,
  });
  const acceptedTransitionLabelRects = [];

  transitionNodes = transitionNodes.map((node) => ({
    ...node,
    labelPosition: shouldShowTransitionLabel(node)
      ? chooseTransitionLabelPosition(node, { stateBarObstacles }, acceptedTransitionLabelRects)
      : null,
  }));
  const measurementNodes = buildMeasurementNodes(visibleEndpointNodeMap, { stateBarObstacles });

  return {
    fineStates: positionedFineStates,
    fineStateMap,
    diagramIssues,
    measurementNodes,
    measurementNodeMap: new Map(measurementNodes.map((node) => [node.id, node])),
    transitionNodes,
    stateBarObstacles,
    transitionNodeMap: new Map(transitionNodes.map((node) => [node.id, node])),
    visibleEndpointMap,
    visibleEndpointNodeMap,
    hyperfineNodes,
    hyperfineEllipsisNodes,
    hyperfineByFineId,
    hyperfineNodeMap,
    zeemanNodes,
    zeemanEllipsisNodes,
    zeemanAnchorByFineId,
    zeemanNodeMap,
  };
}

function buildTooltipHyperfineScalePreview(fineState) {
  if (!expandedFine.has(fineState.id)) {
    return null;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "inspector-control-card tooltip-control-card";

  const header = document.createElement("div");
  header.className = "hyperfine-scale-header";

  const label = document.createElement("strong");
  label.textContent = "Hyperfine scale";

  const value = document.createElement("span");
  value.textContent = `${formatFieldScale(getHyperfineScaleForFineState(fineState.id), 2)}x`;

  const sliderLabel = document.createElement("label");
  sliderLabel.className = "slider-control tooltip-slider-preview";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "1";
  slider.step = "0.001";
  slider.value = String(hyperfineScaleToSliderValue(getHyperfineScaleForFineState(fineState.id)));
  slider.disabled = true;

  const hint = document.createElement("p");
  hint.className = "tooltip-control-hint";
  hint.textContent = "Right-click to pin this panel and adjust the slider.";

  header.append(label, value);
  sliderLabel.append(slider);
  wrapper.append(header, sliderLabel, hint);
  return wrapper;
}

function showTooltip(event, kicker, title, subtitle, rows, controlMarkup = null) {
  tooltip.hidden = false;
  tooltip.classList.remove("is-reference-tooltip");
  tooltipKicker.textContent = kicker;
  setMixedTextContent(tooltipTitle, title);
  setMixedTextContent(tooltipSubtitle, subtitle);
  tooltipTitle.hidden = !String(tooltipTitle.textContent || "").trim();
  tooltipSubtitle.hidden = !subtitle;
  renderMetadataRows(tooltipMetadata, rows);
  renderTooltipControls(controlMarkup);

  moveTooltip(event);
}

function moveTooltip(event) {
  const padding = 18;
  const tooltipRect = tooltip.getBoundingClientRect();
  const maxX = window.innerWidth - tooltipRect.width - padding;
  const maxY = window.innerHeight - tooltipRect.height - padding;
  const left = Math.min(event.clientX + 18, Math.max(padding, maxX));
  const top = Math.min(event.clientY + 18, Math.max(padding, maxY));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip() {
  tooltip.hidden = true;
  tooltip.classList.remove("is-reference-tooltip");
  renderTooltipControls(null);
}

function createRenderTransition(durationMs) {
  if (!durationMs || durationMs <= 0) {
    return null;
  }

  return d3.transition()
    .duration(durationMs)
    .ease(d3.easeCubicOut);
}

function applyTransition(selection, transition) {
  return transition ? selection.transition(transition) : selection;
}

function ensureTransitionMarkerDefinition() {
  const defs = svg.selectAll("defs.diagram-defs")
    .data([null])
    .join("defs")
    .attr("class", "diagram-defs");

  const marker = defs.selectAll("marker#transition-arrowhead")
    .data([null])
    .join("marker")
    .attr("id", "transition-arrowhead")
    .attr("viewBox", "0 -6 14 12")
    .attr("refX", 8.8)
    .attr("refY", 0)
    .attr("markerWidth", layoutConfig.transitionArrowSizePx)
    .attr("markerHeight", layoutConfig.transitionArrowSizePx)
    .attr("markerUnits", "userSpaceOnUse")
    .attr("orient", "auto-start-reverse");

  marker.selectAll("path")
    .data([null])
    .join("path")
    .attr("d", "M 0 -5.1 L 11.8 0 L 0 5.1 z")
    .attr("fill", "context-stroke");
}

ensureTransitionMarkerDefinition();

let suppressZoomPersistence = false;
let lastWindowActivationAt = 0;

function markWindowActivated() {
  lastWindowActivationAt = performance.now();
}

const zoomBehavior = d3.zoom()
  .filter((event) => {
    const activatedRecently = lastWindowActivationAt > 0 && (performance.now() - lastWindowActivationAt) < 280;

    if (activatedRecently && event.type === "wheel") {
      return false;
    }

    return (!event.ctrlKey || event.type === "wheel") && !event.button;
  })
  .scaleExtent([0.55, 4.5])
  .on("zoom", (event) => {
    currentZoomTransform = event.transform;
    scene.attr("transform", currentZoomTransform);
    renderFineLabelOverlay(currentLayout, 0);
    positionPinnedPanels();
  })
  .on("end", () => {
    if (suppressZoomPersistence) {
      suppressZoomPersistence = false;
      return;
    }

    persistState({ recordHistory: false, announce: false });
  });

svg.call(zoomBehavior);
svg.on("dblclick.zoom", null);

window.addEventListener("focus", markWindowActivated);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    markWindowActivated();
  }
});

function drawGuides(layout, transition) {
  const groundState = layout.fineStateMap.get("5S1/2") || layout.fineStates[0];

  if (!groundState) {
    layers.guides.selectAll("*").remove();
    return;
  }

  const guideY = groundState.energyY;
  const guideOffset = Math.max(72, (groundState.spanBottom || 10) + 28);

  const line = layers.guides.selectAll("line.ground-guide")
    .data([guideY + guideOffset])
    .join("line")
    .attr("class", "ground-guide")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right - 180);

  applyTransition(line, transition)
    .attr("y1", (d) => d)
    .attr("y2", (d) => d);

  const note = layers.guides.selectAll("text.state-note.guide-note")
    .data([guideY + guideOffset + 24])
    .join("text")
    .attr("class", "state-note guide-note")
    .attr("x", margin.left)
    .text("Fine-state heights are stacked by energy order; each hyperfine manifold has its own visual scale, while Zeeman shifts use one global MHz scale.");

  applyTransition(note, transition)
    .attr("y", (d) => d);
}

function renderTransitions(layout, transition) {
  const groups = layers.transitions.selectAll("g.transition-hit")
    .data(layout.transitionNodes, (d) => d.id)
    .join(
      (enter) => {
        const entered = enter.append("g")
          .attr("class", "transition-hit")
          .classed("is-hovered", false)
          .attr("opacity", 0);

        entered.append("path")
          .attr("class", "transition-hit-target");

        entered.append("path")
          .attr("class", "transition-line")
          .attr("marker-start", "url(#transition-arrowhead)")
          .attr("marker-end", "url(#transition-arrowhead)");

        entered.append("text")
          .attr("class", "transition-label")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central");

        applyTransition(entered, transition)
          .attr("opacity", 1);

        return entered;
      },
      (update) => update,
      (exit) => {
        applyTransition(exit, transition)
          .attr("opacity", 0)
          .remove();
      },
    )
    .attr("class", "transition-hit")
    .classed("is-hovered", false)
    .classed("is-hidden-item", (d) => d.isExplicitlyHidden)
    .classed("is-hide-mode", currentHideToolEnabled)
    .on("click", (_, d) => {
      if (!currentHideToolEnabled) {
        return;
      }

      const hidden = toggleTransitionHidden(d.id);
      persistState();
      render(CONTROL_ANIMATION_MS);
      setStatus(hidden ? `Hidden transition ${d.endpointOneLabelPlain} ↔ ${d.endpointTwoLabelPlain}.` : `Shown transition ${d.endpointOneLabelPlain} ↔ ${d.endpointTwoLabelPlain}.`);
    })
    .on("mouseenter", function (event, d) {
      d3.select(this).classed("is-hovered", true);
      showTooltip(
        event,
        "Transition",
        buildTransitionTitle(d),
        "",
        getTransitionDetail(d),
      );
    })
    .on("mousemove", (event) => moveTooltip(event))
    .on("mouseleave", function () {
      d3.select(this).classed("is-hovered", false);
      hideTooltip();
    })
    .on("contextmenu", (event, d) => {
      event.preventDefault();
      pinInspector(event, "transition", d.id);
    });

  applyTransition(groups, transition)
    .attr("opacity", 1)
    .attr("color", (d) => d.color);

  applyTransition(groups.select("path.transition-hit-target"), transition)
    .attr("d", (d) => d.pathData)
    .attr("stroke-width", layoutConfig.transitionHitWidth);

  applyTransition(groups.select("path.transition-line"), transition)
    .attr("d", (d) => d.pathData)
    .attr("stroke", (d) => d.isExplicitlyHidden ? "var(--text-muted)" : d.color)
    .attr("color", (d) => d.color)
    .attr("stroke-width", layoutConfig.transitionStrokeWidth);

  applyTransition(groups.select("text.transition-label"), transition)
    .attr("x", (d) => d.labelPosition?.x ?? d.midX)
    .attr("y", (d) => d.labelPosition?.y ?? d.midY)
    .attr("fill", (d) => d.isExplicitlyHidden ? "var(--text-muted)" : d.color)
    .style("display", (d) => (shouldShowTransitionLabel(d) ? null : "none"))
    .style("pointer-events", currentHideToolEnabled ? "auto" : "none")
    .each(function (d) {
      const text = d3.select(this);
      text.selectAll("tspan").remove();

      (Array.isArray(d.labelLines) ? d.labelLines : []).forEach((line, index) => {
        text.append("tspan")
          .attr("x", d.labelPosition?.x ?? d.midX)
          .attr("dy", index === 0 ? "0em" : "1.05em")
          .text(line);
      });
    });
}

function isMeasureSelectionActive(type, id) {
  return currentMeasureSelection.some((selection) => areMeasureSelectionsEqual(selection, { type, id }));
}

function handleMeasureSelection(type, id) {
  const selection = normalizeMeasureSelection({ type, id });

  if (!selection) {
    return;
  }

  if (!currentMeasureToolEnabled) {
    return;
  }

  if (currentMeasureSelection.length === 0) {
    currentMeasureSelection = [selection];
    persistState();
    render(CONTROL_ANIMATION_MS);
    return;
  }

  if (areMeasureSelectionsEqual(currentMeasureSelection[0], selection)) {
    currentMeasureSelection = [selection];
    persistState();
    render(CONTROL_ANIMATION_MS);
    return;
  }

  const firstSelection = currentMeasureSelection[0];
  const endpointOne = currentLayout?.visibleEndpointNodeMap?.get(createEndpointNodeKey(firstSelection.type, firstSelection.id)) || null;
  const endpointTwo = currentLayout?.visibleEndpointNodeMap?.get(createEndpointNodeKey(selection.type, selection.id)) || null;
  const defaultLabelFields = endpointOne && endpointTwo
    ? getDefaultMeasurementLabelFieldKeys({ endpointOne, endpointTwo })
    : [];
  const measurement = normalizeMeasurementEntry({
    between: [firstSelection.id, selection.id],
    show: defaultLabelFields,
  });

  if (!measurement) {
    return;
  }

  const existingIndex = currentMeasurements.findIndex((entry) => normalizeMeasurementEntry(entry)?.id === measurement.id);

  if (existingIndex >= 0) {
    currentMeasurements.splice(existingIndex, 1);
    setStatus("Existing measure line removed.");
  } else {
    currentMeasurements = [...currentMeasurements, measurement];
    setStatus("Measure line added.");
  }

  currentMeasureSelection = [];
  persistState();
  render(CONTROL_ANIMATION_MS);
}

function removeMeasurement(measurementId) {
  currentMeasurements = currentMeasurements.filter((measurement) => normalizeMeasurementEntry(measurement)?.id !== measurementId);
  persistState();
  render(CONTROL_ANIMATION_MS);
  setStatus("Measure line removed.");
}

function renderMeasurementLines(layout, transition) {
  const groups = layers.measurements.selectAll("g.measure-hit")
    .data(layout.measurementNodes || [], (d) => d.id)
    .join(
      (enter) => {
        const entered = enter.append("g")
          .attr("class", "measure-hit")
          .attr("opacity", 0);

        entered.append("line").attr("class", "measure-hit-target");
        entered.append("line").attr("class", "measure-line");
        entered.append("line").attr("class", "measure-tick measure-tick-start");
        entered.append("line").attr("class", "measure-tick measure-tick-end");
        entered.append("text")
          .attr("class", "measure-label")
          .attr("text-anchor", "middle");

        const removeButton = entered.append("g")
          .attr("class", "measure-remove-button")
          .style("display", "none");

        removeButton.append("circle")
          .attr("class", "measure-remove-button-chip");

        removeButton.append("text")
          .attr("class", "measure-remove-button-label")
          .text("X");

        applyTransition(entered, transition)
          .attr("opacity", 1);

        return entered;
      },
      (update) => update,
      (exit) => {
        applyTransition(exit, transition)
          .attr("opacity", 0)
          .remove();
      },
    );

  groups
    .classed("is-hidden-item", (d) => d.isHidden)
    .classed("is-hide-mode", currentHideToolEnabled)
    .on("mouseenter", function (event, d) {
      showTooltip(
        event,
        "Measurement",
        "",
        "",
        getMeasurementDetail(d),
      );
    })
    .on("mousemove", (event) => moveTooltip(event))
    .on("mouseleave", hideTooltip)
    .on("contextmenu", (event, d) => {
      event.preventDefault();
      pinInspector(event, "measurement", d.id);
    });

  applyTransition(groups.select("line.measure-hit-target"), transition)
    .attr("x1", (d) => d.x1)
    .attr("y1", (d) => d.y1)
    .attr("x2", (d) => d.x2)
    .attr("y2", (d) => d.y2);

  applyTransition(groups.select("line.measure-line"), transition)
    .attr("x1", (d) => d.x1)
    .attr("y1", (d) => d.y1)
    .attr("x2", (d) => d.x2)
    .attr("y2", (d) => d.y2);

  applyTransition(groups.select("line.measure-tick-start"), transition)
    .attr("x1", (d) => d.x1 - (d.vectorGeometry.normalX * layoutConfig.measureTickSizePx))
    .attr("y1", (d) => d.y1 - (d.vectorGeometry.normalY * layoutConfig.measureTickSizePx))
    .attr("x2", (d) => d.x1 + (d.vectorGeometry.normalX * layoutConfig.measureTickSizePx))
    .attr("y2", (d) => d.y1 + (d.vectorGeometry.normalY * layoutConfig.measureTickSizePx));

  applyTransition(groups.select("line.measure-tick-end"), transition)
    .attr("x1", (d) => d.x2 - (d.vectorGeometry.normalX * layoutConfig.measureTickSizePx))
    .attr("y1", (d) => d.y2 - (d.vectorGeometry.normalY * layoutConfig.measureTickSizePx))
    .attr("x2", (d) => d.x2 + (d.vectorGeometry.normalX * layoutConfig.measureTickSizePx))
    .attr("y2", (d) => d.y2 + (d.vectorGeometry.normalY * layoutConfig.measureTickSizePx));

  groups.select("text.measure-label")
    .each(function (d) {
      const text = d3.select(this);
      text.selectAll("tspan").remove();

      applyTransition(text, transition)
        .attr("x", d.labelPosition?.x ?? d.midX)
        .attr("y", d.labelPosition?.y ?? d.midY)
        .style("display", d.lines.length > 0 ? null : "none");

      d.lines.forEach((line, index) => {
        text.append("tspan")
          .attr("x", d.labelPosition?.x ?? d.midX)
          .attr("dy", index === 0 ? "0em" : "1.05em")
          .text(line);
      });
    });

  const removeButtons = groups.select("g.measure-remove-button")
    .style("display", currentMeasureToolEnabled ? null : "none")
    .on("click", (event, d) => {
      event.preventDefault();
      event.stopPropagation();
      removeMeasurement(d.id);
    })
    .on("contextmenu", (event, d) => {
      event.preventDefault();
      event.stopPropagation();
      removeMeasurement(d.id);
    });

  applyTransition(removeButtons, transition)
    .attr("transform", (d) => {
      const labelRect = d.labelPosition?.rect && d.lines.length > 0
        ? d.labelPosition.rect
        : null;
      const x = labelRect
        ? labelRect.right + layoutConfig.measureRemoveButtonGapPx + layoutConfig.measureRemoveButtonRadiusPx
        : d.midX;
      const y = labelRect
        ? labelRect.top + layoutConfig.measureRemoveButtonRadiusPx
        : d.midY - layoutConfig.measureLabelOffsetPx;
      return `translate(${x}, ${y})`;
    });

  removeButtons.select("circle.measure-remove-button-chip")
    .attr("r", layoutConfig.measureRemoveButtonRadiusPx);
}

function expandBounds(bounds, minX, minY, maxX, maxY) {
  bounds.minX = Math.min(bounds.minX, minX);
  bounds.minY = Math.min(bounds.minY, minY);
  bounds.maxX = Math.max(bounds.maxX, maxX);
  bounds.maxY = Math.max(bounds.maxY, maxY);
}

function computeLayoutBounds(layout) {
  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  layout.fineStates.forEach((state) => {
    expandBounds(
      bounds,
      state.lineX - 4,
      state.energyY - 34,
      fineBarEnd(state) + 16,
      state.energyY + 14,
    );
  });

  layout.transitionNodes.forEach((node) => {
    expandBounds(
      bounds,
      Math.min(node.x1, node.x2) - 10,
      Math.min(node.y1, node.y2) - 10,
      Math.max(node.x1, node.x2) + 10,
      Math.max(node.y1, node.y2) + 10,
    );

    if (shouldShowTransitionLabel(node)) {
      const labelRect = node.labelPosition?.rect || estimateTransitionLabelRect(node, node.midX, node.midY);
      expandBounds(
        bounds,
        labelRect.left,
        labelRect.top,
        labelRect.right,
        labelRect.bottom,
      );
    }
  });

  (layout.measurementNodes || []).forEach((node) => {
    expandBounds(
      bounds,
      Math.min(node.x1, node.x2) - 12,
      Math.min(node.y1, node.y2) - 12,
      Math.max(node.x1, node.x2) + 12,
      Math.max(node.y1, node.y2) + 12,
    );

    if (node.labelPosition?.rect && node.lines.length > 0) {
      expandBounds(
        bounds,
        node.labelPosition.rect.left,
        node.labelPosition.rect.top,
        node.labelPosition.rect.right,
        node.labelPosition.rect.bottom,
      );

      if (currentMeasureToolEnabled) {
        const removeButtonRadius = layoutConfig.measureRemoveButtonRadiusPx;
        const removeButtonX = node.labelPosition.rect.right + layoutConfig.measureRemoveButtonGapPx + removeButtonRadius;
        const removeButtonY = node.labelPosition.rect.top + removeButtonRadius;
        expandBounds(
          bounds,
          removeButtonX - removeButtonRadius,
          removeButtonY - removeButtonRadius,
          removeButtonX + removeButtonRadius,
          removeButtonY + removeButtonRadius,
        );
      }
    } else if (currentMeasureToolEnabled) {
      const removeButtonRadius = layoutConfig.measureRemoveButtonRadiusPx;
      expandBounds(
        bounds,
        node.midX - removeButtonRadius,
        node.midY - layoutConfig.measureLabelOffsetPx - removeButtonRadius,
        node.midX + removeButtonRadius,
        node.midY - layoutConfig.measureLabelOffsetPx + removeButtonRadius,
      );
    }
  });

  (layout.hyperfineEllipsisNodes || []).forEach((node) => {
    expandBounds(
      bounds,
      node.x - 10,
      node.y - 16,
      node.x + 10,
      node.y + 16,
    );
  });

  (layout.zeemanEllipsisNodes || []).forEach((node) => {
    expandBounds(
      bounds,
      node.x - 14,
      node.y - 10,
      node.x + 14,
      node.y + 10,
    );
  });

  layout.hyperfineNodes.forEach((node) => {
    expandBounds(bounds, node.x1 - 6, node.y - 22, node.x2 + 12, node.y + 12);
  });

  layout.zeemanNodes.forEach((node) => {
    expandBounds(bounds, node.x1 - 6, node.y - 20, node.x2 + 12, node.y + 10);
  });

  const groundState = layout.fineStateMap.get("5S1/2") || layout.fineStates[0];

  if (groundState) {
    const guideOffset = Math.max(72, (groundState.spanBottom || 10) + 28);
    expandBounds(
      bounds,
      margin.left,
      groundState.energyY - 34,
      width - margin.right - 180,
      groundState.energyY + guideOffset + 12,
    );
  }

  if (!Number.isFinite(bounds.minX)) {
    return {
      minX: margin.left,
      minY: margin.top,
      maxX: width - margin.right,
      maxY: height - margin.bottom,
    };
  }

  return bounds;
}

function getFitViewportOptions() {
  const svgRect = svg.node()?.getBoundingClientRect();

  if (!svgRect || svgRect.width <= 0 || svgRect.height <= 0) {
    return [{
      x: margin.left,
      y: margin.top,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    }];
  }

  const scaleX = width / svgRect.width;
  const scaleY = height / svgRect.height;
  const basePaddingX = 28 * scaleX;
  const basePaddingY = 28 * scaleY;
  const baseRect = {
    x: basePaddingX,
    y: basePaddingY,
    width: Math.max(120, width - (2 * basePaddingX)),
    height: Math.max(120, height - (2 * basePaddingY)),
  };

  const heroRect = heroPanel?.getBoundingClientRect();
  const candidates = [baseRect];
  const panelAwareCandidates = [];

  if (heroRect) {
    const heroRight = Math.max(baseRect.x, (heroRect.right - svgRect.left + 22) * scaleX);
    const heroBottom = Math.max(baseRect.y, (heroRect.bottom - svgRect.top + 22) * scaleY);

    if (heroRight < width - basePaddingX - 120) {
      panelAwareCandidates.push({
        x: heroRight,
        y: baseRect.y,
        width: Math.max(120, width - heroRight - basePaddingX),
        height: baseRect.height,
      });
    }

    if (heroBottom < height - basePaddingY - 120) {
      panelAwareCandidates.push({
        x: baseRect.x,
        y: heroBottom,
        width: baseRect.width,
        height: Math.max(120, height - heroBottom - basePaddingY),
      });
    }

    if (heroRight < width - basePaddingX - 120 && heroBottom < height - basePaddingY - 120) {
      panelAwareCandidates.push({
        x: heroRight,
        y: heroBottom,
        width: Math.max(120, width - heroRight - basePaddingX),
        height: Math.max(120, height - heroBottom - basePaddingY),
      });
    }
  }

  const referencesRect = currentReferencesVisible && referencesPanel && referencesPanel.classList.contains("is-open")
    ? referencesPanel.getBoundingClientRect()
    : null;

  if (referencesRect) {
    const referencesLeft = Math.max(baseRect.x, (referencesRect.left - svgRect.left - 22) * scaleX);
    const referencesTop = Math.max(baseRect.y, (referencesRect.top - svgRect.top - 18) * scaleY);

    if (referencesLeft > baseRect.x + 120) {
      panelAwareCandidates.push({
        x: baseRect.x,
        y: baseRect.y,
        width: Math.max(120, referencesLeft - baseRect.x),
        height: baseRect.height,
      });
    }

    if (referencesTop > baseRect.y + 120) {
      panelAwareCandidates.push({
        x: baseRect.x,
        y: baseRect.y,
        width: baseRect.width,
        height: Math.max(120, referencesTop - baseRect.y),
      });
    }
  }

  return panelAwareCandidates.length > 0 ? panelAwareCandidates : candidates;
}

function computeFitViewTransform(layout) {
  if (!layout || layout.fineStates.length === 0) {
    return d3.zoomIdentity.translate(defaultZoomState.x, defaultZoomState.y).scale(defaultZoomState.k);
  }

  const bounds = computeLayoutBounds(layout);
  const contentWidth = Math.max(1, bounds.maxX - bounds.minX);
  const contentHeight = Math.max(1, bounds.maxY - bounds.minY);
  const candidates = getFitViewportOptions();
  const [minZoom, maxZoom] = zoomBehavior.scaleExtent();

  let bestRect = candidates[0];
  let bestScale = 0;

  candidates.forEach((candidate) => {
    const scale = Math.min(candidate.width / contentWidth, candidate.height / contentHeight);

    if (scale > bestScale) {
      bestScale = scale;
      bestRect = candidate;
    }
  });

  const k = clamp(bestScale * 0.965, minZoom, maxZoom);
  const horizontalSlack = Math.max(0, bestRect.width - (contentWidth * k));
  const verticalSlack = Math.max(0, bestRect.height - (contentHeight * k));
  const x = bestRect.x + (horizontalSlack / 2) - (bounds.minX * k);
  const y = bestRect.y + (verticalSlack * 0.76) - (bounds.minY * k);

  return d3.zoomIdentity.translate(x, y).scale(k);
}

function applyZoomTransform(transform, { persist = true, animationDuration = 0 } = {}) {
  currentZoomTransform = transform;
  suppressZoomPersistence = !persist;

  if (animationDuration > 0) {
    svg.transition()
      .duration(animationDuration)
      .ease(d3.easeCubicOut)
      .call(zoomBehavior.transform, transform);
    return;
  }

  svg.call(zoomBehavior.transform, transform);
}

function fitView({ persist = true, animationDuration = 220 } = {}) {
  const transform = computeFitViewTransform(currentLayout);
  applyZoomTransform(transform, { persist, animationDuration });
}

function renderFineLabelOverlay(layout, animationDuration = 0) {
  if (!fineLabelLayer) {
    return;
  }

  if (!layout || !appShell) {
    fineLabelLayer.innerHTML = "";
    return;
  }

  fineLabelLayer.classList.toggle("is-hide-mode", currentHideToolEnabled);

  const shellRect = appShell.getBoundingClientRect();
  const sceneScale = getSceneScreenScale();
  const existingLabels = new Map(
    Array.from(fineLabelLayer.querySelectorAll("[data-state-id]"))
      .map((element) => [element.dataset.stateId, element]),
  );
  const nextStateIds = new Set();

  layout.fineStates.forEach((state) => {
    nextStateIds.add(state.id);
    let label = existingLabels.get(state.id);

    if (!label) {
      label = document.createElement("div");
      label.className = "fine-state-label fine-state-label-html";
      label.dataset.stateId = state.id;
      label.addEventListener("click", (event) => {
        if (!currentHideToolEnabled) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        const hidden = toggleStateHidden("fine", state.id);
        persistState();
        render(CONTROL_ANIMATION_MS);
        setStatus(hidden ? `Hidden ${state.labelPlain}.` : `Shown ${state.labelPlain}.`);
      });
      fineLabelLayer.append(label);
    }

    const referenceKeys = "";

    if (
      label.dataset.label !== state.label
      || label.dataset.referenceKeys !== referenceKeys
      || label.dataset.referencesVisible !== String(currentReferencesVisible)
    ) {
      label.innerHTML = "";

      const text = document.createElement("span");
      text.className = "fine-state-label-text";
      renderFineStateLabelHtml(text, state);
      label.append(text);

      label.dataset.label = state.label;
      label.dataset.referenceKeys = referenceKeys;
      label.dataset.referencesVisible = String(currentReferencesVisible);
    }

    const screenPosition = getScenePointScreenPosition(
      state.lineX + layoutConfig.labelXOffset,
      state.energyY - layoutConfig.fineLabelYOffset,
    );

    label.style.transition = animationDuration > 0
      ? `left ${animationDuration}ms cubic-bezier(0.22, 1, 0.36, 1), top ${animationDuration}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${animationDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`
      : "none";
    label.style.left = `${screenPosition.x - shellRect.left}px`;
    label.style.top = `${screenPosition.y - shellRect.top}px`;
    label.style.transform = `translate(0, -100%) scale(${sceneScale})`;
    label.classList.toggle("is-hidden-state", isFineStateEffectivelyHidden(state));
    label.classList.toggle("is-hide-mode", currentHideToolEnabled);
  });

  existingLabels.forEach((label, stateId) => {
    if (!nextStateIds.has(stateId)) {
      label.remove();
    }
  });
}

function renderFineStates(layout, transition) {
  const groups = layers.fine.selectAll("g")
    .data(layout.fineStates, (d) => d.id)
    .join(
      (enter) => {
        const entered = enter.append("g")
          .attr("class", "state-hit")
          .classed("is-hovered", false)
          .attr("transform", (d) => `translate(${d.lineX},${d.energyY})`)
          .attr("opacity", 0);

        entered.append("line")
          .attr("class", `state-line ${layoutConfig.fineStateLineClass}`)
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("y2", 0)
          .attr("x2", (d) => fineBarEnd(d) - d.lineX);

        applyTransition(entered, transition)
          .attr("opacity", 1);

        return entered;
      },
      (update) => update,
      (exit) => {
        applyTransition(exit, transition)
          .attr("opacity", 0)
          .remove();
      },
    )
    .attr("class", "state-hit")
    .classed("is-hovered", false)
    .classed("is-measure-selected", (d) => isMeasureSelectionActive("fine", d.id))
    .classed("is-hidden-item", (d) => isFineStateEffectivelyHidden(d))
    .classed("is-hide-mode", currentHideToolEnabled)
    .on("click", (_, d) => {
      if (currentHideToolEnabled) {
        const hidden = toggleStateHidden("fine", d.id);
        persistState();
        render(CONTROL_ANIMATION_MS);
        setStatus(hidden ? `Hidden ${d.labelPlain}.` : `Shown ${d.labelPlain}.`);
        return;
      }

      if (currentMeasureToolEnabled) {
        handleMeasureSelection("fine", d.id);
        return;
      }

      if (expandedFine.has(d.id)) {
        expandedFine.delete(d.id);
        d.hyperfine.forEach((hf) => expandedHyperfine.delete(hf.id));
      } else {
        expandedFine.add(d.id);
      }
      persistState();
      render(EXPAND_COLLAPSE_ANIMATION_MS);
    })
    .on("mouseenter", function (event, d) {
      d3.select(this).classed("is-hovered", true);
      showTooltip(
        event,
        "Fine Structure",
        d.label,
        "",
        getFineDetail(d),
        buildTooltipHyperfineScalePreview(d),
      );
    })
    .on("mousemove", (event) => moveTooltip(event))
    .on("mouseleave", function () {
      d3.select(this).classed("is-hovered", false);
      hideTooltip();
    })
    .on("contextmenu", (event, d) => {
      event.preventDefault();
      pinInspector(event, "fine", d.id);
    });

  applyTransition(groups, transition)
    .attr("transform", (d) => `translate(${d.lineX},${d.energyY})`);

  groups.select("line.state-line")
    .attr("class", `state-line ${layoutConfig.fineStateLineClass}`);

  groups.classed("is-measure-selected", (d) => isMeasureSelectionActive("fine", d.id));
  groups.classed("is-hidden-item", (d) => isFineStateEffectivelyHidden(d));
  groups.classed("is-hide-mode", currentHideToolEnabled);

  applyTransition(groups.select("line.state-line"), transition)
    .attr("x1", 0)
    .attr("x2", (d) => fineBarEnd(d) - d.lineX)
    .attr("y1", 0)
    .attr("y2", 0);
}

function renderHyperfineStates(layout, transition) {
  const hyperfineNodes = layout.hyperfineNodes;
  const hyperfineItems = [
    ...hyperfineNodes.map((node) => ({ ...node, entryKind: "state" })),
    ...((layout.hyperfineEllipsisNodes || []).map((node) => ({ ...node, entryKind: "ellipsis" }))),
  ].sort((left, right) => {
    const positionDelta = (left.y ?? 0) - (right.y ?? 0);

    if (Math.abs(positionDelta) > 1e-9) {
      return positionDelta;
    }

    return left.entryKind === right.entryKind
      ? 0
      : (left.entryKind === "state" ? -1 : 1);
  });

  const connectors = layers.connectors.selectAll("path.hyperfine-link")
    .data(hyperfineNodes, (d) => d.id)
    .join(
      (enter) => enter.append("path")
        .attr("class", "connector hyperfine-link"),
      (update) => update,
      (exit) => {
        applyTransition(exit, transition)
          .attr("opacity", 0)
          .remove();
      },
    )
    .attr("class", "connector hyperfine-link")
    .classed("is-hidden-item", (d) => isHyperfineStateEffectivelyHidden(d))
    .attr("opacity", 1);

  applyTransition(connectors, transition)
    .attr("d", (d) => {
      const fineState = layout.fineStateMap.get(d.parentId);
      const startX = fineBarEnd(fineState);
      return `M ${startX} ${fineState.energyY} C ${startX + layoutConfig.connectorBendX} ${fineState.energyY}, ${d.x1 - layoutConfig.connectorBendX} ${d.y}, ${d.x1} ${d.y}`;
    });

  const entries = layers.hyperfine.selectAll("g.hyperfine-entry")
    .data(hyperfineItems, (d) => `${d.entryKind}:${d.id}`)
    .join(
      (enter) => {
        const entered = enter.append("g")
          .attr("class", (d) => (d.entryKind === "state"
            ? "hyperfine-entry state-hit hyperfine-state"
            : "hyperfine-entry ellipsis-note hyperfine-ellipsis"))
          .classed("is-hovered", false)
          .attr("transform", (d) => d.entryKind === "state"
            ? `translate(${d.x1},${d.y})`
            : `translate(${d.x},${d.y})`)
          .attr("opacity", 0);

        entered.each(function (d) {
          const group = d3.select(this);

          if (d.entryKind === "state") {
            group.append("line")
              .attr("class", "state-line hyperfine-line")
              .attr("x1", 0)
              .attr("y1", 0)
              .attr("y2", 0)
              .attr("x2", d.x2 - d.x1);

            group.append("text")
              .attr("class", "state-label hyperfine-state-label")
              .attr("x", layoutConfig.labelXOffset)
              .attr("y", -layoutConfig.hyperfineLabelYOffset)
              .text(hyperfineLabel(d));
            return;
          }

          [-6, 0, 6].forEach((offsetY) => {
            group.append("circle")
              .attr("class", "ellipsis-dot")
              .attr("cx", 0)
              .attr("cy", offsetY)
              .attr("r", 1.7);
          });
        });

        applyTransition(entered, transition)
          .attr("opacity", 1);

        return entered;
      },
      (update) => update,
      (exit) => {
        applyTransition(exit, transition)
          .attr("opacity", 0)
          .remove();
      },
    )
    .attr("class", (d) => (d.entryKind === "state"
      ? "hyperfine-entry state-hit hyperfine-state"
      : "hyperfine-entry ellipsis-note hyperfine-ellipsis"))
    .classed("is-hovered", false)
    .classed("is-measure-selected", (d) => d.entryKind === "state" && isMeasureSelectionActive("hyperfine", d.id))
    .classed("is-hidden-item", (d) => d.entryKind === "state" && isHyperfineStateEffectivelyHidden(d))
    .classed("is-hide-mode", currentHideToolEnabled)
    .on("click", (_, d) => {
      if (d.entryKind !== "state") {
        return;
      }

      if (currentHideToolEnabled) {
        const hidden = toggleStateHidden("hyperfine", d.id);
        persistState();
        render(CONTROL_ANIMATION_MS);
        setStatus(hidden ? `Hidden ${d.parentLabelPlain} ${hyperfineLabel(d)}.` : `Shown ${d.parentLabelPlain} ${hyperfineLabel(d)}.`);
        return;
      }

      if (currentMeasureToolEnabled) {
        handleMeasureSelection("hyperfine", d.id);
        return;
      }

      if (expandedHyperfine.has(d.id)) {
        expandedHyperfine.delete(d.id);
      } else {
        expandedHyperfine.add(d.id);
      }
      persistState();
      render(EXPAND_COLLAPSE_ANIMATION_MS);
    })
    .on("mouseenter", function (event, d) {
      if (d.entryKind !== "state") {
        return;
      }

      d3.select(this).classed("is-hovered", true);
      showTooltip(event, "Hyperfine Level", `${d.parentLabel}  ${hyperfineLabel(d)}`, "", getHyperfineDetail(d));
    })
    .on("mousemove", (event) => moveTooltip(event))
    .on("mouseleave", function () {
      d3.select(this).classed("is-hovered", false);
      hideTooltip();
    })
    .on("contextmenu", (event, d) => {
      if (d.entryKind !== "state") {
        return;
      }

      event.preventDefault();
      pinInspector(event, "hyperfine", d.id);
    });

  applyTransition(entries, transition)
    .attr("transform", (d) => d.entryKind === "state"
      ? `translate(${d.x1},${d.y})`
      : `translate(${d.x},${d.y})`);

  const stateGroups = entries.filter((d) => d.entryKind === "state");

  stateGroups.classed("is-measure-selected", (d) => isMeasureSelectionActive("hyperfine", d.id));
  stateGroups.classed("is-hidden-item", (d) => isHyperfineStateEffectivelyHidden(d));
  stateGroups.classed("is-hide-mode", currentHideToolEnabled);

  applyTransition(stateGroups.select("line.state-line"), transition)
    .attr("x1", 0)
    .attr("x2", (d) => d.x2 - d.x1)
    .attr("y1", 0)
    .attr("y2", 0);

  stateGroups.select("text.state-label")
    .attr("x", layoutConfig.labelXOffset)
    .attr("y", -layoutConfig.hyperfineLabelYOffset)
    .text((d) => hyperfineLabel(d));
}

function renderZeemanStates(layout, transition) {
  const expandedHyperfineNodes = layout.hyperfineNodes.filter((node) => expandedHyperfine.has(node.id));
  const zeemanNodes = layout.zeemanNodes;
  const zeemanItems = [
    ...zeemanNodes.map((node) => ({ ...node, entryKind: "state" })),
    ...((layout.zeemanEllipsisNodes || []).map((node) => ({ ...node, entryKind: "ellipsis" }))),
  ].sort((left, right) => {
    const positionDelta = (left.y ?? 0) - (right.y ?? 0);

    if (Math.abs(positionDelta) > 1e-9) {
      return positionDelta;
    }

    return left.entryKind === right.entryKind
      ? 0
      : (left.entryKind === "state" ? -1 : 1);
  });

  layers.connectors.selectAll("path.zeeman-link")
    .data(expandedHyperfineNodes, (d) => d.id)
    .join(
      (enter) => enter.append("path")
        .attr("class", "connector zeeman-link"),
      (update) => update,
      (exit) => {
        applyTransition(exit, transition)
          .attr("opacity", 0)
          .remove();
      },
    )
    .attr("class", "connector zeeman-link")
    .classed("is-hidden-item", (d) => isHyperfineStateEffectivelyHidden(d))
    .attr("opacity", 1)
    .call((selection) => applyTransition(selection, transition)
      .attr("d", (d) => {
        const anchorX = layout.zeemanAnchorByFineId.get(d.parentId);
        return `M ${d.x2} ${d.y} C ${d.x2 + layoutConfig.connectorBendX} ${d.y}, ${anchorX - layoutConfig.connectorBendX} ${d.y}, ${anchorX} ${d.y}`;
      }));

  const entries = layers.zeeman.selectAll("g.zeeman-entry")
    .data(zeemanItems, (d) => `${d.entryKind}:${d.id}`)
    .join(
      (enter) => {
        const entered = enter.append("g")
          .attr("class", (d) => (d.entryKind === "state"
            ? "zeeman-entry state-hit zeeman-state"
            : "zeeman-entry ellipsis-note zeeman-ellipsis"))
          .classed("is-hovered", false)
          .attr("transform", (d) => d.entryKind === "state"
            ? `translate(${d.x1},${d.y})`
            : `translate(${d.x},${d.y})`)
          .attr("opacity", 0);

        entered.each(function (d) {
          const group = d3.select(this);

          if (d.entryKind === "state") {
            group.append("line")
              .attr("class", "state-line zeeman-line")
              .attr("x1", 0)
              .attr("y1", 0)
              .attr("y2", 0)
              .attr("x2", d.x2 - d.x1);

            group.append("text")
              .attr("class", "state-note")
              .attr("x", layoutConfig.labelXOffset)
              .attr("y", -layoutConfig.zeemanLabelYOffset)
              .each(function () {
                renderSubscriptTokenLabel(d3.select(this), "m", "F", zeemanStateLabel(d.mF));
              });
            return;
          }

          [-8, 0, 8].forEach((offsetX) => {
            group.append("circle")
              .attr("class", "ellipsis-dot")
              .attr("cx", offsetX)
              .attr("cy", 0)
              .attr("r", 1.7);
          });
        });

        applyTransition(entered, transition)
          .attr("opacity", 1);

        return entered;
      },
      (update) => update,
      (exit) => {
        applyTransition(exit, transition)
          .attr("opacity", 0)
          .remove();
      },
    )
    .attr("class", (d) => (d.entryKind === "state"
      ? "zeeman-entry state-hit zeeman-state"
      : "zeeman-entry ellipsis-note zeeman-ellipsis"))
    .classed("is-hovered", false)
    .classed("is-measure-selected", (d) => d.entryKind === "state" && isMeasureSelectionActive("zeeman", d.id))
    .classed("is-hidden-item", (d) => d.entryKind === "state" && isZeemanStateEffectivelyHidden(d))
    .classed("is-hide-mode", currentHideToolEnabled)
    .on("mouseenter", function (event, d) {
      if (d.entryKind !== "state") {
        return;
      }

      d3.select(this).classed("is-hovered", true);
      showTooltip(event, "Zeeman Sublevel", "", "", getZeemanDetail(d));
      setZeemanTitleContent(tooltipTitle, d);
    })
    .on("click", (_, d) => {
      if (d.entryKind !== "state") {
        return;
      }

      if (currentHideToolEnabled) {
        const hidden = toggleStateHidden("zeeman", d.id);
        persistState();
        render(CONTROL_ANIMATION_MS);
        setStatus(hidden ? `Hidden ${d.parentLabelPlain} F=${formatQuantumNumber(d.parentF)} mF=${signedQuantumLabel(d.mF)}.` : `Shown ${d.parentLabelPlain} F=${formatQuantumNumber(d.parentF)} mF=${signedQuantumLabel(d.mF)}.`);
        return;
      }

      if (currentMeasureToolEnabled) {
        handleMeasureSelection("zeeman", d.id);
      }
    })
    .on("mousemove", (event) => moveTooltip(event))
    .on("mouseleave", function () {
      d3.select(this).classed("is-hovered", false);
      hideTooltip();
    })
    .on("contextmenu", (event, d) => {
      if (d.entryKind !== "state") {
        return;
      }

      event.preventDefault();
      pinInspector(event, "zeeman", d.id);
    });

  applyTransition(entries, transition)
    .attr("transform", (d) => d.entryKind === "state"
      ? `translate(${d.x1},${d.y})`
      : `translate(${d.x},${d.y})`);

  const stateGroups = entries.filter((d) => d.entryKind === "state");

  stateGroups.classed("is-measure-selected", (d) => isMeasureSelectionActive("zeeman", d.id));
  stateGroups.classed("is-hidden-item", (d) => isZeemanStateEffectivelyHidden(d));
  stateGroups.classed("is-hide-mode", currentHideToolEnabled);

  applyTransition(stateGroups.select("line.state-line"), transition)
    .attr("x1", 0)
    .attr("x2", (d) => d.x2 - d.x1)
    .attr("y1", 0)
    .attr("y2", 0);

  stateGroups.select("text.state-note")
    .attr("x", layoutConfig.labelXOffset)
    .attr("y", -layoutConfig.zeemanLabelYOffset)
    .each(function (d) {
      renderSubscriptTokenLabel(d3.select(this), "m", "F", zeemanStateLabel(d.mF));
    });
}

function render(animationDuration = 0, options = {}) {
  if (!animationDuration || animationDuration <= 0) {
    scene.selectAll("*").interrupt();
  }

  const layout = buildLayoutModel();
  currentLayout = layout;
  setDiagramIssues(layout.diagramIssues || []);
  const transition = createRenderTransition(animationDuration);
  drawGuides(layout, transition);
  renderTransitions(layout, transition);
  renderMeasurementLines(layout, transition);
  renderFineStates(layout, transition);
  renderHyperfineStates(layout, transition);
  renderZeemanStates(layout, transition);
  renderFineLabelOverlay(layout, animationDuration);

  if (!options.skipPinnedPanels) {
    renderPinnedPanels(layout);
  }
}

let layoutEditorFocusReturnTarget = null;

function escapeLayoutEditorHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function syncLayoutEditorHighlight() {
  if (!layoutEditorHighlight || !layoutEditorText) {
    return;
  }

  const content = layoutEditorText.value || "";
  const canHighlight = Boolean(window.hljs?.highlight);
  layoutEditorHighlight.classList.toggle("hljs", canHighlight);

  if (canHighlight) {
    const highlighted = window.hljs.highlight(content, {
      language: "yaml",
      ignoreIllegals: true,
    });
    layoutEditorHighlight.innerHTML = `${highlighted.value}\n`;
  } else {
    layoutEditorHighlight.innerHTML = `${escapeLayoutEditorHtml(content)}\n`;
  }

  layoutEditorHighlight.scrollTop = layoutEditorText.scrollTop;
  layoutEditorHighlight.scrollLeft = layoutEditorText.scrollLeft;
}

function syncLayoutEditorPlacement() {
  if (!layoutEditorModal || !heroPanel) {
    return;
  }

  if (window.innerWidth <= 860) {
    layoutEditorModal.style.removeProperty("--layout-editor-top");
    layoutEditorModal.style.removeProperty("--layout-editor-right");
    layoutEditorModal.style.removeProperty("--layout-editor-bottom");
    layoutEditorModal.style.removeProperty("--layout-editor-left");
    return;
  }

  const heroRect = heroPanel.getBoundingClientRect();
  const viewportPadding = 18;
  const left = Math.min(
    Math.max(viewportPadding, heroRect.right + 18),
    Math.max(viewportPadding, window.innerWidth - 420),
  );

  layoutEditorModal.style.setProperty("--layout-editor-top", `${viewportPadding}px`);
  layoutEditorModal.style.setProperty("--layout-editor-right", `${viewportPadding}px`);
  layoutEditorModal.style.setProperty("--layout-editor-bottom", `${viewportPadding}px`);
  layoutEditorModal.style.setProperty("--layout-editor-left", `${left}px`);
}

function closeLayoutEditor({ restoreFocus = true } = {}) {
  if (!layoutEditorModal || layoutEditorModal.hidden) {
    return;
  }

  layoutEditorModal.hidden = true;

  if (restoreFocus && layoutEditorFocusReturnTarget instanceof HTMLElement) {
    layoutEditorFocusReturnTarget.focus();
  }
}

function openLayoutEditor() {
  if (!layoutEditorModal || !layoutEditorText) {
    const serialized = serializeState();
    window.prompt("Copy or edit this layout YAML:", serialized);
    return;
  }

  layoutEditorFocusReturnTarget = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  layoutEditorText.value = serializeState();
  syncLayoutEditorPlacement();
  syncLayoutEditorHighlight();
  layoutEditorModal.hidden = false;

  window.requestAnimationFrame(() => {
    layoutEditorText.focus();
    layoutEditorText.setSelectionRange(0, layoutEditorText.value.length);
  });
}

async function copyLayoutEditorText() {
  if (!layoutEditorText) {
    return;
  }

  const serialized = layoutEditorText.value;

  try {
    await navigator.clipboard.writeText(serialized);
    setStatus("Layout copied to the clipboard.");
  } catch {
    layoutEditorText.focus();
    layoutEditorText.select();
    setStatus("Clipboard access was unavailable, so the layout text was selected for manual copy.");
  }
}

function applyLayoutEditorText() {
  if (!layoutEditorText) {
    return;
  }

  const pasted = layoutEditorText.value.trim();

  if (!pasted) {
    return;
  }

  try {
    applyStateObject(parseSerializedState(pasted), { animationDuration: CONTROL_ANIMATION_MS });
    closeLayoutEditor();
    setStatus("Layout loaded.");
  } catch {
    setStatus("That layout string could not be parsed.");
  }
}

editConfigButton?.addEventListener("click", () => {
  openLayoutEditor();
});

layoutEditorCloseButton?.addEventListener("click", () => {
  closeLayoutEditor();
});

layoutEditorCopyButton?.addEventListener("click", async () => {
  await copyLayoutEditorText();
});

layoutEditorApplyButton?.addEventListener("click", () => {
  applyLayoutEditorText();
});

layoutEditorModal?.addEventListener("click", (event) => {
  if (event.target === layoutEditorModal) {
    closeLayoutEditor();
  }
});

layoutEditorText?.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    applyLayoutEditorText();
  }
});

layoutEditorText?.addEventListener("input", () => {
  syncLayoutEditorHighlight();
});

layoutEditorText?.addEventListener("scroll", () => {
  syncLayoutEditorHighlight();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !layoutEditorModal?.hidden) {
    event.preventDefault();
    closeLayoutEditor();
  }
});

undoActionButton?.addEventListener("click", () => {
  undoStateChange();
});

redoActionButton?.addEventListener("click", () => {
  redoStateChange();
});

resetConfigButton.addEventListener("click", () => {
  applyStateObject({
    expandedFine: defaultExpandedFine,
    expandedHyperfine: defaultExpandedHyperfine,
    pinnedPanels: [],
    theme: "light",
    referencesVisible: defaultReferencesVisible,
    measureToolEnabled: defaultMeasureToolEnabled,
    hideToolEnabled: defaultHideToolEnabled,
    measureSelection: [],
    measurements: [],
    hiddenStates: [],
    hiddenTransitions: [],
    controls: {
      hyperfineScaleByFineState: createDefaultHyperfineScaleMap(),
      transitionLabels: [],
      bFieldEnabled: defaultBFieldEnabled,
      bFieldVisualScale: defaultBFieldVisualScale,
      bFieldGauss: defaultBFieldGauss,
      bFieldGaussMin: defaultBFieldGaussMin,
      bFieldGaussMax: defaultBFieldGaussMax,
    },
    zoom: defaultZoomState,
  }, { animationDuration: EXPAND_COLLAPSE_ANIMATION_MS, persist: false });
  fitView({ persist: false, animationDuration: EXPAND_COLLAPSE_ANIMATION_MS });
  persistState();
  setStatus("Layout reset to the prototype default.");
});

resetViewButton.addEventListener("click", () => {
  fitView({ persist: true, animationDuration: 220 });
  setStatus("View fitted to the current window.");
});

chooseDiagramToggleButton?.addEventListener("click", (event) => {
  event.stopPropagation();

  const willOpen = diagramPicker.hidden;
  diagramPicker.hidden = !willOpen;
  chooseDiagramToggleButton.setAttribute("aria-expanded", willOpen ? "true" : "false");

  if (willOpen && typeof positionDiagramPickerPanel === "function") {
    requestAnimationFrame(positionDiagramPickerPanel);
  }
});

diagramPickerLocalPickButton?.addEventListener("click", async (event) => {
  event.stopPropagation();
  await pickDiagramsFolder();
});

diagramPickerCloseButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeDiagramPicker();
});

referencesToggleButton?.addEventListener("click", () => {
  currentReferencesVisible = !currentReferencesVisible;
  renderReferencesPanel();
  render(0);

  if (!currentReferencesVisible) {
    hideTooltip();
  }

  persistState();
  setStatus(currentReferencesVisible ? "Reference mode enabled." : "Reference mode hidden.");
});

measureToggleButton?.addEventListener("click", () => {
  currentMeasureToolEnabled = !currentMeasureToolEnabled;
  if (currentMeasureToolEnabled) {
    currentHideToolEnabled = false;
  }
  currentMeasureSelection = [];

  syncControlUI();
  render(CONTROL_ANIMATION_MS);
  persistState();
  setStatus(currentMeasureToolEnabled ? "Measure tool enabled. Click two visible state bars to add or toggle a measure line, or click an on-diagram X to remove one." : "Measure tool hidden.");
});

hideToggleButton?.addEventListener("click", () => {
  currentHideToolEnabled = !currentHideToolEnabled;

  if (currentHideToolEnabled) {
    currentMeasureToolEnabled = false;
    currentMeasureSelection = [];
  }

  syncControlUI();
  render(CONTROL_ANIMATION_MS);
  persistState();
  setStatus(currentHideToolEnabled ? "Hide tool enabled. Click states, fine labels, or transitions to toggle whether they stay visible." : "Hide tool hidden.");
});

referencesCloseButton?.addEventListener("click", () => {
  currentReferencesVisible = false;
  renderReferencesPanel();
  hideTooltip();
  persistState();
  setStatus("Reference mode hidden.");
});

themeToggleButton.addEventListener("click", () => {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
  renderPinnedPanels();
  persistState();
  setStatus(`Theme set to ${currentTheme} mode.`);
});

bFieldRange.addEventListener("input", () => {
  currentBFieldVisualScale = sliderValueToVisualScale(bFieldRange.value);
  syncControlUI();
  render(0);
  persistState({ recordHistory: false, announce: false, preserveHistorySnapshot: true });
});

bFieldRange.addEventListener("change", () => {
  persistState();
});

bFieldGaussRange.addEventListener("input", () => {
  currentBFieldGauss = Number(bFieldGaussRange.value);
  syncControlUI();
  render(0);
  persistState({ recordHistory: false, announce: false, preserveHistorySnapshot: true });
});

bFieldGaussRange.addEventListener("change", () => {
  persistState();
});

function applyBFieldBoundsFromInputs() {
  const parsedMin = Number(bFieldGaussMinInput.value);
  const parsedMax = Number(bFieldGaussMaxInput.value);

  if (!Number.isFinite(parsedMin) || !Number.isFinite(parsedMax)) {
    syncControlUI();
    return;
  }

  currentBFieldGaussMin = Math.min(parsedMin, parsedMax);
  currentBFieldGaussMax = Math.max(parsedMin, parsedMax);
  currentBFieldGauss = clamp(currentBFieldGauss, currentBFieldGaussMin, currentBFieldGaussMax);
  syncControlUI();
  render(0);
  persistState();
}

bFieldGaussMinInput.addEventListener("change", applyBFieldBoundsFromInputs);
bFieldGaussMaxInput.addEventListener("change", applyBFieldBoundsFromInputs);

bFieldToggleButton.addEventListener("click", () => {
  currentBFieldEnabled = !currentBFieldEnabled;
  syncControlUI();
  render(0);
  persistState();
});

helpToggleButton.addEventListener("click", (event) => {
  event.stopPropagation();
  const willOpen = helpPanel.hidden;
  helpPanel.hidden = !willOpen;
  helpToggleButton.setAttribute("aria-expanded", willOpen ? "true" : "false");

  if (willOpen) {
    requestAnimationFrame(positionHelpPanel);
  }
});

document.addEventListener("click", (event) => {
  if (diagramPicker && !diagramPicker.hidden && !diagramPicker.contains(event.target) && !chooseDiagramToggleButton?.contains(event.target)) {
    closeDiagramPicker();
  }

  if (!helpPanel || helpPanel.hidden) {
    return;
  }

  if (helpPanel.contains(event.target) || helpToggleButton.contains(event.target)) {
    return;
  }

  closeHelpPanel();
});

let activeDiagramPickerDrag = null;

function beginDiagramPickerDrag(event) {
  if (!diagramPicker || diagramPicker.hidden) {
    return;
  }

  const shellRect = appShell?.getBoundingClientRect();
  const currentLeft = Number.parseFloat(diagramPicker.style.left || "0");
  const currentTop = Number.parseFloat(diagramPicker.style.top || "0");

  activeDiagramPickerDrag = {
    originClientX: event.clientX,
    originClientY: event.clientY,
    originLeft: Number.isFinite(currentLeft) ? currentLeft : 0,
    originTop: Number.isFinite(currentTop) ? currentTop : 0,
    shellWidth: shellRect?.width || window.innerWidth,
    shellHeight: shellRect?.height || window.innerHeight,
  };
  diagramPicker.querySelector(".diagram-picker-header")?.classList.add("is-dragging");
}

function handleDiagramPickerDrag(event) {
  if (!activeDiagramPickerDrag) {
    return;
  }

  const viewportPadding = 24;
  const panelWidth = diagramPicker.offsetWidth || 620;
  const panelHeight = diagramPicker.offsetHeight || 420;
  const nextLeft = clamp(
    activeDiagramPickerDrag.originLeft + (event.clientX - activeDiagramPickerDrag.originClientX),
    viewportPadding,
    activeDiagramPickerDrag.shellWidth - panelWidth - viewportPadding,
  );
  const nextTop = clamp(
    activeDiagramPickerDrag.originTop + (event.clientY - activeDiagramPickerDrag.originClientY),
    viewportPadding,
    activeDiagramPickerDrag.shellHeight - panelHeight - viewportPadding,
  );

  diagramPicker.style.left = `${nextLeft}px`;
  diagramPicker.style.top = `${nextTop}px`;
  setDiagramPickerCustomPosition({
    left: nextLeft + (appShell?.getBoundingClientRect().left || 0),
    top: nextTop + (appShell?.getBoundingClientRect().top || 0),
  });
}

function endDiagramPickerDrag(event) {
  if (!activeDiagramPickerDrag) {
    return;
  }
  activeDiagramPickerDrag = null;
  diagramPicker?.querySelector(".diagram-picker-header")?.classList.remove("is-dragging");
}

document.addEventListener("keydown", (event) => {
  const modifierKey = event.ctrlKey || event.metaKey;

  if (modifierKey && event.key.toLowerCase() === "z") {
    event.preventDefault();

    if (event.shiftKey) {
      redoStateChange();
      return;
    }

    undoStateChange();
    return;
  }

  if (modifierKey && event.key.toLowerCase() === "y") {
    event.preventDefault();
    redoStateChange();
    return;
  }

  if (event.key !== "Escape") {
    return;
  }

  closeDiagramPicker();

  if (!helpPanel.hidden) {
    closeHelpPanel();
  }
});

pinnedPanelLayer.addEventListener("pointerdown", (event) => {
  const interactiveTarget = event.target.closest("button, input, textarea, select, a, label");

  if (interactiveTarget) {
    return;
  }

  const handle = event.target.closest("[data-drag-handle]");
  const panelElement = event.target.closest(".inspector");

  if (!handle || !panelElement) {
    return;
  }

  event.preventDefault();
  beginPanelDrag(event, Number(panelElement.dataset.panelId));
});

diagramPicker?.addEventListener("mousedown", (event) => {
  const interactiveTarget = event.target.closest("button, input, textarea, select, a, label");

  if (interactiveTarget) {
    return;
  }

  const handle = event.target.closest('[data-drag-handle="diagram-picker"]');

  if (!handle) {
    return;
  }

  event.preventDefault();
  beginDiagramPickerDrag(event);
});

window.addEventListener("pointermove", handlePanelDrag);
window.addEventListener("pointerup", endPanelDrag);
window.addEventListener("pointercancel", endPanelDrag);
window.addEventListener("mousemove", handleDiagramPickerDrag);
window.addEventListener("mouseup", endDiagramPickerDrag);

window.addEventListener("resize", () => {
  hideTooltip();
  syncLayoutEditorPlacement();
  syncLayoutEditorHighlight();
  renderFineLabelOverlay(currentLayout, 0);
  renderPinnedPanels();
  positionHelpPanel();
  positionDiagramPickerPanel();
  renderReferencesPanel();
});

(async () => {
  await appBootstrapPromise;
  rebuildDerivedDiagramState();
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
})();


