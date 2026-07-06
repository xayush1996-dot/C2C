"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  User, 
  GraduationCap, 
  Video, 
  Users, 
  HelpCircle, 
  Mail, 
  Phone, 
  Award, 
  BookOpen, 
  Compass, 
  Briefcase, 
  Clock, 
  Download, 
  Smile, 
  MessageSquare, 
  Heart, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  Layers,
  Zap,
  Target
} from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import FAQSection from "@/components/FAQSection";

// Animation presets
const fadeInUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
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

const programServices = [
  { id: 1, name: "Emotional Intelligence (EQ)", icon: Heart, desc: "Master self-regulation, active empathy, and relationship mapping." },
  { id: 2, name: "Soft Skills Training", icon: Smile, desc: "Enhance team communication, dynamic listening, and stress resilience." },
  { id: 3, name: "Public Speaking", icon: MessageSquare, desc: "Deliver presentations with executive presence and structural clarity." },
  { id: 4, name: "Leadership Development", icon: Award, desc: "Strategic delegation, team alignment, and visionary decision frameworks." },
  { id: 5, name: "Personality Development", icon: User, desc: "Refine body language, professional etiquette, and executive persona." },
  { id: 6, name: "Career Guidance", icon: Compass, desc: "Evaluate pathways mapped to personal strengths and market demands." },
  { id: 7, name: "Resume Building", icon: FileTextIcon, desc: "Recruiter-optimized CV designs highlighting placement competence." },
  { id: 8, name: "Interview Preparation", icon: Briefcase, desc: "Master case interviews, behavioral queries, and mock drills." },
  { id: 9, name: "Group Workshops", icon: Users, desc: "Interactive cohort programs on partnership conflict & joint alignment." },
  { id: 10, name: "1-on-1 Coaching", icon: Sparkles, desc: "Senior mentor sessions tailored to personal milestones and schedules." }
];

function FileTextIcon(props) {
  return <BookOpen {...props} />;
}

export default function HomePage() {
  const { openBooking } = useBooking();
  const [downloading, setDownloading] = useState(null);

  const triggerDownload = (resourceId) => {
    setDownloading(resourceId);
    setTimeout(() => {
      setDownloading(null);
      alert("Mock Resource Guide downloaded successfully!");
    }, 1500);
  };

  return (
    <div className="space-y-24 md:space-y-32 pb-24 bg-slate-50 text-slate-800">
      
      {/* 01. HERO SECTION */}
      <section id="hero" className="relative px-6 md:px-12 max-w-7xl mx-auto pt-10 md:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-bold uppercase tracking-wider border border-gold/20"
            >
              <Sparkles size={12} className="stroke-[2.5]" />
              FOUNDATION FOR SUSTAINABLE SUCCESS
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-navy leading-[1.15] tracking-tight"
            >
              Transforming Potential <br />
              into <span className="text-gold font-serif italic font-normal">Peak Performance</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-800/80 leading-relaxed max-w-xl font-medium"
            >
              We provide professional training in Emotional Intelligence (EQ), Soft Skills, Public Speaking, Leadership, Personality Development, Career Readiness, Interview Preparation, Communication Skills, and 1-on-1 Private Coaching to help students and young professionals achieve long-term success.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <button
                onClick={() => openBooking()}
                className="px-8 py-3.5 bg-navy hover:bg-gold text-white hover:text-navy font-bold text-xs tracking-wider uppercase rounded-full shadow-md transition-all duration-300 focus:outline-none cursor-pointer"
              >
                Book a Free Consultation
              </button>
              <a
                href="#services"
                className="px-6 py-3.5 border border-navy/20 hover:border-gold hover:text-gold text-navy font-bold text-xs tracking-wider uppercase rounded-full transition-all duration-300 flex items-center gap-1.5 focus:outline-none"
              >
                Explore Programs <ArrowRight size={14} />
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
            <div className="aspect-[4/5] max-w-md mx-auto bg-white rounded-3xl p-8 shadow-sm border border-navy/5 relative overflow-hidden flex flex-col justify-between">
              {/* Decorative graphic patterns */}
              <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-slate-50" />
              <div className="absolute right-10 top-10 w-6 h-6 rounded-full border border-gold/30" />
              
              <div className="space-y-4 relative z-10 text-left">
                <span className="text-[10px] font-bold text-gold uppercase tracking-widest block">BRAND CREED</span>
                <p className="font-serif text-2xl font-bold text-navy italic leading-snug">
                  "Excellence is not an event. It is a structured foundation. We build it with you."
                </p>
              </div>

              {/* Graphic checklist mock box */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-navy/5 relative z-10 space-y-4 text-left">
                <p className="text-[10px] uppercase font-bold text-navy/50 tracking-wider">Target Focus Area</p>
                <div className="space-y-2.5 text-xs font-semibold text-slate-800">
                  <div className="flex items-center gap-2.5"><Check size={14} className="text-gold stroke-[2.5]" /> College Students & Graduates</div>
                  <div className="flex items-center gap-2.5"><Check size={14} className="text-gold stroke-[2.5]" /> Corporate Trainees & Job Seekers</div>
                  <div className="flex items-center gap-2.5"><Check size={14} className="text-gold stroke-[2.5]" /> Active Young Professionals</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 02. TRUSTED BY / STATISTICS */}
      <section id="statistics" className="px-6 md:px-12 max-w-7xl mx-auto">
        <div className="bg-navy text-white rounded-3xl p-8 md:p-12 border border-gold/10 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
            <Award size={240} />
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 relative z-10 text-center">
            <div className="space-y-1">
              <h3 className="font-serif text-3xl md:text-5xl font-extrabold text-gold">5,000+</h3>
              <p className="text-[10px] uppercase font-bold text-slate-300/80 tracking-widest">Students Trained</p>
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-3xl md:text-5xl font-extrabold text-gold">150+</h3>
              <p className="text-[10px] uppercase font-bold text-slate-300/80 tracking-widest">Workshops Conducted</p>
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-3xl md:text-5xl font-extrabold text-gold">95%</h3>
              <p className="text-[10px] uppercase font-bold text-slate-300/80 tracking-widest">Placement Success</p>
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-3xl md:text-5xl font-extrabold text-gold">99%</h3>
              <p className="text-[10px] uppercase font-bold text-slate-300/80 tracking-widest">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* 03. OUR SERVICES */}
      <section id="services" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            03. PROGRAM PORTFOLIO
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-navy">
            Our Programs & Services
          </h2>
          <p className="text-sm text-slate-800/60 leading-relaxed font-medium">
            Explore structured training methodologies engineered to refine communication, accelerate placement capability, and foster leadership synergy.
          </p>
        </div>

        {/* Services Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        >
          {programServices.map((p) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.id}
                variants={fadeInUp}
                className="bg-white rounded-2xl p-6 border border-navy/5 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 text-left group cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/5 flex items-center justify-center text-gold border border-gold/10 group-hover:bg-gold group-hover:text-white transition-all duration-300">
                    <Icon size={18} />
                  </div>
                  <h4 className="font-serif text-sm font-bold text-navy group-hover:text-gold transition-colors duration-300">
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-slate-800/60 leading-normal font-medium">
                    {p.desc}
                  </p>
                </div>
                <div className="text-[10px] font-bold text-navy/40 flex items-center gap-1 group-hover:text-gold transition-colors">
                  Learn Details <ChevronRight size={10} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* 04. WHY CHOOSE US */}
      <section id="why-choose-us" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Narrative Info */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gold block mb-2">
                04. THE COMPETITIVE ADVANTAGE
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-navy leading-tight">
                Why Choose Our Training Framework?
              </h2>
            </div>
            
            <p className="text-sm text-slate-800/70 leading-relaxed font-medium">
              We specialize in closing the gap between potential and peak placement performance, providing practical learning loops instead of static theoretical textbooks.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {[
                { title: "Expert Trainers", desc: "Coaches with executive background experience in corporate governance." },
                { title: "Personalized Coaching", desc: "Structured blueprints customized to target your specific hurdles." },
                { title: "Practical Learning", desc: "Intensive simulations, recording playbacks, and real case studies." },
                { title: "Industry-Relevant Skills", desc: "Focusing on EQ, soft skills, and contemporary tools." },
                { title: "Career-Focused Programs", desc: "Direct readiness models helping you secure elite placements." },
                { title: "Lifetime Learning Mindset", desc: "Building sustainable habits for continuous performance updates." }
              ].map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                      <Check size={10} className="stroke-[3]" />
                    </div>
                    <h4 className="font-serif text-xs font-bold text-navy">{item.title}</h4>
                  </div>
                  <p className="text-[10px] text-slate-800/60 leading-normal pl-7 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Graphical Display */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-8 border border-navy/5 shadow-2xs text-left space-y-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-gold/5 rounded-bl-full" />
              <h3 className="font-serif text-lg font-bold text-navy border-b border-navy/5 pb-3">Core Training Philosophy</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-navy/5 flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-navy shrink-0">
                    <TrendingUp size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs text-navy">High-Value EQ Integration</h5>
                    <p className="text-[10px] text-slate-800/60">We treat soft skills and emotional resilience as primary placement assets.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-navy/5 flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-navy shrink-0">
                    <Layers size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs text-navy">Structured Diagnostic Milestones</h5>
                    <p className="text-[10px] text-slate-800/60">Continuous tracking through custom dashboard ledgers and session review audio.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-navy/5 flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-navy shrink-0">
                    <Zap size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs text-navy">Actionable Feedback Blueprints</h5>
                    <p className="text-[10px] text-slate-800/60">Immediate worksheets and practical timelines generated after every consultation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 05. LEARNING JOURNEY */}
      <section id="learning-journey" className="bg-white border-y border-navy/5 py-20 px-6 md:px-12 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              05. ROADMAP TO PERFORMANCE
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-navy">
              The Learning Journey
            </h2>
            <p className="text-sm text-slate-800/60 leading-relaxed font-medium">
              We design your path to peak confidence through five structured development milestones.
            </p>
          </div>

          {/* Process Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            {[
              { num: "01", title: "Discover", desc: "Take our initial diagnostic mapping survey to pinpoint communication roadblocks." },
              { num: "02", title: "Learn", desc: "Engage in intensive professional workshops and customized 1-on-1 coaching." },
              { num: "03", title: "Practice", desc: "Simulate real-life career interviews and deliver active public speaking drills." },
              { num: "04", title: "Improve", desc: "Review direct coordinator feedback sheets and habit tracker metrics." },
              { num: "05", title: "Achieve", desc: "Enter placement pipelines with absolute clarity and executive confidence." }
            ].map((step, i) => (
              <div key={i} className="space-y-4 relative text-left group">
                <span className="font-serif text-4xl md:text-5xl font-extrabold text-gold/20 group-hover:text-gold/45 block leading-none transition-colors duration-300">
                  {step.num}
                </span>
                <h3 className="font-serif text-base font-bold text-navy">
                  {step.title}
                </h3>
                <p className="text-[11px] text-slate-800/60 leading-normal font-medium">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 06. TESTIMONIALS */}
      <section id="testimonials" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            06. SUCCESS STORIES
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-navy">
            What Our Alumni Say
          </h2>
          <p className="text-sm text-slate-800/60 leading-relaxed font-medium">
            Read verified feedback from graduates, young managers, and corporate trainees who achieved success.
          </p>
        </div>

        {/* Carousel Component */}
        <TestimonialCarousel />
      </section>

      {/* 07. UPCOMING WORKSHOPS */}
      <section id="workshops" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            07. ACTIVE COHORTS
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-navy">
            Upcoming Workshops & Webinars
          </h2>
          <p className="text-sm text-slate-800/60 leading-relaxed font-medium">
            Reserve your seat in our next live training program. Fast registration, direct calendar setup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          {[
            { id: 1, date: "July 18, 2026", time: "10:00 AM — 12:30 PM", topic: "Mastering Public Speaking & Executive Presence", instructor: "Julius Thorne", status: "Seats Open" },
            { id: 2, date: "July 25, 2026", time: "02:00 PM — 04:30 PM", topic: "Emotional Intelligence (EQ) for Corporate Trainees", instructor: "Julius Thorne", status: "Filling Fast" }
          ].map((w) => (
            <div key={w.id} className="bg-white rounded-3xl p-6 border border-navy/5 shadow-2xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded-md bg-gold/10 text-gold text-[9px] uppercase font-bold tracking-wider">
                    {w.status}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-800/50">
                    <Clock size={12} className="text-gold" />
                    <span>{w.time}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-serif text-base font-bold text-navy leading-snug">{w.topic}</h4>
                  <p className="text-[11px] text-slate-800/60">Lead Instructor: <strong className="font-semibold text-charcoal">{w.instructor}</strong></p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-navy/5">
                <div className="flex items-center gap-1 text-[11px] text-slate-800/80">
                  <Calendar size={13} className="text-gold" />
                  <span className="font-bold">{w.date}</span>
                </div>

                <button
                  onClick={() => openBooking()}
                  className="px-4 py-2 bg-navy hover:bg-gold text-white hover:text-navy font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer focus:outline-none"
                >
                  Register Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 08. CAREER RESOURCES */}
      <section id="resources" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            08. TRAINING DOWNLOADS
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-navy">
            Career Resources & Guides
          </h2>
          <p className="text-sm text-slate-800/60 leading-relaxed font-medium">
            Get early access to private resources, diagnostic spreadsheets, and tailored PDF guides.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { id: 1, type: "Free PDF Guide", title: "The Executive Resume Toolkit", desc: "A comprehensive checklist, cover layout templates, and formatting strategies." },
            { id: 2, type: "Placement Guide", title: "Interview Strategy Mastery", desc: "Frameworks to navigate behavioral queries, case studies, and corporate stress tests." },
            { id: 3, type: "Worksheet template", title: "Soft Skills Habit Ledger", desc: "Weekly self-evaluation templates for EQ milestones, team tasks, and networking schedules." }
          ].map((r) => (
            <div key={r.id} className="bg-white rounded-3xl p-6 border border-navy/5 shadow-2xs flex flex-col justify-between text-left space-y-6">
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-gold tracking-widest block">{r.type}</span>
                <h4 className="font-serif text-base font-bold text-navy leading-snug">{r.title}</h4>
                <p className="text-[11px] text-slate-800/60 leading-relaxed">{r.desc}</p>
              </div>

              <button
                onClick={() => triggerDownload(r.id)}
                disabled={downloading === r.id}
                className="w-full py-2.5 bg-slate-50 hover:bg-gold/10 border border-navy/10 hover:border-gold text-navy hover:text-gold font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
              >
                {downloading === r.id ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download size={12} />
                    Download File
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 09. CHOOSE YOUR FRAMEWORK (PRICING) */}
      <section id="pricing" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            09. DIRECT BOOKING
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-navy">
            Choose Your Framework
          </h2>
          <p className="text-sm text-slate-800/60 leading-relaxed font-medium">
            Select the direct pathway structured for individual transitions, business partnerships, or couples. Clear pricing, no surprise fees.
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
              className={`bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md text-left ${
                pkg.highlight
                  ? "border-gold ring-1 ring-gold"
                  : "border-navy/5"
              }`}
            >
              {pkg.highlight && (
                <div className="absolute top-0 right-0 bg-gold text-navy text-[9px] uppercase font-extrabold tracking-widest px-3 py-1 rounded-bl-xl">
                  Popular Choice
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <h3 className="font-serif text-base font-bold text-navy">
                    {pkg.name}
                  </h3>
                  <p className="text-[10px] text-slate-800/50 font-medium mt-1">
                    {pkg.duration}
                  </p>
                </div>

                <div className="flex items-baseline gap-1 py-1">
                  <span className="text-3xl font-serif font-bold text-navy">
                    {pkg.price}
                  </span>
                  <span className="text-xs text-slate-800/50">/ flat fee</span>
                </div>

                <p className="text-xs text-slate-800/70 leading-relaxed min-h-[40px] font-medium">
                  {pkg.tagline}
                </p>

                {/* Features List */}
                <ul className="space-y-2.5 border-t border-navy/5 pt-4 text-xs text-slate-800/80 font-medium">
                  {pkg.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={14} className="text-gold shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Book Now Button */}
              <button
                onClick={() => openBooking(pkg.id)}
                className={`w-full py-3 mt-8 font-bold text-xs tracking-wider uppercase rounded-full cursor-pointer transition-colors duration-300 focus:outline-none ${
                  pkg.highlight
                    ? "bg-gold hover:bg-navy text-navy hover:text-white"
                    : "bg-navy hover:bg-gold text-white hover:text-navy"
                }`}
              >
                Book Now
              </button>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 10. FAQ SECTION */}
      <section id="faq" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            10. FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-navy">
            Questions & Answers
          </h2>
          <p className="text-sm text-slate-800/60 leading-relaxed font-medium">
            Find answers to commonly asked questions regarding privacy, schedules, and operations.
          </p>
        </div>

        {/* Accordion Component */}
        <FAQSection />
      </section>

      {/* 11. FINAL CTA */}
      <section className="px-6 md:px-12 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-navy to-[#1E293B] rounded-3xl p-8 md:p-12 text-white border border-gold/20 shadow-md relative overflow-hidden text-center space-y-6">
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
            <Sparkles size={200} />
          </div>
          
          <div className="space-y-2 relative z-10 max-w-lg mx-auto">
            <h3 className="font-serif text-2xl md:text-3xl font-extrabold leading-tight">
              Ready to Build Your Future?
            </h3>
            <p className="text-xs md:text-sm text-slate-300/80 leading-relaxed">
              Book your private consultation or group mentorship session. Unlock structural executive skills today.
            </p>
          </div>

          <div className="pt-2 relative z-10">
            <button
              onClick={() => openBooking()}
              className="px-8 py-3.5 bg-gold hover:bg-white text-navy font-bold text-xs tracking-wider uppercase rounded-full shadow-md transition-colors duration-300 focus:outline-none cursor-pointer"
            >
              Book Your Session
            </button>
          </div>
        </div>
      </section>

      {/* 12. CONTACT / WHATSAPP SECTION */}
      <section id="contact" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-navy/5 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Get In Touch */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div>
                <span className="inline-block px-3 py-1 bg-cream border border-rust/20 rounded-full text-[9px] uppercase font-bold tracking-widest text-rust">
                  GET IN TOUCH
                </span>
              </div>
              
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy leading-tight">
                Get in Touch with Us
              </h2>

              <p className="text-xs md:text-sm text-slate-800/60 leading-relaxed max-w-xl">
                Have specific queries regarding university admission fees, syllabus, or mentorship paths? Send us a message and our advisors will respond within 24 hours.
              </p>

              {/* Contacts info list */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rust/5 flex items-center justify-center text-rust border border-rust/10">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-800/40 tracking-wider">Email Us</p>
                    <a href="mailto:admissions@c2cclarity.com" className="text-sm font-semibold text-navy hover:text-rust transition-colors">
                      admissions@c2cclarity.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-emerald-500/80 tracking-wider">Call / WhatsApp</p>
                    <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                      +91 98765 43210
                    </a>
                  </div>
                </div>
              </div>

              {/* WhatsApp Button styled in Green matching the photo */}
              <div className="pt-4">
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-emerald-500 hover:bg-emerald-500 text-emerald-600 hover:text-white text-xs uppercase font-bold tracking-wider rounded-full transition-all duration-300 shadow-2xs cursor-pointer focus:outline-none"
                >
                  Chat with Advisor
                </a>
              </div>
            </div>

            {/* Right Column: WhatsApp QR code representation */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="bg-[#FAF8F5] p-8 rounded-3xl border border-navy/5 flex flex-col items-center space-y-4 max-w-sm w-full text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 flex items-center gap-1">
                    WhatsApp Active Support
                  </span>
                </div>
                <div className="w-56 h-56 bg-white p-3 rounded-2xl border border-navy/5 shadow-2xs relative group overflow-hidden">
                  <img
                    src="/whatsapp_qr.png"
                    alt="WhatsApp QR Code"
                    className="w-full h-full object-contain select-none"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-charcoal">Scan to Chat on WhatsApp</p>
                  <p className="text-[10px] text-charcoal/50 leading-relaxed px-4">
                    Open your phone camera or WhatsApp scanner to instantly connect with our advisory stream.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
