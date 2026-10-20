import { useEffect } from "react";
import { scrollAppTo } from "@/lib/appScroll";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Explore restores its position after its catalog has loaded.
    if (pathname !== "/services") scrollAppTo(0);
  }, [pathname]);

  return null;
}
