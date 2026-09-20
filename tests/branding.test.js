import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(path.resolve(file), 'utf8');

function readPngSize(file) {
  const buffer = fs.readFileSync(path.resolve(file));
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

describe('extension branding and icon assets', () => {
  it('uses the Hugify branding in the manifest', () => {
    const manifest = JSON.parse(read('manifest.json'));

    assert.equal(manifest.name, '치지직 이모티콘 커져라! Hugify!');
    assert.equal(manifest.short_name, '커져라! Hugify!');
    assert.equal(manifest.action.default_title, '커져라! Hugify! 설정');
    assert.doesNotMatch(JSON.stringify(manifest), /확대기/);
  });

  it('provides the supplied icon at every manifest size', () => {
    for (const size of [16, 48, 128]) {
      assert.deepEqual(readPngSize(`icons/icon${size}.png`), {
        width: size,
        height: size,
      });
    }
  });
});
