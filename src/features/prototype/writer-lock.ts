import { useEffect, useRef, useState } from "react";
import { STORAGE_KEY } from "./storage";

export function useWriterLock() {
  const [status, setStatus] = useState<"pending" | "ready" | "busy" | "unsupported">("pending");
  const owned = useRef(false);
  useEffect(() => {
    let disposed = false;
    let release: (() => void) | undefined;
    if (!navigator.locks) {
      setStatus("unsupported");
      return;
    }
    void navigator.locks
      .request(`${STORAGE_KEY}.writer`, { ifAvailable: true }, async (lock) => {
        if (disposed) return;
        if (!lock) {
          setStatus("busy");
          return;
        }
        owned.current = true;
        setStatus("ready");
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        owned.current = false;
      })
      .catch(() => {
        if (!disposed) setStatus("unsupported");
      });
    return () => {
      disposed = true;
      owned.current = false;
      release?.();
    };
  }, []);
  return { status, owned };
}
