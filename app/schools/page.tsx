"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { schoolService } from "@/lib/api/schoolService";
import {
  Edit,
  Trash2,
  Building,
  Users,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

export default function SchoolsPage() {
  const router = useRouter();

  // DATA
  const [schools, setSchools] = useState<any[]>([]);

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

      const data = await schoolService.getAll();

      const formatted = Array.isArray(data)
        ? data.map((school: any) => ({
            id: school.id,
            name: school.name || school.nama || `Sekolah ${school.id}`,
            total_students:
              school.users_count ||
              school.students_count ||
              school.jumlah_siswa ||
              0,
          }))
        : [];

      setSchools(formatted);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data sekolah");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Yakin hapus sekolah "${name}"?`)) return;

    try {
      setDeleteLoading(id);
      await schoolService.delete(id);
      setSchools((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert("Gagal menghapus sekolah");
      fetchData();
    } finally {
      setDeleteLoading(null);
    }
  };

  // FILTER
  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = schools.reduce(
    (sum, s) => sum + (s.total_students || 0),
    0
  );

  // LOADING
  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Memuat data sekolah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
          <p className="text-gray-600">Kelola data sekolah</p>
        </div>
        <button
          onClick={() => router.push("/schools/new")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Tambah Sekolah
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
            Cari Sekolah
          </label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nama sekolah..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-600"
            />
          </div>
        </div>

        {/* STATS */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sekolah</p>
              <p className="text-2xl text-gray-600 font-bold">{schools.length}</p>
            </div>
          </div>
          <div className="h-px w-full border border-gray-300 mb-4"/>
          <div className="flex justify-between text-gray-600">
            <span>Total siswa</span>
            <span className="font-medium">
              {totalStudents.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* TABLE / EMPTY */}
      {filteredSchools.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border text-center">
          <Building size={32} className="mx-auto text-gray-400 mb-3" />
          <h3 className="font-medium text-gray-900">
            Sekolah tidak ditemukan
          </h3>
          <p className="text-gray-600 mb-4">
            Coba ubah kata kunci pencarian
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="px-4 py-2 border rounded-lg text-gray-600"
          >
            Reset
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden ">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-gray-600">
                <th className="px-6 py-3 text-left text-sm">NO</th>
                <th className="px-6 py-3 text-left text-sm">SEKOLAH</th>
                <th className="px-6 py-3 text-left text-sm">SISWA</th>
                <th className="px-6 py-3 text-left text-sm">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSchools.map((school, i) => (
                <tr key={school.id} className="hover:bg-gray-50 text-gray-500">
                  <td className="px-6 py-4">{i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Building size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{school.name}</p>
                        <p className="text-xs text-gray-500">
                          ID: {school.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-green-600" />
                      {school.total_students}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          router.push(`/schools/${school.id}`)
                        }
                        className="p-2 bg-blue-50 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(school.id, school.name)
                        }
                        disabled={deleteLoading === school.id}
                        className="p-2 bg-red-50 rounded-lg disabled:opacity-50"
                      >
                        {deleteLoading === school.id ? (
                          <RefreshCw
                            size={16}
                            className="animate-spin"
                          />
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
