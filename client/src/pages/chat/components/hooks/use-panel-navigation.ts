import { useMemo, useState } from "react";

export type PanelMode = "ai" | "manual";
export type PanelTab = "client" | "catalog" | "order";

const DEFAULT_PANEL_MODE: PanelMode = "ai";
const DEFAULT_ACTIVE_TAB: PanelTab = "client";

export interface PanelNavigation {
  panelMode: PanelMode;
  setPanelMode: (mode: PanelMode) => void;
  activeTab: PanelTab;
  setActiveTab: (tab: PanelTab) => void;
}

export const usePanelNavigation = (): PanelNavigation => {
  const [panelMode, setPanelMode] = useState<PanelMode>(DEFAULT_PANEL_MODE);
  const [activeTab, setActiveTab] = useState<PanelTab>(DEFAULT_ACTIVE_TAB);

  return useMemo(
    () => ({ panelMode, setPanelMode, activeTab, setActiveTab }),
    [panelMode, activeTab]
  );
};
