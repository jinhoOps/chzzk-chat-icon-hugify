/**
 * 커져라! Hugify! 백그라운드
 * 자동 업데이트(예약 작업)가 설치 폴더의 파일을 새 버전으로 바꾸면,
 * 치지직 탭이 열려 있지 않을 때 확장을 다시 로드해 새 버전을 적용합니다.
 */

const UPDATE_ALARM = 'hugify-disk-version-check';
const CHZZK_TABS = 'https://chzzk.naver.com/*';

function parseVersion(value) {
  const match = String(value || '').trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1, 4).map(Number) : null;
}

function isNewerVersion(latest, current) {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

async function readDiskVersion() {
  const response = await fetch(chrome.runtime.getURL('manifest.json'), { cache: 'no-store' });
  const manifest = await response.json();
  return manifest?.version;
}

async function reloadIfUpdatedOnDisk() {
  try {
    const diskVersion = await readDiskVersion();
    if (!isNewerVersion(diskVersion, chrome.runtime.getManifest().version)) return;

    // 시청 중에 다시 로드하면 열린 치지직 탭의 확대 기능이 끊기므로, 탭을 모두 닫은 뒤 적용합니다.
    const chzzkTabs = await chrome.tabs.query({ url: CHZZK_TABS });
    if (chzzkTabs.length > 0) return;

    chrome.runtime.reload();
  } catch {
    // 파일을 교체하는 중이면 다음 확인 때 다시 시도합니다.
  }
}

// 업데이트 화면에서 파일을 바꾸고 다시 시작한 직후: 치지직 탭을 새로고침하고 완료 화면을 보여줍니다.
async function finishButtonUpdate() {
  try {
    const { justUpdated } = await chrome.storage.local.get('justUpdated');
    if (!justUpdated) return;
    await chrome.storage.local.remove('justUpdated');
    if (justUpdated !== chrome.runtime.getManifest().version) return;

    const chzzkTabs = await chrome.tabs.query({ url: CHZZK_TABS });
    for (const tab of chzzkTabs) chrome.tabs.reload(tab.id);
    chrome.tabs.create({ url: chrome.runtime.getURL('src/update.html#done') });
  } catch {
    // 완료 안내는 실패해도 업데이트 자체에는 영향이 없습니다.
  }
}

finishButtonUpdate();

chrome.alarms.get(UPDATE_ALARM, (alarm) => {
  if (!alarm) chrome.alarms.create(UPDATE_ALARM, { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === UPDATE_ALARM) reloadIfUpdatedOnDisk();
});

chrome.runtime.onStartup.addListener(reloadIfUpdatedOnDisk);
chrome.tabs.onRemoved.addListener(() => { reloadIfUpdatedOnDisk(); });
