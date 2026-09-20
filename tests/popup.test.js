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
  it('exposes the toggle, square size choices, and an icon-only stream shortcut', () => {
    assert.match(popupHtml, /id="status-badge"[^>]*type="button"/s);
    assert.match(popupHtml, /aria-pressed="true"/);
    assert.match(popupHtml, /id="size-90"/);
    assert.match(popupHtml, /id="size-120"/);
    assert.match(popupHtml, /90\s*[×x]\s*90px/);
    assert.match(popupHtml, /120\s*[×x]\s*120px/);
    assert.match(popupHtml, /icons\/icon48\.png/);
    assert.match(popupHtml, /icons\/cha02\.png/);
    assert.match(popupHtml, /class="size-preview"/);
    assert.match(popupHtml, /icons\/suttaeng\.png/);
    assert.match(popupHtml, /class="stream-link"/);
    assert.match(popupHtml, /class="stream-image"/);
    assert.match(popupHtml, /aria-label="수땡 방송"/);
    assert.match(popupHtml, /target="_blank"/);
    assert.doesNotMatch(popupHtml, /PREVIEW|stream-label|external-icon|toggle-enabled|setting-card|switch/);
    assert.doesNotMatch(popupHtml, /toggle-alt|toggle-crisp|snooze|Alt\+Z|version/i);
    assert.doesNotMatch(popupJs, /toggleEnabled/);
    assert.match(popupJs, /statusBadge\.addEventListener\('click'/);
    assert.match(popupJs, /size/);
    assert.match(popupCss, /#f8fbff|#ffffff|--accent/);
    assert.match(popupCss, /\.size-preview/);
    assert.match(popupCss, /#size-120\s*\+\s*\.size-choice\s*\.size-preview[\s\S]*?width:\s*120px/);
    assert.match(popupCss, /\.stream-link[\s\S]*?justify-content:\s*center/);
    assert.match(popupCss, /\.stream-link[\s\S]*?width:\s*100%/);
    assert.match(popupCss, /\.stream-image/);
  });

  it('keeps the tooltip image-only while allowing a selected size', () => {
    assert.doesNotMatch(contentJs, /tooltipAlt|showAltBadge|crispScaling|snoozedUntil/);
    assert.doesNotMatch(contentCss, /chzzk-mag-alt|chzzk-mag-crisp/);
    assert.match(contentJs, /settings\.size/);
    assert.match(contentCss, /--chzzk-mag-size/);
  });
});
