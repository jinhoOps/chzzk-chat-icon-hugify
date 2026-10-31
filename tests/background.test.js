import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(path.resolve(file), 'utf8');
const backgroundJs = read('src/background.js');
const manifest = JSON.parse(read('manifest.json'));

// Runs background.js against a stub chrome API and returns the hooks it registered.
function loadBackground({ runningVersion, diskVersion, chzzkTabs = [] }) {
  const calls = { reload: 0, alarmsCreated: [] };
  const listeners = {};
  const chrome = {
    runtime: {
      getURL: (p) => `chrome-extension://test/${p}`,
      getManifest: () => ({ version: runningVersion }),
      reload: () => { calls.reload += 1; },
      onStartup: { addListener: (fn) => { listeners.startup = fn; } },
    },
    alarms: {
      get: (name, cb) => cb(undefined),
      create: (name, info) => calls.alarmsCreated.push({ name, info }),
      onAlarm: { addListener: (fn) => { listeners.alarm = fn; } },
    },
    tabs: {
      query: async () => chzzkTabs,
      onRemoved: { addListener: (fn) => { listeners.tabRemoved = fn; } },
    },
  };
  const fetch = async () => ({ json: async () => ({ version: diskVersion }) });
  const exports = new Function('chrome', 'fetch', `${backgroundJs}\nreturn { reloadIfUpdatedOnDisk, isNewerVersion };`)(chrome, fetch);
  return { ...exports, calls, listeners };
}

describe('background auto-reload', () => {
  it('is registered in the manifest with the alarms permission', () => {
    assert.equal(manifest.background?.service_worker, 'src/background.js');
    assert.ok(manifest.permissions.includes('alarms'));
    assert.ok(manifest.permissions.includes('storage'));
  });

  it('schedules a periodic disk version check', () => {
    const bg = loadBackground({ runningVersion: '1.3.0', diskVersion: '1.3.0' });
    assert.deepEqual(bg.calls.alarmsCreated, [
      { name: 'hugify-disk-version-check', info: { periodInMinutes: 30 } },
    ]);
    assert.equal(typeof bg.listeners.startup, 'function');
    assert.equal(typeof bg.listeners.alarm, 'function');
    assert.equal(typeof bg.listeners.tabRemoved, 'function');
  });

  it('reloads when the files on disk are newer and no chzzk tab is open', async () => {
    const bg = loadBackground({ runningVersion: '1.3.0', diskVersion: '1.3.1' });
    await bg.reloadIfUpdatedOnDisk();
    assert.equal(bg.calls.reload, 1);
  });

  it('waits while a chzzk tab is open', async () => {
    const bg = loadBackground({ runningVersion: '1.3.0', diskVersion: '1.3.1', chzzkTabs: [{ id: 1 }] });
    await bg.reloadIfUpdatedOnDisk();
    assert.equal(bg.calls.reload, 0);
  });

  it('does not reload for the same or an older version on disk', async () => {
    for (const diskVersion of ['1.3.0', '1.2.9', undefined]) {
      const bg = loadBackground({ runningVersion: '1.3.0', diskVersion });
      await bg.reloadIfUpdatedOnDisk();
      assert.equal(bg.calls.reload, 0, `disk ${diskVersion}`);
    }
  });
});
