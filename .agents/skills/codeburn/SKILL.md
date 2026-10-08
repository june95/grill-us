---
name: codeburn
description: Analyze local AI coding token usage, costs, sessions, and savings with the bundled CodeBurn CLI. Use when the user asks about token usage, per-question or per-session usage, AI coding costs, CodeBurn reports, or usage optimization.
---

# CodeBurn

Use the bundled local-first CodeBurn runtime in this workspace. It reads session data already stored on the machine and does not require an API key.

## Runtime

- Entry point: `.codeburn/runtime/dist/cli.js`
- PowerShell wrapper: `.codeburn/codeburn.ps1`
- Required Node.js version: 22.13.0 or newer
- Bundled CodeBurn version: 0.9.24

Run commands from the project root:

```powershell
& .\.codeburn\codeburn.ps1 sessions -p today --provider copilot --no-pager
```

The working directory locates the bundled runtime; it does not restrict usage to this project. If the wrapper is blocked by a signature or execution policy, use the existing Node entry point with the same arguments:

```powershell
node .codeburn/runtime/dist/cli.js overview -p today --provider all --no-color
```

Do not change execution policy, use Bypass, install packages, or configure MCP just to run a query. Check supported options with the relevant subcommand's `--help`.

## Query Scope

Before querying, resolve the user's provider, period, project, and session scope. Preserve explicit choices and state the actual scope in the answer.

- Provider: use `--provider all` for overall usage, or the requested provider. Overall means available local provider records, not guaranteed coverage of every account or machine. Never silently narrow overall usage to Copilot.
- Period: specify it explicitly. `overview` defaults to `month`; `sessions` and `optimize` default to `30days`. Use `-p today` for today or supported `--from`/`--to` dates for a requested range; date options override the period for overview.
- Project: without a project filter, the report may cover multiple projects on this machine. `overview --project <name>` is a case-insensitive project-name or recorded-path substring filter, not an exact repository-path match. It and `--exclude <name>` are repeatable. Check the returned project breakdown; if multiple projects match, explain the scope or ask one necessary question. Do not present machine-wide totals as this project's usage.
- Session: identify the provider session using actual session evidence. Time proximity alone does not identify one question. One user turn can trigger multiple model calls. The bundled `sessions --help` has no `--project` or `--session` option; do not invent them. Narrow supported period/provider options, then identify the relevant session in available results. If attribution remains uncertain, report that limitation.
- Missing or mismatched data: distinguish no matching records, unsupported scope, and missing counters from confirmed zero usage. Report input, output, cache, total tokens, and cost only when available; label unavailable or estimated values. Do not equate calculated cost with the actual subscription bill.

Apply the same scope rules to MCP queries. Confirm each tool's supported filters; if they cannot express the requested scope, use the available CLI within its supported limits and disclose any remaining ambiguity.

## Common Requests

- Today's Copilot sessions:
  `& .\.codeburn\codeburn.ps1 sessions -p today --provider copilot --no-pager`
- Today's overall usage:
  `& .\.codeburn\codeburn.ps1 overview -p today --provider all --no-color`
- Today's Copilot usage:
  `& .\.codeburn\codeburn.ps1 overview -p today --provider copilot --no-color`
- Today's Codex usage:
  `& .\.codeburn\codeburn.ps1 overview -p today --provider codex --no-color`
- Today's usage for matching project names (replace the example name and verify matches):
  `& .\.codeburn\codeburn.ps1 overview -p today --provider all --project "project-name" --no-color`
- Optimization report for today's Copilot usage, when requested:
  `& .\.codeburn\codeburn.ps1 optimize -p today --provider copilot`
- Interactive dashboard:
  `& .\.codeburn\codeburn.ps1`

Run usage or optimization reports only when the user requests them. Documentation checks use help and example/option comparisons, not actual usage queries. Keep aggregate answers free of raw session content.

## MCP

If the workspace CodeBurn MCP server is already available, prefer its `get_usage` and `get_savings` tools for structured queries with supported filters. Otherwise, use the bundled CLI. Only when the user explicitly requests MCP registration, run:

```powershell
& .\.codeburn\install.ps1
```

The installer merges the `codeburn` server into `.vscode/mcp.json` and backs up an existing file before changing it.

## Safety

- Do not run `optimize --apply`, `guard install`, or other configuration-changing commands unless the user explicitly asks.
- Do not expose raw session content when the user only asks for aggregate usage.
- Mention when token values are estimated because the provider log lacks exact counters.
