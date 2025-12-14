import React, { useState, useEffect } from "react";
import SideBarHeader from "./SideBarHeader.jsx";
import { FaTimes } from "react-icons/fa";
import {
  fetchAllUsersAdmin,
  fetchUserPayments,
  adminRecordPayment,
  fetchReceipt,
  sendNotificationPerUser,
} from "../../api/api.js";
import usePageTitle from "../usePageTitle";

const EPSILON = 0.01;

const ManageAllUnpaidRecords = () => {
  usePageTitle("All Unpaid Records");

  const [users, setUsers] = useState([]);
  const [recordsByUser, setRecordsByUser] = useState({});
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stickyMessage, setStickyMessage] = useState(null);
  const [adminPayments, setAdminPayments] = useState({});

  const showStickyMessage = (type, text) => setStickyMessage({ type, text });
  const dismissStickyMessage = () => setStickyMessage(null);

  // Fetch all users
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const res = await fetchAllUsersAdmin();
        setUsers(res.data.data || []);
      } catch (err) {
        console.error(err);
        showStickyMessage("error", "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Fetch unpaid payments for a user
  const loadUserRecords = async (userId) => {
    try {
      const res = await fetchUserPayments(userId);
      const allRecords = res.data.data || [];

      // Keep only records with remaining_balance > 0
      const unpaidRecords = allRecords
        .filter((r) => Number(r.remaining_balance) > 0)
        .sort((a, b) => new Date(a.billing_date) - new Date(b.billing_date)); // oldest first

      setRecordsByUser((prev) => ({ ...prev, [userId]: unpaidRecords }));
    } catch (err) {
      console.error(err);
      showStickyMessage("error", "Failed to load records for user.");
    }
  };

  // Load all records for all users
  useEffect(() => {
    const loadAllRecords = async () => {
      for (const user of users) {
        if (!recordsByUser[user.id]) {
          await loadUserRecords(user.id);
        }
      }
    };
    loadAllRecords();
  }, [users]);

  const expandUser = async (userId) => {
    if (!recordsByUser[userId]) await loadUserRecords(userId);
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  // Generate receipt and send notification
  const handleGenerateReceipt = async (userId, paymentId, amountPaid) => {
    try {
      const res = await fetchReceipt(paymentId);
      const receiptData = res.data;
      const today = new Date().toLocaleDateString();

      await sendNotificationPerUser({
        user_id: userId,
        title: `Official Receipt: ${receiptData.receipt_number}`,
        message: `Hello ${
          receiptData.name
        }, your payment of ₱${amountPaid.toFixed(2)} for ${new Date(
          receiptData.billing_date
        ).toLocaleDateString()} has been confirmed on ${today}. Receipt Number: ${
          receiptData.receipt_number
        }`,
        type: "receipt",
      });
    } catch (err) {
      console.error("handleGenerateReceipt:", err);
    }
  };

  const handleSubmitPayment = async (userId, paymentId) => {
    try {
      const records = recordsByUser[userId] || [];
      const record = records.find((r) => String(r.id) === String(paymentId));

      if (!record) {
        return showStickyMessage("error", "Payment record not found.");
      }

      const enteredRaw = adminPayments[paymentId];
      const entered = Number(enteredRaw);

      if (!enteredRaw || entered <= 0) {
        return showStickyMessage("error", "Enter a valid payment amount.");
      }

      const remaining = Number(record.remaining_balance || 0);

      // Enforce exact payment
      if (Math.abs(entered - remaining) > EPSILON) {
        return showStickyMessage(
          "error",
          `Payment must be exactly ₱${remaining.toFixed(
            2
          )}. Partial payments are not allowed.`
        );
      }

      // Record payment
      await adminRecordPayment(paymentId, remaining);

      // Generate receipt & notify user
      await handleGenerateReceipt(userId, paymentId, remaining);

      showStickyMessage("success", "Payment recorded and receipt sent.");

      // Refresh user records
      await loadUserRecords(userId);

      // Clear input
      setAdminPayments((prev) => {
        const copy = { ...prev };
        delete copy[paymentId];
        return copy;
      });
    } catch (err) {
      console.error(err);
      showStickyMessage("error", "Failed to record payment. Try again.");
    }
  };

  // Users who have unpaid records
  const filteredUsers = users.filter((u) => {
    const records = recordsByUser[u.id] || [];
    return records.length > 0;
  });

  return (
    <SideBarHeader>
      {stickyMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg font-semibold flex items-center gap-4 ${
            stickyMessage.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <span>{stickyMessage.text}</span>
          <button onClick={dismissStickyMessage} className="text-white ml-2">
            <FaTimes />
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading users...</p>
      ) : filteredUsers.length === 0 ? (
        <p>No unpaid records found.</p>
      ) : (
        filteredUsers.map((user) => {
          const records = recordsByUser[user.id] || [];
          return (
            <div
              key={user.id}
              className={`bg-white p-4 mb-2 rounded-lg shadow hover:shadow-lg transition ${
                expandedUserId === user.id ? "border-2 border-blue-400" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  className="text-lg font-semibold text-blue-600 hover:text-blue-500"
                  onClick={() => expandUser(user.id)}
                >
                  {user.name}
                </button>
              </div>

              {expandedUserId === user.id && (
                <div className="mt-4 grid grid-cols-1 gap-3">
                  {records.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-gray-50 rounded-lg shadow flex flex-col gap-2"
                    >
                      <p>
                        <strong>Billing Month:</strong>{" "}
                        {new Date(r.billing_date).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p>
                        <strong>Total Bill:</strong> ₱{r.total_bill}
                      </p>
                      <p>
                        <strong>Remaining Balance:</strong> ₱
                        {r.remaining_balance}
                      </p>

                      <div className="flex gap-2 mt-2">
                        <input
                          type="number"
                          step="0.01"
                          className="p-2 border rounded w-1/2 focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter payment amount"
                          onChange={(e) =>
                            setAdminPayments((prev) => ({
                              ...prev,
                              [r.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          className="bg-green-600 p-2 rounded hover:bg-green-700 text-white transition"
                          onClick={() => handleSubmitPayment(user.id, r.id)}
                        >
                          Record Payment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </SideBarHeader>
  );
};

export default ManageAllUnpaidRecords;
