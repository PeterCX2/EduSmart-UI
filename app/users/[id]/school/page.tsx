"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, School, AlertCircle, Check } from "lucide-react";

const API_URL = "http://edusmart.test/api";

interface School {
  id: number;
  name: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  schools: School[];
}

export default function AssignSchoolsPage() {
  const router = useRouter();
  const { id } = useParams();
  const userId = id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!userId) return;
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const [userRes, schoolRes] = await Promise.all([
        fetch(`${API_URL}/user/show/${userId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Accept": "application/json"
          },
        }),
        fetch(`${API_URL}/school`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Accept": "application/json"
          },
        }),
      ]);

      if (!userRes.ok || !schoolRes.ok) {
        throw new Error("Failed to load data");
      }

      const userJson = await userRes.json();
      const schoolJson = await schoolRes.json();

      console.log("User data:", userJson);
      console.log("Schools data:", schoolJson);

      const userData = userJson.data || userJson.user;
      const schoolsData = schoolJson.data || [];

      if (userData) {
        setUser(userData);
        // Ambil semua school IDs
        const userSchoolIds = (userData.schools || []).map((s: School) => s.id);
        setSelected(userSchoolIds);
      }

      setSchools(schoolsData);

    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const toggleSchool = (schoolId: number) => {
    setSelected((prev) =>
      prev.includes(schoolId)
        ? prev.filter((id) => id !== schoolId)
        : [...prev, schoolId]
    );
  };

  const selectAll = () => {
    setSelected(schools.map(s => s.id));
  };

  const clearAll = () => {
    setSelected([]);
  };

  const isAllSelected = () => {
    return schools.length > 0 && selected.length === schools.length;
  };

  const isIndeterminate = () => {
    return selected.length > 0 && selected.length < schools.length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // ✅ Sekarang kirim school_ids (plural) sebagai array
      const payload = {
        school_ids: selected // Array of IDs
      };

      console.log("Submitting with payload:", payload);
      
      const res = await fetch(`${API_URL}/user/${userId}/schools`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      console.log("Response:", responseText);

      if (res.ok) {
        const result = JSON.parse(responseText);
        if (result.status === "success") {
          setSuccess(result.message || "Schools assigned successfully!");
          setTimeout(() => router.push("/users"), 1500);
          return;
        } else {
          setError(result.message || "Failed to update schools");
        }
      } else {
        if (res.status === 422) {
          try {
            const errorData = JSON.parse(responseText);
            if (errorData.errors) {
              setError(Object.values(errorData.errors).flat().join(", "));
            } else {
              setError(errorData.message || `HTTP ${res.status}`);
            }
          } catch {
            setError(`HTTP ${res.status}: ${responseText}`);
          }
        } else {
          setError(`HTTP ${res.status}: ${responseText}`);
        }
      }

    } catch (err: any) {
      setError(err.message || "Failed to assign schools");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading schools data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => router.push("/users")} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={18} /> Back to Users
          </button>
          <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h3>
            <button 
              onClick={() => router.push("/users")} 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Users List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Hitung statistik
  const selectedSchools = schools.filter(s => selected.includes(s.id));

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => router.push("/users")} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={18} /> Back to Users
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <School size={24} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assign Schools</h1>
              <p className="text-gray-600">
                Manage school assignments for <span className="font-semibold">{user?.name}</span>
              </p>
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

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Available Schools
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select multiple schools for this user
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={isAllSelected()}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    isAllSelected()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={selected.length === 0}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    selected.length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Selection Summary */}
            {selected.length > 0 && (
              <div className="mt-4 p-3 bg-white border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Selected Schools ({selected.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSchools.map(school => (
                    <span 
                      key={school.id} 
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      <Check size={12} />
                      {school.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="max-h-[500px] overflow-y-auto p-6">
            {schools.length === 0 ? (
              <div className="text-center py-12">
                <School size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No schools available</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create schools first from the Schools page
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {schools.map((school) => {
                  const isSelected = selected.includes(school.id);
                  return (
                    <label
                      key={school.id}
                      className={`relative flex items-start p-4 border rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-300 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center h-5 min-h-5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSchool(school.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <span className="block text-sm font-medium text-gray-900">
                          {school.name}
                        </span>
                        <span className="block text-xs text-gray-500 mt-1">
                          ID: {school.id}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check size={16} className="text-blue-600" />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => router.push("/users")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save School Assignments ({selected.length})
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Note: User can be assigned to multiple schools. Uncheck all to remove all schools.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}