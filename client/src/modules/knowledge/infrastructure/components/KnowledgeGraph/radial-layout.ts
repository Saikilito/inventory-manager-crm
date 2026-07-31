import { HierarchyLevel } from '@shared-domain/knowledge';

export interface RadialLayoutNode {
  id: string;
  hierarchyLevel: string;
  isOrphan: boolean;
}

export interface RadialLayoutEdge {
  source: string;
  target: string;
}

interface RadialPosition {
  x: number;
  y: number;
}

const RADIAL_LEVEL_ORDER: readonly string[] = [
  HierarchyLevel.ROOT,
  HierarchyLevel.DOMAIN,
  HierarchyLevel.TOPIC,
  HierarchyLevel.DATA,
];

const ORPHAN_LEVEL_INDEX = RADIAL_LEVEL_ORDER.length;
const DEFAULT_LEVEL_INDEX = RADIAL_LEVEL_ORDER.length - 1;
const VIRTUAL_ROOT_ID = '__radial_virtual_root__';
const RING_RADIUS_STEP = 260;
const ROOT_RING_RADIUS_FACTOR = 0.55;
const FULL_CIRCLE_RADIANS = Math.PI * 2;

export const getHierarchyLevelIndex = (node: RadialLayoutNode): number => {
  if (node.isOrphan) return ORPHAN_LEVEL_INDEX;
  const index = RADIAL_LEVEL_ORDER.indexOf(node.hierarchyLevel);
  return index === -1 ? DEFAULT_LEVEL_INDEX : index;
};

const getRingRadius = (levelIndex: number, rootCount: number): number => {
  if (levelIndex === 0) {
    return rootCount > 1 ? RING_RADIUS_STEP * ROOT_RING_RADIUS_FACTOR : 0;
  }
  return RING_RADIUS_STEP * levelIndex;
};

const buildFirstInboundSourceMap = (edges: RadialLayoutEdge[]): Map<string, string> => {
  const firstSourceByTarget = new Map<string, string>();
  for (const edge of edges) {
    if (!firstSourceByTarget.has(edge.target)) {
      firstSourceByTarget.set(edge.target, edge.source);
    }
  }
  return firstSourceByTarget;
};

const buildParentByChildId = (nodes: RadialLayoutNode[], edges: RadialLayoutEdge[]): Map<string, string> => {
  const levelIndexById = new Map(nodes.map((node) => [node.id, getHierarchyLevelIndex(node)]));
  const firstInboundSourceByTarget = buildFirstInboundSourceMap(edges);
  const parentByChildId = new Map<string, string>();

  for (const node of nodes) {
    if (node.isOrphan) {
      const inboundSource = firstInboundSourceByTarget.get(node.id);
      if (inboundSource) parentByChildId.set(node.id, inboundSource);
      continue;
    }

    const ownLevelIndex = levelIndexById.get(node.id) ?? DEFAULT_LEVEL_INDEX;
    let closestParentId: string | undefined;
    let closestParentLevelIndex = -1;

    for (const edge of edges) {
      if (edge.source !== node.id) continue;
      const targetLevelIndex = levelIndexById.get(edge.target);
      if (targetLevelIndex === undefined) continue;
      if (targetLevelIndex < ownLevelIndex && targetLevelIndex > closestParentLevelIndex) {
        closestParentLevelIndex = targetLevelIndex;
        closestParentId = edge.target;
      }
    }

    if (closestParentId) parentByChildId.set(node.id, closestParentId);
  }

  return parentByChildId;
};

const buildChildrenByParentId = (
  nodes: RadialLayoutNode[],
  parentByChildId: Map<string, string>,
): Map<string, string[]> => {
  const childrenByParentId = new Map<string, string[]>();
  for (const node of nodes) {
    const parentId = parentByChildId.get(node.id) ?? VIRTUAL_ROOT_ID;
    const siblings = childrenByParentId.get(parentId) ?? [];
    siblings.push(node.id);
    childrenByParentId.set(parentId, siblings);
  }
  return childrenByParentId;
};

const assignAngles = (
  parentId: string,
  angleStart: number,
  angleEnd: number,
  childrenByParentId: Map<string, string[]>,
  angleById: Map<string, number>,
): void => {
  const children = childrenByParentId.get(parentId);
  if (!children || children.length === 0) return;

  const slice = (angleEnd - angleStart) / children.length;
  children.forEach((childId, index) => {
    const sliceStart = angleStart + index * slice;
    const sliceEnd = sliceStart + slice;
    angleById.set(childId, (sliceStart + sliceEnd) / 2);
    assignAngles(childId, sliceStart, sliceEnd, childrenByParentId, angleById);
  });
};

export const computeRadialPositions = (
  nodes: RadialLayoutNode[],
  edges: RadialLayoutEdge[],
): Map<string, RadialPosition> => {
  const positionById = new Map<string, RadialPosition>();
  if (nodes.length === 0) return positionById;

  const parentByChildId = buildParentByChildId(nodes, edges);
  const childrenByParentId = buildChildrenByParentId(nodes, parentByChildId);
  const angleById = new Map<string, number>();
  assignAngles(VIRTUAL_ROOT_ID, 0, FULL_CIRCLE_RADIANS, childrenByParentId, angleById);

  const rootCount = nodes.filter((node) => getHierarchyLevelIndex(node) === 0).length;

  for (const node of nodes) {
    const levelIndex = getHierarchyLevelIndex(node);
    const radius = getRingRadius(levelIndex, rootCount);
    const angle = angleById.get(node.id) ?? 0;
    positionById.set(node.id, {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }

  return positionById;
};
