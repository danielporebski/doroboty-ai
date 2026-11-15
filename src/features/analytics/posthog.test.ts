import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BeforeSendFn, PostHogConfig } from "posthog-js";

const sdk = vi.hoisted(() => ({ init: vi.fn(), capture: vi.fn() }));
vi.mock("posthog-js", () => ({ default: sdk }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("VITE_POSTHOG_ENABLED", "true");
  vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "phc_test_only");
});

afterEach(() => vi.unstubAllEnvs());

async function initialize() {
  const tracker = await import("./posthog");
  tracker.trackScreenView("/");
  await vi.waitFor(() => expect(sdk.init).toHaveBeenCalledOnce());
  return { tracker, config: sdk.init.mock.calls[0][1] as Partial<PostHogConfig> };
}

describe("optional analytics", () => {
  it("captures each homepage CTA activation independently of screen-view deduplication", async () => {
    const { tracker, config } = await initialize();
    tracker.trackViewJobsClick();
    tracker.trackViewJobsClick();
    expect(sdk.capture).not.toHaveBeenCalled();
    config.loaded?.(sdk as never);
    await vi.waitFor(() => expect(sdk.capture).toHaveBeenCalledTimes(3));
    expect(sdk.capture.mock.calls.filter(([event]) => event === "view_jobs_clicked")).toEqual([
      ["view_jobs_clicked", { screen: "home" }, { send_instantly: true }],
      ["view_jobs_clicked", { screen: "home" }, { send_instantly: true }],
    ]);
  });

  it("waits for SDK readiness and reports screen categories without paths or searches", async () => {
    const { tracker, config } = await initialize();
    expect(sdk.capture).not.toHaveBeenCalled();
    config.loaded?.(sdk as never);
    await vi.waitFor(() =>
      expect(sdk.capture).toHaveBeenCalledWith("prototype_screen_viewed", { screen: "home" }),
    );
    tracker.trackScreenView("/oferty/private-slug");
    tracker.trackScreenView("/oferty/private-slug");
    await vi.waitFor(() => expect(sdk.capture).toHaveBeenCalledTimes(2));
    expect(sdk.capture).toHaveBeenLastCalledWith("prototype_screen_viewed", {
      screen: "job_detail",
    });
  });

  it("preserves anonymous ingestion fields and removes page and person data", async () => {
    const { config } = await initialize();
    const beforeSend = config.before_send as BeforeSendFn;
    const event = {
      event: "prototype_screen_viewed",
      uuid: "test-event",
      properties: {
        token: "phc_test_only",
        distinct_id: "temporary-anonymous-id",
        screen: "home",
        $current_url: "https://example.test/?search=private-text",
        $referrer: "https://example.test/private-slug",
        $process_person_profile: true,
      },
      $set: { name: "Private name" },
      $set_once: { email: "private@example.test" },
    };
    expect(beforeSend(event)).toEqual({
      event: "prototype_screen_viewed",
      uuid: "test-event",
      properties: {
        token: "phc_test_only",
        distinct_id: "temporary-anonymous-id",
        $process_person_profile: false,
        screen: "home",
      },
    });
    expect(beforeSend({ ...event, event: "$autocapture" })).toBeNull();
    expect(beforeSend({ ...event, event: "view_jobs_clicked" })).toEqual({
      ...beforeSend(event),
      event: "view_jobs_clicked",
    });
    expect(
      beforeSend({
        ...event,
        event: "view_jobs_clicked",
        properties: { ...event.properties, screen: "job_list" },
      }),
    ).toBeNull();
    expect(
      beforeSend({ ...event, properties: { ...event.properties, screen: "private" } }),
    ).toBeNull();
    expect(
      beforeSend({ ...event, properties: { token: "phc_test_only", screen: "home" } }),
    ).toBeNull();
    expect(config).toMatchObject({
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      disable_persistence: true,
      person_profiles: "never",
    });
  });

  it.each([
    { enabled: "false", token: "phc_test_only" },
    { enabled: "true", token: "" },
  ])("does not initialize when disabled or missing a token: %j", async ({ enabled, token }) => {
    vi.stubEnv("VITE_POSTHOG_ENABLED", enabled);
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", token);
    const { trackScreenView, trackViewJobsClick } = await import("./posthog");
    trackScreenView("/");
    trackViewJobsClick();
    await Promise.resolve();
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.capture).not.toHaveBeenCalled();
  });
});
