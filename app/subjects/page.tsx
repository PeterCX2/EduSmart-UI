"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { schoolService } from "@/lib/api/schoolService";
import { subjectService } from "@/lib/api/subject";
import {
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

export default function SubjectsPage() {
  const router = useRouter();

  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const [userRole, setUserRole] = useState("");
  const [userSchoolId, setUserSchoolId] = useState<number | null>(null);
  const [userSchoolName, setUserSchoolName] = useState("");
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // ===============================
  // AUTH CHECK
  // ===============================
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);

      setUserRole(user.roles?.[0]?.name || "");

      const school = user.schools?.[0] ?? null;
      setUserSchoolId(school?.id ?? null);
      setUserSchoolName(school?.name ?? "");

      setIsAuthChecked(true);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // ===============================
  // FETCH DATA
  // ===============================
  useEffect(() => {
    if (isAuthChecked && userRole) {
      fetchData();
    }
  }, [isAuthChecked, userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const result: any[] = [];

      // ===============================
      // SUPER ADMIN
      // ===============================
      if (userRole === "super-admin") {
        const schools = await schoolService.getAll();

        for (const school of schools) {
          const subjects = await subjectService.getBySchool(school.id);

          subjects.forEach((subject: any) => {
            result.push({
              id: subject.id,
              name: subject.name,
              description: subject.description,
              school_id: school.id,
              school_name: school.name,
            });
          });
        }
      }

      // ===============================
      // TEACHER
      // ===============================
      else if (userRole === "teacher") {
        if (!userSchoolId) {
          setError("Teacher tidak memiliki sekolah");
          return;
        }

        const school = await schoolService.getById(userSchoolId);
        const subjects = await subjectService.getBySchool(userSchoolId);

        subjects.forEach((subject: any) => {
          result.push({
            id: subject.id,
            name: subject.name,
            description: subject.description,
            school_id: userSchoolId,
            school_name: school.name,
          });
        });
      }

      // ===============================
      // STUDENT (AMAN DARI PERMISSION)
      // ===============================
      else if (userRole === "student") {
        if (!userSchoolId) {
          setError("Student tidak memiliki sekolah");
          return;
        }

        const subjects = await subjectService.getBySchool(userSchoolId);

        subjects.forEach((subject: any) => {
          result.push({
            id: subject.id,
            name: subject.name,
            description: subject.description,
            school_id: userSchoolId,
            school_name: userSchoolName || "Sekolah Anda",
          });
        });
      }

      else {
        setError("Role tidak dikenali");
        return;
      }

      setAllSubjects(result);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data subject");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // DELETE
  // ===============================
  const handleDelete = async (
    schoolId: number,
    subjectId: number,
    subjectName: string
  ) => {
    if (!confirm(`Yakin hapus subject "${subjectName}"?`)) return;

    try {
      setDeleteLoading(subjectId);
      await subjectService.delete(schoolId, subjectId);
      setAllSubjects((prev) =>
        prev.filter((s) => s.id !== subjectId)
      );
    } catch {
      alert("Gagal menghapus subject");
      fetchData();
    } finally {
      setDeleteLoading(null);
    }
  };

  // ===============================
  // FILTER
  // ===============================
  const filteredSubjects = allSubjects.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.school_name.toLowerCase().includes(q)
    );
  });

  // ===============================
  // LOADING
  // ===============================
  if (!isAuthChecked || loading) {
    return (
      <div className="p-6 text-center">
        <RefreshCw className="animate-spin mx-auto mb-2" />
        <p>Loading...</p>
      </div>
    );
  }

  // ===============================
  // UI
  // ===============================
  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-600">Subjects</h1>
          <p className="text-gray-600">
            Role: {userRole}
            {userSchoolName && ` | Sekolah: ${userSchoolName}`}
          </p>
        </div>

        {(userRole === "super-admin" || userRole === "teacher") && (
          <button
            onClick={() => router.push("/subjects/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex gap-2"
          >
            <Plus size={18} />
            Tambah Subject
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={16} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari subject..."
          className="w-full pl-9 py-2 border rounded text-gray-600"
        />
      </div>

      {filteredSubjects.length === 0 ? (
        <p className="text-center text-gray-500">Tidak ada subject</p>
      ) : (
        <table className="w-full border text-gray-600">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">No</th>
              <th className="p-3 text-left">Subject</th>
              <th className="p-3 text-left">Sekolah</th>
              {(userRole === "super-admin" || userRole === "teacher") && (
                <th className="p-3 text-left">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.map((s, i) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-gray-500">{s.description}</p>
                </td>
                <td className="p-3">{s.school_name}</td>

                {(userRole === "super-admin" || userRole === "teacher") && (
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/subjects/${s.id}?school=${s.school_id}`
                        )
                      }
                      className="p-2 bg-blue-100 rounded"
                    >
                      <Edit size={16} />
                    </button>

                    {userRole === "super-admin" && (
                      <button
                        onClick={() =>
                          handleDelete(s.school_id, s.id, s.name)
                        }
                        className="p-2 bg-red-100 rounded"
                      >
                        {deleteLoading === s.id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
