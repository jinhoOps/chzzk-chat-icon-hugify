import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export const EXIT_CODES = {
  SUCCESS: 0,
  INVALID_ARG: 1,
  BROWSER_NOT_FOUND: 2,
  EXTENSION_NOT_FOUND: 3,
  SPAWN_ERROR: 4,
};

/**
 * Windows에서 Chrome 및 Whale 실행 파일 후보 경로 목록을 반환합니다.
 */
export function getBrowserCandidatePaths(env = process.env) {
  const progFiles = env['ProgramFiles'] || 'C:\\Program Files';
  const progFilesX86 = env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const localAppData = env['LocalAppData'] || '';

  return {
    whale: [
      path.join(progFiles, 'Naver', 'Naver Whale', 'Application', 'whale.exe'),
      path.join(progFilesX86, 'Naver', 'Naver Whale', 'Application', 'whale.exe'),
      ...(localAppData ? [path.join(localAppData, 'Naver', 'Naver Whale', 'Application', 'whale.exe')] : []),
    ],
    chrome: [
      path.join(progFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(progFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      ...(localAppData ? [path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe')] : []),
    ],
  };
}

/**
 * 지정된 브라우저(auto | chrome | whale) 실행 파일을 탐지합니다.
 */
export function detectBrowser(target = 'auto', env = process.env, existsFn = fs.existsSync) {
  const candidates = getBrowserCandidatePaths(env);
  const normalizedTarget = (target || 'auto').toLowerCase();

  if (normalizedTarget === 'whale') {
    for (const p of candidates.whale) {
      if (existsFn(p)) return { type: 'whale', exePath: p, name: 'Naver Whale' };
    }
    return null;
  }

  if (normalizedTarget === 'chrome') {
    for (const p of candidates.chrome) {
      if (existsFn(p)) return { type: 'chrome', exePath: p, name: 'Google Chrome' };
    }
    return null;
  }

  if (normalizedTarget === 'auto') {
    // auto: Naver Whale 우선 확인 (치지직은 네이버 서비스이므로 호환성 우수), 없으면 Chrome
    for (const p of candidates.whale) {
      if (existsFn(p)) return { type: 'whale', exePath: p, name: 'Naver Whale' };
    }
    for (const p of candidates.chrome) {
      if (existsFn(p)) return { type: 'chrome', exePath: p, name: 'Google Chrome' };
    }
    return null;
  }

  return null;
}

/**
 * CLI 인자 파싱
 */
export function parseArgs(rawArgs) {
  const options = {
    browser: 'auto',
    dryRun: false,
    fallback: false,
    help: false,
    profileDir: '',
    url: 'https://chzzk.naver.com/live',
    unknownArgs: [],
  };

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];

    if (arg === '--help' || arg === '-h' || arg === '/?') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--fallback') {
      options.fallback = true;
    } else if (arg.startsWith('--browser=')) {
      options.browser = arg.split('=')[1].trim().toLowerCase();
    } else if (arg === '-b' || arg === '--browser') {
      if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('-')) {
        options.browser = rawArgs[++i].trim().toLowerCase();
      } else {
        options.unknownArgs.push(arg);
      }
    } else if (arg.startsWith('--profile-dir=')) {
      options.profileDir = arg.split('=')[1].trim();
    } else if (arg.startsWith('--url=')) {
      options.url = arg.substring('--url='.length).trim();
    } else {
      options.unknownArgs.push(arg);
    }
  }

  return options;
}

/**
 * 브라우저 실행 인자 생성
 */
export function buildLaunchArgs({ extensionPath, profileDir, targetUrl, fallbackMode, browserType }) {
  if (fallbackMode) {
    const extensionsUrl = browserType === 'whale' ? 'whale://extensions' : 'chrome://extensions';
    return [extensionsUrl];
  }

  const args = [
    `--load-extension=${extensionPath}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
  ];

  if (targetUrl) {
    args.push(targetUrl);
  }

  return args;
}

/**
 * 도움말 출력
 */
export function printHelp() {
  console.log(`
🔍 치지직 채팅 아이콘 확대기 - 원클릭 브라우저 런처
======================================================
설치 없이 로컬 확장 프로그램을 Chrome 또는 Naver Whale에서 즉시 실행합니다.

[사용법]
  install.cmd [옵션]
  powershell -File install.ps1 [옵션]
  node scripts/launcher.js [옵션]

[옵션]
  --browser=<auto|chrome|whale>, -b <값>
      실행할 브라우저를 선택합니다 (기본값: auto)
      - auto   : Whale 우선 감지 후 Chrome 자동 선택
      - chrome : Google Chrome 강제 지정
      - whale  : Naver Whale 강제 지정

  --fallback
      확장 프로그램 관리 페이지(chrome://extensions 또는 whale://extensions)를 열고
      수동 등록 가이드를 터미널에 안내합니다.

  --dry-run
      실제 브라우저를 실행하지 않고 탐지된 경로와 실행 인자만 출력합니다.

  --profile-dir=<경로>
      격리 테스트 프로필 디렉터리를 직접 지정합니다.

  --url=<URL>
      시작 시 열릴 주소를 지정합니다 (기본값: https://chzzk.naver.com/live)

  --help, -h
      도움말을 표시합니다.

[종료 코드 (Exit Codes)]
  0: 정상 완료 또는 Dry-run / Help
  1: 잘못된 인자
  2: 브라우저 실행 파일 미발견
  3: 확장 프로그램 디렉터리(manifest.json) 미발견
  4: 프로세스 실행 실패
`);
}

/**
 * 수동 설치 가이드 출력 (Fallback 안내)
 */
export function printFallbackInstructions(browserName, extensionPath) {
  console.log(`
========================================================================
💡 [${browserName}] 확장 프로그램 수동 로드 안내 (기존 프로필 영구 등록)
========================================================================
1. 브라우저에서 확장 관리자 페이지가 열렸습니다.
   (열리지 않은 경우 주소창에 ${browserName.includes('Whale') ? 'whale://extensions' : 'chrome://extensions'} 입력)
2. 우측 상단의 [개발자 모드] 토글 스위치를 켭니다.
3. 좌측 상단의 [압축해제된 확장 프로그램을 로드합니다] 버튼을 클릭합니다.
4. 아래 폴더를 복사하여 파일 선택창에 붙여넣고 [폴더 선택]을 누릅니다:
   👉 "${extensionPath}"
5. 설치가 완료되면 치지직 라이브(https://chzzk.naver.com/live)에서 호버 확장이 작동합니다!
========================================================================
`);
}

/**
 * 메인 실행 함수
 */
export async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);

  if (options.help) {
    printHelp();
    return EXIT_CODES.SUCCESS;
  }

  if (options.unknownArgs.length > 0) {
    console.error(`❌ 잘못된 인자: ${options.unknownArgs.join(', ')}`);
    console.error('사용법 확인: node scripts/launcher.js --help');
    return EXIT_CODES.INVALID_ARG;
  }

  const validBrowsers = ['auto', 'chrome', 'whale'];
  if (!validBrowsers.includes(options.browser)) {
    console.error(`❌ 지원되지 않는 브라우저: "${options.browser}". (가능한 값: auto, chrome, whale)`);
    return EXIT_CODES.INVALID_ARG;
  }

  // 1. 확장 프로그램 디렉터리 검증
  const extensionPath = REPO_ROOT;
  const manifestPath = path.join(extensionPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ 확장 프로그램 manifest.json을 찾을 수 없습니다: ${manifestPath}`);
    return EXIT_CODES.EXTENSION_NOT_FOUND;
  }

  // 2. 브라우저 탐지
  const detected = detectBrowser(options.browser, process.env, fs.existsSync);
  if (!detected) {
    console.error(`❌ 선택한 브라우저(${options.browser})의 실행 파일(chrome.exe 또는 whale.exe)을 찾을 수 없습니다.`);
    console.error('Chrome 또는 Naver Whale이 기본 경로에 설치되어 있는지 확인해주세요.');
    return EXIT_CODES.BROWSER_NOT_FOUND;
  }

  // 3. 프로필 디렉터리 결정
  const localAppData = process.env['LocalAppData'] || process.env['TEMP'] || REPO_ROOT;
  const profileDir = options.profileDir || path.join(localAppData, 'ChzzkIconMagnifier', 'profile');

  // 4. 인자 구성
  const launchArgs = buildLaunchArgs({
    extensionPath,
    profileDir,
    targetUrl: options.url,
    fallbackMode: options.fallback,
    browserType: detected.type,
  });

  // 5. Dry-run 모드 처리
  if (options.dryRun) {
    console.log(`
[DRY RUN] 브라우저 실행 계획:
------------------------------------------------------------------------
- 감지된 브라우저: ${detected.name} (${detected.type})
- 실행 파일 경로: ${detected.exePath}
- 확장 프로그램 경로: ${extensionPath}
- 격리 프로필 경로: ${profileDir}
- 실행 모드: ${options.fallback ? 'Fallback (확장 관리 페이지)' : '격리 프로필 및 자동 로드 (--load-extension)'}
- 실행 인자 목록:
    ${launchArgs.map(a => `"${a}"`).join('\n    ')}
------------------------------------------------------------------------
검증 완료: 브라우저가 실행되지 않았습니다 (Dry-run).
`);
    return EXIT_CODES.SUCCESS;
  }

  // 6. 실행
  console.log(`🚀 [${detected.name}] 실행 중...`);
  console.log(`📁 확장 프로그램: ${extensionPath}`);

  if (!options.fallback) {
    console.log(`🛡️  격리 프로필 사용: ${profileDir}`);
    console.log('📌 안내: 기존 브라우저와 충돌 없이 확장을 즉시 띄우기 위해 별도 테스트 프로필로 실행합니다.');
  }

  try {
    if (!options.fallback && !fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    const child = spawn(detected.exePath, launchArgs, {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();

    console.log(`✅ 브라우저 프로세스가 성공적으로 시작되었습니다 (PID: ${child.pid}).`);

    if (options.fallback) {
      printFallbackInstructions(detected.name, extensionPath);
    } else {
      console.log('💡 만약 기존 메인 프로필에 영구 설치하고 싶다면: install.cmd --fallback');
    }

    return EXIT_CODES.SUCCESS;
  } catch (err) {
    console.error(`❌ 브라우저 실행 실패: ${err.message}`);
    return EXIT_CODES.SPAWN_ERROR;
  }
}

// 직접 CLI로 실행된 경우
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().then((code) => {
    process.exit(code);
  });
}
