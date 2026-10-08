# CodeBurn Setup

This project includes a portable CodeBurn 0.9.24 runtime and a VS Code Agent Skill.

## 1. Run CodeBurn

No global npm installation is required:

```powershell
& .\.codeburn\codeburn.ps1 sessions -p today --provider copilot --no-pager
```

This example lists today's Copilot sessions. Run from the project root to locate the runtime; this does not automatically filter usage to the current project.

### Report Scope

```powershell
# Today's overall usage across available local provider records
& .\.codeburn\codeburn.ps1 overview -p today --provider all --no-color
# Provider-specific totals
& .\.codeburn\codeburn.ps1 overview -p today --provider copilot --no-color
& .\.codeburn\codeburn.ps1 overview -p today --provider codex --no-color
# Replace the project-name example and verify the returned project matches
& .\.codeburn\codeburn.ps1 overview -p today --provider all --project "project-name" --no-color
```

Always report provider, period, project, and session scope with the result. `overview` defaults to `month`, while `sessions` and `optimize` default to `30days`; the examples specify today explicitly. Supported `--from`/`--to` dates select a custom range (overriding the period for overview). Provider defaults to `all`, meaning available local records, not guaranteed coverage of every account.

`overview --project` matches project-name or recorded-path substrings without case sensitivity, not exact repository paths. `--project` and `--exclude` are repeatable. Check the project breakdown before calling it this repository's total. Multiple matches need a scope explanation or clarification. The bundled `sessions` command has no `--project` or `--session` flag: use supported period/provider filters and actual session evidence. Time proximity alone cannot attribute usage to one question.

Missing records or counters are not automatically zero. Distinguish input/output/cache/total values that are available, missing, or estimated, and do not treat calculated costs as subscription bills. Aggregate reports should not expose raw conversation content.

### Existing Node Alternative

If the PowerShell wrapper is blocked by a signature or execution policy, use the bundled entry point with the same arguments:

```powershell
node .codeburn/runtime/dist/cli.js overview -p today --provider all --no-color
node .codeburn/runtime/dist/cli.js overview --help
node .codeburn/runtime/dist/cli.js sessions --help
node .codeburn/runtime/dist/cli.js optimize --help
```

Do not automatically change execution policy, use Bypass, install packages, or edit configuration. For documentation validation, use help and option comparisons; run actual usage or optimization reports only when requested.

## 2. Enable MCP Tools In VS Code

Optional, only when MCP registration is explicitly requested. An ordinary usage query does not require installation:

```powershell
& .\.codeburn\install.ps1
```

Then run `Developer: Reload Window` in VS Code. The installer preserves existing MCP servers and creates `.vscode/mcp.json.codeburn-backup` before modifying an existing MCP configuration.

Existing MCP tools must preserve the same requested filters. If a tool cannot express the scope, use supported CLI queries and disclose any remaining limitations. Do not run `optimize --apply`, guard installation, or other configuration changes without an explicit request.

## 3. Use The Skill

Open a new Copilot Chat and ask, for example:

```text
CodeBurn으로 오늘 Copilot 토큰 사용량을 보여줘.
```

## Requirements

- Node.js 22.13.0 or newer
- Windows PowerShell or PowerShell 7
- VS Code with GitHub Copilot Chat

See `.codeburn/README.md` for package and license details.
