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

// Mock Enquiries
const initialEnquiries = [
  { id: 1, name: "Clarissa Vance", email: "clarissa@vancecorp.com", phone: "+1 (555) 234-5678", message: "Interested in the Reset Programme for our leadership team. Need details on tailoring features.", date: "2026-07-05", status: "New" },
  { id: 2, name: "Marcus Stone", email: "mstone@stonebuilders.io", phone: "+1 (555) 876-5432", message: "Inquiry about Couples' Conversations. Do both partners need to complete questionnaires separately?", date: "2026-07-04", status: "Read" },
  { id: 3, name: "Lina Alvarez", email: "alvarez.l@uxdesign.net", phone: "+1 (555) 901-2345", message: "URGENT: Booking a Clarity Call for tomorrow if slot is open.", date: "2026-07-04", status: "New" },
  { id: 4, name: "Robert Chen", email: "robert.c@venturecap.org", phone: "+1 (555) 345-6789", message: "General inquiry on your NDA and confidentiality protocol.", date: "2026-07-02", status: "Replied" }
];

// Mock Transaction Ledger
const initialTransactions = [
  { id: 1, name: "Sarah Lin", email: "sarah.lin@producthub.co", service: "Clarity Call", paid: "$149", date: "2026-07-08", time: "01:00 PM", meetActive: true },
  { id: 2, name: "Marc Henderson", email: "m.henderson@cloudlabs.net", service: "Reset Programme", paid: "$499", date: "2026-07-10", time: "09:00 AM", meetActive: true },
  { id: 3, name: "David & Elena R.", email: "elena@veloce.design", service: "Couples' Conversations", paid: "$249", date: "2026-07-12", time: "03:30 PM", meetActive: false },
  { id: 4, name: "Jonathan Wilde", email: "j.wilde@wildemedia.co", service: "Start Where You Are", paid: "$99", date: "2026-07-14", time: "10:30 AM", meetActive: true }
];

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
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [transactions, setTransactions] = useState(initialTransactions);
  
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
  const toggleMeetLink = (id) => {
    setTransactions(
      transactions.map((tx) =>
        tx.id === id ? { ...tx, meetActive: !tx.meetActive } : tx
      )
    );
  };

  // Toggle Enquiry Status
  const toggleEnquiryStatus = (id) => {
    setEnquiries(
      enquiries.map((enq) => {
        if (enq.id === id) {
          const nextStatus = enq.status === "New" ? "Read" : enq.status === "Read" ? "Replied" : "New";
          return { ...enq, status: nextStatus };
        }
        return enq;
      })
    );
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-rust/30 border-t-rust rounded-full animate-spin" />
          <p className="text-xs text-charcoal/50 uppercase tracking-widest font-bold">Verifying security clearances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-charcoal flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-rust/10 flex flex-col justify-between py-6 px-4">
        <div className="space-y-8">
          {/* Logo & Access */}
          <div className="flex items-center space-x-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-rust flex items-center justify-center text-cream">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="font-serif text-base font-bold tracking-tight text-charcoal block">C2C Dashboard</span>
              <span className="text-[10px] text-rust font-bold uppercase tracking-wider">Internal access</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => { setActiveTab("overview"); setSearchTerm(""); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === "overview"
                  ? "bg-cream text-rust"
                  : "text-charcoal/60 hover:bg-cream/40 hover:text-charcoal"
              }`}
            >
              <BarChart3 size={16} />
              <span>Overview</span>
            </button>
            <button
              onClick={() => { setActiveTab("enquiries"); setSearchTerm(""); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === "enquiries"
                  ? "bg-cream text-rust"
                  : "text-charcoal/60 hover:bg-cream/40 hover:text-charcoal"
              }`}
            >
              <Users size={16} />
              <span>Enquiries ({enquiries.filter(e => e.status === "New").length})</span>
            </button>
            <button
              onClick={() => { setActiveTab("ledger"); setSearchTerm(""); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === "ledger"
                  ? "bg-cream text-rust"
                  : "text-charcoal/60 hover:bg-cream/40 hover:text-charcoal"
              }`}
            >
              <CreditCard size={16} />
              <span>Booking Ledger</span>
            </button>
            <button
              onClick={() => { setActiveTab("reports"); setSearchTerm(""); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === "reports"
                  ? "bg-cream text-rust"
                  : "text-charcoal/60 hover:bg-cream/40 hover:text-charcoal"
              }`}
            >
              <FileSpreadsheet size={16} />
              <span>Reports</span>
            </button>
          </nav>
        </div>

        {/* Exit link */}
        <div className="pt-6 border-t border-rust/5">
          <Link
            href="/"
            className="flex items-center space-x-2 text-xs font-semibold text-charcoal/60 hover:text-rust transition-colors duration-200 px-2"
          >
            <ArrowLeft size={14} />
            <span>Return to Site</span>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* Viewport Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-rust/10 pb-6">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-charcoal capitalize">
              {activeTab === "overview" && "Executive Summary"}
              {activeTab === "enquiries" && "Lead & Enquiries Hub"}
              {activeTab === "ledger" && "Transaction Ledger"}
              {activeTab === "reports" && "Reporting Panel"}
            </h2>
            <p className="text-xs text-charcoal/50 mt-1">
              Sandbox console for Confusion to Clarity frontend assets.
            </p>
          </div>

          {/* Quick Search for relevant tabs */}
          {(activeTab === "enquiries" || activeTab === "ledger") && (
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal/40">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search database..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-rust/20 bg-white focus:outline-none focus:border-rust"
              />
            </div>
          )}
        </div>

        {/* 1. OVERVIEW VIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Numeric Highlight Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-rust/10 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-charcoal/50">
                  <span className="text-xs uppercase font-bold tracking-wider">Gross Revenue</span>
                  <CreditCard size={18} className="text-rust" />
                </div>
                <p className="font-serif text-3xl font-bold text-charcoal">$996.00</p>
                <span className="text-[10px] text-emerald-600 font-semibold">4 sandbox transactions completed</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-rust/10 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-charcoal/50">
                  <span className="text-xs uppercase font-bold tracking-wider">Active Leads</span>
                  <Users size={18} className="text-rust" />
                </div>
                <p className="font-serif text-3xl font-bold text-charcoal">
                  {enquiries.filter((e) => e.status === "New").length}
                </p>
                <span className="text-[10px] text-charcoal/50">Awaiting executive response</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-rust/10 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-charcoal/50">
                  <span className="text-xs uppercase font-bold tracking-wider">Active Meet Links</span>
                  <Video size={18} className="text-rust" />
                </div>
                <p className="font-serif text-3xl font-bold text-charcoal">
                  {transactions.filter((t) => t.meetActive).length}
                </p>
                <span className="text-[10px] text-charcoal/50">Configured in scheduling ledger</span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white rounded-2xl border border-rust/10 p-6 space-y-4">
              <h3 className="font-serif text-lg font-bold text-charcoal">Interactive sandbox guidelines</h3>
              <p className="text-xs text-charcoal/70 leading-relaxed">
                This dashboard visualizes incoming client queries and ledger transactions generated in the checkout funnel. Use the sidebar menu to toggle views. You can test interactive actions like switching Google Meet link statuses or simulating report exports.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab("enquiries")}
                  className="px-4 py-2 bg-charcoal hover:bg-rust text-cream text-[10px] uppercase font-bold tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Manage Enquiries
                </button>
                <button
                  onClick={() => setActiveTab("ledger")}
                  className="px-4 py-2 border border-rust/20 hover:border-rust text-charcoal hover:text-rust text-[10px] uppercase font-bold tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Check Ledger
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. ENQUIRIES & LEAD MANAGEMENT VIEW */}
        {activeTab === "enquiries" && (
          <div className="bg-white rounded-2xl border border-rust/10 overflow-hidden shadow-xs animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-cream/40 border-b border-rust/10 text-[10px] uppercase tracking-wider font-bold text-charcoal/60">
                    <th className="py-4 px-6">Client & Contact</th>
                    <th className="py-4 px-6">Message Excerpt</th>
                    <th className="py-4 px-6">Submitted Date</th>
                    <th className="py-4 px-6">Status Indicator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rust/5 text-xs">
                  {filteredEnquiries.length > 0 ? (
                    filteredEnquiries.map((enq) => (
                      <tr key={enq.id} className="hover:bg-cream/10 transition-colors">
                        <td className="py-4 px-6 space-y-1">
                          <p className="font-bold text-charcoal">{enq.name}</p>
                          <p className="text-[10px] text-charcoal/60">{enq.email}</p>
                          <p className="text-[10px] text-charcoal/50">{enq.phone}</p>
                        </td>
                        <td className="py-4 px-6 max-w-sm text-charcoal/70 leading-relaxed">
                          {enq.message}
                        </td>
                        <td className="py-4 px-6 text-charcoal/60 font-mono">
                          {enq.date}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => toggleEnquiryStatus(enq.id)}
                            className={`px-3 py-1.5 rounded-full font-bold text-[9px] uppercase tracking-wider cursor-pointer border ${
                              enq.status === "New"
                                ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                                : enq.status === "Read"
                                ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {enq.status}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-charcoal/40">
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
          <div className="bg-white rounded-2xl border border-rust/10 overflow-hidden shadow-xs animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-cream/40 border-b border-rust/10 text-[10px] uppercase tracking-wider font-bold text-charcoal/60">
                    <th className="py-4 px-6">Client Info</th>
                    <th className="py-4 px-6">Service Package</th>
                    <th className="py-4 px-6">Amount Paid</th>
                    <th className="py-4 px-6">Scheduled Slot</th>
                    <th className="py-4 px-6">Meet Link Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rust/5 text-xs">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-cream/10 transition-colors">
                        <td className="py-4 px-6 space-y-0.5">
                          <p className="font-bold text-charcoal">{tx.name}</p>
                          <p className="text-[10px] text-charcoal/60 font-mono">{tx.email}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-charcoal">{tx.service}</span>
                        </td>
                        <td className="py-4 px-6 font-mono font-semibold text-charcoal">
                          {tx.paid}
                        </td>
                        <td className="py-4 px-6 text-charcoal/70">
                          <span className="block font-medium">{tx.date}</span>
                          <span className="text-[10px] text-charcoal/50">{tx.time}</span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => toggleMeetLink(tx.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-colors duration-200 ${
                              tx.meetActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
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
                      <td colSpan="5" className="py-8 text-center text-charcoal/40">
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
            <div className="bg-white rounded-2xl border border-rust/10 p-6 space-y-6 shadow-xs">
              <h3 className="font-serif text-lg font-bold text-charcoal border-b border-rust/5 pb-2">Filter Data Report</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Service Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal/60">Service Category:</label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-rust/20 bg-cream/10 focus:outline-none focus:border-rust"
                  >
                    <option value="all">All Packages</option>
                    <option value="Start Where You Are">Start Where You Are</option>
                    <option value="Clarity Call">Clarity Call</option>
                    <option value="Reset Programme">Reset Programme</option>
                    <option value="Couples' Conversations">Couples' Conversations</option>
                  </select>
                </div>

                {/* Date Picker Start */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal/60">Start Date:</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal/40">
                      <Calendar size={12} />
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs pl-8 pr-3.5 py-2 rounded-lg border border-rust/20 bg-cream/10 focus:outline-none focus:border-rust"
                    />
                  </div>
                </div>

                {/* Date Picker End */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal/60">End Date:</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal/40">
                      <Calendar size={12} />
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs pl-8 pr-3.5 py-2 rounded-lg border border-rust/20 bg-cream/10 focus:outline-none focus:border-rust"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="border-t border-rust/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[11px] text-charcoal/50 leading-relaxed flex items-center gap-1.5 max-w-md">
                  <AlertCircle size={14} className="text-rust shrink-0" />
                  Generating PDF pulls client profiles, schedule records, and transactions inside this range.
                </p>

                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="w-full sm:w-auto px-6 py-3 bg-charcoal hover:bg-rust text-cream font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
                >
                  {downloading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 text-xs animate-fadeIn">
                <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Export Complete</p>
                  <p className="text-emerald-700/80 mt-0.5">
                    Your financial and booking report was compiled. File <strong className="font-semibold">confusion_to_clarity_report.pdf</strong> (24KB) was simulated and sent to downloads.
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
