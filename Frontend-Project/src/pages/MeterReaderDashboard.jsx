import React from "react";

const MeterReaderDashboard = () => {
  return (
    <div className="flex bg-gradient-to-br from-gray-900 via-gray-950 to-black min-h-screen text-white">
      
      {/* Sidebar */}
      <aside className="w-72 backdrop-blur-xl bg-white/5 border-r border-blue-500/20 shadow-xl p-6 flex flex-col">
        <h2 className="text-2xl font-bold text-blue-400 mb-8">Meter Reader</h2>

        {/* Sidebar Inputs */}
        <div className="flex flex-col gap-4 mb-10">
          <div>
            <label className="text-gray-300 text-sm">Username</label>
            <input
              type="text"
              className="w-full mt-1 p-2 bg-gray-800 text-white rounded"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm">Search Customer</label>
            <input
              type="text"
              className="w-full mt-1 p-2 bg-gray-800 text-white rounded"
              placeholder="Search..."
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-4 text-gray-300">
          <a href="/dashboard" className="hover:text-blue-400">
            Dashboard
          </a>
          <a href="/record-consumption" className="hover:text-blue-400">
            Record Consumption
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <div className="bg-blue-600/40 text-white text-xl font-semibold py-4 px-5 rounded-xl border border-blue-500/30 mb-6">
          Record Consumption Dashboard
        </div>

        <div className="bg-white/10 border border-gray-700 p-10 rounded-xl text-center">
          <h2 className="text-lg text-gray-300">Page Content Goes Here</h2>
        </div>
      </main>
    </div>
  );
};

export default MeterReaderDashboard;
