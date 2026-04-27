import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { createStarterLesson } from "./data/sampleLessons";
import { loadLessons, upsertLesson } from "./lib/lessonRepository";
import { getLessonProgress, updateLessonProgress } from "./lib/lessonProgress";
import { LessonComposer } from "./components/LessonComposer";
import { LessonLibrary } from "./components/LessonLibrary";
import { LessonPlayer } from "./components/LessonPlayer";
import { QuizPanel } from "./components/QuizPanel";
import { FeedbackPanel, type FeedbackKind } from "./components/FeedbackPanel";
import { TutorChat } from "./components/TutorChat";
import { buildTutorReply } from "./lib/tutorBrain";
import type { ChatMessage, Difficulty, GradeLevel, Lesson } from "./types/lesson";

export default function App() {
  const [lessons, setLessons] = useState<Lesson[]>(() => loadLessons());
  const [activeLesson, setActiveLesson] = useState<Lesson>(() => lessons[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [voiceRate, setVoiceRate] = useState(0.95);
  const [progressVersion, setProgressVersion] = useState(0);

  const progress = useMemo(
    () => getLessonProgress(activeLesson.id),
    [activeLesson.id, progressVersion],
  );
  const feedbackCount =
    progress.teacherNotes.length + progress.studentNotes.length + progress.improvementNotes.length;
  const conversationCount = progress.chatMessages.filter((message) => message.role === "student").length;

  function createChatMessage(
    role: ChatMessage["role"],
    text: string,
    stepId?: string,
  ): ChatMessage {
    return {
      id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role,
      text,
      stepId,
      createdAt: new Date().toISOString(),
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
  }

  function handleStepChange(index: number) {
    setCurrentStepIndex(index);
    const nextProgress = {
      ...getLessonProgress(activeLesson.id),
      currentStepId: activeLesson.steps[index]?.id,
    };
    updateLessonProgress(nextProgress);
    setProgressVersion((version) => version + 1);
  }

  function handleQuizAnswer(questionId: string, selected: string, correct: boolean) {
    const currentProgress = getLessonProgress(activeLesson.id);
    updateLessonProgress({
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

  function handleCompleteLesson() {
    const currentProgress = getLessonProgress(activeLesson.id);
    updateLessonProgress({
      ...currentProgress,
      completedAt: new Date().toISOString(),
    });
    setProgressVersion((version) => version + 1);
  }

  function handleAddFeedback(kind: FeedbackKind, note: string) {
    const currentProgress = getLessonProgress(activeLesson.id);
    const stampedNote = `${new Date().toLocaleDateString()}: ${note}`;

    updateLessonProgress({
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

  function handleSendTutorMessage(message: string) {
    const currentStep = activeLesson.steps[currentStepIndex] ?? activeLesson.steps[0];
    const currentProgress = getLessonProgress(activeLesson.id);
    const reply = currentStep
      ? buildTutorReply({
          lesson: activeLesson,
          currentStep,
          message,
          progress: currentProgress,
        })
      : `This lesson needs at least one step before I can tutor it. Add a lesson step for ${activeLesson.topic}, then ask me again.`;
    const userMessage = createChatMessage("student", message, currentStep?.id);
    const tutorMessage = createChatMessage("tutor", reply, currentStep?.id);

    updateLessonProgress({
      ...currentProgress,
      chatMessages: [...currentProgress.chatMessages, userMessage, tutorMessage],
    });
    setProgressVersion((version) => version + 1);

    return reply;
  }

  return (
    <main className="app-shell">
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
          voiceRate={voiceRate}
          onVoiceRateChange={setVoiceRate}
        />
      </section>

      <aside className="insight-rail" aria-label="Quiz and progress">
        <TutorChat
          lesson={activeLesson}
          progress={progress}
          voiceRate={voiceRate}
          onSendMessage={handleSendTutorMessage}
        />

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
          </dl>
        </section>
      </aside>
    </main>
  );
}
