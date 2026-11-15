import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { usePrototype } from "./store";
import { serializeState, MAX_IMPORT_BYTES } from "./storage";
import { PageTitle } from "./shell";

export function downloadText(name: string, text: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function SettingsPage() {
  const { state, reset, importState, original } = usePrototype();
  const [pending, setPending] = useState<"reset" | "import" | null>(null);
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function readFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setError("");
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setError("Plik jest za duży (maksymalnie 2 MB).");
      return;
    }
    try {
      setRaw(await file.text());
      setPending("import");
    } catch {
      setError("Nie udało się odczytać pliku.");
    }
  }
  function confirm() {
    setMessage("");
    if (pending === "reset") {
      if (reset()) setMessage("Przywrócono scenariusz początkowy.");
    } else if (importState(raw)) {
      setMessage("Dane zostały zaimportowane.");
    }
    setPending(null);
  }
  return (
    <>
      <PageTitle>Ustawienia prototypu</PageTitle>
      <section className="prototype-panel prototype-form">
        <h2>Dane scenariusza</h2>
        <p>
          Zmiany są zapisane tylko w tej przeglądarce. Pre-rozmowy z własnym nagraniem są usuwane po
          7 dniach przy otwarciu lub podczas działania aplikacji. Wysłanie linku innej osobie nie
          przenosi Twoich danych. Eksport pozwala przekazać scenariusz lub zachować kopię przed
          resetem; zawiera również nagrania i transkrypcje pre-rozmów. Pobrane pliki usuń osobno.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => downloadText("doroboty-scenariusz.json", serializeState(state))}
          >
            Eksportuj dane
          </Button>
          <Button variant="outline" render={<label />}>
            Importuj dane
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              aria-label="Importuj plik scenariusza"
              onChange={readFile}
            />
          </Button>
          {original !== null && (
            <Button
              variant="outline"
              onClick={() =>
                downloadText("doroboty-zapis-do-odzyskania.txt", original, "text/plain")
              }
            >
              Pobierz poprzedni zapis
            </Button>
          )}
        </div>
        <Button variant="destructive" onClick={() => setPending("reset")}>
          Resetuj scenariusz
        </Button>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
      </section>
      <section className="prototype-panel prototype-form mt-6">
        <h2>O prototypie</h2>
        <p>
          Wybór osoby zastępuje logowanie. Propozycje AI, Match Score i podsumowania odtwarzają
          przygotowany scenariusz; nie oceniają kompetencji. Używaj przygotowanych danych i CV. W
          E01 nagrywaj wyłącznie własny głos; nie nagrywaj innych osób ani nie podawaj danych
          identyfikujących lub poufnych.
        </p>
        <p>
          Problem z prototypem? Napisz do{" "}
          <a className="underline" href="mailto:daniel.porebski@allegro.com">
            daniel.porebski@allegro.com
          </a>
          . Podaj przeglądarkę, przybliżony czas i kroki prowadzące do błędu. Nie przesyłaj nagrań,
          transkrypcji ani plików eksportu.
        </p>
      </section>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(v) => {
          if (!v) setPending(null);
        }}
        title={pending === "reset" ? "Zresetować scenariusz?" : "Zastąpić dane scenariusza?"}
        description="Ta operacja zastąpi lokalne zmiany. Możesz najpierw wyeksportować dane."
        label={pending === "reset" ? "Resetuj" : "Importuj"}
        pending={false}
        onConfirm={confirm}
      />
    </>
  );
}
export function PrivacyPage() {
  return (
    <section className="prototype-section max-w-4xl">
      <h1>Prywatność prototypu</h1>
      <div className="mt-6 space-y-5">
        <p>
          Ta wersja służy do ćwiczeń i testów interfejsu. Korzystaj z przygotowanych danych i CV.
          Podczas E01 możesz nagrać wyłącznie własny głos. Nie nagrywaj innych osób ani nie podawaj
          imion, danych kontaktowych lub poufnych informacji w nagraniu czy transkrypcji.
        </p>
        <p>
          Profile, aplikacje, nagrania i ustawienia pozostają w pamięci tej przeglądarki.
          Pre-rozmowa z własnym nagraniem, jej transkrypcje i raport są usuwane po 7 dniach od
          nagrania przy otwarciu aplikacji i co minutę podczas jej działania. Gdy aplikacja jest
          zamknięta, dane zostaną usunięte przy kolejnym uruchomieniu. Starsze nagrania bez daty są
          usuwane od razu. Używaj własnego urządzenia lub osobnego profilu przeglądarki. Treść
          profilu, aplikacji, CV, notatek, transkrypcji i nagrań pozostaje lokalna; aplikacja nie
          wysyła jej do bazy, dostawcy AI ani PostHoga. Każda osoba korzystająca z tej przeglądarki
          może odczytać zapisane dane. Plik eksportu zawiera cały lokalny scenariusz, w tym notatki,
          nagrania i transkrypcje pre-rozmów. Każda osoba mająca plik może odczytać jego zawartość.
        </p>
        <p>
          Jeśli właściciel wdrożenia włączy PostHoga, aplikacja wyśle do projektu w europejskim
          regionie PostHog nazwę zdarzenia i stałą kategorię odwiedzanego ekranu. SDK dołącza też
          tymczasowy, anonimowy identyfikator techniczny, który nie jest zapisywany w przeglądarce
          ani łączony z danymi prototypu. Aplikacja nie wysyła pełnego adresu strony, wyszukiwań,
          wartości formularzy, identyfikatorów kandydatów, ofert ani rekordów scenariusza. PostHog
          może otrzymać adres IP podczas żądania; właściciel projektu powinien włączyć ustawienie
          „Discard client IP data”, aby PostHog nie zapisywał adresów IP. Zbieranie zdarzeń jest
          wyłączone, jeśli wdrożenie nie ma jawnej konfiguracji PostHoga.
        </p>
        <p>
          „Resetuj scenariusz” w ustawieniach zastępuje Twoje zmiany danymi początkowymi. Aby usunąć
          lokalny zapis prototypu, wyczyść dane tej witryny w ustawieniach przeglądarki. Pobrane
          pliki eksportu i odzyskiwania usuń osobno, np. z folderu Pobrane. Hosting może prowadzić
          własne logi dostępu. Automatyczne usuwanie nie obejmuje pobranych plików.
        </p>
      </div>
    </section>
  );
}
