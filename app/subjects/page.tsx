// app/subjects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { schoolService } from "@/lib/api/schoolService";
import { subjectService } from "@/lib/api/subject";
import {
  Edit,
  Trash2,
  BookOpen,
  Building,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

export default function SubjectsPage() {
  const router = useRouter();

  // DATA
  const [schools, setSchools] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);

  // UI STATE
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Get all schools
      const schoolsData = await schoolService.getAll();
      const formattedSchools = Array.isArray(schoolsData)
        ? schoolsData.map((school: any) => ({
            id: school.id,
            name: school.name || school.nama || `Sekolah ${school.id}`,
            total_students:
              school.users_count ||
              school.students_count ||
              school.jumlah_siswa ||
              0,
          }))
        : [];

      setSchools(formattedSchools);

      // Get all subjects from all schools and combine them
      const allSubjectsList: any[] = [];
      
      for (const school of formattedSchools) {
        try {
          const subjects = await subjectService.getBySchool(school.id);
          if (Array.isArray(subjects)) {
            subjects.forEach((subject: any) => {
              allSubjectsList.push({
                id: subject.id,
                name: subject.name || subject.nama || `Subject ${subject.id}`,
                description: subject.description || subject.deskripsi || "",
                school_id: school.id,
                school_name: school.name,
                school_students: school.total_students,
              });
            });
          }
        } catch (err) {
          console.error(`Error loading subjects for school ${school.id}:`, err);
        }
      }

      setAllSubjects(allSubjectsList);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (schoolId: number, subjectId: number, subjectName: string) => {
    if (!confirm(`Yakin hapus subject "${subjectName}"?`)) return;

    try {
      setDeleteLoading(subjectId);
      await subjectService.delete(schoolId, subjectId);
      
      // Update local state
      setAllSubjects(prev => prev.filter(subject => subject.id !== subjectId));
    } catch (err: any) {
      alert("Gagal menghapus subject");
      fetchData();
    } finally {
      setDeleteLoading(null);
    }
  };

  // FILTER FUNCTION - Search subject name, description, or school name
  const filteredSubjects = allSubjects.filter(subject => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const subjectMatch = subject.name.toLowerCase().includes(query) ||
                       (subject.description && subject.description.toLowerCase().includes(query));
    const schoolMatch = subject.school_name.toLowerCase().includes(query);
    
    return subjectMatch || schoolMatch;
  });

  // LOADING
  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Memuat data subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-600">Kelola data mata pelajaran</p>
        </div>
        <button
          onClick={() => router.push("/subjects/new")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Tambah Subject
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* FILTER + STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* SEARCH */}
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <label className="text-sm text-gray-600 mb-2 block">
            Cari Subject atau Sekolah
          </label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nama subject, deskripsi, atau sekolah..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-gray-500 mt-2">
              Mencari: "{searchQuery}" • Ditemukan: {filteredSubjects.length} subject
            </p>
          )}
        </div>

        {/* STATS */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Subjects</p>
              <p className="text-2xl text-gray-600 font-bold">{allSubjects.length}</p>
            </div>
          </div>
          <div className="h-px w-full border border-gray-300 mb-4"/>
          <div className="flex justify-between text-gray-600">
            <span>Total sekolah</span>
            <span className="font-medium">{schools.length}</span>
          </div>
        </div>
      </div>

      {/* TABLE / EMPTY */}
      {filteredSubjects.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border text-center">
          <BookOpen size={32} className="mx-auto text-gray-400 mb-3" />
          <h3 className="font-medium text-gray-900">
            {searchQuery ? "Tidak ditemukan" : "Belum ada data"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery 
              ? `Tidak ditemukan subject atau sekolah dengan kata kunci "${searchQuery}"`
              : "Mulai dengan membuat subject pertama"}
          </p>
          <div className="flex gap-3 justify-center">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-gray-600">
                <th className="px-6 py-3 text-left text-sm">NO</th>
                <th className="px-6 py-3 text-left text-sm">SUBJECT</th>
                <th className="px-6 py-3 text-left text-sm">SEKOLAH</th>
                <th className="px-6 py-3 text-left text-sm">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSubjects.map((subject, index) => (
                <tr key={subject.id} className="hover:bg-gray-50 text-gray-500">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <BookOpen size={16} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{subject.name}</p>
                        {subject.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {subject.description}
                          </p>
                        )}
                        {searchQuery && subject.name.toLowerCase().includes(searchQuery.toLowerCase()) && (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                              Cocok: Nama
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                        <Building size={16} className="text-gray-700" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{subject.school_name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Users size={12} className="text-green-600" />
                          <span className="text-xs text-gray-500">
                            {subject.school_students} siswa
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">ID: {subject.school_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/subjects/${subject.id}?school=${subject.school_id}`)}
                        className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.school_id, subject.id, subject.name)}
                        disabled={deleteLoading === subject.id}
                        className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                        title="Hapus"
                      >
                        {deleteLoading === subject.id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
        </div>
      )}
    </div>
  );
}