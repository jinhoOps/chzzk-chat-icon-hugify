import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getHighResImageUrl,
  extractEmoticonInfo,
  calculateTooltipPosition,
  isMagnifierActive,
  getSnoozeRemainingSeconds,
  DEFAULT_SETTINGS
} from '../src/utils.js';

function matchesSelector(node, selector) {
  if (!node || node.nodeType !== 1) return false;
  const parts = selector.split(',').map(s => s.trim());
  return parts.some(part => matchSingle(node, part));
}

function matchSingle(node, sel) {
  let remaining = sel;
  const tagMatch = remaining.match(/^([a-zA-Z0-9]+)/);
  if (tagMatch) {
    if (node.tagName !== tagMatch[1].toUpperCase()) return false;
    remaining = remaining.slice(tagMatch[1].length);
  }
  if (!remaining) return true;

  while (remaining.length > 0) {
    if (remaining.startsWith('.')) {
      const clsMatch = remaining.match(/^\.([a-zA-Z0-9_-]+)/);
      if (!clsMatch) return false;
      const cls = clsMatch[1];
      const classes = (node.className || '').split(/\s+/);
      if (!classes.includes(cls)) return false;
      remaining = remaining.slice(clsMatch[0].length);
    } else if (remaining.startsWith('#')) {
      const idMatch = remaining.match(/^#([a-zA-Z0-9_-]+)/);
      if (!idMatch) return false;
      if (node.id !== idMatch[1]) return false;
      remaining = remaining.slice(idMatch[0].length);
    } else if (remaining.startsWith('[')) {
      const attrMatch = remaining.match(/^\[([a-zA-Z0-9_-]+)(\*?=?)["']?([^"'\]]*)["']?\]/);
      if (!attrMatch) return false;
      const [, attrName, op, expectedVal] = attrMatch;
      let actualVal = '';
      if (attrName === 'class') {
        actualVal = node.className || '';
      } else if (attrName === 'id') {
        actualVal = node.id || '';
      } else {
        actualVal = (node.getAttribute && node.getAttribute(attrName)) || node[attrName] || '';
      }
      if (op === '=') {
        if (actualVal !== expectedVal) return false;
      } else if (op === '*=') {
        if (!actualVal.includes(expectedVal)) return false;
      } else {
        if (!actualVal && actualVal !== '') return false;
      }
      remaining = remaining.slice(attrMatch[0].length);
    } else {
      break;
    }
  }
  return true;
}

describe('Chzzk user snippet test suite', () => {
  function createMockNode(tag, attrs = {}, classes = [], parent = null) {
    const classStr = classes.join(' ');
    const node = {
      nodeType: 1,
      tagName: tag.toUpperCase(),
      className: classStr,
      parentElement: parent,
      children: [],
      getAttribute(k) { return attrs[k] || null; },
      closest(sel) {
        let curr = node;
        while (curr) {
          if (matchesSelector(curr, sel)) return curr;
          curr = curr.parentElement;
        }
        return null;
      },
      querySelector(sel) {
        if (sel === 'img') {
          return node.children.find(c => c.tagName === 'IMG') || null;
        }
        return null;
      },
      ...attrs
    };
    if (parent && parent.children) {
      parent.children.push(node);
    }
    return node;
  }

  it('correctly handles the exact HTML sample provided by the user', () => {
    const popupContents = createMockNode('div', { id: 'popup_contents' }, ['_contents_jao35_54']);
    const emojiArea = createMockNode('div', { id: 'emoji_area' }, ['_area_1dr17_101'], popupContents);
    const ulList = createMockNode('ul', {}, ['_list_1dr17_152'], emojiArea);
    const liItem = createMockNode('li', { id: 'emoji_slp1' }, ['_item_1dr17_167'], ulList);
    const button = createMockNode('button', { type: 'button' }, ['_emoticon_1dr17_172'], liItem);
    const img = createMockNode('img', {
      src: 'https://nng-phinf.pstatic.net/glive/subscription/emoji/43c05c91ae59803c7b3f267753b73b65/1/1_1788090404179.png?type=f60_60',
      alt: '{:slp1:}',
      width: 32,
      height: 32,
    }, [], button);

    // Event on <img>
    const infoFromImg = extractEmoticonInfo(img);
    assert.ok(infoFromImg, 'Should extract emoticon info from img');
    assert.equal(infoFromImg.alt, '{:slp1:}');
    assert.equal(infoFromImg.src, 'https://nng-phinf.pstatic.net/glive/subscription/emoji/43c05c91ae59803c7b3f267753b73b65/1/1_1788090404179.png?type=f60_60');

    // Event on <button>
    const infoFromButton = extractEmoticonInfo(button);
    assert.ok(infoFromButton, 'Should extract emoticon info from button target');
    assert.equal(infoFromButton.alt, '{:slp1:}');
  });

  it('strictly excludes profile avatars, chat input areas, category tabs, and donation tools', () => {
    // 1. Profile image in chat input bar
    const inputArea = createMockNode('div', {}, ['_area_b8csn_49']);
    const container = createMockNode('div', {}, ['_container_19u4u_2'], inputArea);
    const settingBtn = createMockNode('button', { type: 'button' }, ['_setting_button_19u4u_31'], container);
    const profileDiv = createMockNode('div', {}, ['_profile_19u4u_39'], settingBtn);
    const profileImg = createMockNode('img', {
      src: 'https://nng-phinf.pstatic.net/MjAyNTExMDhfMTY4/image.png?type=f160_160_na',
      alt: '',
      width: 28,
      height: 28
    }, [], profileDiv);

    assert.equal(extractEmoticonInfo(profileImg), null, 'Profile image must be excluded');
    assert.equal(extractEmoticonInfo(profileDiv), null, 'Profile container must be excluded');
    assert.equal(extractEmoticonInfo(settingBtn), null, 'Setting button must be excluded');

    // 2. Chat input editable box (<pre class="_input_19u4u_59">)
    const preInput = createMockNode('pre', { contenteditable: 'true' }, ['_input_19u4u_59'], container);
    const typedImg = createMockNode('img', {
      src: 'https://nng-phinf.pstatic.net/glive/subscription/emoji/43c05c91ae59803c7b3f267753b73b65/1/1_1788090404179.png?type=f60_60'
    }, [], preInput);

    assert.equal(extractEmoticonInfo(typedImg), null, 'Images in chat input editor must be excluded');
    assert.equal(extractEmoticonInfo(preInput), null, 'Chat input box must be excluded');

    // 3. Category tab button in popup
    const popupDialog = createMockNode('div', {}, ['_container_jao35_20', '_emoticon_b8csn_75'], inputArea);
    const menuDiv = createMockNode('div', {}, ['_menu_1dr17_17'], popupDialog);
    const catBtn = createMockNode('button', { type: 'button' }, ['_category_1dr17_70'], menuDiv);
    const catImg = createMockNode('img', {
      src: 'https://nng-phinf.pstatic.net/image.png?type=f60_60'
    }, [], catBtn);

    assert.equal(extractEmoticonInfo(catImg), null, 'Category tab icons must be excluded');
    assert.equal(extractEmoticonInfo(catBtn), null, 'Category tab button must be excluded');

    // 4. Donation / Cheese tools
    const toolsDiv = createMockNode('div', {}, ['_tools_19u4u_125'], container);
    const donateDiv = createMockNode('div', {}, ['_donation_19u4u_132'], toolsDiv);
    const donateBtn = createMockNode('button', { type: 'button' }, ['_donation_button_19u4u_151'], donateDiv);
    assert.equal(extractEmoticonInfo(donateBtn), null, 'Donation button must be excluded');
  });

  it('has showAltBadge disabled by default in DEFAULT_SETTINGS', () => {
    assert.equal(DEFAULT_SETTINGS.showAltBadge, false, 'showAltBadge must be false by default');
  });

  it('verifies 10-second snooze countdown cycle', () => {
    const t0 = 1700000000000;
    const settings = {
      enabled: true,
      snoozedUntil: t0 + 10000
    };

    assert.equal(isMagnifierActive(settings, t0), false);
    assert.equal(getSnoozeRemainingSeconds(settings, t0), 10);
    assert.equal(isMagnifierActive(settings, t0 + 4500), false);
    assert.equal(getSnoozeRemainingSeconds(settings, t0 + 4500), 6);
    assert.equal(isMagnifierActive(settings, t0 + 9900), false);
    assert.equal(getSnoozeRemainingSeconds(settings, t0 + 9900), 1);
    assert.equal(isMagnifierActive(settings, t0 + 10000), true);
    assert.equal(getSnoozeRemainingSeconds(settings, t0 + 10000), 0);
  });
});
