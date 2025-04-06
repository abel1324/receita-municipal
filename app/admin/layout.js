'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigation = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Órgãos', href: '/admin/orgaos' },
    { name: 'Usuários', href: '/admin/usuarios' },
    { name: 'Tipos de Serviços', href: '/admin/tipos-servicos' },
    { name: 'Receitas', href: '/admin/receitas' },
    { name: 'Relatórios', href: '/admin/relatorios' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-xl font-bold">Receita Municipal</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        pathname === item.href
                          ? 'bg-blue-800 text-white'
                          : 'text-white hover:bg-blue-600'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Link
                href="/"
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Voltar para Home
              </Link>
            </div>
          </div>
        </div>
        
        {/* Menu móvel */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href
                    ? 'bg-blue-800 text-white'
                    : 'text-white hover:bg-blue-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 