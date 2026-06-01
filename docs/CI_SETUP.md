# GitHub Actions Setup

The recommended CI workflow is intentionally not committed yet because the current Git credential used for automation cannot push files under `.github/workflows/` without GitHub's `workflow` scope.

After enabling a token or credential with `workflow` scope, add this file at `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  build:
    name: Build and audit
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Audit production dependencies
        run: npm run audit:prod
```

Until then, maintainers should run:

```powershell
npm.cmd run check
```
