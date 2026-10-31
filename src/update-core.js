/**
 * 커져라! Hugify! 버튼 업데이트 핵심 로직
 * GitHub 최신 Release 태그의 파일을 받아, 사용자가 고른 설치 폴더에 덮어씁니다.
 */

export const REPO = 'jinhoOps/chzzk-chat-icon-hugify';
export const RELEASE_API = `https://api.github.com/repos/${REPO}/releases/latest`;
const RUNTIME_DIRS = ['src/', 'icons/', 'fonts/'];
const MANIFEST = 'manifest.json';

export function parseVersion(value) {
  const match = String(value || '').trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1, 4).map(Number) : null;
}

export function isNewerVersion(latest, current) {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

export function versionOfTag(tag) {
  const parts = parseVersion(tag);
  return parts ? parts.join('.') : null;
}

function isSafePath(path) {
  return (
    typeof path === 'string' &&
    path.length > 0 &&
    !path.startsWith('/') &&
    !path.includes('\\') &&
    !path.includes(':') &&
    path.split('/').every((part) => part && part !== '.' && part !== '..')
  );
}

/** Release zip과 같은 범위(manifest.json, src, icons, fonts)의 파일만 고릅니다. */
export function selectRuntimeFiles(tree) {
  return (tree || [])
    .filter((entry) => entry?.type === 'blob' && isSafePath(entry.path))
    .map((entry) => entry.path)
    .filter((path) => path === MANIFEST || RUNTIME_DIRS.some((dir) => path.startsWith(dir)));
}

export function rawFileUrl(tag, path) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${REPO}/${encodeURIComponent(tag)}/${encodedPath}`;
}

async function fetchOk(fetchImpl, url, options) {
  const response = await fetchImpl(url, options);
  if (!response.ok) throw new Error(`다운로드 실패 (${response.status}): ${url}`);
  return response;
}

export async function fetchLatestRelease(fetchImpl) {
  const response = await fetchOk(fetchImpl, RELEASE_API, {
    headers: { Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  });
  const release = await response.json();
  const version = versionOfTag(release?.tag_name);
  if (!version || release.draft || release.prerelease) throw new Error('최신 Release 정보를 읽지 못했어요.');
  return { tag: release.tag_name, version };
}

/** 태그의 실행 파일을 모두 메모리로 받습니다. 하나라도 실패하면 아무것도 쓰지 않도록 예외를 던집니다. */
export async function fetchReleaseFiles(tag, fetchImpl, onProgress = () => {}) {
  const treeUrl = `https://api.github.com/repos/${REPO}/git/trees/${encodeURIComponent(tag)}?recursive=1`;
  const treeResponse = await fetchOk(fetchImpl, treeUrl, {
    headers: { Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  });
  const tree = await treeResponse.json();
  if (tree?.truncated) throw new Error('파일 목록이 너무 길어 받을 수 없어요.');

  const paths = selectRuntimeFiles(tree?.tree);
  if (!paths.includes(MANIFEST)) throw new Error('새 버전에 manifest.json이 없어요.');

  const files = new Map();
  for (const [index, path] of paths.entries()) {
    onProgress(index + 1, paths.length);
    const response = await fetchOk(fetchImpl, rawFileUrl(tag, path), { cache: 'no-store' });
    files.set(path, await response.arrayBuffer());
  }
  return files;
}

export function parseManifestBytes(bytes) {
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function verifyReleaseManifest(files, tag) {
  const manifest = parseManifestBytes(files.get(MANIFEST));
  if (manifest?.manifest_version !== 3) throw new Error('새 버전의 manifest.json이 올바르지 않아요.');
  if (manifest.version !== versionOfTag(tag)) {
    throw new Error(`태그(${tag})와 파일 버전(${manifest.version})이 달라요.`);
  }
  return manifest;
}

export async function readManifestFromDir(dir) {
  const handle = await dir.getFileHandle(MANIFEST);
  const file = await handle.getFile();
  return JSON.parse(await file.text());
}

/** 고른 폴더가 지금 브라우저에 로드된 Hugify 폴더인지 확인합니다. */
export function isSameExtension(diskManifest, runningManifest) {
  return Boolean(
    diskManifest &&
    runningManifest &&
    diskManifest.name === runningManifest.name &&
    diskManifest.version === runningManifest.version
  );
}

async function getParentDir(root, path) {
  const parts = path.split('/');
  let dir = root;
  for (const part of parts.slice(0, -1)) {
    dir = await dir.getDirectoryHandle(part, { create: true });
  }
  return { dir, name: parts[parts.length - 1] };
}

/** manifest.json을 마지막에 써서, 중간에 실패해도 이전 버전 manifest가 남게 합니다. */
export async function writeFiles(root, files, onProgress = () => {}) {
  const paths = [...files.keys()].sort((a, b) => (a === MANIFEST) - (b === MANIFEST));
  for (const [index, path] of paths.entries()) {
    if (!isSafePath(path)) throw new Error(`안전하지 않은 경로: ${path}`);
    onProgress(index + 1, paths.length);
    const { dir, name } = await getParentDir(root, path);
    const fileHandle = await dir.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(files.get(path));
    await writable.close();
  }
  return paths;
}
