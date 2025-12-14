import React, { useState, useEffect } from "react";
import {
  sendNotification,
  fetchAllNotifications,
} from "../../api/api.js";
import SideBarHeader from "./SideBarHeader.jsx";
import usePageTitle from "../usePageTitle";

const NotificationCenter = () => {
  usePageTitle("Notification Center");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data } = await fetchAllNotifications();
      if (data.success) setNotifications(data.notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setLoading(true);

    try {
      const { data } = await sendNotification({
        title,
        message,
        user_id: null,
      });

      if (data.success) {
        setToast("Notification sent successfully!");
        setTitle("");
        setMessage("");
        loadNotifications();
      } else {
        setToast(data.error || "Failed to send notification.");
      }
    } catch (error) {
      setToast("Server error.");
      console.error(error);
    }

    setLoading(false);
  };

  const closeToast = () => {
    setToast("");
  };

  return (
    <SideBarHeader>
      {/* Sticky Confirmation Message */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex gap-3 items-center">
          <span>{toast}</span>
          <button
            onClick={closeToast}
            className="text-white font-bold hover:text-gray-200"
          >
          </button>
        </div>
      )}

      {/* Send Notification */}
      <div className="bg-white p-6 rounded-xl shadow mb-6 hover:shadow-lg hover:shadow-blue-400">
        <h2 className="font-semibold text-blue-700 mb-3 text-lg">
          Send Notification
        </h2>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Notification title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-2 rounded shadow-inner w-full"
          />

          <textarea
            placeholder="Message to all customers..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="p-2 rounded shadow-inner w-full h-28 resize-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white p-2 rounded-lg
              hover:bg-green-700 disabled:opacity-50 w-full md:w-1/3"
          >
            {loading ? "Sending..." : "Send Notification"}
          </button>
        </form>
      </div>

      {/* Sent Notifications */}
      <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg hover:shadow-blue-400">
        <h3 className="font-semibold mb-4 text-blue-700 text-lg">
          Sent Notifications
        </h3>

        {notifications.length === 0 ? (
          <p className="text-gray-600">No notifications sent yet.</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className="bg-gray-100 p-3 rounded shadow-sm hover:bg-blue-50 transition"
              >
                <p className="font-semibold text-sm text-gray-900">{notif.title}</p>
                <p className="text-sm text-gray-700">{notif.message}</p>
                <small className="text-gray-500 text-xs">
                  Sent: {new Date(notif.created_at).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SideBarHeader>
  );
};

export default NotificationCenter;
