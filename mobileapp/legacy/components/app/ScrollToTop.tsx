import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Explore restores its position after its catalog has loaded.
    if (pathname !== "/services") window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
