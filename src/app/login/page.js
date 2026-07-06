"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight, UserCheck, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("client"); // client, admin
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear auth states on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("c2c_auth");
      localStorage.removeItem("c2c_client_auth");
      
      // Clear cookies by setting expired dates
      document.cookie = "c2c_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "c2c_client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    }
  }, []);

  // Clear fields and errors when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEmail("");
    setPassword("");
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, activeTab })
      });
      const data = await res.json();
      if (data.success) {
        if (activeTab === "client") {
          localStorage.setItem("c2c_client_auth", "true");
          router.push("/");
        } else {
          localStorage.setItem("c2c_auth", "true");
          router.push("/");
        }
      } else {
        setLoading(false);
        setError(data.error || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setLoading(false);
      setError("An error occurred during authentication.");
    }
  };

  const handleQuickLogin = () => {
    if (activeTab === "client") {
      setEmail("client@example.com");
      setPassword("clientpassword");
    } else {
      setEmail("admin@c2c.com");
      setPassword("clarity2026");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-12 bg-bg-base text-text-primary select-none">
      <div className="w-full max-w-md bg-surface border border-border-divider p-8 rounded-[24px] shadow-sm space-y-6 relative overflow-hidden">
        
        {/* Decorative corner accent */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-accent-gold/5 rounded-bl-full pointer-events-none" />

        {/* Branding header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-10 h-10 rounded-full bg-accent-gold flex items-center justify-center text-bg-base mx-auto shadow-sm">
            <Sparkles size={20} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-text-primary pt-2">Confusion to Clarity</h2>
          <p className="text-xs text-text-secondary">Access your digital coaching workspace.</p>
        </div>

        {/* Tabs switcher */}
        <div className="flex bg-bg-base/60 p-1.5 rounded-2xl border border-border-divider/50">
          <button
            type="button"
            onClick={() => handleTabChange("client")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer ${
              activeTab === "client"
                ? "bg-bg-elevated text-accent-gold border border-accent-gold/20 shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <UserCheck size={14} />
            Client Login
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("admin")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer ${
              activeTab === "admin"
                ? "bg-bg-elevated text-accent-gold border border-accent-gold/20 shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <ShieldCheck size={14} />
            Admin Login
          </button>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Subtitle helper description */}
          <div className="text-center">
            <h3 className="text-sm font-semibold text-text-primary">
              {activeTab === "client" ? "Client Access Workspace" : "Admin Security Console"}
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {activeTab === "client" 
                ? "Access scheduled calls, worksheets, and transaction records." 
                : "Manage client bookings, contact leads, and reports."}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-950/20 border border-rose-900/50 text-rose-300 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-left">
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
              <Mail size={13} className="opacity-70 text-accent-gold" /> Email Address
            </label>
            <input
              type="email"
              required
              placeholder={activeTab === "client" ? "client@example.com" : "admin@c2c.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border-divider bg-bg-base/50 text-sm focus:outline-none focus:border-accent-blue text-text-primary"
            />
          </div>

          {/* Password input */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
              <Lock size={13} className="opacity-70 text-accent-gold" /> Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border-divider bg-bg-base/50 text-sm focus:outline-none focus:border-accent-blue text-text-primary"
            />
          </div>

          {/* Guidelines info */}
          <div className="bg-bg-elevated/40 p-4 rounded-xl border border-border-divider/50 space-y-2 text-[11px] text-text-secondary text-left">
            <p className="font-semibold text-text-primary">Demo Portal Credentials:</p>
            <div className="flex justify-between font-mono text-[10px] text-text-secondary/80">
              {activeTab === "client" ? (
                <>
                  <span>Email: client@example.com</span>
                  <span>Pass: clientpassword</span>
                </>
              ) : (
                <>
                  <span>Email: admin@c2c.com</span>
                  <span>Pass: clarity2026</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleQuickLogin}
              className="w-full text-center text-accent-gold hover:text-text-primary font-bold mt-1 text-[10px] uppercase tracking-wider block cursor-pointer transition-colors"
            >
              Fill Demo Credentials
            </button>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-accent-gold hover:bg-accent-gold/90 text-bg-base font-bold tracking-wide rounded-full cursor-pointer transition-colors duration-300 flex items-center justify-center gap-2 focus:outline-none text-sm uppercase"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                Authenticating Session...
              </>
            ) : (
              <>
                Log In to Workspace
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
