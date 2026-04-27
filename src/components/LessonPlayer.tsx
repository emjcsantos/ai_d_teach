import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Sparkles, Square, Volume2 } from "lucide-react";
import { canSpeak, speak, stopSpeaking } from "../lib/textToSpeech";
import type { Lesson } from "../types/lesson";
import { LessonCanvas } from "./LessonCanvas";

export type LessonPlayerProps = {
  lesson: Lesson;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  voiceRate: number;
  onVoiceRateChange: (rate: number) => void;
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
  voiceRate,
  onVoiceRateChange,
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

  function handleRateChange(nextRate: number) {
    onVoiceRateChange(clamp(nextRate, MIN_RATE, MAX_RATE));
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

      <nav className="mission-path" aria-label="Lesson steps">
        {lesson.steps.map((step, index) => {
          const selected = index === safeStepIndex;
          const completed = index < safeStepIndex;

          return (
            <button
              key={step.id}
              type="button"
              aria-current={selected ? "step" : undefined}
              className={[
                "mission-path__step",
                selected ? "is-active" : "",
                completed ? "is-complete" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => moveToStep(index)}
            >
              <span>{index + 1}</span>
              <strong>{step.title}</strong>
            </button>
          );
        })}
      </nav>

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
          </section>

          <section className="coach-card coach-card--voice" aria-label="Narration controls">
            <div className="coach-card__heading">
              <Volume2 size={19} aria-hidden="true" />
              <h2>Voice</h2>
            </div>
            <div className="voice-actions">
              <button
                type="button"
                onClick={playNarration}
                disabled={!speechAvailable}
                className="coach-button coach-button--primary"
                title={speechAvailable ? "Play narration" : "Browser speech is unavailable"}
              >
                <Play size={18} aria-hidden="true" />
                <span>{isSpeaking ? "Replay" : "Play"}</span>
              </button>
              <button
                type="button"
                onClick={stopNarration}
                disabled={!isSpeaking}
                className="coach-button"
                title="Stop narration"
              >
                <Square size={18} aria-hidden="true" />
                <span>Stop</span>
              </button>
            </div>
            <label className="voice-rate">
              <span>Speed</span>
              <strong>{rate.toFixed(2)}x</strong>
              <input
                type="range"
                min={MIN_RATE}
                max={MAX_RATE}
                step={0.05}
                value={rate}
                onChange={(event) => handleRateChange(Number(event.currentTarget.value))}
              />
            </label>
            {!speechAvailable ? (
              <p className="coach-note">Browser narration is unavailable in this environment.</p>
            ) : null}
          </section>

          {currentStep.prompt ? (
            <section className="coach-card coach-card--mission" aria-labelledby="prompt-title">
              <h2 id="prompt-title">Try this</h2>
              <p>{currentStep.prompt}</p>
            </section>
          ) : null}

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
