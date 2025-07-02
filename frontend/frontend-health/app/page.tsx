"use client";
import { useState } from "react";
import HealthSidebar from "./components/HealthSidebar";
import AppHeader from "./components/AppHeader";
import ChatInterface from "./components/ChatInterface";

export default function HealthApp() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = (): void => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <HealthSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-4">
          <ChatInterface />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
