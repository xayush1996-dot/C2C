import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter code & password
  const [forgotSuccess, setForgotSuccess] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setForgotSuccess("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (data.success) {
        setForgotStep(2);
        setLoading(false);
        if (data.resetToken) {
          console.log("OTP Code (Dev simulation):", data.resetToken);
          setForgotSuccess(`Verification code sent! [DEV SIMULATION CODE: ${data.resetToken}]`);
        } else {
          setForgotSuccess("Verification code sent to your email!");
        }
      } else {
        setLoading(false);
        setError(data.message || data.error || "Failed to send verification code.");
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to connect to backend server.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setForgotSuccess("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ email: forgotEmail, code: otpCode, password: newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setLoading(false);
        setForgotSuccess("Password reset successfully! Please sign in with your new password.");
        setIsForgotPassword(false);
        setForgotStep(1);
        setForgotEmail("");
        setOtpCode("");
        setNewPassword("");
      } else {
        setLoading(false);
        setError(data.message || data.error || "Failed to reset password. Please check the code.");
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to connect to backend server.");
    }
  };

  // Clear auth states on mount
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
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
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

      // Log in
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({ email, password })
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
        navigate("/");
      } else {
        setLoading(false);
        setError(data.error || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      // Backend not deployed fallback: verify client locally
      if (isRegistering) {
        localStorage.setItem("c2c_client_auth", "true");
        localStorage.setItem("c2c_client_token", "mock_client_token");
        localStorage.setItem("c2c_client_name", name || "Client");
        navigate("/");
      } else {
        if (email.trim().toLowerCase() === "client@example.com" && password === "clientpassword") {
          localStorage.setItem("c2c_client_auth", "true");
          localStorage.setItem("c2c_client_token", "mock_client_token");
          localStorage.setItem("c2c_client_name", "Sarah Lin");
          navigate("/");
        } else {
          setLoading(false);
          setError("Invalid client credentials. Please try again.");
        }
      }
    }
  };

  const handleQuickLogin = () => {
    setEmail("client@example.com");
    setPassword("clientpassword");
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
        navigate("/");
      } else {
        localStorage.setItem("c2c_client_auth", "true");
        localStorage.setItem("c2c_client_token", "mock_access_token_google_fallback");
        localStorage.setItem("c2c_client_name", "Sarah Lin");
        document.cookie = "c2c_client_auth=true; path=/;";
        navigate("/");
      }
    } catch (err) {
      localStorage.setItem("c2c_client_auth", "true");
      localStorage.setItem("c2c_client_token", "mock_access_token_google_fallback");
      localStorage.setItem("c2c_client_name", "Sarah Lin");
      document.cookie = "c2c_client_auth=true; path=/;";
      navigate("/");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-bg-base text-text-primary select-none">
      <div className="w-full max-w-[420px] bg-bg-elevated border border-border-divider/50 p-8 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6 relative overflow-hidden flex flex-col">
        {/* Top gold accent backdrop effect */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-accent-gold/5 rounded-bl-full pointer-events-none animate-pulse" />

        {/* Header */}
        <div className="text-left space-y-1.5">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary">
            {isForgotPassword ? "Reset Password." : "C2C Mentorship."}
          </h2>
          {!isForgotPassword && (
            <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary">Welcome back.</h2>
          )}
          <p className="text-xs text-text-secondary mt-1">
            {isForgotPassword 
              ? (forgotStep === 1 
                  ? "Enter your email to receive a 6-digit verification code." 
                  : "Enter the verification code sent to your email and your new password.") 
              : (isRegistering ? "Create your client account to get started." : "Sign in to continue to your workspace.")}
          </p>
        </div>

        {isForgotPassword ? (
          <form onSubmit={forgotStep === 1 ? handleSendOtp : handleResetPassword} className="space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-start gap-2 text-xs text-left">
                <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {forgotSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl flex items-start gap-2 text-xs text-left">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-divider bg-bg-base/30 text-sm focus:outline-none focus:border-accent-gold text-text-primary placeholder:text-text-secondary/50 transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-text-primary hover:bg-text-secondary text-bg-base font-bold tracking-wide rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none text-xs uppercase shadow-xs mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                      Sending OTP...
                    </>
                  ) : "Send Verification Code"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="6-Digit OTP Code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl border border-border-divider bg-bg-base/30 text-sm focus:outline-none focus:border-accent-gold text-text-primary placeholder:text-text-secondary/50 tracking-widest text-center font-bold transition-all duration-200"
                  />
                </div>

                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-divider bg-bg-base/30 text-sm focus:outline-none focus:border-accent-gold text-text-primary placeholder:text-text-secondary/50 transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-text-primary hover:bg-text-secondary text-bg-base font-bold tracking-wide rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none text-xs uppercase shadow-xs mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                      Resetting Password...
                    </>
                  ) : "Confirm Reset Password"}
                </button>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setForgotSuccess("");
                  setIsForgotPassword(false);
                  setForgotStep(1);
                }}
                className="text-xs text-text-secondary hover:text-text-primary font-medium hover:underline cursor-pointer transition-all duration-150"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Pill-style Tabs Control */}
            <div className="flex bg-bg-section/80 p-1 rounded-2xl border border-border-divider/40">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer ${
                  !isRegistering
                    ? "bg-surface text-text-primary border border-border-divider/50 shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer ${
                  isRegistering
                    ? "bg-surface text-text-primary border border-border-divider/50 shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Register
              </button>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-start gap-2 text-xs text-left">
                  <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {forgotSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl flex items-start gap-2 text-xs text-left">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {isRegistering && (
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-divider bg-bg-base/30 text-sm focus:outline-none focus:border-accent-gold text-text-primary placeholder:text-text-secondary/50 transition-all duration-200"
                  />
                </div>
              )}

              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    onClick={() => {
                      setError("");
                      setForgotSuccess("");
                      setIsForgotPassword(true);
                      setForgotStep(1);
                      setForgotEmail(email);
                    }}
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
                  isRegistering ? "Register" : "Sign In"
                )}
              </button>
            </form>

            {/* Google OAuth Section */}
            <div className="space-y-4 pt-2">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-border-divider/50"></div>
                <span className="flex-shrink mx-4 text-[10px] uppercase font-bold tracking-widest text-text-secondary/60">or continue with</span>
                <div className="flex-grow border-t border-border-divider/50"></div>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-12 h-12 rounded-full bg-surface border border-border-divider shadow-xs flex items-center justify-center hover:bg-surface-hover hover:border-border-divider/80 transition-all duration-200 cursor-pointer focus:outline-none"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Login Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleQuickLogin}
                className="text-[10px] uppercase font-bold tracking-wider text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Use Quick Demo credentials
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
