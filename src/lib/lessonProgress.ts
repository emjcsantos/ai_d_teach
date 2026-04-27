import type { LessonProgress } from "../types/lesson";

const PROGRESS_KEY = "ai-d-teach.progress.v1";

function loadAllProgress(): Record<string, LessonProgress> {
  const stored = window.localStorage.getItem(PROGRESS_KEY);

  if (!stored) {
    return {};
  }

  try {
    const parsed = JSON.parse(stored) as Record<string, LessonProgress>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAllProgress(progress: Record<string, LessonProgress>) {
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function getLessonProgress(lessonId: string): LessonProgress {
  const progress = loadAllProgress();

  return (
    progress[lessonId] ?? {
      lessonId,
      quizAttempts: [],
      teacherNotes: [],
      studentNotes: [],
      improvementNotes: [],
    }
  );
}

export function updateLessonProgress(lessonProgress: LessonProgress) {
  const progress = loadAllProgress();
  saveAllProgress({ ...progress, [lessonProgress.lessonId]: lessonProgress });
}

