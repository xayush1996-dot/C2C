import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  Lock,
  Shield,
  MessageSquare,
  Heart,
  Users,
  Check,
  ArrowRight,
  Sparkles,
  Calendar,
  Video,
  CreditCard,
  UserCheck
} from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import { apiFetch } from "@/lib/api";

export default function SanctuaryPage() {
  const { openBooking } = useBooking();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("c2c_client_auth") === "true";
      const name = localStorage.getItem("c2c_client_name") || "Client";
      setIsLoggedIn(auth);
      setClientName(name);
    }
  }, []);

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
          setClientName(data.user.name);
        }
        setIsLoggedIn(true);
        setLoading(false);
        // Reload to sync other components like the Header
        window.location.reload();
      } else {
        setLoading(false);
        setError(data.message || data.error || "Google login failed on server.");
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to connect to backend server.");
    }
  };

  const handleBookNow = () => {
    // Open the BookingModal and pre-select the 'private' package
    openBooking("private");
  };

  return (
    <article className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20 space-y-16 text-text-primary select-none">
      
      {/* 1. HERO/HEADER SECTION */}
      <section className="text-left space-y-6 border-b border-border-divider/50 pb-10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent-gold">
            1:1 Confidential Sanctuary
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
            <Lock size={10} className="shrink-0" />
            100% SECURE & ENCRYPTED
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-text-primary">
              The Private <br />
              <span className="text-accent-gold">Resolution Sanctuary</span>
            </h1>
            <p className="font-serif text-lg md:text-xl font-medium text-text-secondary">
              1:1 Confidential Consultation & Personal Counseling
            </p>
          </div>
          <div className="lg:col-span-4 bg-bg-elevated p-5 rounded-2xl border border-border-divider/60 shadow-2xs flex items-start gap-3.5 mt-2 lg:mt-0">
            <Lock className="text-accent-gold shrink-0 mt-0.5" size={20} />
            <div className="space-y-1 text-left">
              <h4 className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">Absolute NDA Standards</h4>
              <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                Every consulting arrangement, joint session, and message exchange is protected by absolute non-disclosure agreements. No judgment, no transcripts shared, ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE REALITY vs SAFE HARBOR */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface/40 p-8 rounded-[24px] border border-border-divider/50 shadow-2xs text-left space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[9px] uppercase font-bold tracking-wider text-text-secondary/60">The Reality</span>
            <h3 className="font-serif text-2xl font-bold text-text-primary leading-tight">Workshops vs. Personal Vulnerability</h3>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-medium">
              Collective workshops are incredible for structural skills and breaking out of your comfort zone, but a group setting is never the place for personal vulnerability. True breakthroughs require an absolute guarantee of privacy.
            </p>
          </div>
          <div className="w-12 h-1 bg-border-divider/60 rounded-full mt-4" />
        </div>

        <div className="bg-surface p-8 rounded-[24px] border-2 border-accent-gold shadow-xs text-left space-y-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-accent-gold/5 rounded-bl-full pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-accent-gold" />
              <span className="text-[9px] uppercase font-bold tracking-wider text-accent-gold">Your Absolute Safe Harbor</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-text-primary leading-tight">A 1-on-1 Sanctuary Without Judgment</h3>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-medium">
              This is a completely confidential, premium 1-on-1 space where you can let your guard down entirely. Here, there is no such thing as a "right" or "wrong" thought, and no feeling is invalid. Whatever you think, whatever you feel, and whatever you are carrying will be fully heard, acknowledged, and respected without a single ounce of judgment.
            </p>
          </div>
          <div className="w-12 h-1 bg-accent-gold rounded-full mt-4" />
        </div>
      </section>

      {/* 3. FOCUS AREAS: BRING ANYTHING TO THE TABLE */}
      <section className="space-y-10 text-left">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-bg-elevated border border-border-divider rounded-full text-[9px] uppercase font-bold tracking-widest text-text-secondary mb-3">
            FOCUS AREAS
          </span>
          <h2 className="font-serif text-3xl font-extrabold text-text-primary leading-tight">
            Bring Absolutely Anything to the Table
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-2 leading-relaxed font-medium">
            Nothing is too small or too heavy. Here are the core private dynamics we navigate in absolute confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: MessageSquare,
              title: "Unfiltered Conversations",
              desc: "Discuss any question, conflict, or private thought that is keeping you up at night—nothing is too small or too heavy."
            },
            {
              icon: Heart,
              title: "Emotional & Anger Management",
              desc: "Get compassionate, practical tools to navigate overwhelming stress, anxiety, deep triggers, and mental exhaustion."
            },
            {
              icon: Users,
              title: "Relationship & Personal Friction",
              desc: "Safely untangle complex family dynamics, toxic friendships, romantic heartbreaks, or workplace politics."
            },
            {
              icon: Shield,
              title: "Inner Blind Spots",
              desc: "Work privately on personal anxieties, people-pleasing habits, or self-doubt that you don't want the world to see."
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-surface rounded-2xl p-6 border border-border-divider/50 shadow-2xs flex gap-5 items-start hover:shadow-xs transition-shadow duration-300">
                <div className="w-12 h-12 rounded-xl bg-bg-base flex items-center justify-center text-accent-gold border border-border-divider/60 shrink-0 shadow-2xs">
                  <Icon size={20} className="stroke-[1.5]" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-sans text-sm font-bold text-text-primary">{item.title}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. STEP-BY-STEP BOOKING JOURNEY */}
      <section className="space-y-10 text-left">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-bg-elevated border border-border-divider rounded-full text-[9px] uppercase font-bold tracking-widest text-text-secondary mb-3">
            BOOKING JOURNEY
          </span>
          <h2 className="font-serif text-3xl font-extrabold text-text-primary leading-tight">
            A Seamless, Secure, and Automated Booking Journey
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-2 leading-relaxed font-medium">
            If our group program sparked questions you want to explore deeper, or if you have personal challenges you prefer to share in complete privacy, you don't have to wait. Step away from the crowd in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              icon: UserCheck,
              title: "One-Click Sign-In",
              desc: "Simply log in securely using your Google account. No long registration forms, no tedious profile setups."
            },
            {
              step: "02",
              icon: CreditCard,
              title: "Frictionless Booking",
              desc: "We keep private rates highly reasonable. Complete a swift, secure payment through Razorpay using your preferred payment method."
            },
            {
              step: "03",
              icon: Calendar,
              title: "Control the Calendar",
              desc: "Our live schedule opens up instantly. Simply select the exact date and time slot that best fits your routine."
            },
            {
              step: "04",
              icon: Video,
              title: "Ecosystem Integration",
              desc: "The system generates your unique, private video link instantly, added directly to your personal Google Calendar and emailed."
            }
          ].map((item, idx) => {
            const StepIcon = item.icon;
            return (
              <div key={idx} className="bg-surface rounded-2xl p-6 border border-border-divider/50 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[220px] text-left hover:shadow-xs transition-shadow duration-300">
                <div className="absolute -right-4 -bottom-6 text-7xl font-extrabold text-text-primary/5 select-none pointer-events-none">
                  {item.step}
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="w-10 h-10 rounded-lg bg-bg-base border border-border-divider/50 flex items-center justify-center text-text-secondary shrink-0">
                      <StepIcon size={16} />
                    </div>
                    <span className="text-xs font-bold text-accent-gold">{item.step}</span>
                  </div>
                  
                  <div className="space-y-1 pt-2">
                    <h4 className="font-sans text-xs font-bold text-text-primary">{item.title}</h4>
                    <p className="text-[10px] text-text-secondary leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. INTERACTIVE CONSOLE BLOCK */}
      <section className="bg-bg-section/80 border border-border-divider/60 rounded-[32px] p-8 md:p-12 shadow-xs max-w-4xl mx-auto text-left relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-6 -translate-y-6">
          <Sparkles size={180} className="text-accent-gold" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-serif text-2xl md:text-3xl font-extrabold text-text-primary leading-tight">
              Begin Your Sanctuary Experience
            </h3>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-medium">
              Stepping into your private session is designed to be frictionless. When your chosen hour arrives, simply click the link from your calendar and enter a completely safe, non-judgmental space built entirely around you.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4 bg-bg-elevated p-6 rounded-2xl border border-border-divider shadow-2xs">
            {isLoggedIn ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-500/20">
                  <UserCheck size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-text-secondary">Secure Connection Active</p>
                  <h4 className="font-sans text-sm font-bold text-text-primary">Logged in as {clientName}</h4>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleBookNow}
                    className="w-full py-3 bg-accent-gold hover:bg-accent-gold/90 text-[#1E1E1E] font-bold text-xs uppercase tracking-wider rounded-full shadow-sm transition-all cursor-pointer focus:outline-none"
                  >
                    Book Private Session
                  </button>
                  <Link
                    to="/client"
                    className="w-full py-2.5 bg-surface-hover hover:bg-border-divider/50 text-text-primary font-bold text-[10px] uppercase tracking-wider rounded-full border border-border-divider transition-all text-center"
                  >
                    Go to Client Portal
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-accent-gold/10 rounded-full flex items-center justify-center mx-auto text-accent-gold border border-accent-gold/20">
                  <Lock size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-text-secondary">Authentication Panel</p>
                  <p className="text-[10px] text-text-secondary leading-normal">
                    Sign in with Google to pre-fill your schedule, or proceed directly to book.
                  </p>
                </div>

                {error && (
                  <div className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-xl text-left">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError("Google login failed.")}
                      theme="filled_black"
                      shape="circle"
                    />
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-border-divider/50"></div>
                    <span className="flex-shrink mx-3 text-[9px] uppercase font-bold tracking-widest text-text-secondary/50">or</span>
                    <div className="flex-grow border-t border-border-divider/50"></div>
                  </div>

                  <button
                    onClick={handleBookNow}
                    className="w-full py-3 bg-accent-gold hover:bg-accent-gold/90 text-[#1E1E1E] font-bold text-xs uppercase tracking-wider rounded-full shadow-sm transition-all cursor-pointer focus:outline-none"
                  >
                    Book Private Session Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

    </article>
  );
}
