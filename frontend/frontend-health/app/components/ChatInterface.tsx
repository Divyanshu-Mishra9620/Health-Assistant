"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  faImage,
  faXmark,
  faPaperPlane,
  faPlus,
  faTrash,
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

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  setMessages,
}) => {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [symptoms, setSymptoms] = useState([{ id: 1, value: "" }]);
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (selectedImage) {
      await handleImageSubmit();
      return;
    }

    const symptomList = symptoms.map((s) => s.value.trim()).filter((s) => s);
    if (symptomList.length === 0) {
      toast.error("Please enter at least one symptom");
      return;
    }

    const userMessage = symptomList.join(", ");
    setMessages([...messages, { text: userMessage, sender: "user" }]);
    setIsLoading(true);
    setIsOpen(false);

    const newBotMessage = { text: "", sender: "bot" as const };
    setMessages((prev) => [...prev, newBotMessage]);

    try {
      const res = await fetch(`${BACKEND_URL}/diagnose/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ symptom_names: userMessage.split(",") }),
      });

      if (!res.ok) {
        if (res.status === 401) logoutUser();
        else throw new Error("Failed to fetch diagnosis");
        return;
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
    } catch (error) {
      console.error("Stream error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Oops! Something went wrong while streaming diagnosis.",
          sender: "bot",
        },
      ]);
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
      setIsImageModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSubmit = async () => {
    if (!selectedImage) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedImage.file);
      setMessages([
        ...messages,
        { image: selectedImage.preview, sender: "user" },
      ]);

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

      const newBotMessage = { text: responseText, sender: "bot" as const };
      setMessages((prev) => [...prev, newBotMessage]);
    } catch (error) {
      console.error("Image analysis error:", error);
      let errorMessage =
        "I couldn't analyze your image. Please try again later.";

      if (error instanceof Error) {
        if (error.message === "IMAGE_ANALYSIS_NOT_SUPPORTED") {
          errorMessage =
            "Our current service doesn't support image analysis. Please describe your symptoms in text for assistance.";
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          text: errorMessage,
          sender: "bot",
        },
      ]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
      setIsImageModalOpen(false);
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

  const addSymptomField = () => {
    setSymptoms([...symptoms, { id: Date.now(), value: "" }]);
  };

  const removeSymptomField = (id: number) => {
    if (symptoms.length > 1) {
      setSymptoms(symptoms.filter((symptom) => symptom.id !== id));
    }
  };

  const handleSymptomChange = (id: number, value: string) => {
    setSymptoms(
      symptoms.map((symptom) =>
        symptom.id === id ? { ...symptom, value } : symptom
      )
    );
  };

  const handleAddSymptomClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSymptoms([{ id: 1, value: "" }]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-full flex flex-col">
      {messages.length === 1 && (
        <div className="px-4 py-8 text-center animate-fade-in">
          <div className="max-w-2xl mx-auto">
            <h2
              className="text-3xl font-bold mb-3"
              style={{ color: "var(--textPrimary)" }}
            >
              Your Health Assistant
            </h2>
            <p className="text-lg" style={{ color: "var(--textSecondary)" }}>
              Describe your symptoms and get instant medical guidance
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin">
        {messages.map((message, index) => (
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

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 backdrop-blur-md bg-black/40"
            onClick={handleAddSymptomClick}
          />

          <div
            className="relative rounded-3xl shadow-2xl w-full max-w-lg z-50 overflow-hidden animate-scale-in"
            style={{
              backgroundColor: "var(--modalBackground)",
              borderWidth: "1px",
              borderColor: "var(--modalBorder)",
            }}
          >
            <div
              className="p-8 border-b"
              style={{
                background:
                  "linear-gradient(135deg, var(--surface), var(--backgroundSecondary))",
                borderColor: "var(--modalBorder)",
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--primary), var(--success))",
                    }}
                  >
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-bold mb-1"
                      style={{ color: "var(--textPrimary)" }}
                    >
                      Describe Symptoms
                    </h2>
                    <p
                      className="text-sm"
                      style={{ color: "var(--textSecondary)" }}
                    >
                      Add all symptoms you&apos;re experiencing
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAddSymptomClick}
                  className="p-2 rounded-xl transition-all hover:bg-black/5"
                  style={{ color: "var(--textSecondary)" }}
                >
                  <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSendMessage}>
                <div className="space-y-4 mb-8">
                  {symptoms.map((symptom, index) => (
                    <div
                      key={symptom.id}
                      className="flex items-center gap-3 animate-slide-in-up"
                    >
                      <div className="relative flex-1">
                        <div
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: "var(--primaryLight)" }}
                        >
                          <span
                            className="text-sm font-bold"
                            style={{ color: "var(--primary)" }}
                          >
                            {index + 1}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={symptom.value}
                          onChange={(e) =>
                            handleSymptomChange(symptom.id, e.target.value)
                          }
                          className="w-full pl-16 pr-4 py-4 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg outline-none"
                          style={{
                            backgroundColor: "var(--surface)",
                            borderWidth: "2px",
                            borderColor: symptom.value
                              ? "var(--success)"
                              : "var(--border)",
                            color: "var(--textPrimary)",
                          }}
                          placeholder={`e.g., ${
                            index === 0
                              ? "Headache"
                              : index === 1
                              ? "Fever"
                              : "Fatigue"
                          }`}
                          autoFocus={index === symptoms.length - 1}
                        />
                      </div>
                      {index === symptoms.length - 1 ? (
                        <button
                          type="button"
                          onClick={addSymptomField}
                          className="p-4 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none shadow-lg"
                          style={{
                            backgroundColor: "var(--success)",
                          }}
                          aria-label="Add symptom field"
                        >
                          <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeSymptomField(symptom.id)}
                          className="p-4 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none shadow-lg"
                          style={{
                            backgroundColor: "var(--error)",
                          }}
                          aria-label="Remove symptom field"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleAddSymptomClick}
                    className="flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border-2"
                    style={{
                      color: "var(--textPrimary)",
                      backgroundColor: "transparent",
                      borderColor: "var(--border)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--success), var(--primary))",
                      color: "white",
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span>Analyzing</span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-white rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-white rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon
                          icon={faPaperPlane}
                          className="w-5 h-5"
                        />
                        <span>Get Diagnosis</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isImageModalOpen && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 backdrop-blur-md bg-black/40"
            onClick={() => setIsImageModalOpen(false)}
          />

          <div
            className="relative rounded-3xl shadow-2xl w-full max-w-lg z-50 overflow-hidden animate-scale-in"
            style={{
              backgroundColor: "var(--modalBackground)",
              borderWidth: "1px",
              borderColor: "var(--modalBorder)",
            }}
          >
            <div
              className="p-8 border-b"
              style={{
                background:
                  "linear-gradient(135deg, var(--surface), var(--backgroundSecondary))",
                borderColor: "var(--modalBorder)",
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--primary), var(--success))",
                    }}
                  >
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-bold mb-1"
                      style={{ color: "var(--textPrimary)" }}
                    >
                      Image Preview
                    </h2>
                    <p
                      className="text-sm"
                      style={{ color: "var(--textSecondary)" }}
                    >
                      Review before sending
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsImageModalOpen(false)}
                  className="p-2 rounded-xl transition-all hover:bg-black/5"
                  style={{ color: "var(--textSecondary)" }}
                >
                  <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div
                className="mb-8 rounded-2xl overflow-hidden shadow-xl"
                style={{ borderWidth: "2px", borderColor: "var(--border)" }}
              >
                <Image
                  src={selectedImage.preview}
                  alt="Preview"
                  width={400}
                  height={300}
                  className="w-full h-auto object-contain max-h-80"
                  style={{ backgroundColor: "var(--backgroundSecondary)" }}
                  unoptimized
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  style={{
                    color: "white",
                    backgroundColor: "var(--error)",
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
                  <span>Remove</span>
                </button>
                <button
                  type="button"
                  onClick={handleImageSubmit}
                  className="flex-1 px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--success), var(--primary))",
                    color: "white",
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span>Analyzing</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faPaperPlane}
                        className="w-5 h-5"
                      />
                      <span>Send Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="p-6 md:p-8 backdrop-blur-xl"
        style={{
          borderTopWidth: "1px",
          borderColor: "var(--border)",
          background:
            "linear-gradient(to top, var(--surface), var(--backgroundSecondary))",
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleAddSymptomClick}
              type="button"
              className="flex-1 flex items-center justify-center gap-3 shadow-xl font-bold rounded-2xl py-4 px-6 text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--success), var(--primary))",
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Add Symptoms</span>
            </button>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              onClick={triggerFileInput}
              disabled
              className={`flex-1 flex items-center justify-center gap-3 shadow-xl font-bold rounded-2xl py-4 px-6 transition-all duration-200 border-2 opacity-50 cursor-not-allowed`}
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--primary)",
                color: "var(--primary)",
              }}
            >
              <FontAwesomeIcon icon={faImage} className="w-6 h-6" />
              <span>Upload Image</span>
            </button>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: "var(--infoLight)",
            }}
          >
            <div className="flex items-start">
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--textPrimary)" }}
              >
                <strong className="font-bold">Medical Disclaimer:</strong> This
                AI provides general health information only. Always consult a
                qualified healthcare professional for diagnosis and treatment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
