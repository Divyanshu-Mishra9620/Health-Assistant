"use client";

import React, { useState, useEffect } from "react";
import {
  fetchChatHistory,
  formatTimeAgo,
  deleteChatsFromBackend,
  type ChatSession,
} from "@/app/utils/chatHistory";
import toast from "react-hot-toast";

interface ChatHistoryListProps {
  onSelectChat: (session: ChatSession) => void;
  onDeleteChat: (sessionId: string) => void;
  isExpanded: boolean;
}

const ChatHistoryList: React.FC<ChatHistoryListProps> = ({
  onSelectChat,
  onDeleteChat,
  isExpanded,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteMenuOpen, setDeleteMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const history = await fetchChatHistory();
      setSessions(history);
      setIsLoading(false);
    };

    if (isExpanded) {
      loadHistory();
    }
  }, [isExpanded]);

  const handleDelete = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    onDeleteChat(sessionId);
    setDeleteMenuOpen(null);
    toast.success("Chat deleted");

    const chatId = sessionId.replace("session-", "");
    deleteChatsFromBackend(chatId);
  };

  return (
    <div
      className={`transition-all duration-300 overflow-hidden ${
        isExpanded ? "max-h-96" : "max-h-0"
      }`}
    >
      <div className="space-y-1 p-2 border-t border-gray-200/50">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Chat History
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="flex space-x-1">
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: "var(--success)" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  backgroundColor: "var(--success)",
                  animationDelay: "0.1s",
                }}
              ></div>
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  backgroundColor: "var(--success)",
                  animationDelay: "0.2s",
                }}
              ></div>
            </div>
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-gray-500">
            <svg
              className="w-8 h-8 mx-auto mb-2 opacity-40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            No chat history yet
          </div>
        )}

        {!isLoading && sessions.length > 0 && (
          <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin">
            {sessions.map((session) => (
              <div key={session.id} className="relative group">
                <button
                  onClick={() => onSelectChat(session)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-150 text-sm group/item"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate group-hover/item:text-blue-600 transition-colors">
                        {session.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatTimeAgo(session.timestamp)}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    setDeleteMenuOpen(
                      deleteMenuOpen === session.id ? null : session.id
                    )
                  }
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all duration-150"
                  title="Delete chat"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>

                {deleteMenuOpen === session.id && (
                  <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-2 w-40 animate-scale-in">
                    <p className="text-xs text-gray-700 px-2 py-1 mb-2">
                      Delete this chat?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteMenuOpen(null)}
                        className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryList;
