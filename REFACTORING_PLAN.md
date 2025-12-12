# Mirror Breakout - 리팩토링 계획서

## 목차
1. [프로젝트 현황](#1-프로젝트-현황)
2. [Phase 1: 유틸리티 및 상수 정리](#phase-1-유틸리티-및-상수-정리)
3. [Phase 2: 입력 시스템 통합](#phase-2-입력-시스템-통합)
4. [Phase 3: AI 시스템 분리](#phase-3-ai-시스템-분리)
5. [Phase 4: 렌더링 시스템 최적화](#phase-4-렌더링-시스템-최적화)
6. [Phase 5: 성능 최적화](#phase-5-성능-최적화)
7. [Phase 6: 아키텍처 개선](#phase-6-아키텍처-개선)
8. [우선순위 요약](#우선순위-요약)

---

## 1. 프로젝트 현황

### 1.1 파일 구조
```
js/
├── config.js          (298줄) - 설정 및 유틸리티
├── responsive-layout.js (206줄) - 반응형 레이아웃
├── physics.js         (497줄) - 물리 엔진 래퍼
├── game.js            (621줄) - 게임 로직 ⚠️ 분리 필요
├── renderer.js        (503줄) - 렌더링 ⚠️ 정리 필요
├── ui-controls.js     (221줄) - UI 컨트롤
├── main.js            (173줄) - 진입점
└── scenes/
    ├── base-scene.js      (202줄)
    ├── scene-manager.js   (329줄)
    ├── game-scene.js      (210줄)
    ├── menu-scene.js      (275줄)
    ├── gameover-scene.js  (266줄)
    └── settings-scene.js  (495줄)
```

### 1.2 잘 구현된 부분
- Scene 기반 아키텍처 (생명주기 관리)
- Fixed Timestep 물리 시뮬레이션
- 반응형 캔버스 시스템
- Planck.js 물리 엔진 래핑

### 1.3 주요 문제점
| 문제 | 위치 | 심각도 |
|------|------|--------|
| 이벤트 리스너 중복 | `game-scene.js`, `scene-manager.js` | 높음 |
| 매직 넘버 산재 | `renderer.js`, `game.js` | 중간 |
| game.js 파일 과대 | `game.js` (621줄) | 중간 |
| 코드 중복 (클램핑) | 여러 파일 | 낮음 |
| 브릭 스폰 O(n²) | `game.js:trySpawnBrick` | 낮음 |

---

## Phase 1: 유틸리티 및 상수 정리

### 1.1 `Utils.clamp()` 함수 추가

**파일:** `js/config.js`

**현재 코드 (중복 패턴):**
```javascript
// game.js:299-302
this.paddleVelocity.player = Math.max(
    -CONFIG.PADDLE.PLAYER_SPEED,
    Math.min(CONFIG.PADDLE.PLAYER_SPEED, this.paddleVelocity.player)
);

// game.js:387
this.paddleVelocity.ai = Math.max(-maxSpeed, Math.min(maxSpeed, this.paddleVelocity.ai));

// physics.js:270
const clampedX = Math.max(halfWidth, Math.min(CONFIG.WORLD_WIDTH - halfWidth, nextX));
```

**개선 코드:**
```javascript
// config.js - Utils 객체에 추가
const Utils = {
    // 기존 함수들...

    /**
     * 값을 min과 max 사이로 제한
     * @param {number} value - 제한할 값
     * @param {number} min - 최소값
     * @param {number} max - 최대값
     * @returns {number}
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * 대칭 범위로 클램핑 (-limit ~ +limit)
     * @param {number} value - 제한할 값
     * @param {number} limit - 절대값 제한
     * @returns {number}
     */
    clampSymmetric(value, limit) {
        return Math.max(-limit, Math.min(limit, value));
    }
};
```

**적용 위치:**
- `game.js:299-302` → `Utils.clampSymmetric(this.paddleVelocity.player, CONFIG.PADDLE.PLAYER_SPEED)`
- `game.js:387` → `Utils.clampSymmetric(this.paddleVelocity.ai, maxSpeed)`
- `physics.js:270` → `Utils.clamp(nextX, halfWidth, CONFIG.WORLD_WIDTH - halfWidth)`

---

### 1.2 렌더링 상수 분리

**파일:** `js/config.js`

**현재 문제:**
```javascript
// renderer.js:135-138 - 하드코딩된 그림자 값
this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
this.ctx.shadowBlur = 2;
this.ctx.shadowOffsetX = 1;
this.ctx.shadowOffsetY = 1;

// renderer.js:286-289 - 설명 없는 매직 넘버
[1, 0.7, 1.3].forEach((scale, i) => {
    this.ctx.lineWidth = 3 - i;
    this.ctx.globalAlpha = effect.opacity * (1 - i * 0.3);
});
```

**개선 코드:**
```javascript
// config.js - CONFIG 객체에 추가
const CONFIG = {
    // 기존 설정들...

    // 렌더링 설정
    RENDERING: {
        // 그림자 효과
        SHADOW: {
            BRICK: {
                color: 'rgba(0, 0, 0, 0.3)',
                blur: 2,
                offsetX: 1,
                offsetY: 1
            },
            PADDLE: {
                color: 'rgba(0, 0, 0, 0.4)',
                blur: 4,
                offsetX: 2,
                offsetY: 2
            }
        },

        // 이펙트 설정
        EFFECTS: {
            SPLIT_RING_SCALES: [1, 0.7, 1.3],  // 분열 이펙트 링 크기
            SPLIT_RING_OPACITY_DECAY: 0.3,     // 링별 투명도 감소
            SPLIT_RING_BASE_WIDTH: 3,          // 기본 선 굵기
            SPAWN_RING_WIDTH: 2                // 스폰 이펙트 링 굵기
        },

        // 조명 효과
        LIGHTING: {
            BRICK_HIGHLIGHT: 'rgba(255, 255, 255, 0.2)',
            BRICK_SHADOW: 'rgba(0, 0, 0, 0.2)',
            PADDLE_SHINE: [
                { stop: 0, color: 'rgba(255, 255, 255, 0.3)' },
                { stop: 0.5, color: 'rgba(255, 255, 255, 0.1)' },
                { stop: 1, color: 'rgba(0, 0, 0, 0.2)' }
            ]
        }
    }
};
```

---

### 1.3 밀도 계산 유틸리티

**현재 문제:**
```javascript
// physics.js:142 - 공 밀도 계산
const ballArea = Math.PI * CONFIG.BALL.RADIUS * CONFIG.BALL.RADIUS;
const ballDensity = CONFIG.BALL.MASS / ballArea;

// physics.js:203-204 - 브릭 밀도 계산
const brickArea = CONFIG.BRICK.WIDTH * CONFIG.BRICK.HEIGHT;
const brickDensity = CONFIG.BRICK.MASS / brickArea;

// ui-controls.js에서도 동일 계산 반복
```

**개선 코드:**
```javascript
// config.js - Utils에 추가
const Utils = {
    // 기존 함수들...

    /**
     * 원형 물체의 밀도 계산
     */
    calculateCircleDensity(mass, radius) {
        const area = Math.PI * radius * radius;
        return mass / area;
    },

    /**
     * 사각형 물체의 밀도 계산
     */
    calculateRectDensity(mass, width, height) {
        const area = width * height;
        return mass / area;
    },

    /**
     * 공 밀도 (CONFIG 기반)
     */
    getBallDensity() {
        return this.calculateCircleDensity(CONFIG.BALL.MASS, CONFIG.BALL.RADIUS);
    },

    /**
     * 브릭 밀도 (CONFIG 기반)
     */
    getBrickDensity() {
        return this.calculateRectDensity(
            CONFIG.BRICK.MASS,
            CONFIG.BRICK.WIDTH,
            CONFIG.BRICK.HEIGHT
        );
    }
};
```

---

## Phase 2: 입력 시스템 통합

### 2.1 문제 분석

**현재 중복된 이벤트 리스너:**
```javascript
// scene-manager.js:192-193
window.addEventListener('keydown', this.boundHandleKeyDown);
window.addEventListener('keyup', this.boundHandleKeyUp);

// game-scene.js:102-103
window.addEventListener('keydown', this._handleKeyDown);
window.addEventListener('keyup', this._handleKeyUp);
```

**문제점:**
- 같은 키 입력이 두 번 처리됨
- `game.keys`와 `GameScene.keys` 두 곳에서 상태 관리
- 정리(cleanup)가 불완전할 수 있음

### 2.2 해결 방안: InputManager 클래스

**새 파일:** `js/input-manager.js`

```javascript
/**
 * 통합 입력 관리자
 * 키보드/마우스 입력을 중앙에서 관리
 */
class InputManager {
    constructor() {
        // 키 상태
        this.keys = {};
        this.keysJustPressed = {};
        this.keysJustReleased = {};

        // 마우스 상태
        this.mouse = {
            x: 0,
            y: 0,
            buttons: {},
            isDown: false
        };

        // 이벤트 핸들러 바인딩
        this._boundHandleKeyDown = this._handleKeyDown.bind(this);
        this._boundHandleKeyUp = this._handleKeyUp.bind(this);
        this._boundHandleMouseMove = this._handleMouseMove.bind(this);
        this._boundHandleMouseDown = this._handleMouseDown.bind(this);
        this._boundHandleMouseUp = this._handleMouseUp.bind(this);

        // 구독자 목록
        this._subscribers = {
            keydown: [],
            keyup: [],
            mousedown: [],
            mouseup: [],
            mousemove: []
        };

        this._isInitialized = false;
    }

    /**
     * 입력 시스템 초기화
     * @param {HTMLCanvasElement} canvas - 마우스 이벤트 타겟
     */
    init(canvas) {
        if (this._isInitialized) return;

        this.canvas = canvas;

        // 키보드 이벤트 (window 레벨)
        window.addEventListener('keydown', this._boundHandleKeyDown);
        window.addEventListener('keyup', this._boundHandleKeyUp);

        // 마우스 이벤트 (canvas 레벨)
        canvas.addEventListener('mousemove', this._boundHandleMouseMove);
        canvas.addEventListener('mousedown', this._boundHandleMouseDown);
        window.addEventListener('mouseup', this._boundHandleMouseUp);

        this._isInitialized = true;
        console.log('[InputManager] Initialized');
    }

    /**
     * 매 프레임 끝에 호출 - 일회성 상태 초기화
     */
    update() {
        this.keysJustPressed = {};
        this.keysJustReleased = {};
    }

    // === 키보드 API ===

    isKeyDown(key) {
        return this.keys[key] === true;
    }

    isKeyJustPressed(key) {
        return this.keysJustPressed[key] === true;
    }

    isKeyJustReleased(key) {
        return this.keysJustReleased[key] === true;
    }

    // === 이벤트 구독 ===

    subscribe(eventType, callback) {
        if (this._subscribers[eventType]) {
            this._subscribers[eventType].push(callback);
        }
    }

    unsubscribe(eventType, callback) {
        if (this._subscribers[eventType]) {
            const index = this._subscribers[eventType].indexOf(callback);
            if (index > -1) {
                this._subscribers[eventType].splice(index, 1);
            }
        }
    }

    // === Private 핸들러 ===

    _handleKeyDown(event) {
        if (!this.keys[event.key]) {
            this.keysJustPressed[event.key] = true;
        }
        this.keys[event.key] = true;

        this._notify('keydown', event);
    }

    _handleKeyUp(event) {
        this.keys[event.key] = false;
        this.keysJustReleased[event.key] = true;

        this._notify('keyup', event);
    }

    _handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;

        this._notify('mousemove', { x: this.mouse.x, y: this.mouse.y, event });
    }

    _handleMouseDown(event) {
        this.mouse.isDown = true;
        this.mouse.buttons[event.button] = true;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this._notify('mousedown', { x, y, button: event.button, event });
    }

    _handleMouseUp(event) {
        this.mouse.isDown = false;
        this.mouse.buttons[event.button] = false;

        this._notify('mouseup', { button: event.button, event });
    }

    _notify(eventType, data) {
        this._subscribers[eventType].forEach(callback => callback(data));
    }

    /**
     * 정리
     */
    destroy() {
        window.removeEventListener('keydown', this._boundHandleKeyDown);
        window.removeEventListener('keyup', this._boundHandleKeyUp);
        window.removeEventListener('mouseup', this._boundHandleMouseUp);

        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this._boundHandleMouseMove);
            this.canvas.removeEventListener('mousedown', this._boundHandleMouseDown);
        }

        this.keys = {};
        this._subscribers = { keydown: [], keyup: [], mousedown: [], mouseup: [], mousemove: [] };
        this._isInitialized = false;

        console.log('[InputManager] Destroyed');
    }
}

// 싱글톤 인스턴스
const Input = new InputManager();
```

### 2.3 적용 방법

**1. SceneManager 수정:**
```javascript
// scene-manager.js
class SceneManager {
    constructor(canvas, bgCanvas = null) {
        // ... 기존 코드 ...

        // 키보드 이벤트 직접 처리 제거
        // this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        // this.boundHandleKeyUp = this.handleKeyUp.bind(this);

        // InputManager 사용
        Input.init(canvas);
        Input.subscribe('keydown', (e) => this.handleKeyDown(e));
        Input.subscribe('keyup', (e) => this.handleKeyUp(e));
    }
}
```

**2. GameScene 수정:**
```javascript
// game-scene.js
class GameScene extends BaseScene {
    setupInput() {
        // 기존 addEventListener 제거
        // InputManager를 통해 game.keys에 접근
    }

    update(deltaTime) {
        // game.keys 대신 Input.keys 사용
        if (this.game) {
            this.game.keys = Input.keys;
        }
        // ... 나머지 로직
    }
}
```

**3. GameManager 수정:**
```javascript
// game.js
class GameManager {
    updatePlayerInput() {
        let targetVelocity = 0;

        // Input 싱글톤 직접 사용
        if (Input.isKeyDown('ArrowLeft')) {
            targetVelocity = -CONFIG.PADDLE.PLAYER_SPEED;
        } else if (Input.isKeyDown('ArrowRight')) {
            targetVelocity = CONFIG.PADDLE.PLAYER_SPEED;
        }

        // ... 나머지 로직
    }
}
```

---

## Phase 3: AI 시스템 분리

### 3.1 문제 분석

**현재 game.js의 AI 관련 코드 (약 80줄):**
- `updateAI()` 메서드 (309-391)
- `updateDifficulty()` 메서드 (547-580)
- AI 상태 관리 (26-32)

**문제점:**
- GameManager가 AI 로직까지 담당하여 파일이 비대해짐
- AI 알고리즘 변경 시 game.js 전체를 수정해야 함
- 테스트하기 어려운 구조

### 3.2 AIController 클래스 설계

**새 파일:** `js/ai-controller.js`

```javascript
/**
 * AI 패들 컨트롤러
 * 공 추적, 난이도 조절, 움직임 계산을 담당
 */
class AIController {
    constructor(config) {
        this.config = config;

        // AI 상태
        this.difficulty = 1.0;
        this.color = config.COLORS.AI_BASE;
        this.targetBallId = null;
        this.lastDifficultyUpdate = 0;

        // 현재 속도 (가속도 시스템용)
        this.velocity = 0;
    }

    /**
     * AI 상태 초기화
     */
    reset() {
        this.difficulty = 1.0;
        this.color = this.config.COLORS.AI_BASE;
        this.targetBallId = null;
        this.lastDifficultyUpdate = 0;
        this.velocity = 0;
    }

    /**
     * 추적할 공 선택
     * @param {Array} balls - 모든 공 엔티티
     * @param {Object} paddlePos - AI 패들 위치 {x, y}
     * @returns {Object|null} 선택된 공 또는 null
     */
    selectTargetBall(balls, paddlePos) {
        if (balls.length === 0) return null;

        let targetBall = null;
        let minDistance = Infinity;

        balls.forEach(ball => {
            const ballPos = ball.body.getPosition();
            const ballVel = ball.body.getLinearVelocity();

            // AI가 관심을 가져야 하는 공인지 판단
            if (Utils.shouldAITrackBall(ballPos, ballVel)) {
                const distance = Math.abs(ballPos.y - paddlePos.y);

                if (distance < minDistance) {
                    minDistance = distance;
                    targetBall = ball;
                }
            }
        });

        return targetBall;
    }

    /**
     * 목표 속도 계산
     * @param {Object|null} targetBall - 추적 대상 공
     * @param {Object} paddlePos - 패들 위치
     * @returns {number} 목표 속도
     */
    calculateTargetVelocity(targetBall, paddlePos) {
        if (targetBall) {
            const ballX = targetBall.body.getPosition().x;
            const diff = ballX - paddlePos.x;

            // 난이도에 따른 최대 속도 및 반응 임계값
            const maxSpeed = this.config.PADDLE.AI_BASE_SPEED * this.difficulty;
            const reactionThreshold = 0.05 / this.difficulty;

            if (Math.abs(diff) > reactionThreshold) {
                return Math.sign(diff) * Math.min(Math.abs(diff) * 6, maxSpeed);
            }
        } else {
            // 위협적인 공이 없으면 중앙으로 이동
            const centerX = this.config.WORLD_WIDTH / 2;
            const diff = centerX - paddlePos.x;

            if (Math.abs(diff) > 0.1) {
                return Math.sign(diff) * Math.min(
                    Math.abs(diff) * 3,
                    this.config.PADDLE.AI_BASE_SPEED * 0.5
                );
            }
        }

        return 0;
    }

    /**
     * 가속도 적용 및 속도 업데이트
     * @param {number} targetVelocity - 목표 속도
     * @returns {number} 최종 속도
     */
    updateVelocity(targetVelocity) {
        if (targetVelocity !== 0) {
            const diff = targetVelocity - this.velocity;
            const accelAmount = Math.sign(diff) * this.config.PADDLE.ACCELERATION * 1.2;

            if (Math.abs(diff) < this.config.PADDLE.ACCELERATION) {
                this.velocity = targetVelocity;
            } else {
                this.velocity += accelAmount;
            }
        } else {
            // 마찰 적용
            this.velocity *= this.config.PADDLE.AI_FRICTION;

            if (Math.abs(this.velocity) < 0.1) {
                this.velocity = 0;
            }
        }

        // 최대 속도 제한
        const maxSpeed = this.config.PADDLE.AI_BASE_SPEED * this.difficulty;
        this.velocity = Utils.clampSymmetric(this.velocity, maxSpeed);

        return this.velocity;
    }

    /**
     * 난이도 업데이트
     * @param {number} playerBricks - 플레이어 타겟 브릭 수
     * @param {number} aiBricks - AI 타겟 브릭 수
     */
    updateDifficulty(playerBricks, aiBricks) {
        const now = Date.now();
        if (now - this.lastDifficultyUpdate < this.config.DIFFICULTY.UPDATE_INTERVAL) {
            return;
        }

        this.lastDifficultyUpdate = now;

        // 남은 타겟 브릭 차이 계산
        const diff = aiBricks - playerBricks;

        let targetDifficulty = 1.0;

        if (diff > 0) {
            // AI가 지고 있음 - 난이도 증가
            targetDifficulty = Math.min(
                this.config.DIFFICULTY.MAX,
                1.0 + diff * this.config.DIFFICULTY.INCREASE_RATE
            );
        } else if (diff < 0) {
            // AI가 이기고 있음 - 난이도 감소
            targetDifficulty = Math.max(
                this.config.DIFFICULTY.MIN,
                1.0 + diff * this.config.DIFFICULTY.DECREASE_RATE
            );
        }

        // 부드러운 전환 (lerp)
        this.difficulty += (targetDifficulty - this.difficulty) * this.config.DIFFICULTY.LERP_FACTOR;

        // 패들 색상 업데이트
        this.color = Utils.getAIDifficultyColor(this.difficulty);
    }

    /**
     * AI 전체 업데이트 (편의 메서드)
     * @param {Object} physics - PhysicsEngine 인스턴스
     * @param {string} paddleId - AI 패들 ID
     */
    update(physics, paddleId) {
        const balls = physics.getEntitiesOfType('ball');
        const aiPaddle = physics.getEntity(paddleId);

        if (!aiPaddle) return 0;

        const paddlePos = aiPaddle.body.getPosition();

        // 1. 타겟 공 선택
        const targetBall = this.selectTargetBall(balls, paddlePos);

        // 2. 목표 속도 계산
        const targetVelocity = this.calculateTargetVelocity(targetBall, paddlePos);

        // 3. 가속도 적용
        return this.updateVelocity(targetVelocity);
    }
}
```

### 3.3 GameManager 수정

```javascript
// game.js
class GameManager {
    constructor(physics) {
        this.physics = physics;

        // AI 컨트롤러 분리
        this.aiController = new AIController(CONFIG);

        // 기존 this.ai 객체 제거
        // this.ai = { difficulty: 1.0, ... };

        // ... 나머지 초기화
    }

    init() {
        // ... 기존 초기화 ...

        // AI 초기화
        this.aiController.reset();
    }

    updateAI() {
        // 기존 80줄 → 3줄로 축소
        const velocity = this.aiController.update(this.physics, this.paddleIds.ai);
        this.physics.movePaddle(this.paddleIds.ai, velocity);
    }

    updateDifficulty() {
        // 기존 30줄 → 5줄로 축소
        const playerBricks = this.physics.getEntitiesOfType('playerTargetBrick').length;
        const aiBricks = this.physics.getEntitiesOfType('aiTargetBrick').length;
        this.aiController.updateDifficulty(playerBricks, aiBricks);
    }

    // AI 색상 접근을 위한 getter
    get aiColor() {
        return this.aiController.color;
    }

    get aiDifficulty() {
        return this.aiController.difficulty;
    }
}
```

---

## Phase 4: 렌더링 시스템 최적화

### 4.1 문제 분석

**현재 renderer.js 구조:**
- `drawBackground()` - 배경
- `drawBricks()` - 브릭 (170줄)
- `drawPaddles()` - 패들
- `drawBalls()` - 공
- `drawEffects()` - 이펙트
- `drawUI()` - UI
- `drawOverlays()` - 오버레이

**문제점:**
- 모든 렌더링 로직이 한 파일에 집중
- 그림자/조명 설정 반복
- 컨텍스트 save/restore 패턴 중복

### 4.2 렌더링 헬퍼 메서드

```javascript
// renderer.js에 추가

/**
 * 그림자 설정 적용 후 콜백 실행
 */
withShadow(shadowConfig, callback) {
    this.ctx.save();
    this.ctx.shadowColor = shadowConfig.color;
    this.ctx.shadowBlur = shadowConfig.blur;
    this.ctx.shadowOffsetX = shadowConfig.offsetX;
    this.ctx.shadowOffsetY = shadowConfig.offsetY;

    callback(this.ctx);

    this.ctx.shadowColor = 'transparent';
    this.ctx.restore();
}

/**
 * 투명도 적용 후 콜백 실행
 */
withAlpha(alpha, callback) {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    callback(this.ctx);

    this.ctx.globalAlpha = 1;
    this.ctx.restore();
}

/**
 * 변환(이동, 회전) 적용 후 콜백 실행
 */
withTransform(x, y, angle, callback) {
    this.ctx.save();
    this.ctx.translate(x, y);
    if (angle) this.ctx.rotate(angle);

    callback(this.ctx);

    this.ctx.restore();
}
```

### 4.3 개선된 drawBricks

```javascript
// 개선 전: 70줄
// 개선 후: 40줄

drawBricks(physics) {
    const shadow = CONFIG.RENDERING.SHADOW.BRICK;
    const lighting = CONFIG.RENDERING.LIGHTING;

    const renderBrick = (brick) => {
        const pos = brick.body.getPosition();
        const angle = brick.body.getAngle();
        const x = Utils.toPixels(pos.x);
        const y = Utils.toPixels(pos.y);
        const w = Utils.toPixels(CONFIG.BRICK.WIDTH);
        const h = Utils.toPixels(CONFIG.BRICK.HEIGHT);

        this.withTransform(x, y, angle, (ctx) => {
            // 파괴 중인 브릭은 투명도 적용
            const alpha = brick.destroying ? brick.destroyAlpha : 1;

            this.withAlpha(alpha, () => {
                // 그림자와 함께 브릭 그리기
                this.withShadow(shadow, () => {
                    ctx.fillStyle = brick.color;
                    ctx.fillRect(-w/2, -h/2, w, h);
                });

                // 조명 효과
                this._drawBrickLighting(ctx, w, h, lighting);

                // 테두리
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(-w/2, -h/2, w, h);
            });
        });
    };

    physics.getEntitiesOfType('playerTargetBrick').forEach(renderBrick);
    physics.getEntitiesOfType('aiTargetBrick').forEach(renderBrick);
}

_drawBrickLighting(ctx, w, h, lighting) {
    const gradient = ctx.createLinearGradient(-w/2, -h/2, -w/2, h/2);
    gradient.addColorStop(0, lighting.BRICK_HIGHLIGHT);
    gradient.addColorStop(1, lighting.BRICK_SHADOW);
    ctx.fillStyle = gradient;
    ctx.fillRect(-w/2, -h/2, w, h);
}
```

---

## Phase 5: 성능 최적화

### 5.1 브릭 스폰 최적화

**현재 문제:**
```javascript
// game.js:516-522 - O(rows × cols × existingBricks)
for (let row = 0; row < CONFIG.BRICK.ROWS; row++) {
    for (let col = 0; col < CONFIG.BRICK.COLS; col++) {
        existingBricks.forEach(brick => {
            // 위치 비교
        });
    }
}
```

**해결책: 그리드 기반 점유 맵**

```javascript
// game.js에 추가

/**
 * 브릭 점유 그리드 생성
 * @param {Array} bricks - 기존 브릭 목록
 * @returns {Set} 점유된 (row, col) 키 셋
 */
createOccupancyGrid(bricks) {
    const occupied = new Set();

    const totalBricksWidth = CONFIG.BRICK.COLS * CONFIG.BRICK.WIDTH +
                             (CONFIG.BRICK.COLS - 1) * CONFIG.BRICK.GAP_X;
    const startX = (CONFIG.WORLD_WIDTH - totalBricksWidth) / 2;

    bricks.forEach(brick => {
        const pos = brick.body.getPosition();

        // 위치에서 row, col 역산
        const col = Math.round((pos.x - startX - CONFIG.BRICK.WIDTH/2) /
                               (CONFIG.BRICK.WIDTH + CONFIG.BRICK.GAP_X));
        const row = brick.row;  // 엔티티에 저장된 row 사용

        occupied.add(`${row},${col}`);
    });

    return occupied;
}

/**
 * 개선된 브릭 스폰
 */
trySpawnBrick(isPlayerTarget) {
    const existingBricks = this.physics.getEntitiesOfType(
        isPlayerTarget ? 'playerTargetBrick' : 'aiTargetBrick'
    );

    const maxBricks = CONFIG.BRICK.ROWS * CONFIG.BRICK.COLS;
    if (existingBricks.length >= maxBricks) return;

    // O(n) 그리드 생성
    const occupied = this.createOccupancyGrid(existingBricks);

    // 빈 위치 수집 O(rows × cols)
    const emptyPositions = [];
    const totalBricksWidth = CONFIG.BRICK.COLS * CONFIG.BRICK.WIDTH +
                             (CONFIG.BRICK.COLS - 1) * CONFIG.BRICK.GAP_X;
    const startX = (CONFIG.WORLD_WIDTH - totalBricksWidth) / 2;

    for (let row = 0; row < CONFIG.BRICK.ROWS; row++) {
        for (let col = 0; col < CONFIG.BRICK.COLS; col++) {
            if (!occupied.has(`${row},${col}`)) {
                const x = startX + col * (CONFIG.BRICK.WIDTH + CONFIG.BRICK.GAP_X) + CONFIG.BRICK.WIDTH/2;
                const y = isPlayerTarget
                    ? CONFIG.BRICK.PLAYER_BRICKS_Y + row * (CONFIG.BRICK.HEIGHT + CONFIG.BRICK.GAP_Y) + CONFIG.BRICK.HEIGHT/2
                    : CONFIG.BRICK.AI_BRICKS_Y - row * (CONFIG.BRICK.HEIGHT + CONFIG.BRICK.GAP_Y) + CONFIG.BRICK.HEIGHT/2;

                emptyPositions.push({ x, y, row, col });
            }
        }
    }

    // 무작위 위치 선택 및 스폰
    if (emptyPositions.length > 0) {
        const pos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        this.physics.createBrick(pos.x, pos.y, pos.row, pos.col, isPlayerTarget);

        this.effects.spawnEffects.push({
            x: pos.x,
            y: pos.y,
            radius: 0,
            maxRadius: 0.3,
            opacity: 1,
            color: isPlayerTarget ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.AI_BASE
        });
    }
}
```

**복잡도 개선:**
- 이전: O(rows × cols × existingBricks) ≈ O(7 × 10 × 70) = O(4,900)
- 이후: O(existingBricks + rows × cols) ≈ O(70 + 70) = O(140)

---

### 5.2 엔티티 조회 캐싱

**현재 문제:**
```javascript
// 매 프레임 여러 번 호출
this.physics.getEntitiesOfType('ball');           // update, updateAI
this.physics.getEntitiesOfType('playerTargetBrick');  // updateDifficulty, checkGameOver
this.physics.getEntitiesOfType('aiTargetBrick');      // updateDifficulty, checkGameOver
```

**해결책: 프레임 단위 캐싱**

```javascript
// physics.js에 추가

class PhysicsEngine {
    constructor() {
        // ... 기존 코드 ...

        // 프레임 캐시
        this._frameCache = {};
        this._frameCacheValid = false;
    }

    /**
     * 캐시 무효화 (매 프레임 시작 시 호출)
     */
    invalidateCache() {
        this._frameCacheValid = false;
        this._frameCache = {};
    }

    /**
     * 캐싱된 엔티티 조회
     */
    getEntitiesOfType(type) {
        // 캐시 히트
        if (this._frameCacheValid && this._frameCache[type]) {
            return this._frameCache[type];
        }

        // 캐시 미스 - 조회 후 저장
        const result = [];
        for (const entity of this.entities.values()) {
            if (entity.type === type) {
                result.push(entity);
            }
        }

        this._frameCache[type] = result;
        this._frameCacheValid = true;

        return result;
    }

    step() {
        // 물리 스텝 전에 캐시 무효화
        this.invalidateCache();

        // ... 기존 step 로직 ...
    }
}
```

---

## Phase 6: 아키텍처 개선 (선택적)

### 6.1 ES6 모듈 시스템 도입

**현재 문제:**
```html
<!-- index.html - 순서 의존적 스크립트 로딩 -->
<script src="js/config.js"></script>
<script src="js/responsive-layout.js"></script>
<script src="js/physics.js"></script>
<!-- ... 순서가 바뀌면 에러 -->
```

**해결책:**
```javascript
// js/config.js
export const CONFIG = { ... };
export const Utils = { ... };

// js/physics.js
import { CONFIG, Utils } from './config.js';
export class PhysicsEngine { ... }

// js/main.js
import { PhysicsEngine } from './physics.js';
import { GameManager } from './game.js';
// ...
```

```html
<!-- index.html -->
<script type="module" src="js/main.js"></script>
```

**장점:**
- 의존성 명확화
- 글로벌 네임스페이스 오염 방지
- 순환 의존성 감지

**주의사항:**
- 로컬 파일 시스템에서는 CORS 제한
- 개발 서버 필요 (live-server, http-server 등)

---

### 6.2 에러 처리 강화

**현재 문제:**
```javascript
// main.js:137-139
if (typeof planck === 'undefined') {
    console.error('Planck.js not loaded');
    return;  // 사용자에게 피드백 없음
}
```

**해결책:**
```javascript
// error-handler.js

class GameError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}

const ErrorCodes = {
    PHYSICS_NOT_LOADED: 'PHYSICS_NOT_LOADED',
    CANVAS_NOT_FOUND: 'CANVAS_NOT_FOUND',
    WEBGL_NOT_SUPPORTED: 'WEBGL_NOT_SUPPORTED'
};

function showErrorToUser(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'game-error';
    errorDiv.innerHTML = `
        <h2>Game Error</h2>
        <p>${error.message}</p>
        <p>Error Code: ${error.code || 'UNKNOWN'}</p>
        <button onclick="location.reload()">Reload</button>
    `;
    document.body.appendChild(errorDiv);
}

// main.js에서 사용
function initGame() {
    try {
        if (typeof planck === 'undefined') {
            throw new GameError(
                'Physics engine failed to load. Please check your internet connection.',
                ErrorCodes.PHYSICS_NOT_LOADED
            );
        }

        // ... 나머지 초기화

    } catch (error) {
        console.error('[MirrorBreakout] Initialization failed:', error);
        showErrorToUser(error);
    }
}
```

---

## 우선순위 요약

### 즉시 적용 (1-2시간)
| 작업 | 파일 | 영향도 |
|------|------|--------|
| `Utils.clamp()` 추가 | config.js | 낮음 |
| 렌더링 상수 분리 | config.js | 낮음 |
| 밀도 계산 유틸리티 | config.js | 낮음 |

### 단기 (반나절)
| 작업 | 파일 | 영향도 |
|------|------|--------|
| InputManager 구현 | 새 파일 + 수정 | 중간 |
| 이벤트 중복 제거 | scene-manager.js, game-scene.js | 중간 |

### 중기 (1일)
| 작업 | 파일 | 영향도 |
|------|------|--------|
| AIController 분리 | 새 파일 + game.js | 중간 |
| 렌더링 헬퍼 메서드 | renderer.js | 낮음 |
| 브릭 스폰 최적화 | game.js | 낮음 |

### 장기 (선택적)
| 작업 | 파일 | 영향도 |
|------|------|--------|
| ES6 모듈 전환 | 전체 | 높음 |
| 에러 처리 시스템 | 새 파일 | 중간 |
| 유닛 테스트 추가 | 새 파일들 | 중간 |

---

> 체크리스트는 [REFACTORING_CHECKLIST.md](./REFACTORING_CHECKLIST.md) 참고

---

*문서 작성일: 2025-12-11*
*Mirror Breakout v1.0*
