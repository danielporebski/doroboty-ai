import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  createInterview,
  demoTranscript,
  MIN_PROJECT_LENGTH,
  questions,
  type InterviewDraft,
  type PreInterview,
} from "./model";
import { AudioAnswer, VoiceRecorder } from "./recording";
import { InterviewAnswers } from "./answers";

export function PreInterviewEditor({
  project,
  interview,
  saved,
  disabled,
  onChange,
  onSave,
  onApprove,
  onBusyChange,
}: {
  project: string;
  interview?: PreInterview;
  saved: boolean;
  disabled: boolean;
  onChange: (value: PreInterview) => void;
  onSave: (value: PreInterview) => boolean;
  onApprove: () => boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const [view, setView] = useState<"questions" | "review">("questions");
  const [analyzing, setAnalyzing] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [voice, setVoice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef(false);
  const analysisTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (analysisTimer.current) clearTimeout(analysisTimer.current);
    },
    [],
  );
  useLayoutEffect(() => {
    if (pendingFocus.current) {
      heading.current?.focus();
      pendingFocus.current = false;
    }
  }, [view, questionIndex, interview?.status, analyzing]);
  const mismatch = !!interview && project.trim() !== interview.project;
  const approved = interview?.status === "approved";
  const question = questions[questionIndex];
  const answer = interview?.answers[question.id];
  const complete = interview && questions.every((q) => interview.answers[q.id].text.trim());
  const audioMode = voice || !!answer?.recording;
  const locked = disabled || busy || approved;

  function change(value: InterviewDraft) {
    setConsent(false);
    setMessage("");
    setError("");
    onChange(value);
  }
  function updateAnswer(value: NonNullable<typeof answer>) {
    if (!interview || interview.status !== "draft") return;
    change({ ...interview, answers: { ...interview.answers, [question.id]: value } });
  }
  function analyze() {
    if (analyzing || disabled) return;
    setAnalyzing(true);
    setError("");
    setConsent(false);
    setRestarting(false);
    onBusyChange(true);
    const snapshot = project;
    analysisTimer.current = setTimeout(() => {
      analysisTimer.current = null;
      const next = createInterview(snapshot);
      onChange(next);
      const success = onSave(next);
      setMessage(
        success
          ? "Pytania przygotowane, szkic zapisany."
          : "Pytania przygotowane. Szkic nie został zapisany; spróbuj ponownie.",
      );
      setQuestionIndex(0);
      setVoice(false);
      setView("questions");
      setAnalyzing(false);
      pendingFocus.current = true;
      onBusyChange(false);
    }, 650);
  }
  function review() {
    if (!interview || busy) return;
    if (!saved && !onSave(interview)) {
      setError("Nie zapisano szkicu. Odpowiedzi pozostają w formularzu.");
      return;
    }
    if (!complete) {
      setError("Uzupełnij wszystkie trzy odpowiedzi, w tym transkrypcje nagrań.");
      return;
    }
    setError("");
    setConsent(false);
    pendingFocus.current = true;
    setView("review");
  }
  return (
    <section className="application-form-section pre-interview" aria-label="Opcjonalna pre-rozmowa">
      <p className="pre-eyebrow">Opcjonalna pre-rozmowa</p>
      <h3 ref={heading} tabIndex={-1}>
        {approved
          ? "Pre-rozmowa zatwierdzona"
          : view === "review"
            ? "To Twoje odpowiedzi"
            : interview
              ? "Doprecyzuj swój wkład"
              : "Pokaż swój wkład"}
      </h3>
      {!approved && (
        <p className="application-help">
          Pytania o własne zadania, decyzje i rezultat pomogą rekruterowi zrozumieć Twoją rolę.
          Pytania i raport AI są symulowane.
        </p>
      )}
      {approved ? (
        <>
          <span className="pre-badge">3 odpowiedzi · zatwierdzone</span>
          <p className="application-help">
            Opis projektu i odpowiedzi są zamknięte. Dołączymy je po wysłaniu aplikacji.
          </p>
          <details className="pre-approved-preview">
            <summary>Sprawdź zatwierdzone odpowiedzi</summary>
            <InterviewAnswers interview={interview} expanded />
          </details>
        </>
      ) : analyzing ? (
        <p className="pre-analysis" role="status">
          Analizujemy opis projektu i przygotowujemy pytania… (symulacja)
        </p>
      ) : !interview ? (
        <>
          <div className="pre-actions">
            <Button
              type="button"
              disabled={disabled || project.trim().length < MIN_PROJECT_LENGTH}
              onClick={analyze}
            >
              Doprecyzuj projekt z AI <span aria-hidden="true">→</span>
            </Button>
          </div>
          {project.trim().length < MIN_PROJECT_LENGTH && (
            <p className="application-help">Najpierw dodaj opis projektu — minimum 20 znaków.</p>
          )}
        </>
      ) : (
        <>
          {mismatch && (
            <div className="pre-mismatch" role="alert">
              <p>
                Opis projektu się zmienił. Przygotuj pytania ponownie, aby odpowiedzi dotyczyły
                aktualnej wersji.
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={busy || disabled || project.trim().length < MIN_PROJECT_LENGTH}
                onClick={() => setRestarting(true)}
              >
                Przygotuj pytania ponownie
              </Button>
            </div>
          )}
          {view === "review" ? (
            <>
              <p className="application-help">
                Sprawdź treść i transkrypcje. Zatwierdzenie zamknie również powiązany opis projektu.
              </p>
              <InterviewAnswers interview={interview} expanded />
              <div className="pre-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setConsent(false);
                    pendingFocus.current = true;
                    setView("questions");
                  }}
                >
                  Wróć do edycji odpowiedzi
                </Button>
              </div>
              <label className="application-consent pre-consent">
                <Checkbox
                  id="pre-interview-consent"
                  checked={consent}
                  onCheckedChange={setConsent}
                  disabled={disabled || mismatch}
                />
                <span>
                  Sprawdziłam lub sprawdziłem odpowiedzi i transkrypcje. Zatwierdzam je jako swoją
                  wypowiedź.
                </span>
              </label>
              <div className="pre-actions">
                <Button
                  type="button"
                  disabled={disabled || mismatch || !consent || !saved || !complete}
                  onClick={() => {
                    if (onApprove()) {
                      pendingFocus.current = true;
                      setMessage(
                        "Odpowiedzi zatwierdzone. Wysłanie aplikacji jest osobnym krokiem.",
                      );
                    } else
                      setError("Nie zatwierdzono odpowiedzi. Sprawdź zapis i spróbuj ponownie.");
                  }}
                >
                  Zatwierdź moje odpowiedzi
                </Button>
              </div>
              <p className="application-help">
                To zatwierdza pre-rozmowę. Wysłanie aplikacji jest osobnym krokiem.
              </p>
            </>
          ) : (
            <>
              <div className="pre-question-nav" role="group" aria-label="Pytania o projekt">
                {questions.map((q, index) => (
                  <Button
                    type="button"
                    key={q.id}
                    variant="outline"
                    size="sm"
                    className="pre-question-choice"
                    aria-pressed={index === questionIndex}
                    disabled={locked}
                    onClick={() => {
                      setQuestionIndex(index);
                      setVoice(false);
                      setMessage("");
                      setError("");
                      pendingFocus.current = true;
                    }}
                  >
                    {index + 1}. {q.title}
                  </Button>
                ))}
              </div>
              <p className="pre-eyebrow">Pytanie {questionIndex + 1} z 3</p>
              <p className="pre-question">{question.prompt}</p>
              <div className="pre-answer-modes" role="group" aria-label="Sposób odpowiedzi">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-pressed={!audioMode}
                  disabled={locked || !!answer?.recording}
                  onClick={() => setVoice(false)}
                >
                  Napisz odpowiedź
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-pressed={audioMode}
                  disabled={locked}
                  onClick={() => setVoice(true)}
                >
                  Nagraj odpowiedź
                </Button>
              </div>
              {audioMode && (
                <>
                  <VoiceRecorder
                    key={`${interview.id}-${question.id}`}
                    onBusy={(value) => {
                      setBusy(value);
                      onBusyChange(value);
                    }}
                    onRecording={(recording) => updateAnswer({ text: "", recording })}
                  />
                  {answer?.recording && (
                    <>
                      <AudioAnswer recording={answer.recording} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={locked}
                        onClick={() => {
                          updateAnswer({ text: "" });
                          setMessage("Nagranie i transkrypcja usunięte ze szkicu. Zapisz zmiany.");
                        }}
                      >
                        Usuń nagranie i transkrypcję
                      </Button>
                    </>
                  )}
                  <p className="application-help">
                    Bez AI transkrypcję własnego nagrania wpisujesz samodzielnie. Sprawdź ją przed
                    zatwierdzeniem.
                  </p>
                  {question.id === "decision" && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={locked}
                      onClick={() => {
                        updateAnswer({ text: demoTranscript, recording: { kind: "demo" } });
                        setMessage(
                          "Wstawiono syntetyczne nagranie i zgodną transkrypcję. Zapisz odpowiedź.",
                        );
                      }}
                    >
                      Użyj przykładu audio z transkrypcją
                    </Button>
                  )}
                </>
              )}
              <label className="pre-answer-label" htmlFor="pre-answer">
                {audioMode ? "Transkrypcja do sprawdzenia" : "Twoja odpowiedź"}
              </label>
              <Textarea
                id="pre-answer"
                aria-describedby="pre-answer-help"
                rows={6}
                maxLength={12000}
                value={answer?.text ?? ""}
                disabled={locked}
                onChange={(event) => updateAnswer({ ...answer, text: event.target.value })}
              />
              <p className="application-help" id="pre-answer-help">
                Możesz zmieniać i usuwać odpowiedzi do czasu zatwierdzenia. Zapis jest wykonywany
                przyciskiem.
              </p>
              <div className="pre-actions">
                <Button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    if (onSave(interview))
                      setMessage("Szkic odpowiedzi został zapisany w tej przeglądarce.");
                    else setError("Nie zapisano szkicu. Odpowiedzi pozostają w formularzu.");
                  }}
                >
                  Zapisz odpowiedzi
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={locked || (!answer?.text && !answer?.recording)}
                  onClick={() => {
                    updateAnswer({ text: "" });
                    setVoice(false);
                    setMessage("Odpowiedź usunięta ze szkicu. Zapisz zmiany.");
                  }}
                >
                  Usuń odpowiedź
                </Button>
              </div>
              <p className="application-help">
                Uzupełniono {questions.filter((q) => interview.answers[q.id].text.trim()).length} z
                3 odpowiedzi. {saved ? "Szkic zapisany." : "Są niezapisane zmiany."}
              </p>
              <div className="pre-actions">
                <Button
                  type="button"
                  variant="outline"
                  disabled={locked || mismatch}
                  onClick={review}
                >
                  Sprawdź przed zatwierdzeniem
                </Button>
              </div>
            </>
          )}
        </>
      )}
      {message && (
        <p className="pre-status" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={restarting}
        onOpenChange={setRestarting}
        title="Przygotować nowe pytania?"
        description="Nowa pre-rozmowa zastąpi dotychczasowy szkic odpowiedzi i nagrań. Będzie dotyczyć aktualnego opisu projektu."
        label="Przygotuj nowe pytania"
        onConfirm={analyze}
        pending={analyzing}
      />
    </section>
  );
}
