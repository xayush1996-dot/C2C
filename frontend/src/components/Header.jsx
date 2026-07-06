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
  const [clientName, setClientName] = useState("Client");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("#hero");

  // Don't show public header on admin route
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActiveHash(window.location.hash || "#hero");
      const handleHashChange = () => {
        setActiveHash(window.location.hash || "#hero");
      };
      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, []);

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

    const clientAuth = getCookie("c2c_client_auth") === "true" || (typeof window !== "undefined" && localStorage.getItem("c2c_client_auth") === "true");
    const adminAuth = getCookie("c2c_auth") === "true" || (typeof window !== "undefined" && localStorage.getItem("c2c_auth") === "true");

    setIsClientLoggedIn(clientAuth);
    setIsAdminLoggedIn(adminAuth);
    setDropdownOpen(false);

    if (clientAuth && typeof window !== "undefined") {
      const storedName = localStorage.getItem("c2c_client_name");
      if (storedName) {
        setClientName(storedName);
      } else {
        const token = localStorage.getItem("c2c_client_token");
        if (token) {
          fetch("/api/auth/me", {
            headers: {
              "Authorization": `Bearer ${token}`,
              "X-Requested-With": "XMLHttpRequest"
            },
            credentials: "include"
          })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.user && data.user.name) {
              setClientName(data.user.name);
              localStorage.setItem("c2c_client_name", data.user.name);
            }
          })
          .catch(err => console.error("Error retrieving name from backend:", err));
        }
      }
    }
  }, [pathname]);

  const handleHeaderLogout = async () => {
    try {
      const token = localStorage.getItem("c2c_client_token") || localStorage.getItem("c2c_token");
      const isClient = localStorage.getItem("c2c_client_token") !== null;
      const endpoint = isClient ? "/api/auth/logout" : "/api/admin/auth/logout";
      await fetch(endpoint, { 
        method: "POST",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include"
      });
    } catch (e) {
      console.error("Logout error", e);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("c2c_auth");
      localStorage.removeItem("c2c_client_auth");
      localStorage.removeItem("c2c_token");
      localStorage.removeItem("c2c_client_token");
      localStorage.removeItem("c2c_client_name");
    }
    setIsClientLoggedIn(false);
    setIsAdminLoggedIn(false);
    setClientName("Client");
    setDropdownOpen(false);
    router.push("/login");
  };

  if (isAdmin) return null;

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-bg-base/80 backdrop-blur-md border-b border-border-divider/50 py-4 shadow-sm"
          : "bg-transparent py-6 border-b border-transparent"
      }`}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-full bg-text-primary flex items-center justify-center text-bg-base shadow-sm group-hover:scale-105 transition-transform duration-300">
            <Sparkles size={16} className="stroke-[2.5]" />
          </div>
          <span className="font-serif text-lg md:text-xl font-bold tracking-tight text-text-primary group-hover:text-text-secondary transition-colors duration-300">
            Confusion to Clarity
          </span>
        </Link>

        {/* Central Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 bg-surface/50 border border-border-divider rounded-full px-1.5 py-1 select-none">
          {[
            { name: "Home", href: "/" },
            { name: "About", href: "/#why-choose-us" },
            { name: "Programs", href: "/#services" },
            { name: "Success Stories", href: "/#testimonials" },
            { name: "Contact", href: "/#contact" }
          ].map((item) => {
            const itemHash = item.href.includes("#") ? item.href.substring(item.href.indexOf("#")) : "#hero";
            const isActive = activeHash === itemHash;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${
                  isActive
                    ? "bg-[#1A1D26] text-accent-gold border border-accent-gold/30"
                    : "text-text-secondary hover:text-accent-gold border border-transparent"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Items - Profile / Login + CTA */}
        <div className="flex items-center space-x-6 md:space-x-8 relative">
          
          {isClientLoggedIn || isAdminLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-1.5 focus:outline-none cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-surface-hover border border-border-divider flex items-center justify-center text-text-primary group-hover:bg-text-primary group-hover:text-bg-base transition-all duration-300 shadow-xs">
                  <User size={15} />
                </div>
                <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
                  {isAdminLoggedIn ? "Admin" : clientName}
                </span>
                <ChevronDown 
                  size={14} 
                  className={`text-text-secondary/40 group-hover:text-text-primary transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} 
                />
              </button>

              {/* Profile Dropdown Card */}
              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-45"
                      onClick={() => setDropdownOpen(false)}
                    />
                    
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-48 bg-bg-elevated border border-border-divider rounded-2xl shadow-md p-1.5 z-50 origin-top-right"
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      <Link
                        href={isAdminLoggedIn ? "/admin" : "/client"}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
                      >
                        <LayoutDashboard size={14} />
                        Go to Portal
                      </Link>
                      <button
                        onClick={handleHeaderLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer text-left focus:outline-none"
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
              className="text-sm font-medium tracking-wide text-text-secondary hover:text-accent-gold transition-colors duration-200"
            >
              Login
            </Link>
          )}

          <motion.button
            onClick={() => openBooking()}
            className="px-6 py-2.5 bg-accent-gold hover:bg-accent-gold/90 text-bg-base font-bold text-xs uppercase tracking-wider rounded-full shadow-sm cursor-pointer transition-colors duration-300 focus:outline-none"
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
