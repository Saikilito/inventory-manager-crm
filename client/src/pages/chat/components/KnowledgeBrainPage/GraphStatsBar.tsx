import React from "react";
import { Globe2, FileText, Unlink, Database } from "lucide-react";
import type { GraphStats } from "@modules/knowledge/infrastructure/components/KnowledgeGraph/graph-helpers";

interface GraphStatsBarProps {
  stats: GraphStats | null;
}

interface StatTile {
  label: string;
  value: number;
  icon: React.ElementType;
  accentClass: string;
}

const buildTiles = (stats: GraphStats): StatTile[] => [
  {
    label: "Total entries",
    value: stats.totalNodes,
    icon: Database,
    accentClass: "text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800",
  },
  {
    label: "Indices",
    value: stats.totalIndices,
    icon: Globe2,
    accentClass: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    label: "Documents",
    value: stats.totalDocuments,
    icon: FileText,
    accentClass: "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30",
  },
  {
    label: "Unresolved links",
    value: stats.unresolvedCount,
    icon: Unlink,
    accentClass: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30",
  },
];

export const GraphStatsBar: React.FC<GraphStatsBarProps> = ({ stats }) => {
  const tiles = stats ? buildTiles(stats) : [];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="flex items-center gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 shadow-sm"
        >
          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${tile.accentClass}`}>
            <tile.icon className="w-4.5 h-4.5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-lg font-black leading-none text-stone-900 dark:text-stone-100">{tile.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mt-1">
              {tile.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GraphStatsBar;
