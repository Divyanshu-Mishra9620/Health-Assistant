"use client";
import { useEffect, useState } from "react";
import HealthSidebar from "./components/HealthSidebar";
import AppHeader from "./components/AppHeader";
import ChatInterface from "./components/ChatInterface_Enhanced";
import HealthData from "./components/HealthData";
import FullScreenProfileEditModal from "./components/FullScreenProfileEditModal";
import RequireAuth from "./components/RequiredAuth";
import { useHealthRecordsPrefetch } from "./hooks/useHealthRecordsPrefetch";

interface User {
  id?: number;
  email: string;
  full_name: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  blood_group?: string;
  allergies?: string;
}

export default function HealthApp() {
  const [activePage, setActivePage] = useState<"dashboard" | "healthData">(
    "dashboard"
  );
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Prefetch health records in background when app loads
  useHealthRecordsPrefetch();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const [chatMessages, setChatMessages] = useState<
    Array<
      | { text: string; sender: "user" | "bot" }
      | { image: string; sender: "user" }
    >
  >([
    {
      text: "Hello, I'm your assistant. How can I help you today?",
      sender: "bot",
    },
  ]);

  const toggleSidebar = (): void => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePageChange = (page: "dashboard" | "healthData"): void => {
    setActivePage(page);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleNewChat = (): void => {
    setChatMessages([
      {
        text: "Hello, I'm your assistant. How can I help you today?",
        sender: "bot",
      },
    ]);
  };

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  return (
    <RequireAuth>
      <div
        className="flex h-screen overflow-x-hidden"
        style={{
          background:
            "linear-gradient(to bottom right, var(--background), var(--backgroundSecondary), var(--background))",
        }}
      >
        {" "}
        <HealthSidebar
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          activePage={activePage}
          handlePageClick={handlePageChange}
          onNewChat={handleNewChat}
          onOpenProfileModal={() => setProfileModalOpen(true)}
          user={user}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader toggleSidebar={toggleSidebar} />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
            <div className="max-w-7xl mx-auto">
              {!profileModalOpen && activePage === "dashboard" && (
                <ChatInterface
                  messages={chatMessages}
                  setMessages={setChatMessages}
                />
              )}
              {!profileModalOpen && activePage === "healthData" && (
                <HealthData />
              )}
            </div>
          </main>
        </div>
        {sidebarOpen && (
          <div
            className="fixed inset-0 backdrop-blur-sm z-20 lg:hidden animate-fade-in"
            onClick={toggleSidebar}
            style={{
              backgroundColor: "var(--overlay)",
            }}
          />
        )}
      </div>

      {profileModalOpen && (
        <FullScreenProfileEditModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={user}
          onSave={(updatedUser) => {
            setUser(updatedUser);
            setProfileModalOpen(false);
          }}
        />
      )}
    </RequireAuth>
  );
}
