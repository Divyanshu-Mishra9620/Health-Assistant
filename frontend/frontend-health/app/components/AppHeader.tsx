import React, { useState } from "react";

interface AppHeaderProps {
  toggleSidebar: () => void;
  onRefresh?: () => Promise<void> | void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  toggleSidebar,
  onRefresh = () => window.location.reload(),
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header
      className="sticky top-0 backdrop-blur-lg shadow-sm z-20 border-b"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg focus:outline-none transition-all duration-200"
              style={{
                color: "var(--textSecondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--success)";
                e.currentTarget.style.backgroundColor = "var(--hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--textSecondary)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              aria-label="Toggle sidebar"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="min-w-0 flex-1">
              <h1
                className="text-base sm:text-lg lg:text-xl font-bold truncate"
                style={{
                  color: "var(--success)",
                }}
              >
                Health Assistant
              </h1>
              <p
                className="hidden sm:block text-[10px] sm:text-xs font-medium truncate"
                style={{ color: "var(--textMuted)" }}
              >
                AI-Powered Medical Guidance
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <div
              className="hidden md:flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border"
              style={{
                backgroundColor: "var(--successLight)",
                borderColor: "var(--success)",
              }}
            >
              <div className="pulse-dot"></div>
              <span
                className="text-[10px] sm:text-xs font-semibold"
                style={{ color: "var(--success)" }}
              >
                Online
              </span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 sm:p-2.5 rounded-lg focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: "var(--textSecondary)",
              }}
              onMouseEnter={(e) => {
                if (!isRefreshing) {
                  e.currentTarget.style.color = "var(--success)";
                  e.currentTarget.style.backgroundColor = "var(--hover)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--textSecondary)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              aria-label={isRefreshing ? "Refreshing..." : "Refresh content"}
              title={isRefreshing ? "Refreshing..." : "Refresh"}
            >
              <svg
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
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
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
