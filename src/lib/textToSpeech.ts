export type SpeakOptions = {
  rate: number;
  onEnd?: () => void;
};

const FRIENDLY_VOICE_HINTS = [
  "aria",
  "jenny",
  "sara",
  "zira",
  "natasha",
  "sonia",
  "female",
  "natural",
  "online",
];

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function warmUpSpeechVoices() {
  if (!canSpeak()) {
    return;
  }

  window.speechSynthesis.getVoices();
}

export function stopSpeaking() {
  if (canSpeak()) {
    window.speechSynthesis.cancel();
  }
}

function clamp(value: number, min: number, max: number) {
  const finiteValue = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, finiteValue));
}

function getFriendlyVoice() {
  if (!canSpeak()) {
    return undefined;
  }

  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));

  return (
    englishVoices.find((voice) =>
      FRIENDLY_VOICE_HINTS.some((hint) => voice.name.toLowerCase().includes(hint)),
    ) ??
    englishVoices.find((voice) => voice.default) ??
    englishVoices[0] ??
    voices[0]
  );
}

export function speak(text: string, options: SpeakOptions) {
  if (!canSpeak()) {
    options.onEnd?.();
    return;
  }

  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getFriendlyVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  utterance.rate = clamp(options.rate, 0.78, 0.94);
  utterance.pitch = 1.16;
  utterance.volume = 0.92;
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => options.onEnd?.();
  window.speechSynthesis.speak(utterance);
}
