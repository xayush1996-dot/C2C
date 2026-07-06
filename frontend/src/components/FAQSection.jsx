"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is Confusion to Clarity (C2C)?",
    answer: "Confusion to Clarity (C2C) is a scientific, 1-on-1 mentorship platform assisting students and professionals in mapping cognitive strengths to top global universities and career paths."
  },
  {
    question: "How does the 1-on-1 mentorship process work?",
    answer: "We follow a 4-step process: First, Discovery & Profiling to map out academic accomplishments and roadblocks. Second, Strategy Architecture to design a custom path catalog. Third, Execution & Polishing for resume/LinkedIn upgrades. Fourth, Placement & Admits to assist in applications, scholarships, and visas."
  },
  {
    question: "Can C2C help me get scholarships for studying abroad?",
    answer: "Yes, we analyze scholarship streams, edit funding applications, compile fellowship scouting sheets, and provide visa compliance audits to help you secure financial aid."
  },
  {
    question: "How do I book a session and pay?",
    answer: "Simply click the 'Book a Call' or 'Talk to an advisor' buttons. You'll be able to select a diagnostic consulting session from the scheduling modal and complete payment securely."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-surface rounded-[24px] p-6 md:p-8 border border-border-divider/50 shadow-xs text-left">
      <div className="divide-y divide-border-divider/50">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className="py-4 first:pt-0 last:pb-0">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between py-2 text-left font-sans text-xs md:text-sm font-bold text-text-primary hover:text-accent-gold transition-colors duration-200 focus:outline-none cursor-pointer"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  size={16}
                  className={`text-text-secondary/50 transition-transform duration-300 ${
                    isOpen ? "rotate-180 text-accent-gold" : ""
                  }`}
                />
              </button>

              {/* Collapsible Answer */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-[200px] opacity-100 mt-2" : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-[11px] md:text-xs text-text-secondary leading-relaxed pb-2 pr-6 font-medium">
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
