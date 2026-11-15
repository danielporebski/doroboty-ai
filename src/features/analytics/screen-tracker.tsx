import { useEffect } from "react";
import { useLocation } from "react-router";
import { trackScreenView } from "./posthog";

export function ScreenTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    trackScreenView(pathname);
  }, [pathname]);

  return null;
}
