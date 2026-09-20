import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(path.resolve(file), 'utf8');
const popupHtml = read('src/popup.html');
const popupCss = read('src/popup.css');
const popupJs = read('src/popup.js');
const contentJs = read('src/content.js');
const contentCss = read('src/content.css');

describe('Hugify popup UI', () => {
  it('exposes only the toggle, size choices, and stream shortcut', () => {
    assert.match(popupHtml, /id="toggle-enabled"/);
    assert.match(popupHtml, /id="size-90"/);
    assert.match(popupHtml, /id="size-120"/);
    assert.match(popupHtml, /90\s*[×x]\s*90/);
    assert.match(popupHtml, /120\s*[×x]\s*120/);
    assert.match(popupHtml, /icons\/icon48\.png/);
    assert.match(popupHtml, /수땡 방송 바로가기/);
    assert.match(popupHtml, /target="_blank"/);
    assert.doesNotMatch(popupHtml, /toggle-alt|toggle-crisp|snooze|Alt\+Z|version/i);
    assert.doesNotMatch(popupJs, /snooze|showAltBadge|crispScaling/i);
    assert.match(popupJs, /size/);
    assert.match(popupCss, /#f8fbff|#ffffff|--accent/);
  });

  it('keeps the tooltip image-only while allowing a selected size', () => {
    assert.doesNotMatch(contentJs, /tooltipAlt|showAltBadge|crispScaling|snoozedUntil/);
    assert.doesNotMatch(contentCss, /chzzk-mag-alt|chzzk-mag-crisp/);
    assert.match(contentJs, /settings\.size/);
    assert.match(contentCss, /--chzzk-mag-size/);
  });
});
