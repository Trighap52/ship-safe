import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getHookStatus, HOOK_COMMANDS } from '../commands/hooks.js';
import { PACKAGE_VERSION } from '../utils/package-version.js';

const registered = (command) => [{ hooks: [{ command }] }];

describe('hooks status contract', () => {
  it('reports active when both hooks and scripts are ready', () => {
    const status = getHookStatus({
      hooks: {
        PreToolUse: registered(HOOK_COMMANDS.preToolUse),
        PostToolUse: registered(HOOK_COMMANDS.postToolUse),
      },
      statusLine: { command: HOOK_COMMANDS.statusLine },
    }, { preToolUse: true, postToolUse: true, statusLine: true });

    assert.equal(status.schemaVersion, 1);
    assert.equal(status.shipSafeVersion, PACKAGE_VERSION);
    assert.equal(status.provider, 'claude-code');
    assert.equal(status.state, 'active');
    assert.equal(status.protected, true);
    assert.equal(status.statusLine.ready, true);
    assert.equal(status.hookDirectory, '~/.ship-safe/hooks');
  });

  it('reports partial when only one hook is ready', () => {
    const status = getHookStatus({
      hooks: { PreToolUse: registered(HOOK_COMMANDS.preToolUse) },
    }, { preToolUse: true, postToolUse: false });

    assert.equal(status.state, 'partial');
    assert.equal(status.protected, false);
  });

  it('reports inactive when nothing is installed', () => {
    const status = getHookStatus({}, { preToolUse: false, postToolUse: false });

    assert.equal(status.state, 'inactive');
    assert.equal(status.protected, false);
  });

  it('reports invalid settings with an explicit invalid state', () => {
    const status = getHookStatus({}, { preToolUse: true, postToolUse: true }, false);

    assert.equal(status.state, 'invalid');
    assert.equal(status.protected, false);
    assert.equal(status.settings.valid, false);
  });

  it('treats structurally invalid settings as invalid', () => {
    const status = getHookStatus(null, { preToolUse: true, postToolUse: true });

    assert.equal(status.state, 'invalid');
    assert.equal(status.protected, false);
    assert.equal(status.settings.valid, false);
  });
});
