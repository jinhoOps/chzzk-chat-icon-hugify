import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const INSTALL_ONLINE_PS1 = path.join(REPO_ROOT, 'install-online.ps1');

describe('online installer test suite (install-online.ps1)', () => {
  const scriptContent = fs.readFileSync(INSTALL_ONLINE_PS1, 'utf8');

  describe('Static URL and Repository Consistency', () => {
    it('references the correct GitHub repository URL and branch', () => {
      assert.ok(scriptContent.includes('jinhoOps'), 'Must specify owner jinhoOps');
      assert.ok(scriptContent.includes('chzzk-chat-icon-hugify'), 'Must specify repo name');
      assert.ok(scriptContent.includes('main'), 'Must specify default branch main');
      assert.ok(
        scriptContent.includes('https://github.com/jinhoOps/chzzk-chat-icon-hugify'),
        'Must specify canonical GitHub repo URL'
      );
      assert.ok(
        scriptContent.includes('https://github.com/jinhoOps/chzzk-chat-icon-hugify/archive/refs/heads/main.zip'),
        'Must construct canonical zip archive URL'
      );
      assert.ok(
        scriptContent.includes('https://api.github.com/repos/$RepoOwner/$RepoName/releases/latest'),
        'Must query the latest GitHub Release metadata'
      );
      assert.ok(
        scriptContent.includes('hugify-extension.zip'),
        'Must use the stable Release asset name'
      );
    });

    it('defaults to Google Chrome as the primary target', () => {
      assert.match(
        scriptContent,
        /\$Browser\s*=\s*['"]chrome['"]/,
        'Default $Browser parameter must be chrome'
      );
    });

    it('keeps browser-specific extension manager URLs and opens a new window', () => {
      assert.ok(scriptContent.includes("'chrome://extensions/'"), 'Must keep Chrome extension manager URL');
      assert.ok(scriptContent.includes("'whale://extensions/'"), 'Must keep Whale extension manager URL');
      assert.ok(scriptContent.includes("'--new-window'"), 'Must request a new browser window');
      assert.match(scriptContent, /확장 관리 주소/, 'Must print the direct address fallback');
    });

    it('installs into a stable local app directory, not temporary scratch', () => {
      assert.ok(
        scriptContent.includes('ChzzkIconMagnifier\\app'),
        'Must define stable app directory under %LOCALAPPDATA%'
      );
      assert.ok(
        !scriptContent.includes('--load-extension='),
        'Must use existing profiles'
      );
      assert.ok(scriptContent.includes('Get-LatestRelease'), 'Must resolve Release metadata');
      assert.ok(scriptContent.includes('manifestData.version'), 'Must compare installed manifest version');
      assert.ok(scriptContent.includes('staging'), 'Must stage downloaded files before replacement');
      assert.ok(scriptContent.includes('backup'), 'Must keep a rollback directory during replacement');
    });
  });

  describe('PowerShell AST Syntax and Parameter Verification', () => {
    it('parses with zero PowerShell syntax errors', () => {
      const psCommand = `
        $parseErrors = $null
        $tokens = $null
        $ast = [System.Management.Automation.Language.Parser]::ParseFile('${INSTALL_ONLINE_PS1.replace(/\\/g, '\\\\')}', [ref]$tokens, [ref]$parseErrors)
        if ($parseErrors -and $parseErrors.Count -gt 0) {
          $parseErrors | ForEach-Object { Write-Error $_.Message }
          exit 1
        }
        exit 0
      `;
      const res = spawnSync('powershell', ['-NoProfile', '-Command', psCommand], { encoding: 'utf8' });
      assert.equal(res.status, 0, `PowerShell parse failed: ${res.stderr || res.stdout}`);
    });

    it('has no UTF-8 BOM and creates a valid scriptblock for irm | iex', () => {
      const buf = fs.readFileSync(INSTALL_ONLINE_PS1);
      assert.ok(buf[0] !== 0xef || buf[1] !== 0xbb || buf[2] !== 0xbf, 'Must not contain UTF-8 BOM');

      const psCommand = `
        $raw = Get-Content -Raw -Encoding UTF8 '${INSTALL_ONLINE_PS1.replace(/\\/g, '\\\\')}'
        [scriptblock]::Create($raw) | Out-Null
        exit 0
      `;
      const res = spawnSync('powershell', ['-NoProfile', '-Command', psCommand], { encoding: 'utf8' });
      assert.equal(res.status, 0, `[scriptblock]::Create failed: ${res.stderr || res.stdout}`);
    });

    it('keeps the Release and branch fallback paths in the script', () => {
      assert.match(scriptContent, /Release API|GitHub Release/, 'Must explain Release resolution');
      assert.match(scriptContent, /main\.zip/, 'Must retain main.zip fallback');
      assert.match(scriptContent, /\$Refresh/, 'Must retain forced refresh support');
    });
  });

  describe('Offline Dry-Run Executions (No Network Calls)', () => {
    it('executes in dry-run mode for Chrome with exit code 0', () => {
      const res = spawnSync(
        'powershell',
        ['-NoProfile', '-File', INSTALL_ONLINE_PS1, '-DryRun', '-Browser', 'chrome'],
        { encoding: 'utf8', cwd: REPO_ROOT }
      );
      assert.equal(res.status, 0, `Dry-run failed: ${res.stderr}`);
      assert.ok(res.stdout.includes('Google Chrome'), 'Must detect Google Chrome');
      assert.ok(res.stdout.includes('Dry-run'), 'Must indicate dry-run completion');
    });

    it('executes in dry-run mode for Whale with exit code 0', () => {
      const res = spawnSync(
        'powershell',
        ['-NoProfile', '-File', INSTALL_ONLINE_PS1, '-DryRun', '-Browser', 'whale'],
        { encoding: 'utf8', cwd: REPO_ROOT }
      );
      assert.equal(res.status, 0, `Dry-run failed: ${res.stderr}`);
      assert.ok(res.stdout.includes('Naver Whale'), 'Must detect Naver Whale');
      assert.ok(res.stdout.includes('Dry-run'), 'Must indicate dry-run completion');
    });

    it('rejects unsupported browser with parameter validation error and non-zero exit code', () => {
      const res = spawnSync(
        'powershell',
        ['-NoProfile', '-File', INSTALL_ONLINE_PS1, '-DryRun', '-Browser', 'firefox'],
        { encoding: 'utf8', cwd: REPO_ROOT }
      );
      assert.notEqual(res.status, 0, 'Unsupported browser must fail');
    });
  });
});
