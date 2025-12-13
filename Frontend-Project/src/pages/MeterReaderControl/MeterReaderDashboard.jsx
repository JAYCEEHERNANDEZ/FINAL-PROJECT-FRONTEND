import React, { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import SideBarHeader from "./MeterReaderLayout.jsx";
import { fetchConsumptions, fetchUsers } from "../../api/api.js";
import usePageTitle from "../usePageTitle";

const MeterReaderDashboard = () => {
  usePageTitle("Meter Reader Dashboard");
  const [consumptions, setConsumptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

// Load data
  useEffect(() => {
    loadConsumptions();
    loadUsers();
  }, []);

  const loadConsumptions = async () => {
    try {
      const res = await fetchConsumptions();
      setConsumptions(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching consumptions:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetchUsers();
      setUsers(res.data?.message || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Filters
  const years = Array.from(new Set([
    ...consumptions.map(c => new Date(c.billing_date || c.created_at).getFullYear()),
    ...users.map(u => new Date(u.created_at).getFullYear())
  ])).sort((a, b) => b - a);

  const filteredConsumptions = consumptions.filter(c => {
    const date = new Date(c.billing_date || c.created_at);
    return (!filterYear || date.getFullYear() === Number(filterYear)) &&
           (!filterMonth || date.getMonth() + 1 === Number(filterMonth));
  });

  const filteredUsers = users.filter(u => {
    const created = new Date(u.created_at);
    return (!filterYear || created.getFullYear() === Number(filterYear)) &&
           (!filterMonth || created.getMonth() + 1 === Number(filterMonth));
  });

  // KPI Calculations
  const totalBill = filteredConsumptions.reduce((sum, c) => sum + Number(c.total_bill || 0), 0);
  const totalBalance = filteredConsumptions.reduce((sum, c) => sum + Number(c.remaining_balance || 0), 0);
  const totalIncome = filteredConsumptions.reduce((sum, c) => sum + Number(c.payment_total || 0), 0);
  const totalCubicUsed = filteredConsumptions.reduce((sum, c) => sum + Number(c.cubic_used || 0), 0);
  const totalUsersFiltered = filteredUsers.length;

  // Chart Data
  const chartDataMap = {};
  filteredConsumptions.forEach(c => {
    if (!c.billing_date) return;
    const date = new Date(c.billing_date);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    const key = `${monthName} ${year}`;
    if (!chartDataMap[key]) chartDataMap[key] = { month: key, cubic_used: 0, income: 0 };
    chartDataMap[key].cubic_used += Number(c.cubic_used || 0);
    chartDataMap[key].income += Number(c.payment_1 || 0) + Number(c.payment_2 || 0);
  });

  const chartData = Object.values(chartDataMap).sort((a, b) => {
    const [aMonth, aYear] = a.month.split(" ");
    const [bMonth, bYear] = b.month.split(" ");
    return new Date(`${aMonth} 1, ${aYear}`) - new Date(`${bMonth} 1, ${bYear}`);
  });

  const filterLabel = `${filterMonth ? new Date(0, filterMonth - 1).toLocaleString("default", { month: "short" }) : "All Months"} / ${filterYear || "All Years"}`;

  return (
    <SideBarHeader>
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="p-2 rounded shadow-inner">
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="p-2 rounded shadow-inner">
          <option value="">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-6 mt-2">
        {[
          { label: "Total Users", value: totalUsersFiltered, color: "text-blue-600" },
          { label: "Overall Bill", value: `₱ ${totalBill.toLocaleString()}`, color: "text-green-600" },
          { label: "Balance of All Consumers", value: `₱ ${totalBalance.toLocaleString()}`, color: "text-red-600" },
          { label: "Total Income", value: `₱ ${totalIncome.toLocaleString()}`, color: "text-yellow-600" },
          { label: "Cubic Meters Used", value: totalCubicUsed, color: "text-purple-600" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-black/5 p-6 rounded-xl shadow-md flex flex-col justify-between">
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-gray-600 mt-1 text-sm">{kpi.label}</p>
            {(filterMonth || filterYear) && <span className="text-gray-400 text-xs mt-1">{filterLabel}</span>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className=" p-6 rounded-xl shadow-md bg-black/5">
          <h2 className="text-lg font-semibold mb-4">Cubic Meters Used</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cubic_used" stroke="#8884d8" strokeWidth={3} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-xl shadow-md bg-black/5">
          <h2 className="text-lg font-semibold mb-4">Total Income (₱)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="income" stroke="#82ca9d" strokeWidth={3} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SideBarHeader>
  );
};

export default MeterReaderDashboard;
