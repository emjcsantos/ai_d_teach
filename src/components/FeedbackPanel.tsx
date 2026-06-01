import { useState } from "react";
import { Lightbulb, MessageSquarePlus } from "lucide-react";
import type { Lesson, LessonProgress } from "../types/lesson";

export type FeedbackKind = "teacher" | "student" | "improvement";

export type FeedbackPanelProps = {
  lesson: Lesson;
  progress: LessonProgress;
  onAddNote: (kind: FeedbackKind, note: string) => void;
};

const feedbackOptions: Array<{ value: FeedbackKind; label: string; helper: string }> = [
  {
    value: "teacher",
    label: "Teacher",
    helper: "Clarity, accuracy, scaffolding, quiz quality.",
  },
  {
    value: "student",
    label: "Student",
    helper: "Fun, confusion, controls, voice, visuals.",
  },
  {
    value: "improvement",
    label: "Improve",
    helper: "Changes for the next lesson version.",
  },
];

function getNotes(progress: LessonProgress, kind: FeedbackKind) {
  switch (kind) {
    case "teacher":
      return progress.teacherNotes;
    case "student":
      return progress.studentNotes;
    case "improvement":
      return progress.improvementNotes;
  }
}

export function FeedbackPanel({ lesson, progress, onAddNote }: FeedbackPanelProps) {
  const [kind, setKind] = useState<FeedbackKind>("teacher");
  const [note, setNote] = useState("");
  const trimmedNote = note.trim();
  const currentOption = feedbackOptions.find((option) => option.value === kind);

  function submitNote() {
    if (!trimmedNote) {
      return;
    }

    onAddNote(kind, trimmedNote);
    setNote("");
  }

  return (
    <section className="feedback-panel" aria-labelledby="feedback-panel-title">
      <header className="feedback-panel__header">
        <div>
          <h2 id="feedback-panel-title">Feedback Lab</h2>
          <p>{lesson.topic} v{lesson.version}</p>
        </div>
        <Lightbulb size={20} aria-hidden="true" />
      </header>

      <div className="feedback-panel__tabs" role="tablist" aria-label="Feedback type">
        {feedbackOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={kind === option.value}
            className={kind === option.value ? "feedback-panel__tab is-active" : "feedback-panel__tab"}
            onClick={() => setKind(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="feedback-panel__helper">{currentOption?.helper}</p>

      <label className="feedback-panel__field">
        <span>Add note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What should the next version learn from this session?"
          rows={4}
        />
      </label>

      <button
        type="button"
        className="feedback-panel__submit"
        disabled={!trimmedNote}
        onClick={submitNote}
      >
        <MessageSquarePlus size={17} aria-hidden="true" />
        Add Feedback
      </button>

      <div className="feedback-panel__notes" aria-live="polite">
        {feedbackOptions.map((option) => {
          const notes = getNotes(progress, option.value);

          return (
            <section key={option.value} className="feedback-panel__note-group">
              <h3>
                {option.label} Notes <span>{notes.length}</span>
              </h3>
              {notes.length > 0 ? (
                <ul>
                  {notes.map((savedNote, index) => (
                    <li key={`${option.value}-${index}`}>{savedNote}</li>
                  ))}
                </ul>
              ) : (
                <p>No notes yet.</p>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}

export default FeedbackPanel;

