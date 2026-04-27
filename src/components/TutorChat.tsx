import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, Square } from "lucide-react";
import { canSpeak, speak, stopSpeaking } from "../lib/textToSpeech";
import type { Lesson, LessonProgress } from "../types/lesson";

export type TutorChatProps = {
  lesson: Lesson;
  progress: LessonProgress;
  voiceRate: number;
  onSendMessage: (message: string) => string;
};

export function TutorChat({ lesson, progress, voiceRate, onSendMessage }: TutorChatProps) {
  const [draft, setDraft] = useState("");
  const [isSpeakingReply, setIsSpeakingReply] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);
  const trimmedDraft = draft.trim();

  const messages = useMemo(
    () =>
      progress.chatMessages.length > 0
        ? progress.chatMessages
        : [
            {
              id: "starter-tutor-message",
              role: "tutor" as const,
              text: `Stay with the lesson and ask me anything about ${lesson.topic}. I will explain, hint, or ask you back like a tutor.`,
              createdAt: new Date().toISOString(),
            },
          ],
    [lesson.topic, progress.chatMessages],
  );

  useEffect(() => {
    setSpeechAvailable(canSpeak());
  }, []);

  useEffect(() => {
    stopSpeaking();
    setIsSpeakingReply(false);
    setDraft("");
  }, [lesson.id]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages.length]);

  function sendMessage(message: string) {
    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return;
    }

    const reply = onSendMessage(cleanMessage);
    setDraft("");

    if (speechAvailable) {
      stopSpeaking();
      setIsSpeakingReply(true);
      speak(reply, {
        rate: voiceRate,
        onEnd: () => setIsSpeakingReply(false),
      });
    }
  }

  return (
    <section className="tutor-chat" aria-labelledby="tutor-chat-title">
      <header className="tutor-chat__header">
        <div>
          <h2 id="tutor-chat-title">AI Tutor</h2>
          <p>Ask while you study. Replies are spoken when your browser supports voice.</p>
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
            placeholder="Ask: why does this work?"
            rows={3}
          />
        </label>

        <div className="tutor-chat__actions">
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
          <button type="submit" className="tutor-chat__send" disabled={!trimmedDraft}>
            <Send size={17} aria-hidden="true" />
            Ask Tutor
          </button>
        </div>
      </form>
    </section>
  );
}

export default TutorChat;
