# Mirror Breakout - 리팩토링 체크리스트

> 상세 내용은 [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) 참고

---

## Phase 1: 유틸리티 및 상수 정리 ✅

### Utils 함수 추가
- [x] `Utils.clamp(value, min, max)` 함수 추가
- [x] `Utils.clampSymmetric(value, limit)` 함수 추가
- [x] `Utils.calculateCircleDensity(mass, radius)` 추가
- [x] `Utils.calculateRectDensity(mass, width, height)` 추가
- [x] `Utils.getBallDensity()` 추가
- [x] `Utils.getBrickDensity()` 추가

### CONFIG 상수 추가
- [x] `CONFIG.RENDERING.SHADOW` 상수 추가
- [x] `CONFIG.RENDERING.EFFECTS` 상수 추가
- [x] `CONFIG.RENDERING.LIGHTING` 상수 추가

### 기존 코드 교체
- [x] game.js:299-302 클램핑 → `Utils.clampSymmetric()` 사용
- [x] game.js:387 클램핑 → `Utils.clampSymmetric()` 사용
- [x] physics.js:270 클램핑 → `Utils.clamp()` 사용
- [x] physics.js:141-142 밀도 계산 → `Utils.getBallDensity()` 사용
- [x] physics.js:202-203 밀도 계산 → `Utils.getBrickDensity()` 사용
- [x] renderer.js:135-138 그림자 → `CONFIG.RENDERING.SHADOW.BRICK` 사용
- [x] renderer.js:208-211 그림자 → `CONFIG.RENDERING.SHADOW.PADDLE` 사용
- [x] renderer.js:288-292 이펙트 → `CONFIG.RENDERING.EFFECTS` 사용
- [x] renderer.js:309 이펙트 → `CONFIG.RENDERING.EFFECTS.SPAWN_RING_WIDTH` 사용

---

## Phase 2: 입력 시스템 통합

### InputManager 구현
- [ ] `js/input-manager.js` 파일 생성
- [ ] InputManager 클래스 구현
  - [ ] 키보드 상태 관리 (keys, keysJustPressed, keysJustReleased)
  - [ ] 마우스 상태 관리
  - [ ] 이벤트 구독 시스템 (subscribe/unsubscribe)
  - [ ] `isKeyDown()`, `isKeyJustPressed()` 등 API
- [ ] Input 싱글톤 인스턴스 생성

### 기존 코드 수정
- [ ] SceneManager에서 InputManager 사용
- [ ] GameScene에서 중복 이벤트 리스너 제거
- [ ] GameManager에서 Input 직접 사용
- [ ] index.html에 input-manager.js 추가

### 정리
- [ ] scene-manager.js 키보드 이벤트 코드 제거
- [ ] game-scene.js 키보드 이벤트 코드 제거
- [ ] game.js의 this.keys 제거

---

## Phase 3: AI 시스템 분리

### AIController 구현
- [ ] `js/ai-controller.js` 파일 생성
- [ ] AIController 클래스 구현
  - [ ] `reset()` - 상태 초기화
  - [ ] `selectTargetBall()` - 추적 대상 선택
  - [ ] `calculateTargetVelocity()` - 목표 속도 계산
  - [ ] `updateVelocity()` - 가속도 적용
  - [ ] `updateDifficulty()` - 난이도 조절
  - [ ] `update()` - 통합 업데이트

### GameManager 수정
- [ ] AIController 인스턴스 생성
- [ ] `updateAI()` 메서드 간소화
- [ ] `updateDifficulty()` 메서드 간소화
- [ ] `aiColor`, `aiDifficulty` getter 추가
- [ ] 기존 AI 관련 코드 제거 (this.ai 객체 등)

### Renderer 수정
- [ ] AI 패들 색상 접근 방식 수정 (game.aiColor 사용)

### 정리
- [ ] index.html에 ai-controller.js 추가

---

## Phase 4: 렌더링 시스템 최적화

### 헬퍼 메서드 추가
- [ ] `withShadow(shadowConfig, callback)` 메서드
- [ ] `withAlpha(alpha, callback)` 메서드
- [ ] `withTransform(x, y, angle, callback)` 메서드

### 리팩토링
- [ ] `drawBricks()` 헬퍼 메서드 적용
- [ ] `_drawBrickLighting()` 분리
- [ ] `drawPaddles()` 헬퍼 메서드 적용
- [ ] `drawEffects()` 헬퍼 메서드 적용

### 상수 적용
- [ ] 그림자 설정 → `CONFIG.RENDERING.SHADOW` 사용
- [ ] 이펙트 설정 → `CONFIG.RENDERING.EFFECTS` 사용
- [ ] 조명 설정 → `CONFIG.RENDERING.LIGHTING` 사용

---

## Phase 5: 성능 최적화

### 브릭 스폰 최적화
- [ ] `createOccupancyGrid(bricks)` 메서드 구현
- [ ] `trySpawnBrick()` O(n²) → O(n) 개선
- [ ] 브릭 엔티티에 row, col 정보 저장

### 엔티티 조회 캐싱
- [ ] PhysicsEngine에 `_frameCache` 추가
- [ ] `invalidateCache()` 메서드 구현
- [ ] `getEntitiesOfType()` 캐싱 적용
- [ ] `step()` 시작 시 캐시 무효화

---

## Phase 6: 아키텍처 개선 (선택)

### ES6 모듈 전환
- [ ] 개발 서버 설정 (live-server 또는 http-server)
- [ ] config.js export 추가
- [ ] 각 파일에 import/export 추가
- [ ] index.html을 `<script type="module">` 로 변경
- [ ] 순환 의존성 확인 및 해결

### 에러 처리 시스템
- [ ] `js/error-handler.js` 파일 생성
- [ ] GameError 클래스 구현
- [ ] ErrorCodes 정의
- [ ] `showErrorToUser()` UI 함수 구현
- [ ] main.js에 try-catch 적용

### 사용자 피드백 UI
- [ ] 로딩 화면 추가
- [ ] 에러 표시 UI 추가
- [ ] CSS 스타일링

---

## 완료 기록

| Phase | 완료일 | 비고 |
|-------|--------|------|
| Phase 1 | 2025-12-12 | Utils 함수 및 렌더링 상수 정리 완료 |
| Phase 2 | - | |
| Phase 3 | - | |
| Phase 4 | - | |
| Phase 5 | - | |
| Phase 6 | - | 선택적 |

---

*문서 작성일: 2025-12-12*
*Mirror Breakout v1.0*
