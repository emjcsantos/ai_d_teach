# Security Policy

## Supported Versions

AI D Teach is an early prototype. Security fixes are applied to `main`.

## Reporting A Vulnerability

Please do not open public issues for vulnerabilities, leaked secrets, or private learner data. Use GitHub private vulnerability reporting if available, or contact the maintainer through GitHub before public disclosure.

Helpful reports include:

- Affected commit or version.
- Steps to reproduce.
- Impact.
- Whether an API key, learner record, or local data file may be exposed.

## Safe Sharing Checklist

AI D Teach is a local-first prototype. Before sharing a fork, branch, or release:

- Keep `.env`, `data/*.json`, `dist/`, `node_modules/`, build info, and logs out of git.
- Rotate any API key that was ever copied into a shared chat, screenshot, terminal recording, or public issue.
- Run `npm.cmd audit --omit=dev --audit-level=moderate` and fix reported vulnerabilities.
- Run a secret scan before pushing shared branches.
- Do not expose port `8787` publicly without `AI_D_TEACH_SERVER_TOKEN`.

The repository server binds to `127.0.0.1` by default. Public or tunneled `/api/*` and `/mcp` requests require `Authorization: Bearer <AI_D_TEACH_SERVER_TOKEN>` unless `AI_D_TEACH_ALLOW_PUBLIC_NO_AUTH=1` is deliberately set for disposable testing.
