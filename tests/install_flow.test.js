import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Runs install-online.ps1 end to end with the network, clipboard, and prompts stubbed out.
const script = path.resolve('install-online.ps1');
const quote = (s) => "'" + s.replaceAll("'", "''") + "'";

function runPs(command) {
  return spawnSync('powershell', ['-NoProfile', '-EncodedCommand', Buffer.from(command, 'utf16le').toString('base64')], {
    encoding: 'utf8', timeout: 30000,
  });
}

function createArchive(root, version) {
  const payload = path.join(root, 'payload');
  const archive = path.join(root, 'payload.zip');
  fs.mkdirSync(payload);
  fs.writeFileSync(path.join(payload, 'manifest.json'), JSON.stringify({ manifest_version: 3, name: 'test', version }));
  fs.writeFileSync(path.join(payload, 'new-file.txt'), version);
  const r = runPs(`$ErrorActionPreference='Stop'; Compress-Archive -Path ${quote(path.join(payload, '*'))} -DestinationPath ${quote(archive)} -Force`);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return archive;
}

function scenario({ installed = '', releaseVersion = '', args = '' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hugify-test-'));
  const app = path.join(root, 'app');
  const localAppData = path.join(root, 'localappdata');
  fs.mkdirSync(localAppData);
  if (installed) {
    fs.mkdirSync(app);
    fs.writeFileSync(path.join(app, 'manifest.json'), JSON.stringify({ manifest_version: 3, name: 'test', version: installed }));
    fs.writeFileSync(path.join(app, 'old-file.txt'), 'old');
  }
  const archive = releaseVersion ? createArchive(root, releaseVersion) : '';
  const releaseMock = releaseVersion
    ? `function Invoke-RestMethod { param([string]$Uri,[string]$OutFile,[hashtable]$Headers) if($OutFile) { Copy-Item -LiteralPath ${quote(archive)} -Destination $OutFile; return }; [pscustomobject]@{ tag_name=${quote('v' + releaseVersion)}; draft=$false; prerelease=$false; assets=@([pscustomobject]@{name='hugify-extension.zip';browser_download_url='https://example.test/hugify-extension.zip'}) } }`
    : `function Invoke-RestMethod { throw 'Unexpected network' }`;
  const command = `$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[Text.Encoding]::UTF8
  $env:LOCALAPPDATA = ${quote(localAppData)}
  function Start-Process { Write-Host 'LAUNCH' }
  function Read-Host { Write-Host 'PROMPT'; return 'q' }
  function Set-Clipboard { param($Value) Write-Host ('CLIP:' + $Value) }
  function Register-ScheduledTask { Write-Host 'TASK' }
  function Invoke-WebRequest { throw 'Unexpected network' }
  ${releaseMock}
  & ${quote(script)} -InstallDir ${quote(app)} ${args}`;
  try {
    const r = runPs(command);
    const manifestPath = path.join(app, 'manifest.json');
    const version = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')).version : null;
    return {
      ...r,
      app,
      version,
      hasNewFile: fs.existsSync(path.join(app, 'new-file.txt')),
      hasOldFile: fs.existsSync(path.join(app, 'old-file.txt')),
      leftovers: fs.readdirSync(root).filter((name) => name.includes('.hugify-')),
      log: fs.existsSync(path.join(localAppData, 'ChzzkIconMagnifier', 'update.log'))
        ? fs.readFileSync(path.join(localAppData, 'ChzzkIconMagnifier', 'update.log'), 'utf8') : '',
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function assertNoPromptOrLaunch(r) {
  assert.ok(!r.stdout.includes('PROMPT'), 'Must not prompt');
  assert.ok(!r.stdout.includes('LAUNCH'), 'Must not launch a browser');
}

test('fresh install downloads the Release, copies the path, and prints both extension pages', () => {
  const r = scenario({ releaseVersion: '1.0.1' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(r.version, '1.0.1');
  assert.ok(r.hasNewFile);
  assertNoPromptOrLaunch(r);
  assert.ok(r.stdout.includes(`CLIP:${r.app}`), r.stdout);
  assert.ok(r.stdout.includes(r.app));
  assert.ok(r.stdout.includes('chrome://extensions'));
  assert.ok(r.stdout.includes('whale://extensions'));
  assert.ok(!r.stdout.includes('TASK'), 'Custom -InstallDir must not register the scheduled task');
});

test('newer Release atomically replaces the old app', () => {
  const r = scenario({ installed: '1.0.0', releaseVersion: '1.0.1' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(r.version, '1.0.1');
  assert.ok(r.hasNewFile);
  assert.equal(r.hasOldFile, false);
  assert.deepEqual(r.leftovers, []);
  assertNoPromptOrLaunch(r);
});

test('same version keeps the files and still prints the guide', () => {
  const r = scenario({ installed: '1.0.1', releaseVersion: '1.0.1' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(r.version, '1.0.1');
  assert.ok(r.hasOldFile, 'Files must not be replaced');
  assert.ok(r.stdout.includes(`CLIP:${r.app}`));
});

test('-AutoUpdate updates silently without the guide or clipboard', () => {
  const r = scenario({ installed: '1.0.0', releaseVersion: '1.0.1', args: '-AutoUpdate' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(r.version, '1.0.1');
  assert.ok(!r.stdout.includes('CLIP:'));
  assert.ok(!r.stdout.includes('chrome://extensions'));
  assertNoPromptOrLaunch(r);
  assert.match(r.log, /update: 1\.0\.0 -> 1\.0\.1/);
  assert.match(r.log, /done: installed 1\.0\.1/);
});

test('-AutoUpdate never installs when nothing is installed', () => {
  const r = scenario({ releaseVersion: '1.0.1', args: '-AutoUpdate' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(r.version, null);
  assert.match(r.log, /skip: extension is not installed/);
});
