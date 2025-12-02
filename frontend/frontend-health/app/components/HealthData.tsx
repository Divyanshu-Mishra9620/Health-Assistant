"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import {
  getHealthRecordsWithBackgroundRefresh,
  type ChatMessage,
} from "@/app/utils/healthRecordsCache";

export default function HealthData() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        // Get cached data immediately
        const { cachedData, freshDataPromise } =
          await getHealthRecordsWithBackgroundRefresh();

        // If we have cached data, show it immediately
        if (cachedData && cachedData.length > 0) {
          setMessages(cachedData);
          setLoading(false);
          setIsRefreshing(true); // Show subtle refresh indicator
        }

        // Wait for fresh data in background
        const freshData = await freshDataPromise;
        setMessages(freshData);
        setIsRefreshing(false);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load chat history:", error);
        // Only show error if we don't have cached data
        if (messages.length === 0) {
          setError("Failed to load chat history. Please try again later.");
        }
        setLoading(false);
        setIsRefreshing(false);
      }
    };
    fetchChatHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="medical-gradient p-4 rounded-full shadow-lg mb-4 animate-pulse">
          <svg
            className="w-12 h-12 text-white animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <p
          className="text-lg font-medium"
          style={{ color: "var(--textPrimary)" }}
        >
          Loading your health records...
        </p>
        <p className="text-sm mt-2" style={{ color: "var(--textMuted)" }}>
          Please wait
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div
          className="p-4 rounded-full mb-4"
          style={{ backgroundColor: "var(--errorLight)" }}
        >
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: "var(--error)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p
          className="text-center text-lg font-medium mb-2"
          style={{ color: "var(--error)" }}
        >
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div
          className="p-4 rounded-full mb-4"
          style={{ backgroundColor: "var(--backgroundSecondary)" }}
        >
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: "var(--textMuted)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p
          className="text-lg font-medium"
          style={{ color: "var(--textPrimary)" }}
        >
          No health records found
        </p>
        <p className="text-sm mt-2" style={{ color: "var(--textMuted)" }}>
          Start a conversation to create records
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--textPrimary)" }}
          >
            Medical History
          </h2>
          <p style={{ color: "var(--textSecondary)" }}>
            Your past consultations and health records
          </p>
        </div>
        {isRefreshing && (
          <div
            className="flex items-center space-x-2 text-sm"
            style={{ color: "var(--success)" }}
          >
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Updating...</span>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`glass-effect p-6 rounded-2xl max-w-4xl shadow-md hover:shadow-lg transition-all duration-200 ${
              message.is_user ? "ml-auto border-l-4" : "mr-auto border-l-4"
            }`}
            style={{
              backgroundColor: "var(--surface)",
              borderLeftColor: message.is_user
                ? "var(--primary)"
                : "var(--success)",
            }}
          >
            <div className="flex items-start space-x-4">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                style={{
                  backgroundColor: message.is_user
                    ? "var(--primary)"
                    : "var(--success)",
                }}
              >
                {message.is_user ? (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: message.is_user
                        ? "var(--primary)"
                        : "var(--success)",
                    }}
                  >
                    {message.is_user ? "You" : "Health Assistant"}
                  </span>
                  <time
                    className="text-xs flex items-center space-x-1"
                    style={{ color: "var(--textMuted)" }}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{new Date(message.timestamp).toLocaleString()}</span>
                  </time>
                </div>

                {message.image_url && (
                  <div
                    className="relative w-full max-w-sm mb-3 rounded-xl overflow-hidden border-2 shadow-md"
                    style={{ borderColor: "var(--border)" }}
                  >
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

                <p
                  className="whitespace-pre-wrap leading-relaxed"
                  style={{ color: "var(--textPrimary)" }}
                >
                  {message.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
