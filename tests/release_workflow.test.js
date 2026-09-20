import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workflow = fs.readFileSync(
  path.resolve(__dirname, '..', '.github', 'workflows', 'release.yml'),
  'utf8'
);

test('release workflow publishes only version-matched extension archives', () => {
  assert.match(workflow, /tags:\s*\n\s*- ['"]?v\*\.\*\.\*['"]?/);
  assert.match(workflow, /contents:\s*write/);
  assert.match(workflow, /manifest\.json/);
  assert.match(workflow, /package\.json/);
  assert.match(workflow, /hugify-extension\.zip/);
  assert.match(workflow, /gh release create/);
  assert.match(workflow, /GITHUB_REF_NAME/);
});

test('release workflow packages only extension runtime files', () => {
  assert.match(workflow, /zip -r[\s\S]*manifest\.json[\s\S]*icons[\s\S]*src/);
  assert.doesNotMatch(workflow, /zip -r[\s\S]*tests/);
});
