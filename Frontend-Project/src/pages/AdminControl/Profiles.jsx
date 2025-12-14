import React, { useEffect, useState } from "react";
import { fetchUsers, resetUserPassword } from "../../api/api.js";
import SideBarHeader from "./SideBarHeader.jsx";
import usePageTitle from "../usePageTitle";

const Profiles = () => {
  usePageTitle("User Profiles");
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetchUsers();
      setUsers(res.data.message ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const openResetModal = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowModal(true);
  };

  const handleChangePassword = async () => {
    if (!newPassword) return alert("Password cannot be empty");

    try {
      await resetUserPassword(selectedUser.id, newPassword);
      alert(
        `Password for ${selectedUser.username} has been changed successfully.`
      );
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to change password");
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active === 1).length;

  return (
    <SideBarHeader>
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-blue-600 text-3xl font-bold">{totalUsers}</p>
          <p className="text-gray-600 mt-1 text-sm">Total Users</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-green-600 text-3xl font-bold">{activeUsers}</p>
          <p className="text-gray-600 mt-1 text-sm">Active Users</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-blue-700">User List</h3>
        <table className="w-full border-collapse text-gray-800">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Added at</th>
              <th className="p-3 text-left">Change password</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-3 text-center text-gray-500">
                  No users found...
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-blue-50 transition"
                >
                  <td className="p-3">{user.name ?? "N/A"}</td>
                  <td className="p-3">{user.username ?? "N/A"}</td>
                  <td className="p-3">
                    <span
                      className={
                        user.is_active === 1
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {user.is_active === 1 ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => openResetModal(user)}
                      className="bg-yellow-500 hover:bg-yellow-400 text-white px-3 py-1 rounded"
                    >
                      Change Password
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reset Password Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <p className="mb-2">
              User: <strong>{selectedUser.username}</strong>
            </p>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </SideBarHeader>
  );
};

export default Profiles;
