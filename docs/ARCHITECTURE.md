# Architecture

AI D Teach is a local-first learning app. The default runtime path is browser based: React renders the learning experience, localStorage stores lessons and progress, and browser text-to-speech narrates lesson content.

## Core Principles

- Lessons are structured data, not loose prose.
- Saved lessons are checked before any new lesson is created.
- Canonical lesson content is separate from child progress.
- Browser TTS is the default voice layer.
- API generation is optional future work, not a required dependency.
- Saved lesson compatibility is protected with schema versions and migrations when formats change.

## Runtime Layers

### Lesson Schema

The schema version `1` lesson model includes:

- Identity and metadata: `id`, `schemaVersion`, `topic`, `gradeLevel`, `difficulty`, `createdAt`, `updatedAt`, `source`, `version`, and `status`.
- Teaching content: ordered `steps` with `title`, `narration`, optional `prompt`, and typed `visual` data.
- Assessment content: `quiz` questions with `prompt`, `choices`, `answer`, and `explanation`.

Current visual kinds are:

- `fraction_pizza`
- `word_cards`
- `science_cycle`
- `formula_board`

These are deliberately small and data-driven so the player can support early math, vocabulary, formulas, and simple science diagrams without custom code for every lesson.

### Shared Lesson Repository

The standalone app keeps browser localStorage as an offline fallback under `ai-d-teach.lessons.v1` and `ai-d-teach.progress.v1`.

When the MCP server is running, both the standalone app and ChatGPT App use the shared local JSON repository:

- `data/lessons.json`
- `data/progress.json`

These files are local user data and are ignored by Git.

Expected behavior:

1. Load saved lessons.
2. Seed bundled sample lessons if no saved lessons exist.
3. Search for a reusable lesson by normalized topic and grade level.
4. Save imported, starter, generated, or improved lessons back into the repository.
5. Preserve version and schema metadata so future migrations can be explicit.

The shared server also exposes lightweight REST endpoints so the browser app can reuse the same storage as the ChatGPT App:

- `GET /api/lessons`
- `POST /api/lessons`
- `GET /api/progress/:lessonId`
- `PUT /api/progress/:lessonId`

Local-first storage keeps the MVP usable without accounts, API keys, or local AI model setup.

### Progress And Ralph Loop Data

Progress is stored separately from canonical lesson data under `ai-d-teach.progress.v1`.

Progress can include:

- Current lesson step.
- Completion time.
- Quiz attempts.
- Teacher notes.
- Student notes.
- Improvement notes.
- Tutor chat transcript.

This separation supports the Ralph Loop: run, assess, listen, learn, patch, version, and reuse. Improved lessons should be saved as new versions rather than overwriting history without traceability.

The current Feedback Lab writes teacher, student, and improvement notes into the progress record for the selected lesson. This keeps tester feedback close to quiz attempts and completion state while preserving the saved lesson as reusable canonical content.

Tutor Chat writes student and tutor messages into the same progress record. The MVP response layer is local and deterministic: it uses the selected lesson, current step, quiz state, and message intent to answer. A future API-backed tutor should keep this transcript contract stable.

### Voice Layer

Browser text-to-speech is the default voice implementation. The current voice helper uses `speechSynthesis` when available and falls back to visible narration text when speech is unavailable.

Future voice improvements can add:

- Pause, resume, replay, mute, and speed controls.
- Narration highlighting.
- Cached audio assets.
- Higher-quality optional cloud or local TTS.
- Push-to-talk speech input if voice input is added.

Always keep visible lesson text available. The app should not require sound-only learning.

Tutor Chat replies can be spoken through browser TTS when the user toggles voice replies on. Text conversation remains the primary path.

### Optional Lesson Generation

API lesson generation is outside the default MVP dependency path. When added, it should:

- Accept topic, grade level, difficulty, length, and tone inputs.
- Return strict structured lesson data.
- Validate schema and safety before saving.
- Repair or reject invalid output.
- Save valid generated lessons automatically.
- Avoid assuming Codex subscription access as the app backend.

Manual import and local starter lessons should remain available even when API generation exists.

## MVP Flow

1. Parent chooses a topic, grade level, and difficulty.
2. App checks the local repository for a matching saved lesson.
3. If found, the saved lesson is reused.
4. If not found, the app creates or imports a structured lesson locally. Optional API generation can be added later.
5. Lesson player renders steps, visuals, narration, prompts, and quiz questions.
6. Browser TTS narrates while visible text remains available.
7. Tutor Chat can answer lesson-aware questions and save the transcript.
8. Quiz attempts, notes, and progress are saved separately.
9. Feedback and results feed the Ralph Loop for future lesson versions.

## Current Prototype Boundaries

The current prototype scope is intentionally narrow:

- Local browser storage, not cloud sync.
- Schema version `1`, not a full migration framework yet.
- Sample and starter lesson content, not required API generation.
- Basic typed visuals, not a complete canvas component library.
- Browser TTS, not cached premium audio.
- Lightweight progress and notes, not a full analytics system.

These boundaries keep the MVP easy to run on Windows and leave clear upgrade points for future agents.

## ChatGPT App Architecture

The ChatGPT App prototype uses the Apps SDK pattern:

- ChatGPT is the conversational tutor.
- `server/apps-sdk-server.mjs` exposes an MCP endpoint at `/mcp`.
- `public/lesson-widget.html` renders the interactive lesson canvas inside ChatGPT.
- `start_lesson` returns structured lesson data and attaches the widget template.
- Widget actions can call MCP tools such as `record_quiz_answer`.

The prototype server keeps lesson and progress state in local JSON files. Production use should still add authentication, backups, and a stronger storage layer such as SQLite.
