import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, Volume2, VolumeX } from "lucide-react";
import { canSpeak, speak, stopSpeaking } from "../lib/textToSpeech";
import type { Lesson, LessonProgress } from "../types/lesson";

export type TutorChatProps = {
  lesson: Lesson;
  progress: LessonProgress;
  voiceRate: number;
  onSendMessage: (message: string) => string;
};

const quickPrompts = ["Explain this step", "Give me a hint", "Ask me a question"];

export function TutorChat({ lesson, progress, voiceRate, onSendMessage }: TutorChatProps) {
  const [draft, setDraft] = useState("");
  const [speakReplies, setSpeakReplies] = useState(false);
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
              text: `Ask me anything about ${lesson.topic}. I can explain the step, give a hint, or ask you a practice question.`,
              createdAt: new Date().toISOString(),
            },
          ],
    [lesson.topic, progress.chatMessages],
  );

  useEffect(() => {
    setSpeechAvailable(canSpeak());
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

    if (speakReplies && speechAvailable) {
      speak(reply, { rate: voiceRate });
    }
  }

  return (
    <section className="tutor-chat" aria-labelledby="tutor-chat-title">
      <header className="tutor-chat__header">
        <div>
          <h2 id="tutor-chat-title">Tutor Chat</h2>
          <p>Converse with the current lesson.</p>
        </div>
        <Bot size={22} aria-hidden="true" />
      </header>

      <div className="tutor-chat__quick-prompts" aria-label="Quick chat prompts">
        {quickPrompts.map((prompt) => (
          <button key={prompt} type="button" onClick={() => sendMessage(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

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
          <span>Message</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask: why does this work?"
            rows={3}
          />
        </label>

        <div className="tutor-chat__actions">
          <button
            type="button"
            className="tutor-chat__voice-toggle"
            aria-pressed={speakReplies}
            disabled={!speechAvailable}
            onClick={() => {
              stopSpeaking();
              setSpeakReplies((current) => !current);
            }}
            title={speechAvailable ? "Toggle spoken tutor replies" : "Browser speech unavailable"}
          >
            {speakReplies ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
            Voice
          </button>
          <button type="submit" className="tutor-chat__send" disabled={!trimmedDraft}>
            <Send size={17} aria-hidden="true" />
            Send
          </button>
        </div>
      </form>
    </section>
  );
}

export default TutorChat;

