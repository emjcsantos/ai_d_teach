import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Sparkles, Square } from "lucide-react";
import { canSpeak, speak, stopSpeaking } from "../lib/textToSpeech";
import type { Lesson, LessonProgress, TutorSignal, TutorTurn } from "../types/lesson";
import { LessonCanvas, type CanvasActivityAttempt, type CanvasPracticeState } from "./LessonCanvas";
import { TutorChat } from "./TutorChat";

export type LessonPlayerProps = {
  lesson: Lesson;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  progress: LessonProgress;
  onSendMessage: (message: string) => Promise<TutorTurn>;
  onActivityAttempt: (attempt: CanvasActivityAttempt) => void;
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

function getLatestStepSignal(progress: LessonProgress, stepId?: string) {
  if (!stepId) {
    return undefined;
  }

  return [...progress.tutorSignals].reverse().find((signal) => signal.stepId === stepId);
}

function getTutorGuidance(
  signal: TutorSignal | undefined,
  practiceState: CanvasPracticeState | undefined,
  hasNext: boolean,
) {
  if (practiceState?.active && !practiceState.complete) {
    return {
      title: "Follow the teacher task",
      body: practiceState.prompt,
      label: "Do",
    };
  }

  if (practiceState?.complete && hasNext) {
    return {
      title: "Teacher task complete",
      body: "You finished the canvas challenges for this step. Continue when you are ready.",
      label: "Ready",
    };
  }

  if (practiceState?.complete) {
    return {
      title: "Ready for practice",
      body: "You finished the canvas challenges. Try the quiz below when you are ready.",
      label: "Ready",
    };
  }

  if (!signal) {
    return {
      title: "Tell the tutor what you notice",
      body: "Answer in your own words. When the tutor sees understanding, Continue will appear.",
      label: "Waiting",
    };
  }

  if (signal.nextAction === "continue" && hasNext) {
    return {
      title: "Ready for the next step",
      body: "The tutor thinks you understand this part. Continue when you are ready.",
      label: "Ready",
    };
  }

  if (signal.nextAction === "continue") {
    return {
      title: "Ready for practice",
      body: "The tutor thinks you understand the lesson steps. Try the quiz below when you are ready.",
      label: "Ready",
    };
  }

  if (signal.nextAction === "quiz") {
    return {
      title: "Ready for practice",
      body: "Try the quiz below when you finish the last step.",
      label: "Practice",
    };
  }

  if (signal.nextAction === "try_canvas") {
    return {
      title: "Use the canvas clue",
      body: "Tap or inspect the visual, then tell the tutor what changed or what you see.",
      label: "Look",
    };
  }

  return {
    title: "Keep talking with the tutor",
    body: "Answer the tutor's follow-up so it can check understanding before moving on.",
    label: "Answer",
  };
}

export function LessonPlayer({
  lesson,
  currentStepIndex,
  onStepChange,
  progress,
  onSendMessage,
  onActivityAttempt,
  voiceRate,
}: LessonPlayerProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [practiceByStep, setPracticeByStep] = useState<Record<string, CanvasPracticeState>>({});
  const stepCount = lesson.steps.length;
  const safeStepIndex = getSafeStepIndex(stepCount, currentStepIndex);
  const currentStep = lesson.steps[safeStepIndex];
  const currentStepId = currentStep?.id;
  const rate = useMemo(() => clamp(voiceRate, MIN_RATE, MAX_RATE), [voiceRate]);
  const stepLabel = stepCount > 0 ? `${safeStepIndex + 1}/${stepCount}` : "0/0";

  useEffect(() => {
    setSpeechAvailable(canSpeak());
  }, []);

  useEffect(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, [currentStep?.id]);

  useEffect(() => {
    setPracticeByStep({});
  }, [lesson.id]);

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

  const handlePracticeStateChange = useCallback(
    (state: CanvasPracticeState) => {
      if (!currentStepId) {
        return;
      }

      setPracticeByStep((current) => ({
        ...current,
        [currentStepId]: state,
      }));
    },
    [currentStepId],
  );

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
  const latestStepSignal = getLatestStepSignal(progress, currentStep.id);
  const practiceState = practiceByStep[currentStep.id];
  const tutorGuidance = getTutorGuidance(latestStepSignal, practiceState, hasNext);
  const canContinueFromTutor = hasNext && latestStepSignal?.canContinue;
  const canContinueFromPractice = hasNext && practiceState?.complete;
  const canContinue = canContinueFromTutor || canContinueFromPractice;

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
          <strong>{stepLabel}</strong>
          <span>step</span>
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
        <LessonCanvas
          step={currentStep}
          voiceRate={rate}
          onPracticeStateChange={handlePracticeStateChange}
          onActivityAttempt={onActivityAttempt}
        />

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

          <section
            className={[
              "coach-card",
              "tutor-guidance",
              latestStepSignal ? `is-${latestStepSignal.understanding}` : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-live="polite"
          >
            <span className="tutor-guidance__label">{tutorGuidance.label}</span>
            <h2>{tutorGuidance.title}</h2>
            <p>{tutorGuidance.body}</p>
          </section>

          {hasPrevious || canContinue ? (
            <div className="lesson-nav-actions">
              {hasPrevious ? (
                <button
                  type="button"
                  onClick={() => moveToStep(safeStepIndex - 1)}
                  className="coach-button"
                  title="Previous step"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                  <span>Back</span>
                </button>
              ) : null}
              {canContinue ? (
                <button
                  type="button"
                  onClick={() => moveToStep(safeStepIndex + 1)}
                  className="coach-button coach-button--primary"
                  title="Continue to the next step"
                >
                  <span>Continue</span>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

export default LessonPlayer;
