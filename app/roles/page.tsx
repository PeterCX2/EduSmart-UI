"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  Shield,
  Key,
  Calendar,
  Eye,
  FilePlus,
  Pencil,
  Trash,
} from "lucide-react";

// Type definitions
interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  created_at: string;
  permissions: Permission[];
}

export default function RolesPage() {
  const router = useRouter();

  // State management
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  // Fetch data
  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`http://edusmart.test/api/role`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Gagal mengambil data roles");

      const result = await response.json();
      
      if (result.status === "success" && Array.isArray(result.data[0])) {
        setRoles(result.data[0]);
        setFilteredRoles(result.data[0]);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat data roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRoles(roles);
    } else {
      const filtered = roles.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.permissions.some(permission =>
          permission.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredRoles(filtered);
    }
  }, [searchQuery, roles]);

  // Handle delete
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete role "${name}"?`)) return;

    try {
      setDeleteLoading(id);
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `http://edusmart.test/api/role/delete/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Gagal menghapus role");

      // Remove from local state
      setRoles(prev => prev.filter(role => role.id !== id));
    } catch (err: any) {
      alert(err.message || "Gagal menghapus role");
      fetchRoles(); // Refresh data on error
    } finally {
      setDeleteLoading(null);
    }
  };

  // Format permissions
  const formatPermissions = (permissions: Permission[]) => {
    const grouped: Record<string, string[]> = {};
    const order = ["view", "create", "edit", "delete"];

    permissions.forEach(permission => {
      const [action, ...resourceParts] = permission.name.split(" ");
      const resource = resourceParts.join(" ");

      if (resource) {
        if (!grouped[resource]) {
          grouped[resource] = [];
        }
        if (!grouped[resource].includes(action)) {
          grouped[resource].push(action);
        }
      }
    });

    return Object.entries(grouped).map(([resource, actions]) => {
      const sortedActions = actions.sort((a, b) => 
        order.indexOf(a) - order.indexOf(b)
      );
      return { resource, actions: sortedActions };
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Loading roles data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Main Container */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Roles List</h1>
            <p className="text-gray-600">Manage user roles and permissions</p>
          </div>
          <button
            onClick={() => router.push("/roles/new")}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Add New Role
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role name or permission..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            />
          </div>
        </div>

        {/* Stats Card */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {roles.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Key size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Permissions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {roles.reduce((total, role) => total + role.permissions.length, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-lg font-bold text-gray-900">
                  {roles.length > 0 
                    ? formatDate(roles[0].created_at)
                    : "No data"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {filteredRoles.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border text-center">
            <Shield size={32} className="mx-auto text-gray-400 mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">
              {searchQuery ? "No roles found" : "No roles available"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? "Try different search keywords"
                : "Create your first role to get started"}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={() => router.push("/admin/roles/create")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Role
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-gray-600 text-sm font-medium uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-left">Permissions</th>
                  <th className="px-6 py-3 text-left">Created At</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoles.map((role) => {
                  const formattedPermissions = formatPermissions(role.permissions);
                  
                  return (
                    <tr 
                      key={role.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Shield size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {role.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {role.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {formattedPermissions.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium text-gray-700">
                                {item.resource}
                              </span>
                              <span className="mx-2 text-gray-400">=</span>
                              <span className="text-gray-600">
                                {item.actions.join(", ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={14} />
                          {formatDate(role.created_at)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/roles/${role.id}/edit`)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Edit Role"
                          >
                            <Edit size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(role.id, role.name)}
                            disabled={deleteLoading === role.id}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                            title="Delete Role"
                          >
                            {deleteLoading === role.id ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination (if needed in future) */}
        {/* <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded">Previous</button>
            <button className="px-3 py-1 border bg-blue-600 text-white rounded">1</button>
            <button className="px-3 py-1 border rounded">Next</button>
          </div>
        </div> */}
      </div>
    </div>
  );
}