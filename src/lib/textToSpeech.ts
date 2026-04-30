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

const SPEECH_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\b1\/4\b/g, "one fourth"],
  [/\b2\/4\b/g, "two fourths"],
  [/\b3\/4\b/g, "three fourths"],
  [/\b4\/4\b/g, "four fourths"],
  [/\b1\/2\b/g, "one half"],
  [/=/g, " equals "],
  [/\+/g, " plus "],
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

export function prepareSpeechText(text: string) {
  return SPEECH_REPLACEMENTS.reduce(
    (preparedText, [pattern, replacement]) => preparedText.replace(pattern, replacement),
    text,
  )
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoSpeechChunks(text: string) {
  const preparedText = prepareSpeechText(text);
  const chunks = preparedText.match(/[^.!?]+[.!?]?/g)?.map((chunk) => chunk.trim()).filter(Boolean);

  if (!chunks?.length) {
    return preparedText ? [preparedText] : [];
  }

  return chunks;
}

function createUtterance(text: string, options: SpeakOptions) {
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getFriendlyVoice();

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }

  utterance.rate = clamp(options.rate, 0.8, 0.92);
  utterance.pitch = 1.08;
  utterance.volume = 0.9;

  return utterance;
}

export function speak(text: string, options: SpeakOptions) {
  if (!canSpeak()) {
    options.onEnd?.();
    return;
  }

  stopSpeaking();
  const chunks = splitIntoSpeechChunks(text);

  if (chunks.length === 0) {
    options.onEnd?.();
    return;
  }

  let finished = false;
  const finish = () => {
    if (!finished) {
      finished = true;
      options.onEnd?.();
    }
  };

  chunks.forEach((chunk, index) => {
    const utterance = createUtterance(chunk, options);

    if (index === chunks.length - 1) {
      utterance.onend = finish;
    }

    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  });
}
