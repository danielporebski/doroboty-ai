import type { BeforeSendFn } from "posthog-js";

const eventName = "prototype_screen_viewed";
const allowedScreens = new Set([
  "home",
  "job_list",
  "job_detail",
  "company_profile",
  "methodology",
  "privacy",
  "persona_picker",
  "application",
  "workspace",
]);

const projectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim();
const enabled = import.meta.env.VITE_POSTHOG_ENABLED === "true" && Boolean(projectToken);
let clientPromise: Promise<typeof import("posthog-js").default | null> | undefined;
let lastPathname: string | undefined;

const beforeSend: BeforeSendFn = (event) => {
  if (event.event !== eventName) return null;

  const screen = event.properties?.screen;
  const token = event.properties?.token;
  const distinctId = event.properties?.distinct_id;
  if (
    typeof screen !== "string" ||
    !allowedScreens.has(screen) ||
    typeof token !== "string" ||
    !token ||
    typeof distinctId !== "string" ||
    !distinctId
  )
    return null;

  return {
    event: eventName,
    uuid: event.uuid,
    timestamp: event.timestamp,
    properties: { token, distinct_id: distinctId, $process_person_profile: false, screen },
  };
};

function classifyScreen(pathname: string): string | null {
  if (pathname === "/") return "home";
  if (pathname === "/oferty") return "job_list";
  if (pathname.startsWith("/oferty/")) return "job_detail";
  if (pathname.startsWith("/firmy/")) return "company_profile";
  if (pathname === "/metodologia") return "methodology";
  if (pathname === "/polityka-prywatnosci") return "privacy";
  if (pathname.startsWith("/auth/")) return "persona_picker";
  if (pathname.startsWith("/aplikuj/")) return "application";
  if (pathname === "/app" || pathname.startsWith("/app/")) return "workspace";
  return null;
}

function getClient() {
  if (!enabled || !projectToken) return Promise.resolve(null);

  clientPromise ??= import("posthog-js").then(
    ({ default: client }) =>
      new Promise((resolve) => {
        client.init(projectToken, {
          api_host: import.meta.env.VITE_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com",
          defaults: "2026-08-30",
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: false,
          capture_exceptions: false,
          capture_performance: false,
          capture_heatmaps: false,
          disable_session_recording: true,
          disable_surveys: true,
          disable_surveys_automatic_display: true,
          disable_product_tours: true,
          disable_web_experiments: true,
          disable_external_dependency_loading: true,
          advanced_disable_flags: true,
          disable_persistence: true,
          person_profiles: "never",
          save_campaign_params: false,
          save_referrer: false,
          before_send: beforeSend,
          loaded: () => resolve(client),
        });
      }),
  );

  return clientPromise;
}

export function trackScreenView(pathname: string) {
  if (pathname === lastPathname) return;
  lastPathname = pathname;

  const screen = classifyScreen(pathname);
  if (!screen) return;

  void getClient()
    .then((client) => client?.capture(eventName, { screen }))
    .catch(() => undefined);
}
