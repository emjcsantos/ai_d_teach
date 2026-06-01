# Codex For Open Source Application Notes

These notes summarize why AI D Teach is a candidate open-source project and how Codex/API credits would be used.

## Maintainer Role

`@emjcsantos` is the primary maintainer and owns product direction, implementation, issue triage, security hygiene, and release readiness.

## Why The Project Matters

AI D Teach explores local-first AI tutoring for families and educators. The project focuses on reusable structured lessons, child-friendly voice interaction, interactive canvases, privacy-preserving local storage, and optional server-side AI integrations. This is important because many AI tutoring prototypes are chat-only, cloud-first, or difficult for parents and teachers to inspect, reuse, and improve.

## Current State

- Public Vite/React prototype with a local lesson repository.
- Interactive canvas activities for fractions, formulas, vocabulary, and simple science cycles.
- Browser speech input/output with local fallback behavior.
- Optional server-side OpenAI tutor brain with API keys kept out of the browser.
- ChatGPT Apps SDK prototype for rendering lesson canvases inside ChatGPT.
- Security hardening for public/tunneled server access.
- OSS docs, contribution workflow, CI, Dependabot, and issue templates.

## How Codex And API Credits Would Help

- Review pull requests for child-safety, privacy, accessibility, and maintainability.
- Generate and validate structured lesson packs for multiple topics.
- Build automated UI and lesson-quality checks.
- Maintain release notes, documentation, and issue triage.
- Improve the server-side tutor and lesson-generation workflow without exposing API keys to the browser.

## Current Limitation

The repository is early and does not yet have broad adoption metrics. The strongest application angle is ecosystem importance and the maintainability burden of building safe, inspectable, local-first AI education tools.
