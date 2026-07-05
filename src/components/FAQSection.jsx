"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "What is your policy regarding session confidentiality?",
    answer: "Every conversation is bound by strict NDA standards. Whether it's individual professional consulting or joint sessions in Couples' Conversations, all topics, records, and decisions remain entirely private."
  },
  {
    question: "How do I reschedule a booked session?",
    answer: "You can reschedule your slot up to 24 hours prior to the session start time via the link inside your Google Calendar invite or email confirmation. Cancellations inside 24 hours may incur a scheduling fee."
  },
  {
    question: "Can I upgrade or downgrade my service package?",
    answer: "Absolutely. If you start with a single 'Clarity Call' and decide you'd benefit from the full 4-week 'Reset Programme', we will deduct the cost of your initial call from the package price."
  },
  {
    question: "How do virtual sessions take place?",
    answer: "All sessions are conducted virtually over Google Meet. Once your booking is finalized via the checkout funnel, a calendar invitation is automatically dispatched with the direct link."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    if (openIndex === index) {
      setOpenIndex(null);
    } else {
      setOpenIndex(index);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="border-b border-rust/10 pb-4 transition-all duration-300"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between py-4 text-left font-serif text-base md:text-lg font-bold text-charcoal hover:text-rust transition-colors duration-200 focus:outline-none cursor-pointer"
            >
              <span>{faq.question}</span>
              <span className="ml-4 flex-shrink-0 text-rust">
                {isOpen ? (
                  <Minus size={18} className="stroke-[2.5]" />
                ) : (
                  <Plus size={18} className="stroke-[2.5]" />
                )}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="text-sm md:text-base text-charcoal/70 leading-relaxed pt-1 pb-4 pr-6">
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
