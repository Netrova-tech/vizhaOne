"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { motion } from "framer-motion";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen luxury-page">
      <Navbar />
      
      <div className="bg-green-800 text-white pt-24 pb-12 px-5 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-[#e11d48]/20">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100 prose prose-green max-w-none">
          <h3>1. Information We Collect</h3>
          <p>We collect information to provide better services to all our users. We collect information in the following ways:</p>
          <ul>
            <li><strong>Information you give us:</strong> For example, our services require you to sign up for a VizhaOne Account. When you do, we'll ask for personal information, like your name, email address, telephone number.</li>
            <li><strong>Information we get from your use of our services:</strong> We collect information about the services that you use and how you use them.</li>
          </ul>

          <h3>2. How We Use Information We Collect</h3>
          <p>We use the information we collect from all of our services to provide, maintain, protect and improve them, to develop new ones, and to protect VizhaOne and our users. We also use this information to offer you tailored content.</p>

          <h3>3. Information We Share</h3>
          <p>We do not share personal information with companies, organizations and individuals outside of VizhaOne unless one of the following circumstances applies:</p>
          <ul>
            <li><strong>With your consent:</strong> We will share personal information with companies, organizations or individuals outside of VizhaOne when we have your consent to do so. (e.g. sharing your details with a booked vendor).</li>
            <li><strong>For legal reasons:</strong> We will share personal information if we have a good-faith belief that access, use, preservation or disclosure of the information is reasonably necessary.</li>
          </ul>

          <h3>4. Information Security</h3>
          <p>We work hard to protect VizhaOne and our users from unauthorized access to or unauthorized alteration, disclosure or destruction of information we hold.</p>
          
          <h3>5. Changes</h3>
          <p>Our Privacy Policy may change from time to time. We will not reduce your rights under this Privacy Policy without your explicit consent. We will post any privacy policy changes on this page.</p>
        </div>
      </div>

      <MobileBottomNav />
      <div className="h-20 md:hidden" />
    </div>
  );
}
