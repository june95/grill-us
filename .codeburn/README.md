# CodeBurn VS Code Bundle

This bundle contains CodeBurn 0.9.24, its runtime dependencies, a VS Code Agent Skill, and an optional project-scoped MCP installer.

## Requirements

- Windows PowerShell or PowerShell 7
- Node.js 22.13.0 or newer
- VS Code with GitHub Copilot Chat

## Use After Extraction

Extract the ZIP directly into a project root. The skill is immediately available at `.agents/skills/codeburn/SKILL.md`.

Run a report without installing anything globally:

```powershell
& .\.codeburn\codeburn.ps1 sessions -p today --provider copilot --no-pager
```

This lists today's Copilot sessions, not overall usage. For today's available local records across providers, use `overview -p today --provider all --no-color`. Running from a project root only locates this bundle; it does not filter the report to that project. State the actual provider, period, project, and session scope with results.

If the wrapper is blocked by signing or execution policy, the existing Node alternative is:

```powershell
node .codeburn/runtime/dist/cli.js overview -p today --provider all --no-color
```

Do not automatically change execution policy or install/configure tools to make a query work. See [report scope and help commands](../CODEBURN-SETUP.md#report-scope) for project name/path substring matching, session attribution, and estimated/missing data limitations.

Only when explicitly requested, register CodeBurn as a project-scoped MCP server:

```powershell
& .\.codeburn\install.ps1
```

The installer merges a `codeburn` entry into `.vscode/mcp.json`. If that file already exists, it is backed up as `.vscode/mcp.json.codeburn-backup` before modification. Reload the VS Code window after installation.

## Source And License

- Project: https://github.com/getagentseal/codeburn
- Package: https://www.npmjs.com/package/codeburn
- Version: 0.9.24
- License: MIT

The bundled runtime retains the upstream `LICENSE` and `THIRD_PARTY_NOTICES.md` files.
