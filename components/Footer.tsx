'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-2">
            © {currentYear} EduSmart - Sistem Manajemen Sekolah
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <span>Versi 1.0.0</span>
            <span>•</span>
            <a href="#" className="hover:text-blue-600">Kebijakan Privasi</a>
            <span>•</span>
            <a href="#" className="hover:text-blue-600">Syarat & Ketentuan</a>
            <span>•</span>
            <a href="mailto:support@edusmart.com" className="hover:text-blue-600">Bantuan</a>
          </div>
        </div>
      </div>
    </footer>
  );
}