'use client';

import { useState, useEffect } from 'react';
import { login } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  // CEK JIKA SUDAH LOGIN, REDIRECT SEKALI SAJA
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('✅ Already logged in, redirecting...');
      window.location.href = '/schools';
    } else {
      setIsChecking(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success) {
      console.log('✅ Login successful, redirecting...');
      // TUNGGU SEBENTAR LALU REDIRECT
      setTimeout(() => {
        window.location.href = '/schools';
      }, 100);
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  // TAMPILKAN LOADING SELAGI CHECKING
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            EduSmart Login
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Aplikasi Pengumpulan Tugas
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="superadmin@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        {/* Debug button */}
        <div className="text-center">
          <button
            onClick={() => {
              console.log('🔍 Current localStorage:');
              console.log('Token:', localStorage.getItem('token'));
              console.log('User:', localStorage.getItem('user'));
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Debug LocalStorage
          </button>
        </div>
      </div>
    </div>
  );
}