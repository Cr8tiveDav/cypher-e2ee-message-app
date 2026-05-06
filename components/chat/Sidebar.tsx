import React from "react";
import { UserInfo, Conversation } from "@/lib/types";
import { BrandLogo } from "@/components/shared/BrandLogo";

interface SidebarProps {
  user: any;
  conversations: Conversation[];
  selectedUser: UserInfo | null;
  setSelectedUser: (u: UserInfo) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: UserInfo[];
  handleSearch: (q: string) => void;
  logout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  conversations,
  selectedUser,
  setSelectedUser,
  searchQuery,
  setSearchQuery,
  searchResults,
  handleSearch,
  logout,
  isOpen,
  onClose,
}) => {
  const handleSelectUser = (u: UserInfo) => {
    setSelectedUser(u);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-72
          border-r border-slate-800 flex flex-col bg-[#0f172a]
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:flex md:w-80 md:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-red-400 font-medium transition-colors"
            >
              Logout
            </button>
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="md:hidden text-slate-500 hover:text-slate-300 transition-colors p-1"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full h-10 px-4 bg-[#020617] border border-slate-800 rounded-lg focus:ring-2 focus:ring-[#0D9488] outline-none text-sm transition-all placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {searchQuery.length >= 2 ? (
            <div className="p-2 space-y-1">
              <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Search Results
              </p>
              {searchResults.length === 0 && (
                <p className="px-3 py-4 text-xs text-slate-600 text-center">No users found</p>
              )}
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-slate-800/50 rounded-lg transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 flex items-center justify-center font-bold text-[#0D9488] shrink-0">
                    {u.display_name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white group-hover:text-[#0D9488] transition-colors truncate">
                      {u.display_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Recent Conversations
              </p>
              {conversations.length === 0 && (
                <p className="px-3 py-4 text-xs text-slate-600 text-center">No conversations yet</p>
              )}
              {conversations.map((c) => (
                <button
                  key={c.user_id}
                  onClick={() =>
                    handleSelectUser({
                      id: c.user_id,
                      username: c.username,
                      display_name: c.display_name,
                    })
                  }
                  className={`w-full p-3 flex items-center gap-3 hover:bg-slate-800/50 rounded-lg transition-all text-left ${
                    selectedUser?.id === c.user_id ? "bg-slate-800/50" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0">
                    {c.display_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate">{c.display_name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {new Date(c.last_message_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#020617]/50 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#0D9488] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.display_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.display_name}</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">
              Active Node
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
