import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ProfileSkeletonLoader from "./ProfileSkeletonLoader";

interface HealthSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  handlePageClick: (page: "dashboard" | "healthData") => void;
  activePage: "dashboard" | "healthData";
}

interface User {
  email: string;
  full_name: string;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  blood_group: string;
  allergies: string;
}

const HealthSidebar: React.FC<HealthSidebarProps> = ({
  isOpen,
  toggleSidebar,
  handlePageClick,
  activePage,
}) => {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
    },
    {
      id: "healthData",
      label: "Health Records",
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
  ];

  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLoading(false);
      return;
    }
    const parsedUser: User = JSON.parse(storedUser);
    setUser(parsedUser);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/signin");
  };

  const handleToggle = () => {
    if (profileOpen) setProfileOpen(false);
    toggleSidebar();
  };

  return (
    <aside
      className={`fixed lg:relative z-30 w-64 h-full bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-blue-600">
            Health Assistant
          </h2>
          <button
            onClick={() => handleToggle()}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close sidebar"
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
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-3 transition-colors duration-200 ${
                    activePage === item.id
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                  onClick={() =>
                    handlePageClick(item.id as "dashboard" | "healthData")
                  }
                  aria-current={activePage === item.id ? "page" : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 relative">
          <div
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {user?.full_name?.charAt(0) || "A"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.full_name || "Anonymous"}
                </p>
                <p className="text-xs text-gray-500">User</p>
              </div>
            </div>
            <FontAwesomeIcon
              icon={faEllipsis}
              className={`text-gray-500 transition-transform ${
                profileOpen ? "rotate-90" : ""
              }`}
            />
          </div>

          {profileOpen &&
            (loading ? (
              <ProfileSkeletonLoader />
            ) : (
              <div className="absolute bottom-full left-0 right-0 mx-4 mb-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {user?.full_name?.charAt(0) || "A"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 truncate">
                        {user?.full_name || "Anonymous User"}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Gender</p>
                      <p className="font-medium">{user?.gender || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Age</p>
                      <p className="font-medium">{user?.age || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Height</p>
                      <p className="font-medium">
                        {user?.height_cm ? `${user?.height_cm} cm` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Weight</p>
                      <p className="font-medium">
                        {user?.weight_kg ? `${user?.weight_kg} kg` : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500">Blood Group</p>
                    <p className="font-medium">{user?.blood_group || "-"}</p>
                  </div>

                  {user?.allergies && (
                    <div className="text-sm">
                      <p className="text-gray-500">Allergies</p>
                      <p className="font-medium">{user?.allergies}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 p-2 bg-gray-50">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center justify-center space-x-2 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
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
            ))}
        </div>
      </div>
    </aside>
  );
};

export default HealthSidebar;
