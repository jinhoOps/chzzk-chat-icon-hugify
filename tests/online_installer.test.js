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
    });

    it('defaults to Google Chrome as the primary target', () => {
      assert.match(
        scriptContent,
        /\$Browser\s*=\s*['"]chrome['"]/,
        'Default $Browser parameter must be chrome'
      );
    });

    it('installs into a stable local app directory, not temporary scratch', () => {
      assert.ok(
        scriptContent.includes('ChzzkIconMagnifier\\app'),
        'Must define stable app directory under %LOCALAPPDATA%'
      );
      assert.ok(
        scriptContent.includes('ChzzkIconMagnifier\\profile'),
        'Must define dedicated profile directory'
      );
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
