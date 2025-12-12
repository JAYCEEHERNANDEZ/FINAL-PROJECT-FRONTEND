// ResidentPaymentDashboard.jsx
import React, { useState, useEffect } from "react";
import { FaHistory, FaTimes } from "react-icons/fa";
import QR from "../../Pictures/qr-code.png";
import {
  fetchUserPayments,
  uploadPaymentProof,
  fetchUserById,
  submitReferenceCodeAPI
} from "../../api/api.js";
import ResidentLayout from "./ResidentLayout.jsx";
import usePageTitle from "../usePageTitle";

const ResidentPaymentDashboard = () => {
  usePageTitle("Resident Payment Dashboard");

  const [userData, setUserData] = useState(null);
  const [enforcedUnpaid, setEnforcedUnpaid] = useState(null);
  const [currentMonthBill, setCurrentMonthBill] = useState(null);
  const [currentPaidSummary, setCurrentPaidSummary] = useState({ payment_total: 0, status: "Unpaid" });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [referenceCode, setReferenceCode] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [stickyMessage, setStickyMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const userId = Number(localStorage.getItem("user_id"));

  // --- Utilities ---
  const startOfMonth = (d) => {
    const dt = new Date(d.getFullYear(), d.getMonth(), 1);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const addMonths = (d, months) => {
    const dt = new Date(d.getFullYear(), d.getMonth() + months, 1);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Paid": return "bg-green-200 text-green-800";
      case "Partial": return "bg-yellow-200 text-yellow-800";
      case "Pending": return "bg-indigo-200 text-indigo-800";
      default: return "bg-red-200 text-red-800";
    }
  };

  // --- Loaders ---
  useEffect(() => {
    if (!userId) return;
    loadUserData();
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUserData = async () => {
    try {
      const res = await fetchUserById(userId);
      if (res?.data?.data) setUserData(res.data.data);
    } catch (err) {
      console.error("loadUserData:", err);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await fetchUserPayments(userId);
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      const sorted = list.sort((a, b) => new Date(a.billing_date) - new Date(b.billing_date));
      setPaymentHistory(sorted);

      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const prevMonthStart = addMonths(currentMonthStart, -1);
      const nextMonthStart = addMonths(currentMonthStart, 1);

      // --- Only consider previous + current month bills ---
      const validBills = sorted.filter(p => {
        const billDate = new Date(p.billing_date);
        billDate.setHours(0, 0, 0, 0);
        return billDate >= prevMonthStart && billDate < nextMonthStart;
      });

      // --- Enforce unpaid bills from previous month ONLY ---
      const prevMonthUnpaid = validBills.filter(p => {
        const d = new Date(p.billing_date);
        return d.getMonth() === prevMonthStart.getMonth() &&
               d.getFullYear() === prevMonthStart.getFullYear() &&
               Number(p.remaining_balance) > 0;
      });

      const oldestPrevMonthUnpaid = prevMonthUnpaid.length > 0 ? prevMonthUnpaid[0] : null;
      setEnforcedUnpaid(oldestPrevMonthUnpaid);

      // Current month bill
      const currentMonthBillDetected = validBills.find(p => {
        const d = new Date(p.billing_date);
        return d.getMonth() === currentMonthStart.getMonth() && d.getFullYear() === currentMonthStart.getFullYear();
      }) || null;

      setCurrentMonthBill(oldestPrevMonthUnpaid ? null : currentMonthBillDetected);

      // --- Current month summary ---
      const currentMonthBills = validBills.filter(p => {
        const d = new Date(p.billing_date);
        return d.getMonth() === currentMonthStart.getMonth() && d.getFullYear() === currentMonthStart.getFullYear();
      });

      const totalPaid = currentMonthBills.reduce((acc, p) => acc + parseFloat(p.payment_total || 0), 0);
      const totalBill = currentMonthBills.reduce((acc, p) => acc + parseFloat(p.total_bill || 0), 0);

      let status = "Unpaid";
      if (totalPaid > 0 && totalPaid < totalBill) status = "Partial";
      else if (totalPaid >= totalBill && totalBill > 0) status = "Paid";
      if (oldestPrevMonthUnpaid) status = "Blocked - Previous Month Unpaid";

      setCurrentPaidSummary({ payment_total: totalPaid, status });
      resetForm();
    } catch (err) {
      console.error("loadPayments:", err);
    }
  };

  // --- Form helpers ---
  const resetForm = () => {
    setReferenceCode("");
    setProofImage(null);
  };

  const handleImageUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setProofImage(null);
      return;
    }
    setProofImage(e.target.files[0]);
  };

  const showStickyMessage = (type, text) => {
    setStickyMessage({ type, text });
    setTimeout(() => setStickyMessage(null), 5000);
  };

  const dismissStickyMessage = () => setStickyMessage(null);

  const billToPay = () => {
    // If previous month unpaid exists, pay that first
    if (enforcedUnpaid) return enforcedUnpaid;

    // Otherwise, allow current month bill
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthBill = paymentHistory.find(p => {
      const d = new Date(p.billing_date);
      return d.getMonth() === currentMonthStart.getMonth() &&
             d.getFullYear() === currentMonthStart.getFullYear() &&
             Number(p.remaining_balance) > 0;
    });

    return currentMonthBill || null;
  };

  const handleSubmitProof = async () => {
    const selectedBill = billToPay();
    if (!selectedBill) {
      showStickyMessage("error", "No unpaid bill detected to submit proof for.");
      return;
    }

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const twoMonthsAgoStart = addMonths(currentMonthStart, -2);
    const billDate = new Date(selectedBill.billing_date);
    billDate.setHours(0, 0, 0, 0);
    if (!(billDate >= twoMonthsAgoStart && billDate < addMonths(currentMonthStart, 1))) {
      showStickyMessage("error", "This bill is outside the allowed payment window.");
      return;
    }

    if (!referenceCode.trim()) {
      showStickyMessage("error", "Enter GCash reference code!");
      return;
    }
    if (!proofImage) {
      showStickyMessage("error", "Upload proof image!");
      return;
    }

    const amountToPay = parseFloat(selectedBill.remaining_balance || 0) - parseFloat(selectedBill.pending_amount || 0);
    if (amountToPay <= 0) {
      showStickyMessage("error", "This bill is already fully paid or pending verification.");
      return;
    }

    setSubmitting(true);

    try {
      await submitReferenceCodeAPI({
        user_id: userId,
        bill_id: selectedBill.id,
        reference_code: referenceCode.trim()
      });

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("bill_id", selectedBill.id);
      formData.append("amount", amountToPay);
      formData.append("payment_type", selectedBill.payment_1 > 0 ? "second" : "full");
      formData.append("proof", proofImage);

      await uploadPaymentProof(formData);

      showStickyMessage("success", "Payment submitted successfully! Waiting for admin verification.");
      resetForm();
      await loadPayments();
    } catch (err) {
      console.error("handleSubmitProof:", err);
      showStickyMessage("error", "Submission failed. Try again!");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBill = billToPay();
  const isEnforced = Boolean(enforcedUnpaid);

  return (
    <ResidentLayout>
      {/* Sticky message */}
      {stickyMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg font-semibold ${
            stickyMessage.type === "success" ? "bg-green-600 text-white" : "bg-red-500 text-white"
          } flex items-center justify-between gap-4`}
        >
          <span>{stickyMessage.text}</span>
          <button onClick={dismissStickyMessage} className="text-white hover:text-gray-200">
            <FaTimes />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Enforced/Latest Unpaid Card */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col gap-2 justify-between">
              <div className="flex items-center justify-between">
                <p className="text-blue-600 text-2xl font-bold">
                  ₱{" "}
                  {selectedBill
                    ? ((parseFloat(selectedBill.remaining_balance || 0) - parseFloat(selectedBill.pending_amount || 0)) || 0).toLocaleString()
                    : 0}
                </p>
                {selectedBill && (
                  <span className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusClass(selectedBill.status)}`}>
                    {selectedBill.status}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                {isEnforced
                  ? "You have unpaid bills from the previous month. Pay the oldest first before newer bills."
                  : "Latest Unpaid / Current Month Balance"}
              </p>
              {selectedBill && (
                <span className="text-xs text-gray-500">
                  {new Date(selectedBill.billing_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })} — Due:{" "}
                  {new Date(selectedBill.due_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Current Month Paid summary */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col gap-2 justify-between">
              <p className="text-green-600 text-2xl font-bold">₱ {currentPaidSummary.payment_total.toLocaleString()}</p>
              <p className="text-gray-600 mt-1">Current Month Paid</p>
              <span className="text-xs text-gray-500">Status: {currentPaidSummary.status}</span>
            </div>
          </div>

          {/* Payment Form */}
          {selectedBill ? (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="font-semibold mb-3">Submit GCash Payment</h3>

              {isEnforced && (
                <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-red-700">
                  You have unpaid bills from the previous month. Pay the oldest first before newer bills.
                  <div className="text-xs mt-1">Billing month: {new Date(enforcedUnpaid.billing_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
                </div>
              )}

              {selectedBill.payment_1 > 0 && (
                <p className="mb-3 text-red-600 font-semibold">
                  Note: Next payment must be exactly ₱{selectedBill.remaining_balance}.
                </p>
              )}

              {selectedBill.pending_amount > 0 && (
                <p className="mb-3 text-indigo-700 font-medium">Pending verification: ₱{selectedBill.pending_amount}</p>
              )}

              <input
                type="text"
                placeholder="Enter GCash reference code"
                className="w-full p-2 border rounded mb-3"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                disabled={submitting}
              />

              <input
                type="file"
                accept="image/*"
                className="w-full border p-2 rounded mb-3"
                onChange={handleImageUpload}
                disabled={submitting}
              />

              <button
                onClick={handleSubmitProof}
                className={`w-full ${submitting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"} text-white p-2 rounded`}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Payment"}
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <p className="text-gray-700">No unpaid bills found in the previous + current month.</p>
            </div>
          )}

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 mb-3"
              >
                <FaHistory /> {showHistory ? "Hide Payment History" : "Show Payment History"}
              </button>
              {showHistory && (
                <div className="max-h-96 overflow-y-auto flex flex-col gap-2">
                  {paymentHistory.map((p) => (
                    <div key={p.id} className={`p-3 rounded ${getStatusClass(p.status)}`}>
                      {new Date(p.billing_date).toLocaleDateString("en-US", { year: "numeric", month: "long" })} — ₱{p.current_bill} ({p.status})
                      {p.pending_amount > 0 && <span className="text-xs text-gray-500"> — Pending: ₱{p.pending_amount}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* QR Column */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-start">
          <p className="mb-3 text-sm">Scan QR to Pay via GCash</p>
          <img src={QR} alt="GCash QR" className="w-auto h-auto object-contain" />
        </div>
      </div>
    </ResidentLayout>
  );
};

export default ResidentPaymentDashboard;
