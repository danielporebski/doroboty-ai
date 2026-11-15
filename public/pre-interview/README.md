# E01 synthetic voice example

`e01-decision-v1.wav` is synthetic Polish speech generated locally with the macOS Zosia voice, at 165 words/minute, and converted to mono 16 kHz / 16-bit PCM using the system audio converter. It is a prepared example, not a recording of a candidate or a real model response. No network service is used at runtime.

The matching text is `demoTranscript` in `src/features/pre-interview/model.ts`. Preserve that exact pairing when changing the asset. The editor always replaces both the recording and transcript together after an explicit user action. Candidate edits remain explicit approved transcript text; the interface identifies the audio as synthetic.

Original transcript:

> Wybrałam pilota na jednym typie zgłoszeń zamiast automatyzacji całej kolejki. Po porównaniu z prostymi regułami zaproponowałam asystenta z zatwierdzaniem odpowiedzi przez konsultanta.
