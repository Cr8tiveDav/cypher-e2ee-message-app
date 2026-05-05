import React from "react";
import { UserInfo, Conversation } from "@/lib/types";

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
}) => {
  return (
    <div className="w-80 border-r border-slate-800 flex flex-col bg-[#0f172a] z-10">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0D9488] tracking-tight">Cypher</h1>
        <button
          onClick={logout}
          className="text-xs text-slate-500 hover:text-red-400 font-medium transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="p-4">
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

      <div className="flex-1 overflow-y-auto">
        {searchQuery.length >= 2 ? (
          <div className="p-2 space-y-1">
            <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Search Results
            </p>
            {searchResults.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setSelectedUser(u);
                  setSearchQuery("");
                }}
                className="w-full p-3 flex items-center gap-3 hover:bg-slate-800/50 rounded-lg transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 flex items-center justify-center font-bold text-[#0D9488]">
                  {u.display_name[0]}
                </div>
                <div>
                  <p className="font-bold text-sm text-white group-hover:text-[#0D9488] transition-colors">
                    {u.display_name}
                  </p>
                  <p className="text-xs text-slate-500">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Recent Conversations
            </p>
            {conversations.map((c) => (
              <button
                key={c.user_id}
                onClick={() =>
                  setSelectedUser({
                    id: c.user_id,
                    username: c.username,
                    display_name: c.display_name,
                  })
                }
                className={`w-full p-3 flex items-center gap-3 hover:bg-slate-800/50 rounded-lg transition-all text-left ${
                  selectedUser?.id === c.user_id ? "bg-slate-800/50" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
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

      <div className="p-4 border-t border-slate-800 bg-[#020617]/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#0D9488] flex items-center justify-center text-xs font-bold text-white">
          {user?.display_name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{user?.display_name}</p>
          <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-tight">
            Active Node
          </p>
        </div>
      </div>
    </div>
  );
};
