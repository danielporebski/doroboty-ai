import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { initialState, transition, type Action, type State } from "./model";
import {
  parseState,
  readState,
  saveState,
  serializeState,
  STORAGE_KEY,
  type StoragePort,
} from "./storage";
import { expireRecordings } from "./retention";
import { useWriterLock } from "./writer-lock";
function browserStorage(): StoragePort | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function useStore() {
  const writer = useWriterLock();
  const [loaded] = useState(() => readState(browserStorage()));
  const [state, setState] = useState(loaded.state);
  const [issue, setIssue] = useState(loaded.issue);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(loaded.blocked);
  const latest = useRef(state);
  const expectedRaw = useRef(loaded.raw);
  const [retentionRevision, setRetentionRevision] = useState(0);
  function checkWriter() {
    if (!writer.owned.current) {
      setError(
        "Edycja jest dostępna w jednej karcie. Zamknij pozostałe karty prototypu i odśwież stronę.",
      );
      return false;
    }
    try {
      if (browserStorage()?.getItem(STORAGE_KEY) !== expectedRaw.current && browserStorage()) {
        setError(
          "Zapis zmienił się poza tą kartą. Nie nadpisano danych. Zachowaj niezapisane odpowiedzi i odśwież stronę.",
        );
        return false;
      }
    } catch {
      /* Unavailable storage retains the existing in-memory recovery behavior. */
    }
    return true;
  }
  function persistState(next: State) {
    saveState(browserStorage(), next);
    expectedRaw.current = serializeState(next);
  }
  function commit(next: State, replace = false, persist = false) {
    if (!checkWriter()) return false;
    next = expireRecordings(next);
    if (persist) {
      if (blocked) {
        setError(
          "Najpierw odzyskaj lub zresetuj zapis w ustawieniach. Odpowiedzi pozostają w formularzu.",
        );
        return false;
      }
      try {
        persistState(next);
      } catch (e) {
        setIssue((e as Error).message);
        setError(
          "Nie zapisano zmian. Odpowiedzi pozostają w formularzu; zwolnij miejsce lub zachowaj je przed zamknięciem strony.",
        );
        return false;
      }
    }
    latest.current = next;
    setState(next);
    setError("");
    if (blocked && !replace) return true;
    if (persist) {
      setIssue("");
      return true;
    }
    try {
      persistState(next);
      setIssue("");
      if (replace) setBlocked(false);
    } catch (e) {
      setIssue((e as Error).message);
    }
    return true;
  }
  function run(action: Action, options?: { persist: boolean }) {
    try {
      return commit(transition(latest.current, action), false, options?.persist);
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "ZodError"
          ? e.message
          : "Sprawdź poprawność i długość wprowadzonych danych.",
      );
      return false;
    }
  }
  function importState(raw: string) {
    try {
      const next = parseState(raw);
      return commit(next, true);
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  useEffect(() => {
    if (writer.status !== "ready") return;
    function expire() {
      const next = expireRecordings(latest.current);
      const rawExpired =
        loaded.raw !== null && !loaded.blocked && serializeState(loaded.state) !== loaded.raw;
      if (next === latest.current && (!rawExpired || expectedRaw.current !== loaded.raw)) return;
      if (commit(next, false, true)) setRetentionRevision((value) => value + 1);
    }
    expire();
    const interval = window.setInterval(expire, 60_000);
    window.addEventListener("focus", expire);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", expire);
    };
    // The timer reads latest.current; it must not restart after every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writer.status]);
  return {
    state,
    issue,
    error,
    blocked,
    original: loaded.original,
    writerStatus: writer.status,
    retentionRevision,
    run,
    importState,
    clearError: () => setError(""),
    reset: () => commit(initialState(), true),
  };
}
type Store = ReturnType<typeof useStore>;
const Context = createContext<Store | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function usePrototype() {
  const store = useContext(Context);
  if (!store) throw new Error("PrototypeProvider is required");
  return store;
}
