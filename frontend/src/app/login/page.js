"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight, UserCheck, ShieldCheck, User, UserPlus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("client"); // client, admin
  const [showAdminTab, setShowAdminTab] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear auth states on mount and check query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("c2c_auth");
      localStorage.removeItem("c2c_client_auth");
      localStorage.removeItem("c2c_token");
      localStorage.removeItem("c2c_client_token");
      localStorage.removeItem("c2c_client_name");
      
      // Clear cookies by setting expired dates
      document.cookie = "c2c_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "c2c_client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";

      // Check private role query parameter
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("role") === "admin" || searchParams.get("admin") === "true") {
        setActiveTab("admin");
        setShowAdminTab(true);
      }
    }
  }, []);

  // Clear fields and errors when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEmail("");
    setPassword("");
    setName("");
    setError("");
    setIsRegistering(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering && activeTab === "client") {
        // Register customer on the backend
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: JSON.stringify({ name, email, password })
        });
        const regData = await regRes.json();
        if (!regData.success) {
          setLoading(false);
          setError(regData.error || "Registration failed. Please try again.");
          return;
        }
      }

      // Log in (either direct login or auto-login after register)
      const endpoint = activeTab === "client" ? "/api/auth/login" : "/api/admin/auth/login";
      const payload = activeTab === "client" 
        ? { email, password } 
        : { loginId: email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (activeTab === "client") {
          localStorage.setItem("c2c_client_auth", "true");
          if (data.accessToken) {
            localStorage.setItem("c2c_client_token", data.accessToken);
          }
          if (data.user && data.user.name) {
            localStorage.setItem("c2c_client_name", data.user.name);
          }
          router.push("/");
        } else {
          localStorage.setItem("c2c_auth", "true");
          if (data.accessToken) {
            localStorage.setItem("c2c_token", data.accessToken);
          }
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
      setEmail("admin@example.com");
      setPassword("AdminPassword123");
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
        {showAdminTab && (
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
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Subtitle helper description */}
          <div className="text-center">
            <h3 className="text-sm font-semibold text-text-primary">
              {activeTab === "client" 
                ? (isRegistering ? "Client Account Registration" : "Client Access Workspace") 
                : "Admin Security Console"}
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {activeTab === "client" 
                ? (isRegistering 
                    ? "Create your client profile to book sessions and access workbooks." 
                    : "Access scheduled calls, worksheets, and transaction records.") 
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

          {/* Name input (only for client registration) */}
          {activeTab === "client" && isRegistering && (
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <User size={13} className="opacity-70 text-accent-gold" /> Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Sarah Lin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border-divider bg-bg-base/50 text-sm focus:outline-none focus:border-accent-blue text-text-primary"
              />
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

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-accent-gold hover:bg-accent-gold/90 text-bg-base font-bold tracking-wide rounded-full cursor-pointer transition-colors duration-300 flex items-center justify-center gap-2 focus:outline-none text-sm uppercase"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                Processing request...
              </>
            ) : (
              <>
                {activeTab === "client" 
                  ? (isRegistering ? "Register Account" : "Log In to Workspace") 
                  : "Log In to Console"}
                <ArrowRight size={14} />
              </>
            )}
          </button>

          {/* Register / Login toggle link */}
          {activeTab === "client" && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError("");
                }}
                className="text-xs text-accent-gold hover:text-text-primary font-bold cursor-pointer transition-colors duration-200"
              >
                {isRegistering 
                  ? "Already have an account? Sign In" 
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
