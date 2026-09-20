/**
 * 커져라! Hugify! 팝업 설정
 */

document.addEventListener('DOMContentLoaded', () => {
  const statusBadge = document.getElementById('status-badge');
  const sizeRadios = document.querySelectorAll('input[name="size"]');
  const sizeRefreshNotice = document.getElementById('size-refresh-notice');
  const supportedSizes = [90, 120];

  let state = {
    enabled: true,
    size: 90,
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

  chrome.storage.local.get(['enabled', 'size'], (result) => {
    state = {
      enabled: result?.enabled !== false,
      size: normalizeSize(result?.size),
    };
    updateUI();
  });

  statusBadge.addEventListener('click', () => {
    saveState({ enabled: !state.enabled });
  });

  sizeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        saveState({ size: Number(radio.value) });
        sizeRefreshNotice.hidden = false;
      }
    });
  });
});
