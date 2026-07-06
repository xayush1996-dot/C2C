"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Mail, Shield, Scale, Grid } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return null;

  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-cream border-t border-rust/10 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-rust flex items-center justify-center text-cream">
                <Sparkles size={14} className="stroke-[2.5]" />
              </div>
              <span className="font-serif text-lg font-bold tracking-tight text-charcoal">
                Confusion to Clarity
              </span>
            </div>
            <p className="text-charcoal/70 text-sm max-w-sm leading-relaxed">
              Helping Students & Young Professionals Build a Foundation for Sustainable Success. Tailored mentorship, group workshops, and 1-on-1 private coaching.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal/50">
              Programs
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#services" className="text-sm text-charcoal/80 hover:text-rust transition-colors duration-200">
                  Emotional Intelligence (EQ)
                </a>
              </li>
              <li>
                <a href="#services" className="text-sm text-charcoal/80 hover:text-rust transition-colors duration-200">
                  Soft Skills & Leadership
                </a>
              </li>
              <li>
                <a href="#services" className="text-sm text-charcoal/80 hover:text-rust transition-colors duration-200">
                  Public Speaking & Personality
                </a>
              </li>
              <li>
                <a href="#services" className="text-sm text-charcoal/80 hover:text-rust transition-colors duration-200">
                  Career Readiness & Placement
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / Access Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal/50">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privacy" className="text-sm text-charcoal/80 hover:text-rust transition-colors duration-200 inline-flex items-center gap-1.5">
                  <Shield size={14} className="opacity-75" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-charcoal/80 hover:text-rust transition-colors duration-200 inline-flex items-center gap-1.5">
                  <Scale size={14} className="opacity-75" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-sm text-charcoal/80 hover:text-rust transition-colors duration-200 inline-flex items-center gap-1.5">
                  <Grid size={14} className="opacity-75" />
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-rust/10 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-charcoal/50 gap-4">
          <p>© {currentYear} Confusion to Clarity. All rights reserved.</p>
          <p className="flex items-center space-x-1">
            <span>Designed for visual excellence.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
