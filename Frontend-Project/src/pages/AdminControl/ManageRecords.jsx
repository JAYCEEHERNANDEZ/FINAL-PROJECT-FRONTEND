import React, { useState, useEffect } from "react";
import SideBarHeader from "./SideBarHeader.jsx";
import { FaPaperPlane, FaTimes } from "react-icons/fa";
import {
  fetchAllUsersAdmin,
  fetchUserPaymentProofs,
  adminRecordPayment,
  sendNotificationPerUser,
  fetchReceipt,
  fetchAdminNotifications,
  markAdminNotificationRead,
} from "../../api/api.js";
import usePageTitle from "../usePageTitle";

const EPSILON = 0.01; // tolerance for float comparisons

const ManageRecords = () => {
  usePageTitle("User Payment Records");

  const [users, setUsers] = useState([]);
  const [recordsByUser, setRecordsByUser] = useState({});
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userFilter, setUserFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeUserId, setNoticeUserId] = useState(null);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [sendingNotice, setSendingNotice] = useState(false);
  const [stickyMessage, setStickyMessage] = useState(null);

  const [adminPayments, setAdminPayments] = useState({});

  // Helpers
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const getStatus = (record) => {
    if (!record) return "Unpaid";
    const remaining = Number(record.remaining_balance || 0);
    const total = Number(record.total_bill || 0);
    if (remaining === total) return "Unpaid";
    if (remaining > 0 && remaining < total) return "Partial";
    if (remaining === 0) return "Paid";
    return "Unknown";
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Unpaid":
        return "bg-red-200 text-red-800";
      case "Partial":
        return "bg-yellow-200 text-yellow-800";
      case "Paid":
        return "bg-green-200 text-green-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const showStickyMessage = (type, text) => setStickyMessage({ type, text });
  const dismissStickyMessage = () => setStickyMessage(null);

  // Fetch users
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const res = await fetchAllUsersAdmin();
        setUsers(res.data.data || []);
      } catch (err) {
        console.error("fetchAllUsersAdmin:", err);
        showStickyMessage("error", "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Fetch admin notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await fetchAdminNotifications();
        setNotifications(res.data.data || []);
      } catch (err) {
        console.error("fetchAdminNotifications:", err);
      }
    };
    loadNotifications();
  }, []);

  // Load records for one user (only current + previous month)
  const loadUserRecords = async (userId) => {
    try {
      const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
      const prevMonth = prevMonthDate.getMonth();
      const prevYear = prevMonthDate.getFullYear();

      const res = await fetchUserPaymentProofs(userId);
      const allRecords = res.data.data || [];

      const filtered = allRecords.filter((r) => {
        const d = new Date(r.billing_date);
        const m = d.getMonth();
        const y = d.getFullYear();
        return (m === currentMonth && y === currentYear) || (m === prevMonth && y === prevYear);
      });

      // Sort descending (latest first)
      const sorted = filtered.sort((a, b) => new Date(b.billing_date) - new Date(a.billing_date));

      setRecordsByUser((prev) => ({ ...prev, [userId]: sorted }));
    } catch (err) {
      console.error("loadUserRecords:", err);
    }
  };

  // Load records for all users (on users load)
  useEffect(() => {
    const loadAll = async () => {
      if (!users.length) return;
      for (const u of users) {
        if (!recordsByUser[u.id]) {
          await loadUserRecords(u.id);
        }
      }
    };
    loadAll();
  }, [users]);

  const expandUser = async (userId) => {
    if (!recordsByUser[userId]) {
      await loadUserRecords(userId);
    }
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const isAmountEqual = (a, b) => {
    const na = Number(a || 0);
    const nb = Number(b || 0);
    return Math.abs(na - nb) < EPSILON;
  };

  // Submit Payment with enforcement:
  // - If previous-month exists and remaining_balance > 0, admin must pay previous month full (exact match) before recording current month.
  const handleSubmitPayment = async (userId, paymentId) => {
  try {
    const records = recordsByUser[userId] || [];
    const latest = records[0] || null; // current month
    const prev = records[1] || null; // previous month if present

    const targetRecord = records.find((r) => String(r.id) === String(paymentId));
    if (!targetRecord) {
      showStickyMessage("error", "Record not found.");
      return;
    }

    const enteredValueRaw = adminPayments[paymentId];
    const enteredValue = enteredValueRaw === undefined || enteredValueRaw === "" ? null : Number(enteredValueRaw);

    const isCurrent = latest && String(targetRecord.id) === String(latest.id);
    const isPrev = prev && String(targetRecord.id) === String(prev.id);

    // === Previous month constraint ===
    if (isPrev && Number(targetRecord.remaining_balance || 0) > 0) {
      if (enteredValue === null) {
        showStickyMessage("error", "Enter payment amount.");
        return;
      }
      const required = Number(targetRecord.remaining_balance || 0);
      if (!isAmountEqual(enteredValue, required)) {
        showStickyMessage("error", `Previous month requires full payment of ₱${required.toFixed(2)}.`);
        return;
      }
    }

    // === Current month constraint ===
    if (isCurrent) {
      const prevRem = prev ? Number(prev.remaining_balance || 0) : 0;
      if (prevRem > 0) {
        showStickyMessage(
          "error",
          `Cannot record current month. Previous month (${new Date(prev.billing_date).toLocaleDateString(
            "en-US",
            { month: "long", year: "numeric" }
          )}) has unpaid balance ₱${prevRem}. Record that first.`
        );
        return;
      }

      if (targetRecord.payment_1 > 0 && enteredValue <= 0) {
        showStickyMessage("error", "Enter a valid amount for payment.");
        return;
      }

      // enforce payment_2 equals remaining_balance if payment_2
      if (enteredValueRaw && targetRecord.payment_1 > 0) {
        const remaining = Number(targetRecord.remaining_balance || 0);
        if (!isAmountEqual(enteredValue, remaining)) {
          showStickyMessage("error", `Payment 2 must equal remaining balance ₱${remaining.toFixed(2)}.`);
          return;
        }
      }
    }

    // Proceed to record payment
    await adminRecordPayment(paymentId, Number(enteredValue));
    showStickyMessage("success", "Payment recorded successfully.");

    // Refresh user records and notifications
    await loadUserRecords(userId);

    // Mark related notifications as read
    const relatedNotifications = notifications.filter(
      (n) => n.user_id === userId && !n.is_read && n.title.includes("Payment")
    );
    for (const notif of relatedNotifications) {
      try {
        await markAdminNotificationRead(notif.id);
      } catch (err) {
        console.error("markAdminNotificationRead:", err);
      }
    }
    setNotifications((prev) => prev.filter((n) => !(n.user_id === userId && n.title.includes("Payment"))));

    // Generate receipt
    // Generate receipt with payment type
    try {
      const enteredAmount = Number(adminPayments[paymentId]);
      const records = recordsByUser[userId] || [];
      const record = records.find(r => String(r.id) === String(paymentId));
      const paymentType = record.payment_1 === 0 ? "Payment 1" : "Payment 2"; // or some logic based on remaining_balance
      await handleGenerateReceipt(userId, paymentId, enteredAmount, paymentType);
    } catch (err) {
      console.error("handleGenerateReceipt error:", err);
    }


    setAdminPayments((prev) => {
      const copy = { ...prev };
      delete copy[paymentId];
      return copy;
    });
  } catch (err) {
    console.error("handleSubmitPayment error:", err);
    showStickyMessage("error", "Failed to record payment.");
  }
};


  const handleGenerateReceipt = async (userId, consumptionId, amountPaid, paymentType) => {
  try {
    const res = await fetchReceipt(consumptionId);
    const receiptData = res.data;
    const today = new Date().toLocaleDateString();

    await sendNotificationPerUser({
      user_id: userId,
      title: `Official Receipt: ${receiptData.receipt_number}`,
      message: `Hello ${receiptData.name}, your ${paymentType} of ₱${amountPaid.toFixed(2)} for ${new Date(
        receiptData.billing_date
      ).toLocaleDateString()} has been confirmed on ${today}. Receipt Number: ${receiptData.receipt_number}`,
      type: "receipt",
    });
  } catch (err) {
    console.error("handleGenerateReceipt:", err);
  }
};


  // Notice modal
  const openNoticeModal = (userId) => {
    setNoticeUserId(userId);
    setNoticeTitle("");
    setNoticeMessage("");
    setShowNoticeModal(true);
  };

  const handleSendPersonalNotice = async () => {
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      showStickyMessage("error", "Both title and message are required.");
      return;
    }
    setSendingNotice(true);
    try {
      await sendNotificationPerUser({
        user_id: noticeUserId,
        title: noticeTitle,
        message: noticeMessage,
        type: "personal",
      });
      setShowNoticeModal(false);
      showStickyMessage("success", "Notification sent successfully.");
    } catch (err) {
      console.error(err);
      showStickyMessage("error", "Failed to send notification.");
    } finally {
      setSendingNotice(false);
    }
  };

  // Filtering Users list
  const activeUsers = users.filter((u) => !u.is_deactivated);
  const filteredUsers = activeUsers.filter((user) => {
    const hasPendingPayment = notifications.some(
      (n) => n.user_id === user.id && !n.is_read && n.title.includes("Payment")
    );

    if (userFilter === "pending" && !hasPendingPayment) return false;
    if (userFilter === "approved" && hasPendingPayment) return false;

    if (paymentFilter !== "all") {
      const records = recordsByUser[user.id] || [];
      const record = records[0] || null; // latest
      const status = record ? getStatus(record).toLowerCase() : "unpaid";
      if (status !== paymentFilter.toLowerCase()) return false;
    }
    return true;
  });

  return (
    <SideBarHeader>
      {/* sticky */}
      {stickyMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg font-semibold flex items-center gap-4 ${
            stickyMessage.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          <span>{stickyMessage.text}</span>
          <button onClick={dismissStickyMessage} className="text-white ml-2">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex gap-2">
          {["all", "pending", "approved"].map((f) => (
            <button
              key={f}
              className={`px-3 py-1 rounded ${
                userFilter === f ? (f === "pending" ? "bg-yellow-400 text-white" : "bg-blue-600 text-white") : "bg-gray-200 text-gray-800"
              }`}
              onClick={() => setUserFilter(f)}
            >
              {f === "all" ? "All Users" : f === "pending" ? "Pending Approval" : "Approved"}
            </button>
          ))}
        </div>

        <select className="shadow rounded px-2 py-1" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Users */}
      {loading ? (
        <p>Loading users...</p>
      ) : filteredUsers.length === 0 ? (
        <p>No users found.</p>
      ) : (
        filteredUsers.map((user) => {
          const hasPendingPayment = notifications.some((n) => n.user_id === user.id && !n.is_read && n.title.includes("Payment"));
          const records = recordsByUser[user.id] || [];
          const latestRecord = records[0] || null;
          const prevRecord = records[1] || null;
          const paymentStatus = getStatus(latestRecord);
          const prevUnpaidExists = prevRecord && Number(prevRecord.remaining_balance || 0) > 0;

          return (
            <div
              key={user.id}
              className={`bg-white p-4 mb-2 rounded-lg shadow hover:shadow-lg transition ${
                expandedUserId === user.id ? "border-2 border-blue-400" : ""
              } ${hasPendingPayment ? "border-2 border-yellow-400" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="text-lg font-semibold text-blue-600 hover:text-blue-500" onClick={() => expandUser(user.id)}>
                    {user.name}
                  </button>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusClass(paymentStatus)}`}>{paymentStatus}</span>
                </div>

                <div className="flex gap-2 items-center">
                  {hasPendingPayment && <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-200 text-yellow-800">Pending Approval</span>}
                  <button onClick={() => openNoticeModal(user.id)} className="ml-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-1 rounded shadow hover:shadow-lg flex items-center gap-2">
                    <FaPaperPlane /> Send Notice
                  </button>
                </div>
              </div>

              {/* Expanded User Records */}
              {expandedUserId === user.id && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {/* Left side: Payment Details */}
                  <div className="col-span-2 flex flex-col gap-3 space-y-1.5">
                    {records.length > 0 ? (
                      // Filter out fully paid previous month records
                      records
                        .filter((r, index) => {
                          const status = getStatus(r);
                          const isPrev = index === 1; // previous month
                          // Skip previous month if fully paid
                          if (isPrev && status === "Paid") return false;
                          return true;
                        })
                        .map((r, index) => {
                          const status = getStatus(r);
                          const isCurrent = index === 0;
                          const isPrev = index === 1;
                          const disablePaymentDueToPrev = isCurrent && records[1] && getStatus(records[1]) !== "Paid";

                          const inputVal =
                            adminPayments[r.id] !== undefined
                              ? adminPayments[r.id]
                              : isPrev
                              ? String(Number(r.remaining_balance || 0).toFixed(2))
                              : "";

                          return (
                            <div key={r.id} className="p-4 bg-gray-50 rounded-lg flex flex-col gap-2 shadow relative hover:shadow-md transition">
                              <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(status)}`}>
                                {status}
                              </span>

                              <p><strong>Billing Month:</strong> {new Date(r.billing_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                              <p><strong>Previous Reading:</strong> {r.previous_reading ?? "N/A"}</p>
                              <p><strong>Current Reading:</strong> {r.present_reading ?? "N/A"}</p>
                              <p><strong>Consumption:</strong> {r.cubic_used ?? "0"} m³</p>
                              <p><strong>Total Bill:</strong> ₱{r.total_bill ?? "0"}</p>
                              <p><strong>Payment 1:</strong> ₱{r.payment_1 ?? "0"}</p>
                              <p><strong>Payment 2:</strong> ₱{r.payment_2 ?? "0"}</p>
                              <p><strong>Remaining Balance:</strong> ₱{r.remaining_balance ?? "0"}</p>
                              <p><strong>Reference Code:</strong> {r.reference_code || "N/A"}</p>

                              {status !== "Paid" && (
                                <div className="flex flex-col gap-2 mt-2">
                                  {isPrev && Number(r.remaining_balance || 0) > 0 && (
                                    <p className="text-sm text-blue-700">Previous month requires FULL payment.</p>
                                  )}
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="p-2 border rounded w-1/2 focus:ring-1 focus:ring-blue-500"
                                      placeholder="Enter payment amount"
                                      onChange={(e) => setAdminPayments((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                      disabled={disablePaymentDueToPrev}
                                      // value={inputVal}
                                    />
                                    <button
                                      className={`bg-green-600 p-2 rounded hover:bg-green-700 text-white transition ${disablePaymentDueToPrev ? "opacity-60 cursor-not-allowed" : ""}`}
                                      onClick={() => handleSubmitPayment(user.id, r.id)}
                                      disabled={disablePaymentDueToPrev}
                                    >
                                      Record Payment
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                    ) : (
                      <p>No payment records found (for current or previous month).</p>
                    )}
                  </div>

                  {/* Right side: Payment Proofs */}
                  <div className="col-span-1 p-3 bg-white rounded-lg shadow flex flex-col items-center overflow-auto">
                    <h2 className="text-lg font-semibold mb-2 text-center">Payment Proof</h2>
                    {records.length > 0 ? (
                      records
                        .filter((r, index) => {
                          // Show proof images even for fully paid previous month?
                          const isPrev = index === 1;
                          const status = getStatus(r);
                          if (isPrev && status === "Paid") return false;
                          return true;
                        })
                        .map((rec) => (
                          <div key={rec.id} className="mb-4 text-center w-full">
                            <p className="text-sm font-medium mb-1">
                              {new Date(rec.billing_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            </p>
                            {rec.proof_url ? (
                              <img src={`http://localhost:5000${rec.proof_url}`} alt={`Proof ${rec.id}`} className="w-56 h-56 rounded-lg shadow object-contain mx-auto" />
                            ) : (
                              <p className="text-gray-500 italic text-sm">No proof uploaded for this month.</p>
                            )}
                          </div>
                        ))
                    ) : (
                      <p className="text-gray-500 italic">No proofs available.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          );
        })
      )}

      {/* Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 bg-transparent">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-blue-700 border-b pb-2">Send Personal Notification</h2>

            <label className="block mb-2 text-sm font-medium text-gray-700">Title</label>
            <input type="text" placeholder="Enter notification title" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} className="w-full p-3 border rounded mb-4 focus:ring-2 focus:ring-blue-500" />

            <label className="block mb-2 text-sm font-medium text-gray-700">Message</label>
            <textarea placeholder="Enter notification message" value={noticeMessage} onChange={(e) => setNoticeMessage(e.target.value)} className="w-full p-3 border rounded mb-4 focus:ring-2 focus:ring-blue-500" />

            <div className="flex justify-end gap-2">
              <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition" onClick={() => setShowNoticeModal(false)}>
                Cancel
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition" onClick={handleSendPersonalNotice} disabled={sendingNotice}>
                {sendingNotice ? "Sending..." : "Send Notice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SideBarHeader>
  );
};

export default ManageRecords;
