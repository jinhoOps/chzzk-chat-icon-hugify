import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  isNewerVersion,
  versionOfTag,
  selectRuntimeFiles,
  rawFileUrl,
  fetchLatestRelease,
  fetchReleaseFiles,
  verifyReleaseManifest,
  readManifestFromDir,
  isSameExtension,
  writeFiles,
} from '../src/update-core.js';

const enc = (text) => new TextEncoder().encode(text).buffer;

// In-memory stand-in for a FileSystemDirectoryHandle.
function memoryDir(initial = {}) {
  const files = new Map(Object.entries(initial));
  const writes = [];
  const dirHandle = (prefix) => ({
    async getDirectoryHandle(name) { return dirHandle(`${prefix}${name}/`); },
    async getFileHandle(name) {
      const key = `${prefix}${name}`;
      return {
        async getFile() {
          if (!files.has(key)) throw new Error('NotFound');
          return { text: async () => files.get(key) };
        },
        async createWritable() {
          let data;
          return {
            write: async (d) => { data = d; },
            close: async () => { files.set(key, new TextDecoder().decode(data)); writes.push(key); },
          };
        },
      };
    },
  });
  return { root: dirHandle(''), files, writes };
}

function fakeFetch(routes) {
  const seen = [];
  const impl = async (url) => {
    seen.push(url);
    const body = routes[url];
    if (body === undefined) return { ok: false, status: 404 };
    return {
      ok: true,
      status: 200,
      json: async () => body,
      arrayBuffer: async () => enc(typeof body === 'string' ? body : JSON.stringify(body)),
    };
  };
  impl.seen = seen;
  return impl;
}

const TREE_URL = 'https://api.github.com/repos/jinhoOps/chzzk-chat-icon-hugify/git/trees/v1.4.0?recursive=1';
const RAW = 'https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/v1.4.0/';

describe('button update core', () => {
  it('compares versions and tags', () => {
    assert.equal(isNewerVersion('v1.4.0', '1.3.0'), true);
    assert.equal(isNewerVersion('1.3.0', '1.3.0'), false);
    assert.equal(versionOfTag('v1.4.0'), '1.4.0');
    assert.equal(versionOfTag('nope'), null);
  });

  it('downloads only the files the release zip ships, and rejects unsafe paths', () => {
    const tree = [
      { type: 'blob', path: 'manifest.json' },
      { type: 'blob', path: 'src/content.js' },
      { type: 'blob', path: 'icons/icon16.png' },
      { type: 'blob', path: 'fonts/CookieRun-Bold.otf' },
      { type: 'tree', path: 'src' },
      { type: 'blob', path: 'README.md' },
      { type: 'blob', path: 'tests/popup.test.js' },
      { type: 'blob', path: 'install-online.ps1' },
      { type: 'blob', path: 'src/../evil.js' },
      { type: 'blob', path: 'src\\evil.js' },
    ];
    assert.deepEqual(selectRuntimeFiles(tree), [
      'manifest.json', 'src/content.js', 'icons/icon16.png', 'fonts/CookieRun-Bold.otf',
    ]);
  });

  it('builds raw URLs pinned to the release tag', () => {
    assert.equal(rawFileUrl('v1.4.0', 'fonts/A B.otf'), `${RAW}fonts/A%20B.otf`);
  });

  it('reads the latest stable release', async () => {
    const fetchImpl = fakeFetch({
      'https://api.github.com/repos/jinhoOps/chzzk-chat-icon-hugify/releases/latest': { tag_name: 'v1.4.0' },
    });
    assert.deepEqual(await fetchLatestRelease(fetchImpl), { tag: 'v1.4.0', version: '1.4.0' });
  });

  it('fetches every runtime file before anything is written', async () => {
    const fetchImpl = fakeFetch({
      [TREE_URL]: { truncated: false, tree: [
        { type: 'blob', path: 'manifest.json' },
        { type: 'blob', path: 'src/content.js' },
        { type: 'blob', path: 'README.md' },
      ] },
      [`${RAW}manifest.json`]: '{"manifest_version":3,"name":"Hugify","version":"1.4.0"}',
      [`${RAW}src/content.js`]: 'console.log(1)',
    });
    const files = await fetchReleaseFiles('v1.4.0', fetchImpl);
    assert.deepEqual([...files.keys()], ['manifest.json', 'src/content.js']);
    assert.equal(verifyReleaseManifest(files, 'v1.4.0').version, '1.4.0');
    assert.throws(() => verifyReleaseManifest(files, 'v1.5.0'), /달라요/);
  });

  it('fails the whole download when one file is missing', async () => {
    const fetchImpl = fakeFetch({
      [TREE_URL]: { tree: [{ type: 'blob', path: 'manifest.json' }, { type: 'blob', path: 'src/content.js' }] },
      [`${RAW}manifest.json`]: '{}',
    });
    await assert.rejects(fetchReleaseFiles('v1.4.0', fetchImpl), /다운로드 실패 \(404\)/);
  });

  it('only accepts the folder of the extension that is running', async () => {
    const { root } = memoryDir({ 'manifest.json': '{"name":"Hugify","version":"1.3.0"}' });
    const disk = await readManifestFromDir(root);
    assert.equal(isSameExtension(disk, { name: 'Hugify', version: '1.3.0' }), true);
    assert.equal(isSameExtension(disk, { name: 'Hugify', version: '1.2.0' }), false);
    assert.equal(isSameExtension(disk, { name: 'Other', version: '1.3.0' }), false);
    await assert.rejects(readManifestFromDir(memoryDir().root));
  });

  it('writes nested files and saves manifest.json last', async () => {
    const dir = memoryDir({ 'manifest.json': 'old' });
    const files = new Map([
      ['manifest.json', enc('new manifest')],
      ['src/content.js', enc('js')],
      ['icons/a.png', enc('png')],
    ]);
    await writeFiles(dir.root, files);
    assert.deepEqual(dir.writes, ['src/content.js', 'icons/a.png', 'manifest.json']);
    assert.equal(dir.files.get('manifest.json'), 'new manifest');
    assert.equal(dir.files.get('src/content.js'), 'js');
  });

  it('refuses to write outside the chosen folder', async () => {
    const dir = memoryDir();
    await assert.rejects(writeFiles(dir.root, new Map([['../x.js', enc('x')]])), /안전하지 않은 경로/);
    assert.deepEqual(dir.writes, []);
  });

  it('wires the update page to the core module', () => {
    const html = fs.readFileSync(path.resolve('src/update.html'), 'utf8');
    const js = fs.readFileSync(path.resolve('src/update.js'), 'utf8');
    assert.match(html, /<script type="module" src="update\.js"><\/script>/);
    assert.match(js, /showDirectoryPicker\(\{ id: 'hugify-install', mode: 'readwrite' \}\)/);
    assert.match(js, /isSameExtension\(diskManifest, running\)/);
    assert.match(js, /chrome\.runtime\.reload\(\)/);
  });
});
