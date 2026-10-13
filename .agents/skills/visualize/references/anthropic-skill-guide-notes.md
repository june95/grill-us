# Historical Anthropic Skill Guide Notes

Source: "The Complete Guide to Building Skills for Claude" (Anthropic, Jan 2026)

This source label and the checklist below were retained from the local import. The original document URL, edition and current applicability have not been verified. These are historical notes, not current product obligations or proof of official host support. Use [SKILL](../SKILL.md) and [provenance](provenance.md) for the maintained contract and verification limits; respect applicable user/project instructions.

## Historical Checklist

1. **SKILL.md naming** — Must be exactly `SKILL.md` (case-sensitive) ✅ We have this
2. **Folder naming** — kebab-case only ✅ `visualize/`
3. **No README.md inside skill folder** — All docs in SKILL.md or references/ ⚠️ Need to check
4. **YAML frontmatter** — Must have `---` delimiters, `name` and `description` required
5. **No XML tags** (`<` or `>`) in frontmatter — security restriction
6. **Description must include WHAT and WHEN** — trigger phrases are critical
7. **SKILL.md under 5,000 words** — move detailed docs to references/
8. **No "claude" or "anthropic" in skill name** — reserved

## Progressive Disclosure (3 levels)
- **Level 1 (YAML frontmatter)**: Always in system prompt. Minimal — just enough to trigger.
- **Level 2 (SKILL.md body)**: Loaded when skill is relevant. Full instructions.
- **Level 3 (references/)**: Linked files loaded only as needed.

## Our Category
We are **Category 1: Document & Asset Creation** — creating consistent, high-quality output.

## Key Patterns
- **Pattern 3: Iterative refinement** — matches our eval loop approach
- **Pattern 5: Domain-specific intelligence** — our design system knowledge

## Historical Suggestions (Not an Active Work Queue)

These suggestions do not authorize tool restrictions, metadata changes, new tasks or installation edits. Items already present in the maintained source must not be treated as still missing solely because this imported note says so.
1. Check if we have README.md inside skill folder (forbidden)
2. SKILL.md might be too long (>5000 words) — move more to references/
3. Ensure YAML description includes clear trigger phrases
4. Add `metadata` fields (author, version)
5. Consider adding `license: MIT` to frontmatter
6. Add `allowed-tools` if applicable
