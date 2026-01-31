const API_URL = "http://edusmart.test/api";

export const roleService = {
  getAll: async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/role`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) throw new Error("Failed to fetch roles");
    return response.json();
  },

  getById: async (id: number) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/role/show/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) throw new Error("Failed to fetch role");
    return response.json();
  },

  create: async (data: { name: string; permissions: number[] }) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/role/store`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error("Failed to create role");
    return response.json();
  },

  update: async (id: number, data: { name: string; permissions: number[] }) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/role/update/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error("Failed to update role");
    return response.json();
  },

  delete: async (id: number) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/role/delete/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) throw new Error("Failed to delete role");
    return response.json();
  },
};