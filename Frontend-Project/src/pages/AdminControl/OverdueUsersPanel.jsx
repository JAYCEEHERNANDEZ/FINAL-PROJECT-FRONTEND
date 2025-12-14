import React, { useEffect, useState } from "react";
import { fetchOverdueUsers, sendDeactNotice } from "../../api/api.js";

const OverdueUsersPanel = () => {
  const [overdueUsers, setOverdueUsers] = useState([]);
  const [sendingNotice, setSendingNotice] = useState(false);

  // Load overdue users on mount
  useEffect(() => {
    loadOverdueUsers();
  }, []);

  const loadOverdueUsers = async () => {
    try {
      const res = await fetchOverdueUsers();
      if (res.data.success) {
        // Map backend notice_sent to frontend noticeSent
        const usersWithNoticeFlag = res.data.users.map(u => ({
          ...u,
          noticeSent: u.notice_sent || false,
        }));
        setOverdueUsers(usersWithNoticeFlag);
      }
    } catch (err) {
      console.error("Error loading overdue users:", err);
    }
  };

  // Send notice for a single user
  const handleSendOverdueNotice = async (userIndex) => {
    const user = overdueUsers[userIndex];
    if (user.noticeSent) return; // prevent sending again

    setSendingNotice(true);
    try {
      const res = await sendDeactNotice({
        user_id: user.user_id,
        billing_date: user.billing_date,
      });

      if (res.data.success) {
        const updated = [...overdueUsers];
        updated[userIndex].noticeSent = true;
        setOverdueUsers(updated);
      }
    } catch (err) {
      console.error("Error sending notice:", err);
    } finally {
      setSendingNotice(false);
    }
  };

  // Send notice for all users
  const handleSendNoticeAll = async () => {
    setSendingNotice(true);
    try {
      const updated = [...overdueUsers];

      for (let i = 0; i < overdueUsers.length; i++) {
        if (!updated[i].noticeSent) {
          const res = await sendDeactNotice({
            user_id: updated[i].user_id,
            billing_date: updated[i].billing_date,
          });

          if (res.data.success) {
            updated[i].noticeSent = true;
          }
        }
      }

      setOverdueUsers(updated);
    } catch (err) {
      console.error("Error sending all notices:", err);
    } finally {
      setSendingNotice(false);
    }
  };

  return (
    <div className="w-full lg:w-80 flex-shrink-0 top-20 h-[calc(100vh-80px)] overflow-y-auto">
      <div className="bg-white p-4 rounded-xl shadow-md flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-red-700">Overdue Users</h3>
          {overdueUsers.length > 0 && (
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              onClick={handleSendNoticeAll}
              disabled={sendingNotice}
            >
              {sendingNotice ? "Sending..." : "Send All"}
            </button>
          )}
        </div>

        {overdueUsers.length === 0 && (
          <p className="text-gray-500">No overdue users</p>
        )}

        {overdueUsers.map((u, index) => (
          <div
            key={`${u.user_id}-${u.billing_date}`}
            className="flex flex-col gap-1 p-3 bg-gray-50 rounded shadow hover:shadow-md"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold">{u.name}</span>
              <button
                className={`px-2 py-1 text-xs rounded ${
                  u.noticeSent
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
                onClick={() => handleSendOverdueNotice(index)}
                disabled={u.noticeSent || sendingNotice}
              >
                {u.noticeSent ? "Sent" : "Send"}
              </button>
            </div>
            <p className="text-sm text-gray-700">
              Billing Date:{" "}
              {u.billing_date
                ? new Date(u.billing_date).toLocaleDateString()
                : "-"}
            </p>
            <p className="text-sm text-gray-700">
              Due Date:{" "}
              {u.due_date
                ? new Date(u.due_date).toLocaleDateString()
                : "-"}
            </p>
            <p className="text-sm text-red-600 font-semibold">
              Remaining: ₱{u.remaining_balance || 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverdueUsersPanel;
