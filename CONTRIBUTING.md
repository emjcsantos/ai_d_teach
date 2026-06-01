# Contributing

Thanks for helping improve AI D Teach. This project is early, local-first, and especially sensitive to child safety and privacy.

## Good First Contributions

- Improve lesson clarity, scaffolding, or accessibility.
- Add reusable interactive canvas activities.
- Strengthen validation, tests, and security checks.
- Improve local setup and packaging.
- Document child-friendly UX patterns that make the tutor more useful.

## Local Setup

```powershell
npm.cmd install
npm.cmd run dev
```

Run checks before opening a pull request:

```powershell
npm.cmd run check
```

## Development Rules

- Keep `.env`, `data/*.json`, logs, build output, and personal lesson progress out of git.
- Do not send API keys or child conversation data to client-side code.
- Keep generated lessons structured and backward compatible when possible.
- Add docs when behavior changes.
- Prefer small pull requests with a clear validation note.

## Child Safety And Privacy

Contributions should keep the app parent-controlled, age-appropriate, and privacy-aware. Do not add always-on microphone behavior. Do not add analytics, remote storage, or cloud AI calls without clear opt-in documentation.

## Pull Request Checklist

- [ ] I ran `npm.cmd run check`.
- [ ] I updated docs for user-facing behavior changes.
- [ ] I avoided committing secrets, local data, logs, or build artifacts.
- [ ] I considered accessibility and child-friendly language.
- [ ] I described validation performed in the PR.
