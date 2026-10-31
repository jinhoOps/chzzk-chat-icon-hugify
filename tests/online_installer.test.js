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
const psPath = INSTALL_ONLINE_PS1.replace(/\\/g, '\\\\');

describe('online installer (install-online.ps1)', () => {
  const scriptContent = fs.readFileSync(INSTALL_ONLINE_PS1, 'utf8');

  describe('Static URL and Repository Consistency', () => {
    it('references the correct GitHub repository, Release API, and asset', () => {
      assert.ok(scriptContent.includes('https://github.com/jinhoOps/chzzk-chat-icon-hugify'));
      assert.ok(scriptContent.includes('https://github.com/jinhoOps/chzzk-chat-icon-hugify/archive/refs/heads/main.zip'));
      assert.ok(scriptContent.includes('https://api.github.com/repos/$RepoOwner/$RepoName/releases/latest'));
      assert.ok(scriptContent.includes('hugify-extension.zip'));
    });

    it('installs into one fixed local app directory', () => {
      assert.ok(scriptContent.includes('ChzzkIconMagnifier\\app'), 'Must use %LOCALAPPDATA%\\ChzzkIconMagnifier\\app');
      assert.ok(scriptContent.includes('Get-LatestRelease'), 'Must resolve Release metadata');
      assert.ok(scriptContent.includes('manifestData.version'), 'Must compare installed manifest version');
      assert.ok(scriptContent.includes('staging'), 'Must stage downloaded files before replacement');
      assert.ok(scriptContent.includes('backup'), 'Must keep a rollback directory during replacement');
    });

    it('never picks a browser or profile, and never launches a browser', () => {
      assert.doesNotMatch(scriptContent, /Read-Host/, 'Must not prompt');
      assert.doesNotMatch(scriptContent, /Start-Process/, 'Must not launch a browser');
      assert.doesNotMatch(scriptContent, /--profile-directory|--user-data-dir|--load-extension/);
      assert.doesNotMatch(scriptContent, /\[string\]\$Browser|\[string\]\$Profile/);
    });

    it('prints the install path and registration steps for both browsers', () => {
      assert.match(scriptContent, /Set-Clipboard -Value \$InstallDir/);
      assert.ok(scriptContent.includes('chrome://extensions'));
      assert.ok(scriptContent.includes('whale://extensions'));
      assert.match(scriptContent, /압축해제된 확장 프로그램을 로드합니다/);
      assert.match(scriptContent, /Ctrl\+V/);
    });
  });

  describe('PowerShell syntax', () => {
    it('parses with zero PowerShell syntax errors', () => {
      const psCommand = `
        $parseErrors = $null; $tokens = $null
        [void][System.Management.Automation.Language.Parser]::ParseFile('${psPath}', [ref]$tokens, [ref]$parseErrors)
        if ($parseErrors -and $parseErrors.Count -gt 0) { $parseErrors | ForEach-Object { Write-Error $_.Message }; exit 1 }
        exit 0
      `;
      const res = spawnSync('powershell', ['-NoProfile', '-Command', psCommand], { encoding: 'utf8' });
      assert.equal(res.status, 0, `PowerShell parse failed: ${res.stderr || res.stdout}`);
    });

    it('parses even when Windows PowerShell 5.1 reads the file as ANSI (-File without BOM)', () => {
      const psCommand = `
        $t = $null; $e = $null
        $src = [IO.File]::ReadAllText('${psPath}', [Text.Encoding]::Default)
        [void][System.Management.Automation.Language.Parser]::ParseInput($src, [ref]$t, [ref]$e)
        if ($e -and $e.Count -gt 0) { $e | ForEach-Object { Write-Error ("L{0}: {1}" -f $_.Extent.StartLineNumber, $_.Message) }; exit 1 }
        exit 0
      `;
      const res = spawnSync('powershell', ['-NoProfile', '-Command', psCommand], { encoding: 'utf8' });
      assert.equal(res.status, 0, `ANSI parse failed: ${res.stderr || res.stdout}`);
    });

    it('has no UTF-8 BOM and creates a valid scriptblock for irm | iex', () => {
      const buf = fs.readFileSync(INSTALL_ONLINE_PS1);
      assert.ok(buf[0] !== 0xef || buf[1] !== 0xbb || buf[2] !== 0xbf, 'Must not contain UTF-8 BOM');
      const psCommand = `
        $raw = Get-Content -Raw -Encoding UTF8 '${psPath}'
        [scriptblock]::Create($raw) | Out-Null
        exit 0
      `;
      const res = spawnSync('powershell', ['-NoProfile', '-Command', psCommand], { encoding: 'utf8' });
      assert.equal(res.status, 0, `[scriptblock]::Create failed: ${res.stderr || res.stdout}`);
    });

    it('keeps the Release and branch fallback paths', () => {
      assert.match(scriptContent, /Release API|GitHub Release/);
      assert.match(scriptContent, /main\.zip/);
      assert.match(scriptContent, /\$Refresh/);
    });
  });

  describe('Dry run', () => {
    it('reports the plan without network access or changes', () => {
      const res = spawnSync('powershell', ['-NoProfile', '-File', INSTALL_ONLINE_PS1, '-DryRun'], {
        encoding: 'utf8', cwd: REPO_ROOT,
      });
      assert.equal(res.status, 0, `Dry-run failed: ${res.stderr}`);
      assert.match(res.stdout, /Dry-run complete/);
      assert.match(res.stdout, /Install folder: .*ChzzkIconMagnifier\\app/);
      assert.match(res.stdout, /Auto update: scheduled task HugifyAutoUpdate/);
    });

    it('rejects unknown parameters', () => {
      const res = spawnSync('powershell', ['-NoProfile', '-File', INSTALL_ONLINE_PS1, '-DryRun', '-Browser', 'firefox'], {
        encoding: 'utf8', cwd: REPO_ROOT,
      });
      assert.notEqual(res.status, 0);
    });
  });

  describe('Auto-update scheduled task', () => {
    it('registers a per-user task that runs the saved updater silently', () => {
      assert.match(scriptContent, /\[switch\]\$AutoUpdate/);
      assert.match(scriptContent, /\[switch\]\$NoAutoUpdate/);
      assert.match(scriptContent, /\[switch\]\$RemoveAutoUpdate/);
      assert.match(scriptContent, /\$AutoUpdateTaskName = 'HugifyAutoUpdate'/);
      assert.match(scriptContent, /Register-ScheduledTask/);
      assert.match(scriptContent, /-RunLevel Limited/);
      assert.match(scriptContent, /-WindowStyle Hidden -File "\{0\}" -AutoUpdate/);
      assert.match(scriptContent, /New-Object Text\.UTF8Encoding \$true/, 'Updater copy must be saved with a BOM');
    });

    it('never installs fresh or uses the branch fallback in -AutoUpdate mode, and returns before the guide', () => {
      assert.match(scriptContent, /if \(-not \$latestRelease\) \{ Write-UpdateLog 'skip: release metadata unavailable'; return \}/);
      assert.match(scriptContent, /if \(-not \$localVersion\) \{ Write-UpdateLog 'skip: extension is not installed'; return \}/);
      const autoReturn = scriptContent.indexOf('Write-UpdateLog "done: installed');
      const guide = scriptContent.indexOf('Set-Clipboard');
      assert.ok(autoReturn > 0 && autoReturn < guide, 'Auto-update must return before printing the guide');
    });

    it('only registers auto-update for the default install folder', () => {
      assert.match(scriptContent, /\$usesDefaultInstallDir = -not \$InstallDir/);
      assert.match(scriptContent, /elseif \(\$usesDefaultInstallDir\) \{[\s\S]*?Register-AutoUpdateTask/);
    });
  });
});
