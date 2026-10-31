/**
 * 커져라! Hugify! 팝업 설정
 */

document.addEventListener('DOMContentLoaded', () => {
  const statusBadge = document.getElementById('status-badge');
  const sizeRadios = document.querySelectorAll('input[name="size"]');
  const chatAreaCheck = document.getElementById('chat-area');
  const sizeRefreshNotice = document.getElementById('size-refresh-notice');
  const supportedSizes = [90, 120];

  let state = {
    enabled: true,
    size: 90,
    chatArea: true,
  };

  function normalizeSize(value) {
    const size = Number(value);
    return supportedSizes.includes(size) ? size : 90;
  }

  function updateUI() {
    statusBadge.textContent = state.enabled ? 'ON' : 'OFF';
    statusBadge.className = state.enabled ? 'status status-on' : 'status status-off';
    statusBadge.setAttribute('aria-pressed', String(state.enabled));
    statusBadge.setAttribute(
      'aria-label',
      state.enabled ? '이모티콘 확대 끄기' : '이모티콘 확대 켜기'
    );

    chatAreaCheck.checked = state.chatArea;

    sizeRadios.forEach((radio) => {
      radio.checked = Number(radio.value) === state.size;
    });
  }

  function saveState(nextState) {
    state = {
      ...state,
      ...nextState,
      size: normalizeSize(nextState.size ?? state.size),
    };
    chrome.storage.local.set(nextState, updateUI);
  }

  chrome.storage.local.get(['enabled', 'size', 'chatArea'], (result) => {
    state = {
      enabled: result?.enabled !== false,
      size: normalizeSize(result?.size),
      chatArea: result?.chatArea !== false,
    };
    updateUI();
  });

  statusBadge.addEventListener('click', () => {
    saveState({ enabled: !state.enabled });
  });

  chatAreaCheck.addEventListener('change', () => {
    saveState({ chatArea: chatAreaCheck.checked });
  });

  document.querySelectorAll('.footer-link-disabled').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
    });
  });

  sizeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        saveState({ size: Number(radio.value) });
        sizeRefreshNotice.hidden = false;
      }
    });
  });

  checkForUpdate();
});

const LATEST_RELEASE_API = 'https://api.github.com/repos/jinhoOps/chzzk-chat-icon-hugify/releases/latest';
const UPDATE_COMMAND = 'irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1 | iex';
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

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

async function fetchLatestTag() {
  const cached = await chrome.storage.local.get('updateCheck');
  const check = cached?.updateCheck;
  if (check?.tag && Date.now() - check.checkedAt < UPDATE_CHECK_INTERVAL_MS) {
    return check.tag;
  }

  const response = await fetch(LATEST_RELEASE_API, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`GitHub ${response.status}`);
  const release = await response.json();
  const tag = release?.tag_name;
  if (!tag) throw new Error('No release tag');

  await chrome.storage.local.set({ updateCheck: { tag, checkedAt: Date.now() } });
  return tag;
}

async function checkForUpdate() {
  const notice = document.getElementById('update-notice');
  const latestLabel = document.getElementById('update-latest');
  const copyButton = document.getElementById('update-copy');
  const releaseLink = document.getElementById('update-link');
  if (!notice) return;

  try {
    const current = chrome.runtime.getManifest().version;
    const latest = await fetchLatestTag();
    if (!isNewerVersion(latest, current)) return;

    const latestTag = latest.startsWith('v') ? latest : `v${latest}`;
    latestLabel.textContent = latestTag;
    releaseLink.href = `https://github.com/jinhoOps/chzzk-chat-icon-hugify/releases/tag/${latestTag}`;
    notice.hidden = false;

    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(UPDATE_COMMAND);
        copyButton.textContent = '복사됐어요!';
      } catch {
        copyButton.textContent = '복사 실패';
      }
      setTimeout(() => { copyButton.textContent = '업데이트 명령 복사'; }, 1600);
    });
  } catch {
    // 오프라인이거나 GitHub API 제한이면 알림 없이 넘어갑니다.
  }
}
