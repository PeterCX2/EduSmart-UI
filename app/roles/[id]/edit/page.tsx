"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Shield, Check, X, AlertCircle } from "lucide-react";

const API_URL = "http://edusmart.test/api";

interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  
  // Ambil semua permissions dari Laravel (sudah ada di response role)
  useEffect(() => {
    if (roleId) {
      fetchRoleAndPermissions();
    }
  }, [roleId]);

  const fetchRoleAndPermissions = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/role/show/${roleId}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
        }
      );

      // Cek response
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        
        throw new Error("Server returned non-JSON response");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch role");
      }

      const result = await response.json();
      
      if (result.status === "success") {
        const roleData = result.data;
        setRole(roleData);
        setName(roleData.name);
        
        // Set permissions dari role yang sudah include permissions
        const rolePermissions = roleData.permissions || [];
        const rolePermissionIds = rolePermissions.map((p: Permission) => p.id);
        setSelectedPermissions(rolePermissionIds);
        
        // Simpan semua permissions dari role
        setAllPermissions(rolePermissions);
        
        // Untuk kebutuhan UI, kita perlu mendapatkan SEMUA permissions yang ada di sistem
        // Tapi karena Laravel controller kita membutuhkan semua permissions untuk form,
        // kita perlu fetch endpoint /role untuk mendapatkan semua permissions
        fetchAllPermissions(token, rolePermissionIds);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load role data");
      setLoading(false);
    }
  };

  const fetchAllPermissions = async (token: string, selectedIds: number[]) => {
    try {
      const response = await fetch(`${API_URL}/role`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch all permissions");

      const result = await response.json();
      
      // Response dari Laravel: [roles, permissions]
      if (result.status === "success" && Array.isArray(result.data[1])) {
        setAllPermissions(result.data[1]);
      }
    } catch (err: any) {
      console.error("Failed to fetch all permissions:", err);
      // Tetap lanjut dengan permissions dari role saja
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by resource (seperti di Laravel)
  const groupPermissionsByResource = () => {
    const resources: Record<string, Permission[]> = {};
    
    allPermissions.forEach(permission => {
      const [action, ...resourceParts] = permission.name.split(" ");
      const resource = resourceParts.join(" ");
      
      if (!resources[resource]) {
        resources[resource] = [];
      }
      
      resources[resource].push(permission);
    });
    
    return resources;
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  const handleSelectAll = (resource: string, selectAll: boolean) => {
    const resources = groupPermissionsByResource();
    const resourcePermissions = resources[resource] || [];
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    
    if (selectAll) {
      // Tambahkan semua permissions dari resource ini
      const newSelected = [...selectedPermissions];
      resourcePermissionIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      setSelectedPermissions(newSelected);
    } else {
      // Hapus semua permissions dari resource ini
      setSelectedPermissions(prev => 
        prev.filter(id => !resourcePermissionIds.includes(id))
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Role name is required");
      return;
    }
    
    if (selectedPermissions.length === 0) {
      setError("Please select at least one permission");
      return;
    }
    
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      
      const response = await fetch(
        `${API_URL}/role/update/${roleId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            permissions: selectedPermissions
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to update role");
      }
      
      if (result.status !== "success") {
        throw new Error(result.message || "Failed to update role");
      }
      
      setSuccess("Role updated successfully!");
      
      // Redirect setelah 1.5 detik
      setTimeout(() => {
        router.push("/roles");
        router.refresh(); // Refresh data di halaman roles
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || "Failed to update role");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading role data...</p>
        </div>
      </div>
    );
  }

  // Error state - role not found
  if (!role && !loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/admin/roles")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={18} />
            Back to Roles
          </button>
          
          <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Role Not Found</h3>
            <p className="text-gray-600 mb-6">
              The role you're trying to edit doesn't exist or you don't have access.
            </p>
            <button
              onClick={() => router.push("/admin/roles")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Roles List
            </button>
          </div>
        </div>
      </div>
    );
  }

  const resources = groupPermissionsByResource();
  const actionOrder = ["view", "create", "edit", "delete"];

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/roles")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={18} />
            Back to Roles
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Role</h1>
              <p className="text-gray-600">Update permissions for {role?.name}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <X size={14} className="text-red-600" />
            </div>
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check size={14} className="text-green-600" />
            </div>
            <div>
              <p className="text-green-700 font-medium">Success</p>
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          {/* Role Info */}
          <div className="mb-8">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="text-blue-600" size={20} />
                <span className="font-medium text-blue-900">Role Information</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">ID:</span>
                  <span className="ml-2 font-medium">{role?.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Current Permissions:</span>
                  <span className="ml-2 font-medium">{role?.permissions.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Selected:</span>
                  <span className="ml-2 font-medium text-blue-600">
                    {selectedPermissions.length} permissions
                  </span>
                </div>
              </div>
            </div>

            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter role name"
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Permissions Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <label className="text-lg font-semibold text-gray-900">
                Permissions <span className="text-red-500">*</span>
              </label>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{selectedPermissions.length}</span> of{" "}
                <span className="font-medium">{allPermissions.length}</span> selected
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-6">
              <p>Select permissions for this role:</p>
            </div>

            {Object.keys(resources).length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-500">No permissions available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-xl">
                {Object.entries(resources).map(([resource, permissions]) => {
                  // Sort permissions berdasarkan action order
                  const sortedPermissions = permissions.sort((a, b) => {
                    const aAction = a.name.split(" ")[0];
                    const bAction = b.name.split(" ")[0];
                    return actionOrder.indexOf(aAction) - actionOrder.indexOf(bAction);
                  });
                  
                  const selectedCount = sortedPermissions.filter(p => 
                    selectedPermissions.includes(p.id)
                  ).length;
                  
                  return (
                    <div key={resource} className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold capitalize text-gray-900">
                            {resource.replace(/-/g, " ")}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {selectedCount} of {sortedPermissions.length} selected
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleSelectAll(resource, true)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectAll(resource, false)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            None
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {sortedPermissions.map((permission) => {
                          const action = permission.name.split(" ")[0];
                          const isChecked = selectedPermissions.includes(permission.id);
                          
                          return (
                            <label 
                              key={permission.id}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                isChecked 
                                  ? 'bg-blue-50 border border-blue-100' 
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700 capitalize">
                                {action}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {Object.keys(resources).length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Permissions Summary
                    </p>
                    <p className="text-sm text-blue-700">
                      Selected: <span className="font-bold">{selectedPermissions.length}</span> permissions across{" "}
                      <span className="font-bold">{Object.keys(resources).length}</span> resources
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200">
            <div className="flex-1">
              <button
                type="button"
                onClick={() => router.push("/roles")}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                disabled={submitting}
              >
                <ArrowLeft size={16} />
                Cancel
              </button>
            </div>
            <div className="flex-1 flex gap-4">
              <button
                type="button"
                onClick={() => {
                  // Reset ke permissions awal dari role
                  if (role) {
                    const rolePermissionIds = role.permissions.map(p => p.id);
                    setSelectedPermissions(rolePermissionIds);
                    setSuccess("Permissions reset to original values");
                  }
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting || selectedPermissions.length === 0}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Update Role
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Warning if no permissions selected */}
          {selectedPermissions.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    No permissions selected
                  </p>
                  <p className="text-sm text-yellow-700">
                    This role will have no access. Please select at least one permission.
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}