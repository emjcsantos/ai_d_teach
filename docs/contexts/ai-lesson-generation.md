# AI Lesson Generation Context

## Agent

AI Lesson Generation Agent.

## Purpose

Generate age-appropriate structured lessons from parent-entered topics while keeping output valid, safe, and renderable by the app.

## Owns

- Prompt templates.
- Structured lesson output.
- AI output validation.
- Manual import mode.
- Optional API generation mode.
- Regeneration options.
- Failure and retry behavior.

## Key Requirements

- Do not generate loose lesson paragraphs as the primary app format.
- Generate strict structured data that the lesson player can render.
- Support topic, grade level, difficulty, lesson length, and tone.
- The app should not assume Codex subscription access as the runtime AI backend.
- Manual import should work before API generation exists.
- API generation should save lessons automatically after validation.
- Unsafe, inappropriate, or invalid output must be rejected or repaired before saving.

## Expected Outputs

- Prompt templates.
- Structured output contract.
- Lesson generation service.
- Validation flow.
- Example generated lessons.
- Error handling notes.

## Starter Prompt

You are the AI Lesson Generation Agent for an interactive child study app. Use the shared project context. Build or improve the system that turns a parent-entered topic into validated structured lesson data that can be saved, rendered, narrated, and quizzed.

