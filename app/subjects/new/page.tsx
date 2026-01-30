"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { schoolService } from "@/lib/api/schoolService";
import { subjectService } from "@/lib/api/subject";
import { ArrowLeft, Save } from "lucide-react";

export default function NewSubjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    school_id: ""
  });

  const schoolIdFromUrl = searchParams.get("school");

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const data = await schoolService.getAll();
      const formattedSchools = Array.isArray(data)
        ? data.map((school: any) => ({
            id: school.id,
            name: school.name || school.nama || `Sekolah ${school.id}`,
          }))
        : [];

      setSchools(formattedSchools);

      if (schoolIdFromUrl) {
        setForm(prev => ({ ...prev, school_id: schoolIdFromUrl }));
      }
    } catch (error) {
      console.error("Error loading schools:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert("Nama subject harus diisi");
      return;
    }

    if (!form.school_id) {
      alert("Pilih sekolah terlebih dahulu");
      return;
    }

    try {
      setLoading(true);
      
      await subjectService.create(parseInt(form.school_id), form.name);
      
      alert("Subject berhasil dibuat!");
      router.push("/subjects");
      
    } catch (error: any) {
      alert("Gagal membuat subject: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl max-w-2xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Subject Baru</h1>
          <p className="text-gray-600">Isi form untuk membuat subject baru</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Matematika, Bahasa Inggris, dll"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sekolah <span className="text-red-500">*</span>
          </label>
          <select
            name="school_id"
            value={form.school_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Pilih Sekolah</option>
            {schools.map(school => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
          {schoolIdFromUrl && (
            <p className="text-sm text-gray-500 mt-2">
              * School ID dari URL: {schoolIdFromUrl}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Menyimpan..." : "Simpan Subject"}
          </button>
        </div>
      </form>

    </div>
  );
}