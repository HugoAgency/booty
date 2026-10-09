'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Menu, X, Shield, Sparkles, PhoneCall } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { totalCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-sm transition-all">
      {/* Top promotional bar */}
      <div className="bg-gradient-to-r from-brand-600 via-brand-primary to-rose-500 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>توصيل سريع ومجاني لجميع الطلبات في المملكة ودول الخليج | Free Express Delivery</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile hamburger button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:text-brand-600 hover:bg-rose-50 transition"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-36 sm:w-44 h-12 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/images/logo.jpg"
                  alt="THE BOOTY REPUBLIC"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-gray-700">
            <Link
              href="/"
              className="hover:text-brand-600 transition-colors py-1 border-b-2 border-transparent hover:border-brand-600"
            >
              الرئيسية / Home
            </Link>
            <Link
              href="/#products"
              className="hover:text-brand-600 transition-colors py-1 border-b-2 border-transparent hover:border-brand-600"
            >
              المنتجات / Products
            </Link>
            <Link
              href="/#why-us"
              className="hover:text-brand-600 transition-colors py-1 border-b-2 border-transparent hover:border-brand-600"
            >
              لماذا نحن / Why Us
            </Link>
            <Link
              href="/#faq"
              className="hover:text-brand-600 transition-colors py-1 border-b-2 border-transparent hover:border-brand-600"
            >
              الأسئلة الشائعة / FAQ
            </Link>
          </nav>

          {/* Actions: Admin link + Cart button */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 px-2.5 py-1.5 rounded-md hover:bg-rose-50 transition"
              title="لوحة الإدارة / Admin"
            >
              <Shield className="w-4 h-4" />
              <span>الإدارة / Admin</span>
            </Link>

            {/* Shopping Cart button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full bg-brand-soft text-brand-700 hover:bg-brand-100 hover:text-brand-800 transition duration-200 flex items-center justify-center shadow-sm"
              aria-label="سلة المشتريات"
            >
              <ShoppingBag className="w-5 h-5 text-brand-600" />
              {totalCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-brand-600 to-rose-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {totalCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-rose-100 bg-white px-4 pt-3 pb-6 space-y-3 animate-in fade-in duration-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600"
          >
            الرئيسية / Home
          </Link>
          <Link
            href="/#products"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600"
          >
            المنتجات / Products
          </Link>
          <Link
            href="/#why-us"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600"
          >
            لماذا نحن / Why Us
          </Link>
          <Link
            href="/#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600"
          >
            الأسئلة الشائعة / FAQ
          </Link>
          <div className="pt-2 border-t border-rose-100">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-brand-600"
            >
              <Shield className="w-4 h-4" />
              <span>دخول الإدارة / Admin Portal</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
