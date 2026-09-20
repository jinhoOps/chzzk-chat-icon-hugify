/**
 * 치지직 아이콘 확대기 팝업 스크립트
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggleEnabled = document.getElementById('toggle-enabled');
  const btnSnooze10s = document.getElementById('btn-snooze-10s');
  const snoozeBanner = document.getElementById('snooze-banner');
  const snoozeText = document.getElementById('snooze-text');
  const cancelSnoozeBtn = document.getElementById('cancel-snooze-btn');
  const statusBadge = document.getElementById('status-badge');
  const sizeRadios = document.querySelectorAll('input[name="size"]');
  const toggleAlt = document.getElementById('toggle-alt');
  const toggleCrisp = document.getElementById('toggle-crisp');

  let state = {
    enabled: true,
    snoozedUntil: 0,
    size: 90,
    showAltBadge: false,
    crispScaling: false,
  };

  let timerInterval = null;

  // 상태 배지 및 스누즈 UI 갱신
  function updateUI() {
    const now = Date.now();
    const isSnoozed = state.snoozedUntil && now < state.snoozedUntil;

    toggleEnabled.checked = Boolean(state.enabled);
    toggleAlt.checked = Boolean(state.showAltBadge);
    toggleCrisp.checked = Boolean(state.crispScaling);

    // 라디오 버튼 선택
    sizeRadios.forEach((radio) => {
      radio.checked = Number(radio.value) === Number(state.size);
    });

    if (!state.enabled) {
      statusBadge.textContent = '중지됨';
      statusBadge.className = 'badge badge-stopped';
      snoozeBanner.classList.add('hidden');
    } else if (isSnoozed) {
      const remaining = Math.max(1, Math.ceil((state.snoozedUntil - now) / 1000));
      statusBadge.textContent = '일시 중지';
      statusBadge.className = 'badge badge-snoozed';
      snoozeBanner.classList.remove('hidden');
      snoozeText.textContent = `10초 비활성화 중 (${remaining}초 남음)`;
    } else {
      statusBadge.textContent = '작동 중';
      statusBadge.className = 'badge badge-active';
      snoozeBanner.classList.add('hidden');
    }
  }

  function startCountdown() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const now = Date.now();
      if (state.snoozedUntil && now >= state.snoozedUntil) {
        state.snoozedUntil = 0;
        chrome.storage.local.set({ snoozedUntil: 0 });
        clearInterval(timerInterval);
      }
      updateUI();
    }, 500);
  }

  function saveState(newValues) {
    state = { ...state, ...newValues };
    chrome.storage.local.set(newValues, () => {
      updateUI();
    });
  }

  // 1. 초기 상태 로드
  chrome.storage.local.get(['enabled', 'snoozedUntil', 'size', 'showAltBadge', 'crispScaling'], (res) => {
    if (res) {
      state = { ...state, ...res };
    }
    updateUI();
    if (state.snoozedUntil && Date.now() < state.snoozedUntil) {
      startCountdown();
    }
  });

  // 2. 마스터 활성화 토글
  toggleEnabled.addEventListener('change', () => {
    saveState({ enabled: toggleEnabled.checked });
  });

  // 3. 10초 비활성화 버튼
  btnSnooze10s.addEventListener('click', () => {
    const until = Date.now() + 10000;
    saveState({ snoozedUntil: until });
    startCountdown();
  });

  // 4. 스누즈 즉시 해제
  cancelSnoozeBtn.addEventListener('click', () => {
    saveState({ snoozedUntil: 0 });
    if (timerInterval) clearInterval(timerInterval);
  });

  // 5. 확대 크기 라디오 변경
  sizeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        saveState({ size: Number(radio.value) });
      }
    });
  });

  // 6. 추가 옵션
  toggleAlt.addEventListener('change', () => {
    saveState({ showAltBadge: toggleAlt.checked });
  });

  toggleCrisp.addEventListener('change', () => {
    saveState({ crispScaling: toggleCrisp.checked });
  });
});
