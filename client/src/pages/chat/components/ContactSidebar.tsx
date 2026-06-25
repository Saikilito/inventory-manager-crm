import React from "react";
import { Sparkles, X, Search } from "lucide-react";
import { Contact } from "../types";

export interface ContactSidebarProps {
  contacts: Contact[];
  activeContactId: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  onSelectContact: (id: string) => void;
}

export const ContactSidebar: React.FC<ContactSidebarProps> = ({
  contacts,
  activeContactId,
  searchQuery,
  setSearchQuery,
  isSidebarOpen,
  setIsSidebarOpen,
  onSelectContact,
}) => {
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`
        absolute lg:static inset-y-0 left-0 w-80 lg:w-auto lg:col-span-4 bg-white dark:bg-stone-900 z-40
        transition-transform duration-300 ease-out-expo border-r border-stone-200 dark:border-stone-800 flex flex-col h-full min-h-0 max-h-full
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
    >
      {/* Header of contacts list */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          AI Assistants
        </h2>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-md transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-stone-200 dark:border-stone-800">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search assistant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs placeholder:text-stone-400 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Contacts Map */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/40">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            No assistants found.
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isActive = contact.id === activeContactId;
            return (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact.id)}
                className={`
                  w-full text-left p-3.5 flex items-start gap-3 transition-all duration-200 outline-none rounded-xl focus-visible:bg-stone-50 dark:focus-visible:bg-stone-800/40
                  ${
                    isActive
                      ? "bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/10"
                      : "hover:bg-stone-50/75 dark:hover:bg-stone-800/40 border border-transparent"
                  }
                `}
              >
                {/* Avatar Container */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200
                    ${
                      isActive
                        ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 ring-4 ring-emerald-500/10"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                    }
                  `}
                  >
                    {contact.avatar}
                  </div>
                  {contact.online && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-stone-900 bg-emerald-500" />
                  )}
                </div>

                {/* Meta info block */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${isActive ? "text-emerald-700 dark:text-emerald-400" : "text-stone-900 dark:text-stone-100"}`}
                    >
                      {contact.name}
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium">
                      {contact.time}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate mt-0.5">
                    {contact.company}
                  </div>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 truncate">
                    {contact.lastMessage}
                  </p>
                </div>

                {/* Unread badge */}
                {contact.unreadCount > 0 && (
                  <span className="flex-shrink-0 bg-emerald-600 text-white font-bold text-[10px] h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center shadow-xs">
                    {contact.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
