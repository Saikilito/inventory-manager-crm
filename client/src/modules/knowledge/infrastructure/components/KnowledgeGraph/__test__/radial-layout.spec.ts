import { describe, it, expect } from 'vitest';
import { HierarchyLevel } from '@shared-domain/knowledge';
import { computeRadialPositions, getHierarchyLevelIndex } from '../radial-layout';

describe('getHierarchyLevelIndex', () => {
  it('should rank ROOT, DOMAIN, TOPIC and DATA from innermost to outermost', () => {
    expect(getHierarchyLevelIndex({ id: 'a', hierarchyLevel: HierarchyLevel.ROOT, isOrphan: false })).toBe(0);
    expect(getHierarchyLevelIndex({ id: 'b', hierarchyLevel: HierarchyLevel.DOMAIN, isOrphan: false })).toBe(1);
    expect(getHierarchyLevelIndex({ id: 'c', hierarchyLevel: HierarchyLevel.TOPIC, isOrphan: false })).toBe(2);
    expect(getHierarchyLevelIndex({ id: 'd', hierarchyLevel: HierarchyLevel.DATA, isOrphan: false })).toBe(3);
  });

  it('should rank orphan placeholders beyond DATA regardless of hierarchyLevel', () => {
    expect(getHierarchyLevelIndex({ id: 'e', hierarchyLevel: '', isOrphan: true })).toBe(4);
  });
});

describe('computeRadialPositions', () => {
  it('should return an empty map for no nodes', () => {
    expect(computeRadialPositions([], []).size).toBe(0);
  });

  it('should place a single ROOT node at the exact center', () => {
    const positions = computeRadialPositions(
      [{ id: 'root', hierarchyLevel: HierarchyLevel.ROOT, isOrphan: false }],
      [],
    );
    const root = positions.get('root')!;
    expect(root.x).toBeCloseTo(0);
    expect(root.y).toBeCloseTo(0);
  });

  it('should place DOMAIN nodes on a ring further out than ROOT', () => {
    const positions = computeRadialPositions(
      [
        { id: 'root', hierarchyLevel: HierarchyLevel.ROOT, isOrphan: false },
        { id: 'domain', hierarchyLevel: HierarchyLevel.DOMAIN, isOrphan: false },
      ],
      [{ source: 'domain', target: 'root' }],
    );

    const root = positions.get('root')!;
    const domain = positions.get('domain')!;
    const rootRadius = Math.hypot(root.x, root.y);
    const domainRadius = Math.hypot(domain.x, domain.y);
    expect(domainRadius).toBeGreaterThan(rootRadius);
  });

  it('should place a DATA node further out than the TOPIC it links to', () => {
    const positions = computeRadialPositions(
      [
        { id: 'topic', hierarchyLevel: HierarchyLevel.TOPIC, isOrphan: false },
        { id: 'doc', hierarchyLevel: HierarchyLevel.DATA, isOrphan: false },
      ],
      [{ source: 'doc', target: 'topic' }],
    );

    const topicRadius = Math.hypot(positions.get('topic')!.x, positions.get('topic')!.y);
    const docRadius = Math.hypot(positions.get('doc')!.x, positions.get('doc')!.y);
    expect(docRadius).toBeGreaterThan(topicRadius);
  });

  it('should cluster documents near the angle of the index they link to', () => {
    const positions = computeRadialPositions(
      [
        { id: 'topicA', hierarchyLevel: HierarchyLevel.TOPIC, isOrphan: false },
        { id: 'topicB', hierarchyLevel: HierarchyLevel.TOPIC, isOrphan: false },
        { id: 'docA1', hierarchyLevel: HierarchyLevel.DATA, isOrphan: false },
        { id: 'docA2', hierarchyLevel: HierarchyLevel.DATA, isOrphan: false },
        { id: 'docB1', hierarchyLevel: HierarchyLevel.DATA, isOrphan: false },
      ],
      [
        { source: 'docA1', target: 'topicA' },
        { source: 'docA2', target: 'topicA' },
        { source: 'docB1', target: 'topicB' },
      ],
    );

    const angleOf = (id: string) => Math.atan2(positions.get(id)!.y, positions.get(id)!.x);
    const topicAAngle = angleOf('topicA');
    const docA1Angle = angleOf('docA1');
    const docA2Angle = angleOf('docA2');
    const docB1Angle = angleOf('docB1');

    const distanceToTopicA = Math.abs(docA1Angle - topicAAngle) + Math.abs(docA2Angle - topicAAngle);
    const distanceOfUnrelatedDoc = Math.abs(docB1Angle - topicAAngle);
    expect(distanceToTopicA / 2).toBeLessThan(distanceOfUnrelatedDoc);
  });

  it('should rank an unresolved wiki-link placeholder beyond the DATA ring', () => {
    const positions = computeRadialPositions(
      [
        { id: 'doc', hierarchyLevel: HierarchyLevel.DATA, isOrphan: false },
        { id: 'orphan::Ghost', hierarchyLevel: '', isOrphan: true },
      ],
      [{ source: 'doc', target: 'orphan::Ghost' }],
    );

    const docRadius = Math.hypot(positions.get('doc')!.x, positions.get('doc')!.y);
    const orphanRadius = Math.hypot(positions.get('orphan::Ghost')!.x, positions.get('orphan::Ghost')!.y);
    expect(orphanRadius).toBeGreaterThan(docRadius);
  });

  it('should not throw and should position every node when links form a same-level cycle', () => {
    const positions = computeRadialPositions(
      [
        { id: 'topicA', hierarchyLevel: HierarchyLevel.TOPIC, isOrphan: false },
        { id: 'topicB', hierarchyLevel: HierarchyLevel.TOPIC, isOrphan: false },
      ],
      [
        { source: 'topicA', target: 'topicB' },
        { source: 'topicB', target: 'topicA' },
      ],
    );

    expect(positions.size).toBe(2);
    expect(Number.isFinite(positions.get('topicA')!.x)).toBe(true);
    expect(Number.isFinite(positions.get('topicB')!.x)).toBe(true);
  });
});
