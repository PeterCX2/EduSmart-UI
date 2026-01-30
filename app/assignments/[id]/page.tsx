// app/assignments/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { assignmentService } from "@/lib/api/assignment";
import { schoolService } from "@/lib/api/schoolService";
import { subjectService } from "@/lib/api/subject";
import { ArrowLeft, Save, Trash2, Calendar } from "lucide-react";

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const assignmentId = params.id as string;
  const schoolId = searchParams.get("school");
  const subjectId = searchParams.get("subject");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [school, setSchool] = useState<any>(null);
  const [subject, setSubject] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    deadline: ""
  });

  useEffect(() => {
    if (assignmentId && schoolId && subjectId) {
      loadAssignment();
      loadSchoolAndSubject();
    } else {
      alert("School ID dan Subject ID diperlukan");
      router.push("/assignments");
    }
  }, [assignmentId, schoolId, subjectId]);

  const loadSchoolAndSubject = async () => {
    try {
      const [schoolData, subjectData] = await Promise.all([
        schoolService.getById(parseInt(schoolId!)),
        subjectService.getById(parseInt(schoolId!), parseInt(subjectId!))
      ]);

      setSchool({
        id: schoolData.id,
        name: schoolData.name || schoolData.nama || `Sekolah ${schoolData.id}`,
      });

      setSubject({
        id: subjectData.id,
        name: subjectData.name || subjectData.nama || `Subject ${subjectData.id}`,
      });
    } catch (error: any) {
      console.error("Error loading school/subject:", error);
    }
  };

  const loadAssignment = async () => {
    try {
      setLoading(true);
      
      const data = await assignmentService.getById(
        parseInt(schoolId!), 
        parseInt(subjectId!), 
        parseInt(assignmentId)
      );
      
      // Format deadline for datetime-local input
      let deadlineValue = "";
      if (data.deadline || data.tenggat) {
        const deadline = new Date(data.deadline || data.tenggat);
        deadlineValue = deadline.toISOString().slice(0, 16);
      }
      
      setForm({
        name: data.name || data.nama || "",
        description: data.description || data.deskripsi || "",
        deadline: deadlineValue
      });
      
    } catch (error: any) {
      alert("Gagal memuat data: " + error.message);
      router.push("/assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    try {
      setSaving(true);
      
      await assignmentService.update(
        parseInt(schoolId!), 
        parseInt(subjectId!), 
        parseInt(assignmentId),
        form
      );
      
      alert("Assignment berhasil diperbarui!");
      router.push("/assignments");
      
    } catch (error: any) {
      alert("Gagal update: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Yakin hapus assignment ini?")) return;
    
    try {
      await assignmentService.delete(
        parseInt(schoolId!), 
        parseInt(subjectId!), 
        parseInt(assignmentId)
      );
      alert("Assignment berhasil dihapus!");
      router.push("/assignments");
    } catch (error: any) {
      alert("Gagal hapus: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-xl max-w-2xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-600">Memuat data assignment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl max-w-2xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Assignment</h1>
            <p className="text-gray-600">Assignment ID: {assignmentId}</p>
          </div>
        </div>

        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
        >
          <Trash2 size={18} />
          Hapus
        </button>
      </div>

      {/* SCHOOL & SUBJECT INFO */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Sekolah</p>
            <p className="font-medium text-gray-800">
              {school?.name} (ID: {schoolId})
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Subject</p>
            <p className="font-medium text-gray-800">
              {subject?.name} (ID: {subjectId})
            </p>
          </div>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6 text-gray-600">
        {/* Nama Assignment */}
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
            required
          />
        </div>

        {/* Deadline */}
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

        {/* Deskripsi */}
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
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            disabled={saving}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>

    </div>
  );
}