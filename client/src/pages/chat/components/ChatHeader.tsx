import React from "react";
import { Menu, MoreVertical } from "lucide-react";
import { Contact } from "../types";

export interface ChatHeaderProps {
  activeContact: Contact;
  onOpenSidebar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeContact,
  onOpenSidebar,
}) => {
  return (
    <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        {/* Toggle mobile sidebar */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-1.5 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Open conversations"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Header Active Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center font-bold text-xs text-stone-700 dark:text-stone-300">
            {activeContact.avatar}
          </div>
          {activeContact.online && (
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-stone-900 bg-emerald-500" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-stone-900 dark:text-stone-50">
              {activeContact.name}
            </span>
            {activeContact.online ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700" />
            )}
          </div>
          <div className="text-[10px] text-stone-500 dark:text-stone-400">
            {activeContact.company}
          </div>
        </div>
      </div>

      {/* Header Controls */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg transition-colors cursor-pointer"
          title="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
