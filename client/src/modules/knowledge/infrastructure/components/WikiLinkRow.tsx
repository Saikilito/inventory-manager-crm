import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Link as LinkIcon, Check } from 'lucide-react';

export interface KnowledgeNodeOption {
  id: string;
  title: string;
  category?: string;
}

interface WikiLinkRowProps {
  link: { title: string; url?: string };
  index: number;
  disabled?: boolean;
  nodeOptions: KnowledgeNodeOption[];
  onChange: (patch: Partial<{ title: string; url: string }>) => void;
  onRemove: () => void;
}

export const WikiLinkRow: React.FC<WikiLinkRowProps> = ({
  link,
  disabled,
  nodeOptions,
  onChange,
  onRemove,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = nodeOptions.filter((node) =>
    node.title.toLowerCase().includes(link.title.toLowerCase().trim())
  );

  const exactMatch = nodeOptions.find(
    (node) => node.title.toLowerCase().trim() === link.title.toLowerCase().trim()
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectOption = (title: string) => {
    onChange({ title });
    setIsOpen(false);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 items-center">
      <div ref={containerRef} className="relative w-full">
        <div className="relative flex items-center">
          <input
            type="text"
            value={link.title}
            onChange={(e) => {
              onChange({ title: e.target.value });
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Select entry or type title..."
            disabled={disabled}
            className="w-full h-10 px-3 pr-8 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {exactMatch && (
            <span
              className="absolute right-2.5 text-emerald-500 dark:text-emerald-400 flex items-center"
              title="Linked to existing knowledge entry"
            >
              <Check className="w-4 h-4" />
            </span>
          )}
        </div>

        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-lg py-1">
            <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-stone-400 uppercase border-b border-stone-100 dark:border-stone-800">
              Existing Entries ({filteredOptions.length})
            </div>
            {filteredOptions.map((node) => {
              const isSelected = node.title.toLowerCase().trim() === link.title.toLowerCase().trim();
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => handleSelectOption(node.title)}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${
                    isSelected
                      ? 'font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    <LinkIcon className="w-3 h-3 text-stone-400 flex-shrink-0" />
                    {node.title}
                  </span>
                  {node.category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 ml-2 uppercase flex-shrink-0">
                      {node.category}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <input
        type="url"
        value={link.url ?? ''}
        onChange={(e) => onChange({ url: e.target.value })}
        placeholder="https://example.com (optional)"
        disabled={disabled}
        className="h-10 px-3 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="inline-flex items-center justify-center h-10 w-10 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
        aria-label="Remove link"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
