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

// User consumption
export const consumptionAPI = axios.create({
  baseURL: "http://localhost:5000/consumption",
  headers: { "Content-Type": "application/json" },
});

export const fetchConsumptions = () => consumptionAPI.get("/all"); // ✓
export const fetchConsumptionsByUser = (userId) => consumptionAPI.get(`/user/${userId}`); // ✓
export const addConsumption = (data) => consumptionAPI.post("/add", data); // ✓

export const deleteConsumption = (id) => consumptionAPI.delete(`/delete/${id}`);

// Payment (Admin)
export const paymentAPI = axios.create({
  baseURL: "http://localhost:5000/payment",
  headers: { "Content-Type": "application/json" },
});

export const fetchUserPayments = (userId) => paymentAPI.get(`/user/${userId}`); // ✓
export const submitReferenceCodeAPI = ({ user_id, reference_code }) =>
  axios.post("http://localhost:5000/payment/submit-reference", { user_id, reference_code }); // ✓
export const uploadPaymentProof = (formData) => 
  axios.post("http://localhost:5000/payment/upload-proof", formData, {
    headers: { "Content-Type": "multipart/form-data" }, }); // ✓
export const fetchUserPaymentProofs = (userId) => paymentAPI.get(`/proofs/user/${userId}`); // ✓
export const adminRecordPayment = (paymentId, amount) => paymentAPI.post(`/record`, { payment_id: paymentId, amount }); // ✓
export const fetchAllUsersAdmin = () => paymentAPI.get("/all-users"); // ✓

// Notifications
export const notificationAPI = axios.create({
  baseURL: "http://localhost:5000/notifications",
  headers: { "Content-Type": "application/json" },
});

export const sendNotification = (data) => notificationAPI.post("/send", data); // ✓
export const fetchUserNotifications = (userId) => notificationAPI.get(`/user/${userId}`);
export const fetchAllNotifications = () => notificationAPI.get("/all"); // ✓
export const sendNotificationPerUser = (data) => notificationAPI.post("/send", data); // ✓
export const fetchUserNotificationsPerUser = (userId) => notificationAPI.get(`/user/${userId}`); // ✓
export const readNotificationPerUser = (notifId) => notificationAPI.put(`/read/${notifId}`); // ✓

export const markNotificationAsRead = (notifId) => notificationAPI.put(`/read/${notifId}`);
// export const notifyAdmin = (title, message) => notificationAPI.post("/send", { user_id: null, title, message });
// export const markAdminNotificationAsRead = (notifId) => notificationAPI.put(`/read/${notifId}`); 


export const adminNotificationAPI = axios.create({
  baseURL: "http://localhost:5000/notifications/admin",
  headers: { "Content-Type": "application/json" },
});

export const fetchAdminNotifications = () => adminNotificationAPI.get("/all"); // ✓
export const markAdminNotificationRead = (id) => adminNotificationAPI.put(`/read/${id}`); // ✓

// Deactivation notices
export const noticeAPI = axios.create({
  baseURL: "http://localhost:5000/deact-notice",
  headers: { "Content-Type": "application/json" },
});

export const fetchOverdueUsers = () => noticeAPI.get("/overdue"); // ✓
export const sendDeactNotice = (data) => noticeAPI.post("/send", data); // ✓
export const fetchUserNotices = (userId) => noticeAPI.get(`/user/${userId}`); // ✓
export const markNoticeAsRead = (id) => noticeAPI.put(`/read/${id}`); // ✓

// Receipts
export const receiptAPI = axios.create({
  baseURL: "http://localhost:5000/receipt",
  headers: { "Content-Type": "application/json" },
});

export const fetchReceipt = (consumptionId) => receiptAPI.get(`/${consumptionId}`); // ✓
