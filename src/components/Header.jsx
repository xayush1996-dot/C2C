"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, User, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { useBooking } from "@/context/BookingContext";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { openBooking } = useBooking();

  // Authentication states
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Don't show public header on admin route
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check auth cookies on mount and route changes
  useEffect(() => {
    const getCookie = (name) => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    const clientAuth = getCookie("c2c_client_auth") === "true";
    const adminAuth = getCookie("c2c_auth") === "true";

    setIsClientLoggedIn(clientAuth);
    setIsAdminLoggedIn(adminAuth);
    setDropdownOpen(false);
  }, [pathname]);

  const handleHeaderLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error", e);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("c2c_auth");
      localStorage.removeItem("c2c_client_auth");
    }
    setIsClientLoggedIn(false);
    setIsAdminLoggedIn(false);
    setDropdownOpen(false);
    router.push("/login");
  };

  if (isAdmin) return null;

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-cream/80 backdrop-blur-md border-b border-rust/10 py-4 shadow-sm"
          : "bg-cream py-6 border-b border-transparent"
      }`}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-full bg-rust flex items-center justify-center text-cream shadow-sm group-hover:scale-105 transition-transform duration-300">
            <Sparkles size={16} className="stroke-[2.5]" />
          </div>
          <span className="font-serif text-lg md:text-xl font-bold tracking-tight text-charcoal group-hover:text-rust transition-colors duration-300">
            Confusion to Clarity
          </span>
        </Link>

        {/* Action Items - Exactly Two Elements (or Profile Dropdown + CTA) */}
        <div className="flex items-center space-x-6 md:space-x-8 relative">
          
          {isClientLoggedIn || isAdminLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-1.5 focus:outline-none cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-rust/10 border border-rust/20 flex items-center justify-center text-rust group-hover:bg-rust group-hover:text-cream transition-all duration-300 shadow-xs">
                  <User size={15} />
                </div>
                <span className="text-xs font-semibold text-charcoal/70 group-hover:text-rust transition-colors">
                  {isAdminLoggedIn ? "Admin" : "Sarah"}
                </span>
                <ChevronDown 
                  size={14} 
                  className={`text-charcoal/40 group-hover:text-rust transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} 
                />
              </button>

              {/* Profile Dropdown Card */}
              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    {/* Clicking outside close dropdown click catcher */}
                    <div 
                      className="fixed inset-0 z-45"
                      onClick={() => setDropdownOpen(false)}
                    />
                    
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-48 bg-white border border-rust/10 rounded-2xl shadow-md p-1.5 z-50 origin-top-right"
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      <Link
                        href={isAdminLoggedIn ? "/admin" : "/client"}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-charcoal/80 hover:bg-cream hover:text-rust transition-colors"
                      >
                        <LayoutDashboard size={14} />
                        Go to Portal
                      </Link>
                      <button
                        onClick={handleHeaderLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer text-left focus:outline-none"
                      >
                        <LogOut size={14} />
                        Log Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium tracking-wide text-charcoal/60 hover:text-rust transition-colors duration-200"
            >
              Login
            </Link>
          )}

          <motion.button
            onClick={() => openBooking()}
            className="px-6 py-2.5 bg-charcoal hover:bg-rust text-cream font-medium text-sm tracking-wide rounded-full shadow-sm cursor-pointer transition-colors duration-300 focus:outline-none"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Book a Call
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
