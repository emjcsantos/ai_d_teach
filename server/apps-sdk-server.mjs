import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WIDGET_URI = "ui://widget/lesson.html";
const widgetHtml = readFileSync(resolve(__dirname, "../public/lesson-widget.html"), "utf8");

const startLessonInputSchema = {
  topic: z.string().min(1).describe("Topic to teach, such as Fractions or Photosynthesis."),
  gradeLevel: z.string().optional().describe("Child grade level, such as 3 or 4."),
  difficulty: z.enum(["gentle", "standard", "challenge"]).optional(),
};

const recordQuizAnswerInputSchema = {
  lessonId: z.string().min(1),
  questionId: z.string().min(1),
  selected: z.string().min(1),
};

const recordFeedbackInputSchema = {
  lessonId: z.string().min(1),
  kind: z.enum(["teacher", "student", "improvement"]),
  note: z.string().min(1),
};

const sampleLessons = [
  {
    id: "sample-fractions-grade-3",
    schemaVersion: 1,
    topic: "Fractions",
    gradeLevel: "3",
    difficulty: "standard",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "sample",
    version: 1,
    status: "ready",
    summary: "Use a pizza, formula thinking, and a quick check to learn parts of a whole.",
    steps: [
      {
        id: "fraction-whole",
        title: "A Whole Can Split",
        narration: "A fraction tells us how many equal parts of a whole we are talking about.",
        prompt: "Look at the highlighted slice and tell ChatGPT what one fourth means.",
        visual: {
          kind: "fraction_pizza",
          parts: 4,
          highlight: 1,
          label: "1/4",
        },
      },
      {
        id: "fraction-formula",
        title: "Top And Bottom",
        narration:
          "The top number counts selected parts. The bottom number counts all equal parts.",
        prompt: "Ask ChatGPT why the bottom number is four.",
        visual: {
          kind: "formula_board",
          formula: "selected parts / equal parts = fraction",
          explanation: "One selected slice out of four equal slices is one fourth.",
        },
      },
    ],
    quiz: [
      {
        id: "fraction-q1",
        prompt: "If a pizza has 4 equal slices and you choose 1 slice, what fraction is chosen?",
        choices: ["1/4", "4/1", "1/2"],
        answer: "1/4",
        explanation: "One chosen slice out of four equal slices is 1/4.",
      },
    ],
  },
  {
    id: "sample-photosynthesis-grade-4",
    schemaVersion: 1,
    topic: "Photosynthesis",
    gradeLevel: "4",
    difficulty: "standard",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "sample",
    version: 1,
    status: "ready",
    summary: "Follow sunlight, water, and carbon dioxide as plants make food.",
    steps: [
      {
        id: "photo-cycle",
        title: "Plant Food Factory",
        narration:
          "Plants use sunlight, water, and carbon dioxide to make sugar for energy and release oxygen.",
        prompt: "Ask ChatGPT to explain one part of the cycle.",
        visual: {
          kind: "science_cycle",
          title: "Photosynthesis",
          nodes: ["Sunlight", "Water", "Carbon dioxide", "Sugar", "Oxygen"],
        },
      },
      {
        id: "photo-words",
        title: "Key Words",
        narration: "Photosynthesis has important words. Learn them like puzzle pieces.",
        prompt: "Choose one word and ask ChatGPT for an example.",
        visual: {
          kind: "word_cards",
          words: [
            { term: "Chlorophyll", meaning: "Green pigment that helps leaves catch sunlight." },
            { term: "Glucose", meaning: "A sugar plants make for energy." },
            { term: "Oxygen", meaning: "A gas plants release into the air." },
          ],
        },
      },
    ],
    quiz: [
      {
        id: "photo-q1",
        prompt: "Which energy source helps plants make food?",
        choices: ["Sunlight", "Moonlight", "Sand"],
        answer: "Sunlight",
        explanation: "Plants use sunlight as energy during photosynthesis.",
      },
    ],
  },
];

const lessons = new Map(sampleLessons.map((lesson) => [lesson.id, lesson]));
const progressByLessonId = new Map();

function normalizeTopic(topic) {
  return topic.trim().toLowerCase();
}

function createEmptyProgress(lessonId) {
  return {
    lessonId,
    quizAttempts: [],
    teacherNotes: [],
    studentNotes: [],
    improvementNotes: [],
    chatMessages: [],
  };
}

function getProgress(lessonId) {
  if (!progressByLessonId.has(lessonId)) {
    progressByLessonId.set(lessonId, createEmptyProgress(lessonId));
  }

  return progressByLessonId.get(lessonId);
}

function createStarterLesson(topic, gradeLevel = "3", difficulty = "standard") {
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

function findOrCreateLesson({ topic, gradeLevel, difficulty }) {
  const normalizedTopic = normalizeTopic(topic);
  const existingLesson = [...lessons.values()].find(
    (lesson) =>
      normalizeTopic(lesson.topic) === normalizedTopic &&
      (!gradeLevel || String(lesson.gradeLevel) === String(gradeLevel)),
  );

  if (existingLesson) {
    return existingLesson;
  }

  const lesson = createStarterLesson(topic, gradeLevel, difficulty);
  lessons.set(lesson.id, lesson);
  return lesson;
}

function lessonPayload(lesson, message) {
  return {
    content: [{ type: "text", text: message }],
    structuredContent: {
      lesson,
      progress: getProgress(lesson.id),
    },
  };
}

function createAiDTeachServer() {
  const server = new McpServer({ name: "ai-d-teach", version: "0.1.0" });

  registerAppResource(server, "lesson-widget", WIDGET_URI, {}, async () => ({
    contents: [
      {
        uri: WIDGET_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: widgetHtml,
        _meta: {
          ui: {
            prefersBorder: true,
          },
        },
      },
    ],
  }));

  registerAppTool(
    server,
    "start_lesson",
    {
      title: "Start lesson",
      description:
        "Find or create an interactive AI D Teach lesson and render the lesson canvas in ChatGPT. Use this when the user wants their child to study a topic.",
      inputSchema: startLessonInputSchema,
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        "openai/outputTemplate": WIDGET_URI,
        "openai/toolInvocation/invoking": "Preparing lesson canvas...",
        "openai/toolInvocation/invoked": "Lesson canvas ready.",
      },
    },
    async (args) => {
      const topic = args?.topic?.trim?.() ?? "";

      if (!topic) {
        return {
          content: [{ type: "text", text: "Please provide a lesson topic." }],
          structuredContent: {},
        };
      }

      const lesson = findOrCreateLesson({
        topic,
        gradeLevel: args.gradeLevel,
        difficulty: args.difficulty,
      });

      return lessonPayload(
        lesson,
        `Started ${lesson.topic}. Use the canvas to explore the visual steps, and ask me questions in ChatGPT as you go.`,
      );
    },
  );

  registerAppTool(
    server,
    "record_quiz_answer",
    {
      title: "Record quiz answer",
      description: "Record a child's quiz answer for the current lesson.",
      inputSchema: recordQuizAnswerInputSchema,
      _meta: {
        "openai/toolInvocation/invoking": "Recording answer...",
        "openai/toolInvocation/invoked": "Answer recorded.",
      },
    },
    async (args) => {
      const lesson = lessons.get(args.lessonId);

      if (!lesson) {
        return {
          content: [{ type: "text", text: "Lesson not found." }],
          structuredContent: {},
        };
      }

      const question = lesson.quiz.find((candidate) => candidate.id === args.questionId);
      const progress = getProgress(lesson.id);

      progress.quizAttempts.push({
        questionId: args.questionId,
        selected: args.selected,
        correct: question?.answer === args.selected,
        answeredAt: new Date().toISOString(),
      });

      return lessonPayload(lesson, `Recorded the answer "${args.selected}".`);
    },
  );

  registerAppTool(
    server,
    "record_feedback",
    {
      title: "Record lesson feedback",
      description: "Save teacher, student, or improvement feedback for the current lesson.",
      inputSchema: recordFeedbackInputSchema,
      _meta: {
        "openai/toolInvocation/invoking": "Saving feedback...",
        "openai/toolInvocation/invoked": "Feedback saved.",
      },
    },
    async (args) => {
      const lesson = lessons.get(args.lessonId);

      if (!lesson) {
        return {
          content: [{ type: "text", text: "Lesson not found." }],
          structuredContent: {},
        };
      }

      const progress = getProgress(lesson.id);
      const note = `${new Date().toLocaleDateString()}: ${args.note.trim()}`;

      if (args.kind === "teacher") {
        progress.teacherNotes.push(note);
      } else if (args.kind === "student") {
        progress.studentNotes.push(note);
      } else {
        progress.improvementNotes.push(note);
      }

      return lessonPayload(lesson, `Saved ${args.kind} feedback for ${lesson.topic}.`);
    },
  );

  return server;
}

const port = Number(process.env.PORT ?? 8787);
const MCP_PATH = "/mcp";
const MCP_METHODS = new Set(["POST", "GET", "DELETE"]);

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res
      .writeHead(200, { "content-type": "text/plain" })
      .end(`AI D Teach MCP server is running. Connect ChatGPT to /mcp.`);
    return;
  }

  if (url.pathname === MCP_PATH && req.method && MCP_METHODS.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createAiDTeachServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, () => {
  console.log(`AI D Teach MCP server listening on http://localhost:${port}${MCP_PATH}`);
});

