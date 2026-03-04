---
name: diverger-sync
description: Sync .claude/ configuration with latest detected stack
user-invocable: true
---

# diverger-sync

Use the MCP tools provided by the diverger-claude server to sync configuration.

## Pre-sync checks

Before syncing:
- Verify that `.claude/` directory exists. If not, suggest `/diverger-init` instead.
- Check if there are uncommitted changes to `.claude/` files. If so, warn the user that sync may overwrite manual edits.

## Steps

1. Call the `sync_config` MCP tool with the current project root directory.
2. Report the results clearly:
   - **Updated files**: list each file that was changed, with a brief description of what changed
   - **Conflicts resolved**: files where the three-way merge resolved differences automatically
   - **Files skipped**: files that were already up to date
3. Call `check_config` to verify the configuration is healthy after sync.
4. Show summary counts (updated, conflicts, skipped).

## Merge conflict handling

If the sync reports merge conflicts that couldn't be auto-resolved:
- Show the conflicting sections with context
- Ask the user to choose: keep their version, accept the new version, or merge manually
- After resolution, re-run `check_config` to verify

## Post-sync validation

After a successful sync:
1. Run `check_config` to verify the configuration is healthy.
2. If new technologies were detected, list the new rules and skills that were added.
3. If technologies were removed, list the rules and skills that were cleaned up.
4. Suggest running `/diverger-doctor` to verify overall project health.

## Error recovery

- If `sync_config` fails: Check MCP server health with `/diverger-health`, verify file permissions.
- If config is invalid after sync: Suggest running `/diverger-init` with force mode to regenerate from scratch.
