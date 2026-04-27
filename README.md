# AI D Teach

AI D Teach is a local-first interactive study companion for a child studying with parent support. A parent chooses a topic, grade level, and difficulty, then the app teaches through structured lesson steps, narration, visuals, short prompts, quizzes, and progress notes.

The MVP is intentionally not a generic chat app or worksheet generator. Its core job is to reuse saved lessons, render them as interactive learning experiences, and improve them over time through the Ralph Loop.

## MVP Purpose

- Keep lessons reusable by saving every generated, imported, or starter lesson.
- Treat lessons as structured data that the app can render, narrate, quiz, validate, and version.
- Run locally first on a Windows laptop without requiring a Codex subscription, heavyweight local AI model, or GPU setup.
- Use browser text-to-speech as the default narration path.
- Leave API-based lesson generation optional and separately configured for a later phase.

## Current Prototype Scope

The current prototype scope is a Vite and React app with local lesson storage, sample lesson data, starter lesson creation, browser TTS helpers, progress tracking, and the first lesson schema. The first working UI target includes:

- Parent topic input.
- Grade and difficulty controls.
- Saved lesson library.
- Local lesson repository reuse before creating a new lesson.
- Manual import or local starter lesson creation before optional API generation.
- Interactive lesson player for structured steps.
- Browser TTS narration with visible lesson text.
- Tutor Chat for lesson-aware conversation and optional spoken replies.
- Basic visual scene types for math, vocabulary, formulas, and simple science diagrams.
- Quiz flow and completion or progress markers.
- Feedback Lab for teacher, student, and improvement notes.
- Smoke validation for fresh and existing saved state.

## Local-First Lesson Repository

Lessons are stored in the browser using `localStorage` under `ai-d-teach.lessons.v1`. Progress is stored separately under `ai-d-teach.progress.v1` so canonical lesson content can evolve without overwriting quiz attempts, notes, or completion state.

The Feedback Lab saves teacher notes, student experience notes, and improvement notes into the progress record for the active lesson. These notes feed the Ralph Loop without changing the canonical lesson content directly.

Tutor Chat messages are also saved in progress. The current MVP uses a local lesson-aware tutor brain, so conversation works without an API key. A future API tutor can replace the response logic while keeping the same saved transcript shape.

On fresh state, the repository seeds bundled sample lessons. When a parent asks for a topic, the app should check the saved repository first and reuse a matching lesson before creating, importing, or eventually requesting a new generated lesson.

## Structured Lesson Schema

Lessons use schema version `1` and include metadata such as `id`, `topic`, `gradeLevel`, `difficulty`, `source`, `status`, `version`, timestamps, `steps`, and `quiz`. Lesson steps carry narration, optional prompts, and typed visual data. Quiz questions carry choices, the correct answer, and an explanation.

Schema compatibility matters. Future schema changes should add migrations or compatibility adapters instead of breaking saved lessons silently.

## Voice And Generation Defaults

Browser text-to-speech is the default narration implementation through the Web Speech API. Higher-quality cloud or local voices can be added later, but they must remain optional and should cache generated audio per lesson when used. Tutor Chat can optionally speak its replies through the same browser voice layer.

API-based lesson generation is also optional future work. When added, it should produce validated structured lesson data, reject or repair invalid output before saving, and never assume Codex is available as the runtime backend.

## Ralph Loop

Continuous improvement follows the Ralph Loop:

1. Run the lesson.
2. Assess quiz results and interaction signals.
3. Listen to parent, teacher, and student feedback.
4. Learn which concepts need improvement.
5. Patch the lesson.
6. Version the improved lesson.
7. Reuse the best available lesson next time.

## Setup On Windows

Run commands from the project root:

```powershell
npm.cmd install
npm.cmd run dev
```

Useful scripts:

```powershell
npm.cmd run build
npm.cmd run chatgpt:app
npm.cmd run preview
```

`npm.cmd run dev` starts the local Vite development server. `npm.cmd run build` runs TypeScript build checks and creates the production bundle. `npm.cmd run chatgpt:app` starts the ChatGPT Apps SDK MCP prototype server. `npm.cmd run preview` serves the built app locally.

## ChatGPT App Prototype

The repo includes a first Apps SDK prototype so ChatGPT can act as the tutor brain while AI D Teach renders the interactive lesson canvas as a ChatGPT component.

See [docs/CHATGPT_APP.md](docs/CHATGPT_APP.md) for setup and connector instructions.

## Validation

Before finishing behavior changes, run at least one relevant check such as:

```powershell
npm.cmd run build
```

For UI, repository, schema, or voice changes, also use the smoke expectations in [docs/VALIDATION.md](docs/VALIDATION.md), including fresh-state and existing saved-state checks where practical.
