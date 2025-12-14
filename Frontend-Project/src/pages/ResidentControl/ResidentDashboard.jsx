import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import ResidentLayout from "./ResidentLayout.jsx";
import { fetchConsumptionsByUser } from "../../api/api.js";
import usePageTitle from "../usePageTitle";

const ResidentDashboard = () => {
  usePageTitle("Resident Dashboard");

  const [consumptions, setConsumptions] = useState([]);
  const [filteredConsumptions, setFilteredConsumptions] = useState([]);
  const [kpis, setKpis] = useState({
    avgConsumption: 0,
    avgBill: 0,
  });

  const [selectedYear, setSelectedYear] = useState("All Years");
  const [selectedMonth, setSelectedMonth] = useState("All Months");
  const [years, setYears] = useState([]);
  const months = [
    "All Months", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const userId = localStorage.getItem("user_id");

  // Load consumptions
  useEffect(() => {
    if (userId) loadConsumptions(userId);
  }, [userId]);

  const loadConsumptions = async (userId) => {
    try {
      const res = await fetchConsumptionsByUser(userId);
      const data = res.data?.data || [];

      const sortedData = data
        .map((c) => ({
          ...c,
          billing_date: new Date(c.billing_date),
          cubic_used: Number(c.cubic_used || 0),
          current_bill: Number(c.current_bill || 0),
        }))
        .sort((a, b) => a.billing_date - b.billing_date);

      setConsumptions(sortedData);

      // Populate years for filter
      const uniqueYears = Array.from(new Set(sortedData.map(c => c.billing_date.getFullYear()))).sort();
      setYears(["All Years", ...uniqueYears]);

      setFilteredConsumptions(sortedData);
      calculateKPIs(sortedData);
    } catch (err) {
      console.error("Failed to fetch consumptions:", err);
    }
  };

  // Filter consumptions when selectedYear or selectedMonth changes
  useEffect(() => {
    let data = [...consumptions];

    if (selectedYear !== "All Years") {
      data = data.filter(c => c.billing_date.getFullYear() === Number(selectedYear));
    }

    if (selectedMonth !== "All Months") {
      data = data.filter(
        c => c.billing_date.toLocaleString("en-US", { month: "long" }) === selectedMonth
      );
    }

    setFilteredConsumptions(data);
    calculateKPIs(data);
  }, [selectedYear, selectedMonth, consumptions]);

  const calculateKPIs = (data) => {
    const totalConsumption = data.reduce((acc, m) => acc + m.cubic_used, 0);
    const totalBill = data.reduce((acc, m) => acc + m.current_bill, 0);

    setKpis({
      avgConsumption: (totalConsumption / data.length || 0).toFixed(2),
      avgBill: (totalBill / data.length || 0).toFixed(2),
    });
  };

  // Determine current and previous month data
  const sortedFiltered = [...filteredConsumptions].sort((a, b) => b.billing_date - a.billing_date);
  const currentMonthData = sortedFiltered[0] || {};

  // Previous month from the full dataset (ignores filters)
  const previousMonthData =
    [...consumptions]
      .filter(c => c.billing_date < currentMonthData.billing_date)
      .sort((a, b) => b.billing_date - a.billing_date)[0] || {};

  return (
    <ResidentLayout>
      {/* FILTERS */}
      <div className="flex gap-4 mb-4">
        <div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 rounded shadow-inner text-sm"
          >
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="p-2 rounded shadow-inner text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CURRENT & PREVIOUS MONTH USAGE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-blue-600 font-bold lg:text-2xl md:text-2xl text-default">
            {currentMonthData?.cubic_used ?? 0} m³
          </p>
          <p className="text-gray-600 mt-1 text-sm">Current Month Usage</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-blue-400 lg:text-2xl md:text-2xl text-default font-bold">
            {previousMonthData?.cubic_used ?? 0} m³
          </p>
          <p className="text-gray-600 mt-1 text-sm">Previous Month Usage</p>
        </div>
        <div className="bg-white p-6 lg:text-2xl md:text-2xl text-default shadow-md">
          <p className="text-green-600 lg:text-2xl md:text-2xl text-default font-bold">
            ₱ {currentMonthData?.current_bill ?? 0}
          </p>
          <p className="text-gray-600 mt-1 text-sm">Current Bill</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mt-5">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-blue-600 lg:text-2xl md:text-2xl text-default font-bold">{kpis.avgConsumption} m³</p>
          <p className="text-gray-600 mt-1 text-sm">Average Consumption</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-green-600 lg:text-2xl md:text-2xl text-default font-bold">₱ {kpis.avgBill}</p>
          <p className="text-gray-600 mt-1 text-sm">Average Bill</p>
        </div>
      </div>

      {/* OVERALL CONSUMPTION & BILL TREND */}
      <div className="bg-white p-6 rounded-xl shadow-md mt-5">
        <h2 className="lg:text-xl md:text-xl text-default font-semibold text-black mb-4">Usage & Billing Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={filteredConsumptions.map((c) => ({
              date: c.billing_date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
              cubic_used: c.cubic_used,
              current_bill: c.current_bill,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value, name) =>
                name === "Current Bill" ? `₱${value}` : `${value} m³`
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="cubic_used"
              stroke="#1D4ED8"
              strokeWidth={3}
              name="Cubic Used"
            />
            <Line
              type="monotone"
              dataKey="current_bill"
              stroke="#DC2626"
              strokeWidth={3}
              name="Current Bill"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ResidentLayout>
  );
};

export default ResidentDashboard;
