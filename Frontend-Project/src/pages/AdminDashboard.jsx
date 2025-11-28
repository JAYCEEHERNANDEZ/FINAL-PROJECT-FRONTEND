  import React from "react";
  import { Link } from "react-router-dom";

  const Dashboard = () => {
    const navItems = [
      { label: "Dashboard", path: "/admin-dashboard" },
      { label: "Records", path: "/manage-records" },
      { label: "Notification", path: "/notification-center" },
      { label: "Profiles", path: "/admin-profiles" },
      { label: "Manage Customers", path: "/manage-customers" },
      { label: "Reports", path: "/reports" },
    ];

    return (
      <div className="flex bg-gradient-to-br from-gray-900 via-gray-950 to-black min-h-screen text-white">

        {/* Sidebar */}
        <aside className="w-64 backdrop-blur-xl bg-white/5 border-r border-blue-500/20 shadow-xl p-6">
          <h2 className="text-2xl font-bold text-blue-400 drop-shadow-lg mb-10 tracking-wide">
            Sucol Water System
          </h2>

          <nav className="flex flex-col gap-4 text-gray-300">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="hover:text-blue-400 hover:translate-x-1 transition-all"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-10">
          {/* Title Bar */}
          <div className="bg-blue-600/40 backdrop-blur-lg text-white text-xl font-semibold py-4 px-5 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-900/40">
            Water Management Dashboard
          </div>

          {/* CLIENT DETAILS */}
          <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 shadow-lg p-6 mt-8 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 text-blue-300">
              Sucol water system – Client Company
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <p><strong className="text-blue-300">Client Name:</strong> MCD Delhi</p>
              <p><strong className="text-blue-300">Location:</strong> Sucol Balayan Batangas</p>

              <p><strong className="text-blue-300">Date of Commissioning:</strong> 21-SEP-2021</p>

              <p><strong className="text-blue-300">Elec Officer Incharge:</strong> Mr. Siddharth Malhotra</p>
              <p><strong className="text-blue-300">Client Office Incharge:</strong> Mr. Harshvardhan Rane</p>
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {[
              { num: "42 Litre", label: "Daily Water Treated", color: "pink" },
              { num: "45 Litre", label: "MTD Water Treated", color: "blue" },
              { num: "42 Litre", label: "YTD Water Treated", color: "purple" },
              { num: "50 Litre", label: "Total Water Treated", color: "yellow" }
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg hover:shadow-blue-800/40 transition-all"
              >
                <p className={`text-${item.color}-400 text-3xl font-bold drop-shadow-md`}>
                  {item.num}
                </p>
                <p className="text-gray-300 mt-1 text-sm">{item.label}</p>
              </div>
            ))}
          </div>

          {/* ELECTRICITY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {[
              { num: "69 kWh", label: "Daily Electricity Consumed", color: "pink" },
              { num: "80 kWh", label: "MTD Electricity Consumed", color: "green" },
              { num: "90 kWh", label: "YTD Electricity Consumed", color: "purple" },
              { num: "100 kWh", label: "Total Electricity Consumed", color: "blue" }
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg hover:shadow-blue-800/40 transition-all"
              >
                <p className={`text-${item.color}-400 text-3xl font-bold drop-shadow-md`}>
                  {item.num}
                </p>
                <p className="text-gray-300 mt-1 text-sm">{item.label}</p>
              </div>
            ))}
          </div>

          {/* CLIENT MACHINE TABLE */}
          <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 shadow-lg p-6 rounded-xl mt-10">
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Client Machine</h3>

            <table className="w-full border-collapse text-gray-300">
              <thead>
                <tr className="bg-white/5 border-b border-gray-600">
                  {["Make", "Model", "Serial No.", "Status"].map((col) => (
                    <th key={col} className="p-3 text-left text-blue-300">{col}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr className="border-b border-gray-700/50 hover:bg-white/5 transition">
                  <td className="p-3">123</td>
                  <td className="p-3">SDRF</td>
                  <td className="p-3">1234FGH</td>
                  <td className="p-3 text-green-400 font-semibold">Active</td>
                </tr>

                <tr className="border-b border-gray-700/50 hover:bg-white/5 transition">
                  <td className="p-3">456</td>
                  <td className="p-3">QWER</td>
                  <td className="p-3">8689CHJ</td>
                  <td className="p-3 text-red-400 font-semibold">Inactive</td>
                </tr>
              </tbody>
            </table>
          </div>

        </main>
      </div>
    );
  };

  export default Dashboard;
