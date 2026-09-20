import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getHighResImageUrl,
  isMagnifierActive,
  calculateTooltipPosition,
  extractEmoticonInfo,
  DEFAULT_SETTINGS,
  SIZE_PRESETS
} from '../src/utils.js';

describe('utils.js test suite', () => {
  describe('getHighResImageUrl', () => {
    it('removes ?type=f60_60 thumbnail parameter from pstatic URL', () => {
      const input = 'https://nng-phinf.pstatic.net/glive/subscription/emoji/43c05c91ae59803c7b3f267753b73b65/1/1_1788090404179.png?type=f60_60';
      const expected = 'https://nng-phinf.pstatic.net/glive/subscription/emoji/43c05c91ae59803c7b3f267753b73b65/1/1_1788090404179.png';
      assert.equal(getHighResImageUrl(input), expected);
    });

    it('removes type parameter while preserving other parameters', () => {
      const input = 'https://nng-phinf.pstatic.net/glive/subscription/emoji/test.png?type=f60_60&foo=bar';
      const result = getHighResImageUrl(input);
      assert.ok(!result.includes('type=f60_60'));
      assert.ok(result.includes('foo=bar'));
    });

    it('leaves non-pstatic URLs intact', () => {
      const input = 'https://example.com/icon.png?type=f60_60';
      assert.equal(getHighResImageUrl(input), input);
    });

    it('handles empty or invalid values safely', () => {
      assert.equal(getHighResImageUrl(''), '');
      assert.equal(getHighResImageUrl(null), '');
    });
  });

  describe('isMagnifierActive', () => {
    it('returns true when enabled is true', () => {
      assert.equal(isMagnifierActive({ enabled: true }), true);
      assert.equal(isMagnifierActive(DEFAULT_SETTINGS), true);
    });

    it('returns false when enabled is false', () => {
      assert.equal(isMagnifierActive({ enabled: false }), false);
    });

    it('ignores legacy snooze values', () => {
      assert.equal(isMagnifierActive({ enabled: true, snoozedUntil: Date.now() + 5000 }), true);
    });
  });

  describe('size settings', () => {
    it('uses 90 as the default and exposes the two supported sizes', () => {
      assert.deepEqual(DEFAULT_SETTINGS, { enabled: true, size: 90 });
      assert.deepEqual(SIZE_PRESETS, [90, 120]);
    });

    it('does not expose the removed original size', () => {
      assert.equal(SIZE_PRESETS.includes(60), false);
    });
  });

  describe('calculateTooltipPosition', () => {
    it('places tooltip above element when space is sufficient', () => {
      const anchor = { left: 100, top: 200, width: 32, height: 32, bottom: 232 };
      const tooltipW = 100;
      const tooltipH = 120;
      const pos = calculateTooltipPosition(anchor, tooltipW, tooltipH, 1000, 800, 8, 10);

      assert.equal(pos.placement, 'top');
      // left: 100 + 16 - 50 = 66
      assert.equal(pos.left, 66);
      // top: 200 - 120 - 8 = 72
      assert.equal(pos.top, 72);
    });

    it('flips to bottom when top space is insufficient', () => {
      const anchor = { left: 100, top: 40, width: 32, height: 32, bottom: 72 };
      const tooltipW = 100;
      const tooltipH = 120;
      const pos = calculateTooltipPosition(anchor, tooltipW, tooltipH, 1000, 800, 8, 10);

      assert.equal(pos.placement, 'bottom');
      // top: 72 + 8 = 80
      assert.equal(pos.top, 80);
    });

    it('clamps left position within viewport boundaries', () => {
      const anchorLeft = { left: 5, top: 200, width: 32, height: 32, bottom: 232 };
      const posLeft = calculateTooltipPosition(anchorLeft, 100, 100, 1000, 800, 8, 10);
      assert.equal(posLeft.left, 10);

      const anchorRight = { left: 980, top: 200, width: 32, height: 32, bottom: 232 };
      const posRight = calculateTooltipPosition(anchorRight, 100, 100, 1000, 800, 8, 10);
      assert.equal(posRight.left, 890); // 1000 - 100 - 10
    });
  });

  describe('extractEmoticonInfo mock DOM tests', () => {
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

    function mockElement(tag, attrs = {}, classes = [], parent = null) {
      const classStr = classes.join(' ');
      const elem = {
        nodeType: 1,
        tagName: tag.toUpperCase(),
        className: classStr,
        getAttribute(k) { return attrs[k] || null; },
        parentElement: parent,
        closest(sel) {
          let curr = elem;
          while (curr) {
            if (matchesSelector(curr, sel)) return curr;
            curr = curr.parentElement;
          }
          return null;
        },
        querySelector(sel) {
          if (sel === 'img' && elem.children) {
            return elem.children.find(c => c.tagName === 'IMG') || null;
          }
          return null;
        },
        ...attrs
      };
      return elem;
    }

    it('detects emoticon inside button with _emoticon_ class', () => {
      const btn = mockElement('button', {}, ['_emoticon_1dr17_172']);
      const img = mockElement('img', {
        src: 'https://nng-phinf.pstatic.net/glive/subscription/emoji/test.png?type=f60_60',
        alt: '{:slp1:}'
      }, [], btn);
      btn.children = [img];

      const res = extractEmoticonInfo(img);
      assert.ok(res !== null);
      assert.equal(res.alt, '{:slp1:}');
      assert.equal(res.src, 'https://nng-phinf.pstatic.net/glive/subscription/emoji/test.png?type=f60_60');
    });

    it('returns null for non-emoticon standard image', () => {
      const div = mockElement('div', {}, ['header']);
      const img = mockElement('img', { src: 'https://example.com/logo.png', alt: 'logo' }, [], div);
      const res = extractEmoticonInfo(img);
      assert.equal(res, null);
    });
  });
});
