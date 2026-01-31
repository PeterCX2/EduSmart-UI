"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, User, Check, X, Mail, Lock, Shield } from "lucide-react";

const API_URL = "http://edusmart.test/api";

interface Role {
  id: number;
  name: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    roles: [] as number[],
  });
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/role`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      
      if (result.status === "success" && Array.isArray(result.data)) {
        const rolesArray = result.data[0];
        if (Array.isArray(rolesArray)) {
          setAvailableRoles(rolesArray);
        }
      }
    } catch (err: any) {
      setAvailableRoles([
        { id: 1, name: 'admin' },
        { id: 2, name: 'user' },
      ]);
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
    
    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required");
      return;
    }
    
    if (formData.password !== formData.password_confirmation) {
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
      
      // Dapatkan nama roles dari IDs yang dipilih
      const selectedRoleNames = availableRoles
        .filter(role => formData.roles.includes(role.id))
        .map(role => role.name);
      
      console.log("Selected role names:", selectedRoleNames);
      
      // COBA DUA FORMAT BERBEDA:
      // Format 1: roles as array of names (sesuai contoh Laravel)
      const payload1 = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        roles: selectedRoleNames,
      };
      
      // Format 2: role_ids as array of IDs
      const payload2 = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        role_ids: formData.roles,
      };
      
      // Format 3: permissions as array of IDs
      const payload3 = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        permissions: formData.roles,
      };
      
      // Coba format 1 dulu (sesuai contoh)
      let payload = payload1;
      console.log("Trying payload:", payload);
      
      const response = await fetch(`${API_URL}/user/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log("Response:", responseText);
      
      if (!response.ok) {
        // Coba format 2 jika format 1 gagal
        if (response.status === 422) {
          console.log("Trying payload2...");
          const response2 = await fetch(`${API_URL}/user/store`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
              "Accept": "application/json",
            },
            body: JSON.stringify(payload2),
          });
          
          const responseText2 = await response2.text();
          console.log("Response2:", responseText2);
          
          if (!response2.ok) {
            // Coba format 3
            console.log("Trying payload3...");
            const response3 = await fetch(`${API_URL}/user/store`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
              },
              body: JSON.stringify(payload3),
            });
            
            const responseText3 = await response3.text();
            console.log("Response3:", responseText3);
            
            if (!response3.ok) {
              throw new Error(`All formats failed. Last error: ${responseText3}`);
            }
            
            const result3 = JSON.parse(responseText3);
            if (result3.status === "success") {
              setSuccess("User created successfully!");
              setTimeout(() => router.push("/users"), 1500);
              return;
            }
            throw new Error(result3.message || "Failed to create user");
          }
          
          const result2 = JSON.parse(responseText2);
          if (result2.status === "success") {
            setSuccess("User created successfully!");
            setTimeout(() => router.push("/users"), 1500);
            return;
          }
          throw new Error(result2.message || "Failed to create user");
        }
        
        // Parse error message
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.errors) {
            const errorMessages = Object.values(errorData.errors).flat();
            throw new Error(errorMessages.join(", "));
          }
          throw new Error(errorData.message || `HTTP ${response.status}`);
        } catch {
          throw new Error(`HTTP ${response.status}: ${responseText}`);
        }
      }

      const result = JSON.parse(responseText);
      
      if (result.status === "success") {
        setSuccess("User created successfully!");
        setTimeout(() => router.push("/users"), 1500);
      } else {
        throw new Error(result.message || "Failed to create user");
      }
      
    } catch (err: any) {
      setError(err.message || "Failed to create user");
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
              <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
              <p className="text-gray-600">Add a new user account</p>
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
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} name="password_confirmation" value={formData.password_confirmation} onChange={handleInputChange} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Roles *</h2>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableRoles.map(role => (
                  <label key={role.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer">
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
            <button type="button" onClick={() => router.push("/users")} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting || formData.roles.length === 0} className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}