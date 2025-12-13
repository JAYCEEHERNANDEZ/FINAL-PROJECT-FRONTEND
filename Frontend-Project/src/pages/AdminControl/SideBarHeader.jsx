import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaFolderOpen,
  FaUserCog,
  FaUsers,
  FaBell,
  FaUserCircle,
} from "react-icons/fa";
import {
  fetchAdminNotifications,
  markAdminNotificationRead,
  resetAdminReaderPassword,
} from "../../api/api.js";

const SideBarHeader = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const notifRef = useRef();
  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard", path: "/admin-dashboard", icon: <FaTachometerAlt /> },
    { label: "User Payments", path: "/manage-records", icon: <FaFolderOpen /> },
    { label: "Notifications Center", path: "/notification-center", icon: <FaBell /> },
    { label: "Profiles", path: "/admin-profiles", icon: <FaUserCog /> },
    { label: "Manage Customers", path: "/manage-customers", icon: <FaUsers /> },
  ];

  const routeTitles = {
    "/admin-dashboard": "Admin Dashboard",
    "/manage-records": "Manage Records",
    "/manage-customers": "Manage Customers",
    "/notification-center": "Notification Center",
    "/admin-profiles": "Profiles",
    "/admin-settings": "Settings",
  };

  const title = routeTitles[location.pathname] || "Dashboard";

  // Fetch admin notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await fetchAdminNotifications();
        setAdminNotifications(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching admin notifications:", err);
      }
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close notification dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    navigate("/");
  };

  const handleReadNotification = async (notifId) => {
    try {
      await markAdminNotificationRead(notifId);
      setAdminNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handlePasswordOption = () => {
    setShowPasswordModal(true);
    setShowLogoutModal(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setMessage({ type: "error", text: "All fields are required." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    try {
      const adminId = localStorage.getItem("user_id");
      await resetAdminReaderPassword(adminId, newPassword);
      setMessage({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to change password." });
    }
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

        {/* Footer with Logout / Change Password */}
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
            {sidebarOpen && <span className="text-sm font-medium">Logout / Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center bg-white text-blue-600 py-2 px-5 m-5 rounded-xl shadow mb-0 text-xl font-semibold">
          <span className="text-xl font-bold">{title}</span>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="bg-blue-500 hover:bg-blue-400 text-white p-2 rounded-full relative"
            >
              🔔
              {adminNotifications.filter((n) => Number(n.is_read) === 0).length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 text-xs text-white flex items-center justify-center">
                  {adminNotifications.filter((n) => Number(n.is_read) === 0).length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-gray-50 border border-gray-300 rounded shadow-lg z-50 overflow-y-auto max-h-[28rem]">
                {adminNotifications.length === 0 ? (
                  <p className="p-4 text-gray-600 text-center">No notifications</p>
                ) : (
                  adminNotifications.map((notif) => {
                    // Parse JSON messages
                    let messages = [];
                    try {
                      messages = JSON.parse(notif.message).messages || [];
                    } catch {
                      messages = [notif.message];
                    }

                    return (
                      <div
                        key={notif.id}
                        className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-blue-50 ${
                          Number(notif.is_read) === 0 ? "bg-blue-50" : ""
                        }`}
                        onClick={() => handleReadNotification(notif.id)}
                      >
                        <p className="font-semibold text-sm text-gray-800">{notif.title}</p>
                        {messages.map((msg, idx) => (
                          <p key={idx} className="text-xs text-gray-600">
                            {msg}
                          </p>
                        ))}
                        <small className="text-gray-500 text-xs">
                          {new Date(notif.created_at).toLocaleString()}
                        </small>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">{children}</main>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 bg-transparent">
          <div className="bg-white rounded-xl p-6 w-80 shadow-lg text-center">
            <p className="text-lg font-semibold mb-4">Select an option:</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
              <button
                onClick={handlePasswordOption}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Change Password
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

      {/* Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 bg-transparent">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Change Password</h2>

            {message.text && (
              <p
                className={`mb-2 p-2 rounded ${
                  message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {message.text}
              </p>
            )}

            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleChangePassword}
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideBarHeader;
