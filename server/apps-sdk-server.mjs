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
                "You are AI D Teach, a warm voice-first tutor for a child. Sound bright, gentle, and playful, like an encouraging elementary teacher. Keep replies to one or two short spoken sentences. Use simple words and a little pep, but do not be loud or babyish. First answer the child's actual social or setup question naturally, including greetings, feelings, yes/no replies, what-to-do-next questions, and whether you can hear or talk to them; do not treat those as lesson answers. Then gently invite the child back to the lesson when it fits. Ask at most one question. Encourage canvas interaction before long explanations. Do not reveal quiz answers unless the child asks for help after trying. Return only the JSON object requested by the schema.",
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

function writeCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, mcp-session-id");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
}

function writeJson(res, statusCode, payload) {
  writeCorsHeaders(res);
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
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
      writeJson(res, 400, { error: "Missing tutor input." });
      return true;
    }

    try {
      const tutorTurn = await buildGptTutorTurn(body);
      writeJson(res, 200, {
        tutorTurn,
        source: "openai",
        model: process.env.OPENAI_TUTOR_MODEL ?? "gpt-5-mini",
      });
    } catch (error) {
      console.warn("OpenAI tutor unavailable; client can use local fallback.", error?.message ?? error);
      writeJson(res, 503, { error: "OpenAI tutor unavailable." });
    }

    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/lessons") {
    writeJson(res, 200, { lessons: await listLessons() });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/lessons") {
    const body = await readJsonBody(req);

    if (!body.lesson?.id) {
      writeJson(res, 400, { error: "Missing lesson." });
      return true;
    }

    const lesson = await saveLesson(body.lesson);
    writeJson(res, 200, { lesson, lessons: await listLessons() });
    return true;
  }

  if (url.pathname.startsWith("/api/progress/")) {
    const lessonId = decodeURIComponent(url.pathname.slice("/api/progress/".length));

    if (!lessonId) {
      writeJson(res, 400, { error: "Missing lesson id." });
      return true;
    }

    if (req.method === "GET") {
      writeJson(res, 200, { progress: await getProgress(lessonId) });
      return true;
    }

    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      const progress = await saveProgress({ ...body.progress, lessonId });
      writeJson(res, 200, { progress });
      return true;
    }
  }

  return false;
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

  if (req.method === "OPTIONS") {
    writeCorsHeaders(res);
    res.writeHead(204);
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
    if (url.pathname.startsWith("/api/") && (await handleApiRequest(req, res, url))) {
      return;
    }
  } catch (error) {
    console.error("Error handling API request:", error);
    writeJson(res, 500, { error: "Internal server error" });
    return;
  }

  if (url.pathname === MCP_PATH && req.method && MCP_METHODS.has(req.method)) {
    writeCorsHeaders(res);

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
