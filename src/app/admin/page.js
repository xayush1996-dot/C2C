"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Users, 
  CreditCard, 
  BarChart3, 
  ArrowLeft, 
  Sparkles, 
  Video, 
  VideoOff, 
  Search, 
  Download, 
  Calendar, 
  CheckCircle,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
      };

      const authLocal = localStorage.getItem("c2c_auth");
      const authCookie = getCookie("c2c_auth");

      if (authLocal === "true" || authCookie === "true") {
        setAuthorized(true);
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  const [activeTab, setActiveTab] = useState("overview"); // overview, enquiries, ledger, reports
  const [enquiries, setEnquiries] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookingsRes = await fetch("/api/bookings");
        const bookingsData = await bookingsRes.json();
        if (bookingsData.success) {
          setTransactions(bookingsData.bookings);
        }

        const enquiriesRes = await fetch("/api/enquiries");
        const enquiriesData = await enquiriesRes.json();
        if (enquiriesData.success) {
          setEnquiries(enquiriesData.enquiries);
        }
      } catch (err) {
        console.error("Error loading data from API:", err);
      }
    };
    if (authorized) {
      fetchData();
    }
  }, [authorized]);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter settings for reports
  const [selectedService, setSelectedService] = useState("all");
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-07-31");
  
  // Simulated download state
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Toggle Google Meet Link status
  const toggleMeetLink = async (id) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    const newStatus = !transaction.meetActive;

    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, meetActive: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(
          transactions.map((tx) =>
            tx.id === id ? { ...tx, meetActive: newStatus } : tx
          )
        );
      }
    } catch (e) {
      console.error("Failed to update meet status", e);
    }
  };

  // Toggle Enquiry Status
  const toggleEnquiryStatus = async (id) => {
    const enquiry = enquiries.find(e => e.id === id);
    if (!enquiry) return;
    const nextStatus = enquiry.status === "New" ? "Read" : enquiry.status === "Read" ? "Replied" : "New";

    try {
      const res = await fetch("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries(
          enquiries.map((enq) =>
            enq.id === id ? { ...enq, status: nextStatus } : enq
          )
        );
      }
    } catch (e) {
      console.error("Failed to update enquiry status", e);
    }
  };

  // Simulate report download
  const handleDownloadPDF = () => {
    setDownloading(true);
    setDownloadSuccess(false);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    }, 2000);
  };

  // Filter tables
  const filteredEnquiries = enquiries.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(
    (t) =>
      (selectedService === "all" || t.service === selectedService) &&
      (t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!authorized) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin" />
          <p className="text-xs text-text-secondary uppercase tracking-widest font-bold">Verifying security clearances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col md:flex-row select-none">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-surface border-b md:border-b-0 md:border-r border-border-divider/60 flex flex-col justify-between py-6 px-4">
        <div className="space-y-8">
          {/* Logo & Access */}
          <div className="flex items-center space-x-2.5 px-2 text-left">
            <div className="w-8 h-8 rounded-full bg-accent-gold flex items-center justify-center text-bg-base">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="font-serif text-base font-bold tracking-tight text-text-primary block">C2C Dashboard</span>
              <span className="text-[10px] text-accent-gold font-bold uppercase tracking-wider">Internal access</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => { setActiveTab("overview"); setSearchTerm(""); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === "overview"
                  ? "bg-bg-elevated text-accent-gold border border-accent-gold/20 shadow-xs"
                  : "text-text-secondary hover:bg-bg-elevated/40 hover:text-text-primary"
              }`}
            >
              <BarChart3 size={16} />
              <span>Overview</span>
            </button>
            <button
              onClick={() => { setActiveTab("enquiries"); setSearchTerm(""); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === "enquiries"
                  ? "bg-bg-elevated text-accent-gold border border-accent-gold/20 shadow-xs"
                  : "text-text-secondary hover:bg-bg-elevated/40 hover:text-text-primary"
              }`}
            >
              <Users size={16} />
              <span>Enquiries ({enquiries.filter(e => e.status === "New").length})</span>
            </button>
            <button
              onClick={() => { setActiveTab("ledger"); setSearchTerm(""); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === "ledger"
                  ? "bg-bg-elevated text-accent-gold border border-accent-gold/20 shadow-xs"
                  : "text-text-secondary hover:bg-bg-elevated/40 hover:text-text-primary"
              }`}
            >
              <CreditCard size={16} />
              <span>Booking Ledger</span>
            </button>
            <button
              onClick={() => { setActiveTab("reports"); setSearchTerm(""); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === "reports"
                  ? "bg-bg-elevated text-accent-gold border border-accent-gold/20 shadow-xs"
                  : "text-text-secondary hover:bg-bg-elevated/40 hover:text-text-primary"
              }`}
            >
              <FileSpreadsheet size={16} />
              <span>Reports</span>
            </button>
          </nav>
        </div>

        {/* Exit link */}
        <div className="pt-6 border-t border-border-divider/50">
          <Link
            href="/"
            className="flex items-center space-x-2 text-xs font-semibold text-text-secondary hover:text-accent-gold transition-colors duration-200 px-2"
          >
            <ArrowLeft size={14} />
            <span>Return to Site</span>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full text-left">
        
        {/* Viewport Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-divider/50 pb-6">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-text-primary capitalize">
              {activeTab === "overview" && "Executive Summary"}
              {activeTab === "enquiries" && "Lead & Enquiries Hub"}
              {activeTab === "ledger" && "Transaction Ledger"}
              {activeTab === "reports" && "Reporting Panel"}
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Sandbox console for Confusion to Clarity frontend assets.
            </p>
          </div>

          {/* Quick Search for relevant tabs */}
          {(activeTab === "enquiries" || activeTab === "ledger") && (
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/40">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search database..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border-divider bg-surface text-text-primary focus:outline-none focus:border-accent-gold/40"
              />
            </div>
          )}
        </div>

        {/* 1. OVERVIEW VIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Numeric Highlight Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-surface p-6 rounded-2xl border border-border-divider/60 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-text-secondary">
                  <span className="text-xs uppercase font-bold tracking-wider">Gross Revenue</span>
                  <CreditCard size={18} className="text-accent-gold" />
                </div>
                <p className="font-serif text-3xl font-bold text-text-primary">$996.00</p>
                <span className="text-[10px] text-emerald-400 font-semibold">4 sandbox transactions completed</span>
              </div>

              <div className="bg-surface p-6 rounded-2xl border border-border-divider/60 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-text-secondary">
                  <span className="text-xs uppercase font-bold tracking-wider">Active Leads</span>
                  <Users size={18} className="text-accent-gold" />
                </div>
                <p className="font-serif text-3xl font-bold text-text-primary">
                  {enquiries.filter((e) => e.status === "New").length}
                </p>
                <span className="text-[10px] text-text-secondary">Awaiting executive response</span>
              </div>

              <div className="bg-surface p-6 rounded-2xl border border-border-divider/60 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-text-secondary">
                  <span className="text-xs uppercase font-bold tracking-wider">Active Meet Links</span>
                  <Video size={18} className="text-accent-gold" />
                </div>
                <p className="font-serif text-3xl font-bold text-text-primary">
                  {transactions.filter((t) => t.meetActive).length}
                </p>
                <span className="text-[10px] text-text-secondary font-medium">Configured in scheduling ledger</span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-surface rounded-2xl border border-border-divider/60 p-6 space-y-4">
              <h3 className="font-serif text-lg font-bold text-text-primary font-bold">Interactive sandbox guidelines</h3>
              <p className="text-xs text-text-secondary leading-relaxed font-medium">
                This dashboard visualizes incoming client queries and ledger transactions generated in the checkout funnel. Use the sidebar menu to toggle views. You can test interactive actions like switching Google Meet link statuses or simulating report exports.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab("enquiries")}
                  className="px-4 py-2 bg-accent-gold hover:bg-accent-gold/90 text-bg-base text-[10px] uppercase font-bold tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Manage Enquiries
                </button>
                <button
                  onClick={() => setActiveTab("ledger")}
                  className="px-4 py-2 border border-border-divider hover:border-accent-gold text-text-primary hover:text-accent-gold text-[10px] uppercase font-bold tracking-wider rounded-lg transition-colors cursor-pointer font-bold"
                >
                  Check Ledger
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. ENQUIRIES & LEAD MANAGEMENT VIEW */}
        {activeTab === "enquiries" && (
          <div className="bg-surface rounded-2xl border border-border-divider/60 overflow-hidden shadow-xs animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-elevated/40 border-b border-border-divider/50 text-[10px] uppercase tracking-wider font-bold text-text-secondary">
                    <th className="py-4 px-6">Client & Contact</th>
                    <th className="py-4 px-6">Message Excerpt</th>
                    <th className="py-4 px-6">Submitted Date</th>
                    <th className="py-4 px-6">Status Indicator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-divider/30 text-xs">
                  {filteredEnquiries.length > 0 ? (
                    filteredEnquiries.map((enq) => (
                      <tr key={enq.id} className="hover:bg-bg-elevated/20 transition-colors">
                        <td className="py-4 px-6 space-y-1">
                          <p className="font-bold text-text-primary">{enq.name}</p>
                          <p className="text-[10px] text-text-secondary/80 font-mono">{enq.email}</p>
                          <p className="text-[10px] text-text-secondary/70">{enq.phone}</p>
                        </td>
                        <td className="py-4 px-6 max-w-sm text-text-secondary leading-relaxed font-medium">
                          {enq.message}
                        </td>
                        <td className="py-4 px-6 text-text-secondary font-mono">
                          {enq.date}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => toggleEnquiryStatus(enq.id)}
                            className={`px-3 py-1.5 rounded-full font-bold text-[9px] uppercase tracking-wider cursor-pointer border ${
                              enq.status === "New"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                                : enq.status === "Read"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            }`}
                          >
                            {enq.status}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-text-secondary/40">
                        No submissions matched your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. TRANSACTION & BOOKING LEDGER VIEW */}
        {activeTab === "ledger" && (
          <div className="bg-surface rounded-2xl border border-border-divider/60 overflow-hidden shadow-xs animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-elevated/40 border-b border-border-divider/50 text-[10px] uppercase tracking-wider font-bold text-text-secondary">
                    <th className="py-4 px-6">Client Info</th>
                    <th className="py-4 px-6">Service Package</th>
                    <th className="py-4 px-6">Amount Paid</th>
                    <th className="py-4 px-6">Scheduled Slot</th>
                    <th className="py-4 px-6">Meet Link Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-divider/30 text-xs">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-bg-elevated/20 transition-colors">
                        <td className="py-4 px-6 space-y-0.5">
                          <p className="font-bold text-text-primary">{tx.name}</p>
                          <p className="text-[10px] text-text-secondary font-mono">{tx.email}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-text-primary">{tx.service}</span>
                        </td>
                        <td className="py-4 px-6 font-mono font-semibold text-accent-gold">
                          {tx.paid}
                        </td>
                        <td className="py-4 px-6 text-text-secondary">
                          <span className="block font-medium text-text-primary">{tx.date}</span>
                          <span className="text-[10px] text-text-secondary/70">{tx.time}</span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => toggleMeetLink(tx.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-colors duration-200 ${
                              tx.meetActive
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                            }`}
                          >
                            {tx.meetActive ? (
                              <>
                                <Video size={12} />
                                Active link
                              </>
                            ) : (
                              <>
                                <VideoOff size={12} />
                                Link disabled
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-text-secondary/40">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. REPORTING VIEW */}
        {activeTab === "reports" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Selection filters */}
            <div className="bg-surface rounded-2xl border border-border-divider/60 p-6 space-y-6 shadow-xs">
              <h3 className="font-serif text-lg font-bold text-text-primary border-b border-border-divider/50 pb-2">Filter Data Report</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Service Dropdown */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-text-secondary">Service Category:</label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-border-divider bg-bg-base/50 text-text-primary focus:outline-none focus:border-accent-gold/45"
                  >
                    <option value="all">All Packages</option>
                    <option value="Start Where You Are">Start Where You Are</option>
                    <option value="Clarity Call">Clarity Call</option>
                    <option value="Reset Programme">Reset Programme</option>
                    <option value="Couples' Conversations">Couples' Conversations</option>
                  </select>
                </div>

                {/* Date Picker Start */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-text-secondary">Start Date:</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/40">
                      <Calendar size={12} />
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs pl-8 pr-3.5 py-2 rounded-lg border border-border-divider bg-bg-base/50 text-text-primary focus:outline-none focus:border-accent-gold/45"
                    />
                  </div>
                </div>

                {/* Date Picker End */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-text-secondary">End Date:</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/40">
                      <Calendar size={12} />
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs pl-8 pr-3.5 py-2 rounded-lg border border-border-divider bg-bg-base/50 text-text-primary focus:outline-none focus:border-accent-gold/45"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="border-t border-border-divider/50 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[11px] text-text-secondary leading-relaxed flex items-center gap-1.5 max-w-md text-left font-medium">
                  <AlertCircle size={14} className="text-accent-gold shrink-0" />
                  Generating PDF pulls client profiles, schedule records, and transactions inside this range.
                </p>

                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="w-full sm:w-auto px-6 py-3 bg-accent-gold hover:bg-accent-gold/90 text-bg-base font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
                >
                  {downloading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                      Compiling PDF Report...
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      Download PDF Report
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Notification alert on success */}
            {downloadSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl flex items-start gap-3 text-xs animate-fadeIn text-left">
                <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Export Complete</p>
                  <p className="text-emerald-300/80 mt-0.5 font-medium">
                    Your financial and booking report was compiled. File <strong className="font-semibold text-text-primary">confusion_to_clarity_report.pdf</strong> (24KB) was simulated and sent to downloads.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
