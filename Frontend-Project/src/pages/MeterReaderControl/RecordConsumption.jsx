import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchConsumptions, addConsumption } from "../../api/api.js";
import MeterReaderLayout from "./MeterReaderLayout.jsx";
import usePageTitle from "../usePageTitle";

const RecordConsumption = () => {
  usePageTitle("Record Consumption");
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentReadingInput, setCurrentReadingInput] = useState("");
  const [calculatedBill, setCalculatedBill] = useState(0);
  const [message, setMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const navigate = useNavigate();

// Load data
  useEffect(() => {
    loadConsumptions();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filterStatus, customers]);

  const getLatestCustomers = (records) => {
    const map = new Map();
    records.forEach((r) => {
      if (
        !map.has(r.user_id) ||
        new Date(r.billing_date) > new Date(map.get(r.user_id).billing_date)
      ) {
        map.set(r.user_id, r);
      }
    });
    return Array.from(map.values());
  };

  const loadConsumptions = async () => {
    try {
      const res = await fetchConsumptions();
      const latestCustomers = getLatestCustomers(res.data.data || []);
      setCustomers(latestCustomers);
    } catch (err) {
      console.error("Failed to fetch consumptions:", err);
    }
  };

  // Customer Selection
  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCurrentReadingInput("");
    setCalculatedBill(0);
    setMessage("");
  };

// Bill Calculation
  const calculateBill = (cubicUsed) => {
    if (cubicUsed <= 5) return 270;
    return 270 + (cubicUsed - 5) * 17;
  };

  const handleInputChange = (e) => {
    const value = Number(e.target.value);
    setCurrentReadingInput(value);
    setCalculatedBill(calculateBill(value));
  };

 // Submit Reading
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const cubicUsed = Number(currentReadingInput);
    if (cubicUsed <= 0) {
      setMessage("Current reading must be greater than 0.");
      return;
    }

    const payload = {
      user_id: selectedCustomer.user_id,
      name: selectedCustomer.name,
      cubic_used: cubicUsed,
    };

    try {
      const res = await addConsumption(payload);
      const newRecord = res.data.data;

      setCustomers((prev) => [
        ...prev.filter((c) => c.user_id !== newRecord.user_id),
        newRecord,
      ]);

      setSelectedCustomer(newRecord);
      setMessage("New reading recorded successfully!");
      setCurrentReadingInput("");
      setCalculatedBill(0);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to record reading.";
      setMessage(errMsg);
    }

    setTimeout(() => setMessage(""), 5000);
  };

  // Utility Functions
  const canRecord = (customer) => {
    if (!customer?.billing_date) return true;
    const lastDate = new Date(customer.billing_date);
    const today = new Date();
    return !(lastDate.getMonth() === today.getMonth() && lastDate.getFullYear() === today.getFullYear());
  };

  const nextRecordDate = (customer) => {
    if (!customer?.billing_date) return null;
    const lastDate = new Date(customer.billing_date);
    const nextMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const applyFilter = () => {
    if (filterStatus === "not-recorded") {
      setFilteredCustomers(customers.filter((c) => canRecord(c)));
    } else if (filterStatus === "recorded") {
      setFilteredCustomers(customers.filter((c) => !canRecord(c)));
    } else {
      setFilteredCustomers(customers);
    }
  };

// Logout
  const handleLogout = () => {
    localStorage.removeItem("user_id");
    navigate("/");
  };

  const content = (
    <>
      {/* Total Customers and Filter */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4 items-center">
        <div className="text-xl font-semibold text-gray-800">
          Total Customers: {customers.length}
        </div>

        <div className="flex items-center gap-3">
          <label className="font-semibold text-gray-700">Filter:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 shadow rounded"
          >
            <option value="all">All</option>
            <option value="not-recorded">Not Recorded</option>
            <option value="recorded">Already Recorded</option>
          </select>
        </div>
      </div>

      {/* Customer List */}
      {!selectedCustomer && (
        <div className="bg-white/10 border border-gray-300 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">Customers</h3>
          <ul className="space-y-3">
            {filteredCustomers.map((c) => (
              <li
                key={c.id}
                className="p-4 bg-gray-200 rounded hover:bg-gray-200 cursor-pointer flex justify-between"
                onClick={() => selectCustomer(c)}
              >
                <span>{c.name}</span>
                <span
                  className={canRecord(c) ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}
                >
                  {canRecord(c) ? "Can Record" : "Recorded"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected Customer */}
      {selectedCustomer && (
        <div className="bg-white/10 border border-gray-300 p-6 rounded-xl relative">
          {message && (
            <div
              className={`absolute top-4 right-4 px-4 py-2 rounded ${
                message.includes("successfully") ? "bg-green-600" : "bg-red-600"
              } text-white`}
            >
              {message}
            </div>
          )}

          <button
            className="mb-6 text-blue-600 underline"
            onClick={() => setSelectedCustomer(null)}
          >
            ← Back to Customers
          </button>

          <div className="bg-gray-100 p-4 rounded-lg mb-6 border border-gray-300">
            <h3 className="text-xl font-semibold text-blue-600 mb-4">Customer Details</h3>
            <p><strong>Name:</strong> {selectedCustomer.name}</p>
            <p><strong>Previous Reading:</strong> {selectedCustomer.previous_reading}</p>
            <p><strong>Current Reading:</strong> {selectedCustomer.present_reading}</p>
            <p><strong>Cubic Used Last Month:</strong> {selectedCustomer.cubic_used_last_month} m³</p>
            <p><strong>Current Month Cubic Used:</strong> {selectedCustomer.cubic_used} m³</p>
            <p><strong>Total Bill:</strong> ₱ {selectedCustomer.total_bill}</p>
          </div>

          {canRecord(selectedCustomer) ? (
            <>
              <h3 className="text-lg font-semibold mb-4 text-blue-600">Enter Current Reading</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block mb-1">Current Reading (m³):</label>
                  <input
                    type="number"
                    value={currentReadingInput}
                    onChange={handleInputChange}
                    className="p-2 bg-gray-100 rounded w-full border border-gray-300"
                    required
                  />
                </div>

                {currentReadingInput > 0 && (
                  <div className="md:col-span-2 text-yellow-600 font-semibold">
                    Calculated Bill: ₱ {calculatedBill}
                  </div>
                )}

                <button
                  type="submit"
                  className="md:col-span-2 p-2 rounded text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Reading
                </button>
              </form>
            </>
          ) : (
            <div className="text-red-600 font-semibold">
              Consumption for this month was already recorded on{" "}
              <strong>
                {new Date(selectedCustomer.billing_date).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </strong>.
              <br />
              You can record again on <strong>{nextRecordDate(selectedCustomer)}</strong>.
            </div>
          )}
        </div>
      )}
    </>
  );

  return <MeterReaderLayout>{content}</MeterReaderLayout>;
};

export default RecordConsumption;
