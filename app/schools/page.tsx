// app/schools/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { schoolService } from '@/lib/api/schoolService';
import { Edit, Trash2, Eye, Users, Building } from 'lucide-react';

export default function SchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await schoolService.getAll();
      
      // FORMAT DATA: Pastikan punya name dan total_students
      const formattedData = Array.isArray(data) ? data.map((school: any) => ({
        id: school.id,
        name: school.name || school.nama || 'Sekolah',
        total_students: school.users_count || school.jumlah_siswa || school.students_count || 0
      })) : [];
      
      setSchools(formattedData);
      
    } catch (error: any) {
      setError(error.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus?')) return;
    try {
      await schoolService.delete(id);
      fetchSchools();
    } catch (error) {
      alert('Gagal hapus');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 bg-[#f0f0f0] rounded-xl shadow-xl my-5">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sekolah</h1>
        <button
          onClick={() => router.push('/schools/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Tambah
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left font-medium">NO</th>
              <th className="py-3 px-4 text-left font-medium">NAMA SEKOLAH</th>
              <th className="py-3 px-4 text-left font-medium">JUMLAH SISWA</th>
              <th className="py-3 px-4 text-left font-medium">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {schools.length > 0 ? (
              schools.map((school, index) => (
                <tr key={school.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{school.name}</p>
                        <p className="text-sm text-gray-500">ID: {school.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-green-600" />
                      <span className="font-bold">{school.total_students.toLocaleString()}</span>
                      <span className="text-gray-500 text-sm">siswa</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/schools/${school.id}`)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(school.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  Tidak ada data sekolah
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* FOOTER */}
        <div className="p-4 border-t text-sm text-gray-600">
          Total {schools.length} sekolah
        </div>
      </div>

      {/* DEBUG BUTTON */}
      <div className="mt-4">
        <button
          onClick={() => {
            console.log('Schools data:', schools);
            alert(JSON.stringify(schools, null, 2));
          }}
          className="px-3 py-1 text-sm bg-gray-200 rounded"
        >
          Debug Data
        </button>
      </div>
    </div>
  );
}