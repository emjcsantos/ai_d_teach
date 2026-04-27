import type { LessonProgress } from "../types/lesson";

const PROGRESS_KEY = "ai-d-teach.progress.v1";
const DEFAULT_REPOSITORY_URL = "http://127.0.0.1:8787";

function getRepositoryBaseUrl() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return (env?.VITE_AI_D_TEACH_REPOSITORY_URL ?? DEFAULT_REPOSITORY_URL).replace(/\/$/, "");
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 1400);

  try {
    const response = await fetch(`${getRepositoryBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Repository request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

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

function createEmptyProgress(lessonId: string): LessonProgress {
  return {
    lessonId,
    quizAttempts: [],
    teacherNotes: [],
    studentNotes: [],
    improvementNotes: [],
    chatMessages: [],
  };
}

function normalizeProgress(lessonId: string, progress?: Partial<LessonProgress>): LessonProgress {
  const emptyProgress = createEmptyProgress(lessonId);

  return {
    ...emptyProgress,
    ...progress,
    lessonId,
    quizAttempts: Array.isArray(progress?.quizAttempts) ? progress.quizAttempts : [],
    teacherNotes: Array.isArray(progress?.teacherNotes) ? progress.teacherNotes : [],
    studentNotes: Array.isArray(progress?.studentNotes) ? progress.studentNotes : [],
    improvementNotes: Array.isArray(progress?.improvementNotes) ? progress.improvementNotes : [],
    chatMessages: Array.isArray(progress?.chatMessages) ? progress.chatMessages : [],
  };
}

export function getLessonProgress(lessonId: string): LessonProgress {
  const progress = loadAllProgress();

  return normalizeProgress(lessonId, progress[lessonId]);
}

export function updateLessonProgress(lessonProgress: LessonProgress) {
  const progress = loadAllProgress();
  saveAllProgress({ ...progress, [lessonProgress.lessonId]: lessonProgress });
}

export async function loadLessonProgressFromRepository(lessonId: string) {
  const response = await requestJson<{ progress: LessonProgress }>(
    `/api/progress/${encodeURIComponent(lessonId)}`,
  );
  const progress = normalizeProgress(lessonId, response.progress);
  updateLessonProgress(progress);
  return progress;
}

export async function updateLessonProgressInRepository(lessonProgress: LessonProgress) {
  updateLessonProgress(lessonProgress);

  try {
    const response = await requestJson<{ progress: LessonProgress }>(
      `/api/progress/${encodeURIComponent(lessonProgress.lessonId)}`,
      {
        method: "PUT",
        body: JSON.stringify({ progress: lessonProgress }),
      },
    );
    const progress = normalizeProgress(lessonProgress.lessonId, response.progress);
    updateLessonProgress(progress);
    return progress;
  } catch {
    return lessonProgress;
  }
}
