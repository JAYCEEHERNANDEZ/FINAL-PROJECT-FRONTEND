import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaTachometerAlt, FaFolderOpen, FaUserCircle } from "react-icons/fa";
import usePageTitle from "../usePageTitle";

const MeterReaderLayout = ({ children }) => {
  usePageTitle("Meter Reader Control");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/meter-dashboard", icon: <FaTachometerAlt /> },
    { label: "Record Consumption", path: "/record-consumption", icon: <FaFolderOpen /> },
  ];

  const routeTitles = {
    "/meter-dashboard": "Meter Reader Dashboard",
    "/record-consumption": "Record Consumption",
  };

  const title = routeTitles[location.pathname] || "Dashboard";

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside
        className={`bg-gray-950 text-white flex flex-col transition-all duration-300 m-2 rounded-2xl ${
          sidebarOpen ? "w-64" : "w-20 overflow-hidden"
        }`}
      >
        <div className="flex items-center justify-between mt-8 mb-8 px-4">
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full">
              <h1
                className="text-2xl font-bold text-blue-600 cursor-pointer"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                💧 SWS
              </h1>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-2xl text-white hover:text-blue-400"
              >
                ☰
              </button>
            </div>
          ) : (
            <div
              className="flex justify-center w-full cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <h1 className="text-2xl font-bold text-blue-600">💧</h1>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-3 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-2 p-2 hover:bg-blue-100 rounded transition-all ${
                sidebarOpen ? "justify-start px-4" : "justify-center"
              }`}
            >
              <span className="text-blue-600 text-2xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="mt-auto mb-4 py-2 px-2 text-center flex flex-col items-center">
          {sidebarOpen && (
            <span className="text-lg font-semibold text-blue-500 uppercase mb-2">
              SUCOL WATER SYSTEM
            </span>
          )}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 px-2 py-1 rounded"
          >
            <FaUserCircle className="text-2xl" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center bg-white text-blue-600 py-2 px-5 m-5 rounded-xl shadow mb-1 text-xl font-semibold">
          <span className="text-xl font-bold p-2">{title}</span>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>

      {/* Logout module*/}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-lg text-center">
            <p className="text-lg font-semibold mb-4">Confirm to log out?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeterReaderLayout;
