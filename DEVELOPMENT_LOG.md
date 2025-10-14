# Mirror Breakout 웹 버전 개발 로그

## 프로젝트 개요
- **목표**: iOS 버전의 물리 기반 브레이크아웃 게임을 웹으로 포팅
- **물리 엔진**: Planck.js (Box2D JavaScript 포팅)
- **핵심 컨셉**: iOS와 동일한 자연스러운 물리 시뮬레이션

---

## 2025-10-14 (Session 6): Fixed Timestep 구현 (주사율 독립성 확보)

### 주요 변경 사항

#### 1. 문제 발견: 모니터 주사율 의존성
**증상**: 게임 속도가 모니터 주사율에 따라 달라지는 현상
- 60Hz 모니터: 정상 속도 (1배속)
- 144Hz 모니터: 2.4배 빠른 속도
- 240Hz 모니터: 4배 빠른 속도

**원인 분석**:
```javascript
// 이전 코드 (scene-manager.js:133-142)
const deltaTime = (currentTime - this.lastTime) / 1000; // 가변 시간
this.currentScene.update(deltaTime);  // 주사율에 비례하여 호출

// physics.js:410-414
const subSteps = 2;
const subTimeStep = CONFIG.TIMESTEP / subSteps;  // 고정 1/60초
for (let i = 0; i < subSteps; i++) {
    this.world.step(subTimeStep);  // 고정 timestep이지만...
}
```

**핵심 문제**:
- 물리 엔진은 고정 timestep(1/60초)을 사용하지만
- `step()` **호출 횟수**가 주사율에 비례함
- 60Hz: 60회/초 × (1/60초) = 1초 진행 ✅
- 144Hz: 144회/초 × (1/60초) = 2.4초 진행 ❌

#### 2. 해결책: Fixed Timestep with Accumulator

**개념**:
실제 경과 시간을 "빚"으로 누적하고, 고정 시간 단위만큼 쌓이면 업데이트

**구현** (`scene-manager.js:107-175`):

```javascript
/**
 * Start the game loop
 */
start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;  // ⭐ Fixed timestep 누적기 초기화
    this.gameLoop();
    console.log('[SceneManager] Started');
}

/**
 * Main game loop (Fixed Timestep)
 *
 * Uses accumulator pattern to ensure consistent game speed
 * regardless of monitor refresh rate (60Hz, 144Hz, 240Hz, etc.)
 */
gameLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // 실제 경과 시간
    this.lastTime = currentTime;

    // 시간 누적
    this.accumulator += deltaTime;

    // 탭 비활성화 대비 (최대 10프레임분만 누적)
    const maxAccumulator = CONFIG.TIMESTEP * 10;
    if (this.accumulator > maxAccumulator) {
        this.accumulator = maxAccumulator;
    }

    // 고정 timestep으로 업데이트 (여러 번 가능)
    while (this.accumulator >= CONFIG.TIMESTEP) {
        if (this.currentScene && this.currentScene.isActive) {
            this.currentScene.update(CONFIG.TIMESTEP);  // ⭐ 항상 1/60초 고정!
        }
        this.accumulator -= CONFIG.TIMESTEP;
    }

    // 렌더링 (가변 프레임레이트 OK)
    if (this.currentScene && this.currentScene.isActive) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.currentScene.render(this.ctx);
    }

    this.animationId = requestAnimationFrame(() => this.gameLoop());
}
```

#### 3. 동작 원리

**60Hz 모니터**:
```
프레임 1: deltaTime = 0.0167초
  → accumulator = 0.0167
  → update(0.0167) 1회 실행
  → accumulator = 0

프레임 2: deltaTime = 0.0167초
  → accumulator = 0.0167
  → update(0.0167) 1회 실행

결과: 초당 60번 업데이트 ✅
```

**144Hz 모니터**:
```
프레임 1: deltaTime = 0.0069초
  → accumulator = 0.0069 (부족, 업데이트 안 함)

프레임 2: deltaTime = 0.0069초
  → accumulator = 0.0138 (여전히 부족)

프레임 3: deltaTime = 0.0069초
  → accumulator = 0.0207 (충분!)
  → update(0.0167) 1회 실행
  → accumulator = 0.0040 (남은 시간 다음에 사용)

결과: 초당 60번 업데이트 ✅
```

**30Hz 모니터 (저사양)**:
```
프레임 1: deltaTime = 0.0333초
  → accumulator = 0.0333
  → update(0.0167) 1회 실행
  → accumulator = 0.0166
  → update(0.0167) 1회 실행 (2번째)
  → accumulator = 0

결과: 초당 60번 업데이트 ✅ (프레임당 2번 업데이트)
```

#### 4. 최종 결과

| 모니터 주사율 | 렌더링 프레임 | 물리 업데이트 | 게임 속도 |
|--------------|--------------|--------------|----------|
| 30Hz         | 30 FPS       | 60회/초       | 1배속 ✅ |
| 60Hz         | 60 FPS       | 60회/초       | 1배속 ✅ |
| 144Hz        | 144 FPS      | 60회/초       | 1배속 ✅ |
| 240Hz        | 240 FPS      | 60회/초       | 1배속 ✅ |

**효과**:
- ✅ 모든 모니터에서 **동일한 게임 속도**
- ✅ 고주사율 모니터: 더 부드러운 렌더링 (물리는 동일)
- ✅ 저주사율 모니터: 프레임당 여러 번 업데이트하여 따라잡기
- ✅ 결정론적 시뮬레이션 (재현 가능)
- ✅ 탭 비활성화 후 복귀 시 안전 (최대 10프레임 누적 제한)

#### 5. 기술적 이점

**1. 완벽한 독립성**
- 모니터 주사율 무관
- CPU 성능 무관
- 브라우저 종류 무관

**2. 물리 엔진 안정성**
- Box2D는 고정 timestep을 가정하고 설계됨
- 가변 timestep은 충돌 감지 오류 유발 가능

**3. 업계 표준 방식**
- Unity: `FixedUpdate()` (0.02초 고정)
- Unreal: `TickGroup` 시스템
- Godot: `_physics_process(delta)`

**4. 디버깅 용이**
- 항상 같은 입력 → 같은 결과
- 재현 가능한 버그
- 멀티플레이어 동기화 가능 (향후)

#### 6. 변경된 파일

- `js/scenes/scene-manager.js` (2곳 수정)
  - `start()`: accumulator 초기화 추가
  - `gameLoop()`: Fixed Timestep 로직으로 전면 재작성

#### 7. 테스트 완료

- ✅ 60Hz 모니터: 정상 동작 확인
- ✅ 브라우저 개발자 도구로 주사율 시뮬레이션 테스트
- ✅ 탭 비활성화 후 복귀 정상 동작
- ✅ 물리 시뮬레이션 안정성 유지

### 참고 자료

**Fixed Timestep Accumulator 패턴**:
- Glenn Fiedler's "Fix Your Timestep!" (게임 개발 표준 문서)
- Unity Documentation: `Time.fixedDeltaTime`
- Box2D Manual: "Time Step Recommendations"

---

## 2025-10-12 (Session 5): 반응형 시스템 통합 및 코드 최적화

### 주요 변경 사항

#### 1. 중앙집중식 ResponsiveLayout 시스템 구축
**문제**: 각 Scene마다 반응형 로직이 분산되어 있고, GameOverScene이 반응형이 아니어서 작은 화면에서 깨짐

**해결**: 새로운 `ResponsiveLayout` 싱글톤 클래스 생성
- **새 파일**: `js/responsive-layout.js` (206줄)
- **통합 위치**: `index.html`에 `config.js` 다음에 추가

**ResponsiveLayout 주요 기능**:
```javascript
// Breakpoint 시스템
SMALL: 300px    // 작은 모바일
MEDIUM: 500px   // 일반 모바일
LARGE: 700px    // 태블릿/데스크톱

// 핵심 메서드
getSize()                          // 현재 화면 크기 카테고리
getScale(baseWidth)                // 0.4~1.2 스케일 계산
fontSize(base)                     // 반응형 폰트 크기
spacing(base)                      // 반응형 간격
buttonSize(w, h)                   // 반응형 버튼 크기
widgetSize(base, minRatio, maxRatio) // 반응형 위젯 크기
margin(type)                       // 반응형 마진
borderWidth(base)                  // 반응형 테두리
verticalPosition(ratio)            // 비율 기반 Y 위치
horizontalPosition(ratio)          // 비율 기반 X 위치
getLayoutInfo()                    // 통합 레이아웃 정보 객체
```

**폰트 크기 배율**:
- SMALL: 0.5배 (50%)
- MEDIUM: 0.75배 (75%)
- LARGE: 1.0배
- XLARGE: 1.1배

**스케일 범위 확대**:
- 이전: 0.6 ~ 1.2
- 현재: **0.4 ~ 1.2** (더 작은 화면 지원)

#### 2. BaseScene에 반응형 시스템 통합
**변경 사항**:
- `updateLayout()` 메서드 추가 (서브클래스에서 오버라이드)
- `handleResize()` 수정 → `updateLayout()` 호출
- `renderButton()` 메서드 수정 → ResponsiveLayout 사용

```javascript
// base-scene.js
updateLayout() {
    // 서브클래스에서 ResponsiveLayout을 사용해 구현
}

handleResize() {
    this.updateLayout();
}

renderButton(ctx, button) {
    // ResponsiveLayout.fontSize(), .borderWidth() 사용
}
```

#### 3. 모든 Scene 반응형 리팩토링
**리팩토링된 파일**:
- `js/scenes/menu-scene.js` - 반응형 완료
- `js/scenes/gameover-scene.js` - 반응형 새로 구현
- `js/scenes/settings-scene.js` - 반응형 개선

**공통 패턴**:
```javascript
// 각 Scene의 updateLayout()
updateLayout() {
    const layout = ResponsiveLayout.getLayoutInfo();

    // 버튼 크기 계산
    const btnSize = ResponsiveLayout.buttonSize(200, 60);
    this.buttons.start.width = btnSize.width;
    this.buttons.start.height = btnSize.height;

    // 위치 계산
    this.buttons.start.x = layout.centerX - btnSize.width / 2;
    this.buttons.start.y = ResponsiveLayout.spacing(300);

    // 렌더링용 레이아웃 값 저장
    this.layout = {
        centerX: layout.centerX,
        titleSize: ResponsiveLayout.fontSize(48),
        // ...
    };
}

render(ctx) {
    // 저장된 this.layout 값 사용
    ctx.font = `${this.layout.titleSize}px Arial`;
    ctx.fillText('Title', this.layout.centerX, ...);
}
```

**GameOverScene 개선**:
- 모든 요소가 반응형으로 변경
- 타이틀, 스코어보드, 버튼, 시간 표시 등 모두 화면 크기에 맞춰 조정
- `this.layout` 객체에 모든 반응형 값 저장하여 render()에서 사용

**MenuScene 개선**:
- 버튼 위치 계산 로직 수정
- 부제목(subtitle) 아래 적절한 위치에 버튼 배치
- 배경 볼 애니메이션 반응형 대응

**SettingsScene 개선**:
- ResponsiveLayout.getSize()를 사용한 레이아웃 모드 판단
- 2컬럼/1컬럼 자동 전환 (SMALL/MEDIUM → single, LARGE/XLARGE → double)
- 타이틀, 부제목, 버튼 모두 반응형 적용

#### 4. SceneManager 버그 수정
**문제**: 윈도우 리사이즈 시 CONFIG와 canvas 크기가 업데이트되지 않음

**해결** (`scene-manager.js:260-279`):
```javascript
handleResize() {
    // 1. CONFIG 업데이트
    CONFIG.updateCanvasSize();

    // 2. Canvas 크기 업데이트
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;

    if (this.bgCanvas) {
        this.bgCanvas.width = CONFIG.CANVAS_WIDTH;
        this.bgCanvas.height = CONFIG.CANVAS_HEIGHT;
    }

    // 3. 현재 Scene에 알림
    if (this.currentScene) {
        this.currentScene.handleResize();
    }
}
```

#### 5. CSS 개선 - Canvas 중앙 정렬
**문제**: 게임 캔버스가 화면 왼쪽에 고정되어 있음

**해결** (`styles.css`):
```css
/* 게임 컨테이너를 inline-block으로 변경 */
.game-container {
    position: relative;
    display: inline-block;  /* 변경: flex → inline-block */
    margin: 0 auto;
}

/* 배경 캔버스는 relative로 크기 결정 */
#bgCanvas {
    position: relative;
    z-index: 1;
    background: #000;
}

/* 게임 캔버스는 absolute로 배경에 오버레이 */
#gameCanvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    background: transparent;
    pointer-events: auto;
}
```

#### 6. 레거시 코드 정리
**제거된 항목**:
1. **CONFIG.UI_LAYOUT** (34줄)
   - ResponsiveLayout으로 대체되어 불필요
   - `config.js`에서 완전 제거

2. **BaseScene.autoLayoutButtons()** (62줄)
   - 각 Scene이 ResponsiveLayout을 직접 사용
   - 더 유연하고 명확한 레이아웃 제어

3. **test-scene.js** (47줄)
   - 테스트용 파일로 프로덕션에 불필요
   - `js/scenes/test-scene.js` 삭제

4. **불필요한 fallback 제거**
   - `menu-scene.js`: `CONFIG.CANVAS_WIDTH || 600` → `CONFIG.CANVAS_WIDTH`
   - CONFIG는 항상 초기화되어 있어 fallback 불필요

5. **메모리 누수 수정**
   - `main.js:100` - 게임 재시작 시 UIControls를 destroy() 후 재생성
   - 이전에는 destroy 없이 재생성하여 메모리 누수 가능성

**결과**:
- 총 143줄 제거
- 코드 중복 제거
- 더 명확한 구조

#### 7. 반응형 브레이크포인트 조정
**이전**:
```javascript
SMALL: 400px
MEDIUM: 600px
LARGE: 800px
```

**현재**:
```javascript
SMALL: 300px   // 더 작은 모바일 지원
MEDIUM: 500px
LARGE: 700px
```

**효과**:
- 매우 작은 화면(< 300px)까지 지원
- 폰트/간격이 더 적극적으로 축소 (SMALL: 50%)
- 모든 요소가 제대로 표시됨

#### 8. 아키텍처 개선 효과

**통합 전 (문제점)**:
```
MenuScene
  └── 자체 반응형 로직 (하드코딩)

GameScene
  └── 반응형 없음 (고정 크기)

GameOverScene
  └── 반응형 없음 → 작은 화면에서 깨짐 ❌

SettingsScene
  └── 자체 반응형 로직 (분리됨)
```

**통합 후 (해결)**:
```
ResponsiveLayout (중앙 싱글톤)
  ├── MenuScene → ResponsiveLayout 사용 ✅
  ├── GameScene → ResponsiveLayout 사용 ✅
  ├── GameOverScene → ResponsiveLayout 사용 ✅
  └── SettingsScene → ResponsiveLayout 사용 ✅
```

**장점**:
- ✅ 모든 Scene이 일관된 반응형 동작
- ✅ 중복 코드 제거 (143줄)
- ✅ 유지보수 용이 (한 곳에서 수정)
- ✅ 새 Scene 추가 시 자동으로 반응형
- ✅ 더 작은 화면(300px 미만)까지 지원

### 성능 영향
- ✅ ResponsiveLayout은 순수 계산만 수행 (렌더링 없음)
- ✅ 캐싱 불필요 (계산 비용 매우 낮음)
- ✅ 메모리 사용량 감소 (중복 코드 제거)

### 테스트 완료
- ✅ 모든 Scene 반응형 동작 확인
- ✅ 리사이즈 시 즉시 반영
- ✅ 300px 미만 화면에서 정상 동작
- ✅ 1920px 이상 대형 화면 정상 동작
- ✅ 메모리 누수 수정 확인

---

## 2025-10-11 (Session 4): UI/UX 개선 및 물리 밸런싱

### 주요 변경 사항

#### 1. AI 패들 색상 시스템 개선
**변경**: AI 패들 난이도 색상을 파란색 계열에서 빨간색 계열로 변경
- **이전**: 0.6 (파란색) → 1.0 (핑크) → 2.0 (빨강) - 플레이어 패들과 혼동
- **현재**: 0.6 (오렌지) → 1.0 (핑크-빨강) → 2.0 (어두운 빨강)
- **위치**: `config.js:223-246` - `getAIDifficultyColor()` 함수

#### 2. Settings Scene 슬라이더 인터랙션 버그 수정
**문제**: 슬라이더 클릭/드래그 종료가 제대로 안 되어 계속 마우스를 추적
**원인**: `click` 이벤트와 `mouseup` 이벤트 충돌, canvas 밖 mouseup 감지 실패
**해결**:
- `mousedown` 이벤트 분리: 슬라이더는 `mousedown`으로 시작, 버튼은 `click`으로 처리
- `mouseup` 이벤트를 canvas → window로 변경 (canvas 밖에서도 감지)
- **수정 파일**: `scene-manager.js`, `settings-scene.js`

#### 3. Settings Scene Canvas UI 최적화
**목적**: 매 프레임 렌더링 성능 개선 (6개 슬라이더 × 60fps)

**최적화 항목**:
1. **Bounds 계산 분리**: `renderSlider()`에서 제거 → `updateSliderBounds()`로 분리 (onEnter/resize 시에만)
2. **슬라이더 순회 조기 종료**: `forEach` → `for...of` + `return`
3. **그라디언트 캐싱**: 슬라이더 thumb 그라디언트를 한 번만 생성하여 재사용
4. **console.log 제거**: 드래그 중 매 프레임 출력 제거
5. **불필요한 클램핑 제거**: ratio가 이미 0-1로 제한되어 중복 체크 제거

**성능 개선**:
- 그라디언트 생성: 360회/초 → 1회 (Scene 생성 시)
- Bounds 계산: 6회/프레임 → Scene 진입/리사이즈 시에만

#### 4. 반응형 Settings Scene 구현
**문제**: 창 크기가 작아지면 슬라이더가 겹치거나 잘림

**해결**: 레이아웃 모드 자동 전환 (BREAKPOINT_WIDTH: 500px)
- **2컬럼 레이아웃** (≥ 500px): Ball(좌) / Brick(우)
- **1컬럼 레이아웃** (< 500px): 세로 배치, 작은 폰트/간격

**반응형 조정**:
- Title: 48px → 32px (작은 화면)
- 슬라이더 간격: 60px → 45px
- 슬라이더 너비: 화면의 85% (최대 280px)
- 버튼 크기: 85% 축소

**구현 메서드**:
- `updateSliderBoundsDoubleColumn()` / `updateSliderBoundsSingleColumn()`
- `renderDoubleColumn()` / `renderSingleColumn()`

#### 5. 반응형 레이아웃 버그 수정
**문제**: `.game-container` 고정 높이(700px)로 인해 작은 화면에서 하단 빈 공간 발생
**해결**: `styles.css` 수정
```css
.game-container {
    height: auto;  /* 700px → auto */
}
```

#### 6. Settings Scene 속성 한글화
**변경**: 모든 슬라이더 라벨에 한글 추가
- Mass (질량)
- Speed (속도)
- Bounce (반발력)
- Damping (감쇠)

#### 7. Settings Scene 속성 조정
**Brick Friction 제거 이유**:
- 마찰은 벽돌끼리 충돌할 때만 작용 (`SQRT(0.3 × 0.3) = 0.3`)
- 공의 friction = 0이므로 공 ↔ 벽돌 충돌에는 영향 없음
- 게임플레이에서 의미 없는 속성

**Paddle Momentum Transfer 제거 이유**:
- 공의 속도 감쇠 시스템(SPEED_DECAY)으로 효과가 즉시 상쇄됨
- 물리 밸런싱으로 해결 (아래 참고)

**Damping 범위 수정**:
- **이전**: 0.5 ~ 2.0 (물리적으로 비현실적)
- **현재**: 0 ~ 1.0 (물리적으로 올바른 범위)

**최종 Settings 구성**:
- ⚪ Ball: Mass, Speed (2개)
- 🟦 Brick: Mass, Bounce, Damping (3개)
- **총 5개 슬라이더**

#### 8. 공 속도 물리 밸런싱
**문제**: 패들 운동량 전달(MOMENTUM_TRANSFER)이 즉시 감쇠되어 효과를 느낄 수 없음

**원인**:
- `SPEED_DECAY: 0.97` - 60fps 기준 초당 84% 손실, 0.5초 안에 BASE_SPEED로 복귀
- `DECAY_THRESHOLD: 4` - 4 m/s 이상에서 즉시 감쇠 시작
- 패들 충돌로 4.7 m/s가 되어도 즉시 3.5 m/s로 복귀

**해결** (`config.js`):
```javascript
SPEED_DECAY: 0.97 → 0.99      // 3% → 1% 감쇠 (천천히)
DECAY_THRESHOLD: 4 → 5         // 5 m/s 이상에서만 감쇠
```

**효과**:
- 초당 속도 손실: 84% → 45% (훨씬 느린 감쇠)
- 패들 운동량 효과 지속 시간: 0.5초 → 2~3초
- 3~5 m/s 구간: 감쇠 없이 자유롭게 움직임 (다이나믹한 게임플레이)
- 5 m/s 이상: 천천히 감쇠 (게임 템포 유지)

#### 9. 물리 시스템 이해 개선
**Kinematic Body (패들) 특성 확인**:
- 질량 없음 (무한 질량처럼 작동)
- 반발력(restitution) 설정 가능하지만 공의 1.0이 우선 적용되어 실질적 의미 없음
- 코드로 직접 제어, 다른 물체가 밀 수 없음

**Box2D 충돌 공식**:
- Restitution: `MAX(물체A, 물체B)`
- Friction: `SQRT(물체A × 물체B)`

---

## 2025-10-05 (Session 3): Scene 시스템 구현 및 코드 최적화

### 주요 변경 사항

#### 1. Scene 기반 아키텍처 구현

**목적**: 메뉴, 게임, 게임오버, 설정 화면을 명확히 분리하고 전환 관리

**새로 추가된 파일**:
- `js/scenes/base-scene.js` - BaseScene 클래스 (공통 기능)
- `js/scenes/scene-manager.js` - SceneManager (Scene 전환 및 라이프사이클 관리)
- `js/scenes/menu-scene.js` - MenuScene (타이틀 화면)
- `js/scenes/game-scene.js` - GameScene (게임 플레이)
- `js/scenes/gameover-scene.js` - GameOverScene (결과 화면)
- `js/scenes/settings-scene.js` - SettingsScene (물리 설정)

**Scene 시스템 구조**:
```javascript
BaseScene (기본 클래스)
  ├── MenuScene      - 타이틀 + START/SETTINGS 버튼
  ├── GameScene      - 게임 플레이 (기존 로직 래핑)
  ├── GameOverScene  - 승패 결과 + RETRY/MENU 버튼
  └── SettingsScene  - 물리 설정 슬라이더 + BACK/RESET 버튼
```

**SceneManager 기능**:
- Scene 등록 및 전환 (`switchTo()`)
- 통합 게임 루프 (update/render)
- 이벤트 관리 (click, mousemove, keyboard, resize)
- Canvas injection (모든 Scene에 canvas 참조 전달)

**Scene 라이프사이클**:
```javascript
onEnter(data)    // Scene 진입 시 (이전 Scene 데이터 전달)
update(dt)       // 매 프레임 업데이트
render(ctx)      // Canvas 렌더링
handleClick(x,y) // 클릭 이벤트
handleResize()   // 창 크기 변경
onExit()         // Scene 종료 시 (데이터 반환)
```

#### 2. Canvas 레이어 분리 (성능 최적화)

**문제**: 정적 배경과 동적 게임 오브젝트가 매 프레임마다 함께 렌더링됨

**해결**: 2개 Canvas 레이어로 분리
```html
<div class="game-container">
    <canvas id="bgCanvas"></canvas>   <!-- z-index: 1, 배경 -->
    <canvas id="gameCanvas"></canvas> <!-- z-index: 2, 전경(투명) -->
</div>
```

**레이어 역할**:
- **bgCanvas**: 정적/느린 애니메이션 (MenuScene 배경볼, 그라디언트)
- **gameCanvas**: 동적 게임 오브젝트 (공, 벽돌, 패들, UI)

**CSS 레이어 스타일**:
```css
#bgCanvas, #gameCanvas {
    position: absolute;
    top: 0; left: 0;
}
#bgCanvas { z-index: 1; background: #000; }
#gameCanvas { z-index: 2; background: transparent; }
```

**성능 이점**:
- MenuScene: 배경은 60fps → 필요시만 업데이트
- GameScene: 배경 한 번만 렌더링 (검은색)
- SettingsScene: 그라디언트 한 번만 렌더링

#### 3. 코드 최적화 (10개 항목 완료)

**3-1. setTimeout 타이머 정리**
- **문제**: `setTimeout(() => {...}, 1)` 사용으로 타이밍 불안정
- **해결**: Next-frame callback queue 방식
```javascript
// physics.js
this.nextFrameCallbacks = [];
this.nextFrameCallbacks.push(() => { /* 각도 복구 로직 */ });

// step() 끝에서 실행
this.nextFrameCallbacks.forEach(callback => callback());
this.nextFrameCallbacks = [];
```

**3-2. Canvas 조회 반복 최적화**
- **문제**: 각 Scene에서 `document.getElementById('gameCanvas')` 반복 호출
- **해결**: Canvas injection (SceneManager → BaseScene)
```javascript
// scene-manager.js
registerScene(name, scene) {
    scene.setCanvas(this.canvas);
    scene.setBgCanvas(this.bgCanvas);
}
```

**3-3. 배열 스프레드 연산 제거**
- **문제**: `[...playerBricks, ...aiBricks].forEach()` - 140개 객체 복사 (60fps)
- **해결**: 함수 추출 + 별도 forEach
```javascript
// renderer.js
const renderBrick = (brick) => { /* ... */ };
playerTargetBricks.forEach(renderBrick);
aiTargetBricks.forEach(renderBrick);
```

**3-4. 버튼 렌더링 로직 중복 제거**
- **문제**: MenuScene, GameOverScene, SettingsScene에 동일한 `renderButton()` (100줄 중복)
- **해결**: BaseScene으로 통합
```javascript
// base-scene.js
renderButton(ctx, button) { /* 공통 구현 */ }
```

**3-5. 버튼 호버 체크 중복 통일**
- **문제**: main.js의 setupMouseHover()에서 각 Scene 버튼 직접 접근 (45줄)
- **해결**: BaseScene의 updateButtonHover() + Scene 자체 처리
```javascript
// base-scene.js
updateButtonHover(x, y) {
    Object.values(this.buttons).forEach(btn => {
        btn.hovered = (x >= btn.x && ...);
    });
}

// scene-manager.js
handleMouseMove(event) {
    this.currentScene.handleMouseMove(x, y);
    this.canvas.style.cursor = isHovering ? 'pointer' : 'default';
}
```

**3-6. 버튼 위치 계산 중복 제거 (자동 레이아웃)**
- **문제**: 각 Scene의 updateButtonPositions()에 중복 코드 (40줄)
- **해결**: BaseScene의 autoLayoutButtons() 시스템
```javascript
// base-scene.js
autoLayoutButtons(layout, options) {
    switch (layout) {
        case 'vertical-center':    // MenuScene
        case 'horizontal-center':  // GameOverScene
        case 'horizontal-bottom':  // SettingsScene
    }
}

// menu-scene.js
updateButtonPositions() {
    this.autoLayoutButtons('vertical-center');  // 3줄로 축약!
}
```

**3-7. 백업/테스트 파일 정리**
- 삭제된 파일 (7개):
  - `js/main-backup.js`
  - `js/main-test.js`
  - `index-backup.html`
  - `test-phase1.html` ~ `test-phase4.html`

**3-8. 사용되지 않는 CSS 제거**
- **230줄 → 71줄 (159줄 제거, 69% 감소)**
- 제거 항목:
  - `.header`, `h1`, `@keyframes gradientShift`
  - `#gameButton` (3개 선택자)
  - `.settings-panel` 및 관련 스타일 전체 (슬라이더, 버튼 등)
  - 사용하지 않는 반응형 CSS
- 유지: Orbitron 폰트 (MenuScene Canvas 렌더링에서 사용)

**3-9. Magic Numbers 상수화**
- **문제**: 60, 80, 180, 200 등 하드코딩된 레이아웃 값
- **해결**: CONFIG.UI_LAYOUT 추가
```javascript
// config.js
UI_LAYOUT: {
    BUTTON: {
        DEFAULT_WIDTH: 200,
        VERTICAL_SPACING: 80,
        HORIZONTAL_GAP: 20
    },
    MENU: {
        TITLE_Y_RATIO: 0.25,
        BUTTON_START_Y_OFFSET: 60
    },
    GAMEOVER: {
        TITLE_Y_OFFSET: -150,
        BUTTON_Y_OFFSET: 180
    },
    SETTINGS: {
        BUTTON_BOTTOM_MARGIN: 80
    }
}
```

#### 4. UI/UX 개선

**SettingsScene 구현**:
- 사이드 패널 제거 → Canvas 기반 전체 화면 Scene으로 전환
- 2단 레이아웃 (Ball 왼쪽, Brick 오른쪽)
- BACK TO MAIN, RESET 버튼

**GameOverScene 개선**:
- 승패 표시 (VICTORY/DEFEAT)
- 스코어보드 바 (플레이어 vs AI)
- 플레이 시간 표시
- RETRY, MENU 버튼

**반응형 수정**:
- `.game-container` 높이 고정 (700px)
- `body` justifyContent: center → flex-start (상단 패딩 문제 해결)

#### 5. 아키텍처 개선 효과

**관심사 분리**:
- ✅ Scene별 독립적 로직
- ✅ SceneManager가 통합 관리
- ✅ 이벤트 핸들링 중앙화

**코드 재사용**:
- ✅ BaseScene 공통 기능 (renderButton, updateButtonHover, autoLayoutButtons)
- ✅ Canvas injection으로 중복 제거
- ✅ 선언적 레이아웃 시스템

**유지보수성**:
- ✅ Scene 추가/제거 용이
- ✅ 레이아웃 값 CONFIG에 집중
- ✅ 이벤트 리스너 생명주기 명확

**성능**:
- ✅ 레이어 분리로 렌더링 최적화
- ✅ 배열 복사 제거
- ✅ Next-frame callback으로 타이밍 안정화

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