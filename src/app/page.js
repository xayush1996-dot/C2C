"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, ShieldCheck, Sparkles, User, GraduationCap, Video, Users, HelpCircle } from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import FAQSection from "@/components/FAQSection";
import VideoPlayer from "@/components/VideoPlayer";

// Animation presets
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const servicePackages = [
  {
    id: "start",
    name: "Start Where You Are",
    price: "$99",
    duration: "45 Minutes",
    tagline: "Uncover core roadblocks and mapping templates.",
    features: [
      "Diagnostic intake review",
      "45-minute virtual video call",
      "Immediate action plan outline",
      "Follow-up resources worksheet"
    ],
    highlight: false
  },
  {
    id: "clarity",
    name: "Clarity Call",
    price: "$149",
    duration: "60 Minutes",
    tagline: "Deep-dive resolution of a single major transition.",
    features: [
      "Detailed prep-call questionnaire",
      "60-minute intensive coaching session",
      "Post-session audio summary recording",
      "Email check-in support (7 days)"
    ],
    highlight: true
  },
  {
    id: "reset",
    name: "Reset Programme",
    price: "$499",
    duration: "4 Sessions (60 Mins ea.)",
    tagline: "Rebuild routines and patterns over 4 weeks.",
    features: [
      "4 comprehensive coaching sessions",
      "Custom habit loop tracking system",
      "Direct WhatsApp voice note access",
      "Life-direction strategy blueprint PDF"
    ],
    highlight: false
  },
  {
    id: "couples",
    name: "Couples' Conversations",
    price: "$249",
    duration: "90 Minutes",
    tagline: "Mediated communication strategy for shared alignment.",
    features: [
      "Pre-session individual surveys",
      "90-minute structured joint call",
      "Shared communication protocols guide",
      "Follow-up alignment dashboard"
    ],
    highlight: false
  }
];

const stepsList = [
  {
    num: "01",
    title: "Choose Your Service",
    description: "Select the tailored package that aligns with your current transition needs."
  },
  {
    num: "02",
    title: "Pay Securely",
    description: "Complete your mock transaction safely via the integrated Razorpay checkout gateway."
  },
  {
    num: "03",
    title: "Pick Your Time",
    description: "Select a date and open time slot that fits your schedule via the Calendly interface."
  },
  {
    num: "04",
    title: "Meet on Google Meet",
    description: "Join your video call via the calendar link and begin moving from confusion to clarity."
  }
];

export default function HomePage() {
  const { openBooking } = useBooking();

  return (
    <div className="space-y-24 md:space-y-32 pb-24">
      {/* 01. HERO SECTION */}
      <section className="relative px-6 md:px-12 max-w-7xl mx-auto pt-10 md:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rust/10 text-rust text-xs font-bold uppercase tracking-wider"
            >
              <Sparkles size={12} className="stroke-[2.5]" />
              Coaching & Consulting Editorial Space
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-charcoal leading-[1.1] tracking-tight"
            >
              Bridging the gap from <span className="text-rust italic font-normal">confusion</span> to absolute <span className="text-rust italic font-normal">clarity</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-charcoal/70 leading-relaxed max-w-xl"
            >
              Welcome to a warm, grounded space for professional reset and strategic communication. We provide structured coaching frameworks that help you dissect patterns, resolve transitions, and move forward with purpose.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <button
                onClick={() => openBooking()}
                className="px-8 py-3.5 bg-charcoal hover:bg-rust text-cream font-medium tracking-wide rounded-full shadow-md cursor-pointer transition-colors duration-300 focus:outline-none"
              >
                Start Your Journey
              </button>
              <a
                href="#services"
                className="px-6 py-3.5 border border-charcoal/20 hover:border-rust text-charcoal hover:text-rust font-medium tracking-wide rounded-full transition-colors duration-300 flex items-center gap-1"
              >
                Explore Services
              </a>
            </motion.div>
          </div>

          {/* Hero Premium Graphic (Minimalist Editorial Visual) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="aspect-[4/5] max-w-md mx-auto bg-white rounded-3xl p-6 shadow-sm border border-rust/10 relative overflow-hidden flex flex-col justify-between">
              {/* Decorative graphic patterns */}
              <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-cream" />
              <div className="absolute right-10 top-10 w-6 h-6 rounded-full border border-rust/20" />
              
              <div className="space-y-4 relative z-10">
                <span className="text-[10px] font-bold text-rust uppercase tracking-widest block">FOUNDING PHILOSOPHY</span>
                <p className="font-serif text-2xl font-semibold text-charcoal italic leading-snug">
                  "Complexity is easy. Simple, actionable truth is hard. We do hard work, together."
                </p>
              </div>

              {/* Graphic checklist mock box */}
              <div className="bg-cream/40 p-5 rounded-2xl border border-rust/5 relative z-10 space-y-3.5">
                <p className="text-xs uppercase font-bold text-charcoal/50 tracking-wider">What We Solve</p>
                <div className="space-y-2 text-xs text-charcoal/80">
                  <div className="flex items-center gap-2"><Check size={14} className="text-rust stroke-[2.5]" /> Professional Reset & Burnout</div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-rust stroke-[2.5]" /> Business Partnership Friction</div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-rust stroke-[2.5]" /> Strategic Decisions & Pivots</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 02. THE 4-STEP FLOW */}
      <section className="bg-white/40 border-y border-rust/10 py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-rust">
              02. Visual Roadmap
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-charcoal">
              The Journey to Clarity
            </h2>
            <p className="text-sm text-charcoal/60 leading-relaxed">
              We design our digital checkout to resemble our coaching: minimalist, direct, and completely stress-free.
            </p>
          </div>

          {/* Process Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {stepsList.map((step, i) => (
              <div key={i} className="space-y-4 relative text-left">
                {/* Number Accent */}
                <span className="font-serif text-4xl md:text-5xl font-bold text-rust/20 block leading-none">
                  {step.num}
                </span>
                
                <h3 className="font-serif text-lg font-bold text-charcoal">
                  {step.title}
                </h3>
                
                <p className="text-xs md:text-sm text-charcoal/60 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 03. FOUNDER PROFILE */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Profile Card / Sidebar info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-rust/10 shadow-xs relative overflow-hidden flex flex-col justify-between">
              
              {/* Decorative Photo Placeholder */}
              <div className="aspect-[4/3] w-full bg-cream rounded-2xl flex items-center justify-center text-rust relative overflow-hidden border border-rust/5">
                <div className="absolute inset-0 bg-gradient-to-tr from-rust/5 to-transparent" />
                <User size={80} className="stroke-[1] opacity-65" />
                
                {/* Label badge */}
                <div className="absolute bottom-3 left-3 bg-charcoal/90 px-3 py-1.5 rounded-lg text-cream text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-rust" /> Certified Executive Coach
                </div>
              </div>

              {/* Founder Bio Block */}
              <div className="space-y-4 mt-6">
                <div>
                  <h3 className="font-serif text-xl font-bold text-charcoal">Julius Thorne</h3>
                  <p className="text-xs text-rust font-semibold mt-0.5">Founder & Lead Consulting Partner</p>
                </div>

                <div className="space-y-2 border-t border-rust/5 pt-4 text-xs text-charcoal/80">
                  <p className="flex items-center gap-2">
                    <GraduationCap size={14} className="text-rust" /> 
                    M.A. Organizational Psychology, INSEAD
                  </p>
                  <p className="flex items-center gap-2">
                    <Users size={14} className="text-rust" /> 
                    12+ Years Executive Consulting
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Narrative copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-rust">
              03. Founder Profile & Creed
            </span>
            
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-charcoal leading-tight">
              My philosophy: Unpacking complexity with structured dialogue.
            </h2>

            <div className="space-y-4 text-sm text-charcoal/70 leading-relaxed font-medium">
              <p>
                Throughout my decade as an organizational advisor, I noticed that corporate blockages and marital friction share the same core engine: communication fatigue. Partners stop explaining what they mean, because circular arguments are exhausting.
              </p>
              <p>
                Confusion to Clarity was built to reverse this spiral. We don't offer generic advice. We offer a structured, quiet editorial sandbox to look at your issues from the outside. By introducing diagnostic metrics, check-ins, and direct calendars, we restore transparency.
              </p>
              <p className="font-serif text-base italic text-rust font-semibold pt-2">
                "We don't manage conflict. We extract the signal from it."
              </p>
            </div>

            <div className="flex flex-wrap gap-6 border-t border-rust/10 pt-6">
              <div>
                <p className="text-2xl font-serif font-bold text-charcoal">200+</p>
                <p className="text-[10px] uppercase font-bold text-charcoal/50 tracking-wider">Executives Grounded</p>
              </div>
              <div className="w-px h-10 bg-rust/15" />
              <div>
                <p className="text-2xl font-serif font-bold text-charcoal">94%</p>
                <p className="text-[10px] uppercase font-bold text-charcoal/50 tracking-wider">Alignment Retention</p>
              </div>
              <div className="w-px h-10 bg-rust/15" />
              <div>
                <p className="text-2xl font-serif font-bold text-charcoal">100%</p>
                <p className="text-[10px] uppercase font-bold text-charcoal/50 tracking-wider">NDA Confidentiality</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 04. MEDIA & TRAINING */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-rust">
            04. Media & Training
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-charcoal">
            Video Lessons & Banners
          </h2>
          <p className="text-sm text-charcoal/60 leading-relaxed">
            Preview our methodology with free training clips and download guides tailored for leadership transitions.
          </p>
        </div>

        {/* Video Player component */}
        <VideoPlayer />
      </section>

      {/* 05. TESTIMONIALS (SOCIAL PROOF) */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-rust">
            05. Client Reviews
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-charcoal">
            Stories of Alignment
          </h2>
          <p className="text-sm text-charcoal/60 leading-relaxed">
            Read verified success stories from professionals and couples who successfully resolved their communication stalemates.
          </p>
        </div>

        {/* Testimonials Carousel component */}
        <TestimonialCarousel />
      </section>

      {/* 06. FAQ SECTION */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-rust">
            06. FAQ Section
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-charcoal">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-charcoal/60 leading-relaxed">
            Find answers to commonly asked questions regarding privacy, schedules, and operations.
          </p>
        </div>

        {/* Accordion Component */}
        <FAQSection />
      </section>

      {/* 07. SERVICES & PRICING */}
      <section id="services" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-rust">
            07. Structured Services
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-charcoal">
            Choose Your Framework
          </h2>
          <p className="text-sm text-charcoal/60 leading-relaxed">
            Select a pathway structured for individual transitions, business partnerships, or couples. Clear pricing, no surprise fees.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {servicePackages.map((pkg) => (
            <motion.div
              key={pkg.id}
              variants={fadeInUp}
              className={`bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md ${
                pkg.highlight
                  ? "border-rust ring-1 ring-rust"
                  : "border-rust/10"
              }`}
            >
              {pkg.highlight && (
                <div className="absolute top-0 right-0 bg-rust text-cream text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-bl-xl">
                  Popular Choice
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <h3 className="font-serif text-lg font-bold text-charcoal">
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-charcoal/50 font-medium mt-1">
                    {pkg.duration}
                  </p>
                </div>

                <div className="flex items-baseline gap-1 py-1">
                  <span className="text-3xl font-serif font-bold text-charcoal">
                    {pkg.price}
                  </span>
                  <span className="text-xs text-charcoal/50">/ flat fee</span>
                </div>

                <p className="text-xs text-charcoal/70 leading-relaxed min-h-[40px]">
                  {pkg.tagline}
                </p>

                {/* Features List */}
                <ul className="space-y-2.5 border-t border-rust/5 pt-4 text-xs text-charcoal/80">
                  {pkg.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={14} className="text-rust shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Book Now Button */}
              <button
                onClick={() => openBooking(pkg.id)}
                className={`w-full py-3 mt-8 font-semibold text-xs tracking-wider uppercase rounded-full cursor-pointer transition-colors duration-300 focus:outline-none ${
                  pkg.highlight
                    ? "bg-rust hover:bg-charcoal text-cream"
                    : "bg-charcoal hover:bg-rust text-cream"
                }`}
              >
                Book Now
              </button>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
