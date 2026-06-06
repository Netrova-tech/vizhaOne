"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function TermsPage() {
  return (
    <div className="min-h-screen luxury-page">
      <Navbar />
      
      <div className="bg-green-800 text-white pt-24 pb-12 px-5 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-[#e11d48]/20">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100 prose prose-green max-w-none">
          <h3>1. Acceptance of Terms</h3>
          <p>By accessing and using VizhaOne, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>

          <h3>2. Description of Service</h3>
          <p>VizhaOne provides users with access to a rich collection of resources, including various communications tools, forums, shopping services, and personalized content. You also understand and agree that the Service may include certain communications from VizhaOne, such as service announcements, administrative messages and the VizhaOne Newsletter.</p>

          <h3>3. Vendor Bookings and Payments</h3>
          <p>VizhaOne acts as a marketplace to connect users with vendors. All bookings, payments, and service deliveries are agreements directly between the user and the vendor. VizhaOne is not responsible for any disputes, cancellations, or quality of service provided by third-party vendors.</p>

          <h3>4. User Conduct</h3>
          <p>You agree to not use the Service to:</p>
          <ul>
            <li>Upload, post, email, transmit or otherwise make available any content that is unlawful, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another&apos;s privacy, hateful, or racially, ethnically or otherwise objectionable.</li>
            <li>Impersonate any person or entity.</li>
          </ul>

          <h3>5. Modifications to Service</h3>
          <p>VizhaOne reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. You agree that VizhaOne shall not be liable to you or to any third party for any modification, suspension or discontinuance of the Service.</p>
        </div>
      </div>

      <MobileBottomNav />
      <div className="h-20 md:hidden" />
    </div>
  );
}
