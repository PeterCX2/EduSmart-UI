"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, User, X, AlertCircle } from "lucide-react";

const API_URL = "http://edusmart.test/api";

interface Role {
  id: number;
  name: string;
}

interface UserType {
  id: number;
  name: string;
  email: string;
  roles: Role[];
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    roles: [] as number[],
  });
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [roleFormat, setRoleFormat] = useState<"names" | "ids">("names");

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const [userRes, rolesRes] = await Promise.all([
        fetch(`${API_URL}/user/show/${userId}`, { 
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          } 
        }),
        fetch(`${API_URL}/role`, { 
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          } 
        })
      ]);

      if (!userRes.ok) throw new Error("Failed to fetch user");

      const userResult = await userRes.json();
      const rolesResult = await rolesRes.json();

      console.log("User data:", userResult);
      console.log("Roles data:", rolesResult);

      if (userResult.status === "success") {
        const userData = userResult.data || userResult.user;
        setUser(userData);
        setFormData({
          name: userData.name,
          email: userData.email,
          password: "",
          password_confirmation: "",
          roles: userData.roles.map((r: Role) => r.id),
        });
      }

      if (rolesResult.status === "success" && Array.isArray(rolesResult.data)) {
        setAvailableRoles(rolesResult.data[0] || []);
      }

      // Cek format roles dari contoh Laravel
      if (userResult.roles && Array.isArray(userResult.roles)) {
        const firstRole = userResult.roles[0];
        if (typeof firstRole === 'string') {
          setRoleFormat("names");
        } else if (typeof firstRole === 'object' && firstRole.id) {
          setRoleFormat("ids");
        }
      }

    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleChange = (roleId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked ? [...prev.roles, roleId] : prev.roles.filter(id => id !== roleId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      setError("Name and email are required");
      return;
    }
    
    if (formData.password && formData.password !== formData.password_confirmation) {
      setError("Passwords do not match");
      return;
    }
    
    if (formData.roles.length === 0) {
      setError("Please select at least one role");
      return;
    }
    
    try {
      setSubmitting(true);
      setError("");
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      
      // Siapkan payload berdasarkan format
      const selectedRoleNames = availableRoles
        .filter(role => formData.roles.includes(role.id))
        .map(role => role.name);
      
      let payload: any = {
        name: formData.name,
        email: formData.email,
      };
      
      // Tambahkan password hanya jika diisi
      if (formData.password) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }
      
      // Coba 3 format berbeda untuk roles
      const payloads = [
        { ...payload, roles: selectedRoleNames }, // Format 1: role names
        { ...payload, role_ids: formData.roles },  // Format 2: role IDs
        { ...payload, permissions: formData.roles } // Format 3: permissions
      ];
      
      console.log("Trying payloads:", payloads);
      
      let lastError = "";
      
      // Coba semua format
      for (const testPayload of payloads) {
        try {
          const response = await fetch(`${API_URL}/user/update/${userId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
              "Accept": "application/json",
            },
            body: JSON.stringify(testPayload),
          });

          const responseText = await response.text();
          console.log(`Response for ${Object.keys(testPayload)[2]}:`, responseText);
          
          if (response.ok) {
            const result = JSON.parse(responseText);
            if (result.status === "success") {
              setSuccess("User updated successfully!");
              setTimeout(() => router.push("/users"), 1500);
              return;
            } else {
              lastError = result.message || "Failed to update user";
            }
          } else {
            if (response.status === 422) {
              try {
                const errorData = JSON.parse(responseText);
                if (errorData.errors) {
                  lastError = Object.values(errorData.errors).flat().join(", ");
                } else {
                  lastError = errorData.message || `HTTP ${response.status}`;
                }
              } catch {
                lastError = `HTTP ${response.status}: ${responseText}`;
              }
            } else {
              lastError = `HTTP ${response.status}: ${responseText}`;
            }
          }
        } catch (err: any) {
          lastError = err.message;
        }
      }
      
      throw new Error(lastError || "All formats failed");
      
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => router.push("/users")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft size={18} /> Back to Users
          </button>
          <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h3>
            <button onClick={() => router.push("/users")} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Users List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tampilkan role names yang dipilih
  const selectedRoleNames = availableRoles
    .filter(role => formData.roles.includes(role.id))
    .map(role => role.name);

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button onClick={() => router.push("/users")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={18} /> Back to Users
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
              <p className="text-gray-600">Update {user?.name}'s account</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">Success</p>
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Password (Leave empty to keep current)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Roles *</h2>
              <div className="text-sm text-gray-500">
                Selected: {formData.roles.length} roles
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">Current format: {roleFormat === "names" ? "Role Names" : "Role IDs"}</p>
                <p className="text-xs text-gray-500">Will try: names, IDs, and permissions formats</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableRoles.map(role => (
                  <label key={role.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${formData.roles.includes(role.id) ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                    <input type="checkbox" checked={formData.roles.includes(role.id)} onChange={(e) => handleRoleChange(role.id, e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <div>
                      <span className="text-gray-900 font-medium capitalize">{role.name.replace('-', ' ')}</span>
                      <p className="text-xs text-gray-500">ID: {role.id}</p>
                    </div>
                  </label>
                ))}
              </div>
              {formData.roles.length === 0 && <p className="mt-3 text-sm text-yellow-600">Select at least one role</p>}
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button type="button" onClick={() => router.push("/users")} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting || formData.roles.length === 0} className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Update User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}