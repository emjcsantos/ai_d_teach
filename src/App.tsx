import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { createStarterLesson } from "./data/sampleLessons";
import { loadLessons, upsertLesson } from "./lib/lessonRepository";
import { getLessonProgress, updateLessonProgress } from "./lib/lessonProgress";
import { LessonComposer } from "./components/LessonComposer";
import { LessonLibrary } from "./components/LessonLibrary";
import { LessonPlayer } from "./components/LessonPlayer";
import { QuizPanel } from "./components/QuizPanel";
import type { Difficulty, GradeLevel, Lesson } from "./types/lesson";

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
        <QuizPanel
          lesson={activeLesson}
          progress={progress}
          onAnswer={handleQuizAnswer}
          onComplete={handleCompleteLesson}
        />

        <section className="ralph-panel">
          <div className="section-heading">
            <span>Ralph Loop</span>
            <strong>{progress.completedAt ? "Ready to improve" : "Collecting signals"}</strong>
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
          </dl>
        </section>
      </aside>
    </main>
  );
}
