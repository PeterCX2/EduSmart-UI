import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://edusmart.test/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// inject token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export type School = {
  id?: number;
  name: string;
};

export const schoolService = {
  // ========================
  // GET ALL
  // ========================
  async getAll(): Promise<School[]> {
    const res = await api.get("/school");
    return res.data.data ?? res.data;
  },

  // ========================
  // GET BY ID (EDIT FORM)
  // ========================
  async getById(id: number | string): Promise<School> {
    const res = await api.get(`/school/show/${id}`);
    return res.data.data ?? res.data;
  },

  // ========================
  // CREATE
  // ========================
  async create(payload: School) {
    const res = await api.post("/school/store", payload);
    return res.data;
  },

  // ========================
  // UPDATE
  // ========================
  async update(id: number | string, payload: School) {
    const res = await api.put(`/school/update/${id}`, payload);
    return res.data;
  },

  // ========================
  // DELETE
  // ========================
  async delete(id: number | string) {
    const res = await api.delete(`/school/delete/${id}`);
    return res.data;
  },
};
