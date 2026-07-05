"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, CreditCard, Calendar, Clock, Sparkles, AlertCircle, ShieldAlert } from "lucide-react";
import { useBooking } from "@/context/BookingContext";

const packages = [
  { id: "start", name: "Start Where You Are", price: "$99", duration: "45 Mins", description: "An introductory session to map out your core roadblocks." },
  { id: "clarity", name: "Clarity Call", price: "$149", duration: "60 Mins", description: "Deep-dive session focusing on resolving a specific transition or choice." },
  { id: "reset", name: "Reset Programme", price: "$499", duration: "4 x 60 Mins", description: "Comprehensive coaching framework over 4 weeks to rebuild core routines." },
  { id: "couples", name: "Couples' Conversations", price: "$249", duration: "90 Mins", description: "Mediated communication strategy session for alignment and resolution." }
];

export default function BookingModal() {
  const { isBookingOpen, selectedPackage, closeBooking } = useBooking();
  const [step, setStep] = useState(1); // 1: Package Confirm, 2: Payment Mock, 3: Calendly Mock, 4: Booked Success
  const [activePackage, setActivePackage] = useState(null);
  
  // Payment Form Info
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Calendar Booking Info
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  
  useEffect(() => {
    if (selectedPackage) {
      const pkg = packages.find(p => p.id === selectedPackage || p.name === selectedPackage);
      setActivePackage(pkg || packages[0]);
    } else {
      setActivePackage(packages[0]);
    }
  }, [selectedPackage, isBookingOpen]);

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
    }, 300);
  };

  const startPayment = (e) => {
    e.preventDefault();
    if (!email || !phone) return;
    setIsPaying(true);
    // Simulate Razorpay Gateway processing
    setTimeout(() => {
      setIsPaying(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        setStep(3); // Go to Scheduling
      }, 1000);
    }, 2000);
  };

  const confirmBooking = () => {
    if (!selectedDate || !selectedTime) return;
    setStep(4); // Success screen
  };

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
            className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs z-50 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Sliding Side Panel Drawer */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-cream border-l border-rust/10 shadow-2xl z-50 flex flex-col overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
          >
            {/* Header */}
            <div className="p-6 border-b border-rust/10 flex items-center justify-between bg-white/40">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-rust">
                  Checkout Funnel
                </span>
                <h3 className="font-serif text-xl font-bold text-charcoal">
                  Book Your Session
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-rust/10 text-charcoal/60 hover:text-rust transition-colors duration-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Viewport */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Stepper Progress Bar */}
              {step < 4 && (
                <div className="flex items-center justify-between px-4 pb-2 border-b border-rust/5">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 1 ? "bg-rust text-cream" : "bg-white text-charcoal/40 border border-rust/10"}`}>
                      {step > 1 ? <Check size={12} /> : "1"}
                    </div>
                    <span className="text-[10px] mt-1 font-medium text-charcoal/60">Confirm</span>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 ${step > 1 ? "bg-rust" : "bg-rust/10"}`} />
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 2 ? "bg-rust text-cream" : "bg-white text-charcoal/40 border border-rust/10"}`}>
                      {step > 2 ? <Check size={12} /> : "2"}
                    </div>
                    <span className="text-[10px] mt-1 font-medium text-charcoal/60">Payment</span>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 ${step > 2 ? "bg-rust" : "bg-rust/10"}`} />
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 3 ? "bg-rust text-cream" : "bg-white text-charcoal/40 border border-rust/10"}`}>
                      3
                    </div>
                    <span className="text-[10px] mt-1 font-medium text-charcoal/60">Schedule</span>
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
                  <div className="bg-white p-5 rounded-2xl border border-rust/10 shadow-xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-serif text-lg font-bold text-charcoal">{activePackage.name}</h4>
                        <div className="flex items-center space-x-3 text-xs text-charcoal/60 mt-1">
                          <span className="flex items-center gap-1"><Clock size={12} /> {activePackage.duration}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-rust/35" />
                          <span className="font-semibold text-rust">Individual Access</span>
                        </div>
                      </div>
                      <span className="text-xl font-bold font-serif text-rust">{activePackage.price}</span>
                    </div>
                    <p className="text-sm text-charcoal/70 leading-relaxed border-t border-rust/5 pt-3">
                      {activePackage.description}
                    </p>
                  </div>

                  {/* Alternative Package Selection List */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wide text-charcoal/50">Change selected package:</label>
                    <div className="grid grid-cols-1 gap-2">
                      {packages.map((pkg) => (
                        <button
                          key={pkg.id}
                          onClick={() => setActivePackage(pkg)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                            activePackage.id === pkg.id
                              ? "bg-white border-rust shadow-sm ring-1 ring-rust"
                              : "bg-white/50 border-rust/10 hover:border-rust/30"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-charcoal">{pkg.name}</p>
                            <p className="text-xs text-charcoal/50 mt-0.5">{pkg.duration} — {pkg.price}</p>
                          </div>
                          {activePackage.id === pkg.id && (
                            <div className="w-5 h-5 rounded-full bg-rust flex items-center justify-center text-cream">
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
                    className="w-full py-3.5 bg-charcoal hover:bg-rust text-cream font-medium tracking-wide rounded-full shadow-sm cursor-pointer transition-colors duration-300 focus:outline-none text-center"
                  >
                    Proceed to Payment
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
                  <div className="bg-[#1C203E] text-white p-5 rounded-2xl shadow-md border border-[#2B3058] space-y-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
                      <Sparkles size={120} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] tracking-wider text-slate-400 font-bold uppercase">SECURE CHECKOUT</p>
                        <h4 className="font-semibold text-sm">CONFUSION TO CLARITY</h4>
                      </div>
                      <span className="text-xs bg-[#2b3058] px-2.5 py-1 rounded text-emerald-400 border border-emerald-500/20 font-mono">Razorpay SDK v3</span>
                    </div>

                    <div className="border-t border-slate-700/50 pt-3 flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">Total Payable:</span>
                      <span className="text-xl font-bold font-mono text-white">{activePackage.price}</span>
                    </div>
                  </div>

                  <form onSubmit={startPayment} className="space-y-4 bg-white p-5 rounded-2xl border border-rust/10">
                    <h5 className="font-semibold text-sm text-charcoal border-b border-rust/5 pb-2">Billing Contact Details</h5>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-charcoal/60">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="client@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-rust/20 bg-cream/10 text-sm focus:outline-none focus:border-rust"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-charcoal/60">Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="+1 (555) 019-2834"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-rust/20 bg-cream/10 text-sm focus:outline-none focus:border-rust"
                      />
                    </div>

                    {/* Simulation Panel */}
                    <div className="bg-cream/50 p-3 rounded-lg border border-rust/10 flex items-start gap-2.5 text-xs text-charcoal/70">
                      <CreditCard size={16} className="text-rust mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-charcoal">Simulation Mode:</span> Enter any mock credentials above to test. No transaction fees apply.
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      type="submit"
                      disabled={isPaying || paymentSuccess}
                      className="w-full py-3.5 bg-charcoal hover:bg-rust text-cream font-medium tracking-wide rounded-full cursor-pointer transition-colors duration-300 flex items-center justify-center gap-2 focus:outline-none"
                    >
                      {isPaying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing Sandbox Order...
                        </>
                      ) : paymentSuccess ? (
                        <>
                          <Check size={16} className="text-emerald-400 stroke-[3]" />
                          Payment Successful
                        </>
                      ) : (
                        `Pay ${activePackage.price} with Razorpay`
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 3: Calendly Mockup */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-5 rounded-2xl border border-rust/10 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-xs text-rust font-bold uppercase tracking-wider">
                      <Calendar size={14} /> Schedule Session
                    </div>
                    <p className="text-xs text-charcoal/60">
                      Your payment was verified. Choose an open slot to establish your coaching schedule.
                    </p>

                    {/* Date Picker Grid */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-charcoal/80">Select Date:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {getMockDates().map((dt) => (
                          <button
                            key={dt.value}
                            type="button"
                            onClick={() => setSelectedDate(dt.value)}
                            className={`p-2.5 rounded-lg border text-center text-xs font-medium cursor-pointer transition-all duration-200 ${
                              selectedDate === dt.value
                                ? "bg-rust border-rust text-cream shadow-xs"
                                : "bg-white border-rust/10 hover:border-rust/35 text-charcoal"
                            }`}
                          >
                            {dt.label.split(',')[0]}
                            <span className="block text-[10px] opacity-75">{dt.label.split(',')[1]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Picker Grid */}
                    {selectedDate && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2 border-t border-rust/5 pt-3"
                      >
                        <label className="text-xs font-semibold text-charcoal/80">Select Time Zone & Slot:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {mockTimes.map((tm) => (
                            <button
                              key={tm}
                              type="button"
                              onClick={() => setSelectedTime(tm)}
                              className={`py-2 px-3 rounded-lg border text-center text-xs cursor-pointer transition-all duration-200 ${
                                selectedTime === tm
                                  ? "bg-rust border-rust text-cream"
                                  : "bg-white border-rust/10 hover:border-rust/35 text-charcoal"
                              }`}
                            >
                              {tm}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={confirmBooking}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full py-3.5 bg-charcoal hover:bg-rust text-cream font-medium tracking-wide rounded-full shadow-sm cursor-pointer transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
                  >
                    Confirm Booking Schedule
                  </button>
                </motion.div>
              )}

              {/* STEP 4: Booking Success Screen */}
              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-6"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <Check size={32} className="stroke-[3]" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-serif text-2xl font-bold text-charcoal">Session Confirmed!</h4>
                    <p className="text-sm text-charcoal/70 leading-relaxed max-w-sm mx-auto">
                      Your booking has been saved. A calendar invitation with the Google Meet link was dispatched to <strong className="text-charcoal font-semibold">{email}</strong>.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-rust/10 text-left space-y-3.5 max-w-sm mx-auto text-xs">
                    <p className="font-bold border-b border-rust/5 pb-1.5 uppercase text-charcoal/50 tracking-wider">Booking Receipt</p>
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">Service Package:</span>
                      <span className="font-semibold text-charcoal">{activePackage?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">Date:</span>
                      <span className="font-semibold text-charcoal">
                        {new Date(selectedDate + "T12:00:00").toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">Time Slot:</span>
                      <span className="font-semibold text-charcoal">{selectedTime} (GMT)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">Session Platform:</span>
                      <span className="font-semibold text-rust">Google Meet (Link enclosed in invite)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full max-w-xs py-3 bg-charcoal hover:bg-rust text-cream font-medium tracking-wide rounded-full cursor-pointer transition-colors duration-300 focus:outline-none"
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
