"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface ChatMessage {
  id: string;
  image_url: string | null;
  message: string;
  timestamp: string;
  is_user: boolean;
}

export default function HealthData() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

   useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/chat/history/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Failed to load chat history:", error);
        setError("Failed to load chat history. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchChatHistory();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading chat history...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (messages.length === 0) {
    return <div className="text-center py-4">No chat history found</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`p-4 rounded-lg max-w-3xl mx-auto ${
            message.is_user
              ? "bg-blue-100 text-blue-900 ml-auto"
              : "bg-gray-100 text-gray-900 mr-auto"
          }`}
        >
          {message.image_url && (
            <div className="relative w-full max-w-md h-auto mb-2">
              <Image
                src={message.image_url}
                alt="Chat attachment"
                width={400}
                height={300}
                className="rounded"
                unoptimized
              />
            </div>
          )}
          <p className="whitespace-pre-wrap">{message.message}</p>
          <small className="text-xs text-gray-500 block mt-1">
            {new Date(message.timestamp).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  );
}
