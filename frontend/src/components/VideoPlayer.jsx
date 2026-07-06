"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Clock, Video, Volume2, Award, ArrowRight } from "lucide-react";

const videos = [
  {
    id: 1,
    title: "Navigating Partners' Stagnation",
    duration: "4:15",
    category: "Couples & Business",
    description: "Three structural triggers that lead to joint business partner paralysis and how to unlock dialogue."
  },
  {
    id: 2,
    title: "The 3-Second Boundary Check",
    duration: "2:40",
    category: "Professional Reset",
    description: "A practical framework for high-burnout environments to evaluate requests before committing."
  },
  {
    id: 3,
    title: "De-escalation in High Stakes",
    duration: "5:10",
    category: "Communication Strategy",
    description: "Managing cortisol responses and communication patterns during active professional transitions."
  }
];

export default function VideoPlayer() {
  const [activeVideo, setActiveVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const openPlayer = (video) => {
    setActiveVideo(video);
    setIsPlaying(true);
  };

  const closePlayer = () => {
    setActiveVideo(null);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-8 select-none">
      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {videos.map((vid) => (
          <div
            key={vid.id}
            className="bg-surface rounded-[24px] border border-border-divider/60 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group cursor-pointer hover:border-accent-gold/45 hover:-translate-y-1.5"
          >
            {/* Thumbnail Placeholder */}
            <div className="relative aspect-video bg-bg-base/30 flex items-center justify-center overflow-hidden border-b border-border-divider/40">
              {/* Graphic background helper */}
              <div className="absolute inset-0 bg-gradient-to-tr from-accent-gold/10 to-transparent opacity-60 group-hover:scale-105 transition-transform duration-500" />
              
              <div className="relative z-10 w-12 h-12 rounded-full bg-bg-elevated/95 border border-border-divider/50 backdrop-blur-xs flex items-center justify-center text-accent-gold group-hover:bg-accent-gold group-hover:text-bg-base shadow-sm group-hover:scale-110 transition-all duration-300">
                <Play size={18} className="fill-current ml-0.5" />
              </div>

              {/* Badges */}
              <span className="absolute bottom-3 left-3 px-2 py-1 rounded bg-bg-base/80 border border-border-divider/40 text-text-primary text-[10px] uppercase font-bold tracking-wider">
                {vid.category}
              </span>
              <span className="absolute bottom-3 right-3 px-2 py-1 rounded bg-bg-base/80 border border-border-divider/40 backdrop-blur-xs text-text-primary text-[10px] font-bold flex items-center gap-1">
                <Clock size={10} className="text-accent-gold" /> {vid.duration}
              </span>
            </div>

            {/* Metadata info */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <h4 className="font-serif text-base font-bold text-text-primary group-hover:text-accent-gold transition-colors duration-200">
                  {vid.title}
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                  {vid.description}
                </p>
              </div>

              <button
                onClick={() => openPlayer(vid)}
                className="text-xs font-semibold text-accent-blue hover:text-accent-gold flex items-center gap-1.5 mt-2 cursor-pointer transition-colors duration-200 w-fit"
              >
                Watch Video Lesson <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Graphic Banner Mockup */}
      <div className="w-full bg-surface rounded-[24px] p-8 md:p-10 text-text-primary flex flex-col md:flex-row items-center justify-between border border-border-divider/60 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
          <Award size={200} className="text-accent-gold" />
        </div>
        
        <div className="space-y-3 max-w-xl text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent-gold">
            Complimentary Training Access
          </span>
          <h4 className="font-serif text-xl md:text-2xl font-bold leading-tight">
            Unpacking Conflict Patterns in Leadership
          </h4>
          <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
            Get early access to our private 15-minute diagnostic toolkit covering corporate burnout and partnership structural fatigue.
          </p>
        </div>

        <button
          onClick={() => openPlayer({ title: "Unpacking Conflict Patterns in Leadership", duration: "15:00", category: "Leadership Masterclass" })}
          className="mt-6 md:mt-0 px-6 py-3 bg-accent-gold hover:bg-accent-gold/90 text-bg-base text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all duration-300 cursor-pointer"
        >
          Claim Video Guide
        </button>
      </div>

      {/* Video Overlay Modal (Pop-up Player Simulation) */}
      <AnimatePresence>
        {activeVideo && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-[#0B0D14]/80 backdrop-blur-sm z-50 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePlayer}
            />

            {/* Video Player Modal Container */}
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-2xl bg-bg-elevated border border-border-divider rounded-[24px] overflow-hidden shadow-2xl z-50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Top bar info */}
              <div className="bg-surface/60 px-4 py-3 flex items-center justify-between border-b border-border-divider text-text-primary">
                <div className="flex items-center gap-2">
                  <Video size={14} className="text-accent-gold" />
                  <span className="text-xs font-medium">{activeVideo.category}</span>
                </div>
                <button
                  onClick={closePlayer}
                  className="p-1 rounded hover:bg-surface text-text-secondary/60 hover:text-accent-gold transition-colors duration-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Mock Video Canvas Playback Screen */}
              <div className="relative aspect-video bg-[#0B0D14] flex flex-col items-center justify-center text-text-primary px-6 text-center space-y-4">
                {/* Playing simulation animations */}
                <div className="flex items-center gap-1.5 h-8">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-accent-gold rounded-full"
                      animate={{ height: isPlaying ? [10, 28, 10] : 8 }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.8,
                        delay: i * 0.12,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>

                <div className="space-y-1">
                  <h4 className="font-serif text-lg font-semibold">{activeVideo.title}</h4>
                  <p className="text-xs text-text-secondary">Streaming in Sandbox Mode • {activeVideo.duration} mins remaining</p>
                </div>

                {/* Subtitle helper */}
                <div className="bg-surface px-4 py-2 rounded text-xs text-text-primary max-w-md font-medium border border-border-divider/60">
                  "...and that's when we realize the circular argument isn't about the topic, it's about the safety of alignment."
                </div>
              </div>

              {/* Controls bar */}
              <div className="bg-surface p-4 flex items-center justify-between text-text-primary border-t border-border-divider">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-1.5 bg-accent-gold hover:bg-accent-gold/90 text-bg-base text-xs font-bold rounded cursor-pointer transition-colors duration-200"
                >
                  {isPlaying ? "PAUSE" : "PLAY"}
                </button>

                {/* Progress bar timeline */}
                <div className="flex-1 mx-4 h-1 bg-bg-base rounded-full relative overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 bottom-0 bg-accent-gold"
                    animate={{ width: isPlaying ? ["5%", "45%"] : "5%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 35,
                      ease: "linear"
                    }}
                  />
                </div>

                {/* Volume icon */}
                <Volume2 size={16} className="text-text-secondary/60 hover:text-accent-gold cursor-pointer" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
