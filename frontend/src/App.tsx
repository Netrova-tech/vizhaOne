import { Route, Routes } from "react-router-dom";
import HomePage from "@/app/page";
import AboutPage from "@/app/about/page";
import AdminPage from "@/app/admin/page";
import AnalyticsPage from "@/app/admin/analytics/page";
import InquiriesPage from "@/app/admin/inquiries/page";
import LoginPage from "@/app/auth/login/page";
import SignUpPage from "@/app/auth/sign-up/page";
import ForgotPasswordPage from "@/app/auth/forgot-password/page";
import VerifyPage from "@/app/auth/verify/page";
import BlogPage from "@/app/blog/page";
import CalculatorPage from "@/app/calculator/page";
import CategoriesPage from "@/app/categories/page";
import FaqPage from "@/app/faq/page";
import HallsPage from "@/app/halls/page";
import PrivacyPage from "@/app/privacy/page";
import PartnerPlansPage from "@/app/partner-plans/page";
import ServicesPage from "@/app/services/page";
import TermsPage from "@/app/terms/page";
import HashtagGeneratorPage from "@/app/tools/hashtag-generator/page";
import InvitationGeneratorPage from "@/app/invitations/page";
import PublicInvitationPage from "@/app/invitations/public/page";
import ReferralsPage from "@/app/referrals/page";
import CreatePage from "@/app/create/page";
import VendorOnboardingPage from "@/app/vendor-onboarding/page";
import { AppProviders } from "@/components/app/AppProviders";
import { ScrollToTop } from "@/components/app/ScrollToTop";
import { BlogPostRoute } from "@/routes/BlogPostRoute";
import { HallDetailRoute } from "@/routes/HallDetailRoute";
import { NotFoundPage } from "@/routes/NotFoundPage";
import { PackageDetailRoute } from "@/routes/PackageDetailRoute";
import { ServiceDetailRoute } from "@/routes/ServiceDetailRoute";
import ComparePage from "@/app/compare/page";
import VendorLandingPage from "@/app/vendors/landing/page";

export default function App() {
  return (
    <AppProviders>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/inquiries" element={<InquiriesPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/sign-up" element={<SignUpPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/verify" element={<VerifyPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostRoute />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/halls" element={<HallsPage />} />
        <Route path="/halls/:id" element={<HallDetailRoute />} />
        <Route path="/packages/:id" element={<PackageDetailRoute />} />
        <Route path="/partner-plans" element={<PartnerPlansPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServiceDetailRoute />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/vendors/:category/:city" element={<VendorLandingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/tools/hashtag-generator" element={<HashtagGeneratorPage />} />
        <Route path="/invitations" element={<InvitationGeneratorPage />} />
        <Route path="/invite/:slug" element={<PublicInvitationPage />} />
        <Route path="/referrals" element={<ReferralsPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/vendor-onboarding" element={<VendorOnboardingPage />} />
        <Route path="**" element={<NotFoundPage />} />
      </Routes>
    </AppProviders>
  );
}
