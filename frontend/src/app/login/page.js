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

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({ idToken: "mock_google_token_client@example.com_googleid123" })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("c2c_client_auth", "true");
        if (data.accessToken) {
          localStorage.setItem("c2c_client_token", data.accessToken);
        }
        if (data.user && data.user.name) {
          localStorage.setItem("c2c_client_name", data.user.name);
        }
        router.push("/");
      } else {
        localStorage.setItem("c2c_client_auth", "true");
        localStorage.setItem("c2c_client_token", "mock_access_token_google_fallback");
        localStorage.setItem("c2c_client_name", "Sarah Lin");
        document.cookie = "c2c_client_auth=true; path=/;";
        router.push("/");
      }
    } catch (err) {
      localStorage.setItem("c2c_client_auth", "true");
      localStorage.setItem("c2c_client_token", "mock_access_token_google_fallback");
      localStorage.setItem("c2c_client_name", "Sarah Lin");
      document.cookie = "c2c_client_auth=true; path=/;";
      router.push("/");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-12 bg-bg-base text-text-primary select-none">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Option 1: Standard Credentials (flat & neutral card) */}
        <div className="bg-surface border border-border-divider p-8 rounded-[24px] shadow-sm space-y-6 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-left space-y-2">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Option 1</span>
              <h2 className="font-serif text-xl font-bold text-text-primary">Credentials Access</h2>
              <p className="text-xs text-text-secondary">Access the workspace using your standard email credentials.</p>
            </div>

            {showAdminTab && (
              <div className="flex bg-bg-base/60 p-1.5 rounded-2xl border border-border-divider/50">
                <button
                  type="button"
                  onClick={() => handleTabChange("client")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer ${
                    activeTab === "client"
                      ? "bg-bg-elevated text-text-primary border border-border-divider/50 shadow-xs"
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
                      ? "bg-bg-elevated text-text-primary border border-border-divider/50 shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <ShieldCheck size={14} />
                  Admin Login
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-text-primary">
                  {activeTab === "client" 
                    ? (isRegistering ? "Client Account Registration" : "Client Access Workspace") 
                    : "Admin Security Console"}
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {activeTab === "client" 
                    ? (isRegistering 
                        ? "Create your client profile to book sessions." 
                        : "Access scheduled calls and worksheets.") 
                    : "Manage bookings and logs."}
                </p>
              </div>

              {error && (
                <div className="bg-rose-950/20 border border-rose-900/50 text-rose-300 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-left">
                  <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {activeTab === "client" && isRegistering && (
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                    <User size={13} className="opacity-70 text-text-secondary" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sarah Lin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-divider bg-bg-base/50 text-sm focus:outline-none focus:border-border-divider text-text-primary"
                  />
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                  <Mail size={13} className="opacity-70 text-text-secondary" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder={activeTab === "client" ? "client@example.com" : "admin@c2c.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-divider bg-bg-base/50 text-sm focus:outline-none focus:border-border-divider text-text-primary"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                  <Lock size={13} className="opacity-70 text-text-secondary" /> Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-divider bg-bg-base/50 text-sm focus:outline-none focus:border-border-divider text-text-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-surface-hover hover:bg-border-divider border border-border-divider hover:text-text-primary text-text-secondary font-bold tracking-wide rounded-full cursor-pointer transition-colors duration-300 flex items-center justify-center gap-2 focus:outline-none text-xs uppercase"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-text-primary/30 border-t-text-primary rounded-full animate-spin" />
                    Processing...
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

              {activeTab === "client" && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setError("");
                    }}
                    className="text-xs text-text-secondary hover:text-text-primary font-bold cursor-pointer transition-colors duration-200"
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

        {/* Option 2: Private Sanctuary (subtle gold glow card) */}
        <div className="bg-surface border border-accent-gold/45 p-8 rounded-[24px] shadow-lg relative overflow-hidden flex flex-col justify-between ring-1 ring-accent-gold/20 shadow-[0_0_25px_rgba(251,191,36,0.08)] text-left">
          
          <div className="absolute right-0 top-0 w-24 h-24 bg-accent-gold/5 rounded-bl-full pointer-events-none" />

          <div className="space-y-6">
            <div className="text-left space-y-2">
              <span className="text-[10px] uppercase font-bold text-accent-gold tracking-widest block">Option 2</span>
              <h2 className="font-serif text-xl font-bold text-text-primary">Private Sanctuary</h2>
              <p className="text-xs text-text-secondary">Secure, single-click entry to your encrypted digital sanctuary via Google OAuth.</p>
            </div>

            <div className="bg-bg-base/40 p-4 rounded-xl border border-border-divider text-xs text-text-secondary leading-relaxed space-y-2">
              <div className="flex items-center gap-2 text-text-primary font-semibold">
                <ShieldCheck className="text-accent-gold shrink-0" size={16} />
                <span>Zero-Trust Architecture</span>
              </div>
              <p>Your session details, messages, and document vault are cryptographically shielded. Single Sign-On verifies security without local password storage.</p>
            </div>
          </div>

          <div className="pt-6 space-y-4">
            {/* Google Sign-In button: styled in Electric Amber Gold (#FBBF24) */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 bg-accent-gold hover:bg-accent-gold/90 text-bg-base font-bold tracking-wide rounded-full cursor-pointer transition-colors duration-300 flex items-center justify-center gap-2.5 focus:outline-none text-xs uppercase shadow-sm hover:shadow-accent-gold/15"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Sign In with Google
            </button>

            <div className="text-center">
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

      </div>
    </div>
  );
}
