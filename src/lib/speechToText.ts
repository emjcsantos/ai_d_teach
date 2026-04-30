type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0?: {
    transcript?: string;
  };
};

type SpeechRecognitionEventLike = Event & {
  resultIndex?: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = Event & {
  error?: string;
  message?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export type SpeechListener = {
  abort: () => void;
  start: () => void;
  stop: () => void;
};

export type SpeechListenerOptions = {
  lang?: string;
  onEnd: () => void;
  onError: (message: string) => void;
  onFinalTranscript: (transcript: string) => void;
  onInterimTranscript: (transcript: string) => void;
};

function getSpeechErrorMessage(error?: string, message?: string) {
  switch (error) {
    case "network":
      return "Voice input could not reach the browser speech service. Type your question instead, or try Talk again in Chrome or Edge with internet access.";
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access is blocked. Allow microphone permission for this site, then try Talk again.";
    case "no-speech":
      return "I did not hear anything. Try Talk again, or type your question.";
    case "audio-capture":
      return "No microphone was found. Check your microphone, or type your question.";
    case "aborted":
      return "Voice input stopped. You can try Talk again or type your question.";
    default:
      return message || error || "Speech recognition stopped. Type your question instead.";
  }
}

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const speechWindow = window as Window &
    typeof globalThis & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

export function canListen() {
  return Boolean(getSpeechRecognitionConstructor());
}

export function createSpeechListener({
  lang = "en-US",
  onEnd,
  onError,
  onFinalTranscript,
  onInterimTranscript,
}: SpeechListenerOptions): SpeechListener | undefined {
  const SpeechRecognition = getSpeechRecognitionConstructor();

  if (!SpeechRecognition) {
    return undefined;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;
  recognition.maxAlternatives = 1;
  recognition.onend = onEnd;
  recognition.onerror = (event) => {
    onError(getSpeechErrorMessage(event.error, event.message));
  };
  recognition.onresult = (event) => {
    let finalTranscript = "";
    let interimTranscript = "";
    const startIndex = event.resultIndex ?? 0;

    for (let index = startIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result?.[0]?.transcript?.trim();

      if (!transcript) {
        continue;
      }

      if (result.isFinal) {
        finalTranscript = `${finalTranscript} ${transcript}`.trim();
      } else {
        interimTranscript = `${interimTranscript} ${transcript}`.trim();
      }
    }

    if (interimTranscript) {
      onInterimTranscript(interimTranscript);
    }

    if (finalTranscript) {
      onFinalTranscript(finalTranscript);
    }
  };

  return {
    abort: () => recognition.abort(),
    start: () => recognition.start(),
    stop: () => recognition.stop(),
  };
}
