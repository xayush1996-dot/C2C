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
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
      };

      const authLocal = localStorage.getItem("c2c_client_auth");
      const authCookie = getCookie("c2c_client_auth");

      const checkAuth = async () => {
        try {
          const token = localStorage.getItem("c2c_client_token");
          const res = await fetch("/api/auth/me", {
            headers: {
              "Authorization": token ? `Bearer ${token}` : "",
              "X-Requested-With": "XMLHttpRequest"
            },
            credentials: "include"
          });
          const data = await res.json();
          if (data.success) {
            setAuthorized(true);
          } else {
            router.push("/login");
          }
        } catch (err) {
          router.push("/login");
        }
      };
      checkAuth();
    }
  }, [router]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("c2c_client_token");
        const res = await fetch("/api/me/bookings", {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
            "X-Requested-With": "XMLHttpRequest"
          },
          credentials: "include"
        });
        const data = await res.json();
        if (data.success) {
          setBookings(data.bookings);
        }
      } catch (err) {
        console.error("Error loading bookings:", err);
      }
    };
    if (authorized) {
      fetchBookings();
    }
  }, [authorized]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("c2c_client_token");
      await fetch("/api/auth/logout", { 
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
    localStorage.removeItem("c2c_client_auth");
    localStorage.removeItem("c2c_client_token");
    router.push("/login");
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin" />
          <p className="text-xs text-text-secondary uppercase tracking-widest font-bold">Accessing your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary py-10 px-6 md:px-12 max-w-5xl mx-auto space-y-8 select-none">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-divider/50 pb-6">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-8 h-8 rounded-full bg-accent-gold flex items-center justify-center text-bg-base">
            <Sparkles size={16} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-text-primary">Welcome, Sarah Lin</h1>
            <p className="text-xs text-text-secondary mt-0.5">Your personal coaching space.</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-text-secondary hover:text-accent-gold transition-colors duration-200 flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut size={14} />
          Log Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Next Session (Span 2) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface rounded-[24px] p-6 border border-border-divider/60 shadow-xs space-y-6 text-left">
            <h3 className="font-serif text-lg font-bold text-text-primary flex items-center gap-2 border-b border-border-divider/30 pb-3">
              <Calendar size={18} className="text-accent-gold" /> Upcoming Appointment
            </h3>

            {bookings.length > 0 ? (
              (() => {
                const upcoming = bookings[bookings.length - 1];
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                    <div className="space-y-3">
                      <span className="px-2.5 py-1 rounded bg-accent-gold/10 text-accent-gold text-[9px] uppercase font-bold tracking-wider border border-accent-gold/25">
                        {upcoming.service}
                      </span>
                      <h4 className="font-serif text-xl font-bold text-text-primary">Session 1: Intake & Alignment</h4>
                      <p className="text-xs text-text-secondary leading-relaxed font-medium">
                        Focusing on mapping out executive barriers and designing boundaries around your product pivot.
                      </p>
                    </div>

                    {/* Time Details Panel */}
                    <div className="bg-bg-elevated/40 p-4 rounded-2xl border border-border-divider/50 space-y-3 text-xs">
                      <div className="flex items-center gap-2 text-text-primary">
                        <Calendar size={14} className="text-accent-gold" />
                        <span className="font-semibold">
                          {new Date(upcoming.date + "T12:00:00").toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-text-primary">
                        <Clock size={14} className="text-accent-gold" />
                        <span className="font-semibold">{upcoming.time} (GMT)</span>
                      </div>

                      {upcoming.meetActive ? (
                        <a
                          href="https://meet.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 bg-accent-gold hover:bg-accent-gold/90 text-bg-base text-[10px] uppercase font-bold tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer font-bold"
                        >
                          <Video size={12} />
                          Join Google Meet
                        </a>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 bg-bg-base/30 text-text-secondary/40 border border-border-divider text-[10px] uppercase font-bold tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed"
                        >
                          <Video size={12} />
                          Meet Link Disabled
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8 text-text-secondary/40 text-xs">
                No upcoming sessions scheduled.
              </div>
            )}
          </div>
 
          {/* Billing Log */}
          <div className="bg-surface rounded-[24px] p-6 border border-border-divider/60 shadow-xs space-y-4 text-left">
            <h3 className="font-serif text-lg font-bold text-text-primary flex items-center gap-2 border-b border-border-divider/30 pb-3">
              <CreditCard size={18} className="text-accent-gold" /> Invoices & Receipts
            </h3>
 
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-text-secondary/50 border-b border-border-divider/30 pb-2">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Service</th>
                    <th className="pb-2">Price Paid</th>
                    <th className="pb-2 text-right">Invoices</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-divider/30 text-text-secondary">
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td className="py-3 font-mono text-text-primary">{b.date}</td>
                      <td className="py-3 font-medium text-text-primary">{b.service} Setup fee</td>
                      <td className="py-3 font-semibold text-accent-gold">{b.paid}</td>
                      <td className="py-3 text-right">
                        <button className="text-[10px] font-bold text-accent-blue hover:underline inline-flex items-center gap-1 cursor-pointer">
                          <Download size={10} /> PDF Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-text-secondary/40">
                        No transactions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Shared Toolkits */}
        <div className="space-y-6 text-left">
          <div className="bg-surface rounded-[24px] p-6 border border-border-divider/60 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-text-primary flex items-center gap-2 border-b border-border-divider/30 pb-3">
              <FileText size={18} className="text-accent-gold" /> Diagnostic Library
            </h3>

            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5 p-2 bg-bg-elevated/40 rounded-xl border border-border-divider/50">
                <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-text-primary">Intake Survey Response</p>
                  <p className="text-[10px] text-text-secondary/60">Submitted Jul 5, 2026</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-2 bg-bg-elevated/40 rounded-xl border border-border-divider/50">
                <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-text-primary">NDA & Confidentiality Waiver</p>
                  <p className="text-[10px] text-text-secondary/60">Signed Jul 5, 2026</p>
                </div>
              </li>
              <li className="flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-bg-elevated/40 border border-transparent hover:border-border-divider/50 transition-all duration-300">
                <div className="flex items-start gap-2.5">
                  <FileText size={16} className="text-accent-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-text-primary">Habit Loops Tracking Sheet</p>
                    <p className="text-[10px] text-text-secondary/60">Download templates (1.2MB)</p>
                  </div>
                </div>
                <button className="p-1 rounded hover:bg-accent-gold/15 text-accent-gold cursor-pointer">
                  <Download size={14} />
                </button>
              </li>
            </ul>
          </div>

          {/* Need help support widget */}
          <div className="bg-surface rounded-[24px] p-5 border border-border-divider/60 text-text-primary space-y-3 relative overflow-hidden shadow-xs">
            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-4 translate-y-4">
              <HelpCircle size={100} className="text-accent-gold" />
            </div>
            <h4 className="font-serif text-base font-bold text-text-primary">Confidential Support</h4>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Have questions regarding scheduling thresholds or joint sessions? Contact Julius Thorne directly at <strong className="text-accent-gold font-semibold">julius@c2c.com</strong>.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
