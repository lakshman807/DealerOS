import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/"
)
  .trim()
  .replace(/\/+$/, "") + "/";

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const getReconciliation = async (orgId) => {
  const response = await API.get(`reconcile/${orgId}/`);
  return response.data;
};

export default API;