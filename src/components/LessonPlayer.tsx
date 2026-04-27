import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Play, Square, Volume2 } from "lucide-react";
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
      <section style={playerStyles.shell} aria-labelledby="lesson-player-empty-title">
        <h2 id="lesson-player-empty-title" style={playerStyles.emptyTitle}>
          {lesson.topic}
        </h2>
        <p style={playerStyles.emptyText}>This lesson does not have any steps yet.</p>
      </section>
    );
  }

  const hasPrevious = safeStepIndex > 0;
  const hasNext = safeStepIndex < stepCount - 1;

  return (
    <section style={playerStyles.shell} aria-label={`${lesson.topic} lesson player`}>
      <header style={playerStyles.header}>
        <div style={playerStyles.lessonMeta}>
          <span style={playerStyles.eyebrow}>Grade {lesson.gradeLevel}</span>
          <h1 style={playerStyles.lessonTitle}>{lesson.topic}</h1>
          <p style={playerStyles.summary}>{lesson.summary}</p>
        </div>
        <div style={playerStyles.stepCounter} aria-live="polite">
          Step {safeStepIndex + 1} of {stepCount}
        </div>
      </header>

      <nav style={playerStyles.stepNav} aria-label="Lesson steps">
        {lesson.steps.map((step, index) => {
          const selected = index === safeStepIndex;
          return (
            <button
              key={step.id}
              type="button"
              aria-current={selected ? "step" : undefined}
              onClick={() => moveToStep(index)}
              style={{
                ...playerStyles.stepButton,
                ...(selected ? playerStyles.stepButtonActive : {}),
              }}
            >
              <span style={playerStyles.stepNumber}>{index + 1}</span>
              <span style={playerStyles.stepLabel}>{step.title}</span>
            </button>
          );
        })}
      </nav>

      <div style={playerStyles.stage}>
        <LessonCanvas step={currentStep} />

        <aside style={playerStyles.sidePanel} aria-label="Narration and prompt controls">
          <section style={playerStyles.panelSection} aria-labelledby="narration-title">
            <div style={playerStyles.panelHeading}>
              <Volume2 size={20} aria-hidden="true" />
              <h2 id="narration-title" style={playerStyles.panelTitle}>
                Narration
              </h2>
            </div>

            <p style={playerStyles.narrationText}>{currentStep.narration}</p>

            <div style={playerStyles.controls} aria-label="Narration controls">
              <button
                type="button"
                onClick={playNarration}
                disabled={!speechAvailable}
                style={{
                  ...playerStyles.controlButton,
                  ...playerStyles.primaryButton,
                  ...(!speechAvailable ? playerStyles.disabledButton : {}),
                }}
                title={speechAvailable ? "Play narration" : "Browser speech is unavailable"}
              >
                <Play size={18} aria-hidden="true" />
                <span>{isSpeaking ? "Replay" : "Play"}</span>
              </button>
              <button
                type="button"
                onClick={stopNarration}
                disabled={!isSpeaking}
                style={{
                  ...playerStyles.controlButton,
                  ...(!isSpeaking ? playerStyles.disabledButton : {}),
                }}
                title="Stop narration"
              >
                <Square size={18} aria-hidden="true" />
                <span>Stop</span>
              </button>
            </div>

            <label style={playerStyles.rateControl}>
              <span>Voice speed</span>
              <span style={playerStyles.rateValue}>{rate.toFixed(2)}x</span>
              <input
                type="range"
                min={MIN_RATE}
                max={MAX_RATE}
                step={0.05}
                value={rate}
                onChange={(event) => handleRateChange(Number(event.currentTarget.value))}
                style={playerStyles.rateSlider}
              />
            </label>

            {!speechAvailable ? (
              <p style={playerStyles.supportNote}>Browser narration is unavailable in this environment.</p>
            ) : null}
          </section>

          {currentStep.prompt ? (
            <section style={playerStyles.promptBox} aria-labelledby="prompt-title">
              <h2 id="prompt-title" style={playerStyles.promptTitle}>
                Prompt
              </h2>
              <p style={playerStyles.promptText}>{currentStep.prompt}</p>
            </section>
          ) : null}

          <div style={playerStyles.navControls}>
            <button
              type="button"
              onClick={() => moveToStep(safeStepIndex - 1)}
              disabled={!hasPrevious}
              style={{
                ...playerStyles.controlButton,
                ...(!hasPrevious ? playerStyles.disabledButton : {}),
              }}
              title="Previous step"
            >
              <ChevronLeft size={18} aria-hidden="true" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              onClick={() => moveToStep(safeStepIndex + 1)}
              disabled={!hasNext}
              style={{
                ...playerStyles.controlButton,
                ...playerStyles.primaryButton,
                ...(!hasNext ? playerStyles.disabledButton : {}),
              }}
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

const playerStyles = {
  shell: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    color: "#182230",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  lessonMeta: {
    display: "grid",
    gap: 6,
  },
  eyebrow: {
    color: "#526070",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  lessonTitle: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.12,
    overflowWrap: "anywhere",
  },
  summary: {
    margin: 0,
    color: "#526070",
    fontSize: 16,
    lineHeight: 1.45,
    maxWidth: 760,
  },
  stepCounter: {
    border: "1px solid #d5d9e2",
    borderRadius: 8,
    padding: "8px 12px",
    background: "#ffffff",
    color: "#344054",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  stepNav: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 10,
  },
  stepButton: {
    minHeight: 62,
    border: "1px solid #d5d9e2",
    borderRadius: 8,
    padding: 10,
    background: "#ffffff",
    color: "#182230",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
    textAlign: "left",
    font: "inherit",
  },
  stepButtonActive: {
    borderColor: "#1f6feb",
    background: "#e9f2ff",
    color: "#0f3e8a",
    boxShadow: "0 0 0 2px rgba(31, 111, 235, 0.14)",
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#edf1f7",
    color: "#344054",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    fontWeight: 900,
  },
  stepLabel: {
    minWidth: 0,
    overflowWrap: "anywhere",
    fontWeight: 800,
    lineHeight: 1.2,
  },
  stage: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.6fr)",
    gap: 18,
    alignItems: "start",
  },
  sidePanel: {
    border: "1px solid #d5d9e2",
    borderRadius: 8,
    background: "#ffffff",
    padding: 16,
    display: "grid",
    gap: 16,
    boxShadow: "0 10px 30px rgba(16, 24, 40, 0.06)",
  },
  panelSection: {
    display: "grid",
    gap: 12,
  },
  panelHeading: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#0f3e8a",
  },
  panelTitle: {
    margin: 0,
    fontSize: 18,
    lineHeight: 1.2,
  },
  narrationText: {
    margin: 0,
    color: "#344054",
    fontSize: 16,
    lineHeight: 1.5,
  },
  controls: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  controlButton: {
    minHeight: 40,
    border: "1px solid #c9d1df",
    borderRadius: 8,
    background: "#ffffff",
    color: "#182230",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 12px",
    font: "inherit",
    fontWeight: 800,
  },
  primaryButton: {
    borderColor: "#1f6feb",
    background: "#1f6feb",
    color: "#ffffff",
  },
  disabledButton: {
    cursor: "not-allowed",
    opacity: 0.48,
  },
  rateControl: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "8px 10px",
    alignItems: "center",
    color: "#344054",
    fontWeight: 800,
  },
  rateValue: {
    color: "#0f3e8a",
    fontVariantNumeric: "tabular-nums",
  },
  rateSlider: {
    gridColumn: "1 / -1",
    width: "100%",
  },
  supportNote: {
    margin: 0,
    color: "#b42318",
    fontSize: 14,
    lineHeight: 1.4,
  },
  promptBox: {
    border: "1px solid #fedf89",
    borderRadius: 8,
    background: "#fffaeb",
    padding: 14,
    display: "grid",
    gap: 6,
  },
  promptTitle: {
    margin: 0,
    color: "#93370d",
    fontSize: 16,
    lineHeight: 1.2,
  },
  promptText: {
    margin: 0,
    color: "#7a2e0e",
    fontSize: 16,
    lineHeight: 1.45,
  },
  navControls: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  emptyTitle: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.2,
  },
  emptyText: {
    margin: 0,
    color: "#526070",
  },
} satisfies Record<string, CSSProperties>;

export default LessonPlayer;
