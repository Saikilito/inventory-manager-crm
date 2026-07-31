import React from "react";
import { Plus, Clock } from "lucide-react";
import { KNOWN_HIERARCHY_LEVELS, KnowledgeCategory } from "@shared-domain/knowledge";
import { HIERARCHY_LEVEL_META, HIERARCHY_LEVEL_ICONS, CATEGORY_COLORS } from "@modules/knowledge/infrastructure/components/KnowledgeGraph/graph-helpers";

const CATEGORY_LABELS: Record<string, string> = {
  [KnowledgeCategory.SALES]: "Sales",
  [KnowledgeCategory.PRODUCTS]: "Products",
  [KnowledgeCategory.COMPANY]: "Company",
  [KnowledgeCategory.CUSTOMER_SERVICE]: "Customer Service",
};

export const GraphLegend: React.FC = () => {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm p-4 shadow-sm space-y-4">
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
          Node hierarchy
        </p>
        <ul className="space-y-1.5">
          {KNOWN_HIERARCHY_LEVELS.map((level: string) => {
            const meta = HIERARCHY_LEVEL_META[level];
            const Icon = HIERARCHY_LEVEL_ICONS[level];
            if (!meta || !Icon) return null;
            return (
              <li key={level} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
                <Icon className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 shrink-0" aria-hidden="true" />
                <span className="font-semibold">{meta.label}</span>
                <span className="text-stone-400 dark:text-stone-500">— {meta.description}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
          Category color
        </p>
        <ul className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
            <li key={category} className="flex items-center gap-1.5 text-xs text-stone-700 dark:text-stone-300">
              <span className={`w-2.5 h-2.5 rounded-full border ${CATEGORY_COLORS[category]?.bg} ${CATEGORY_COLORS[category]?.border}`} />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
          Status
        </p>
        <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
          <li className="flex items-center gap-2">
            <span className="inline-block w-3.5 h-3.5 rounded-md border-2 border-dashed border-amber-500" />
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            Draft — pending admin approval
          </li>
        </ul>
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
          Connections
        </p>
        <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
          <li className="flex items-center gap-2">
            <span className="inline-block w-6 h-0.5 bg-emerald-500" />
            Document points to its index
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block w-6 h-0.5 border-t-2 border-dashed border-stone-400" />
            Unresolved link
          </li>
          <li className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            Create the missing entry
          </li>
        </ul>
      </div>
    </div>
  );
};

export default GraphLegend;
