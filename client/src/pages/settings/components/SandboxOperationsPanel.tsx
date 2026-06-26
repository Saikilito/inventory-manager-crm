import React from "react";
import { Info, Trash2, RefreshCw } from "lucide-react";

interface SandboxOperationsPanelProps {
  onSeed: () => void;
  onWipe: () => void;
  seedLoading: boolean;
  wipeLoading: boolean;
}

export const SandboxOperationsPanel: React.FC<SandboxOperationsPanelProps> = ({
  onSeed,
  onWipe,
  seedLoading,
  wipeLoading,
}) => {
  return (
    <div className="bg-gradient-to-br from-stone-900 to-stone-950 dark:from-stone-950 dark:to-black text-white rounded-2xl border border-stone-800 p-8 shadow-xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Isolated Sandbox Operations</h2>
          <p className="text-sm text-stone-400 mt-1.5 max-w-3xl leading-relaxed">
            Use these operations to quickly configure or clean up testing data. Testing documents are
            flagged with <code className="text-amber-400">isTesting: true</code>, allowing you to seed
            or wipe isolated mock data safely without affecting real production documents.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-stone-800">
        {/* Seed Panel */}
        <div className="flex flex-col justify-between bg-stone-900/40 border border-stone-800 rounded-xl p-6">
          <div>
            <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              Seed Sandbox Database
            </h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Generates 3 sellers (users), 5 clients, and 15 completed or pending orders with realistic
              mock structures. All seeded entries are isolated as testing records.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={onSeed}
              disabled={seedLoading || wipeLoading}
              className="w-full md:w-auto inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
            >
              {seedLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4 mr-2" />
              )}
              Generate Seed Data
            </button>
          </div>
        </div>

        {/* Wipe Panel */}
        <div className="flex flex-col justify-between bg-stone-900/40 border border-stone-800 rounded-xl p-6">
          <div>
            <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" />
              Purge Sandbox Testing Data
            </h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Deletes all clients, products, orders, and user sellers marked with the testing flag. Real
              production documents will remain completely untouched.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={onWipe}
              disabled={seedLoading || wipeLoading}
              className="w-full md:w-auto inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Selective Purge (Wipe)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function PlusCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}
export default SandboxOperationsPanel;
