import { Navigate, Route, Routes } from "react-router-dom";
import MobileHomePage from "@/app/mobile-home/page";
import AboutPage from "@/app/about/page";
import AdminPage from "@/app/admin/page";
import AnalyticsPage from "@/app/admin/analytics/page";
import InquiriesPage from "@/app/admin/inquiries/page";
import LoginPage from "@/app/auth/login/page";
import VerifyPage from "@/app/auth/verify/page";
import BlogPage from "@/app/blog/page";
import CalculatorPage from "@/app/calculator/page";
import CategoriesPage from "@/app/categories/page";
import FaqPage from "@/app/faq/page";
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
import MobileBookingsPage from "@/app/mobile-bookings/page";
import MobileSavedPage from "@/app/mobile-saved/page";
import MobileProfilePage from "@/app/mobile-profile/page";
import MobileSignInPage from "@/app/mobile-sign-in/page";
import MobileSignUpPage from "@/app/mobile-sign-up/page";
import ProviderDashboardPage from "@/app/provider-dashboard/page";
import ReelsPage from "@/app/reels/page";
import VendorProfilePage from "@/app/vendor-profile/page";
import CelebrationPlannerPage from "@/app/celebration-planner/page";
import QuoteRequestPage from "@/app/quote-request/page";
import CartPage from "@/app/cart/page";
import { AppProviders } from "@/components/app/AppProviders";
import { ScrollToTop } from "@/components/app/ScrollToTop";
import { RouteBackButton } from "@/components/app/RouteBackButton";
import { NativeBackHandler } from "@/components/app/NativeBackHandler";
import { BlogPostRoute } from "@/routes/BlogPostRoute";
import { HallDetailRoute } from "@/routes/HallDetailRoute";
import { NotFoundPage } from "@/routes/NotFoundPage";
import { PackageDetailRoute } from "@/routes/PackageDetailRoute";
import { ServiceDetailRoute } from "@/routes/ServiceDetailRoute";

export default function App() {
  return (
    <AppProviders>
      <ScrollToTop />
      <NativeBackHandler />
      <RouteBackButton />
      <Routes>
        <Route path="/" element={<MobileHomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/inquiries" element={<InquiriesPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/verify" element={<VerifyPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostRoute />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/halls" element={<Navigate to="/services?category=halls" replace />} />
        <Route path="/halls/:id" element={<HallDetailRoute />} />
        <Route path="/packages/:id" element={<PackageDetailRoute />} />
        <Route path="/partner-plans" element={<PartnerPlansPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServiceDetailRoute />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/tools/hashtag-generator" element={<HashtagGeneratorPage />} />
        <Route path="/invitations" element={<InvitationGeneratorPage />} />
        <Route path="/invite/:slug" element={<PublicInvitationPage />} />
        <Route path="/referrals" element={<ReferralsPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/vendor-onboarding" element={<VendorOnboardingPage />} />
        <Route path="/bookings" element={<MobileBookingsPage />} />
        <Route path="/saved" element={<MobileSavedPage />} />
        <Route path="/profile" element={<MobileProfilePage />} />
        <Route path="/sign-in" element={<MobileSignInPage />} />
        <Route path="/sign-up" element={<MobileSignUpPage />} />
        <Route path="/provider-dashboard" element={<ProviderDashboardPage />} />
        <Route path="/reels" element={<ReelsPage />} />
        <Route path="/vendor/:id" element={<VendorProfilePage />} />
        <Route path="/planner" element={<CelebrationPlannerPage />} />
        <Route path="/planner/checklist" element={<CelebrationPlannerPage />} />
        <Route path="/planner/budget" element={<CelebrationPlannerPage />} />
        <Route path="/planner/guests" element={<CelebrationPlannerPage />} />
        <Route path="/quote/:id" element={<QuoteRequestPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppProviders>
  );
}
