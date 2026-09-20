import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(path.resolve(file), 'utf8');
const popupHtml = read('src/popup.html');
const popupJs = read('src/popup.js');
const contentJs = read('src/content.js');
const contentCss = read('src/content.css');

describe('single-purpose emoticon magnifier UI', () => {
  it('does not expose pixel sizes or extra controls in the popup', () => {
    assert.match(popupHtml, /id="toggle-enabled"/);
    assert.doesNotMatch(popupHtml, /60[×x]60|90[×x]90|120[×x]120|px/);
    assert.doesNotMatch(popupHtml, /size-selector|size-px|toggle-alt|toggle-crisp|snooze|Alt\+Z/i);
    assert.doesNotMatch(popupJs, /snooze|size|showAltBadge|crispScaling/i);
  });

  it('renders only the enlarged image in the content tooltip', () => {
    assert.doesNotMatch(contentJs, /tooltipAlt|showAltBadge|crispScaling|snoozedUntil/);
    assert.doesNotMatch(contentCss, /chzzk-mag-alt|chzzk-mag-crisp/);
  });
});
