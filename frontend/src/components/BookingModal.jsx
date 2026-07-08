"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, CreditCard, Calendar, Clock, Sparkles, AlertCircle } from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import { apiFetch } from "@/lib/api";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const packages = [
  { id: "eq", name: "Emotional Intelligence (EQ) & Self-Awareness", price: "₹2999", duration: "60 Mins", description: "Learn to recognize emotional triggers, map cognitive patterns, build self-awareness, and deploy empathetic response systems in corporate and social environments." },
  { id: "public", name: "Public Speaking, Leadership & Confidence Building", price: "₹4999", duration: "90 Mins", description: "Develop high-impact presence, construct persuasive speeches, master body posture, and overcome stage fright to lead teams with ultimate confidence." },
  { id: "private", name: "Confidential 1-on-1 Private Mentorship", price: "₹1499", duration: "45 Mins", description: "A completely confidential, dedicated counseling and advisory desk to resolve specific soft-skill blocks, emotional regulation challenges, or public presentation reviews." },
  { id: "resume", name: "Resume Overhaul & LinkedIn Optimization", price: "₹3499", duration: "75 Mins", description: "Transform your CV with high-conversion frameworks, optimize your LinkedIn presence, and learn the secret to beating the ATS (Applicant Tracking System) for dream roles." }
];

export default function BookingModal() {
  const { isBookingOpen, selectedPackage, closeBooking } = useBooking();
  const [modalPackages, setModalPackages] = useState(packages);
  const [step, setStep] = useState(1); // 1: Package Confirm, 2: Checkout, 3: Booked Success
  const [activePackage, setActivePackage] = useState(null);
  
  // Payment Form Info
  const [bookingRef, setBookingRef] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0); // 0: idle, 1-5: payment stages

  // Calendar Booking Info
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isBookingOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isBookingOpen]);
  // Fetch dynamic packages from database
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await apiFetch("/api/services");
        if (!res.ok) {
          throw new Error(`Services fetch returned status ${res.status}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Services fetch returned non-JSON content");
        }
        const data = await res.json();
        if (data.success && data.services.length > 0) {
          const merged = packages.map(pkg => {
            const dbMatch = data.services.find(s => s.code === pkg.id);
            if (dbMatch) {
              return {
                ...pkg,
                _id: dbMatch._id,
                name: dbMatch.name,
                price: `₹${dbMatch.price}`,
                duration: dbMatch.duration || pkg.duration,
                calendlyUrl: dbMatch.calendlyUrl
              };
            }
            return pkg;
          });
          setModalPackages(merged);
        }
      } catch (err) {
        console.error("Failed to load services in BookingModal", err);
      }
    };
    if (isBookingOpen) {
      fetchServices();
    }
  }, [isBookingOpen]);
  
  useEffect(() => {
    if (selectedPackage) {
      const pkg = modalPackages.find(p => p.id === selectedPackage || p.name === selectedPackage);
      setActivePackage(pkg || modalPackages[0]);
    } else {
      setActivePackage(modalPackages[0]);
    }
  }, [selectedPackage, isBookingOpen, modalPackages]);
  
  useEffect(() => {
    if (isBookingOpen) {
      const fetchUserProfile = async () => {
        try {
          const token = localStorage.getItem("c2c_client_token");
          if (token) {
            const res = await apiFetch("/api/auth/me", {
              headers: {
                "Authorization": `Bearer ${token}`,
                "X-Requested-With": "XMLHttpRequest"
              },
              credentials: "include"
            });
            const data = await res.json();
            if (data.success && data.user) {
              setEmail(data.user.email || "");
              if (data.user.phone) {
                setPhone(data.user.phone);
              }
            }
          }
        } catch (err) {
          console.error("Failed to load user profile in modal", err);
        }
      };
      fetchUserProfile();
    }
  }, [isBookingOpen]);

  // Reset states when closed
  const handleClose = () => {
    closeBooking();
    setTimeout(() => {
      setStep(1);
      setEmail("");
      setPhone("");
      setIsPaying(false);
      setPaymentSuccess(false);
      setSelectedDate("");
      setSelectedTime("");
      setPaymentStep(0);
    }, 300);
  };

  const startPayment = async (e) => {
    e.preventDefault();
    if (!email || !phone) return;
    setIsPaying(true);
    setPaymentStep(1);
    try {
      let activeToken = localStorage.getItem("c2c_client_token");
      
      // Auto-authenticate client if they aren't logged in yet
      if (!activeToken) {
        // 1. Try registration
        try {
          await apiFetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Sarah Lin", email, phone, password: "clientpassword" })
          });
        } catch (err) {
          // Already registered or error, proceed to login
        }

        // 2. Perform login
        const logRes = await apiFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: "clientpassword" })
        });
        const logData = await logRes.json();
        if (logData.success) {
          activeToken = logData.accessToken;
          localStorage.setItem("c2c_client_token", logData.accessToken);
          localStorage.setItem("c2c_client_auth", "true");
          if (logData.user && logData.user.name) {
            localStorage.setItem("c2c_client_name", logData.user.name);
          }
        } else {
          setIsPaying(false);
          setPaymentStep(0);
          alert("Authentication failed: Please login manually before booking.");
          return;
        }
      }

      // 3. Create Razorpay order on Express backend
      const orderRes = await apiFetch("/api/payments/create-order", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`,
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({ serviceId: activePackage.id })
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        setIsPaying(false);
        setPaymentStep(0);
        alert("Failed to initiate order: " + (orderData.error || "Server error."));
        return;
      }

      const { orderId, amount, keyId, bookingReference } = orderData;
      setBookingRef(bookingReference || "");

      // Load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay SDK failed to load. Please check your connection.");
        setIsPaying(false);
        setPaymentStep(0);
        return;
      }

      // Open Razorpay Modal
      const options = {
        key: keyId,
        amount: amount,
        currency: "INR",
        name: "Confusion to Clarity",
        description: activePackage.name,
        order_id: orderId,
        handler: async function (response) {
          setIsPaying(true);
          setPaymentStep(4);
          
          try {
            const verifyRes = await apiFetch("/api/payments/verify", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${activeToken}`,
                "X-Requested-With": "XMLHttpRequest"
              },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              if (verifyData.bookingReference) {
                setBookingRef(verifyData.bookingReference);
              }
              setIsPaying(false);
              setPaymentSuccess(true);
              setPaymentStep(0);
              setTimeout(() => {
                setStep(3); // Go to booked success receipt
              }, 1000);
            } else {
              throw new Error(verifyData.error || "Verification failed");
            }
          } catch (err) {
            console.error("Payment verification failed", err);
            alert("Payment verification failed: " + err.message);
            setIsPaying(false);
            setPaymentStep(0);
          }
        },
        prefill: {
          name: localStorage.getItem("c2c_client_name") || "Client",
          email: email,
          contact: phone
        },
        theme: {
          color: "#D4AF37"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", function (response) {
        alert("Payment failed: " + response.error.description);
        setIsPaying(false);
        setPaymentStep(0);
      });
      paymentObject.open();

    } catch (err) {
      setIsPaying(false);
      setPaymentStep(0);
      alert("Failed to connect to backend server.");
    }  };

  // Generate some mockup dates for calendar (next 5 weekdays)
  const getMockDates = () => {
    const dates = [];
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    let count = 0;
    let daysAhead = 1;
    while (count < 5) {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      // Skip weekends
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        dates.push({
          value: d.toISOString().split('T')[0],
          label: d.toLocaleDateString('en-US', options)
        });
        count++;
      }
      daysAhead++;
    }
    return dates;
  };

  const mockTimes = ["09:00 AM", "10:30 AM", "01:00 PM", "03:30 PM", "05:00 PM"];

  return (
    <AnimatePresence>
      {isBookingOpen && (
        <>
          {/* Dark Backdrop Overlay */}
          <motion.div
            className="fixed inset-0 bg-[#0B0D14]/80 lg:backdrop-blur-xs backdrop-blur-none z-50 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Sliding Side Panel Drawer */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-bg-elevated border-l border-border-divider shadow-2xl z-50 flex flex-col overflow-hidden text-text-primary"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={
              isMobile
                ? { type: "tween", ease: "easeOut", duration: 0.22 }
                : { type: "spring", damping: 25, stiffness: 220 }
            }
          >
            {/* Header */}
            <div className="p-6 border-b border-border-divider/60 flex items-center justify-between bg-surface/30">
              <div className="text-left">
                <span className="text-xs uppercase font-bold tracking-wider text-accent-gold">
                  Checkout Funnel
                </span>
                <h3 className="font-serif text-xl font-bold text-text-primary">
                  Book Your Session
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-surface text-text-secondary/60 hover:text-accent-gold transition-colors duration-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Viewport */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Stepper Progress Bar */}
              {step < 3 && (
                <div className="flex items-center justify-center gap-4 px-4 pb-2 border-b border-border-divider/30">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 1 ? "bg-text-primary text-bg-base" : "bg-surface text-text-secondary/40 border border-border-divider"}`}>
                      {step > 1 ? <Check size={12} /> : "1"}
                    </div>
                    <span className="text-[10px] mt-1 font-medium text-text-secondary">Confirm</span>
                  </div>
                  <div className={`w-16 h-0.5 ${step > 1 ? "bg-text-primary" : "bg-border-divider"}`} />
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 2 ? "bg-text-primary text-bg-base" : "bg-surface text-text-secondary/40 border border-border-divider"}`}>
                      2
                    </div>
                    <span className="text-[10px] mt-1 font-medium text-text-secondary">Checkout</span>
                  </div>
                </div>
              )}

              {/* STEP 1: Package Selection Confirmation */}
              {step === 1 && activePackage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-surface p-5 rounded-2xl border border-border-divider shadow-xs space-y-4 text-left">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-serif text-lg font-bold text-text-primary">{activePackage.name}</h4>
                        <div className="flex items-center space-x-3 text-xs text-text-secondary mt-1">
                          <span className="flex items-center gap-1"><Clock size={12} /> {activePackage.duration}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-gold/30" />
                          <span className="font-semibold text-accent-gold">Individual Access</span>
                        </div>
                      </div>
                      <span className="text-xl font-bold font-serif text-accent-gold">{activePackage.price}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed border-t border-border-divider/50 pt-3">
                      {activePackage.description}
                    </p>
                  </div>

                  {/* Alternative Package Selection List */}
                  <div className="space-y-3 text-left">
                    <label className="text-xs font-bold uppercase tracking-wide text-text-secondary/60">Change selected package:</label>
                    <div className="grid grid-cols-1 gap-2">
                      {modalPackages.map((pkg) => (
                        <button
                          key={pkg.id}
                          onClick={() => setActivePackage(pkg)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                            activePackage.id === pkg.id
                              ? "bg-surface border-text-primary shadow-sm ring-1 ring-text-primary/30"
                              : "bg-surface/50 border-border-divider hover:border-text-primary/30"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-text-primary">{pkg.name}</p>
                            <p className="text-[10px] text-text-secondary mt-0.5">{pkg.duration} — {pkg.price}</p>
                          </div>
                          {activePackage.id === pkg.id && (
                            <div className="w-5 h-5 rounded-full bg-text-primary flex items-center justify-center text-bg-base">
                              <Check size={12} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CTA button */}
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-3.5 bg-accent-gold hover:bg-accent-gold/90 text-bg-base font-bold text-xs uppercase tracking-wider rounded-full shadow-sm cursor-pointer transition-colors duration-300 focus:outline-none text-center"
                  >
                    Proceed to Checkout
                  </button>
                </motion.div>
              )}

              {/* STEP 2: Mock Razorpay Payment Screen */}
              {step === 2 && activePackage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  {/* Mock Razorpay Header */}
                  <div className="bg-surface text-text-primary p-5 rounded-2xl shadow-md border border-border-divider space-y-4 relative overflow-hidden text-left">
                    <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                      <Sparkles size={120} className="text-accent-gold" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] tracking-wider text-text-secondary font-bold uppercase">SECURE CHECKOUT</p>
                        <h4 className="font-serif font-bold text-sm">CONFUSION TO CLARITY</h4>
                      </div>
                      <span className="text-[9px] bg-bg-elevated px-2 py-0.5 rounded text-accent-blue border border-accent-blue/20 font-mono">Razorpay SDK</span>
                    </div>

                    <div className="border-t border-border-divider/50 pt-3 flex justify-between items-baseline">
                      <span className="text-xs text-text-secondary">Total Payable:</span>
                      <span className="text-xl font-bold font-mono text-text-primary">{activePackage.price}</span>
                    </div>
                  </div>

                  {isPaying ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-surface p-5 rounded-2xl border border-border-divider space-y-6"
                    >
                      <div className="text-center space-y-1">
                        <div className="w-10 h-10 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold mx-auto animate-pulse">
                          <CreditCard size={18} />
                        </div>
                        <h4 className="font-serif text-sm font-bold text-text-primary">Processing Gateway Payment</h4>
                        <p className="text-[10px] text-text-secondary">Securing your mock session transaction...</p>
                      </div>

                      {/* Steps List */}
                      <div className="space-y-4">
                        {[
                          { stepNum: 1, title: "1. Customer Checkout", desc: "Initializing secure transaction via Razorpay Gateway." },
                          { stepNum: 2, title: "2. Authentication & Data Transfer", desc: "Encrypting credentials and tokenizing card/payment details." },
                          { stepNum: 3, title: "3. Bank Authorization", desc: "Validating sufficient funds and confirming 2FA / OTP credentials." },
                          { stepNum: 4, title: "4. Payment Confirmation", desc: "Receiving authorization signal and updating checkout ledger." },
                          { stepNum: 5, title: "5. Fund Settlement", desc: "Capturing details to deposit mock funds to partner account." }
                        ].map((s) => {
                          const isCompleted = paymentStep > s.stepNum;
                          const isActive = paymentStep === s.stepNum;
                          const isPending = paymentStep < s.stepNum;

                          return (
                            <div
                              key={s.stepNum}
                              className={`flex items-start gap-3 transition-opacity duration-300 ${
                                isPending ? "opacity-35" : "opacity-100"
                              }`}
                            >
                              <div className="shrink-0 mt-0.5">
                                {isCompleted ? (
                                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-bg-base">
                                    <Check size={8} className="stroke-[3]" />
                                  </div>
                                ) : isActive ? (
                                  <div className="w-4 h-4 rounded-full border-2 border-accent-gold border-t-transparent animate-spin" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-border-divider flex items-center justify-center text-[8px] font-bold text-text-secondary/40 bg-surface">
                                    {s.stepNum}
                                  </div>
                                )}
                              </div>
                              <div className="text-left text-[11px] leading-tight">
                                <h5 className={`font-bold ${isActive ? "text-accent-gold" : "text-text-primary"}`}>
                                  {s.title}
                                </h5>
                                <p className="text-[9px] text-text-secondary mt-0.5 leading-normal">
                                  {s.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    <form onSubmit={startPayment} className="space-y-4 bg-surface p-5 rounded-2xl border border-border-divider text-left">
                      <div className="bg-accent-gold/10 p-3 rounded-lg border border-accent-gold/20 flex items-start gap-3 text-xs mb-2">
                        <AlertCircle size={16} className="text-accent-gold shrink-0 mt-0.5" />
                        <p className="text-text-secondary leading-relaxed">
                          <strong className="text-text-primary">Next Step: Scheduling.</strong> After your payment is completed securely via Razorpay, you will instantly receive your Calendly link on the next screen to choose your exact session date and time.
                        </p>
                      </div>
                      <h5 className="font-semibold text-xs text-text-primary border-b border-border-divider/50 pb-2">Billing Contact Details</h5>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="client@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-border-divider bg-bg-base/50 text-sm focus:outline-none focus:border-accent-blue text-text-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Phone Number</label>
                        <input
                          type="tel"
                          required
                          placeholder="+1 (555) 019-2834"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-border-divider bg-bg-base/50 text-sm focus:outline-none focus:border-accent-blue text-text-primary"
                        />
                      </div>

                      {/* Simulation Panel */}
                      <div className="bg-bg-base/40 p-3 rounded-lg border border-border-divider flex items-start gap-2.5 text-xs text-text-secondary">
                        <CreditCard size={16} className="text-text-primary mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-text-primary">Simulation Mode:</span> Enter any mock credentials above to test. No transaction fees apply.
                        </div>
                      </div>

                      {/* Actions */}
                      <button
                        type="submit"
                        disabled={isPaying || paymentSuccess}
                        className="w-full py-3.5 bg-accent-gold hover:bg-accent-gold/90 text-bg-base font-bold text-xs uppercase tracking-wider rounded-full cursor-pointer transition-colors duration-300 flex items-center justify-center gap-2 focus:outline-none"
                      >
                        {paymentSuccess ? (
                          <>
                            <Check size={16} className="text-emerald-400 stroke-[3]" />
                            Payment Successful
                          </>
                        ) : (
                          `Pay ${activePackage.price} with Razorpay`
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}

              {/* STEP 3: Booking Success Screen */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-6"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
                    <Check size={32} className="stroke-[3]" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-serif text-2xl font-bold text-text-primary">Payment Successful!</h4>
                    <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
                      Your transaction was processed. A backup calendar link has been sent to <strong className="text-text-primary font-semibold">{email}</strong>.
                    </p>
                  </div>

                  <div className="bg-surface p-5 rounded-2xl border border-border-divider text-center space-y-4 max-w-sm mx-auto">
                    <p className="text-xs text-text-secondary font-medium">
                      Please click the button below to secure your 1-on-1 time slot on our calendar:
                    </p>
                    <a
                      href={activePackage?.calendlyUrl ? `${activePackage.calendlyUrl}?utm_campaign=${bookingRef}` : "https://calendly.com/mock-c2c"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block py-3.5 bg-text-primary hover:bg-text-secondary text-bg-base font-bold text-xs uppercase tracking-wider rounded-full shadow-sm cursor-pointer transition-colors duration-300 focus:outline-none"
                    >
                      Schedule Your Session
                    </a>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full max-w-xs py-3 bg-accent-gold hover:bg-accent-gold/90 text-bg-base font-bold text-xs uppercase tracking-wider rounded-full cursor-pointer transition-colors duration-300 focus:outline-none"
                  >
                    Done & Close
                  </button>
                </motion.div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
