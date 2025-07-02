"use client";
import axios from "axios";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const ChatInterface: React.FC = () => {
  const router = useRouter();

  const [messages, setMessages] = useState<
    Array<{ text: string; sender: "user" | "bot" }>
  >([
    {
      text: "Hello! I'm your Health Assistant. How can I help you today?",
      sender: "bot",
    },
  ]);

  const [step, setStep] = useState<
    "welcome" | "askSymptoms" | "processing" | "done"
  >("welcome");

  const [inputValue, setInputValue] = useState("");

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
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
    setInputValue("");

    if (step === "welcome") {
      setMessages((prev) => [
        ...prev,
        {
          text: "Great! Please list your symptoms separated by commas.",
          sender: "bot",
        },
      ]);
      setStep("askSymptoms");
    } else if (step === "askSymptoms") {
      const symptomList = userMessage.split(",").map((s) => s.trim());

      setStep("processing");
      try {
        const res = await axios.post(
          `${BACKEND_URL}/diagnose/`,
          { symptom_names: symptomList },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setMessages((prev) => [
          ...prev,
          { text: res.data.diagnosis, sender: "bot" },
        ]);
        setStep("done");
      } catch (error: any) {
        if (error.response && error.response.status === 401) {
          logoutUser();
        } else {
          setMessages((prev) => [
            ...prev,
            {
              text: "Oops! Something went wrong while fetching diagnosis.",
              sender: "bot",
            },
          ]);
          setStep("askSymptoms");
        }
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-gray-200 text-gray-800 rounded-bl-none"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200"
      >
        <div className="flex">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your symptoms or health question..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Note: This assistant provides general information only, not medical
          advice.
        </p>
      </form>
    </div>
  );
};

export default ChatInterface;
