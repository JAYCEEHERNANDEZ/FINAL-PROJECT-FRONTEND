import React, { useEffect, useState } from "react";
import { fetchOverdueUsers, sendDeactNotice } from "../../api/api.js";

const OverdueUsersPanel = () => {
  const [overdueUsers, setOverdueUsers] = useState([]);
  const [sendingNotice, setSendingNotice] = useState(false);

  useEffect(() => {
    loadOverdueUsers();
  }, []);

  const loadOverdueUsers = async () => {
    try {
      const res = await fetchOverdueUsers();
      if (res.data.success) setOverdueUsers(res.data.users);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendOverdueNotice = async (user) => {
    setSendingNotice(true);
    try {
      await sendDeactNotice({ user_id: user.user_id, billing_date: user.billing_date });
      loadOverdueUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingNotice(false);
    }
  };

  const handleSendNoticeAll = async () => {
    setSendingNotice(true);
    try {
      for (const u of overdueUsers) {
        if (!u.notice_sent) {
          await sendDeactNotice({ user_id: u.user_id, billing_date: u.billing_date });
        }
      }
      loadOverdueUsers();
    } catch (err) {
      console.error(err);
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
        {overdueUsers.length === 0 && <p className="text-gray-500">No overdue users</p>}
        {overdueUsers.map((u) => (
          <div
            key={`${u.user_id}-${u.billing_date}`}
            className="flex flex-col gap-1 p-3 bg-gray-50 rounded shadow hover:shadow-md"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold">{u.name}</span>
              <button
                className={`px-2 py-1 text-xs rounded ${
                  u.notice_sent
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
                onClick={() => handleSendOverdueNotice(u)}
                disabled={u.notice_sent || sendingNotice}
              >
                {u.notice_sent ? "Sent" : "Send"}
              </button>
            </div>
            <p className="text-sm text-gray-700">
              Billing Date: {new Date(u.billing_date).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-700">
              Due Date: {new Date(u.due_date).toLocaleDateString()}
            </p>
            <p className="text-sm text-red-600 font-semibold">
              Remaining: ₱{u.remaining_balance}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverdueUsersPanel;
