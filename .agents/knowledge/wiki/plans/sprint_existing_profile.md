# SC-20260920-04: 기존 프로필 설치 지원

## 목표 및 완료 기준

- 원격 Chrome/Whale 설치는 기존 프로필을 탐색하고 복수이면 선택한다.
- 명시적 -Profile 이름(폴더명), -UserDataDir 기존 경로 지원. 없는 프로필은 생성하지 않는다.
- 확장 관리 페이지를 선택한 프로필로 열고 수동 최종 등록을 안내한다.
- DryRun은 다운로드, 프로필 변경, 브라우저 실행, 입력 대기가 없다.
- 테스트: 복수/단일/없음/손상된 Local State, 잘못된 선택, 공백 경로, 다운로드 및 실행 모킹.

## 범위

install-online.ps1, tests/online_installer.test.js, README.md, 위키 로그/인덱스.
기존 Node 개발용 런처는 별도 테스트 프로필 용도로 유지하며 문서에 구분한다.

## 검증

`npm test`, PowerShell 5.1 AST 및 모킹 실행, `git diff --check`.
