"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Download,
  CreditCard,
  LogOut,
  Sparkles,
  CheckCircle,
  HelpCircle
} from "lucide-react";

export default function ClientPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("c2c_client_auth");
      if (auth === "true") {
        setAuthorized(true);
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("c2c_client_auth");
    router.push("/login");
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-rust/30 border-t-rust rounded-full animate-spin" />
          <p className="text-xs text-charcoal/50 uppercase tracking-widest font-bold">Accessing your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-10 px-6 md:px-12 max-w-5xl mx-auto space-y-8">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-rust/10 pb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-rust flex items-center justify-center text-cream">
            <Sparkles size={16} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-charcoal">Welcome, Sarah Lin</h1>
            <p className="text-xs text-charcoal/50 mt-0.5">Your personal coaching space.</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-charcoal/60 hover:text-rust transition-colors duration-200 flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut size={14} />
          Log Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Next Session (Span 2) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-rust/10 shadow-xs space-y-6">
            <h3 className="font-serif text-lg font-bold text-charcoal flex items-center gap-2 border-b border-rust/5 pb-3">
              <Calendar size={18} className="text-rust" /> Upcoming Appointment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <span className="px-2.5 py-1 rounded bg-rust/10 text-rust text-[9px] uppercase font-bold tracking-wider">
                  Clarity Call
                </span>
                <h4 className="font-serif text-xl font-bold text-charcoal">Session 1: Intake & Alignment</h4>
                <p className="text-xs text-charcoal/60 leading-relaxed">
                  Focusing on mapping out executive barriers and designing boundaries around your product pivot.
                </p>
              </div>

              {/* Time Details Panel */}
              <div className="bg-cream/40 p-4 rounded-2xl border border-rust/5 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-charcoal/80">
                  <Calendar size={14} className="text-rust" />
                  <span className="font-semibold">Wednesday, July 8, 2026</span>
                </div>
                <div className="flex items-center gap-2 text-charcoal/80">
                  <Clock size={14} className="text-rust" />
                  <span className="font-semibold">01:00 PM — 02:00 PM (GMT)</span>
                </div>

                <a
                  href="https://meet.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-rust hover:bg-charcoal text-cream text-[10px] uppercase font-bold tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <Video size={12} />
                  Join Google Meet
                </a>
              </div>
            </div>
          </div>

          {/* Billing Log */}
          <div className="bg-white rounded-3xl p-6 border border-rust/10 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-charcoal flex items-center gap-2 border-b border-rust/5 pb-3">
              <CreditCard size={18} className="text-rust" /> Invoices & Receipts
            </h3>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-charcoal/50 border-b border-rust/5 pb-2">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Service</th>
                    <th className="pb-2">Price Paid</th>
                    <th className="pb-2 text-right">Invoices</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rust/5 text-charcoal/80">
                  <tr>
                    <td className="py-3 font-mono">2026-07-05</td>
                    <td className="py-3 font-medium">Clarity Call Setup fee</td>
                    <td className="py-3 font-semibold">$149.00</td>
                    <td className="py-3 text-right">
                      <button className="text-[10px] font-bold text-rust hover:underline inline-flex items-center gap-1 cursor-pointer">
                        <Download size={10} /> PDF Receipt
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Shared Toolkits */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-rust/10 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-charcoal flex items-center gap-2 border-b border-rust/5 pb-3">
              <FileText size={18} className="text-rust" /> Diagnostic Library
            </h3>

            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5 p-2 bg-cream/20 rounded-xl border border-rust/5">
                <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-charcoal">Intake Survey Response</p>
                  <p className="text-[10px] text-charcoal/50">Submitted Jul 5, 2026</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-2 bg-cream/20 rounded-xl border border-rust/5">
                <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-charcoal">NDA & Confidentiality Waiver</p>
                  <p className="text-[10px] text-charcoal/50">Signed Jul 5, 2026</p>
                </div>
              </li>
              <li className="flex items-start justify-between items-center gap-2.5 p-2 rounded-xl hover:bg-cream/20 transition-colors">
                <div className="flex items-start gap-2.5">
                  <FileText size={16} className="text-rust shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-charcoal">Habit Loops Tracking Worksheet</p>
                    <p className="text-[10px] text-charcoal/50">Download templates (1.2MB)</p>
                  </div>
                </div>
                <button className="p-1 rounded hover:bg-rust/10 text-rust cursor-pointer">
                  <Download size={14} />
                </button>
              </li>
            </ul>
          </div>

          {/* Need help support widget */}
          <div className="bg-gradient-to-tr from-charcoal to-[#2a2321] rounded-3xl p-5 border border-rust/10 text-cream space-y-3 relative overflow-hidden shadow-xs">
            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-4 translate-y-4">
              <HelpCircle size={100} />
            </div>
            <h4 className="font-serif text-base font-bold">Confidential Support</h4>
            <p className="text-[11px] text-cream/70 leading-relaxed">
              Have questions regarding scheduling thresholds or joint sessions? Contact Julius Thorne directly at <strong className="text-rust">julius@c2c.com</strong>.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
