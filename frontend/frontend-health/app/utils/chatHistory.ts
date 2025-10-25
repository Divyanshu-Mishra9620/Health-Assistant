import { cacheManager, CACHE_KEYS, CACHE_DURATION } from "./cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messages: Array<{
    id: number;
    message: string;
    is_user: boolean;
    timestamp: string;
    image_url?: string;
  }>;
}

export async function fetchChatHistory(): Promise<ChatSession[]> {
  try {
    const cachedData = cacheManager.get<ChatSession[]>(CACHE_KEYS.CHAT_HISTORY);
    if (cachedData && cachedData.length > 0) {
      return cachedData;
    }

    const response = await fetch(`${BACKEND_URL}/chat/history/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });

    if (!response.ok) {
      const fallbackData = cacheManager.get<ChatSession[]>(
        CACHE_KEYS.CHAT_HISTORY
      );
      return fallbackData || [];
    }

    const chats = await response.json();

    const sessions = groupChatsIntoSessions(chats);

    cacheManager.set(CACHE_KEYS.CHAT_HISTORY, sessions, CACHE_DURATION.MEDIUM);

    return sessions;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return cacheManager.get<ChatSession[]>(CACHE_KEYS.CHAT_HISTORY) || [];
  }
}

function groupChatsIntoSessions(
  chats: Array<{
    id: number;
    message: string;
    is_user: boolean;
    timestamp: string;
    image_url?: string;
  }>
): ChatSession[] {
  if (chats.length === 0) return [];

  const sessions: ChatSession[] = [];
  let currentSession: ChatSession | null = null;

  for (const chat of chats) {
    if (
      chat.is_user &&
      (currentSession === null || currentSession.messages.length > 1)
    ) {
      if (currentSession) {
        sessions.push(currentSession);
      }

      const timestamp = new Date(chat.timestamp).getTime();
      currentSession = {
        id: `session-${chat.id}`,
        title: truncateText(chat.message, 30),
        lastMessage: chat.message,
        timestamp,
        messages: [],
      };
    }

    if (currentSession) {
      currentSession.messages.push(chat);
      if (!chat.is_user) {
        currentSession.lastMessage = chat.message;
      }
    }
  }

  if (currentSession) {
    sessions.push(currentSession);
  }

  return sessions.reverse();
}

function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

export async function saveChatToBackend(
  messages: Array<
    { text: string; sender: "user" | "bot" } | { image: string; sender: "user" }
  >
): Promise<void> {
  try {
    for (const message of messages) {
      if ("text" in message) {
        await fetch(`${BACKEND_URL}/api/chatlog/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            message: message.text,
            is_user: message.sender === "user",
          }),
        });
      }
    }
    cacheManager.clear(CACHE_KEYS.CHAT_HISTORY);
  } catch (error) {
    console.error("Error saving chat to backend:", error);
  }
}

export async function deleteChatsFromBackend(chatId: string): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/chat/delete/${chatId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });
    cacheManager.clear(CACHE_KEYS.CHAT_HISTORY);
  } catch (error) {
    console.error("Error deleting chat from backend:", error);
  }
}

export function invalidateChatCache(): void {
  cacheManager.clear(CACHE_KEYS.CHAT_HISTORY);
}
