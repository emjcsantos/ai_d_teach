# Validation

Validation for AI D Teach should prove that the local-first lesson loop works: lessons can be saved, reused, narrated, played, quizzed, and improved without depending on a server or heavyweight local AI model.

## Required Baseline Check

Run at least one relevant check before finishing a task. For most code or configuration changes, use:

```powershell
npm.cmd run build
```

For local development smoke checks, start the app with:

```powershell
npm.cmd run dev
```

Use `npm.cmd` on Windows so the commands resolve consistently in PowerShell and agent environments.

For the ChatGPT App prototype, start the MCP server with:

```powershell
npm.cmd run chatgpt:app
```

When the MCP server is running, the standalone app should sync lessons and progress with the shared repository API. If the server is stopped, it should fall back to browser localStorage.

To test the optional GPT tutor brain, start the MCP server with:

```powershell
Copy-Item .env.example .env
notepad .env
npm.cmd run chatgpt:app
```

Set `OPENAI_API_KEY` in `.env`. If `OPENAI_API_KEY` is not configured, Tutor Chat should still work through the local fallback tutor.

## Fresh-State Smoke Expectations

Use a browser profile or localStorage state with no saved AI D Teach data.

Expected results:

- App starts without requiring API keys, Codex access, or local AI model setup.
- Sample lessons seed into the local lesson repository.
- A parent can choose a topic, grade level, and difficulty.
- If no reusable lesson exists, the local starter or import path can create structured lesson data.
- Lesson player can render structured steps and visual data.
- Narration text is visible even if audio is unavailable.
- Browser TTS works when `speechSynthesis` is supported.
- Tutor Chat can answer a typed question about the current lesson.
- Tutor Chat should show the child's submitted message immediately, then show a brief tutor thinking state while GPT or fallback tutoring prepares the answer.
- Tutor Chat should show an instant friendly bridge reply while the structured tutor/evaluation response is still loading.
- Tutor Chat should show warm listening and thinking states instead of raw system-like status text.
- Tutor Chat should answer greetings, "can you hear me", "can you see me", "are you AI", yes/no replies, frustration, what-to-do-next questions, and simple child check-ins naturally before redirecting back to lesson work.
- Tutor Chat should not mistake normal lesson words such as "this" for greetings such as "hi".
- Tutor Chat should offer a few reusable conversation starters for children who do not know what to type.
- Tutor Chat falls back to the local tutor when `/api/tutor` is unavailable or OpenAI is not configured.
- Quiz flow records attempts and explanations.
- Feedback Lab can save teacher, student, and improvement notes.
- Progress or completion state is saved separately from lesson content.

## Existing Saved-State Expectations

Use a browser state with existing values for:

- `ai-d-teach.lessons.v1`
- `ai-d-teach.progress.v1`

Expected results:

- Saved lessons load without being overwritten by bundled samples.
- Bundled sample lessons refresh by id when sample content changes, without deleting custom lessons or existing progress.
- Matching topic and grade searches reuse saved lessons before creating new ones.
- Existing progress remains attached to the correct lesson id.
- Existing tutor chat transcripts remain attached to the correct lesson id.
- Existing tutor understanding signals remain attached to the correct lesson id.
- Existing Activity Engine attempts remain attached to the correct lesson id.
- Existing feedback notes remain attached to the correct lesson id.
- Invalid or unreadable stored JSON falls back safely instead of crashing the app.
- Schema changes preserve backward compatibility through migrations or explicit fallback behavior.

## Shared Repository Expectations

When `npm.cmd run chatgpt:app` is running:

- `GET http://localhost:8787/api/lessons` returns saved lessons.
- `POST http://localhost:8787/api/lessons` saves or updates a lesson.
- `GET http://localhost:8787/api/progress/{lessonId}` returns normalized progress.
- `PUT http://localhost:8787/api/progress/{lessonId}` saves quiz attempts, chat transcripts, and feedback.
- `POST http://localhost:8787/api/tutor` returns an OpenAI tutor turn when `OPENAI_API_KEY` is configured, and returns unavailable when it is not.
- Restarting the MCP server does not erase saved lessons or progress.
- The standalone app still works if the server is unavailable.

## Lesson Schema Validation Expectations

Structured lesson data should be checked for:

- Supported `schemaVersion`.
- Required metadata fields.
- Valid `gradeLevel`, `difficulty`, `source`, and `status` values.
- At least one lesson step with narration.
- Supported visual kind and required visual fields.
- Quiz questions with choices, answer, and explanation.
- Safe, age-appropriate content before saving generated or imported lessons.

API generation, when added, must validate output before saving it to the repository.

## Voice And Accessibility Expectations

Voice validation should cover:

- Browser TTS available path.
- Browser TTS unavailable fallback.
- Teacher-task instructions stay visible without requiring manual Read controls.
- Browser TTS should prefer a friendly English voice when available, with a slower child-friendly rate and softer volume.
- Browser TTS should read common lesson symbols in child-friendly words, such as `1/4` as "one fourth" and `=` as "equals".
- Browser Speech Recognition available path.
- Browser Speech Recognition unavailable typed fallback.
- Browser Speech Recognition `network`, permission, and no-speech errors show child-readable fallback guidance instead of raw browser error codes.
- Push-to-talk starts only after a user action and stops after one utterance or explicit stop.
- Voice input should wait for a short silence window before sending so it does not cut off a child mid-thought.
- Stop or cancel behavior before starting a new tutor utterance.
- Visible narration text remaining available.
- Optional spoken Tutor Chat replies.
- Reasonable speaking rate controls when UI controls exist.
- No sound-only required workflow.

Speech input must remain push-to-talk and must not listen continuously by default.

## Ralph Loop Expectations

For progress and improvement changes, validate that:

- Quiz attempts are stored with selected answer, correctness, and timestamp.
- Activity Engine attempts are stored with step id, task id, task kind, response, correctness, and timestamp.
- Tutor understanding signals are stored with step id, mode, next action, and whether the child can continue.
- Teacher, student, and improvement notes are separate from canonical lesson data.
- Improved lesson content can become a new version.
- Older lesson versions remain identifiable for comparison or rollback when versioning support exists.
- Review recommendations can be traced back to missed concepts or feedback.

## ChatGPT App Validation

For the Apps SDK prototype:

- `npm.cmd run chatgpt:app` starts the MCP server.
- `GET http://localhost:8787/` returns a health message.
- `GET http://localhost:8787/api/lessons` returns durable repository data.
- The `/mcp` endpoint accepts MCP requests.
- `start_lesson` returns structured lesson data and the lesson widget template.
- The lesson widget can render lesson title, steps, visuals, and quiz choices.
- Widget quiz answers can call `record_quiz_answer`.

For ChatGPT testing, expose port `8787` with an HTTPS tunnel and add the `/mcp` URL as a connector in ChatGPT Developer Mode.

## Responsive And UI Smoke Expectations

For UI changes, check common laptop and tablet sizes. The app should:

- Keep controls readable.
- Keep Tutor Chat action buttons stable and full-width on smaller screens.
- Avoid text overlap.
- Open with the interactive lesson surface first on small screens.
- Keep the primary lesson clicks focused on the canvas, tutor conversation, and simple step navigation.
- For fractions, verify the first step asks only for 1/4, the formula step requires tapping the requested formula tokens, and later practice checks 2/4, 3/4, and 4/4 before Continue appears.
- Show Continue only after the tutor records solid understanding for the current step or the child completes the active instructor-led canvas task.
- Show current step guidance before Tutor Chat so the child sees the next learning action before asking open-ended questions.
- For Photosynthesis, verify teacher tasks require tapping sunlight, water, oxygen, and glucose before task completion.
- In student view, parent tools, feedback notes, and Ralph Loop diagnostics should remain hidden behind the Parent tools toggle.
- Completing any canvas task should show a reusable, topic-agnostic celebration moment without blocking the next action.
- Lesson progress should feel mission-like and topic-agnostic, with a visible progress meter that updates by step.
- Quiz completion should remain disabled until every answer is correct, and wrong answers should give a hint without revealing the answer.
- Keep lesson visuals usable on smaller screens.
- Keep quiz choices easy to select.
- Preserve visible narration and prompts while TTS controls are used.

## Reporting Skipped Validation

If a validation step cannot be run, record:

- The skipped check.
- Why it was skipped.
- Any known risk.
- The next check that should be run after integration.
