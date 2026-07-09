import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import { apiFetch } from "@/lib/api";

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
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timerId = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [resendTimer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setForgotSuccess("");
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
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
        setResendTimer(60);
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
      const res = await apiFetch("/api/auth/reset-password", {
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
        const regRes = await apiFetch("/api/auth/register", {
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
      const res = await apiFetch("/api/auth/login", {
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
        setLoading(false);
        setError("Invalid credentials. Please try again.");
    }
  };



  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({ idToken: credentialResponse.credential })
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
        setError(data.message || data.error || "Google login failed on server.");
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to connect to backend server.");
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
            {isForgotPassword ? (
              "Reset Password."
            ) : (
              <>
                Confusion to <span className="text-accent-gold">Clarity.</span>
              </>
            )}
          </h2>
          {isForgotPassword || isRegistering ? (
            <p className="text-xs text-text-secondary mt-1">
              {isForgotPassword 
                ? (forgotStep === 1 
                    ? "Enter your email to receive a 6-digit verification code." 
                    : "Enter the verification code sent to your email and your new password.") 
                : "Create your client account to get started."}
            </p>
          ) : null}
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
                
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resendTimer > 0 || loading}
                    className={`text-xs font-medium transition-all duration-150 ${resendTimer > 0 ? "text-text-secondary/50 cursor-not-allowed" : "text-text-secondary hover:text-text-primary hover:underline cursor-pointer"}`}
                  >
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Verification Code"}
                  </button>
                </div>
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

              <div className="flex justify-center mt-4">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google Login Failed")}
                  useOneTap
                  theme="filled_black"
                  shape="circle"
                />
              </div>
            </div>


          </>
        )}
      </div>
    </div>
  );
}
