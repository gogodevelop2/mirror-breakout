# 렌더링 보간(Interpolation) 구현 계획

> **목적**: Fixed Timestep과 가변 프레임레이트 렌더링 사이의 불일치로 인한 공의 떨림/지터 현상 해결

---

## 📋 문제 분석

### 현재 상황
```
물리 시뮬레이션: 60Hz 고정 (16.67ms마다 업데이트)
렌더링:          모니터 주사율 (60Hz, 120Hz, 144Hz 등 가변)
```

### 발생 문제
- **지터(Jitter)**: 공이 불안정하게 떨리며 이동
- **떨림**: 고속 이동 시 시각적으로 거슬리는 움직임
- **원인**: 물리 업데이트와 렌더링 타이밍 불일치

### 타임라인 예시
```
물리:  [0ms] ------ [16ms] ------ [32ms] ------ [48ms]
         ↓             ↓             ↓             ↓
렌더: [0ms] [8ms] [16ms] [24ms] [32ms] [40ms] [48ms]
       ↓     ↓      ↓      ↓      ↓      ↓      ↓
보간:  0%   50%    0%    50%    0%    50%    0%

렌더링이 물리 업데이트 사이에 발생 → 위치가 갑자기 점프
```

---

## 💡 해결 방법: "Fix Your Timestep" Interpolation

### 핵심 개념
물리 업데이트 사이의 시간을 alpha(0~1) 값으로 계산하여 **이전 위치**와 **현재 위치**를 보간

### 보간 공식
```javascript
displayPosition = lerp(previousPosition, currentPosition, alpha)
alpha = accumulator / fixedDeltaTime  // 0.0 ~ 0.99
```

### 장점
- ✅ 부드러운 움직임
- ✅ 프레임레이트 독립적
- ✅ 모든 주사율에서 일관된 표현

### 단점
- ⚠️ 1프레임 지연 (약 16ms, 인지 불가능)
- ⚠️ 메모리 사용 증가 (이전 위치 저장)

---

## 🛠️ 구현 단계

### Phase 1: 물리 엔티티에 이전 위치 저장

**파일**: `js/physics.js`

#### 1.1. Ball 생성 시 이전 위치 초기화
```javascript
createBall(x, y, vx, vy) {
    // ... 기존 코드 ...

    const entity = {
        id: ballId,
        type: 'ball',
        body: ballBody,
        // 보간을 위한 위치 저장 추가
        prevPosition: { x: x, y: y },
        currentPosition: { x: x, y: y }
    };

    // ... 기존 코드 ...
}
```

#### 1.2. Paddle 생성 시 이전 위치 초기화
```javascript
createPaddle(x, y, isPlayer) {
    // ... 기존 코드 ...

    const entity = {
        id: paddleId,
        type: 'paddle',
        body: paddleBody,
        isPlayer: isPlayer,
        // 보간을 위한 위치 저장 추가
        prevPosition: { x: x, y: y },
        currentPosition: { x: x, y: y },
        prevAngle: 0,
        currentAngle: 0
    };

    // ... 기존 코드 ...
}
```

#### 1.3. Brick 생성 시 이전 위치 초기화
```javascript
createBrick(x, y, row, col, isPlayerTarget) {
    // ... 기존 코드 ...

    const entity = {
        id: brickId,
        type: brickType,
        body: brickBody,
        row: row,
        col: col,
        color: color,
        destroying: false,
        destroyAlpha: 1,
        destroyStartTime: 0,
        // 보간을 위한 위치 저장 추가
        prevPosition: { x: x, y: y },
        currentPosition: { x: x, y: y },
        prevAngle: 0,
        currentAngle: 0
    };

    // ... 기존 코드 ...
}
```

---

### Phase 2: 물리 업데이트 후 위치 저장

**파일**: `js/physics.js`

#### 2.1. step() 메서드 수정
```javascript
step() {
    // 캐시 무효화
    this.invalidateCache();

    // 모든 엔티티의 이전 위치 저장
    for (const entity of this.entities.values()) {
        if (entity.body) {
            const pos = entity.body.getPosition();
            const angle = entity.body.getAngle();

            // 현재 위치를 이전 위치로 복사
            entity.prevPosition.x = entity.currentPosition.x;
            entity.prevPosition.y = entity.currentPosition.y;
            entity.prevAngle = entity.currentAngle;

            // 새로운 현재 위치 저장
            entity.currentPosition.x = pos.x;
            entity.currentPosition.y = pos.y;
            entity.currentAngle = angle;
        }
    }

    // 물리 시뮬레이션 실행
    this.world.step(CONFIG.TIMESTEP, CONFIG.VELOCITY_ITERATIONS, CONFIG.POSITION_ITERATIONS);

    // ... 충돌 처리 등 기존 코드 ...
}
```

---

### Phase 3: 렌더링 시 보간 적용

**파일**: `js/renderer.js`

#### 3.1. render() 메서드에 alpha 파라미터 추가
```javascript
render(physics, game, alpha = 1.0) {
    // Setup rounded corners clipping
    this.setupRoundedClip();

    // Draw background
    this.drawBackground();

    // Draw game entities with interpolation
    this.drawBricks(physics, alpha);
    this.drawPaddles(physics, game, alpha);
    this.drawBalls(physics, alpha);

    // ... 나머지 동일 ...
}
```

#### 3.2. drawBalls() 보간 적용
```javascript
drawBalls(physics, alpha) {
    const balls = physics.getEntitiesOfType('ball');

    balls.forEach(ball => {
        // 보간된 위치 계산
        const x = this.lerp(ball.prevPosition.x, ball.currentPosition.x, alpha);
        const y = this.lerp(ball.prevPosition.y, ball.currentPosition.y, alpha);

        const displayX = Utils.toPixels(x);
        const displayY = Utils.toPixels(y);
        const r = Utils.toPixels(CONFIG.BALL.RADIUS);

        // Draw ball
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(displayX, displayY, r, 0, Math.PI * 2);
        this.ctx.fillStyle = CONFIG.COLORS.BALL;
        this.ctx.fill();
        this.ctx.restore();
    });
}
```

#### 3.3. drawPaddles() 보간 적용
```javascript
drawPaddles(physics, game, alpha) {
    const paddles = physics.getEntitiesOfType('paddle');

    paddles.forEach(paddle => {
        // 보간된 위치 및 각도 계산
        const x = this.lerp(paddle.prevPosition.x, paddle.currentPosition.x, alpha);
        const y = this.lerp(paddle.prevPosition.y, paddle.currentPosition.y, alpha);
        const angle = this.lerp(paddle.prevAngle, paddle.currentAngle, alpha);

        const displayX = Utils.toPixels(x);
        const displayY = Utils.toPixels(y);

        // ... 나머지 렌더링 로직 ...
    });
}
```

#### 3.4. drawBricks() 보간 적용
```javascript
drawBricks(physics, alpha) {
    const shadow = CONFIG.RENDERING.SHADOW.BRICK;
    const lighting = CONFIG.RENDERING.LIGHTING;

    const renderBrick = (brick) => {
        // 보간된 위치 및 각도 계산
        const x = this.lerp(brick.prevPosition.x, brick.currentPosition.x, alpha);
        const y = this.lerp(brick.prevPosition.y, brick.currentPosition.y, alpha);
        const angle = this.lerp(brick.prevAngle, brick.currentAngle, alpha);

        const displayX = Utils.toPixels(x);
        const displayY = Utils.toPixels(y);
        const w = Utils.toPixels(CONFIG.BRICK.WIDTH);
        const h = Utils.toPixels(CONFIG.BRICK.HEIGHT);

        // ... 나머지 렌더링 로직 ...
    };

    // ... 나머지 동일 ...
}
```

#### 3.5. lerp() 헬퍼 메서드 추가
```javascript
/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
lerp(a, b, t) {
    return a + (b - a) * t;
}
```

---

### Phase 4: 메인 루프 수정

**파일**: `js/main.js`

#### 4.1. Fixed Timestep 확인
현재 main.js의 게임 루프 구조 확인 필요

#### 4.2. alpha 값 계산 및 전달
```javascript
let accumulator = 0;
const fixedDeltaTime = 1/60;  // 16.67ms

function gameLoop(timestamp) {
    // deltaTime 계산
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // accumulator에 시간 누적
    accumulator += deltaTime;

    // Fixed timestep으로 물리 업데이트
    while (accumulator >= fixedDeltaTime) {
        physics.step();
        game.update(fixedDeltaTime);
        accumulator -= fixedDeltaTime;
    }

    // alpha 계산 (0.0 ~ 0.99)
    const alpha = accumulator / fixedDeltaTime;

    // 보간 렌더링
    renderer.render(physics, game, alpha);

    requestAnimationFrame(gameLoop);
}
```

---

## 📁 수정 파일 목록

### 필수 수정
- [ ] `js/physics.js` - 위치 저장 로직 추가
- [ ] `js/renderer.js` - 보간 렌더링 적용
- [ ] `js/main.js` - alpha 계산 및 전달

### 확인 필요
- [ ] `js/game.js` - 게임 루프 구조 확인
- [ ] `js/scenes/game-scene.js` - 씬 시스템과의 통합

---

## 🧪 테스트 방법

### 1. 시각적 확인
- [ ] 공이 부드럽게 이동하는가?
- [ ] 떨림/지터가 사라졌는가?
- [ ] 고속 이동 시에도 안정적인가?

### 2. 성능 테스트
- [ ] FPS 저하 없이 60fps 유지?
- [ ] 메모리 사용량 증가 미미?
- [ ] 다양한 모니터 주사율 (60Hz, 120Hz, 144Hz) 테스트

### 3. 엣지 케이스
- [ ] 게임 일시정지/재개 시 정상 작동?
- [ ] 브릭 파괴/생성 시 보간 정상?
- [ ] 창 크기 변경 시 문제 없음?

---

## 📚 참고 자료

### 핵심 문서
- [Fix Your Timestep! | Gaffer On Games](https://gafferongames.com/post/fix_your_timestep/)
  - 업계 표준 기법, 가장 권위 있는 설명

- [Jitterbugs - Sub-pixel precision](https://marioslab.io/posts/jitterbugs/)
  - 픽셀 단위 떨림 문제 상세 분석

- [GameDev.net - Fixed timestep with interpolation](https://www.gamedev.net/forums/topic/714764-fixed-timestep-with-interpolation-2d-movement-jitterstutter/)
  - 실제 구현 시 문제점 및 해결 사례

### Canvas 관련
- [Smooth Canvas Animation - Spicy Yoghurt](https://spicyyoghurt.com/tutorials/html5-javascript-game-development/create-a-smooth-canvas-animation)
  - Canvas 애니메이션 최적화 기법

- [Animation Performance - MDN](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate)
  - 프레임레이트 독립적 애니메이션

---

## 📝 주의사항

### 1. 각도 보간
각도 보간 시 360도 넘어가는 경우 처리:
```javascript
lerpAngle(a, b, t) {
    // 최단 경로로 회전하도록 처리
    let diff = b - a;
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
}
```

### 2. 초기화
새 엔티티 생성 시 prevPosition = currentPosition으로 초기화 필수

### 3. 성능
보간 계산은 렌더링 단계에서만 실행, 물리 시뮬레이션에 영향 없음

### 4. 호환성
기존 게임 로직 변경 없이 렌더링 레이어만 수정

---

## 🎯 예상 결과

### Before (현재)
- 공이 불안정하게 떨림
- 고속 이동 시 끊김
- 모니터 주사율에 따라 다르게 보임

### After (보간 적용)
- ✅ 부드러운 움직임
- ✅ 모든 주사율에서 일관된 표현
- ✅ 눈의 피로 감소
- ✅ 전문적인 게임 느낌

---

*문서 작성일: 2025-12-12*
*Mirror Breakout v1.0 - Rendering Interpolation Plan*
