"use client";
import { useEffect, useState } from "react";
import HealthSidebar from "./components/HealthSidebar";
import AppHeader from "./components/AppHeader";
import ChatInterface from "./components/ChatInterface";
import HealthData from "./components/HealthData";
import RequireAuth from "./components/RequiredAuth";

export default function HealthApp() {
  const [activePage, setActivePage] = useState<"dashboard" | "healthData">(
    "dashboard"
  );
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = (): void => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePageChange = (page: "dashboard" | "healthData"): void => {
    setActivePage(page);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  return (
    <RequireAuth>
      <div className="flex h-screen bg-gray-50">
        <HealthSidebar
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          activePage={activePage}
          handlePageClick={handlePageChange}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader toggleSidebar={toggleSidebar} />

          <main className="flex-1 overflow-y-auto p-4">
            {activePage === "dashboard" ? <ChatInterface /> : <HealthData />}
          </main>
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-20 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </div>
    </RequireAuth>
  );
}
