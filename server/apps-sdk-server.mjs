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

