# Context Packs

Use these files to start focused development or testing chats without carrying the entire project conversation into every thread.

Each context pack contains:

- The agent's purpose.
- The scope it owns.
- Requirements it must preserve.
- Expected outputs.
- A starter prompt for a fresh chat.

## Recommended Chat Split

- `00-shared-project-context.md`: baseline product context for all chats.
- `product-roadmap.md`: product management and continuous development.
- `lesson-schema-repository.md`: lesson schema, saved lesson storage, and versioning.
- `ai-lesson-generation.md`: AI lesson generation and structured output.
- `interactive-canvas.md`: graphics, animations, formulas, diagrams, and interactions.
- `voice-tts.md`: narration, browser TTS, optional cached audio, and future speech input.
- `frontend-ux.md`: parent flow, lesson player shell, lesson library, and visual polish.
- `progress-ralph-loop.md`: progress tracking, personalization, and continuous improvement.
- `teacher-tester.md`: educator-style testing and instructional feedback.
- `student-tester.md`: child-user testing and engagement feedback.
- `qa-validation.md`: automated and manual validation.
- `accessibility-safety.md`: child safety, accessibility, and inclusive learning.
- `devops-packaging.md`: setup, scripts, build, and local environment.

## Usage Rule

For any new focused chat, include `00-shared-project-context.md` plus the one context pack that matches the task.

