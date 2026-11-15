import { describe, expect, it } from "vitest";
import { initialState, transition } from "./model";
import { approveInterview, createInterview, questions } from "../pre-interview/model";
import { expireRecordings, RECORDING_RETENTION_MS } from "./retention";
import { parseState, serializeState } from "./storage";

function recordedScenario(recordedAt?: string) {
  const state = transition(initialState(), { type: "select_person", id: "candidate-anna" });
  const interview = createInterview("Przykładowy projekt z przygotowanego scenariusza.");
  for (const question of questions)
    interview.answers[question.id].text = "Przykładowa odpowiedź o pracy zespołu.";
  interview.answers.contribution.recording = {
    kind: "local",
    dataUrl: "data:audio/wav;base64,AAAA",
    durationSeconds: 1,
    recordedAt,
  };
  state.drafts.push({
    candidateId: "candidate-anna",
    jobId: state.jobs[0].id,
    answer: interview.project,
    notes: "",
    generated: "",
    preInterview: approveInterview(interview, "2026-11-10T10:00:00.000Z"),
  });
  return transition(state, {
    type: "submit",
    jobId: state.jobs[0].id,
    answer: interview.project,
    notes: "",
    generated: "",
    consent: true,
  });
}

describe("voice retention", () => {
  const recordedAt = "2026-11-01T10:00:00.000Z";
  const deadline = Date.parse(recordedAt) + RECORDING_RETENTION_MS;
  it("keeps audio before the deadline and removes the whole submitted interview at seven days", () => {
    const state = recordedScenario(recordedAt);
    expect(expireRecordings(state, deadline - 1)).toBe(state);
    const clean = expireRecordings(state, deadline);
    expect(clean.applications.at(-1)?.preInterview).toBeUndefined();
    expect(clean.applications.at(-1)?.answer).toBe(state.applications.at(-1)?.answer);
    expect(JSON.stringify(clean)).not.toContain("data:audio");
    expect(JSON.stringify(clean)).not.toContain("Przykładowa odpowiedź o pracy zespołu.");
  });
  it("removes undated legacy and future-dated audio rather than restarting its clock", () => {
    for (const date of [undefined, "2099-01-01T00:00:00.000Z"])
      expect(
        expireRecordings(recordedScenario(date), deadline).applications.at(-1)?.preInterview,
      ).toBeUndefined();
  });
  it("cannot restore expired recordings through old imports or exports", () => {
    const state = recordedScenario(recordedAt);
    expect(parseState(JSON.stringify(state)).applications.at(-1)?.preInterview).toBeUndefined();
    expect(serializeState(state)).not.toContain("data:audio");
  });
});
