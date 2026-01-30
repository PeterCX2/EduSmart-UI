"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { schoolService } from "@/lib/api/schoolService";
import { Building, Save, ArrowLeft, RefreshCw } from "lucide-react";

export default function EditSchoolPage() {
  const router = useRouter();
  const { id } = useParams();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSchool();
  }, []);

  const fetchSchool = async () => {
        try {
            setLoading(true);

            const school = await schoolService.getById(id as string);

            setName(school?.name || "");
        } catch {
            setError("Gagal memuat data sekolah");
        } finally {
            setLoading(false);
        }
    };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nama sekolah wajib diisi");
      return;
    }

    try {
      setSaving(true);
      await schoolService.update(id as string, { name });
      router.push("/schools");
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui sekolah");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
        <p className="text-gray-500">Memuat data sekolah...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-xl">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6 text-gray-600">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border hover:bg-gray-50"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">Edit Sekolah</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border shadow-sm p-6 space-y-5"
      >
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* NAME */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Sekolah
          </label>
          <div className="relative">
            <Building
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-600"
            />
          </div>
        </div>

        {/* ACTION */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg text-gray-600"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Menyimpan..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}
