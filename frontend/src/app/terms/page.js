import React from "react";
import { Info, Scale, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Confusion to Clarity",
  description: "Read about our rescheduling window, refund guidelines, and program access rules.",
};

export default function TermsPage() {
  return (
    <article className="max-w-4xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-12">
      {/* Editorial Header */}
      <div className="space-y-4 text-left border-b border-rust/10 pb-8">
        <span className="text-xs uppercase font-bold text-rust tracking-wider">Service Guidelines</span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-charcoal/60">
          Last revised: July 6, 2026
        </p>
      </div>

      {/* Main Copy */}
      <div className="prose prose-neutral max-w-none text-sm md:text-base text-charcoal/80 space-y-8 leading-relaxed font-medium">
        
        {/* Important notice alert box */}
        <div className="bg-white p-6 rounded-2xl border border-rust/10 flex items-start gap-4 shadow-xs">
          <Info className="text-rust shrink-0 mt-0.5" size={20} />
          <div className="space-y-1">
            <h4 className="font-serif text-base font-bold text-charcoal">Rescheduling Policy</h4>
            <p className="text-xs text-charcoal/60 leading-relaxed">
              We enforce a strict 24-hour rescheduling policy to maintain structure for Julius Thorne and other clients. Bookings altered inside the 24-hour limit may forfeit the booking session value.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="font-serif text-xl font-bold text-charcoal">1. Service Definition</h3>
          <p>
            Confusion to Clarity offers structured virtual coaching and consulting packages. These sessions do not constitute licensed medical psychotherapy, couples counseling therapy, or formal legal mediation. Our programs are designed exclusively for life direction reset, boundary management, and leadership communication.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-serif text-xl font-bold text-charcoal">2. Payment & Refunds</h3>
          <p>
            Payment is due in full prior to scheduling date selection in the Calendly interface. Once a transaction is processed in our billing portal, refunds are subject to review and are generally not issued if a session has already taken place or if a client fails to attend.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-serif text-xl font-bold text-charcoal">3. Access Duration</h3>
          <p>
            For multi-session packages, such as the 4-week Reset Programme, clients must schedule all sessions within 90 days of the purchase date. Sessions remaining unused after this 90-day window will expire.
          </p>
        </section>
      </div>
    </article>
  );
}
