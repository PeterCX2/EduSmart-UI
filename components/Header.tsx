'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
  roles: { id: number; name: string }[];
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const userRole = user?.roles?.[0]?.name || 'Unknown';
  const isAdmin = userRole === 'super-admin' || userRole === 'admin';
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
              {(isAdmin) && (
                <Link href="/schools" className="text-gray-700 hover:text-blue-600 font-medium">
                  Sekolah
                </Link>
              )}

              <Link href="/subjects" className="text-gray-700 hover:text-blue-600 font-medium">
                Mata Pelajaran
              </Link>

              <Link href="/assignments" className="text-gray-700 hover:text-blue-600 font-medium">
                Tugas
              </Link>

              <Link href="/submissions" className="text-gray-700 hover:text-blue-600 font-medium">
                Pengumpulan
              </Link>

              {isAdmin && (
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
            {user ? (
              <>
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
              </>
            ) : (
              <Link href="/login" className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium rounded-md border border-blue-200">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}