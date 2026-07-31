import { useCallback, useState } from 'react';
import type { PositionOverrideMap } from './graph-helpers';

const STORAGE_KEY = 'knowledge-graph-positions';

const readStoredOverrides = (): PositionOverrideMap => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as PositionOverrideMap) : {};
  } catch (err) {
    console.warn('[usePositionOverrides] Failed to read position overrides from localStorage:', err);
    return {};
  }
};

const writeStoredOverrides = (overrides: PositionOverrideMap): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (err) {
    console.warn('[usePositionOverrides] Failed to write position overrides to localStorage:', err);
  }
};

export interface UsePositionOverridesResult {
  positionOverrides: PositionOverrideMap;
  setPositionOverride: (id: string, position: { x: number; y: number }) => void;
  resetPositionOverrides: () => void;
}

export const usePositionOverrides = (): UsePositionOverridesResult => {
  const [positionOverrides, setPositionOverrides] = useState<PositionOverrideMap>(readStoredOverrides);

  const setPositionOverride = useCallback((id: string, position: { x: number; y: number }) => {
    setPositionOverrides((prev) => {
      const next = { ...prev, [id]: position };
      writeStoredOverrides(next);
      return next;
    });
  }, []);

  const resetPositionOverrides = useCallback(() => {
    setPositionOverrides({});
    writeStoredOverrides({});
  }, []);

  return { positionOverrides, setPositionOverride, resetPositionOverrides };
};
