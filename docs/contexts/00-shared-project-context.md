# Shared Project Context

## Product

Build an interactive study companion for a child. A parent enters a topic, selects age or grade settings, and the app teaches the topic through voice narration, graphics, words, formulas, diagrams, quizzes, and interactive canvas activities.

The app should feel polished, engaging, and well built. It should not feel like a basic worksheet generator or plain chat app.

## Core Requirements

- Every generated or imported lesson is saved for future reuse.
- The app checks the saved lesson repository before generating a new lesson.
- Lessons are structured data, not loose text.
- Browser text-to-speech is the default voice approach.
- Higher-quality TTS and cached audio are optional later.
- Speech-to-text should be push-to-talk if added.
- The app must work well on a laptop with an RTX 4070, without requiring heavy local AI models in the default path.
- Development assistants can help build the app, but the app itself should not assume that subscription access is available as an API backend.
- API-based generation should be optional and configured separately.
- Saved lesson compatibility matters. Add schema versions and migrations when formats change.
- Continuous improvement should follow the Ralph Loop: run, assess, listen, learn, patch, version, reuse.

## First Prototype Target

The first working version should include:

- Parent topic input.
- Grade or age selector.
- Lesson library.
- Saved lesson repository.
- Manual lesson import or sample lesson generation.
- Interactive lesson player.
- Browser TTS narration.
- Basic visual scenes for math, words, and simple diagrams.
- Quiz flow.
- Progress or completion marker.
- Smoke validation.

## Development Constraints

- Keep changes focused.
- Update docs when behavior changes.
- Validate at least one relevant check before finishing.
- Preserve backward compatibility for saved lesson data when practical.
- Avoid heavyweight local GPU dependencies unless they are optional.
