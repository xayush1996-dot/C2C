"use client";

import React, { useState, useEffect } from "react";
import { Check, Mail, Phone, Play, Award, Globe, Users, MessageSquare, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import VideoPlayer from "@/components/VideoPlayer";
import FAQSection from "@/components/FAQSection";

const consultingTabs = [
  {
    id: "career",
    title: "01 Career Clarity & Mapping",
    heading: "Career Clarity & Mapping",
    sub: "INCLUDED IN 01",
    desc: "Psychometric evaluations, aptitude mapping, and interest charting to discover the perfect corporate or research career paths.",
    features: [
      "Detailed Psychometric Indicator Report",
      "1-on-1 Strengths Assessment Desk",
      "Target Job Profile Benchmarking",
      "3-Year Skill Roadmap Planning"
    ]
  },
  {
    id: "admissions",
    title: "02 Higher Education Admissions",
    heading: "Higher Education Admissions",
    sub: "INCLUDED IN 02",
    desc: "University scouting, application strategy, profile analysis, and recommendation letter frameworks for top programs.",
    features: [
      "Ivy & Top Tier Scouting Sheets",
      "Statement of Purpose (SOP) Auditing",
      "Letter of Recommendation (LOR) Guides",
      "Resume Re-formatting Desk"
    ]
  },
  {
    id: "roadmap",
    title: "03 Study Abroad Roadmap",
    heading: "Study Abroad Roadmap",
    sub: "INCLUDED IN 03",
    desc: "Global visa navigation, funding plans, housing checklists, and pre-departure briefings for international students.",
    features: [
      "Country & Visa Compliance Audits",
      "Scholarship & Aid Application Toolkits",
      "Housing & Flight Booking Checklists",
      "Alumni Peer Connection Desk"
    ]
  },
  {
    id: "profile",
    title: "04 Profile Tuning & Skill Setup",
    heading: "Profile Tuning & Skill Setup",
    sub: "INCLUDED IN 04",
    desc: "LinkedIn branding, resume building, presentation coaching, and domain-specific soft skills training.",
    features: [
      "LinkedIn Profile Makeover",
      "Executive Pitch Prep Sessions",
      "Cold Emailing Templates",
      "Professional Portfolio Audit"
    ]
  }
];

const testimonials = [
  {
    quote: "C2C helped me choose between MS in Data Science and MBA in Finance. Dr. Sharma analyzed my skills and guided me to MS in Business Analytics. I got admitted to UT Austin!",
    initials: "AM",
    name: "Aditya Mishra",
    sub: "UT Austin (MSBA Alumni)"
  },
  {
    quote: "I was confused between corporate consulting and product management. The structured diagnostic profiling maps pinpointed my exact strengths in product planning. Got into HEC Paris!",
    initials: "SR",
    name: "Sanya Roy",
    sub: "HEC Paris (MSc Management)"
  },
  {
    quote: "The 1-on-1 resume polish and direct visa guidelines streamlined my transition to the UK. Their mentors are incredibly supportive and professional.",
    initials: "KP",
    name: "Karan Patel",
    sub: "LSE (Finance Alumni)"
  }
];

export default function HomePage() {
  const { openBooking } = useBooking();
  const [activeTab, setActiveTab] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [cmsContent, setCmsContent] = useState({});
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchCMSData = async () => {
      try {
        const [contentRes, servicesRes] = await Promise.all([
          fetch("/api/content"),
          fetch("/api/services")
        ]);
        if (contentRes.ok) {
          const contentData = await contentRes.json();
          if (contentData && contentData.success) {
            setCmsContent(contentData.content);
          }
        }
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          if (servicesData && servicesData.success) {
            setServices(servicesData.services);
          }
        }
      } catch (err) {
        console.error("Failed to fetch CMS data:", err);
      }
    };
    fetchCMSData();
  }, []);

  const getInitials = (name) => {
    if (!name) return "LM";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handlePrevTestimonial = () => {
    setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNextTestimonial = () => {
    setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="text-text-primary bg-bg-base relative flex flex-col">
      
      {/* 01. HERO SECTION */}
      <section id="hero" className="w-full bg-bg-base text-text-primary px-6 md:px-12 py-16 md:py-24 border-b border-border-divider/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Top Grid: Main Title & Global Desk Info */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-8 border-b border-border-divider/50">
            {/* Large Header */}
            <div className="lg:col-span-7 text-left">
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-text-primary">
                {cmsContent.hero_title ? (
                  cmsContent.hero_title.includes("Clarity") ? (
                    <>
                      {cmsContent.hero_title.split("Clarity")[0]}
                      <span className="text-accent-gold">Clarity</span>
                      {cmsContent.hero_title.split("Clarity")[1]}
                    </>
                  ) : cmsContent.hero_title
                ) : (
                  <>
                    Confusion to<br />
                    <span className="text-accent-gold">Clarity</span>
                  </>
                )}
              </h1>
            </div>
            
            {/* Global Admissions & Career Desk info */}
            <div className="lg:col-span-5 text-left space-y-3 lg:pt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-accent-gold">
                  GLOBAL ADMISSIONS & CAREER DESK
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed font-medium max-w-md">
                {cmsContent.hero_subtitle || "A scientific, 1-on-1 mentorship platform assisting students and professionals in mapping cognitive strengths to top global universities and career paths."}
              </p>
            </div>
          </div>

          {/* Bottom Grid: Video Column & Text Info Column */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Column 1: Video Masterclass Card */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[16/10] bg-surface rounded-[24px] overflow-hidden border border-border-divider/50 shadow-sm group">
                <img
                  src="/leadership_masterclass.png"
                  alt="Profile Building & SOP Strategies Masterclass"
                  className="w-full h-full object-cover select-none"
                />
                {/* Dark overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-accent-gold/90 hover:bg-accent-gold text-[#1E1E1E] flex items-center justify-center shadow-lg transition-transform duration-300 transform group-hover:scale-105 cursor-pointer">
                    <Play size={24} className="fill-current translate-x-0.5" />
                  </div>
                </div>

                {/* Text bottom left */}
                <div className="absolute bottom-6 left-6 text-left space-y-1">
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest block">
                    WATCH MASTERCLASS CLIP
                  </span>
                  <h4 className="font-serif text-lg md:text-xl font-bold text-white leading-tight">
                    Profile Building & SOP Strategies
                  </h4>
                </div>
              </div>
            </div>

            {/* Column 2: Details & Actions */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-text-primary leading-tight">
                Helping Students & Young Professionals Build a Foundation for Sustainable Success
              </h2>
              
              <p className="text-sm text-text-secondary leading-relaxed font-medium">
                Transforming Potential into Peak Performance. We provide professional training in Emotional Intelligence (EQ), Soft Skills, Public Speaking, Leadership, and Personality Development through group workshops and 1-on-1 private sessions.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => openBooking()}
                  className="px-8 py-3.5 bg-accent-gold hover:bg-accent-gold/90 font-bold text-xs tracking-wider uppercase rounded-full shadow-md transition-all duration-200 focus:outline-none cursor-pointer"
                >
                  Schedule a consultation
                </button>
                <a
                  href="#streams"
                  className="px-6 py-3.5 border border-accent-gold text-accent-gold hover:bg-accent-gold/10 font-bold text-xs tracking-wider uppercase rounded-full transition-all duration-200 focus:outline-none"
                >
                  Our Programs
                </a>
              </div>

              {/* Checklist */}
              <div className="space-y-3 pt-4 border-t border-border-divider/50">
                {[
                  "Custom Career Mapping & Profile Tuning",
                  "Global Admission Roadmaps & SOP Audits",
                  "1-on-1 Direct Strategy Mentorship Desk"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border border-accent-gold flex items-center justify-center shrink-0">
                      <Check size={10} className="text-accent-gold stroke-[3]" />
                    </div>
                    <span className="text-xs font-bold text-text-primary">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-24 md:space-y-32 pb-24 bg-bg-base w-full pt-24 md:pt-32">

        {/* 03. MEDIA & TRAINING */}
        <section id="media-training" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">
              03. MEDIA & TRAINING
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-text-primary">
              Video Lessons & Banners
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed font-medium">
              Preview our methodology with free training clips and download guides tailored for leadership transitions.
            </p>
          </div>

          <VideoPlayer />
        </section>

        {/* 04. THE DIFFERENCE */}
        <section id="difference" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left side text */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div>
                <span className="inline-block px-3 py-1 bg-bg-elevated border border-border-divider rounded-full text-[9px] uppercase font-bold tracking-widest text-text-secondary mb-3">
                  THE DIFFERENCE
                </span>
                <h2 className="font-serif text-3xl md:text-4.5xl font-extrabold text-text-primary leading-tight">
                  What Makes C2C<br />Mentorship Different?
                </h2>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed font-medium">
                We don't sell standardized admission packages or rely on generic databases. Our counseling provides clinical profiling, verified mentor connections, and structural skill tracking.
              </p>

              {/* Feature List */}
              <div className="space-y-4 pt-4 border-t border-border-divider/50">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-accent-gold stroke-[3]" />
                    <h4 className="font-sans text-sm font-bold text-text-primary">1-on-1 Active Mentorship</h4>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed pl-6 font-medium">
                    Direct guidance from seasoned industry leads and alumni from Ivy League and top European institutions.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-accent-gold stroke-[3]" />
                    <h4 className="font-sans text-sm font-bold text-text-primary">Profile Building & Skill Development</h4>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed pl-6 font-medium">
                    Help drafting publications, securing internships, and learning domain-specific tools.
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: 2x2 grid cards */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Award, title: "Ivy Accredited", desc: "Ivy league advisors & top mentors." },
                { icon: Globe, title: "Global Admissions", desc: "Assistance across 15+ countries." },
                { icon: Users, title: "10k+ Community", desc: "Active student and alumni ecosystem." },
                { icon: MessageSquare, title: "24/7 Desk", desc: "Dedicated guidance via chat & calls." }
              ].map((card, idx) => {
                const IconComp = card.icon;
                return (
                  <div key={idx} className="bg-surface rounded-2xl p-6 border border-border-divider/50 flex flex-col items-center text-center space-y-4 shadow-2xs hover:shadow-xs transition-shadow duration-300">
                    <div className="w-12 h-12 rounded-xl bg-bg-base flex items-center justify-center text-[#1E1E1E] border border-border-divider/50 shadow-2xs">
                      <IconComp size={20} className="stroke-[1.5]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-sans text-sm font-bold text-text-primary">{card.title}</h4>
                      <p className="text-xs text-text-secondary font-medium leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* 05. THE ROAD TO CLARITY */}
        <section id="process" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Heading and description */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <div>
                <span className="inline-block px-3 py-1 bg-bg-elevated border border-border-divider rounded-full text-[9px] uppercase font-bold tracking-widest text-text-secondary mb-3">
                  THE ROAD TO CLARITY
                </span>
                <h2 className="font-serif text-3xl md:text-4.5xl font-extrabold text-text-primary leading-tight">
                  Our Structured<br />Mentorship Process
                </h2>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed font-medium">
                We follow a step-by-step roadmap to assess your profile, draft strategies, build capabilities, and lock in admissions and career positions.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => openBooking()}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent-gold hover:bg-accent-gold/90 text-bg-base font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-colors duration-300 focus:outline-none cursor-pointer"
                >
                  Talk to an advisor <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Right Column: Step Cards */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {[
                { num: "01", title: "Discovery & Profiling", desc: "We map out your current academic achievements, skills, and confusion items using custom clinical indicators." },
                { num: "02", title: "Strategy Architecture", desc: "We design a custom path catalog containing relevant courses, target countries, and corporate goals." },
                { num: "03", title: "Execution & Polishing", desc: "Our team collaborates to polish your CV/LinkedIn, write SOP drafts, and practice mock interview drills." },
                { num: "04", title: "Placement & Admits", desc: "We review scholarships, submit applications, manage visa slots, and track pre-departure milestones." }
              ].map((step, idx) => (
                <div key={idx} className="bg-surface rounded-2xl p-6 border border-border-divider/50 shadow-2xs relative overflow-hidden text-left flex flex-col sm:flex-row sm:items-start gap-4 hover:shadow-xs transition-shadow duration-300">
                  {/* Watermark large number in the background on the bottom right */}
                  <div className="absolute -right-4 -bottom-6 text-7xl font-extrabold text-text-primary/5 select-none pointer-events-none font-sans">
                    {step.num}
                  </div>

                  {/* Left number indicator */}
                  <div className="text-sm font-bold text-accent-gold font-sans tracking-wide shrink-0">
                    {step.num}
                  </div>

                  {/* Step details */}
                  <div className="space-y-1 relative z-10 pr-6">
                    <h4 className="font-sans text-sm font-bold text-text-primary">{step.title}</h4>
                    <p className="text-xs text-text-secondary font-medium leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* 06. COUNSELING STREAMS */}
        <section id="streams" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 text-left">
            <div className="space-y-4 max-w-2xl">
              <span className="inline-block px-3 py-1 bg-bg-elevated border border-border-divider rounded-full text-[9px] uppercase font-bold tracking-widest text-text-secondary">
                COUNSELING STREAMS
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-text-primary leading-tight">
                Empowering Decisions through Strategic Consulting
              </h2>
            </div>
            <div>
              <button 
                onClick={() => openBooking()}
                className="px-6 py-2.5 border border-border-divider hover:border-text-primary/40 bg-surface/50 hover:bg-surface text-text-primary font-bold text-xs uppercase tracking-wider rounded-full shadow-2xs transition-colors focus:outline-none cursor-pointer"
              >
                Browse all programs
              </button>
            </div>
          </div>

          {/* 3 cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.length > 0 ? (
              services.map((pkg, idx) => (
                <div key={pkg._id || idx} className="bg-surface rounded-[24px] p-6 border border-border-divider/50 shadow-2xs hover:shadow-xs transition-shadow duration-300 flex flex-col justify-between text-left space-y-6">
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wider block">
                      {pkg.code === "eq" ? "MAPPING POTENTIAL" : pkg.code === "public" ? "GLOBAL ADMISSIONS" : "DIRECT CONSULTING"}
                    </span>
                    <h4 className="font-serif text-lg font-bold text-text-primary leading-snug">
                      {pkg.name}
                    </h4>
                    <p className="text-xs text-text-secondary font-medium leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border-divider/50 flex items-center justify-between">
                    <span className="text-lg font-extrabold text-text-primary">
                      ₹{pkg.price}
                    </span>
                    <button
                      onClick={() => openBooking(pkg.code)}
                      className="text-xs font-bold text-accent-gold uppercase tracking-wider hover:text-accent-gold/80 transition-colors flex items-center gap-1 focus:outline-none cursor-pointer"
                    >
                      Book Now <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              [
                {
                  tag: "MAPPING POTENTIAL",
                  title: "Emotional Intelligence (EQ) & Self-Awareness",
                  desc: "Learn to recognize emotional triggers, map cognitive patterns, build self-awareness, and deploy empathetic response systems in corporate and social environments.",
                  price: "₹2999"
                },
                {
                  tag: "GLOBAL ADMISSIONS",
                  title: "Public Speaking, Leadership & Confidence Building",
                  desc: "Develop high-impact presence, construct persuasive speeches, master body posture, and overcome stage fright to lead teams with ultimate confidence.",
                  price: "₹4999"
                },
                {
                  tag: "DIRECT CONSULTING",
                  title: "Confidential 1-on-1 Private Mentorship",
                  desc: "A completely confidential, dedicated counseling and advisory desk to resolve specific soft-skill blocks, emotional regulation challenges, or public presentation reviews.",
                  price: "₹1499"
                }
              ].map((pkg, idx) => (
                <div key={idx} className="bg-surface rounded-[24px] p-6 border border-border-divider/50 shadow-2xs hover:shadow-xs transition-shadow duration-300 flex flex-col justify-between text-left space-y-6">
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wider block">
                      {pkg.tag}
                    </span>
                    <h4 className="font-serif text-lg font-bold text-text-primary leading-snug">
                      {pkg.title}
                    </h4>
                    <p className="text-xs text-text-secondary font-medium leading-relaxed">
                      {pkg.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border-divider/50 flex items-center justify-between">
                    <span className="text-lg font-extrabold text-text-primary">
                      {pkg.price}
                    </span>
                    <button
                      onClick={() => openBooking()}
                      className="text-xs font-bold text-accent-gold uppercase tracking-wider hover:text-accent-gold/80 transition-colors flex items-center gap-1 focus:outline-none cursor-pointer"
                    >
                      Book Now <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 07. CONSULTING AREAS */}
        <section id="areas" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="inline-block px-3 py-1 bg-bg-elevated border border-border-divider rounded-full text-[9px] uppercase font-bold tracking-widest text-text-secondary">
              CONSULTING AREAS
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-text-primary">
              Strategic Solutions Built Around Your Needs
            </h2>
          </div>

          {/* Tabs Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Tab list */}
            <div className="lg:col-span-5 flex flex-col gap-2.5 w-full">
              {consultingTabs.map((tab, idx) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`w-full px-6 py-4 rounded-xl text-left text-xs font-bold tracking-wide uppercase transition-all duration-300 border focus:outline-none cursor-pointer ${
                    activeTab === idx
                      ? "bg-accent-gold border-transparent text-[#1E1E1E] shadow-sm"
                      : "bg-surface hover:bg-surface-hover/80 border-border-divider/50 text-text-primary"
                  }`}
                >
                  {tab.title}
                </button>
              ))}
            </div>

            {/* Right Column: Tab detail display panel */}
            <div className="lg:col-span-7 bg-surface rounded-[24px] p-6 md:p-8 border border-border-divider/50 shadow-2xs hover:shadow-xs transition-shadow duration-300 text-left space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest block">
                  {consultingTabs[activeTab].sub}
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-extrabold text-text-primary leading-tight">
                  {consultingTabs[activeTab].heading}
                </h3>
                <p className="text-xs md:text-sm text-text-secondary font-medium leading-relaxed">
                  {consultingTabs[activeTab].desc}
                </p>
              </div>

              {/* Dynamic feature list items (2x2 grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-divider/50">
                {consultingTabs[activeTab].features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2">
                    <Check size={14} className="text-accent-gold stroke-[3] shrink-0" />
                    <span className="text-xs font-bold text-text-primary leading-snug">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="pt-4">
                <button
                  onClick={() => openBooking()}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent-gold hover:bg-accent-gold/90 text-bg-base font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-colors duration-300 focus:outline-none cursor-pointer"
                >
                  Book consultation session <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* 08. STATS & SUCCESS */}
        <section id="success" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20 space-y-24">
          
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { val: cmsContent.track_record_years || "10,000+", sub: cmsContent.track_record_years ? "Global Expertise" : "Students Advised Globally" },
              { val: cmsContent.track_record_success || "98%", sub: cmsContent.track_record_success ? "Transition Success" : "Admission Success Rate" },
              { val: cmsContent.track_record_retention || "₹4.5Cr+", sub: cmsContent.track_record_retention ? "Client Retention" : "Scholarships Secured" },
              { val: cmsContent.track_record_leaders || "15+", sub: cmsContent.track_record_leaders ? "Leaders Coached" : "Target Countries" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-surface rounded-2xl p-6 border border-border-divider/50 shadow-2xs hover:shadow-xs transition-shadow duration-300 text-center space-y-1.5">
                <h3 className="font-sans text-2xl sm:text-3xl font-extrabold text-text-primary leading-none">
                  {stat.val}
                </h3>
                <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest leading-relaxed">
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Testimonials Carousel */}
          <div className="text-center max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 bg-bg-elevated border border-border-divider rounded-full text-[9px] uppercase font-bold tracking-widest text-text-secondary">
                ALUMNI VOICES
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-text-primary">
                Student Success Journeys
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed font-medium">
                Hear from students who successfully resolved their career choices.
              </p>
            </div>

            {/* Main Quote Card with arrows */}
            <div className="relative">
              {/* Left Arrow Button */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-6 z-10">
                <button
                  onClick={handlePrevTestimonial}
                  className="w-10 h-10 rounded-full bg-surface hover:bg-surface-hover border border-border-divider/50 flex items-center justify-center text-text-secondary hover:text-text-primary shadow-sm hover:scale-105 transition-all focus:outline-none cursor-pointer"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>

              {/* Quote panel */}
              <div className="bg-surface rounded-[24px] p-8 md:p-12 border border-border-divider/50 shadow-xs max-w-3xl mx-auto space-y-8 relative overflow-hidden min-h-[220px] flex flex-col justify-center">
                {/* Top border gold stripe */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-accent-gold" />
                
                {/* Gold quote symbol icon */}
                <div className="flex justify-center">
                  <span className="font-serif text-5xl text-accent-gold/45 leading-none select-none font-bold">
                    “
                  </span>
                </div>

                <div className="space-y-6">
                  <p className="text-sm md:text-base text-text-primary font-medium italic leading-relaxed px-4 sm:px-8">
                    "{testimonials[activeTestimonial].quote}"
                  </p>

                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#EAE7DD] border border-border-divider/30 flex items-center justify-center">
                      <span className="font-sans text-xs font-bold text-accent-gold select-none">
                        {testimonials[activeTestimonial].initials}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-sans text-xs font-bold text-text-primary">
                        {testimonials[activeTestimonial].name}
                      </h4>
                      <p className="text-[10px] text-text-secondary font-medium tracking-wide">
                        {testimonials[activeTestimonial].sub}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Arrow Button */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-6 z-10">
                <button
                  onClick={handleNextTestimonial}
                  className="w-10 h-10 rounded-full bg-surface hover:bg-surface-hover border border-border-divider/50 flex items-center justify-center text-text-secondary hover:text-text-primary shadow-sm hover:scale-105 transition-all focus:outline-none cursor-pointer"
                  aria-label="Next testimonial"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 09. THE FOUNDER */}
        <section id="founder" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
          <div className="bg-surface border border-border-divider/50 rounded-[24px] p-8 md:p-12 shadow-xs max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
              
              {/* Left: Founder Avatar */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
                <div className="w-44 h-44 rounded-full bg-[#EAE7DD] border border-border-divider/30 flex items-center justify-center shadow-xs">
                  <span className="font-sans text-5xl font-extrabold tracking-wide text-accent-gold select-none font-sans">
                    {getInitials(cmsContent.founder_name)}
                  </span>
                </div>
                <div className="mt-6 space-y-1">
                  <h4 className="font-sans text-xl font-bold text-text-primary">
                    {cmsContent.founder_name || "Lead EQ Coach & Mentor"}
                  </h4>
                  <p className="text-xs text-text-secondary/80 font-semibold tracking-wide">
                    Chief Trainer, Confusion to Clarity
                  </p>
                </div>
              </div>

              {/* Right: Narrative Details */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div>
                  <span className="inline-block px-3 py-1 bg-bg-elevated border border-border-divider rounded-full text-[9px] uppercase font-bold tracking-widest text-text-secondary mb-3">
                    THE FOUNDER
                  </span>
                  <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-accent-gold leading-tight">
                    Meet {cmsContent.founder_name || "Our Founder"}
                  </h2>
                </div>

                <p className="text-sm md:text-base text-text-secondary leading-relaxed font-medium">
                  {cmsContent.founder_bio || "Specializing in emotional regulation, public presence, and organizational soft skills, our lead mentors bring direct coaching experience training Indian Oil employees, nursing students, and academic professionals to build resilience and speak with confidence."}
                </p>

                {/* Vertical Quote block with gold line on the left */}
                <div className="border-l-2 border-accent-gold pl-4 py-1 italic">
                  <p className="text-xs md:text-sm text-text-primary font-medium">
                    "Clarity is the single greatest competitive advantage a student can have. Once confusion clears, success is just a series of logical steps."
                  </p>
                </div>

                {/* Outline CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => openBooking()}
                    className="px-6 py-2.5 border border-border-divider hover:border-text-primary/40 bg-surface/50 hover:bg-surface text-text-primary font-bold text-xs uppercase tracking-wider rounded-full shadow-2xs transition-colors cursor-pointer focus:outline-none"
                  >
                    Read Founder Story
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 10. FAQ SECTION */}
        <section id="faq" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="inline-block px-3 py-1 bg-bg-elevated border border-border-divider rounded-full text-[9px] uppercase font-bold tracking-widest text-text-secondary">
              FAQ
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-text-primary">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed font-medium">
              Clear answers to the most common queries about our platform.
            </p>
          </div>

          <FAQSection />
        </section>

        {/* 13. CONTACT / WHATSAPP SECTION */}
        <section id="contact" className="px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
          <div className="bg-surface rounded-[24px] p-8 md:p-12 border border-border-divider/60 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Left Column: Get In Touch */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div>
                  <span className="inline-block px-3 py-1 bg-bg-elevated border border-border-divider rounded-full text-[9px] uppercase font-bold tracking-widest text-text-secondary">
                    GET IN TOUCH
                  </span>
                </div>
                
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary leading-tight">
                  Get in Touch with Us
                </h2>

                <p className="text-xs md:text-sm text-text-secondary leading-relaxed max-w-xl">
                  Have specific queries regarding university admission fees, syllabus, or mentorship paths? Send us a message and our advisors will respond within 24 hours.
                </p>

                {/* Contacts info list */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-text-primary border border-border-divider">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-text-secondary/40 tracking-wider">Email Us</p>
                      <a href="mailto:admissions@c2cclarity.com" className="text-sm font-semibold text-text-primary hover:text-text-primary transition-colors">
                        admissions@c2cclarity.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-400 border border-emerald-500/10">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-wider">Call / WhatsApp</p>
                      <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-emerald-400 hover:text-emerald-500 transition-colors">
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
                    className="inline-flex items-center justify-center px-6 py-3 border border-emerald-500 hover:bg-emerald-500 text-emerald-400 hover:text-white text-xs uppercase font-bold tracking-wider rounded-full transition-all duration-300 shadow-2xs cursor-pointer focus:outline-none"
                  >
                    Chat with Advisor
                  </a>
                </div>
              </div>

              {/* Right Column: WhatsApp QR code representation */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="bg-bg-elevated p-8 rounded-[24px] border border-border-divider flex flex-col items-center space-y-4 max-w-sm w-full text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1">
                      WhatsApp Active Support
                    </span>
                  </div>
                  <div className="w-56 h-56 bg-white p-3 rounded-2xl border border-border-divider/50 shadow-2xs relative group overflow-hidden">
                    <img
                      src="/whatsapp_qr.png"
                      alt="WhatsApp QR Code"
                      className="w-full h-full object-contain select-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-text-primary">Scan to Chat on WhatsApp</p>
                    <p className="text-[10px] text-text-secondary/50 leading-relaxed px-4">
                      Open your phone camera or WhatsApp scanner to instantly connect with our advisory stream.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
