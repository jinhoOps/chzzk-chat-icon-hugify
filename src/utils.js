/**
 * 치지직 채팅 아이콘 확대기 핵심 유틸리티 모듈
 */

export const DEFAULT_SETTINGS = {
  enabled: true,
  snoozedUntil: 0,
  size: 90, // 60 (원본), 90 (확대), 120 (대형)
  crispScaling: false,
  showAltBadge: false,
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

  // 1. 철저한 배제 필터링 (불필요한 아이콘 호버 차단)
  // (1) 프로필 이미지 및 설정 버튼 제외
  if (target.closest('[class*="_profile_"], [class*="profile"], [class*="_setting_button_"], [class*="setting_button"]')) {
    return null;
  }

  // (2) 채팅 입력창(<pre contenteditable>) 및 입력 영역 내부 요소 제외
  if (target.closest('pre, [contenteditable="true"], [class*="_input_"], [class*="_input_button_"]')) {
    return null;
  }

  // (3) 이모티콘 팝업 상단의 탭/카테고리 버튼 제외 (_category_, _menu_, flicking)
  if (target.closest('[class*="_category_"], [class*="_menu_"], .flicking-viewport, [class*="_flicking_"]')) {
    return null;
  }

  // (4) 후원/치즈 도네이션 및 도구 버튼 제외
  if (target.closest('[class*="_donation_"], [class*="_tools_"], [class*="_action_"]')) {
    return null;
  }

  // (5) 팝업 닫기 버튼 등 제어 버튼 제외
  if (target.closest('button[aria-label="팝업 닫기"], button[aria-label*="닫기"]')) {
    return null;
  }

  // 2. 대상 이미지 및 버튼 탐색
  let img = target.tagName === 'IMG' ? target : null;

  if (!img) {
    const btn = target.closest('button, [role="button"], [class*="_emoticon_"], [class*="emoji"]');
    if (btn) {
      img = btn.querySelector('img');
    }
  }

  if (!img) return null;

  const src = img.src || img.getAttribute('src') || '';
  const alt = (img.alt || img.getAttribute('alt') || '').trim();

  // 프로필 이미지 URL 패턴(type=f160 등) 또는 SVG 아이콘 배제
  if (src.includes('type=f160') || src.includes('/profile/') || src.endsWith('.svg')) {
    return null;
  }

  // 3. 실제 이모티콘 요소인지 정밀 검증
  const button = img.closest('button, [role="button"]');
  const buttonClass = (button?.className || '').toString();
  const imgClass = (img.className || '').toString();

  // (A) 이모티콘 선택 영역(#emoji_area 또는 ul._list_... 내 버튼) 내부
  const isInsideEmojiArea = Boolean(
    img.closest('#emoji_area, [id*="emoji_area"], ul[class*="_list_"]')
  );

  // (B) 클래스명에 emoticon 또는 emoji가 명시된 버튼
  const isEmoticonButton =
    buttonClass.includes('_emoticon_') ||
    buttonClass.includes('emoticon') ||
    imgClass.includes('_emoticon_') ||
    imgClass.includes('emoticon');

  // (C) 이모티콘 alt 패턴 ({:코드:} 형태)
  const hasEmoticonAlt = /^\{:.*:\}$/.test(alt);

  // (D) 명확한 이모티콘 URL 패턴
  const isEmoticonUrl =
    src.includes('/glive/subscription/emoji/') ||
    src.includes('/glive/icon/') ||
    src.includes('/subscription/emoji/') ||
    (src.includes('/emoji/') && !src.includes('/profile/'));

  if (isInsideEmojiArea && (isEmoticonButton || isEmoticonUrl || hasEmoticonAlt)) {
    return {
      img,
      alt,
      button: button || img,
      src,
    };
  }

  if (isEmoticonButton && (isEmoticonUrl || hasEmoticonAlt || isInsideEmojiArea)) {
    return {
      img,
      alt,
      button: button || img,
      src,
    };
  }

  if (hasEmoticonAlt && isEmoticonUrl) {
    return {
      img,
      alt,
      button: button || img,
      src,
    };
  }

  return null;
}
