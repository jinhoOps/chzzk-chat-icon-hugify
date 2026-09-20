import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  parseArgs,
  getBrowserCandidatePaths,
  detectBrowser,
  buildLaunchArgs,
  main,
  EXIT_CODES,
} from '../scripts/launcher.js';

describe('launcher.js test suite', () => {
  describe('parseArgs', () => {
    it('parses default options with empty arguments', () => {
      const opts = parseArgs([]);
      assert.equal(opts.browser, 'auto');
      assert.equal(opts.dryRun, false);
      assert.equal(opts.fallback, false);
      assert.equal(opts.help, false);
      assert.equal(opts.url, 'https://chzzk.naver.com/live');
      assert.equal(opts.unknownArgs.length, 0);
    });

    it('parses --help and -h correctly', () => {
      assert.equal(parseArgs(['--help']).help, true);
      assert.equal(parseArgs(['-h']).help, true);
      assert.equal(parseArgs(['/?']).help, true);
    });

    it('parses --browser=whale and -b chrome', () => {
      assert.equal(parseArgs(['--browser=whale']).browser, 'whale');
      assert.equal(parseArgs(['-b', 'chrome']).browser, 'chrome');
      assert.equal(parseArgs(['--browser', 'whale']).browser, 'whale');
    });

    it('parses --dry-run and --fallback', () => {
      const opts = parseArgs(['--dry-run', '--fallback']);
      assert.equal(opts.dryRun, true);
      assert.equal(opts.fallback, true);
    });

    it('captures unknown arguments', () => {
      const opts = parseArgs(['--foo', 'bar', '--dry-run']);
      assert.equal(opts.dryRun, true);
      assert.deepEqual(opts.unknownArgs, ['--foo', 'bar']);
    });
  });

  describe('getBrowserCandidatePaths', () => {
    it('constructs correct Windows candidate paths from environment variables', () => {
      const mockEnv = {
        ProgramFiles: 'C:\\Program Files',
        'ProgramFiles(x86)': 'C:\\Program Files (x86)',
        LocalAppData: 'C:\\Users\\TestUser\\AppData\\Local',
      };

      const paths = getBrowserCandidatePaths(mockEnv);
      assert.ok(paths.chrome.length >= 2);
      assert.ok(paths.whale.length >= 2);
      assert.ok(paths.chrome.some(p => p.includes('Google\\Chrome\\Application\\chrome.exe')));
      assert.ok(paths.whale.some(p => p.includes('Naver\\Naver Whale\\Application\\whale.exe')));
    });
  });

  describe('detectBrowser with mock filesystem', () => {
    const mockEnv = {
      ProgramFiles: 'C:\\MockProg',
      'ProgramFiles(x86)': 'C:\\MockProg86',
      LocalAppData: 'C:\\MockLocal',
    };

    it('detects Chrome in auto mode when both Chrome and Whale are present (Chrome priority)', () => {
      const mockExists = () => true;
      const detected = detectBrowser('auto', mockEnv, mockExists);
      assert.ok(detected !== null);
      assert.equal(detected.type, 'chrome');
      assert.equal(detected.name, 'Google Chrome');
    });

    it('detects Chrome in auto mode when only Chrome is present', () => {
      const mockExists = (filePath) => filePath.includes('chrome.exe');
      const detected = detectBrowser('auto', mockEnv, mockExists);
      assert.ok(detected !== null);
      assert.equal(detected.type, 'chrome');
      assert.equal(detected.name, 'Google Chrome');
    });

    it('detects Whale in auto mode when only Whale is present (Whale fallback)', () => {
      const mockExists = (filePath) => filePath.includes('whale.exe');
      const detected = detectBrowser('auto', mockEnv, mockExists);
      assert.ok(detected !== null);
      assert.equal(detected.type, 'whale');
      assert.equal(detected.name, 'Naver Whale');
    });

    it('returns null when requested browser is not installed', () => {
      const mockExists = () => false;
      const detected = detectBrowser('chrome', mockEnv, mockExists);
      assert.equal(detected, null);
    });

    it('respects explicit target=chrome even if whale exists', () => {
      const mockExists = () => true;
      const detected = detectBrowser('chrome', mockEnv, mockExists);
      assert.ok(detected !== null);
      assert.equal(detected.type, 'chrome');
    });

    it('respects explicit target=whale even if chrome exists', () => {
      const mockExists = () => true;
      const detected = detectBrowser('whale', mockEnv, mockExists);
      assert.ok(detected !== null);
      assert.equal(detected.type, 'whale');
    });
  });

  describe('buildLaunchArgs', () => {
    it('builds extension-loaded arguments for normal launch', () => {
      const extPath = 'C:\\test\\치지직아이콘';
      const profile = 'C:\\test\\profile';
      const url = 'https://chzzk.naver.com/live';

      const args = buildLaunchArgs({
        extensionPath: extPath,
        profileDir: profile,
        targetUrl: url,
        fallbackMode: false,
        browserType: 'chrome',
      });

      assert.ok(args.includes(`--load-extension=${extPath}`));
      assert.ok(args.includes(`--user-data-dir=${profile}`));
      assert.ok(args.includes(url));
      assert.ok(args.includes('--no-first-run'));
    });

    it('builds fallback arguments opening chrome://extensions', () => {
      const args = buildLaunchArgs({
        extensionPath: 'C:\\test',
        profileDir: 'C:\\profile',
        targetUrl: 'https://chzzk.naver.com/live',
        fallbackMode: true,
        browserType: 'chrome',
      });

      assert.deepEqual(args, ['chrome://extensions']);
    });

    it('builds fallback arguments opening whale://extensions for Whale', () => {
      const args = buildLaunchArgs({
        extensionPath: 'C:\\test',
        profileDir: 'C:\\profile',
        targetUrl: 'https://chzzk.naver.com/live',
        fallbackMode: true,
        browserType: 'whale',
      });

      assert.deepEqual(args, ['whale://extensions']);
    });
  });

  describe('main execution in dry-run and validation', () => {
    it('returns SUCCESS (0) on --help', async () => {
      const code = await main(['--help']);
      assert.equal(code, EXIT_CODES.SUCCESS);
    });

    it('returns SUCCESS (0) on --dry-run', async () => {
      const code = await main(['--dry-run']);
      assert.equal(code, EXIT_CODES.SUCCESS);
    });

    it('returns INVALID_ARG (1) on unknown options', async () => {
      const code = await main(['--unknown-flag']);
      assert.equal(code, EXIT_CODES.INVALID_ARG);
    });

    it('returns INVALID_ARG (1) on unsupported browser', async () => {
      const code = await main(['--browser=safari']);
      assert.equal(code, EXIT_CODES.INVALID_ARG);
    });
  });
});
