# Mirror Breakout 웹 버전 개발 로그

## 프로젝트 개요
- **목표**: iOS 버전의 물리 기반 브레이크아웃 게임을 웹으로 포팅
- **물리 엔진**: Planck.js (Box2D JavaScript 포팅)
- **핵심 컨셉**: iOS와 동일한 자연스러운 물리 시뮬레이션

---

## 2025-10-03 (Session 2): 반응형 게임 화면 구현

### 주요 변경 사항

#### 1. 반응형 캔버스 시스템 구현
**목적**: 브라우저 크기에 따라 게임 화면이 자동으로 조절되도록 개선

**핵심 개념**:
- **물리 세계는 고정**: 항상 6m × 7m (비율 6:7 유지)
- **화면 크기는 가변**: 브라우저 크기에 맞춰 자동 조절
- **SCALE 동적 계산**: `SCALE = 화면높이 / 7`

**구현** (`config.js`):
```javascript
function calculateCanvasSize() {
    const maxWidth = window.innerWidth - 280;    // 설정 패널 공간 고려
    const maxHeight = window.innerHeight * 0.85; // 뷰포트 높이의 85%
    const aspectRatio = 6 / 7;                   // 물리 세계 비율 유지

    let canvasHeight = maxHeight;
    let canvasWidth = canvasHeight * aspectRatio;

    if (canvasWidth > maxWidth) {
        canvasWidth = maxWidth;
        canvasHeight = canvasWidth / aspectRatio;
    }

    return {
        width: Math.floor(canvasWidth),
        height: Math.floor(canvasHeight),
        scale: canvasHeight / 7  // 동적 SCALE
    };
}

// CONFIG는 더 이상 고정값이 아님
CONFIG.CANVAS_WIDTH = canvasSize.width;   // 동적
CONFIG.CANVAS_HEIGHT = canvasSize.height; // 동적
CONFIG.SCALE = canvasSize.scale;          // 동적
```

**장점**:
- ✅ 물리 계산은 m/s 단위로 그대로 유지
- ✅ 공의 속도는 변환 불필요 (이미 m/s)
- ✅ Utils.toPixels()가 SCALE을 사용해 자동 변환
- ✅ 모든 화면 크기에 최적화

#### 2. 리사이즈 핸들러 구현
**목적**: 브라우저 창 크기 변경 시 자동으로 게임 화면 조절

**구현** (`main.js`):
```javascript
setupResizeHandler() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // 게임 중이 아닐 때만 리사이즈
            if (this.game.state.phase === 'menu' ||
                this.game.state.phase === 'over') {
                this.handleResize();
            }
        }, 200);  // 200ms 디바운싱
    });
}

handleResize() {
    this.renderer.resize();      // CONFIG + 그라디언트 업데이트
    this.game.init();            // 새 크기로 게임 재초기화
    this.renderer.render(...);   // 재렌더링
}
```

**특징**:
- 200ms 디바운싱으로 성능 최적화
- 게임 진행 중에는 리사이즈 방지
- 메뉴/게임오버 상태에서만 동작

#### 3. 렌더러 업데이트
**목적**: 동적 캔버스 크기 및 그라디언트 재생성 지원

**구현** (`renderer.js`):
```javascript
class Renderer {
    updateCanvasSize() {
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
    }

    resize() {
        CONFIG.updateCanvasSize();  // CONFIG 업데이트
        this.updateCanvasSize();     // 캔버스 크기 조정
        this.setupGradients();       // 그라디언트 재생성
    }
}
```

#### 4. UI 개선

**공 디자인 간소화**:
- 블러/그림자/광택 효과 제거
- 깔끔한 흰색 원형으로 단순화

**토글 버튼 위치 수정**:
- 패널 외부 → 패널 내부 우측 상단
- 크기: 24×24px 작은 정사각형
- 파란색 반투명 배경

**물리 설정 기본값 조정**:
- Ball Mass: 80 → **100** (범위: 20~160)
- Ball:Brick 질량 비율: 1:10

**슬라이더 버그 수정**:
- HTML에 `min`, `max`, `step`, `value` 속성 명시
- brickRestitution, brickFriction 슬라이더 초기화 문제 해결

#### 5. 반응형 레이아웃 (CSS)

```css
.game-container {
    display: flex;
    justify-content: center;
    width: 100%;
    max-width: 100vw;
}

.settings-panel {
    width: 220px;
    min-width: 220px;
    flex-shrink: 0;  /* 패널 크기 고정 */
}

#gameCanvas {
    flex-shrink: 1;   /* 캔버스는 조절 가능 */
    max-width: 100%;
}
```

---

## 2025-10-03 (Session 1): 실시간 물리 설정 UI 추가

### 주요 변경 사항

#### 1. 물리 설정 패널 구현
**목적**: 사용자가 게임 중 실시간으로 물리 설정을 조절할 수 있도록 함

**새로 추가된 파일**:
- `js/ui-controls.js` - UIControls 클래스 (202줄)

**수정된 파일**:
- `index.html` - 설정 패널 HTML 추가
- `css/styles.css` - 레이아웃 및 슬라이더 스타일 추가
- `js/config.js` - Object.freeze() 제거 (동적 수정 허용)
- `js/main.js` - UIControls 통합

#### 2. 조절 가능한 물리 설정

**Ball (공)**:
- **Mass**: 20 ~ 160 (기본 80)
  - 높이면 → 벽돌을 더 많이 밀어냄
- **Speed**: 2.5 ~ 5.0 m/s (기본 3.5)
  - 게임 속도 조절

**Brick (벽돌)**:
- **Mass**: 500 ~ 2000 (기본 1000)
  - 낮추면 → 벽돌이 더 많이 움직임
- **Bounce (Restitution)**: 0.5 ~ 1.0 (기본 0.9)
  - 1.0 = 완전 탄성, 0.5 = 에너지 50% 손실
- **Friction**: 0 ~ 0.8 (기본 0.3)
  - 벽돌끼리 미끄러지는 정도
- **Damping**: 0.5 ~ 2.0 (기본 1.0)
  - 높이면 → 벽돌이 빠르게 멈춤

#### 3. UI 기능

**레이아웃**:
```
┌─────────────────────────────────────┐
│  [Title] [START Button]             │
├──────────┬──────────────────────────┤
│ Settings │   Game Canvas (600x700) │
│ Panel    │                          │
│ (220px)  │                          │
└──────────┴──────────────────────────┘
```

**기능**:
- ✅ **실시간 적용**: 슬라이더 조작 시 즉시 물리 엔진에 반영
- ✅ **값 표시**: 각 슬라이더 옆에 현재 값 실시간 표시
- ✅ **Reset 버튼**: 모든 설정을 기본값으로 복원
- ✅ **Toggle 버튼** (◀): 패널 접기/펼치기
- ✅ **반응형**: 모바일에서 패널이 상단에 배치

#### 4. 구현 세부사항

**UIControls 클래스** (`js/ui-controls.js`):
```javascript
class UIControls {
    constructor(config, physics)

    // 슬라이더 설정 및 이벤트 연결
    setupSlider(id, min, max, defaultValue, step, label, unit)

    // 물리 설정 실시간 적용
    applyPhysicsChange(id, value)
    updateExistingBalls()      // 기존 공의 질량 업데이트
    updateExistingBricks()     // 기존 벽돌의 물리 속성 업데이트

    // UI 컨트롤
    resetToDefaults()          // 기본값 복원
    togglePanel()              // 패널 접기/펼치기
}
```

**실시간 물리 업데이트 메커니즘**:
```javascript
// 공 질량 변경 시
const newDensity = CONFIG.BALL.MASS / ballArea;
fixture.setDensity(newDensity);
ball.body.resetMassData();  // Box2D에 질량 재계산 요청

// 벽돌 속성 변경 시
fixture.setDensity(newDensity);
fixture.setRestitution(CONFIG.BRICK.RESTITUTION);
fixture.setFriction(CONFIG.BRICK.FRICTION);
brick.body.setLinearDamping(CONFIG.BRICK.LINEAR_DAMPING);
brick.body.setAngularDamping(CONFIG.BRICK.ANGULAR_DAMPING);
brick.body.resetMassData();
```

#### 5. 물리 충돌 설정 정리

**Box2D 충돌 공식**:
- **Restitution**: `MAX(물체A, 물체B)`
- **Friction**: `SQRT(물체A × 물체B)`

**충돌 조합**:

| 충돌 | Restitution | Friction | 결과 |
|------|-------------|----------|------|
| **공 ↔ 벽** | MAX(1.0, 1.0) = 1.0 | SQRT(0 × 0) = 0 | 완전 탄성, 마찰 없음 |
| **공 ↔ 벽돌** | MAX(1.0, 0.9) = 1.0 | SQRT(0 × 0.3) = 0 | 완전 탄성, 마찰 없음 |
| **벽돌 ↔ 벽** | MAX(0.9, 1.0) = 1.0 | SQRT(0.3 × 0) = 0 | 완전 탄성, 마찰 없음 |
| **벽돌 ↔ 벽돌** | MAX(0.9, 0.9) = 0.9 | SQRT(0.3 × 0.3) = 0.3 | 90% 탄성, 마찰 있음 |

**핵심 특징**:
- 공은 항상 완전 탄성 충돌 (에너지 보존)
- 벽돌이 벽과 부딪히면 100% 반발하지만 Damping으로 점차 안정화
- 벽돌끼리는 90% 탄성 + 마찰로 안정적으로 쌓임

#### 6. CSS 스타일링

**슬라이더 디자인**:
- 파란색 그라디언트 thumb (14px 원형)
- Hover 시 1.2배 확대 애니메이션
- Glow 효과 (`box-shadow: 0 0 8px rgba(68, 170, 255, 0.6)`)

**패널 스타일**:
- 반투명 어두운 배경 (`rgba(20, 20, 40, 0.95)`)
- 부드러운 transition (0.3s ease)
- 토글 버튼이 패널 오른쪽에 돌출

---

## 2025-10-01 (Session 2): UI 개선 및 게임플레이 조정

### 주요 변경 사항

#### 1. 랜덤 발사 각도 구현
**목적**: 매 게임마다 다른 패턴으로 시작

**구현** (`config.js`, `game.js`):
```javascript
// config.js:31
BALL.LAUNCH_ANGLE_VARIATION: 30  // ±30도 랜덤 변화

// config.js:235 - Utils 헬퍼 함수
getRandomLaunchVelocity(baseVx, baseVy) {
    const speed = Math.sqrt(baseVx * baseVx + baseVy * baseVy);
    const baseAngle = Math.atan2(baseVy, baseVx);
    const variation = (Math.random() - 0.5) * 2 * (CONFIG.BALL.LAUNCH_ANGLE_VARIATION * Math.PI / 180);
    const newAngle = baseAngle + variation;
    return { vx: speed * Math.cos(newAngle), vy: speed * Math.sin(newAngle) };
}

// game.js:123 - 발사 시 적용
const ball1 = Utils.getRandomLaunchVelocity(2.1, -2.8);
this.physics.createBall(3.0, 2.8, ball1.vx, ball1.vy);
```

**결과**:
- Ball 1: -83° ~ -23° 범위 (기본 -53°)
- Ball 2: 97° ~ 157° 범위 (기본 127°)

#### 2. UI 간소화 및 플레이 공간 확대
**변경**:
- "PLAYER (You)" 라벨 제거
- "COMPUTER" 라벨 제거
- Time 표시만 우측 상단 유지

**효과**:
- 더 깔끔한 화면
- 플레이 공간 확대

#### 3. 벽돌 증가
**변경**:
```javascript
// config.js
BRICK.ROWS: 6 → 7  // 한 줄 추가
PLAYER_BRICKS_Y: 0.4 → 0.19  // 상단 여백 활용
AI_BRICKS_Y: 6.42 → 6.63      // 하단 여백 활용
```

**결과**:
- 각 진영: 60개 → **70개** 벽돌
- 총 벽돌: 120개 → **140개**
- 화면 상하단 끝까지 활용

---

## 2025-10-01 (Session 1): iOS 스타일 동적 벽돌 물리 구현

### 주요 변경 사항

#### 1. 정적 → 동적 벽돌로 전환
**문제**: 기존에는 벽돌이 `static` 타입으로 고정된 장애물이었음

**해결**:
- `physics.js:193` - 벽돌을 `dynamic` 타입으로 변경
- `fixedRotation: false` - 회전 허용
- `bullet: true` - CCD 활성화로 고속 충돌 시 겹침 방지

#### 2. 질량 시스템 재설계
**문제**: `setMassData()` 사용 시 관성(Inertia) 계산 오류로 물리 붕괴

**해결**:
- Density를 계산하여 Box2D가 자동으로 올바른 관성 계산하도록 변경
- 공: `mass = 40` (density = 40 / πr²)
- 벽돌: `mass = 1000` (density = 1000 / (w×h))
- 질량 비율 1:25 유지 (iOS와 동일한 비율, 절대값은 조정)

```javascript
// config.js
BALL.MASS: 40
BRICK.MASS: 1000

// physics.js
const ballDensity = CONFIG.BALL.MASS / ballArea;
const brickDensity = CONFIG.BRICK.MASS / brickArea;
```

#### 3. 벽돌 파괴 페이드아웃 효과
**문제**: 벽돌이 즉시 사라져서 물리적 움직임을 볼 수 없음

**해결**:
- `game.js:410-421` - 0.15초 지연 후 제거
- 파괴 중 alpha = 0.5 (반투명)
- 지연 시간 동안 물리 바디 유지하여 밀리는 모습 표현

#### 4. 회전 렌더링 구현
**문제**: 벽돌이 물리적으로는 회전하지만 화면에 표시되지 않음
- 각속도 로그 확인: `angularVelocity: 0.622, -0.240, -1.354...` ✅
- `fillRect()`는 회전을 표현 못함

**해결** (`renderer.js:99-152`):
```javascript
const angle = brick.body.getAngle();
ctx.save();
ctx.translate(x, y);
ctx.rotate(angle);  // 회전 적용!
ctx.fillRect(-w/2, -h/2, w, h);
ctx.restore();
```

#### 5. 물리 안정성 개선
**문제**: 회전하는 동적 오브젝트 120개로 인한 충돌 불안정

**해결**:
```javascript
// config.js
VELOCITY_ITERATIONS: 10  // 8 → 10
POSITION_ITERATIONS: 8   // 3 → 8
BRICK.LINEAR_DAMPING: 1.0
BRICK.ANGULAR_DAMPING: 1.0
BRICK.FRICTION: 0.3

// physics.js - Sub-stepping
const subSteps = 2;  // 60fps → 120 physics steps/sec
```

#### 6. 코드 최적화
**제거**:
- `keepBallsInBounds()` 함수 (60줄)
- 주석 처리된 최소 각도 강제 로직 (14줄)
- 모든 디버그 로그 주석 (5개)
- `CONFIG.MIN_ANGLE` 설정

**개선**:
- 하드코딩된 질량 값 → CONFIG 참조
- 설정 중앙화

---

## 현재 상태

### ✅ 구현 완료
- [x] 동적 벽돌 물리 (질량, 회전, 충돌)
- [x] iOS 스타일 질량 비율 (1:25)
- [x] 벽돌 파괴 페이드아웃 (0.15초)
- [x] 충격점 기반 회전 토크
- [x] 회전 시각화
- [x] Sub-stepping으로 안정성 확보
- [x] CCD로 터널링 방지
- [x] 코드 정리 및 최적화

### 🎮 게임 동작
- 공과 벽돌이 모두 질량을 가짐
- 공이 벽돌의 오른쪽을 치면 → 시계방향 회전
- 공이 벽돌의 왼쪽을 치면 → 반시계방향 회전
- 벽돌이 밀리면서 페이드아웃
- 자연스러운 물리 시뮬레이션

### 📊 성능
- 120개 동적 벽돌 + 회전
- Sub-stepping (2x)
- 안정적인 60fps 유지

---

## 기술적 세부사항

### Box2D/Planck.js 차이점
- **iOS SpriteKit**: 네이티브 C++ Box2D (매우 안정적)
- **웹 Planck.js**: JavaScript 포팅 (부동소수점 오차)
- **대응**: 더 높은 iteration + damping + sub-stepping

### 질량 vs Density
❌ **잘못된 방법**: `setMassData()` 직접 사용
```javascript
body.setMassData({ mass: 5000, center: Vec2(0,0), I: body.getInertia() });
// → 관성 계산 오류로 물리 붕괴
```

✅ **올바른 방법**: Density로 자동 계산
```javascript
body.createFixture({ density: mass / area });
// → Box2D가 올바른 관성 자동 계산
```

### 회전 렌더링 패턴
```javascript
// Canvas 회전 변환
ctx.save();
ctx.translate(centerX, centerY);  // 회전 중심으로 이동
ctx.rotate(angle);                // 회전
// 모든 그리기를 (0,0) 중심으로
ctx.fillRect(-w/2, -h/2, w, h);
ctx.restore();
```

---

## 다음 세션을 위한 참고사항

### 현재 Git 상태
```bash
# 백업 커밋: 8fbb263 - Static brick version
# 현재: Dynamic brick system (미커밋)
```

### 개발 이어가기
1. 이 문서 읽기 (`DEVELOPMENT_LOG.md`)
2. Git 로그 확인: `git log --oneline`
3. 변경사항 확인: `git diff 8fbb263`

### 조정 가능한 값
```javascript
// config.js
BALL.MASS: 40           // 가볍게 → 벽돌 더 많이 움직임
BRICK.MASS: 1000        // 무겁게 → 벽돌 덜 움직임
BRICK.LINEAR_DAMPING: 1.0   // 높이면 빨리 멈춤
BRICK.ANGULAR_DAMPING: 1.0  // 높이면 회전 덜함

// physics.js
const subSteps = 2;     // 높이면 더 정밀하지만 느림
```

### 알려진 제약
- JavaScript 물리 정밀도 < 네이티브 C++
- 많은 동적 오브젝트 → Sub-stepping 필수
- 회전 + 충돌 → 높은 iterations 필요

---

## 파일 구조
```
game-test01/
├── index.html
├── js/
│   ├── config.js      - 모든 게임 설정 (244줄)
│   ├── physics.js     - Planck.js 물리 엔진 (485줄)
│   ├── game.js        - 게임 로직 (621줄)
│   ├── renderer.js    - Canvas 렌더링 (524줄)
│   └── main.js        - 진입점 (195줄)
└── DEVELOPMENT_LOG.md - 이 문서
```

---

## 물리 설정값 상세 참고

### 🔵 공 (Ball) 물리 설정

#### Body 설정 (physics.js:131-137)
```javascript
type: 'dynamic'                    // 동적 바디 (중력/힘 영향 받음)
position: Vec2(x, y)               // 초기 위치
linearVelocity: Vec2(vx, vy)       // 초기 속도
bullet: true                       // CCD 활성화 (고속 충돌 감지)
fixedRotation: true                // 회전 비활성화 (공은 회전 안 함)
linearDamping: 0                   // 선형 감쇠 없음 (기본값)
angularDamping: 0                  // 각 감쇠 없음 (기본값)
```

#### Fixture 설정 (physics.js:143-148)
```javascript
shape: Circle(0.08)                // 반지름 0.08m (8px)
restitution: 1.0                   // 완전 탄성 충돌 (100% 반발)
friction: 0                        // 마찰 없음
density: 9950                      // 계산값 (40 / π×0.08²)
→ 실제 질량: 40
```

#### 속도 제한 (physics.js:447-475)
```javascript
MAX_SPEED: 7 m/s                   // 최대 속도 (700 px/s)
MIN_SPEED: 3 m/s                   // 최소 속도 (300 px/s)
BASE_SPEED: 3.5 m/s                // 기본 속도 (350 px/s)
SPEED_DECAY: 0.97                  // 감쇠 계수 (3% per step)
DECAY_THRESHOLD: 4                 // 4 m/s 이상일 때만 감쇠
```

#### CONFIG 값 (config.js:22-32)
```javascript
RADIUS: 0.08 m                     // 8px
SPEED: 3.5 m/s                     // 초기 속도
MASS: 40                           // 목표 질량
LAUNCH_ANGLE_VARIATION: 30°        // 발사 각도 랜덤 범위 (±30°)
```

---

### 🟥 벽돌 (Brick) 물리 설정

#### Body 설정 (physics.js:190-197)
```javascript
type: 'dynamic'                    // 동적 바디 (밀림/회전 가능)
position: Vec2(x, y)               // 초기 위치
fixedRotation: false               // 회전 허용 ⭐
linearDamping: 1.0                 // 선형 감쇠 (빠른 안정화)
angularDamping: 1.0                // 각 감쇠 (회전 억제)
bullet: true                       // CCD 활성화 (겹침 방지)
```

#### Fixture 설정 (physics.js:205-217)
```javascript
shape: Box(0.275, 0.09)            // 반폭×반높이 (0.55×0.18)
restitution: 0.9                   // 90% 반발 (약간 비탄성)
friction: 0.3                      // 마찰 계수 (벽돌간 안정화)
density: 10101                     // 계산값 (1000 / 0.55×0.18)
→ 실제 질량: 1000
```

#### CONFIG 값 (config.js:50-70)
```javascript
WIDTH: 0.55 m                      // 55px
HEIGHT: 0.18 m                     // 18px
MASS: 1000                         // 목표 질량
RESTITUTION: 0.9                   // 반발 계수
FRICTION: 0.3                      // 마찰 계수
LINEAR_DAMPING: 1.0                // 선형 감쇠
ANGULAR_DAMPING: 1.0               // 각 감쇠
DESTROY_DELAY: 0.15 sec            // 파괴 지연 시간
DESTROY_ALPHA: 0.5                 // 파괴 중 투명도
```

---

### 📊 비교표

| 속성 | 공 (Ball) | 벽돌 (Brick) | 비고 |
|------|-----------|-------------|------|
| **타입** | dynamic | dynamic | 둘 다 동적 |
| **질량** | 40 | 1000 | 비율 1:25 |
| **반발력** | 1.0 (100%) | 0.9 (90%) | 공은 완전탄성 |
| **마찰** | 0 | 0.3 | 벽돌만 마찰 있음 |
| **회전** | ❌ 불가 | ✅ 가능 | 핵심 차이점! |
| **CCD** | ✅ | ✅ | 둘 다 활성화 |
| **선형 감쇠** | 0 | 1.0 | 벽돌만 감쇠 |
| **각 감쇠** | 0 | 1.0 | 벽돌만 감쇠 |

---

### 🎯 핵심 차이점

**1. 회전 (Rotation)**
- **공**: `fixedRotation: true` - 회전 불가
- **벽돌**: `fixedRotation: false` - 회전 가능 ⭐

**2. 탄성 (Elasticity)**
- **공**: `restitution: 1.0` - 완전 탄성 (에너지 보존)
- **벽돌**: `restitution: 0.9` - 약간 비탄성 (충격 흡수)

**3. 감쇠 (Damping)**
- **공**: 없음 (계속 움직임)
- **벽돌**: 1.0 (빠르게 안정화)

**4. 마찰 (Friction)**
- **공**: 0 (미끄러움)
- **벽돌**: 0.3 (벽돌끼리 미끄러지지 않음)

---

### 🔬 실제 계산값

**공 Density 계산**
```
면적 = π × r² = π × 0.08² = 0.0201 m²
density = mass / area = 40 / 0.0201 ≈ 9,950
```

**벽돌 Density 계산**
```
면적 = w × h = 0.55 × 0.18 = 0.099 m²
density = mass / area = 1000 / 0.099 ≈ 10,101
```

**관성 모멘트 (Inertia)**
- **공**: `I = m × r² = 40 × 0.08² = 0.256`
- **벽돌**: `I = m × (w² + h²) / 12 = 1000 × (0.55² + 0.18²) / 12 ≈ 27.9`

---

### 💡 조정 가이드

**벽돌을 더 많이 움직이게 하려면:**
```javascript
BRICK.MASS: 1000 → 500           // 가볍게
BRICK.LINEAR_DAMPING: 1.0 → 0.5  // 감쇠 줄이기
```

**벽돌 회전을 더 크게 하려면:**
```javascript
BRICK.ANGULAR_DAMPING: 1.0 → 0.5 // 감쇠 줄이기
```

**공을 더 무겁게 하려면:**
```javascript
BALL.MASS: 40 → 60               // 벽돌 더 많이 밀림
// 주의: 비율 유지하려면 BRICK.MASS도 조정 (1:25)
```

**물리 안정성 vs 자연스러움 트레이드오프:**
```javascript
// 더 안정적 (덜 움직임)
VELOCITY_ITERATIONS: 10 → 12
POSITION_ITERATIONS: 8 → 10
BRICK.LINEAR_DAMPING: 1.0 → 2.0

// 더 자연스러움 (더 움직임, 불안정 가능)
VELOCITY_ITERATIONS: 10 → 8
POSITION_ITERATIONS: 8 → 6
BRICK.LINEAR_DAMPING: 1.0 → 0.5
```

---

## 레퍼런스

### iOS 버전 경로
`/Users/joejeon/Documents/develop/MirrorBreakout/`

### 핵심 iOS 설정 (참고용)
```swift
GameConfig.Physics {
    ballMass: 200.0
    brickMass: 5000.0
    restitution: 1.0
    brickRestitution: 0.9
}

GameConfig.Visual {
    brickDestroyDelay: 0.15
    brickDestroyAlpha: 0.5
}
```

### 웹 버전 (조정됨)
```javascript
BALL.MASS: 40
BRICK.MASS: 1000
// 비율 1:25 유지, 절대값 조정으로 더 활발한 움직임
```