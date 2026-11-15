import { z } from "zod";

export const MIN_PROJECT_LENGTH = 20;
export const MAX_RECORDING_BYTES = 200_000;
export const MAX_RECORDING_SECONDS = 60;
export const questionIds = ["contribution", "decision", "result"] as const;
export type QuestionId = (typeof questionIds)[number];
export const questions = [
  {
    id: "contribution",
    title: "Własny wkład",
    prompt: "Za co odpowiadałaś lub odpowiadałeś samodzielnie, a co robił zespół?",
    followUp:
      "Które zadanie było wyłącznie Twoją odpowiedzialnością i jak wyglądała współpraca z zespołem?",
  },
  {
    id: "decision",
    title: "Twoja decyzja",
    prompt: "Jaką ważną decyzję podjęłaś lub podjąłeś w tym projekcie i dlaczego?",
    followUp: "Jakie inne możliwości rozważaliście i co przesądziło o Twojej decyzji?",
  },
  {
    id: "result",
    title: "Rezultat i pomiar",
    prompt: "Jaki był rezultat projektu i jak sprawdziliście, że został osiągnięty?",
    followUp: "Jak mierzono rezultat, na jakiej próbie i czego nadal nie wiadomo?",
  },
] as const;

const recordingData = z
  .string()
  .max(270_000)
  .regex(
    /^data:audio\/(?:webm|ogg|mp4|wav)(?:;codecs=[a-zA-Z0-9.,-]+)?;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
  )
  .refine((url) => {
    const base64 = url.split(",")[1] ?? "";
    const bytes =
      (base64.length * 3) / 4 - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
    return bytes > 0 && bytes <= MAX_RECORDING_BYTES;
  }, "Nagranie jest puste lub przekracza 200 KB.");

export const recordingSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("demo") }),
  z.object({
    kind: z.literal("local"),
    dataUrl: recordingData,
    durationSeconds: z.number().positive().max(MAX_RECORDING_SECONDS),
    recordedAt: z.iso.datetime().optional(),
  }),
]);
export type Recording = z.infer<typeof recordingSchema>;
export const interviewAnswerSchema = z.object({
  text: z.string().max(12000),
  recording: recordingSchema.optional(),
});
export type InterviewAnswer = z.infer<typeof interviewAnswerSchema>;
const sourceId = z.enum(questionIds);
const reportSchema = z.object({
  simulated: z.literal(true),
  credibilityPercent: z.literal(78),
  summary: z.array(z.object({ source: sourceId, text: z.string().min(1).max(361) })).length(3),
  suggestions: z.array(z.object({ source: sourceId, text: z.string().min(1).max(500) })).length(3),
});
const baseSchema = z.object({
  id: z.uuid(),
  script: z.literal("e01-v1"),
  project: z.string().trim().min(MIN_PROJECT_LENGTH).max(12000),
  answers: z.object({
    contribution: interviewAnswerSchema,
    decision: interviewAnswerSchema,
    result: interviewAnswerSchema,
  }),
});
export const interviewDraftSchema = baseSchema.extend({ status: z.literal("draft") });
export type InterviewDraft = z.infer<typeof interviewDraftSchema>;
export function excerpt(text: string) {
  const value = text.trim();
  return value.length > 360 ? `${value.slice(0, 359).trimEnd()}…` : value;
}
export const approvedInterviewSchema = baseSchema
  .extend({
    status: z.literal("approved"),
    approvedAt: z.iso.datetime(),
    report: reportSchema,
  })
  .superRefine((value, ctx) => {
    questions.forEach((question, index) => {
      const answer = value.answers[question.id];
      if (!answer.text.trim())
        ctx.addIssue({ code: "custom", message: "Uzupełnij wszystkie odpowiedzi i transkrypcje." });
      const summary = value.report.summary[index];
      const suggestion = value.report.suggestions[index];
      if (
        summary?.source !== question.id ||
        summary.text !== excerpt(answer.text) ||
        suggestion?.source !== question.id ||
        suggestion.text !== question.followUp
      )
        ctx.addIssue({
          code: "custom",
          message: "Podsumowanie musi odpowiadać zatwierdzonym źródłom.",
        });
    });
  });
export const preInterviewSchema = z.union([interviewDraftSchema, approvedInterviewSchema]);
export type PreInterview = z.infer<typeof preInterviewSchema>;
export type ApprovedInterview = z.infer<typeof approvedInterviewSchema>;

export function createInterview(project: string): InterviewDraft {
  return interviewDraftSchema.parse({
    id: crypto.randomUUID(),
    script: "e01-v1",
    status: "draft",
    project,
    answers: Object.fromEntries(questionIds.map((id) => [id, { text: "" }])),
  });
}
export function approveInterview(draft: InterviewDraft, approvedAt: string): ApprovedInterview {
  return approvedInterviewSchema.parse({
    ...draft,
    status: "approved",
    approvedAt,
    report: {
      simulated: true,
      credibilityPercent: 78,
      summary: questions.map((q) => ({ source: q.id, text: excerpt(draft.answers[q.id].text) })),
      suggestions: questions.map((q) => ({ source: q.id, text: q.followUp })),
    },
  });
}

export const demoTranscript =
  "Wybrałam pilota na jednym typie zgłoszeń zamiast automatyzacji całej kolejki. Po porównaniu z prostymi regułami zaproponowałam asystenta z zatwierdzaniem odpowiedzi przez konsultanta.";
