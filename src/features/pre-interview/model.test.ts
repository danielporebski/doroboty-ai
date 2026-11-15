import { describe, expect, it } from "vitest";
import { initialState, transition, stateSchema, type Action, type State } from "../prototype/model";
import { parseState, serializeState } from "../prototype/storage";
import {
  approveInterview,
  createInterview,
  demoTranscript,
  questions,
  recordingSchema,
} from "./model";

const time = "2026-11-08T10:00:00.000Z";
const project = "Prowadziłam pilota asystenta do obsługi zgłoszeń i odpowiadałam za priorytety.";
function prepared() {
  const state = transition(initialState(), { type: "select_person", id: "candidate-anna" });
  const interview = createInterview(project);
  interview.answers.contribution.text =
    "Moim zadaniem było discovery. Zespół inżynierski budował integrację.";
  interview.answers.decision = { text: demoTranscript, recording: { kind: "demo" } };
  interview.answers.result.text =
    "Porównaliśmy czas obsługi. Brakuje danych o trwałości rezultatu.";
  const action = {
    type: "draft" as const,
    jobId: state.jobs[0].id,
    notes: "Legacy notes",
    generated: "Legacy generated",
    answer: project,
    preInterview: interview,
  };
  return { state: transition(state, action), action };
}
function approved() {
  const { state, action } = prepared();
  return transition(state, { type: "approve_interview", jobId: action.jobId, consent: true }, time);
}
function submit(state: State) {
  return transition(
    state,
    {
      type: "submit",
      jobId: state.jobs[0].id,
      notes: "Legacy notes",
      generated: "Legacy generated",
      answer: project,
      consent: true,
    },
    time,
    "e01-anna",
  );
}
describe("E01 approved source snapshots", () => {
  it("keeps approval separate from submission and preserves legacy inputs", () => {
    const state = approved();
    expect(state.applications).toHaveLength(1);
    expect(state.drafts[0].preInterview?.status).toBe("approved");
    const sent = submit(state);
    expect(sent.drafts).toHaveLength(0);
    expect(sent.applications.at(-1)?.preInterview).toEqual(state.drafts[0].preInterview);
    expect(sent.applications.at(-1)?.sourceNotes).toBe("Legacy notes");
    expect(parseState(serializeState(sent))).toEqual(sent);
  });
  it("rejects edits, deletion and forged approval after or outside the explicit approval action", () => {
    const state = approved();
    const { action } = prepared();
    expect(() => transition(state, action)).toThrow("nie można zmieniać");
    expect(() =>
      transition(state, { ...action, preInterview: undefined, answer: `${project} changed` }),
    ).toThrow();
    const fake = { ...action, preInterview: state.drafts[0].preInterview };
    expect(() => transition(prepared().state, fake)).toThrow("osobnym działaniem");
    expect(() => transition(submit(state), action)).toThrow("zamknięta");
  });
  it("requires complete source answers, transcripts, consent and an unchanged project", () => {
    const { state, action } = prepared();
    const approve: Action = { type: "approve_interview", jobId: action.jobId, consent: true };
    expect(() => transition(state, { ...approve, consent: false })).toThrow("Zatwierdź");
    const incomplete = structuredClone(state);
    incomplete.drafts[0].preInterview!.answers.decision.text = " ";
    expect(() => transition(incomplete, approve)).toThrow();
    const stale = transition(state, { ...action, answer: `${project} Nowa wersja.` });
    expect(() => transition(stale, approve)).toThrow("Opis projektu się zmienił");
    expect(() =>
      transition(approved(), {
        type: "submit",
        jobId: action.jobId,
        answer: `${project} Changed`,
        notes: "",
        generated: "",
        consent: true,
      }),
    ).toThrow("Opis projektu");
  });
  it("omits incomplete interviews from ordinary submissions and blocks other actors", () => {
    const { state, action } = prepared();
    expect(submit(state).applications.at(-1)?.preInterview).toBeUndefined();
    for (const id of ["candidate-marek", "employer-brightlabs", "employer-northstar"]) {
      const other = transition(state, { type: "select_person", id });
      expect(() =>
        transition(other, { type: "approve_interview", jobId: action.jobId, consent: true }),
      ).toThrow();
    }
  });
  it("grounds every summary in its source and rejects mismatched reports on import", () => {
    const state = submit(approved());
    const snapshot = state.applications.at(-1)!.preInterview!;
    expect(snapshot.report.credibilityPercent).toBe(78);
    questions.forEach((q, i) =>
      expect(snapshot.report.summary[i]).toEqual({
        source: q.id,
        text: snapshot.answers[q.id].text,
      }),
    );
    const broken = structuredClone(state);
    broken.applications.at(-1)!.preInterview!.report.summary[0].text =
      "Invented personal achievement.";
    expect(stateSchema.safeParse(broken).success).toBe(false);
    const renamed = transition(state, {
      type: "profile",
      value: { name: "Changed", headline: "Changed", bio: "", location: "Warszawa" },
    });
    expect(renamed.applications.at(-1)?.preInterview).toEqual(snapshot);
  });
  it("bounds imported audio and round-trips a local recording without external URLs", () => {
    for (const dataUrl of [
      "https://example.com/audio.wav",
      "data:text/html;base64,PHNjcmlwdD4=",
      `data:audio/wav;base64,${"AAAA".repeat(70000)}`,
    ])
      expect(
        recordingSchema.safeParse({ kind: "local", dataUrl, durationSeconds: 2 }).success,
      ).toBe(false);
    const { state } = prepared();
    state.drafts[0].preInterview!.answers.decision.recording = {
      kind: "local",
      dataUrl: "data:audio/wav;base64,UklGRg==",
      durationSeconds: 2,
      recordedAt: new Date().toISOString(),
    };
    expect(parseState(serializeState(state))).toEqual(state);
    expect(() => approveInterview(createInterview(project), time)).toThrow();
  });
});
