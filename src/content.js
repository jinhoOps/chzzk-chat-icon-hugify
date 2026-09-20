/**
 * 치지직 채팅 아이콘 확대기 (CHZZK Emoticon Magnifier)
 * Content Script
 */

(function () {
  'use strict';

  // 기본 설정
  let settings = {
    enabled: true,
    snoozedUntil: 0,
    size: 90,
    crispScaling: false,
    showAltBadge: true,
  };

  let tooltipEl = null;
  let tooltipImg = null;
  let tooltipAlt = null;
  let tooltipTag = null;
  let toastEl = null;
  let toastTimer = null;
  let currentTarget = null;
  let hideTimeout = null;

  // --- 유틸리티 함수 ---

  function getHighResImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('pstatic.net')) {
        parsed.searchParams.delete('type');
        return parsed.toString();
      }
    } catch {
      if (url.includes('pstatic.net')) {
        return url.replace(/([?&])type=[^&]*(&|$)/, (m, p1, p2) => (p1 === '?' && p2 ? '?' : ''));
      }
    }
    return url;
  }

  function isMagnifierActive(currentTime = Date.now()) {
    if (!settings || settings.enabled === false) return false;
    if (settings.snoozedUntil && currentTime < settings.snoozedUntil) return false;
    return true;
  }

  function calculateTooltipPosition(
    anchorRect,
    tooltipWidth,
    tooltipHeight,
    viewportWidth,
    viewportHeight,
    gap = 8,
    padding = 10
  ) {
    let left = anchorRect.left + (anchorRect.width / 2) - (tooltipWidth / 2);

    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > viewportWidth - padding) {
      left = Math.max(padding, viewportWidth - tooltipWidth - padding);
    }

    let top = anchorRect.top - tooltipHeight - gap;
    let placement = 'top';

    if (top < padding) {
      top = anchorRect.bottom + gap;
      placement = 'bottom';
      if (top + tooltipHeight > viewportHeight - padding) {
        top = Math.max(padding, viewportHeight - tooltipHeight - padding);
      }
    }

    return {
      top: Math.round(top),
      left: Math.round(left),
      placement,
    };
  }

  function extractEmoticonInfo(target) {
    if (!target || !target.nodeType) return null;

    let img = target.tagName === 'IMG' ? target : null;

    if (!img) {
      const btn = target.closest('button, [role="button"], [class*="_emoticon_"], [class*="emoji"]');
      if (btn) {
        img = btn.querySelector('img');
      }
    }

    if (!img) return null;

    const src = img.src || img.getAttribute('src') || '';
    const alt = img.alt || img.getAttribute('alt') || '';
    const className = (img.className || '').toString();
    const parent = img.parentElement;
    const parentClass = (parent?.className || '').toString();
    const button = img.closest('button, [role="button"]');
    const buttonClass = (button?.className || '').toString();

    // 팝업 내부 여부
    const isInsideEmoticonPopup = Boolean(
      img.closest('#popup_contents, [id*="popup_contents"], [class*="popup_contents"]')
    );

    // 클래스명 판별
    const hasEmoticonClass =
      className.includes('emoticon') ||
      className.includes('emoji') ||
      parentClass.includes('emoticon') ||
      parentClass.includes('emoji') ||
      buttonClass.includes('emoticon') ||
      buttonClass.includes('emoji');

    // 이미지 URL 패턴
    const isEmoticonUrl =
      src.includes('/emoji/') ||
      src.includes('/subscription/') ||
      src.includes('type=f60_60') ||
      src.includes('type=f') ||
      src.includes('glive');

    // 대체 텍스트 패턴 (예: {:slp1:})
    const hasEmoticonAlt = /^\{:.*:\}$/.test(alt.trim());

    if (isInsideEmoticonPopup || hasEmoticonClass || isEmoticonUrl || hasEmoticonAlt) {
      return {
        img,
        alt: alt.trim(),
        button: button || img,
        src,
      };
    }

    return null;
  }

  // --- DOM 요소 초기화 ---

  function ensureTooltip() {
    if (tooltipEl && document.body.contains(tooltipEl)) return;

    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chzzk-icon-magnifier-tooltip';
    tooltipEl.setAttribute('aria-hidden', 'true');

    const imgWrap = document.createElement('div');
    imgWrap.className = 'chzzk-mag-image-wrap';

    tooltipImg = document.createElement('img');
    tooltipImg.className = 'chzzk-mag-img';
    tooltipImg.alt = '이모티콘 확대 미리보기';
    imgWrap.appendChild(tooltipImg);

    tooltipAlt = document.createElement('div');
    tooltipAlt.className = 'chzzk-mag-alt';

    tooltipTag = document.createElement('span');
    tooltipTag.className = 'chzzk-mag-size-tag';

    tooltipEl.appendChild(imgWrap);
    tooltipEl.appendChild(tooltipAlt);
    tooltipEl.appendChild(tooltipTag);

    document.body.appendChild(tooltipEl);
    applySizeStyle();
  }

  function applySizeStyle() {
    const size = Number(settings.size) || 90;
    document.documentElement.style.setProperty('--chzzk-mag-size', `${size}px`);

    if (tooltipImg) {
      if (settings.crispScaling) {
        tooltipImg.classList.add('chzzk-mag-crisp');
      } else {
        tooltipImg.classList.remove('chzzk-mag-crisp');
      }
    }

    if (tooltipTag) {
      tooltipTag.textContent = `${size}×${size}px`;
    }
  }

  function showToast(message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'chzzk-mag-toast';
      const dot = document.createElement('div');
      dot.className = 'chzzk-mag-toast-dot';
      toastEl.appendChild(dot);
      const text = document.createElement('span');
      text.id = 'chzzk-mag-toast-text';
      toastEl.appendChild(text);
      document.body.appendChild(toastEl);
    }

    const textEl = toastEl.querySelector('#chzzk-mag-toast-text');
    if (textEl) textEl.textContent = message;

    toastEl.classList.add('chzzk-mag-toast-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (toastEl) toastEl.classList.remove('chzzk-mag-toast-visible');
    }, 2400);
  }

  // --- 툴팁 표시 및 숨김 ---

  function showTooltip(info) {
    ensureTooltip();
    clearTimeout(hideTimeout);

    const anchor = info.button || info.img;
    currentTarget = anchor;

    const originalSrc = info.src;
    const highResSrc = getHighResImageUrl(originalSrc);

    // 고해상도 이미지 로드 시도 및 실패 시 썸네일 원본으로 폴백
    tooltipImg.onerror = function () {
      if (this.src !== originalSrc) {
        this.src = originalSrc;
      }
    };
    tooltipImg.src = highResSrc;

    // Alt 텍스트 표시 설정
    if (settings.showAltBadge && info.alt) {
      tooltipAlt.textContent = info.alt;
      tooltipAlt.style.display = 'block';
    } else {
      tooltipAlt.style.display = 'none';
    }

    // 위치 계산
    const anchorRect = anchor.getBoundingClientRect();
    const tooltipWidth = (Number(settings.size) || 90) + 16;
    const tooltipHeight = (Number(settings.size) || 90) + (info.alt ? 42 : 24);

    const pos = calculateTooltipPosition(
      anchorRect,
      tooltipWidth,
      tooltipHeight,
      window.innerWidth,
      window.innerHeight,
      8,
      10
    );

    tooltipEl.style.left = `${pos.left}px`;
    tooltipEl.style.top = `${pos.top}px`;
    tooltipEl.classList.add('chzzk-mag-visible');
  }

  function hideTooltip(immediate = false) {
    clearTimeout(hideTimeout);
    if (!tooltipEl) return;

    if (immediate) {
      tooltipEl.classList.remove('chzzk-mag-visible');
      currentTarget = null;
    } else {
      hideTimeout = setTimeout(() => {
        if (tooltipEl) tooltipEl.classList.remove('chzzk-mag-visible');
        currentTarget = null;
      }, 60);
    }
  }

  // --- 이벤트 리스너 ---

  function handleMouseOver(e) {
    if (!isMagnifierActive()) return;

    const info = extractEmoticonInfo(e.target);
    if (!info) {
      if (currentTarget && !e.target.closest('#chzzk-icon-magnifier-tooltip')) {
        hideTooltip();
      }
      return;
    }

    showTooltip(info);
  }

  function handleMouseOut(e) {
    if (!currentTarget) return;

    // 마우스가 현재 대상 외부로 나갔는지 확인
    const related = e.relatedTarget;
    if (related && (currentTarget.contains(related) || (tooltipEl && tooltipEl.contains(related)))) {
      return;
    }

    hideTooltip();
  }

  function handleClick(e) {
    // 이모티콘을 클릭하여 전송/선택할 때 툴팁 즉시 닫기
    const info = extractEmoticonInfo(e.target);
    if (info) {
      hideTooltip(true);
    }
  }

  function handleKeyDown(e) {
    // 단축키: Alt + Z -> 10초 비활성화 토글
    if (e.altKey && (e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ')) {
      e.preventDefault();
      const now = Date.now();
      if (settings.snoozedUntil && now < settings.snoozedUntil) {
        // 이미 스누즈 중이면 즉시 해제
        settings.snoozedUntil = 0;
        chrome.storage.local.set({ snoozedUntil: 0 });
        showToast('▶️ 아이콘 확대 기능 활성화');
      } else {
        // 10초 스누즈 적용
        const until = now + 10000;
        settings.snoozedUntil = until;
        chrome.storage.local.set({ snoozedUntil: until });
        hideTooltip(true);
        showToast('⏸️ 10초간 아이콘 확대 비활성화 (Alt+Z로 해제)');
      }
    }
  }

  // --- 설정 동기화 ---

  function initSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['enabled', 'snoozedUntil', 'size', 'crispScaling', 'showAltBadge'], (res) => {
        if (res) {
          settings = { ...settings, ...res };
          applySizeStyle();
        }
      });

      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;

        let sizeChanged = false;
        let enabledChanged = false;
        let snoozeChanged = false;

        for (const [key, change] of Object.entries(changes)) {
          settings[key] = change.newValue;
          if (key === 'size' || key === 'crispScaling') sizeChanged = true;
          if (key === 'enabled') enabledChanged = true;
          if (key === 'snoozedUntil') snoozeChanged = true;
        }

        if (sizeChanged) {
          applySizeStyle();
        }

        if (!settings.enabled) {
          hideTooltip(true);
          if (enabledChanged) showToast('🛑 아이콘 확대 비활성화됨');
        } else if (enabledChanged) {
          showToast('✅ 아이콘 확대 활성화됨');
        }

        if (snoozeChanged) {
          const now = Date.now();
          if (settings.snoozedUntil && now < settings.snoozedUntil) {
            hideTooltip(true);
            const remaining = Math.ceil((settings.snoozedUntil - now) / 1000);
            showToast(`⏸️ ${remaining}초간 아이콘 확대 비활성화`);
          }
        }
      });
    }
  }

  // --- 초기화 구동 ---

  function init() {
    initSettings();

    // 이벤트 위임 바인딩
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    document.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    console.log('[CHZZK Icon Magnifier] 치지직 채팅 아이콘 확대기 활성화됨 (단축키: Alt+Z)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
