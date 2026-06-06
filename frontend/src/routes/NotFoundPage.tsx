import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <p className="text-sm font-semibold text-[#e11d48] mb-2">404</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-500 mb-6">The page you are looking for does not exist.</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-2xl bg-[#e11d48] px-5 py-3 font-semibold text-white"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
