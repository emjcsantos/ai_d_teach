# AI D Teach

[![CI](https://github.com/emjcsantos/ai_d_teach/actions/workflows/ci.yml/badge.svg)](https://github.com/emjcsantos/ai_d_teach/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Security Policy](https://img.shields.io/badge/security-policy-blue.svg)](SECURITY.md)

AI D Teach is a local-first interactive study companion for a child studying with parent support. A parent chooses a topic, grade level, and difficulty, then the app teaches through structured lesson steps, narration, visuals, short prompts, quizzes, and progress notes.

The MVP is intentionally not a generic chat app or worksheet generator. Its core job is to reuse saved lessons, render them as interactive learning experiences, and improve them over time through the Ralph Loop.

AI D Teach is open source because families, teachers, and developers should be able to inspect how an AI learning tool stores data, prompts children, handles voice, and improves lessons over time. The project favors local-first defaults, optional server-side AI, and reusable lesson data over opaque cloud-only tutoring.

## Project Status

AI D Teach is an early prototype. The current goal is to make the core learning loop solid: choose a topic, reuse or create a lesson, interact with the canvas, talk with the tutor, save progress, and improve lessons through feedback.

The project is ready for design, accessibility, education, and engineering feedback. See [ROADMAP.md](ROADMAP.md), [CONTRIBUTING.md](CONTRIBUTING.md), and [docs/OSS_APPLICATION.md](docs/OSS_APPLICATION.md).

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
- Child-facing lesson player with a mission header, read-only step path, instructor-led canvas tasks, coach prompts, and a tutor-led or task-led Continue flow.
- Default student view that keeps parent tools and feedback panels tucked away behind a Parent tools toggle.
- Browser TTS narration with visible lesson text.
- Embedded Tutor Chat for lesson-aware conversation with push-to-talk input and spoken replies when browser voice APIs are available.
- Optional OpenAI API tutor brain through the local repository server, with the local rule-based tutor as fallback.
- Tutor modes and saved tutor signals for explanation, hints, understanding checks, encouragement, and step advancement.
- Richer interactive visual scene types for fractions, vocabulary, formulas, and simple science cycles.
- Activity Engine v1 teacher tasks for fraction counts, formula tokens, word cards, and science cycle nodes.
- Fraction canvas practice that starts with 1/4, teaches the formula parts, then asks the child to build harder targets such as 2/4, 3/4, and 4/4.
- Photosynthesis practice that asks the child to identify sunlight, inputs, outputs, and vocabulary through canvas actions.
- Teacher-task instructions stay visible and can be spoken through the browser voice layer.
- Quiz flow with retry-friendly hints and completion only after all answers are correct.
- Feedback Lab for teacher, student, and improvement notes.
- Smoke validation for fresh and existing saved state.

## Shared Lesson Repository

Lessons are stored in the browser using `localStorage` under `ai-d-teach.lessons.v1`. Progress is stored separately under `ai-d-teach.progress.v1` so canonical lesson content can evolve without overwriting quiz attempts, notes, or completion state.

When the ChatGPT App MCP server is running, the standalone app also syncs to the shared JSON-backed repository at `http://127.0.0.1:8787`. That shared repository stores lessons in `data/lessons.json` and progress in `data/progress.json`. Those data files are ignored by Git because they are local user data. Bundled sample lessons refresh by id when the app changes, while custom lessons and progress remain preserved.

If the shared server is not available, the standalone app falls back to browser `localStorage` automatically.

The Feedback Lab saves teacher notes, student experience notes, and improvement notes into the progress record for the active lesson. These notes feed the Ralph Loop without changing the canonical lesson content directly.

Tutor Chat messages, tutor understanding signals, and Activity Engine task attempts are also saved in progress. The app can use an OpenAI API tutor brain when `OPENAI_API_KEY` is configured on the local repository server. If the key is missing or the API request fails, the local lesson-aware tutor brain answers instead, so conversation still works offline from API billing.

On fresh state, the repository seeds bundled sample lessons. When a parent asks for a topic, the app should check the saved repository first and reuse a matching lesson before creating, importing, or eventually requesting a new generated lesson.

## Structured Lesson Schema

Lessons use schema version `1` and include metadata such as `id`, `topic`, `gradeLevel`, `difficulty`, `source`, `status`, `version`, timestamps, `steps`, and `quiz`. Lesson steps carry narration, optional prompts, and typed visual data. Quiz questions carry choices, the correct answer, and an explanation.

Lesson steps can also declare `teacherTasks`, which are checked by the canvas before Continue unlocks. Activity Engine v1 supports:

- `select_fraction_count`
- `tap_formula_token`
- `tap_word_card`
- `tap_cycle_node`

Schema compatibility matters. Future schema changes should add migrations or compatibility adapters instead of breaking saved lessons silently.

## Voice And Generation Defaults

Browser text-to-speech is the default narration implementation through the Web Speech API. Push-to-talk speech input uses the browser Speech Recognition API when available and falls back to typed input when unavailable. Higher-quality cloud or local voices can be added later, but they must remain optional and should cache generated audio per lesson when used. Tutor Chat can speak replies through the same browser voice layer.

API-based lesson generation is also optional future work. When added, it should produce validated structured lesson data, reject or repair invalid output before saving, and never assume Codex is available as the runtime backend.

The GPT tutor integration uses the OpenAI Responses API from `server/apps-sdk-server.mjs`; the API key stays server-side and is never sent to the browser. Configure it in a local `.env` file before starting the repository server:

```powershell
Copy-Item .env.example .env
notepad .env
npm.cmd run chatgpt:app
```

Set `OPENAI_API_KEY` in `.env`. The default tutor model is `gpt-5-mini`.

The standalone app at `http://127.0.0.1:5173` sends tutor messages to `http://127.0.0.1:8787/api/tutor` and falls back locally if that endpoint is unavailable.

By default, the repository server binds to `127.0.0.1`, accepts only loopback browser origins, and keeps public tunnel access locked unless `AI_D_TEACH_SERVER_TOKEN` is configured. If you expose port `8787` with ngrok or another tunnel, set a strong `AI_D_TEACH_SERVER_TOKEN` in `.env` and configure the connector to send it as a Bearer token. Do not expose the server publicly with `AI_D_TEACH_ALLOW_PUBLIC_NO_AUTH=1` unless you are using a disposable data directory and no API key.

## Ralph Loop

Continuous improvement follows the Ralph Loop:

1. Run the lesson.
2. Assess quiz results and interaction signals.
3. Listen to tutor understanding signals, parent notes, teacher notes, and student feedback.
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
npm.cmd run check
npm.cmd run chatgpt:app
npm.cmd run preview
```

`npm.cmd run dev` starts the local Vite development server. `npm.cmd run build` runs TypeScript build checks and creates the production bundle. `npm.cmd run check` runs build plus production dependency audit. `npm.cmd run chatgpt:app` starts the ChatGPT Apps SDK MCP prototype server and shared repository API. `npm.cmd run preview` serves the built app locally.

## ChatGPT App Prototype

The repo includes a first Apps SDK prototype so ChatGPT can act as the tutor brain while AI D Teach renders the interactive lesson canvas as a ChatGPT component.

See [docs/CHATGPT_APP.md](docs/CHATGPT_APP.md) for setup and connector instructions.

## Validation

Before finishing behavior changes, run at least one relevant check such as:

```powershell
npm.cmd run build
```

For UI, repository, schema, or voice changes, also use the smoke expectations in [docs/VALIDATION.md](docs/VALIDATION.md), including fresh-state and existing saved-state checks where practical.

## Open Source Maintenance

- [CONTRIBUTING.md](CONTRIBUTING.md) explains local setup, contribution expectations, and child-safety rules.
- [SECURITY.md](SECURITY.md) explains how to avoid leaking secrets or local learner data.
- [ROADMAP.md](ROADMAP.md) tracks near-term and longer-term work.
- [MAINTAINERS.md](MAINTAINERS.md) lists maintainer responsibilities.
- [CHANGELOG.md](CHANGELOG.md) records notable changes.

## License

AI D Teach is available under the [MIT License](LICENSE).
