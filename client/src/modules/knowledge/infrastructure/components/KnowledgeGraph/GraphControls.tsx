import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Map as MapIcon } from 'lucide-react';
import { useReactFlow, MiniMap } from '@xyflow/react';

interface GraphControlsProps {
  showMinimap: boolean;
  onToggleMinimap: () => void;
}

export const GraphControls: React.FC<GraphControlsProps> = ({ showMinimap, onToggleMinimap }) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-white/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm p-1.5 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => zoomIn({ duration: 200 })}
        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        aria-label="Zoom in"
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => zoomOut({ duration: 200 })}
        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        aria-label="Zoom out"
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => fitView({ duration: 300, padding: 0.15 })}
        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        aria-label="Fit view"
        title="Fit view"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onToggleMinimap}
        className={[
          'h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors',
          showMinimap
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
            : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800',
        ].join(' ')}
        aria-label="Toggle minimap"
        title="Toggle minimap"
      >
        <MapIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

interface MiniMapWrapperProps {
  show: boolean;
}

export const MiniMapWrapper: React.FC<MiniMapWrapperProps> = ({ show }) => {
  if (!show) return null;
  return (
    <MiniMap
      className="!bg-white/80 dark:!bg-stone-900/80 !border !border-stone-200 dark:!border-stone-800 !rounded-xl !shadow-sm"
      pannable
      zoomable
      nodeColor={(node) => {
        const category = (node.data as { category?: string })?.category;
        if (category === 'SALES') return '#3b82f6';
        if (category === 'PRODUCTS') return '#10b981';
        if (category === 'COMPANY') return '#a855f7';
        if (category === 'CUSTOMER_SERVICE') return '#f59e0b';
        return '#a8a29e';
      }}
      maskColor="rgba(120, 113, 108, 0.18)"
    />
  );
};
