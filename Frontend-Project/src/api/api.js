import axios from "axios";

// Residents
export const userAPI = axios.create({
  baseURL: "http://localhost:5000/user",
  headers: { "Content-Type": "application/json" },
});

export const loginUser = (data) => userAPI.post("/login", data); // ✓
export const registerUser = (data) => userAPI.post("/register", data); // ✓
export const fetchUsers = () => userAPI.get("/all"); // ✓
export const fetchUserById = (id) => userAPI.get(`/${id}`);
export const resetUserPassword = (id, newPassword) => userAPI.post(`/reset-password/${id}`, { newPassword }); // ✓

//export const deleteUser = (id) => userAPI.delete(/delete/${id});

// Activate / Deactivate User
export const deactivateUser = (id) => userAPI.put(`/deactivate/${id}`); // ✓
export const reactivateUser = (id) => userAPI.put(`/reactivate/${id}`); // ✓

// Admin and Meter Reader
export const adminReaderAPI = axios.create({
  baseURL: "http://localhost:5000/adminreader",
  headers: { "Content-Type": "application/json" },
});

export const loginadminReader = (data) => adminReaderAPI.post("/loginadminreader", data); // ✓
export const resetAdminReaderPassword = (id, newPassword) => adminReaderAPI.post(`/admin-reset-password/${id}`, { newPassword }); // ✓
