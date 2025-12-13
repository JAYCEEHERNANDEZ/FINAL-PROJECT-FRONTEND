// ResidentLayout.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaMoneyBillWave, FaUserCircle } from "react-icons/fa";
import { fetchUserNotices, markNoticeAsRead } from "../../api/api.js";

const ResidentLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("user_id");
  const userName = localStorage.getItem("user_name") || "User";

  const navItems = [
    { label: "Dashboard", path: "/resident-dashboard", icon: <FaTachometerAlt /> },
    { label: "Payments", path: "/payment", icon: <FaMoneyBillWave /> },
  ];

  const routeTitles = {
    "/resident-dashboard": "Resident Dashboard",
    "/payment": "Payments",
  };
  const title = routeTitles[location.pathname] || "Dashboard";

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    navigate("/");
  };

  // Load notifications
  const loadNotifications = async () => {
    if (!userId) return;
    try {
      const res = await fetchUserNotices(userId);
      const data = res.data?.notifications || res.notifications || [];
      const userNotifs = data.filter(
        (n) => n.user_id === null || Number(n.user_id) === Number(userId)
      );
      const sorted = userNotifs.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setNotifications(sorted);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [userId]);

  const handleMarkAsRead = async (notifId) => {
    try {
      await markNoticeAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = () => {
    const unread = notifications.filter((n) => Number(n.is_read) === 0);
    unread.forEach((n) => handleMarkAsRead(n.id));
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans relative">
      {/* Sidebar */}
      <aside
        className={`bg-gray-950 text-white flex flex-col transition-all duration-300 shadow-md m-2 rounded-2xl
        ${sidebarOpen ? "w-64" : "w-20 overflow-hidden"}`}
      >
        <div className="flex flex-col items-center mt-8 mb-4 px-4">
          <div className="flex items-center justify-between w-full">
            <h1
              className={`text-2xl font-bold text-blue-600 cursor-pointer ${
                sidebarOpen ? "" : "mx-auto"
              }`}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? "💧 SWS" : "💧"}
            </h1>
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-2xl text-white hover:text-blue-400"
              >
                ☰
              </button>
            )}
          </div>

          {sidebarOpen && (
            <div className="text-center mt-5">
              <p className="text-xl flex flex-col text-white">
                Welcome, <span className="text-blue-600">{userName}</span>
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-3 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-2 p-2 pr-0 hover:bg-blue-100 rounded transition-all
              ${sidebarOpen ? "justify-start px-4" : "justify-center"}`}
            >
              <span className="text-2xl text-blue-600">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
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
      <div className="flex-1 flex flex-col p-4 relative m-2 ml-0">
        {/* Header */}
        <div className="flex justify-between items-center bg-white text-blue-600 shadow rounded-xl py-2 px-7 mb-6">
          <span className="lg:text-xl md:text-xl text-sm  font-bold">{title}</span>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-blue-500 hover:bg-blue-400 text-white p-2 rounded-full relative text-xl"
            >
              🔔
              {notifications.filter((n) => Number(n.is_read) === 0).length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 text-xs text-white flex items-center justify-center">
                  {notifications.filter((n) => Number(n.is_read) === 0).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-gray-50 border border-gray-300 rounded shadow-lg z-50 overflow-y-auto max-h-[28rem]">
                {notifications.length === 0 ? (
                  <p className="p-4 text-gray-600 text-center">No notifications</p>
                ) : (
                  <>
                    <div className="flex justify-end p-2 border-b border-gray-200">
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Mark All as Read
                      </button>
                    </div>
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-blue-50 ${
                          Number(notif.is_read) === 0 ? "bg-blue-50" : ""
                        }`}
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        <p className="font-semibold text-sm text-gray-800">{notif.title}</p>
                        <p className="text-xs text-gray-600">{notif.message}</p>
                        <small className="text-gray-500 text-xs">
                          {new Date(notif.created_at).toLocaleString()}
                        </small>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <main className="flex-1">{children}</main>
      </div>

      {/* Logout Modal */}
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

export default ResidentLayout;
