'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  roles: { id: number; name: string }[];
  school_id?: number;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // JIKA DI HALAMAN LOGIN, JANGAN TAMPILKAN HEADER
  if (pathname === '/login') {
    return null;
  }

  if (!mounted) {
    return null; // Atau loading skeleton
  }

  if (!user) {
    return null; // Tidak tampilkan header jika belum login
  }

  const userRole = user?.roles?.[0]?.name || '';
  const isSuperAdmin = userRole === 'super-admin';
  const isTeacher = userRole === 'teacher';
  const isStudent = userRole === 'student';

  const roleColors: Record<string, string> = {
    'super-admin': 'bg-red-100 text-red-800',
    'admin': 'bg-purple-100 text-purple-800',
    'teacher': 'bg-blue-100 text-blue-800',
    'student': 'bg-green-100 text-green-800',
  };

  return (
    <header className="bg-white shadow border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex items-center space-x-8">
            <h1 className="ml-2 text-xl font-bold text-gray-800">EduSmart</h1>

            <nav className="hidden md:flex items-center space-x-6">
              {isSuperAdmin && (
                <Link href="/schools" className="text-gray-700 hover:text-blue-600 font-medium">
                  Sekolah
                </Link>
              )}

              {(isSuperAdmin || isTeacher || isStudent) && (
                <Link href="/subjects" className="text-gray-700 hover:text-blue-600 font-medium">
                  Mata Pelajaran
                </Link>
              )}

              {(isSuperAdmin || isTeacher || isStudent) && (
                <Link href="/assignments" className="text-gray-700 hover:text-blue-600 font-medium">
                  Tugas
                </Link>
              )}

              {(isSuperAdmin || isTeacher) && (
                <Link href="/submissions" className="text-gray-700 hover:text-blue-600 font-medium">
                  Pengumpulan
                </Link>
              )}

              {isSuperAdmin && (
                <>
                  <Link href="/users" className="text-gray-700 hover:text-blue-600 font-medium">
                    Pengguna
                  </Link>
                  <Link href="/roles" className="text-gray-700 hover:text-blue-600 font-medium">
                    Roles
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[userRole] || 'bg-gray-100 text-gray-800'}`}>
                {userRole}
              </div>
            </div>

            <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium rounded-md border border-red-200">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}