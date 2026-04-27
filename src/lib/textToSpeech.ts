export type SpeakOptions = {
  rate: number;
  onEnd?: () => void;
};

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeaking() {
  if (canSpeak()) {
    window.speechSynthesis.cancel();
  }
}

export function speak(text: string, options: SpeakOptions) {
  if (!canSpeak()) {
    options.onEnd?.();
    return;
  }

  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate;
  utterance.pitch = 1.05;
  utterance.onend = () => options.onEnd?.();
  window.speechSynthesis.speak(utterance);
}

