/**
 * 커져라! Hugify! 업데이트 화면
 */

import {
  fetchLatestRelease,
  fetchReleaseFiles,
  isNewerVersion,
  isSameExtension,
  readManifestFromDir,
  verifyReleaseManifest,
  writeFiles,
} from './update-core.js';

const DB_NAME = 'hugify';
const STORE = 'handles';
const HANDLE_KEY = 'installDir';

const els = {
  current: document.getElementById('current-version'),
  latest: document.getElementById('latest-version'),
  status: document.getElementById('status'),
  start: document.getElementById('start-update'),
  reset: document.getElementById('reset-folder'),
  folderGuide: document.getElementById('folder-guide'),
  main: document.getElementById('update-main'),
  done: document.getElementById('update-done'),
  doneVersion: document.getElementById('done-version'),
};

const running = chrome.runtime.getManifest();
let latest = null;
let busy = false;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
  });
}

const loadHandle = () => withStore('readonly', (store) => store.get(HANDLE_KEY)).catch(() => null);
const saveHandle = (handle) => withStore('readwrite', (store) => store.put(handle, HANDLE_KEY));
const clearHandle = () => withStore('readwrite', (store) => store.delete(HANDLE_KEY)).catch(() => {});

function setStatus(text, tone = '') {
  els.status.textContent = text;
  els.status.className = `status ${tone}`.trim();
}

async function ensureWritable(handle) {
  const options = { mode: 'readwrite' };
  if ((await handle.queryPermission(options)) === 'granted') return true;
  return (await handle.requestPermission(options)) === 'granted';
}

async function pickInstallDir() {
  let dir = await loadHandle();
  if (dir && !(await ensureWritable(dir))) {
    throw new Error('폴더 수정을 허용해야 업데이트할 수 있어요. 다시 눌러 [수정 허용]을 선택해 주세요.');
  }
  if (!dir) {
    dir = await window.showDirectoryPicker({ id: 'hugify-install', mode: 'readwrite' });
    if (!(await ensureWritable(dir))) throw new Error('폴더 수정을 허용해야 업데이트할 수 있어요.');
  }

  let diskManifest = null;
  try {
    diskManifest = await readManifestFromDir(dir);
  } catch {
    await clearHandle();
    throw new Error('고른 폴더에 manifest.json이 없어요. 확장 프로그램을 로드할 때 고른 폴더를 선택해 주세요.');
  }
  if (!isSameExtension(diskManifest, running)) {
    await clearHandle();
    throw new Error(`고른 폴더(버전 ${diskManifest.version ?? '알 수 없음'})가 지금 쓰는 Hugify(버전 ${running.version}) 폴더가 아니에요. 확장 관리 화면에서 Hugify의 [세부정보]에 나오는 폴더를 선택해 주세요.`);
  }
  await saveHandle(dir);
  return dir;
}

async function runUpdate() {
  if (busy || !latest) return;
  busy = true;
  els.start.disabled = true;
  try {
    setStatus('설치 폴더를 확인하는 중...');
    const dir = await pickInstallDir();

    setStatus('새 파일을 받는 중...');
    const files = await fetchReleaseFiles(latest.tag, fetch, (i, n) => setStatus(`새 파일을 받는 중... (${i}/${n})`));
    verifyReleaseManifest(files, latest.tag);

    setStatus('파일을 바꾸는 중...');
    await writeFiles(dir, files, (i, n) => setStatus(`파일을 바꾸는 중... (${i}/${n})`));

    await chrome.storage.local.set({ justUpdated: latest.version });
    await chrome.storage.local.remove('updateCheck');
    setStatus('완료! 확장 프로그램을 다시 시작해요.', 'ok');
    setTimeout(() => chrome.runtime.reload(), 400);
  } catch (error) {
    if (error?.name === 'AbortError') {
      setStatus('폴더 선택을 취소했어요.');
    } else {
      setStatus(error?.message || '업데이트에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error');
    }
    els.start.disabled = false;
    busy = false;
  }
}

async function init() {
  els.current.textContent = `v${running.version}`;

  if (location.hash === '#done') {
    els.main.hidden = true;
    els.done.hidden = false;
    els.doneVersion.textContent = `v${running.version}`;
    return;
  }

  if (!window.showDirectoryPicker) {
    setStatus('이 브라우저는 버튼 업데이트를 지원하지 않아요. README의 수동 업데이트 방법을 이용해 주세요.', 'error');
    return;
  }

  const savedDir = await loadHandle();
  els.folderGuide.hidden = Boolean(savedDir);
  els.reset.hidden = !savedDir;

  try {
    setStatus('새 버전을 확인하는 중...');
    latest = await fetchLatestRelease(fetch);
    els.latest.textContent = `v${latest.version}`;
    if (!isNewerVersion(latest.version, running.version)) {
      setStatus('이미 최신 버전이에요.', 'ok');
      return;
    }
    setStatus('');
    els.start.disabled = false;
  } catch {
    setStatus('GitHub에 연결하지 못했어요. 잠시 후 다시 열어 주세요.', 'error');
  }
}

els.start.addEventListener('click', runUpdate);
els.reset.addEventListener('click', async () => {
  await clearHandle();
  els.folderGuide.hidden = false;
  els.reset.hidden = true;
  setStatus('다음 업데이트 때 폴더를 다시 고를게요.');
});

init();
