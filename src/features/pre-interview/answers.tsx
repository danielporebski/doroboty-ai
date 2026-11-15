import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { questions, type ApprovedInterview, type PreInterview, type QuestionId } from "./model";
import { AudioAnswer } from "./recording";

const sourceId = (id: QuestionId) => `pre-source-${id}`;
export function SourceLink({ source, children }: { source: QuestionId; children?: string }) {
  const location = useLocation();
  return (
    <Link
      className="pre-source-link"
      to={{ pathname: location.pathname, search: location.search, hash: `#${sourceId(source)}` }}
    >
      {children ?? `Źródło: ${questions.find((q) => q.id === source)!.title}`}{" "}
      <span aria-hidden="true">↗</span>
    </Link>
  );
}

export function InterviewAnswers({
  interview,
  expanded = false,
}: {
  interview: PreInterview;
  expanded?: boolean;
}) {
  const { hash, key } = useLocation();
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const question = questions.find((q) => `#${sourceId(q.id)}` === hash);
    if (!question) return;
    const frame = requestAnimationFrame(() => {
      const detail = container.current?.querySelector<HTMLDetailsElement>(
        `#${sourceId(question.id)}`,
      );
      if (!detail) return;
      detail.open = true;
      detail.querySelector("summary")?.focus({ preventScroll: true });
      detail.scrollIntoView({ behavior: "instant", block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, key]);
  return (
    <div ref={container} className="pre-sources">
      {questions.map((question, index) => {
        const answer = interview.answers[question.id];
        return (
          <details
            className="pre-source"
            id={sourceId(question.id)}
            key={question.id}
            open={expanded || hash === `#${sourceId(question.id)}`}
          >
            <summary>
              {index + 1}. {question.prompt}
            </summary>
            {answer.recording && (
              <>
                <AudioAnswer recording={answer.recording} />
                <p className="record-caption">
                  {interview.status === "approved"
                    ? "Transkrypcja zatwierdzona przez kandydata"
                    : "Transkrypcja do sprawdzenia"}
                </p>
              </>
            )}
            <p className="pre-answer-text">{answer.text || "Brak odpowiedzi."}</p>
          </details>
        );
      })}
    </div>
  );
}

export function InterviewReport({ interview }: { interview: ApprovedInterview }) {
  return (
    <div className="pre-report">
      <h3>
        Podsumowanie AI <span className="pre-simulation">Symulacja</span>
      </h3>
      <p className="record-caption">
        Skróty zatwierdzonych wypowiedzi. Ten prototyp nie uruchamia modelu AI.
      </p>
      {interview.report.summary.map((part, index) => (
        <section className="pre-summary-part" key={part.source} aria-label={questions[index].title}>
          <p className="pre-summary-label">{questions[index].title}</p>
          <p className="pre-answer-text">{part.text}</p>
          <SourceLink source={part.source} />
        </section>
      ))}
      <section className="pre-report-section">
        <h3>Odpowiedzi źródłowe</h3>
        <p className="record-caption">Pełne treści i nagrania zatwierdzone przez kandydata.</p>
        <InterviewAnswers interview={interview} />
      </section>
      <section className="pre-report-section">
        <h3>
          Pytania na rozmowę <span className="pre-simulation">Scenariusz AI</span>
        </h3>
        <ol className="pre-suggestions">
          {interview.report.suggestions.map((item) => (
            <li key={item.source}>
              <p>{item.text}</p>
              <SourceLink source={item.source}>Sprawdź odpowiedź kandydata</SourceLink>
            </li>
          ))}
        </ol>
      </section>
      <section className="pre-report-section" aria-labelledby="pre-credibility-title">
        <div className="pre-credibility">
          <h3 id="pre-credibility-title">Ocena wiarygodności AI</h3>
          <span className="pre-percentage">{interview.report.credibilityPercent}%</span>
        </div>
        <p className="pre-simulation">Wynik przykładowy · symulacja</p>
        <p className="record-caption">
          Stała wartość scenariusza, niewyliczana z odpowiedzi. Nie potwierdza prawdziwości
          deklaracji ani kompetencji.
        </p>
        <p>
          Sprawdź własne zadania, podział pracy, uzasadnienie decyzji i sposób pomiaru rezultatu w
          odpowiedziach źródłowych.
        </p>
        <SourceLink source="result">Przejdź do odpowiedzi o rezultacie</SourceLink>
      </section>
    </div>
  );
}
