import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ExternalImg } from "@/components/ui/ExternalImg";

export function BlogPostRoute() {
  const { slug = "" } = useParams();

  if (slug !== "tamil-wedding-planning-checklist-2026") {
    return <div className="p-20 text-center">Blog not found.</div>;
  }

  return (
    <div className="min-h-screen luxury-page">
      <Navbar />

      <article className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#9f1239] mb-6 leading-tight">
              Tamil Wedding Planning
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Planning a grand Tamil wedding is no small feat. Once the engagement is over,
              wondering what to do next? This complete guide will definitely help you navigate the process.
            </p>
          </div>

          <div className="relative h-[400px] sm:h-[500px] w-full rounded-3xl overflow-hidden shadow-xl mb-12">
            <ExternalImg
              src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80"
              alt="Tamil Wedding Planning"
              fill
            />
          </div>

          <div className="prose prose-lg max-w-none bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
            <h2>Introduction</h2>
            <p>
              In Tamil Nadu, a wedding is not just a function—it's a grand festival.
              From Engagement to Mehendi, Sangeet, Muhurtham, and Reception, there is
              so much to meticulously plan for each event.
            </p>

            <h2>1. Budget Planning</h2>
            <p>
              The very first step in wedding planning is setting a clear budget.
              Determine in advance exactly how much you are willing to allocate for the
              marriage hall, catering, decorations, and other expenses.
            </p>

            <h2>2. Marriage Hall Booking</h2>
            <p>
              As soon as the Muhurtham date is fixed, your top priority should be
              booking the marriage hall. Premium and popular halls get booked 6 to 8 months in advance.
            </p>

            <h2>3. Photographer Selection</h2>
            <p>
              After the wedding celebrations end, the only tangible memories left are
              the photos and videos. Apart from traditional photography, candid photography,
              drone shots, and pre-wedding shoots are highly trendy and essential right now.
            </p>

            <h2>4. Catering Arrangements</h2>
            <p>
              While the traditional banana leaf (elai saapadu) meal remains a staple,
              having a modern buffet and live food counters for the evening reception is
              a huge trend. Decide your menu early and always confirm with the caterers after a tasting session.
            </p>

            <h2>5. Decoration Planning</h2>
            <p>
              The stage decoration will serve as the backdrop for all your wedding photos.
              The entrance arch, the traditional swing (Unjal) setup, and the dining area
              decorations are equally important to create a magical atmosphere.
            </p>

            <div className="mt-12 bg-[#fff1f2] rounded-2xl p-8 border border-[#e11d48]/10 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-0">
                Looking for trusted wedding vendors?
              </h3>
              <p className="text-gray-600 mb-6">
                Explore verified marriage halls, photographers, caterers and event
                professionals on VizhaOne.
              </p>
              <Link
                to="/"
                className="inline-block bg-[#e11d48] hover:bg-[#be123c] text-white font-bold py-3 px-8 rounded-full transition-colors shadow-lg hover:shadow-xl"
              >
                Visit: vizhaone.com
              </Link>
            </div>
          </div>
        </div>
      </article>

      <SiteFooter />
      <MobileBottomNav />
      <div className="h-20 md:hidden" />
    </div>
  );
}
