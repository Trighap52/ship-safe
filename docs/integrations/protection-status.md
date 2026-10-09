# Machine-readable protection status

`ship-safe hooks status --json` reports whether the Claude Code enforcement
hooks are configured and ready. The schema is versioned and keeps its core
fields provider-neutral so future integrations can report the same lifecycle
states.

The command writes one JSON object to stdout. It exits with `0` only when
protection is active and `1` when the reported state is `partial`, `inactive`,
or `invalid`. Clients should branch on `schemaVersion` and `state`, not parse
human-readable output.

## Schema version 1

Example from Ship Safe 11.0.0:

```json
{
  "schemaVersion": 1,
  "shipSafeVersion": "11.0.0",
  "provider": "claude-code",
  "integration": "claude-code",
  "state": "active",
  "protected": true,
  "settings": {
    "valid": true,
    "path": "~/.claude/settings.json"
  },
  "hooks": {
    "preToolUse": { "registered": true, "scriptPresent": true, "ready": true },
    "postToolUse": { "registered": true, "scriptPresent": true, "ready": true }
  },
  "statusLine": {
    "registered": true,
    "scriptPresent": true,
    "ready": true,
    "conflict": false
  },
  "scripts": { "directory": "~/.ship-safe/hooks" },
  "hookDirectory": "~/.ship-safe/hooks"
}
```

- `schemaVersion` versions the report contract. Consumers should ignore unknown
  additive fields and handle unsupported schema versions explicitly.
- `shipSafeVersion` identifies the CLI producing the report.
- `provider` identifies the agent integration whose configuration was checked.
  This command reports `claude-code`. `integration` is retained as a
  compatibility alias.
- `state` is `active` only when settings are valid and both enforcement hooks
  are registered with their scripts present. `partial` means some hook
  configuration or script is present but the full pair is not ready;
  `inactive` means valid settings contain no Ship Safe enforcement hooks;
  `invalid` means settings are unreadable, malformed, or structurally invalid.
- `protected` is true only for `active`. It reports configuration and script
  readiness, not proof that a hook ran or blocked an action. The optional
  status line is informational and does not determine this value.
- Each hook's `registered`, `scriptPresent`, and `ready` fields distinguish
  missing configuration from missing files. `settings.valid` indicates whether
  the settings document could be read and has a supported structure.
- `hookDirectory` is the stable user-level install location. The legacy
  `settings.path` and `scripts.directory` fields redact the local home path.

The status command is read-only: it reads Claude Code's settings file and
checks for the known hook scripts. It does not read project source, send
telemetry, repair settings, or create a backup when settings are invalid.
