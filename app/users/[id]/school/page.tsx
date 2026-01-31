"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, School, AlertCircle, Check, User } from "lucide-react";

const API_URL = "http://edusmart.test/api";

interface School {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  schools: School[];
  roles: Role[];
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

  // LOGIKA SEDERHANA: 
  // Jika user punya hanya 1 role DAN role itu adalah siswa, maka batasi 1 sekolah
  // Selain itu, boleh banyak sekolah
  const isSingleStudent = () => {
    if (!user?.roles) return false;
    
    // Jika jumlah role bukan 1, berarti bukan siswa tunggal
    if (user.roles.length !== 1) return false;
    
    // Cek apakah satu-satunya role adalah siswa
    const singleRole = user.roles[0];
    const studentRoles = ['siswa', 'student', 'pelajar', 'murid'];
    
    return studentRoles.includes(singleRole.name.toLowerCase());
  };

  const singleStudent = isSingleStudent();

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
    if (singleStudent) {
      // Untuk siswa tunggal: single select (radio button behavior)
      setSelected(prev => {
        if (prev.includes(schoolId)) {
          return []; // Boleh kosong jika klik lagi
        } else {
          return [schoolId]; // Hanya satu yang dipilih
        }
      });
    } else {
      // Untuk user lain: multiple select
      setSelected((prev) =>
        prev.includes(schoolId)
          ? prev.filter((id) => id !== schoolId)
          : [...prev, schoolId]
      );
    }
  };

  const selectAll = () => {
    if (!singleStudent) {
      setSelected(schools.map(s => s.id));
    }
  };

  const clearAll = () => {
    setSelected([]);
  };

  const isAllSelected = () => {
    return schools.length > 0 && selected.length === schools.length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi untuk siswa tunggal
    if (singleStudent && selected.length > 1) {
      setError("Students with only student role can only be assigned to one school");
      return;
    }
    
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // ✅ Kirim school_ids (plural) sebagai array
      const payload = {
        school_ids: selected
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
  const userRoleNames = user?.roles?.map(r => r.name).join(', ') || 'No roles';

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
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              singleStudent ? "bg-yellow-100" : "bg-green-100"
            }`}>
              <School size={24} className={singleStudent ? "text-yellow-600" : "text-green-600"} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assign Schools</h1>
              <p className="text-gray-600">
                Manage school assignments for <span className="font-semibold">{user?.name}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <User size={14} className="text-gray-400" />
                <span className="text-sm text-gray-500">
                  Roles: {userRoleNames} 
                  {singleStudent && " (Single Student Role)"}
                </span>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className={`mt-4 p-4 rounded-lg border ${
            singleStudent 
              ? "bg-yellow-50 border-yellow-200" 
              : "bg-blue-50 border-blue-200"
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded ${
                singleStudent ? "bg-yellow-100" : "bg-blue-100"
              }`}>
                <School size={18} className={singleStudent ? "text-yellow-600" : "text-blue-600"} />
              </div>
              <div>
                <h3 className={`font-medium ${
                  singleStudent ? "text-yellow-800" : "text-blue-800"
                }`}>
                  {singleStudent 
                    ? "Single Student Account" 
                    : "Regular / Multi-Role Account"
                  }
                </h3>
                <p className={`text-sm mt-1 ${
                  singleStudent ? "text-yellow-700" : "text-blue-700"
                }`}>
                  {singleStudent 
                    ? "This user has ONLY ONE role which is Student. Maximum ONE school allowed."
                    : "This user can be assigned to MULTIPLE schools."
                  }
                </p>
                {singleStudent && selected.length > 1 && (
                  <p className="text-sm text-red-600 mt-1 font-medium">
                    ⚠️ Please select only one school for single student accounts
                  </p>
                )}
              </div>
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
                  {singleStudent 
                    ? "Select ONE school for this student" 
                    : "Select multiple schools for this user"
                  }
                </p>
              </div>
              <div className="flex gap-2">
                {!singleStudent && (
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
                )}
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
              <div className={`mt-4 p-3 rounded-lg border ${
                singleStudent 
                  ? "bg-yellow-50 border-yellow-200" 
                  : "bg-green-50 border-green-200"
              }`}>
                <p className={`text-sm font-medium mb-2 ${
                  singleStudent ? "text-yellow-800" : "text-green-800"
                }`}>
                  {singleStudent 
                    ? "Selected School:" 
                    : `Selected Schools (${selected.length}):`
                  }
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSchools.map(school => (
                    <span 
                      key={school.id} 
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        singleStudent
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      <Check size={12} />
                      {school.name}
                    </span>
                  ))}
                </div>
                {singleStudent && selected.length > 0 && (
                  <p className="text-xs text-yellow-600 mt-2">
                    ✓ One school selected (maximum for single student accounts)
                  </p>
                )}
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
                          ? singleStudent
                            ? "border-yellow-300 bg-yellow-50 shadow-sm"
                            : "border-green-300 bg-green-50 shadow-sm"
                          : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      {/* Input type berdasarkan role */}
                      {singleStudent ? (
                        // Radio button untuk siswa tunggal (single select)
                        <div className="flex items-center h-5 min-h-5">
                          <input
                            type="radio"
                            name="school"
                            checked={isSelected}
                            onChange={() => toggleSchool(school.id)}
                            className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                          />
                        </div>
                      ) : (
                        // Checkbox untuk user lain (multiple select)
                        <div className="flex items-center h-5 min-h-5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSchool(school.id)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                        </div>
                      )}
                      
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
                          <Check size={16} className={
                            singleStudent ? "text-yellow-600" : "text-green-600"
                          } />
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
                disabled={saving || (singleStudent && selected.length > 1)}
                className={`flex-1 px-6 py-3 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  singleStudent
                    ? "bg-yellow-600 text-white hover:bg-yellow-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                } ${saving || (singleStudent && selected.length > 1) 
                  ? "opacity-50 cursor-not-allowed" 
                  : ""}`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {singleStudent 
                      ? `Save School Assignment ${selected.length > 0 ? `(${selected.length})` : ''}`
                      : `Save School Assignments (${selected.length})`
                    }
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              {singleStudent 
                ? "Note: Users with ONLY ONE student role can be assigned to ONE school maximum. Select none to remove school assignment."
                : "Note: This user can be assigned to multiple schools. Uncheck all to remove all schools."
              }
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}