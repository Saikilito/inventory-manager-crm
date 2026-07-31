import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';

const FOCUS_ANIMATION_MS = 400;
const FOCUS_PADDING = 0.3;
const FOCUS_MAX_ZOOM = 1.2;

export const useGraphFocus = (matchedNodeIds: string[] | null): void => {
  const { fitView } = useReactFlow();
  const previousKeyRef = useRef<string>('');

  useEffect(() => {
    if (!matchedNodeIds) {
      previousKeyRef.current = '';
      return;
    }

    const key = matchedNodeIds.slice().sort().join('|');
    if (key === previousKeyRef.current) return;
    previousKeyRef.current = key;

    if (matchedNodeIds.length === 0) return;

    fitView({
      nodes: matchedNodeIds.map((id) => ({ id })),
      duration: FOCUS_ANIMATION_MS,
      padding: FOCUS_PADDING,
      maxZoom: FOCUS_MAX_ZOOM,
    });
  }, [matchedNodeIds, fitView]);
};
