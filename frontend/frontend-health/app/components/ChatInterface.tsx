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
      text: "Hello! I'm your Health Assistant. How can I help you today?",
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
      console.log("FormData created", formData); // Debug log

      // Add the image to messages
      setMessages([
        ...messages,
        { image: selectedImage.preview, sender: "user" },
      ]);

      // Send to backend
      const res = await fetch(`${BACKEND_URL}/img-diagnose/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });
      console.log("Response status:", res.status); // Debug log
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error details:", errorData); // Debug log
        throw new Error(errorData.message || "Failed to analyze image");
      }

      const newBotMessage = { text: "", sender: "bot" as const };
      setMessages((prev) => [...prev, newBotMessage]);

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
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {"image" in message ? (
              <div className="max-w-xs lg:max-w-md rounded-xl overflow-hidden shadow-sm">
                <img
                  src={message.image}
                  alt="Uploaded medical"
                  className="w-full h-auto object-cover"
                />
              </div>
            ) : (
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none shadow-sm"
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
            <div className="bg-white text-gray-800 px-4 py-2 rounded-lg rounded-bl-none shadow-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
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

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-50 overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <h2 className="text-lg font-semibold">Describe Your Symptoms</h2>
              <p className="text-sm opacity-90">
                Add all symptoms you're experiencing
              </p>
            </div>

            <div className="p-4">
              <form onSubmit={handleSendMessage}>
                <div className="space-y-3 mb-4">
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
                        className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        placeholder={`Symptom ${index + 1}`}
                        autoFocus={index === symptoms.length - 1}
                      />
                      {index === symptoms.length - 1 ? (
                        <button
                          type="button"
                          onClick={addSymptomField}
                          className="text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium rounded-lg text-sm p-2.5"
                          aria-label="Add symptom field"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeSymptomField(symptom.id)}
                          className="text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 font-medium rounded-lg text-sm p-2.5"
                          aria-label="Remove symptom field"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleAddSymptomClick}
                    className="flex-1 text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 flex items-center justify-center space-x-2"
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
            className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
            onClick={() => setIsImageModalOpen(false)}
          />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-50 overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <h2 className="text-lg font-semibold">Image Preview</h2>
              <p className="text-sm opacity-90">Review your medical image</p>
            </div>

            <div className="p-4">
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={selectedImage.preview}
                  alt="Preview"
                  className="w-full h-auto object-contain max-h-64"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="flex-1 text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 flex items-center justify-center space-x-2"
                >
                  <FontAwesomeIcon icon={faXmark} />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="flex-1 text-white bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 flex items-center justify-center space-x-2"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  <span>Remove</span>
                </button>
                <button
                  type="button"
                  onClick={handleImageSubmit}
                  className="flex-1 text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 flex items-center justify-center space-x-2"
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

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-2 mb-2">
          <button
            onClick={handleAddSymptomClick}
            type="button"
            className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 flex items-center space-x-2"
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
            className={`text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 font-medium rounded-lg text-sm px-4 py-2.5 flex items-center space-x-2 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <FontAwesomeIcon icon={faImage} />
            <span>Upload Image</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Note: This assistant provides general information only, not medical
          advice. Always consult with a healthcare professional.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
