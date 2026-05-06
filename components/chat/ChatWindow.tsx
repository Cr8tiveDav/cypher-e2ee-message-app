import React from "react";
import { UserInfo, Message } from "@/lib/types";

interface ChatWindowProps {
  selectedUser: UserInfo | null;
  messages: Message[];
  user: any;
  inputText: string;
  setInputText: (t: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  sending: boolean;
  messageEndRef: React.RefObject<HTMLDivElement | null>;
  onOpenSidebar: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedUser,
  messages,
  user,
  inputText,
  setInputText,
  handleSendMessage,
  sending,
  messageEndRef,
  onOpenSidebar,
}) => {
  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-[#020617]">
        {/* Mobile menu button — shown when no conversation is selected */}
        <button
          onClick={onOpenSidebar}
          className="md:hidden absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Open conversations"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="w-20 h-20 bg-[#0D9488]/10 rounded-full flex items-center justify-center mb-6 border border-[#0D9488]/20">
          <svg
            className="w-10 h-10 text-[#0D9488]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Secure Protocol Initialized</h2>
        <p className="text-slate-500 max-w-sm font-medium">
          Start an encrypted transmission by selecting a peer. All communications are
          hardware-encrypted at the source.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#020617] min-w-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-[#0f172a] z-10 shrink-0">
        {/* Mobile back button */}
        <button
          onClick={onOpenSidebar}
          className="md:hidden text-slate-400 hover:text-slate-200 transition-colors p-1 -ml-1 shrink-0"
          aria-label="Back to conversations"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 flex items-center justify-center font-bold text-[#0D9488] shrink-0">
          {selectedUser.display_name[0]}
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-white truncate">{selectedUser.display_name}</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold truncate">
              Encrypted Link Established
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-[#020617]">
        {messages.map((msg) => {
          const isMe = msg.from_user_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${
                isMe ? "justify-end" : "justify-start"
              } animate-in fade-in slide-in-from-bottom-1 duration-200`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-lg text-sm shadow-lg border ${
                  isMe
                    ? "bg-[#0D9488] text-white border-[#0D9488] rounded-tr-none"
                    : "bg-[#0f172a] text-slate-100 border-slate-800 rounded-tl-none"
                }`}
              >
                <p className="leading-relaxed font-medium break-words">{msg.plaintext || "..."}</p>
                <p
                  className={`text-[10px] mt-1 opacity-70 text-right font-bold ${
                    isMe ? "text-white" : "text-slate-500"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 sm:p-4 bg-[#0f172a] border-t border-slate-800 shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3 max-w-4xl mx-auto w-full">
          <input
            type="text"
            placeholder="End-to-end encrypted chat..."
            className="flex-1 h-11 sm:h-12 px-4 bg-[#020617] border border-slate-800 rounded-lg focus:ring-2 focus:ring-[#0D9488] outline-none transition-all font-medium text-white placeholder:text-slate-600 text-sm min-w-0"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="px-5 sm:px-8 h-11 sm:h-12 bg-[#0D9488] text-white font-bold rounded-lg hover:bg-[#0D9488]/90 disabled:opacity-50 transition-all flex items-center justify-center shadow-lg shadow-teal-900/20 shrink-0"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="hidden sm:inline">Send</span>
            )}
            {!sending && (
              <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
