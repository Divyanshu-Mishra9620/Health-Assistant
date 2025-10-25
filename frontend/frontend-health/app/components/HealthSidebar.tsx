import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ProfileSkeletonLoader from "./ProfileSkeletonLoader";
import Cookies from "js-cookie";
import ChatHistoryList from "./ChatHistoryList";
import { useTheme } from "@/app/context/ThemeContext";
import type { ChatSession } from "@/app/utils/chatHistory";

interface HealthSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  handlePageClick: (page: "dashboard" | "healthData") => void;
  activePage: "dashboard" | "healthData";
  onNewChat?: () => void;
  onLoadChatHistory?: (session: ChatSession) => void;
  onOpenProfileModal?: () => void;
  user?: User | null;
}

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

const HealthSidebar: React.FC<HealthSidebarProps> = ({
  isOpen,
  toggleSidebar,
  handlePageClick,
  activePage,
  onNewChat,
  onLoadChatHistory,
  onOpenProfileModal,
  user: userProp,
}) => {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
    },
    {
      id: "healthData",
      label: "Health Records",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
  ];

  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState<boolean>(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (userProp) {
      setUser(userProp);
      setLoading(false);
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLoading(false);
      return;
    }
    const parsedUser: User = JSON.parse(storedUser);
    setUser(parsedUser);
    setLoading(false);
  }, [userProp]);

  const handleLogout = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("access_token");
    Cookies.remove("access_token");
    window.location.href = "/signin";
  };

  const handleToggle = () => {
    if (profileOpen) setProfileOpen(false);
    toggleSidebar();
  };

  return (
    <aside
      className={`fixed lg:relative z-30 w-20 lg:w-20 h-full backdrop-blur-lg shadow-xl lg:shadow-none transform transition-all duration-300 ease-in-out flex flex-col ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
      style={{
        backgroundColor: "var(--surface)",
        borderRightWidth: "1px",
        borderColor: "var(--border)",
        overflowX: "hidden",
        overflowY: "visible",
      }}
    >
      <div
        className="h-full flex flex-col"
        style={{ overflowX: "hidden", overflowY: "visible" }}
      >
        <div
          className="p-3 flex items-center justify-center group relative"
          style={{
            borderBottomWidth: "1px",
            borderColor: "var(--border)",
            background:
              "linear-gradient(to right, var(--backgroundSecondary), var(--surface))",
          }}
        >
          <button
            className="medical-gradient p-3 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-110 group relative"
            title="Health Assistant"
          >
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
          </button>
          <button
            onClick={() => handleToggle()}
            className="lg:hidden absolute top-2 right-2 p-2 rounded-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            style={{ color: "var(--textSecondary)" }}
            aria-label="Close sidebar"
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

        <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin flex flex-col items-center space-y-2">
          {onNewChat && (
            <button
              onClick={() => {
                onNewChat();
                if (activePage !== "dashboard") {
                  handlePageClick("dashboard");
                }
              }}
              className="w-12 h-12 rounded-xl medical-gradient text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center group relative"
              title="New Chat"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}

          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
                activePage === item.id
                  ? "text-white shadow-lg scale-110"
                  : "hover:scale-110"
              }`}
              style={
                activePage === item.id
                  ? {
                      backgroundColor: "var(--success)",
                      color: "white",
                    }
                  : {
                      backgroundColor: "transparent",
                      color: "var(--textSecondary)",
                    }
              }
              onMouseEnter={(e) => {
                if (activePage !== item.id) {
                  e.currentTarget.style.backgroundColor = "var(--hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (activePage !== item.id) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
              onClick={() =>
                handlePageClick(item.id as "dashboard" | "healthData")
              }
              title={item.label}
              aria-current={activePage === item.id ? "page" : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
            </button>
          ))}

          {activePage === "dashboard" && (
            <button
              onClick={() => setHistoryExpanded(!historyExpanded)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
                historyExpanded ? "scale-110" : "hover:scale-110"
              }`}
              style={
                historyExpanded
                  ? {
                      backgroundColor: "var(--primaryLight)",
                      color: "var(--primary)",
                      borderWidth: "2px",
                      borderColor: "var(--primary)",
                    }
                  : {
                      backgroundColor: "transparent",
                      color: "var(--textSecondary)",
                      borderWidth: "2px",
                      borderColor: "transparent",
                    }
              }
              onMouseEnter={(e) => {
                if (!historyExpanded) {
                  e.currentTarget.style.backgroundColor = "var(--hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!historyExpanded) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
              title="Previous Chats"
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          )}

          {activePage === "dashboard" && historyExpanded && (
            <div
              className="w-72 fixed left-20 top-40 rounded-xl shadow-2xl max-h-96 overflow-hidden z-40 animate-scale-in"
              style={{
                backgroundColor: "var(--surface)",
                borderWidth: "1px",
                borderColor: "var(--border)",
              }}
            >
              <ChatHistoryList
                isExpanded={true}
                onSelectChat={(session) => {
                  onLoadChatHistory?.(session);
                  setHistoryExpanded(false);
                }}
                onDeleteChat={() => {}}
              />
            </div>
          )}

          <button
            type="button"
            className="mt-auto pt-2 w-12 h-12 rounded-xl flex items-center justify-center group relative cursor-default"
            style={{ color: "var(--success)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--successLight)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="Status: Active"
            disabled
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </nav>

        <div
          className="p-2 flex items-center justify-center relative"
          style={{
            borderTopWidth: "1px",
            borderColor: "var(--border)",
            background:
              "linear-gradient(to right, var(--backgroundSecondary), var(--surface))",
          }}
        >
          <button
            className="relative h-12 w-12 rounded-full medical-gradient flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-110 group"
            onClick={() => setProfileOpen(!profileOpen)}
            title="Profile Menu"
          >
            <span className="text-white font-bold text-lg">
              {user?.full_name?.charAt(0) || "A"}
            </span>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
              style={{ backgroundColor: "var(--success)" }}
            ></div>
          </button>

          {profileOpen && loading && <ProfileSkeletonLoader />}

          {profileOpen &&
            !loading &&
            globalThis.window !== undefined &&
            createPortal(
              <>
                <button
                  type="button"
                  className="fixed inset-0"
                  onClick={() => setProfileOpen(false)}
                  aria-label="Close profile menu"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    cursor: "default",
                    zIndex: 9998,
                  }}
                />

                <div
                  className="fixed bottom-4 left-24 rounded-2xl shadow-2xl overflow-y-auto w-80 max-h-[calc(100vh-6rem)]"
                  style={{
                    backgroundColor: "var(--modalBackground)",
                    borderWidth: "1px",
                    borderColor: "var(--modalBorder)",
                    animation: "scaleIn 0.2s ease-out",
                    zIndex: 9999,
                  }}
                >
                  <div
                    className="p-5 medical-gradient"
                    style={{
                      borderBottomWidth: "1px",
                      borderColor: "var(--modalBorder)",
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-2xl">
                          {user?.full_name?.charAt(0) || "A"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg truncate">
                          {user?.full_name || "Anonymous User"}
                        </h3>
                        <p className="text-xs text-blue-100 truncate">
                          {user?.email || "user@example.com"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 max-h-60 overflow-y-auto scrollbar-thin">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: "var(--backgroundSecondary)",
                          borderWidth: "1px",
                          borderColor: "var(--border)",
                        }}
                      >
                        <p
                          className="text-xs mb-1"
                          style={{ color: "var(--textMuted)" }}
                        >
                          Gender
                        </p>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--textPrimary)" }}
                        >
                          {user?.gender || "-"}
                        </p>
                      </div>
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: "var(--backgroundSecondary)",
                          borderWidth: "1px",
                          borderColor: "var(--border)",
                        }}
                      >
                        <p
                          className="text-xs mb-1"
                          style={{ color: "var(--textMuted)" }}
                        >
                          Age
                        </p>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--textPrimary)" }}
                        >
                          {user?.age || "-"} yrs
                        </p>
                      </div>
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: "var(--backgroundSecondary)",
                          borderWidth: "1px",
                          borderColor: "var(--border)",
                        }}
                      >
                        <p
                          className="text-xs mb-1"
                          style={{ color: "var(--textMuted)" }}
                        >
                          Height
                        </p>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--textPrimary)" }}
                        >
                          {user?.height_cm ? `${user?.height_cm} cm` : "-"}
                        </p>
                      </div>
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: "var(--backgroundSecondary)",
                          borderWidth: "1px",
                          borderColor: "var(--border)",
                        }}
                      >
                        <p
                          className="text-xs mb-1"
                          style={{ color: "var(--textMuted)" }}
                        >
                          Weight
                        </p>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--textPrimary)" }}
                        >
                          {user?.weight_kg ? `${user?.weight_kg} kg` : "-"}
                        </p>
                      </div>
                    </div>

                    <div
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: "var(--errorLight)",
                      }}
                    >
                      <p
                        className="text-xs font-medium mb-1"
                        style={{ color: "var(--error)" }}
                      >
                        Blood Group
                      </p>
                      <p
                        className="font-bold"
                        style={{ color: "var(--error)" }}
                      >
                        {user?.blood_group || "Not specified"}
                      </p>
                    </div>

                    {user?.allergies && (
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: "var(--warningLight)",
                          borderWidth: "1px",
                          borderColor: "var(--warning)",
                        }}
                      >
                        <p
                          className="text-xs font-medium mb-1"
                          style={{ color: "var(--warning)" }}
                        >
                          ⚠️ Allergies
                        </p>
                        <p
                          className="font-medium text-sm"
                          style={{ color: "var(--warning)" }}
                        >
                          {user?.allergies}
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    className="p-3 space-y-2"
                    style={{
                      borderTopWidth: "1px",
                      borderColor: "var(--border)",
                      backgroundColor: "var(--backgroundSecondary)",
                    }}
                  >
                    <button
                      onClick={() => {
                        onOpenProfileModal?.();
                        setProfileOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-md group"
                      style={{ color: "var(--primary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--primaryLight)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      <span>Edit Profile</span>
                    </button>

                    <button
                      onClick={toggleTheme}
                      className="w-full px-4 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-md group"
                      style={{ color: "var(--textPrimary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {theme === "light" ? (
                        <>
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                          </svg>
                          <span>Dark Mode</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.828-2.828a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm.707-7.071a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zm-7.071-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM3 11a1 1 0 100-2H2a1 1 0 100 2h1zm15-4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Light Mode</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-md group"
                      style={{ color: "var(--error)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--errorLight)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>,
              document.body
            )}
        </div>
      </div>
    </aside>
  );
};

export default HealthSidebar;
