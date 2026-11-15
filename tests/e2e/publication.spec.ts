import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { initialState, transition } from "../../src/features/prototype/model";
import { createInterview } from "../../src/features/pre-interview/model";
import { STORAGE_KEY } from "../../src/features/prototype/storage";

test("an out-of-band update cannot be overwritten by save or reset", async ({ page }) => {
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  await page.goto("/#/app/profil");
  const updated = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.people[0].headline = "Zmiana spoza bieżącej karty";
    const raw = JSON.stringify(state);
    localStorage.setItem(key, raw);
    return raw;
  }, STORAGE_KEY);
  await page.getByLabel("Nagłówek zawodowy").fill("Starszy formularz");
  await page.getByRole("button", { name: "Zapisz profil", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Nie nadpisano danych");
  await page.goto("/#/app/settings");
  await page.getByRole("button", { name: "Resetuj scenariusz", exact: true }).click();
  await page.getByRole("button", { name: "Resetuj", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Nie nadpisano danych");
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(updated);
});

test("a second tab cannot overwrite the owner and can resume after the owner closes", async ({
  page,
  context,
}) => {
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  await page.goto("/#/app/profil");
  const second = await context.newPage();
  await second.goto("/#/app/settings");
  await expect(second.getByRole("heading", { name: "Edycja w jednej karcie" })).toBeVisible();
  await expect(second.getByRole("button", { name: "Resetuj scenariusz" })).toHaveCount(0);
  for (const width of [1280, 390, 320]) {
    await second.setViewportSize({ width, height: 900 });
    expect(await second.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await second.screenshot({ path: `artifacts/publication-lock-${width}.png`, fullPage: true });
  }
  expect((await new AxeBuilder({ page: second }).include("main").analyze()).violations).toEqual([]);
  await page.getByLabel("Nagłówek zawodowy").fill("Nowszy zapis właściciela");
  await page.getByRole("button", { name: "Zapisz profil", exact: true }).click();
  await page.close();
  await second.getByRole("button", { name: "Odśwież stronę" }).focus();
  await second.keyboard.press("Enter");
  await expect(second.getByRole("heading", { name: "Ustawienia prototypu" })).toBeVisible();
  await second.goto("/#/app/profil");
  await expect(second.getByLabel("Nagłówek zawodowy")).toHaveValue("Nowszy zapis właściciela");
});

test("expired audio is deleted from the saved scenario on startup and while the app is open", async ({
  page,
}) => {
  const now = new Date("2026-11-14T10:00:00.000Z");
  await page.clock.install({ time: now });
  await page.goto("/");
  await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: STORAGE_KEY,
    state: initialState(),
  });
  let state = transition(initialState(), { type: "select_person", id: "candidate-anna" });
  const interview = createInterview("Przykładowy projekt do sprawdzenia retencji nagrań.");
  interview.answers.contribution = {
    text: "Transkrypcja do usunięcia",
    recording: {
      kind: "local",
      dataUrl: "data:audio/wav;base64,AAAA",
      durationSeconds: 1,
      recordedAt: "2026-11-07T10:01:00.000Z",
    },
  };
  state = transition(state, {
    type: "draft",
    jobId: state.jobs[0].id,
    answer: interview.project,
    notes: "",
    generated: "",
    preInterview: interview,
  });
  await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: STORAGE_KEY,
    state,
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Przygotowujemy scenariusz" })).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toContain(
    "Transkrypcja do usunięcia",
  );
  await page.clock.fastForward(60_001);
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY))
    .not.toContain("Transkrypcja do usunięcia");
  await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: STORAGE_KEY,
    state,
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY))
    .not.toContain("data:audio");
});
