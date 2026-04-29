import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { sampleLessons } from "./sampleLessons.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.AI_D_TEACH_DATA_DIR
  ? resolve(process.env.AI_D_TEACH_DATA_DIR)
  : resolve(__dirname, "../data");
const lessonsFile = resolve(dataDir, "lessons.json");
const progressFile = resolve(dataDir, "progress.json");

let statePromise;
let writeQueue = Promise.resolve();

function normalizeTopic(topic) {
  return topic.trim().toLowerCase();
}

function mergeCurrentSampleLessons(lessons) {
  const sampleById = new Map(sampleLessons.map((lesson) => [lesson.id, lesson]));
  const seenIds = new Set();
  const mergedLessons = lessons.map((lesson) => {
    const sampleLesson = sampleById.get(lesson.id);
    seenIds.add(lesson.id);

    if (!sampleLesson) {
      return lesson;
    }

    return {
      ...sampleLesson,
      createdAt: lesson.createdAt || sampleLesson.createdAt,
      updatedAt: sampleLesson.updatedAt,
    };
  });
  const missingSamples = sampleLessons.filter((lesson) => !seenIds.has(lesson.id));

  return [...mergedLessons, ...missingSamples];
}

function createEmptyProgress(lessonId) {
  return {
    lessonId,
    quizAttempts: [],
    teacherNotes: [],
    studentNotes: [],
    improvementNotes: [],
    chatMessages: [],
    tutorSignals: [],
    activityAttempts: [],
  };
}

function normalizeProgress(lessonId, progress = {}) {
  return {
    ...createEmptyProgress(lessonId),
    ...progress,
    lessonId,
    quizAttempts: Array.isArray(progress.quizAttempts) ? progress.quizAttempts : [],
    teacherNotes: Array.isArray(progress.teacherNotes) ? progress.teacherNotes : [],
    studentNotes: Array.isArray(progress.studentNotes) ? progress.studentNotes : [],
    improvementNotes: Array.isArray(progress.improvementNotes) ? progress.improvementNotes : [],
    chatMessages: Array.isArray(progress.chatMessages) ? progress.chatMessages : [],
    tutorSignals: Array.isArray(progress.tutorSignals) ? progress.tutorSignals : [],
    activityAttempts: Array.isArray(progress.activityAttempts) ? progress.activityAttempts : [],
  };
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn(`Could not read ${file}; using fallback.`, error);
    }
    return fallback;
  }
}

async function writeJson(file, value) {
  await mkdir(dataDir, { recursive: true });
  const tempFile = `${file}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempFile, file);
}

async function loadState() {
  await mkdir(dataDir, { recursive: true });
  const lessons = await readJson(lessonsFile, sampleLessons);
  const progress = await readJson(progressFile, {});
  const normalizedLessons =
    Array.isArray(lessons) && lessons.length > 0
      ? mergeCurrentSampleLessons(lessons)
      : sampleLessons;
  const normalizedProgress =
    progress && typeof progress === "object" && !Array.isArray(progress) ? progress : {};

  if (
    !Array.isArray(lessons) ||
    lessons.length === 0 ||
    JSON.stringify(lessons) !== JSON.stringify(normalizedLessons)
  ) {
    await writeJson(lessonsFile, normalizedLessons);
  }

  if (!progress || typeof progress !== "object" || Array.isArray(progress)) {
    await writeJson(progressFile, normalizedProgress);
  }

  return { lessons: normalizedLessons, progress: normalizedProgress };
}

async function getState() {
  statePromise ??= loadState();
  return statePromise;
}

async function enqueueWrite(callback) {
  writeQueue = writeQueue.then(callback, callback);
  return writeQueue;
}

export async function listLessons() {
  const state = await getState();
  return state.lessons;
}

export async function getLesson(lessonId) {
  const state = await getState();
  return state.lessons.find((lesson) => lesson.id === lessonId);
}

export async function saveLesson(lesson) {
  const state = await getState();
  const nextLesson = {
    ...lesson,
    updatedAt: new Date().toISOString(),
  };
  const existingIndex = state.lessons.findIndex((candidate) => candidate.id === lesson.id);
  state.lessons =
    existingIndex >= 0
      ? state.lessons.map((candidate) => (candidate.id === lesson.id ? nextLesson : candidate))
      : [nextLesson, ...state.lessons];

  await enqueueWrite(() => writeJson(lessonsFile, state.lessons));
  return nextLesson;
}

export async function getProgress(lessonId) {
  const state = await getState();
  const progress = normalizeProgress(lessonId, state.progress[lessonId]);
  state.progress[lessonId] = progress;
  return progress;
}

export async function saveProgress(progress) {
  const state = await getState();
  const normalizedProgress = normalizeProgress(progress.lessonId, progress);
  state.progress[normalizedProgress.lessonId] = normalizedProgress;
  await enqueueWrite(() => writeJson(progressFile, state.progress));
  return normalizedProgress;
}

export function createStarterLesson(topic, gradeLevel = "3", difficulty = "standard") {
  const slug = normalizeTopic(topic)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const createdAt = new Date().toISOString();

  return {
    id: `${slug || "lesson"}-chatgpt-${Date.now()}`,
    schemaVersion: 1,
    topic,
    gradeLevel,
    difficulty,
    createdAt,
    updatedAt: createdAt,
    source: "chatgpt-app-template",
    version: 1,
    status: "needs-review",
    summary: `A starter interactive lesson for ${topic}. ChatGPT can tutor the child while this widget shows the lesson canvas.`,
    steps: [
      {
        id: "intro",
        title: `Meet ${topic}`,
        narration: `Today we are learning about ${topic}. Look at the idea, ask questions, and try the quick check.`,
        prompt: `Ask ChatGPT: can you explain ${topic} simply?`,
        visual: {
          kind: "word_cards",
          words: [
            { term: topic, meaning: "The main idea for this lesson." },
            { term: "Example", meaning: "A clear case that makes the idea easier." },
            { term: "Practice", meaning: "A quick way to check what you know." },
          ],
        },
      },
      {
        id: "practice",
        title: "Try It",
        narration: `Use ${topic} in your own words, then ask ChatGPT for feedback.`,
        prompt: `Tell ChatGPT one thing you notice about ${topic}.`,
        visual: {
          kind: "formula_board",
          formula: `${topic} = idea + example + practice`,
          explanation: "Learning is easier when each step is visible and small.",
        },
      },
    ],
    quiz: [
      {
        id: "starter-q1",
        prompt: `What helps you learn ${topic}?`,
        choices: ["Look, ask, and practice", "Skip the lesson", "Guess only"],
        answer: "Look, ask, and practice",
        explanation: "Looking, asking, and practicing helps new ideas stick.",
      },
    ],
  };
}

export async function findOrCreateLesson({ topic, gradeLevel, difficulty }) {
  const state = await getState();
  const normalizedTopic = normalizeTopic(topic);
  const existingLesson = state.lessons.find(
    (lesson) =>
      normalizeTopic(lesson.topic) === normalizedTopic &&
      (!gradeLevel || String(lesson.gradeLevel) === String(gradeLevel)),
  );

  if (existingLesson) {
    return existingLesson;
  }

  const matchingVersionCount = state.lessons.filter(
    (lesson) => normalizeTopic(lesson.topic) === normalizedTopic,
  ).length;
  const lesson = {
    ...createStarterLesson(topic, gradeLevel, difficulty),
    version: matchingVersionCount + 1,
  };
  return saveLesson(lesson);
}

export async function recordQuizAnswer({ lessonId, questionId, selected }) {
  const lesson = await getLesson(lessonId);

  if (!lesson) {
    return undefined;
  }

  const question = lesson.quiz.find((candidate) => candidate.id === questionId);
  const progress = await getProgress(lesson.id);

  return saveProgress({
    ...progress,
    quizAttempts: [
      ...progress.quizAttempts,
      {
        questionId,
        selected,
        correct: question?.answer === selected,
        answeredAt: new Date().toISOString(),
      },
    ],
  });
}

export async function recordFeedback({ lessonId, kind, note }) {
  const lesson = await getLesson(lessonId);

  if (!lesson) {
    return undefined;
  }

  const progress = await getProgress(lesson.id);
  const stampedNote = `${new Date().toLocaleDateString()}: ${note.trim()}`;

  return saveProgress({
    ...progress,
    teacherNotes: kind === "teacher" ? [...progress.teacherNotes, stampedNote] : progress.teacherNotes,
    studentNotes: kind === "student" ? [...progress.studentNotes, stampedNote] : progress.studentNotes,
    improvementNotes:
      kind === "improvement" ? [...progress.improvementNotes, stampedNote] : progress.improvementNotes,
  });
}
