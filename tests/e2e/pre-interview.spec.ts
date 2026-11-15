import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { initialState, transition } from "../../src/features/prototype/model";
import { createInterview, demoTranscript, questions } from "../../src/features/pre-interview/model";
import { STORAGE_KEY } from "../../src/features/prototype/storage";

test.use({
  launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] },
});
const project =
  "Wdrożyliśmy asystenta AI do zgłoszeń. Prowadziłam discovery, wybór zakresu i pilota.";
test("failed durable writes cannot approve or submit an enriched application", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: STORAGE_KEY,
    state: seeded(false),
  });
  await page.goto("/#/aplikuj/ai-product-manager");
  await page.reload();
  await page.getByRole("button", { name: "Sprawdź przed zatwierdzeniem", exact: true }).click();
  await page.getByRole("checkbox", { name: /Sprawdziłam lub sprawdziłem/ }).check();
  const before = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Zatwierdź moje odpowiedzi", exact: true }).click();
  await expect(page.getByRole("heading", { name: "To Twoje odpowiedzi" })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(before);
  await expect(page.getByLabel("Opisz projekt, który pokazuje Twoje doświadczenie")).toBeEditable();
  await page.reload();
  await page.getByRole("button", { name: "Sprawdź przed zatwierdzeniem", exact: true }).click();
  await page.getByRole("checkbox", { name: /Sprawdziłam lub sprawdziłem/ }).check();
  await page.getByRole("button", { name: "Zatwierdź moje odpowiedzi", exact: true }).click();
  await page.getByRole("checkbox", { name: /^Zatwierdzam treść aplikacji/ }).check();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Aplikuj na ofertę" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Wyślij aplikację", exact: true })).toBeEnabled();
  expect(
    await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).applications.some(
          (app: { candidateId: string }) => app.candidateId === "candidate-anna",
        ),
      STORAGE_KEY,
    ),
  ).toBe(false);
});
async function choose(page: Page, name: string) {
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: `Wejdź jako ${name}`, exact: true }).click();
}
async function start(page: Page) {
  await choose(page, "Anna Kowalska");
  await page.goto("/#/aplikuj/ai-product-manager");
  await page.getByLabel("Opisz projekt, który pokazuje Twoje doświadczenie").fill(project);
  await page.getByRole("button", { name: "Doprecyzuj projekt z AI", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Doprecyzuj swój wkład" })).toBeVisible();
}
async function answerText(page: Page, index: number, text: string) {
  await page.getByRole("button", { name: new RegExp(`^${index + 1}\\. `) }).click();
  await page.getByLabel("Twoja odpowiedź", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Zapisz odpowiedzi", exact: true }).click();
}
function seeded(approve = true) {
  let state = transition(initialState(), { type: "select_person", id: "candidate-anna" });
  const interview = createInterview(project);
  questions.forEach((q) => {
    interview.answers[q.id].text =
      `Moja odpowiedź o projekcie: ${q.title}. Współpracowałam z zespołem i mierzyłam wynik.`;
  });
  interview.answers.decision = { text: demoTranscript, recording: { kind: "demo" } };
  state = transition(state, {
    type: "draft",
    jobId: state.jobs[0].id,
    answer: project,
    notes: "",
    generated: "",
    preInterview: interview,
  });
  return approve
    ? transition(state, { type: "approve_interview", jobId: state.jobs[0].id, consent: true })
    : state;
}

test("candidate approves text/audio sources and recruiter follows summary links, including copied URLs", async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (!/^(http:\/\/127\.0\.0\.1:3106|data:|blob:)/.test(r.url())) external.push(r.url());
  });
  await start(page);
  await answerText(
    page,
    0,
    "Przeprowadziłam 18 wywiadów, ustaliłam priorytety i zakres. Inżynierowie zbudowali integrację.",
  );
  await page.getByRole("button", { name: /^2\. / }).click();
  await page.getByRole("button", { name: "Nagraj odpowiedź", exact: true }).click();
  await page
    .getByRole("button", { name: "Użyj przykładu audio z transkrypcją", exact: true })
    .click();
  await expect(page.getByLabel("Transkrypcja do sprawdzenia")).toHaveValue(demoTranscript);
  await expect
    .poll(() => page.locator("audio").evaluate((el) => (el as HTMLAudioElement).duration))
    .toBeGreaterThan(10);
  await page.getByRole("button", { name: "Zapisz odpowiedzi", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /^2\. / }).click();
  await expect(page.getByLabel("Transkrypcja do sprawdzenia")).toHaveValue(demoTranscript);
  await answerText(
    page,
    2,
    "Czas obsługi w pilocie spadł o 30%. Nie znam wielkości próby ani długoterminowego wyniku.",
  );
  await page.getByRole("button", { name: "Sprawdź przed zatwierdzeniem", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Zatwierdź moje odpowiedzi", exact: true }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: /Sprawdziłam lub sprawdziłem/ }).check();
  await page.getByRole("button", { name: "Zatwierdź moje odpowiedzi", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Pre-rozmowa zatwierdzona" })).toBeFocused();
  await expect(
    page.getByLabel("Opisz projekt, który pokazuje Twoje doświadczenie"),
  ).toHaveAttribute("readonly", "");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Pre-rozmowa zatwierdzona" })).toBeVisible();
  await page.getByRole("checkbox", { name: /^Zatwierdzam treść aplikacji/ }).check();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await page.getByRole("link", { name: "AI Product Manager", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Pre-rozmowa", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByRole("heading", { name: "Ocena wiarygodności AI", exact: true }),
  ).toHaveCount(0);
  const id = page.url().split("/").pop();
  await choose(page, "Karolina Wiśniewska");
  await page.goto("/#/app/kandydaci");
  await page.getByRole("button", { name: "Z pre-rozmową", exact: true }).click();
  await expect(page.getByRole("link", { name: "Marek Nowak", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Anna Kowalska", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Podsumowanie AI Symulacja" })).toBeVisible();
  await expect(page.getByText("78%", { exact: true })).toBeVisible();
  const source = page.getByRole("link", { name: /Źródło: Twoja decyzja/ });
  await source.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#pre-source-decision")).toHaveAttribute("open", "");
  await expect(page.locator("#pre-source-decision summary")).toBeFocused();
  await page.reload();
  await expect(page.locator("#pre-source-decision summary")).toBeFocused();
  await expect(page.locator("#pre-source-decision")).toContainText(demoTranscript);
  expect((await new AxeBuilder({ page }).include("main").analyze()).violations).toEqual([]);
  for (const width of [1280, 950, 850, 700, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByRole("heading", { name: "Ocena wiarygodności AI" })).toBeVisible();
    if ([1280, 390, 320].includes(width)) {
      await page.evaluate(() => window.scrollTo(0, 0));
      if (width === 1280) await page.screenshot({ path: "artifacts/e01-recruiter-preview.png" });
      await page.screenshot({ path: `artifacts/e01-recruiter-${width}.png`, fullPage: true });
    }
  }
  await choose(page, "Tomasz Zieliński");
  await page.goto(`/#/app/kandydaci/${id}`);
  await expect(page.getByRole("heading", { name: "Nie znaleziono strony" })).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("editing, deleting and restarting drafts preserve explicit saving and never enrich an ordinary submission", async ({
  page,
}) => {
  await start(page);
  await answerText(page, 0, "Moja robocza odpowiedź do usunięcia.");
  await page.getByRole("button", { name: "Usuń odpowiedź", exact: true }).click();
  await page.getByRole("button", { name: "Zapisz odpowiedzi", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Twoja odpowiedź", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Sprawdź przed zatwierdzeniem" }).click();
  await expect(page.getByRole("alert")).toContainText("Uzupełnij wszystkie trzy");
  await page
    .getByLabel("Opisz projekt, który pokazuje Twoje doświadczenie")
    .fill(`${project} Aktualizacja.`);
  await page.getByRole("button", { name: "Przygotuj pytania ponownie", exact: true }).click();
  await page.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(page.getByText("Opis projektu się zmienił.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Przygotuj pytania ponownie", exact: true }).click();
  await page.getByRole("button", { name: "Przygotuj nowe pytania", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Doprecyzuj swój wkład" })).toBeVisible();
  await expect(
    page.getByText("Pytania przygotowane, szkic zapisany.", { exact: true }),
  ).toBeVisible();
  const applicationConsent = page.getByRole("checkbox", { name: /^Zatwierdzam treść aplikacji/ });
  await applicationConsent.check();
  await expect(applicationConsent).toBeChecked();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await page.getByRole("link", { name: "AI Product Manager", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Pre-rozmowa", exact: true })).toHaveCount(0);
});

test("recording uses browser audio, releases the microphone and survives reload/export/import", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["microphone"]);
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (options) => {
      const stream = await original(options);
      (window as unknown as { e01Stream: MediaStream }).e01Stream = stream;
      return stream;
    };
  });
  await start(page);
  await page.getByRole("button", { name: "Nagraj odpowiedź", exact: true }).click();
  await page.getByRole("button", { name: "Rozpocznij nagrywanie", exact: true }).click();
  await expect(page.getByText(/Nagrywanie: 1 s/)).toBeVisible();
  await page.getByRole("button", { name: "Zatrzymaj nagrywanie", exact: true }).click();
  await expect(page.locator("audio")).toHaveAttribute("src", /^data:audio\//);
  expect(
    await page.evaluate(() =>
      (window as unknown as { e01Stream: MediaStream }).e01Stream
        .getTracks()
        .every((track) => track.readyState === "ended"),
    ),
  ).toBe(true);
  await page
    .getByLabel("Transkrypcja do sprawdzenia")
    .fill("To ręcznie wpisana transkrypcja własnego przykładowego nagrania.");
  await page.getByRole("button", { name: "Zapisz odpowiedzi", exact: true }).click();
  const raw = await page.evaluate((key) => localStorage.getItem(key)!, STORAGE_KEY);
  const before = await page.locator("audio").getAttribute("src");
  await page.reload();
  await expect(page.locator("audio")).toHaveAttribute("src", before!);
  await page.goto("/#/app/settings");
  await page
    .getByLabel("Importuj plik scenariusza")
    .setInputFiles({ name: "e01.json", mimeType: "application/json", buffer: Buffer.from(raw) });
  await page.getByRole("button", { name: "Importuj", exact: true }).click();
  await page.goto("/#/aplikuj/ai-product-manager");
  await expect(page.locator("audio")).toHaveAttribute("src", before!);
  await page.getByRole("button", { name: "Usuń nagranie i transkrypcję", exact: true }).click();
  await expect(page.locator("audio")).toHaveCount(0);
  await expect(page.getByLabel("Twoja odpowiedź", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Zapisz odpowiedzi", exact: true }).click();
  await page.getByRole("button", { name: "Nagraj odpowiedź", exact: true }).click();
  await page.getByRole("button", { name: "Rozpocznij nagrywanie", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Zatrzymaj nagrywanie", exact: true }),
  ).toBeVisible();
  await page.goto("/#/app/profil");
  expect(
    await page.evaluate(() =>
      (window as unknown as { e01Stream: MediaStream }).e01Stream
        .getTracks()
        .every((track) => track.readyState === "ended"),
    ),
  ).toBe(true);
});

test("denied microphone and denied durable storage keep the candidate's text editable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException("Denied", "NotAllowedError"));
  });
  await start(page);
  await page.getByRole("button", { name: "Nagraj odpowiedź", exact: true }).click();
  await page.getByRole("button", { name: "Rozpocznij nagrywanie", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Nie udało się uruchomić mikrofonu");
  await page.getByRole("button", { name: "Napisz odpowiedź", exact: true }).click();
  await page
    .getByLabel("Twoja odpowiedź", { exact: true })
    .fill("Tekst zachowany mimo błędu zapisu.");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Zapisz odpowiedzi", exact: true }).click();
  await expect(
    page.getByText("Nie zapisano szkicu. Odpowiedzi pozostają w formularzu.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Twoja odpowiedź", { exact: true })).toHaveValue(
    "Tekst zachowany mimo błędu zapisu.",
  );
});

test("approved interview remains frozen on long-content mobile forms and reload", async ({
  page,
}) => {
  let state = seeded(false);
  const draft = state.drafts[0];
  const interview = draft.preInterview!;
  const longAnswer =
    "Samodzielnie planowałam badania użytkowników, ustalałam priorytety i mierzyłam rezultat. ".repeat(
      45,
    );
  interview.answers.contribution.text = longAnswer;
  draft.answer = interview.project =
    `${project} ${"Opisuję kontekst, podział pracy i ograniczenia pilota. ".repeat(15)}`.trim();
  state.jobs[0].title =
    "Starsza menedżerka produktu AI i automatyzacji obsługi zgłoszeń w zespole odpowiedzialnym za procesy operacyjne";
  state = transition(state, { type: "approve_interview", jobId: state.jobs[0].id, consent: true });
  await page.goto("/");
  await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: STORAGE_KEY,
    state,
  });
  await page.goto("/#/aplikuj/ai-product-manager");
  await page.reload();
  await page.getByText("Sprawdź zatwierdzone odpowiedzi", { exact: true }).click();
  await expect(page.locator("#pre-source-contribution .pre-answer-text")).toHaveText(
    longAnswer.trim(),
  );
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { name: "Pre-rozmowa zatwierdzona" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `artifacts/e01-candidate-approved-${width}.png`,
      fullPage: true,
    });
  }
  expect((await new AxeBuilder({ page }).include("main").analyze()).violations).toEqual([]);
});
