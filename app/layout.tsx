'use client';

import { usePathname } from 'next/navigation';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = pathname === '/login' || 
                    pathname === '/register' || 
                    pathname === '/forgot-password';

  if (!mounted) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {!isAuthPage && <Header />}
        
        <main className={isAuthPage ? '' : 'container mx-auto px-4 py-6'}>
          {children}
        </main>
        
        {!isAuthPage && <Footer />}
      </body>
    </html>
  );
}