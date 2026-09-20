/**
 * 치지직 채팅 이모티콘 커져라! Hugify!
 * Content script
 */

(function () {
  'use strict';

  const DEFAULT_MAGNIFIER_SIZE = 90;
  const MAGNIFIER_SIZES = [90, 120];
  const TOOLTIP_PADDING = 16;
  let settings = { enabled: true, size: DEFAULT_MAGNIFIER_SIZE };

  let tooltipEl = null;
  let tooltipImg = null;
  let currentTarget = null;
  let hideTimeout = null;

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
        return url.replace(/([?&])type=[^&]*(&|$)/, (match, prefix, suffix) => (
          prefix === '?' && suffix ? '?' : ''
        ));
      }
    }

    return url;
  }

  function isMagnifierActive() {
    return Boolean(settings && settings.enabled !== false);
  }

  function getMagnifierSize() {
    const size = Number(settings?.size);
    return MAGNIFIER_SIZES.includes(size) ? size : DEFAULT_MAGNIFIER_SIZE;
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

    if (target.closest('[class*="_profile_"], [class*="profile"], [class*="_setting_button_"], [class*="setting_button"]')) {
      return null;
    }

    if (target.closest('pre, [contenteditable="true"], [class*="_input_"], [class*="_input_button_"]')) {
      return null;
    }

    if (target.closest('[class*="_category_"], [class*="_menu_"], .flicking-viewport, [class*="_flicking_"]')) {
      return null;
    }

    if (target.closest('[class*="_donation_"], [class*="_tools_"], [class*="_action_"]')) {
      return null;
    }

    if (target.closest('button[aria-label="팝업 닫기"], button[aria-label*="닫기"]')) {
      return null;
    }

    let img = target.tagName === 'IMG' ? target : null;

    if (!img) {
      const button = target.closest('button, [role="button"], [class*="_emoticon_"], [class*="emoji"]');
      if (button) img = button.querySelector('img');
    }

    if (!img) return null;

    const src = img.src || img.getAttribute('src') || '';
    const alt = (img.alt || img.getAttribute('alt') || '').trim();

    if (src.includes('type=f160') || src.includes('/profile/') || src.endsWith('.svg')) {
      return null;
    }

    const button = img.closest('button, [role="button"]');
    const buttonClass = (button?.className || '').toString();
    const imgClass = (img.className || '').toString();
    const isInsideEmojiArea = Boolean(
      img.closest('#emoji_area, [id*="emoji_area"], ul[class*="_list_"]')
    );
    const isEmoticonButton =
      buttonClass.includes('_emoticon_') ||
      buttonClass.includes('emoticon') ||
      imgClass.includes('_emoticon_') ||
      imgClass.includes('emoticon');
    const hasEmoticonAlt = /^\{:.*:\}$/.test(alt);
    const isEmoticonUrl =
      src.includes('/glive/subscription/emoji/') ||
      src.includes('/glive/icon/') ||
      src.includes('/subscription/emoji/') ||
      (src.includes('/emoji/') && !src.includes('/profile/'));

    if (isInsideEmojiArea && (isEmoticonButton || isEmoticonUrl || hasEmoticonAlt)) {
      return { img, alt, button: button || img, src };
    }

    if (isEmoticonButton && (isEmoticonUrl || hasEmoticonAlt || isInsideEmojiArea)) {
      return { img, alt, button: button || img, src };
    }

    if (hasEmoticonAlt && isEmoticonUrl) {
      return { img, alt, button: button || img, src };
    }

    return null;
  }

  function ensureTooltip() {
    if (tooltipEl && document.body.contains(tooltipEl)) return;

    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chzzk-icon-magnifier-tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    tooltipEl.setAttribute('aria-hidden', 'true');

    const imgWrap = document.createElement('div');
    imgWrap.className = 'chzzk-mag-image-wrap';

    tooltipImg = document.createElement('img');
    tooltipImg.className = 'chzzk-mag-img';
    tooltipImg.alt = '이모티콘 확대 미리보기';
    imgWrap.appendChild(tooltipImg);

    tooltipEl.appendChild(imgWrap);
    document.body.appendChild(tooltipEl);
    applySizeStyle();
  }

  function applySizeStyle() {
    document.documentElement.style.setProperty('--chzzk-mag-size', `${getMagnifierSize()}px`);
  }

  function showTooltip(info) {
    ensureTooltip();
    clearTimeout(hideTimeout);

    const anchor = info.button || info.img;
    currentTarget = anchor;
    const originalSrc = info.src;
    const highResSrc = getHighResImageUrl(originalSrc);

    tooltipImg.onerror = function () {
      if (this.src !== originalSrc) this.src = originalSrc;
    };
    tooltipImg.src = highResSrc;

    const anchorRect = anchor.getBoundingClientRect();
    const tooltipSize = getMagnifierSize();
    const tooltipWidth = tooltipSize + TOOLTIP_PADDING;
    const tooltipHeight = tooltipSize + TOOLTIP_PADDING;
    const position = calculateTooltipPosition(
      anchorRect,
      tooltipWidth,
      tooltipHeight,
      window.innerWidth,
      window.innerHeight,
      8,
      10
    );

    tooltipEl.style.left = `${position.left}px`;
    tooltipEl.style.top = `${position.top}px`;
    tooltipEl.setAttribute('aria-hidden', 'false');
    tooltipEl.classList.add('chzzk-mag-visible');
  }

  function hideTooltip(immediate = false) {
    clearTimeout(hideTimeout);
    if (!tooltipEl) return;

    const hide = () => {
      tooltipEl.classList.remove('chzzk-mag-visible');
      tooltipEl.setAttribute('aria-hidden', 'true');
      currentTarget = null;
    };

    if (immediate) {
      hide();
    } else {
      hideTimeout = setTimeout(hide, 60);
    }
  }

  function isTooltipTarget(target) {
    return Boolean(
      target &&
      typeof target.closest === 'function' &&
      target.closest('#chzzk-icon-magnifier-tooltip')
    );
  }

  function handleMouseOver(event) {
    if (!isMagnifierActive()) return;

    const info = extractEmoticonInfo(event.target);
    if (!info) {
      if (currentTarget && !isTooltipTarget(event.target)) hideTooltip();
      return;
    }

    showTooltip(info);
  }

  function handleMouseOut(event) {
    if (!currentTarget) return;

    const relatedTarget = event.relatedTarget;
    if (
      relatedTarget &&
      (currentTarget.contains(relatedTarget) || (tooltipEl && tooltipEl.contains(relatedTarget)))
    ) {
      return;
    }

    hideTooltip();
  }

  function handleClick(event) {
    if (extractEmoticonInfo(event.target)) hideTooltip(true);
  }

  function initSettings() {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return;

    chrome.storage.local.get(['enabled', 'size'], (result) => {
      const size = Number(result?.size);
      settings = {
        enabled: result?.enabled !== false,
        size: MAGNIFIER_SIZES.includes(size) ? size : DEFAULT_MAGNIFIER_SIZE,
      };
      applySizeStyle();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;

      if (Object.prototype.hasOwnProperty.call(changes, 'enabled')) {
        settings.enabled = changes.enabled.newValue !== false;
        if (!settings.enabled) hideTooltip(true);
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'size')) {
        const size = Number(changes.size.newValue);
        settings.size = MAGNIFIER_SIZES.includes(size) ? size : DEFAULT_MAGNIFIER_SIZE;
        applySizeStyle();
      }
    });
  }

  function init() {
    initSettings();
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    document.addEventListener('click', handleClick, { passive: true });
    console.log('[CHZZK Hugify] 치지직 이모티콘 확대가 활성화됨');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
