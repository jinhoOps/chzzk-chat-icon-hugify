/**
 * 치지직 이모티콘 커져라! Hugify! 팝업
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggleEnabled = document.getElementById('toggle-enabled');
  const statusBadge = document.getElementById('status-badge');

  let enabled = true;

  function updateUI() {
    toggleEnabled.checked = enabled;
    statusBadge.textContent = enabled ? '사용 중' : '꺼짐';
    statusBadge.className = enabled ? 'badge badge-active' : 'badge badge-stopped';
  }

  function saveEnabled(nextEnabled) {
    enabled = nextEnabled;
    chrome.storage.local.set({ enabled }, updateUI);
  }

  chrome.storage.local.get(['enabled'], (result) => {
    enabled = result?.enabled !== false;
    updateUI();
  });

  toggleEnabled.addEventListener('change', () => {
    saveEnabled(toggleEnabled.checked);
  });
});
