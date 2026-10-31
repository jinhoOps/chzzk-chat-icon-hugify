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
});
