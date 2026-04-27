import { sampleLessons } from "../data/sampleLessons";
import type { Lesson } from "../types/lesson";

const LESSONS_KEY = "ai-d-teach.lessons.v1";
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

export function loadLessons(): Lesson[] {
  const stored = window.localStorage.getItem(LESSONS_KEY);

  if (!stored) {
    saveLessons(sampleLessons);
    return sampleLessons;
  }

  try {
    const parsed = JSON.parse(stored) as Lesson[];
    return Array.isArray(parsed) ? parsed : sampleLessons;
  } catch {
    return sampleLessons;
  }
}

export function saveLessons(lessons: Lesson[]) {
  window.localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons));
}

export function upsertLesson(lesson: Lesson): Lesson[] {
  const lessons = loadLessons();
  const existingIndex = lessons.findIndex((candidate) => candidate.id === lesson.id);
  const nextLessons =
    existingIndex >= 0
      ? lessons.map((candidate) => (candidate.id === lesson.id ? lesson : candidate))
      : [lesson, ...lessons];

  saveLessons(nextLessons);
  return nextLessons;
}

export function findReusableLesson(topic: string, gradeLevel: string) {
  const normalizedTopic = topic.trim().toLowerCase();

  return loadLessons().find(
    (lesson) =>
      lesson.topic.trim().toLowerCase() === normalizedTopic && lesson.gradeLevel === gradeLevel,
  );
}

export async function loadLessonsFromRepository(): Promise<Lesson[]> {
  const response = await requestJson<{ lessons: Lesson[] }>("/api/lessons");
  const lessons = Array.isArray(response.lessons) ? response.lessons : sampleLessons;
  saveLessons(lessons);
  return lessons;
}

export async function upsertLessonInRepository(lesson: Lesson): Promise<Lesson[]> {
  const localLessons = upsertLesson(lesson);

  try {
    const response = await requestJson<{ lessons: Lesson[] }>("/api/lessons", {
      method: "POST",
      body: JSON.stringify({ lesson }),
    });
    const lessons = Array.isArray(response.lessons) ? response.lessons : localLessons;
    saveLessons(lessons);
    return lessons;
  } catch {
    return localLessons;
  }
}
