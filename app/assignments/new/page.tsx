// app/assignments/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { schoolService } from "@/lib/api/schoolService";
import { subjectService } from "@/lib/api/subject";
import { assignmentService } from "@/lib/api/assignment";
import { ArrowLeft, Save, Calendar } from "lucide-react";

export default function NewAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [schools, setSchools] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    deadline: "",
    school_id: "",
    subject_id: ""
  });

  const schoolIdFromUrl = searchParams.get("school");
  const subjectIdFromUrl = searchParams.get("subject");

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    if (form.school_id) {
      loadSubjects(parseInt(form.school_id));
    }
  }, [form.school_id]);

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

      // Set default from URL if available
      if (schoolIdFromUrl) {
        setForm(prev => ({ ...prev, school_id: schoolIdFromUrl }));
      }
    } catch (error) {
      console.error("Error loading schools:", error);
    }
  };

  const loadSubjects = async (schoolId: number) => {
    try {
      const data = await subjectService.getBySchool(schoolId);
      const formattedSubjects = Array.isArray(data)
        ? data.map((subject: any) => ({
            id: subject.id,
            name: subject.name || subject.nama || `Subject ${subject.id}`,
          }))
        : [];

      setSubjects(formattedSubjects);

      // Set default from URL if available
      if (subjectIdFromUrl) {
        setForm(prev => ({ ...prev, subject_id: subjectIdFromUrl }));
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      setSubjects([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert("Nama assignment harus diisi");
      return;
    }

    if (!form.school_id) {
      alert("Pilih sekolah terlebih dahulu");
      return;
    }

    if (!form.subject_id) {
      alert("Pilih subject terlebih dahulu");
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for API
      const assignmentData = {
        name: form.name,
        description: form.description,
        deadline: form.deadline || null
      };

      await assignmentService.create(
        parseInt(form.school_id), 
        parseInt(form.subject_id), 
        assignmentData
      );
      
      alert("Assignment berhasil dibuat!");
      router.push("/assignments");
      
    } catch (error: any) {
      alert("Gagal membuat assignment: " + error.message);
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
          <h1 className="text-2xl font-bold text-gray-900">Tambah Assignment Baru</h1>
          <p className="text-gray-600">Buat tugas untuk mata pelajaran</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-gray-600">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <select
            name="subject_id"
            value={form.subject_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={!form.school_id}
          >
            <option value="">{form.school_id ? "Pilih Subject" : "Pilih sekolah terlebih dahulu"}</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {subjectIdFromUrl && (
            <p className="text-sm text-gray-500 mt-2">
              * Subject ID dari URL: {subjectIdFromUrl}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Assignment <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tugas Matematika, Essay Bahasa Inggris, dll"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deadline
          </label>
          <div className="relative">
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="datetime-local"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            * Kosongkan jika tidak ada deadline
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deskripsi
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Deskripsi tugas, instruksi, atau catatan..."
          />
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
            {loading ? "Menyimpan..." : "Simpan Assignment"}
          </button>
        </div>
      </form>

    </div>
  );
}