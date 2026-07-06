"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "Working with Confusion to Clarity completely restructured my approach to my business partner. We were on the verge of a split. The couples/partners program was our turning point.",
    author: "Elena & David R.",
    role: "Co-Founders, Veloce Design",
    context: "Couples' Conversations"
  },
  {
    quote: "The Reset Programme is intense but incredibly grounding. It stripped away years of professional burnout and gave me actionable frameworks to establish boundaries.",
    author: "Marc Henderson",
    role: "Senior Engineering Director",
    context: "Reset Programme Participant"
  },
  {
    quote: "I booked a Clarity Call on a whim when facing a major career pivot. Within 60 minutes, I went from circular anxiety to a structured, 4-step execution strategy.",
    author: "Sarah Lin",
    role: "Product Consultant",
    context: "Clarity Call Service"
  }
];

export default function TestimonialCarousel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0
    })
  };

  const nextStep = () => {
    setDirection(1);
    setIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevStep = () => {
    setDirection(-1);
    setIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="w-full relative py-12 px-4 bg-surface border border-border-divider/60 rounded-3xl overflow-hidden shadow-xs">
      {/* Decorative quotes background watermark */}
      <div className="absolute top-4 left-6 text-accent-gold/5 pointer-events-none">
        <Quote size={120} className="stroke-[1.5]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center">
        {/* Star Rating symbols */}
        <div className="flex items-center space-x-1 mb-6 text-accent-gold">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} className="fill-accent-gold stroke-[1.5]" />
          ))}
        </div>

        {/* Carousel Frame */}
        <div className="min-h-[180px] flex items-center justify-center overflow-hidden w-full relative">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={index}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="space-y-6 px-4 md:px-8"
            >
              <p className="font-serif text-lg md:text-xl italic text-text-primary leading-relaxed font-medium">
                "{testimonials[index].quote}"
              </p>
              
              <div className="space-y-1">
                <h4 className="font-serif text-base font-bold text-text-primary">
                  {testimonials[index].author}
                </h4>
                <p className="text-xs text-text-secondary font-medium">
                  {testimonials[index].role}
                </p>
                <span className="inline-block mt-2 px-2.5 py-1 rounded bg-accent-gold/10 text-accent-gold text-[10px] uppercase font-bold tracking-wider">
                  {testimonials[index].context}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between w-full mt-10 max-w-xs mx-auto border-t border-border-divider/50 pt-6">
          <button
            onClick={prevStep}
            className="w-10 h-10 rounded-full border border-border-divider flex items-center justify-center hover:bg-surface-hover hover:text-accent-gold hover:border-accent-gold text-text-secondary/60 transition-all duration-300 cursor-pointer"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex space-x-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === i ? "w-6 bg-accent-gold" : "bg-accent-gold/20"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            className="w-10 h-10 rounded-full border border-border-divider flex items-center justify-center hover:bg-surface-hover hover:text-accent-gold hover:border-accent-gold text-text-secondary/60 transition-all duration-300 cursor-pointer"
            aria-label="Next testimonial"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
