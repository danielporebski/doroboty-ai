import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_RECORDING_BYTES,
  MAX_RECORDING_SECONDS,
  recordingSchema,
  type Recording,
} from "./model";

export function recordingSource(recording: Recording) {
  return recording.kind === "demo"
    ? `${import.meta.env.BASE_URL}pre-interview/e01-decision-v1.wav`
    : recording.dataUrl;
}
export function AudioAnswer({ recording }: { recording: Recording }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="pre-audio">
      <audio
        controls
        preload="metadata"
        src={recordingSource(recording)}
        aria-label="Odsłuchaj odpowiedź kandydata"
        onError={() => setFailed(true)}
        onLoadedMetadata={() => setFailed(false)}
      />
      {failed && (
        <p className="record-caption" role="status">
          Nie można odtworzyć nagrania w tej przeglądarce. Przeczytaj transkrypcję poniżej.
        </p>
      )}
      {recording.kind === "demo" && (
        <p className="record-caption">Syntetyczne nagranie demonstracyjne.</p>
      )}
    </div>
  );
}

function asDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("Nie udało się odczytać nagrania. Spróbuj ponownie lub wpisz odpowiedź."));
    reader.readAsDataURL(blob);
  });
}

export function VoiceRecorder({
  onRecording,
  onBusy,
}: {
  onRecording: (recording: Recording) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [status, setStatus] = useState<"idle" | "requesting" | "recording" | "processing">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const alive = useRef(true);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const onBusyRef = useRef(onBusy);
  const onRecordingRef = useRef(onRecording);
  useEffect(() => {
    onBusyRef.current = onBusy;
    onRecordingRef.current = onRecording;
  });
  function release() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
      release();
    };
  }, []);

  async function start() {
    if (busy.current) return;
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError(
        "Ta przeglądarka nie obsługuje nagrywania. Wpisz odpowiedź lub użyj przykładu audio.",
      );
      return;
    }
    busy.current = true;
    onBusyRef.current(true);
    setStatus("requesting");
    try {
      const tracks = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) {
        tracks.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = tracks;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find(
        (mime) => MediaRecorder.isTypeSupported(mime),
      );
      const instance = new MediaRecorder(tracks, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 24000,
      });
      recorder.current = instance;
      const chunks: Blob[] = [];
      let size = 0;
      let failed = false;
      const started = Date.now();
      instance.ondataavailable = (event) => {
        size += event.data.size;
        if (size > MAX_RECORDING_BYTES) {
          failed = true;
          if (instance.state !== "inactive") instance.stop();
        } else chunks.push(event.data);
      };
      instance.onerror = () => {
        failed = true;
        if (instance.state !== "inactive") instance.stop();
      };
      instance.onstop = async () => {
        release();
        if (!alive.current) return;
        setStatus("processing");
        try {
          if (failed || !size)
            throw new Error(
              "Nagranie jest puste, przekracza 200 KB lub zostało przerwane. Spróbuj krócej albo wpisz odpowiedź.",
            );
          const blob = new Blob(chunks, { type: instance.mimeType });
          const dataUrl = await asDataUrl(blob);
          const result = recordingSchema.safeParse({
            kind: "local",
            recordedAt: new Date(started).toISOString(),
            dataUrl,
            durationSeconds: Math.min(
              MAX_RECORDING_SECONDS,
              Math.max(0.1, (Date.now() - started) / 1000),
            ),
          });
          if (!result.success)
            throw new Error(
              "Format nagrania nie jest obsługiwany. Wpisz odpowiedź lub użyj przykładu audio.",
            );
          if (alive.current) onRecordingRef.current(result.data);
        } catch (e) {
          if (alive.current) setError((e as Error).message);
        } finally {
          if (alive.current) {
            busy.current = false;
            onBusyRef.current(false);
            setStatus("idle");
          }
        }
      };
      instance.start(250);
      setStatus("recording");
      setSeconds(0);
      timer.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - started) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS && instance.state !== "inactive") instance.stop();
      }, 250);
    } catch {
      release();
      if (alive.current) {
        busy.current = false;
        onBusyRef.current(false);
        setStatus("idle");
        setError(
          "Nie udało się uruchomić mikrofonu. Sprawdź zgodę przeglądarki lub wpisz odpowiedź.",
        );
      }
    }
  }
  return (
    <div className="pre-recorder">
      {status === "recording" ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            recorder.current?.stop();
            setStatus("processing");
          }}
        >
          <Square aria-hidden="true" />
          Zatrzymaj nagrywanie
        </Button>
      ) : (
        <Button type="button" variant="outline" disabled={status !== "idle"} onClick={start}>
          <Mic aria-hidden="true" />
          {status === "requesting"
            ? "Oczekiwanie na mikrofon…"
            : status === "processing"
              ? "Przygotowujemy nagranie…"
              : "Rozpocznij nagrywanie"}
        </Button>
      )}
      <p className="record-caption" role="status">
        {status === "recording" ? `Nagrywanie: ${seconds} s. ` : ""}Nagrywaj wyłącznie własny głos.
        Do 60 sekund i 200 KB. Zapisana pre-rozmowa z nagraniem jest usuwana po 7 dniach przy
        uruchomieniu lub podczas działania aplikacji. Pobrane pliki usuń osobno.
      </p>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
