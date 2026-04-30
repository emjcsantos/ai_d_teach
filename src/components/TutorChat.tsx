import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Mic, Send, Square } from "lucide-react";
import {
  canListen,
  createSpeechListener,
  type SpeechListener,
} from "../lib/speechToText";
import { canSpeak, speak, stopSpeaking, warmUpSpeechVoices } from "../lib/textToSpeech";
import type { Lesson, LessonProgress, TutorTurn } from "../types/lesson";

export type TutorChatProps = {
  lesson: Lesson;
  progress: LessonProgress;
  voiceRate: number;
  onSendMessage: (message: string) => Promise<TutorTurn>;
};

export function TutorChat({ lesson, progress, voiceRate, onSendMessage }: TutorChatProps) {
  const [draft, setDraft] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isWaitingForTutor, setIsWaitingForTutor] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingReply, setIsSpeakingReply] = useState(false);
  const [speechInputAvailable, setSpeechInputAvailable] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const logRef = useRef<HTMLDivElement | null>(null);
  const listenerRef = useRef<SpeechListener | null>(null);
  const finalTranscriptHandledRef = useRef(false);
  const trimmedDraft = draft.trim();

  const messages = useMemo(
    () =>
      progress.chatMessages.length > 0
        ? progress.chatMessages
        : [
            {
              id: "starter-tutor-message",
              role: "tutor" as const,
              text: `Hi, I'm here with you. Talk to me while we learn ${lesson.topic}, and I'll help one small step at a time.`,
              createdAt: new Date().toISOString(),
            },
          ],
    [lesson.topic, progress.chatMessages],
  );

  useEffect(() => {
    setSpeechInputAvailable(canListen());
    setSpeechAvailable(canSpeak());
    warmUpSpeechVoices();
  }, []);

  useEffect(() => {
    stopSpeaking();
    listenerRef.current?.abort();
    listenerRef.current = null;
    setIsListening(false);
    setIsSpeakingReply(false);
    setDraft("");
    setInterimTranscript("");
    setVoiceError("");
  }, [lesson.id]);

  useEffect(() => {
    return () => {
      listenerRef.current?.abort();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [isWaitingForTutor, messages.length]);

  async function sendMessage(message: string) {
    const cleanMessage = message.trim();

    if (!cleanMessage || isWaitingForTutor) {
      return;
    }

    setIsWaitingForTutor(true);
    setDraft("");

    try {
      const tutorTurn = await onSendMessage(cleanMessage);

      if (speechAvailable) {
        stopSpeaking();
        setIsSpeakingReply(true);
        speak(tutorTurn.reply, {
          rate: voiceRate,
          onEnd: () => setIsSpeakingReply(false),
        });
      }
    } finally {
      setIsWaitingForTutor(false);
    }
  }

  function startVoiceInput() {
    if (!speechInputAvailable) {
      setVoiceError("Speech input is unavailable in this browser. Type your question instead.");
      return;
    }

    stopSpeaking();
    setIsSpeakingReply(false);
    setVoiceError("");
    setDraft("");
    setInterimTranscript("");
    finalTranscriptHandledRef.current = false;

    const listener = createSpeechListener({
      onEnd: () => {
        listenerRef.current = null;
        setIsListening(false);
        setInterimTranscript("");
      },
      onError: (message) => {
        listenerRef.current = null;
        setIsListening(false);
        setInterimTranscript("");
        setVoiceError(message);
      },
      onFinalTranscript: (transcript) => {
        if (finalTranscriptHandledRef.current) {
          return;
        }

        finalTranscriptHandledRef.current = true;
        listenerRef.current?.stop();
        listenerRef.current = null;
        setIsListening(false);
        setDraft("");
        setInterimTranscript("");
        void sendMessage(transcript);
      },
      onInterimTranscript: setInterimTranscript,
    });

    if (!listener) {
      setVoiceError("Speech input is unavailable in this browser. Type your question instead.");
      return;
    }

    listenerRef.current = listener;
    setIsListening(true);

    try {
      listener.start();
    } catch {
      listenerRef.current = null;
      setIsListening(false);
      setVoiceError("Speech input could not start. Type your question instead.");
    }
  }

  function stopVoiceInput() {
    listenerRef.current?.stop();
    listenerRef.current = null;
    setIsListening(false);
    setInterimTranscript("");
  }

  return (
    <section className="tutor-chat" aria-labelledby="tutor-chat-title">
      <header className="tutor-chat__header">
        <div>
          <h2 id="tutor-chat-title">AI Tutor</h2>
          <p>Talk to me while you learn. I can answer, cheer you on, and help when you get stuck.</p>
        </div>
        <Bot size={22} aria-hidden="true" />
      </header>

      <div className="tutor-chat__log" ref={logRef} aria-live="polite">
        {messages.map((message) => (
          <article
            key={message.id}
            className={
              message.role === "student"
                ? "tutor-chat__message is-student"
                : "tutor-chat__message is-tutor"
            }
          >
            <span>{message.role === "student" ? "You" : "Tutor"}</span>
            <p>{message.text}</p>
          </article>
        ))}
        {isWaitingForTutor ? (
          <article className="tutor-chat__message is-tutor is-thinking" aria-label="Tutor is thinking">
            <span>Tutor</span>
            <p>Let me think for a second</p>
          </article>
        ) : null}
      </div>

      <form
        className="tutor-chat__composer"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(trimmedDraft);
        }}
      >
        <label>
          <span>Talk to the tutor</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isListening ? "I'm listening..." : "Say hi, ask for help, or tell me what you notice"}
            disabled={isWaitingForTutor}
            rows={3}
          />
        </label>

        {isListening || interimTranscript || voiceError || isWaitingForTutor ? (
          <p
            className={[
              "tutor-chat__speech-status",
              voiceError ? "is-error" : "",
              isListening ? "is-listening" : "",
              isWaitingForTutor ? "is-thinking" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {voiceError ||
              interimTranscript ||
              (isListening ? "I'm listening. Say one thought." : "I'm getting your answer ready.")}
          </p>
        ) : null}

        <div className="tutor-chat__actions">
          <button
            type="button"
            className={isListening ? "tutor-chat__listen is-listening" : "tutor-chat__listen"}
            disabled={!speechInputAvailable || isWaitingForTutor}
            onClick={isListening ? stopVoiceInput : startVoiceInput}
            title={
              speechInputAvailable
                ? "Start or stop push-to-talk voice input"
                : "Speech input is unavailable in this browser"
            }
          >
            {isListening ? <Square size={16} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
            {isListening ? "Stop listening" : "Talk"}
          </button>
          {isSpeakingReply ? (
            <button
              type="button"
              className="tutor-chat__stop"
              onClick={() => {
                stopSpeaking();
                setIsSpeakingReply(false);
              }}
            >
              <Square size={16} aria-hidden="true" />
              Stop voice
            </button>
          ) : null}
          <button type="submit" className="tutor-chat__send" disabled={!trimmedDraft || isWaitingForTutor}>
            <Send size={17} aria-hidden="true" />
            {isWaitingForTutor ? "Thinking" : "Ask Tutor"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default TutorChat;
