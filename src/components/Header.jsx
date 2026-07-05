"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useBooking } from "@/context/BookingContext";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { openBooking } = useBooking();

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

        {/* Action Items - Exactly Two Elements */}
        <div className="flex items-center space-x-6 md:space-x-8">
          <Link
            href="/login"
            className="text-sm font-medium tracking-wide text-charcoal/60 hover:text-rust transition-colors duration-200"
          >
            Login
          </Link>
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
