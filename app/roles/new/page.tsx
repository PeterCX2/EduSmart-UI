"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Shield, Check, X } from "lucide-react";

// API URL langsung
const API_URL = "http://edusmart.test/api";

interface Permission {
  id: number;
  name: string;
}

interface PermissionItem {
  id: number;
  name: string;
  checked: boolean;
}

interface ResourceGroup {
  resource: string;
  actions: PermissionItem[];
}

export default function CreateRolePage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [name, setName] = useState("");
  const [resourceGroups, setResourceGroups] = useState<ResourceGroup[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  
  const actionOrder = ["view", "create", "edit", "delete"];

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/role`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      // Cek jika response bukan JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Response HTML:", text.substring(0, 500));
        
        if (response.status === 401 || text.includes("login")) {
          localStorage.removeItem("token");
          router.push("/login");
          throw new Error("Session expired. Please login again.");
        }
        
        throw new Error("Server returned HTML instead of JSON");
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === "success" && Array.isArray(result.data[1])) {
        const permissionsData: Permission[] = result.data[1];
        
        // Organize permissions by resource
        const resourceMap: { [key: string]: PermissionItem[] } = {};
        
        permissionsData.forEach(permission => {
          const [action, ...resourceParts] = permission.name.split(" ");
          const resource = resourceParts.join(" ");
          
          if (!resourceMap[resource]) {
            resourceMap[resource] = [];
          }
          
          resourceMap[resource].push({
            id: permission.id,
            name: permission.name,
            checked: false
          });
        });
        
        // Convert to array format and sort actions
        const groups: ResourceGroup[] = Object.entries(resourceMap).map(([resource, actions]) => {
          // Sort actions based on predefined order
          const sortedActions = actions.sort((a, b) => {
            const aAction = a.name.split(" ")[0];
            const bAction = b.name.split(" ")[0];
            return actionOrder.indexOf(aAction) - actionOrder.indexOf(bAction);
          });
          
          return {
            resource,
            actions: sortedActions
          };
        });
        
        // Sort resources alphabetically
        groups.sort((a, b) => a.resource.localeCompare(b.resource));
        
        setResourceGroups(groups);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (resourceIndex: number, actionIndex: number, checked: boolean) => {
    const updatedGroups = [...resourceGroups];
    const permissionId = updatedGroups[resourceIndex].actions[actionIndex].id;
    
    updatedGroups[resourceIndex].actions[actionIndex].checked = checked;
    setResourceGroups(updatedGroups);
    
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  const handleSelectAll = (resourceIndex: number, selectAll: boolean) => {
    const updatedGroups = [...resourceGroups];
    const updatedSelected = [...selectedPermissions];
    const group = updatedGroups[resourceIndex];
    
    group.actions.forEach((action, index) => {
      updatedGroups[resourceIndex].actions[index].checked = selectAll;
      
      if (selectAll && !updatedSelected.includes(action.id)) {
        updatedSelected.push(action.id);
      } else if (!selectAll) {
        const itemIndex = updatedSelected.indexOf(action.id);
        if (itemIndex > -1) {
          updatedSelected.splice(itemIndex, 1);
        }
      }
    });
    
    setResourceGroups(updatedGroups);
    setSelectedPermissions(updatedSelected);
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
      
      const response = await fetch(`${API_URL}/role/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          permissions: selectedPermissions
        }),
      });

      // Cek jika response bukan JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Response HTML:", text.substring(0, 500));
        throw new Error("Server returned HTML instead of JSON");
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to create role");
      }
      
      setSuccess("Role created successfully!");
      
      setTimeout(() => {
        router.push("/roles");
      }, 1500);
      
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to create role");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading permissions...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Create New Role</h1>
              <p className="text-gray-600">Define permissions and access levels</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
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
        
        {/* Success Message */}
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

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-gray-600">
          {/* Role Name */}
          <div className="mb-8">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., content creator, moderator, editor"
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter a descriptive name for this role
            </p>
          </div>

          {/* Permissions Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <label className="text-lg font-semibold text-gray-900">
                Permissions <span className="text-red-500">*</span>
              </label>
              <div className="text-sm text-gray-600">
                Selected: <span className="font-bold">{selectedPermissions.length}</span> permissions
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-6">
              <p>Select the permissions this role should have:</p>
            </div>

            {resourceGroups.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-500">No permissions available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-xl">
                {resourceGroups.map((group, groupIndex) => (
                  <div key={group.resource} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold capitalize text-gray-900">
                        {group.resource.replace(/-/g, " ")}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectAll(groupIndex, true)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectAll(groupIndex, false)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          None
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {group.actions.map((action, actionIndex) => (
                        <label 
                          key={action.id} 
                          className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={action.checked}
                            onChange={(e) => handlePermissionChange(groupIndex, actionIndex, e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700 capitalize">
                            {action.name.split(" ")[0]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <p className="mt-4 text-sm text-gray-500">
              Select at least one permission for this role
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push("/admin/roles")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedPermissions.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Create Role
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}