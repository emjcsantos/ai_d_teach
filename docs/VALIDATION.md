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
- Quiz flow records attempts and explanations.
- Feedback Lab can save teacher, student, and improvement notes.
- Progress or completion state is saved separately from lesson content.

## Existing Saved-State Expectations

Use a browser state with existing values for:

- `ai-d-teach.lessons.v1`
- `ai-d-teach.progress.v1`

Expected results:

- Saved lessons load without being overwritten by bundled samples.
- Matching topic and grade searches reuse saved lessons before creating new ones.
- Existing progress remains attached to the correct lesson id.
- Existing feedback notes remain attached to the correct lesson id.
- Invalid or unreadable stored JSON falls back safely instead of crashing the app.
- Schema changes preserve backward compatibility through migrations or explicit fallback behavior.

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
- Stop or cancel behavior before starting a new utterance.
- Visible narration text remaining available.
- Reasonable speaking rate controls when UI controls exist.
- No sound-only required workflow.

If speech input is added later, it should be push-to-talk and must not listen continuously by default.

## Ralph Loop Expectations

For progress and improvement changes, validate that:

- Quiz attempts are stored with selected answer, correctness, and timestamp.
- Teacher, student, and improvement notes are separate from canonical lesson data.
- Improved lesson content can become a new version.
- Older lesson versions remain identifiable for comparison or rollback when versioning support exists.
- Review recommendations can be traced back to missed concepts or feedback.

## Responsive And UI Smoke Expectations

For UI changes, check common laptop and tablet sizes. The app should:

- Keep controls readable.
- Avoid text overlap.
- Keep lesson visuals usable on smaller screens.
- Keep quiz choices easy to select.
- Preserve visible narration and prompts while TTS controls are used.

## Reporting Skipped Validation

If a validation step cannot be run, record:

- The skipped check.
- Why it was skipped.
- Any known risk.
- The next check that should be run after integration.
