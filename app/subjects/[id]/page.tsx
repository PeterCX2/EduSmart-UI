"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { subjectService } from "@/lib/api/subject";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

export default function EditSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const subjectId = params.id as string;
  const schoolId = searchParams.get("school");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (subjectId && schoolId) {
      loadSubject();
    } else {
      alert("School ID diperlukan");
      router.push("/subjects");
    }
  }, [subjectId, schoolId]);

  const loadSubject = async () => {
    try {
      setLoading(true);
      
      const data = await subjectService.getById(parseInt(schoolId!), parseInt(subjectId));
      setName(data.name || data.nama || "");
      
    } catch (error: any) {
      alert("Gagal memuat data: " + error.message);
      router.push("/subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert("Nama subject harus diisi");
      return;
    }

    try {
      setSaving(true);
      
      await subjectService.update(parseInt(schoolId!), parseInt(subjectId), name);
      
      alert("Subject berhasil diperbarui!");
      router.push("/subjects");
      
    } catch (error: any) {
      alert("Gagal update: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Yakin hapus subject ini?")) return;
    
    try {
      await subjectService.delete(parseInt(schoolId!), parseInt(subjectId));
      alert("Subject berhasil dihapus!");
      router.push("/subjects");
    } catch (error: any) {
      alert("Gagal hapus: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-xl max-w-2xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-600">Memuat data subject...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Subject</h1>
            <p className="text-gray-600">Subject ID: {subjectId}</p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>Subject ID:</span>
              <span className="font-medium">{subjectId}</span>
            </div>
            <div className="flex justify-between">
              <span>School ID:</span>
              <span className="font-medium">{schoolId}</span>
            </div>
          </div>
        </div>

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

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-gray-700">Data Subject:</p>
          <button
            onClick={loadSubject}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Reload Data
          </button>
        </div>
        <pre className="text-sm text-gray-600 bg-white p-3 rounded border">
          {JSON.stringify({ id: subjectId, name, school_id: schoolId }, null, 2)}
        </pre>
      </div>
    </div>
  );
}