"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Lock, Clock, Video, Volume2, X, Check, CreditCard, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
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

const DEFAULT_VIDEOS = [
  {
    _id: "default-1",
    title: "Navigating Partners' Stagnation",
    category: "Couples & Business",
    duration: "4:15",
    description: "Three structural triggers that lead to joint business partner paralysis and how to unlock dialogue.",
    thumbnailUrl: "",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    isLocked: true
  },
  {
    _id: "default-2",
    title: "The 3-Second Boundary Check",
    category: "Professional Reset",
    duration: "2:40",
    description: "A practical framework for high-burnout environments to evaluate requests before committing.",
    thumbnailUrl: "",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    isLocked: true
  },
  {
    _id: "default-3",
    title: "De-escalation in High Stakes",
    category: "Communication Strategy",
    duration: "5:10",
    description: "Managing cortisol responses and communication patterns during active professional transitions.",
    thumbnailUrl: "",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    isLocked: true
  },
  {
    _id: "default-4",
    title: "Strategic Positioning & Authority Signaling",
    category: "Corporate Dominance",
    duration: "6:30",
    description: "Advanced techniques for establishing presence, controlling rooms, and projecting administrative authority.",
    thumbnailUrl: "",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    isLocked: true
  },
  {
    _id: "default-5",
    title: "Designing Escape Hatches in Contracts",
    category: "Legal Boundaries",
    duration: "8:15",
    description: "Understanding legal thresholds and how to structure service terms to maximize flexibility and safety.",
    thumbnailUrl: "",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    isLocked: true
  }
];

export default function PremiumVideos() {
  const [videos, setVideos] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [premiumService, setPremiumService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  
  // Checkout drawer state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0);

  const fetchVideos = async () => {
    try {
      const token = localStorage.getItem("c2c_client_token");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await apiFetch("/api/videos", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setVideos(data.videos || []);
          setHasAccess(data.hasPremiumAccess || false);
          return;
        }
      }
      throw new Error("Backend response not successful");
    } catch (err) {
      console.warn("Failed to fetch premium videos, using local fallback:", err);
      const isLocalToken = localStorage.getItem("c2c_client_token") === "mock_client_token";
      const isLocalUnlocked = localStorage.getItem("c2c_premium_unlocked") === "true";
      const userHasAccess = isLocalToken || isLocalUnlocked;
      
      const localVideos = DEFAULT_VIDEOS.map(v => ({
        ...v,
        isLocked: !userHasAccess
      }));
      setVideos(localVideos);
      setHasAccess(userHasAccess);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceDetails = async () => {
    try {
      const res = await apiFetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.services) {
          const service = data.services.find(s => s.code === "premium_videos");
          if (service) {
            setPremiumService(service);
            return;
          }
        }
      }
      throw new Error("Backend service response not successful");
    } catch (err) {
      console.warn("Failed to fetch service details, using local fallback:", err);
      setPremiumService({
        _id: "premium_videos",
        code: "premium_videos",
        name: "Premium Video Access Tier",
        description: "Lifetime access to the full C2C premium video masterclass archive and training tools.",
        price: 1999,
        isActive: true
      });
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchServiceDetails();
  }, []);

  // Autofill checkout details if customer profile exists
  useEffect(() => {
    if (isCheckoutOpen) {
      const fetchUserProfile = async () => {
        try {
          const token = localStorage.getItem("c2c_client_token");
          if (token) {
            const res = await apiFetch("/api/auth/me", {
              headers: {
                "Authorization": `Bearer ${token}`,
                "X-Requested-With": "XMLHttpRequest"
              }
            });
            const data = await res.json();
            if (data.success && data.user) {
              setEmail(data.user.email || "");
              setPhone(data.user.phone || "");
            }
          }
        } catch (err) {
          console.error("Failed to load user profile in checkout drawer", err);
        }
      };
      fetchUserProfile();
    }
  }, [isCheckoutOpen]);

  const handleOpenPlayer = (video) => {
    if (video.isLocked) {
      setIsCheckoutOpen(true);
    } else {
      setActiveVideo(video);
    }
  };

  const handleClosePlayer = () => {
    setActiveVideo(null);
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    setTimeout(() => {
      setIsPaying(false);
      setPaymentSuccess(false);
      setPaymentStep(0);
    }, 300);
  };

  const startCheckoutPayment = async (e) => {
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
      const targetServiceId = premiumService ? premiumService._id : "premium_videos";
      const orderRes = await apiFetch("/api/payments/create-order", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`,
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({ serviceId: targetServiceId })
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        setIsPaying(false);
        setPaymentStep(0);
        alert("Failed to initiate order: " + (orderData.error || "Server error."));
        return;
      }

      const { orderId, amount, keyId } = orderData;

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
        description: "Premium Masterclass Archive",
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
              setPaymentSuccess(true);
              setPaymentStep(0);
              setIsPaying(false);
              await fetchVideos();
              setTimeout(() => {
                handleCloseCheckout();
              }, 1500);
            } else {
              throw new Error(verifyData.error || "Verification failed");
            }
          } catch (err) {
            console.error("Verification failed:", err);
            alert("Verification failed: " + err.message);
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
          color: "#D4AF37" // accent-gold
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
    }
  };

  const displayPrice = premiumService ? `₹${premiumService.price}` : "₹1999";
  const displayDescription = premiumService?.description || "Lifetime access to the full C2C premium video masterclass archive and training tools.";

  return (
    <div className="text-text-primary bg-bg-base relative min-h-screen py-16 px-6 md:px-12 select-none">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="inline-block px-3 py-1 bg-bg-elevated border border-border-divider rounded-full text-[9px] uppercase font-bold tracking-widest text-text-secondary">
            Masterclass Archive
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary">
            C2C <span className="text-accent-gold font-serif">Premium Workshops</span>
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed font-medium">
            Acquire expert frameworks on emotional intelligence, conflict de-escalation, legal contract defense, and administrative room command.
          </p>
        </div>

        {/* Locked Tier Banner CTA */}
        {!hasAccess && !loading && (
          <div className="bg-surface border border-accent-gold/40 rounded-[24px] p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden">
            {/* Top border gold stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-accent-gold" />
            
            <div className="space-y-2 text-left md:max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-gold/10 text-accent-gold text-[10px] font-bold uppercase tracking-wider border border-accent-gold/20">
                LIFETIME PREMIUM PASS
              </span>
              <h3 className="font-serif text-xl font-bold text-text-primary">
                Unlock the Complete Video Library
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed font-medium">
                {displayDescription}
              </p>
            </div>
            
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="px-8 py-3.5 bg-accent-gold hover:bg-accent-gold/90 font-bold text-xs tracking-wider uppercase rounded-full shadow-md transition-all duration-200 focus:outline-none cursor-pointer whitespace-nowrap"
            >
              Get Premium for {displayPrice}
            </button>
          </div>
        )}

        {/* Video Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-accent-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">Loading video catalog...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {videos.map((vid) => (
              <div
                key={vid._id}
                onClick={() => handleOpenPlayer(vid)}
                className="bg-surface rounded-[24px] border border-border-divider/60 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group cursor-pointer hover:border-text-primary/30 hover:-translate-y-1.5"
              >
                {/* Thumbnail / Locked Overlay */}
                <div className="relative aspect-video bg-bg-base/30 flex items-center justify-center overflow-hidden border-b border-border-divider/40">
                  <div className="absolute inset-0 bg-gradient-to-tr from-text-primary/5 to-transparent opacity-60 group-hover:scale-105 transition-transform duration-500" />
                  
                  {vid.thumbnailUrl && !imageErrors[vid._id] ? (
                    <img 
                      src={vid.thumbnailUrl} 
                      alt={vid.title} 
                      onError={() => setImageErrors(prev => ({ ...prev, [vid._id]: true }))}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-text-primary/5 to-transparent opacity-60 group-hover:scale-105 transition-transform duration-500" />
                  )}

                  {vid.isLocked ? (
                    <div className="absolute inset-0 bg-[#0B0D14]/75 backdrop-blur-xs flex flex-col items-center justify-center text-text-primary z-10 transition-colors group-hover:bg-[#0B0D14]/80">
                      <div className="w-12 h-12 rounded-full bg-bg-elevated/10 border border-text-primary/20 flex items-center justify-center text-accent-gold shadow-sm mb-2 group-hover:scale-110 transition-all duration-300">
                        <Lock size={18} />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-accent-gold">Premium Locked</span>
                    </div>
                  ) : (
                    <div className="relative z-10 w-12 h-12 rounded-full bg-bg-elevated/95 border border-border-divider/50 backdrop-blur-xs flex items-center justify-center text-text-primary group-hover:bg-text-primary group-hover:text-bg-base shadow-sm group-hover:scale-110 transition-all duration-300">
                      <Play size={18} className="fill-current ml-0.5" />
                    </div>
                  )}

                  {/* Badges */}
                  <span className="absolute bottom-3 left-3 px-2 py-1 rounded bg-bg-base/80 border border-border-divider/40 text-text-primary text-[10px] uppercase font-bold tracking-wider z-20">
                    {vid.category}
                  </span>
                  <span className="absolute bottom-3 right-3 px-2 py-1 rounded bg-bg-base/80 border border-border-divider/40 backdrop-blur-xs text-text-primary text-[10px] font-bold flex items-center gap-1 z-20">
                    <Clock size={10} className="text-text-secondary" /> {vid.duration}
                  </span>
                </div>

                {/* Metadata */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5 text-left">
                    <h4 className="font-serif text-base font-bold text-text-primary group-hover:text-text-primary transition-colors duration-200">
                      {vid.title}
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed font-medium">
                      {vid.description}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPlayer(vid);
                    }}
                    className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 mt-2 cursor-pointer transition-colors duration-200 w-fit"
                  >
                    {vid.isLocked ? "Unlock Lesson" : "Play Lesson"} <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Overlay Modal (Pop-up Player) */}
      <AnimatePresence>
        {activeVideo && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-[#0B0D14]/80 backdrop-blur-sm z-50 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePlayer}
            />

            {/* Video Player Modal Container */}
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-3xl bg-bg-elevated border border-border-divider rounded-[24px] overflow-hidden shadow-2xl z-50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Top bar info */}
              <div className="bg-surface/60 px-4 py-3 flex items-center justify-between border-b border-border-divider text-text-primary">
                <div className="flex items-center gap-2">
                  <Video size={14} className="text-text-secondary" />
                  <span className="text-xs font-medium">{activeVideo.category}</span>
                </div>
                <button
                  onClick={handleClosePlayer}
                  className="p-1 rounded hover:bg-surface text-text-secondary/60 hover:text-text-primary transition-colors duration-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Real Video Canvas Playback Screen */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                {activeVideo.videoUrl ? (
                  activeVideo.videoUrl.includes('youtube.com') ? (
                    <iframe 
                      src={activeVideo.videoUrl} 
                      className="w-full h-full" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    />
                  ) : (
                    <video 
                      src={activeVideo.videoUrl} 
                      controls 
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="text-text-secondary text-xs">Video content error</div>
                )}
              </div>

              {/* Metadata Info Footer */}
              <div className="bg-surface p-5 text-left border-t border-border-divider space-y-1">
                <h4 className="font-serif text-base font-bold text-text-primary">{activeVideo.title}</h4>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">{activeVideo.description}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Simulated Razorpay Checkout Drawer */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-[#0B0D14]/80 backdrop-blur-sm z-50 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCheckout}
            />

            {/* Side Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-bg-elevated border-l border-border-divider shadow-2xl z-50 flex flex-col overflow-hidden text-text-primary"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
            >
              {/* Header */}
              <div className="p-6 border-b border-border-divider/60 flex items-center justify-between bg-surface/30">
                <div className="text-left">
                  <span className="text-xs uppercase font-bold tracking-wider text-accent-gold">
                    Checkout Funnel
                  </span>
                  <h3 className="font-serif text-xl font-bold text-text-primary">
                    Unlock Premium Archive
                  </h3>
                </div>
                <button
                  onClick={handleCloseCheckout}
                  className="p-1.5 rounded-full hover:bg-surface text-text-secondary/60 hover:text-accent-gold transition-colors duration-200 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Viewport */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Checkout Summary Card */}
                {!paymentSuccess && (
                  <div className="bg-surface p-5 rounded-2xl border border-border-divider shadow-xs space-y-4 text-left relative overflow-hidden">
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

                    <div className="border-t border-border-divider/50 pt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-secondary">Selected Access Tier:</span>
                        <span className="font-semibold text-text-primary">Premium Video Archive</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-2">
                        <span className="text-xs text-text-secondary font-bold">Total Price (INR):</span>
                        <span className="text-xl font-bold font-mono text-accent-gold">{displayPrice}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Simulated Payment Stages or Input Form */}
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
                      <p className="text-[10px] text-text-secondary">Securing your mock archive transaction...</p>
                    </div>

                    {/* Simulation Steps */}
                    <div className="space-y-4">
                      {[
                        { stepNum: 1, title: "1. Customer Checkout", desc: "Initializing secure transaction via Razorpay Gateway." },
                        { stepNum: 2, title: "2. Authentication & Data Transfer", desc: "Encrypting credentials and tokenizing payment details." },
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
                ) : paymentSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 space-y-6"
                  >
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
                      <Check size={32} className="stroke-[3]" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-serif text-2xl font-bold text-text-primary">Payment Confirmed!</h4>
                      <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
                        Your premium account is successfully unlocked! The video library is now fully accessible.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={startCheckoutPayment} className="space-y-4 bg-surface p-5 rounded-2xl border border-border-divider text-left">
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
                        <span className="font-bold text-text-primary">Simulation Mode:</span> Enter contact details above to register/login and simulate payment capture safely.
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-accent-gold hover:bg-accent-gold/90 text-bg-base font-bold text-xs uppercase tracking-wider rounded-full cursor-pointer transition-colors duration-300 flex items-center justify-center gap-2 focus:outline-none"
                    >
                      Pay {displayPrice} with Razorpay
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
