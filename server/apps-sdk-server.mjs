import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import dotenv from "dotenv";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import {
  findOrCreateLesson,
  getLesson,
  getProgress,
  listLessons,
  recordFeedback,
  recordQuizAnswer,
  saveLesson,
  saveProgress,
} from "./lessonStore.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });
const WIDGET_URI = "ui://widget/lesson.html";
const widgetHtml = readFileSync(resolve(__dirname, "../public/lesson-widget.html"), "utf8");
const port = Number(process.env.PORT ?? 8787);
const host = process.env.AI_D_TEACH_HOST ?? "127.0.0.1";
const MCP_PATH = "/mcp";
const MCP_METHODS = new Set(["POST", "GET", "DELETE"]);
const serverToken = process.env.AI_D_TEACH_SERVER_TOKEN?.trim() ?? "";
const allowPublicNoAuth = process.env.AI_D_TEACH_ALLOW_PUBLIC_NO_AUTH === "1";
const maxJsonBodyBytes = Math.max(
  1024,
  Number(process.env.AI_D_TEACH_MAX_JSON_BODY_BYTES ?? 1_000_000) || 1_000_000,
);
const allowedOrigins = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
  ...parseAllowedOrigins(process.env.AI_D_TEACH_ALLOWED_ORIGINS),
]);

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

const TUTOR_TURN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    mode: { enum: ["explain", "hint", "check", "encourage", "advance"] },
    understanding: { enum: ["not_checked", "emerging", "solid"] },
    nextAction: { enum: ["answer", "try_canvas", "continue", "review", "quiz"] },
    canContinue: { type: "boolean" },
  },
  required: ["reply", "mode", "understanding", "nextAction", "canContinue"],
};

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function parseAllowedOrigins(value = "") {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return origin.replace(/\/$/, "");
      }
    });
}

function getHeader(req, name) {
  const value = req.headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getRequestHostname(req) {
  const hostHeader = getHeader(req, "host").trim().toLowerCase();

  if (!hostHeader) {
    return "";
  }

  if (hostHeader.startsWith("[")) {
    const closeIndex = hostHeader.indexOf("]");
    return closeIndex >= 0 ? hostHeader.slice(1, closeIndex) : hostHeader;
  }

  return hostHeader.split(":")[0];
}

function isLoopbackHostname(hostname) {
  const normalized = hostname.replace(/\.$/, "").toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost")
  );
}

function getRequestOrigin(req) {
  return getHeader(req, "origin").trim();
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  try {
    const parsed = new URL(origin);
    return allowedOrigins.has(parsed.origin) || isLoopbackHostname(parsed.hostname);
  } catch {
    return false;
  }
}

function hasValidServerToken(req) {
  if (!serverToken) {
    return false;
  }

  const authorization = getHeader(req, "authorization").trim();
  const headerToken = getHeader(req, "x-ai-d-teach-token").trim();

  return authorization === `Bearer ${serverToken}` || headerToken === serverToken;
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === "string") {
    return payload.output_text;
  }

  const textParts = [];

  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === "string") {
        textParts.push(content.text);
      }
    }
  }

  return textParts.join("\n").trim();
}

function normalizeTutorTurn(value) {
  const parsed = z
    .object({
      reply: z.string().min(1),
      mode: z.enum(["explain", "hint", "check", "encourage", "advance"]),
      understanding: z.enum(["not_checked", "emerging", "solid"]),
      nextAction: z.enum(["answer", "try_canvas", "continue", "review", "quiz"]),
      canContinue: z.boolean(),
    })
    .safeParse(value);

  if (!parsed.success) {
    throw new Error("Invalid tutor turn returned by model.");
  }

  return {
    ...parsed.data,
    canContinue: parsed.data.nextAction === "continue" && parsed.data.understanding === "solid",
  };
}

function summarizeCurrentStep(step) {
  const taskSummary = (step.teacherTasks ?? [])
    .map((task) => `${task.kind}: ${task.instruction}`)
    .join(" | ");

  return {
    id: step.id,
    title: step.title,
    narration: step.narration,
    prompt: step.prompt,
    visual: step.visual,
    teacherTasks: taskSummary,
  };
}

async function buildGptTutorTurn({ lesson, currentStep, message, progress }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const model = process.env.OPENAI_TUTOR_MODEL ?? "gpt-5-mini";
  const recentMessages = (progress.chatMessages ?? []).slice(-8).map((entry) => ({
    role: entry.role,
    text: entry.text,
  }));
  const recentActivity = (progress.activityAttempts ?? []).slice(-8).map((attempt) => ({
    stepId: attempt.stepId,
    taskId: attempt.taskId,
    response: attempt.response,
    correct: attempt.correct,
  }));

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_output_tokens: 260,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are AI D Teach, a warm voice-first tutor for a child. Sound bright, gentle, and playful, like an encouraging elementary teacher. Keep replies to one or two short spoken sentences. Use simple words and a little pep, but do not be loud or babyish. First answer the child's actual social or setup question naturally, including greetings, feelings, frustration, yes/no replies, what-to-do-next questions, whether you can hear/talk/see them, and whether you are AI; do not treat those as lesson answers. Then gently invite the child back to the lesson when it fits. Ask at most one question. Encourage canvas interaction before long explanations. Do not reveal quiz answers unless the child asks for help after trying. Return only the JSON object requested by the schema.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                lesson: {
                  id: lesson.id,
                  topic: lesson.topic,
                  gradeLevel: lesson.gradeLevel,
                  summary: lesson.summary,
                },
                currentStep: summarizeCurrentStep(currentStep),
                childMessage: message,
                recentMessages,
                recentActivity,
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "tutor_turn",
          schema: TUTOR_TURN_SCHEMA,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI tutor request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const outputText = extractResponseText(payload);

  return normalizeTutorTurn(JSON.parse(outputText));
}

function writeCorsHeaders(req, res) {
  const origin = getRequestOrigin(req);

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", new URL(origin).origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, content-type, mcp-session-id, x-ai-d-teach-token",
  );
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
}

function writeJson(req, res, statusCode, payload) {
  writeCorsHeaders(req, res);
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

function authorizeRequest(req, res) {
  if (!isAllowedOrigin(getRequestOrigin(req))) {
    writeJson(req, res, 403, { error: "Origin is not allowed." });
    return false;
  }

  if (isLoopbackHostname(getRequestHostname(req))) {
    return true;
  }

  if (!serverToken && !allowPublicNoAuth) {
    writeJson(req, res, 403, {
      error: "Public access requires AI_D_TEACH_SERVER_TOKEN.",
    });
    return false;
  }

  if (serverToken && !hasValidServerToken(req)) {
    writeJson(req, res, 401, { error: "Missing or invalid AI D Teach server token." });
    return false;
  }

  return true;
}

async function readJsonBody(req) {
  const contentLength = Number(getHeader(req, "content-length") || 0);

  if (contentLength > maxJsonBodyBytes) {
    throw new HttpError(413, `JSON body must be ${maxJsonBodyBytes} bytes or less.`);
  }

  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;

    if (totalBytes > maxJsonBodyBytes) {
      throw new HttpError(413, `JSON body must be ${maxJsonBodyBytes} bytes or less.`);
    }

    chunks.push(buffer);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new HttpError(400, "Invalid JSON body.");
  }
}

async function lessonPayload(lesson, message) {
  return {
    content: [{ type: "text", text: message }],
    structuredContent: {
      lesson,
      progress: await getProgress(lesson.id),
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

      const lesson = await findOrCreateLesson({
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
      const lesson = await getLesson(args.lessonId);

      if (!lesson) {
        return {
          content: [{ type: "text", text: "Lesson not found." }],
          structuredContent: {},
        };
      }

      await recordQuizAnswer(args);
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
      const lesson = await getLesson(args.lessonId);

      if (!lesson) {
        return {
          content: [{ type: "text", text: "Lesson not found." }],
          structuredContent: {},
        };
      }

      await recordFeedback(args);
      return lessonPayload(lesson, `Saved ${args.kind} feedback for ${lesson.topic}.`);
    },
  );

  return server;
}

async function handleApiRequest(req, res, url) {
  if (req.method === "POST" && url.pathname === "/api/tutor") {
    const body = await readJsonBody(req);

    if (!body.lesson?.id || !body.currentStep?.id || typeof body.message !== "string") {
      writeJson(req, res, 400, { error: "Missing tutor input." });
      return true;
    }

    try {
      const tutorTurn = await buildGptTutorTurn(body);
      writeJson(req, res, 200, {
        tutorTurn,
        source: "openai",
        model: process.env.OPENAI_TUTOR_MODEL ?? "gpt-5-mini",
      });
    } catch (error) {
      console.warn("OpenAI tutor unavailable; client can use local fallback.", error?.message ?? error);
      writeJson(req, res, 503, { error: "OpenAI tutor unavailable." });
    }

    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/lessons") {
    writeJson(req, res, 200, { lessons: await listLessons() });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/lessons") {
    const body = await readJsonBody(req);

    if (!body.lesson?.id) {
      writeJson(req, res, 400, { error: "Missing lesson." });
      return true;
    }

    const lesson = await saveLesson(body.lesson);
    writeJson(req, res, 200, { lesson, lessons: await listLessons() });
    return true;
  }

  if (url.pathname.startsWith("/api/progress/")) {
    const lessonId = decodeURIComponent(url.pathname.slice("/api/progress/".length));

    if (!lessonId) {
      writeJson(req, res, 400, { error: "Missing lesson id." });
      return true;
    }

    if (req.method === "GET") {
      writeJson(req, res, 200, { progress: await getProgress(lessonId) });
      return true;
    }

    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      const progress = await saveProgress({ ...body.progress, lessonId });
      writeJson(req, res, 200, { progress });
      return true;
    }
  }

  return false;
}

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS") {
    writeCorsHeaders(req, res);
    res.writeHead(isAllowedOrigin(getRequestOrigin(req)) ? 204 : 403);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res
      .writeHead(200, { "content-type": "text/plain" })
      .end(`AI D Teach MCP server is running. Connect ChatGPT to /mcp.`);
    return;
  }

  try {
    if (url.pathname.startsWith("/api/")) {
      if (!authorizeRequest(req, res)) {
        return;
      }

      if (await handleApiRequest(req, res, url)) {
        return;
      }
    }
  } catch (error) {
    if (error instanceof HttpError) {
      writeJson(req, res, error.statusCode, { error: error.message });
      return;
    }

    console.error("Error handling API request:", error);
    writeJson(req, res, 500, { error: "Internal server error" });
    return;
  }

  if (url.pathname === MCP_PATH && req.method && MCP_METHODS.has(req.method)) {
    if (!authorizeRequest(req, res)) {
      return;
    }

    writeCorsHeaders(req, res);

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
        writeCorsHeaders(req, res);
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, host, () => {
  console.log(`AI D Teach MCP server listening on http://${host}:${port}${MCP_PATH}`);

  if (!isLoopbackHostname(host)) {
    console.warn("AI D Teach is listening on a non-loopback host. Use AI_D_TEACH_SERVER_TOKEN before exposing it.");
  }
});
