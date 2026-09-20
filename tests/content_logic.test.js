import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getHighResImageUrl,
  extractEmoticonInfo,
  calculateTooltipPosition,
  isMagnifierActive,
  getSnoozeRemainingSeconds
} from '../src/utils.js';

describe('Chzzk user snippet test suite', () => {
  it('correctly handles the exact HTML sample provided by the user', () => {
    // User HTML:
    // <div class="_contents_jao35_54 _none_padding_top_jao35_174 _none_padding_bottom_jao35_177" id="popup_contents">
    // <button type="button" class="_emoticon_1dr17_172"><img src="https://nng-phinf.pstatic.net/glive/subscription/emoji/43c05c91ae59803c7b3f267753b73b65/1/1_1788090404179.png?type=f60_60" alt="{:slp1:}" width="32" height="32"></button>

    const popupContents = {
      nodeType: 1,
      tagName: 'DIV',
      id: 'popup_contents',
      className: '_contents_jao35_54 _none_padding_top_jao35_174 _none_padding_bottom_jao35_177',
      parentElement: null,
      closest(sel) {
        if (sel.includes('#popup_contents')) return popupContents;
        return null;
      }
    };

    const button = {
      nodeType: 1,
      tagName: 'BUTTON',
      type: 'button',
      className: '_emoticon_1dr17_172',
      parentElement: popupContents,
      children: [],
      closest(sel) {
        if (sel.includes('button') || sel.includes('_emoticon_')) return button;
        return popupContents.closest(sel);
      },
      querySelector(sel) {
        if (sel === 'img') return button.children[0] || null;
        return null;
      }
    };

    const img = {
      nodeType: 1,
      tagName: 'IMG',
      src: 'https://nng-phinf.pstatic.net/glive/subscription/emoji/43c05c91ae59803c7b3f267753b73b65/1/1_1788090404179.png?type=f60_60',
      alt: '{:slp1:}',
      width: 32,
      height: 32,
      parentElement: button,
      closest(sel) {
        if (sel.includes('img')) return img;
        return button.closest(sel);
      }
    };
    button.children.push(img);

    // Test 1: Event triggered directly on <img>
    const infoFromImg = extractEmoticonInfo(img);
    assert.ok(infoFromImg, 'Should extract emoticon info from img');
    assert.equal(infoFromImg.alt, '{:slp1:}');
    assert.equal(infoFromImg.src, 'https://nng-phinf.pstatic.net/glive/subscription/emoji/43c05c91ae59803c7b3f267753b73b65/1/1_1788090404179.png?type=f60_60');

    const highRes = getHighResImageUrl(infoFromImg.src);
    assert.equal(highRes, 'https://nng-phinf.pstatic.net/glive/subscription/emoji/43c05c91ae59803c7b3f267753b73b65/1/1_1788090404179.png');

    // Test 2: Event triggered on <button>
    const infoFromButton = extractEmoticonInfo(button);
    assert.ok(infoFromButton, 'Should extract emoticon info from button target');
    assert.equal(infoFromButton.alt, '{:slp1:}');
  });

  it('verifies 10-second snooze countdown cycle', () => {
    const t0 = 1700000000000;
    const settings = {
      enabled: true,
      snoozedUntil: t0 + 10000
    };

    // Right after snooze
    assert.equal(isMagnifierActive(settings, t0), false);
    assert.equal(getSnoozeRemainingSeconds(settings, t0), 10);

    // 4.5 seconds elapsed
    assert.equal(isMagnifierActive(settings, t0 + 4500), false);
    assert.equal(getSnoozeRemainingSeconds(settings, t0 + 4500), 6);

    // 9.9 seconds elapsed
    assert.equal(isMagnifierActive(settings, t0 + 9900), false);
    assert.equal(getSnoozeRemainingSeconds(settings, t0 + 9900), 1);

    // 10 seconds elapsed
    assert.equal(isMagnifierActive(settings, t0 + 10000), true);
    assert.equal(getSnoozeRemainingSeconds(settings, t0 + 10000), 0);
  });
});
