import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { PACKAGE_VERSION } from '../utils/package-version.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cli = path.join(repoRoot, 'cli', 'bin', 'ship-safe.js');

function withHome(run) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'ship-safe-hooks-status-'));
  try {
    run(home);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
}

function hookCommands(home) {
  const directory = path.join(home, '.ship-safe', 'hooks');
  return {
    directory,
    pre: `node "${path.join(directory, 'pre-tool-use.js')}"`,
    post: `node "${path.join(directory, 'post-tool-use.js')}"`,
  };
}

function writeSettings(home, settings) {
  const settingsPath = path.join(home, '.claude', 'settings.json');
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings));
  return settingsPath;
}

function registerHooks(commands, { pre = true, post = true } = {}) {
  return {
    hooks: {
      ...(pre ? { PreToolUse: [{ hooks: [{ command: commands.pre }] }] } : {}),
      ...(post ? { PostToolUse: [{ hooks: [{ command: commands.post }] }] } : {}),
    },
  };
}

function addScript(commands, name) {
  fs.mkdirSync(commands.directory, { recursive: true });
  fs.writeFileSync(path.join(commands.directory, name), '// test hook\n');
}

function runStatus(home, json = true) {
  return spawnSync(process.execPath, [cli, 'hooks', 'status', ...(json ? ['--json'] : [])], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: home,
      USERPROFILE: home,
      NO_COLOR: '1',
      FORCE_COLOR: '0',
    },
    timeout: 10_000,
  });
}

function readReport(result) {
  assert.ok([0, 1].includes(result.status), result.error?.message || result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  return JSON.parse(result.stdout);
}

test('hooks status JSON reports the active provider-neutral contract', () => {
  withHome(home => {
    const commands = hookCommands(home);
    writeSettings(home, registerHooks(commands));
    addScript(commands, 'pre-tool-use.js');
    addScript(commands, 'post-tool-use.js');

    const result = runStatus(home);
    const report = readReport(result);

    assert.equal(result.status, 0);
    assert.equal(report.schemaVersion, 1);
    assert.equal(report.shipSafeVersion, PACKAGE_VERSION);
    assert.equal(report.provider, 'claude-code');
    assert.equal(report.integration, 'claude-code');
    assert.equal(report.state, 'active');
    assert.equal(report.protected, true);
    assert.equal(report.hooks.preToolUse.ready, true);
    assert.equal(report.hooks.postToolUse.ready, true);
    assert.equal(report.hookDirectory, '~/.ship-safe/hooks');
    assert.equal(result.stdout.includes(home), false, 'JSON must not expose the local home path');
  });
});

test('hooks status JSON reports partial and missing-script states as unprotected', () => {
  withHome(home => {
    const commands = hookCommands(home);
    writeSettings(home, registerHooks(commands, { post: false }));
    addScript(commands, 'pre-tool-use.js');

    const result = runStatus(home);
    const report = readReport(result);

    assert.equal(result.status, 1);
    assert.equal(report.state, 'partial');
    assert.equal(report.protected, false);
    assert.equal(report.hooks.preToolUse.ready, true);
    assert.equal(report.hooks.postToolUse.registered, false);
  });

  withHome(home => {
    const commands = hookCommands(home);
    writeSettings(home, registerHooks(commands));
    addScript(commands, 'pre-tool-use.js');

    const result = runStatus(home);
    const report = readReport(result);

    assert.equal(result.status, 1);
    assert.equal(report.state, 'partial');
    assert.equal(report.protected, false);
    assert.equal(report.hooks.postToolUse.registered, true);
    assert.equal(report.hooks.postToolUse.scriptPresent, false);
    assert.equal(report.hooks.postToolUse.ready, false);
  });
});

test('hooks status JSON reports inactive state when nothing is installed', () => {
  withHome(home => {
    const result = runStatus(home);
    const report = readReport(result);

    assert.equal(result.status, 1);
    assert.equal(report.state, 'inactive');
    assert.equal(report.protected, false);
    assert.equal(report.settings.valid, true);
  });
});

test('hooks status treats malformed or structurally invalid settings as invalid without modifying them', () => {
  for (const content of ['{ malformed json', 'null', '[]', '{"hooks":{"PreToolUse":{}}}']) {
    withHome(home => {
      const settingsPath = path.join(home, '.claude', 'settings.json');
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      fs.writeFileSync(settingsPath, content);

      const result = runStatus(home);
      const report = readReport(result);

      assert.equal(result.status, 1);
      assert.equal(report.state, 'invalid');
      assert.equal(report.protected, false);
      assert.equal(report.settings.valid, false);
      assert.equal(fs.readFileSync(settingsPath, 'utf8'), content);
      assert.equal(fs.existsSync(`${settingsPath}.bak`), false, 'status must not create a backup');
    });
  }
});

test('hooks status keeps human-readable output by default and is read-only for invalid settings', () => {
  withHome(home => {
    const settingsPath = writeSettings(home, { hooks: 'not-an-object' });
    const original = fs.readFileSync(settingsPath, 'utf8');

    const result = runStatus(home, false);

    assert.equal(result.status, 1);
    assert.match(result.stdout, /ship-safe Claude Code hooks status/);
    assert.match(result.stdout, /PreToolUse/);
    assert.equal(fs.readFileSync(settingsPath, 'utf8'), original);
    assert.equal(fs.existsSync(`${settingsPath}.bak`), false);
  });
});
