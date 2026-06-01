# Security Notes

AI D Teach is a local-first prototype. Before making a fork, branch, or release public:

- Keep `.env`, `data/*.json`, `dist/`, `node_modules/`, build info, and logs out of git.
- Rotate any API key that was ever copied into a shared chat, screenshot, terminal recording, or public issue.
- Run `npm.cmd audit --omit=dev --audit-level=moderate` and fix reported vulnerabilities.
- Run a secret scan before pushing public branches.
- Do not expose port `8787` publicly without `AI_D_TEACH_SERVER_TOKEN`.

The repository server binds to `127.0.0.1` by default. Public or tunneled `/api/*` and `/mcp` requests require `Authorization: Bearer <AI_D_TEACH_SERVER_TOKEN>` unless `AI_D_TEACH_ALLOW_PUBLIC_NO_AUTH=1` is deliberately set for disposable testing.
