"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  faImage,
  faPaperPlane,
  faStethoscope,
  faLightbulb,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import toast from "react-hot-toast";
import Image from "next/image";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface ChatInterfaceProps {
  messages: Array<
    { text: string; sender: "user" | "bot" } | { image: string; sender: "user" }
  >;
  setMessages: React.Dispatch<
    React.SetStateAction<
      Array<
        | { text: string; sender: "user" | "bot" }
        | { image: string; sender: "user" }
      >
    >
  >;
}

const QUICK_PROMPTS = [
  { icon: faStethoscope, text: "I have a headache", color: "var(--primary)" },
  { icon: faHeart, text: "Feeling fatigued lately", color: "var(--error)" },
  {
    icon: faLightbulb,
    text: "How to improve my sleep?",
    color: "var(--warning)",
  },
  {
    icon: faStethoscope,
    text: "Tips for staying healthy",
    color: "var(--success)",
  },
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  setMessages,
}) => {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);

  // Generate or retrieve session ID
  useEffect(() => {
    let currentSessionId = sessionStorage.getItem("chat_session_id");
    if (!currentSessionId) {
      currentSessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      sessionStorage.setItem("chat_session_id", currentSessionId);
    }
    setSessionId(currentSessionId);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  const logoutUser = () => {
    setMessages((prev) => [
      ...prev,
      {
        text: "Your session has expired. Please login again.",
        sender: "bot",
      },
    ]);
    setTimeout(() => {
      router.push("/signin");
    }, 3000);
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim();

    if (isLoading) return;
    if (!textToSend && !selectedImage) {
      toast.error("Please enter a message");
      return;
    }

    if (selectedImage) {
      await handleImageSubmit();
      return;
    }

    // Add user message to UI
    setMessages((prev) => [...prev, { text: textToSend, sender: "user" }]);
    setInputMessage("");
    setIsLoading(true);

    // Add empty bot message for streaming
    const newBotMessage = { text: "", sender: "bot" as const };
    setMessages((prev) => [...prev, newBotMessage]);

    try {
      const res = await fetch(`${BACKEND_URL}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          message: textToSend,
          session_id: sessionId,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          logoutUser();
          return;
        }
        throw new Error("Failed to get response");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      let botText = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          botText += chunk;

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              text: botText,
            };
            return updated;
          });
        }
      }

      toast.success("Response received!", { duration: 1500 });
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          text: "I apologize, but I'm having trouble responding right now. Please try again.",
          sender: "bot",
        };
        return updated;
      });
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage({
        file,
        preview: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageSubmit = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { image: selectedImage.preview, sender: "user" },
    ]);

    try {
      const formData = new FormData();
      formData.append("image", selectedImage.file);

      const res = await fetch(`${BACKEND_URL}/img-diagnose/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });

      const responseText = await res.text();

      if (responseText.trim().startsWith("[Error]")) {
        throw new Error("IMAGE_ANALYSIS_NOT_SUPPORTED");
      }

      setMessages((prev) => [...prev, { text: responseText, sender: "bot" }]);
      toast.success("Image analyzed!");
    } catch (error) {
      console.error("Image analysis error:", error);
      let errorMessage =
        "I couldn't analyze your image. Please describe your symptoms in text instead.";

      if (
        error instanceof Error &&
        error.message === "IMAGE_ANALYSIS_NOT_SUPPORTED"
      ) {
        errorMessage =
          "Image analysis is currently unavailable. Please describe your symptoms in text for assistance.";
      }

      setMessages((prev) => [...prev, { text: errorMessage, sender: "bot" }]);
      toast.error("Image analysis failed");
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputMessage(promptText);
    setTimeout(() => handleSendMessage(promptText), 100);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Welcome Header (only show when minimal messages) */}
      {messages.length <= 1 && (
        <div className="px-4 py-8 text-center animate-fade-in">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 inline-block">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl mx-auto medical-gradient">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
            </div>
            <h2
              className="text-4xl font-bold mb-4 bg-gradient-to-r text-transparent "
              style={{ color: "var(--textSecondary)" }}
            >
              Your Personal Health Assistant
            </h2>
            <p
              className="text-lg mb-8"
              style={{ color: "var(--textSecondary)" }}
            >
              Ask me anything about your health. I&apos;m here to help with
              personalized, evidence-based guidance.
            </p>

            {/* Quick Action Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              {QUICK_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(prompt.text)}
                  className="flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-xl group"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderWidth: "2px",
                    borderColor: "var(--border)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ backgroundColor: `${prompt.color}20` }}
                  >
                    <FontAwesomeIcon
                      icon={prompt.icon}
                      className="w-5 h-5"
                      style={{ color: prompt.color }}
                    />
                  </div>
                  <span
                    className="flex-1 text-left font-medium"
                    style={{ color: "var(--textPrimary)" }}
                  >
                    {prompt.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin">
        {messages.slice(1).map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            } animate-slide-in-up`}
          >
            {"image" in message ? (
              <div
                className="group relative max-w-xs lg:max-w-md rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl"
                style={{
                  borderWidth: "2px",
                  borderColor: "var(--primary)",
                }}
              >
                <Image
                  src={message.image}
                  alt="Uploaded medical"
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex items-start gap-3 max-w-xs lg:max-w-2xl group">
                {message.sender === "bot" && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl medical-gradient flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                )}
                <div
                  className={`px-6 py-4 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl ${
                    message.sender === "user"
                      ? "rounded-tr-sm"
                      : "rounded-tl-sm"
                  }`}
                  style={
                    message.sender === "user"
                      ? {
                          background:
                            "linear-gradient(135deg, var(--primary), var(--success))",
                          color: "white",
                        }
                      : {
                          backgroundColor: "var(--surface)",
                          borderWidth: "1px",
                          borderColor: "var(--border)",
                          color: "var(--textPrimary)",
                        }
                  }
                >
                  {message.text.split("\n").map((paragraph, i) => (
                    <p
                      key={i}
                      className="mb-3 last:mb-0 leading-relaxed text-[15px]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl medical-gradient flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <div
                className="px-6 py-4 rounded-2xl rounded-tl-sm shadow-lg flex items-center gap-2"
                style={{
                  backgroundColor: "var(--surface)",
                  borderWidth: "1px",
                  borderColor: "var(--border)",
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{ backgroundColor: "var(--primary)" }}
                ></div>
                <div
                  className="w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{
                    backgroundColor: "var(--primary)",
                    animationDelay: "0.15s",
                  }}
                ></div>
                <div
                  className="w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{
                    backgroundColor: "var(--primary)",
                    animationDelay: "0.3s",
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="p-4 md:p-6 backdrop-blur-xl border-t"
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(to top, var(--surface), var(--backgroundSecondary))",
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Image Preview */}
          {selectedImage && (
            <div
              className="mb-4 p-4 rounded-2xl animate-slide-in-up"
              style={{
                backgroundColor: "var(--surface)",
                borderWidth: "2px",
                borderColor: "var(--primary)",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <Image
                    src={selectedImage.preview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <p
                    className="font-medium mb-1"
                    style={{ color: "var(--textPrimary)" }}
                  >
                    {selectedImage.file.name}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--textSecondary)" }}
                  >
                    {(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={removeSelectedImage}
                  className="p-3 rounded-xl transition-all hover:scale-105"
                  style={{
                    backgroundColor: "var(--errorLight)",
                    color: "var(--error)",
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Input Box */}
          <div
            className="flex items-end gap-3 p-3 rounded-2xl shadow-xl"
            style={{
              backgroundColor: "var(--surface)",
              borderWidth: "2px",
              borderColor: inputMessage ? "var(--primary)" : "var(--border)",
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled
              className="p-3 rounded-xl transition-all flex-shrink-0 opacity-50 cursor-not-allowed"
              style={{
                backgroundColor: "var(--primaryLight)",
                color: "var(--primary)",
              }}
              title="Image upload coming soon"
            >
              <FontAwesomeIcon icon={faImage} className="w-5 h-5" />
            </button>

            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your symptoms or ask a health question..."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent outline-none resize-none py-3 px-2 max-h-32 scrollbar-thin"
              style={{
                color: "var(--textPrimary)",
              }}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
              className="p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0 shadow-lg"
              style={{
                background:
                  inputMessage.trim() || selectedImage
                    ? "linear-gradient(135deg, var(--primary), var(--success))"
                    : "var(--backgroundSecondary)",
                color: "white",
              }}
            >
              <FontAwesomeIcon icon={faPaperPlane} className="w-5 h-5" />
            </button>
          </div>

          {/* Disclaimer */}
          <div className="mt-4">
            <p
              className="text-xs text-center leading-relaxed"
              style={{ color: "var(--textMuted)" }}
            >
              <strong>Medical Disclaimer:</strong> This AI provides general
              health information only. Always consult a qualified healthcare
              professional for diagnosis and treatment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
