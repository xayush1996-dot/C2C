import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import dbJson from "@/data/db.json";
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
  FileSpreadsheet,
  AlertCircle,
  Edit3
} from "lucide-react";

export default function AdminPage() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkAuth = async () => {
        try {
          const token = localStorage.getItem("c2c_token");
          if (!token) {
            setAuthChecking(false);
            setAuthorized(false);
            return;
          }
          if (token === "mock_admin_token") {
            setAuthorized(true);
            setAuthChecking(false);
            return;
          }
          const res = await fetch("/api/admin/auth/me", {
            headers: {
              "Authorization": `Bearer ${token}`,
              "X-Requested-With": "XMLHttpRequest"
            },
            credentials: "include"
          });
          const data = await res.json();
          if (data.success) {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        } catch (err) {
          if (localStorage.getItem("c2c_auth") === "true") {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        } finally {
          setAuthChecking(false);
        }
      };
      checkAuth();
    }
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({ loginId, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("c2c_auth", "true");
        if (data.accessToken) {
          localStorage.setItem("c2c_token", data.accessToken);
        }
        setAuthorized(true);
      } else {
        setLoading(false);
        setError(data.error || "Invalid admin credentials. Please try again.");
      }
    } catch (err) {
      // Backend not deployed fallback: check locally
      const id = loginId.trim().toLowerCase();
      if (
        (id === "confusiontoclarity@gmail.com" && password === "admin01") ||
        (id === "admin@example.com" && password === "AdminPassword123")
      ) {
        localStorage.setItem("c2c_auth", "true");
        localStorage.setItem("c2c_token", "mock_admin_token");
        setAuthorized(true);
      } else {
        setLoading(false);
        setError("Invalid admin credentials. Please try again.");
      }
    }
  };

  const handleQuickLogin = () => {
    setLoginId("admin@example.com");
    setPassword("AdminPassword123");
  };

  const [activeTab, setActiveTab] = useState("overview"); // overview, enquiries, ledger, reports, cms
  const [enquiries, setEnquiries] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // CMS Content States
  const [cmsContent, setCmsContent] = useState({});
  const [cmsServices, setCmsServices] = useState([]);
  const [cmsSubTab, setCmsSubTab] = useState("content"); // content, services
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsMessage, setCmsMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("c2c_token");
      const headers = {
        "Authorization": token ? `Bearer ${token}` : "",
        "X-Requested-With": "XMLHttpRequest"
      };

      // 1. Fetch bookings (fallback to dbJson.transactions)
      try {
        const bookingsRes = await fetch("/api/admin/bookings", { headers, credentials: "include" });
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          if (bookingsData.success) {
            const mapped = bookingsData.bookings.map(b => ({
              id: b._id || b.id,
              name: b.user ? b.user.name : "N/A",
              email: b.user ? b.user.email : "N/A",
              service: b.service ? b.service.name : "Coaching Package",
              paid: b.paymentStatus === "CONFIRMED" || b.paymentStatus === "CAPTURED" ? `₹${b.service ? b.service.price : 99}.00` : "₹0.00",
              date: b.scheduledTime ? new Date(b.scheduledTime).toLocaleDateString() : "Pending",
              time: b.scheduledTime ? new Date(b.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Pending",
              meetActive: b.status === "CONFIRMED"
            }));
            setTransactions(mapped);
          }
        } else {
          throw new Error();
        }
      } catch (e) {
        // Fallback for when backend is not deployed
        const mapped = (dbJson.transactions || []).map(t => ({
          id: t.id,
          name: t.name,
          email: t.email,
          service: t.service,
          paid: t.paid,
          date: t.date,
          time: t.time,
          meetActive: t.meetActive
        }));
        setTransactions(mapped);
      }

      // 2. Fetch enquiries (fallback to dbJson.enquiries)
      try {
        const enquiriesRes = await fetch("/api/admin/enquiries", { headers, credentials: "include" });
        if (enquiriesRes.ok) {
          const enquiriesData = await enquiriesRes.json();
          if (enquiriesData.success) {
            setEnquiries(enquiriesData.enquiries);
          }
        } else {
          throw new Error();
        }
      } catch (e) {
        setEnquiries(dbJson.enquiries || []);
      }

      // 3. Fetch CMS content
      try {
        const contentRes = await fetch("/api/content", { headers });
        if (contentRes.ok) {
          const contentData = await contentRes.json();
          if (contentData.success) {
            setCmsContent(contentData.content);
          }
        } else {
          throw new Error();
        }
      } catch (e) {
        setCmsContent({
          hero_title: "From Confusion to Clarity",
          hero_subtitle: "Strategic leadership coaching helping you navigate partnership stagnation and reset boundaries.",
          founder_name: "Sarah Lin",
          founder_bio: "Executive leadership strategist with over a decade of experience guiding high-growth startups and venture-backed founders.",
          track_record_years: "5,000+",
          track_record_leaders: "150+",
          track_record_retention: "95%",
          track_record_success: "99%"
        });
      }

      // 4. Fetch services
      try {
        const servicesRes = await fetch("/api/services", { headers });
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          if (servicesData.success) {
            setCmsServices(servicesData.services);
          }
        } else {
          throw new Error();
        }
      } catch (e) {
        setCmsServices([
          { _id: "s1", name: "Clarity Call", description: "1-on-1 strategy call to outline challenges", price: 149, code: "CC" },
          { _id: "s2", name: "Reset Programme", description: "Complete organizational reset for founders", price: 499, code: "RP" }
        ]);
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

  const handleSaveContent = async (key, value) => {
    setCmsSaving(true);
    setCmsMessage("");
    try {
      const token = localStorage.getItem("c2c_token");
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({ key, value })
      });
      const data = await res.json();
      if (data.success) {
        setCmsMessage(`Successfully updated: ${key}`);
        setCmsContent(prev => ({ ...prev, [key]: value }));
      } else {
        setCmsMessage(`Error: ${data.error || "Failed to update content"}`);
      }
    } catch (err) {
      setCmsMessage("Error: Failed to connect to server");
    } finally {
      setCmsSaving(false);
    }
  };

  const handleSaveService = async (id, name, description, price, calendlyUrl) => {
    setCmsSaving(true);
    setCmsMessage("");
    try {
      const token = localStorage.getItem("c2c_token");
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({ name, description, price, calendlyUrl })
      });
      const data = await res.json();
      if (data.success) {
        setCmsMessage(`Successfully updated service: ${name}`);
        setCmsServices(cmsServices.map(s => s._id === id ? data.service : s));
      } else {
        setCmsMessage(`Error: ${data.error || "Failed to update service"}`);
      }
    } catch (err) {
      setCmsMessage("Error: Failed to connect to server");
    } finally {
      setCmsSaving(false);
    }
  };

  // Toggle Google Meet Link status (simulated locally because the Express backend does not support manual updates)
  const toggleMeetLink = async (id) => {
    setTransactions(
      transactions.map((tx) =>
        (tx.id === id || tx._id === id) ? { ...tx, meetActive: !tx.meetActive } : tx
      )
    );
  };

  // Toggle Enquiry Status
  const toggleEnquiryStatus = async (id) => {
    const enquiry = enquiries.find(e => e.id === id || e._id === id);
    if (!enquiry) return;
    
    const currentStatus = enquiry.status.toUpperCase();
    const nextStatus = currentStatus === "PENDING" ? "IN_PROGRESS" : currentStatus === "IN_PROGRESS" ? "RESOLVED" : "PENDING";

    try {
      const token = localStorage.getItem("c2c_token");
      const res = await fetch(`/api/admin/enquiries/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries(
          enquiries.map((enq) =>
            (enq.id === id || enq._id === id) ? { ...enq, status: nextStatus } : enq
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

  if (authChecking) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin" />
          <p className="text-xs text-text-secondary uppercase tracking-widest font-bold">Verifying security clearances...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-base text-text-primary select-none">
        <div className="w-full max-w-[420px] bg-bg-elevated border border-border-divider/50 p-8 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6 relative overflow-hidden flex flex-col">
          {/* Top gold accent backdrop effect */}
          <div className="absolute right-0 top-0 w-24 h-24 bg-accent-gold/5 rounded-bl-full pointer-events-none animate-pulse" />

          {/* Header */}
          <div className="text-left space-y-1.5">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary">C2C Admin.</h2>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary">Welcome back.</h2>
            <p className="text-xs text-text-secondary mt-1">
              Sign in to access the security console.
            </p>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-start gap-2 text-xs text-left">
                <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="relative">
              <input
                type="email"
                required
                placeholder="Admin Email"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border-divider bg-bg-base/30 text-sm focus:outline-none focus:border-accent-gold text-text-primary placeholder:text-text-secondary/50 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border-divider bg-bg-base/30 text-sm focus:outline-none focus:border-accent-gold text-text-primary placeholder:text-text-secondary/50 transition-all duration-200"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setError("For security reasons, please contact C2C Mentorship support to reset your credentials.")}
                  className="text-xs text-text-secondary hover:text-text-primary font-medium hover:underline cursor-pointer transition-all duration-150"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-text-primary hover:bg-text-secondary text-bg-base font-bold tracking-wide rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none text-xs uppercase shadow-xs mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4.5 h-4.5 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                "Log In to Console"
              )}
            </button>
          </form>

          {/* Quick Login Link */}
          <div className="text-center pt-2 border-t border-border-divider/50">
            <button
              type="button"
              onClick={handleQuickLogin}
              className="text-[10px] uppercase font-bold tracking-wider text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              Use Quick Demo credentials
            </button>
          </div>
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
            <button
              onClick={() => { setActiveTab("cms"); setSearchTerm(""); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === "cms"
                  ? "bg-bg-elevated text-accent-gold border border-accent-gold/20 shadow-xs"
                  : "text-text-secondary hover:bg-bg-elevated/40 hover:text-text-primary"
              }`}
            >
              <Edit3 size={16} />
              <span>Mini CMS</span>
            </button>
          </nav>
        </div>

        {/* Exit link */}
        <div className="pt-6 border-t border-border-divider/50">
          <Link
            to="/"
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
              {activeTab === "cms" && "Mini CMS Content Console"}
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
                <p className="font-serif text-3xl font-bold text-text-primary">₹996.00</p>
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
                      <tr key={enq._id || enq.id} className="hover:bg-bg-elevated/20 transition-colors">
                        <td className="py-4 px-6 space-y-1">
                           <p className="font-bold text-text-primary">{enq.name}</p>
                           <p className="text-[10px] text-text-secondary/80 font-mono">{enq.email}</p>
                           <p className="text-[10px] text-text-secondary/70">{enq.phone}</p>
                        </td>
                        <td className="py-4 px-6 max-w-sm text-text-secondary leading-relaxed font-medium">
                          {enq.message}
                        </td>
                        <td className="py-4 px-6 text-text-secondary font-mono">
                          {enq.createdAt ? new Date(enq.createdAt).toLocaleDateString() : enq.date}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => toggleEnquiryStatus(enq._id || enq.id)}
                            className={`px-3 py-1.5 rounded-full font-bold text-[9px] uppercase tracking-wider cursor-pointer border ${
                              (enq.status === "New" || enq.status === "PENDING")
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                                : (enq.status === "Read" || enq.status === "IN_PROGRESS")
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            }`}
                          >
                            {enq.status === "PENDING" ? "New" : enq.status === "IN_PROGRESS" ? "Read" : enq.status === "RESOLVED" ? "Replied" : enq.status}
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

        {/* 5. MINI CMS VIEW */}
        {activeTab === "cms" && (
          <div className="space-y-6 animate-fadeIn">
            {/* CMS Inner Navigation */}
            <div className="flex bg-surface/40 p-1.5 rounded-xl border border-border-divider/50 max-w-sm">
              <button
                type="button"
                onClick={() => setCmsSubTab("content")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  cmsSubTab === "content"
                    ? "bg-bg-elevated text-accent-gold shadow-sm border border-accent-gold/20"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Website Copy
              </button>
              <button
                type="button"
                onClick={() => setCmsSubTab("services")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  cmsSubTab === "services"
                    ? "bg-bg-elevated text-accent-gold shadow-sm border border-accent-gold/20"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Services & Pricing
              </button>
            </div>

            {/* Success / Error Message Banner */}
            {cmsMessage && (
              <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 text-left border ${
                cmsMessage.startsWith("Error")
                  ? "bg-rose-950/20 border-rose-900/50 text-rose-300"
                  : "bg-emerald-950/20 border-emerald-900/50 text-emerald-300"
              }`}>
                <AlertCircle size={15} />
                <span>{cmsMessage}</span>
              </div>
            )}

            {/* Sub-tab 1: Copy Editing */}
            {cmsSubTab === "content" && (
              <div className="bg-surface p-6 rounded-2xl border border-border-divider/60 space-y-6 shadow-xs">
                <h3 className="font-serif text-lg font-bold text-text-primary border-b border-border-divider/50 pb-2">Edit Web Copy Fields</h3>
                
                <div className="space-y-4">
                  {[
                    { key: 'hero_title', label: 'Hero Title', placeholder: 'From Confusion to Clarity', rows: 1 },
                    { key: 'hero_subtitle', label: 'Hero Subtitle', placeholder: 'Strategic leadership coaching...', rows: 2 },
                    { key: 'founder_name', label: 'Founder Name', placeholder: 'Sarah Lin', rows: 1 },
                    { key: 'founder_bio', label: 'Founder Biography', placeholder: 'Founder profile bio...', rows: 4 },
                    { key: 'track_record_years', label: 'Track Record: Students Trained', placeholder: '5,000+', rows: 1 },
                    { key: 'track_record_leaders', label: 'Track Record: Workshops Conducted', placeholder: '150+', rows: 1 },
                    { key: 'track_record_retention', label: 'Track Record: Placement Success', placeholder: '95%', rows: 1 },
                    { key: 'track_record_success', label: 'Track Record: Satisfaction Rate', placeholder: '99%', rows: 1 }
                  ].map((field) => (
                    <div key={field.key} className="space-y-1.5 text-left border-b border-border-divider/20 pb-4">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{field.label}</label>
                      <div className="flex gap-4 items-start">
                        {field.rows === 1 ? (
                          <input
                            type="text"
                            value={cmsContent[field.key] || ""}
                            onChange={(e) => setCmsContent({ ...cmsContent, [field.key]: e.target.value })}
                            className="flex-1 text-xs px-3.5 py-2.5 rounded-lg border border-border-divider bg-bg-base/30 text-text-primary focus:outline-none focus:border-accent-gold/45 font-medium"
                          />
                        ) : (
                          <textarea
                            rows={field.rows}
                            value={cmsContent[field.key] || ""}
                            onChange={(e) => setCmsContent({ ...cmsContent, [field.key]: e.target.value })}
                            className="flex-1 text-xs px-3.5 py-2.5 rounded-lg border border-border-divider bg-bg-base/30 text-text-primary focus:outline-none focus:border-accent-gold/45 leading-relaxed font-medium"
                          />
                        )}
                        <button
                          onClick={() => handleSaveContent(field.key, cmsContent[field.key])}
                          disabled={cmsSaving}
                          className="px-4 py-2.5 bg-accent-gold/20 hover:bg-accent-gold text-accent-gold hover:text-bg-base font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                        >
                          Save Field
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-tab 2: Services & Pricing */}
            {cmsSubTab === "services" && (
              <div className="space-y-6">
                {cmsServices.map((service) => (
                  <div key={service._id} className="bg-surface p-6 rounded-2xl border border-border-divider/60 space-y-4 shadow-xs text-left">
                    <div className="flex justify-between items-center border-b border-border-divider/50 pb-2">
                      <span className="text-xs font-bold text-accent-gold uppercase tracking-wider font-mono">CODE: {service.code}</span>
                      <button
                        onClick={() => handleSaveService(service._id, service.name, service.description, service.price, service.calendlyUrl)}
                        disabled={cmsSaving}
                        className="px-4 py-2 bg-accent-gold hover:bg-accent-gold/90 text-bg-base font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                      >
                        Save Package changes
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-secondary">Service Package Name</label>
                        <input
                          type="text"
                          value={service.name || ""}
                          onChange={(e) => setCmsServices(cmsServices.map(s => s._id === service._id ? { ...s, name: e.target.value } : s))}
                          className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-border-divider bg-bg-base/30 text-text-primary focus:outline-none focus:border-accent-gold/45"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-secondary">Price (INR)</label>
                        <input
                          type="number"
                          value={service.price || 0}
                          onChange={(e) => setCmsServices(cmsServices.map(s => s._id === service._id ? { ...s, price: Number(e.target.value) } : s))}
                          className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-border-divider bg-bg-base/30 text-text-primary focus:outline-none focus:border-accent-gold/45"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-text-secondary">Description / Subtitle copy</label>
                        <textarea
                          rows={2}
                          value={service.description || ""}
                          onChange={(e) => setCmsServices(cmsServices.map(s => s._id === service._id ? { ...s, description: e.target.value } : s))}
                          className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-border-divider bg-bg-base/30 text-text-primary focus:outline-none focus:border-accent-gold/45"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-text-secondary">Calendly Redirect Booking Link</label>
                        <input
                          type="text"
                          value={service.calendlyUrl || ""}
                          onChange={(e) => setCmsServices(cmsServices.map(s => s._id === service._id ? { ...s, calendlyUrl: e.target.value } : s))}
                          className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-border-divider bg-bg-base/30 text-text-primary focus:outline-none focus:border-accent-gold/45 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
