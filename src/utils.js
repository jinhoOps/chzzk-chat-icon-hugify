/**
 * 치지직 채팅 아이콘 확대기 핵심 유틸리티 모듈
 */

export const DEFAULT_SETTINGS = {
  enabled: true,
  snoozedUntil: 0,
  size: 90, // 60 (원본), 90 (확대), 120 (대형)
  crispScaling: false,
  showAltBadge: true,
};

export const SIZE_PRESETS = [
  { value: 60, label: '원본 (60x60px)', description: '기본 크기' },
  { value: 90, label: '확대 (90x90px)', description: '권장 크기 (+50%)' },
  { value: 120, label: '대형 (120x120px)', description: '2배 확대' },
];

/**
 * 네이버 치지직 CDN(pstatic)의 썸네일 축소 쿼리스트링(?type=f60_60 등)을 제거하여
 * 원본 고화질 이미지 URL을 반환합니다.
 * @param {string} url 
 * @returns {string} 고화질 원본 이미지 URL
 */
export function getHighResImageUrl(url) {
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

/**
 * 현재 설정과 시간을 기준으로 확대기 기능 활성화 여부를 판별합니다.
 * @param {object} settings 
 * @param {number} currentTime (기본: Date.now())
 * @returns {boolean}
 */
export function isMagnifierActive(settings, currentTime = Date.now()) {
  if (!settings || settings.enabled === false) {
    return false;
  }
  if (settings.snoozedUntil && currentTime < settings.snoozedUntil) {
    return false;
  }
  return true;
}

/**
 * 10초 스누즈의 남은 시간을 초 단위로 계산합니다.
 * @param {object} settings 
 * @param {number} currentTime 
 * @returns {number} 남은 초 (0 이상)
 */
export function getSnoozeRemainingSeconds(settings, currentTime = Date.now()) {
  if (!settings || !settings.snoozedUntil) return 0;
  const diff = settings.snoozedUntil - currentTime;
  return diff > 0 ? Math.ceil(diff / 1000) : 0;
}

/**
 * 호버 대상 요소와 툴팁 치수를 기반으로 화면 내 최적의 툴팁 위치를 계산합니다.
 * 뷰포트 경계를 벗어나지 않도록 상/하 플립 및 좌/우 클램핑을 수행합니다.
 * 
 * @param {DOMRect|object} anchorRect 
 * @param {number} tooltipWidth 
 * @param {number} tooltipHeight 
 * @param {number} viewportWidth 
 * @param {number} viewportHeight 
 * @param {number} gap 
 * @param {number} padding 
 * @returns {{ top: number, left: number, placement: 'top'|'bottom' }}
 */
export function calculateTooltipPosition(
  anchorRect,
  tooltipWidth,
  tooltipHeight,
  viewportWidth,
  viewportHeight,
  gap = 8,
  padding = 10
) {
  // 수평 중앙 정렬
  let left = anchorRect.left + (anchorRect.width / 2) - (tooltipWidth / 2);

  // 좌우 뷰포트 클램프
  if (left < padding) {
    left = padding;
  } else if (left + tooltipWidth > viewportWidth - padding) {
    left = Math.max(padding, viewportWidth - tooltipWidth - padding);
  }

  // 기본 상단 배치
  let top = anchorRect.top - tooltipHeight - gap;
  let placement = 'top';

  // 상단 공간 부족 시 하단 배치
  if (top < padding) {
    top = anchorRect.bottom + gap;
    placement = 'bottom';

    // 하단도 부족하면 하단 끝에 맞춤
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

/**
 * 요소가 이모티콘 또는 이모티콘 버튼에 해당하는지 판별합니다.
 * 치지직 팝업(#popup_contents) 및 채팅창 구조에 유연하게 대응합니다.
 * 
 * @param {Element} target 
 * @returns {{ img: HTMLImageElement, alt: string, button: Element|null } | null}
 */
export function extractEmoticonInfo(target) {
  if (!target || !target.nodeType) return null;

  // 1. target이 이미지인 경우
  let img = target.tagName === 'IMG' ? target : null;

  // 2. target이 버튼이거나 하위 요소를 클릭/호버한 경우 이미지 탐색
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

  const isInsideEmoticonPopup = Boolean(
    img.closest('#popup_contents, [id*="popup_contents"], [class*="popup_contents"]')
  );

  const hasEmoticonClass =
    className.includes('emoticon') ||
    className.includes('emoji') ||
    parentClass.includes('emoticon') ||
    parentClass.includes('emoji') ||
    buttonClass.includes('emoticon') ||
    buttonClass.includes('emoji');

  const isEmoticonUrl =
    src.includes('/emoji/') ||
    src.includes('/subscription/') ||
    src.includes('type=f60_60') ||
    src.includes('type=f') ||
    src.includes('glive');

  const hasEmoticonAlt = /^\{:.*:\}$/.test(alt.trim());

  if (isInsideEmoticonPopup || hasEmoticonClass || isEmoticonUrl || hasEmoticonAlt) {
    return {
      img,
      alt: alt.trim(),
      button,
      src,
    };
  }

  return null;
}
