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
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = lang;
  recognition.maxAlternatives = 1;
  recognition.onend = onEnd;
  recognition.onerror = (event) => {
    onError(event.message || event.error || "Speech recognition stopped.");
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
