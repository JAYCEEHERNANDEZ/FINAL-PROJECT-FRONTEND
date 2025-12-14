import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip, 
  AreaChart,
  Area,
} from "recharts";
import SideBarHeader from "./SideBarHeader.jsx";
import { fetchConsumptions, fetchUsers } from "../../api/api.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import usePageTitle from "../usePageTitle";

const AdminDashboard = () => {
  usePageTitle("Admin Dashboard");

 //State
  const [consumptions, setConsumptions] = useState([]);
  const [users, setUsers] = useState([]);

  // Filters for KPI/cards & charts
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // Filters for PDF export (right side)
  const [pdfFilterMonth, setPdfFilterMonth] = useState("");
  const [pdfFilterYear, setPdfFilterYear] = useState("");

  // load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [consRes, userRes] = await Promise.all([
          fetchConsumptions(),
          fetchUsers(),
        ]);
        setConsumptions(consRes.data?.data || []);
        setUsers(userRes.data?.message || []);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };
    loadData();
  }, []);

  // filter
  const years = useMemo(() => {
    const allYears = [
      ...consumptions.map((c) =>
        new Date(c.billing_date || c.created_at).getFullYear()
      ),
      ...users.map((u) => new Date(u.created_at).getFullYear()),
    ];
    return [...new Set(allYears)].sort((a, b) => b - a);
  }, [consumptions, users]);

 // Kpi
  const filteredConsumptions = consumptions.filter((c) => {
    const date = new Date(c.billing_date || c.created_at);
    return (
      (!filterYear || date.getFullYear() === Number(filterYear)) &&
      (!filterMonth || date.getMonth() + 1 === Number(filterMonth))
    );
  });

  const filteredUsers = users.filter((u) => {
    const created = new Date(u.created_at);
    return (
      (!filterYear || created.getFullYear() === Number(filterYear)) &&
      (!filterMonth || created.getMonth() + 1 === Number(filterMonth))
    );
  });

  // Kpi calculation
  const totalBill = filteredConsumptions.reduce(
    (sum, c) => sum + Number(c.total_bill || 0),
    0
  );
  const totalBalance = filteredConsumptions.reduce(
    (sum, c) => sum + Number(c.remaining_balance || 0),
    0
  );
  const totalIncome = filteredConsumptions.reduce(
    (sum, c) => sum + Number(c.payment_total || 0),
    0
  );
  const totalCubicUsed = filteredConsumptions.reduce(
    (sum, c) => sum + Number(c.cubic_used || 0),
    0
  );
  const totalUsersFiltered = filteredUsers.length;

  // chart data
  const chartDataMap = {};
  filteredConsumptions.forEach((c) => {
    if (!c.billing_date) return;
    const date = new Date(c.billing_date);
    const key = `${date.toLocaleString("default", {
      month: "short",
    })} ${date.getFullYear()}`;
    if (!chartDataMap[key])
      chartDataMap[key] = { month: key, cubic_used: 0, income: 0 };
    chartDataMap[key].cubic_used += Number(c.cubic_used || 0);
    chartDataMap[key].income +=
      Number(c.payment_1 || 0) + Number(c.payment_2 || 0);
  });
  const chartData = Object.values(chartDataMap).sort((a, b) => {
    const [aMonth, aYear] = a.month.split(" ");
    const [bMonth, bYear] = b.month.split(" ");
    return (
      new Date(`${aMonth} 1, ${aYear}`) - new Date(`${bMonth} 1, ${bYear}`)
    );
  });

  // Pdf
  const filteredConsumptionsForPDF = consumptions.filter((c) => {
    const date = new Date(c.billing_date || c.created_at);
    return (
      (!pdfFilterYear || date.getFullYear() === Number(pdfFilterYear)) &&
      (!pdfFilterMonth || date.getMonth() + 1 === Number(pdfFilterMonth))
    );
  });

  const filteredUsersForPDF = users.filter((u) => {
    const created = new Date(u.created_at);
    return (
      (!pdfFilterYear || created.getFullYear() === Number(pdfFilterYear)) &&
      (!pdfFilterMonth || created.getMonth() + 1 === Number(pdfFilterMonth))
    );
  });

  // Pdf export
  const generatePDF = () => {
    let title = "Overall Records";
    let periodLabel = "All Records";

    if (pdfFilterYear && pdfFilterMonth) {
      // Monthly record
      const monthName = new Date(0, pdfFilterMonth - 1).toLocaleString(
        "default",
        { month: "long" }
      );
      title = `${monthName} ${pdfFilterYear} Record`;
      periodLabel = `${monthName} ${pdfFilterYear}`;
    } else if (pdfFilterYear) {
      // Yearly record
      title = `${pdfFilterYear} Records`;
      periodLabel = `Year ${pdfFilterYear}`;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(11);
    doc.text(`Period: ${periodLabel}`, 14, 25);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

    autoTable(doc, {
      startY: 45,
      head: [["Metric", "Value"]],
      body: [
        ["Total Users", filteredUsersForPDF.length],
        [
          "Overall Bill",
          ` ${filteredConsumptionsForPDF
            .reduce((sum, c) => sum + Number(c.total_bill || 0), 0)
            .toLocaleString()}`,
        ],
        [
          "Total Balance",
          ` ${filteredConsumptionsForPDF
            .reduce((sum, c) => sum + Number(c.remaining_balance || 0), 0)
            .toLocaleString()}`,
        ],
        [
          "Total Income",
          ` ${filteredConsumptionsForPDF
            .reduce((sum, c) => sum + Number(c.payment_total || 0), 0)
            .toLocaleString()}`,
        ],
        [
          "Cubic Meters Used",
          filteredConsumptionsForPDF.reduce(
            (sum, c) => sum + Number(c.cubic_used || 0),
            0
          ),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Save PDF with dynamic file name
    doc.save(`${title.replace(/ /g, "_")}.pdf`);
  };

  const filterLabel = `${
    filterMonth
      ? new Date(0, filterMonth - 1).toLocaleString("default", {
          month: "short",
        })
      : "All Months"
  } / ${filterYear || "All Years"}`;

  return (
    <SideBarHeader>
      <div className="flex justify-between mb-6">
        {/* Left filters: KPI & Charts */}
        <div className="flex gap-4">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="p-2 rounded shadow-inner"
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="p-2 rounded shadow-inner"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Right filters: PDF Export */}
        <div className="flex gap-2">
          <select
            value={pdfFilterMonth}
            onChange={(e) => setPdfFilterMonth(e.target.value)}
            className="p-2 rounded shadow-inner"
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={pdfFilterYear}
            onChange={(e) => setPdfFilterYear(e.target.value)}
            className="p-2 rounded shadow-inner"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={generatePDF}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-6 mt-2">
        {[
          {
            label: "Total Users",
            value: totalUsersFiltered,
            color: "text-blue-600",
          },
          {
            label: "Overall Bill",
            value: `₱ ${totalBill.toLocaleString()}`,
            color: "text-green-600",
          },
          {
            label: "Balance of All Consumers",
            value: `₱ ${totalBalance.toLocaleString()}`,
            color: "text-red-600",
          },
          {
            label: "Total Income",
            value: `₱ ${totalIncome.toLocaleString()}`,
            color: "text-yellow-600",
          },
          {
            label: "Cubic Meters Used",
            value: totalCubicUsed,
            color: "text-purple-600",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="bg-black/5 p-6 rounded-xl shadow-md flex flex-col justify-between"
          >
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-gray-600 mt-1 text-sm">{kpi.label}</p>
            {(filterMonth || filterYear) && (
              <span className="text-gray-400 text-xs mt-1">{filterLabel}</span>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Cubic Meters Used Chart */}
          <div className="p-6 rounded-xl shadow-md bg-black/5">
            <h2 className="text-lg font-semibold mb-4">Cubic Meters Used</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="cubic_used"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Total Income Chart */}
          <div className="p-6 rounded-xl shadow-md bg-black/5">
            <h2 className="text-lg font-semibold mb-4">Total Income (₱)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
    </SideBarHeader>
  );
};

export default AdminDashboard;
