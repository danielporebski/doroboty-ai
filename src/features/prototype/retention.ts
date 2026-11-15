import type { State } from "./model";

export const RECORDING_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/** Delete the complete interview, including transcripts and derived report copies. */
export function expireRecordings(state: State, now = Date.now()): State {
  let changed = false;
  function clean<T extends { preInterview?: State["drafts"][number]["preInterview"] }>(item: T): T {
    if (!item.preInterview) return item;
    const expired = Object.values(item.preInterview.answers).some(({ recording }) => {
      if (recording?.kind !== "local") return false;
      const recordedAt = Date.parse(recording.recordedAt ?? "");
      // Undated legacy audio and future timestamps cannot establish a valid retention window.
      return (
        !Number.isFinite(recordedAt) ||
        recordedAt > now ||
        now - recordedAt >= RECORDING_RETENTION_MS
      );
    });
    if (!expired) return item;
    changed = true;
    const copy = { ...item };
    delete copy.preInterview;
    return copy;
  }
  const drafts = state.drafts.map(clean);
  const applications = state.applications.map(clean);
  return changed ? { ...state, drafts, applications } : state;
}
