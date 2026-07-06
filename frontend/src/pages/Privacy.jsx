import React from "react";
import { Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <article className="max-w-4xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-12">
      {/* Editorial Header */}
      <div className="space-y-4 text-left border-b border-rust/10 pb-8">
        <span className="text-xs uppercase font-bold text-rust tracking-wider">Legal Framework</span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal tracking-tight">
          Privacy Policy & Confidentiality
        </h1>
        <p className="text-sm text-charcoal/60">
          Last revised: July 6, 2026
        </p>
      </div>

      {/* Main Copy */}
      <div className="prose prose-neutral max-w-none text-sm md:text-base text-charcoal/80 space-y-8 leading-relaxed font-medium">
        
        {/* NDA Alert Box */}
        <div className="bg-white p-6 rounded-2xl border border-rust/10 flex items-start gap-4 shadow-xs">
          <Lock className="text-rust shrink-0 mt-0.5" size={20} />
          <div className="space-y-1">
            <h4 className="font-serif text-base font-bold text-charcoal">Absolute NDA Standards</h4>
            <p className="text-xs text-charcoal/60 leading-relaxed">
              Every consulting arrangement, joint session, and message exchange is protected by absolute non-disclosure agreements. We never sell, rent, or lease your private transcripts or communications.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="font-serif text-xl font-bold text-charcoal">1. Information Collection</h3>
          <p>
            We collect personal information necessary to deliver our coaching services. This includes name, email address, phone number, and any intake assessment answers you choose to supply during scheduling. Payment details are processed exclusively by our billing gateway partner, Razorpay, and are not stored in our databases.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-serif text-xl font-bold text-charcoal">2. Data Security & Storage</h3>
          <p>
            Your session schedules and intake surveys are encrypted both in transit and at rest. We leverage industry-standard hosting environments to safeguard access. Virtual meetings are conducted on secure, end-to-end encrypted Google Meet links generated for each specific reservation.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-serif text-xl font-bold text-charcoal">3. Retaining Records</h3>
          <p>
            Coaching summaries and action plans are retained for the duration of the coaching program. Once a client completes their framework (e.g. at the conclusion of the 4-week Reset Programme), they can request immediate archival or deletion of all related digital profiles.
          </p>
        </section>
      </div>
    </article>
  );
}
