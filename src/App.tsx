import { useEffect, useMemo, useState } from "react";
import { Settings2, Sparkles } from "lucide-react";
import { createStarterLesson } from "./data/sampleLessons";
import {
  loadLessons,
  loadLessonsFromRepository,
  upsertLesson,
  upsertLessonInRepository,
} from "./lib/lessonRepository";
import {
  getLessonProgress,
  loadLessonProgressFromRepository,
  updateLessonProgressInRepository,
} from "./lib/lessonProgress";
import { LessonComposer } from "./components/LessonComposer";
import { LessonLibrary } from "./components/LessonLibrary";
import { LessonPlayer } from "./components/LessonPlayer";
import { QuizPanel } from "./components/QuizPanel";
import { FeedbackPanel, type FeedbackKind } from "./components/FeedbackPanel";
import { buildTutorTurn } from "./lib/tutorBrain";
import { requestTutorTurn } from "./lib/tutorApi";
import type { CanvasActivityAttempt } from "./components/LessonCanvas";
import type { ChatMessage, Difficulty, GradeLevel, Lesson, TutorTurn } from "./types/lesson";

const DEFAULT_VOICE_RATE = 0.88;

export default function App() {
  const [lessons, setLessons] = useState<Lesson[]>(() => loadLessons());
  const [activeLesson, setActiveLesson] = useState<Lesson>(() => lessons[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressVersion, setProgressVersion] = useState(0);
  const [showParentTools, setShowParentTools] = useState(false);

  const progress = useMemo(
    () => getLessonProgress(activeLesson.id),
    [activeLesson.id, progressVersion],
  );
  const feedbackCount =
    progress.teacherNotes.length + progress.studentNotes.length + progress.improvementNotes.length;
  const conversationCount = progress.chatMessages.filter((message) => message.role === "student").length;
  const tutorSignalCount = progress.tutorSignals.length;
  const activityAttemptCount = progress.activityAttempts.length;

  useEffect(() => {
    let cancelled = false;

    loadLessonsFromRepository()
      .then((repositoryLessons) => {
        if (cancelled || repositoryLessons.length === 0) {
          return;
        }

        setLessons(repositoryLessons);
        setActiveLesson((currentLesson) => {
          return (
            repositoryLessons.find((lesson) => lesson.id === currentLesson.id) ??
            repositoryLessons[0]
          );
        });
      })
      .catch(() => {
        // Local storage remains the offline fallback when the shared server is not running.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadLessonProgressFromRepository(activeLesson.id)
      .then(() => {
        if (!cancelled) {
          setProgressVersion((version) => version + 1);
        }
      })
      .catch(() => {
        // Keep local progress when the shared server is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [activeLesson.id]);

  function createChatMessage(
    role: ChatMessage["role"],
    text: string,
    stepId?: string,
    tutorTurn?: TutorTurn,
  ): ChatMessage {
    return {
      id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role,
      text,
      stepId,
      createdAt: new Date().toISOString(),
      tutorMode: tutorTurn?.mode,
      tutorUnderstanding: tutorTurn?.understanding,
      tutorNextAction: tutorTurn?.nextAction,
    };
  }

  function selectLesson(lesson: Lesson) {
    setActiveLesson(lesson);
    const savedProgress = getLessonProgress(lesson.id);
    const savedStepIndex = lesson.steps.findIndex((step) => step.id === savedProgress.currentStepId);
    setCurrentStepIndex(savedStepIndex >= 0 ? savedStepIndex : 0);
  }

  function handleCreateLesson(topic: string, gradeLevel: GradeLevel, difficulty: Difficulty) {
    const lesson = createStarterLesson(topic, gradeLevel, difficulty);
    const matchingVersionCount = lessons.filter(
      (candidate) =>
        candidate.topic.trim().toLowerCase() === topic.trim().toLowerCase() &&
        candidate.gradeLevel === gradeLevel,
    ).length;
    lesson.version = matchingVersionCount + 1;
    const nextLessons = upsertLesson(lesson);
    setLessons(nextLessons);
    selectLesson(lesson);
    void upsertLessonInRepository(lesson).then((repositoryLessons) => {
      setLessons(repositoryLessons);
    });
  }

  function handleStepChange(index: number) {
    setCurrentStepIndex(index);
    const nextProgress = {
      ...getLessonProgress(activeLesson.id),
      currentStepId: activeLesson.steps[index]?.id,
    };
    void updateLessonProgressInRepository(nextProgress);
    setProgressVersion((version) => version + 1);
  }

  function handleQuizAnswer(questionId: string, selected: string, correct: boolean) {
    const currentProgress = getLessonProgress(activeLesson.id);
    void updateLessonProgressInRepository({
      ...currentProgress,
      quizAttempts: [
        ...currentProgress.quizAttempts,
        {
          questionId,
          selected,
          correct,
          answeredAt: new Date().toISOString(),
        },
      ],
    });
    setProgressVersion((version) => version + 1);
  }

  function handleActivityAttempt(attempt: CanvasActivityAttempt) {
    const currentProgress = getLessonProgress(activeLesson.id);

    void updateLessonProgressInRepository({
      ...currentProgress,
      activityAttempts: [
        ...currentProgress.activityAttempts,
        {
          ...attempt,
          attemptedAt: new Date().toISOString(),
        },
      ],
    });
    setProgressVersion((version) => version + 1);
  }

  function handleCompleteLesson() {
    const currentProgress = getLessonProgress(activeLesson.id);
    void updateLessonProgressInRepository({
      ...currentProgress,
      completedAt: new Date().toISOString(),
    });
    setProgressVersion((version) => version + 1);
  }

  function handleAddFeedback(kind: FeedbackKind, note: string) {
    const currentProgress = getLessonProgress(activeLesson.id);
    const stampedNote = `${new Date().toLocaleDateString()}: ${note}`;

    void updateLessonProgressInRepository({
      ...currentProgress,
      teacherNotes:
        kind === "teacher"
          ? [...currentProgress.teacherNotes, stampedNote]
          : currentProgress.teacherNotes,
      studentNotes:
        kind === "student"
          ? [...currentProgress.studentNotes, stampedNote]
          : currentProgress.studentNotes,
      improvementNotes:
        kind === "improvement"
          ? [...currentProgress.improvementNotes, stampedNote]
          : currentProgress.improvementNotes,
    });
    setProgressVersion((version) => version + 1);
  }

  async function handleSendTutorMessage(message: string) {
    const currentStep = activeLesson.steps[currentStepIndex] ?? activeLesson.steps[0];
    const currentProgress = getLessonProgress(activeLesson.id);
    let tutorTurn: TutorTurn;

    if (currentStep) {
      try {
        tutorTurn = await requestTutorTurn({
          lesson: activeLesson,
          currentStep,
          message,
          progress: currentProgress,
        });
      } catch {
        tutorTurn = buildTutorTurn({
          lesson: activeLesson,
          currentStep,
          message,
          progress: currentProgress,
        });
      }
    } else {
      tutorTurn = {
        reply: `This lesson needs at least one step before I can tutor it. Add a lesson step for ${activeLesson.topic}, then ask me again.`,
        mode: "explain",
        understanding: "not_checked",
        nextAction: "review",
        canContinue: false,
      };
    }

    const userMessage = createChatMessage("student", message, currentStep?.id);
    const tutorMessage = createChatMessage("tutor", tutorTurn.reply, currentStep?.id, tutorTurn);
    const tutorSignal = currentStep
      ? {
          id: `signal-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          stepId: currentStep.id,
          studentMessage: message,
          mode: tutorTurn.mode,
          understanding: tutorTurn.understanding,
          nextAction: tutorTurn.nextAction,
          canContinue: tutorTurn.canContinue,
          createdAt: tutorMessage.createdAt,
        }
      : undefined;

    void updateLessonProgressInRepository({
      ...currentProgress,
      chatMessages: [...currentProgress.chatMessages, userMessage, tutorMessage],
      tutorSignals: tutorSignal
        ? [...currentProgress.tutorSignals, tutorSignal]
        : currentProgress.tutorSignals,
    });
    setProgressVersion((version) => version + 1);

    return tutorTurn;
  }

  return (
    <>
      <button
        type="button"
        className="parent-tools-toggle"
        onClick={() => setShowParentTools((current) => !current)}
        title={showParentTools ? "Return to student view" : "Show parent tools"}
      >
        <Settings2 size={17} aria-hidden="true" />
        <span>{showParentTools ? "Student view" : "Parent tools"}</span>
      </button>

      <main className={showParentTools ? "app-shell" : "app-shell is-student-focus"}>
      <aside className="control-rail" aria-label="Lesson setup and library">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Sparkles size={24} aria-hidden="true" />
          </div>
          <div>
            <h1>AI D Teach</h1>
            <p>Interactive lessons that get better with use.</p>
          </div>
        </div>

        <LessonComposer
          lessons={lessons}
          onCreateLesson={handleCreateLesson}
          onSelectLesson={selectLesson}
        />

        <LessonLibrary
          lessons={lessons}
          activeLessonId={activeLesson.id}
          onSelectLesson={selectLesson}
        />
      </aside>

      <section className="learning-stage" aria-label="Interactive lesson">
        <LessonPlayer
          lesson={activeLesson}
          currentStepIndex={currentStepIndex}
          onStepChange={handleStepChange}
          progress={progress}
          voiceRate={DEFAULT_VOICE_RATE}
          onSendMessage={handleSendTutorMessage}
          onActivityAttempt={handleActivityAttempt}
        />
      </section>

      <aside className="insight-rail" aria-label="Practice and progress">
        <QuizPanel
          lesson={activeLesson}
          progress={progress}
          onAnswer={handleQuizAnswer}
          onComplete={handleCompleteLesson}
        />

        <FeedbackPanel lesson={activeLesson} progress={progress} onAddNote={handleAddFeedback} />

        <section className="ralph-panel">
          <div className="section-heading">
            <span>Ralph Loop</span>
            <strong>{feedbackCount > 0 ? "Feedback captured" : "Collecting signals"}</strong>
          </div>
          <p>
            Quiz attempts, replayed steps, teacher notes, and student feedback will become versioned
            lesson improvements.
          </p>
          <dl>
            <div>
              <dt>Attempts</dt>
              <dd>{progress.quizAttempts.length}</dd>
            </div>
            <div>
              <dt>Lesson version</dt>
              <dd>v{activeLesson.version}</dd>
            </div>
            <div>
              <dt>Feedback notes</dt>
              <dd>{feedbackCount}</dd>
            </div>
            <div>
              <dt>Conversations</dt>
              <dd>{conversationCount}</dd>
            </div>
            <div>
              <dt>Activities</dt>
              <dd>{activityAttemptCount}</dd>
            </div>
            <div>
              <dt>Tutor signals</dt>
              <dd>{tutorSignalCount}</dd>
            </div>
          </dl>
        </section>
      </aside>
      </main>
    </>
  );
}
