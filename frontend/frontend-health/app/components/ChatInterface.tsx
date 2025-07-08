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

const ChatInterface: React.FC = () => {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<
      | { text: string; sender: "user" | "bot" }
      | { image: string; sender: "user" }
    >
  >([
    {
      text: "Hello, I&apos;m your assistant. How can I help you today?",
      sender: "bot",
    },
  ]);
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
    <div className="h-full flex flex-col relative bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {"image" in message ? (
              <div className="max-w-xs lg:max-w-md rounded-xl overflow-hidden shadow-md border border-gray-200">
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
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                }`}
              >
                {message.text.split("\n").map((paragraph, i) => (
                  <p key={i} className="mb-2 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-2 border border-gray-100">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-opacity-30 backdrop-blur-sm"
            onClick={handleAddSymptomClick}
          />

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md z-50 overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
              <h2 className="text-xl font-bold">Describe Your Symptoms</h2>
              <p className="text-sm opacity-90 mt-1">
                Add all symptoms you&apos;re experiencing
              </p>
            </div>

            <div className="p-5">
              <form onSubmit={handleSendMessage}>
                <div className="space-y-3 mb-5">
                  {symptoms.map((symptom, index) => (
                    <div
                      key={symptom.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="text"
                        value={symptom.value}
                        onChange={(e) =>
                          handleSymptomChange(symptom.id, e.target.value)
                        }
                        className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                        placeholder={`Symptom ${index + 1}`}
                        autoFocus={index === symptoms.length - 1}
                      />
                      {index === symptoms.length - 1 ? (
                        <button
                          type="button"
                          onClick={addSymptomField}
                          className="text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 transition-colors"
                          aria-label="Add symptom field"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeSymptomField(symptom.id)}
                          className="text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 font-medium rounded-lg text-sm p-2.5 transition-colors"
                          aria-label="Remove symptom field"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddSymptomClick}
                    className="flex-1 text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-3 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-3 flex items-center justify-center space-x-2 transition-all shadow-md"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span>Processing</span>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      </>
                    ) : (
                      <>
                        <span>Submit</span>
                        <FontAwesomeIcon icon={faPaperPlane} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-opacity-30 backdrop-blur-sm"
            onClick={() => setIsImageModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md z-50 overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
              <h2 className="text-xl font-bold">Image Preview</h2>
              <p className="text-sm opacity-90 mt-1">
                Review your medical image
              </p>
            </div>

            <div className="p-5">
              <div className="mb-5 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={selectedImage.preview}
                  alt="Preview"
                  width={400}
                  height={300}
                  className="w-full h-auto object-contain max-h-64"
                  unoptimized
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="flex-1 text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 font-medium rounded-lg text-sm px-4 py-3 flex items-center justify-center space-x-2 transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="flex-1 text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-2 focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-3 flex items-center justify-center space-x-2 transition-colors"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  <span>Remove</span>
                </button>
                <button
                  type="button"
                  onClick={handleImageSubmit}
                  className="flex-1 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-3 flex items-center justify-center space-x-2 transition-all shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span>Sending</span>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPaperPlane} />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3 mb-3">
          <button
            onClick={handleAddSymptomClick}
            type="button"
            className="text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-3 flex items-center space-x-2 transition-all shadow-md flex-1"
          >
            <FontAwesomeIcon icon={faPlus} />
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
            disabled={isLoading}
            // disabled
            className={`text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 focus:ring-2 focus:ring-gray-300 font-medium rounded-lg text-sm px-4 py-3 flex items-center space-x-2 transition-all shadow-md flex-1 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <FontAwesomeIcon icon={faImage} />
            <span>Upload Image</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center px-2">
          Note: This assistant provides general information only, not medical
          advice. Always consult with a healthcare professional.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
