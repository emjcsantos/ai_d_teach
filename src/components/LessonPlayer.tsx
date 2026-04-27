import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Sparkles, Square } from "lucide-react";
import { canSpeak, speak, stopSpeaking } from "../lib/textToSpeech";
import type { Lesson, LessonProgress } from "../types/lesson";
import { LessonCanvas } from "./LessonCanvas";
import { TutorChat } from "./TutorChat";

export type LessonPlayerProps = {
  lesson: Lesson;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  progress: LessonProgress;
  onSendMessage: (message: string) => string;
  voiceRate: number;
};

const MIN_RATE = 0.7;
const MAX_RATE = 1.3;

function clamp(value: number, min: number, max: number) {
  const finiteValue = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, finiteValue));
}

function getSafeStepIndex(stepCount: number, currentStepIndex: number) {
  if (stepCount === 0) {
    return 0;
  }

  const normalizedIndex = Number.isFinite(currentStepIndex) ? Math.trunc(currentStepIndex) : 0;
  return clamp(normalizedIndex, 0, stepCount - 1);
}

export function LessonPlayer({
  lesson,
  currentStepIndex,
  onStepChange,
  progress,
  onSendMessage,
  voiceRate,
}: LessonPlayerProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const stepCount = lesson.steps.length;
  const safeStepIndex = getSafeStepIndex(stepCount, currentStepIndex);
  const currentStep = lesson.steps[safeStepIndex];
  const rate = useMemo(() => clamp(voiceRate, MIN_RATE, MAX_RATE), [voiceRate]);
  const progressPercent = stepCount > 0 ? Math.round(((safeStepIndex + 1) / stepCount) * 100) : 0;

  useEffect(() => {
    setSpeechAvailable(canSpeak());
  }, []);

  useEffect(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, [currentStep?.id]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  function moveToStep(index: number) {
    if (stepCount === 0) {
      return;
    }

    stopSpeaking();
    setIsSpeaking(false);
    onStepChange(getSafeStepIndex(stepCount, index));
  }

  function playNarration() {
    if (!currentStep) {
      return;
    }

    setIsSpeaking(true);
    speak(currentStep.narration, {
      rate,
      onEnd: () => setIsSpeaking(false),
    });
  }

  function stopNarration() {
    stopSpeaking();
    setIsSpeaking(false);
  }

  function toggleNarration() {
    if (isSpeaking) {
      stopNarration();
      return;
    }

    playNarration();
  }

  if (!currentStep) {
    return (
      <section className="lesson-player lesson-player--empty" aria-labelledby="lesson-player-empty-title">
        <h2 id="lesson-player-empty-title">{lesson.topic}</h2>
        <p>This lesson does not have any steps yet.</p>
      </section>
    );
  }

  const hasPrevious = safeStepIndex > 0;
  const hasNext = safeStepIndex < stepCount - 1;

  return (
    <section className="lesson-player" aria-label={`${lesson.topic} lesson player`}>
      <header className="lesson-hero">
        <div className="lesson-hero__copy">
          <span className="lesson-hero__eyebrow">Grade {lesson.gradeLevel} learning mission</span>
          <h1>{lesson.topic}</h1>
          <p>{lesson.summary}</p>
        </div>
        <div className="lesson-hero__badge" aria-live="polite">
          <Sparkles size={22} aria-hidden="true" />
          <strong>{progressPercent}%</strong>
          <span>mission</span>
        </div>
      </header>

      <ol className="mission-path" aria-label="Lesson steps">
        {lesson.steps.map((step, index) => {
          const selected = index === safeStepIndex;
          const completed = index < safeStepIndex;

          return (
            <li
              key={step.id}
              aria-current={selected ? "step" : undefined}
              className={[
                "mission-path__step",
                selected ? "is-active" : "",
                completed ? "is-complete" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span>{index + 1}</span>
              <strong>{step.title}</strong>
            </li>
          );
        })}
      </ol>

      <div className="learning-arena">
        <LessonCanvas step={currentStep} />

        <aside className="lesson-coach" aria-label="Narration and prompt controls">
          <section className="coach-card coach-card--tutor" aria-labelledby="coach-title">
            <div className="coach-card__avatar" aria-hidden="true">
              <Sparkles size={23} />
            </div>
            <div>
              <h2 id="coach-title">Tutor says</h2>
              <p>{currentStep.narration}</p>
            </div>
            <button
              type="button"
              onClick={toggleNarration}
              disabled={!speechAvailable}
              className="coach-button coach-button--primary"
              title={speechAvailable ? "Read this step aloud" : "Browser speech is unavailable"}
            >
              {isSpeaking ? <Square size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
              <span>{isSpeaking ? "Stop voice" : "Read aloud"}</span>
            </button>
          </section>

          {currentStep.prompt ? (
            <section className="coach-card coach-card--mission" aria-labelledby="prompt-title">
              <h2 id="prompt-title">Try this</h2>
              <p>{currentStep.prompt}</p>
            </section>
          ) : null}

          <TutorChat
            lesson={lesson}
            progress={progress}
            voiceRate={rate}
            onSendMessage={onSendMessage}
          />

          <div className="lesson-nav-actions">
            <button
              type="button"
              onClick={() => moveToStep(safeStepIndex - 1)}
              disabled={!hasPrevious}
              className="coach-button"
              title="Previous step"
            >
              <ChevronLeft size={18} aria-hidden="true" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => moveToStep(safeStepIndex + 1)}
              disabled={!hasNext}
              className="coach-button coach-button--primary"
              title="Next step"
            >
              <span>Next</span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default LessonPlayer;
